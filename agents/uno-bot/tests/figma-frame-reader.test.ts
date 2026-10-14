// What `source_read` makes of a Figma frame beyond its text: the Dev Mode
// annotations on it and the fills it paints with, and — given `since` — what
// changed between the version saved at that date and now, in plain words.
//
// Read against one recorded frame in two versions (`helpers/figma-frame-
// fixture.ts`) over the shared in-memory Figma, so what each read asks Figma
// for is countable: the subrequests a call spends are the calls it makes.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fetchFigmaFrame } from "../src/integrations/figma";
import { describeFigmaFrame } from "../src/integrations/figma-reading";
import { createInMemoryFigma } from "../src/figma/in-memory";
import { FigmaRequestError } from "../src/figma/client";
import { FILE, FRAME_NOW, FRAME_THEN, LINK, NODE, VERSION_THEN, VERSIONS } from "./helpers/figma-frame-fixture";

function seeded() {
  const figma = createInMemoryFigma();
  figma.seedFile(FILE, { nodes: { [NODE]: FRAME_NOW }, nodesAt: { [VERSION_THEN]: { [NODE]: FRAME_THEN } }, versions: VERSIONS });
  return figma;
}

async function payloadOf(figma = seeded(), opts: Parameters<typeof fetchFigmaFrame>[3] = {}) {
  return describeFigmaFrame(LINK, await fetchFigmaFrame(figma, FILE, NODE, opts));
}

describe("a frame's annotations and fills", () => {
  it("returns each annotation with the layer it is on, its text and the properties it pins", async () => {
    const payload = await payloadOf();
    assert.deepEqual(payload.annotations, [
      { text: "Card collapses to one column below 576px", properties: ["width"] },
      { layer: "Join button", text: "Opens the **session room**; disabled until 5 min before start" },
    ]);
    assert.match(String(payload.note), /annotations/);
  });

  it("returns the visible fills, most-used first, with the layers that carry them and whether a variable binds one", async () => {
    const payload = await payloadOf();
    assert.deepEqual(payload.fills, [
      { fill: "#FFFFFF", layers: 2, on: ["Session card", "Label"] },
      { fill: "#000000", layers: 1, on: ["Title"] },
      { fill: "#16A34A", layers: 1, on: ["Join button"], variable: true },
      { fill: "#2563EB at 50%", layers: 1, on: ["Reschedule link"] },
    ]);
  });

  it("no longer tells the model fills are unread, and still says variable names and measurements are", async () => {
    const note = String((await payloadOf()).note);
    assert.doesNotMatch(note, /no fills/);
    assert.match(note, /variable/i);
    assert.match(note, /measurements/);
  });

  it("says a frame with no annotations has none, rather than leaving the field out", async () => {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { nodes: { [NODE]: { id: NODE, name: "Bare", type: "FRAME", children: [] } } });
    const payload = await payloadOf(figma);
    assert.deepEqual(payload.annotations, []);
    assert.deepEqual(payload.fills, []);
  });

  it("costs no call beyond the node read and the comments read", async () => {
    const figma = seeded();
    await payloadOf(figma);
    assert.deepEqual(figma.calls().map((c) => c.method), ["nodes", "comments"]);
  });
});

describe("what changed in a frame since a date", () => {
  const SINCE = Date.parse("2026-10-02T00:00:00Z");

  it("compares the newest version saved at or before the date with now, and says each change in plain words", async () => {
    const payload = await payloadOf(seeded(), { since: SINCE });
    assert.deepEqual(payload.changes_since, {
      since: "2026-10-02T00:00:00.000Z",
      version: { id: VERSION_THEN, label: "Handoff v1", at: "2026-10-01T18:00:00Z", by: "coco" },
    });
    assert.deepEqual(payload.changes, [
      'Resized "Session card" from 320×200 to 360×200.',
      'Annotation on "Session card" added: "Card collapses to one column below 576px".',
      'Renamed "Heading" to "Title".',
      'Text of "Title" changed from "Your session" to "Today\'s session".',
      'Fill of "Join button" changed from #2563EB to #16A34A.',
      'Annotation on "Join button" added: "Opens the **session room**; disabled until 5 min before start".',
      'Annotation on "Join button" removed: "Opens the session room".',
      'Text of "Label" changed from "Enter" to "Join".',
      'Added text "Reschedule link".',
      'Removed text "Cancel link".',
    ]);
    assert.equal(payload.change_count, 10);
    assert.match(String(payload.note), /changes_since/);
  });

  it("spends four Figma calls: the frame, its comments, one page of history and the frame at that version", async () => {
    const figma = seeded();
    await payloadOf(figma, { since: SINCE });
    const calls = figma.calls();
    assert.deepEqual(calls.map((c) => c.method), ["nodes", "comments", "versions", "nodes"]);
    assert.equal((calls[2]!.args[1] as { pageSize?: number }).pageSize, 50);
    assert.equal((calls[3]!.args[2] as { version?: string }).version, VERSION_THEN);
  });

  it("says an unchanged frame is unchanged", async () => {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { nodes: { [NODE]: FRAME_NOW }, nodesAt: { [VERSION_THEN]: { [NODE]: FRAME_NOW } }, versions: VERSIONS });
    const payload = await payloadOf(figma, { since: SINCE });
    assert.deepEqual(payload.changes, []);
    assert.equal(payload.change_count, 0);
  });

  it("says a blank-named frame is unchanged, rather than renamed to the name shown for it", async () => {
    const figma = createInMemoryFigma();
    const blank = { ...FRAME_NOW, name: "" };
    figma.seedFile(FILE, { nodes: { [NODE]: blank }, nodesAt: { [VERSION_THEN]: { [NODE]: blank } }, versions: VERSIONS });
    const read = await fetchFigmaFrame(figma, FILE, NODE, { since: SINCE });
    assert.deepEqual(read.changes?.changes, []);
    assert.match(read.name, /\S/, "the read still has a name to show");
  });

  it("says the frame is new when it did not exist in that version", async () => {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { nodes: { [NODE]: FRAME_NOW }, nodesAt: { [VERSION_THEN]: {} }, versions: VERSIONS });
    const payload = await payloadOf(figma, { since: SINCE });
    assert.deepEqual(payload.changes, ["The frame itself is new: it did not exist in that version."]);
  });

  it("says the diff is unread, not that nothing changed, when the history starts after the date", async () => {
    const payload = await payloadOf(seeded(), { since: Date.parse("2026-09-01T00:00:00Z") });
    assert.equal(payload.changes, undefined);
    assert.match(String(payload.changes_unread), /starts at 2026-09-20T10:00:00Z/);
    assert.match(String(payload.note), /never say it is unchanged/);
  });

  it("keeps the frame and says the diff is unread when Figma refuses the history", async () => {
    const figma = seeded();
    figma.failNext("versions", new FigmaRequestError(403, "Figma versions 403: Forbidden"));
    const payload = await payloadOf(figma, { since: SINCE });
    assert.equal(payload.ok, true);
    assert.equal(payload.content, "Today's session\nJoin\nReschedule");
    assert.equal(payload.changes_unread, "Figma versions 403: Forbidden");
  });

  it("pages back through a long history, three pages at most", async () => {
    const long = Array.from({ length: 160 }, (_, i) => ({
      id: `v${i}`,
      label: null,
      description: null,
      created_at: new Date(Date.parse("2026-10-13T00:00:00Z") - i * 3_600_000).toISOString(),
      user: { handle: "coco", id: "u1" },
    }));
    const reach = (index: number) => {
      const figma = createInMemoryFigma();
      figma.seedFile(FILE, { nodes: { [NODE]: FRAME_NOW }, nodesAt: { [`v${index}`]: { [NODE]: FRAME_THEN } }, versions: { versions: long } });
      return figma;
    };

    const deep = reach(120);
    const found = await payloadOf(deep, { since: Date.parse(long[120]!.created_at) });
    assert.equal((found.changes_since as { version: { id: string } }).version.id, "v120");
    assert.deepEqual(deep.calls().map((c) => c.method), ["nodes", "comments", "versions", "versions", "versions", "nodes"]);
    assert.equal((deep.calls()[3]!.args[1] as { before?: string }).before, "v49");

    const tooDeep = reach(155);
    const unread = await payloadOf(tooDeep, { since: Date.parse(long[155]!.created_at) });
    assert.match(String(unread.changes_unread), /newest 150 versions reach back only to/);
    assert.equal(tooDeep.calls().filter((c) => c.method === "versions").length, 3);
  });
});
