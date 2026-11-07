// A promise card, answered: its buttons, its two pop-ups, and a reaction on
// the morning's message as the fallback.
//
// Three ways in, one answer each:
//
//   `pressPromise` — a card's button. Done and Got it settle the promise; On
//   track changes nothing but the card; New date, Pick a date and Wait open
//   the date pop-up, Drop it the drop pop-up.
//   `submitPromiseView` — a pop-up's Save. A date restarts the promise's
//   timeline from that day (`due.ts`); a drop closes it as dropped, or as not
//   a promise, which the detector learns from as it does from 🤔.
//   `reactPromise` — 🙌 ⏳ 🙅 🤔 on the message. A message of one open card
//   is answered as its buttons would be; a message of several says to use the
//   buttons, since a reaction cannot say which card it meant.
//
// A promise is its promiser's to answer — DM watch's, its owner's — and only
// a live one. The card then stays, its subtitle the outcome and its buttons
// gone (`answeredMessage`); the message is redrawn from its own blocks, so
// nothing is kept to draw it again.
//
// PURE: no `Env`, no Slack module, no Workers global.

import { rethrowIfBudget } from "../net";
import type { DmCommitmentPatch, DmCommitmentRecord, DmWatchRecords } from "../dm-watch/store";
import { reminderAnswer, TAP_REFUSED, type ReminderOutcome } from "./copy";
import { checkInAt, dueDayOf, endOfEtDay, etDayOf, firstReminderAt, maySnooze, rearmedDueAt } from "./due";
import type { ReminderPress } from "./press";
import {
  answeredMessage,
  cardValueOf,
  dateView,
  droppedAsOf,
  dropView,
  initialPickDay,
  openRefs,
  openerOf,
  pickedDayOf,
  PROMISE_DATE_BLOCK,
  PROMISE_DATE_CALLBACK_ID,
  PROMISE_DROP_CALLBACK_ID,
  promisePressOf,
  promiseViewMetaOf,
  refOf,
  type PromiseOutcome,
  type PromiseViewMeta,
} from "./promise-cards";
import { LIVE_STATES, type CommitmentPatch, type CommitmentRecord, type CommitmentStore } from "./store";

/** What a reaction on a message of several open cards is told. */
export const USE_THE_BUTTONS = "This message has more than one promise, so use a card's buttons to say which one.";

/** What a date before today is told, under the picker. */
export const PICK_A_LATER_DAY = "Pick today or a later day.";

export interface PromiseDoorDeps {
  /** Thread promises' rows; absent when unbound. */
  store?: Pick<CommitmentStore, "get" | "claim">;
  /** DM watch's rows; absent when unbound. */
  dmRecords?: Pick<DmWatchRecords, "get" | "update">;
  /** The message's blocks as Slack holds them, read back with the bot token. */
  message(channel: string, ts: string): Promise<unknown[] | null>;
  update(channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<boolean>;
  openView(triggerId: string, view: Record<string, unknown>): Promise<boolean>;
  now(): number;
}

/** A card's press, in the envelope's facts. */
export interface PromisePress {
  channel: string;
  messageTs: string;
  userId: string;
  actionId: string;
  /** The pressed button's value: its row, and the day its card shows due. */
  value?: string;
  triggerId?: string;
  /** The message's blocks as the press carried them. */
  blocks?: unknown[];
}

/** One row, from whichever store its ref names. */
type Row = { store: "thread"; c: CommitmentRecord } | { store: "dm"; c: DmCommitmentRecord };

/** What one answer does to a row. */
type Answer =
  | { kind: "done" }
  | { kind: "on-track" }
  | { kind: "date"; day: number }
  | { kind: "drop"; as: "no-longer-needed" | "not-a-promise" }
  | { kind: "snooze" };

/**
 * A card's button, pressed.
 *
 * @param p - The press
 * @param deps - The stores, the message read and edit, the pop-up, the clock
 */
async function pressPromiseInner(p: PromisePress, deps: PromiseDoorDeps): Promise<ReminderOutcome> {
  const press = promisePressOf(p.actionId);
  if (!press) return { claimed: false };
  const row = await rowOf(press.ref, deps);
  const refused = gateOf(row, p.userId);
  if (refused) return refused;
  const meta: PromiseViewMeta = { channel: p.channel, ts: p.messageTs, ref: press.ref };
  switch (press.answer) {
    case "done":
    case "got-it":
      return answer(row!, { kind: "done" }, meta, deps, p.blocks);
    case "on-track":
      return answer(row!, { kind: "on-track" }, meta, deps, p.blocks);
    case "drop":
      return opened(p.triggerId ? await deps.openView(p.triggerId, dropView(meta)) : false);
    case "new-date":
    case "pick-date":
    case "wait": {
      const shown = cardValueOf(p.value)?.dueDay ?? dueDayOfRow(row!);
      const view = dateView(meta, initialPickDay(shown, etDayOf(deps.now())), press.answer === "wait" ? "Wait until" : press.answer === "new-date" ? "New date" : "Pick a date");
      return opened(p.triggerId ? await deps.openView(p.triggerId, view) : false);
    }
  }
}

/** A pop-up's Save, as Slack sends it. */
export interface PromiseSubmit {
  callbackId: string | undefined;
  privateMetadata: string | undefined;
  state: Parameters<typeof pickedDayOf>[0];
  userId: string;
}

/** Whether a view's callback is a promise pop-up's. */
export function isPromiseView(callbackId: string | undefined): boolean {
  return callbackId === PROMISE_DATE_CALLBACK_ID || callbackId === PROMISE_DROP_CALLBACK_ID;
}

/**
 * Field errors for a pop-up's Save, said inside Slack's three seconds, or null
 * when it may close. A day before today is refused under the picker.
 */
export function promiseViewErrors(s: Pick<PromiseSubmit, "callbackId" | "state">, now: number): Record<string, string> | null {
  if (s.callbackId !== PROMISE_DATE_CALLBACK_ID) return null;
  const day = pickedDayOf(s.state);
  return day === null || day < etDayOf(now) ? { [PROMISE_DATE_BLOCK]: PICK_A_LATER_DAY } : null;
}

/**
 * A pop-up's Save, answered: the date set or the promise dropped, and its
 * card redrawn.
 */
async function submitPromiseViewInner(s: PromiseSubmit, deps: PromiseDoorDeps): Promise<ReminderOutcome> {
  const meta = promiseViewMetaOf(s.privateMetadata);
  if (!meta || !isPromiseView(s.callbackId)) return { claimed: false };
  const row = await rowOf(meta.ref, deps);
  const refused = gateOf(row, s.userId);
  if (refused) return refused;
  if (s.callbackId === PROMISE_DATE_CALLBACK_ID) {
    const day = pickedDayOf(s.state);
    if (day === null || day < etDayOf(deps.now())) return { claimed: true, refused: PICK_A_LATER_DAY };
    return answer(row!, { kind: "date", day }, meta, deps);
  }
  const as = droppedAsOf(s.state);
  if (!as) return { claimed: true, refused: TAP_REFUSED.notAnAnswer };
  return answer(row!, { kind: "drop", as }, meta, deps);
}

/**
 * A reaction on a morning's promise message: answered as the one open card's
 * buttons would answer it. Not claimed when the message holds no open card —
 * it is then some other reminder's, or nothing's.
 */
async function reactPromiseInner(r: ReminderPress, deps: PromiseDoorDeps): Promise<ReminderOutcome> {
  // Every promise message is in a person's DM with uno-bot.
  if (!r.channel.startsWith("D")) return { claimed: false };
  const glyph = reminderAnswer(r.glyph);
  if (!glyph) return { claimed: false };
  const blocks = await deps.message(r.channel, r.messageTs);
  const refs = blocks ? openRefs(blocks) : [];
  if (!refs.length) return { claimed: false };
  if (refs.length > 1) return { claimed: true, refused: USE_THE_BUTTONS };
  const ref = refs[0]!;
  const row = await rowOf(ref, deps);
  const refused = gateOf(row, r.userId);
  if (refused) return refused;
  const meta = { channel: r.channel, ts: r.messageTs, ref };
  const a: Answer =
    glyph === "done"
      ? { kind: "done" }
      : glyph === "soon"
        ? { kind: "snooze" }
        : { kind: "drop", as: glyph === "not_promise" ? "not-a-promise" : "no-longer-needed" };
  return answer(row!, a, meta, deps, blocks!);
}

/** A card's button, pressed (`pressPromiseInner`), failing open: a store that
 *  cannot be read says so to the tapper rather than passing for no card. */
export function pressPromise(p: PromisePress, deps: PromiseDoorDeps): Promise<ReminderOutcome> {
  return failOpen(() => pressPromiseInner(p, deps), `press on ${p.channel} ${p.messageTs}`);
}

/** A pop-up's Save (`submitPromiseViewInner`), failing open. */
export function submitPromiseView(s: PromiseSubmit, deps: PromiseDoorDeps): Promise<ReminderOutcome> {
  return failOpen(() => submitPromiseViewInner(s, deps), "pop-up save");
}

/** A reaction (`reactPromiseInner`), failing open: a store that cannot be read
 *  must never keep a card's ✅ or ⛔ from the gate. */
export function reactPromise(r: ReminderPress, deps: PromiseDoorDeps): Promise<ReminderOutcome> {
  return failOpen(() => reactPromiseInner(r, deps), `reaction on ${r.channel} ${r.messageTs}`);
}

async function failOpen(run: () => Promise<ReminderOutcome>, what: string): Promise<ReminderOutcome> {
  try {
    return await run();
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[promise-cards] ${what} failed: ${err instanceof Error ? err.message : String(err)}`);
    return { claimed: false, failed: true };
  }
}

// ── Inside ───────────────────────────────────────────────────────────────────

async function rowOf(ref: string, deps: PromiseDoorDeps): Promise<Row | null> {
  const at = refOf(ref);
  if (!at) return null;
  if (at.store === "thread") {
    const c = deps.store ? await deps.store.get(at.id) : null;
    return c ? { store: "thread", c } : null;
  }
  const c = deps.dmRecords ? await deps.dmRecords.get(at.id) : null;
  return c ? { store: "dm", c } : null;
}

/** Why this person may not answer this row now, or null when they may. */
function gateOf(row: Row | null, userId: string): ReminderOutcome | null {
  if (!row) return { claimed: true, refused: TAP_REFUSED.gone };
  const owner = row.store === "thread" ? row.c.promiserId : row.c.ownerId;
  if (userId !== owner) return { claimed: true, refused: TAP_REFUSED.notYours(owner) };
  if (!LIVE_STATES.includes(row.c.state)) return { claimed: true, refused: TAP_REFUSED.settled };
  return null;
}

/** The ET day a row is due, as far as the row knows it. */
function dueDayOfRow(row: Row): number | undefined {
  if (row.store === "thread") return row.c.deadlineAt === null ? undefined : dueDayOf(row.c.deadlineAt);
  // A DM row keeps no deadline of its own: one a person set is its `due_at`.
  return row.c.state === "snoozed" ? dueDayOf(row.c.dueAt) : undefined;
}

/** A pop-up that would not open (a trigger past its three seconds, say) is a
 *  failure the presser hears, not a refusal. */
function opened(ok: boolean): ReminderOutcome {
  return ok ? { claimed: true } : { claimed: false, failed: true };
}

/** The answer written, then the card redrawn. */
async function answer(row: Row, a: Answer, meta: PromiseViewMeta, deps: PromiseDoorDeps, blocks?: unknown[]): Promise<ReminderOutcome> {
  const now = deps.now();
  const written = row.store === "thread" ? threadPatch(row.c, a, now) : dmPatch(row.c, a, now);
  if ("refused" in written) return { claimed: true, refused: written.refused };
  if (written.patch) {
    if (row.store === "thread") {
      // Two answers at once both read a live row: the claim lets one through.
      if (!(await deps.store!.claim(row.c.id, written.patch as CommitmentPatch))) return { claimed: true, refused: TAP_REFUSED.settled };
    } else {
      await deps.dmRecords!.update(row.c.id, written.patch as DmCommitmentPatch);
    }
  }
  const shown = blocks ?? (await deps.message(meta.channel, meta.ts));
  const redrawn = shown ? answeredMessage(shown, meta.ref, written.outcome) : null;
  if (!redrawn || !(await deps.update(meta.channel, meta.ts, { text: openerOf(redrawn), blocks: redrawn }))) {
    console.warn(`[promise-cards] ${row.c.id}: answered, but message ${meta.ts} could not be redrawn`);
    return { claimed: true, unedited: true };
  }
  return { claimed: true };
}

type Written = { patch: CommitmentPatch | DmCommitmentPatch | null; outcome: PromiseOutcome } | { refused: string };

/** A thread promise's answer. A new date restarts its timeline: a heads-up
 *  before the day, a check-in after it, and two check-ins again. */
function threadPatch(c: CommitmentRecord, a: Answer, now: number): Written {
  switch (a.kind) {
    case "done":
      return { patch: { state: "done", resolvedAt: now }, outcome: { kind: "done" } };
    case "on-track":
      return { patch: null, outcome: { kind: "on-track" } };
    case "date": {
      const deadlineAt = endOfEtDay(a.day);
      return { patch: { state: "open", deadlineAt, dueAt: firstReminderAt(now, deadlineAt), nudges: 0, holds: 0 }, outcome: { kind: "moved", day: a.day } };
    }
    case "drop":
      return { patch: { state: a.as === "not-a-promise" ? "not_promise" : "dropped", resolvedAt: now }, outcome: dropped(a.as) };
    case "snooze": {
      if (!maySnooze(c.snoozes)) return { refused: TAP_REFUSED.snoozeSpent };
      const deadlineAt = rearmedDueAt(now);
      return {
        // A ⏳ moves the date but adds no check-in: the two a promise gets stay.
        patch: { state: "snoozed", snoozes: c.snoozes + 1, deadlineAt, dueAt: checkInAt(deadlineAt) },
        outcome: { kind: "moved", day: dueDayOf(deadlineAt) },
      };
    }
  }
}

/** A DM watch row's answer. A row keeps no deadline, so a new date is its
 *  `due_at`, at the day's end: the morning after it, the card says it was due
 *  that day. */
function dmPatch(c: DmCommitmentRecord, a: Answer, now: number): Written {
  switch (a.kind) {
    case "done":
      return { patch: { state: "done", resolvedAt: now }, outcome: { kind: "done" } };
    case "on-track":
      return { patch: null, outcome: { kind: "on-track" } };
    case "date":
      return { patch: { state: "snoozed", dueAt: endOfEtDay(a.day), nudges: 0, holds: 0 }, outcome: { kind: "moved", day: a.day } };
    case "drop":
      return { patch: { state: a.as === "not-a-promise" ? "not_promise" : "dropped", resolvedAt: now }, outcome: dropped(a.as) };
    case "snooze": {
      if (!maySnooze(c.snoozes)) return { refused: TAP_REFUSED.snoozeSpent };
      const dueAt = rearmedDueAt(now);
      return { patch: { state: "snoozed", snoozes: c.snoozes + 1, dueAt }, outcome: { kind: "moved", day: dueDayOf(dueAt) } };
    }
  }
}

function dropped(as: "no-longer-needed" | "not-a-promise"): PromiseOutcome {
  return as === "not-a-promise" ? { kind: "not-a-promise" } : { kind: "dropped" };
}
