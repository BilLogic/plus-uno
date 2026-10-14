import { test } from "node:test";
import assert from "node:assert/strict";
import { readReference, referenceStub } from "../src/tools/read-reference";
import { REFERENCES } from "../src/generated/references";
import { sweepCardInstruction } from "../src/sweep/cards";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// read_reference is a pure function over a map baked at build time (#423): no
// fetch, no subrequest, nothing that can fail on a cold start. These tests hand
// it a map of their own so they assert the contract, and one test reads the
// real baked map so the tracer — the draft-a-prd bot skill — is proven
// reachable under the name its pointer line gives it.

const MAP = {
  "draft-a-prd": "# Draft a PRD\n\nIngest → ground → draft → stage.",
  "docs/connectors/notion": "# Notion\n\nCards live in the Roadmap DB.",
};

test("a known name returns the document text", () => {
  const out = JSON.parse(readReference({ name: "draft-a-prd" }, MAP));
  assert.equal(out.ok, true);
  assert.equal(out.name, "draft-a-prd");
  assert.equal(out.text, MAP["draft-a-prd"]);
});

test("an unknown name lists the names the map knows", () => {
  const out = JSON.parse(readReference({ name: "draft-a-prds" }, MAP));
  assert.equal(out.ok, false);
  assert.match(out.error, /draft-a-prds/);
  assert.deepEqual(out.known, ["docs/connectors/notion", "draft-a-prd"]);
});

test("a missing or blank name is refused with the known names, never thrown", () => {
  for (const input of [{}, { name: "" }, { name: 3 }, { name: "   " }]) {
    const out = JSON.parse(readReference(input as Record<string, unknown>, MAP));
    assert.equal(out.ok, false);
    assert.deepEqual(out.known, ["docs/connectors/notion", "draft-a-prd"]);
  }
});

test("a name is matched exactly, after trimming, and never by prefix", () => {
  assert.equal(JSON.parse(readReference({ name: " draft-a-prd " }, MAP)).ok, true);
  assert.equal(JSON.parse(readReference({ name: "draft-a" }, MAP)).ok, false);
  assert.equal(JSON.parse(readReference({ name: "prd" }, MAP)).ok, false);
});

test("the baked map serves the draft-a-prd bot skill under its folder's name", () => {
  const out = JSON.parse(readReference({ name: "draft-a-prd" }, REFERENCES));
  assert.equal(out.ok, true);
  assert.match(out.text, /^# Draft a PRD/, "the body ships frontmatter-stripped");
  assert.match(out.text, /## Exit/, "the whole skill, its exits included");
});

test("the default map is the baked one", () => {
  assert.equal(JSON.parse(readReference({ name: "draft-a-prd" })).ok, true);
});

test("the stub that replaces a read at turn end names the reference on one line", () => {
  const stub = referenceStub("draft-a-prd");
  assert.equal(stub, "[reference draft-a-prd was read this turn]");
  assert.ok(!stub.includes("\n"));
});

test("the sweep card's instruction names a reference the baked map serves", () => {
  const names = [...sweepCardInstruction().matchAll(/`read_reference` `([^`]+)`/g)].map((m) => m[1] ?? "");
  assert.ok(names.length > 0, "the instruction points at the sweep's doc");
  for (const name of names) assert.equal(JSON.parse(readReference({ name })).ok, true, `${name} must be in the map`);
});

test("no tool description names the sweep doc by its old path", () => {
  const tools = readFileSync(resolve(process.cwd(), "tool-definitions.json"), "utf8");
  assert.ok(!tools.includes("slack-sweep"));
});
