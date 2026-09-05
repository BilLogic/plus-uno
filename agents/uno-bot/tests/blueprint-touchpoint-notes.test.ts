// The touchpoint notes fire beside registry rows, and an absence beside none —
// and neither is in the always-loaded prompt (#414).
//
// What is asserted is the trigger and the content of the absence: a note told
// without rows is the prompt cost back under a new name; an absence that does
// not name what was searched is "the blueprint has nothing on that" wearing a
// registry label.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  touchpointNotes,
  touchpointAbsenceNote,
  touchpointCountNote,
  touchpointLinkNote,
  TOUCHPOINT_NOTE,
  TOUCHPOINT_NOTES,
} from "../src/tools/blueprint-touchpoint-notes";

const APP = "https://uno-blueprint.netlify.app/";

test("rows earn the registry note, and the absence note does not fire", () => {
  const notes = touchpointNotes({ words: ["zoom"], rows: 2, registryTotal: 93, appUrl: APP });
  assert.equal(notes[0], TOUCHPOINT_NOTE);
  assert.ok(notes.every((n) => !n.startsWith("No touchpoint in the registry")));
});

test("no rows earn ONLY the absence note, which names what was searched", () => {
  const notes = touchpointNotes({ words: ["zoom", "room"], rows: 0, registryTotal: 93, appUrl: APP });
  assert.equal(notes.length, 1);
  assert.match(notes[0]!, /^No touchpoint in the registry matched "zoom", "room" by name, kind or summary \(93 registry entries checked\)\./);
  assert.ok(!notes[0]!.includes(TOUCHPOINT_NOTE));
  // Absence from the REGISTRY, never from the service.
  assert.match(notes[0]!, /not proof the service has no such tool/);
});

test("an absence with no words and no count still reads as a statement about the registry", () => {
  assert.match(touchpointAbsenceNote([], undefined), /^No touchpoint in the registry came back\. That is absence from the REGISTRY/);
});

test("the registry note explains what a touchpoint is and what the registry does not cover", () => {
  assert.match(TOUCHPOINT_NOTE, /an app screen, an email, a Zoom room/);
  assert.match(TOUCHPOINT_NOTE, /placements this read does not cover/);
  // The row's `url` is the tool's own address, not a deep link — say so.
  assert.match(TOUCHPOINT_NOTE, /`url` on a row is the tool's own authored address/);
});

test("the link note points at the app root and says there is no per-touchpoint page", () => {
  const note = touchpointLinkNote(APP)!;
  assert.ok(note.includes(APP));
  assert.match(note, /no page per touchpoint/);
  // No app configured: no note, rather than a note promising a link.
  assert.equal(touchpointLinkNote(undefined), undefined);
  const notes = touchpointNotes({ words: ["zoom"], rows: 1, registryTotal: 1, appUrl: undefined });
  assert.deepEqual(notes, [TOUCHPOINT_NOTE]);
});

test("the count note fires only when the page is smaller than the registry", () => {
  assert.equal(touchpointCountNote(93, 93), undefined);
  assert.equal(touchpointCountNote(3, undefined), undefined);
  assert.match(touchpointCountNote(3, 93)!, /93 touchpoints in total; `touchpoints` shows the 3 matched/);
  const notes = touchpointNotes({ words: ["zoom"], rows: 3, registryTotal: 93, appUrl: APP });
  assert.equal(notes.length, 3);
  assert.match(notes[2]!, /use 93\./);
});

test("the sweep roster carries every note this module ships, rendered", () => {
  const names = TOUCHPOINT_NOTES.map(([name]) => name);
  assert.deepEqual(names, ["TOUCHPOINT_NOTE", "touchpointLinkNote", "touchpointCountNote", "touchpointAbsenceNote"]);
  for (const [name, text] of TOUCHPOINT_NOTES) assert.ok(text.trim(), `${name} renders empty`);
});
