// `sweep-figma-post` — the morning's comment decisions, handed to the sweep's
// one message in #plus-design as a section of it (`../sweep/sections.ts`), on
// the shared decision card (`slack/decision-cards.ts`).
//
// THE HAND-OVER, before the sweep's post: every queued file's decisions not
// yet carded, with who may decide each file's, go into the morning run's
// storage for #plus-design's top. It posts nothing: the channel gets one
// message a morning.
//
// THE SECTION, on that message: a line per file for its owner — the card's
// design owner tagged once in the opener, or the file's creator by Figma
// handle — then a card per decision, numbered across the message, each with
// Review and Open comment, sharing the carousel's ten with the other sections
// and the sweep's fixes. Once the message is up, each card it showed is its
// own proposal, staged as one item of the message (`itemProposal`):
//   • its own slot, so every decision is live at once and decided on its own;
//   • 72 h, with no re-ping when it lapses;
//   • confirmers: its file's cards' Contributors; a file with no card,
//     #plus-design's members, read at the hand-over;
//   • its own words at the gate, and `refuseRevision`, which points a turn at
//     Review's Needs changes (`./revise.ts`) instead of letting it stage a
//     near-copy beside the card.
// A PRD decision with no PRD to write to has a line in the opener and a plain
// reply in the message's thread saying so, with no card. The message's thread
// record — each number's proposal, and its file — is kept so a revision can
// find it.
//
// WHAT DOES NOT SHOW waits in the file's queue entry in HARNESS_KV
// (`./queue.ts`) for the next morning's message, and so does a card that
// showed and did not stage, which says so on the message.
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
import { operationsOf, type DecisionFile, type FileOwner, type QueuedDecision, type QueuedFile, type SweepFigmaComments } from "./queue";

/** How long a decision card stays confirmable. */
export const DECISION_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** A card that failed to stage says this in its place. */
export const NOT_STAGED = "Didn't go through, so it's queued again for tomorrow morning.";
/** The section's name on the sweep's morning post. */
export const FIGMA_DECISIONS_SECTION = "figma-decisions";

/** One file's decisions, as the hand-over leaves them for the morning's message. */
export interface HandedFile extends DecisionFile {
  url: string;
  owner: FileOwner | null;
  /** Decisions with a write, oldest first: each a card. */
  cardable: QueuedDecision[];
  /** PRD decisions with no PRD: each a line and a reply, no card. */
  told: QueuedDecision[];
}

/** What the hand-over leaves for #plus-design's top. */
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
  let cards = 0;
  const finish = async (outcome: SweepRunOutcome, note: string | null): Promise<SweepJobReport> => {
    await recordRun(deps, {
      runName: "morning",
      jobKey: job.key,
      channels: deps.figmaComments?.slack ? [deps.figmaComments.slack.channel] : [],
      threads: handed.length,
      items: cards,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const verb = deps.dryRun || !deps.figmaComments?.handOff ? "would hand" : "handed";
    const counted = `${verb} ${cards} Figma decision card(s) on ${handed.length} file(s) to the morning post`;
    const summary = note ? `${counted} — ${note}` : counted;
    return { kind: "sweep-figma-post", key: job.key, outcome, note, threads: handed.length, findings: [], cards: [], figmaFiles: handed, summary };
  };

  const fc = deps.figmaComments;
  if (!fc?.slack || !fc.threads) return finish("skipped", "the Figma decision post is not wired");
  const slack = fc.slack;
  const queued = (await fc.queue.list()).sort((a, b) => a.foundAt - b.foundAt);
  if (!queued.length) return finish("handled", null);

  let members: string[] | null | undefined;
  const files: HandedFile[] = [];
  for (const file of queued) {
    const waiting: QueuedDecision[] = [];
    for (const d of file.decisions) if (!(await fc.carded.has(d.commentId))) waiting.push(d);
    if (!waiting.length) {
      if (!deps.dryRun) await fc.queue.remove(file.fileKey);
      continue;
    }
    let confirmers = file.confirmers;
    if (!confirmers.length) {
      members ??= await slack.members();
      if (!members?.length) {
        notes.push(`#plus-design's members could not be read, so ${file.fileKey} waits for tomorrow`);
        continue;
      }
      confirmers = members;
    }
    const cardable = waiting.filter((d) => operationsOf(d).length);
    const told = waiting.filter((d) => !operationsOf(d).length);
    files.push({ fileKey: file.fileKey, title: file.title, url: file.url, owner: file.owner, confirmers, cardable, told });
    handed.push({ ...file, decisions: waiting });
    cards += cardable.length;
  }
  if (files.length && !deps.dryRun && fc.handOff) {
    await fc.handOff.put(deps.runDate, { channel: slack.channel, threadTs: null }, { files });
  }
  return finish("handled", notes.length ? notes.join("; ") : null);
}

/** Every card of a hand-over, numbered across the message in file order. */
function numbered(value: FigmaDecisionsHanded): Array<{ n: number; file: HandedFile; d: QueuedDecision }> {
  let n = 0;
  return value.files.flatMap((file) => file.cardable.map((d) => ({ n: (n += 1), file, d })));
}

/** Whom a file's cards are for, as the opener names them: a Figma handle,
 *  since a Slack owner has a bullet of their own. */
function handleOf(owner: FileOwner | null): string | null {
  return owner && "figma" in owner ? owner.figma : null;
}

/**
 * The comment decisions as a section of the sweep's morning message in
 * #plus-design, or undefined when the hand-off, the Slack side or the
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
        ttlMs: DECISION_CARD_TTL_MS,
        ...(told.length ? { lines: told } : {}),
        // Each told decision's reply, and an edit when a card did not stage.
        cost: { subrequests: value.files.reduce((sum, f) => sum + f.told.length, 0) + 1, d1Queries: all.length * 3 },
        says(ids, person) {
          return value.files
            .flatMap((file) => {
              const count = all.filter((e) => e.file === file && ids.includes(e.d.commentId)).length;
              if (!count) return [];
              const handle = person === null ? handleOf(file.owner) : null;
              return [`${handle ? `${escapeSlackText(handle)}, ` : ""}${decisionParent(file, count)}`];
            })
            .join(" ");
        },
      };
    },
    async posted(value, place, shown, report) {
      const ts = report.ts;
      const all = numbered(value);
      const showing = all.filter((e) => shown.includes(e.d.commentId));
      const [first] = value.files;
      const thread = {
        channel: place.channel,
        ts,
        fileKey: first!.fileKey,
        title: first!.title,
        confirmers: first!.confirmers,
        expiresAt: now() + DECISION_CARD_TTL_MS,
        decisions: [] as Array<{ n: number; commentId: string; proposalKey: string; decision: QueuedDecision; file: DecisionFile }>,
        numbered: showing.length,
      };
      if (showing.length) await threads.write(thread);
      const done = new Set<string>();
      const failed: string[] = [];
      for (const { n, file, d } of showing) {
        const at = { channel: place.channel, ts };
        const asFile: DecisionFile = { fileKey: file.fileKey, title: file.title, confirmers: file.confirmers };
        try {
          await slack.stage(stagedDecision(at, asFile, { messageTs: ts, id: d.commentId }, n, d, DECISION_CARD_TTL_MS));
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[figma-comments] decision ${d.commentId} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
          failed.push(d.commentId);
          continue;
        }
        thread.decisions.push({ n, commentId: d.commentId, proposalKey: itemProposal(ts, d.commentId).proposalTs, decision: d, file: asFile });
        done.add(d.commentId);
        // At once, so a stop after this never cards it again, and a reply
        // naming its number finds it.
        await fc.carded.add([d.commentId]);
        await threads.write(thread);
      }
      if (failed.length) {
        const marked = await markNotStaged(slack.reports, ts, failed, NOT_STAGED).catch(() => null);
        if (marked) await slack.edit(ts, marked).catch(() => {});
      }
      for (const file of value.files) {
        for (const d of file.told) {
          const sent = await slack.post({ text: noPrdNote(d, commentUrl(file.fileKey, d.nodeId, d.commentId)), thread_ts: ts });
          if (!sent.ok) continue;
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
