// One credential wins, deterministically: the Gemini API key whenever it is
// set, the Vertex service account only when it is not. Which auth and billing
// boundary served a request used to depend on which secrets happened to exist;
// the order is now fixed and the fallback says so out loud (ADR-053).
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Env } from "../src/types";
import { geminiConfigured } from "../src/gemini/client";
import { embedModelName } from "../src/vertex/embed-model";

const SA = {
  GEMINI_SA_EMAIL: "bot@example.iam.gserviceaccount.com",
  GEMINI_SA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----\n",
  GEMINI_PROJECT_ID: "a-project",
};
const KEY = { GEMINI_API_KEY: "a-key" };

/** Run `fn` and return what it logged through console.warn. */
function warnings<T>(fn: () => T): { result: T; warned: string[] } {
  const warned: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => void warned.push(args.join(" "));
  try {
    return { result: fn(), warned };
  } finally {
    console.warn = original;
  }
}

test("the API key alone is the api-key path, silently", () => {
  const { result, warned } = warnings(() => geminiConfigured(KEY as unknown as Env));
  assert.equal(result, "api-key");
  assert.deepEqual(warned, []);
});

test("both credentials set: the API key wins, and nothing warns", () => {
  const { result, warned } = warnings(() => geminiConfigured({ ...SA, ...KEY } as unknown as Env));
  assert.equal(result, "api-key");
  assert.deepEqual(warned, []);
});

test("the service account alone is the fallback, and it is loud", () => {
  const { result, warned } = warnings(() => geminiConfigured(SA as unknown as Env));
  assert.equal(result, "service-account");
  assert.equal(warned.length, 1);
  assert.match(warned[0] ?? "", /GEMINI_API_KEY/);
});

test("a half-configured service account is no credential at all", () => {
  const { result } = warnings(() =>
    geminiConfigured({ GEMINI_PROJECT_ID: "a-project" } as unknown as Env),
  );
  assert.equal(result, null);
});

test("embeddings follow the same order: key, then service account", () => {
  assert.equal(embedModelName(KEY), "gemini-embedding-001");
  assert.equal(embedModelName({ ...SA, ...KEY }), "gemini-embedding-001");
  assert.equal(embedModelName(SA), "text-embedding-005");
});
