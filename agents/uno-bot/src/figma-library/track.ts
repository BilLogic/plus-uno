// The morning run's `figma-library-track` job: follow each posted library card
// through to its outcome. When the implementation PR opens, link it in the
// intake and in the #plus-universal thread; when it merges, close the intake as
// incorporated.
//
// A POLL, NOT A WEBHOOK. The Worker has no GitHub webhook route, so this looks
// once a morning: a PR opened after the ✅ is linked the next morning, and one
// merged is closed out the morning after that. Two reads a run find what is
// new — the repo's recent pulls, and its `harness-intake` issues updated since
// the oldest card — and each card is matched in memory:
//   • the intake by the hidden marker its body opens with (`publishMarker`);
//   • the PR by the title `figma-implement.yml` gives it — "feat: Figma DS
//     update — <component list>", the list the card dispatched — opened after
//     the card was posted. Oldest card first, each PR goes to one card only, so
//     two publishes of the same components get a PR each rather than sharing.
// A PR once linked is read back by its number, so one that stays open past the
// recent-pulls window is still seen merging.
//
// AN EXPIRED CARD IS CLOSED OUT (#886 § 3.1). Both the ✅ and the ⛔ file the
// intake, marker and all, so a card past its 72 hours with no intake was never
// decided. The job files the intake itself — the same draft, labels and
// footer the ✅ path uses, so the publish is not lost — and edits the card:
// its buttons go, and its last line says what happened. One ambiguity is
// accepted: a ✅ whose filing failed also leaves no intake, and that card is
// filed here too, with the same "No decision" line. A card tracked before the
// card kept its draft has nothing to file from, and ages out as before.
// A card whose PR never appears (a ⛔, a failed run) is dropped after
// `TRACK_DAYS`.
//
// Subrequest math, per job: 2 reads, then per card at most 1 read (its linked
// PR) and 5 writes (a PR linked and merged in one look: intake comment, thread
// post, intake comment, close, thread post; an expiry is 3: a permalink, the
// filing, the edit) for at most `MAX_TRACKED_PER_RUN` cards — 2 + 6 × 5 = 32,
// under the lookup ceiling of 38. KV is the internal bucket.
//
// Named dependencies; `Env` enters in `figma-library/env.ts`.

import { windowInWords } from "../slack/copy-words";
import { LIBRARY_CARD_TTL_MS } from "./post";

/** A posted library card, followed until its PR merges or it ages out. */
export interface TrackedPublish {
  /** The publish's identity (`PublishIntake.key`). */
  key: string;
  /** The line the intake's body carries. */
  marker: string;
  channel: string;
  /** The card's message ts — the thread to post in. */
  ts: string;
  postedAt: number;
  /** The component list the ✅ dispatches, or null when it dispatches nothing. */
  implement: string | null;
  intake?: { number: number; url: string };
  pr?: { number: number; url: string };
  /** The intake as drafted, and the card as posted: what an expired card
   *  needs to file the one and close the other. Absent on a card tracked
   *  before they were kept. */
  draft?: { title: string; body: string };
  cardText?: string;
}

export interface IntakeRef {
  number: number;
  url: string;
  body: string;
}

export interface PullRef {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  state: "open" | "closed";
  merged: boolean;
}

export interface TrackDeps {
  tracked: { read(): Promise<TrackedPublish[]>; write(tracked: TrackedPublish[]): Promise<void> };
  github: {
    /** `harness-intake` issues updated since `since` (ISO), bodies included. */
    recentIntakes(since: string): Promise<IntakeRef[]>;
    /** The repo's most recently opened pulls, any state. */
    recentPulls(): Promise<PullRef[]>;
    /** One pull by number, as it stands now; null when GitHub has none. */
    pull(number: number): Promise<PullRef | null>;
    comment(issue: number, body: string): Promise<void>;
    close(issue: number): Promise<void>;
    /** File an expired card's intake, as its ✅ would have; the card is where
     *  its footer points. */
    fileIntake(draft: { title: string; body: string }, card: { channel: string; ts: string }): Promise<{ number: number; url: string }>;
  };
  postToThread(channel: string, ts: string, text: string): Promise<void>;
  /** Edit a card to its text and a closing line, with no buttons. */
  closeCard(channel: string, ts: string, text: string, note: string): Promise<void>;
  now(): number;
}

/** The line an expired card ends with (#886 § 3.1). */
export function expiredCardNote(intakeUrl: string): string {
  return `_No decision in ${windowInWords(LIBRARY_CARD_TTL_MS / 3_600_000)}. Filed the <${intakeUrl}|intake> so it isn't lost._`;
}

/** A card whose PR has not appeared by now is let go. */
export const TRACK_DAYS = 14;
/** A card whose PR is open but unmerged is let go after this. */
export const TRACK_MAX_DAYS = 45;
/** Cards looked at per run, oldest first; the rest wait a morning. */
export const MAX_TRACKED_PER_RUN = 5;
/** A PR opened this long before the card counts too — clocks disagree. */
const CLOCK_SLACK_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The title figma-implement.yml gives the PR for this component list. */
export function implementPrTitle(components: string): string {
  return `feat: Figma DS update — ${components}`;
}

export interface TrackResult {
  linked: number;
  closed: number;
  dropped: number;
  /** Cards past their window with no decision, whose intake this run filed. */
  expired: number;
  remaining: number;
  summary: string;
}

/**
 * One morning's look at every tracked card.
 *
 * @param deps - The store, GitHub and the thread post
 * @param opts - `dryRun` reads and matches, and writes nothing
 */
export async function trackLibraryIntakes(deps: TrackDeps, opts: { dryRun?: boolean } = {}): Promise<TrackResult> {
  const tracked = await deps.tracked.read();
  if (!tracked.length) return { linked: 0, closed: 0, dropped: 0, expired: 0, remaining: 0, summary: "nothing tracked" };

  const batch = [...tracked].sort((a, b) => a.postedAt - b.postedAt).slice(0, MAX_TRACKED_PER_RUN);
  const since = new Date(Math.min(...batch.map((t) => t.postedAt)) - CLOCK_SLACK_MS).toISOString();
  const [intakes, pulls] = await Promise.all([deps.github.recentIntakes(since), deps.github.recentPulls()]);

  const done = new Set<string>();
  // A PR belongs to one card: every PR already linked is taken, and a new
  // match goes to the oldest card that wants it, earliest PR first.
  const taken = new Set(tracked.flatMap((t) => (t.pr ? [t.pr.number] : [])));
  const oldestFirst = [...pulls].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  let linked = 0;
  let closed = 0;
  let dropped = 0;
  let expired = 0;
  for (const card of batch) {
    const age = deps.now() - card.postedAt;
    if (!card.intake) {
      const intake = intakes.find((i) => i.body.includes(card.marker));
      if (intake) card.intake = { number: intake.number, url: intake.url };
    }

    let pr: PullRef | null | undefined;
    if (card.pr) {
      pr = await deps.github.pull(card.pr.number);
    } else if (card.implement) {
      pr = oldestFirst.find(
        (p) =>
          !taken.has(p.number) &&
          p.title.trim() === implementPrTitle(card.implement!) &&
          Date.parse(p.createdAt) >= card.postedAt - CLOCK_SLACK_MS,
      );
      if (pr) taken.add(pr.number);
    }

    // Past its window with no intake and no PR: nobody decided. File the
    // intake the ✅ or ⛔ would have filed, then close the card.
    if (!pr && !card.intake && age >= LIBRARY_CARD_TTL_MS && card.draft && card.cardText) {
      if (!opts.dryRun) {
        let filed: { number: number; url: string };
        try {
          filed = await deps.github.fileIntake(card.draft, card);
        } catch (err) {
          // Tried again tomorrow: nothing was filed, so nothing is lost.
          console.error(`[figma-library] expired card ${card.key}: intake not filed — ${err instanceof Error ? err.message : String(err)}`);
          continue;
        }
        card.intake = filed;
        // The intake is what matters; a card that will not edit is logged,
        // and is not filed a second time tomorrow.
        await deps.closeCard(card.channel, card.ts, card.cardText, expiredCardNote(filed.url)).catch((err: unknown) => {
          console.error(`[figma-library] expired card ${card.key}: filed #${filed.number}, card not edited — ${err instanceof Error ? err.message : String(err)}`);
        });
      }
      expired += 1;
      done.add(card.key);
      continue;
    }

    if (pr && !card.pr) {
      card.pr = { number: pr.number, url: pr.url };
      linked += 1;
      if (!opts.dryRun) {
        if (card.intake) {
          await deps.github.comment(card.intake.number, `The implementation PR is open: ${pr.url}`);
        }
        await deps.postToThread(
          card.channel,
          card.ts,
          `:link: The implementation PR is open: <${pr.url}|#${pr.number}>` +
            (card.intake ? ` — linked in the intake <${card.intake.url}|#${card.intake.number}>.` : "."),
        );
      }
    }

    if (pr?.merged) {
      closed += 1;
      done.add(card.key);
      if (!opts.dryRun) {
        if (card.intake) {
          await deps.github.comment(card.intake.number, `Incorporated by ${pr.url}, merged.`);
          await deps.github.close(card.intake.number);
        }
        await deps.postToThread(
          card.channel,
          card.ts,
          `:white_check_mark: <${pr.url}|#${pr.number}> merged` +
            (card.intake ? ` — closed the intake <${card.intake.url}|#${card.intake.number}> as incorporated.` : "."),
        );
      }
      continue;
    }
    if (pr && pr.state === "closed") {
      // Closed without merging: the intake stays open for a person to pick up.
      dropped += 1;
      done.add(card.key);
      if (!opts.dryRun) {
        await deps.postToThread(
          card.channel,
          card.ts,
          `:information_source: <${pr.url}|#${pr.number}> was closed without merging, so the intake stays open.`,
        );
      }
      continue;
    }
    if ((!card.pr && age > TRACK_DAYS * DAY_MS) || age > TRACK_MAX_DAYS * DAY_MS) {
      dropped += 1;
      done.add(card.key);
    }
  }

  const remaining = tracked.filter((t) => !done.has(t.key));
  if (!opts.dryRun) await deps.tracked.write(remaining);
  return {
    linked,
    closed,
    dropped,
    expired,
    remaining: remaining.length,
    summary: `linked ${linked}, closed ${closed}, dropped ${dropped}, expired ${expired}, tracking ${remaining.length}`,
  };
}
