// The Team Members roster as `findTeamMembers` reads it from Notion: the
// rows the daily role-map sync (`tests/team-roles.test.ts`) matches to Slack.
//
// The fetch stub goes onto `globalThis` before the reader is imported, the seam
// `tests/roadmap-query.test.ts` gives the reason for. Nothing here touches the
// real Notion API.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

const text = (s: string) => ({ type: "rich_text", rich_text: s ? [{ plain_text: s }] : [] });

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  if ((init?.method ?? "GET").toUpperCase() !== "POST" || !url.endsWith("/databases/team-db/query")) {
    throw new Error(`no stub route for ${url}`);
  }
  return new Response(
    JSON.stringify({
      object: "list",
      results: [
        {
          properties: {
            Name: { type: "title", title: [{ plain_text: "Cy Diaz" }] },
            Group: { type: "select", select: { name: "Product Designer" } },
            "Figma User ID": text(" 1105000000000000003 "),
          },
        },
        {
          properties: {
            Name: { type: "title", title: [{ plain_text: "Dee Evans" }] },
            Group: { type: "select", select: { name: "Researcher" } },
            "Figma User ID": text(""),
          },
        },
        // A row from before the column existed.
        { properties: { Name: { type: "title", title: [{ plain_text: "Ana Pérez" }] } } },
      ],
      has_more: false,
      next_cursor: null,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}) as typeof fetch;

const ENV = { NOTION_API_KEY: "ntn_test", NOTION_TEAM_DB_ID: "team-db" } as unknown as Env;

test("the roster reads a member's Figma User ID, trimmed; an empty or missing cell reads as none", async () => {
  const { findTeamMembers } = await import("../src/integrations/notion.js");
  const { members, truncated } = await findTeamMembers(ENV);

  assert.equal(truncated, false);
  assert.deepEqual(
    members.map((m) => [m.name, m.figmaUserId]),
    [
      ["Cy Diaz", "1105000000000000003"],
      ["Dee Evans", undefined],
      ["Ana Pérez", undefined],
    ],
  );
});
