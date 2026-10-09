// What uno-bot says in the thread once a write has landed: one plain sentence,
// no emoji shortcode, no block counts. Each test drives a tool end to end
// against stubbed HTTP and reads the line Slack was asked to post.
//
// HOW THE FETCH IS INJECTED. `net.ts` captures the real `fetch` at module
// evaluation (ADR-022), so the stub goes onto `globalThis` here, once, and
// every tool is imported lazily inside its test (`notion-write.test.ts` has the
// full account).
import { test } from "node:test";
import assert from "node:assert/strict";

type Reply = { status?: number; body: unknown };
let routes: Record<string, Reply> = {};
let posted: string[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  if (url.includes("slack.com/api/chat.postMessage")) {
    const body = typeof init?.body === "string" ? (JSON.parse(init.body) as { text?: string }) : {};
    posted.push(body.text ?? "");
    return Response.json({ ok: true, ts: "1700000000.000100" });
  }
  const key = Object.keys(routes).find((k) => {
    const [m, suffix] = k.split(" ");
    return m === method && url.includes(suffix!);
  });
  if (!key) throw new Error(`no stub route for ${method} ${url}`);
  const reply = routes[key]!;
  return Response.json(reply.body, { status: reply.status ?? 200 });
}) as typeof fetch;

function serve(next: Record<string, Reply>): void {
  routes = next;
  posted = [];
}

const ENV = { NOTION_API_KEY: "ntn_test", SLACK_BOT_TOKEN: "xoxb-test" } as unknown as import("../src/types").Env;
const SLACK = { channel: "C1", threadTs: "1700000000.000001" } as import("../src/types").SlackContext;

const PAGE = "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";
const PAGE_URL = `https://www.notion.so/Card-${PAGE}`;
const BLOCK = "1f2e3d4c-5b6a-7980-1234-56789abcdef0";
const READ_STAMP = "2026-09-15T14:02:00.000Z";

/** A shortcode such as `:pencil2:` or `:white_check_mark:`. */
const SHORTCODE = /:[a-z0-9_+-]+:/;

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

  assert.equal(posted.length, 1);
  assert.doesNotMatch(posted[0]!, SHORTCODE);
  assert.equal(posted[0], "Archived Tutor import, which stays recoverable from Notion's trash.");
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
  serve({ "POST /pages": { body: { id: created, url: `https://www.notion.so/Tutor-import-${created}` } } });
  const { executeNotionCreate } = await import("../src/tools/notion-create.js");

  await executeNotionCreate(
    { ...ENV, NOTION_ROADMAP_DB_ID: "roadmap" } as typeof ENV,
    { surface: "prd", title: "Tutor import" },
    SLACK,
  );

  assert.equal(posted.length, 1);
  assert.doesNotMatch(posted[0]!, SHORTCODE);
  assert.match(posted[0]!, /^Created <https:\/\/www\.notion\.so\/[^|]+\|Tutor import> in Design HQ → Product \(Roadmap\)\.$/);
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
