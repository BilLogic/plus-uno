// roadmap_query answers "how many cards are titled X" with every such card.
//
// Asked on 2026-09-18 how many Roadmap cards have titles starting with
// "DS Update", the bot answered "at least 7" and named the wrong earliest card.
// The board had nine. A title lookup ranked its matches and kept the top six,
// the cap sized for "did you mean" candidates, and described those six as the
// result of a whole-board search; a second call turned up a seventh, and
// nothing in either result said two more existed. These tests pin the shape a
// title result has now: every card whose title CONTAINS the asked-for phrase
// comes back and is counted, and only the looser matches around them are
// capped. Whichever it is, the note says whether the set is complete.
//
// The short-word query is the same failure one step earlier. `tokens()` keeps
// words of three letters or more, so "DS" had none: the query went out with no
// filter, read five pages of a board that no longer fits in five, ranked every
// card against no words, and came back empty every time. It filters on the
// phrase itself now.
//
// HOW THE FETCH IS INJECTED — the seam notion-write.test.ts uses: `net.ts`
// binds `fetch` when it first evaluates, so the stub goes onto `globalThis`
// here and the tool is imported lazily inside each test. The stub evaluates the
// filter the tool sends the way Notion would, so the request is asserted along
// with the answer. Nothing here touches the real Notion API.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

interface Row {
  object: "page";
  id: string;
  url: string;
  archived: boolean;
  properties: Record<string, unknown>;
}

/** One Roadmap card, shaped as databases/{id}/query returns it. */
function card(n: number, title: string): Row {
  return {
    object: "page",
    id: `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
    url: `https://www.notion.so/card-${n}`,
    archived: false,
    properties: {
      Name: { type: "title", title: [{ plain_text: title }] },
      ID: { type: "unique_id", unique_id: { number: n } },
      "Design Status": { type: "status", status: { name: "Need PRD / Under Playground" } },
    },
  };
}

const titleOf = (r: Row): string =>
  (r.properties.Name as { title: { plain_text: string }[] }).title.map((t) => t.plain_text).join("");

type Filter = Record<string, unknown> | undefined;

/** As much of Notion's filter language as roadmapFilter speaks: title
 *  `contains` is a case-insensitive substring test. Anything else fails the
 *  test instead of matching by default. */
function matches(r: Row, f: Filter): boolean {
  if (!f) return true;
  if (Array.isArray(f.or)) return (f.or as Filter[]).some((g) => matches(r, g));
  if (Array.isArray(f.and)) return (f.and as Filter[]).every((g) => matches(r, g));
  const title = f.title as { contains?: string } | undefined;
  if (typeof title?.contains === "string") {
    return titleOf(r).toLowerCase().includes(title.contains.toLowerCase());
  }
  throw new Error(`the stub cannot evaluate ${JSON.stringify(f)}`);
}

// ONE dispatcher over a swappable board, for the reason notion-write.test.ts
// gives: `net.ts` keeps the fetch it saw first, so a later stub is never reached.
let board: Row[] = [];
let requests: { filter: Filter }[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "POST" || !url.endsWith("/databases/roadmap-db/query")) {
    throw new Error(`no stub route for ${method} ${url}`);
  }
  const body = JSON.parse(String(init?.body)) as { page_size: number; start_cursor?: string; filter?: Filter };
  requests.push({ filter: body.filter });
  const hits = board.filter((r) => matches(r, body.filter));
  const start = Number(body.start_cursor ?? 0);
  const end = start + body.page_size;
  return new Response(
    JSON.stringify({
      object: "list",
      results: hits.slice(start, end),
      has_more: end < hits.length,
      next_cursor: end < hits.length ? String(end) : null,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}) as typeof fetch;

const ENV = { NOTION_API_KEY: "ntn_test", NOTION_ROADMAP_DB_ID: "roadmap-db" } as unknown as Env;

interface Result {
  ok: boolean;
  count: number;
  contains_count?: number;
  cards: { card_number: number | null; title: string; title_match?: string }[];
  note: string;
}

async function roadmapQuery(input: Record<string, unknown>): Promise<Result> {
  const { executeRoadmapQuery } = await import("../src/tools/roadmap-query.js");
  requests = [];
  return JSON.parse(await executeRoadmapQuery(ENV, input)) as Result;
}

const byNumber = (a: number | null, b: number | null): number => (a ?? 0) - (b ?? 0);

// The board as Notion returned it on 2026-09-18, newest first. The nine
// DS Update cards are the real ones; around them sit cards that share only the
// word "update", or only the letters "ds".
const DS_UPDATE = [2620, 2619, 2608, 2552, 2550, 2547, 2546, 2545, 2540];
const BOARD: Row[] = [
  card(2620, "DS Update: AI label, Tag, Typography/Display +3 more"),
  card(2619, "DS Update: AI label, Tag, Typography/Display +3 more"),
  card(2611, "Tutor profile update"),
  card(2608, "DS Update: Pattern/Card"),
  card(2601, "Update onboarding copy"),
  card(2590, "Lessons: update the rubric"),
  card(2580, "Cards overview"),
  card(2570, "Needs assessment follow-up"),
  card(2552, "DS Update: Unknown"),
  card(2550, "DS Update: Unknown, Scale Options"),
  card(2547, "DS Update: Unknown, Rating System (with text)"),
  card(2546, "DS Update: Rating Icons"),
  card(2545, "DS Update: Unknown"),
  card(2541, "DS tokens audit"),
  card(2540, "DS Update: Components published"),
  card(2500, "Tutor Compliance Monitor"),
];

test("every card whose title contains the phrase comes back, and the count is the whole set", async () => {
  board = BOARD;
  const out = await roadmapQuery({ title: "DS Update" });

  assert.equal(out.ok, true);
  // The bug itself: the six-candidate cap kept the newest six and dropped the
  // rest, whatever they were labelled.
  const returned = out.cards.map((c) => c.card_number);
  for (const n of DS_UPDATE) assert.ok(returned.includes(n), `RM-${n} is missing from the result`);
  const hits = out.cards.filter((c) => c.title_match === "contains").map((c) => c.card_number);
  assert.deepEqual(hits.sort(byNumber), [...DS_UPDATE].sort(byNumber));
  assert.equal(out.contains_count, 9);
  // Nine hits fill the list; cards that only share the word "update" are not
  // padded in after them, and none is ever labelled a hit.
  assert.equal(out.count, 9);
  for (const c of out.cards) {
    assert.equal(c.title_match === "contains", c.title.toLowerCase().includes("ds update"), c.title);
  }
  assert.match(out.note, /complete/i);
  assert.match(out.note, /\b9\b/);
});

test("a title of only short words filters on the phrase instead of scanning the board blind", async () => {
  board = BOARD;
  const out = await roadmapQuery({ title: "DS" });

  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0]!.filter, { property: "Name", title: { contains: "DS" } });
  const hits = out.cards.filter((c) => c.title_match === "contains").map((c) => c.card_number);
  assert.deepEqual(hits.sort(byNumber), [...DS_UPDATE, 2541].sort(byNumber));
  // "Cards" and "Needs" contain the letters, not the word.
  assert.ok(!hits.includes(2580) && !hits.includes(2570), "a substring was counted as the word");
});

test("a vague description still comes back as a short list of ranked candidates", async () => {
  board = BOARD;
  const out = await roadmapQuery({ title: "update rating icons scale" });

  // No title contains that phrase, and a dozen cards share one of its words:
  // the candidate cap is doing its original job here.
  assert.equal(out.contains_count, 0);
  assert.equal(out.count, 6);
  assert.ok(out.cards.every((c) => c.title_match === "similar"));
  assert.equal(out.cards[0]!.card_number, 2546, "the card sharing the most words should rank first");
  assert.match(out.note, /did you mean/i);
  assert.doesNotMatch(out.note, /complete set/i);
});

test("more hits than the list holds are reported with their total, never as the whole set", async () => {
  board = Array.from({ length: 35 }, (_, i) => card(3000 + i, `Research Sprint: week ${i + 1}`));
  const out = await roadmapQuery({ title: "Research Sprint" });

  assert.equal(out.contains_count, 35);
  assert.equal(out.count, 30);
  assert.match(out.note, /\b35\b/);
  assert.match(out.note, /partial/i);
  assert.doesNotMatch(out.note, /complete set/i);
});

test("a board too large to read fully never calls its count complete", async () => {
  // Nine hits up front, then more cards sharing the word "update" than the
  // page budget can read: the hits are all found, but the read is partial.
  board = [
    ...BOARD.filter((r) => DS_UPDATE.includes(Number(r.id.slice(-12)))),
    ...Array.from({ length: 600 }, (_, i) => card(5000 + i, `Weekly update ${i + 1}`)),
  ];
  const out = await roadmapQuery({ title: "DS Update" });

  assert.equal(requests.length, 5, "the read should stop at the page budget");
  assert.equal(out.contains_count, 9);
  assert.match(out.note, /at least 9/i);
  assert.doesNotMatch(out.note, /complete set/i);
});
