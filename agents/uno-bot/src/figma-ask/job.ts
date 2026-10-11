// @uno in a Figma comment — the answer, as a reply on the comment's thread
// (#903, spec #891 § F).
//
// The notification route marks a new comment that may ask uno-bot something
// (`../figma-notify/event.ts`), and its job, on the `figma/events` runner,
// comes here within about a minute. In order:
//
//   1. THE MARK. `figma-ask:<comment id>` in HARNESS_KV says the comment was
//      replied to, or what is already done towards a reply: the tries so far,
//      a card already posted, the reply already drafted, a reply on its way.
//      A replied comment is never answered again, and nothing done is done
//      twice.
//   2. THE COMMENT, re-read from Figma by id: the route keeps no words. A
//      comment that is gone, that uno-bot wrote (it leads with the label — its
//      author is Bill, so the author proves nothing) or that names no trigger
//      gets nothing. A mention picked from Figma's list is spelled "@Name" in
//      the comment's `message`, so this is where a mention is decided.
//   3. WHO ASKED. Figma's user id, through the Team Members map
//      (`usage/roles.ts`). A teammate's change request is drafted as a card in
//      #plus-design; anyone the map does not know gets no card, and a turn
//      that reads public facts alone.
//   4. THE TURN — the one Slack runs, on a Delivery that keeps the answer
//      (`./delivery.ts`), with the `figma` origin: every tool reads at public
//      scope, because the answer lands in a file people outside the team can
//      open (`agent/public-scope.ts`). It reads the ask, the file's name, the
//      comment's frame link and the thread so far; its memory is the Figma
//      thread's, so a later ask in the same thread follows on.
//   5. A CARD, when the turn stages one: a lead in #plus-design asks the
//      file's design owner (else the file's creator, else the asker) to
//      review it, and the card goes in the lead's thread with Review. The
//      mark says a card is on its way before it posts, the lead once it has
//      posted, and which card once that has, so a retry never posts a second:
//      a retry that finds only the lead looks in its thread for the card. The
//      card's record then moves to the lead's thread, as if the turn had run
//      there.
//   6. THE REPLY, on the root comment (Figma threads are one level deep):
//      the label, 1–3 plain lines and the source the answer cites — a link a
//      lookup of this turn returned, that a public thread may carry, and not
//      the frame asked on — or the can't-find line, or a link to the card
//      (`./copy.ts`). Drafted into the mark, then marked `replying` before it
//      posts: a retry that finds `replying` reads the thread for the reply
//      before it posts again.
//
// THE BUDGET. A budget stop or a Figma rate limit, anywhere — the turn
// included — DEFERS: the runner keeps the job and retries it on a fresh
// budget. Every job on the `figma/events` runner waits behind a deferred one,
// so an ask gets `MAX_ASK_TRIES` tries; past them it posts the failed reply,
// if it can, and is dropped.
//
// PURE: every dependency arrives through `FigmaAskDeps`.

import { isSubrequestBudgetError } from "../net";
import type { TaskCardSource } from "../agent/task-card-readout";
import type { FigmaClient, FigmaComment } from "../figma/client";
import { FigmaRateLimitError } from "../figma/client";
import { parseFigmaUrl } from "../integrations/figma-reading";
import { commentUrl, nodeUrl } from "../figma-comments/draft";
import { quoteOf } from "../figma-comments/read";
import { messageOf } from "../figma-notify/route";
import { threadVisibleSources } from "../slack/card-sources";
import type { HistoryTurn, ThreadRef, ThreadState } from "../thread-state/index";
import { buildTurnRequest, type Delivery, type PostResult, type ProposalCard, type TurnOutcome, type TurnRequest } from "../turn/index";
import { slackPersonOfFigma, type FigmaPeople } from "../usage/roles";
import { askLeadText, figmaReplyText, plainAnswer, type FigmaReply } from "./copy";
import { figmaAskDelivery, type FigmaAskDelivery } from "./delivery";
import { askText, asksUno, isOwnComment } from "./trigger";

/** How long a comment's mark is kept: past every Figma redelivery and runner retry. */
export const ASK_MARK_TTL_S = 8 * 24 * 60 * 60;
/** Tries an ask gets — each one the runner's, on a fresh budget — before it is given up. */
export const MAX_ASK_TRIES = 5;
/** Earlier comments of the thread the turn reads, at most. */
export const THREAD_CONTEXT_COMMENTS = 6;
/** The conversation key's channel when #plus-design is not configured. */
const NO_CHANNEL = "figma";

/** A card posted for an ask: the lead in #plus-design, its link, and the card in its thread. */
export interface PostedCard {
  leadTs: string;
  link: string | null;
  cardTs: string;
}

/** What a comment's mark says. */
export type AskMark =
  | {
      /** `replying` once the reply is about to post: it may be on the thread. */
      state: "pending" | "replying";
      /** Tries the budget or a rate limit has stopped. */
      tries: number;
      at: number;
      /** A card is being posted: set before the lead posts. */
      staging?: true;
      /** The lead in #plus-design, once it has posted. */
      lead?: { ts: string };
      /** The card that posted. */
      card?: PostedCard;
      /** The reply, drafted and not yet posted. */
      reply?: string;
    }
  | { state: "replied"; at: number };

type Pending = Extract<AskMark, { state: "pending" | "replying" }>;

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
  /** The ts of the card uno-bot posted in a lead's thread; null when none did. */
  cardIn(leadTs: string): Promise<string | null>;
  /** The file's design owner as a Slack id, by its title's cards; null for none. */
  designOwner(title: string): Promise<string | null>;
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
  /** One turn on the ask, speaking through `delivery`; `unmappedAsker` when
   *  Team Members does not know the asker, so it reads public facts alone,
   *  and `fileKey` the file the comment sits on, the one Figma file it reads. */
  answer(request: TurnRequest, delivery: Delivery, asker: { unmappedAsker: boolean; fileKey: string }): Promise<TurnOutcome>;
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

/**
 * Answer one @uno ask in a Figma comment.
 *
 * @param job - The file and the comment
 * @param deps - Figma, the people map, the marks, the turn, #plus-design
 */
export async function answerFigmaAsk(job: FigmaAskJob, deps: FigmaAskDeps): Promise<FigmaAskResult> {
  const mark = await deps.marks.get(job.commentId);
  if (mark?.state === "replied") return { outcome: "handled", said: "already replied" };
  const pending: Pending = mark ?? { state: "pending", tries: 0, at: deps.now() };
  const rootOf: { id: string | null } = { id: null };
  try {
    return await answer(job, deps, pending, rootOf);
  } catch (err) {
    if (!waitable(err)) throw err;
    const tries = pending.tries + 1;
    if (tries < MAX_ASK_TRIES) {
      pending.tries = tries;
      pending.at = deps.now();
      await deps.marks.put(job.commentId, pending);
      return { outcome: "deferred", said: `waiting for a fresh budget (try ${tries} of ${MAX_ASK_TRIES}): ${messageOf(err)}` };
    }
    return giveUp(job, deps, pending, rootOf.id, err);
  }
}

/**
 * The last try: say so in Figma if Figma will take it, and let the job go. A
 * reply already on its way (`replying`) may be on the thread, so no second
 * one follows it.
 */
async function giveUp(job: FigmaAskJob, deps: FigmaAskDeps, pending: Pending, rootId: string | null, err: unknown): Promise<FigmaAskResult> {
  let told = "";
  if (pending.state === "replying") {
    told = ", and posted nothing more: the reply may already be on the comment";
  } else if (rootId) {
    try {
      await deps.marks.put(job.commentId, { ...pending, state: "replying", reply: figmaReplyText({ kind: "failed" }), at: deps.now() });
      await deps.figma.replyToComment(job.fileKey, rootId, figmaReplyText({ kind: "failed" }));
      told = ", and said so on the comment";
    } catch (again) {
      told = `, and could not say so: ${messageOf(again)}`;
    }
  }
  await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
  return { outcome: "handled", said: `given up after ${MAX_ASK_TRIES} tries (${messageOf(err)})${told}` };
}

async function answer(job: FigmaAskJob, deps: FigmaAskDeps, pending: Pending, rootOf: { id: string | null }): Promise<FigmaAskResult> {
  const comments = (await deps.figma.comments(job.fileKey)).comments ?? [];
  const comment = comments.find((c) => c.id === job.commentId);
  if (!comment) return { outcome: "handled", said: "the comment is gone" };
  if (isOwnComment(comment.message)) return { outcome: "handled", said: "uno-bot's own comment" };
  if (!asksUno(comment.message)) return { outcome: "handled", said: "no @uno in it" };
  const rootId = comment.parent_id || comment.id;
  rootOf.id = rootId;

  let reply = pending.reply ?? null;
  let said = "the drafted reply";
  // A reply that was on its way when a try stopped may have posted.
  if (pending.state === "replying" && reply !== null && alreadyPosted(comments, rootId, reply)) {
    await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
    return { outcome: "handled", said: "the reply was already on the comment" };
  }
  if (reply === null) {
    const drafted = await draft(job, comment, rootId, comments, deps, pending);
    if (drafted.reply === null) {
      await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
      return { outcome: "handled", said: drafted.said };
    }
    reply = drafted.reply;
    said = drafted.said;
    pending.reply = reply;
  }

  pending.state = "replying";
  pending.at = deps.now();
  await deps.marks.put(job.commentId, pending);
  await deps.figma.replyToComment(job.fileKey, rootId, reply);
  await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
  return { outcome: "handled", said: `replied: ${said}` };
}

/** The reply the ask comes to — from a card already posted, or a turn — and null to post nothing. */
async function draft(
  job: FigmaAskJob,
  comment: FigmaComment,
  rootId: string,
  comments: readonly FigmaComment[],
  deps: FigmaAskDeps,
  pending: Pending,
): Promise<{ reply: string | null; said: string }> {
  const channel = deps.design?.channel ?? NO_CHANNEL;
  // A card a stopped try already posted: its reply, and no second turn.
  if (pending.card) {
    await moveCard(deps.threadState, channel, pending.card, []);
    return { reply: figmaReplyText({ kind: "drafted", link: pending.card.link }), said: "drafted, from an earlier try" };
  }
  // A try that stopped while a card was posting may have posted it. No second
  // card: the lead's thread says whether the first one landed.
  if (pending.staging) return stagedEarlier(deps, channel, pending);

  const people = await deps.people();
  const slackId = slackPersonOfFigma(comment.user.id, people);
  const root = comments.find((c) => c.id === rootId) ?? comment;
  const nodeId = root.client_meta?.node_id ?? null;
  const fileUrl = `https://www.figma.com/design/${encodeURIComponent(job.fileKey)}`;
  const meta = await fileMeta(deps, job.fileKey);
  const ref: ThreadRef = { channel, thread: `figma:${job.fileKey}:${rootId}` };
  const question = askText(comment.message) || comment.message;

  const design = deps.design;
  const posted: { card: PostedCard | null } = { card: null };
  const stage =
    slackId && design
      ? async (card: ProposalCard): Promise<PostResult> => {
          pending.staging = true;
          pending.at = deps.now();
          await deps.marks.put(job.commentId, pending);
          const owner = (await ownerOf(design, meta.title)) ?? slackPersonOfFigma(meta.creatorId, people) ?? slackId;
          const lead = await design.post(
            askLeadText({
              asker: slackId,
              owner,
              file: { title: meta.title, url: fileUrl },
              quote: quoteOf(question),
              commentUrl: nodeId ? commentUrl(job.fileKey, nodeId, rootId) : fileUrl,
            }),
          );
          if (!lead) return { ok: false, text: "" };
          pending.lead = { ts: lead.ts };
          await deps.marks.put(job.commentId, pending);
          const result = await design.cardDelivery(lead.ts, slackId).card(card);
          if (result.ok && result.ts) {
            posted.card = { leadTs: lead.ts, link: await design.permalink(lead.ts), cardTs: result.ts };
            pending.card = posted.card;
            await deps.marks.put(job.commentId, pending);
          }
          return result;
        }
      : undefined;
  const delivery = figmaAskDelivery(stage ? { stage } : {});

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
    attachmentsText: [question, "", ...askContext(meta.title, fileUrl, nodeId ? nodeUrl(job.fileKey, nodeId) : null, comment, rootId, comments)].join("\n"),
    scopeInstruction: askInstruction(slackId !== null),
    history: await deps.threadState.readHistory(ref),
    pending: null,
  });

  let outcome: TurnOutcome | null = null;
  try {
    outcome = await deps.answer(request, delivery, { unmappedAsker: slackId === null, fileKey: job.fileKey });
  } catch (err) {
    // A stop is a stop wherever it lands: the retry finds the card, if one
    // posted, in the mark.
    if (waitable(err)) throw err;
    console.error(`[figma-ask] the turn on ${job.commentId} failed: ${messageOf(err)}`);
  }

  if (posted.card) await moveCard(deps.threadState, channel, posted.card, outcome?.wrote.turns ?? []);
  const asked = nodeId ? nodeUrl(job.fileKey, nodeId) : fileUrl;
  const reply = replyOf(outcome, delivery, posted.card, slackId !== null, asked);
  return reply
    ? { reply: figmaReplyText(reply), said: `${reply.kind}${slackId ? "" : " (not on Team Members)"}` }
    : { reply: null, said: `nothing to say (${outcome?.disposition ?? "no outcome"})` };
}

/** The file's name and its creator's Figma id; its key, and no creator, when Figma will not say. */
async function fileMeta(deps: FigmaAskDeps, fileKey: string): Promise<{ title: string; creatorId: string | null }> {
  try {
    const { file } = await deps.figma.fileMeta(fileKey);
    return { title: file.name || fileKey, creatorId: file.creator?.id ?? null };
  } catch (err) {
    if (waitable(err)) throw err;
    return { title: fileKey, creatorId: null };
  }
}

/** The file's design owner, or null when none resolves or the read fails. */
async function ownerOf(design: AskDesign, title: string): Promise<string | null> {
  try {
    return await design.designOwner(title);
  } catch (err) {
    if (waitable(err)) throw err;
    console.warn(`[figma-ask] the design owner of "${title}" not read: ${messageOf(err)}`);
    return null;
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

/**
 * The source a reply may carry: the first link the answer cites that a lookup
 * of this turn returned, and that a public thread may carry
 * (`threadVisibleSources`, judged with what that lookup said of who may see
 * it). A link the turn read but the answer does not cite is no source; nor is
 * one the answer cites that no lookup returned; nor the frame the ask was
 * made on, which the asker is already looking at.
 *
 * @param cited - The links the answer cites, in order
 * @param read - What the turn's lookups returned
 * @param asked - The frame (or the file) the ask was made on
 */
export function sourceOf(cited: readonly string[], read: readonly TaskCardSource[], asked: string): string | null {
  for (const url of cited) {
    if (sameFigmaPlace(url, asked)) continue;
    const source = read.find((s) => s.url === url);
    if (source && threadVisibleSources([source]).length) return url;
  }
  return null;
}

/** Whether two links open the same Figma frame, or the same file with no frame. */
function sameFigmaPlace(a: string, b: string): boolean {
  const key = (url: string): string | null => {
    const file = /^https?:\/\/(?:[\w-]+\.)?figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)/i.exec(url)?.[1];
    if (!file) return null;
    return `${file}:${parseFigmaUrl(url)?.nodeId ?? ""}`;
  };
  const ka = key(a);
  return ka !== null && ka === key(b);
}

/**
 * Whether the thread already holds this reply under its root. Figma hands a
 * posted message back with `&`, `<` and `>` as entities, and the drafted reply
 * may still carry a markdown backslash escape, so both sides are compared
 * unescaped and with their whitespace collapsed.
 */
function alreadyPosted(comments: readonly FigmaComment[], rootId: string, reply: string): boolean {
  const flat = (text: string) => unescaped(text).replace(/\s+/g, " ").trim();
  return comments.some((c) => c.parent_id === rootId && isOwnComment(c.message) && flat(c.message) === flat(reply));
}

/** Text with HTML entities decoded, in one pass, and backslash escapes dropped. */
function unescaped(text: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, name: string) => {
      const n = name.toLowerCase();
      if (!n.startsWith("#")) return named[n] ?? match;
      const code = n.startsWith("#x") ? parseInt(n.slice(2), 16) : Number(n.slice(1));
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/\\([\\`*_{}[\]()#+\-.!&<>|~])/g, "$1");
}

/**
 * The reply for a try that stopped while a card was posting: a link to the
 * lead when its thread holds the card — the card's record moved there, as a
 * try that finished would — and "couldn't draft" when the card never posted.
 * A thread that cannot be read gets the link: the lead is there to follow.
 */
async function stagedEarlier(deps: FigmaAskDeps, channel: string, pending: Pending): Promise<{ reply: string; said: string }> {
  const design = deps.design;
  const lead = pending.lead;
  const never = { reply: figmaReplyText({ kind: "not-drafted" }), said: "not-drafted: the card never posted on an earlier try" };
  if (!design || !lead) return never;
  let cardTs: string | null | undefined;
  try {
    cardTs = await design.cardIn(lead.ts);
  } catch (err) {
    if (waitable(err)) throw err;
    console.warn(`[figma-ask] the lead's thread ${lead.ts} not read: ${messageOf(err)}`);
  }
  if (cardTs === null) return never;
  const link = await design.permalink(lead.ts);
  if (cardTs) await moveCard(deps.threadState, channel, { leadTs: lead.ts, link, cardTs }, []);
  return { reply: figmaReplyText({ kind: "drafted", link }), said: "drafted, from an earlier try's lead" };
}

/** What the reply says, from what the turn came to; null for nothing. */
function replyOf(
  outcome: TurnOutcome | null,
  delivery: FigmaAskDelivery,
  card: PostedCard | null,
  teammate: boolean,
  asked: string,
): FigmaReply | null {
  if (card) return { kind: "drafted", link: card.link };
  const refused = delivery.refusedCard();
  if (refused === "not-allowed") return teammate ? { kind: "not-drafted" } : { kind: "not-teammate" };
  if (refused === "not-posted") return { kind: "not-drafted" };
  const answer = delivery.answer();
  if (outcome?.disposition === "answered" && answer !== null) {
    const { lines, cited } = plainAnswer(answer);
    return { kind: "answer", lines, source: sourceOf(cited, delivery.sources(), asked) };
  }
  const note = delivery.notes().at(-1);
  if (outcome?.disposition === "asked" && note) return { kind: "question", lines: plainAnswer(note).lines };
  // A "thanks" the turn only acknowledged has nothing to reply.
  if (outcome?.disposition === "reacted") return null;
  return { kind: "failed" };
}

/**
 * A posted card's record, moved to the lead's thread in #plus-design, and the
 * turn's memory with it — as if the turn had run there. Only while the card
 * is still live and not already there: one already decided stays decided.
 */
async function moveCard(store: ThreadState, channel: string, card: PostedCard, turns: readonly HistoryTurn[]): Promise<void> {
  const found = await store.getProposalByTs(card.cardTs);
  if (found.state !== "found" || found.proposal.threadTs === card.leadTs) return;
  await store.putProposal({ ...found.proposal, threadTs: card.leadTs, replyTs: card.leadTs });
  const there: ThreadRef = { channel, thread: card.leadTs };
  for (const turn of turns) await store.appendHistory(there, turn);
}
