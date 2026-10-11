// A turn's origin decides how much of the estates its tools may read (#903).
//
// An @uno ask in a Figma comment is answered in the file, which people outside
// the team can open, so a turn wired with the `figma` origin must read at
// public scope — Slack's public channels, Notion's team surfaces, public
// GitHub repos — an unmapped asker's at public facts alone, and a `slack` turn
// must keep its reach. Whatever a tool returns is what the answer, and so the
// reply, can carry: text a tool never returns cannot reach the file. This is
// the privacy guarantee, so it is driven through the wiring rather than at the
// tool alone: the Slack context `turn/env-deps.ts` builds for the agent run
// (`toolSlackContextFor`, what `buildTurnDeps` hands `runAgent`), into the
// agent run's own dispatch (`executeUngatedTool`) and the real tool bodies,
// with Slack's, Notion's and GitHub's APIs stubbed.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { TurnOrigin } from "../src/usage/index";

const PUBLIC = "CPUBLIC1";
const PRIVATE = "CPRIVATE1";
const SECRET = "salary bands for the tutor pilot";
const NOTES_DB = "3ee43141b0ce4517badccb52a7b97bdb";
const ROADMAP_DB = "11111111111111111111111111111111";
/** A 1:1 running note, and a Roadmap card. */
const PRIVATE_PAGE = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEAM_PAGE = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const PUBLIC_REPO = "BilLogic/plus-uno";
const PRIVATE_REPO = "BilLogic/plus-private";

/** Every Slack call sent, as `method body`. */
const sent: string[] = [];
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === "string" ? init.body : "";
  sent.push(`${url} ${body}`);
  if (url.includes("assistant.search.context")) {
    const types = new URLSearchParams(body).get("channel_types") ?? "";
    const hit = (channel: string, text: string) => ({
      channel_id: channel,
      channel_name: channel.toLowerCase(),
      permalink: `https://plus.slack.com/archives/${channel}/p1700000000000100`,
      content: text,
      message_ts: "1700000000.000100",
    });
    return Response.json({ ok: true, results: { messages: types.includes("private_channel") ? [hit(PRIVATE, SECRET)] : [hit(PUBLIC, "the progress bar ships hidden")] } });
  }
  if (url.includes("conversations.info")) {
    const channel = new URL(url).searchParams.get("channel");
    return Response.json({ ok: true, channel: { id: channel, is_private: channel === PRIVATE } });
  }
  if (url.includes("conversations.replies")) {
    return Response.json({ ok: true, messages: [{ user: "U1", ts: "1700000000.000100", text: SECRET }] });
  }
  if (url.includes("users.info") || url.includes("conversations.members")) {
    return Response.json({ ok: true, user: { id: "U9", real_name: "Qi", profile: { title: SECRET } }, members: ["U9"] });
  }
  const notionPage = /api\.notion\.com\/v1\/pages\/(\w+)/.exec(url)?.[1];
  if (notionPage) {
    const parent = notionPage === PRIVATE_PAGE ? NOTES_DB : ROADMAP_DB;
    const title = notionPage === PRIVATE_PAGE ? "Qi / Bill 1:1" : "Goal setting";
    return Response.json({ id: notionPage, parent: { type: "database_id", database_id: parent }, properties: { Name: { type: "title", title: [{ plain_text: title }] } } });
  }
  const notionBlocks = /api\.notion\.com\/v1\/blocks\/(\w+)\/children/.exec(url)?.[1];
  if (notionBlocks) {
    const text = notionBlocks === PRIVATE_PAGE ? SECRET : "the progress bar ships hidden";
    return Response.json({ results: [{ id: "blk1", type: "paragraph", last_edited_time: "2026-10-01T00:00:00.000Z", paragraph: { rich_text: [{ plain_text: text }] } }], has_more: false });
  }
  if (url.includes("api.notion.com/v1/search")) {
    const row = (id: string, db: string, title: string) => ({
      object: "page",
      id,
      url: `https://www.notion.so/${id}`,
      parent: { type: "database_id", database_id: db },
      properties: { Name: { type: "title", title: [{ plain_text: title }] } },
    });
    return Response.json({ results: [row(PRIVATE_PAGE, NOTES_DB, `Qi / Bill 1:1 — ${SECRET}`), row(TEAM_PAGE, ROADMAP_DB, "Goal setting")] });
  }
  const repo = /api\.github\.com\/repos\/([\w-]+\/[\w-]+)(\/contents\/.*)?$/.exec(url);
  if (repo) {
    if (repo[2]) return Response.json({ type: "file", path: "README.md", encoding: "base64", content: btoa(repo[1] === PRIVATE_REPO ? SECRET : "public readme") });
    return Response.json({ private: repo[1] === PRIVATE_REPO });
  }
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

/** A Worker with the stored workspace token and one allowlisted private channel. */
function env(): Env {
  const kv = new Map<string, string>([["slack_oauth_token", JSON.stringify({ access_token: "xoxp-legacy-test" })]]);
  return {
    SLACK_BOT_TOKEN: "xoxb-test",
    SLACK_MCP_CLIENT_ID: "id",
    SLACK_MCP_CLIENT_SECRET: "secret",
    SLACK_OAUTH_REDIRECT_URI: "https://worker.example/oauth/slack/callback",
    SLACK_OAUTH_KV: { get: async (k: string) => kv.get(k) ?? null, put: async () => {} } as unknown as KVNamespace,
    SLACK_SEARCH_PRIVATE_ALLOWLIST: PRIVATE,
    NOTION_API_KEY: "ntn_test",
    NOTION_RUNNING_NOTES_DB_ID: NOTES_DB,
    NOTION_ROADMAP_DB_ID: ROADMAP_DB,
    GITHUB_TOKEN: "ghp_test",
    GITHUB_REPO: PUBLIC_REPO,
    GITHUB_REPOS: JSON.stringify([
      { repo: PUBLIC_REPO, purpose: "the harness", workflows: [] },
      { repo: PRIVATE_REPO, purpose: "private work", workflows: [] },
    ]),
  } as unknown as Env;
}

/** Run one tool the way a turn with `origin` runs it, from the context the wiring builds. */
async function runTool(origin: TurnOrigin, name: string, input: Record<string, unknown>, opts: { unmappedAsker?: boolean } = {}): Promise<string> {
  const { toolSlackContextFor } = await import("../src/turn/env-deps.js");
  const { executeUngatedTool } = await import("../src/agent/run-agent.js");
  const { buildTurnRequest } = await import("../src/turn/index.js");
  const request = buildTurnRequest({
    userId: "U1",
    channel: "CDESIGN1",
    channelType: "channel",
    conversationTs: origin === "figma" ? "figma:FILEKEY1:100" : "1700000000.000200",
    userMsgTs: origin === "figma" ? "figma:100" : "1700000000.000200",
    threaded: true,
    text: "what did we decide about the tutor pilot?",
  });
  const slack = toolSlackContextFor(
    request,
    origin === "figma" ? { origin, ...(opts.unmappedAsker ? { unmappedAsker: true } : {}) } : { origin, toolThreadTs: "1700000000.000200" },
  );
  sent.length = 0;
  return executeUngatedTool(env(), name, input, slack);
}

describe("a turn wired with the figma origin reads Slack at public visibility only", () => {
  it("its slack_search runs no private pass, so an allowlisted private channel's hit never reaches it", async () => {
    const out = await runTool("figma", "slack_search", { query: "tutor pilot" });
    assert.doesNotMatch(out, new RegExp(`${SECRET}|${PRIVATE}`));
    assert.match(out, /the progress bar ships hidden/);
    assert.ok(sent.every((s) => !s.includes("private_channel")), sent.join("\n"));
  });

  it("its slack_thread_read refuses a thread in a private channel", async () => {
    const out = await runTool("figma", "slack_thread_read", { link: `https://plus.slack.com/archives/${PRIVATE}/p1700000000000100` });
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /only a public channel's thread/);
  });
});

describe("a turn wired with the figma origin reads Notion's team surfaces and public repos alone", () => {
  it("a private Notion page's text never reaches it, so it cannot reach the reply", async () => {
    const out = await runTool("figma", "source_read", { url: `https://www.notion.so/qi-bill-1-1-${PRIVATE_PAGE}` });
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /not on a team surface/);
  });

  it("a Roadmap card it reads in full", async () => {
    const out = await runTool("figma", "source_read", { url: `https://www.notion.so/goal-setting-${TEAM_PAGE}` });
    assert.match(out, /the progress bar ships hidden/);
  });

  it("a workspace search keeps only the team-surface hits", async () => {
    const out = JSON.parse(await runTool("figma", "notion_search", { query: "tutor pilot" })) as { results: Array<{ url: string }> };
    assert.deepEqual(out.results.map((r) => r.url), [`https://www.notion.so/${TEAM_PAGE}`]);
  });

  it("a catalog off the team surfaces is not searched", async () => {
    const out = await runTool("figma", "notion_search", { query: "pilot", scope: "running_notes" });
    assert.match(out, /'running_notes' scope is not a team surface/);
    assert.ok(sent.every((s) => !s.includes("api.notion.com")), sent.join("\n"));
  });

  it("a private repo is not read; a public one is", async () => {
    const hidden = await runTool("figma", "github_read", { repo: PRIVATE_REPO, path: "README.md" });
    assert.doesNotMatch(hidden, new RegExp(SECRET));
    assert.match(hidden, /that repo is private/);
    const open = await runTool("figma", "github_read", { repo: PUBLIC_REPO, path: "README.md" });
    assert.match(open, /public readme/);
  });

  it("Slack's people lookups and links are refused", async () => {
    for (const [name, input] of [
      ["slack_user_profile", { user: "U9" }],
      ["slack_channel_members", { channel: PRIVATE }],
      ["source_read", { url: `https://plus.slack.com/docs/T1/F0CANVAS1` }],
    ] as const) {
      const out = await runTool("figma", name, input);
      assert.doesNotMatch(out, new RegExp(SECRET), name);
      assert.match(out, /"ok":false/, name);
      assert.deepEqual(sent, [], `${name}: nothing was fetched`);
    }
  });
});

describe("a figma turn for an asker Team Members does not map reads public facts alone", () => {
  it("reads no Notion and no Slack at all, not even a team surface or a public channel", async () => {
    for (const [name, input] of [
      ["notion_search", { query: "goal setting" }],
      ["roadmap_query", {}],
      ["source_read", { url: `https://www.notion.so/goal-setting-${TEAM_PAGE}` }],
      ["slack_search", { query: "tutor pilot" }],
      ["search_blueprint", { query: "booking" }],
    ] as const) {
      const out = await runTool("figma", name, input, { unmappedAsker: true });
      assert.match(out, /"ok":false/, name);
      assert.deepEqual(sent, [], `${name}: nothing was fetched`);
    }
  });

  it("still reads a public repo", async () => {
    const out = await runTool("figma", "github_read", { repo: PUBLIC_REPO, path: "README.md" }, { unmappedAsker: true });
    assert.match(out, /public readme/);
  });
});

describe("a turn wired with the slack origin keeps its reach", () => {
  it("its slack_search still runs the allowlisted private pass", async () => {
    const out = await runTool("slack", "slack_search", { query: "tutor pilot" });
    assert.match(out, new RegExp(SECRET));
  });

  it("its slack_thread_read reads a private channel's thread the bot is in", async () => {
    const out = await runTool("slack", "slack_thread_read", { link: `https://plus.slack.com/archives/${PRIVATE}/p1700000000000100` });
    assert.match(out, new RegExp(SECRET));
  });
});

describe("a slack turn reads Notion and GitHub as before", () => {
  it("reads a running note and a private repo the integration can see", async () => {
    assert.match(await runTool("slack", "source_read", { url: `https://www.notion.so/qi-bill-1-1-${PRIVATE_PAGE}` }), new RegExp(SECRET));
    assert.match(await runTool("slack", "github_read", { repo: PRIVATE_REPO, path: "README.md" }), new RegExp(SECRET));
  });
});
