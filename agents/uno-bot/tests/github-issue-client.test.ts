// The requests that would reach GitHub, over a stubbed fetch: the create a
// GitHub intake files, and the search the duplicate check runs before it.
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
let reply: { status: number; body: unknown; headers?: Record<string, string> } = { status: 201, body: {} };

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  calls.push({
    url: String(input),
    method: (init?.method ?? "GET").toUpperCase(),
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null,
  });
  return new Response(JSON.stringify(reply.body), {
    status: reply.status,
    headers: { "content-type": "application/json", ...reply.headers },
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

// ── the duplicate check's search, on the same integration ────────────────────

async function search() {
  const { githubIssueSearch } = await import("../src/integrations/github.js");
  const env = { GITHUB_TOKEN: "ghp_test", GITHUB_REPO: REPO } as Parameters<typeof githubIssueSearch>[0];
  return githubIssueSearch(env);
}

test("the search GETs open issues on the configured repo, carrying the label and the keywords", async () => {
  calls = [];
  reply = {
    status: 200,
    body: {
      items: [
        {
          number: 702,
          title: "uno-bot says it can't open GitHub issues",
          html_url: "https://github.com/BilLogic/plus-uno/issues/702",
          updated_at: "2026-09-21T18:40:00Z",
          labels: [{ name: "harness-intake" }],
        },
      ],
    },
  };
  const found = await (await search()).searchOpenIssues("harness-intake", "github issue");

  assert.deepEqual(found, [
    {
      number: 702,
      title: "uno-bot says it can't open GitHub issues",
      url: "https://github.com/BilLogic/plus-uno/issues/702",
      updated: "2026-09-21T18:40:00Z",
    },
  ]);
  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(call.method, "GET");
  assert.equal(call.headers.authorization, "Bearer ghp_test");
  const url = new URL(call.url);
  assert.equal(url.origin + url.pathname, "https://api.github.com/search/issues");
  const q = url.searchParams.get("q")!.split(" ");
  for (const part of [`repo:${REPO}`, "is:issue", "is:open", "label:harness-intake", "github", "issue"]) {
    assert.ok(q.includes(part), `${part} missing from ${q.join(" ")}`);
  }
  // The search mode is named, not left to GitHub's default, which is changing.
  assert.equal(url.searchParams.get("advanced_search"), "true");
});

test("the search names the repo it reads", async () => {
  assert.equal((await search()).repo, REPO);
});

test("a search hit without a number, title or link is dropped rather than cited", async () => {
  reply = {
    status: 200,
    body: {
      items: [
        { number: 1, title: "no link" },
        { title: "no number", html_url: "https://github.com/x/y/issues/2" },
        { number: 3, title: "kept", html_url: "https://github.com/x/y/issues/3" },
      ],
    },
  };
  const found = await (await search()).searchOpenIssues("harness-intake", "anything");
  assert.deepEqual(
    found.map((i) => i.number),
    [3],
  );
});

test("the search turns a refusal into an error carrying GitHub's status", async () => {
  const { GithubRequestError } = await import("../src/integrations/github.js");
  reply = { status: 422, body: { message: "Validation Failed" } };
  await assert.rejects(
    (await search()).searchOpenIssues("harness-intake", "anything"),
    (err) => err instanceof GithubRequestError && err.status === 422,
  );
});

for (const status of [403, 429]) {
  test(`a ${status} with the rate limit spent is a rate-limit error, not a permissions one`, async () => {
    const { GithubRateLimitError } = await import("../src/integrations/github.js");
    reply = { status, body: { message: "API rate limit exceeded" }, headers: { "x-ratelimit-remaining": "0" } };
    await assert.rejects(
      (await search()).searchOpenIssues("harness-intake", "anything"),
      (err) => err instanceof GithubRateLimitError && err.status === status,
    );
  });
}

test("a 403 with rate limit to spare stays a plain refusal", async () => {
  const { GithubRateLimitError, GithubRequestError } = await import("../src/integrations/github.js");
  reply = { status: 403, body: {}, headers: { "x-ratelimit-remaining": "12" } };
  await assert.rejects(
    (await search()).searchOpenIssues("harness-intake", "anything"),
    (err) => err instanceof GithubRequestError && !(err instanceof GithubRateLimitError),
  );
});
