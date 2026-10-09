// @uno in a Figma comment — the answer, as a reply on the comment's thread
// (#903, spec #891 § F).
//
// The notification route marks a new comment that carries a trigger
// (`../figma-notify/event.ts`), and its job, on the `figma/events` runner,
// comes here within about a minute. In order:
//
//   1. THE MARK. `figma-ask:<comment id>` in HARNESS_KV says the comment was
//      replied to, or holds the reply already drafted. A replied comment is
//      never answered again; a drafted one is posted without a second turn.
//   2. THE COMMENT, re-read from Figma by id: the route keeps no words. A
//      comment that is gone, that uno-bot wrote (it leads with the label — its
//      author is Bill, so the author proves nothing) or that names no trigger
//      gets nothing.
//   3. WHO ASKED. Figma's user id, through the Team Members map
//      (`usage/roles.ts`). A teammate's change request is drafted as a card in
//      #plus-design; anyone the map does not know gets public facts only and
//      no card. The answer runs as a turn in #plus-design, a public channel,
//      so its searches see only what a public thread may.
//   4. THE TURN — the one Slack runs, on a Delivery that keeps the answer
//      (`./delivery.ts`). It reads the ask, the file's name, the comment's
//      frame link and the thread so far; its memory is the Figma thread's,
//      so a later ask in the same thread follows on.
//   5. A CARD, when the turn staged one: a lead in #plus-design names who
//      asked and quotes the ask, and the card goes in its thread with Review.
//      The card's record then moves to that thread, as if the turn had run
//      there, so a reply, Needs changes or a ✅ there finds it.
//   6. THE REPLY, on the root comment (Figma threads are one level deep):
//      the label, 1–3 plain lines and a source, or the can't-find line, or a
//      link to the card (`./copy.ts`). Drafted into the mark first, so a reply
//      the budget stops is posted on the retry rather than answered twice.
//
// THE BUDGET. A budget stop or a Figma rate limit DEFERS: the runner keeps the
// job and runs it again on a fresh budget (`runner/queue.ts`). Nothing is
// dropped for want of a subrequest.
//
// PURE: every dependency arrives through `FigmaAskDeps`.

import { isSubrequestBudgetError } from "../net";
import type { FigmaClient, FigmaComment } from "../figma/client";
import { FigmaRateLimitError } from "../figma/client";
import { commentUrl, nodeUrl } from "../figma-comments/draft";
import { quoteOf } from "../figma-comments/read";
import type { ThreadRef, ThreadState } from "../thread-state/index";
import { buildTurnRequest, type Delivery, type PostResult, type ProposalCard, type TurnOutcome, type TurnRequest } from "../turn/index";
import { slackPersonOfFigma, type FigmaPeople } from "../usage/roles";
import { askLeadText, figmaReplyText, plainAnswer, type FigmaReply } from "./copy";
import { figmaAskDelivery, type FigmaAskDelivery } from "./delivery";
import { askText, asksUno, isOwnComment } from "./trigger";

/** How long a comment's mark is kept: past every Figma redelivery and runner retry. */
export const ASK_MARK_TTL_S = 8 * 24 * 60 * 60;
/** Earlier comments of the thread the turn reads, at most. */
export const THREAD_CONTEXT_COMMENTS = 6;
/** The conversation key a channel without #plus-design configured runs under. */
const NO_CHANNEL = "figma";

/** What a comment's mark says. */
export type AskMark = { state: "drafted"; reply: string; at: number } | { state: "replied"; at: number };

/** The ask a job names: ids only. */
export interface FigmaAskJob {
  fileKey: string;
  commentId: string;
}

/** Where a teammate's change request goes: #plus-design. */
export interface AskDesign {
  channel: string;
  /** Post the lead, top level. */
  post(text: string): Promise<{ ts: string } | null>;
  /** A message's link, or null when Slack will not give one. */
  permalink(ts: string): Promise<string | null>;
  /** The Delivery a card posts through, in the lead's thread. */
  cardDelivery(leadTs: string, slackId: string): Delivery;
}

export interface FigmaAskDeps {
  figma: Pick<FigmaClient, "comments" | "fileMeta" | "replyToComment">;
  /** The Figma user id → Slack id map. Throws a budget stop. */
  people(): Promise<FigmaPeople>;
  marks: {
    get(commentId: string): Promise<AskMark | null>;
    put(commentId: string, mark: AskMark): Promise<void>;
  };
  /** The store the turn remembers in, and where a staged card is kept. */
  threadState: ThreadState;
  /** One turn on the ask, speaking through `delivery`. */
  answer(request: TurnRequest, delivery: Delivery): Promise<TurnOutcome>;
  /** #plus-design; absent, nothing can be drafted. */
  design?: AskDesign;
  now(): number;
}

/** What the job did, as its log line, and whether the runner keeps it. */
export interface FigmaAskResult {
  outcome: "handled" | "deferred";
  said: string;
}

/** Whether an error is one to wait out rather than drop. */
function waitable(err: unknown): boolean {
  return isSubrequestBudgetError(err) || err instanceof FigmaRateLimitError;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Answer one @uno ask in a Figma comment.
 *
 * @param job - The file and the comment
 * @param deps - Figma, the people map, the marks, the turn, #plus-design
 */
export async function answerFigmaAsk(job: FigmaAskJob, deps: FigmaAskDeps): Promise<FigmaAskResult> {
  try {
    return await answer(job, deps);
  } catch (err) {
    if (waitable(err)) return { outcome: "deferred", said: `waiting for the budget: ${messageOf(err)}` };
    throw err;
  }
}

async function answer(job: FigmaAskJob, deps: FigmaAskDeps): Promise<FigmaAskResult> {
  const mark = await deps.marks.get(job.commentId);
  if (mark?.state === "replied") return { outcome: "handled", said: "already replied" };

  const comments = (await deps.figma.comments(job.fileKey)).comments ?? [];
  const comment = comments.find((c) => c.id === job.commentId);
  if (!comment) return { outcome: "handled", said: "the comment is gone" };
  if (isOwnComment(comment.message)) return { outcome: "handled", said: "uno-bot's own comment" };
  if (!asksUno(comment.message)) return { outcome: "handled", said: "no @uno in it" };
  const rootId = comment.parent_id || comment.id;

  let reply = mark?.state === "drafted" ? mark.reply : null;
  let said = "the drafted reply";
  if (reply === null) {
    const drafted = await draft(job, comment, rootId, comments, deps);
    reply = drafted.reply;
    said = drafted.said;
    if (reply === null) {
      await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
      return { outcome: "handled", said };
    }
    await deps.marks.put(job.commentId, { state: "drafted", reply, at: deps.now() });
  }

  await deps.figma.replyToComment(job.fileKey, rootId, reply);
  await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
  return { outcome: "handled", said: `replied: ${said}` };
}

/** The turn on the ask, and the reply it comes to; a null reply posts nothing. */
async function draft(
  job: FigmaAskJob,
  comment: FigmaComment,
  rootId: string,
  comments: readonly FigmaComment[],
  deps: FigmaAskDeps,
): Promise<{ reply: string | null; said: string }> {
  const slackId = slackPersonOfFigma(comment.user.id, await deps.people());
  const root = comments.find((c) => c.id === rootId) ?? comment;
  const nodeId = root.client_meta?.node_id ?? null;
  const fileUrl = `https://www.figma.com/design/${encodeURIComponent(job.fileKey)}`;
  const title = await fileTitle(deps, job.fileKey);
  const design = deps.design;
  const channel = design?.channel ?? NO_CHANNEL;
  const ref: ThreadRef = { channel, thread: `figma:${job.fileKey}:${rootId}` };

  let lead: { ts: string; link: string | null } | null = null;
  const stage =
    slackId && design
      ? async (card: ProposalCard): Promise<PostResult> => {
          const posted = await design.post(
            askLeadText({
              slackId,
              file: { title, url: fileUrl },
              quote: quoteOf(askText(comment.message) || comment.message),
              commentUrl: nodeId ? commentUrl(job.fileKey, nodeId, rootId) : fileUrl,
            }),
          );
          if (!posted) return { ok: false, text: "" };
          const result = await design.cardDelivery(posted.ts, slackId).card(card);
          if (result.ok && result.ts) lead = { ts: posted.ts, link: await design.permalink(posted.ts) };
          return result;
        }
      : undefined;
  const delivery = figmaAskDelivery(stage ? { stage } : {});

  const question = askText(comment.message) || comment.message;
  const request = buildTurnRequest({
    userId: slackId ?? `figma:${comment.user.id}`,
    channel,
    channelType: "channel",
    conversationTs: ref.thread,
    userMsgTs: `figma:${comment.id}`,
    // Never top level: the antecedent window reads the channel's messages
    // before the ask, and this ask was not made in the channel.
    threaded: true,
    text: question,
    attachmentsText: [question, "", ...askContext(title, fileUrl, nodeId ? nodeUrl(job.fileKey, nodeId) : null, comment, rootId, comments)].join("\n"),
    scopeInstruction: askInstruction(slackId !== null),
    history: await deps.threadState.readHistory(ref),
    pending: null,
  });

  let outcome: TurnOutcome | null = null;
  try {
    outcome = await deps.answer(request, delivery);
  } catch (err) {
    if (waitable(err) && !lead) throw err;
    console.error(`[figma-ask] the turn on ${job.commentId} failed: ${messageOf(err)}`);
  }

  if (outcome?.staged && lead) await moveCard(deps.threadState, outcome, lead);
  const reply = replyOf(outcome, delivery, lead, slackId !== null);
  return reply
    ? { reply: figmaReplyText(reply), said: `${reply.kind}${slackId ? "" : " (not on Team Members)"}` }
    : { reply: null, said: `nothing to say (${outcome?.disposition ?? "no outcome"})` };
}

/** The file's name, or its key when Figma will not say. */
async function fileTitle(deps: FigmaAskDeps, fileKey: string): Promise<string> {
  try {
    return (await deps.figma.fileMeta(fileKey)).file.name || fileKey;
  } catch (err) {
    if (waitable(err)) throw err;
    return fileKey;
  }
}

/** Where the ask was made, and the thread so far, for the model to read. */
function askContext(
  title: string,
  fileUrl: string,
  frameUrl: string | null,
  comment: FigmaComment,
  rootId: string,
  comments: readonly FigmaComment[],
): string[] {
  const lines = [`(Asked by ${comment.user.handle} in a Figma comment on the file “${title}”: ${frameUrl ?? fileUrl})`];
  const earlier = comments
    .filter((c) => (c.id === rootId || c.parent_id === rootId) && c.id !== comment.id && Date.parse(c.created_at) <= Date.parse(comment.created_at))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .slice(-THREAD_CONTEXT_COMMENTS);
  if (earlier.length) {
    lines.push("(Earlier in the comment thread:");
    for (const c of earlier) lines.push(`- ${isOwnComment(c.message) ? "uno-bot" : c.user.handle}: ${quoteOf(c.message)}`);
    lines.push(")");
  }
  return lines;
}

/** How the turn answers an ask from Figma, and how far a stranger's goes. */
export function askInstruction(teammate: boolean): string {
  return [
    "this ask came from a Figma comment, and the answer is posted back there as plain text.",
    "Answer in one to three short sentences: no lists, headings or formatting.",
    "Cite the one link that answers it; when nothing you read answers it, say so plainly rather than guess.",
    teammate
      ? "A change they ask for is drafted as a card for approval in #plus-design; nothing is written from Figma."
      : "The asker is not on Team Members: answer from public facts only, and propose no change of any kind.",
  ].join(" ");
}

/** What the reply says, from what the turn came to; null for nothing. */
function replyOf(
  outcome: TurnOutcome | null,
  delivery: FigmaAskDelivery,
  lead: { ts: string; link: string | null } | null,
  teammate: boolean,
): FigmaReply | null {
  if (outcome?.staged && lead) return { kind: "drafted", link: lead.link };
  if (delivery.refusedCard() === "not-allowed" && !teammate) return { kind: "not-teammate" };
  const answer = delivery.answer();
  if (outcome?.disposition === "answered" && answer !== null) {
    const { lines, source } = plainAnswer(answer);
    return { kind: "answer", lines, source: source ?? delivery.sources()[0] ?? null };
  }
  const note = delivery.notes().at(-1);
  if (outcome?.disposition === "asked" && note) return { kind: "question", lines: plainAnswer(note).lines };
  // A "thanks" the turn only acknowledged has nothing to reply.
  if (outcome?.disposition === "reacted") return null;
  return { kind: "failed" };
}

/**
 * The staged card's record, moved to the lead's thread in #plus-design, and
 * the turn's memory with it — as if the turn had run there. Only while the
 * card is still live: one already decided stays decided.
 */
async function moveCard(store: ThreadState, outcome: TurnOutcome, lead: { ts: string }): Promise<void> {
  const proposal = outcome.staged!.proposal;
  const found = await store.getProposalByTs(proposal.proposalTs);
  if (found.state !== "found") return;
  await store.putProposal({ ...found.proposal, threadTs: lead.ts, replyTs: lead.ts });
  const there: ThreadRef = { channel: proposal.channel, thread: lead.ts };
  for (const turn of outcome.wrote.turns) await store.appendHistory(there, turn);
}
