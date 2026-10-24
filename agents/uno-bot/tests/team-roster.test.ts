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
            "Notion Person": { type: "people", people: [{ object: "user", id: "n-cy", name: "Cy Diaz" }] },
          },
        },
        {
          properties: {
            Name: { type: "title", title: [{ plain_text: "Dee Evans" }] },
            Group: { type: "select", select: { name: "Researcher" } },
            "Figma User ID": text(""),
            "Notion Person": { type: "people", people: [] },
          },
        },
        // A row from before the column existed.
        { properties: { Name: { type: "title", title: [{ plain_text: "Ana Pérez" }] } } },
        // Someone who has left PLUS (#1361).
        {
          properties: {
            Name: { type: "title", title: [{ plain_text: "Eli Fox" }] },
            Group: { type: "select", select: { name: "Product Designer" } },
            Affiliation: { type: "select", select: { name: "Past Collaborators" } },
            "Slack ID": text("U0ELI0001"),
          },
        },
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
      ["Eli Fox", undefined],
    ],
  );
});

test("the roster reads a member's Notion Person as user ids; an empty or missing cell reads as none", async () => {
  const { findTeamMembers } = await import("../src/integrations/notion.js");
  const { members } = await findTeamMembers(ENV);
  assert.deepEqual(
    members.map((m) => [m.name, m.notionUserIds]),
    [
      ["Cy Diaz", ["n-cy"]],
      ["Dee Evans", undefined],
      ["Ana Pérez", undefined],
      ["Eli Fox", undefined],
    ],
  );
});

test("the roster keeps a Past Collaborators row for the sync, which skips it", async () => {
  const { findTeamMembers } = await import("../src/integrations/notion.js");
  const { members } = await findTeamMembers(ENV);
  assert.deepEqual(members.find((m) => m.name === "Eli Fox")?.affiliation, "Past Collaborators");
});

test("a turn's team search never offers someone who has left PLUS to suggest or tag (#1361)", async () => {
  const { executeNotionSearch } = await import("../src/tools/notion-search.js");
  const result = JSON.parse(await executeNotionSearch(ENV, { scope: "team", query: "designer" })) as { ok: boolean; count: number; members: Array<{ name: string }> };
  assert.equal(result.ok, true);
  assert.deepEqual(result.members.map((m) => m.name), ["Cy Diaz", "Dee Evans", "Ana Pérez"]);
  assert.equal(result.count, 3);
  assert.doesNotMatch(JSON.stringify(result), /Eli Fox|U0ELI0001/);
});
