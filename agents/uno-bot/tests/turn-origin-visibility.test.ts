// A turn's origin decides how much of the estates its tools may read (#903).
//
// An @uno ask in a Figma comment is answered in the file, which people outside
// the team can open, so a turn wired with the `figma` origin must read at
// public scope — no Slack, Notion's team surfaces, public
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
import { describe, it, mock } from "node:test";
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
/** The Tutor Help Center's database, and a Tasks Tracker row that shares it. */
const HELP_DB = "22222222222222222222222222222222";
const TASK_PAGE = "dddddddddddddddddddddddddddddddd";
/** Repos GitHub currently reports private; a test may make one so. */
const privateRepos = new Set<string>(["BilLogic/plus-private"]);
/** A top-level workspace page whose title only reads as a spec. */
const SPOOF_PAGE = "cccccccccccccccccccccccccccccccc";
const PUBLIC_REPO = "BilLogic/plus-uno";
/** The file the comment sits on, and another file the same token can open. */
const ASKED_FILE = "FILEKEY1";
const OTHER_FILE = "OTHERKEY9";
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
  if (notionPage === SPOOF_PAGE) {
    return Response.json({ id: notionPage, parent: { type: "workspace", workspace: true }, properties: { title: { type: "title", title: [{ plain_text: "Salary spec" }] } } });
  }
  if (notionPage === TASK_PAGE) {
    // As Notion-Version 2022-06-28 reports a row of a multi-source database:
    // a `database_id` parent naming the database, the Tasks Tracker's own
    // title property beside the articles'.
    return Response.json({ id: notionPage, parent: { type: "database_id", database_id: HELP_DB }, properties: { "Task name": { type: "title", title: [{ plain_text: "Payroll fix" }] } } });
  }
  if (notionPage) {
    const parent = notionPage === PRIVATE_PAGE ? NOTES_DB : ROADMAP_DB;
    const title = notionPage === PRIVATE_PAGE ? "Qi / Bill 1:1" : "Goal setting";
    return Response.json({ id: notionPage, parent: { type: "database_id", database_id: parent }, properties: { Name: { type: "title", title: [{ plain_text: title }] } } });
  }
  if (url.includes("api.figma.com") && url.includes("/comments")) {
    return Response.json({ comments: [{ id: "c1", file_key: ASKED_FILE, parent_id: "", user: { id: "1", handle: "qi" }, created_at: "2026-10-01T00:00:00Z", resolved_at: null, message: SECRET, client_meta: { node_id: "1:2" } }] });
  }
  if (url.includes("api.figma.com") && url.includes("/nodes")) {
    return Response.json({
      name: "Goal Setting",
      nodes: { "1:2": { document: { id: "1:2", name: "Frame", type: "FRAME", children: [{ id: "1:3", name: "copy", type: "TEXT", characters: "the progress bar ships hidden" }] } } },
    });
  }
  const notionBlocks = /api\.notion\.com\/v1\/blocks\/(\w+)\/children/.exec(url)?.[1];
  if (notionBlocks) {
    const text = notionBlocks === PRIVATE_PAGE || notionBlocks === TASK_PAGE ? SECRET : "the progress bar ships hidden";
    return Response.json({ results: [{ id: "blk1", type: "paragraph", last_edited_time: "2026-10-01T00:00:00.000Z", paragraph: { rich_text: [{ plain_text: text }] } }], has_more: false });
  }
  if (url.includes("api.notion.com/v1/search")) {
    const row = (id: string, db: string, title: string, titleProp = "Name") => ({
      object: "page",
      id,
      url: `https://www.notion.so/${id}`,
      parent: { type: "database_id", database_id: db },
      properties: { [titleProp]: { type: "title", title: [{ plain_text: title }] } },
    });
    return Response.json({
      results: [row(PRIVATE_PAGE, NOTES_DB, `Qi / Bill 1:1 — ${SECRET}`), row(TEAM_PAGE, ROADMAP_DB, "Goal setting"), row(TASK_PAGE, HELP_DB, `Payroll fix — ${SECRET}`, "Task name")],
    });
  }
  const repo = /api\.github\.com\/repos\/([\w-]+\/[\w-]+)(\/contents\/.*)?$/.exec(url);
  if (repo) {
    if (repo[2]) return Response.json({ type: "file", path: "README.md", encoding: "base64", content: btoa(repo[1] === PRIVATE_REPO ? SECRET : "public readme") });
    return Response.json({ private: privateRepos.has(repo[1]!) });
  }
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

/** A Worker with the stored workspace token and one allowlisted private channel. */
function env(over: Partial<Record<string, string>> = {}): Env {
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
    NOTION_HELP_TUTORS_DB_ID: HELP_DB,
    GITHUB_TOKEN: "ghp_test",
    GITHUB_REPO: PUBLIC_REPO,
    GITHUB_REPOS: JSON.stringify([
      { repo: PUBLIC_REPO, purpose: "the harness", workflows: [] },
      { repo: PRIVATE_REPO, purpose: "private work", workflows: [] },
    ]),
    FIGMA_ACCESS_TOKEN: "figd_test",
    ...over,
  } as unknown as Env;
}

/** Run one tool the way a turn with `origin` runs it, from the context the wiring builds. */
async function runTool(
  origin: TurnOrigin,
  name: string,
  input: Record<string, unknown>,
  opts: { unmappedAsker?: boolean; env?: Partial<Record<string, string>> } = {},
): Promise<string> {
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
  const slack = toolSlackContextFor(request, wiringFor(origin, opts));
  sent.length = 0;
  return executeUngatedTool(env(opts.env), name, input, slack);
}

/** The wiring a turn of `origin` is built with: a Figma ask names the file its comment sits on. */
function wiringFor(origin: TurnOrigin, opts: { unmappedAsker?: boolean } = {}) {
  return origin === "figma"
    ? { origin, figmaFileKey: ASKED_FILE, ...(opts.unmappedAsker ? { unmappedAsker: true } : {}) }
    : { origin, toolThreadTs: "1700000000.000200" };
}

/** The tool names a turn of `origin` offers the model. */
async function offered(origin: TurnOrigin, opts: { unmappedAsker?: boolean } = {}): Promise<string[]> {
  const { toolSlackContextFor } = await import("../src/turn/env-deps.js");
  const { toolRosterFor } = await import("../src/agent/run-agent.js");
  const { buildTurnRequest } = await import("../src/turn/index.js");
  const request = buildTurnRequest({
    userId: "U1",
    channel: "CDESIGN1",
    channelType: "channel",
    conversationTs: "figma:FILEKEY1:100",
    userMsgTs: "figma:100",
    threaded: true,
    text: "what did we decide?",
  });
  return toolRosterFor(toolSlackContextFor(request, wiringFor(origin, opts))).map((t) => t.name);
}

describe("a turn wired with the figma origin reads no Slack at all", () => {
  for (const unmappedAsker of [false, true]) {
    const who = unmappedAsker ? "an unmapped asker" : "a mapped asker";
    it(`for ${who}, slack_search and slack_thread_read are refused, a public channel included`, async () => {
      for (const [name, input] of [
        ["slack_search", { query: "tutor pilot" }],
        ["slack_thread_read", { link: `https://plus.slack.com/archives/${PUBLIC}/p1700000000000100` }],
      ] as const) {
        const out = await runTool("figma", name, input, { unmappedAsker });
        assert.match(out, /"ok":false/, name);
        assert.doesNotMatch(out, /the progress bar ships hidden/, name);
        assert.deepEqual(sent, [], `${name}: nothing was fetched`);
      }
    });
  }
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

describe("a figma turn runs only the tools classified for public scope", () => {
  it("refuses the blueprint, a reminder and a Slack reaction, fetching nothing", async () => {
    for (const [name, input] of [
      ["search_blueprint", { query: "booking" }],
      ["reminder_set", { text: "check the pilot", when: "tomorrow" }],
      ["slack_react", { channel: PUBLIC, ts: "1700000000.000100", emoji: "eyes" }],
    ] as const) {
      const out = await runTool("figma", name, input);
      assert.match(out, /"ok":false/, name);
      assert.deepEqual(sent, [], `${name}: nothing was fetched`);
    }
  });

  it("queries the Roadmap for a mapped asker, whose cards are a team surface", async () => {
    await runTool("figma", "roadmap_query", { title: "goal setting" });
    assert.ok(sent.some((s) => s.includes("api.notion.com")), "the board was queried");
  });

  it("refuses the Roadmap when the board is not a configured team surface", async () => {
    const out = await runTool("figma", "roadmap_query", { title: "goal setting" }, { env: { NOTION_ROADMAP_DB_ID: "" } });
    assert.match(out, /"ok":false/);
    assert.deepEqual(sent, []);
  });

  it("refuses a tool no one has classified, without running it", async () => {
    const { runAtPublicScope, publicScopeDepsFor } = await import("../src/agent/public-scope.js");
    let ran = false;
    const out = await runAtPublicScope(
      "brand_new_tool" as never,
      {},
      { publicOnly: true },
      async () => {
        ran = true;
        return SECRET;
      },
      publicScopeDepsFor(env()),
    );
    assert.equal(ran, false);
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /"ok":false/);
  });
});

describe("a figma turn reads the file its comment sits on, and no other", () => {
  for (const unmappedAsker of [false, true]) {
    const who = unmappedAsker ? "an unmapped asker" : "a mapped asker";
    it(`for ${who}, another Figma file is refused unread`, async () => {
      const out = await runTool("figma", "source_read", { url: `https://www.figma.com/design/${OTHER_FILE}/Payroll?node-id=1-2` }, { unmappedAsker });
      assert.match(out, /"ok":false/);
      assert.deepEqual(sent, []);
    });

    it(`for ${who}, the asked file's frame is read without its comments`, async () => {
      const out = await runTool("figma", "source_read", { url: `https://www.figma.com/design/${ASKED_FILE}/Goal-Setting?node-id=1-2` }, { unmappedAsker });
      assert.match(out, /the progress bar ships hidden/);
      assert.doesNotMatch(out, new RegExp(SECRET));
      assert.ok(sent.every((s) => !s.includes("/comments")), sent.join("\n"));
    });
  }
});

describe("a figma turn's Notion reach", () => {
  it("refuses a private page on the app.notion.com host", async () => {
    const out = await runTool("figma", "source_read", { url: `https://app.notion.com/p/${PRIVATE_PAGE}` });
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /not on a team surface/);
  });

  it("refuses a Tasks Tracker row that shares the Help Center's database", async () => {
    const out = await runTool("figma", "source_read", { url: `https://www.notion.so/payroll-fix-${TASK_PAGE}` });
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /not on a team surface/);
  });

  it("refuses a top-level page whose title only reads as a spec", async () => {
    const out = await runTool("figma", "source_read", { url: `https://www.notion.so/salary-spec-${SPOOF_PAGE}` });
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /not on a team surface/);
  });
});

describe("a figma turn for an asker Team Members does not map reads public facts alone", () => {
  it("is offered no gated or write tool at all", async () => {
    const { TOOL_TABLE } = await import("../src/agent/tool-table.js");
    const names = await offered("figma", { unmappedAsker: true });
    assert.ok(names.length > 0);
    for (const name of names) {
      assert.equal(TOOL_TABLE[name as keyof typeof TOOL_TABLE].access, "ungated", name);
    }
    for (const write of ["notion_create", "notion_update", "github_issue_create", "component_implement", "reminder_set", "slack_react", "proposal_resolve"]) {
      assert.ok(!names.includes(write), write);
    }
  });

  it("while a mapped asker's figma turn is still offered the gated tools it may propose", async () => {
    const names = await offered("figma");
    for (const write of ["notion_create", "notion_update", "github_issue_create", "component_implement"]) assert.ok(names.includes(write), write);
  });

  it("is offered exactly the public read tools", async () => {
    const names = await offered("figma", { unmappedAsker: true });
    assert.deepEqual(names.sort(), ["github_intake_search", "github_read", "present", "read_reference", "source_read"]);
  });
});

describe("a figma turn is not offered a tool public scope always refuses", () => {
  const ALWAYS_REFUSED = ["search_blueprint", "reminder_set", "slack_search", "slack_thread_read", "slack_user_profile", "slack_channel_members", "slack_react"];

  for (const unmappedAsker of [false, true]) {
    it(`for ${unmappedAsker ? "an unmapped" : "a mapped"} asker`, async () => {
      const names = await offered("figma", { unmappedAsker });
      for (const name of ALWAYS_REFUSED) assert.ok(!names.includes(name), name);
    });
  }

  it("a mapped asker keeps the team reads", async () => {
    const names = await offered("figma");
    for (const name of ["notion_search", "roadmap_query", "source_read", "github_read"]) assert.ok(names.includes(name), name);
  });

  it("a Slack turn's roster is every tool with a schema, as before", async () => {
    const names = await offered("slack");
    const { readFileSync } = await import("node:fs");
    const defs = JSON.parse(readFileSync(`${process.cwd()}/tool-definitions.json`, "utf8")) as Array<{ name: string }>;
    assert.deepEqual(names, defs.map((t) => t.name));
  });

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

describe("a repo's visibility is asked again after a while", () => {
  it("a repo made private stops being read once the remembered answer is ten minutes old", async () => {
    const repo = "BilLogic/plus-soon-private";
    mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-11T12:00:00Z") });
    try {
      assert.match(await runTool("figma", "github_read", { repo, path: "README.md" }, { env: { GITHUB_REPOS: reposWith(repo) } }), /public readme/);
      privateRepos.add(repo);
      mock.timers.tick(11 * 60 * 1000);
      const out = await runTool("figma", "github_read", { repo, path: "README.md" }, { env: { GITHUB_REPOS: reposWith(repo) } });
      assert.match(out, /that repo is private/);
    } finally {
      mock.timers.reset();
      privateRepos.delete(repo);
    }
  });
});

/** The repo list with one more repo on it. */
function reposWith(repo: string): string {
  return JSON.stringify([
    { repo: PUBLIC_REPO, purpose: "the harness", workflows: [] },
    { repo, purpose: "a repo about to go private", workflows: [] },
  ]);
}

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
