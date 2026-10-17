// A correction to a revision card redrafts that card's revision.
//
// The morning's revision cards share their thread with each other and with
// the other sections' cards, and the thread asks each card's owner what its
// draft could not verify. So what redrafts a card has to say which card:
//   • Review's Needs changes on a card: its note, for that card — the
//     unambiguous route;
//   • a reply in the thread that names the card's path — `12+ hours ahead`,
//     or `Call-off Request › 12+ hours ahead` where two scenarios share a
//     path's name — from someone who may approve it, for that card; an older
//     reply's number (`2: …`) still names the card at that place;
//   • any other reply from someone who may approve an open card is asked
//     which path it is about, however many cards are open.
// A reply from anyone else, one that @mentions uno-bot, or a typed ✅/⛔ is
// not a correction: it takes its ordinary path, and a thread shared with
// other sections' cards stays the team's. A reply naming a card its writer
// may not approve is told who can.
//
// THE REDRAFT is the path read fresh and drafted again with the correction
// (`./draft.ts`, grind then default with the note). It takes the old card's
// place in its report under the same entry (`replaceItem`), staged as a new
// proposal with the same confirmers and the time the card had left. The old
// card is retired first, so an Approve racing the reply never writes the
// draft just pushed back on; a redraft that fails to stage puts it back.
//
// PURE: every dependency arrives by name; `./env.ts` binds them.

import { rethrowIfBudget } from "../net";
import { typedEmojiDecision } from "../gate/reactions";
import type { PendingProposal } from "../thread-state/index";
import { revisionRefusal } from "../gate/refusal";
import { NEEDS_CHANGES_LEAD } from "../slack/review-door";
import { replaceItem, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import type { ModelProvider } from "../agent/model-provider";
import { draftRevision, type PathToday } from "./draft";
import { gapAskText, revisionItem, revisionTitle } from "./card";
import { holdDeprecations, type PlannedRows } from "./stages";
import { ownersOf, stagedRevision, type RevisionThread, type RevisionThreadCard, type RevisionThreads } from "./job";

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
  /** Keep a design hand-off's redrafted rows for its deploy to promote, in
   *  place of the card and path's earlier record (`replanRows`). */
  replan(record: PlannedRows): Promise<void>;
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
  if (!thread || deps.now() > thread.expiresAt) return false;
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
    const theirs = live.filter((l) => l.card.revision.confirmers.includes(reply.user));
    let named: RevisionThreadCard | undefined;
    if (m && isWording(m[2]!)) {
      const n = Number(m[1]);
      named = thread.cards.find((c) => c.n === n);
      if (!named) return say(`There's no blueprint revision ${n} in this thread.`);
      wording = m[2]!.trim();
    } else {
      const matches = namedCards(thread.cards, bare);
      // Two paths of the same name, and the reply names neither scenario.
      if (matches.length > 1) return theirs.length ? say(whichPath(theirs.map((l) => l.card))) : false;
      named = matches[0];
      wording = bare;
    }
    if (!named) return theirs.length ? say(whichPath(theirs.map((l) => l.card))) : false;
    const card = named;
    // A name in passing from someone who decides no card here is the team's talk.
    if (!m && !theirs.length && !card.revision.confirmers.includes(reply.user)) return false;
    const label = revisionTitle(card.revision.today);
    chosen = live.find((l) => l.card.n === card.n);
    if (!chosen) return say(`*${label}* has already been decided or has closed, so there's nothing to redraft.`);
    if (!chosen.card.revision.confirmers.includes(reply.user)) return say(revisionRefusal(chosen.card.revision.confirmers, reply.user));
  }
  return redraft(deps, thread, chosen.card, chosen.pending, wording, note !== null);
}

/** Whether a text says a name as a whole: "Path 1" is not said by "Path 10". */
function says(text: string, name: string): boolean {
  const wanted = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (!wanted) return false;
  const escaped = wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(text.toLowerCase().replace(/\s+/g, " "));
}

/**
 * The thread's cards a reply names by their path: `scenario › path` where it
 * says that, else the path's own name. Several when it names a path's name two
 * scenarios share.
 */
function namedCards(cards: readonly RevisionThreadCard[], text: string): RevisionThreadCard[] {
  const full = cards.filter((c) => says(text, revisionTitle(c.revision.today)));
  if (full.length) return full;
  return cards.filter((c) => says(text, c.revision.today.path));
}

/** The thread's question back when a reply names no path. */
function whichPath(open: readonly RevisionThreadCard[]): string {
  const names = open.map((c) => `*${revisionTitle(c.revision.today)}*`);
  return `Which blueprint path is that about? Name it in your reply, or use Needs changes on its card's Review. Open: ${names.join(", ")}.`;
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

  // A path's retirement is its status alone: approved or rejected, never redrafted.
  if (r.draft.retires) {
    await unlock();
    return say(`*${label}* only sets the path's status, so there is nothing to redraft: approve it, or reject it to keep the path as it is.`);
  }

  let next: typeof r | null = null;
  let deprecate: PlannedRows["deprecate"] = [];
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
    const held = draft && r.target === "planned" ? holdDeprecations(draft) : { draft, deprecate: [] };
    if (held.draft) next = { ...r, today, draft: held.draft };
    deprecate = held.deprecate;
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[blueprint-upkeep] ${label} not redrafted: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!next) {
    await unlock();
    return say(`I couldn't redraft *${label}* with that, so it stays as it is.`);
  }

  const ttlMs = Math.max(thread.expiresAt - deps.now(), 0);
  const { revising: _lock, ...unlocked } = old;
  await deps.retire(old.proposalTs);
  const before = (await deps.reports.getReport(card.messageTs))?.entries.find((e) => e.id === card.itemId)?.item;
  const replaced = before
    ? await replaceItem(deps.reports, card.messageTs, card.itemId, {
        ...revisionItem(next.source, next.today, next.draft, { owners: ownersOf(next), confirmers: next.confirmers }, next.view),
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
        ? `That redraft of *${label}* didn't go through, so the revision before it still stands.`
        : `That redraft of *${label}* didn't go through, and the revision before it couldn't be put back, so there is none left to approve.`,
    );
  }
  // A design hand-off's rows, as its deploy will promote them: the redraft's,
  // which are what an Approve on this card writes.
  if (next.target === "planned" && next.cellId) {
    const rows = next.draft.revision.rows.map(({ stepId, laneId }) => ({ stepId, laneId }));
    await deps.replan({ pageId: next.source.pageId, cellId: next.cellId, quote: next.source.quote, rows, deprecate });
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
  const ask = gapAskText([{ label, gaps: next.draft.gaps, who: next.owner ?? next.confirmers[0] ?? null }]);
  return say([`Redrafted *${label}* with that correction, in its place.`, ...(ask ? [ask] : [])].join("\n"));
}
