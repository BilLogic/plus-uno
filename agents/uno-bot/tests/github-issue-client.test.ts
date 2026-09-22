// The requests that would reach GitHub, over a stubbed fetch: the create a
// GitHub intake files, the search the duplicate check runs before it, the
// file read and code search `github_read` sends, and the comment, state and
// label calls of an issue follow-up — each on the repo the resolver handed it.
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
let queued: Array<typeof reply> = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  calls.push({
    url: String(input),
    method: (init?.method ?? "GET").toUpperCase(),
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null,
  });
  // One reply per call from `queued` while it lasts, then `reply`.
  const answer = queued.shift() ?? reply;
  return new Response(JSON.stringify(answer.body), {
    status: answer.status,
    headers: { "content-type": "application/json", ...answer.headers },
  });
}) as typeof fetch;

const REPO = "BilLogic/plus-uno";
const SITE = "BilLogic/plus-marketing-website";
const LABELS = ["harness-intake", "needs-triage"] as const;

type Env = import("../src/types").Env;
const ENV = {
  GITHUB_TOKEN: "ghp_test",
  GITHUB_REPO: REPO,
  GITHUB_REPOS: JSON.stringify([
    { repo: REPO, purpose: "uno-bot and the harness", workflows: [] },
    { repo: SITE, purpose: "the public marketing site", workflows: [] },
  ]),
} as Env;

/** A listed repo, the one way the integration takes a repo. */
async function listed(requested?: string) {
  const { resolveRepoFor } = await import("../src/integrations/github.js");
  const target = resolveRepoFor(ENV, requested);
  assert.ok(target.ok, JSON.stringify(target));
  return target.entry;
}

async function client() {
  const { githubIssueClient } = await import("../src/integrations/github.js");
  return githubIssueClient(ENV, await listed());
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
  const github = githubIssueSearch(ENV);
  const target = await listed();
  return {
    searchOpenIssues: (label: string, terms: string) => github.searchOpenIssues(target, label, terms),
  };
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

test("the search reads the listed repo it is handed", async () => {
  const { githubIssueSearch } = await import("../src/integrations/github.js");
  calls = [];
  reply = { status: 200, body: { items: [] } };
  await githubIssueSearch(ENV).searchOpenIssues(await listed(SITE), "harness-intake", "hero image");

  const q = new URL(calls[0]!.url).searchParams.get("q")!.split(" ");
  assert.ok(q.includes(`repo:${SITE}`), q.join(" "));
  assert.ok(!q.includes(`repo:${REPO}`), q.join(" "));
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

// ── github_read's two requests, on a listed repo ─────────────────────────────

test("a file read GETs that repo's contents endpoint, and decodes the file", async () => {
  const { githubReadPath } = await import("../src/integrations/github.js");
  calls = [];
  reply = { status: 200, body: { content: btoa('{"name":"plus-marketing-website"}'), encoding: "base64" } };
  const read = await githubReadPath(ENV, await listed(SITE), "/package.json", "main");

  assert.deepEqual(read, { path: "package.json", kind: "file", text: '{"name":"plus-marketing-website"}', truncated: false });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.method, "GET");
  assert.equal(calls[0]!.url, `https://api.github.com/repos/${SITE}/contents/package.json?ref=main`);
  assert.equal(calls[0]!.headers.authorization, "Bearer ghp_test");
});

test("a read with no repo named goes to the default repo", async () => {
  const { githubReadPath } = await import("../src/integrations/github.js");
  calls = [];
  reply = { status: 200, body: [{ name: "src", type: "dir" }, { name: "README.md", type: "file" }] };
  const read = await githubReadPath(ENV, await listed(), "agents/uno-bot");

  assert.deepEqual(read, { path: "agents/uno-bot", kind: "dir", entries: ["src/", "README.md"] });
  assert.equal(calls[0]!.url, `https://api.github.com/repos/${REPO}/contents/agents/uno-bot`);
});

test("a code search carries the listed repo's qualifier, and no scope qualifier of the model's", async () => {
  const { githubSearchCode } = await import("../src/integrations/github.js");
  calls = [];
  reply = {
    status: 200,
    body: { items: [{ path: "src/pages/index.astro", html_url: `https://github.com/${SITE}/blob/main/src/pages/index.astro` }] },
  };
  const hits = await githubSearchCode(ENV, await listed(SITE), "hero repo:someone/else org:other -user:x path:src");

  assert.deepEqual(hits, [{ path: "src/pages/index.astro", url: `https://github.com/${SITE}/blob/main/src/pages/index.astro` }]);
  const url = new URL(calls[0]!.url);
  assert.equal(url.origin + url.pathname, "https://api.github.com/search/code");
  assert.deepEqual(url.searchParams.get("q")!.split(" ").sort(), ["hero", "path:src", `repo:${SITE}`].sort());
});

test("grouping, quotes and boolean operators cannot carry a scope qualifier past the filter", async () => {
  const { codeSearchTerms } = await import("../src/integrations/github.js");
  assert.equal(codeSearchTerms("hero (repo:other/x)"), "hero");
  assert.equal(codeSearchTerms("hero OR org:y"), "hero");
  assert.equal(codeSearchTerms('"hero" AND (user:z OR path:src)'), "hero path:src");
});

// ── github_issue_update's requests, on a listed repo ─────────────────────────

async function updater(requested?: string) {
  const { githubIssueUpdateClient } = await import("../src/integrations/github.js");
  return githubIssueUpdateClient(ENV, await listed(requested));
}

test("a comment POSTs the body to the issue's comments endpoint, and answers its link", async () => {
  calls = [];
  reply = { status: 201, body: { html_url: `https://github.com/${SITE}/issues/12#issuecomment-9` } };
  const posted = await (await updater(SITE)).comment(12, "text\n\n---\nPosted from Slack by uno-bot on behalf of Bill Guo.");

  assert.deepEqual(posted, { url: `https://github.com/${SITE}/issues/12#issuecomment-9` });
  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(call.method, "POST");
  assert.equal(call.url, `https://api.github.com/repos/${SITE}/issues/12/comments`);
  assert.equal(call.headers.authorization, "Bearer ghp_test");
  assert.deepEqual(call.body, { body: "text\n\n---\nPosted from Slack by uno-bot on behalf of Bill Guo." });
});

test("a close PATCHes the issue with its state and reason; a reopen says reopened", async () => {
  const github = await updater();
  for (const [state, reason] of [["closed", "not_planned"], ["open", "reopened"]] as const) {
    calls = [];
    reply = { status: 200, body: { number: 688 } };
    await github.setState(688, state, reason);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.method, "PATCH");
    assert.equal(calls[0]!.url, `https://api.github.com/repos/${REPO}/issues/688`);
    assert.deepEqual(calls[0]!.body, { state, state_reason: reason });
  }
});

test("labels are added with a POST of the list, and removed one DELETE each", async () => {
  const github = await updater();
  calls = [];
  reply = { status: 200, body: [] };
  await github.addLabels(688, ["bug", "good first issue"]);
  await github.removeLabel(688, "good first issue");

  assert.deepEqual(
    calls.map((c) => [c.method, c.url, c.body]),
    [
      ["POST", `https://api.github.com/repos/${REPO}/issues/688/labels`, { labels: ["bug", "good first issue"] }],
      ["DELETE", `https://api.github.com/repos/${REPO}/issues/688/labels/good%20first%20issue`, null],
    ],
  );
});

test("the repo's labels are read page by page, then kept, so the next ask costs no read", async () => {
  const { githubIssueUpdateClient } = await import("../src/integrations/github.js");
  const target = await listed(SITE);
  calls = [];
  const full = Array.from({ length: 100 }, (_, i) => ({ name: `label-${i}` }));
  queued = [
    { status: 200, body: full },
    { status: 200, body: [{ name: "bug" }] },
  ];
  const names = await githubIssueUpdateClient(ENV, target).labels();

  assert.equal(names.length, 101);
  assert.ok(names.includes("bug"));
  assert.deepEqual(
    calls.map((c) => c.url),
    [
      `https://api.github.com/repos/${SITE}/labels?per_page=100&page=1`,
      `https://api.github.com/repos/${SITE}/labels?per_page=100&page=2`,
    ],
  );

  calls = [];
  assert.deepEqual(await githubIssueUpdateClient(ENV, target).labels(), names);
  assert.equal(calls.length, 0, "a second client on the same repo reads the kept list");
});

for (const status of [403, 404, 422]) {
  test(`an update refused with ${status} is an error carrying the status`, async () => {
    const { GithubRequestError } = await import("../src/integrations/github.js");
    reply = { status, body: { message: "no" } };
    await assert.rejects(
      (await updater()).comment(688, "x"),
      (err) => err instanceof GithubRequestError && err.status === status,
    );
  });
}
