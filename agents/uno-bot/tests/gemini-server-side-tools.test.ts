// Built-in tools beside function declarations, on the wire.
//
// Vertex takes googleSearch and urlContext next to the bot's own function
// declarations as is. The Gemini API (the API-key path, ADR-053) refuses the
// mix unless the request opts into tool context circulation with
// `toolConfig.includeServerSideToolInvocations`, and then the reply carries the
// server-side `toolCall` / `toolResponse` parts, which the next request must
// echo back. The GenAI SDKs document the flag as not supported on Vertex, so
// the service-account path never sends it.
//
// Driven against a stubbed fetch on the API-key path, like
// `tests/gemini-fallback.test.ts`; the Vertex side of the decision is the pure
// `geminiToolConfig`, since that path needs a signed service-account token.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Env } from "../src/types";

// Installed before the adapter loads: `net.ts` captures fetch at import.
let replies: unknown[] = [];
const sent: Array<Record<string, any>> = [];
globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body ?? "{}")));
  const reply = replies.shift() ?? OK;
  return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;
const adapter = async () => await import("../src/agent/providers/gemini.js");

const OK = {
  candidates: [{ content: { parts: [{ text: "an answer" }] } }],
  usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
};

/** Gemini 3 takes built-in tools; the 2.x backup does not. */
const KEY_ENV = { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-3-test" } as unknown as Env;
const KEY_ENV_2X = { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-pro" } as unknown as Env;

const TOOL = {
  name: "search_blueprint",
  description: "Search the blueprint.",
  input_schema: { type: "object", properties: { q: { type: "string" } } },
};

const quiet = { log: console.log, warn: console.warn };
console.log = () => {};
console.warn = () => {};
process.on("exit", () => Object.assign(console, quiet));

async function startedProvider(env: Env) {
  const provider = (await adapter()).geminiProvider(env);
  await provider.start({
    tier: "default",
    tools: [TOOL],
    system: [{ text: "harness", stable: true }],
    conversation: [{ role: "user", text: "sup" }],
  });
  return provider;
}

test("an API-key request with built-in tools opts into server-side tool invocations", async () => {
  sent.length = 0;
  const provider = await startedProvider(KEY_ENV);
  await provider.send({ toolsEnabled: true });
  const body = sent[0]!;
  assert.deepEqual(body.tools.slice(1), [{ googleSearch: {} }, { urlContext: {} }]);
  assert.deepEqual(body.toolConfig, { includeServerSideToolInvocations: true });
});

test("with tools disabled the flag and mode NONE share one toolConfig", async () => {
  sent.length = 0;
  const provider = await startedProvider(KEY_ENV);
  await provider.send({ toolsEnabled: false });
  assert.deepEqual(sent[0]!.toolConfig, {
    functionCallingConfig: { mode: "NONE" },
    includeServerSideToolInvocations: true,
  });
});

test("a model without built-in tools sends no flag", async () => {
  sent.length = 0;
  const provider = await startedProvider(KEY_ENV_2X);
  await provider.send({ toolsEnabled: true });
  assert.equal(sent[0]!.toolConfig, undefined);
});

test("the Vertex path never sends the flag", async () => {
  const { geminiToolConfig } = await adapter();
  const builtins = [{ googleSearch: {} }];
  assert.equal(geminiToolConfig({ toolsEnabled: true, builtins, path: "service-account" }), undefined);
  assert.deepEqual(geminiToolConfig({ toolsEnabled: false, builtins, path: "service-account" }), {
    functionCallingConfig: { mode: "NONE" },
  });
  assert.deepEqual(geminiToolConfig({ toolsEnabled: true, builtins, path: "api-key" }), {
    includeServerSideToolInvocations: true,
  });
  assert.equal(geminiToolConfig({ toolsEnabled: true, builtins: [], path: "api-key" }), undefined);
});

// A reply on the API-key path with tool context circulation on: a search the
// server already ran, then a call to one of the bot's own tools.
const SERVER_CALL = { toolCall: { toolType: "GOOGLE_SEARCH_WEB", id: "srv-1", args: { queries: ["plus"] } }, thoughtSignature: "sig-a" };
const SERVER_RESULT = { toolResponse: { toolType: "GOOGLE_SEARCH_WEB", id: "srv-1", response: { results: [] } } };
const LOCAL_CALL = { functionCall: { id: "fc-1", name: "search_blueprint", args: { q: "tutors" } }, thoughtSignature: "sig-b" };

test("server-side tool parts are neither text nor tool calls", async () => {
  sent.length = 0;
  replies = [{ candidates: [{ content: { parts: [SERVER_CALL, SERVER_RESULT, { text: "Looking." }, LOCAL_CALL] } }] }];
  const provider = await startedProvider(KEY_ENV);
  const reply = await provider.send({ toolsEnabled: true });
  assert.equal(reply.ok, true);
  assert.equal(reply.ok && reply.text, "Looking.");
  assert.deepEqual(reply.ok && reply.toolCalls.map((c) => c.name), ["search_blueprint"]);
  assert.equal(reply.ok && reply.stop, "tool");
});

test("the next request echoes the server-side parts and pairs the response by id", async () => {
  sent.length = 0;
  replies = [{ candidates: [{ content: { parts: [SERVER_CALL, SERVER_RESULT, LOCAL_CALL] } }] }, OK];
  const provider = await startedProvider(KEY_ENV);
  const first = await provider.send({ toolsEnabled: true });
  assert.equal(first.ok, true);
  const call = first.ok ? first.toolCalls[0]! : assert.fail("no reply");
  provider.recordToolResults([{ id: call.id, name: call.name, text: "three tutors" }]);
  await provider.send({ toolsEnabled: true });

  const history = sent[1]!.contents as Array<{ role: string; parts: unknown[] }>;
  assert.deepEqual(history.at(-2), { role: "model", parts: [SERVER_CALL, SERVER_RESULT, LOCAL_CALL] });
  assert.deepEqual(history.at(-1), {
    role: "user",
    parts: [{ functionResponse: { id: "fc-1", name: "search_blueprint", response: { result: "three tutors" } } }],
  });
});

test("a call without an id gets a response without one", async () => {
  sent.length = 0;
  replies = [{ candidates: [{ content: { parts: [{ functionCall: { name: "search_blueprint", args: {} } }] } }] }, OK];
  const provider = await startedProvider(KEY_ENV);
  const first = await provider.send({ toolsEnabled: true });
  const call = first.ok ? first.toolCalls[0]! : assert.fail("no reply");
  provider.recordToolResults([{ id: call.id, name: call.name, text: "none" }]);
  await provider.send({ toolsEnabled: true });
  const history = sent[1]!.contents as Array<{ role: string; parts: unknown[] }>;
  assert.deepEqual(history.at(-1)!.parts, [{ functionResponse: { name: "search_blueprint", response: { result: "none" } } }]);
});

test("a fallback to a model without built-in tools strips the server-side parts", async () => {
  sent.length = 0;
  replies = [{ candidates: [{ content: { parts: [SERVER_CALL, SERVER_RESULT, LOCAL_CALL] } }] }, OK];
  const env = { ...KEY_ENV, GEMINI_FALLBACK_MODEL: "gemini-2.5-pro" } as unknown as Env;
  const provider = await startedProvider(env);
  const first = await provider.send({ toolsEnabled: true });
  const call = first.ok ? first.toolCalls[0]! : assert.fail("no reply");
  provider.recordToolResults([{ id: call.id, name: call.name, text: "three tutors" }]);
  assert.equal(provider.fallback(429), true);
  await provider.send({ toolsEnabled: true });

  const body = sent[1]!;
  assert.equal(body.toolConfig, undefined);
  const history = body.contents as Array<{ role: string; parts: unknown[] }>;
  assert.deepEqual(history.at(-2), { role: "model", parts: [LOCAL_CALL] });
});
