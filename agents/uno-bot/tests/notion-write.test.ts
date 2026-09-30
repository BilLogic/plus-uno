// The first mocked-fetch test over a Notion WRITE.
//
// Everything about `notion.ts` up to now was covered only through its pure
// halves (`notion-blocks.test.ts`) — the request shapes themselves were
// unasserted, which is exactly the part that has to be right once a write can
// change text a human already wrote. In-place replacement (ADR-029) is keyed
// on one comparison and one request body; both are asserted here.
//
// HOW THE FETCH IS INJECTED. `net.ts` captures the real `fetch` at module
// evaluation and routes every outbound call through it (ADR-022), so the seam
// is module LOAD order: the stub goes onto `globalThis` at the top of this
// file, and the integration is imported lazily inside each test, which is what
// evaluates `net.ts` against the stub. Nothing here touches the real Notion API.
import { test } from "node:test";
import assert from "node:assert/strict";

interface Call {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
}

type Reply = { status?: number; body: unknown };
type Routes = Record<string, Reply>;

// ONE dispatcher, installed once, with a swappable routing table.
//
// It has to be one: `net.ts` binds the real fetch at ITS first evaluation, and
// nothing re-evaluates it afterwards, so a second stub installed later would
// never be reached. Per-test isolation therefore comes from swapping the routes
// and clearing the log, not from re-installing.
let routes: Routes = {};
let calls: Call[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  calls.push({ url, method, body });
  const key = Object.keys(routes).find((k) => {
    const [m, suffix] = k.split(" ");
    return m === method && url.includes(suffix!);
  });
  // An unrouted call is a FAILED test, never a default reply: "the write never
  // happened" is the assertion in half of these, and a permissive stub would
  // let a real write slip past it unnoticed.
  if (!key) throw new Error(`no stub route for ${method} ${url}`);
  const reply = routes[key]!;
  return new Response(JSON.stringify(reply.body), {
    status: reply.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

/** Point the dispatcher at this test's routes and forget the previous log. */
function serve(next: Routes): void {
  routes = next;
  calls = [];
}

/** The integration, loaded lazily so `net.ts` evaluates against the stub above
 *  rather than against the real fetch. */
function notion(): Promise<typeof import("../src/integrations/notion")> {
  return import("../src/integrations/notion.js");
}

const ENV = { NOTION_API_KEY: "ntn_test" } as unknown as import("../src/types").Env;

const BLOCK = "1f2e3d4c-5b6a-7980-1234-56789abcdef0";
const PAGE = "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";
const READ_STAMP = "2026-09-15T14:02:00.000Z";

test("a replace issues the block update Notion expects", async () => {
  serve({
    [`GET /blocks/${BLOCK}`]: {
      body: { id: BLOCK, last_edited_time: READ_STAMP, parent: { type: "page_id", page_id: PAGE } },
    },
    [`PATCH /blocks/${BLOCK}`]: { body: { id: BLOCK } },
  });
  const { notionUpdate } = await notion();

  const r = await notionUpdate(ENV, PAGE, {
    replace: [{ blockId: BLOCK, lastEditedTime: READ_STAMP, content: "The TLDR **is now this**." }],
  });

  assert.equal(r.replaced, 1);
  assert.deepEqual(r.refused, []);
  assert.equal(r.staleStamps, 0);
  // The stamp is read first and the write only follows it.
  assert.deepEqual(
    calls.map((c) => c.method),
    ["GET", "PATCH"],
  );
  const patch = calls[1]!;
  assert.match(patch.url, new RegExp(`/v1/blocks/${BLOCK}$`));
  // One block's own payload, and ONLY that — no `children`, no page id.
  assert.deepEqual(Object.keys(patch.body!), ["paragraph"]);
  const runs = (patch.body!.paragraph as { rich_text: { text: { content: string } }[] }).rich_text;
  assert.deepEqual(
    runs.map((run) => run.text.content),
    ["The TLDR ", "is now this", "."],
  );
});

test("a block that moved since the read is refused, and nothing is written", async () => {
  serve({
    [`GET /blocks/${BLOCK}`]: {
      body: {
        id: BLOCK,
        last_edited_time: "2026-09-15T16:40:00.000Z",
        parent: { type: "page_id", page_id: PAGE },
      },
    },
  });
  const { notionUpdate } = await notion();

  const r = await notionUpdate(ENV, PAGE, {
    replace: [{ blockId: BLOCK, lastEditedTime: READ_STAMP, content: "a correction composed against the old text" }],
  });

  assert.equal(r.replaced, 0);
  // No PATCH route is even stubbed: reaching for one would throw.
  assert.deepEqual(
    calls.map((c) => c.method),
    ["GET"],
  );
  assert.equal(r.refused.length, 1);
  // Counted as a stale write, which is what the usage record's refused_stale
  // reads (`usage/proposal-events.ts`).
  assert.equal(r.staleStamps, 1);
  // The refusal names the block and BOTH stamps, so the person who asked can
  // see it is staleness rather than a failure.
  assert.match(r.refused[0]!, /1f2e3d4c changed since read/);
  assert.match(r.refused[0]!, /2026-09-15T14:02:00\.000Z/);
  assert.match(r.refused[0]!, /2026-09-15T16:40:00\.000Z/);
});

test("a multi-block replacement rewrites the first and places the rest after it", async () => {
  serve({
    [`GET /blocks/${BLOCK}`]: {
      body: { id: BLOCK, last_edited_time: READ_STAMP, parent: { type: "page_id", page_id: PAGE } },
    },
    [`PATCH /blocks/${BLOCK}`]: { body: { id: BLOCK } },
    [`PATCH /blocks/${PAGE}/children`]: { body: { results: [{ id: "9999-follow" }] } },
  });
  const { notionUpdate } = await notion();

  const r = await notionUpdate(ENV, PAGE, {
    replace: [{ blockId: BLOCK, lastEditedTime: READ_STAMP, content: "First line.\n\nSecond line." }],
  });

  assert.equal(r.replaced, 2);
  assert.deepEqual(r.refused, []);
  const follow = calls.at(-1)!;
  assert.match(follow.url, new RegExp(`/v1/blocks/${PAGE}/children$`));
  // `after` is what keeps the page's order: the remainder lands against the
  // block just rewritten, not at the bottom of the page.
  assert.equal(follow.body!.after, BLOCK);
  assert.equal((follow.body!.children as unknown[]).length, 1);
});

test("append still appends to the page, untouched by the replace path", async () => {
  serve({
    [`PATCH /blocks/${PAGE}/children`]: { body: { results: [{ id: "x" }] } },
  });
  const { notionUpdate } = await notion();

  const r = await notionUpdate(ENV, PAGE, { append: { text: "A dated progress pulse." } });

  assert.equal(r.appended, 1);
  assert.equal(r.replaced, 0);
  assert.equal(calls.length, 1);
  // No `after`: an append is still an append, placed at the end.
  assert.equal(calls[0]!.body!.after, undefined);
});

test("a property write still reads the live schema and patches the page", async () => {
  serve({
    [`GET /pages/${PAGE}`]: {
      body: {
        id: PAGE,
        parent: { type: "database_id", database_id: "db1" },
        properties: { Name: { type: "title", title: [{ plain_text: "A card" }] } },
      },
    },
    "GET /databases/db1": {
      body: {
        title: [{ plain_text: "Roadmap" }],
        properties: {
          "Design Status": { type: "status", status: { options: [{ name: "WIP" }] } },
        },
      },
    },
    [`PATCH /pages/${PAGE}`]: { body: { id: PAGE } },
  });
  const { notionUpdate } = await notion();

  const r = await notionUpdate(ENV, PAGE, { properties: { design_status: "WIP" } });

  assert.deepEqual(r.updated, ["Design Status"]);
  assert.equal(r.replaced, 0);
  assert.deepEqual(r.refused, []);
  const patch = calls.at(-1)!;
  assert.equal(patch.method, "PATCH");
  assert.deepEqual(patch.body, { properties: { "Design Status": { status: { name: "WIP" } } } });
});

test("a page read hands back every block's id and last-edited stamp", async () => {
  serve({
    [`GET /pages/${PAGE}`]: {
      body: { id: PAGE, properties: { Name: { type: "title", title: [{ plain_text: "Calendar Sync" }] } } },
    },
    [`GET /blocks/${PAGE}/children`]: {
      body: {
        has_more: false,
        results: [
          {
            id: BLOCK,
            type: "paragraph",
            last_edited_time: READ_STAMP,
            paragraph: { rich_text: [{ plain_text: "Sync runs nightly." }] },
          },
          // An empty block contributes no line, so it earns no index entry
          // either — `blocks` and `text` stay in step.
          { id: "empty-1", type: "paragraph", last_edited_time: READ_STAMP, paragraph: { rich_text: [] } },
        ],
      },
    },
  });
  const { readNotionPage } = await notion();

  const page = await readNotionPage(ENV, PAGE);

  assert.equal(page.text, "Sync runs nightly.");
  assert.deepEqual(page.blocks, [
    { id: BLOCK, type: "paragraph", lastEditedTime: READ_STAMP, text: "Sync runs nightly.", plain: true },
  ]);
});

// A blocks page Notion refuses — a 429, a 5xx — is not a page with no blocks.
// The sweep's complete read throws it as `Notion <status>`, which the sweep
// holds on (a 429 without counting, `sweep/run.ts` QUOTA); read_source keeps
// what it read and caches none of it.
for (const [status, code] of [
  [429, "rate_limited"],
  [503, "service_unavailable"],
] as const) {
  test(`a blocks page answered ${status} throws in a complete read, and is partial and uncached otherwise`, async () => {
    const page = `3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c${status === 429 ? "29" : "03"}`;
    const failing: Routes = {
      [`GET /pages/${page}`]: {
        body: { id: page, properties: { Name: { type: "title", title: [{ plain_text: "Launch plan" }] } } },
      },
      [`GET /blocks/${page}/children`]: { status, body: { object: "error", code, message: "slow down" } },
    };
    serve(failing);
    const { readNotionPage } = await notion();

    await assert.rejects(readNotionPage(ENV, page, { complete: true }), new RegExp(`^Error: Notion ${status} ${code}`));

    serve(failing);
    const partial = await readNotionPage(ENV, page);
    assert.deepEqual(partial.blocks, []);
    // Not cached: the next read asks Notion again.
    serve(failing);
    await readNotionPage(ENV, page);
    assert.ok(calls.some((c) => c.url.includes("/children")), "read again, not served from the cache");
  });
}

// A replace keeps the block's own type and state. Notion refuses a PATCH that
// changes a block's type, so a paragraph written onto a list item, a to-do or
// a heading would never land; and the display mark a read puts on a list line
// ("• ", "☐ ") is text the block does not hold.
for (const c of [
  { type: "bulleted_list_item", content: "• Owner: Bea", text: "Owner: Bea" },
  { type: "numbered_list_item", content: "• Step two: sign off", text: "Step two: sign off" },
  { type: "to_do", content: "☐ Ship the November build", text: "Ship the November build" },
  { type: "heading_2", content: "Launch plan (November)", text: "Launch plan (November)" },
  { type: "paragraph", content: "Launch date: November 1", text: "Launch date: November 1" },
]) {
  test(`a replace onto a ${c.type} writes that type's rich text only, without a display mark`, async () => {
    serve({
      [`GET /blocks/${BLOCK}`]: {
        body: { id: BLOCK, type: c.type, last_edited_time: READ_STAMP, parent: { type: "page_id", page_id: PAGE } },
      },
      [`PATCH /blocks/${BLOCK}`]: { body: { id: BLOCK } },
    });
    const { notionUpdate } = await notion();

    const r = await notionUpdate(ENV, PAGE, { replace: [{ blockId: BLOCK, lastEditedTime: READ_STAMP, content: c.content }] });

    assert.equal(r.replaced, 1);
    const patch = calls[1]!;
    // Only the type's own key, and in it only `rich_text`: a to-do keeps its
    // tick and a heading its level because neither is sent.
    assert.deepEqual(Object.keys(patch.body!), [c.type]);
    const payload = patch.body![c.type] as { rich_text: { text: { content: string } }[] };
    assert.deepEqual(Object.keys(payload), ["rich_text"]);
    assert.equal(payload.rich_text.map((run) => run.text.content).join(""), c.text);
  });
}

// A replace writes words only, so a block whose rich text carries more than
// words would lose it. Those are refused unwritten; plain words proceed.
const RUN = { type: "text", text: { content: "Owner: Bea", link: null }, href: null };
for (const c of [
  {
    name: "a mention",
    rich_text: [RUN, { type: "mention", mention: { type: "user", user: { id: "u1" } }, href: null }],
  },
  {
    name: "a link",
    rich_text: [{ type: "text", text: { content: "the spec", link: { url: "https://example.test" } }, href: "https://example.test" }],
  },
  {
    name: "bold",
    rich_text: [{ ...RUN, annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: "default" } }],
  },
]) {
  test(`a replace onto a block with ${c.name} is refused, and nothing is written`, async () => {
    serve({
      [`GET /blocks/${BLOCK}`]: {
        body: {
          id: BLOCK,
          type: "paragraph",
          paragraph: { rich_text: c.rich_text },
          last_edited_time: READ_STAMP,
          parent: { type: "page_id", page_id: PAGE },
        },
      },
    });
    const { notionUpdate } = await notion();

    const r = await notionUpdate(ENV, PAGE, { replace: [{ blockId: BLOCK, lastEditedTime: READ_STAMP, content: "Owner: Ade" }] });

    assert.equal(r.replaced, 0);
    assert.deepEqual(
      calls.map((c) => c.method),
      ["GET"],
    );
    assert.equal(r.refused.length, 1);
    assert.match(r.refused[0]!, /links, mentions or formatting that a text replace would drop/);
    assert.equal(r.staleStamps, 0);
  });
}

test("a replace onto a block of plain words proceeds", async () => {
  serve({
    [`GET /blocks/${BLOCK}`]: {
      body: {
        id: BLOCK,
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              ...RUN,
              annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default" },
            },
          ],
        },
        last_edited_time: READ_STAMP,
        parent: { type: "page_id", page_id: PAGE },
      },
    },
    [`PATCH /blocks/${BLOCK}`]: { body: { id: BLOCK } },
  });
  const { notionUpdate } = await notion();

  const r = await notionUpdate(ENV, PAGE, { replace: [{ blockId: BLOCK, lastEditedTime: READ_STAMP, content: "Owner: Ade" }] });

  assert.equal(r.replaced, 1);
  assert.deepEqual(r.refused, []);
});

test("a read's display mark comes off a block's text by its type, and only its own", async () => {
  const { stripBlockPrefix } = await notion();
  assert.equal(stripBlockPrefix("bulleted_list_item", "• Owner: Ade"), "Owner: Ade");
  assert.equal(stripBlockPrefix("to_do", "☐ Ship it"), "Ship it");
  assert.equal(stripBlockPrefix("paragraph", "• a bullet typed as text"), "• a bullet typed as text");
});
