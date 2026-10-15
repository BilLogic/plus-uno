// A model capacity outage, told to the lead only when it lasts.
//
// A capacity failure used to post an alert to #uno-bot, at most once per ten
// minutes. Nearly all of those were noise: the backup model
// (`GEMINI_FALLBACK_MODEL`) takes over quietly when the main one is out of
// quota, and a turn fails only when both are. When that happens the asker gets
// the plain overloaded line in their own thread (`slack/failure-message.ts`),
// and this module keeps the count.
//
// ONE OUTAGE, ONE DM, ONE RECOVERY LINE. Each failing turn records its time in
// the outage record. Once failures have run for `LASTING_MS` (the first one at
// least 30 minutes ago, with this one inside the last 10), the lead
// (`LEAD_USER_ID`) gets one DM saying what is failing, how many asks it cost
// and where the quota lives. The outage ends, with one "back to normal" line
// in the same DM, at whichever comes first:
//   • the next turn that answers;
//   • the next failure after `QUIET_MS` with none: scheduled jobs answer
//     without being turns, so an outage that cleared at 2am can be seen to
//     have cleared only by the next thing that happens. Its length is then
//     measured to its last failure, and the new failure starts a new outage.
// A gap of more than `CONTINUOUS_MS` between failures before anyone was told
// starts the count again, so two blips an hour apart are two blips.
//
// THE RECORD LIVES IN A DURABLE OBJECT, the workspace's one ThreadState
// instance, because "exactly one DM" needs a serialised read-modify-write:
// KV is eventually consistent, and two turns failing together each read the
// same record. The transitions below are pure and run inside the object's
// transaction, which is where "told" is claimed, so only one caller is ever
// handed the DM to send (a refused DM releases the claim for the next
// failure). Test traffic is kept out before any of it (`outageForPlace`).
//
// COST, on Workers Free: a failing turn makes one Durable Object call and
// raises a KV hint that an outage may be open; a succeeding turn reads the
// hint (one KV read) and calls the object only when it is up. The hint can be
// stale either way: up with nothing open costs one wasted call, and down with
// an outage open leaves the outage to close at its next failure.
//
// It is a side remark, so it fails nothing it rides on: every error inside is
// logged and dropped. Free of `Env`: `./env-deps.ts` binds the object, the
// hint, the lead and the DM.

import { isCapacityFailure } from "../agent/model-provider";
import { isTestOrigin, type PostOrigin } from "../usage/record";

/** How long failures must have run before the lead hears about them. */
export const LASTING_MS = 30 * 60_000;

/** The longest gap between two failures of one outage, until the lead is told. */
export const CONTINUOUS_MS = 10 * 60_000;

/** How long a told outage may go without a failure before it is over. */
export const QUIET_MS = 30 * 60_000;

/** What is kept: times and a count, no message text. */
export interface OutageRecord {
  /** The first failure of this outage, ms since epoch. */
  first: number;
  /** The latest failure. */
  last: number;
  /** Asks that got the overloaded reply. */
  asks: number;
  /** When the lead's DM was claimed, if it was. */
  told?: number;
}

/** What a transition hands its caller to say. */
export interface OutageStep {
  /** A told outage that is over: its first failure and its end. */
  recovered?: { first: number; end: number };
  /** The outage the lead is now to be told about. Its `told` is the claim. */
  tell?: OutageRecord;
}

/**
 * A failure, against the record held.
 *
 * @param held - The record, or null
 * @param now - This failure's time
 */
export function outageOnFailure(held: OutageRecord | null, now: number): { record: OutageRecord; step: OutageStep } {
  const step: OutageStep = {};
  let open = held;
  if (open && open.told !== undefined && now - open.last > QUIET_MS) {
    step.recovered = { first: open.first, end: open.last };
    open = null;
  } else if (open && open.told === undefined && now - open.last > CONTINUOUS_MS) {
    open = null;
  }
  const record: OutageRecord = open
    ? { ...open, last: now, asks: open.asks + 1 }
    : { first: now, last: now, asks: 1 };
  if (record.told === undefined && now - record.first >= LASTING_MS) {
    record.told = now;
    step.tell = { ...record };
  }
  return { record, step };
}

/**
 * A turn that answered, against the record held: the record goes, and a told
 * outage is over. Its end is now, or its last failure when it has been quiet
 * longer than `QUIET_MS` already.
 *
 * @param held - The record, or null
 * @param now - The answer's time
 */
export function outageOnSuccess(held: OutageRecord | null, now: number): { record: null; step: OutageStep } {
  if (!held || held.told === undefined) return { record: null, step: {} };
  const end = now - held.last > QUIET_MS ? held.last : now;
  return { record: null, step: { recovered: { first: held.first, end } } };
}

/**
 * A refused DM gives its claim back, so the next failure tries again. Only the
 * claim it was handed: a newer outage's is left alone.
 *
 * @param held - The record, or null
 * @param told - The claim the refused DM was sent under
 */
export function outageOnRelease(held: OutageRecord | null, told: number): OutageRecord | null {
  if (!held || held.told !== told) return held;
  const { told: _released, ...rest } = held;
  return rest;
}

/** The serialised record: the Durable Object in production. */
export interface OutageStore {
  failed(at: number): Promise<OutageStep>;
  succeeded(at: number): Promise<OutageStep>;
  release(told: number): Promise<void>;
}

/** The cheap flag a succeeding turn reads before it calls the store. */
export interface OutageHint {
  isUp(): Promise<boolean>;
  raise(): Promise<void>;
  lower(): Promise<void>;
}

/** What the outage reads and where it says so. */
export interface OutageDeps {
  /** `LEAD_USER_ID`. With no lead nothing is kept: the binding skips it all. */
  lead: string;
  /** What is failing, as the DM names it: the model and its backup. */
  models: string;
  store: OutageStore;
  hint: OutageHint;
  /** A DM to one person. */
  dm(userId: string, text: string): Promise<{ ok: boolean; error?: string }>;
  now(): number;
}

/** The two moments the outage hears about. Neither throws. */
export interface CapacityOutage {
  /** A turn failed on capacity, with the backup model tried. */
  failed(): Promise<void>;
  /** A turn's model run answered. */
  succeeded(): Promise<void>;
}

/** The GCP hint the old #uno-bot alert carried, kept for the lead's DM. */
export const QUOTA_HINT =
  "Check GCP Console → IAM & Admin → Quotas (filter *Vertex AI* + the active model), or point `GEMINI_MODEL` at a model with headroom.";

/** `52 minutes`, `1 hour 5 minutes`. */
export function outageLength(ms: number): string {
  const total = Math.max(1, Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const mins = `${m} minute${m === 1 ? "" : "s"}`;
  if (h === 0) return mins;
  const hours = `${h} hour${h === 1 ? "" : "s"}`;
  return m === 0 ? hours : `${hours} ${mins}`;
}

/** The DM for a lasting outage. */
export function outageText(record: OutageRecord, now: number, models: string): string {
  const asks = `${record.asks} ask${record.asks === 1 ? "" : "s"}`;
  return (
    `:warning: The models have been over capacity for ${outageLength(now - record.first)}: ${models}. ` +
    `${asks} got the overloaded reply so far.\n${QUOTA_HINT}`
  );
}

/** The one line after it, once the outage is over. */
export function recoveryText(recovered: { first: number; end: number }): string {
  return `Back to normal: the capacity outage is over. It lasted ${outageLength(recovered.end - recovered.first)}.`;
}

function logDropped(what: string, err: unknown): void {
  console.warn(`[capacity-outage] ${what}: ${err instanceof Error ? err.message : String(err)}`);
}

/**
 * The outage, over its dependencies.
 *
 * @param deps - The store, the hint, the lead, the DM and the clock
 */
export function capacityOutage(deps: OutageDeps): CapacityOutage {
  async function say(step: OutageStep, now: number): Promise<void> {
    if (step.recovered) {
      const sent = await deps.dm(deps.lead, recoveryText(step.recovered));
      if (!sent.ok) logDropped("the recovery line was not sent", sent.error ?? "unknown error");
    }
    if (step.tell) {
      const sent = await deps.dm(deps.lead, outageText(step.tell, now, deps.models));
      if (!sent.ok) {
        logDropped("the lead was not told", sent.error ?? "unknown error");
        await deps.store.release(step.tell.told!);
      }
    }
  }

  return {
    async failed() {
      try {
        const now = deps.now();
        const step = await deps.store.failed(now);
        await deps.hint.raise().catch((err: unknown) => logDropped("the hint was not raised", err));
        await say(step, now);
      } catch (err) {
        logDropped("a failure was not recorded", err);
      }
    },

    async succeeded() {
      try {
        if (!(await deps.hint.isUp())) return;
        const now = deps.now();
        const step = await deps.store.succeeded(now);
        await say(step, now);
        await deps.hint.lower();
      } catch (err) {
        logDropped("a recovery was not recorded", err);
      }
    },
  };
}

/**
 * A serialised in-memory store over the same transitions: the Node suite's
 * stand-in for the Durable Object, whose own serialisation the workerd suite
 * holds (`tests/workerd/thread-state.conformance.test.ts`).
 */
export function inMemoryOutageStore(): OutageStore & { held(): OutageRecord | null } {
  let held: OutageRecord | null = null;
  return {
    held: () => held,
    async failed(at) {
      const { record, step } = outageOnFailure(held, at);
      held = record;
      return step;
    },
    async succeeded(at) {
      const { record, step } = outageOnSuccess(held, at);
      held = record;
      return step;
    },
    async release(told) {
      held = outageOnRelease(held, told);
    },
  };
}

/** What a turn that is not watched hears: nothing. */
export const NOT_WATCHED: CapacityOutage = { failed: async () => {}, succeeded: async () => {} };

/**
 * The outage a turn reports to, by where it came from: test traffic (a debug
 * route, a channel on `TEST_CHANNEL_IDS`, the usage record's place rule)
 * neither counts toward an outage nor closes one.
 *
 * @param place - Where the turn came from
 * @param outage - The outage a real turn reports to; built only when used
 */
export function outageForPlace(place: PostOrigin, outage: () => CapacityOutage): CapacityOutage {
  return isTestOrigin(place) ? NOT_WATCHED : outage();
}

/**
 * A turn's model run, watched: an answer is a success, a capacity failure
 * (`isCapacityFailure`, the same test the asker's overloaded line uses) is
 * recorded and thrown on, and any other failure is neither.
 *
 * @param outage - Where the run's outcome goes
 * @param run - The model run
 */
export async function watchCapacity<T>(outage: CapacityOutage, run: () => Promise<T>): Promise<T> {
  let result: T;
  try {
    result = await run();
  } catch (err) {
    if (isCapacityFailure(err)) await outage.failed();
    throw err;
  }
  await outage.succeeded();
  return result;
}
