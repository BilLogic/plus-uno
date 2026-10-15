// The Gemini adapter's backup model, on the wire (#1228).
//
// A quota or capacity failure — Vertex's 429 RESOURCE_EXHAUSTED, a 503
// UNAVAILABLE / overloaded, a 500, a 404 for a model not served — fails over
// to `GEMINI_FALLBACK_MODEL`, on a turn (`send`, which the loop retries) and on
// a one-shot (`generate`, which every scheduled job's model call goes through).
// The loop's side of the retry is `tests/agent-loop.test.ts`'s. Driven against a stubbed fetch on the AI Studio key path, which needs no
// service-account token and builds the same request bodies.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Env } from "../src/types";

// Installed before the adapter loads: `net.ts` captures fetch at import, so
// the provider is imported below, after this stub is in place.
let route: typeof fetch = async () => new Response("{}", { status: 599 });
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => route(input, init)) as typeof fetch;
const geminiProvider = async (env: Env) => (await import("../src/agent/providers/gemini.js")).geminiProvider(env);

const ENV = {
  GEMINI_API_KEY: "test-key",
  GEMINI_MODEL: "gemini-main",
  GEMINI_FALLBACK_MODEL: "gemini-backup",
} as unknown as Env;

/** The status and body Vertex answers a capacity failure with, by status. */
const FAILURES: Record<number, { status: string; message: string }> = {
  429: { status: "RESOURCE_EXHAUSTED", message: "Resource has been exhausted (e.g. check quota)." },
  503: { status: "UNAVAILABLE", message: "The model is overloaded. Please try again later." },
  500: { status: "INTERNAL", message: "Internal error encountered." },
  404: { status: "NOT_FOUND", message: "Publisher model was not found." },
};

const OK = {
  candidates: [{ content: { parts: [{ text: "an answer" }] } }],
  usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
};

/** Stub fetch: each model answers from its own list of statuses, in turn. */
function stubGemini(byModel: Record<string, number[]>): string[] {
  const asked: string[] = [];
  route = (async (input: unknown) => {
    const url = String(input);
    const model = /models\/([^:]+):generateContent/.exec(url)?.[1] ?? "?";
    asked.push(model);
    const status = byModel[model]?.shift() ?? 200;
    const body = status === 200 ? OK : { error: { code: status, ...FAILURES[status] } };
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return asked;
}

const quiet = { warn: console.warn, log: console.log };
console.warn = () => {};
console.log = () => {};
process.on("exit", () => Object.assign(console, quiet));

for (const status of [429, 503, 500, 404]) {
  test(`a ${status} on a turn falls back to the backup model`, async () => {
    const asked = stubGemini({ "gemini-main": [status] });
    const provider = await geminiProvider(ENV);
    await provider.start({ tier: "default", tools: [], system: [{ text: "harness", stable: true }], conversation: [{ role: "user", text: "hi" }] });
    const first = await provider.send({ toolsEnabled: false });
    assert.equal(first.ok, false);
    assert.equal(!first.ok && first.status, status);
    // Vertex's own status word rides along, for the capacity test to read.
    assert.equal(!first.ok && first.code, FAILURES[status]!.status);
    assert.equal(provider.fallback(status), true);
    const second = await provider.send({ toolsEnabled: false });
    assert.equal(second.ok, true);
    assert.deepEqual(asked, ["gemini-main", "gemini-backup"]);
  });

  test(`a ${status} on a one-shot falls back to the backup model`, async () => {
    const asked = stubGemini({ "gemini-main": [status] });
    const res = await (await geminiProvider(ENV)).generate({ tier: "default", prompt: "hi" });
    assert.equal(res.ok, true);
    assert.equal(res.ok && res.text, "an answer");
    assert.equal(res.model, "gemini-backup");
    assert.deepEqual(asked, ["gemini-main", "gemini-backup"]);
  });
}

test("a 400 is not capacity: no backup, on a turn or a one-shot", async () => {
  const asked = stubGemini({ "gemini-main": [400] });
  const res = await (await geminiProvider(ENV)).generate({ tier: "default", prompt: "hi" });
  assert.equal(res.ok, false);
  assert.deepEqual(asked, ["gemini-main"]);
  assert.equal((await geminiProvider(ENV)).fallback(400), false);
});

test("a one-shot whose backup fails too reports the backup's failure", async () => {
  stubGemini({ "gemini-main": [429], "gemini-backup": [429] });
  const res = await (await geminiProvider(ENV)).generate({ tier: "default", prompt: "hi" });
  assert.equal(res.ok, false);
  assert.equal(res.model, "gemini-backup");
  assert.match(!res.ok ? res.message : "", /429/);
});
