// @uno in a Figma comment — the answer, as a reply on the comment's thread
// (#903, spec #891 § F).
//
// The notification route marks a new comment that may ask uno-bot something
// (`../figma-notify/event.ts`), and its job, on the `figma/events` runner,
// comes here within about a minute. In order:
//
//   1. THE MARK. `figma-ask:<comment id>` in HARNESS_KV says the comment was
//      replied to, or what is already done towards a reply: the tries so far,
//      the reply already drafted, a reply on its way. A replied comment is
//      never answered again, and nothing done is done twice.
//   2. THE COMMENT, re-read from Figma by id: the route keeps no words. A
//      comment that is gone, that uno-bot wrote (it leads with the label — its
//      author is Bill, so the author proves nothing) or that names no trigger
//      gets nothing. A mention picked from Figma's list is spelled "@Name" in
//      the comment's `message`, so this is where a mention is decided.
//   2a. THE 🐐. The ask gets a `:goat:` reaction before anything else is
//      done, so the asker sees it was picked up before the reply lands. Sent
//      once — the mark says so — and a refusal is logged and passed over: the
//      reply matters more than the acknowledgement.
//   3. WHO ASKED. Figma's user id, through the Team Members map
//      (`usage/roles.ts`). A teammate's turn reads the team's public estates
//      and remembers the thread; anyone the map does not know gets a turn that
//      reads public facts alone. When their handle names a Team Members row
//      with no Figma User ID, the lead is told (`usage/gap-notes.ts`).
//   4. THE TURN — the one Slack runs, on a Delivery that keeps the answer
//      (`./delivery.ts`), with the `figma` origin: every tool reads at public
//      scope, because the answer lands in a file people outside the team can
//      open (`agent/public-scope.ts`). It reads the ask, the file's name, the
//      comment's frame link and the thread so far; its memory is the Figma
//      thread's, so a later ask in the same thread follows on. The turn runs
//      as #plus-design, for its memory and the usage record, and posts
//      nothing there.
//   5. ANSWER-ONLY. Nothing is written from Figma, and nothing is posted to
//      Slack: a write the turn proposes is refused before it stages
//      (`./delivery.ts`), and the reply says what it would have done and
//      points a teammate at le goat in Slack.
//   6. THE REPLY, on the root comment (Figma threads are one level deep):
//      the label, 1–3 plain lines and the source the answer cites — a link a
//      lookup of this turn returned, that a public thread may carry, and not
//      the frame asked on — or the can't-find line, or the answer-only line
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
import { nodeUrl } from "../figma-comments/draft";
import { quoteOf } from "../figma-comments/read";
import { messageOf } from "../figma-notify/route";
import { threadVisibleSources } from "../slack/card-sources";
import type { ThreadRef, ThreadState } from "../thread-state/index";
import { buildTurnRequest, type Delivery, type TurnOutcome, type TurnRequest } from "../turn/index";
import { slackPersonOfFigma, type FigmaPeople } from "../usage/roles";
import type { GapNotes } from "../usage/gap-notes";
import { answerOnlyReply, figmaReplyText, plainAnswer, type FigmaReply, type FigmaSource } from "./copy";
import { figmaAskDelivery, type FigmaAskDelivery } from "./delivery";
import { askText, asksUno, asPosted, GOAT_REACTION, isOwnComment } from "./trigger";
import { figmaFileUrl } from "../figma/links";

/** How long a comment's mark is kept: past every Figma redelivery and runner retry. */
export const ASK_MARK_TTL_S = 8 * 24 * 60 * 60;
/** Tries an ask gets — each one the runner's, on a fresh budget — before it is given up. */
export const MAX_ASK_TRIES = 5;
/** Earlier comments of the thread the turn reads, at most. */
export const THREAD_CONTEXT_COMMENTS = 6;
/** The channel the turn runs as when #plus-design is not configured. */
const NO_CHANNEL = "figma";

/** What a comment's mark says. */
export type AskMark =
  | {
      /** `replying` once the reply is about to post: it may be on the thread. */
      state: "pending" | "replying";
      /** Tries the budget or a rate limit has stopped. */
      tries: number;
      at: number;
      /** The reply, drafted and not yet posted. */
      reply?: string;
      /** The 🐐 is on the ask, or Figma refused it: never sent twice. */
      reacted?: true;
    }
  | { state: "replied"; at: number };

type Pending = Extract<AskMark, { state: "pending" | "replying" }>;

/** The ask a job names: ids only. */
export interface FigmaAskJob {
  fileKey: string;
  commentId: string;
}

export interface FigmaAskDeps {
  figma: Pick<FigmaClient, "comments" | "fileMeta" | "replyToComment" | "postReaction">;
  /** The Figma user id → Slack id map. Throws a budget stop. */
  people(): Promise<FigmaPeople>;
  marks: {
    get(commentId: string): Promise<AskMark | null>;
    put(commentId: string, mark: AskMark): Promise<void>;
  };
  /** The store the turn remembers in. */
  threadState: ThreadState;
  /** One turn on the ask, speaking through `delivery`; `unmappedAsker` when
   *  Team Members does not know the asker, so it reads public facts alone,
   *  and `fileKey` the file the comment sits on, the one Figma file it reads. */
  answer(request: TurnRequest, delivery: Delivery, asker: { unmappedAsker: boolean; fileKey: string }): Promise<TurnOutcome>;
  /** The channel the turn runs as, for its memory and the usage record:
   *  #plus-design. Nothing is posted there. Absent, `figma`. */
  channel?: string;
  /** Where an asker the people map does not know is noted to the lead, when
   *  their handle names a Team Members row with no Figma User ID; absent, nobody is. */
  gaps?: Pick<GapNotes, "figmaAsker">;
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
 * @param deps - Figma, the people map, the marks, the turn
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
  await acknowledge(job, deps, pending);

  let reply = pending.reply ?? null;
  let said = "the drafted reply";
  // A reply that was on its way when a try stopped may have posted.
  if (pending.state === "replying" && reply !== null && alreadyPosted(comments, rootId, reply)) {
    await deps.marks.put(job.commentId, { state: "replied", at: deps.now() });
    return { outcome: "handled", said: "the reply was already on the comment" };
  }
  if (reply === null) {
    const drafted = await draft(job, comment, rootId, comments, deps);
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

/**
 * The 🐐 on the ask, once. A budget stop or a rate limit defers the ask like
 * any stop; any other refusal is logged, and the reply goes ahead without it.
 */
async function acknowledge(job: FigmaAskJob, deps: FigmaAskDeps, pending: Pending): Promise<void> {
  if (pending.reacted) return;
  try {
    await deps.figma.postReaction(job.fileKey, job.commentId, GOAT_REACTION);
  } catch (err) {
    if (waitable(err)) throw err;
    console.warn(`[figma-ask] no 🐐 on ${job.commentId}: ${messageOf(err)}`);
  }
  pending.reacted = true;
  pending.at = deps.now();
  await deps.marks.put(job.commentId, pending);
}

/** The reply the ask's turn comes to, and null to post nothing. */
async function draft(
  job: FigmaAskJob,
  comment: FigmaComment,
  rootId: string,
  comments: readonly FigmaComment[],
  deps: FigmaAskDeps,
): Promise<{ reply: string | null; said: string }> {
  const channel = deps.channel ?? NO_CHANNEL;
  const people = await deps.people();
  const slackId = slackPersonOfFigma(comment.user.id, people);
  const root = comments.find((c) => c.id === rootId) ?? comment;
  const nodeId = root.client_meta?.node_id ?? null;
  const fileUrl = figmaFileUrl(job.fileKey);
  const meta = await fileMeta(deps, job.fileKey);
  const ref: ThreadRef = { channel, thread: `figma:${job.fileKey}:${rootId}` };
  const question = askText(comment.message) || comment.message;

  // An asker the map does not know gets a public-only answer: a missing
  // Figma User ID on their row is worth the lead knowing now.
  if (!slackId) await deps.gaps?.figmaAsker(comment.user.handle);
  const delivery = figmaAskDelivery({ teammate: slackId !== null });

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
    // The thread's memory is every commenter's, so an asker Team Members does
    // not map starts with none of it: a teammate's turn read the team's estates.
    history: slackId ? await deps.threadState.readHistory(ref) : [],
    pending: null,
  });

  let outcome: TurnOutcome | null = null;
  try {
    outcome = await deps.answer(request, delivery, { unmappedAsker: slackId === null, fileKey: job.fileKey });
  } catch (err) {
    // A stop is a stop wherever it lands: the retry runs the turn again.
    if (waitable(err)) throw err;
    console.error(`[figma-ask] the turn on ${job.commentId} failed: ${messageOf(err)}`);
  }

  const asked = nodeId ? nodeUrl(job.fileKey, nodeId) : fileUrl;
  const reply = replyOf(outcome, delivery, slackId !== null, asked);
  return reply
    ? { reply: figmaReplyText(reply), said: `${reply.kind}${slackId ? "" : " (not on Team Members)"}` }
    : { reply: null, said: `nothing to say (${outcome?.disposition ?? "no outcome"})` };
}

/** The file's name; its key when Figma will not say. */
async function fileMeta(deps: FigmaAskDeps, fileKey: string): Promise<{ title: string }> {
  try {
    const { file } = await deps.figma.fileMeta(fileKey);
    return { title: file.name || fileKey };
  } catch (err) {
    if (waitable(err)) throw err;
    return { title: fileKey };
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

/**
 * The Figma turn's scope instruction: a question gets a short plain-text
 * answer citing one link; a teammate's change request is named by the write
 * its intake route takes, which is refused rather than staged, so the reply can
 * say what it would do; a stranger gets public facts and no change.
 *
 * @param teammate - Whether the asker maps to a teammate on Team Members
 */
export function askInstruction(teammate: boolean): string {
  return [
    "this ask came from a Figma comment, and the reply is posted back there as plain text.",
    "Answer a question in one to three short sentences: no lists, headings or formatting.",
    "Cite the one link that answers it; when nothing you read answers it, say so plainly rather than guess.",
    teammate
      ? [
          "No change is made from a Figma comment. For a change they ask for, call the write its intake route takes, as you would in Slack: it is not run or drafted, and the reply tells them what it would do and to ask le goat in Slack, where it is drafted for approval.",
          "Product or design, a bug in the live PLUS app included → the frame's Roadmap card when the file's name has `Card <n>` (`notion_update`, found through `roadmap_query`), else a new Roadmap card (`notion_create`);",
          "implementation in a listed plus-uno repo — the blueprint, Storybook docs, the harness, prototypes, a design-system component → that repo's GitHub issue (`github_issue_create`).",
        ].join(" ")
      : "The asker is not on Team Members: answer from public facts only, and propose no change of any kind.",
  ].join(" ");
}

/**
 * The source a reply may carry, named as the Sources box names it: the first
 * link the answer cites that a lookup of this turn returned, and that a public
 * thread may carry
 * (`threadVisibleSources`, judged with what that lookup said of who may see
 * it). A link the turn read but the answer does not cite is no source; nor is
 * one the answer cites that no lookup returned; nor the frame the ask was
 * made on, which the asker is already looking at. With no such link, a GitHub
 * file or directory the turn read whose whole repo path the answer writes out —
 * `design-system/…/Button.jsx`, as `github_read` hands it — is the source, at
 * the link that read returned.
 *
 * @param cited - The links the answer cites, in order
 * @param read - What the turn's lookups returned
 * @param asked - The frame (or the file) the ask was made on
 * @param text - The answer, for the repo paths it names
 */
export function sourceOf(cited: readonly string[], read: readonly TaskCardSource[], asked: string, text = ""): FigmaSource | null {
  for (const url of cited) {
    if (sameFigmaPlace(url, asked)) continue;
    const source = read.find((s) => sameReadLink(url, s.url));
    if (source && threadVisibleSources([source]).length) return { name: source.text, url };
  }
  const named = threadVisibleSources(read)
    .flatMap((s) => {
      const at = pathAt(text, githubPathOf(s.url));
      return at === null ? [] : [{ at, source: { name: s.text, url: s.url } }];
    })
    .sort((a, b) => a.at - b.at);
  return named[0]?.source ?? null;
}

/** The repo path a github.com file or directory link names, decoded; null for any other link. */
function githubPathOf(url: string): string | null {
  const path = linkKey(url)?.github?.pathAfterRef;
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Where `text` writes `path` out whole — not as part of a longer path — or null. */
function pathAt(text: string, path: string | null): number | null {
  if (!path) return null;
  for (let at = text.indexOf(path); at >= 0; at = text.indexOf(path, at + 1)) {
    const before = text[at - 1] ?? "";
    const after = text[at + path.length] ?? "";
    if (!/[\w/.-]/.test(before) && !/[\w/-]/.test(after) && !/^\.\w/.test(text.slice(at + path.length))) return at;
  }
  return null;
}

/**
 * Whether a cited link names what a lookup read: the same link once neither
 * carries a fragment or a trailing slash, nor a query outside Figma (where the
 * query is the frame); and a GitHub file or directory on any ref, so a cited
 * `blob/main/…#L12` is the `blob/HEAD/…` a path read returned.
 */
function sameReadLink(cited: string, read: string): boolean {
  const a = linkKey(cited);
  const b = linkKey(read);
  if (!a || !b) return cited === read;
  if (a.github && b.github) {
    return a.github.repoAndKind === b.github.repoAndKind && `/${a.github.refAndPath}`.endsWith(`/${b.github.pathAfterRef}`);
  }
  return a.key === b.key;
}

/**
 * A link as links are compared here: host without `www.`, path without a
 * trailing slash, no fragment, and the query kept only on Figma, where it
 * names the frame. Null for what is not a URL.
 */
function normalisedLink(url: string): { host: string; path: string; query: string } | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const query = /(^|\.)figma\.com$/.test(host) ? u.search : "";
  return { host, path: u.pathname.replace(/\/+$/, ""), query };
}

/**
 * What `sameReadLink` compares: the normalised link as one `key`, and for a
 * GitHub file or directory link (`github.com/<owner>/<repo>/<blob|tree>/<ref>/<path>`)
 * its parts. A link a read returned holds a one-segment ref; a cited ref may
 * hold slashes, so the cited side's `refAndPath` is matched at its end against
 * the read side's `pathAfterRef`.
 */
function linkKey(
  url: string,
): { key: string; github?: { repoAndKind: string; refAndPath: string; pathAfterRef: string } } | null {
  const link = normalisedLink(url);
  if (!link) return null;
  const key = `${link.host}${link.path}${link.query}`;
  const repo = link.host === "github.com" ? /^\/([^/]+\/[^/]+)\/(blob|tree)\/(.+)$/.exec(link.path) : null;
  if (!repo) return { key };
  const refAndPath = repo[3]!;
  return {
    key,
    github: {
      repoAndKind: `${repo[1]!.toLowerCase()}/${repo[2]}`,
      refAndPath,
      pathAfterRef: refAndPath.split("/").slice(1).join("/"),
    },
  };
}

/** Whether two links open the same Figma frame, or the same file with no frame. */
function sameFigmaPlace(a: string, b: string): boolean {
  const key = (url: string): string | null => {
    const link = normalisedLink(url);
    if (!link || !/(^|\.)figma\.com$/.test(link.host)) return null;
    const file = /^\/(?:design|file|proto)\/([A-Za-z0-9]+)/i.exec(link.path)?.[1];
    if (!file) return null;
    return `${file}:${parseFigmaUrl(url)?.nodeId ?? ""}`;
  };
  const ka = key(a);
  return ka !== null && ka === key(b);
}

/**
 * Whether the thread already holds this reply under its root. Figma hands a
 * posted message back with its label as a shortcode and `&`, `<` and `>` as
 * entities, and the drafted reply may still carry a markdown backslash escape,
 * so both sides are compared as posted, unescaped, and with their whitespace
 * collapsed.
 */
function alreadyPosted(comments: readonly FigmaComment[], rootId: string, reply: string): boolean {
  const flat = (text: string) => unescaped(asPosted(text)).replace(/\s+/g, " ").trim();
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

/** What the reply says, from what the turn came to; null for nothing. */
function replyOf(
  outcome: TurnOutcome | null,
  delivery: FigmaAskDelivery,
  teammate: boolean,
  asked: string,
): FigmaReply | null {
  // A write the turn proposed was refused: answer-only, saying what it would have done.
  const refused = delivery.refusedCard();
  if (refused) return answerOnlyReply(teammate, refused.verb);
  const answer = delivery.answer();
  if (outcome?.disposition === "answered" && answer !== null) {
    const { lines, cited } = plainAnswer(answer);
    const read = delivery.sources();
    const source = sourceOf(cited, read, asked, answer);
    // Links only, never the answer: what the next live miss needs to be told apart.
    if (!source) console.log(`[figma-ask] no source: cited=[${cited.join(" ")}] read=[${read.map((s) => s.url).join(" ")}]`);
    return { kind: "answer", lines, source };
  }
  const note = delivery.notes().at(-1);
  if (outcome?.disposition === "asked" && note) return { kind: "question", lines: plainAnswer(note).lines };
  // A "thanks" the turn only acknowledged has nothing to reply.
  if (outcome?.disposition === "reacted") return null;
  // Both models out of capacity: the plain overloaded line, as Slack says it.
  if (delivery.overloaded()) return { kind: "overloaded" };
  return { kind: "failed" };
}
