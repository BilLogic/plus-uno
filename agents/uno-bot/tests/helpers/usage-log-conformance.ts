// The UsageLog conformance suite.
//
// Written only against the `UsageLog` port, and handed its runner, so the same
// cases run against the in-memory adapter under `node --test`
// (`tests/usage-log-in-memory.test.ts`) and against the D1 adapter under
// workerd with the real migrations applied to a local D1
// (`tests/workerd/usage-log.conformance.test.ts`). The pattern is ThreadState's
// (`tests/helpers/thread-state-conformance.ts`).
import assert from "node:assert/strict";

import type { TurnRecord, UsageLog } from "../../src/usage/store";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

/** A fully populated channel turn — every nullable column set. */
export function turnRecord(over: Partial<TurnRecord> = {}): TurnRecord {
  return {
    turnId: "C1:1700000000.000200",
    build: "r1-test",
    requesterId: "U1",
    surface: "channel",
    inThread: true,
    channelId: "C1",
    askTs: "1700000000.000200",
    askedAt: 1_700_000_000_200,
    firstAnswerAt: 1_700_000_004_700,
    latencyMs: 4_500,
    tier: "default",
    routeReason: "default",
    provider: "gemini",
    model: "gemini-3.8-flash",
    fallbackUsed: false,
    tokensIn: 41_000,
    tokensOut: 350,
    tokensThinking: 1_200,
    tokensCached: 30_000,
    costUsd: 0.014_137_5,
    toolsCalled: ["search_blueprint", "read_reference"],
    sourcesCited: ["blueprint", "notion"],
    disposition: "answered",
    proposalId: "1700000000.000300",
    stopUsed: false,
    selfFiledTicketUrl: "https://github.com/BilLogic/plus-uno/issues/900",
    testTraffic: false,
    ...over,
  };
}

export function runUsageLogConformance(
  label: string,
  make: () => UsageLog,
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a recorded turn reads back field for field", async () => {
    const log = make();
    const turn = turnRecord();
    await log.record(turn);
    assert.deepEqual(await log.get(turn.turnId), turn);
  });

  it("a turn nobody recorded reads as null", async () => {
    const log = make();
    assert.equal(await log.get("C1:0"), null);
  });

  it("empty columns read back as null, false and empty — never as undefined or zero", async () => {
    const log = make();
    const turn = turnRecord({
      turnId: "D1:1700000000.000500",
      surface: "assistant",
      inThread: false,
      channelId: null,
      firstAnswerAt: null,
      latencyMs: null,
      provider: null,
      model: null,
      tokensIn: 0,
      tokensOut: 0,
      tokensThinking: 0,
      tokensCached: 0,
      costUsd: null,
      toolsCalled: [],
      sourcesCited: [],
      disposition: "stopped",
      proposalId: null,
      stopUsed: true,
      selfFiledTicketUrl: null,
      testTraffic: true,
    });
    await log.record(turn);
    assert.deepEqual(await log.get(turn.turnId), turn);
  });

  it("recording the same turn twice keeps one row, holding the later values", async () => {
    // A runner alarm is at-least-once: a turn that runs again must rewrite its
    // row, not count twice.
    const log = make();
    await log.record(turnRecord({ disposition: "failed", latencyMs: null, firstAnswerAt: null }));
    const retried = turnRecord({ disposition: "answered" });
    await log.record(retried);
    assert.deepEqual(await log.get(retried.turnId), retried);
  });

  it("two turns are two rows", async () => {
    const log = make();
    const a = turnRecord({ turnId: "C1:1.1" });
    const b = turnRecord({ turnId: "C1:1.2", requesterId: "U2" });
    await log.record(a);
    await log.record(b);
    assert.deepEqual(await log.get(a.turnId), a);
    assert.deepEqual(await log.get(b.turnId), b);
  });

  it("a record changed after it was written changes nothing stored", async () => {
    const log = make();
    const turn = turnRecord();
    await log.record(turn);
    turn.toolsCalled.push("slack_search");
    turn.disposition = "failed";
    assert.deepEqual(await log.get(turn.turnId), turnRecord());
  });
}
