// A notion_search scoped to a catalog database names that database, so the
// answer can cite the collection it queried once, the way a Roadmap answer
// cites the board (`tests/sources-box.test.ts`).
//
// The fetch stub goes onto `globalThis` before the tool is imported, the seam
// `tests/roadmap-query.test.ts` gives the reason for. Nothing here touches the
// real Notion API.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  if ((init?.method ?? "GET").toUpperCase() !== "POST" || !url.endsWith("/databases/success-db/query")) {
    throw new Error(`no stub route for ${url}`);
  }
  return new Response(
    JSON.stringify({
      object: "list",
      results: [
        {
          object: "page",
          id: "00000000-0000-0000-0000-000000000001",
          url: "https://www.notion.so/Reflection-story-1",
          archived: false,
          properties: { Name: { type: "title", title: [{ plain_text: "Reflection story" }] } },
        },
      ],
      has_more: false,
      next_cursor: null,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}) as typeof fetch;

const ENV = { NOTION_API_KEY: "ntn_test", NOTION_SUCCESS_STORIES_DB_ID: "success-db" } as unknown as Env;

test("a search scoped to a catalog database names the database it queried", async () => {
  const { executeNotionSearch } = await import("../src/tools/notion-search.js");
  const out = JSON.parse(await executeNotionSearch(ENV, { scope: "success_stories", query: "reflection" })) as Record<string, unknown>;

  assert.equal(out.ok, true);
  assert.deepEqual(out.database, { title: "Success Stories", url: "https://www.notion.so/successdb" });
});
