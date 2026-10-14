// The morning run's `figma-library-track` job: follow each posted library card
// for `TRACK_DAYS`, so a card nobody decides still gets its intake filed. Approve
// files the intake at once and stages no build — the code change is IDE work —
// so nothing here watches for a PR. While a card is followed, the components it
// names count as in flight for the precedence check (`ds-precedence/`).
//
// A POLL, NOT A WEBHOOK. The Worker has no GitHub webhook route, so this looks
// once a morning: one read finds the repo's `harness-intake` issues updated
// since the oldest card, and each card is matched in memory by the hidden
// marker its intake's body opens with (`publishMarker`).
//
// AN EXPIRED CARD IS CLOSED OUT (#886 § 3.1). An Approve files the intake,
// marker and all, and a Reject files nothing and says so on the report's
// record — so a card past its 72 hours with no intake, whose record does not
// say rejected, was never decided. Before filing, the job looks again, wider
// than the morning's one page — every intake updated since the card posted —
// and files nothing when that page is full, because a duplicate intake and a
// closed card that was decided are worse than a day's wait. Then it files the
// intake itself — the same draft, labels and footer Approve's filing uses, so
// the publish is not lost — writes that down at once, closes the card ("Closed,
// no decision", its report redrawn from the record) and says in its thread
// what it filed. An edit that fails is tried again the next morning
// (`closePending`), and nothing is filed twice. An Approve whose filing failed
// also leaves no intake: it is filed here too, but its card keeps saying the
// write failed, and the thread is told the intake was filed in its place. A
// record that cannot be read is tried again the next morning, and a day past
// the window the card is filed the old way, whatever was decided, so it never
// waits for ever; an edit it cannot make ages out after `TRACK_DAYS`. A card
// tracked before the shared card has no item; its intake
// files the same way, and its own text is edited to a closing line. A card
// tracked before the card kept its draft has nothing to file from. Every card
// is dropped after `TRACK_DAYS`.
//
// Subrequest math, per job: 1 read, then per card at most 5 (an expiry: the
// wider look, a permalink, the filing, the edit and the thread line) for at
// most `MAX_TRACKED_PER_RUN` cards — 1 + 5 × 5 = 26, under the lookup ceiling
// of 38.
// The report's record is a Durable Object hop; KV is the internal bucket.
//
// Named dependencies; `Env` enters in `figma-library/env.ts`.

import { windowInWords } from "../slack/copy-words";
import { rethrowIfBudget } from "../net";
import { LIBRARY_CARD_TTL_MS } from "./post";
import { notedCardBlocks } from "../slack/proposal-render";
import { expireItem, type ReportStore } from "../slack/decision-cards";
import type { ReportItemState } from "../thread-state/index";

/** A posted library card, followed until it ages out. */
export interface TrackedPublish {
  /** The publish's identity (`PublishIntake.key`). */
  key: string;
  /** The line the intake's body carries. */
  marker: string;
  channel: string;
  /** The card's message ts — the thread to post in. */
  ts: string;
  postedAt: number;
  /** The publish's components with code, comma-joined, or null when none has
   *  code: what the precedence check holds as in flight. */
  implement: string | null;
  intake?: { number: number; url: string };
  /** The intake as drafted: what an expired card files. Absent on a card
   *  tracked before it was kept. */
  draft?: { title: string; body: string };
  /** The card's entry id in its report (`decision-cards.ts`): where its
   *  decision is read and its closing drawn. Absent on a card posted before
   *  the shared card, which is closed from its own text below. */
  item?: string;
  cardText?: string;
  /** A pre-shared card's own blocks, when it went up with them. */
  cardBlocks?: unknown[];
  /** This job filed the intake at expiry and the card's edit has not landed
   *  yet: the next look tries the edit again, and files nothing. */
  closePending?: true;
}

export interface IntakeRef {
  number: number;
  url: string;
  body: string;
}

export interface TrackDeps {
  tracked: { read(): Promise<TrackedPublish[]>; write(tracked: TrackedPublish[]): Promise<void> };
  github: {
    /** `harness-intake` issues updated since `since` (ISO), bodies included. */
    recentIntakes(since: string): Promise<IntakeRef[]>;
    /** Every intake updated since `since`, up to a page of 100, and whether
     *  that was all of them. */
    intakesSince(since: string): Promise<{ intakes: IntakeRef[]; complete: boolean }>;
    /** File an expired card's intake, as its Approve would have; the card is
     *  where its footer points. */
    fileIntake(draft: { title: string; body: string }, card: { channel: string; ts: string }): Promise<{ number: number; url: string }>;
  };
  postToThread(channel: string, ts: string, text: string): Promise<void>;
  /** The reports' records: what a card's decision was, and its closing. */
  reports: ReportStore;
  /** Edit a card's message in place: its report redrawn closed, or a
   *  pre-shared card's own blocks with a closing line and no buttons. */
  closeCard(channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<void>;
  now(): number;
}

/** The line a pre-shared expired card ends with (#886 § 3.1). */
export function expiredCardNote(intakeUrl: string): string {
  return `_No decision in ${windowInWords(LIBRARY_CARD_TTL_MS / 3_600_000)}. Filed the <${intakeUrl}|intake> so it isn't lost._`;
}

/** What an expired card's thread is told, under the card closed with no
 *  decision. */
export function expiredThreadLine(intakeUrl: string): string {
  return `No decision in ${windowInWords(LIBRARY_CARD_TTL_MS / 3_600_000)}. I filed the <${intakeUrl}|intake> so the publish isn't lost.`;
}

/** What the thread is told when an approved filing had failed and the
 *  tracker filed the intake in its place; the card keeps its failure. */
export function failedFiledLine(intakeUrl: string): string {
  return `The approved filing didn't go through, so I filed the <${intakeUrl}|intake> now.`;
}

/** A card is let go this long after it posted. */
export const TRACK_DAYS = 14;
/** Cards looked at per run, oldest first; the rest wait a morning. */
export const MAX_TRACKED_PER_RUN = 5;
/** An intake updated this long before the card counts too — clocks disagree. */
const CLOCK_SLACK_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TrackResult {
  dropped: number;
  /** Cards past their window with no decision, whose intake this run filed. */
  expired: number;
  remaining: number;
  summary: string;
}

/** Where a card's item stands on its report's record; undefined when the
 *  record or the item is gone. Throws when the record cannot be read. */
async function itemStateOf(deps: TrackDeps, card: TrackedPublish): Promise<ReportItemState["kind"] | undefined> {
  return (await deps.reports.getReport(card.ts))?.entries.find((e) => e.id === card.item)?.state.kind;
}

/**
 * Edit an expired card to its words and its closing line. True when it
 * landed; a failure is logged and the card stays `closePending` for the next
 * look, and a budget stop ends the job.
 */
async function closeExpired(deps: TrackDeps, card: TrackedPublish, intake: { number: number; url: string }): Promise<boolean> {
  try {
    if (card.item) {
      // An Approve whose write failed keeps saying so on its card; only a
      // card nobody decided closes with no decision.
      let state = await itemStateOf(deps, card);
      if (state !== "failed") {
        // A decision that lands after that read keeps the item; the close
        // says which, and the card is redrawn either way.
        const closed = await expireItem(deps.reports, { messageTs: card.ts, id: card.item }, deps.now());
        if (closed) {
          state = closed.state;
          await deps.closeCard(card.channel, card.ts, closed.message);
        } else state = "expired";
      }
      delete card.closePending;
      // Told once the card is closed; a line that fails is not tried again.
      const line = state === "failed" ? failedFiledLine(intake.url) : state === "expired" ? expiredThreadLine(intake.url) : null;
      if (line) {
        await deps.postToThread(card.channel, card.ts, line).catch((err: unknown) => {
          rethrowIfBudget(err);
          console.error(`[figma-library] expired card ${card.key}: thread line not posted — ${err instanceof Error ? err.message : String(err)}`);
        });
      }
      return true;
    }
    const note = expiredCardNote(intake.url);
    await deps.closeCard(card.channel, card.ts, {
      text: `${card.cardText!}\n${note}`,
      blocks: notedCardBlocks({ text: card.cardText!, ...(card.cardBlocks ? { blocks: card.cardBlocks } : {}) }, note),
    });
    delete card.closePending;
    return true;
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[figma-library] expired card ${card.key}: filed #${intake.number}, card not edited yet — ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/**
 * One morning's look at every tracked card.
 *
 * @param deps - The store, GitHub and the thread post
 * @param opts - `dryRun` reads and matches, and writes nothing
 */
export async function trackLibraryIntakes(deps: TrackDeps, opts: { dryRun?: boolean } = {}): Promise<TrackResult> {
  const tracked = await deps.tracked.read();
  if (!tracked.length) return { dropped: 0, expired: 0, remaining: 0, summary: "nothing tracked" };

  const batch = [...tracked].sort((a, b) => a.postedAt - b.postedAt).slice(0, MAX_TRACKED_PER_RUN);
  const since = new Date(Math.min(...batch.map((t) => t.postedAt)) - CLOCK_SLACK_MS).toISOString();
  const intakes = await deps.github.recentIntakes(since);

  const done = new Set<string>();
  let dropped = 0;
  let expired = 0;
  for (const card of batch) {
    const age = deps.now() - card.postedAt;
    if (!card.intake) {
      const intake = intakes.find((i) => i.body.includes(card.marker));
      if (intake) card.intake = { number: intake.number, url: intake.url };
    }

    // An expired card whose intake this job already filed: only the edit is
    // left to do.
    if (card.closePending && card.intake && (card.item || card.cardText)) {
      // Tried each morning until it lands, or until the card ages out.
      const landed = opts.dryRun || (await closeExpired(deps, card, card.intake));
      if (landed || age > TRACK_DAYS * DAY_MS) done.add(card.key);
      continue;
    }

    // Past its window with no intake: nobody decided — unless its
    // record says rejected, and once a wider look agrees. File the intake
    // Approve would have filed, write that down, then close the card.
    if (!card.intake && age >= LIBRARY_CARD_TTL_MS && card.draft && (card.item || card.cardText)) {
      if (card.item) {
        let decided: ReportItemState["kind"] | undefined;
        try {
          decided = await itemStateOf(deps, card);
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[figma-library] expired card ${card.key}: could not read its decision — ${err instanceof Error ? err.message : String(err)}`);
          // Tried again the next morning; a record still unreadable a day
          // past the window is filed the old way, as every card once was, so
          // no card waits on it for ever.
          if (age < LIBRARY_CARD_TTL_MS + DAY_MS) continue;
        }
        if (decided === "rejected") {
          // Rejected in Review: nothing to file, and nothing more to follow.
          dropped += 1;
          done.add(card.key);
          continue;
        }
      }
      let look: { intakes: IntakeRef[]; complete: boolean };
      try {
        look = await deps.github.intakesSince(new Date(card.postedAt - CLOCK_SLACK_MS).toISOString());
      } catch (err) {
        rethrowIfBudget(err);
        console.error(`[figma-library] expired card ${card.key}: could not look for its intake — ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
      const own = look.intakes.find((i) => i.body.includes(card.marker));
      if (own) {
        // Decided after all; the morning's one page had missed it.
        card.intake = { number: own.number, url: own.url };
      } else if (!look.complete) {
        console.warn(`[figma-library] expired card ${card.key}: over 100 intakes since it posted — not filed, to be sure of no duplicate`);
        continue;
      } else {
        if (!opts.dryRun) {
          let filed: { number: number; url: string };
          try {
            filed = await deps.github.fileIntake(card.draft, card);
          } catch (err) {
            rethrowIfBudget(err);
            // Tried again tomorrow: nothing was filed, so nothing is lost.
            console.error(`[figma-library] expired card ${card.key}: intake not filed — ${err instanceof Error ? err.message : String(err)}`);
            continue;
          }
          card.intake = filed;
          card.closePending = true;
          // On record before the edit, so no later stop can file it twice.
          await deps.tracked.write(tracked.filter((t) => !done.has(t.key)));
          if (!(await closeExpired(deps, card, filed))) {
            expired += 1;
            continue;
          }
        }
        expired += 1;
        done.add(card.key);
        continue;
      }
    }

    if (age > TRACK_DAYS * DAY_MS) {
      dropped += 1;
      done.add(card.key);
    }
  }

  const remaining = tracked.filter((t) => !done.has(t.key));
  if (!opts.dryRun) await deps.tracked.write(remaining);
  return {
    dropped,
    expired,
    remaining: remaining.length,
    summary: `dropped ${dropped}, expired ${expired}, tracking ${remaining.length}`,
  };
}
