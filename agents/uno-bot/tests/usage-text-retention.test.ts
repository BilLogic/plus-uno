// No channel ask's text outlives 14 days — across a weekend, and across one
// missed run.
//
// The runs are 09:00 ET Monday to Friday and 00:00 ET Tuesday to Saturday,
// so the purge cannot run every day. These cases walk the real schedule hour by hour — which firings
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
import { cronFirings } from "./helpers/cron";

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

/** Every firing that runs the purge, from `from` for `days` days: the
 *  triggers' firings (wrangler.toml) that start a run holding it. */
function purgeFirings(from: number, days: number): number[] {
  return cronFirings(from, days).filter((t) =>
    runsForFiring(t).some((name) => planRun(name, t).jobs.some((job) => job.kind === "usage-text-purge")),
  );
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

// Saturday 3 October 2026, 04:30 UTC — just after the run that swept Friday.
const SATURDAY_SMALL_HOURS = Date.UTC(2026, 9, 3, 4, 30);

test("both runs purge: Tuesday's 00:00 and 09:00 ET", () => {
  const tuesday = Date.UTC(2026, 9, 6);
  assert.deepEqual(
    purgeFirings(tuesday, 1).map((t) => new Date(t).getUTCHours()),
    [4, 13],
  );
  // The longest gap between two purges is the weekend: Sat 00:00 to Mon 09:00 ET, 57 h.
  const week = purgeFirings(Date.UTC(2026, 9, 5), 8);
  const gaps = week.slice(1).map((t, i) => (t - week[i]!) / HOUR);
  assert.deepEqual(gaps, [15, 9, 15, 9, 15, 9, 15, 9, 15, 57]);
});

test("an ask just after Saturday's 00:00 run is gone before it is 14 days old", async () => {
  const age = await ageWhenCleared(SATURDAY_SMALL_HOURS, undefined, 0);
  assert.ok(age >= PURGE_AFTER_MS, "not before the cutoff");
  assert.ok(age <= TEXT_RETENTION_MS, `cleared at ${age / DAY} days`);
});

test("one skipped run does not let text outlive 14 days", async () => {
  // The worst case: the text passes the cutoff just after Saturday's 00:00
  // run, and the Monday morning run is missed — 72 h to Tuesday 00:00.
  const askedAt = Date.UTC(2026, 9, 3, 4, 1) - PURGE_AFTER_MS;
  const mondayMorning = Date.UTC(2026, 9, 5, 13);
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
  // Friday 30 Oct is swept at Sat 31 Oct 04:00 UTC (EDT) and Mon 2 Nov's
  // runs are 14:00 UTC and Tue 3 Nov 05:00 UTC (EST): the weekend gap is an
  // hour longer than usual.
  const fridaySwept = Date.UTC(2026, 9, 31, 4);
  const askedAt = fridaySwept + 60 * 1000 - PURGE_AFTER_MS;
  const age = await ageWhenCleared(askedAt, Date.UTC(2026, 10, 2, 14));
  assert.ok(age <= TEXT_RETENTION_MS, `cleared at ${age / DAY} days`);
  const weekStart = Date.UTC(2026, 9, 26);
  for (let at = weekStart; at < weekStart + 14 * DAY; at += HOUR + 7 * 60 * 1000) {
    for (const skip of [undefined, ...purgeFirings(at, 21)]) {
      const cleared = await ageWhenCleared(at, skip);
      assert.ok(cleared <= TEXT_RETENTION_MS, `asked ${new Date(at).toISOString()}, skipped ${skip}`);
    }
  }
});
