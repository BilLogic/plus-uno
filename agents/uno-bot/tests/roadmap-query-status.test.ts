// roadmap_query tells an unknown Design Status apart from a renamed property.
//
// Asked on 2026-10-07 for cards in Design Status "In Progress" — not an option
// on the board — the tool read Notion's 400 as property drift: it logged
// "property names may have drifted", re-ran the same status filter unfiltered
// by title, failed again, and the model recovered only on a second call. Notion
// answers the two cases with the same `validation_error` code and different
// messages, both captured live from the Roadmap data source that day:
//
//   unknown value:    status option "In Progress" not found for property
//                     "Design Status". Available options: "Need PRD / Under
//                     Playground", "Ready for Design", "WIP", ...
//   missing property: Could not find property with name or id: Design Statuz
//
// An unknown value now comes back as ok:false naming the board's options, read
// from Notion and never from a list kept here; a missing property still takes
// the logged unfiltered rescan.
//
// The fetch is stubbed on `globalThis` before the tool is imported, the seam
// roadmap-query.test.ts uses. Nothing here touches the real Notion API.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

const OPTIONS = [
  "Need PRD / Under Playground",
  "Ready for Design",
  "WIP",
  "Under Review",
  "Under Dev",
  "Shipped",
  "Archived",
];

function card(n: number, title: string, status: string) {
  return {
    object: "page",
    id: `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
    url: `https://www.notion.so/card-${n}`,
    archived: false,
    properties: {
      Name: { type: "title", title: [{ plain_text: title }] },
      ID: { type: "unique_id", unique_id: { number: n } },
      "Design Status": { type: "status", status: { name: status } },
    },
  };
}

const BOARD = [card(1, "Session Recap", "WIP"), card(2, "Tutor Import", "Shipped")];

type Filter = Record<string, unknown> | undefined;

// How the stubbed board answers. `titleProperty` is the title property's
// current name, so a rename can be staged; `listOptions` drops the "Available
// options" tail, for an API version whose message stops at the name.
let titleProperty = "Name";
const statusProperty = "Design Status";
let listOptions = true;
let calls: { method: string; url: string; filter?: Filter }[] = [];

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ object: "error", status: 400, code: "validation_error", message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  if (method === "GET" && url.endsWith("/databases/roadmapdb")) {
    calls.push({ method, url });
    return new Response(
      JSON.stringify({
        object: "database",
        properties: { [statusProperty]: { type: "status", status: { options: OPTIONS.map((name) => ({ name })) } } },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  if (method !== "POST" || !url.endsWith("/databases/roadmapdb/query")) {
    throw new Error(`no stub route for ${method} ${url}`);
  }
  const body = JSON.parse(String(init?.body)) as { filter?: Filter };
  calls.push({ method, url, filter: body.filter });
  const f = body.filter;
  if (titleProperty !== "Name" && JSON.stringify(f ?? {}).includes('"property":"Name"')) {
    return badRequest("Could not find property with name or id: Name");
  }
  if (!f) {
    return Response.json({ object: "list", results: BOARD, has_more: false, next_cursor: null });
  }
  const status = (f.status as { equals?: string } | undefined)?.equals;
  if (typeof f.property !== "string" || status === undefined) {
    throw new Error(`the stub cannot evaluate ${JSON.stringify(f)}`);
  }
  if (f.property !== statusProperty) {
    return badRequest(`Could not find property with name or id: ${f.property}`);
  }
  if (!OPTIONS.includes(status)) {
    return badRequest(
      `status option "${status}" not found for property "${statusProperty}".` +
        (listOptions ? ` Available options: ${OPTIONS.map((o) => `"${o}"`).join(", ")}.` : ""),
    );
  }
  const results = BOARD.filter(
    (r) => (r.properties["Design Status"] as { status: { name: string } }).status.name === status,
  );
  return Response.json({ object: "list", results, has_more: false, next_cursor: null });
}) as typeof fetch;

const ENV = { NOTION_API_KEY: "ntn_test", NOTION_ROADMAP_DB_ID: "roadmapdb" } as unknown as Env;

interface Result {
  ok: boolean;
  error?: string;
  design_status_options?: string[];
  count?: number;
  cards?: { title: string }[];
  note?: string;
}

/** Runs the tool and collects what it warned, so a drift alarm can be asserted absent. */
async function roadmapQuery(input: Record<string, unknown>): Promise<{ result: Result; warnings: string[] }> {
  const { executeRoadmapQuery } = await import("../src/tools/roadmap-query.js");
  calls = [];
  const warnings: string[] = [];
  const warn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args.map(String).join(" "));
  try {
    return { result: JSON.parse(await executeRoadmapQuery(ENV, input)) as Result, warnings };
  } finally {
    console.warn = warn;
  }
}

test("an unknown Design Status is one Notion call and an error naming the board's options", async () => {
  titleProperty = "Name";
  listOptions = true;
  const { result, warnings } = await roadmapQuery({ design_status: "In Progress" });

  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /"In Progress" is not a Design Status/);
  assert.deepEqual(result.design_status_options, OPTIONS);
  assert.equal(calls.length, 1, "no rescan after a status Notion has no option for");
  assert.deepEqual(warnings, [], "an unknown value is not property drift");
});

test("when Notion's message stops at the name, the options come from the database schema", async () => {
  titleProperty = "Name";
  listOptions = false;
  const { result, warnings } = await roadmapQuery({ design_status: "In Progress" });

  assert.equal(result.ok, false);
  assert.deepEqual(result.design_status_options, OPTIONS);
  assert.deepEqual(
    calls.map((c) => c.method),
    ["POST", "GET"],
    "the failed query, then one schema read — never a rescan",
  );
  assert.deepEqual(warnings, []);
});

test("a valid Design Status still filters server-side", async () => {
  titleProperty = "Name";
  listOptions = true;
  const { result } = await roadmapQuery({ design_status: "WIP" });

  assert.equal(result.ok, true);
  assert.deepEqual(result.cards?.map((c) => c.title), ["Session Recap"]);
  assert.equal(calls.length, 1);
});

test("a renamed property still takes the logged unfiltered rescan", async () => {
  titleProperty = "Title";
  listOptions = true;
  const { result, warnings } = await roadmapQuery({ title: "Session Recap" });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /property names may have drifted; unfiltered rescan/);
  assert.equal(calls.length, 2, "the filtered query, then the rescan");
  assert.equal(calls[1]?.filter, undefined, "the rescan goes out unfiltered");
  assert.equal(result.ok, true);
  assert.equal(result.cards?.[0]?.title, "Session Recap");
});
