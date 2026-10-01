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
  FIGMA_NOTE,
  FIGMA_TRUNCATION_NOTE,
  MAX_TEXT_LAYERS,
  type FigmaNode,
} from "../src/integrations/figma-reading";
import { fetchFigmaImagePngUrl, fetchFigmaNode } from "../src/integrations/figma";
import { FigmaRequestError } from "../src/figma/client";
import { createInMemoryFigma } from "../src/figma/in-memory";
import { createFigmaRestClient } from "../src/figma/rest";


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
