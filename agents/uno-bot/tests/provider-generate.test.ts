// The one-shot `generate` on the ModelProvider seam — a prompt in, text out.
//
// This is the seam's second call, for the callers that want an answer and no
// tools: the draft judge, a probe, a one-line classification. A caller names a
// TIER and nothing else about the model, exactly as it does for a turn, so the
// tier's model and dials stay inside the adapter (ADR-028) and no caller above
// the seam ever spells a model id.
//
// The Gemini adapter is absent here for the reason it is absent from every unit
// suite: it names `Env` and the Workers type graph, which this Node build does
// not have. Its `generate` is covered by the typecheck and by the seam's shape.
import { test } from "node:test";
import assert from "node:assert/strict";

import { claudeProvider, CLAUDE_MODELS, type ClaudeTransport } from "../src/agent/providers/claude";
import { fakeProvider } from "../src/agent/providers/fake";

// ── the model table lives adapter-side ───────────────────────────────────────

test("the Claude model table maps every tier, and the adapter owns it", () => {
  assert.deepEqual(CLAUDE_MODELS, {
    chill: "claude-haiku-4-5@20251001",
    default: "claude-sonnet-5",
    grind: "claude-opus-4-8",
  });
});

// ── the Claude adapter's generate ────────────────────────────────────────────

/** A transport that records what it was sent and answers with one text block. */
function textTransport(text: string): {
  calls: Array<{ model: string; body: Record<string, unknown> }>;
  transport: ClaudeTransport;
} {
  const calls: Array<{ model: string; body: Record<string, unknown> }> = [];
  return {
    calls,
    transport: async (model, body) => {
      calls.push({ model, body });
      return { status: 200, data: { content: [{ type: "text", text }], stop_reason: "end_turn" } };
    },
  };
}

test("generate sends one prompt on the tier's model and returns the text", async () => {
  const t = textTransport("the reply");
  const provider = claudeProvider({ transport: t.transport });

  const result = await provider.generate({
    tier: "chill",
    system: "you are a judge",
    prompt: "score this draft",
    maxTokens: 1234,
  });

  assert.deepEqual(result, { ok: true, model: CLAUDE_MODELS.chill, text: "the reply" });
  assert.equal(t.calls.length, 1);
  const { model, body } = t.calls[0]!;
  assert.equal(model, CLAUDE_MODELS.chill);
  assert.equal(body.system, "you are a judge");
  assert.equal(body.max_tokens, 1234);
  assert.deepEqual(body.messages, [{ role: "user", content: "score this draft" }]);
  // NO TOOLS on a one-shot: the roster is the turn's business, not this call's.
  assert.equal(body.tools, undefined);
  assert.equal(body.thinking, undefined);
});

test("generate takes the pinned default model, like a turn does", async () => {
  const t = textTransport("ok");
  const provider = claudeProvider({
    transport: t.transport,
    defaultModel: "claude-sonnet-5@20260101",
  });

  const result = await provider.generate({ tier: "default", prompt: "hi" });

  assert.equal(result.ok && result.model, "claude-sonnet-5@20260101");
  assert.equal(t.calls[0]!.model, "claude-sonnet-5@20260101");
  // No system prompt means no `system` key at all, not an empty one.
  assert.equal(t.calls[0]!.body.system, undefined);
});

test("a generate failure is data, carrying the status in the message", async () => {
  const provider = claudeProvider({
    transport: async () => ({
      status: 429,
      data: { error: { message: "Resource exhausted" } },
    }),
  });

  const result = await provider.generate({ tier: "chill", prompt: "hi" });

  assert.equal(result.ok, false);
  assert.equal(result.model, CLAUDE_MODELS.chill);
  assert.match(!result.ok ? result.message : "", /429/);
  assert.match(!result.ok ? result.message : "", /Resource exhausted/);
});

test("generate does not disturb the turn the adapter is holding", async () => {
  const t = textTransport("aside");
  const provider = claudeProvider({ transport: t.transport });

  await provider.start({
    tier: "grind",
    conversation: [{ role: "user", text: "the real question" }],
    system: [{ text: "harness", stable: true }],
    tools: [{ name: "search_blueprint", description: "d", input_schema: {} }],
  });
  await provider.generate({ tier: "chill", prompt: "an aside" });
  await provider.send({ toolsEnabled: true });

  // The turn still runs on ITS tier's model with ITS roster: the one-shot
  // borrowed the transport and nothing else.
  assert.equal(provider.dials().model, CLAUDE_MODELS.grind);
  const turnBody = t.calls[1]!.body;
  assert.equal(t.calls[1]!.model, CLAUDE_MODELS.grind);
  assert.deepEqual(turnBody.messages, [{ role: "user", content: "the real question" }]);
  assert.equal((turnBody.tools as unknown[]).length, 2);
});

// ── the fake adapter's generate ──────────────────────────────────────────────

test("the fake replays canned replies and records what it was asked", async () => {
  const fake = fakeProvider({ generateReplies: ["first", "second"], model: "fake-judge" });

  assert.deepEqual(await fake.generate({ tier: "chill", system: "sys", prompt: "one" }), {
    ok: true,
    model: "fake-judge",
    text: "first",
  });
  assert.deepEqual(await fake.generate({ tier: "grind", prompt: "two" }), {
    ok: true,
    model: "fake-judge",
    text: "second",
  });

  assert.deepEqual(fake.generated, [
    { tier: "chill", system: "sys", prompt: "one" },
    { tier: "grind", prompt: "two" },
  ]);
});

test("the fake past the end of its script answers with empty text, not a hang", async () => {
  const fake = fakeProvider({});
  assert.deepEqual(await fake.generate({ tier: "default", prompt: "anything" }), {
    ok: true,
    model: "fake-1",
    text: "",
  });
});

test("the fake can be told its generate fails — the caller's fail-open path", async () => {
  const fake = fakeProvider({ generateFailMessage: "fake generate failure" });
  const result = await fake.generate({ tier: "chill", prompt: "hi" });
  assert.deepEqual(result, { ok: false, model: "fake-1", message: "fake generate failure" });
});
