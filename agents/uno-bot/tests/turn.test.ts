// A whole Slack turn, without Slack.
//
// Every case here drives `runTurn` across its own interface — one request in,
// one outcome out — on the three fakes the refactor exists to make possible:
// the recording Delivery, the in-memory ThreadState and the fake
// ModelProvider behind the real agent loop. So the model round-trip, the
// proposal gate, the judges and the history write are all exercised, and
// nothing is stubbed that a designer in Slack would rely on.
//
// What each case asserts is what the turn OBSERVABLY did: what was posted, what
// was staged, what was resolved, what the conversation now remembers.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLoop, type LoopBudget } from "../src/agent/loop";
import { fakeProvider, type FakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import { buildProviderConversation } from "../src/agent/provider-conversation";
import {
  recordingDelivery,
  runTurn,
  HISTORY_COMPACT_AT,
  HISTORY_KEEP_RECENT,
  type RecordingDelivery,
  type TurnDeps,
  type TurnOutcome,
  type TurnRequest,
} from "../src/turn/index";
import { batchResultMessage, runOperations, type OperationOutcome } from "../src/gate/index";
import {
  createInMemoryThreadState,
  type HistoryTurn,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";

// ── harness ──────────────────────────────────────────────────────────────────

const CHANNEL = "C1";
const CONVERSATION = "1700000000.000100";
const REF = { channel: CHANNEL, thread: CONVERSATION };

/** A meter that spends nothing: no case here is about the budget (that is
 *  `agent-loop.test.ts`), and a turn must not need one to run. */
const IDLE_BUDGET: LoopBudget = {
  used: () => 0,
  trips: () => 0,
  withLookupLimit: (_limit, fn) => fn(),
  isBudgetError: () => false,
  breakdown: () => "test",
};

const PENDING: PendingProposal = {
  toolName: "notion_create",
  input: { title: "Reflection redesign" },
  channel: CHANNEL,
  threadTs: CONVERSATION,
  replyTs: CONVERSATION,
  userMsgTs: "1700000000.000090",
  proposalTs: "1700000000.000095",
  proposalText: "(the staged card)",
  requesterUserId: "U1",
};

function request(over: Partial<TurnRequest> = {}): TurnRequest {
  return {
    userId: "U1",
    channel: CHANNEL,
    conversationTs: CONVERSATION,
    replyTs: CONVERSATION,
    userMsgTs: "1700000000.000200",
    surface: "channel",
    threaded: true,
    text: "how does a call-off reach a fill-in?",
    images: [],
    history: [],
    pending: null,
    ...over,
  };
}

interface Harness {
  deps: TurnDeps;
  delivery: RecordingDelivery;
  threadState: ThreadState;
  provider: FakeProvider;
  /** Every proposal resolution the turn asked for, in order. */
  resolved: Array<{
    toolName: string;
    decision: "confirm" | "cancel";
    narrative?: string;
    /** Whether the verdict carried a tool to run — a decline carries none. */
    executed: boolean;
  }>;
  /** What the approved batch actually ran, when the case supplied an executor. */
  ran: OperationOutcome[];
  /** Every draft the judge was handed. */
  judged: string[];
  /** Tool names the loop actually executed. */
  executed: string[];
}

function harness(opts: {
  replies?: ScriptedReply[];
  /** Stand in for the judge. Returning text revises the draft. */
  judge?: (draft: string) => { text: string; verdict: string };
  preflightAsk?: string;
  /** A refusal that depends on the call — what a real guard does. */
  preflightFor?: (toolName: string, input: Record<string, unknown>) => string | null;
  delivery?: RecordingDelivery;
  threadState?: ThreadState;
  toolResult?: string;
  /** Stand in for the side-effect tool table, so a case can fail one operation
   *  of a batch. Absent — as everywhere else here — nothing is executed. */
  executeOperation?: (operation: { toolName: string; input: Record<string, unknown> }) => Promise<string>;
} = {}): Harness {
  const delivery = opts.delivery ?? recordingDelivery();
  const threadState = opts.threadState ?? createInMemoryThreadState();
  const provider = fakeProvider({ replies: opts.replies ?? [{ text: "Here is the answer." }] });
  const resolved: Harness["resolved"] = [];
  const ran: OperationOutcome[] = [];
  const judged: string[] = [];
  const executed: string[] = [];

  const deps: TurnDeps = {
    threadState,
    delivery,

    // The REAL loop, behind the fake provider: the turn's request reaches a
    // model through the same code production uses.
    async runAgent(req) {
      const result = await runLoop({
        provider,
        deps: {
          async executeReadOnlyTool(name) {
            executed.push(name);
            return opts.toolResult ?? JSON.stringify({ ok: true, rows: [] });
          },
          threadState: { async consumeCancel() { return false; } },
          budget: IDLE_BUDGET,
          // Wired as production wires it: the loop gets the first go at a
          // refusal, and only a call refused twice reaches the person.
          ...(req.preflight ? { preflight: req.preflight } : {}),
        },
        tier: req.tier,
        routeReason: req.routeReason,
        conversation: buildProviderConversation(
          req.history,
          req.userText,
          req.images ?? [],
          req.historicalImages,
        ),
        system: [{ text: "(harness)", stable: true }],
        tools: [],
        pending: req.pending,
        currentSenderId: req.currentSender.userId,
        cancelKey: null,
        ...(req.onInterim ? { onInterim: req.onInterim } : {}),
      });
      return { result, tools: executed.slice(), references: [] };
    },

    async reviewDraft({ draft }) {
      judged.push(draft);
      return opts.judge ? opts.judge(draft) : { text: draft, verdict: "pass" };
    },

    async preflight(toolName, input) {
      const ask = opts.preflightFor?.(toolName, input) ?? opts.preflightAsk;
      return ask ? { ask } : null;
    },

    // The gate's EXECUTION port. The decision half is not a dependency: the
    // turn calls `resolveSignal` itself against the in-memory store, so what
    // arrives here is a verdict that has already won its claim.
    async applyVerdict(verdict) {
      if (verdict.outcome !== "won" || !verdict.proposal || !verdict.decision) return;
      resolved.push({
        toolName: verdict.proposal.toolName,
        decision: verdict.decision,
        ...(verdict.post ? { narrative: verdict.post.text } : {}),
        executed: verdict.execute !== undefined,
      });
      // The batch runner production's executor is built on, on a case's own
      // fake tool table — so "the whole batch runs, in order, past a failure"
      // is asserted through a Turn rather than against a helper.
      if (opts.executeOperation && verdict.execute) {
        ran.push(...(await runOperations(verdict.execute.operations, opts.executeOperation)));
      }
    },

    cards: {
      async notionUpdateBody() {
        return "• *Design Status:* `WIP` → `Ready for QA`";
      },
      async notionArchiveTargetNote() {
        return "• *Target:* A card — in Roadmap";
      },
      async implementDesignCard(_input, _userId, previewText) {
        return { text: `(figma card) ${previewText ?? ""}`, blocks: [{ type: "image" }] };
      },
    },

    async readAntecedent() {
      return [];
    },

    describeAssistantContext: () => null,
  };

  return { deps, delivery, threadState, provider, resolved, ran, judged, executed };
}

/** Posts a person would actually read, in order. */
const postsOf = (delivery: RecordingDelivery): string[] => delivery.posted;

/**
 * Stage `PENDING` for real, in the store.
 *
 * A turn that resolves a proposal goes through Gate now, and Gate's claim is a
 * delete in the store — so a proposal that is only in the request and not in
 * the store reads as one somebody else already resolved. Which is correct: it
 * is the same record either way in production.
 */
const stage = (h: Harness): Promise<void> => h.threadState.putProposal(PENDING).then(() => {});

/** The narrative Gate posts when the signal brought no words of its own. */
const DEFAULT_CONFIRM_POST = "Got it — kicking that off.";

// ── (a) a pending proposal, and the reply that resolves it ───────────────────

test("a typed ✅ against a pending proposal resolves it and posts exactly once", async () => {
  const h = harness();
  await stage(h);
  const outcome: TurnOutcome = await runTurn(
    request({ text: ":white_check_mark:", pending: PENDING }),
    h.deps,
  );

  assert.equal(outcome.disposition, "resolved");
  // ONE resolution, through the same claim every other confirmation path uses.
  assert.deepEqual(h.resolved, [
    {
      toolName: "notion_create",
      decision: "confirm",
      narrative: DEFAULT_CONFIRM_POST,
      executed: true,
    },
  ]);
  // The gate's own text, said once, through Delivery.
  assert.deepEqual(postsOf(h.delivery), [DEFAULT_CONFIRM_POST]);
  // And the card is gone: the claim took it.
  assert.equal(await h.threadState.getProposalByThread(REF), null);
  // And nothing else was said: no answer, no second card, no model call.
  assert.equal(h.provider.sends.length, 0);
  assert.equal(
    h.delivery.calls.filter((c) => c.kind === "answer" || c.kind === "proposal").length,
    0,
  );
  // The exchange is still remembered, both halves.
  const stored = await h.threadState.readHistory(REF);
  assert.deepEqual(
    stored.map((t) => t.role),
    ["user", "assistant"],
  );
  assert.match(stored[1]!.content, /confirmed/);
});

test("a typed reply the model reads as approval resolves the card once", async () => {
  // "yes please" is not an emoji, so it goes to the model — which reads the
  // pending proposal in context and calls `proposal_resolve`. The turn must
  // execute that, not stage a second card.
  const h = harness({
    replies: [
      {
        toolCalls: [
          {
            name: "proposal_resolve",
            args: { decision: "confirm", message_to_user: "Filing it now." },
          },
        ],
      },
    ],
  });
  await stage(h);
  const outcome = await runTurn(request({ text: "yes please", pending: PENDING }), h.deps);

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved, [
    {
      toolName: "notion_create",
      decision: "confirm",
      narrative: "Filing it now.",
      executed: true,
    },
  ]);
  assert.equal(outcome.posted, "Filing it now.");
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 0);
});

// ── (b) an image reaches the provider ────────────────────────────────────────

test("an image on the request reaches the model, and the tier routed in Turn goes with it", async () => {
  const h = harness();
  const outcome = await runTurn(
    request({
      text: "what's wrong with this frame?",
      images: [{ media_type: "image/png", data: "aGVsbG8=" }],
    }),
    h.deps,
  );

  assert.equal(outcome.disposition, "answered");
  const started = h.provider.started;
  assert.ok(started, "the loop opened the turn on the provider");
  const withImages = started.conversation.filter((t) => (t.images?.length ?? 0) > 0);
  assert.equal(withImages.length, 1);
  assert.equal(withImages[0]!.images![0]!.data, "aGVsbG8=");
  // Routing happened HERE and travelled down as an opaque name.
  assert.equal(started.tier, "default");
  assert.equal(outcome.telemetry.tier, "default");
  assert.equal(outcome.telemetry.route, "default-tier");
});

// ── (c) a draft the judge rejects ────────────────────────────────────────────

test("a draft-judge rejection posts the revision, not the draft", async () => {
  const h = harness({
    replies: [{ text: "The blueprint says nothing about call-offs." }],
    judge: (draft) => ({
      text: `${draft} (revised: scoped to the paths I read.)`,
      verdict: "fail",
    }),
  });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(h.judged.length, 1, "the judge saw the draft");
  assert.match(outcome.posted ?? "", /revised: scoped to the paths I read/);
  assert.deepEqual(postsOf(h.delivery), [outcome.posted]);
  assert.equal(outcome.telemetry.judge, "fail");
  // What was posted is what is remembered — not the draft that lost.
  const stored = await h.threadState.readHistory(REF);
  assert.match(stored[1]!.content, /revised/);
});

test("a reply Slack never accepted is reported as a failure and never remembered as posted", async () => {
  const h = harness({ delivery: recordingDelivery({ answerFails: true }) });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "failed");
  assert.deepEqual(outcome.failure, { stage: "delivery" });
  const stored = await h.threadState.readHistory(REF);
  assert.deepEqual(
    stored.map((t) => t.role),
    ["user"],
    "the user half is recorded; the assistant half is not invented",
  );
});

// ── (d) history: both halves, and compaction at the cap ──────────────────────

test("the exchange is appended with both halves, and compacted once the store is full", async () => {
  const threadState = createInMemoryThreadState();
  // Fill the conversation to just short of the compaction point, so this turn's
  // pair crosses it. The opening turn is the one the store's own cap would drop
  // first, which is why compaction happens before the cap is reached.
  await threadState.appendHistory(REF, { role: "user", content: "the opening question" });
  for (let i = 1; i < HISTORY_COMPACT_AT - 2; i++) {
    await threadState.appendHistory(REF, {
      role: i % 2 ? "assistant" : "user",
      content: `filler ${i}`,
    });
  }
  const before = await threadState.readHistory(REF);
  assert.equal(before.length, HISTORY_COMPACT_AT - 2);

  const h = harness({ threadState, replies: [{ text: "Here is the answer." }] });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.deepEqual(
    outcome.wrote.turns.map((t) => t.role),
    ["user", "assistant"],
    "both halves of the exchange are reported as written",
  );
  assert.ok(outcome.wrote.compacted > 0, "compaction ran and said how much it dropped");

  const after = await threadState.readHistory(REF);
  assert.equal(after.length, HISTORY_KEEP_RECENT + 1);
  assert.equal(after[0]!.content, "the opening question", "the goal of the conversation survives");
  assert.equal(after.at(-1)!.content, "Here is the answer.");
});

test("the user turn carries this turn's retrieval receipt", async () => {
  // The receipt rides the USER turn because the user message's ts is the only
  // key the reply path has to merge on.
  const h = harness();
  const withReceipt: TurnDeps = {
    ...h.deps,
    async runAgent(req) {
      const run = await h.deps.runAgent(req);
      return {
        ...run,
        receipt: { tool: "search_blueprint", query: "call-off", count: 3, scenarios: ["Call-Off"] },
      };
    },
  };
  await runTurn(request(), withReceipt);

  const stored: HistoryTurn[] = await h.threadState.readHistory(REF);
  assert.equal(stored[0]!.retrieval?.query, "call-off");
  assert.equal(stored[0]!.ts, "1700000000.000200");
  assert.equal(stored[1]!.retrieval, undefined);
});

// ── (e) a proposal to stage ──────────────────────────────────────────────────

test("a side-effect call comes back as a proposal to stage, and the card was delivered", async () => {
  const h = harness({
    replies: [
      {
        text: "I'll file a Roadmap card for the reflection redesign.",
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.ok(outcome.staged, "the outcome carries the proposal");
  assert.equal(outcome.staged.proposal.toolName, "notion_create");
  assert.deepEqual(outcome.staged.proposal.input, { title: "Reflection redesign" });
  // The card went out through Delivery, and its ts is the proposal's identity.
  const cards = h.delivery.calls.filter((c) => c.kind === "proposal");
  assert.equal(cards.length, 1);
  assert.equal(outcome.staged.proposal.proposalTs, h.delivery.stagedAt[0]);
  assert.match(outcome.staged.card.text, /Reflection redesign/);
  // And it is confirmable the moment it posts: the store has it.
  const staged = await h.threadState.getProposalByThread(REF);
  assert.equal(staged?.proposalTs, h.delivery.stagedAt[0]);
});

test("a rewrite ask stages a replace, and never a silent append", async () => {
  // The Calendar Sync shape (2026-09-15): a page said something that had stopped
  // being true, and append-only meant the correction could only land BELOW the
  // stale text, leaving the page holding both readings. A replace carries the
  // block id and the stamp the read reported, so the gate card and the write
  // are about ONE block rather than about the bottom of the page.
  const REPLACE = {
    page_url: "https://notion.so/Calendar-Sync-2a2a2a2a",
    replace: [
      {
        block_id: "1f2e3d4c-5b6a-7980-1234-56789abcdef0",
        last_edited_time: "2026-09-15T14:02:00.000Z",
        content: "Sync runs hourly, not nightly.",
      },
    ],
  };
  const h = harness({
    replies: [
      {
        text: "I'll correct that line in place.",
        toolCalls: [{ name: "notion_update", args: REPLACE }],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "the TLDR on the Calendar Sync page is wrong — fix it" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.equal(outcome.staged?.proposal.toolName, "notion_update");
  // The whole operation reaches the store intact — the stamp included, because
  // it is what the write checks before it touches the block.
  assert.deepEqual(outcome.staged?.proposal.input, REPLACE);
  assert.equal((outcome.staged?.proposal.input as Record<string, unknown>).append, undefined);
});

test("several side-effect calls in one reply stage ONE proposal that holds all of them", async () => {
  const h = harness({
    replies: [
      {
        text: "Reconciling the four docs after the scope change.",
        toolCalls: [
          { name: "notion_update", args: { title: "Calendar Sync hub", heading: "TLDR" } },
          { name: "notion_update", args: { title: "Calendar Sync PRD", heading: "Scope" } },
          { name: "notion_create", args: { surface: "decision", title: "Calendar Sync cut" } },
        ],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "update the notion docs accordingly" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.ok(outcome.staged, "the outcome carries the proposal");
  // ONE card, not three, and not one operation with two dropped.
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 1);
  assert.deepEqual(
    outcome.staged.proposal.operations?.map((o) => o.toolName),
    ["notion_update", "notion_update", "notion_create"],
  );
  // The card names every one of them — the ✅ is consent to what it says.
  assert.match(outcome.staged.card.text, /3 operations/);
  assert.match(outcome.staged.card.text, /Calendar Sync hub/);
  assert.match(outcome.staged.card.text, /Calendar Sync PRD/);
  assert.match(outcome.staged.card.text, /Calendar Sync cut/);
  // And the store holds the whole batch, so a later ✅ runs all of it.
  const staged = await h.threadState.getProposalByThread(REF);
  assert.equal(staged?.operations?.length, 3);
});

test("a ✅ on a batch runs every operation in order, and a failure hides none of the others", async () => {
  const operations = [
    { toolName: "notion_update", input: { title: "Calendar Sync hub" } },
    { toolName: "notion_update", input: { title: "Calendar Sync PRD" } },
    { toolName: "notion_create", input: { surface: "decision", title: "Calendar Sync cut" } },
  ];
  const order: string[] = [];
  const h = harness({
    async executeOperation(operation) {
      order.push(String(operation.input.title));
      // Operation two fails; one and three are still approved and still run.
      return operation.input.title === "Calendar Sync PRD"
        ? JSON.stringify({ ok: false, error: "the block moved since it was read" })
        : JSON.stringify({ ok: true, message: `updated ${String(operation.input.title)}` });
    },
  });
  const batch = { ...PENDING, operations };
  await h.threadState.putProposal(batch);

  const outcome = await runTurn(
    request({ text: ":white_check_mark:", pending: batch }),
    h.deps,
  );

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(order, ["Calendar Sync hub", "Calendar Sync PRD", "Calendar Sync cut"]);
  assert.deepEqual(
    h.ran.map((o) => o.ok),
    [true, false, true],
  );
  // Both outcomes are reported — a partial result is visible, not hidden behind
  // the operation that worked.
  const message = batchResultMessage(h.ran) ?? "";
  assert.match(message, /2 done, 1 failed/);
  assert.match(message, /the block moved since it was read/);
  assert.match(message, /updated Calendar Sync hub/);
  assert.match(message, /updated Calendar Sync cut/);
});

test("a tool call that is missing what it needs asks instead of staging", async () => {
  // Two replies because the model gets one go at fixing the call itself: the
  // first refusal goes back to it as the call's result, and it is the SECOND
  // refusal that the person hears.
  const h = harness({
    replies: [
      { toolCalls: [{ name: "component_implement", args: { component: "Button" } }] },
      { toolCalls: [{ name: "component_implement", args: { component: "Button" } }] },
    ],
    preflightAsk: "Which PRD is this implementing?",
  });
  const outcome = await runTurn(request({ text: "implement the Button change" }), h.deps);

  assert.equal(outcome.disposition, "asked");
  assert.equal(outcome.posted, "Which PRD is this implementing?");
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 0);
  assert.equal(await h.threadState.getProposalByThread(REF), null);
});

test("a refusal the model can fix never reaches the person — the corrected call is staged", async () => {
  const h = harness({
    replies: [
      { toolCalls: [{ name: "notion_create", args: { surface: "decision", title: "[TBD]" } }] },
      {
        toolCalls: [
          { name: "notion_create", args: { surface: "decision", title: "Calendar Sync scope cut" } },
        ],
      },
    ],
    preflightFor: (_tool, input) =>
      input.title === "[TBD]"
        ? "I won't file that decision record yet — the *title* is still a placeholder (`[TBD]`)."
        : null,
  });

  const outcome = await runTurn(request({ text: "record the scope cut" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(outcome.staged?.proposal.input, {
    surface: "decision",
    title: "Calendar Sync scope cut",
  });
  // The person saw a card, not the bot arguing with itself.
  assert.deepEqual(
    postsOf(h.delivery).filter((p) => p.includes("placeholder")),
    [],
  );
});

test("the same proposal re-staged while one is pending is read as the confirmation", async () => {
  // The 2026-07-10 shape: the person said "go ahead", and the model reached for
  // the tool again instead of `proposal_resolve`.
  const h = harness({
    replies: [
      {
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });
  await stage(h);
  const outcome = await runTurn(
    request({ text: "go ahead and do that please", pending: PENDING }),
    h.deps,
  );

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved, [
    {
      toolName: "notion_create",
      decision: "confirm",
      narrative: DEFAULT_CONFIRM_POST,
      executed: true,
    },
  ]);
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 0);
});

// ── the effects a turn has along the way ─────────────────────────────────────

test("a channel turn acknowledges with 👀; the assistant surface says it is working instead", async () => {
  const channelTurn = harness();
  await runTurn(request(), channelTurn.deps);
  assert.deepEqual(
    channelTurn.delivery.calls.filter((c) => c.kind === "react"),
    [{ kind: "react", emoji: "eyes" }],
  );

  const panelTurn = harness();
  await runTurn(request({ surface: "assistant", threaded: false }), panelTurn.deps);
  assert.equal(panelTurn.delivery.calls.filter((c) => c.kind === "react").length, 0);
  const working = panelTurn.delivery.calls.find((c) => c.kind === "working");
  assert.equal(working?.status, "is thinking…");
  // A thread this turn opened is the one it may name.
  assert.equal(working?.titleFrom, "how does a call-off reach a fill-in?");
});

test("a trivial turn skips the working signals and the progress surface", async () => {
  const h = harness({ replies: [{ text: "Anytime." }] });
  // `chill` is the short-reply-to-a-proposal route: the one turn shape routing
  // can be sure is cheap.
  const outcome = await runTurn(request({ text: "thanks!", pending: PENDING }), h.deps);

  assert.equal(outcome.telemetry.tier, "chill");
  assert.equal(outcome.telemetry.trivial, true);
  assert.equal(h.delivery.calls.filter((c) => c.kind === "beginProgress").length, 0);
  // And nothing is cleared: the exit funnel takes down what the turn RAISED,
  // so a turn that raised nothing leaves the surface alone.
  assert.deepEqual(workingSignalOf(h.delivery), []);
});

/** The working signal's whole life in one turn, in order. */
const workingSignalOf = (delivery: RecordingDelivery): string[] =>
  delivery.calls
    .filter((c) => c.kind === "working" || c.kind === "working-clear")
    .map((c) => c.kind);

// Every door the turn can leave by, and what the person's surface says after it.
//
// The incident this pins: a channel thread that showed "is working…" through a
// reply, a pending card and a finished gate run, because the set had nine exits
// and the clear had one — in another file, gated to DMs. So the assertion is
// not "a clear happens somewhere" but the whole sequence, set then clear and
// nothing else, on both surfaces. A door added later that skips it fails here.
const EXITS: Array<{
  door: string;
  run: (surface: "channel" | "assistant") => Promise<{ h: Harness; outcome: TurnOutcome }>;
}> = [
  {
    door: "an answer",
    run: async (surface) => {
      const h = harness();
      return { h, outcome: await runTurn(request({ surface }), h.deps) };
    },
  },
  {
    door: "a clarifying ask",
    run: async (surface) => {
      const h = harness({
        replies: [{ toolCalls: [{ name: "component_implement", args: { component: "Button" } }] }],
        preflightAsk: "Which PRD is this implementing?",
      });
      return {
        h,
        outcome: await runTurn(request({ surface, text: "implement the Button change" }), h.deps),
      };
    },
  },
  {
    door: "a staged proposal",
    run: async (surface) => {
      const h = harness({
        replies: [
          {
            text: "I'll file a Roadmap card.",
            toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
          },
        ],
      });
      return {
        h,
        outcome: await runTurn(
          request({ surface, text: "file a card for the reflection redesign" }),
          h.deps,
        ),
      };
    },
  },
  {
    door: "a card Slack refused",
    run: async (surface) => {
      const h = harness({
        delivery: recordingDelivery({ stagingFails: true }),
        replies: [
          { toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }] },
        ],
      });
      return {
        h,
        outcome: await runTurn(
          request({ surface, text: "file a card for the reflection redesign" }),
          h.deps,
        ),
      };
    },
  },
  {
    door: "a reply Slack never accepted",
    run: async (surface) => {
      const h = harness({ delivery: recordingDelivery({ answerFails: true }) });
      return { h, outcome: await runTurn(request({ surface }), h.deps) };
    },
  },
  {
    door: "a resolution the model decided",
    run: async (surface) => {
      const h = harness({
        replies: [
          {
            toolCalls: [
              {
                name: "proposal_resolve",
                args: { decision: "confirm", message_to_user: "Filing it now." },
              },
            ],
          },
        ],
      });
      await stage(h);
      return {
        h,
        outcome: await runTurn(
          request({
            surface,
            text: "that all looks right to me, please go ahead and file the card",
            pending: PENDING,
          }),
          h.deps,
        ),
      };
    },
  },
  {
    door: "a reaction and no words",
    run: async (surface) => {
      const h = harness({
        replies: [{ toolCalls: [{ name: "slack_react", args: { emoji: "pray" } }] }, { text: "" }],
      });
      return {
        h,
        outcome: await runTurn(request({ surface, text: "thanks, that helps a lot" }), h.deps),
      };
    },
  },
  {
    door: "a dead model",
    run: async (surface) => {
      const h = harness();
      const broken: TurnDeps = {
        ...h.deps,
        async runAgent() {
          throw new Error("vertex 429: resource exhausted");
        },
      };
      return { h, outcome: await runTurn(request({ surface }), broken) };
    },
  },
];

for (const exit of EXITS) {
  for (const surface of ["channel", "assistant"] as const) {
    test(`the working signal is down after ${exit.door} (${surface})`, async () => {
      const { h, outcome } = await exit.run(surface);
      assert.ok(outcome.disposition, "the turn produced an outcome");
      assert.deepEqual(workingSignalOf(h.delivery), ["working", "working-clear"]);
    });
  }
}

test("a typed gate emoji resolves before anything is raised, so there is nothing to clear", async () => {
  // The one exit above the working signals: a message that is only ✅ never
  // reaches the model, so the indicator is never raised — and a clear with no
  // set would be a second signal saying nothing.
  const h = harness();
  await stage(h);
  const outcome = await runTurn(request({ text: "✅", pending: PENDING }), h.deps);

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(workingSignalOf(h.delivery), []);
});

test("the model's narration between lookups reaches the person as interim", async () => {
  const h = harness({
    replies: [
      { text: "Checking the blueprint for call-offs.", toolCalls: [{ name: "search_blueprint" }] },
      { text: "A call-off opens the slot a fill-in claims." },
    ],
  });
  const outcome = await runTurn(request(), h.deps);

  assert.deepEqual(
    h.delivery.calls.filter((c) => c.kind === "interim").map((c) => c.text),
    ["Checking the blueprint for call-offs."],
  );
  assert.equal(outcome.telemetry.interim, 1);
  assert.deepEqual(h.executed, ["search_blueprint"]);
});

test("a model failure is a visible failure, and the progress surface is closed as one", async () => {
  const h = harness();
  const broken: TurnDeps = {
    ...h.deps,
    async runAgent() {
      throw new Error("vertex 429: resource exhausted");
    },
  };
  const outcome = await runTurn(request(), broken);

  assert.equal(outcome.disposition, "failed");
  assert.deepEqual(outcome.failure, { stage: "agent" });
  assert.deepEqual(
    h.delivery.calls.filter((c) => c.kind === "endProgress"),
    [{ kind: "endProgress", outcome: "error" }],
  );
  const failure = h.delivery.calls.find((c) => c.kind === "failure");
  assert.equal(failure?.stage, "agent");
  assert.match(failure?.message ?? "", /429/);
  // Nothing is remembered from a turn that never produced a reply.
  assert.deepEqual(await h.threadState.readHistory(REF), []);
});

test("a reaction and no words is a finished turn", async () => {
  const h = harness({
    replies: [{ toolCalls: [{ name: "slack_react", args: { emoji: "pray" } }] }, { text: "" }],
  });
  const outcome = await runTurn(request({ text: "thanks, that helps" }), h.deps);

  assert.equal(outcome.disposition, "reacted");
  assert.deepEqual(postsOf(h.delivery), []);
  // It posts no answer, so nothing else would close the progress surface — an
  // open one is a plan stream still ticking over a finished turn.
  assert.deepEqual(
    h.delivery.calls.filter((c) => c.kind === "endProgress"),
    [{ kind: "endProgress", outcome: "complete" }],
  );
  const stored = await h.threadState.readHistory(REF);
  assert.equal(stored[1]!.content, "(reacted — no reply)");
});

test("the scope hint and the correction directive land after the question, never before it", async () => {
  const h = harness({
    history: undefined,
    replies: [{ text: "Re-checked: the path is Call-Off → Fill-In." }],
  } as never);
  const history: HistoryTurn[] = [
    { role: "user", content: "does a call-off notify anyone?", ts: "1700000000.000180" },
    { role: "assistant", content: "No, nothing is notified.", ts: "1700000000.000190" },
  ];
  await runTurn(
    request({
      text: "no, that's wrong — check again",
      scopeInstruction: "start in the service blueprint",
      history,
    }),
    h.deps,
  );

  const sent = h.provider.started?.conversation.at(-1)?.text ?? "";
  const question = sent.indexOf("no, that's wrong");
  const scope = sent.indexOf("SCOPE —");
  const directive = sent.indexOf("CORRECTING your previous reply");
  assert.ok(question === 0, "the question opens the block");
  assert.ok(scope > question, "the scope hint follows it");
  assert.ok(directive > scope, "and the correction directive after that");
});
