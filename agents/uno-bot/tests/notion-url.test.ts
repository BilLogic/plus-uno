// Every Notion link the bot hands on is one a teammate can open (#729).
//
// On 2026-09-25 a proposal card in Slack named its target as
// <https://app.notion.com/p/<slug>-<id>|<page title>>. That is the `url` the
// Notion API returns for a page now, and app.notion.com can 404 in an ordinary
// browser session; the same page at https://www.notion.so/<slug>-<id> opens.
// Six functions in integrations/notion.ts read a `url` off an API response, and
// each handed it on verbatim, into search results, roadmap rows, a created
// card's link and the card on every ✅ proposal.
//
// The same host broke the way in. source_read matched notion.so and notion.site
// only, so an app.notion.com link, which is now what teammates paste and what
// the bot's own earlier replies carry, went to the generic web fetch and never
// reached the Notion API. The model does make that call: the recorded runs in
// docs/evals/fixtures/recordings (S1, C1, M1) pass source_read an
// app.notion.com link.
//
// The PRD poll root had the same gap: figma-poll posts the created PRD's link,
// and `implement` reads the page id back out of it, so a root posted with an
// app.notion.com link gave no PRD at all.
//
// HOW THE FETCH IS INJECTED: the same seam notion-write.test.ts uses. `net.ts`
// binds `fetch` when it first evaluates, so the stub goes onto `globalThis`
// here and every module is imported lazily inside a test. Nothing here touches
// the real Notion API.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

type Reply = { status?: number; body: unknown };
type Routes = Record<string, Reply>;

let routes: Routes = {};
let calls: string[] = [];

// ONE dispatcher, installed once, for the reason notion-write.test.ts gives:
// `net.ts` keeps the fetch it saw first, so a later stub is never reached.
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  calls.push(`${method} ${url}`);
  const key = Object.keys(routes).find((k) => {
    const [m, fragment] = k.split(" ");
    return m === method && url.includes(fragment!);
  });
  if (!key) throw new Error(`no stub route for ${method} ${url}`);
  const reply = routes[key]!;
  return new Response(JSON.stringify(reply.body), {
    status: reply.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

function serve(next: Routes): void {
  routes = next;
  calls = [];
}

function notion(): Promise<typeof import("../src/integrations/notion")> {
  return import("../src/integrations/notion.js");
}

const ENV = {
  NOTION_API_KEY: "ntn_test",
  NOTION_ROADMAP_DB_ID: "roadmap-db",
  NOTION_APPS_DB_ID: "apps-db",
} as unknown as Env;

// A page shaped like the one on the thread's card.
const ID = "4a1b7cca-4982-8100-9b41-000000000729";
const APP_URL = "https://app.notion.com/p/Running-Notes-4a1b7cca498281009b41000000000729";
const OPENS = "https://www.notion.so/Running-Notes-4a1b7cca498281009b41000000000729";

const title = (text: string) => ({ type: "title", title: [{ plain_text: text }] });

test("an app.notion.com link becomes the notion.so link to the same page, and nothing else changes", async () => {
  const { canonicalNotionUrl } = await notion();
  const cases: [string | undefined, string | undefined, string][] = [
    // The link on the card in the thread.
    [APP_URL, undefined, OPENS],
    // A workspace segment, a database view and a block anchor all survive.
    [
      "https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f?v=397b7cca4982803893a8000c8fdd359c",
      undefined,
      "https://www.notion.so/plus-tutors/397b7cca49828002826cc45e2baa8e4f?v=397b7cca4982803893a8000c8fdd359c",
    ],
    [`${APP_URL}#1f2e3d4c5b6a79801234567890abcdef`, undefined, `${OPENS}#1f2e3d4c5b6a79801234567890abcdef`],
    // Only a `/p` SEGMENT goes; a path that merely starts with "p" is kept.
    [
      "https://app.notion.com/plus-tutors/397b7cca49828002826cc45e2baa8e4f",
      undefined,
      "https://www.notion.so/plus-tutors/397b7cca49828002826cc45e2baa8e4f",
    ],
    // Links that already open pass through byte for byte.
    [OPENS, undefined, OPENS],
    ["https://notion.so/onboarding-prd", undefined, "https://notion.so/onboarding-prd"],
    ["https://plus-tutors.notion.site/Help-397b7cca49828002826cc45e2baa8e4f", undefined, "https://plus-tutors.notion.site/Help-397b7cca49828002826cc45e2baa8e4f"],
    // No url from the API: the id alone is the link, as it was before.
    [undefined, ID, "https://www.notion.so/4a1b7cca498281009b41000000000729"],
    ["", ID, "https://www.notion.so/4a1b7cca498281009b41000000000729"],
    [undefined, undefined, ""],
  ];
  for (const [url, id, want] of cases) {
    assert.equal(canonicalNotionUrl(url, id), want, `canonicalNotionUrl(${url}, ${id})`);
  }
});

// Every API reply below carries the app.notion.com url, which is what Notion
// sends now. One row shape serves all three database readers: each takes the
// row's title property, and the apps reader names its title "Application Name".
const ROW = { object: "page", id: ID, url: APP_URL, archived: false, properties: { "Application Name": title("Running Notes") } };
const EVERY_READ: Routes = {
  "POST /v1/search": { body: { results: [ROW] } },
  "POST /query": { body: { results: [ROW], has_more: false, next_cursor: null } },
  "POST /v1/pages": { body: { id: ID, url: APP_URL } },
  "GET /v1/pages/": {
    body: { id: ID, url: APP_URL, parent: { type: "database_id", database_id: "running-notes-db" }, properties: { Name: title("Running Notes") } },
  },
  "GET /v1/databases/": { body: { title: [{ plain_text: "Design Running Notes" }] } },
};

type Notion = Awaited<ReturnType<typeof notion>>;
const PRODUCERS: [string, (n: Notion) => Promise<string | undefined>][] = [
  ["notionSearch (notion_search)", async (n) => (await n.notionSearch(ENV, "Running Notes"))[0]?.url],
  ["queryCatalogDatabase (notion_search catalogs)", async (n) => (await n.queryCatalogDatabase(ENV, "catalog-db")).rows[0]?.url],
  ["queryThirdPartyApps (notion_search apps)", async (n) => (await n.queryThirdPartyApps(ENV)).apps[0]?.url],
  ["queryRoadmapCards (roadmap_query)", async (n) => (await n.queryRoadmapCards(ENV)).rows[0]?.url],
  ["notionCreate (notion_create, figma-poll's PRD root)", async (n) => (await n.notionCreate(ENV, "prd", { title: "Running Notes" })).url],
  ["describeNotionTarget (the ✅ proposal card)", async (n) => (await n.describeNotionTarget(ENV, APP_URL))?.url],
];

for (const [name, read] of PRODUCERS) {
  test(`${name} hands on the notion.so link, not the API's app.notion.com one`, async () => {
    serve(EVERY_READ);
    assert.equal(await read(await notion()), OPENS);
  });
}

test("the proposal card from the thread names the page and links the one that opens", async () => {
  serve(EVERY_READ);
  const { buildNotionRevision } = await import("../src/slack/notion-card.js");

  const revision = await buildNotionRevision(ENV, { page_url: APP_URL });

  assert.deepEqual(revision.page, { url: OPENS, title: "Running Notes", parent: "Design Running Notes" });
});

test("when the page read fails, the card still links the page that opens", async () => {
  serve({ "GET /v1/pages/": { status: 404, body: { object: "error", code: "object_not_found" } } });
  const { buildNotionRevision } = await import("../src/slack/notion-card.js");

  const revision = await buildNotionRevision(ENV, { page_url: APP_URL });

  assert.deepEqual(revision.page, { url: OPENS });
});

test("source_read reads an app.notion.com link through the Notion API, not the generic web fetch", async () => {
  serve({
    "GET /v1/pages/": { body: { id: ID, properties: { Name: title("Running Notes") } } },
    "GET /v1/blocks/": {
      body: { results: [{ id: "b1", type: "paragraph", paragraph: { rich_text: [{ plain_text: "Sep 25 running notes" }] } }], has_more: false },
    },
  });
  const { executeReadSource } = await import("../src/tools/read-source.js");

  const r = JSON.parse(await executeReadSource(ENV, { url: APP_URL })) as Record<string, unknown>;

  assert.equal(r.ok, true);
  assert.equal(r.source_type, "notion");
  assert.equal(r.title, "Running Notes");
  // Cited as the link that opens, so the reply built on it carries that one.
  assert.equal(r.url, OPENS);
  assert.ok(calls.every((c) => c.includes("https://api.notion.com/v1/")), calls.join("\n"));
});

test("a PRD poll root posted with an app.notion.com link still yields the PRD", async () => {
  const { extractNotionPrdFromText } = await import("../src/slack/notion-prd.js");

  const root =
    ":clipboard: *PRD Created:* <https://app.notion.com/p/DS-Update-Tag-26bb7cca49828002a07ee3bd6c5bfc4c|DS Update: Tag>\n" +
    "Review the PRD, then reply `implement Tag` in this thread when ready.";

  assert.deepEqual(extractNotionPrdFromText(root), {
    id: "26bb7cca49828002a07ee3bd6c5bfc4c",
    url: "https://www.notion.so/DS-Update-Tag-26bb7cca49828002a07ee3bd6c5bfc4c",
  });
});
