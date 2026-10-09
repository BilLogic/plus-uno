// What uno-bot says in the thread once a write has landed: one plain sentence,
// no emoji shortcode, no block counts. The exact sentences are pinned here, and
// only here: each test drives a tool end to end — the Notion and email tools
// against stubbed HTTP, the GitHub and relay tools through their own fake
// clients — and reads the line the thread was handed.
//
// The stub is `helpers/notion-fetch-stub.ts`: every tool is imported lazily
// inside its test so it evaluates against it.
import { test } from "node:test";
import assert from "node:assert/strict";

import { posted, serve } from "./helpers/notion-fetch-stub.js";
import { echoUpdatedField } from "../src/tools/notion-update.js";
import { fileGithubIssue } from "../src/tools/github-issue.js";
import { updateGithubIssue } from "../src/tools/github-issue-update.js";
import { runGithubWorkflow } from "../src/tools/github-workflow.js";
import { executeRelayDm } from "../src/tools/relay-dm.js";
import { parseRepoList, resolveRepo } from "../src/integrations/repo-list.mjs";

const ENV = { NOTION_API_KEY: "ntn_test", SLACK_BOT_TOKEN: "xoxb-test" } as unknown as import("../src/types").Env;
const SLACK = { channel: "C1", threadTs: "1700000000.000001" } as import("../src/types").SlackContext;

const PAGE = "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";
const PAGE_URL = `https://www.notion.so/Card-${PAGE}`;
const BLOCK = "1f2e3d4c-5b6a-7980-1234-56789abcdef0";
const READ_STAMP = "2026-09-15T14:02:00.000Z";

test("a Notion page rewrite is confirmed as one plain sentence, with no block count", async () => {
  serve({
    [`GET /blocks/${BLOCK}`]: {
      body: { id: BLOCK, last_edited_time: READ_STAMP, parent: { type: "page_id", page_id: PAGE } },
    },
    [`PATCH /blocks/${BLOCK}`]: { body: { id: BLOCK } },
  });
  const { executeNotionUpdate } = await import("../src/tools/notion-update.js");

  await executeNotionUpdate(
    ENV,
    { page_url: PAGE_URL, replace: [{ block_id: BLOCK, last_edited_time: READ_STAMP, content: "New TLDR." }] },
    SLACK,
  );

  assert.deepEqual(posted, ["Updated the Notion page."]);
});

test("archiving a card is confirmed as one plain sentence", async () => {
  serve({
    [`GET /pages/${PAGE}`]: {
      body: {
        id: PAGE,
        parent: { type: "database_id", database_id: "db" },
        properties: { Name: { type: "title", title: [{ plain_text: "Tutor import" }] } },
      },
    },
    [`PATCH /pages/${PAGE}`]: { body: { id: PAGE } },
  });
  const { executeNotionArchive } = await import("../src/tools/notion-archive.js");

  await executeNotionArchive(ENV, { page_url: PAGE_URL }, SLACK);

  assert.deepEqual(posted, ["Archived Tutor import, which stays recoverable from Notion's trash."]);
});

test("a property change names its new value in the same plain sentence", async () => {
  const card = "3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b";
  serve({
    [`GET /pages/${card}`]: {
      body: {
        id: card,
        parent: { type: "database_id", database_id: "db1" },
        properties: { Name: { type: "title", title: [{ plain_text: "A card" }] } },
      },
    },
    "GET /databases/db1": {
      body: {
        title: [{ plain_text: "Roadmap" }],
        properties: { "Design Status": { type: "status", status: { options: [{ name: "WIP" }] } } },
      },
    },
    [`PATCH /pages/${card}`]: { body: { id: card } },
  });
  const { executeNotionUpdate } = await import("../src/tools/notion-update.js");

  await executeNotionUpdate(
    ENV,
    { page_url: `https://www.notion.so/Card-${card}`, properties: { design_status: "WIP" } },
    SLACK,
  );

  assert.deepEqual(posted, ["Updated the Notion page: Design Status is now WIP."]);
});

test("creating a Notion page is confirmed as one plain sentence that links it", async () => {
  const created = "4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c";
  const url = `https://www.notion.so/Tutor-import-${created}`;
  serve({ "POST /pages": { body: { id: created, url } } });
  const { executeNotionCreate } = await import("../src/tools/notion-create.js");
  const { notionCreate } = await import("../src/integrations/notion.js");
  const env = { ...ENV, NOTION_ROADMAP_DB_ID: "roadmap" } as typeof ENV;
  // The destination's name is the module's own, read by doing the create once.
  const { label } = await notionCreate(env, "prd", { title: "Tutor import" });
  serve({ "POST /pages": { body: { id: created, url } } });

  await executeNotionCreate(env, { surface: "prd", title: "Tutor import" }, SLACK);

  assert.deepEqual(posted, [`Created <${url}|Tutor import> in ${label}.`]);
});

test("a sent email is confirmed as one plain sentence", async () => {
  serve({
    "POST oauth2.googleapis.com/token": { body: { access_token: "test-access" } },
    "POST /messages/send": { body: { id: "m1", threadId: "t1" } },
  });
  const { executeSendEmail } = await import("../src/tools/send-email.js");
  const gmail = { GMAIL_SENDER: "uno@example.com", GMAIL_CLIENT_ID: "id", GMAIL_CLIENT_SECRET: "s", GMAIL_REFRESH_TOKEN: "r" };

  await executeSendEmail(
    { ...ENV, ...gmail } as typeof ENV,
    { to: "coco@example.com", subject: "Session notes", body: "Here they are." },
    SLACK,
  );

  assert.deepEqual(posted, ['Sent "Session notes" to coco@example.com.']);
});

// ── a write that only partly landed ──────────────────────────────────────────

/** A database page whose schema has one settable status, "Design Status". */
function statusPage(card: string, extra: Record<string, { body: unknown }> = {}) {
  serve({
    [`GET /pages/${card}`]: {
      body: {
        id: card,
        parent: { type: "database_id", database_id: "db2" },
        properties: { Name: { type: "title", title: [{ plain_text: "A card" }] } },
      },
    },
    "GET /databases/db2": {
      body: {
        title: [{ plain_text: "Roadmap" }],
        properties: { "Design Status": { type: "status", status: { options: [{ name: "WIP" }] } } },
      },
    },
    [`PATCH /pages/${card}`]: { body: { id: card } },
    ...extra,
  });
}

test("a change that could not be set is named after what did land", async () => {
  const card = "5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d";
  statusPage(card);
  const { executeNotionUpdate } = await import("../src/tools/notion-update.js");

  await executeNotionUpdate(
    ENV,
    { page_url: `https://www.notion.so/Card-${card}`, properties: { design_status: "WIP", owner: "Bill" } },
    SLACK,
  );

  assert.deepEqual(posted, [
    "Updated the Notion page: Design Status is now WIP, except: couldn't set owner (no such property on this database).",
  ]);
});

test("a refused rewrite is named after the edit that did land", async () => {
  const card = "6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e";
  const moved = "2b3c4d5e-6f70-8192-a3b4-c5d6e7f80912";
  const later = "2026-09-15T16:40:00.000Z";
  statusPage(card, {
    [`GET /blocks/${moved}`]: {
      body: { id: moved, last_edited_time: later, parent: { type: "page_id", page_id: card } },
    },
  });
  const { executeNotionUpdate } = await import("../src/tools/notion-update.js");

  await executeNotionUpdate(
    ENV,
    {
      page_url: `https://www.notion.so/Card-${card}`,
      properties: { design_status: "WIP" },
      replace: [{ block_id: moved, last_edited_time: READ_STAMP, content: "A stale correction." }],
    },
    SLACK,
  );

  assert.equal(posted.length, 1);
  assert.ok(
    posted[0]!.startsWith("Updated the Notion page: Design Status is now WIP, except: refused 2b3c4d5e changed since read"),
    String(posted[0]),
  );
  assert.ok(posted[0]!.endsWith("."), String(posted[0]));
});

test("a property the input does not name a value for reads as set", () => {
  assert.equal(echoUpdatedField("Design Status", {}), "Design Status is set");
  assert.equal(echoUpdatedField("Design Status (created option)", {}), "Design Status is set (created option)");
});

// ── GitHub and the relay ─────────────────────────────────────────────────────

const UNO = "BilLogic/plus-uno";
const LIST = parseRepoList(JSON.stringify([{ repo: UNO, purpose: "the harness", workflows: ["gates.yml"] }]), UNO);

/** The thread half every GitHub write takes, recording what it is told. */
function thread() {
  const said: string[] = [];
  return {
    said,
    deps: {
      requesterName: async () => "Bill Guo",
      requestedPrivately: async () => true,
      threadPermalink: async () => null,
      postToThread: async (text: string) => {
        said.push(text);
      },
    },
  };
}

test("a filed issue is confirmed as one plain sentence", async () => {
  const { said, deps } = thread();
  const url = `https://github.com/${UNO}/issues/701`;

  await fileGithubIssue(
    { title: "Cards say ✅ twice", body: "b" },
    { ...deps, github: { repo: UNO, createIssue: async () => ({ number: 701, url }) } },
  );

  assert.deepEqual(said, [`Filed <${url}|#701 Cards say ✅ twice> on ${UNO} for triage.`]);
});

test("an issue update says what changed, in the past tense", async () => {
  const { said, deps } = thread();
  const quiet = async () => {};

  await updateGithubIssue(
    { issue_number: 688, comment: "why", add_labels: ["bug"], state: "closed_completed" },
    {
      ...deps,
      resolveRepo: (requested) => resolveRepo(LIST, requested),
      github: () => ({
        repo: UNO,
        labels: async () => ["bug"],
        comment: async () => ({ url: `https://github.com/${UNO}/issues/688#issuecomment-1` }),
        setState: quiet,
        addLabels: quiet,
        removeLabel: quiet,
      }),
    },
  );

  assert.deepEqual(said, [
    `Updated <https://github.com/${UNO}/issues/688|${UNO}#688>: commented, added label \`bug\`, closed as completed.`,
  ]);
});

test("a started workflow is confirmed as one plain sentence linking its runs", async () => {
  const { said, deps } = thread();

  await runGithubWorkflow(
    { repo: UNO, workflow: "gates.yml" },
    {
      postToThread: deps.postToThread,
      resolveRepo: (requested) => resolveRepo(LIST, requested),
      clientFor: () => ({ repo: UNO, defaultBranch: async () => "main", dispatchWorkflow: async () => {} }),
    },
  );

  assert.deepEqual(said, [`Started <https://github.com/${UNO}/actions/workflows/gates.yml|gates.yml> on ${UNO} at main.`]);
});

test("a relayed DM is confirmed in the requesting thread as one plain sentence", async () => {
  const thread: string[] = [];
  await executeRelayDm(
    {
      slack: {
        openDm: async (userId) => ({ ok: true, channel: `D-${userId}` }),
        postMessage: async (message) => {
          if (message.channel === "C1") thread.push(message.text);
          return { ok: true, ts: "1700000001.000001" };
        },
        permalink: async () => null,
      },
      memory: { remember: async () => {} },
    },
    { recipient: "U0COCO", text: "hi" },
    { ...SLACK, replyTs: SLACK.threadTs, requestedBy: "U0REQ1" },
  );

  assert.deepEqual(thread, ["Sent to <@U0COCO>."]);
});
