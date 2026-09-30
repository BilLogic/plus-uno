// The commitment records conformance suite.
//
// Written only against the `CommitmentRecords` port and handed its runner, so
// the same cases run against the in-memory store under `node --test`
// (`tests/commitment-records-in-memory.test.ts`) and against the D1 adapter
// under workerd with the real migrations applied to a local D1
// (`tests/workerd/commitment-records.conformance.test.ts`). The sweep records'
// pattern (`tests/helpers/sweep-records-conformance.ts`).
import assert from "node:assert/strict";

import type { CommitmentRecord, CommitmentRecords } from "../../src/commitments/store";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

export function commitmentRow(over: Partial<CommitmentRecord> = {}): CommitmentRecord {
  return {
    id: "C0DESIGN:1790694600.000200",
    kind: "thread_promise",
    channel: "C0DESIGN",
    threadTs: "1790694000.000100",
    messageTs: "1790694600.000200",
    promiserId: "U0MAYA",
    requesterId: "U0BEA",
    deadlineAt: 1_790_914_400_000,
    dueAt: 1_790_914_400_000,
    state: "open",
    nudges: 0,
    snoozes: 0,
    confidence: 0.9,
    promisedAt: 1_790_694_600_000,
    detectedAt: 1_790_719_200_000,
    runDate: "2026-09-29",
    nudgeTs: null,
    followupTs: null,
    checkedOn: null,
    resolvedAt: null,
    ...over,
  };
}

export function runCommitmentRecordsConformance(
  label: string,
  make: () => CommitmentRecords,
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a row reads back field for field, nulls and all", async () => {
    const records = make();
    const row = commitmentRow();
    await records.addCommitments([row]);
    assert.deepEqual(await records.get(row.id), row);
    const bare = commitmentRow({ id: "C0DESIGN:2", messageTs: "2", requesterId: null, deadlineAt: null });
    await records.addCommitments([bare]);
    assert.deepEqual(await records.get(bare.id), bare);
    assert.equal(await records.get("C0DESIGN:missing"), null);
  });

  it("a promise read again keeps the state it has reached", async () => {
    const records = make();
    await records.addCommitments([commitmentRow()]);
    await records.update(commitmentRow().id, { state: "done", resolvedAt: 5 });
    await records.addCommitments([commitmentRow({ confidence: 0.8 })]);
    const row = await records.get(commitmentRow().id);
    assert.equal(row?.state, "done");
    assert.equal(row?.confidence, 0.9);
    assert.equal(row?.resolvedAt, 5);
  });

  it("the next due is the live one due soonest, once per morning", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:late", dueAt: 300 }),
      commitmentRow({ id: "C:soon", dueAt: 100 }),
      commitmentRow({ id: "C:future", dueAt: 900 }),
      commitmentRow({ id: "C:done", dueAt: 50, state: "done" }),
      commitmentRow({ id: "C:lapsed", dueAt: 50, state: "lapsed" }),
      commitmentRow({ id: "C:nudged", dueAt: 200, state: "nudged", nudges: 1 }),
      commitmentRow({ id: "C:snoozed", dueAt: 250, state: "snoozed", snoozes: 1 }),
    ]);
    const order: string[] = [];
    for (;;) {
      const next = await records.nextDue(500, "2026-10-01");
      if (!next) break;
      order.push(next.id);
      await records.update(next.id, { checkedOn: "2026-10-01" });
    }
    assert.deepEqual(order, ["C:soon", "C:nudged", "C:snoozed", "C:late"]);
    // Tomorrow's morning looks again.
    assert.equal((await records.nextDue(500, "2026-10-02"))?.id, "C:soon");
  });

  it("a reminder's ts finds its commitment, first reminder or follow-up", async () => {
    const records = make();
    await records.addCommitments([commitmentRow({ state: "nudged", nudgeTs: "111.1", followupTs: "222.2" })]);
    assert.equal((await records.byReminderTs("111.1"))?.id, commitmentRow().id);
    assert.equal((await records.byReminderTs("222.2"))?.id, commitmentRow().id);
    assert.equal(await records.byReminderTs("333.3"), null);
  });

  it("an update changes only the fields it names", async () => {
    const records = make();
    await records.addCommitments([commitmentRow()]);
    await records.update(commitmentRow().id, { state: "nudged", nudges: 1, nudgeTs: "111.1", dueAt: 42, checkedOn: "2026-10-01" });
    await records.update(commitmentRow().id, {});
    assert.deepEqual(await records.get(commitmentRow().id), {
      ...commitmentRow(),
      state: "nudged",
      nudges: 1,
      nudgeTs: "111.1",
      dueAt: 42,
      checkedOn: "2026-10-01",
    });
  });
}
