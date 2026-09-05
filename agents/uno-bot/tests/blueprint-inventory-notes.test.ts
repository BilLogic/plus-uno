// The inventory notes fire beside the rows they explain, and nowhere else.
//
// #412 moved these two paragraphs out of the always-loaded guide and into the
// search_blueprint result. What is asserted here is the trigger: a note told
// on the wrong result is the old cost back under a new name, and a note never
// told is the paragraph deleted rather than moved.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inventoryNotes,
  KNOWN_SILENT_NOTE,
  CONTENT_DEPTH_NOTE,
} from "../src/tools/blueprint-inventory-notes";

test("a question after an unstructured detail earns the known-silent note", () => {
  for (const query of [
    "what script does the tutor say to the student",
    "how long does goal setting take",
    "how many students per room",
    "what is the target for attendance",
    "when does the reminder go out",
  ]) {
    assert.ok(inventoryNotes({ query, rows: 8, capped: false }).includes(KNOWN_SILENT_NOTE), query);
  }
});

test("an ordinary journey question earns no known-silent note", () => {
  const notes = inventoryNotes({ query: "who assigns unpaired students", rows: 8, capped: false });
  assert.ok(!notes.includes(KNOWN_SILENT_NOTE));
});

test("a thin, uncapped result earns the content-depth note", () => {
  for (const rows of [1, 2, 3]) {
    assert.ok(inventoryNotes({ query: "call-off", rows, capped: false }).includes(CONTENT_DEPTH_NOTE), `${rows} rows`);
  }
});

test("a full or capped result earns no content-depth note", () => {
  assert.ok(!inventoryNotes({ query: "call-off", rows: 4, capped: false }).includes(CONTENT_DEPTH_NOTE));
  assert.ok(!inventoryNotes({ query: "call-off", rows: 15, capped: false }).includes(CONTENT_DEPTH_NOTE));
  // Capped at three would be a contradiction — a cap means MORE matched.
  assert.ok(!inventoryNotes({ query: "call-off", rows: 3, capped: true }).includes(CONTENT_DEPTH_NOTE));
});

test("zero rows earn neither — the zero-row note owns that case", () => {
  assert.deepEqual(inventoryNotes({ query: "how many minutes", rows: 0, capped: false }), []);
});
