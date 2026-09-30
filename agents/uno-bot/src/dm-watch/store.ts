// What DM watch keeps between runs, behind one port.
//
// THREE TABLES in the usage database (migrations/usage/0011_dm_watch.sql):
//
//   • `dm_watch` — the switches a person turned on in their Home tab, one row
//     per switch that is on, each with when it was turned on. The switch list
//     is `DM_WATCH_FEATURES`, in code: a new switch is a new value here and
//     nowhere in the schema.
//   • `dm_read_positions` — how far each DM of theirs has been read, one row
//     per DM a night actually read.
//   • `dm_commitments` — each promise read in those DMs: its permalink, when
//     its next step is due, and its state, with the counts and reminder ts the
//     morning schedules by. NO summary and NO id of the other person: the
//     morning reads the message again from the permalink, with the owner's own
//     token, and says what it says then.
//
// Two adapters: in-memory (`./in-memory.ts`) for the Node suite and D1
// (`./d1.ts`), held equal by one conformance suite
// (`tests/helpers/dm-watch-records-conformance.ts`, again under workerd).
//
// PURE: no `Env`, no Workers global.

import type { CommitmentState } from "../commitments/store";

/**
 * The Home-tab switches, in the order the Home tab shows them. Each is off
 * until its owner turns it on.
 *   • `promises_made` — "Remind me about promises I make in my DMs";
 *   • `promises_to_me` — "Tell me when a promise made to me in my DMs looks
 *     overdue".
 */
export const DM_WATCH_FEATURES = ["promises_made", "promises_to_me"] as const;
export type DmWatchFeature = (typeof DM_WATCH_FEATURES)[number];

/** Whether a stored or submitted value names a switch this Worker knows. */
export function isDmWatchFeature(value: unknown): value is DmWatchFeature {
  return typeof value === "string" && (DM_WATCH_FEATURES as readonly string[]).includes(value);
}

/** One switch that is on. */
export interface DmWatchSwitch {
  feature: DmWatchFeature;
  /** When it was turned on, epoch ms. */
  since: number;
  /** The Slack ts it was turned on at: nothing said at or before it counts
   *  for this switch. */
  readThrough: string;
}

/**
 * Which kind of DM promise a row is:
 *   • `made` — the owner promised someone something;
 *   • `made_to` — someone promised the owner something. The other person is
 *     never messaged about it.
 */
export type DmCommitmentKind = "made" | "made_to";

/** The switch a kind of row belongs to. */
export function featureOf(kind: DmCommitmentKind): DmWatchFeature {
  return kind === "made" ? "promises_made" : "promises_to_me";
}

/** One DM promise, as `dm_commitments` holds it. */
export interface DmCommitmentRecord {
  /** `<owner>:<channel>:<message ts>` — one row per promising message. */
  id: string;
  ownerId: string;
  kind: DmCommitmentKind;
  permalink: string;
  dueAt: number;
  state: CommitmentState;
  /** Reminders posted: the reminder and its follow-up, plus one check-back
   *  per ⏳ (`postsAllowed`). */
  nudges: number;
  /** ⏳ answers so far. */
  snoozes: number;
  detectedAt: number;
  /** The owner's DM with uno-bot, where its reminders were posted. */
  reminderChannel: string | null;
  /** The first reminder; the latest one after it (a check-back or the
   *  follow-up). */
  nudgeTs: string | null;
  followupTs: string | null;
  checkedOn: string | null;
  holds: number;
  remindedOn: string | null;
  resolvedAt: number | null;
}

export type DmCommitmentPatch = Partial<
  Pick<
    DmCommitmentRecord,
    "state" | "dueAt" | "nudges" | "snoozes" | "reminderChannel" | "nudgeTs" | "followupTs" | "checkedOn" | "holds" | "remindedOn" | "resolvedAt"
  >
>;

export interface DmWatchRecords {
  /** The switches this person has on. */
  switches(userId: string): Promise<DmWatchSwitch[]>;
  /** Turn a switch on (counting from `readThrough` onward) or off. On again
   *  when it is already on keeps its place. */
  setSwitch(userId: string, feature: DmWatchFeature, on: boolean, at: { now: number; readThrough: string }): Promise<void>;
  /** Everyone with at least one switch on — one scheduled job each. */
  watchers(): Promise<string[]>;
  /** How far each DM of theirs has been read, by DM id. */
  positions(userId: string): Promise<Record<string, string>>;
  /** Record how far these DMs have been read, in one statement. */
  savePositions(userId: string, positions: Readonly<Record<string, string>>): Promise<void>;
  /** Forget how far their DMs were read — their last switch went off. */
  clearPositions(userId: string): Promise<void>;

  /** Insert, keeping a row already there. */
  addCommitments(rows: DmCommitmentRecord[]): Promise<void>;
  get(id: string): Promise<DmCommitmentRecord | null>;
  /** The owner's live row due by `now` that `runDate`'s morning has not looked
   *  at, soonest first, or null. */
  nextDue(ownerId: string, now: number, runDate: string): Promise<DmCommitmentRecord | null>;
  /** How many reminders this owner got on `runDate`. */
  remindedCount(ownerId: string, runDate: string): Promise<number>;
  /** The row a reminder posted in `channel` with this ts belongs to. */
  byReminderTs(channel: string, ts: string): Promise<DmCommitmentRecord | null>;
  update(id: string, patch: DmCommitmentPatch): Promise<void>;
  /** Every live row of this owner's of these kinds becomes `lapsed`, in one
   *  statement. Silent: nothing is posted. */
  lapseLive(ownerId: string, kinds: readonly DmCommitmentKind[], now: number): Promise<void>;
}

/**
 * How many reminders a row may have in all: the reminder and its one
 * follow-up, plus one check-back for each ⏳ it was answered with — so a ⏳
 * always gets the check it promises.
 */
export function postsAllowed(snoozes: number): number {
  return 2 + snoozes;
}
