// The ThreadState conformance suite.
//
// Written ONLY against the `ThreadState` interface: it builds a store through
// the factory it is handed and asserts nothing about how that store keeps its
// records. That is the point — #493 runs this same suite against the Durable
// Object adapter under workerd, and the in-memory fake is trustworthy as a
// stand-in for production only if the two answer identically.
//
// No test sleeps. Every TTL and lease in the module is measured against an
// injected `now()`, so a suite that needs to be twenty minutes later advances a
// counter. A real sleep would put a 20-minute lease out of reach and make
// everything around it flaky.
//
// RUNNER-AGNOSTIC. The suite is handed its `it` (#493) instead of importing
// one, because it now runs under two runners: `node --test` for the in-memory
// adapter and vitest under workerd for the Durable Object adapter. Importing
// `node:test` here would have made the workerd run impossible — that module is
// not in the Workers runtime — and duplicating the cases is the one thing this
// file exists to prevent. `node:assert/strict` stays: workerd provides it
// under `nodejs_compat`, which wrangler.toml already sets.
import assert from "node:assert/strict";

import {
  CANCEL_TTL_MS,
  EVENT_DEDUP_TTL_MS,
  HISTORY_TTL_MS,
  MAX_HISTORY_TURNS,
  PROPOSAL_TTL_MS,
  RUN_LEASE_MS,
  proposalOperations,
  type PendingProposal,
  type ThreadState,
  type ThreadStateDeps,
} from "../../src/thread-state/store";

/** A hand-wound clock. `now()` is what the store reads; `advance` is the only
 *  way time passes in this suite. */
export interface TestClock {
  now(): number;
  advance(ms: number): void;
}

export function makeTestClock(start = 1_700_000_000_000): TestClock {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

const THREAD = { channel: "C1", thread: "1700.1" } as const;
const OTHER = { channel: "C1", thread: "1700.9" } as const;

function proposal(overrides: Partial<PendingProposal> = {}): PendingProposal {
  return {
    toolName: "notion_create",
    input: { title: "Onboarding checklist" },
    channel: THREAD.channel,
    threadTs: THREAD.thread,
    userMsgTs: "1700.0",
    proposalTs: "1700.2",
    proposalText: "Create the card?",
    requesterUserId: "U1",
    ...overrides,
  };
}

/** The one thing the suite needs from its runner: register a named async test.
 *  `node --test`'s `test` and vitest's `it` both satisfy it. */
export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

/**
 * Run the suite against one adapter.
 *
 * @param label  names the adapter in every test title, so a failure says which
 *               of the two stores disagreed.
 * @param makeStore  builds a FRESH, empty store on the clock it is handed.
 *               Called once per test; never shared between them.
 * @param runner  the caller's test function — see `ConformanceRunner`.
 */
export function runThreadStateConformance(
  label: string,
  makeStore: (deps: ThreadStateDeps) => ThreadState,
  runner: ConformanceRunner,
): void {
  function setup(): { store: ThreadState; clock: TestClock } {
    const clock = makeTestClock();
    return { store: makeStore({ now: () => clock.now() }), clock };
  }

  const it = (name: string, fn: () => Promise<void>): void =>
    runner.it(`[${label}] ${name}`, fn);

  // ----- history -----

  it("history reads back what was appended, in order", async () => {
    const { store } = setup();
    await store.appendHistory(THREAD, { role: "user", content: "one" });
    await store.appendHistory(THREAD, { role: "assistant", content: "two" });
    assert.deepEqual(
      (await store.readHistory(THREAD)).map((t) => t.content),
      ["one", "two"],
    );
  });

  it("history is per thread — a sibling thread reads empty", async () => {
    const { store } = setup();
    await store.appendHistory(THREAD, { role: "user", content: "one" });
    assert.deepEqual(await store.readHistory(OTHER), []);
  });

  it("history append reports the stored length and caps the record", async () => {
    const { store } = setup();
    let last = { length: 0 };
    for (let i = 0; i < MAX_HISTORY_TURNS + 5; i++) {
      last = await store.appendHistory(THREAD, { role: "user", content: `t${i}` });
    }
    assert.equal(last.length, MAX_HISTORY_TURNS);
    const turns = await store.readHistory(THREAD);
    assert.equal(turns.length, MAX_HISTORY_TURNS);
    // the cap drops the OLDEST turns
    assert.equal(turns[turns.length - 1]?.content, `t${MAX_HISTORY_TURNS + 4}`);
  });

  it("history older than its TTL reads as empty", async () => {
    const { store, clock } = setup();
    await store.appendHistory(THREAD, { role: "user", content: "one" });
    clock.advance(HISTORY_TTL_MS + 1);
    assert.deepEqual(await store.readHistory(THREAD), []);
  });

  it("compaction keeps the opening turn and the recent tail, and persists", async () => {
    const { store } = setup();
    for (let i = 0; i < 10; i++) {
      await store.appendHistory(THREAD, { role: "user", content: `t${i}` });
    }
    const compacted = await store.compactHistory(THREAD, { keepRecent: 3 });
    assert.deepEqual(
      compacted.turns.map((t) => t.content),
      ["t0", "t7", "t8", "t9"],
    );
    assert.equal(compacted.dropped, 6);
    // the write-back is the point: the next read is already compact
    assert.deepEqual(
      (await store.readHistory(THREAD)).map((t) => t.content),
      ["t0", "t7", "t8", "t9"],
    );
  });

  it("compaction of a short history drops nothing", async () => {
    const { store } = setup();
    await store.appendHistory(THREAD, { role: "user", content: "one" });
    await store.appendHistory(THREAD, { role: "assistant", content: "two" });
    const compacted = await store.compactHistory(THREAD, { keepRecent: 5 });
    assert.equal(compacted.dropped, 0);
    assert.deepEqual(compacted.turns.map((t) => t.content), ["one", "two"]);
  });

  // ----- proposals -----

  it("a staged proposal is found by its ts", async () => {
    const { store } = setup();
    await store.putProposal(proposal());
    const found = await store.getProposalByTs("1700.2");
    assert.equal(found.state, "found");
    assert.equal(found.state === "found" ? found.proposal.toolName : "", "notion_create");
  });

  it("a batch round-trips with every operation, in order", async () => {
    const { store } = setup();
    const operations = [
      { toolName: "notion_update", input: { page: "hub", heading: "TLDR" } },
      { toolName: "notion_update", input: { page: "prd", heading: "Scope" } },
      { toolName: "notion_create", input: { surface: "decision", title: "Calendar Sync cut" } },
    ];
    await store.putProposal(proposal({ operations }));
    const found = await store.getProposalByTs("1700.2");
    assert.equal(found.state, "found");
    assert.deepEqual(found.state === "found" ? found.proposal.operations : [], operations);
    assert.deepEqual(
      proposalOperations(found.state === "found" ? found.proposal : proposal()),
      operations,
    );
  });

  // Expand–contract: a proposal staged before the batch shipped is still
  // pending when the batch deploys, and a ✅ on it must run its one write
  // rather than find a field that is not there.
  it("a record stored in the old single-call shape reads as a one-operation batch", async () => {
    const { store } = setup();
    await store.putProposal(proposal());
    const found = await store.getProposalByTs("1700.2");
    assert.equal(found.state, "found");
    assert.equal(found.state === "found" ? found.proposal.operations : "not-found", undefined);
    assert.deepEqual(
      proposalOperations(found.state === "found" ? found.proposal : proposal()),
      [{ toolName: "notion_create", input: { title: "Onboarding checklist" } }],
    );
  });

  // "expired" and "none" are different answers on purpose: the gate has to tell
  // the requester their delayed ✅ hit an aged-out card rather than ignore it.
  it("an unknown ts is none, an aged-out ts is expired", async () => {
    const { store, clock } = setup();
    assert.equal((await store.getProposalByTs("nope")).state, "none");
    await store.putProposal(proposal());
    clock.advance(PROPOSAL_TTL_MS + 1);
    assert.equal((await store.getProposalByTs("1700.2")).state, "expired");
  });

  it("get-by-thread returns the freshest live proposal for that thread", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    clock.advance(1_000);
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    await store.putProposal(proposal({ proposalTs: "1700.4", threadTs: OTHER.thread }));
    const found = await store.getProposalByThread(THREAD);
    assert.equal(found?.proposalTs, "1700.3");
  });

  it("get-by-thread ignores an expired proposal", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal());
    clock.advance(PROPOSAL_TTL_MS + 1);
    assert.equal(await store.getProposalByThread(THREAD), null);
  });

  // The double-execution guard, and the reason the delete is the claim:
  // `notion_create` is not idempotent, so of a ✅ reaction and a typed
  // "go ahead" landing together exactly one may win.
  it("a proposal claims exactly once across concurrent claims", async () => {
    const { store } = setup();
    await store.putProposal(proposal());
    const results = await Promise.all(
      Array.from({ length: 8 }, () => store.claimProposal("1700.2")),
    );
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await store.getProposalByTs("1700.2")).state, "none");
  });

  it("claiming a proposal that was never staged is a loss, not an error", async () => {
    const { store } = setup();
    assert.equal(await store.claimProposal("1700.2"), false);
  });

  // ----- assistant context -----

  it("assistant context round-trips per thread and is null when unset", async () => {
    const { store } = setup();
    assert.equal(await store.getAssistantContext(THREAD), null);
    await store.putAssistantContext(THREAD, { channel_id: "C1", team_id: "T1" });
    assert.deepEqual(await store.getAssistantContext(THREAD), { channel_id: "C1", team_id: "T1" });
    assert.equal(await store.getAssistantContext(OTHER), null);
  });

  it("assistant context older than its TTL reads as null", async () => {
    const { store, clock } = setup();
    await store.putAssistantContext(THREAD, { channel_id: "C1" });
    clock.advance(HISTORY_TTL_MS + 1);
    assert.equal(await store.getAssistantContext(THREAD), null);
  });

  // ----- cancel (/stop) -----

  // One /stop cancels one turn. A flag left set would abort the NEXT question
  // the person asks, which reads as the bot ignoring them.
  it("a cancel flag consumes once", async () => {
    const { store } = setup();
    await store.requestCancel(THREAD);
    assert.equal(await store.consumeCancel(THREAD), true);
    assert.equal(await store.consumeCancel(THREAD), false);
  });

  it("a cancel flag consumes once across concurrent consumers", async () => {
    const { store } = setup();
    await store.requestCancel(THREAD);
    const results = await Promise.all(
      Array.from({ length: 8 }, () => store.consumeCancel(THREAD)),
    );
    assert.equal(results.filter(Boolean).length, 1);
  });

  it("an unset cancel flag consumes false", async () => {
    const { store } = setup();
    assert.equal(await store.consumeCancel(THREAD), false);
  });

  it("a stale cancel flag consumes false and is cleared", async () => {
    const { store, clock } = setup();
    await store.requestCancel(THREAD);
    clock.advance(CANCEL_TTL_MS + 1);
    assert.equal(await store.consumeCancel(THREAD), false);
    assert.equal(await store.consumeCancel(THREAD), false);
  });

  // ----- active run + cancel-by-user (the Home-tab Stop button) -----

  it("cancel-by-user reports nothing to stop when no run was marked", async () => {
    const { store } = setup();
    assert.deepEqual(await store.cancelForUser("U1"), { cancelled: false });
  });

  it("cancel-by-user resolves the person's thread and sets its flag", async () => {
    const { store } = setup();
    await store.setActiveRun("U1", THREAD);
    const outcome = await store.cancelForUser("U1");
    assert.equal(outcome.cancelled, true);
    assert.equal(outcome.channel, THREAD.channel);
    assert.equal(await store.consumeCancel(THREAD), true);
  });

  // One record per person, overwritten every turn: the question it answers is
  // only ever about the run happening right now.
  it("the active-run pointer is the latest thread, not a history", async () => {
    const { store } = setup();
    await store.setActiveRun("U1", THREAD);
    await store.setActiveRun("U1", OTHER);
    assert.equal((await store.cancelForUser("U1")).cancelled, true);
    assert.equal(await store.consumeCancel(OTHER), true);
    assert.equal(await store.consumeCancel(THREAD), false);
  });

  it("an active-run pointer older than its TTL cancels nothing", async () => {
    const { store, clock } = setup();
    await store.setActiveRun("U1", THREAD);
    clock.advance(CANCEL_TTL_MS + 1);
    assert.equal((await store.cancelForUser("U1")).cancelled, false);
    assert.equal(await store.consumeCancel(THREAD), false);
  });

  // ----- event dedup -----

  it("an event is unseen once and seen after", async () => {
    const { store } = setup();
    assert.equal((await store.checkAndRecordEvent("Ev1")).seen, false);
    assert.equal((await store.checkAndRecordEvent("Ev1")).seen, true);
  });

  it("an event is forgotten after the dedup TTL", async () => {
    const { store, clock } = setup();
    await store.checkAndRecordEvent("Ev1");
    clock.advance(EVENT_DEDUP_TTL_MS + 1);
    assert.equal((await store.checkAndRecordEvent("Ev1")).seen, false);
  });

  // ----- run lease -----

  it("a run claims once, then reports the lease as held", async () => {
    const { store } = setup();
    assert.equal(await store.claimRun("Ev1"), "claimed");
    assert.equal(await store.claimRun("Ev1"), "running");
  });

  it("a finished run reports done, so a retry drops the job", async () => {
    const { store } = setup();
    await store.claimRun("Ev1");
    await store.markRunDone("Ev1");
    assert.equal(await store.claimRun("Ev1"), "done");
  });

  // The 2026-07-10 incident: a deploy hard-killed a run mid-turn, and every
  // alarm retry then skipped on the stuck marker until the thread went
  // permanently silent. The lease has to age out on its own.
  it("a lease expires after its duration and a fresh claim then succeeds", async () => {
    const { store, clock } = setup();
    assert.equal(await store.claimRun("Ev1"), "claimed");
    clock.advance(RUN_LEASE_MS - 1);
    assert.equal(await store.claimRun("Ev1"), "running");
    clock.advance(2);
    assert.equal(await store.claimRun("Ev1"), "claimed");
  });

  it("a done mark survives the lease window — the turn is not re-run", async () => {
    const { store, clock } = setup();
    await store.claimRun("Ev1");
    await store.markRunDone("Ev1");
    clock.advance(RUN_LEASE_MS + 1);
    assert.equal(await store.claimRun("Ev1"), "done");
  });

  it("the one-shot dedup and the lease share one record", async () => {
    const { store } = setup();
    assert.equal(await store.claimRun("Ev1"), "claimed");
    assert.equal((await store.checkAndRecordEvent("Ev1")).seen, true);
  });
}
