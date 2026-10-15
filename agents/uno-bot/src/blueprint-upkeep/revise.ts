// A reply in a revision card's thread redrafts that card's revision.
//
// The morning's revision cards are numbered in their thread, and the thread
// asks each card's owner what its draft could not verify. So a reply there
// from someone who may approve a card is read as a correction to it:
//   • Review's Needs changes on a card: its note, for that card;
//   • a numbered reply — `2: …`, `2. …`, `#2 …` — for card 2;
//   • any other reply, for the one open card its writer may approve; with
//     several, they are asked which, by number.
// A reply from anyone else, one that @mentions uno-bot, or a typed ✅/⛔ is
// not a correction: it takes its ordinary path, and a thread shared with
// other sections' cards stays the team's. A numbered reply from someone who
// may not approve that card is told who can.
//
// THE REDRAFT is the path read fresh and drafted again with the correction
// (`./draft.ts`, grind then default with the note). It takes the old card's
// place in its report under the same number (`replaceItem`), staged as a new
// proposal with the same confirmers and the time the card had left. The old
// card is retired first, so an Approve racing the reply never writes the
// draft just pushed back on; a redraft that fails to stage puts it back.
//
// PURE: every dependency arrives by name; `./env.ts` binds them.

import { rethrowIfBudget } from "../net";
import { typedEmojiDecision } from "../gate/reactions";
import type { PendingProposal } from "../thread-state/index";
import { revisionRefusal } from "../turn/turn";
import { NEEDS_CHANGES_LEAD } from "../slack/review-door";
import { replaceItem, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import type { ModelProvider } from "../agent/model-provider";
import { draftRevision, type PathToday } from "./draft";
import { gapAskText, revisionItem, revisionTitle } from "./card";
import { holdDeprecations } from "./stages";
import { stagedRevision, type RevisionThread, type RevisionThreadCard, type RevisionThreads } from "./job";

export interface RedraftDeps {
  threads: RevisionThreads;
  /** A card as staged while it is still pending; null once decided, expired or replaced. */
  card(proposalKey: string): Promise<PendingProposal | null>;
  /** Today's path holding this cell; null when it cannot be read. */
  readPath(cellId: string): Promise<PathToday | null>;
  provider: ModelProvider;
  reports: ReportStore;
  /** Edit a report's message in place (`chat.update`). */
  edit(channel: string, ts: string, message: ReportMessage): Promise<void>;
  post(channel: string, threadTs: string, text: string): Promise<void>;
  stage(proposal: PendingProposal): Promise<void>;
  /** Put a retired card back in place; its staged row stands. */
  restore(proposal: PendingProposal): Promise<void>;
  retire(proposalTs: string): Promise<void>;
  clearRevising(proposalTs: string): Promise<void>;
  superseded(proposalTs: readonly string[]): Promise<void>;
  now(): number;
}

/** A reply, as the redraft reads it. */
export interface RevisionReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
  /** Whether it @mentions uno-bot: then it is the turn's. */
  mentionsBot: boolean;
}

const NUMBERED = /^#?(\d{1,2})[:.)]\s+(\S[\s\S]*)$/;
const HASHED = /^#(\d{1,2})\s+(\S[\s\S]*)$/;

const withoutMentions = (text: string) => text.replace(/<@[A-Z0-9]+(?:\|[^>]*)?>/g, " ").replace(/\s+/g, " ").trim();
const isWording = (text: string) => /\p{L}/u.test(text) && typedEmojiDecision(text.trim()) === null;

/**
 * A reply in a revision thread that corrects one of its cards: redraft it.
 * Answers whether it handled the reply — false leaves it to the ordinary path.
 *
 * @param deps - The thread record, the card lookup, the read, the model, the report and the staging
 * @param reply - The reply
 */
export async function redraftRevision(deps: RedraftDeps, reply: RevisionReply): Promise<boolean> {
  const note = reply.text.startsWith(NEEDS_CHANGES_LEAD) ? reply.text.slice(NEEDS_CHANGES_LEAD.length).trim() : null;
  if (note === null && (reply.mentionsBot || !isWording(withoutMentions(reply.text)))) return false;
  const thread = await deps.threads.read(reply.channel, reply.threadTs);
  if (!thread || deps.now() >= thread.expiresAt) return false;
  const say = async (text: string) => {
    await deps.post(thread.channel, thread.ts, text);
    return true;
  };

  const live: Array<{ card: RevisionThreadCard; pending: PendingProposal }> = [];
  for (const card of thread.cards) {
    const pending = await deps.card(card.proposalKey);
    if (pending) live.push({ card, pending });
  }

  let chosen: (typeof live)[number] | undefined;
  let wording: string;
  if (note !== null) {
    chosen = live.filter((l) => l.pending.revising?.userId === reply.user).sort((a, b) => (b.pending.revising?.at ?? 0) - (a.pending.revising?.at ?? 0))[0];
    if (!chosen) return false;
    wording = note;
  } else {
    const bare = withoutMentions(reply.text);
    const m = NUMBERED.exec(bare) ?? HASHED.exec(bare);
    if (m && isWording(m[2]!)) {
      const n = Number(m[1]);
      const card = thread.cards.find((c) => c.n === n);
      if (!card) return say(`There's no blueprint revision ${n} in this thread.`);
      chosen = live.find((l) => l.card.n === n);
      if (!chosen) return say(`Card ${n} has already been decided or has closed, so there's nothing to redraft.`);
      if (!chosen.card.revision.confirmers.includes(reply.user)) return say(revisionRefusal(chosen.card.revision.confirmers, reply.user));
      wording = m[2]!.trim();
    } else {
      const theirs = live.filter((l) => l.card.revision.confirmers.includes(reply.user));
      if (!theirs.length) return false;
      if (theirs.length > 1) {
        const ns = theirs.map((l) => l.card.n);
        return say(`Which card is that about? Start the reply with its number, like \`${ns[0]}: …\` — open: ${ns.join(", ")}.`);
      }
      chosen = theirs[0]!;
      wording = bare;
    }
  }
  return redraft(deps, thread, chosen.card, chosen.pending, wording, note !== null);
}

async function redraft(
  deps: RedraftDeps,
  thread: RevisionThread,
  card: RevisionThreadCard,
  old: PendingProposal,
  wording: string,
  fromReview: boolean,
): Promise<boolean> {
  const r = card.revision;
  const label = revisionTitle(r.today);
  const say = async (text: string) => {
    await deps.post(thread.channel, thread.ts, text);
    return true;
  };
  const unlock = async () => {
    if (fromReview) await deps.clearRevising(old.proposalTs).catch(() => {});
  };

  let next: typeof r | null = null;
  try {
    const today = (r.cellId ? await deps.readPath(r.cellId) : null) ?? r.today;
    const draft = await draftRevision(deps.provider, {
      title: r.source.title,
      text: r.text ?? r.source.quote,
      today,
      target: r.target ?? "live",
      correction: { text: wording, previous: r.draft.changes },
    });
    // A design hand-off's deprecations wait for its deploy, as on the first draft.
    const held = draft && r.target === "planned" ? holdDeprecations(draft).draft : draft;
    if (held) next = { ...r, today, draft: held };
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[blueprint-upkeep] ${label} not redrafted: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!next) {
    await unlock();
    return say(`I couldn't redraft ${card.n}. *${label}* with that, so its card stays as it is.`);
  }

  const ttlMs = Math.max(thread.expiresAt - deps.now(), 0);
  const { revising: _lock, ...unlocked } = old;
  await deps.retire(old.proposalTs);
  const before = (await deps.reports.getReport(card.messageTs))?.entries.find((e) => e.id === card.itemId)?.item;
  const replaced = before
    ? await replaceItem(deps.reports, card.messageTs, card.itemId, {
        ...revisionItem(next.source, next.today, next.draft, next.owner, card.n),
        ...(before.owners ? { owners: before.owners } : {}),
      })
    : null;
  let staged: PendingProposal | null = null;
  if (replaced) {
    try {
      staged = stagedRevision(thread.channel, card.messageTs, next, { threadTs: thread.ts, itemId: replaced.id, ttlMs });
      await deps.stage(staged);
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[blueprint-upkeep] redraft of ${label} not staged: ${err instanceof Error ? err.message : String(err)}`);
      staged = null;
    }
  }
  if (!replaced || !staged) {
    const restored = await deps.restore({ ...unlocked, ttlMs }).then(
      () => true,
      () => false,
    );
    if (replaced && before) await deps.reports.updateReport(card.messageTs, { id: replaced.id, replace: { id: card.itemId, item: before } }).catch(() => null);
    return say(
      restored
        ? `That redraft of ${card.n}. *${label}* didn't go through, so the card before it still stands.`
        : `That redraft of ${card.n}. *${label}* didn't go through, and the card before it couldn't be put back, so it has no live card.`,
    );
  }
  await deps.threads.write({
    ...thread,
    cards: thread.cards.map((c) => (c.n === card.n ? { ...c, proposalKey: staged!.proposalTs, itemId: replaced.id, revision: next! } : c)),
  });
  await deps.edit(thread.channel, card.messageTs, replaced.message).catch((err: unknown) => {
    rethrowIfBudget(err);
    console.warn(`[blueprint-upkeep] ${label}'s card not redrawn: ${err instanceof Error ? err.message : String(err)}`);
  });
  await deps.superseded([old.proposalTs]);
  const ask = gapAskText([{ n: card.n, label, gaps: next.draft.gaps, who: next.owner ?? next.confirmers[0] ?? null }]);
  return say([`Redrafted ${card.n}. *${label}* with that correction, on the same card.`, ...(ask ? [ask] : [])].join("\n"));
}
