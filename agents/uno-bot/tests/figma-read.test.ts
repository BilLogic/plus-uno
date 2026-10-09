// What `source_read` says about a Figma frame, and what it stops saying.
//
// Two defects lived in this one branch, and both told the model something
// untrue about its own situation.
//
//   1. The note read "It's text only — you cannot judge pixel-level visuals."
//      `slack/vision.ts` renders the first frame link in the message and
//      attaches the PNG to the same turn, so on the path that matters the model
//      was told it was blind while it was looking at the frame.
//
//   2. `collectText` stopped at 200 text layers and returned silently. A frame
//      with 400 strings came back looking exactly like a frame with 200 — so
//      "the frame doesn't mention X" was answerable from a reading that had
//      stopped before X.
//
// The second is the one with a fixture, because a cap is only provable by
// crossing it. Both assertions were confirmed to FAIL against the old code
// before this file was kept.
//
// The read itself runs over the Figma client (#892): the shared fake for what
// it makes of a node, and the REST client over a scripted transport for the
// one thing only Figma's own answer can show — a first 429 is waited out, not
// reported to the person who pasted the link.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectTextLayers,
  describeFigmaFrame,
  FIGMA_COMMENTS_NOTE,
  FIGMA_COMMENTS_UNREAD_NOTE,
  FIGMA_NO_COMMENTS_NOTE,
  FIGMA_NOTE,
  FIGMA_TRUNCATION_NOTE,
  figmaCommentsCapNote,
  MAX_PINNED_CHARS,
  MAX_PINNED_THREADS,
  MAX_TEXT_LAYERS,
  type FigmaNode,
} from "../src/integrations/figma-reading";
import { fetchFigmaFrame, fetchFigmaImagePngUrl, fetchFigmaNode } from "../src/integrations/figma";
import { FigmaRateLimitError, FigmaRequestError, type FigmaComment } from "../src/figma/client";
import { createInMemoryFigma } from "../src/figma/in-memory";
import { createFigmaRestClient } from "../src/figma/rest";
import { SubrequestBudgetError } from "../src/net";
import { PREVIEW_UNDER_WAIT_UNTIL } from "../src/turn/env-deps";


/** A frame with `n` TEXT descendants, nested so the walk has to recurse. */
function frameWith(n: number): FigmaNode {
  let deepest: FigmaNode = { name: "leaf", type: "FRAME", children: [] };
  const root: FigmaNode = { name: "Board", type: "FRAME", children: [deepest] };
  for (let i = 0; i < n; i++) {
    if (i % 25 === 24) {
      const next: FigmaNode = { name: `group-${i}`, type: "FRAME", children: [] };
      deepest.children!.push(next);
      deepest = next;
    }
    deepest.children!.push({ name: `t${i}`, type: "TEXT", characters: `line ${i}` });
  }
  return root;
}

describe("figma text-layer reading", () => {
  it("reads a whole frame and says it is whole", () => {
    const { texts, truncated } = collectTextLayers(frameWith(12));
    assert.equal(texts.length, 12);
    assert.equal(truncated, false);
    assert.equal(texts[0], "line 0");
    assert.equal(texts[11], "line 11");
  });

  it("a frame exactly at the cap is not truncated", () => {
    // The off-by-one that would report every full-but-complete frame as partial
    // and teach a reader to ignore the flag.
    const { texts, truncated } = collectTextLayers(frameWith(MAX_TEXT_LAYERS));
    assert.equal(texts.length, MAX_TEXT_LAYERS);
    assert.equal(truncated, false);
  });

  it("one layer past the cap is reported, not swallowed", () => {
    const { texts, truncated } = collectTextLayers(frameWith(MAX_TEXT_LAYERS + 1));
    assert.equal(texts.length, MAX_TEXT_LAYERS);
    assert.equal(truncated, true);
  });

  it("stops walking once one layer past the cap proves truncation", () => {
    const unreadTail: FigmaNode = { name: "unread-tail", type: "FRAME" };
    Object.defineProperty(unreadTail, "children", {
      get: () => {
        throw new Error("walk continued after truncation was known");
      },
    });
    const frame: FigmaNode = {
      name: "Board",
      type: "FRAME",
      children: [...(frameWith(MAX_TEXT_LAYERS + 1).children ?? []), unreadTail],
    };

    const { texts, truncated } = collectTextLayers(frame);
    assert.equal(texts.length, MAX_TEXT_LAYERS);
    assert.equal(truncated, true);
  });

  it("a much larger frame still returns the cap, and still says so", () => {
    const { texts, truncated } = collectTextLayers(frameWith(400));
    assert.equal(texts.length, MAX_TEXT_LAYERS);
    assert.equal(truncated, true);
  });

  it("blank text layers are not layers", () => {
    const root: FigmaNode = {
      name: "Board",
      type: "FRAME",
      children: [
        { name: "a", type: "TEXT", characters: "  " },
        { name: "b", type: "TEXT", characters: "kept" },
        { name: "c", type: "TEXT" },
      ],
    };
    assert.deepEqual(collectTextLayers(root).texts, ["kept"]);
  });
});

describe("the note the model is handed", () => {
  it("no longer claims the model cannot see the frame", () => {
    // The exact sentence that was false, and the shape of it. vision.ts may
    // have attached the rendered PNG to this same turn.
    assert.ok(!/text only/i.test(FIGMA_NOTE));
    assert.ok(!/cannot judge/i.test(FIGMA_NOTE));
    assert.ok(!/\byou cannot see\b/i.test(FIGMA_NOTE));
    assert.match(FIGMA_NOTE, /rendered image/i);
  });

  it("names what the payload drops, and forbids reading the drop as an absence", () => {
    // The Figma response DOES carry fills, boundVariables and geometry;
    // fetchFigmaNode keeps name/type/text. "No token on this frame" would be a
    // claim about our reader dressed as a claim about the design.
    for (const dropped of ["fills", "tokens", "variable bindings", "measurements"]) {
      assert.ok(FIGMA_NOTE.includes(dropped), `note should name ${dropped}`);
    }
    assert.match(FIGMA_NOTE, /unread here rather than missing/i);
  });

  it("the truncation note says the missing part is unknown, not absent", () => {
    assert.match(FIGMA_TRUNCATION_NOTE, /partial/i);
    assert.match(FIGMA_TRUNCATION_NOTE, /unknown rather than nonexistent/i);
  });
});

describe("a frame read over the Figma client", () => {
  const FILE = "AbC123xyz";
  const NODE = "158:21725";

  function seeded(frame: FigmaNode = frameWith(3)) {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { nodes: { [NODE]: frame } });
    return figma;
  }

  it("reads the frame's name, type and text, asking for that one node within 8 s", async () => {
    const figma = seeded();
    assert.deepEqual(await fetchFigmaNode(figma, FILE, NODE), {
      name: "Board",
      type: "FRAME",
      texts: ["line 0", "line 1", "line 2"],
      truncated: false,
    });
    assert.deepEqual(figma.calls(), [{ method: "nodes", args: [FILE, [NODE], { timeoutMs: 8000 }] }]);
  });

  it("says when the frame was cut short", async () => {
    const node = await fetchFigmaNode(seeded(frameWith(MAX_TEXT_LAYERS + 1)), FILE, NODE);
    assert.equal(node.texts.length, MAX_TEXT_LAYERS);
    assert.equal(node.truncated, true);
  });

  it("throws on a node the file does not hold, and on a Worker with no token", async () => {
    await assert.rejects(fetchFigmaNode(seeded(), FILE, "9:9"), /^Error: Figma node 9:9 not found in file AbC123xyz$/);
    await assert.rejects(fetchFigmaNode(undefined, FILE, NODE), /FIGMA_ACCESS_TOKEN not configured on the Worker/);
  });

  it("passes on what Figma refused, worded as Figma said it", async () => {
    const figma = seeded();
    figma.failNext("nodes", new FigmaRequestError(403, "Figma nodes 403: Invalid token"));
    await assert.rejects(fetchFigmaNode(figma, FILE, NODE), { status: 403, message: "Figma nodes 403: Invalid token" });
  });

  it("waits out a first 429 from Figma rather than reporting it", async () => {
    const answers = [
      new Response(JSON.stringify({ status: 429, err: "Rate limit exceeded" }), { status: 429, headers: { "retry-after": "2" } }),
      new Response(JSON.stringify({ nodes: { [NODE]: { document: frameWith(2) } } }), { status: 200 }),
    ];
    const clock = { t: 0 };
    const sentAt: number[] = [];
    const figma = createFigmaRestClient({
      token: "figd_test",
      now: () => clock.t,
      async sleep(ms) {
        clock.t += ms;
      },
      async transport() {
        sentAt.push(clock.t);
        return answers.shift()!;
      },
    });
    const node = await fetchFigmaNode(figma, FILE, NODE);
    assert.deepEqual(node.texts, ["line 0", "line 1"]);
    assert.deepEqual(sentAt, [0, 2000], "asked again once the Retry-After had passed");
  });

  it("renders a URL, or no image at all on any failure", async () => {
    const figma = seeded();
    assert.match((await fetchFigmaImagePngUrl(figma, FILE, NODE)) ?? "", /^https:\/\//);
    assert.equal(await fetchFigmaImagePngUrl(figma, FILE, "9:9"), null, "a node that would not render");
    figma.failNext("images", new FigmaRequestError(500, "Figma images 500: Internal error"));
    assert.equal(await fetchFigmaImagePngUrl(figma, FILE, NODE), null, "a refusal");
    assert.equal(await fetchFigmaImagePngUrl(undefined, FILE, NODE), null, "no token");
  });

  it("renders with the caller's bounds on waiting", async () => {
    const figma = seeded();
    await fetchFigmaImagePngUrl(figma, FILE, NODE, { maxWaitMs: 0, attempts: 1 });
    assert.deepEqual(figma.calls()[0]!.args[2], { format: "png", scale: 1, timeoutMs: 8000, maxWaitMs: 0, attempts: 1 });
  });
});

describe("a render's first 429", () => {
  const FILE = "AbC123xyz";
  const NODE = "158:21725";
  const RENDERED = "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/frame.png";

  /** A REST client whose Figma answers a 429 with `retryAfter`, then the render. */
  function rateLimitedOnce(retryAfter: string) {
    const answers = [
      new Response(JSON.stringify({ status: 429, err: "Rate limit exceeded" }), { status: 429, headers: { "retry-after": retryAfter } }),
      new Response(JSON.stringify({ err: null, images: { [NODE]: RENDERED } }), { status: 200 }),
    ];
    const clock = { t: 0 };
    const sentAt: number[] = [];
    const figma = createFigmaRestClient({
      token: "figd_test",
      now: () => clock.t,
      async sleep(ms) {
        clock.t += ms;
      },
      async transport() {
        sentAt.push(clock.t);
        return answers.shift()!;
      },
    });
    return { figma, sentAt };
  }

  it("is waited out where a turn renders — vision, and a turn's card preview", async () => {
    // Both pass two attempts and the client's 60 s wait (`slack/vision.ts`,
    // `turn/env-deps.ts`), so a 30 s Retry-After still renders.
    const { figma, sentAt } = rateLimitedOnce("30");
    assert.equal(await fetchFigmaImagePngUrl(figma, FILE, NODE, { attempts: 2 }), RENDERED);
    assert.deepEqual(sentAt, [0, 30000]);
  });

  it("is waited out briefly where the button door re-stages a card inside waitUntil", async () => {
    const { figma, sentAt } = rateLimitedOnce("3");
    assert.equal(await fetchFigmaImagePngUrl(figma, FILE, NODE, PREVIEW_UNDER_WAIT_UNTIL), RENDERED);
    assert.deepEqual(sentAt, [0, 3000]);
  });

  it("gives the re-staged card no preview at once when the wait would run past waitUntil", async () => {
    const { figma, sentAt } = rateLimitedOnce("30");
    assert.equal(await fetchFigmaImagePngUrl(figma, FILE, NODE, PREVIEW_UNDER_WAIT_UNTIL), null);
    assert.deepEqual(sentAt, [0], "no second attempt, and no sleep");
  });
});

// #899: a pasted frame brings the comment threads pinned to it or to a layer
// inside it. What an outsider sees is the `source_read` payload, so each case
// reads the frame over the shared fake and checks what `describeFigmaFrame`
// hands the model.
describe("the comments pinned to a pasted frame (#899)", () => {
  const FILE = "AbC123xyz";
  const NODE = "158:21725";
  const URL = `https://www.figma.com/design/${FILE}/Sessions?node-id=158-21725`;

  /** A frame with a nested group and an instance, every node carrying its id. */
  const FRAME: FigmaNode = {
    id: NODE,
    name: "Session card",
    type: "FRAME",
    children: [
      { id: "158:21726", name: "Title", type: "TEXT", characters: "Today's session" },
      {
        id: "158:21730",
        name: "Actions",
        type: "FRAME",
        children: [
          {
            id: "158:21731",
            name: "Join button",
            type: "INSTANCE",
            children: [{ id: "I158:21731;12:4", name: "Label", type: "TEXT", characters: "Join" }],
          },
        ],
      },
    ],
  };

  /** A comment as Figma lists it: a root unless `parent_id` is set. */
  function comment(id: string, fields: Partial<FigmaComment> & { handle?: string }): FigmaComment {
    const { handle = "coco", ...rest } = fields;
    return {
      id,
      file_key: FILE,
      parent_id: "",
      user: { id: `u-${handle}`, handle },
      created_at: "2026-09-20T15:00:00Z",
      resolved_at: null,
      message: "a comment",
      client_meta: null,
      ...rest,
    };
  }
  const pinnedTo = (node_id: string) => ({ node_id, node_offset: { x: 4, y: 8 } });

  function seeded(comments: FigmaComment[]) {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { nodes: { [NODE]: FRAME }, comments });
    return figma;
  }

  /** What `source_read` hands the model for the frame. */
  async function pasted(comments: FigmaComment[]) {
    return describeFigmaFrame(URL, await fetchFigmaFrame(seeded(comments), FILE, NODE));
  }

  /** The fields a frame read carried before #899, as it reads this frame. */
  const TODAY = {
    ok: true,
    source_type: "figma",
    url: URL,
    title: "Session card",
    node_type: "FRAME",
    content: "Today's session\nJoin",
    text_layers: 2,
    text_layers_truncated: false,
  };

  it("returns the threads pinned to the frame, with author, date and resolved state (AC 1)", async () => {
    const comments = [
      comment("c1", {
        handle: "coco",
        created_at: "2026-09-20T15:00:00Z",
        resolved_at: "2026-09-22T10:00:00Z",
        message: "Say 'Join', not 'Enter'.",
        client_meta: pinnedTo(NODE),
      }),
      comment("c2", { handle: "bill", parent_id: "c1", created_at: "2026-09-21T09:00:00Z", message: "Agreed, Join." }),
      comment("c3", {
        handle: "maya",
        created_at: "2026-09-25T12:00:00Z",
        message: "  Should the time show the tutor's zone?  ",
        client_meta: pinnedTo(NODE),
      }),
    ];
    const payload = await pasted(comments);
    assert.deepEqual(payload, {
      ...TODAY,
      comments: [
        { by: "maya", at: "2026-09-25T12:00:00Z", resolved: false, text: "Should the time show the tutor's zone?", replies: [] },
        {
          by: "coco",
          at: "2026-09-20T15:00:00Z",
          resolved: true,
          resolved_at: "2026-09-22T10:00:00Z",
          text: "Say 'Join', not 'Enter'.",
          replies: [{ by: "bill", at: "2026-09-21T09:00:00Z", text: "Agreed, Join." }],
        },
      ],
      comment_threads: 2,
      comments_truncated: false,
      note: `${FIGMA_NOTE} ${FIGMA_COMMENTS_NOTE}`,
    });

    // Newest activity first: a reply newer than the other thread moves its own up.
    const later = await pasted([
      ...comments,
      comment("c4", { handle: "maya", parent_id: "c1", created_at: "2026-09-26T08:00:00Z", message: "Done in v3." }),
    ]);
    const threads = later.comments as Array<{ by: string; replies: unknown[] }>;
    assert.deepEqual(
      threads.map((t) => [t.by, t.replies.length]),
      [
        ["coco", 2],
        ["maya", 0],
      ],
    );
  });

  it("includes a thread pinned to a layer inside the frame, and names the layer (AC 2)", async () => {
    const payload = await pasted([
      comment("child", { created_at: "2026-09-20T10:00:00Z", message: "Tighter gap here", client_meta: pinnedTo("158:21730") }),
      comment("instance", { created_at: "2026-09-21T10:00:00Z", message: "Primary, not outline", client_meta: pinnedTo("158:21731") }),
      comment("inside-instance", { created_at: "2026-09-22T10:00:00Z", message: "Sentence case", client_meta: pinnedTo("I158:21731;12:4") }),
    ]);
    const threads = payload.comments as Array<{ layer?: string; text: string }>;
    assert.deepEqual(
      threads.map((t) => [t.layer, t.text]),
      [
        ["Label", "Sentence case"],
        ["Join button", "Primary, not outline"],
        ["Actions", "Tighter gap here"],
      ],
    );
    assert.equal(payload.comment_threads, 3);
  });

  it("leaves out a thread pinned elsewhere, a page-level comment, and their replies", async () => {
    const payload = await pasted([
      comment("mine", { message: "On the frame", client_meta: pinnedTo(NODE) }),
      comment("sibling", { message: "On another frame", client_meta: pinnedTo("200:1") }),
      comment("page", { message: "On the canvas", client_meta: { x: 120, y: 40 } as FigmaComment["client_meta"] }),
      comment("unpinned", { message: "No pin at all", client_meta: null }),
      comment("reply-elsewhere", { parent_id: "sibling", message: "A reply on the other frame" }),
    ]);
    const threads = payload.comments as Array<{ text: string; replies: unknown[] }>;
    assert.deepEqual(
      threads.map((t) => [t.text, t.replies.length]),
      [["On the frame", 0]],
    );
    assert.equal(payload.comment_threads, 1);
  });

  it("reads a frame with no comments as it read before (AC 3)", async () => {
    for (const comments of [[], [comment("sibling", { client_meta: pinnedTo("200:1") }), comment("page", {})]]) {
      const payload = await pasted(comments);
      assert.deepEqual(payload, { ...TODAY, note: `${FIGMA_NOTE} ${FIGMA_NO_COMMENTS_NOTE}` });
    }
    // The text read itself is the drift check's, unchanged.
    assert.deepEqual(await fetchFigmaNode(seeded([]), FILE, NODE), {
      name: "Session card",
      type: "FRAME",
      texts: ["Today's session", "Join"],
      truncated: false,
    });
  });

  it("says the comments are unread, not absent, when Figma would not list them — and keeps the frame", async () => {
    for (const refusal of [
      new FigmaRequestError(403, "Figma comments 403: Invalid scope"),
      new FigmaRateLimitError("Figma comments 429: rate limited past the call's 60 s", 120_000),
      new SubrequestBudgetError(38),
    ]) {
      const figma = seeded([comment("c1", { client_meta: pinnedTo(NODE) })]);
      figma.failNext("comments", refusal);
      const payload = describeFigmaFrame(URL, await fetchFigmaFrame(figma, FILE, NODE));
      assert.deepEqual(payload, {
        ...TODAY,
        comments_unread: refusal.message,
        note: `${FIGMA_NOTE} ${FIGMA_COMMENTS_UNREAD_NOTE}`,
      });
    }
  });

  it("lists the newest threads up to the cap, and says how many there are", async () => {
    const many = Array.from({ length: MAX_PINNED_THREADS + 5 }, (_, i) =>
      comment(`c${i}`, {
        created_at: new Date(Date.UTC(2026, 8, 1 + i)).toISOString(),
        message: `thread ${i}`,
        client_meta: pinnedTo(NODE),
      }),
    );
    const payload = await pasted(many);
    const threads = payload.comments as Array<{ text: string }>;
    assert.equal(threads.length, MAX_PINNED_THREADS);
    assert.equal(threads[0]!.text, `thread ${MAX_PINNED_THREADS + 4}`);
    assert.equal(threads.at(-1)!.text, "thread 5");
    assert.equal(payload.comment_threads, MAX_PINNED_THREADS + 5);
    assert.equal(payload.comments_truncated, true);
    assert.equal(
      payload.note,
      `${FIGMA_NOTE} ${FIGMA_COMMENTS_NOTE} ${figmaCommentsCapNote(MAX_PINNED_THREADS, MAX_PINNED_THREADS + 5)}`,
    );
  });

  it("stops listing at the text cap too, newest first, and always lists the newest thread", async () => {
    const long = (i: number, chars: number) =>
      comment(`c${i}`, {
        created_at: new Date(Date.UTC(2026, 8, 1 + i)).toISOString(),
        message: `${i}`.padEnd(chars, "x"),
        client_meta: pinnedTo(NODE),
      });
    const third = Math.floor(MAX_PINNED_CHARS * 0.4);
    const payload = await pasted([0, 1, 2, 3].map((i) => long(i, third)));
    const threads = payload.comments as Array<{ text: string }>;
    assert.deepEqual(
      threads.map((t) => t.text[0]),
      ["3", "2"],
      "a third would cross the cap, so it and every older one stop",
    );
    assert.equal(payload.comment_threads, 4);
    assert.equal(payload.comments_truncated, true);
    assert.match(String(payload.note), /Only the 2 threads with the newest activity are listed, of 4 pinned here/);

    const one = await pasted([long(0, MAX_PINNED_CHARS * 2)]);
    assert.equal((one.comments as unknown[]).length, 1);
    assert.equal(one.comments_truncated, false);
  });

  it("names an unnamed layer as such, so it never reads as the frame itself", async () => {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, {
      nodes: { [NODE]: { ...FRAME, children: [{ id: "158:21799", type: "RECTANGLE" }] } },
      comments: [comment("c1", { client_meta: pinnedTo("158:21799") })],
    });
    const payload = describeFigmaFrame(URL, await fetchFigmaFrame(figma, FILE, NODE));
    assert.equal((payload.comments as Array<{ layer?: string }>)[0]!.layer, "(unnamed)");
  });

  it("asks Figma for the node and the file's comments once each, or the node alone when told to", async () => {
    const figma = seeded([]);
    await fetchFigmaFrame(figma, FILE, NODE);
    assert.deepEqual(figma.calls(), [
      { method: "comments", args: [FILE, { timeoutMs: 8000, attempts: 2 }] },
      { method: "nodes", args: [FILE, [NODE], { timeoutMs: 8000 }] },
    ]);

    const textOnly = seeded([comment("c1", { client_meta: pinnedTo(NODE) })]);
    const read = await fetchFigmaFrame(textOnly, FILE, NODE, { comments: false });
    assert.deepEqual(
      textOnly.calls().map((c) => c.method),
      ["nodes"],
    );
    assert.deepEqual(describeFigmaFrame(URL, read), { ...TODAY, note: FIGMA_NOTE });
  });

  it("still fails as before when the frame itself cannot be read", async () => {
    await assert.rejects(fetchFigmaFrame(seeded([]), FILE, "9:9"), /^Error: Figma node 9:9 not found in file AbC123xyz$/);
    await assert.rejects(fetchFigmaFrame(undefined, FILE, NODE), /FIGMA_ACCESS_TOKEN not configured on the Worker/);
    const figma = seeded([]);
    figma.failNext("nodes", new FigmaRequestError(403, "Figma nodes 403: Invalid token"));
    await assert.rejects(fetchFigmaFrame(figma, FILE, NODE), { status: 403, message: "Figma nodes 403: Invalid token" });
  });

  it("pins a thread to the frame by the id the link named, when the node read leaves it out", async () => {
    const figma = createInMemoryFigma();
    const { id: _dropped, ...frameWithoutId } = FRAME;
    figma.seedFile(FILE, { nodes: { [NODE]: frameWithoutId }, comments: [comment("c1", { client_meta: pinnedTo(NODE) })] });
    const payload = describeFigmaFrame(URL, await fetchFigmaFrame(figma, FILE, NODE));
    assert.equal(payload.comment_threads, 1);
    assert.equal((payload.comments as Array<{ layer?: string }>)[0]!.layer, undefined, "the frame itself, not a layer");
  });
});
