// The agent's one public entry, driven directly — the first test that does.
//
// `src/agent/run-agent.ts` had NO test of its own before #625. It is the
// Env-facing half of the loop by design (the adapter construction, the system
// prompt, the tool roster, the ungated dispatch, the per-turn scope), so the
// suites above and below it both go around: `tests/agent-loop.test.ts` drives
// `runLoop` on named ports, `tests/turn.test.ts` builds its own `LoopDeps`, and
// `tests/eval-adapter.test.ts` builds the real dependencies but never invokes
// the closure. The entry itself — one `await` away from a live model call —
// stays out of reach of a Node suite, and #625 did not change that.
//
// WHAT IS REACHABLE is `selectProvider`, and it is the part of this module
// worth pinning: it is the ONE place `MODEL_PROVIDER` is read (#605, ratcheted
// by `scripts/provider-read.test.mjs`), every caller that wants a model —
// including the pre-send draft judge, through `turn/env-deps.ts` — takes what
// it returns, and its DEGRADATION was documented in prose and asserted
// nowhere: vertex-claude without service-account credentials must cost the
// opt-in, not the turn.
//
// No credential appears below. `claudeVertexConfigured` reads whether the three
// service-account fields are non-empty and nothing else, so obviously-fake
// placeholders exercise both branches — and a real value in a fixture is how
// one ends up in a log.
import { test } from "node:test";
import assert from "node:assert/strict";

import { selectProvider } from "../src/agent/run-agent";
import type { Env } from "../src/types";

/** The three fields `claudeVertexConfigured` looks at, all placeholders. */
const SA_FIELDS = {
  GEMINI_SA_EMAIL: "not-a-real-account@example.invalid",
  GEMINI_SA_PRIVATE_KEY: "(placeholder — not a key)",
  GEMINI_PROJECT_ID: "example-project",
};

const env = (over: Partial<Env>): Env => over as Env;

test("no MODEL_PROVIDER is the Gemini lane — production's default", () => {
  assert.equal(selectProvider(env({})).name, "gemini");
  assert.equal(selectProvider(env({ MODEL_PROVIDER: "gemini" })).name, "gemini");
});

test("vertex-claude with its service account selects the Claude adapter, case-insensitively", () => {
  assert.equal(
    selectProvider(env({ MODEL_PROVIDER: "vertex-claude", ...SA_FIELDS })).name,
    "vertex-claude",
  );
  assert.equal(
    selectProvider(env({ MODEL_PROVIDER: "VERTEX-Claude", ...SA_FIELDS })).name,
    "vertex-claude",
  );
});

test("vertex-claude with no credentials degrades to Gemini — the flag costs the opt-in, not the turn", () => {
  assert.equal(selectProvider(env({ MODEL_PROVIDER: "vertex-claude" })).name, "gemini");
  // A partial service account is not a service account: two fields of three
  // cannot sign a request, so this is the same degradation and not a 401 per
  // turn.
  assert.equal(
    selectProvider(
      env({
        MODEL_PROVIDER: "vertex-claude",
        GEMINI_SA_EMAIL: SA_FIELDS.GEMINI_SA_EMAIL,
        GEMINI_PROJECT_ID: SA_FIELDS.GEMINI_PROJECT_ID,
      }),
    ).name,
    "gemini",
  );
});

test("a mis-set provider name is the Gemini lane, not a failed turn", () => {
  assert.equal(selectProvider(env({ MODEL_PROVIDER: "claude" })).name, "gemini");
  assert.equal(selectProvider(env({ MODEL_PROVIDER: "" })).name, "gemini");
});
