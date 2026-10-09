// `sweep-figma-post` — the morning's comment-decision threads in #plus-design
// (#900, #886 § 3.5).
//
// One thread per queued file: a parent naming the file and the count, asking
// its owner once, then one reply per decision, numbered, each a `stated` card
// with the Review button, staged on its own:
//   • its own slot in the thread (`supersedeKey` `figma-decision:<root id>`),
//     so the thread holds every decision's card at once and each is decided on
//     its own message;
//   • 72 h, with no re-ping when it lapses;
//   • confirmers: the cards' Contributors; a file with no card, #plus-design's
//     members, read at posting time;
//   • its own words at the gate, and `refuseRevision`, which points a turn at
//     Review's Needs changes (`./revise.ts`) instead of letting it stage a
//     near-copy beside the card.
// A PRD decision with no PRD to write to is a plain reply saying so, with no
// card. The thread's record — each number's card — is kept so a revision can
// find it.
//
// NOTHING IS WRITTEN HERE. A card's ✅ runs its one operation through the gate,
// like any card; this job posts and stages.
//
// NEVER MID-FILE. A file starts only when the budget left covers its parent
// and every card at `CARD_SUBREQUESTS` each, so a budget stop cannot leave
// half a thread. A decision is marked carded as soon as it is staged, so a
// retried job never cards it twice; one that failed to post or stage stays
// queued for the next morning. The parent is recorded the moment it posts, so
// that morning posts in it rather than opening a second, and a parent none of
// whose cards went up says so until then.
//
// PURE: every dependency arrives through `SweepDeps.figmaComments`.

import { rethrowIfBudget } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import type { PendingProposal } from "../thread-state/index";
import { ownBlocksOf, renderProposalCard } from "../slack/proposal-render";
import type { SweepRunOutcome } from "../sweep/store";
import { readMeter, recordRun, type SweepDeps, type SweepJobReport } from "../sweep/run";
import { decisionCard, decisionCardBlocks, decisionCardWords, decisionParent, decisionParentWaiting, noPrdNote, rewordInstead } from "./copy";
import { commentUrl } from "./draft";
import type { DecisionThread, QueuedDecision, QueuedFile } from "./queue";

/** How long a decision card stays confirmable. */
export const DECISION_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** Each decision card's slot key starts with this, then its root comment's id. */
export const DECISION_KEY_PREFIX = "figma-decision:";
/** Subrequests one card costs: its post, its staging and its usage row. */
export const CARD_SUBREQUESTS = 3;
/** Subrequests a thread costs before its cards: the parent's post, or its edit. */
export const THREAD_SUBREQUESTS = 1;
/** The card that failed to stage says this in its place. */
export const NOT_STAGED = "This decision didn't go through, so it's queued again for tomorrow morning.";

/**
 * The morning's comment-decision threads.
 *
 * @param job - The `sweep-figma-post` job
 * @param deps - The sweep's dependencies, with `figmaComments` and its Slack side bound
 */
export async function postFigmaDecisions(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const posted: QueuedFile[] = [];
  const notes: string[] = [];
  let cards = 0;
  const finish = async (outcome: SweepRunOutcome, note: string | null): Promise<SweepJobReport> => {
    await recordRun(deps, {
      runName: "morning",
      jobKey: job.key,
      channels: deps.figmaComments?.slack ? [deps.figmaComments.slack.channel] : [],
      threads: posted.length,
      items: cards,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const verb = deps.dryRun ? "would post" : "posted";
    const counted = `${verb} ${posted.length} Figma decision thread(s), ${cards} card(s)`;
    const summary = note ? `${counted} — ${note}` : counted;
    return { kind: "sweep-figma-post", key: job.key, outcome, note, threads: posted.length, findings: [], cards: [], figmaFiles: posted, summary };
  };

  const fc = deps.figmaComments;
  if (!fc?.slack || !fc.threads) return finish("skipped", "the Figma decision post is not wired");
  const slack = fc.slack;
  const threads = fc.threads;
  const queued = (await fc.queue.list()).sort((a, b) => a.foundAt - b.foundAt);
  if (!queued.length) return finish("handled", null);

  let members: string[] | null | undefined;
  for (const file of queued) {
    const waiting: QueuedDecision[] = [];
    for (const d of file.decisions) if (!(await fc.carded.has(d.commentId))) waiting.push(d);
    if (!waiting.length) {
      if (!deps.dryRun) await fc.queue.remove(file.fileKey);
      continue;
    }
    if (deps.dryRun) {
      posted.push({ ...file, decisions: waiting });
      cards += waiting.filter((d) => d.operation).length;
      continue;
    }
    const cardable = waiting.filter((d) => d.operation);
    const told = waiting.filter((d) => !d.operation);
    let confirmers = file.confirmers;
    // The parent or its edit, each card's post, stage and usage row, each
    // note's post, and #plus-design's members when needed: a file starts only
    // when all of it fits, so a stop never lands mid-file.
    const need = THREAD_SUBREQUESTS + cardable.length * CARD_SUBREQUESTS + told.length + (confirmers.length || members ? 0 : 1);
    const left = deps.meter?.headroom().subrequests ?? Number.POSITIVE_INFINITY;
    if (left < need) {
      notes.push(`the budget left could not post a whole thread, so ${queued.length - posted.length} file(s) wait for tomorrow`);
      break;
    }
    if (!confirmers.length) {
      members ??= await slack.members();
      if (!members?.length) {
        notes.push(`#plus-design's members could not be read, so ${file.fileKey} waits for tomorrow`);
        continue;
      }
      confirmers = members;
    }

    const thread = await openThread(deps, file, confirmers, waiting.length);
    if (!thread) {
      notes.push(`the thread for ${file.fileKey} did not post, so it waits for tomorrow`);
      continue;
    }
    const carded: string[] = [];
    const markCarded = async (id: string) => {
      carded.push(id);
      // At once, so a stop after this never cards it again, and a reply
      // naming its number finds it.
      await fc.carded.add([id]);
      await threads.write(thread);
    };
    for (const d of told) {
      const sent = await slack.post({ text: noPrdNote(d, commentUrl(thread.fileKey, d.nodeId, d.commentId)), thread_ts: thread.ts });
      if (sent.ok) await markCarded(d.commentId);
    }
    let up = 0;
    for (const d of cardable) {
      // Numbered by the cards that went up, so a card that failed leaves no gap.
      const n = thread.decisions.length + 1;
      const staged = await postDecision(deps, thread, n, d);
      if (!staged) continue;
      thread.decisions.push({ n, commentId: d.commentId, cardTs: staged, decision: d });
      cards += 1;
      up += 1;
      await markCarded(d.commentId);
    }
    if (cardable.length && !up && !thread.decisions.length) {
      // A parent with no card under it says so, and the next morning posts in it.
      await slack.edit(thread.ts, { text: decisionParentWaiting(file) }).catch(() => {});
    }
    const unposted = waiting.filter((d) => !carded.includes(d.commentId));
    if (unposted.length) {
      notes.push(`${unposted.length} decision(s) on ${file.fileKey} did not go through and wait for tomorrow`);
      await fc.queue.write({ ...file, decisions: unposted, threadTs: thread.ts });
    } else {
      await fc.queue.remove(file.fileKey);
    }
    posted.push({ ...file, decisions: waiting.filter((d) => carded.includes(d.commentId)) });
  }
  return finish("handled", notes.length ? notes.join("; ") : null);
}

/**
 * The file's thread: the one an earlier morning opened and could not finish,
 * its parent edited to the count and its window renewed; else a new parent,
 * recorded at once — on the thread's record and on the queued file — so a
 * retry posts in it rather than opening a second. Null when the parent did
 * not post.
 */
async function openThread(deps: SweepDeps, file: QueuedFile, confirmers: string[], waiting: number): Promise<DecisionThread | null> {
  const fc = deps.figmaComments!;
  const slack = fc.slack!;
  const threads = fc.threads!;
  const expiresAt = deps.now() + DECISION_CARD_TTL_MS;
  const open = file.threadTs ? await threads.read(file.threadTs) : null;
  if (open && open.channel === slack.channel) {
    const thread: DecisionThread = { ...open, confirmers, expiresAt };
    await slack.edit(thread.ts, { text: decisionParent(file, thread.decisions.length + waiting) }).catch(() => {});
    await threads.write(thread);
    return thread;
  }
  const parent = await slack.post({ text: decisionParent(file, waiting) });
  if (!parent.ok || !parent.ts) return null;
  const thread: DecisionThread = { channel: slack.channel, ts: parent.ts, fileKey: file.fileKey, title: file.title, confirmers, expiresAt, decisions: [] };
  await threads.write(thread);
  await fc.queue.write({ ...file, threadTs: parent.ts });
  return thread;
}

/** Post one decision's card in its thread and stage it; its ts, or null when it did not go through. */
async function postDecision(deps: SweepDeps, thread: DecisionThread, n: number, d: QueuedDecision): Promise<string | null> {
  const slack = deps.figmaComments!.slack!;
  const link = commentUrl(thread.fileKey, d.nodeId, d.commentId);
  const card = renderProposalCard(decisionCard(n, d, link));
  const blocks = decisionCardBlocks(n, d, link, card.text);
  const sent = await slack.post({ text: card.text, blocks, thread_ts: thread.ts });
  if (!sent.ok || !sent.ts) return null;
  try {
    await slack.stage(stagedDecision(thread, sent.ts, { text: card.text, blocks }, n, d, Math.max(thread.expiresAt - deps.now(), 0)));
    return sent.ts;
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[figma-comments] decision ${d.commentId} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
    await slack.edit(sent.ts, { text: NOT_STAGED }).catch(() => {});
    return null;
  }
}

/**
 * A decision card as ThreadState stages it. Also what a reworded revision
 * stages, in the same slot, with the time its thread has left.
 *
 * @param thread - The file's thread
 * @param ts - The card's own message
 * @param card - What the card says, whole, and the blocks the thread shows
 * @param n - Its number in the thread
 * @param d - A decision with an operation
 * @param ttlMs - How long it stays confirmable
 */
export function stagedDecision(
  thread: DecisionThread,
  ts: string,
  card: { text: string; blocks: unknown[] },
  n: number,
  d: QueuedDecision,
  ttlMs: number,
): PendingProposal {
  const operation = d.operation!;
  const own = ownBlocksOf(card);
  return {
    operations: [operation],
    toolName: operation.toolName,
    input: operation.input,
    channel: thread.channel,
    threadTs: thread.ts,
    replyTs: thread.ts,
    userMsgTs: ts,
    proposalTs: ts,
    proposalText: card.text,
    // A long card's thread blocks are a cut of its text: kept, so the card
    // re-renders as posted once it is decided.
    ...(own ? { proposalBlocks: own } : {}),
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs,
    confirmers: [...thread.confirmers],
    supersedeKey: `${DECISION_KEY_PREFIX}${d.commentId}`,
    stated: decisionCardWords(),
    refuseRevision: rewordInstead(n),
  };
}
