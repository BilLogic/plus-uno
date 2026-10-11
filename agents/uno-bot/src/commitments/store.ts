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
 *   • `self_reminder` — a "remind me" a person asked uno-bot for in the turn
 *     (`./remind.ts`) — a commitment made to themselves, so its promiser and
 *     requester are the same person;
 *   • `card_todo` — a to-do to make a Roadmap card, from a thread or a running
 *     note, whose evidence is a matching card;
 *   • `card_unowned` — an active card with no Contributor;
 *   • `card_stale` — an active card stuck in one Design Status.
 *   • `dm_unanswered` — uno-bot said, in a person's DM with it, that it could
 *     not find an answer or was not sure of it: asked about once, next morning;
 *   • `dm_disagreement` — uno-bot noticed, while answering in a DM, that two
 *     sources disagree: the next morning offers to raise it.
 * The three card kinds are the follow-through module's (`../follow-through/`)
 * and the two DM kinds the DM sweep's (`../dm-sweep/`): this module stores and
 * schedules them, and hands their morning and their answers to their module.
 */
export type CommitmentKind =
  | "thread_promise"
  | "self_reminder"
  | "card_todo"
  | "card_unowned"
  | "card_stale"
  | "dm_unanswered"
  | "dm_disagreement";

/** The card kinds, which the follow-through module handles. */
export const CARD_KINDS: readonly CommitmentKind[] = ["card_todo", "card_unowned", "card_stale"];

/** Whether a row is a card follow-up's. */
export function isCardKind(kind: CommitmentKind): boolean {
  return CARD_KINDS.includes(kind);
}

/** The DM kinds, which the DM sweep handles. Their rows are always a DM's
 *  (`channelKind: "dm"`, the record's surface flag). */
export const DM_KINDS: readonly CommitmentKind[] = ["dm_unanswered", "dm_disagreement"];

/** Whether a row is one the DM sweep keeps. */
export function isDmKind(kind: CommitmentKind): boolean {
  return DM_KINDS.includes(kind);
}

/** The kinds uno-bot raises on its own, which spend the `cards` budget. */
export const RAISED_KINDS: readonly CommitmentKind[] = [...CARD_KINDS, ...DM_KINDS];

/**
 * The two morning budgets a promiser's reminders count against: `asked`, what
 * a person asked for or promised (thread promises, "remind me"), and `cards`,
 * what uno-bot raises on its own — the card follow-ups and the DM asks. That
 * backlog spends only its own budget and goes after a person's own asks, so it
 * never pushes a person's own reminder back a morning.
 */
export type ReminderBudget = "asked" | "cards";

/** The budget a kind's reminders count against. */
export function budgetOf(kind: CommitmentKind): ReminderBudget {
  return isCardKind(kind) || isDmKind(kind) ? "cards" : "asked";
}

/** The promisers passed over for each budget. */
export type ReminderSkip = Partial<Record<ReminderBudget, readonly string[]>>;

/** A thread card to-do's id: its message's, marked. One message is either a
 *  card to-do or a promise, never both — the promise hook passes over a
 *  message this id is already kept for. */
export function cardTodoId(channel: string, messageTs: string): string {
  return `${channel}:${messageTs}:card`;
}

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
  /** The live commitment `runDate`'s morning has not yet looked at, a
   *  person's own asks (promises, "remind me") before card follow-ups and then
   *  soonest due, passing over the promisers `skip` names for its budget, or
   *  null. */
  nextDue(now: number, runDate: string, skip?: ReminderSkip): Promise<CommitmentRecord | null>;
  /** How many commitments each promiser was reminded of on `runDate`, per
   *  budget. */
  remindedOn(runDate: string): Promise<Record<ReminderBudget, Record<string, number>>>;
  /** A live thread promise of this promiser's in this thread, or null — a
   *  "remind me" there is never the same task said again. */
  liveInThread(channel: string, threadTs: string, promiserId: string): Promise<CommitmentRecord | null>;
  /** The commitment a reminder with this ts belongs to — its first reminder or
   *  its follow-up. */
  byReminderTs(ts: string): Promise<CommitmentRecord | null>;
  update(id: string, patch: CommitmentPatch): Promise<void>;
  /** `update`, only while the row is live (`LIVE_STATES`): true when it
   *  changed. Two answers at once both read a live row; one claim wins. */
  claim(id: string, patch: CommitmentPatch): Promise<boolean>;
  /** Every row whose id starts with `prefix`, in id order — one range read on
   *  the key (the DM sweep's raises in one DM). */
  byIdPrefix(prefix: string): Promise<CommitmentRecord[]>;
  /** The newest `done` rows and the newest `not_promise` rows, at most `limit`
   *  of each, newest answer first — thread promises made in a public channel
   *  or in `channel` itself, never another private place's, a DM's, or a
   *  "remind me". */
  latestAnswers(channel: string, limit: number): Promise<CommitmentRecord[]>;
  /** For each of these Roadmap cards that has one, the follow-up detected
   *  last, of any card kind — one read for a night's candidates. */
  latestForCards(cardIds: readonly string[]): Promise<Record<string, CommitmentRecord>>;
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
  /** A thread card to-do's other posters, whose ✅ reaction may ask for the
   *  draft too (a tap is anyone's). */
  participants?: string[];
  /** A stuck card whose owner answered 🙌 or 🙅: the Design Status options
   *  offered, in the order shown, until one is picked and staged or the
   *  choice lapses; `reposted` once the list went up a second time; `by`
   *  whoever answered, whose pick counts beside the owners'. */
  choosing?: { answer: "done" | "drop"; options: string[]; staged: boolean; listedAt: number; reposted: boolean; by?: string };
  /** A card follow-up posted on the shared decision card: answered through
   *  its Review alone, never a tap, a reaction or a typed reply. */
  onCard?: boolean;
  /** A `dm_disagreement`'s two sources, in the detector's short names, and
   *  the team channel its note would go to. `what` holds the topic. */
  raise?: { sources: [string, string]; to: "plus-design" | "plus-universal" };
}

/** The KV half. */
export interface CommitmentTexts {
  text(id: string): Promise<CommitmentText | null>;
  /** Keep the wording until `until` (epoch ms), replacing what was there. */
  saveText(id: string, text: CommitmentText, until: number): Promise<void>;
}

export type CommitmentStore = CommitmentRecords & CommitmentTexts;
