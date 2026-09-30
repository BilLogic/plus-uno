// No channel ask's text outlives 14 days — across a weekend, and across one
// missed run.
//
// The runs are weekday-only (10:00 and 18:00 ET), so the purge cannot run
// every day. These cases walk the real schedule hour by hour — which firings
// start a run, and which runs hold the purge job, read from `runs.ts` itself —
// and the real purge job, over a store holding one ask, and check that the
// text is gone before it is 14 days old. The purge is the last job of its run
// and may start up to `PURGE_LATE_MS` after its firing, so each case takes the
// worst of that spread: every purge decides at its firing time, and the one
// that clears the text is counted as running late.
import assert from "node:assert/strict";
import test from "node:test";

import { planRun, runsForFiring } from "../src/scheduled/runs";
import { PURGE_AFTER_MS, TEXT_RETENTION_MS, runTextPurge } from "../src/usage/classify-run";
import type { AskCategoryStore } from "../src/usage/category-store";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** How late the purge may start after its run's firing. */
const PURGE_LATE_MS = HOUR;

/** A store holding one ask's text, and nothing else the purge can see. */
function oneAsk(askedAt: number): AskCategoryStore & { held(): boolean } {
  let held = true;
  return {
    held: () => held,
    async pendingAsks() {
      return [];
    },
    async label() {},
    async recordFailures() {
      return 0;
    },
    async purgeTextBefore(cutoff) {
      if (held && askedAt < cutoff) {
        held = false;
        return 1;
      }
      return 0;
    },
  };
}

/** Every firing that runs the purge, from `from` for `days` days. */
function purgeFirings(from: number, days: number): number[] {
  const firings: number[] = [];
  const start = Math.ceil(from / HOUR) * HOUR;
  for (let t = start; t < from + days * DAY; t += HOUR) {
    const purges = runsForFiring(t).some((name) =>
      planRun(name, t).jobs.some((job) => job.kind === "usage-text-purge"),
    );
    // The cron fires on weekdays only (wrangler.toml `* * 1-5`).
    const weekday = new Date(t).getUTCDay() % 6 !== 0;
    if (purges && weekday) firings.push(t);
  }
  return firings;
}

/** How old the ask's text is when a purge finally clears it, with `skip`
 *  (a firing time) missed and the clearing purge `late` after its firing. A
 *  purge that ran late would clear no less, so each decides at its firing. */
async function ageWhenCleared(askedAt: number, skip?: number, late = PURGE_LATE_MS): Promise<number> {
  const store = oneAsk(askedAt);
  for (const t of purgeFirings(askedAt, 21)) {
    if (t === skip) continue;
    await runTextPurge({ store, now: () => t, dryRun: false });
    if (!store.held()) return t + late - askedAt;
  }
  throw new Error("never cleared");
}

// Friday 2 October 2026, 22:30 UTC — just after that day's end-of-day run.
const FRIDAY_EVENING = Date.UTC(2026, 9, 2, 22, 30);

test("both weekday runs purge", () => {
  const monday = Date.UTC(2026, 9, 5);
  assert.deepEqual(
    purgeFirings(monday, 1).map((t) => new Date(t).getUTCHours()),
    [14, 22],
  );
});

test("a Friday-evening ask's text is gone before it is 14 days old", async () => {
  const age = await ageWhenCleared(FRIDAY_EVENING, undefined, 0);
  assert.ok(age >= PURGE_AFTER_MS, "not before the cutoff");
  assert.ok(age <= TEXT_RETENTION_MS, `cleared at ${age / DAY} days`);
});

test("one skipped run does not let text outlive 14 days", async () => {
  // The worst case: the text passes the cutoff just after a Friday's last
  // run, and the Monday morning run is missed.
  const askedAt = Date.UTC(2026, 9, 2, 22, 1) - PURGE_AFTER_MS;
  const mondayMorning = Date.UTC(2026, 9, 5, 14);
  const age = await ageWhenCleared(askedAt, mondayMorning);
  assert.ok(age <= TEXT_RETENTION_MS, `cleared at ${age / DAY} days`);
});

test("any ask hour in a week, with any one run missed, is cleared within 14 days", async () => {
  const weekStart = Date.UTC(2026, 9, 5);
  for (let askedAt = weekStart; askedAt < weekStart + 7 * DAY; askedAt += HOUR + 7 * 60 * 1000) {
    const firings = purgeFirings(askedAt, 21);
    for (const skip of [undefined, ...firings]) {
      const age = await ageWhenCleared(askedAt, skip);
      assert.ok(age <= TEXT_RETENTION_MS, `asked ${new Date(askedAt).toISOString()}, skipped ${skip}`);
    }
  }
});

test("the weekend the clocks go back, with one run missed and the purge late, still clears within 14 days", async () => {
  // Fri 30 Oct's end-of-day run is 22:00 UTC (EDT) and Mon 2 Nov's runs are
  // 15:00 and 23:00 UTC (EST): the weekend gap is an hour longer than usual.
  const fridayRun = Date.UTC(2026, 9, 30, 22);
  const askedAt = fridayRun + 60 * 1000 - PURGE_AFTER_MS;
  const age = await ageWhenCleared(askedAt, Date.UTC(2026, 10, 2, 15));
  assert.ok(age <= TEXT_RETENTION_MS, `cleared at ${age / DAY} days`);
  const weekStart = Date.UTC(2026, 9, 26);
  for (let at = weekStart; at < weekStart + 14 * DAY; at += HOUR + 7 * 60 * 1000) {
    for (const skip of [undefined, ...purgeFirings(at, 21)]) {
      const cleared = await ageWhenCleared(at, skip);
      assert.ok(cleared <= TEXT_RETENTION_MS, `asked ${new Date(at).toISOString()}, skipped ${skip}`);
    }
  }
});
