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
// decided. Before filing, the job looks again, wider than the morning's one
// page — every intake updated since the card posted — and files nothing when
// that page is full, because a duplicate intake and a "No decision" stamped on
// a decided card are worse than a day's wait. Then it files the intake itself
// — the same draft, labels and footer the ✅ path uses, so the publish is not
// lost — writes that down at once, and edits the card: its buttons go, and its
// last line says what happened. An edit that fails is tried again the next
// morning (`closePending`), and nothing is filed twice. One ambiguity is
// accepted: a ✅ whose filing failed also leaves no intake, and that card is
// filed here too, with the same "No decision" line. A card tracked before the
// card kept its draft has nothing to file from, and ages out as before.
// A card whose PR never appears (a ⛔, a failed run) is dropped after
// `TRACK_DAYS`.
//
// Subrequest math, per job: 2 reads, then per card at most 1 read (its linked
// PR) and 5 writes (a PR linked and merged in one look: intake comment, thread
// post, intake comment, close, thread post; an expiry is 4: the wider look, a
// permalink, the filing, the edit) for at most `MAX_TRACKED_PER_RUN` cards —
// 2 + 6 × 5 = 32, under the lookup ceiling of 38. KV is the internal bucket.
//
// Named dependencies; `Env` enters in `figma-library/env.ts`.

import { namesInWords, windowInWords } from "../slack/copy-words";
import { rethrowIfBudget } from "../net";
import { LIBRARY_CARD_TTL_MS } from "./post";
import { notedCardBlocks } from "../slack/proposal-render";

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
  /** The card's own blocks — its release card and table — when it went up
   *  with them; absent, it is closed from `cardText`. */
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
    /** Every intake updated since `since`, up to a page of 100, and whether
     *  that was all of them. */
    intakesSince(since: string): Promise<{ intakes: IntakeRef[]; complete: boolean }>;
    /** File an expired card's intake, as its ✅ would have; the card is where
     *  its footer points. */
    fileIntake(draft: { title: string; body: string }, card: { channel: string; ts: string }): Promise<{ number: number; url: string }>;
  };
  postToThread(channel: string, ts: string, text: string): Promise<void>;
  /** Edit a card to its closing message: its own blocks, or its text, with a
   *  closing line and no buttons. */
  closeCard(channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<void>;
  now(): number;
}

/** The line an expired card ends with (#886 § 3.1). */
export function expiredCardNote(intakeUrl: string): string {
  return `_No decision in ${windowInWords(LIBRARY_CARD_TTL_MS / 3_600_000)}. Filed the <${intakeUrl}|intake> so it isn't lost._`;
}

// ── The card's thread, as the PR moves (#886 § 3.2) ──────────────────────────
// Plain links, and one 🎉 — on the merge, naming what now matches. A ✅ only
// ever means "approve", so it appears in none of these.

type Link = { number: number; url: string };

/** The PR opened. */
export function prOpenedLine(pr: Link, intake?: Link): string {
  return `PR open: <${pr.url}|#${pr.number}>.${intake ? ` Linked from the <${intake.url}|intake>.` : ""}`;
}

/**
 * The PR merged: what now matches the library, by name.
 *
 * @param implement - The component list the card dispatched, comma-joined
 */
export function prMergedLine(pr: Link, implement: string | null, intake?: Link): string {
  const names = (implement ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  const matches = names.length ? `, so ${namesInWords(names)} ${names.length === 1 ? "matches" : "match"} the library` : "";
  return `:tada: <${pr.url}|#${pr.number}> merged${matches}.${intake ? ` Closed the <${intake.url}|intake>.` : ""}`;
}

/** The PR closed without merging: the intake stays for the next try. */
export function prClosedLine(pr: Link, intake?: Link): string {
  return `<${pr.url}|#${pr.number}> closed without merging.${intake ? ` The <${intake.url}|intake> stays open for the next try.` : ""}`;
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
 * Edit an expired card to its words and its closing line. True when it
 * landed; a failure is logged and the card stays `closePending` for the next
 * look, and a budget stop ends the job.
 */
async function closeExpired(deps: TrackDeps, card: TrackedPublish, intake: { number: number; url: string }): Promise<boolean> {
  try {
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

    // An expired card whose intake this job already filed: only the edit is
    // left to do.
    if (card.closePending && card.intake && card.cardText) {
      // Tried each morning until it lands, or until the card ages out.
      const landed = opts.dryRun || (await closeExpired(deps, card, card.intake));
      if (landed || age > TRACK_DAYS * DAY_MS) done.add(card.key);
      continue;
    }

    // Past its window with no intake and no PR: nobody decided — once a wider
    // look agrees. File the intake the ✅ or ⛔ would have filed, write that
    // down, then close the card.
    if (!pr && !card.intake && age >= LIBRARY_CARD_TTL_MS && card.draft && card.cardText) {
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

    if (pr && !card.pr) {
      card.pr = { number: pr.number, url: pr.url };
      linked += 1;
      if (!opts.dryRun) {
        if (card.intake) {
          await deps.github.comment(card.intake.number, `The implementation PR is open: ${pr.url}`);
        }
        await deps.postToThread(card.channel, card.ts, prOpenedLine(pr, card.intake));
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
        await deps.postToThread(card.channel, card.ts, prMergedLine(pr, card.implement, card.intake));
      }
      continue;
    }
    if (pr && pr.state === "closed") {
      // Closed without merging: the intake stays open for a person to pick up.
      dropped += 1;
      done.add(card.key);
      if (!opts.dryRun) {
        await deps.postToThread(card.channel, card.ts, prClosedLine(pr, card.intake));
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
