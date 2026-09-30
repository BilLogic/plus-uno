// The DM watch records conformance suite.
//
// Written only against the `DmWatchRecords` port and handed its runner, so the
// same cases run against the in-memory store under `node --test`
// (`tests/dm-watch-records-in-memory.test.ts`) and against the D1 adapter under
// workerd with the real migrations applied to a local D1
// (`tests/workerd/dm-watch-records.conformance.test.ts`).
import assert from "node:assert/strict";

import { positionScope, type DmCommitmentRecord, type DmWatchRecords } from "../../src/dm-watch/store";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

export function dmRow(over: Partial<DmCommitmentRecord> = {}): DmCommitmentRecord {
  return {
    id: "U0MAYA:D0BEA:1790694600.000200",
    ownerId: "U0MAYA",
    kind: "made",
    permalink: "https://plus.slack.com/archives/D0BEA/p1790694600000200",
    dueAt: 1_790_914_400_000,
    state: "open",
    nudges: 0,
    snoozes: 0,
    detectedAt: 1_790_719_200_000,
    reminderChannel: null,
    nudgeTs: null,
    followupTs: null,
    earlierFollowupTs: [],
    checkedOn: null,
    holds: 0,
    remindedOn: null,
    resolvedAt: null,
    ...over,
  };
}

export function runDmWatchRecordsConformance(label: string, make: () => DmWatchRecords, runner: ConformanceRunner): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a switch is off until turned on, and each person sees only their own", async () => {
    const r = make();
    assert.deepEqual(await r.switches("U0MAYA"), []);
    await r.setSwitch("U0MAYA", "promises_made", true, { now: 100, readThrough: "100.000000" });
    assert.deepEqual(await r.switches("U0MAYA"), [{ feature: "promises_made", since: 100, readThrough: "100.000000" }]);
    assert.deepEqual(await r.switches("U0BEA"), []);
    assert.deepEqual(await r.watchers(), ["U0MAYA"]);
  });

  it("turning a switch on again keeps its place; off removes it, and the last one off leaves the watchers", async () => {
    const r = make();
    await r.setSwitch("U0MAYA", "promises_made", true, { now: 100, readThrough: "100.000000" });
    await r.setSwitch("U0MAYA", "promises_to_me", true, { now: 200, readThrough: "200.000000" });
    await r.setSwitch("U0MAYA", "promises_made", true, { now: 400, readThrough: "400.000000" });
    const on = await r.switches("U0MAYA");
    assert.deepEqual(
      on.sort((a, b) => a.feature.localeCompare(b.feature)),
      [
        { feature: "promises_made", since: 100, readThrough: "100.000000" },
        { feature: "promises_to_me", since: 200, readThrough: "200.000000" },
      ],
    );
    await r.setSwitch("U0MAYA", "promises_made", false, { now: 500, readThrough: "500.000000" });
    assert.deepEqual((await r.switches("U0MAYA")).map((s) => s.feature), ["promises_to_me"]);
    await r.setSwitch("U0MAYA", "promises_to_me", false, { now: 500, readThrough: "500.000000" });
    assert.deepEqual(await r.watchers(), []);
  });

  it("watchers narrow to the switches named, and each switch's job keeps its own read positions", async () => {
    const r = make();
    await r.setSwitch("U0MAYA", "promises_made", true, { now: 100, readThrough: "100.000000" });
    await r.setSwitch("U0BEA", "dm_capture", true, { now: 100, readThrough: "100.000000" });
    assert.deepEqual(await r.watchers(), ["U0BEA", "U0MAYA"]);
    assert.deepEqual(await r.watchers(["promises_made", "promises_to_me"]), ["U0MAYA"]);
    assert.deepEqual(await r.watchers(["dm_capture"]), ["U0BEA"]);
    const at = { through: "10.000000", upTo: null };
    await r.savePositions(positionScope("U0BEA", "dm_capture"), { D0MAYA: at });
    assert.deepEqual(await r.positions(positionScope("U0BEA", "promises_made")), {});
    assert.deepEqual(await r.positions(positionScope("U0BEA", "dm_capture")), { D0MAYA: at });
    await r.clearPositions(positionScope("U0BEA", "promises_made"));
    assert.deepEqual(await r.positions(positionScope("U0BEA", "dm_capture")), { D0MAYA: at });
  });

  it("keeps how far each DM was read, per person, upserted in one go, and forgets them on request", async () => {
    const r = make();
    assert.deepEqual(await r.positions("U0MAYA"), {});
    const at = (through: string, upTo: string | null = null) => ({ through, upTo });
    await r.savePositions("U0MAYA", { D0BEA: at("10.000000", "15.000000"), D0KAI: at("20.000000") });
    await r.savePositions("U0MAYA", { D0BEA: at("30.000000") });
    await r.savePositions("U0BEA", { D0MAYA: at("5.000000", "9.000000") });
    await r.savePositions("U0MAYA", {});
    assert.deepEqual(await r.positions("U0MAYA"), { D0BEA: at("30.000000"), D0KAI: at("20.000000") });
    await r.clearPositions("U0MAYA");
    assert.deepEqual(await r.positions("U0MAYA"), {});
    assert.deepEqual(await r.positions("U0BEA"), { D0MAYA: at("5.000000", "9.000000") });
  });

  it("a row reads back field for field, and a second insert keeps the first", async () => {
    const r = make();
    const row = dmRow();
    await r.addCommitments([row]);
    assert.deepEqual(await r.get(row.id), row);
    await r.addCommitments([{ ...row, state: "done" }]);
    assert.equal((await r.get(row.id))?.state, "open");
    assert.equal(await r.get("nope"), null);
  });

  it("nextDue takes one owner's live row due soonest that this morning has not looked at", async () => {
    const r = make();
    await r.addCommitments([
      dmRow({ id: "a", dueAt: 300 }),
      dmRow({ id: "b", dueAt: 200 }),
      dmRow({ id: "c", dueAt: 100, state: "done" }),
      dmRow({ id: "d", dueAt: 50, ownerId: "U0BEA" }),
      dmRow({ id: "e", dueAt: 900 }),
    ]);
    assert.equal((await r.nextDue("U0MAYA", 500, "2026-10-01"))?.id, "b");
    await r.update("b", { checkedOn: "2026-10-01" });
    assert.equal((await r.nextDue("U0MAYA", 500, "2026-10-01"))?.id, "a");
    await r.update("a", { checkedOn: "2026-10-01" });
    assert.equal(await r.nextDue("U0MAYA", 500, "2026-10-01"), null);
    assert.equal((await r.nextDue("U0MAYA", 500, "2026-10-02"))?.id, "b");
  });

  it("counts an owner's reminders on a morning, and finds a row by either reminder", async () => {
    const r = make();
    await r.addCommitments([dmRow({ id: "a" }), dmRow({ id: "b" }), dmRow({ id: "c", ownerId: "U0BEA" })]);
    await r.update("a", { remindedOn: "2026-10-01", reminderChannel: "D0UNO", nudgeTs: "111.1", state: "nudged", nudges: 1 });
    await r.update("b", { remindedOn: "2026-10-01", reminderChannel: "D0UNO", followupTs: "222.2" });
    await r.update("c", { remindedOn: "2026-10-01" });
    assert.equal(await r.remindedCount("U0MAYA", "2026-10-01"), 2);
    assert.equal(await r.remindedCount("U0MAYA", "2026-10-02"), 0);
    assert.equal((await r.byReminderTs("D0UNO", "111.1"))?.id, "a");
    assert.equal((await r.byReminderTs("D0UNO", "222.2"))?.id, "b");
    assert.equal(await r.byReminderTs("D0UNO", "333.3"), null);
    // A follow-up replaced by a later post still finds its row.
    await r.update("b", { followupTs: "444.4", earlierFollowupTs: ["222.2", "333.3"] });
    assert.equal((await r.byReminderTs("D0UNO", "333.3"))?.id, "b");
    assert.equal((await r.byReminderTs("D0UNO", "444.4"))?.id, "b");
    assert.deepEqual((await r.get("b"))?.earlierFollowupTs, ["222.2", "333.3"]);
    // The same ts in another conversation is not this reminder.
    assert.equal(await r.byReminderTs("D0ELSE", "111.1"), null);
    const a = await r.get("a");
    assert.equal(a?.state, "nudged");
    assert.equal(a?.nudges, 1);
  });

  it("lapseLive lapses only that owner's live rows of those kinds", async () => {
    const r = make();
    await r.addCommitments([
      dmRow({ id: "made-open" }),
      dmRow({ id: "made-nudged", state: "nudged" }),
      dmRow({ id: "made-done", state: "done", resolvedAt: 5 }),
      dmRow({ id: "to-open", kind: "made_to" }),
      dmRow({ id: "other-open", ownerId: "U0BEA" }),
    ]);
    await r.lapseLive("U0MAYA", ["made"], 777);
    const state = async (id: string) => {
      const row = await r.get(id);
      return [row?.state, row?.resolvedAt];
    };
    assert.deepEqual(await state("made-open"), ["lapsed", 777]);
    assert.deepEqual(await state("made-nudged"), ["lapsed", 777]);
    assert.deepEqual(await state("made-done"), ["done", 5]);
    assert.deepEqual(await state("to-open"), ["open", null]);
    assert.deepEqual(await state("other-open"), ["open", null]);
  });
}
