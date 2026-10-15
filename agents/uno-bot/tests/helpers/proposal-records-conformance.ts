// The drawn-proposal records conformance suite.
//
// Written only against the `ProposalRecords` port and handed its runner, so the
// same cases run against the in-memory store under `node --test`
// (`tests/proposal-records-in-memory.test.ts`) and against the D1 adapter under
// workerd with the real migrations applied to a local D1
// (`tests/workerd/proposal-records.conformance.test.ts`).
import assert from "node:assert/strict";

import type { DrawnProposal, ProposalRecords } from "../../src/blueprint-upkeep/proposal-records";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

export function drawn(over: Partial<DrawnProposal> = {}): DrawnProposal {
  return {
    proposalTs: "1700000000.000500",
    channel: "C0TEAM",
    threadTs: "1700000000.000100",
    replyTs: "1700000000.000100",
    requesterId: "U0MAYA",
    pathId: "path-new",
    todayPathId: "path-1",
    cellIds: ["cell-a", "cell-b"],
    writtenAt: 1_790_000_000_000,
    cardId: null,
    ...over,
  };
}

export function runProposalRecordsConformance(label: string, make: () => ProposalRecords, runner: ConformanceRunner): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a thread's drawn proposal reads back whole, and other threads see none of it", async () => {
    const r = make();
    await r.record(drawn());
    assert.deepEqual(await r.inThread("C0TEAM", "1700000000.000100"), [drawn()]);
    assert.deepEqual(await r.inThread("C0TEAM", "1700000000.999999"), []);
    assert.deepEqual(await r.inThread("C0OTHER", "1700000000.000100"), []);
  });

  it("recording the same card twice keeps the first", async () => {
    const r = make();
    await r.record(drawn());
    await r.record(drawn({ pathId: "path-other", writtenAt: 5 }));
    assert.deepEqual(await r.inThread("C0TEAM", "1700000000.000100"), [drawn()]);
  });

  it("a thread's proposals come back oldest first", async () => {
    const r = make();
    await r.record(drawn({ proposalTs: "1700000000.000900", pathId: "path-later", writtenAt: 2_000 }));
    await r.record(drawn({ proposalTs: "1700000000.000500", writtenAt: 1_000 }));
    assert.deepEqual((await r.inThread("C0TEAM", "1700000000.000100")).map((p) => p.pathId), ["path-new", "path-later"]);
  });

  it("linking a card links the thread's unlinked proposals and leaves a linked one as it was", async () => {
    const r = make();
    await r.record(drawn({ proposalTs: "1.1", writtenAt: 1 }));
    await r.record(drawn({ proposalTs: "1.2", writtenAt: 2 }));
    await r.record(drawn({ proposalTs: "1.3", threadTs: "9.9", writtenAt: 3 }));
    assert.equal(await r.linkCard("C0TEAM", "1700000000.000100", "page-a"), 2);
    assert.equal(await r.linkCard("C0TEAM", "1700000000.000100", "page-b"), 0, "already linked");
    assert.deepEqual((await r.inThread("C0TEAM", "1700000000.000100")).map((p) => p.cardId), ["page-a", "page-a"]);
    assert.deepEqual((await r.inThread("C0TEAM", "9.9")).map((p) => p.cardId), [null]);
  });

  it("the unlinked ones written by a time come back oldest first, up to the limit", async () => {
    const r = make();
    await r.record(drawn({ proposalTs: "1.1", threadTs: "t1", writtenAt: 100 }));
    await r.record(drawn({ proposalTs: "1.2", threadTs: "t2", writtenAt: 50 }));
    await r.record(drawn({ proposalTs: "1.3", threadTs: "t3", writtenAt: 300 }));
    await r.record(drawn({ proposalTs: "1.4", threadTs: "t4", writtenAt: 10 }));
    await r.linkCard("C0TEAM", "t4", "page-a");
    assert.deepEqual((await r.unlinkedBefore(200, 10)).map((p) => p.proposalTs), ["1.2", "1.1"]);
    assert.deepEqual((await r.unlinkedBefore(200, 1)).map((p) => p.proposalTs), ["1.2"]);
    assert.deepEqual(await r.unlinkedBefore(5, 10), []);
  });
}
