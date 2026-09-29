// The ResolutionLog conformance suite.
//
// Written against the `UsageLog` and `ResolutionLog` ports together — turns are
// recorded through the one, resolved through the other — so the same cases run
// against the in-memory pair under `node --test`
// (`tests/usage-log-in-memory.test.ts`) and the D1 pair under workerd with the
// real migrations applied (`tests/workerd/usage-log.conformance.test.ts`).
import assert from "node:assert/strict";

import type { UsageLog } from "../../src/usage/store";
import type { ResolutionLog } from "../../src/usage/resolution";
import { turnRecord, type ConformanceRunner } from "./usage-log-conformance";

const HOUR = 60 * 60 * 1000;
const T0 = 1_700_000_000_200;

/** A channel ask at `T0 + offsetMs`, by `requesterId`. */
function ask(offsetMs: number, over: Parameters<typeof turnRecord>[0] = {}) {
  const askedAt = T0 + offsetMs;
  const askTs = (askedAt / 1000).toFixed(6);
  return turnRecord({ turnId: `C1:${askTs}`, askTs, askedAt, proposalId: null, ...over });
}

export function runResolutionLogConformance(
  label: string,
  make: () => { usage: UsageLog; resolutions: ResolutionLog },
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] resolution: ${name}`, fn);

  it("a turn nobody resolved reads back empty; an unknown turn reads null", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0);
    await usage.record(turn);
    assert.deepEqual(await resolutions.getResolution(turn.turnId), {
      resolution: null,
      resolvedAt: null,
      escalatedToLead: null,
      resolutionCheckedAt: null,
    });
    assert.equal(await resolutions.getResolution("C1:0"), null);
  });

  it("the asker's reaction resolves their latest ask in the window, and nobody else's", async () => {
    const { usage, resolutions } = make();
    const earlier = ask(0);
    const latest = ask(60_000);
    const someoneElse = ask(90_000, { requesterId: "U2" });
    const elsewhere = ask(95_000, { turnId: `C9:${((T0 + 95_000) / 1000).toFixed(6)}` });
    for (const t of [earlier, latest, someoneElse, elsewhere]) await usage.record(t);

    const window = { channel: "C1", fromMs: T0, toMs: T0 + 100_000, at: T0 + 100_000 };
    assert.equal(await resolutions.recordReaction({ ...window, requesterId: "U3" }), null);
    assert.equal(await resolutions.recordReaction({ ...window, requesterId: "U1" }), latest.turnId);

    assert.deepEqual(await resolutions.getResolution(latest.turnId), {
      resolution: "reaction",
      resolvedAt: T0 + 100_000,
      escalatedToLead: null,
      resolutionCheckedAt: null,
    });
    assert.equal((await resolutions.getResolution(earlier.turnId))?.resolution, null);
    assert.equal((await resolutions.getResolution(someoneElse.turnId))?.resolution, null);
    assert.equal((await resolutions.getResolution(elsewhere.turnId))?.resolution, null);
  });

  it("an ask outside the window is not the one a reaction is about", async () => {
    const { usage, resolutions } = make();
    await usage.record(ask(0));
    const missed = await resolutions.recordReaction({
      channel: "C1",
      requesterId: "U1",
      fromMs: T0 + 1,
      toMs: T0 + HOUR,
      at: T0 + HOUR,
    });
    assert.equal(missed, null);
  });

  it("a completed batch resolves the turn that staged its card", async () => {
    const { usage, resolutions } = make();
    const staging = ask(0, { proposalId: "1700000000.000900" });
    await usage.record(staging);
    assert.equal(await resolutions.recordTaskCompleted("1700000000.000900", T0 + HOUR), staging.turnId);
    assert.equal(await resolutions.recordTaskCompleted("1700000000.000999", T0 + HOUR), null);
    assert.equal((await resolutions.getResolution(staging.turnId))?.resolution, "task_completed");
  });

  it("the first signal wins, and none gives way to a real one", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0, { proposalId: "1700000000.000900" });
    await usage.record(turn);
    await resolutions.recordPass(turn.turnId, { resolution: "none", escalatedToLead: null }, T0 + 25 * HOUR);
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, "none");

    assert.equal(await resolutions.recordTaskCompleted("1700000000.000900", T0 + 26 * HOUR), turn.turnId);
    const window = { channel: "C1", requesterId: "U1", fromMs: T0, toMs: T0 + HOUR, at: T0 + 27 * HOUR };
    assert.equal(await resolutions.recordReaction(window), null);

    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "task_completed");
    assert.equal(got?.resolvedAt, T0 + 26 * HOUR);
  });

  it("a turn's own retried write leaves its resolution alone", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0, { proposalId: "1700000000.000900" });
    await usage.record(turn);
    await resolutions.recordTaskCompleted("1700000000.000900", T0 + HOUR);
    await usage.record({ ...turn, tokensOut: 999 });
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, "task_completed");
  });

  it("the pass queue is real, unchecked asks in the window, oldest first", async () => {
    const { usage, resolutions } = make();
    const old = ask(0);
    const resolved = ask(HOUR, { proposalId: "1700000000.000900" });
    const test = ask(2 * HOUR, { testTraffic: true });
    const tooNew = ask(30 * HOUR);
    for (const t of [tooNew, resolved, test, old]) await usage.record(t);
    await resolutions.recordTaskCompleted("1700000000.000900", T0 + 2 * HOUR);

    const pending = await resolutions.pendingPass({ askedAfter: T0 - 1, askedBefore: T0 + 24 * HOUR, limit: 10 });
    assert.deepEqual(pending, [
      { turnId: old.turnId, requesterId: "U1", channel: "C1", askTs: old.askTs, askedAt: old.askedAt, resolved: false },
      {
        turnId: resolved.turnId,
        requesterId: "U1",
        channel: "C1",
        askTs: resolved.askTs,
        askedAt: resolved.askedAt,
        resolved: true,
      },
    ]);
    const one = await resolutions.pendingPass({ askedAfter: T0 - 1, askedBefore: T0 + 24 * HOUR, limit: 1 });
    assert.deepEqual(one.map((c) => c.turnId), [old.turnId]);
  });

  it("the pass settles an open ask, marks it handled, and never overwrites a real resolution", async () => {
    const { usage, resolutions } = make();
    const open = ask(0);
    const resolved = ask(HOUR, { proposalId: "1700000000.000900" });
    for (const t of [open, resolved]) await usage.record(t);
    await resolutions.recordTaskCompleted("1700000000.000900", T0 + 2 * HOUR);

    const at = T0 + 30 * HOUR;
    await resolutions.recordPass(open.turnId, { resolution: "no_escalation", escalatedToLead: false }, at);
    await resolutions.recordPass(resolved.turnId, { resolution: "no_escalation", escalatedToLead: true }, at);

    assert.deepEqual(await resolutions.getResolution(open.turnId), {
      resolution: "no_escalation",
      resolvedAt: at,
      escalatedToLead: false,
      resolutionCheckedAt: at,
    });
    assert.deepEqual(await resolutions.getResolution(resolved.turnId), {
      resolution: "task_completed",
      resolvedAt: T0 + 2 * HOUR,
      escalatedToLead: true,
      resolutionCheckedAt: at,
    });
    const pending = await resolutions.pendingPass({ askedAfter: T0 - 1, askedBefore: at, limit: 10 });
    assert.deepEqual(pending, []);
  });

  it("a pass that leaves an ask open still marks it handled", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0);
    await usage.record(turn);
    await resolutions.recordPass(turn.turnId, { resolution: null, escalatedToLead: false }, T0 + 30 * HOUR);
    assert.deepEqual(await resolutions.getResolution(turn.turnId), {
      resolution: null,
      resolvedAt: null,
      escalatedToLead: false,
      resolutionCheckedAt: T0 + 30 * HOUR,
    });
  });

  it("an ask whose escalation is unknown is written and stays queued", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0);
    await usage.record(turn);
    await resolutions.recordPass(turn.turnId, { resolution: "none", escalatedToLead: null }, T0 + 30 * HOUR);
    assert.deepEqual(await resolutions.getResolution(turn.turnId), {
      resolution: "none",
      resolvedAt: T0 + 30 * HOUR,
      escalatedToLead: null,
      resolutionCheckedAt: null,
    });
    const pending = await resolutions.pendingPass({ askedAfter: T0 - 1, askedBefore: T0 + 30 * HOUR, limit: 10 });
    assert.deepEqual(
      pending.map((c) => [c.turnId, c.resolved]),
      [[turn.turnId, false]],
    );

    // The next pass reads the DMs, and the real answer replaces `none`.
    await resolutions.recordPass(turn.turnId, { resolution: "no_escalation", escalatedToLead: false }, T0 + 54 * HOUR);
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "no_escalation");
    assert.equal(got?.resolutionCheckedAt, T0 + 54 * HOUR);
  });
}
