// Properties of the blueprint share-link layer. These are the two things an
// eval cannot see: a link the model was never handed, and a breadcrumb that was
// never parsed out of the indexed title.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cellUrl,
  sliceUrl,
  parseChunkTitle,
  chunkBody,
} from "../src/integrations/blueprint-link";

const APP = "https://uno-blueprint.netlify.app";
const CELL = "a2e7ef9b-bbc3-4e2c-a5aa-238748abeca7";
const TITLE =
  "Scenario: Reporting an Issue · Path: Happy Path (happy) · Step: Reach out · Layer: Front Stage Tech";

test("cell and slice links use the app's own param names", () => {
  assert.equal(cellUrl(APP, CELL), `${APP}/?cell=${CELL}`);
  assert.equal(sliceUrl(APP, "s-1"), `${APP}/?slice=s-1`);
});

test("a trailing slash on the configured base does not double up", () => {
  assert.equal(cellUrl(`${APP}/`, CELL), `${APP}/?cell=${CELL}`);
});

test("no base, no id, or a non-http base yields no link at all", () => {
  // A URL that resolves to nothing is worse than no URL: the model presents it
  // as a citation and the reader lands nowhere.
  assert.equal(cellUrl(undefined, CELL), undefined);
  assert.equal(cellUrl("", CELL), undefined);
  assert.equal(cellUrl("uno-blueprint.netlify.app", CELL), undefined);
  assert.equal(cellUrl(APP, ""), undefined);
});

test("the indexed breadcrumb parses into scenario / path / step / layer", () => {
  assert.deepEqual(parseChunkTitle(TITLE), {
    scenario: "Reporting an Issue",
    path: "Happy Path (happy)",
    step: "Reach out",
    layer: "Front Stage Tech",
  });
});

test("unknown or malformed segments are dropped, never guessed", () => {
  assert.deepEqual(parseChunkTitle("Scenario: Warm-Up · Owner Bill · Layer:  "), {
    scenario: "Warm-Up",
  });
  assert.deepEqual(parseChunkTitle(undefined), {});
});

test("the snippet drops the breadcrumb line the chunk repeats", () => {
  assert.equal(chunkBody(`${TITLE}\nEmail`, TITLE), "Email");
  // A chunk that does not start with its title is passed through untouched.
  assert.equal(chunkBody("Email", TITLE), "Email");
});

// The corpus re-embeds over time, so BOTH title shapes are live at once. The
// old shape must keep parsing while the new one rolls in — a parser that only
// understood the new shape would blank out every field on every not-yet-
// re-embedded chunk, which is a worse bug than the one being fixed.

test("the new title shape yields every segment, phase included", () => {
  const crumb = parseChunkTitle(
    "Phase: In-session · Scenario: Wrap-Up · Path: Future (roadmap) (named) · Step: Lead tutor writes the post-session reflection · Layer: Lead Tutor",
  );
  assert.equal(crumb.phase, "In-session");
  assert.equal(crumb.scenario, "Wrap-Up");
  assert.equal(crumb.path, "Future (roadmap) (named)");
  assert.equal(crumb.step, "Lead tutor writes the post-session reflection");
  assert.equal(crumb.layer, "Lead Tutor");
});

test("the pre-0004 title shape still parses, just without a phase", () => {
  const crumb = parseChunkTitle(
    "Scenario: Goal Setting · Path: Happy Path (happy) · Step: Set goals · Layer: Regular Tutor",
  );
  assert.equal(crumb.phase, undefined);
  assert.equal(crumb.scenario, "Goal Setting");
  assert.equal(crumb.path, "Happy Path (happy)");
  assert.equal(crumb.step, "Set goals");
  assert.equal(crumb.layer, "Regular Tutor");
});

test("a step name containing a colon keeps its whole value", () => {
  const crumb = parseChunkTitle("Step: Reflection: what went well · Layer: Lead Tutor");
  assert.equal(crumb.step, "Reflection: what went well");
  assert.equal(crumb.layer, "Lead Tutor");
});

test("unknown, empty, and malformed segments are dropped, never guessed at", () => {
  const crumb = parseChunkTitle("Mood: cheerful · Scenario:  · no colon here · Layer: Visual");
  assert.equal(crumb.scenario, undefined);
  assert.equal(crumb.layer, "Visual");
  assert.deepEqual(Object.keys(crumb), ["layer"]);
});

test("missing or empty titles yield an empty breadcrumb, not a throw", () => {
  assert.deepEqual(parseChunkTitle(undefined), {});
  assert.deepEqual(parseChunkTitle(""), {});
  assert.deepEqual(parseChunkTitle("   "), {});
});
