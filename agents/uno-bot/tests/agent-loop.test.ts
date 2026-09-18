// The loop's behaviour, driven through `runLoop` with the fake ModelProvider.
//
// Every case here is one of the things that used to exist twice, once per
// provider, and therefore worked on one provider and not the other: `/stop`,
// backup-model failover, the synthesis pass, the partial-lookup mark, the
// narration rule. They cross the loop's own interface — a provider in, an
// `AgentResult` out — and assert what the turn observably did: what came back,
// what the model was sent, which tools ran, what the user was told.
//
// No network, no Cloudflare runtime, no credential: the provider is scripted and
// the loop's three runtime dependencies (the tool executor, the `/stop` reader,
// the subrequest meter) arrive as named ports.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLoop, type LoopBudget, type LoopDeps, type LoopInput } from "../src/agent/loop";
import { fakeProvider, type FakeProviderOptions } from "../src/agent/providers/fake";
import {
  BUDGET_EXHAUSTED_SYNTHESIS,
  LOOKUP_CEILING,
  MAX_ITERATIONS,
  READONLY_TOOL_BUDGET,
} from "../src/agent/loop-policy";
import {
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadRef,
} from "../src/thread-state/index";

// ── harness ──────────────────────────────────────────────────────────────────

/** A meter a test drives: nothing is spent unless a case says so. */
function budgetStub(over: Partial<LoopBudget> = {}): LoopBudget {
  return {
    used: () => 0,
    trips: () => 0,
    withLookupLimit: (_limit, fn) => fn(),
    isBudgetError: () => false,
    breakdown: () => "test",
    ...over,
  };
}

interface Recorder {
  /** Tool names the loop actually executed, in order. */
  executed: string[];
  /** How many times the loop read the `/stop` flag. */
  cancelReads: number;
  interim: string[];
  deps: LoopDeps;
}

function recorder(opts: {
  cancel?: boolean;
  /** The 1-based read the flag first answers true on, for a case about WHEN
   *  the loop looks. `cancel` is the flag standing raised the whole turn. */
  cancelOnRead?: number;
  toolResult?: (name: string) => string;
  budget?: Partial<LoopBudget>;
} = {}): Recorder {
  const rec: Recorder = {
    executed: [],
    cancelReads: 0,
    interim: [],
    deps: {
      async executeReadOnlyTool(name) {
        rec.executed.push(name);
        return opts.toolResult?.(name) ?? JSON.stringify({ ok: true, rows: [] });
      },
      threadState: {
        async consumeCancel(_ref: ThreadRef) {
          rec.cancelReads++;
          if (opts.cancelOnRead !== undefined) return rec.cancelReads === opts.cancelOnRead;
          return opts.cancel === true;
        },
      },
      budget: budgetStub(opts.budget),
    },
  };
  return rec;
}

const PENDING: PendingProposal = {
  toolName: "notion_create",
  input: { title: "A card" },
  channel: "C1",
  threadTs: "t1",
  userMsgTs: "u1",
  proposalTs: "p1",
  proposalText: "(card)",
  requesterUserId: "U1",
};

function loopInput(
  provider: LoopInput["provider"],
  rec: Recorder,
  over: Partial<LoopInput> = {},
): LoopInput {
  return {
    provider,
    deps: rec.deps,
    tier: "default",
    routeReason: "default-route",
    conversation: [{ role: "user", text: "what does the blueprint say about reflection?" }],
    system: [{ text: "harness", stable: true }],
    tools: [{ name: "search_blueprint", description: "search", input_schema: {} }],
    pending: null,
    currentSenderId: "U1",
    cancelKey: { channel: "C1", thread: "t1" },
    onInterim: (t) => rec.interim.push(t),
    ...over,
  };
}

/** The conversation key the stop cases below press on — `loopInput`'s own. */
const CANCEL_REF: ThreadRef = { channel: "C1", thread: "t1" };

/** A reply that asks for one read-only lookup. */
const LOOKUP = { toolCalls: [{ name: "search_blueprint", args: { query: "reflection" } }] };

function repeat<T>(n: number, value: T): T[] {
  return Array.from({ length: n }, () => value);
}

function fake(opts: FakeProviderOptions) {
  return fakeProvider(opts);
}

// ── /stop ────────────────────────────────────────────────────────────────────

test("a stop mid-turn stops the turn and runs no further tool", async () => {
  // The press lands while the second lookup is running, so the reads at
  // iterations 0 and 1 saw nothing and the read at iteration 2 sees it.
  const rec = recorder({ cancelOnRead: 3 });
  const provider = fake({ replies: repeat(6, LOOKUP) });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "stopped" });
  // Two model calls happened (iterations 0 and 1) and each ran its lookup; the
  // third iteration read the flag and stopped BEFORE calling the model — the
  // tool boundary that keeps a half-executed proposal impossible.
  assert.equal(provider.sends.length, 2);
  assert.deepEqual(rec.executed, ["search_blueprint", "search_blueprint"]);
  // One read per iteration, the first included: a turn that answers on
  // iteration 0 is exactly the turn a button press arrives during (#589).
  assert.equal(rec.cancelReads, 3);
});

test("a stop visible on iteration 0 stops the turn before the model is called", async () => {
  const rec = recorder({ cancel: true });
  const provider = fake({ replies: [{ text: "an answer nobody waited for" }] });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "stopped" });
  assert.equal(provider.sends.length, 0);
  assert.equal(rec.cancelReads, 1);
});

test("a stop landing after the last model reply suppresses the answer", async () => {
  // The other half of #589, and the half no iteration count could fix: the
  // press arrives DURING the final model call. The read at the top of the
  // iteration is honest — the flag was not there yet — so the only read that
  // can see this press is the one before the answer is delivered.
  //
  // The store is the real in-memory adapter, so the flag is written by
  // `requestCancel` and consumed once, exactly as it is in production.
  const store = createInMemoryThreadState();
  const rec = recorder();
  rec.deps.threadState = store;
  const scripted = fake({ replies: [{ text: "the answer that goes undelivered" }] });
  const pressedWhileAnswering: LoopInput["provider"] = {
    ...scripted,
    async send(opts) {
      const reply = await scripted.send(opts);
      // Somebody clicks stop while the model is producing this reply.
      await store.requestCancel(CANCEL_REF);
      return reply;
    },
  };

  const result = await runLoop(loopInput(pressedWhileAnswering, rec, { cancelKey: CANCEL_REF }));

  assert.deepEqual(result, { kind: "stopped" });
  // The model call itself completed: cancellation is cooperative, and what is
  // suppressed is the DELIVERY of what it said.
  assert.equal(scripted.sends.length, 1);
  // Consumed, so the next turn in this thread is not stopped by the same press.
  assert.equal(await store.consumeCancel(CANCEL_REF), false);
});

test("a turn with no conversation to cancel never reads the /stop flag", async () => {
  // The headless eval path has no Slack conversation, so there is no key to
  // read — and reading one anyway is how the writer and the reader drifted.
  const rec = recorder({ cancel: true });
  const provider = fake({ replies: [...repeat(3, LOOKUP), { text: "here you go" }] });

  const result = await runLoop(loopInput(provider, rec, { cancelKey: null }));

  assert.deepEqual(result, { kind: "text", text: "here you go" });
  assert.equal(rec.cancelReads, 0);
});

test("a /stop read that fails lets the turn finish", async () => {
  const rec = recorder();
  rec.deps.threadState = {
    consumeCancel: async () => {
      throw new Error("durable object unreachable");
    },
  };
  const provider = fake({ replies: [...repeat(2, LOOKUP), { text: "answered anyway" }] });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "text", text: "answered anyway" });
});

// ── fallback on status ───────────────────────────────────────────────────────

test("a 429 retries on the backup model when the provider has one", async () => {
  const rec = recorder();
  const provider = fake({
    failTimes: 1,
    failStatus: 429,
    backupModel: "fake-backup",
    replies: [{ text: "answered on the backup" }],
  });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "text", text: "answered on the backup" });
  // The retry went to the BACKUP, not to the primary again.
  assert.deepEqual(
    provider.sends.map((s) => s.model),
    ["fake-1", "fake-backup"],
  );
  assert.equal(provider.dials().model, "fake-backup");
});

test("a 429 with no backup surfaces the failure through the same path", async () => {
  const rec = recorder();
  const provider = fake({ failTimes: 1, failStatus: 429, backupModel: null });

  await assert.rejects(() => runLoop(loopInput(provider, rec)), /fake 429: fake capacity failure/);
  // One attempt, and no second one: the loop asked, the adapter said it had no
  // backup, and nothing was retried blind.
  assert.equal(provider.sends.length, 1);
});

test("the backup is tried once per turn, not once per failure", async () => {
  const rec = recorder();
  const provider = fake({ failTimes: 2, failStatus: 503, backupModel: "fake-backup" });

  await assert.rejects(() => runLoop(loopInput(provider, rec)), /fake 503/);
  assert.equal(provider.sends.length, 2);
});

test("a status the provider does not consider recoverable is not retried", async () => {
  const rec = recorder();
  const provider = fake({
    failTimes: 1,
    failStatus: 400,
    backupModel: "fake-backup",
    replies: [{ text: "never reached" }],
  });

  await assert.rejects(() => runLoop(loopInput(provider, rec)), /fake 400/);
  assert.equal(provider.sends.length, 1);
});

// ── the synthesis pass ───────────────────────────────────────────────────────

test("hitting the iteration ceiling triggers the tools-disabled synthesis pass", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [...repeat(MAX_ITERATIONS, LOOKUP), { text: "here is what I gathered" }],
  });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "text", text: "here is what I gathered" });
  assert.equal(provider.sends.length, MAX_ITERATIONS + 1);
  // Every iteration ran with tools; only the synthesis pass did not.
  assert.deepEqual(
    provider.sends.map((s) => s.toolsEnabled),
    [...repeat(MAX_ITERATIONS, true), false],
  );
  const nudge = provider.transcript.filter((e) => e.kind === "user");
  assert.deepEqual(nudge, [{ kind: "user", text: BUDGET_EXHAUSTED_SYNTHESIS }]);
  // The count backstop held too: past it the lookups were refused rather than
  // run, so the turn cannot keep spending on a model that will not stop asking.
  assert.equal(rec.executed.length, READONLY_TOOL_BUDGET);
});

test("no iteration budget left goes straight to the synthesis pass", async () => {
  // The model round-trip is the one subrequest every iteration spends and is
  // deliberately not under the enforced limit — so it is gated before it is
  // spent, and the turn still produces a reply.
  const rec = recorder({ budget: { used: () => LOOKUP_CEILING - 1 } });
  const provider = fake({ replies: [{ text: "answering from nothing" }] });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "text", text: "answering from nothing" });
  assert.deepEqual(
    provider.sends.map((s) => s.toolsEnabled),
    [false],
  );
  assert.deepEqual(rec.executed, []);
});

test("a synthesis pass that says nothing falls back to the clarify line", async () => {
  const rec = recorder({ budget: { used: () => LOOKUP_CEILING - 1 } });
  const provider = fake({ replies: [{ text: "" }] });

  const result = await runLoop(loopInput(provider, rec));

  assert.equal(result.kind, "text");
  assert.match((result as { text: string }).text, /narrow the question/);
});

// ── the budget at the lookup boundary ────────────────────────────────────────

test("a budget trip marks the lookup partial", async () => {
  let trips = 0;
  const rec = recorder({
    budget: {
      trips: () => trips,
      // A lookup that stops short: it returns normally (a paging loop ending
      // cleanly, or a catch that ate the throw) and the meter records the stop.
      withLookupLimit: async (_limit, fn) => {
        const out = await fn();
        trips += 1;
        return out;
      },
    },
    toolResult: () => JSON.stringify({ ok: true, rows: [] }),
  });
  const provider = fake({ replies: [LOOKUP, { text: "done" }] });

  await runLoop(loopInput(provider, rec));

  const [handed] = provider.transcript;
  assert.equal(handed?.kind, "results");
  const text = handed?.kind === "results" ? handed.results[0]!.text : "";
  // The model is told the read was cut short, so nothing found can be reported
  // as nothing existing — the false-absence failure this guards.
  assert.match(text, /cut short/);
  assert.match(text, /treat it as unread, not empty/);
});

test("a lookup the ceiling refused reads as a refusal, never as an empty result", async () => {
  const budgetError = new Error("subrequest budget exhausted");
  const rec = recorder({
    budget: {
      isBudgetError: (err) => err === budgetError,
      withLookupLimit: () => Promise.reject(budgetError),
    },
  });
  const provider = fake({ replies: [LOOKUP, { text: "done" }] });

  await runLoop(loopInput(provider, rec));

  const [handed] = provider.transcript;
  const text = handed?.kind === "results" ? handed.results[0]!.text : "";
  assert.match(text, /no more lookups available this turn/);
});

test("a lookup that fails for any other reason still fails the turn", async () => {
  const rec = recorder({
    budget: { withLookupLimit: () => Promise.reject(new Error("notion is down")) },
  });
  const provider = fake({ replies: [LOOKUP] });

  await assert.rejects(() => runLoop(loopInput(provider, rec)), /notion is down/);
});

test("lookups past the ceiling are refused without running", async () => {
  // The spend crosses the ceiling during the turn: the iteration gate passed,
  // then the model round-trip itself took the last of it. The lookup is
  // refused rather than attempted.
  let reads = 0;
  const rec = recorder({ budget: { used: () => (reads++ === 0 ? 0 : LOOKUP_CEILING) } });
  const provider = fake({ replies: [LOOKUP, { text: "done" }] });

  await runLoop(loopInput(provider, rec));

  assert.deepEqual(rec.executed, []);
  const [handed] = provider.transcript;
  const text = handed?.kind === "results" ? handed.results[0]!.text : "";
  assert.match(text, /no more lookups available this turn/);
});

// ── the narration rule ───────────────────────────────────────────────────────

test("narration is emitted ahead of read-only work", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [{ text: "Let me check the blueprint for the reflection path.", ...LOOKUP }, { text: "done" }],
  });

  await runLoop(loopInput(provider, rec));

  assert.deepEqual(rec.interim, ["Let me check the blueprint for the reflection path."]);
});

test("narration is NOT emitted ahead of a side-effect call", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [
      {
        text: "I'll file a Roadmap card for the reflection redesign.",
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });

  const result = await runLoop(loopInput(provider, rec));

  // The text is delivered ON the proposal card instead; narrating it would
  // duplicate it in the thread.
  assert.deepEqual(rec.interim, []);
  assert.deepEqual(result, {
    kind: "proposal",
    operations: [{ toolName: "notion_create", input: { title: "Reflection redesign" } }],
    toolName: "notion_create",
    input: { title: "Reflection redesign" },
    previewText: "I'll file a Roadmap card for the reflection redesign.",
  });
});

test("every side-effect call in one reply becomes ONE proposal, and the read-only call still runs", async () => {
  // The #554 incident, at the seam it happened: the model asked for two writes
  // and a lookup in a single reply, the loop returned the first write, and the
  // other two vanished with no log and nothing the person could see.
  const rec = recorder();
  const provider = fake({
    replies: [
      {
        text: "Rewriting the TLDR and filing the decision.",
        toolCalls: [
          { name: "notion_update", args: { page: "hub", heading: "TLDR" } },
          { name: "blueprint_query", args: { need: "calendar sync" } },
          { name: "notion_create", args: { surface: "decision", title: "Calendar Sync cut" } },
        ],
      },
    ],
  });

  const result = await runLoop(loopInput(provider, rec));

  assert.equal(result.kind, "proposal");
  assert.deepEqual(result.kind === "proposal" ? result.operations : [], [
    { toolName: "notion_update", input: { page: "hub", heading: "TLDR" } },
    { toolName: "notion_create", input: { surface: "decision", title: "Calendar Sync cut" } },
  ]);
  // The first operation still fills the single-call fields every reader that has
  // not moved to `operations` yet is built on.
  assert.equal(result.kind === "proposal" ? result.toolName : "", "notion_update");
  // The lookup in the same reply RAN — an announced call left unanswered is the
  // silent drop this batch exists to end.
  assert.deepEqual(rec.executed, ["blueprint_query"]);
  const [handed] = provider.transcript;
  assert.equal(handed?.kind === "results" ? handed.results.length : 0, 1);
  assert.equal(handed?.kind === "results" ? handed.results[0]!.name : "", "blueprint_query");
});

test("narration is NOT emitted ahead of resolving a proposal", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [
      {
        text: "Confirming the card you asked for just now.",
        toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm" } }],
      },
    ],
  });

  const result = await runLoop(loopInput(provider, rec, { pending: PENDING }));

  assert.deepEqual(rec.interim, []);
  assert.equal(result.kind, "resolved");
});

// ── the gate's own front door: the model's proposal_resolve call ─────────────

test("a proposal_resolve with nothing pending is refused, and every call in the turn is answered", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [
      {
        toolCalls: [
          { name: "proposal_resolve", args: { decision: "confirm" } },
          { name: "search_blueprint", args: { query: "reflection" } },
        ],
      },
      { text: "nothing was pending, so here is an answer instead" },
    ],
  });

  const result = await runLoop(loopInput(provider, rec, { pending: null }));

  assert.deepEqual(result, {
    kind: "text",
    text: "nothing was pending, so here is an answer instead",
  });
  // BOTH calls were answered. An announced call left without a result leaves a
  // slot the next same-named call fills by mistake — and on some wire formats
  // the next request is rejected outright.
  const [handed] = provider.transcript;
  assert.equal(handed?.kind, "results");
  const results = handed?.kind === "results" ? handed.results : [];
  assert.deepEqual(
    results.map((r) => r.name),
    ["proposal_resolve", "search_blueprint"],
  );
  assert.match(results[0]!.text, /no pending proposal in this thread/);
  assert.match(results[1]!.text, /deferred/);
  // And the refused lookup did not run: the turn is answering the gate, not
  // quietly doing the work it deferred.
  assert.deepEqual(rec.executed, []);
});

test("a confirm against a pending proposal resolves the turn", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [
      {
        toolCalls: [
          { name: "proposal_resolve", args: { decision: "confirm", message_to_user: "on it" } },
        ],
      },
    ],
  });

  const result = await runLoop(loopInput(provider, rec, { pending: PENDING }));

  assert.deepEqual(result, {
    kind: "resolved",
    decision: "confirm",
    pending: PENDING,
    messageToUser: "on it",
  });
});

// ── preflight, mid-turn ──────────────────────────────────────────────────────
//
// A refusal used to reach only the person, after the loop returned, so the model
// never learned why and re-posted the same proposal (2026-09-15). It now comes
// back as that call's own result — once.

/** A preflight that refuses until the title stops being a slot. */
function slotGuard(rec: Recorder, alwaysRefuse = false) {
  const seen: Array<Record<string, unknown>> = [];
  const deps: LoopDeps = {
    ...rec.deps,
    async preflight(_name, args) {
      seen.push(args);
      const title = typeof args.title === "string" ? args.title : "";
      return alwaysRefuse || title === "[TBD]"
        ? { ask: "the *title* is still a placeholder (`[TBD]`)" }
        : null;
    },
  };
  return { seen, deps };
}

test("a refused side-effect call comes back to the model, and the corrected call is staged", async () => {
  const rec = recorder();
  const guard = slotGuard(rec);
  const provider = fake({
    replies: [
      { toolCalls: [{ name: "notion_create", args: { surface: "decision", title: "[TBD]" } }] },
      {
        toolCalls: [
          { name: "notion_create", args: { surface: "decision", title: "Calendar Sync scope cut" } },
        ],
      },
    ],
  });

  const result = await runLoop(loopInput(provider, rec, { deps: guard.deps }));

  // The model saw the reason, in the slot of the call it made.
  const [handed] = provider.transcript;
  const results = handed?.kind === "results" ? handed.results : [];
  assert.equal(results.length, 1);
  assert.equal(results[0]!.name, "notion_create");
  assert.match(results[0]!.text, /still a placeholder/);
  assert.equal(results[0]!.isError, true);
  // And the call it made instead is what got staged — checked in its turn.
  assert.equal(result.kind, "proposal");
  assert.deepEqual(result.kind === "proposal" ? result.input : null, {
    surface: "decision",
    title: "Calendar Sync scope cut",
  });
  assert.equal(guard.seen.length, 2);
});

test("a second refusal is staged anyway — that one is Turn's to put to the person", async () => {
  const rec = recorder();
  const guard = slotGuard(rec, true);
  const provider = fake({
    replies: [
      { toolCalls: [{ name: "notion_create", args: { title: "[TBD]" } }] },
      { toolCalls: [{ name: "notion_create", args: { title: "[TBD] still" } }] },
    ],
  });

  const result = await runLoop(loopInput(provider, rec, { deps: guard.deps }));

  // One correction, not a loop of them: the second refused call comes back as a
  // proposal, and Turn's own preflight is what the person hears.
  assert.equal(guard.seen.length, 2);
  assert.equal(provider.transcript.length, 1);
  assert.equal(result.kind, "proposal");
  assert.deepEqual(
    result.kind === "proposal" ? result.input : null,
    { title: "[TBD] still" },
  );
});

test("a side-effect call is staged unchecked when the caller has no preflight", async () => {
  const rec = recorder();
  const provider = fake({
    replies: [{ toolCalls: [{ name: "notion_create", args: { title: "A card" } }] }],
  });

  const result = await runLoop(loopInput(provider, rec));

  assert.equal(result.kind, "proposal");
  assert.equal(provider.transcript.length, 0);
});

// ── what the adapter is handed ───────────────────────────────────────────────

test("the provider is opened once with the tier, the conversation, the system blocks and the roster", async () => {
  const rec = recorder();
  const provider = fake({ replies: [{ text: "hello" }] });

  await runLoop(loopInput(provider, rec, { tier: "grind" }));

  assert.equal(provider.started?.tier, "grind");
  assert.equal(provider.started?.conversation.length, 1);
  assert.deepEqual(provider.started?.system, [{ text: "harness", stable: true }]);
  assert.deepEqual(
    provider.started?.tools.map((t) => t.name),
    ["search_blueprint"],
  );
});

test("a paused turn is resumed without answering anything", async () => {
  // Server-side tool work (a hosted web search) can pause a long turn. The
  // adapter re-records its own paused reply; nothing ran, so nothing is
  // answered, and the loop calls again.
  const rec = recorder();
  const provider = fake({
    replies: [{ text: "searching the web", stop: "paused" }, { text: "found it" }],
  });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "text", text: "found it" });
  assert.deepEqual(provider.transcript, [{ kind: "results", results: [] }]);
  assert.deepEqual(rec.executed, []);
});

test("the turn reports the tier, the route and the provider's own dials", async () => {
  const rec = recorder();
  const provider = fake({ replies: [{ text: "hello" }], model: "fake-3.8" });
  let dials: unknown = null;

  await runLoop(
    loopInput(provider, rec, { tier: "chill", routeReason: "short-reply", onDials: (d) => { dials = d; } }),
  );

  assert.deepEqual(dials, {
    tier: "chill",
    route: "short-reply",
    model: "fake-3.8",
    // Empty for a provider with no dials of its own — not a null field named
    // for another provider's dial.
    detail: {},
  });
});

test("an empty final reply still says something", async () => {
  const rec = recorder();
  const provider = fake({ replies: [{ text: "" }] });

  const result = await runLoop(loopInput(provider, rec));

  assert.deepEqual(result, { kind: "text", text: "(empty response)" });
});
