// The conformance suite, run against the DURABLE OBJECT adapter under workerd.
//
// Same suite, same source file, same assertions as the in-memory run
// (tests/thread-state-in-memory.test.ts) — only the factory differs. That is
// the claim the whole module rests on: the in-memory fake the loop, Turn and
// Gate will be tested against answers exactly as the production store does, and
// this is the run that would catch it if it stopped.
//
// Why this one file pays for workerd: what is under test here is real Durable
// Object RPC, real SQLite storage and the real input gate. `claimProposal`
// returning true exactly once across eight concurrent claims is a property of
// that gate, and no amount of mocking is evidence about it.
//
// Each test gets its own Durable Object instance (`instance:` below) so the
// suite's "a FRESH, empty store per test" contract holds against durable
// storage. The adapter's production keying — one global `idFromName("uno-bot")`
// instance — is what runs when nobody passes it.
import { env, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { internalSubrequestsUsed, runMetered } from "../../src/net";
import type { ThreadStateAlarmDeps } from "../../src/thread-state";
import { createDurableObjectThreadState } from "../../src/thread-state/durable-object";
import {
  CUT_OFF_SWEEP_RETRY_MS,
  CUT_OFF_SWEEP_SLACK_MS,
  EXECUTION_CUTOFF_MS,
  type Execution,
  type PendingProposal,
} from "../../src/thread-state/store";
import { runThreadStateConformance } from "../helpers/thread-state-conformance";

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
// than pushing it back, and on firing hands a cut-off run nobody took to the
// Worker — then comes back for it until somebody does.
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
    return { store, stub, alarm };
  }

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
    const { store, stub, alarm } = fresh(() => Date.now() - EXECUTION_CUTOFF_MS - 1_000);
    await store.beginExecution(PROPOSAL);
    const handed: Execution[][] = [];
    await runInDurableObject(stub, (o) => {
      (o as unknown as { alarmDeps: ThreadStateAlarmDeps }).alarmDeps = {
        handOffCutOffRuns: async (due) => void handed.push(due),
      };
    });
    const before = Date.now();
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect(handed.map((due) => due.map((e) => e.proposal.proposalTs))).toEqual([["1700.2"]]);
    const at = await alarm();
    expect(at).toBeGreaterThanOrEqual(before + CUT_OFF_SWEEP_RETRY_MS);
    expect(at).toBeLessThanOrEqual(Date.now() + CUT_OFF_SWEEP_RETRY_MS);
  });

  it("hands over nothing while a run is inside the threshold, and wakes at its cut-off", async () => {
    const { store, stub, alarm } = fresh();
    await store.beginExecution(PROPOSAL);
    const handed: Execution[][] = [];
    await runInDurableObject(stub, (o) => {
      (o as unknown as { alarmDeps: ThreadStateAlarmDeps }).alarmDeps = {
        handOffCutOffRuns: async (due) => void handed.push(due),
      };
    });
    const armed = (await alarm())!;
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect(handed).toEqual([]);
    // Re-armed from the record's own start, which is the caller's clock: the
    // same moment to within the hop.
    expect(Math.abs((await alarm())! - armed)).toBeLessThan(1_000);
  });

  it("stops coming back once a look has taken the run", async () => {
    let skew = EXECUTION_CUTOFF_MS + 1_000;
    const { store, stub, alarm } = fresh(() => Date.now() - skew);
    await store.beginExecution(PROPOSAL);
    skew = 0;
    expect(await store.takeCutOffExecution("1700.2")).not.toBeNull();
    const before = Date.now();
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    // Only the daily sweep is left: the record stays for its hour, untold twice.
    expect(await alarm()).toBeGreaterThan(before + 60 * 60 * 1000);
  });
});
