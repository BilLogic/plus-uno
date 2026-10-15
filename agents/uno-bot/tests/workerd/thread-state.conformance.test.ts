// The conformance suite, run against the DURABLE OBJECT adapter under workerd.
//
// Same suite, same source file, same assertions as the in-memory run
// (tests/thread-state-in-memory.test.ts) — only the factory differs. That is
// the claim the whole module rests on: the in-memory fake the loop, Turn and
// Gate will be tested against answers exactly as the production store does, and
// this is the run that would catch it if it stopped.
//
// Why this one file pays for workerd: what is under test here is real Durable
// Object RPC, real SQLite storage and real concurrent calls. `claimProposal`
// returning true exactly once across concurrent claims, and every one of many
// concurrent writes landing, are properties of the object's transactions, and
// no amount of mocking is evidence about them.
//
// Each test gets its own Durable Object instance (`instance:` below) so the
// suite's "a FRESH, empty store per test" contract holds against durable
// storage. The adapter's production keying — one global `idFromName("uno-bot")`
// instance — is what runs when nobody passes it.
import { env, runInDurableObject } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";

import { internalSubrequestsUsed, runMetered } from "../../src/net";
import { ThreadState as ThreadStateObject } from "../../src/thread-state";
import type { Env } from "../../src/types";
import { createDurableObjectOutageStore, createDurableObjectThreadState } from "../../src/thread-state/durable-object";
import {
  CUT_OFF_SWEEP_RETRY_MS,
  CUT_OFF_SWEEP_SLACK_MS,
  EXECUTION_CUTOFF_MS,
  REPORT_EXPIRY_RETRY_MS,
  type DecisionReportRecord,
  type Execution,
  type PendingProposal,
} from "../../src/thread-state/store";
import { makeConformanceClock, runThreadStateConformance } from "../helpers/thread-state-conformance";

describe("[durable-object] report expiry alarm", () => {
  const report = (): DecisionReportRecord => ({ channel: "C1", messageTs: "1700.9", parent: "One page.", held: 0, ttlMs: 1000,
    entries: [{ id: "a", item: { id: "a", title: "a", body: "a", open: { url: "https://notion.so" } }, state: { kind: "open" } }] });

  it("arms at expiry, hands work outside the object, and retries until the edit is acknowledged", async () => {
    const instance = `report-alarm-${instanceCounter++}`;
    const start = Date.now() + 60_000;
    const expiredAt = start + 1001;
    const store = createDurableObjectThreadState({ namespace, instance, now: () => start });
    const stub = namespace.get(namespace.idFromName(instance));
    await store.putReport(report());
    const armed = await runInDurableObject(stub, (_o, state) => state.storage.getAlarm());
    expect(armed).toBe(start + 1001);
    const handed: DecisionReportRecord[][] = [];
    const fire = () => runInDurableObject(stub, async (_o, state) => {
      await state.storage.deleteAlarm();
      const clock = vi.spyOn(Date, "now").mockReturnValue(expiredAt);
      try {
        await new ThreadStateObject(state, env as Env, { handOffExpiredReports: async (due) => void handed.push(due) }).alarm();
      } finally {
        clock.mockRestore();
      }
    });
    await fire();
    expect(handed[0]?.map((r) => r.messageTs)).toEqual(["1700.9"]);
    expect((await store.getReport("1700.9"))?.entries[0]?.state.kind, "the alarm hands off rather than calling its own stub").toBe("open");
    const retry = await runInDurableObject(stub, (_o, state) => state.storage.getAlarm());
    expect(retry).toBe(expiredAt + REPORT_EXPIRY_RETRY_MS);
    await fire();
    expect(handed).toHaveLength(2);
    const liveStore = createDurableObjectThreadState({ namespace, instance, now: () => expiredAt });
    const edit = await liveStore.prepareReportExpiry("1700.9");
    expect(edit?.report.entries[0]?.state.kind).toBe("expired");
    await liveStore.acknowledgeReportExpiry("1700.9", edit!.revision);
    await fire();
    expect(handed).toHaveLength(2);
  });
});

// `cloudflare:test`'s env is the wrangler config's bindings; the namespace is
// typed by the adapter's own deps, so this cast is the only untyped step.
const namespace = (env as { THREAD_STATE: Parameters<typeof createDurableObjectThreadState>[0]["namespace"] })
  .THREAD_STATE;

let instanceCounter = 0;

runThreadStateConformance(
  "durable-object",
  (deps) =>
    createDurableObjectThreadState({
      ...deps,
      namespace,
      instance: `conformance-${instanceCounter++}`,
    }),
  { it: (name, fn) => it(name, fn) },
);

// The conformance tests finish in milliseconds, so a fixture clock that armed
// the alarm in the past would pass them and lose a record only in a slower
// test. This one waits long enough for such an alarm to have fired.
describe("[durable-object] the conformance clock", () => {
  it("keeps a report through a slow test", async () => {
    const clock = makeConformanceClock();
    const store = createDurableObjectThreadState({ namespace, instance: `slow-${instanceCounter++}`, now: () => clock.now() });
    await store.putReport({ channel: "C1", messageTs: "1700.9", parent: "One page.", held: 0, ttlMs: 60 * 60 * 1000,
      entries: [{ id: "a", item: { id: "a", title: "a", body: "a", open: { url: "https://x/a" } }, state: { kind: "open" } }] });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(await store.updateReport("1700.9", { id: "a", state: { kind: "approved", by: "U1", at: 5 } })).not.toBeNull();
    expect((await store.getReport("1700.9"))?.entries[0]?.state.kind).toBe("approved");
  });
});

// ADR-022, at the only place a stub call happens. The old client charged one
// subrequest per hop inside `call()`; the adapter charges one per hop inside
// `hop()`, and this is the test that says so — a hop that stopped being charged
// would make the budget gate report headroom the invocation does not have,
// which is the 👀-then-silence failure.
describe("[durable-object] the subrequest charge", () => {
  it("charges the internal counter exactly once per hop", async () => {
    const store = createDurableObjectThreadState({
      namespace,
      instance: `charge-${instanceCounter++}`,
    });

    const spent = await runMetered(async () => {
      const before = internalSubrequestsUsed();
      await store.appendHistory({ channel: "C1", thread: "1700.1" }, {
        role: "user",
        content: "one",
      });
      return internalSubrequestsUsed() - before;
    });
    expect(spent).toBe(1);
  });

  it("charges every hop, so three calls cost three", async () => {
    const store = createDurableObjectThreadState({
      namespace,
      instance: `charge-${instanceCounter++}`,
    });

    const spent = await runMetered(async () => {
      const ref = { channel: "C1", thread: "1700.1" };
      await store.readHistory(ref);
      await store.requestCancel(ref);
      await store.consumeCancel(ref);
      return internalSubrequestsUsed();
    });
    expect(spent).toBe(3);
  });
});

// The alarm, which only the Durable Object has: it is armed just past the
// cut-off by the claim that opens an execution, keeps an earlier alarm rather
// than pushing it back, and on firing hands a cut-off run nobody told to the
// Worker — then comes back for it until somebody does. The firing is driven on
// an instance built with its hand-off passed in, the way the Worker entry
// builds it, over the same Durable Object's storage.
describe("[durable-object] the cut-off alarm", () => {
  const PROPOSAL: PendingProposal = {
    toolName: "notion_create",
    input: { title: "One" },
    channel: "C1",
    threadTs: "1700.1",
    userMsgTs: "1700.0",
    proposalTs: "1700.2",
    proposalText: "Create the card?",
    requesterUserId: "U1",
  };

  function fresh(now?: () => number) {
    const instance = `alarm-${instanceCounter++}`;
    const store = createDurableObjectThreadState({ namespace, instance, ...(now ? { now } : {}) });
    const stub = namespace.get(namespace.idFromName(instance));
    const alarm = () => runInDurableObject(stub, (_o, state) => state.storage.getAlarm());
    const handed: Execution[][] = [];
    const fire = () =>
      runInDurableObject(stub, async (_o, state) => {
        // As the runtime does: the alarm that fires is no longer scheduled.
        await state.storage.deleteAlarm();
        await new ThreadStateObject(state, env as Env, {
          handOffCutOffRuns: async (due) => void handed.push(due),
        }).alarm();
      });
    return { store, stub, alarm, fire, handed };
  }

  // The one alarm, armed by calls racing each other: the sweep's day-away
  // wake never replaces the sooner cut-off wake an execution asked for.
  it("keeps the earliest wake when an execution begins among calls that arm the sweep", async () => {
    for (let round = 0; round < 6; round++) {
      const { store, alarm } = fresh();
      const ref = { channel: "C1", thread: `1700.${round}` };
      const sweeps = Array.from({ length: 6 }, (_, i) => store.appendHistory(ref, { role: "user", content: `t${i}` }));
      const begin = store.beginExecution(PROPOSAL);
      await Promise.all(round % 2 ? [begin, ...sweeps] : [...sweeps, begin]);
      expect(await alarm(), `round ${round}`).toBeLessThanOrEqual(Date.now() + EXECUTION_CUTOFF_MS + CUT_OFF_SWEEP_SLACK_MS);
    }
  });

  it("is armed just past the cut-off when an execution begins", async () => {
    const { store, alarm } = fresh();
    const before = Date.now();
    await store.beginExecution(PROPOSAL);
    const at = await alarm();
    expect(at).toBeGreaterThanOrEqual(before + EXECUTION_CUTOFF_MS + CUT_OFF_SWEEP_SLACK_MS);
    expect(at).toBeLessThanOrEqual(Date.now() + EXECUTION_CUTOFF_MS + CUT_OFF_SWEEP_SLACK_MS);
  });

  it("keeps an earlier alarm, and pulls a later one in", async () => {
    const early = fresh();
    const soon = Date.now() + 60_000;
    await runInDurableObject(early.stub, (_o, state) => state.storage.setAlarm(soon));
    await early.store.beginExecution(PROPOSAL);
    expect(await early.alarm()).toBe(soon);

    const late = fresh();
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    await runInDurableObject(late.stub, (_o, state) => state.storage.setAlarm(tomorrow));
    await late.store.beginExecution(PROPOSAL);
    expect(await late.alarm()).toBeLessThan(tomorrow);
  });

  it("hands over a cut-off run nobody took, and comes back for it", async () => {
    const { store, alarm, fire, handed } = fresh(() => Date.now() - EXECUTION_CUTOFF_MS - 1_000);
    await store.beginExecution(PROPOSAL);
    const before = Date.now();
    await fire();
    expect(handed.map((due) => due.map((e) => e.proposal.proposalTs))).toEqual([["1700.2"]]);
    const at = await alarm();
    expect(at).toBeGreaterThanOrEqual(before + CUT_OFF_SWEEP_RETRY_MS);
    expect(at).toBeLessThanOrEqual(Date.now() + CUT_OFF_SWEEP_RETRY_MS);
  });

  it("hands over nothing while a run is inside the threshold, and wakes at its cut-off", async () => {
    const { store, alarm, fire, handed } = fresh();
    await store.beginExecution(PROPOSAL);
    const armed = (await alarm())!;
    await fire();
    expect(handed).toEqual([]);
    // Re-armed from the record's own start, which is the caller's clock: the
    // same moment to within the hop.
    expect(Math.abs((await alarm())! - armed)).toBeLessThan(1_000);
  });

  it("stops coming back once a look has taken the run, and hands back an owed note", async () => {
    let skew = EXECUTION_CUTOFF_MS + 1_000;
    const { store, alarm, fire, handed } = fresh(() => Date.now() - skew);
    await store.beginExecution(PROPOSAL);
    skew = 0;
    expect(await store.takeCutOffExecution("1700.2")).not.toBeNull();
    const before = Date.now();
    await fire();
    expect(handed).toEqual([]);
    // Only the daily sweep is left: the record stays, fencing, for its hour.
    expect(await alarm()).toBeGreaterThan(before + 60 * 60 * 1000);

    expect(await store.reportCutOffNote("1700.2", false)).toBe("owed");
    expect((await alarm())! - Date.now()).toBeLessThanOrEqual(CUT_OFF_SWEEP_RETRY_MS);
    await fire();
    expect(handed.map((due) => due.map((e) => e.proposal.proposalTs))).toEqual([["1700.2"]]);
  });

  it("a pass between daily sweeps scans executions and deletes nothing else", async () => {
    const { store, stub, fire } = fresh(() => Date.now() - EXECUTION_CUTOFF_MS - 1_000);
    await store.beginExecution(PROPOSAL);
    const nextSweep = Date.now() + 12 * 60 * 60 * 1000;
    await runInDurableObject(stub, async (_o, state) => {
      await state.storage.put("gc:next", nextSweep);
      await state.storage.put("event:old", { seenAt: 0 });
    });
    await fire();
    const kept = await runInDurableObject(stub, (_o, state) => state.storage.get("event:old"));
    expect(kept).toEqual({ seenAt: 0 });

    // When the day's sweep is due, it runs.
    await runInDurableObject(stub, (_o, state) => state.storage.put("gc:next", Date.now() - 1));
    await fire();
    expect(await runInDurableObject(stub, (_o, state) => state.storage.get("event:old"))).toBeUndefined();
  });

  // The daily sweep measures a card, and the execution it became, by the
  // card's own TTL: a 72 h card collected by the default hour would be gone
  // the first night.
  it("the daily sweep keeps a 72 h record at 71 h and deletes it at 73 h", async () => {
    const HOUR_MS = 60 * 60 * 1000;
    const long: PendingProposal = { ...PROPOSAL, ttlMs: 72 * HOUR_MS };
    const keys = (stub: ReturnType<typeof namespace.get>) =>
      runInDurableObject(stub, async (_o, state) => [
        (await state.storage.get("prop:1700.2")) !== undefined,
        (await state.storage.get("exec:1700.2")) !== undefined,
      ]);

    for (const [ageHours, kept] of [
      [71, true],
      [73, false],
    ] as const) {
      const { store, stub, fire } = fresh(() => Date.now() - ageHours * HOUR_MS);
      await store.putProposal(long);
      await store.beginExecution(long);
      await runInDurableObject(stub, (_o, state) => state.storage.put("gc:next", Date.now() - 1));
      await fire();
      expect(await keys(stub)).toEqual([kept, kept]);
    }
  });
});

// The capacity outage's record (`turn/capacity-outage.ts`) on the real object:
// the point of keeping it here is that the object serialises every
// transition, so failures arriving together hand the lead's DM to one caller.
describe("[durable-object] the capacity outage record", () => {
  const MIN = 60_000;
  const outageStore = () => createDurableObjectOutageStore({ namespace, instance: `outage-${instanceCounter++}` });

  it("failures arriving together are handed the DM once", async () => {
    const store = outageStore();
    const t0 = Date.now();
    for (const m of [0, 8, 16, 24]) await store.failed(t0 + m * MIN);
    const steps = await Promise.all(Array.from({ length: 8 }, () => store.failed(t0 + 31 * MIN)));
    expect(steps.filter((s) => s.tell)).toHaveLength(1);
    expect(steps.find((s) => s.tell)?.tell?.asks).toBeGreaterThanOrEqual(5);
  });

  it("successes arriving together are handed the recovery line once, and a refused DM's claim comes back", async () => {
    const store = outageStore();
    const t0 = Date.now();
    for (const m of [0, 8, 16, 24]) await store.failed(t0 + m * MIN);
    const told = (await store.failed(t0 + 31 * MIN)).tell!.told!;
    await store.release(told);
    expect((await store.failed(t0 + 32 * MIN)).tell, "released, so the next failure tells").toBeDefined();
    const steps = await Promise.all(Array.from({ length: 6 }, () => store.succeeded(t0 + 40 * MIN)));
    expect(steps.filter((s) => s.recovered)).toHaveLength(1);
    expect(steps.find((s) => s.recovered)?.recovered).toEqual({ first: t0, end: t0 + 40 * MIN });
  });

  it("a told outage quiet past the period closes at the next failure, which starts afresh", async () => {
    const store = outageStore();
    const t0 = Date.now();
    for (const m of [0, 8, 16, 24, 31]) await store.failed(t0 + m * MIN);
    const step = await store.failed(t0 + 480 * MIN);
    expect(step.recovered).toEqual({ first: t0, end: t0 + 31 * MIN });
    expect(step.tell).toBeUndefined();
  });

  it("each call is one charged hop", async () => {
    const store = outageStore();
    const used = await runMetered(async () => {
      await store.failed(Date.now());
      return internalSubrequestsUsed();
    });
    expect(used).toBe(1);
  });
});
