// The POST that would reach GitHub, over a stubbed fetch.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` at the top of this file and the integration is imported lazily
// inside each test (the same seam as `notion-write.test.ts`). Nothing here
// touches the real API.
import { test } from "node:test";
import assert from "node:assert/strict";

interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}
let calls: FetchCall[] = [];
let reply: { status: number; body: unknown } = { status: 201, body: {} };

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  calls.push({
    url: String(input),
    method: (init?.method ?? "GET").toUpperCase(),
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null,
  });
  return new Response(JSON.stringify(reply.body), {
    status: reply.status,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

const REPO = "BilLogic/plus-uno";
const LABELS = ["harness-intake", "needs-triage"] as const;

async function client() {
  const { githubIssueClient } = await import("../src/integrations/github.js");
  const env = { GITHUB_TOKEN: "ghp_test", GITHUB_REPO: REPO } as Parameters<typeof githubIssueClient>[0];
  return githubIssueClient(env);
}

test("the client POSTs the issue to the configured repo's issues endpoint with the token", async () => {
  calls = [];
  reply = { status: 201, body: { number: 701, html_url: "https://github.com/BilLogic/plus-uno/issues/701" } };
  const created = await (await client()).createIssue({ title: "t", body: "b", labels: LABELS });

  assert.deepEqual(created, { number: 701, url: "https://github.com/BilLogic/plus-uno/issues/701" });
  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(call.method, "POST");
  assert.equal(call.url, `https://api.github.com/repos/${REPO}/issues`);
  assert.equal(call.headers.authorization, "Bearer ghp_test");
  assert.deepEqual(call.body, { title: "t", body: "b", labels: ["harness-intake", "needs-triage"] });
});

test("the client names the repo it files into", async () => {
  assert.equal((await client()).repo, REPO);
});

test("a success that names no issue is an error, never a link to #0", async () => {
  const { GithubRequestError } = await import("../src/integrations/github.js");
  for (const body of [{ html_url: "https://github.com/x/y/issues/1" }, { number: 1 }, {}]) {
    reply = { status: 201, body };
    await assert.rejects(
      (await client()).createIssue({ title: "t", body: "b", labels: LABELS }),
      (err) => err instanceof GithubRequestError && err.status === 201,
      JSON.stringify(body),
    );
  }
});

test("the client turns a refusal into an error carrying GitHub's status", async () => {
  const { GithubRequestError } = await import("../src/integrations/github.js");
  reply = { status: 403, body: { message: "Resource not accessible by personal access token" } };
  await assert.rejects(
    (await client()).createIssue({ title: "t", body: "b", labels: LABELS }),
    (err) => err instanceof GithubRequestError && err.status === 403,
  );
});
