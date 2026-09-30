// The ResolutionLog conformance suite.
//
// Written against the `UsageLog` and `ResolutionLog` ports together — turns are
// recorded through the one, resolved through the other — so the same cases run
// against the in-memory pair under `node --test`
// (`tests/usage-log-in-memory.test.ts`) and the D1 pair under workerd with the
// real migrations applied (`tests/workerd/usage-log.conformance.test.ts`).
import assert from "node:assert/strict";

import type { UsageLog } from "../../src/usage/store";
import type { AskResolution, ResolutionLog } from "../../src/usage/resolution";
import { turnRecord, type ConformanceRunner } from "./usage-log-conformance";

const HOUR = 60 * 60 * 1000;
const T0 = 1_700_000_000_200;
/** A bot answer's ts: the message a reaction lands on. */
const ANSWER = "1700000005.000200";

/** A channel ask at `T0 + offsetMs`, by `requesterId`. */
function ask(offsetMs: number, over: Parameters<typeof turnRecord>[0] = {}) {
  const askedAt = T0 + offsetMs;
  const askTs = (askedAt / 1000).toFixed(6);
  return turnRecord({ turnId: `C1:${askTs}`, askTs, askedAt, proposalId: null, ...over });
}

const EMPTY: AskResolution = {
  resolution: null,
  resolvedAt: null,
  escalatedToLead: null,
  resolutionCheckedAt: null,
  resolutionAttempts: 0,
  resolutionAttemptedAt: null,
};

/** The whole queue, whatever was attempted when. */
const everything = { askedAfter: T0 - 1, askedBefore: T0 + 100 * HOUR, attemptedBefore: T0 + 100 * HOUR, limit: 100 };

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
    assert.deepEqual(await resolutions.getResolution(turn.turnId), EMPTY);
    assert.equal(await resolutions.getResolution("C1:0"), null);
  });

  it("a reaction resolves the named ask only when the reactor asked it", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0);
    await usage.record(turn);
    assert.equal(await resolutions.recordReaction({ turnId: turn.turnId, requesterId: "U2", reactedTs: ANSWER, at: T0 + HOUR }), null);
    assert.equal(await resolutions.recordReaction({ turnId: "C1:0", requesterId: "U1", reactedTs: ANSWER, at: T0 + HOUR }), null);
    assert.equal(await resolutions.getResolution(turn.turnId).then((r) => r?.resolution), null);

    assert.equal(await resolutions.recordReaction({ turnId: turn.turnId, requesterId: "U1", reactedTs: ANSWER, at: T0 + HOUR }), turn.turnId);
    assert.deepEqual(await resolutions.getResolution(turn.turnId), {
      ...EMPTY,
      resolution: "reaction",
      resolvedAt: T0 + HOUR,
    });
  });

  it("a reaction on a message that is a known card records nothing, whoever's card it is", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0, { proposalId: "1700000000.000900" });
    const other = ask(HOUR, { proposalId: "1700000000.000950" });
    await usage.record(turn);
    await usage.record(other);
    for (const card of ["1700000000.000900", "1700000000.000950"]) {
      assert.equal(await resolutions.recordReaction({ turnId: turn.turnId, requesterId: "U1", reactedTs: card, at: T0 + HOUR }), null);
    }
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, null);
    // The same ask, reacted on its answer instead, resolves.
    assert.equal(await resolutions.recordReaction({ turnId: turn.turnId, requesterId: "U1", reactedTs: ANSWER, at: T0 + HOUR }), turn.turnId);
  });

  it("a completed batch resolves the turn that staged its card", async () => {
    const { usage, resolutions } = make();
    const staging = ask(0, { proposalId: "1700000000.000900" });
    await usage.record(staging);
    assert.equal(await resolutions.recordTaskCompleted("1700000000.000900", T0 + HOUR), staging.turnId);
    assert.equal(await resolutions.recordTaskCompleted("1700000000.000999", T0 + HOUR), null);
    assert.equal((await resolutions.getResolution(staging.turnId))?.resolution, "task_completed");
  });

  it("a person's first signal wins, and replaces the pass's provisional answer", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0, { proposalId: "1700000000.000900" });
    await usage.record(turn);
    await resolutions.recordPass(turn.turnId, { resolution: "none", escalatedToLead: null, settled: false }, T0 + 25 * HOUR);
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, "none");

    assert.equal(await resolutions.recordTaskCompleted("1700000000.000900", T0 + 26 * HOUR), turn.turnId);
    assert.equal(await resolutions.recordReaction({ turnId: turn.turnId, requesterId: "U1", reactedTs: ANSWER, at: T0 + 27 * HOUR }), null);
    // A later pass does not overwrite a person's signal.
    await resolutions.recordPass(turn.turnId, { resolution: "no_escalation", escalatedToLead: false, settled: true }, T0 + 49 * HOUR);

    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "task_completed");
    assert.equal(got?.resolvedAt, T0 + 26 * HOUR);
    assert.equal(got?.escalatedToLead, false);
  });

  it("a turn's own retried write leaves its resolution alone", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0, { proposalId: "1700000000.000900" });
    await usage.record(turn);
    await resolutions.recordTaskCompleted("1700000000.000900", T0 + HOUR);
    await usage.record({ ...turn, tokensOut: 999 });
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, "task_completed");
  });

  it("the pass queue is real, unsettled asks in the window, oldest first", async () => {
    const { usage, resolutions } = make();
    const old = ask(0);
    const resolved = ask(HOUR, { proposalId: "1700000000.000900" });
    const test = ask(2 * HOUR, { testTraffic: true });
    const tooNew = ask(30 * HOUR);
    for (const t of [tooNew, resolved, test, old]) await usage.record(t);
    await resolutions.recordTaskCompleted("1700000000.000900", T0 + 2 * HOUR);

    const window = { ...everything, askedBefore: T0 + 24 * HOUR };
    assert.deepEqual(await resolutions.pendingPass(window), [
      { turnId: old.turnId, requesterId: "U1", channel: "C1", askTs: old.askTs, askedAt: old.askedAt, resolved: false, attempts: 0 },
      {
        turnId: resolved.turnId,
        requesterId: "U1",
        channel: "C1",
        askTs: resolved.askTs,
        askedAt: resolved.askedAt,
        resolved: true,
        attempts: 0,
      },
    ]);
    const one = await resolutions.pendingPass({ ...window, limit: 1 });
    assert.deepEqual(one.map((c) => c.turnId), [old.turnId]);
  });

  it("every read counts; the queue skips an ask read since attemptedBefore", async () => {
    const { usage, resolutions } = make();
    const a = ask(0);
    const b = ask(HOUR);
    for (const t of [a, b]) await usage.record(t);
    await resolutions.recordPass(a.turnId, { resolution: "none", escalatedToLead: null, settled: false }, T0 + 30 * HOUR);

    const sameRun = await resolutions.pendingPass({ ...everything, attemptedBefore: T0 + 10 * HOUR });
    assert.deepEqual(sameRun.map((c) => c.turnId), [b.turnId]);
    // Next day both are due: the never-read one first, though it is newer.
    const nextDay = await resolutions.pendingPass({ ...everything, attemptedBefore: T0 + 30 * HOUR });
    assert.deepEqual(
      nextDay.map((c) => [c.turnId, c.attempts]),
      [
        [b.turnId, 0],
        [a.turnId, 1],
      ],
    );
  });

  it("the pass settles an open ask, and never overwrites a person's signal", async () => {
    const { usage, resolutions } = make();
    const open = ask(0);
    const resolved = ask(HOUR, { proposalId: "1700000000.000900" });
    for (const t of [open, resolved]) await usage.record(t);
    await resolutions.recordTaskCompleted("1700000000.000900", T0 + 2 * HOUR);

    const at = T0 + 30 * HOUR;
    await resolutions.recordPass(open.turnId, { resolution: "no_escalation", escalatedToLead: false, settled: true }, at);
    await resolutions.recordPass(resolved.turnId, { resolution: null, escalatedToLead: true, settled: true }, at);

    assert.deepEqual(await resolutions.getResolution(open.turnId), {
      resolution: "no_escalation",
      resolvedAt: at,
      escalatedToLead: false,
      resolutionCheckedAt: at,
      resolutionAttempts: 1,
      resolutionAttemptedAt: at,
    });
    assert.deepEqual(await resolutions.getResolution(resolved.turnId), {
      resolution: "task_completed",
      resolvedAt: T0 + 2 * HOUR,
      escalatedToLead: true,
      resolutionCheckedAt: at,
      resolutionAttempts: 1,
      resolutionAttemptedAt: at,
    });
    assert.deepEqual(await resolutions.pendingPass(everything), []);
  });

  it("re-reading an unknown ask is idempotent: none stays none from its first time", async () => {
    const { usage, resolutions } = make();
    const turn = ask(0);
    await usage.record(turn);
    const unknown = { resolution: "none", escalatedToLead: null, settled: false } as const;
    await resolutions.recordPass(turn.turnId, unknown, T0 + 25 * HOUR);
    await resolutions.recordPass(turn.turnId, unknown, T0 + 49 * HOUR);
    assert.deepEqual(await resolutions.getResolution(turn.turnId), {
      resolution: "none",
      resolvedAt: T0 + 25 * HOUR,
      escalatedToLead: null,
      resolutionCheckedAt: null,
      resolutionAttempts: 2,
      resolutionAttemptedAt: T0 + 49 * HOUR,
    });
  });

  it("an escalation learned on a later read is stored as if learned on the first", async () => {
    const { usage, resolutions } = make();
    const late = ask(0);
    const early = ask(HOUR);
    const lateNull = ask(2 * HOUR);
    const earlyNull = ask(3 * HOUR);
    for (const t of [late, early, lateNull, earlyNull]) await usage.record(t);
    const unknown = { resolution: "none", escalatedToLead: null, settled: false } as const;
    const selfServed = { resolution: "no_escalation", escalatedToLead: false, settled: true } as const;
    const escalated = { resolution: null, escalatedToLead: true, settled: true } as const;
    const at = T0 + 49 * HOUR;

    await resolutions.recordPass(late.turnId, unknown, T0 + 25 * HOUR);
    await resolutions.recordPass(late.turnId, selfServed, at);
    await resolutions.recordPass(early.turnId, selfServed, at);
    await resolutions.recordPass(lateNull.turnId, unknown, T0 + 25 * HOUR);
    await resolutions.recordPass(lateNull.turnId, escalated, at);
    await resolutions.recordPass(earlyNull.turnId, escalated, at);

    const shape = async (id: string) => {
      const { resolutionAttempts: _n, ...rest } = (await resolutions.getResolution(id))!;
      return rest;
    };
    assert.deepEqual(await shape(late.turnId), await shape(early.turnId));
    assert.deepEqual(await shape(lateNull.turnId), await shape(earlyNull.turnId));
    assert.deepEqual(await shape(lateNull.turnId), {
      resolution: null,
      resolvedAt: null,
      escalatedToLead: true,
      resolutionCheckedAt: at,
      resolutionAttemptedAt: at,
    });
  });
}
