// What commitment reminders keep between runs, behind one port with two halves
// — the sweep's split (`sweep/store.ts`), for the same reason.
//
// THE RECORDS (`CommitmentRecords`) live in D1, in the usage database
// (migrations/usage/0006_commitments.sql): one row per promise, keyed by the
// message that made it, carrying ids, times, a state and two counts. Nothing
// in a row is message text or a link (ADR-030): the permalink is fetched again
// when a nudge is written, from the channel and the message ts.
//
// THE TEXTS (`CommitmentTexts`) hold the one piece of wording a nudge needs —
// the detector's short summary of what was promised, never a quote — and the
// body of each reminder uno-bot posted, so an answer can replace the legend in
// place. Production keeps them in HARNESS_KV with an expiry past the row's
// last possible nudge (`./env.ts`).
//
// Two adapters for the records: in-memory (`./in-memory.ts`) for the Node suite
// and D1 (`./d1.ts`), held equal by one conformance suite
// (`tests/helpers/commitment-records-conformance.ts`, again under workerd).
//
// PURE: no `Env`, no Workers global.

import type { ChannelKind } from "../sweep/finding";

/**
 * Where a commitment is in its life.
 *   • `open` — detected, not yet due or not yet nudged;
 *   • `nudged` — a reminder is up and unanswered;
 *   • `snoozed` — ⏳: due again two working days out;
 *   • `done` — 🙌; `dropped` — 🙅; `not_promise` — 🤔;
 *   • `auto_done` — the morning's evidence check found it done, and nothing
 *     was sent;
 *   • `lapsed` — its one follow-up went unanswered too.
 */
export type CommitmentState =
  | "open"
  | "nudged"
  | "snoozed"
  | "done"
  | "dropped"
  | "not_promise"
  | "auto_done"
  | "lapsed";

/** The states the morning still acts on. */
export const LIVE_STATES: readonly CommitmentState[] = ["open", "nudged", "snoozed"];

/**
 * What made the row:
 *   • `thread_promise` — a promise read in a swept thread;
 *   • `card_todo` — a to-do to make a Roadmap card, from a thread or a running
 *     note, whose evidence is a matching card;
 *   • `card_unowned` — an active card with no Contributor;
 *   • `card_stale` — an active card stuck in one Design Status.
 * The three card kinds are the follow-through module's (`../follow-through/`):
 * this module stores and schedules them, and hands their morning and their
 * answers to it.
 */
export type CommitmentKind = "thread_promise" | "card_todo" | "card_unowned" | "card_stale";

/** The card kinds, which the follow-through module handles. */
export const CARD_KINDS: readonly CommitmentKind[] = ["card_todo", "card_unowned", "card_stale"];

/** One promise, as `commitments` holds it. */
export interface CommitmentRecord {
  /** `<channel>:<message ts>` — one commitment per promising message. */
  id: string;
  kind: CommitmentKind;
  channel: string;
  /** The kind of place the promise was made in. The detector's examples for
   *  one channel come only from public channels and that channel itself, so a
   *  DM's or another private place's promise never reaches it. */
  channelKind: ChannelKind;
  /** The thread its nudge replies in: the thread root, or the message itself
   *  when it started no thread. */
  threadTs: string;
  /** The message that made the promise. */
  messageTs: string;
  promiserId: string;
  /** Who asked for it, when someone did. */
  requesterId: string | null;
  /** The end of the day the promiser named, epoch ms; null when they named
   *  none. Kept apart from `dueAt`, which a ⏳ or a nudge re-arms. */
  deadlineAt: number | null;
  /** When the next step is due: the nudge, the follow-up, or the lapse. */
  dueAt: number;
  state: CommitmentState;
  /** Reminders posted: 0, 1 or 2 — the reminder and its one follow-up,
   *  across every ⏳. */
  nudges: number;
  /** ⏳ answers so far. */
  snoozes: number;
  /** 0–1, the detector's. */
  confidence: number;
  /** When the promise was made — its message's time. */
  promisedAt: number;
  detectedAt: number;
  /** The end-of-day run date that found it, `YYYY-MM-DD`. */
  runDate: string;
  /** The first reminder's ts, and the follow-up's: where an answer lands. */
  nudgeTs: string | null;
  followupTs: string | null;
  /** The morning run date that last looked at it, so one morning's retried job
   *  never looks twice. */
  checkedOn: string | null;
  /** Consecutive mornings it was held — not read, or not posted. */
  holds: number;
  /** The morning run date its last reminder went up. */
  remindedOn: string | null;
  resolvedAt: number | null;
  /** The Roadmap card's Notion page id, on a card follow-up; absent on a
   *  promise. An id only — its title and link wait with the wording. */
  cardId?: string | null;
}

/** A change to one commitment. */
export type CommitmentPatch = Partial<
  Pick<
    CommitmentRecord,
    "state" | "dueAt" | "deadlineAt" | "nudges" | "snoozes" | "nudgeTs" | "followupTs" | "checkedOn" | "holds" | "remindedOn" | "resolvedAt"
  >
>;

/** The D1 half. */
export interface CommitmentRecords {
  /** Insert, keeping a row already there — a promise re-read tomorrow keeps
   *  the state it has reached. */
  addCommitments(rows: CommitmentRecord[]): Promise<void>;
  get(id: string): Promise<CommitmentRecord | null>;
  /** The live commitment due soonest at `now` that `runDate`'s morning has not
   *  yet looked at, passing over the promisers in `skip`, or null. */
  nextDue(now: number, runDate: string, skip?: readonly string[]): Promise<CommitmentRecord | null>;
  /** How many commitments each promiser was reminded of on `runDate`. */
  remindedOn(runDate: string): Promise<Record<string, number>>;
  /** A live promise (`thread_promise`) of this promiser's in this thread, or
   *  null. */
  liveInThread(channel: string, threadTs: string, promiserId: string): Promise<CommitmentRecord | null>;
  /** The commitment a reminder with this ts belongs to — its first reminder or
   *  its follow-up. */
  byReminderTs(ts: string): Promise<CommitmentRecord | null>;
  update(id: string, patch: CommitmentPatch): Promise<void>;
  /** The newest `done` promises and the newest `not_promise` ones, at most
   *  `limit` of each, newest answer first — those made in a public channel or in
   *  `channel` itself, never another private place's or a DM's. */
  latestAnswers(channel: string, limit: number): Promise<CommitmentRecord[]>;
  /** The follow-up for this Roadmap card detected last, of any card kind, or
   *  null. */
  latestForCard(cardId: string): Promise<CommitmentRecord | null>;
}

/** What one commitment's wording is, kept beside its row. */
export interface CommitmentText {
  /** The detector's short summary of what was promised — never a quote. */
  what: string;
  /** Each reminder's body as posted, by its ts, so an answer can replace the
   *  legend and keep the rest. */
  bodies: Record<string, string>;
  /** A card follow-up's other people to mention beside the promiser — a
   *  running note's takers, a card's other Contributors. */
  mentions?: string[];
  /** A card follow-up's card: its title and link, as Notion gave them. */
  card?: { title: string; url: string; status: string | null };
  /** Where a card to-do was read: the thread's permalink or the note's link. */
  sourceUrl?: string;
  /** A stuck card whose owner answered 🙌 or 🙅: the Design Status options
   *  offered, in the order shown, until one is picked and staged. */
  choosing?: { answer: "done" | "drop"; options: string[]; staged: boolean };
}

/** The KV half. */
export interface CommitmentTexts {
  text(id: string): Promise<CommitmentText | null>;
  /** Keep the wording until `until` (epoch ms), replacing what was there. */
  saveText(id: string, text: CommitmentText, until: number): Promise<void>;
}

export type CommitmentStore = CommitmentRecords & CommitmentTexts;
