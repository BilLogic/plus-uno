// Which endpoint a request lands on, with the key only, the service account
// only, and both set (ADR-053). The credential predicate is tested on its own
// in gemini-credential-precedence.test.ts; this drives the wire: the URL and
// auth header embedText and the generateContent call actually use.
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import type { Env } from "../src/types";

interface Call {
  url: string;
  headers: Record<string, string>;
}
const calls: Call[] = [];
// Installed before the modules load: `net.ts` captures fetch at import.
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  calls.push({ url, headers: Object.fromEntries(new Headers(init?.headers).entries()) });
  if (url.includes("oauth2.googleapis.com")) {
    return Response.json({ access_token: "sa-token", expires_in: 3600 });
  }
  if (url.includes(":predict")) {
    return Response.json({ predictions: [{ embeddings: { values: [1, 2, 3] } }] });
  }
  if (url.includes(":embedContent")) return Response.json({ embedding: { values: [4, 5, 6] } });
  return Response.json({ candidates: [{ content: { parts: [{ text: "ok" }] } }] });
}) as typeof fetch;

const pem = generateKeyPairSync("rsa", { modulusLength: 2048 })
  .privateKey.export({ type: "pkcs8", format: "pem" })
  .toString();
const SA = {
  GEMINI_SA_EMAIL: "bot@example.iam.gserviceaccount.com",
  GEMINI_SA_PRIVATE_KEY: pem,
  GEMINI_PROJECT_ID: "a-project",
};
const KEY = { GEMINI_API_KEY: "a-key" };
const env = (...parts: object[]) => Object.assign({}, ...parts) as unknown as Env;

const quiet = console.warn;
console.warn = () => {};
process.on("exit", () => (console.warn = quiet));

const embed = async (e: Env, override?: string) => {
  calls.length = 0;
  const { embedText } = await import("../src/vertex/embed.js");
  const vector = await embedText(e, "hello", "RETRIEVAL_QUERY", override);
  return { vector, last: calls[calls.length - 1] };
};
const generate = async (e: Env) => {
  calls.length = 0;
  const { geminiGenerate } = await import("../src/gemini/client.js");
  await geminiGenerate(e, { prompt: "hi", model: "m" });
  return calls[calls.length - 1];
};

test("embeddings: the key alone goes to the Gemini API with the key header", async () => {
  const { vector, last } = await embed(env(KEY));
  assert.deepEqual(vector, [4, 5, 6]);
  assert.match(last?.url ?? "", /generativelanguage\.googleapis\.com\/.*gemini-embedding-001:embedContent/);
  assert.equal(last?.headers["x-goog-api-key"], "a-key");
});

test("embeddings: the service account alone goes to Vertex", async () => {
  const { vector, last } = await embed(env(SA));
  assert.deepEqual(vector, [1, 2, 3]);
  assert.match(last?.url ?? "", /us-central1-aiplatform\.googleapis\.com\/.*text-embedding-005:predict/);
  assert.equal(last?.headers.authorization, "Bearer sa-token");
});

test("embeddings: both set goes to the Gemini API, and never mints a token", async () => {
  const { vector, last } = await embed(env(SA, KEY));
  assert.deepEqual(vector, [4, 5, 6]);
  assert.match(last?.url ?? "", /generativelanguage\.googleapis\.com/);
  assert.ok(!calls.some((c) => c.url.includes("oauth2.googleapis.com")));
});

test("embeddings: an override naming the Vertex-only model uses the service account even with a key", async () => {
  const { vector, last } = await embed(env(SA, KEY), "text-embedding-005");
  assert.deepEqual(vector, [1, 2, 3]);
  assert.match(last?.url ?? "", /aiplatform\.googleapis\.com\/.*text-embedding-005:predict/);
});

test("embeddings: that override with no service account has nowhere to go", async () => {
  const { vector } = await embed(env(KEY), "text-embedding-005");
  assert.equal(vector, null);
  assert.equal(calls.length, 0);
});

test("generation: the key alone, the service account alone, and both", async () => {
  assert.match((await generate(env(KEY)))?.url ?? "", /generativelanguage\.googleapis\.com\/v1beta\/models\/m:generateContent/);
  assert.match((await generate(env(SA)))?.url ?? "", /aiplatform\.googleapis\.com\/v1\/projects\/a-project\/.*models\/m:generateContent/);
  const both = await generate(env(SA, KEY));
  assert.match(both?.url ?? "", /generativelanguage\.googleapis\.com/);
  assert.equal(both?.headers["x-goog-api-key"], "a-key");
});
