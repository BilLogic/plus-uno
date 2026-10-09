// `sweep-figma-post` — the morning's comment-decision threads in #plus-design
// (#900, #886 § 3.5), on the shared decision card (`slack/decision-cards.ts`).
//
// One thread per queued file. The morning's decisions go up as ONE message:
// the parent line naming the file and the count for its owner, then a card
// per decision, numbered, each with Review and Open comment. A file's first
// morning posts it as the thread's parent; a later morning, for a file whose
// thread is still recorded, posts it in that thread. The report's record is
// kept beside it, where each card's decision lands. Each card is its own
// proposal, staged as one item of the report (`itemProposal`):
//   • its own slot in the thread, so every decision is live at once and
//     decided on its own;
//   • 72 h, with no re-ping when it lapses;
//   • confirmers: the cards' Contributors; a file with no card, #plus-design's
//     members, read at posting time;
//   • its own words at the gate, and `refuseRevision`, which points a turn at
//     Review's Needs changes (`./revise.ts`) instead of letting it stage a
//     near-copy beside the card.
// A PRD decision with no PRD to write to is a plain reply saying so, with no
// card. The thread's record — each number's proposal — is kept so a revision
// can find it.
//
// AT MOST TEN CARDS A MORNING per file, the carousel's limit. The rest stay in
// the file's queue entry in HARNESS_KV (`./queue.ts`), the parent line says
// how many wait, and the next morning posts them in the same thread.
//
// NOTHING IS WRITTEN HERE. A card's Approve runs its one operation through the
// gate, like any card; this job posts and stages.
//
// NEVER MID-FILE. A file starts only when the budget left covers its message,
// one edit of it and every card's staging, so a budget stop cannot leave half
// a thread. A decision is marked carded as soon as it is staged, so a retried
// job never cards it twice; one that failed to stage says so on its card and
// stays queued for the next morning.
//
// PURE: every dependency arrives through `SweepDeps.figmaComments`.

import { rethrowIfBudget } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import type { PendingProposal } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import { MAX_REPORT_ITEMS, decisionReport, itemProposal, markNotStaged, reportRecord } from "../slack/decision-cards";
import { textSections } from "../slack/render";
import type { SweepRunOutcome } from "../sweep/store";
import { readMeter, recordRun, type SweepDeps, type SweepJobReport } from "../sweep/run";
import { decisionCard, decisionCardWords, decisionItem, decisionParent, decisionParentWaiting, noPrdNote, rewordInstead } from "./copy";
import { commentUrl } from "./draft";
import type { DecisionThread, QueuedDecision, QueuedFile } from "./queue";

/** How long a decision card stays confirmable. */
export const DECISION_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** Subrequests one card costs: its staging and its usage row. */
export const CARD_SUBREQUESTS = 2;
/** Subrequests a file's message costs before its cards: its post, and one edit. */
export const THREAD_SUBREQUESTS = 2;
/** A card that failed to stage says this in its place. */
export const NOT_STAGED = "Didn't go through, so it's queued again for tomorrow morning.";

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
    const cardable = waiting.filter((d) => d.operation);
    const told = waiting.filter((d) => !d.operation);
    const showing = Math.min(cardable.length, MAX_REPORT_ITEMS);
    if (deps.dryRun) {
      posted.push({ ...file, decisions: [...cardable.slice(0, showing), ...told] });
      cards += showing;
      continue;
    }
    let confirmers = file.confirmers;
    // The message and its edit, its record, each card's stage and usage row,
    // each note's post, and #plus-design's members when needed: a file starts
    // only when all of it fits, so a stop never lands mid-file.
    const need = THREAD_SUBREQUESTS + showing * CARD_SUBREQUESTS + told.length + (confirmers.length || members ? 0 : 1);
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

    const opened = await postReport(deps, file, confirmers, cardable, told.length);
    if (!opened) {
      notes.push(`the thread for ${file.fileKey} did not post, so it waits for tomorrow`);
      continue;
    }
    const { thread, ts, shown, kept } = opened;
    const carded: string[] = [];
    const markCarded = async (id: string) => {
      carded.push(id);
      // At once, so a stop after this never cards it again, and a reply
      // naming its number finds it.
      await fc.carded.add([id]);
      await threads.write(thread);
    };

    const failed: string[] = [];
    for (const { n, d } of shown) {
      const item = { messageTs: ts, id: d.commentId };
      if (!kept || !(await stageDecision(deps, thread, item, n, d))) {
        failed.push(d.commentId);
        continue;
      }
      thread.decisions.push({ n, commentId: d.commentId, proposalKey: itemProposal(ts, d.commentId).proposalTs, decision: d });
      cards += 1;
      await markCarded(d.commentId);
    }
    if (failed.length) await markFailed(deps, file, thread, ts, failed);
    for (const d of told) {
      const sent = await slack.post({ text: noPrdNote(d, commentUrl(thread.fileKey, d.nodeId, d.commentId)), thread_ts: thread.ts });
      if (sent.ok) await markCarded(d.commentId);
    }

    const unposted = waiting.filter((d) => !carded.includes(d.commentId));
    if (failed.length) notes.push(`${failed.length} decision(s) on ${file.fileKey} did not go through and wait for tomorrow`);
    if (unposted.length) {
      await fc.queue.write({ ...file, decisions: unposted, threadTs: thread.ts });
    } else {
      await fc.queue.remove(file.fileKey);
    }
    posted.push({ ...file, decisions: waiting.filter((d) => carded.includes(d.commentId)) });
  }
  return finish("handled", notes.length ? notes.join("; ") : null);
}

/**
 * The morning's message for a file — the parent line and its cards — posted
 * as the thread's parent, or, for a file whose thread an earlier morning
 * opened, in that thread with its window renewed; and its record kept, where
 * each card's decision lands. The thread is recorded at once, on its record
 * and on the queued file, so a retry posts in it rather than opening a
 * second. Null when the message did not post; `kept` false when its record
 * could not be kept, so no card can be staged.
 *
 * @param cardable - Every decision with a write, oldest first: the first ten
 *   go up, numbered after every card the thread has shown, and the parent
 *   line counts them all
 * @param notes - Decisions said as plain replies, counted only when there is
 *   nothing to card
 */
async function postReport(
  deps: SweepDeps,
  file: QueuedFile,
  confirmers: string[],
  cardable: QueuedDecision[],
  notes: number,
): Promise<{ thread: DecisionThread; ts: string; shown: Array<{ n: number; d: QueuedDecision }>; kept: boolean } | null> {
  const fc = deps.figmaComments!;
  const slack = fc.slack!;
  const threads = fc.threads!;
  const expiresAt = deps.now() + DECISION_CARD_TTL_MS;
  const open = file.threadTs ? await threads.read(file.threadTs) : null;
  const known = open && open.channel === slack.channel ? open : null;
  const base = known ? (known.numbered ?? known.decisions.length) : 0;
  const items = cardable.map((d, i) => decisionItem(base + i + 1, d, commentUrl(file.fileKey, d.nodeId, d.commentId)));
  const report = decisionReport(items, decisionParent(file, cardable.length || notes));
  const sent = await slack.post({ text: report.text, blocks: report.blocks, ...(known ? { thread_ts: known.ts } : {}) });
  if (!sent.ok || !sent.ts) return null;
  const thread: DecisionThread = known
    ? { ...known, confirmers, expiresAt, numbered: base + report.shown.length }
    : { channel: slack.channel, ts: sent.ts, fileKey: file.fileKey, title: file.title, confirmers, expiresAt, decisions: [], numbered: report.shown.length };
  await threads.write(thread);
  if (!known) await fc.queue.write({ ...file, threadTs: sent.ts });
  const kept = await slack.reports.putReport(reportRecord(slack.channel, sent.ts, report, DECISION_CARD_TTL_MS)).then(
    () => true,
    (err: unknown) => {
      rethrowIfBudget(err);
      console.error(`[figma-comments] the report for ${file.fileKey} posted but its record was not kept: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    },
  );
  return { thread, ts: sent.ts, shown: report.shown.map((_, i) => ({ n: base + i + 1, d: cardable[i]! })), kept };
}

/**
 * Cards that showed and did not stage say so, with nothing to review. A
 * message none of whose cards staged, in a thread with none either, is cut
 * back to a line saying they'll post tomorrow, and the next morning numbers
 * from 1 again.
 */
async function markFailed(deps: SweepDeps, file: QueuedFile, thread: DecisionThread, ts: string, failed: string[]): Promise<void> {
  const slack = deps.figmaComments!.slack!;
  const marked = thread.decisions.length ? await markNotStaged(slack.reports, ts, failed, NOT_STAGED).catch(() => null) : null;
  if (marked) {
    await slack.edit(ts, marked).catch(() => {});
    return;
  }
  const waiting = decisionParentWaiting(file);
  await slack.edit(ts, { text: waiting, blocks: textSections(waiting) }).catch(() => {});
  thread.numbered = thread.decisions.length;
  await deps.figmaComments!.threads!.write(thread);
}

/** Stage one decision's card; whether it went through. */
async function stageDecision(deps: SweepDeps, thread: DecisionThread, item: { messageTs: string; id: string }, n: number, d: QueuedDecision): Promise<boolean> {
  try {
    await deps.figmaComments!.slack!.stage(stagedDecision(thread, item, n, d, Math.max(thread.expiresAt - deps.now(), 0)));
    return true;
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[figma-comments] decision ${d.commentId} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/**
 * A decision card as ThreadState stages it: one item of its report. Also
 * what a reworded revision stages, under its new entry id, with the time its
 * thread has left.
 *
 * @param thread - The file's thread
 * @param item - Its report's message and its entry id
 * @param n - Its number in the thread
 * @param d - A decision with an operation
 * @param ttlMs - How long it stays confirmable
 */
export function stagedDecision(
  thread: DecisionThread,
  item: { messageTs: string; id: string },
  n: number,
  d: QueuedDecision,
  ttlMs: number,
): PendingProposal {
  const operation = d.operation!;
  return {
    operations: [operation],
    toolName: operation.toolName,
    input: operation.input,
    channel: thread.channel,
    threadTs: thread.ts,
    replyTs: thread.ts,
    ...itemProposal(item.messageTs, item.id),
    // The decision's whole text, which Review shows.
    proposalText: renderProposalCard(decisionCard(n, d, commentUrl(thread.fileKey, d.nodeId, d.commentId))).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs,
    confirmers: [...thread.confirmers],
    stated: decisionCardWords(),
    refuseRevision: rewordInstead(n),
  };
}
