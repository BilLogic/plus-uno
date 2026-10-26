// `sweep-figma-post` — the morning's comment decisions, handed to the sweep's
// one message in the place the posting ladder names (`../destination/`) as a
// section of it (`../sweep/sections.ts`), on the shared decision card
// (`slack/decision-cards.ts`).
//
// THE HAND-OVER, before the sweep's post: every queued file's decisions not
// yet carded, with who may decide each file's, go into the morning run's
// storage for the top of the file's place — its cards' team channel, else
// its Figma team's, else #plus-design. It posts nothing: a channel gets one
// message a morning. Then the questions nobody answered (`./triage.ts`) are
// handed over the same way.
//
// THE SECTION, on that message: a line per file for its owner — the card's
// design owner, tagged once in the opener when still active on Team Members,
// else nobody, never a Figma handle (#1361) — then a card per decision,
// numbered across the message, each with Review and Open comment, sharing the carousel's ten with the other sections
// and the sweep's fixes. Once the message is up, each card it showed is its
// own proposal, staged as one item of the message (`itemProposal`):
//   • its own slot, so every decision is live at once and decided on its own;
//   • 24 weekday hours (`cardExpiresAt`), with no re-ping when it lapses;
//   • confirmers: its file's cards' Contributors still active; a file with
//     no card, or none active, its place's members, read at the hand-over;
//   • its own words at the gate, and `refuseRevision`, which points a turn at
//     Review's Needs changes (`./revise.ts`) instead of letting it stage a
//     near-copy beside the card.
// A PRD decision with no PRD to write to has a line in the opener and a plain
// reply in the message's thread saying so, with no card — at most
// `MAX_NO_PRD_REPLIES` a morning; the rest stay queued for the next. The message's thread
// record — each number's proposal, and its file — is kept so a revision can
// find it.
//
// WHAT DOES NOT SHOW waits in the file's queue entry in HARNESS_KV
// (`./queue.ts`) for the next morning's message, and so does a card that
// showed and did not stage, which says so on the message.
//
// THEN THE QUESTIONS. Once the threads are posted, any Figma question nobody
// answered in two workdays is raised once through the posting ladder
// (`./triage.ts`), on the budget the threads left.
//
// NOTHING IS WRITTEN HERE. A card's Approve runs its one operation through the
// gate, like any card; this job hands over, and its section stages.
//
// PURE: every dependency arrives through `SweepDeps.figmaComments`.

import { rethrowIfBudget } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import type { PendingProposal } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import { itemProposal, markNotStaged } from "../slack/decision-cards";
import { escapeSlackText } from "../slack/mrkdwn";
import type { SweepRunOutcome } from "../sweep/store";
import { readMeter, recordRun, type SweepDeps, type SweepJobReport } from "../sweep/run";
import { handedSection, type SweepSection } from "../sweep/sections";
import { decisionCard, decisionCardWords, decisionItem, decisionParent, noPrdLine, noPrdNote, rewordInstead } from "./copy";
import { commentUrl } from "./draft";
import { handOverUnanswered } from "./triage";
import { resolveDestination, routeFinding, teamNamed } from "../destination/index";
import { activeOwner, operationsOf, type DecisionFile, type FileOwner, type QueuedDecision, type QueuedFile, type SweepFigmaComments } from "./queue";
import { activeAmong } from "../usage/roles";
import { cardTtlMs } from "../card-expiry";

/** A card that failed to stage says this in its place. */
export const NOT_STAGED = "Didn't go through, so it's queued again for tomorrow morning.";
/** The section's name on the sweep's morning post. */
export const FIGMA_DECISIONS_SECTION = "figma-decisions";
/** How many no-PRD replies one morning's message makes in its thread: each
 *  is a Slack post, so the rest wait in their file's queue entry. */
export const MAX_NO_PRD_REPLIES = 5;

/** One file's decisions, as the hand-over leaves them for the morning's message. */
export interface HandedFile extends DecisionFile {
  url: string;
  owner: FileOwner | null;
  /** Decisions with a write, oldest first: each a card. */
  cardable: QueuedDecision[];
  /** PRD decisions with no PRD: each a line and a reply, no card. */
  told: QueuedDecision[];
}

/** What the hand-over leaves for a place's top. */
export interface FigmaDecisionsHanded {
  files: HandedFile[];
}

/**
 * The morning's hand-over of the queued comment decisions.
 *
 * @param job - The `sweep-figma-post` job
 * @param deps - The sweep's dependencies, with `figmaComments` and its Slack side bound
 */
export async function postFigmaDecisions(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const handed: QueuedFile[] = [];
  const notes: string[] = [];
  /** The channels the morning's decisions were handed to. */
  const places = new Set<string>();
  let cards = 0;
  const finish = async (outcome: SweepRunOutcome, decided: string | null): Promise<SweepJobReport> => {
    // Then the questions nobody answered, on what budget the decisions left.
    const fcNow = deps.figmaComments;
    const triage = fcNow?.triage
      ? await handOverUnanswered(fcNow.figma, fcNow.triage, {
          now: deps.now(),
          date: deps.runDate,
          ...(fcNow.questionsHandOff ? { handOff: fcNow.questionsHandOff } : {}),
          ...(deps.dryRun ? { dryRun: true } : {}),
          ...(deps.meter ? { meter: deps.meter } : {}),
        })
      : null;
    const said = [decided, ...(triage?.notes ?? [])].filter((n): n is string => !!n);
    const note = said.length ? said.join("; ") : null;
    await recordRun(deps, {
      runName: "morning",
      jobKey: job.key,
      channels: places.size ? [...places] : deps.figmaComments?.slack ? [deps.figmaComments.slack.channel] : [],
      threads: handed.length,
      items: cards,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const verb = deps.dryRun || !deps.figmaComments?.handOff ? "would hand" : "handed";
    const raised = triage ? `, ${verb} ${triage.raised} unanswered Figma question(s)` : "";
    const counted = `${verb} ${cards} Figma decision card(s) on ${handed.length} file(s) to the morning post${raised}`;
    const summary = note ? `${counted} — ${note}` : counted;
    return { kind: "sweep-figma-post", key: job.key, outcome, note, threads: handed.length, findings: [], cards: [], figmaFiles: handed, summary };
  };

  const fc = deps.figmaComments;
  if (!fc?.slack || !fc.threads) return finish("skipped", "the Figma decision post is not wired");
  const slack = fc.slack;
  const queued = (await fc.queue.list()).sort((a, b) => a.foundAt - b.foundAt);
  if (!queued.length) return finish("handled", null);

  const members = new Map<string, Promise<string[] | null>>();
  // Who is active this morning: an owner or confirmer queued days earlier is
  // checked again, and one who has left since is dropped.
  const active = await deps.people.active();
  let replies = MAX_NO_PRD_REPLIES;
  const byPlace = new Map<string, HandedFile[]>();
  for (const file of queued) {
    const waiting: QueuedDecision[] = [];
    for (const d of file.decisions) if (!(await fc.carded.has(d.commentId))) waiting.push(d);
    if (!waiting.length) {
      if (!deps.dryRun) await fc.queue.remove(file.fileKey);
      continue;
    }
    const channel = await placeOfFile(fc, file);
    if (!channel) {
      notes.push(`the channel the posting ladder names for ${file.fileKey} is not configured, so it waits`);
      continue;
    }
    const owner = activeOwner(file.owner, active);
    let confirmers = activeAmong(file.confirmers, active);
    if (!confirmers.length) {
      if (!members.has(channel)) members.set(channel, slack.members(channel));
      const read = await members.get(channel)!;
      if (!read?.length) {
        notes.push(`${channel}'s members could not be read, so ${file.fileKey} waits for tomorrow`);
        continue;
      }
      confirmers = read;
    }
    const cardable = waiting.filter((d) => operationsOf(d).length);
    // Past the morning's replies, a no-PRD decision waits in the queue.
    const told = waiting.filter((d) => !operationsOf(d).length).slice(0, replies);
    replies -= told.length;
    if (!cardable.length && !told.length) continue;
    byPlace.set(channel, [...(byPlace.get(channel) ?? []), { fileKey: file.fileKey, title: file.title, url: file.url, owner, confirmers, cardable, told }]);
    handed.push({ ...file, decisions: waiting });
    cards += cardable.length;
  }
  for (const [channel, files] of byPlace) {
    places.add(channel);
    if (!deps.dryRun && fc.handOff) await fc.handOff.put(deps.runDate, { channel, threadTs: null }, { files });
  }
  return finish("handled", notes.length ? notes.join("; ") : null);
}

/**
 * The channel a file's decisions go to: the posting ladder's, read with its
 * cards' Product Pillar and, when none of them has a channel, the file's Figma
 * team. Null when that channel is not configured.
 *
 * @param fc - The comment jobs' ports
 * @param file - A queued file
 */
async function placeOfFile(fc: SweepFigmaComments, file: QueuedFile): Promise<string | null> {
  const pillars = file.pillars ?? [];
  // The file's team is read only when no card pillar has a channel: then it decides.
  const team = pillars.some((p) => teamNamed(p)) ? null : ((await fc.triage?.fileTeam(file.fileKey)) ?? null);
  const { destination } = routeFinding({ evidence: null, card: pillars.length ? { pillars } : null, figmaFile: { team } });
  return resolveDestination(destination, fc.slack?.channels ?? { plusDesign: fc.slack?.channel })?.channel ?? null;
}

/** Every card of a hand-over, numbered across the message in file order. */
function numbered(value: FigmaDecisionsHanded): Array<{ n: number; file: HandedFile; d: QueuedDecision }> {
  let n = 0;
  return value.files.flatMap((file) => file.cardable.map((d) => ({ n: (n += 1), file, d })));
}

/**
 * The comment decisions as a section of the sweep's morning message in
 * each place it was handed to, or undefined when the hand-off, the Slack side or the
 * thread records are not wired.
 *
 * @param fc - The comment jobs' ports
 * @param date - The morning's date
 * @param now - The clock
 */
export function figmaDecisionsSection(fc: SweepFigmaComments, date: string, now: () => number): SweepSection | undefined {
  const { handOff, slack, threads } = fc;
  if (!handOff || !slack || !threads) return undefined;
  return handedSection<FigmaDecisionsHanded>({
    source: FIGMA_DECISIONS_SECTION,
    date,
    handOff,
    cardsOf(value) {
      const all = numbered(value);
      const told = value.files.flatMap((f) => (f.told.length ? [noPrdLine(f, f.told.length)] : []));
      return {
        // One queue for the round-robin, so the numbers that show run on.
        cards: all.map(({ n, file, d }) => ({ person: null, item: decisionItem(n, d, commentUrl(file.fileKey, d.nodeId, d.commentId), file.owner) })),
        ...(told.length ? { lines: told } : {}),
        // Each told decision's reply, an edit when a card did not stage, and
        // each card that shows, a staging.
        cost: (shown) => ({ subrequests: value.files.reduce((sum, f) => sum + f.told.length, 0) + 1, d1Queries: shown.length * 3 }),
        says(ids) {
          return value.files
            .flatMap((file) => {
              const count = all.filter((e) => e.file === file && ids.includes(e.d.commentId)).length;
              return count ? [decisionParent(file, count)] : [];
            })
            .join(" ");
        },
      };
    },
    async posted(value, place, shown, report, progress) {
      const ts = report.ts;
      const all = numbered(value);
      const showing = all.filter((e) => shown.includes(e.d.commentId));
      const [first] = value.files;
      const ttlMs = cardTtlMs(now());
      const thread = {
        channel: place.channel,
        ts,
        fileKey: first!.fileKey,
        title: first!.title,
        confirmers: first!.confirmers,
        expiresAt: now() + ttlMs,
        decisions: [] as Array<{ n: number; commentId: string; proposalKey: string; decision: QueuedDecision; file: DecisionFile }>,
        numbered: showing.length,
      };
      if (showing.length) await threads.write(thread);
      const done = new Set<string>();
      const failed: string[] = [];
      for (const { n, file, d } of showing) {
        const at = { channel: place.channel, ts };
        const asFile: DecisionFile = { fileKey: file.fileKey, title: file.title, confirmers: file.confirmers };
        const before = progress.done.get(d.commentId);
        if (before === false) failed.push(d.commentId);
        if (before === undefined) {
          try {
            await slack.stage(stagedDecision(at, asFile, { messageTs: ts, id: d.commentId }, n, d, ttlMs));
          } catch (err) {
            rethrowIfBudget(err);
            console.error(`[figma-comments] decision ${d.commentId} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
            failed.push(d.commentId);
            await progress.mark(d.commentId, false);
            continue;
          }
          await progress.mark(d.commentId, true);
        }
        if (before === false) continue;
        thread.decisions.push({ n, commentId: d.commentId, proposalKey: itemProposal(ts, d.commentId).proposalTs, decision: d, file: asFile });
        done.add(d.commentId);
        // At once, so a stop after this never cards it again, and a reply
        // naming its number finds it.
        await fc.carded.add([d.commentId]);
        await threads.write(thread);
      }
      if (failed.length) {
        const marked = await markNotStaged(slack.reports, ts, failed, NOT_STAGED).catch(() => null);
        if (marked) await slack.edit(ts, marked, place.channel).catch(() => {});
      }
      for (const file of value.files) {
        for (const d of file.told) {
          const before = progress.done.get(d.commentId);
          if (before === undefined) {
            const sent = await slack.post({ channel: place.channel, text: noPrdNote(d, commentUrl(file.fileKey, d.nodeId, d.commentId)), thread_ts: ts });
            await progress.mark(d.commentId, sent.ok);
            if (!sent.ok) continue;
          } else if (!before) continue;
          done.add(d.commentId);
          await fc.carded.add([d.commentId]);
        }
      }
      // What did not show, or did not stage, waits in its file's queue entry.
      for (const file of value.files) {
        const queued = await fc.queue.read(file.fileKey);
        if (!queued) continue;
        const rest = queued.decisions.filter((d) => !done.has(d.commentId));
        if (rest.length) await fc.queue.write({ ...queued, decisions: rest });
        else await fc.queue.remove(file.fileKey);
      }
    },
    async notPosted(_value, _place, why) {
      // Every decision is still queued: the next morning hands it over again.
      console.error(`[figma-comments] the morning message did not carry the decisions (${why}) — queued for tomorrow`);
    },
  });
}

/**
 * A decision card as ThreadState stages it: one item of its message. Also
 * what a reworded revision stages, under its new entry id, with the time its
 * thread has left.
 *
 * @param at - The message's channel and ts: the thread
 * @param file - Its file, and who may decide it
 * @param item - Its message and its entry id
 * @param n - Its number in the message
 * @param d - A decision with an operation or a row
 * @param ttlMs - How long it stays confirmable
 */
export function stagedDecision(
  at: { channel: string; ts: string },
  file: DecisionFile,
  item: { messageTs: string; id: string },
  n: number,
  d: QueuedDecision,
  ttlMs: number,
): PendingProposal {
  const operations = operationsOf(d);
  const [first] = operations;
  return {
    operations,
    toolName: first!.toolName,
    input: first!.input,
    channel: at.channel,
    threadTs: at.ts,
    replyTs: at.ts,
    ...itemProposal(item.messageTs, item.id),
    // The decision's whole text, which Review shows.
    proposalText: renderProposalCard(decisionCard(n, d, commentUrl(file.fileKey, d.nodeId, d.commentId))).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs,
    confirmers: [...file.confirmers],
    stated: decisionCardWords(),
    refuseRevision: rewordInstead(n),
    // Review's Issue, beside what the change replaces.
    ...(d.before ? { before: d.before, issue: `Decided in a Figma comment: ${escapeSlackText(d.decision)}` } : {}),
  };
}
