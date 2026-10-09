// New wording revises a decision's draft (#900 AC 4).
//
// A comment-decision thread holds one card per decision, numbered, and people
// talk about the decisions there. So a message rewords a card only on an
// explicit cue, and every other reply — "looks good to me", "1.5px feels
// tight", a thank-you — passes through untouched:
//   • Review's Needs changes on a card: its note is the new wording for that
//     card (the revision message `slack/interactive.ts` queues, which leads
//     with `NEEDS_CHANGES_LEAD`);
//   • a numbered reply: `2: <wording>`, `2. …`, `2) …` or `#2 …`, the number
//     first and a space after its mark, so "1.5px" is no number;
//   • a reword verb: `reword 2: …`, `rephrase: …` — with no number, the one
//     open card, or "which one?" when several are.
// A message that @mentions uno-bot is never taken: it is a question for the
// turn, whatever it starts with.
//
// THE REVISION is the decision drafted again (`./detector.ts` with
// `rewording`), on the same route and against a fresh read of its page, so a
// PRD line or a card field is stamped with what the page says now. The
// revised card goes up in the thread, numbered as before, and is staged in
// the decision's own slot with its confirmers and the time its thread has
// left. As the weekly precedence card's `drop N` does, the old card is
// retired BEFORE the revised one posts, so a ✅ racing the reply cannot run
// the draft the person just pushed back on; a revision that fails to post or
// stage puts the old card back, and says so in one line. A Needs changes that
// comes to nothing lifts the card's lock, so it can be decided again.
//
// WHO MAY. Only the card's confirmers reword it; anyone else is told who can,
// in the words a turn's refusal uses. A card already decided or closed is
// told so, and nothing changes.
//
// PURE: every dependency arrives by name; `./env.ts` binds them.

import { rethrowIfBudget } from "../net";
import { typedEmojiDecision } from "../gate/reactions";
import type { PendingProposal } from "../thread-state/index";
import { revisionRefusal } from "../turn/turn";
import { renderProposalCard } from "../slack/proposal-render";
import { NEEDS_CHANGES_LEAD } from "../slack/review-door";
import type { SweepSource } from "../sweep/finding";
import type { DecisionDetector, ShownCard } from "./detector";
import { decisionCard, decisionCardBlocks, whichOne } from "./copy";
import { commentUrl, draftDecision } from "./draft";
import { stagedDecision } from "./post";
import { fieldsOf } from "./read";
import type { DecisionThread, QueuedDecision } from "./queue";

export interface ReviseDeps {
  /** The record of the thread the reply is in, or null when it is no decision thread. */
  thread: { read(): Promise<DecisionThread | null>; write(thread: DecisionThread): Promise<void> };
  /** A card as staged while it is still pending; null once decided, expired or replaced. */
  card(proposalTs: string): Promise<PendingProposal | null>;
  /** A Notion page, read fresh: the PRD or the card a decision writes to. */
  page(url: string): Promise<SweepSource | null>;
  detector: DecisionDetector;
  post(message: { text: string; blocks?: unknown[]; thread_ts: string }): Promise<{ ok: boolean; ts?: string }>;
  /** Stage a card anew: on the usage record as staged. */
  stage(proposal: PendingProposal): Promise<void>;
  /** Put a retired card back in place; its staged row stands. */
  restore(proposal: PendingProposal): Promise<void>;
  /** Retire a card so no ✅ runs it. */
  retire(proposalTs: string): Promise<void>;
  /** Lift a card's Needs changes lock, so it can be decided again. */
  clearRevising(proposalTs: string): Promise<void>;
  /** Put cards a revision took out of reach on the usage record as superseded. */
  superseded(proposalTs: readonly string[]): Promise<void>;
  now(): number;
}

/** A reply, as the revision reads it. */
export interface DecisionReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
  /** Whether it @mentions uno-bot: then it is the turn's, never a rewording. */
  mentionsBot: boolean;
}

/** `2: …`, `2. …`, `2) …`: the number first, its mark, then a space. */
const NUMBERED = /^#?(\d{1,2})[:.)]\s+(\S[\s\S]*)$/;
/** `#2 …`: the hash, the number, a space. */
const HASHED = /^#(\d{1,2})\s+(\S[\s\S]*)$/;
/** `reword 2: …`, `rephrase to …`, `reword: …`. */
const REWORD = /^(?:reword|rephrase)\b\s*(?:#?(\d{1,2})\b)?\s*(?:[:\-–—]|\bto\b|\bas\b)\s*(\S[\s\S]*)$/i;

/** A reply's text without the @-mentions Slack writes into it. */
function withoutMentions(text: string): string {
  return text.replace(/<@[A-Z0-9]+(?:\|[^>]*)?>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * The decision a reply numbers, and its new wording; null for a reply that
 * does not start with a number.
 *
 * @param text - The reply as Slack sent it
 */
export function numberedReply(text: string): { n: number; wording: string } | null {
  const bare = withoutMentions(text);
  const m = NUMBERED.exec(bare) ?? HASHED.exec(bare);
  return m && isWording(m[2]!) ? { n: Number(m[1]), wording: m[2]!.trim() } : null;
}

/** Words, not a typed ✅ or a lone mark. */
function isWording(text: string): boolean {
  return /\p{L}/u.test(text) && typedEmojiDecision(text.trim()) === null;
}

/**
 * A reply that asks for new wording on an explicit cue — a number first, or a
 * reword verb — and the decision it names, if it names one; null for anything
 * else, which the revision leaves alone.
 *
 * @param text - The reply as Slack sent it
 */
export function rewordCue(text: string): { n: number | null; wording: string } | null {
  const numbered = numberedReply(text);
  if (numbered) return numbered;
  const m = REWORD.exec(withoutMentions(text));
  return m && isWording(m[2]!) ? { n: m[1] ? Number(m[1]) : null, wording: m[2]!.trim() } : null;
}

/** The note a Review Needs changes carries, or null for any other message. */
function needsChangesNote(text: string): string | null {
  return text.startsWith(NEEDS_CHANGES_LEAD) ? text.slice(NEEDS_CHANGES_LEAD.length).trim() : null;
}

/**
 * A message in a decision thread that rewords one of its decisions: revise
 * that decision's card. Answers whether it handled the message — false (no
 * decision thread, no cue, or one for uno-bot) leaves it to the ordinary path.
 *
 * @param deps - The thread record, the card lookup, the reads, the detector, the posts and the staging
 * @param reply - The reply
 */
export async function reviseDecision(deps: ReviseDeps, reply: DecisionReply): Promise<boolean> {
  const note = needsChangesNote(reply.text);
  const cue = note === null && !reply.mentionsBot ? rewordCue(reply.text) : null;
  if (note === null && !cue) return false;

  const thread = await deps.thread.read();
  if (!thread || thread.channel !== reply.channel || thread.ts !== reply.threadTs) return false;
  const say = async (text: string) => {
    await deps.post({ text, thread_ts: thread.ts });
    return true;
  };
  const live = async (cardTs: string) => (deps.now() < thread.expiresAt ? deps.card(cardTs) : null);

  let entry: DecisionThread["decisions"][number] | undefined;
  let wording: string;
  if (note !== null) {
    // The card this person sent back with Needs changes: the newest mark.
    let marked: { entry: DecisionThread["decisions"][number]; at: number } | null = null;
    for (const d of thread.decisions) {
      const card = await live(d.cardTs);
      if (card?.revising?.userId === reply.user && (!marked || (card.revising.at ?? 0) >= marked.at)) {
        marked = { entry: d, at: card.revising.at ?? 0 };
      }
    }
    if (!marked) return false;
    entry = marked.entry;
    wording = note;
  } else {
    if (cue!.n !== null) {
      entry = thread.decisions.find((d) => d.n === cue!.n);
      if (!entry) return say(`There's no decision ${cue!.n} in this thread.`);
    } else {
      const open: typeof thread.decisions = [];
      for (const d of thread.decisions) if (await live(d.cardTs)) open.push(d);
      if (!open.length) return false;
      if (open.length > 1) return say(whichOne(open.map((d) => d.n)));
      entry = open[0]!;
    }
    wording = cue!.wording;
  }

  const old = await live(entry.cardTs);
  if (!old) return say(`Decision ${entry.n}'s card has already been decided or has closed, so there's nothing to change.`);
  // A Needs changes that comes to nothing lifts the lock it put on the card.
  const unlock = async () => {
    if (note !== null) await deps.clearRevising(old.proposalTs).catch(() => {});
  };
  // A Needs changes already passed the gate's confirmer check, standing
  // confirmers included; a typed reply is checked here.
  if (note === null && !thread.confirmers.includes(reply.user)) {
    await unlock();
    return say(revisionRefusal(thread.confirmers, reply.user));
  }

  let revised: QueuedDecision | null;
  try {
    revised = await redraft(deps, thread, entry.decision, wording);
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[figma-comments] decision ${entry.decision.commentId} not redrafted: ${err instanceof Error ? err.message : String(err)}`);
    revised = null;
  }
  if (!revised) {
    await unlock();
    return say(`I couldn't draft decision ${entry.n} with that wording, so its card stays as it is.`);
  }

  const n = entry.n;
  const ttlMs = Math.max(thread.expiresAt - deps.now(), 0);
  // Back in place as it was before anyone sent it back: no lock.
  const { revising: _lock, ...unlocked } = old;
  const restore = () => deps.restore({ ...unlocked, ttlMs });
  await deps.retire(old.proposalTs);
  const link = commentUrl(thread.fileKey, revised.nodeId, revised.commentId);
  const card = renderProposalCard(decisionCard(n, revised, link));
  const blocks = decisionCardBlocks(n, revised, link, card.text);
  const sent = await deps.post({ text: card.text, blocks, thread_ts: thread.ts });
  if (!sent.ok || !sent.ts) {
    console.error(`[figma-comments] the revised card for decision ${n} did not post; the old card is restored`);
    await restore();
    return true;
  }
  try {
    await deps.stage(stagedDecision(thread, sent.ts, { text: card.text, blocks }, n, revised, ttlMs));
    await deps.thread.write({
      ...thread,
      decisions: thread.decisions.map((d) => (d.n === n ? { ...d, cardTs: sent.ts!, decision: revised! } : d)),
    });
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[figma-comments] revision of decision ${n} posted but not recorded: ${err instanceof Error ? err.message : String(err)}`);
    // The old card shares the revision's slot, so restoring it retires the
    // revision if it was staged; the record still names the old card.
    const restored = await restore().then(
      () => true,
      () => false,
    );
    await deps.retire(sent.ts).catch(() => {});
    await say(
      restored
        ? `That revised card didn't go through, so decision ${n}'s card before it still stands. Try again from its Review button.`
        : `That revised card didn't go through, and the card before it couldn't be put back, so decision ${n} has no live card. Ask me to draft it again if it's still wanted.`,
    ).catch(() => {});
    return true;
  }
  // Superseded on the record only once the revision is in place.
  await deps.superseded([old.proposalTs]);
  return true;
}

/** The decision drafted again with the teammate's words, against a fresh read of its page; null when it cannot be. */
async function redraft(deps: ReviseDeps, thread: DecisionThread, d: QueuedDecision, wording: string): Promise<QueuedDecision | null> {
  let prd: SweepSource | null = null;
  const cards: ShownCard[] = [];
  if (d.update.kind === "prd") prd = await deps.page(d.update.page.url);
  if (d.update.kind === "card") {
    const page = await deps.page(d.update.url);
    if (page) cards.push({ number: d.update.card, title: page.title, url: page.url, fields: fieldsOf(page) });
  }
  if ((d.route === "prd" && !prd) || (d.route === "card" && !cards.length)) return null;
  const result = await deps.detector.detect({
    file: { title: thread.title, url: `https://www.figma.com/design/${encodeURIComponent(thread.fileKey)}` },
    threads: [
      { id: d.commentId, section: d.section, page: d.page, resolved: !!d.resolvedAt, comments: [{ by: d.by, at: d.createdAt, text: d.quote }] },
    ],
    cards,
    prd,
    rewording: { threadId: d.commentId, route: d.route, wording },
  });
  const found = result.ok ? result.decisions[0] : undefined;
  if (!found) return null;
  const { operation, update } = draftDecision(found, {
    prd,
    card: d.update.kind === "card" ? d.update.card : null,
    file: { title: thread.title },
    commentUrl: commentUrl(thread.fileKey, d.nodeId, d.commentId),
    quote: d.quote,
    by: d.by,
    where: `${d.section} › ${d.page}`,
  });
  if (!operation) return null;
  return { ...d, decision: found.decision, operation, update, confidence: found.confidence };
}
