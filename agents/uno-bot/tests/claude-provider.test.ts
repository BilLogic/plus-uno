// The Claude adapter, driven through the real loop with a stubbed transport.
//
// Every case here is the Anthropic wire format meeting the one agent loop: a
// scripted `rawPredict` goes in, an `AgentResult` comes out, and what is
// asserted is what the turn observably did — what came back, what the NEXT
// request carried, which tools ran.
//
// `/stop` is the acceptance test. It is the live defect #496 exists for: the
// second loop in `claude-agent.ts` never read the cancel flag, so a Claude turn
// could not be cancelled. Nothing in `providers/claude.ts` implements `/stop` —
// the loop does, once, for every adapter, which is the whole point.
//
// No network, no credential, no Cloudflare runtime: the adapter takes its
// transport as a port and the loop takes its three runtime dependencies as
// named ports.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLoop, type LoopBudget, type LoopDeps, type LoopInput } from "../src/agent/loop";
import { claudeProvider, type ClaudeTransport } from "../src/agent/providers/claude";
import type { PendingProposal, ThreadRef } from "../src/thread-state/index";

// ── harness ──────────────────────────────────────────────────────────────────

/** One scripted rawPredict response. */
interface WireReply {
  status?: number;
  content?: Array<Record<string, unknown>>;
  stop_reason?: string;
  error?: { message?: string };
  usage?: Record<string, number>;
}

interface Stub {
  /** Every body the adapter sent, in order — this is how a test sees the echo
   *  discipline: what the NEXT request carried after a tool round. */
  readonly bodies: Array<Record<string, unknown>>;
  readonly transport: ClaudeTransport;
}

/** A transport that replays `replies` in order. Past the end it answers with a
 *  plain end turn, so a loop that iterates further than the script cannot hang. */
function stub(replies: WireReply[]): Stub {
  const bodies: Array<Record<string, unknown>> = [];
  let cursor = 0;
  return {
    bodies,
    transport: async (_model, body) => {
      bodies.push(JSON.parse(JSON.stringify(body)) as Record<string, unknown>);
      const reply = replies[cursor++];
      if (!reply) {
        return {
          status: 200,
          data: { content: [{ type: "text", text: "(stub: out of script)" }], stop_reason: "end_turn" },
        };
      }
      const { status = 200, ...data } = reply;
      return { status, data };
    },
  };
}

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
  executed: string[];
  cancelReads: number;
  interim: string[];
  deps: LoopDeps;
}

function recorder(opts: { cancel?: boolean } = {}): Recorder {
  const rec: Recorder = {
    executed: [],
    cancelReads: 0,
    interim: [],
    deps: {
      async executeUngatedTool(name) {
        rec.executed.push(name);
        return JSON.stringify({ ok: true, rows: [] });
      },
      threadState: {
        async consumeCancel(_ref: ThreadRef) {
          rec.cancelReads++;
          return opts.cancel === true;
        },
      },
      budget: budgetStub(),
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
  transport: ClaudeTransport,
  rec: Recorder,
  over: Partial<LoopInput> = {},
): LoopInput {
  return {
    provider: claudeProvider({ transport }),
    deps: rec.deps,
    tier: "default",
    routeReason: "test",
    conversation: [{ role: "user", text: "what happens on a call-off?" }],
    system: [
      { text: "HARNESS", stable: true },
      { text: "sender U1", stable: false },
    ],
    tools: [{ name: "search_blueprint", description: "read the blueprint", input_schema: {} }],
    pending: null,
    currentSenderId: "U1",
    cancelKey: { channel: "C1", thread: "t1" },
    onInterim: (t) => rec.interim.push(t),
    ...over,
  };
}

/** A turn that asks for one ungated lookup. */
const LOOKUP: WireReply = {
  content: [
    { type: "text", text: "Let me read the call-off path in the blueprint first." },
    { type: "tool_use", id: "toolu_1", name: "search_blueprint", input: { query: "call-off" } },
  ],
  stop_reason: "tool_use",
};

// ── the acceptance test: `/stop` on Claude ───────────────────────────────────

test("a stop halts a Claude turn and runs no further tool", async () => {
  const rec = recorder({ cancel: true });
  // The flag is read at the top of every iteration, the first included, so a
  // press already standing when the turn starts is seen before the model is
  // called at all — and the four lookups the script had waiting never run.
  const s = stub([LOOKUP, LOOKUP, LOOKUP, LOOKUP]);

  const result = await runLoop(loopInput(s.transport, rec));

  // No text of its own: the door that took the press has already told the
  // thread who pressed and what it means (`slack/session-stop.ts`), and a
  // second line here would be the duplicate stop message of #589.
  assert.deepEqual(result, { kind: "stopped" });
  assert.deepEqual(rec.executed, []);
  assert.equal(rec.cancelReads, 1);
});

test("a Claude turn with no `/stop` pressed runs to its own end", async () => {
  const rec = recorder({ cancel: false });
  const s = stub([
    LOOKUP,
    LOOKUP,
    LOOKUP,
    { content: [{ type: "text", text: "A call-off frees the slot for a Fill-In." }], stop_reason: "end_turn" },
  ]);

  const result = await runLoop(loopInput(s.transport, rec));

  assert.deepEqual(result, { kind: "text", text: "A call-off frees the slot for a Fill-In." });
  assert.equal(rec.executed.length, 3);
});

// ── capacity failure, and the no-backup path ─────────────────────────────────

test("a 429 on Claude surfaces as a capacity failure — there is no backup model", async () => {
  const rec = recorder();
  const s = stub([{ status: 429, error: { message: "Resource exhausted" } }]);

  await assert.rejects(
    () => runLoop(loopInput(s.transport, rec)),
    (err: Error) => {
      assert.match(err.message, /vertex-claude 429/);
      assert.match(err.message, /Resource exhausted/);
      return true;
    },
  );

  // ONE attempt. `fallback` returns false, so the loop does not retry — the same
  // path a Gemini turn takes with GEMINI_FALLBACK_MODEL unset.
  assert.equal(s.bodies.length, 1);
});

test("fallback reports no backup for every status", () => {
  const provider = claudeProvider({ transport: async () => ({ status: 200, data: {} }) });
  for (const status of [404, 429, 500, 503]) {
    assert.equal(provider.fallback(status), false);
  }
});

// ── pause_turn is resumed inside the adapter ─────────────────────────────────

test("pause_turn resumes inside the adapter and the loop sees ONE reply", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [{ type: "server_tool_use", id: "srv_1", name: "web_search", input: { query: "x" } }],
      stop_reason: "pause_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    },
    {
      content: [{ type: "text", text: "Here is what the search turned up." }],
      stop_reason: "end_turn",
      usage: { input_tokens: 20, output_tokens: 7 },
    },
  ]);

  const result = await runLoop(loopInput(s.transport, rec));

  assert.deepEqual(result, { kind: "text", text: "Here is what the search turned up." });
  // TWO transport calls, ONE loop iteration: the resume happened below the seam.
  assert.equal(s.bodies.length, 2);
  // The paused content was echoed back verbatim as the assistant turn, which is
  // what makes the resume legal.
  const resumed = (s.bodies[1]!.messages as Array<{ role: string; content: unknown }>).at(-1)!;
  assert.equal(resumed.role, "assistant");
  assert.deepEqual(resumed.content, [
    { type: "server_tool_use", id: "srv_1", name: "web_search", input: { query: "x" } },
  ]);
  // No interim narration: the paused turn carried no text.
  assert.deepEqual(rec.interim, []);
});

test("usage accumulates across a paused turn's round-trips", async () => {
  const provider = claudeProvider({
    transport: stub([
      { content: [], stop_reason: "pause_turn", usage: { input_tokens: 10, output_tokens: 5 } },
      {
        content: [{ type: "text", text: "done" }],
        stop_reason: "end_turn",
        usage: {
          input_tokens: 20,
          output_tokens: 7,
          cache_read_input_tokens: 900,
          cache_creation_input_tokens: 3,
        },
      },
    ]).transport,
  });

  await provider.start({
    tier: "default",
    conversation: [{ role: "user", text: "hi" }],
    system: [{ text: "HARNESS", stable: true }],
    tools: [],
  });
  const reply = await provider.send({ toolsEnabled: true });

  assert.equal(reply.ok, true);
  assert.deepEqual(provider.usage(), {
    // 10 + (20 + 3 cache creation, which is billed as input)
    inputTokens: 33,
    outputTokens: 12,
    // Not reported separately by this API — inside output_tokens.
    thinkingTokens: 0,
    cachedInputTokens: 900,
  });
});

// ── the echo discipline: every tool_use gets a tool_result ───────────────────

test("every tool_use in a rejected proposal_resolve turn gets a tool_result block", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [
        { type: "text", text: "Confirming that for you." },
        // Rejected: `pending` is null below, so there is nothing to resolve.
        { type: "tool_use", id: "toolu_resolve", name: "proposal_resolve", input: { decision: "confirm" } },
        { type: "tool_use", id: "toolu_read", name: "search_blueprint", input: { query: "call-off" } },
      ],
      stop_reason: "tool_use",
    },
    { content: [{ type: "text", text: "Nothing was pending — here is an answer instead." }], stop_reason: "end_turn" },
  ]);

  const result = await runLoop(loopInput(s.transport, rec, { pending: null }));

  assert.deepEqual(result, {
    kind: "text",
    text: "Nothing was pending — here is an answer instead.",
  });

  const messages = s.bodies[1]!.messages as Array<{ role: string; content: unknown }>;
  // The assistant turn goes back VERBATIM, then the results.
  const echoed = messages.at(-2)!;
  assert.equal(echoed.role, "assistant");
  assert.equal((echoed.content as Array<{ type: string }>).length, 3);

  const answers = messages.at(-1)!;
  assert.equal(answers.role, "user");
  const blocks = answers.content as Array<{
    type: string;
    tool_use_id: string;
    content: string;
    is_error?: boolean;
  }>;
  // BOTH ids answered. An orphaned tool_use 400s the next call outright.
  assert.deepEqual(
    blocks.map((b) => b.tool_use_id),
    ["toolu_resolve", "toolu_read"],
  );
  assert.ok(blocks.every((b) => b.type === "tool_result"));
  assert.equal(blocks[0]!.is_error, true);
  assert.match(blocks[0]!.content, /no pending proposal/);
  assert.match(blocks[1]!.content, /deferred/);
  // No lookup ran: the turn was a rejection, not a read.
  assert.deepEqual(rec.executed, []);
  // And the text beside a proposal_resolve call is NOT narrated to the user.
  assert.deepEqual(rec.interim, []);
});

test("an ungated tool round echoes the assistant turn then one tool_result per call", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [
        { type: "thinking", thinking: "…", signature: "sig" },
        { type: "text", text: "Let me read the call-off path in the blueprint first." },
        { type: "tool_use", id: "toolu_a", name: "search_blueprint", input: { query: "call-off" } },
        { type: "tool_use", id: "toolu_b", name: "search_blueprint", input: { query: "fill-in" } },
      ],
      stop_reason: "tool_use",
    },
    { content: [{ type: "text", text: "Both paths read." }], stop_reason: "end_turn" },
  ]);

  const result = await runLoop(loopInput(s.transport, rec));

  assert.deepEqual(result, { kind: "text", text: "Both paths read." });
  assert.deepEqual(rec.executed, ["search_blueprint", "search_blueprint"]);
  // THE narration rule, and it is the loop's: text ahead of ungated work is
  // posted. The old Claude loop narrated unconditionally; that difference is
  // gone by construction.
  assert.deepEqual(rec.interim, ["Let me read the call-off path in the blueprint first."]);

  const messages = s.bodies[1]!.messages as Array<{ role: string; content: unknown }>;
  const echoed = messages.at(-2)!;
  assert.equal(echoed.role, "assistant");
  // The thinking block survives the round untouched — a rewritten one
  // invalidates the turn.
  assert.deepEqual((echoed.content as Array<{ type: string }>)[0], {
    type: "thinking",
    thinking: "…",
    signature: "sig",
  });
  assert.deepEqual(
    (messages.at(-1)!.content as Array<{ tool_use_id: string }>).map((b) => b.tool_use_id),
    ["toolu_a", "toolu_b"],
  );
});

// ── narration is NOT emitted ahead of a side effect; the text is the preview ──

test("text beside a side-effect call becomes the proposal preview, not narration", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [
        { type: "text", text: "I'll file a Roadmap card for the reflection redesign." },
        { type: "tool_use", id: "toolu_c", name: "notion_create", input: { title: "Reflection redesign" } },
      ],
      stop_reason: "tool_use",
    },
  ]);

  const result = await runLoop(loopInput(s.transport, rec));

  assert.deepEqual(result, {
    kind: "proposal",
    operations: [{ toolName: "notion_create", input: { title: "Reflection redesign" } }],
    toolName: "notion_create",
    input: { title: "Reflection redesign" },
    previewText: "I'll file a Roadmap card for the reflection redesign.",
  });
  assert.deepEqual(rec.interim, []);
  // Staged, never executed: only the one model call was made.
  assert.equal(s.bodies.length, 1);
});

// ── the request the adapter actually builds ──────────────────────────────────

test("the stable system block is the only one carrying cache_control, and the roster gains web_search", async () => {
  const rec = recorder();
  const s = stub([{ content: [{ type: "text", text: "hi" }], stop_reason: "end_turn" }]);

  await runLoop(loopInput(s.transport, rec));

  const body = s.bodies[0]!;
  assert.deepEqual(body.system, [
    { type: "text", text: "HARNESS", cache_control: { type: "ephemeral", ttl: "1h" } },
    { type: "text", text: "sender U1" },
  ]);
  const names = (body.tools as Array<{ name: string }>).map((t) => t.name);
  assert.deepEqual(names, ["search_blueprint", "web_search"]);
  // The default tier takes extended thinking; `tool_choice` is absent while
  // tools are enabled.
  assert.deepEqual(body.thinking, { type: "enabled", budget_tokens: 6000 });
  assert.equal(body.tool_choice, undefined);
});

test("the chill tier skips extended thinking and reports no budget", async () => {
  const provider = claudeProvider({ transport: async () => ({ status: 200, data: {} }) });
  await provider.start({
    tier: "chill",
    conversation: [{ role: "user", text: "yes" }],
    system: [],
    tools: [],
  });
  assert.deepEqual(provider.dials(), {
    model: "claude-haiku-4-5@20251001",
    detail: { thinking: "off" },
  });
});

test("CLAUDE_MODEL pins the default tier's model", async () => {
  const provider = claudeProvider({
    transport: async () => ({ status: 200, data: {} }),
    defaultModel: "claude-sonnet-5@20260101",
  });
  await provider.start({
    tier: "default",
    conversation: [{ role: "user", text: "hi" }],
    system: [],
    tools: [],
  });
  assert.equal(provider.dials().model, "claude-sonnet-5@20260101");
  assert.equal(provider.dials().detail.thinking, "6000");
});

test("the synthesis pass forbids calls but keeps the roster declared", async () => {
  const s = stub([]);
  const provider = claudeProvider({ transport: s.transport });
  await provider.start({
    tier: "default",
    conversation: [{ role: "user", text: "hi" }],
    system: [],
    tools: [{ name: "search_blueprint", description: "d", input_schema: {} }],
  });
  provider.recordUserText("(system: tool budget exhausted …)");
  await provider.send({ toolsEnabled: false });

  // `tool_choice: none` is what forbids the call. The roster stays DECLARED:
  // the API rejects a history carrying tool_result blocks with no tools defined.
  assert.deepEqual(s.bodies[0]!.tool_choice, { type: "none" });
  assert.equal((s.bodies[0]!.tools as unknown[]).length, 2);
  assert.deepEqual((s.bodies[0]!.messages as Array<{ content: unknown }>).at(-1), {
    role: "user",
    content: "(system: tool budget exhausted …)",
  });
});

// ── the reply text ───────────────────────────────────────────────────────────

test("the final reply is the text AFTER the last non-text block, not the monologue", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [
        { type: "text", text: "working through the paths…" },
        { type: "server_tool_use", id: "srv_2", name: "web_search", input: {} },
        { type: "web_search_tool_result", tool_use_id: "srv_2", content: [] },
        { type: "text", text: "A call-off frees the slot for a Fill-In." },
      ],
      stop_reason: "end_turn",
    },
  ]);

  const result = await runLoop(loopInput(s.transport, rec));

  assert.deepEqual(result, { kind: "text", text: "A call-off frees the slot for a Fill-In." });
});

test("a tool_use turn with no client call reads as a finished reply", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [
        { type: "server_tool_use", id: "srv_3", name: "web_search", input: {} },
        { type: "text", text: "Nothing local to run — here is the answer." },
      ],
      stop_reason: "tool_use",
    },
  ]);

  const result = await runLoop(loopInput(s.transport, rec));

  assert.deepEqual(result, { kind: "text", text: "Nothing local to run — here is the answer." });
  assert.deepEqual(rec.executed, []);
});

// ── the conversation the adapter opens with ──────────────────────────────────

test("current-turn images ride as image blocks ahead of the text", async () => {
  const rec = recorder();
  const s = stub([{ content: [{ type: "text", text: "seen" }], stop_reason: "end_turn" }]);

  await runLoop(
    loopInput(s.transport, rec, {
      conversation: [
        { role: "user", text: "earlier" },
        { role: "assistant", text: "noted" },
        {
          role: "user",
          text: "what is wrong with this frame?",
          images: [{ media_type: "image/png", data: "AAAA" }],
        },
      ],
    }),
  );

  const messages = s.bodies[0]!.messages as Array<{ role: string; content: unknown }>;
  assert.deepEqual(messages[0], { role: "user", content: "earlier" });
  assert.deepEqual(messages[1], { role: "assistant", content: "noted" });
  assert.deepEqual(messages[2], {
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } },
      { type: "text", text: "what is wrong with this frame?" },
    ],
  });
});

test("resolving a pending proposal comes back as a resolved result", async () => {
  const rec = recorder();
  const s = stub([
    {
      content: [
        {
          type: "tool_use",
          id: "toolu_r",
          name: "proposal_resolve",
          input: { decision: "confirm", message_to_user: "Filed it." },
        },
      ],
      stop_reason: "tool_use",
    },
  ]);

  const result = await runLoop(loopInput(s.transport, rec, { pending: PENDING }));

  assert.deepEqual(result, {
    kind: "resolved",
    decision: "confirm",
    pending: PENDING,
    messageToUser: "Filed it.",
  });
});
