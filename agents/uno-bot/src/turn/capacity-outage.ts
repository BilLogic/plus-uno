// A model capacity outage, told to the lead only when it lasts.
//
// A capacity failure used to post an alert to #uno-bot, at most once per ten
// minutes. Nearly all of those were noise: the backup model
// (`GEMINI_FALLBACK_MODEL`) takes over quietly when the main one is out of
// quota, and a turn fails only when both are. When that happens the asker gets
// the plain overloaded line in their own thread (`slack/failure-message.ts`),
// and this module keeps the count.
//
// ONE OUTAGE, ONE DM, ONE RECOVERY LINE. Each failing turn records its time
// under one HARNESS_KV key, with no message text. Once failures have run for
// `LASTING_MS` (the first one at least 30 minutes ago, with this one inside
// the last 10), the lead (`LEAD_USER_ID`) gets one DM saying what is failing,
// how many asks it cost and where the quota lives. The next turn that succeeds
// clears the record and, when the lead was told, sends one "back to normal"
// line in the same DM with how long it lasted. A gap of more than
// `CONTINUOUS_MS` between failures before anyone was told starts the count
// again, so two blips an hour apart are two blips and not an outage.
//
// COST, on Workers Free: a failing turn reads the key once and writes it once;
// a succeeding turn reads it once and writes only when there was an outage to
// clear. Two turns failing at the same moment can each miss the other's count,
// which is an undercount of asks and nothing worse.
//
// It is a side remark, so it fails nothing it rides on: every error inside is
// logged and dropped. Free of `Env`: `./env-deps.ts` binds the store, the lead
// and the DM.

/** How long failures must have run before the lead hears about them. */
export const LASTING_MS = 30 * 60_000;

/** The longest gap between two failures of one outage, until the lead is told. */
export const CONTINUOUS_MS = 10 * 60_000;

/** The HARNESS_KV key the outage is kept under. */
export const OUTAGE_KV_KEY = "capacity-outage";

/** What is kept: times and a count, no message text. */
export interface OutageRecord {
  /** The first failure of this outage, ms since epoch. */
  first: number;
  /** The latest failure. */
  last: number;
  /** Asks that got the overloaded reply. */
  asks: number;
  /** When the lead was DMed, if they were. */
  told?: number;
}

/** What the outage reads and where it says so. */
export interface OutageDeps {
  /** `LEAD_USER_ID`, or null when unset: then nobody is DMed. */
  lead: string | null;
  /** What is failing, as the DM names it: the model and its backup. */
  models: string;
  read(): Promise<OutageRecord | null>;
  /** Null clears the record. */
  write(record: OutageRecord | null): Promise<void>;
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

/** The one line after it, once a turn answers again. */
export function recoveryText(record: OutageRecord, now: number): string {
  return `Back to normal: answers are going through again, after ${outageLength(now - record.first)} over capacity.`;
}

function logDropped(what: string, err: unknown): void {
  console.warn(`[capacity-outage] ${what}: ${err instanceof Error ? err.message : String(err)}`);
}

/**
 * The outage, over its dependencies.
 *
 * @param deps - The store, the lead, the DM and the clock
 */
export function capacityOutage(deps: OutageDeps): CapacityOutage {
  return {
    async failed() {
      try {
        const now = deps.now();
        const held = await deps.read();
        const continues = held !== null && (held.told !== undefined || now - held.last <= CONTINUOUS_MS);
        const record: OutageRecord = continues
          ? { ...held, last: now, asks: held.asks + 1 }
          : { first: now, last: now, asks: 1 };
        if (deps.lead && record.told === undefined && now - record.first >= LASTING_MS) {
          const sent = await deps.dm(deps.lead, outageText(record, now, deps.models));
          if (sent.ok) record.told = now;
          else logDropped("the lead was not told", sent.error ?? "unknown error");
        }
        await deps.write(record);
      } catch (err) {
        logDropped("a failure was not recorded", err);
      }
    },

    async succeeded() {
      try {
        const held = await deps.read();
        if (!held) return;
        if (held.told !== undefined && deps.lead) {
          const sent = await deps.dm(deps.lead, recoveryText(held, deps.now()));
          if (!sent.ok) logDropped("the recovery line was not sent", sent.error ?? "unknown error");
        }
        await deps.write(null);
      } catch (err) {
        logDropped("a recovery was not recorded", err);
      }
    },
  };
}

/**
 * A turn's model run, watched: an answer is a success, a capacity failure is
 * recorded and thrown on so the asker still gets the overloaded line, and any
 * other failure is neither.
 *
 * @param outage - Where the run's outcome goes
 * @param isCapacity - Whether an error is a capacity failure: the Slack
 *   adapter's own test (`slack/delivery.ts` `isCapacityError`), so the asker's
 *   line and this count never disagree
 * @param run - The model run
 */
export async function watchCapacity<T>(
  outage: CapacityOutage,
  isCapacity: (err: unknown) => boolean,
  run: () => Promise<T>,
): Promise<T> {
  let result: T;
  try {
    result = await run();
  } catch (err) {
    if (isCapacity(err)) await outage.failed();
    throw err;
  }
  await outage.succeeded();
  return result;
}
