// The requests a workflow run would send GitHub, over a stubbed fetch: the
// default-branch read (once per repo per isolate) and the dispatch itself, on
// the repo the resolver handed the client.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` at the top of this file and the integration is imported lazily
// inside each test, as `github-issue-client.test.ts` does. Nothing here touches
// the real API, and no workflow is dispatched.
import { test } from "node:test";
import assert from "node:assert/strict";

interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}
let calls: FetchCall[] = [];
let reply: { status: number; body: unknown } = { status: 204, body: null };

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  calls.push({
    url: String(input),
    method: (init?.method ?? "GET").toUpperCase(),
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null,
  });
  return reply.status === 204
    ? new Response(null, { status: 204 })
    : new Response(JSON.stringify(reply.body), { status: reply.status, headers: { "content-type": "application/json" } });
}) as typeof fetch;

const HARNESS = "BilLogic/plus-uno";
const BLUEPRINT = "BilLogic/plus-uno-blueprint";

type Env = import("../src/types").Env;
const ENV = {
  GITHUB_TOKEN: "ghp_test",
  GITHUB_REPO: HARNESS,
  GITHUB_REPOS: JSON.stringify([
    { repo: HARNESS, purpose: "uno-bot and the harness", workflows: [] },
    { repo: BLUEPRINT, purpose: "the service-blueprint app", workflows: ["render-walk.yml"] },
  ]),
} as Env;

async function client(requested: string) {
  const { githubWorkflowClient, resolveRepoFor } = await import("../src/integrations/github.js");
  const target = resolveRepoFor(ENV, requested);
  assert.ok(target.ok, JSON.stringify(target));
  return githubWorkflowClient(ENV, target.entry);
}

test("a dispatch POSTs the ref and the inputs to the workflow's dispatches endpoint with the token", async () => {
  calls = [];
  reply = { status: 204, body: null };
  await (await client("plus-uno-blueprint")).dispatchWorkflow("render-walk.yml", "main", { note: " x " });

  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(call.method, "POST");
  assert.equal(call.url, `https://api.github.com/repos/${BLUEPRINT}/actions/workflows/render-walk.yml/dispatches`);
  assert.equal(call.headers.authorization, "Bearer ghp_test");
  assert.deepEqual(call.body, { ref: "main", inputs: { note: " x " } });
});

test("a refused dispatch throws with GitHub's status, for the executor to name the cause", async () => {
  const { GithubRequestError } = await import("../src/integrations/github.js");
  calls = [];
  reply = { status: 403, body: { message: "Resource not accessible by personal access token" } };
  await assert.rejects(
    (await client(BLUEPRINT)).dispatchWorkflow("render-walk.yml", "main", {}),
    (err: unknown) => err instanceof GithubRequestError && err.status === 403,
  );
});

test("the default branch is read from the repo once, then kept", async () => {
  calls = [];
  reply = { status: 200, body: { default_branch: "trunk" } };
  const github = await client(BLUEPRINT);
  assert.equal(await github.defaultBranch(), "trunk");
  assert.equal(await (await client(BLUEPRINT)).defaultBranch(), "trunk");

  assert.equal(calls.length, 1, "one read per repo per isolate");
  assert.equal(calls[0]!.method, "GET");
  assert.equal(calls[0]!.url, `https://api.github.com/repos/${BLUEPRINT}`);
});

test("a repo read that names no default branch is an error, not a run at ''", async () => {
  calls = [];
  reply = { status: 200, body: {} };
  await assert.rejects((await client(HARNESS)).defaultBranch(), /default branch/);
});
