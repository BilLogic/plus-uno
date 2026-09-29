// The sweep records conformance suite.
//
// Written only against the `SweepRecords` port and handed its runner, so the
// same cases run against the in-memory store under `node --test`
// (`tests/sweep-records-in-memory.test.ts`) and against the D1 adapter under
// workerd with the real migrations applied to a local D1
// (`tests/workerd/sweep-records.conformance.test.ts`). The pattern is the
// usage log's (`tests/helpers/usage-log-conformance.ts`).
import assert from "node:assert/strict";

import type { SweepItemRecord, SweepRecords, SweepRunRecord } from "../../src/sweep/store";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

export function sweepRun(over: Partial<SweepRunRecord> = {}): SweepRunRecord {
  return {
    runId: "2026-09-29:sweep:C0DESIGN",
    runDate: "2026-09-29",
    runName: "end-of-day",
    jobKey: "sweep:C0DESIGN",
    channels: ["C0DESIGN"],
    threads: 3,
    items: 2,
    subrequests: 14,
    d1Queries: 6,
    outcome: "handled",
    note: null,
    startedAt: 1_790_719_200_000,
    finishedAt: 1_790_719_204_500,
    ...over,
  };
}

export function sweepItem(over: Partial<SweepItemRecord> = {}): SweepItemRecord {
  return {
    itemId: "2026-09-30:C0DESIGN:1790694000.000000:blk-1#blk-1",
    findingId: "C0DESIGN:1790694000.000000:blk-1",
    destination: "C0DESIGN:1790694000.000000",
    runDate: "2026-09-29",
    channel: "C0DESIGN",
    threadTs: "1790694000.000000",
    blockId: "blk-1",
    ownerId: "U0ADE",
    status: "proposed",
    cardKey: "2026-09-30:C0DESIGN:1790694000.000000:blk-1",
    proposalTs: "1790776800.900001",
    driftAt: 1_790_697_600_000,
    detectedAt: 1_790_719_200_000,
    postedAt: 1_790_776_800_000,
    resolvedAt: null,
    ...over,
  };
}

export function runSweepRecordsConformance(label: string, make: () => SweepRecords, runner: ConformanceRunner): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a channel never swept has no cursor, and a saved one reads back", async () => {
    const records = make();
    assert.equal(await records.cursor("C0DESIGN"), null);
    await records.saveCursor("C0DESIGN", "1790694000.000100", 1);
    await records.saveCursor("C0DESIGN", "1790697600.000200", 2);
    assert.equal(await records.cursor("C0DESIGN"), "1790697600.000200");
    assert.equal(await records.cursor("C0OTHER"), null);
  });

  it("a run reads back field for field, and a retried run rewrites its own row", async () => {
    const records = make();
    await records.recordRun(sweepRun({ outcome: "deferred", note: "budget stopped it" }));
    await records.recordRun(sweepRun());
    assert.deepEqual(await records.getRun(sweepRun().runId), sweepRun());
    assert.equal(await records.getRun("2026-09-29:nothing"), null);
  });

  it("an item already recorded is not added twice", async () => {
    const records = make();
    await records.addItems([sweepItem()]);
    await records.addItems([sweepItem({ ownerId: "U0SOMEONE" })]);
    assert.deepEqual(await records.itemsOnCard(sweepItem().cardKey), [sweepItem()]);
  });

  it("items are found by their card, their live proposal and their finding", async () => {
    const records = make();
    const second = sweepItem({ itemId: `${sweepItem().cardKey}#blk-2`, blockId: "blk-2", findingId: "C0DESIGN:1790694000.000000:blk-2" });
    const elsewhere = sweepItem({
      itemId: "other#blk-9",
      cardKey: "other",
      proposalTs: "1790776800.900002",
      blockId: "blk-9",
      findingId: "C0DESIGN:1790694000.000000:blk-9",
      status: "dropped",
    });
    await records.addItems([sweepItem(), second, elsewhere]);
    assert.deepEqual(await records.itemsForProposal("1790776800.900001"), [sweepItem(), second]);
    assert.deepEqual(await records.itemsOnCard("other"), [elsewhere]);
    assert.deepEqual(await records.itemsForProposal("none"), []);
    assert.deepEqual(await records.itemsForFindings([elsewhere.findingId, sweepItem().findingId, "nothing"]), [
      sweepItem(),
      elsewhere,
    ].sort((a, b) => a.itemId.localeCompare(b.itemId)));
    assert.deepEqual(await records.itemsForFindings([]), []);
    assert.deepEqual(await records.openItems(), [sweepItem(), second]);
  });

  it("a card's items are recorded in one call, then marked posted, or released", async () => {
    const records = make();
    const unposted = (blockId: string, cardKey: string) =>
      sweepItem({ itemId: `${cardKey}#${blockId}`, blockId, cardKey, findingId: `C0DESIGN:1:${blockId}`, proposalTs: null, postedAt: null });
    const cardA = [unposted("a1", "card-a"), unposted("a2", "card-a")];
    const cardB = [unposted("b1", "card-b")];
    await records.addItems([...cardA, ...cardB]);
    await records.markPosted("card-a", "1790776800.900009", 1_790_776_801_000);
    await records.releaseCard("card-b");
    // Releasing a posted card deletes nothing: only an unposted item goes.
    await records.releaseCard("card-a");
    assert.deepEqual(
      await records.itemsOnCard("card-a"),
      cardA.map((i) => ({ ...i, proposalTs: "1790776800.900009", postedAt: 1_790_776_801_000 })),
    );
    assert.deepEqual(await records.itemsOnCard("card-b"), []);
  });

  it("a thread's failed nights count once per run date, and clear", async () => {
    const records = make();
    assert.equal(await records.recordThreadFailure("C0DESIGN", "1790.1", "2026-09-29"), 1);
    assert.equal(await records.recordThreadFailure("C0DESIGN", "1790.1", "2026-09-29"), 1, "a same-night retry");
    assert.equal(await records.recordThreadFailure("C0DESIGN", "1790.1", "2026-09-30"), 2);
    assert.deepEqual(await records.failingThreads("C0DESIGN"), ["1790.1"]);
    assert.deepEqual(await records.failingThreads("C0OTHER"), []);
    await records.clearThreadFailure("C0DESIGN", "1790.1");
    assert.deepEqual(await records.failingThreads("C0DESIGN"), []);
    assert.equal(await records.recordThreadFailure("C0DESIGN", "1790.1", "2026-10-01"), 1);
  });

  it("an update changes only what it names", async () => {
    const records = make();
    await records.addItems([sweepItem()]);
    await records.updateItem(sweepItem().itemId, { proposalTs: "1790780000.000001", postedAt: 1_790_780_000_000 });
    await records.updateItem(sweepItem().itemId, { status: "confirmed", resolvedAt: 1_790_780_400_000 });
    assert.deepEqual(await records.itemsOnCard(sweepItem().cardKey), [
      sweepItem({ proposalTs: "1790780000.000001", postedAt: 1_790_780_000_000, status: "confirmed", resolvedAt: 1_790_780_400_000 }),
    ]);
  });
}
