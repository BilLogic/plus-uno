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

  // The revised card retires the one it replaces (#573). A person who answers a
  // card with feedback gets a new card; until this, the old one stayed live for
  // its full hour and a ✅ on it executed the very input they pushed back on.
  it("staging a proposal supersedes the one already pending in that thread", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    clock.advance(2_000);
    await store.putProposal(proposal({ proposalTs: "1700.3" }));

    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
    // The newest card is untouched and still resolves normally.
    assert.equal((await store.getProposalByTs("1700.3")).state, "found");
    assert.equal((await store.getProposalByThread(THREAD))?.proposalTs, "1700.3");
  });

  // The grain is the REPLY THREAD, not the conversation key — and the surface
  // that proves it is a DM, where `threadTs` is the constant "dm" and every ask
  // shares it. Retiring by conversation would have one ask retire an unrelated
  // one and answer its ✅ with "that was replaced".
  it("a revision retires its predecessor in the same reply thread", async () => {
    const { store } = setup();
    const dm = { channel: "D1", threadTs: "dm" };
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.2", replyTs: "1700.1" }));
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.3", replyTs: "1700.1" }));
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
  });

  it("a second ask in the same DM conversation retires nothing", async () => {
    const { store } = setup();
    const dm = { channel: "D1", threadTs: "dm" };
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.2", replyTs: "1700.1" }));
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.5", replyTs: "1700.4" }));
    // Two unrelated asks, each still resolvable against the input it carries.
    assert.equal((await store.getProposalByTs("1700.2")).state, "found");
    assert.equal((await store.getProposalByTs("1700.5")).state, "found");
  });

  // A record staged before `replyTs` existed falls back to the conversation
  // key, and a channel card's `replyTs` IS the thread root — so a channel
  // behaves the same whether the field is there or not.
  it("a record with no replyTs is superseded by its channel thread", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" })); // no replyTs
    await store.putProposal(proposal({ proposalTs: "1700.3", replyTs: THREAD.thread }));
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
  });

  // "superseded" and "expired" are different things to say to a person: one card
  // was replaced two seconds ago, the other aged out an hour ago.
  it("a superseded ts is not reported as expired", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    assert.notEqual((await store.getProposalByTs("1700.2")).state, "expired");
  });

  // Supersession is per conversation: a card pending in another thread is
  // nobody else's to retire.
  it("staging in one thread leaves another thread's card pending", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.putProposal(proposal({ proposalTs: "1700.4", threadTs: OTHER.thread }));
    assert.equal((await store.getProposalByTs("1700.2")).state, "found");
    assert.equal((await store.getProposalByTs("1700.4")).state, "found");
  });

  // Nothing is retired by a card that was already dead: an aged-out record stays
  // expired rather than being relabelled by the next turn's staging.
  it("staging does not relabel an aged-out card", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    clock.advance(PROPOSAL_TTL_MS + 1);
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    assert.equal((await store.getProposalByTs("1700.2")).state, "expired");
  });

  // A card that was replaced AND has since aged out reads as superseded while
  // its successor is live. The expired wording ends "ask me again and I'll set
  // the same thing up fresh" — in front of a live card that asks for a THIRD
  // one, and the GC runs at most daily, so the record would say it for hours.
  it("a live successor beats the TTL on a card that is both", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    clock.advance(PROPOSAL_TTL_MS - 1_000);
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    clock.advance(2_000); // 1700.2 is now past its TTL; 1700.3 is not
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
  });

  // Once the successor is gone too there is nothing to look at, and the TTL
  // owns the record again — delete included.
  it("an aged-out card whose successor also aged out is expired", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    clock.advance(PROPOSAL_TTL_MS + 1);
    assert.equal((await store.getProposalByTs("1700.2")).state, "expired");
    // And the delete happened: the second read has nothing left to find.
    assert.equal((await store.getProposalByTs("1700.2")).state, "none");
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

  // The pending card is keyed on the REPLY THREAD it was posted in, not the
  // conversation. In a DM every unthreaded ask shares the conversation "dm",
  // and keying the card there let a second ask pick up — and retire — a card
  // that lives in another thread.
  it("get-by-thread in a DM answers per reply thread, not per conversation", async () => {
    const { store, clock } = setup();
    const dm = { channel: "D1", threadTs: "dm" };
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.2", replyTs: "1700.1" }));
    clock.advance(1_000);
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.5", replyTs: "1700.4" }));

    assert.equal((await store.getProposalByThread({ channel: "D1", thread: "1700.1" }))?.proposalTs, "1700.2");
    assert.equal((await store.getProposalByThread({ channel: "D1", thread: "1700.4" }))?.proposalTs, "1700.5");
    // The conversation key names no thread a card was posted in.
    assert.equal(await store.getProposalByThread({ channel: "D1", thread: "dm" }), null);
  });

  // What an unthreaded ✅ in a DM needs: every card still live anywhere in the
  // DM, newest first, so one card resolves and several ask which. ANYWHERE —
  // a card staged from a reply inside a DM thread is filed under that thread,
  // and a list that missed it would let the ✅ run the other card unasked.
  it("get-by-channel lists every live card in a DM, from any thread, newest first", async () => {
    const { store, clock } = setup();
    const dm = { channel: "D1", threadTs: "dm" };
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.2", replyTs: "1700.1" }));
    clock.advance(1_000);
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.5", replyTs: "1700.4" }));
    clock.advance(1_000);
    // Retired ahead of a revision: out.
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.8", replyTs: "1700.7" }));
    await store.retireProposal("1700.8");
    clock.advance(1_000);
    // Superseded by a revision in its own thread: out; the revision is in.
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.11", replyTs: "1700.10" }));
    clock.advance(1_000);
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.12", replyTs: "1700.10" }));
    clock.advance(1_000);
    // Staged from a reply inside a DM thread, so filed under that thread: in.
    await store.putProposal(proposal({ channel: "D1", threadTs: "1700.3", proposalTs: "1700.6", replyTs: "1700.3" }));
    clock.advance(1_000);
    // A record from before `replyTs` existed: in.
    await store.putProposal(proposal({ ...dm, proposalTs: "1700.13" }));
    // Another channel is nobody's here.
    await store.putProposal(proposal({ channel: "D2", threadTs: "dm", proposalTs: "1700.9", replyTs: "1700.9" }));

    const live = await store.getProposalsByChannel("D1");
    assert.deepEqual(
      live.map((p) => p.proposalTs),
      ["1700.13", "1700.6", "1700.12", "1700.5", "1700.2"],
    );

    clock.advance(PROPOSAL_TTL_MS - 5_500); // 1700.2 has aged out; 1700.5 has not
    assert.deepEqual(
      (await store.getProposalsByChannel("D1")).map((p) => p.proposalTs),
      ["1700.13", "1700.6", "1700.12", "1700.5"],
    );
  });

  // ----- retiring, as distinct from claiming (#583) -----
  //
  // Two retirements, two methods. A claim CONSUMES a card because someone
  // approved it; a retirement makes way for a revision and keeps the record
  // readable, so a ✅ that lands on the replaced card can be told what
  // happened. Sharing one mechanism is what made the replaced-card message
  // unreachable on the only path it was written for.

  it("a retired card stays readable, and reads as superseded", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.retireProposal("1700.2");
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
    // And it is out of reach of the lookup that leads to an execution.
    assert.equal(await store.getProposalByThread(THREAD), null);
  });

  // The revision lands after the retirement — that is the whole ordering this
  // pair exists for — and stamps its own ts on the record it finds retired,
  // which is what gives the successor tie-break something to check.
  it("the revision stamps its ts on the card retired ahead of it", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.retireProposal("1700.2");
    clock.advance(PROPOSAL_TTL_MS - 1_000);
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    clock.advance(2_000); // 1700.2 is past its TTL; its successor is not
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
    assert.equal((await store.getProposalByTs("1700.3")).state, "found");
  });

  // With no successor recorded there is nothing in the thread for the replaced
  // wording to point at, so the TTL owns the record again.
  it("a retired card whose revision never arrived expires on schedule", async () => {
    const { store, clock } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.retireProposal("1700.2");
    clock.advance(PROPOSAL_TTL_MS + 1);
    assert.equal((await store.getProposalByTs("1700.2")).state, "expired");
  });

  it("retiring a card that was never staged is a no-op", async () => {
    const { store } = setup();
    await store.retireProposal("1700.2");
    assert.equal((await store.getProposalByTs("1700.2")).state, "none");
  });

  // The claim is untouched by any of this: approving a live card consumes it
  // exactly as before.
  it("claiming still consumes the record outright", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    assert.equal(await store.claimProposal("1700.2"), true);
    assert.equal((await store.getProposalByTs("1700.2")).state, "none");
  });

  // Excluding retired cards from the two LOOKUPS was not enough, and review of
  // #583 found why: two doors reach the claim holding a proposal in memory
  // rather than one they just looked up. The store is where a card stops being
  // executable, so the refusal belongs here.
  it("claiming a retired card is refused, and leaves the record readable", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.retireProposal("1700.2");
    assert.equal(await store.claimProposal("1700.2"), false);
    // Refused, not consumed: it can still say what happened to it.
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
  });

  it("claiming a card a revision replaced is refused too", async () => {
    const { store } = setup();
    await store.putProposal(proposal({ proposalTs: "1700.2" }));
    await store.putProposal(proposal({ proposalTs: "1700.3" }));
    assert.equal(await store.claimProposal("1700.2"), false);
    assert.equal((await store.getProposalByTs("1700.2")).state, "superseded");
    // And the live card is claimable exactly as it was.
    assert.equal(await store.claimProposal("1700.3"), true);
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

  // A flag is scoped to the turn that reads it. Slack's in-thread stop control
  // cannot tell which of a DM's two conversation keys holds the run, so it
  // raises BOTH and the turn consumes one — leaving the other standing for five
  // minutes. Unscoped, that leftover silently swallows the answer to the next,
  // unrelated question on that key (#589).
  it("a cancel flag raised before the reading turn consumes false, and is cleared", async () => {
    const { store, clock } = setup();
    await store.requestCancel(THREAD);
    const laterTurnStartedAt = clock.now() + 1;
    clock.advance(10);

    assert.equal(await store.consumeCancel(THREAD, laterTurnStartedAt), false);
    // Cleared all the same: it must not survive to claim the turn after this
    // one either, which is the same rule a stale flag gets.
    assert.equal(await store.consumeCancel(THREAD), false);
  });

  it("a cancel flag raised after the turn began consumes true", async () => {
    const { store, clock } = setup();
    const startedAt = clock.now();
    clock.advance(10);
    await store.requestCancel(THREAD);

    assert.equal(await store.consumeCancel(THREAD, startedAt), true);
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
    // BOTH halves of the conversation are reported: the two doors that call
    // this owe the run's own thread a stop line and cannot name that thread
    // from their own payload (#589).
    assert.equal(outcome.channel, THREAD.channel);
    assert.equal(outcome.thread, THREAD.thread);
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
