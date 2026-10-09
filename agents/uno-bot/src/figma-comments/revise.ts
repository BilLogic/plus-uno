// A reply with new wording revises a decision's draft (#900 AC 4).
//
// A comment-decision thread holds one card per decision, numbered. A reply
// `2: <new wording>` — or `2.`, `2)`, `2 -` — rewords decision 2. With one
// decision open, a reply that reads as wording rewords it without a number;
// with several, uno-bot asks which. A typed gate emoji, or a reply of two
// words or fewer, is not wording, and is left to the ordinary path.
//
// THE REVISION is the decision drafted again (`./detector.ts` with
// `rewording`), on the same route and against a fresh read of its page, so a
// PRD line or a card field is stamped with what the page says now. The
// revised card goes up in the thread, numbered as before, and is staged in
// the decision's own slot with its confirmers and the time its thread has
// left. As the weekly precedence card's `drop N` does, the old card is
// retired BEFORE the revised one posts, so a ✅ racing the reply cannot run
// the draft the person just pushed back on; a revision that fails to post or
// stage puts the old card back, and says so in one line.
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
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import type { SweepSource } from "../sweep/finding";
import type { DecisionDetector, ShownCard } from "./detector";
import { decisionCard, whichOne } from "./copy";
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
}

const NUMBERED = /^(\d{1,2})\s*[:.)\-–—]\s*([\s\S]*)$/;

/** A reply's text without the @-mentions Slack writes into it. */
function withoutMentions(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * The decision a reply numbers, and its new wording; null for a reply that
 * names no number.
 *
 * @param text - The reply as Slack sent it
 */
export function numberedReply(text: string): { n: number; wording: string } | null {
  const m = NUMBERED.exec(withoutMentions(text));
  return m ? { n: Number(m[1]), wording: m[2]!.trim() } : null;
}

/** Whether an unnumbered reply reads as new wording: three words or more, and no gate emoji. */
export function readsAsWording(text: string): boolean {
  const bare = withoutMentions(text);
  if (!bare || typedEmojiDecision(bare)) return false;
  return (bare.match(/[\p{L}\p{N}]+/gu) ?? []).length >= 3;
}

/**
 * A reply in a decision thread that rewords one of its decisions: revise
 * that decision's card. Answers whether it handled the reply — false (no
 * decision thread, or no wording) leaves it to the ordinary path.
 *
 * @param deps - The thread record, the card lookup, the reads, the detector, the posts and the staging
 * @param reply - The reply
 */
export async function reviseDecision(deps: ReviseDeps, reply: DecisionReply): Promise<boolean> {
  const thread = await deps.thread.read();
  if (!thread || thread.channel !== reply.channel || thread.ts !== reply.threadTs) return false;
  const say = async (text: string) => {
    await deps.post({ text, thread_ts: thread.ts });
    return true;
  };
  const live = async (cardTs: string) => (deps.now() < thread.expiresAt ? deps.card(cardTs) : null);

  let entry: DecisionThread["decisions"][number] | undefined;
  let wording: string;
  const numbered = numberedReply(reply.text);
  if (numbered) {
    entry = thread.decisions.find((d) => d.n === numbered.n);
    if (!entry) return say(`There's no decision ${numbered.n} in this thread.`);
    wording = numbered.wording;
    if (!wording) return say(`Reply with the new wording after the number, like \`${numbered.n}: …\`.`);
  } else {
    if (!readsAsWording(reply.text)) return false;
    const open: typeof thread.decisions = [];
    for (const d of thread.decisions) if (await live(d.cardTs)) open.push(d);
    if (!open.length) return false;
    if (open.length > 1) return say(whichOne(open.map((d) => d.n)));
    entry = open[0]!;
    wording = withoutMentions(reply.text);
  }

  const old = await live(entry.cardTs);
  if (!old) return say(`Decision ${entry.n}'s card has already been decided or has closed, so there's nothing to change.`);
  if (!thread.confirmers.includes(reply.user)) return say(revisionRefusal(thread.confirmers, reply.user));

  let revised: QueuedDecision | null;
  try {
    revised = await redraft(deps, thread, entry.decision, wording);
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[figma-comments] decision ${entry.decision.commentId} not redrafted: ${err instanceof Error ? err.message : String(err)}`);
    revised = null;
  }
  if (!revised) return say(`I couldn't draft decision ${entry.n} with that wording, so its card stays as it is.`);

  const n = entry.n;
  const ttlMs = Math.max(thread.expiresAt - deps.now(), 0);
  const restore = () => deps.restore({ ...old, ttlMs });
  await deps.retire(old.proposalTs);
  const card = renderProposalCard(decisionCard(n, revised, commentUrl(thread.fileKey, revised.nodeId, revised.commentId)));
  const sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text), thread_ts: thread.ts });
  if (!sent.ok || !sent.ts) {
    console.error(`[figma-comments] the revised card for decision ${n} did not post; the old card is restored`);
    await restore();
    return true;
  }
  try {
    await deps.stage(stagedDecision(thread, sent.ts, card.text, n, revised, ttlMs));
    await deps.thread.write({
      ...thread,
      decisions: thread.decisions.map((d) => (d.n === n ? { ...d, cardTs: sent.ts!, decision: revised! } : d)),
    });
  } catch (err) {
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
        ? `That revised card didn't go through, so decision ${n}'s card before it still stands. Try the reply again.`
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
    file: { title: thread.title },
    commentUrl: commentUrl(thread.fileKey, d.nodeId, d.commentId),
    quote: d.quote,
    by: d.by,
    where: `${d.section} › ${d.page}`,
  });
  return { ...d, decision: found.decision, operation, update, confidence: found.confidence };
}
