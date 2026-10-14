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
// real baked map so the tracer — uno-maintain's method — is proven reachable
// under the name its Worker face points at.

const MAP = {
  "uno-maintain/method": "# uno-maintain — method\n\nCapture → route → draft.",
  "docs/connectors/notion": "# Notion\n\nCards live in the Roadmap DB.",
};

test("a known name returns the document text", () => {
  const out = JSON.parse(readReference({ name: "uno-maintain/method" }, MAP));
  assert.equal(out.ok, true);
  assert.equal(out.name, "uno-maintain/method");
  assert.equal(out.text, MAP["uno-maintain/method"]);
});

test("an unknown name lists the names the map knows", () => {
  const out = JSON.parse(readReference({ name: "uno-maintain/methods" }, MAP));
  assert.equal(out.ok, false);
  assert.match(out.error, /uno-maintain\/methods/);
  assert.deepEqual(out.known, ["docs/connectors/notion", "uno-maintain/method"]);
});

test("a missing or blank name is refused with the known names, never thrown", () => {
  for (const input of [{}, { name: "" }, { name: 3 }, { name: "   " }]) {
    const out = JSON.parse(readReference(input as Record<string, unknown>, MAP));
    assert.equal(out.ok, false);
    assert.deepEqual(out.known, ["docs/connectors/notion", "uno-maintain/method"]);
  }
});

test("a name is matched exactly, after trimming, and never by prefix", () => {
  assert.equal(JSON.parse(readReference({ name: " uno-maintain/method " }, MAP)).ok, true);
  assert.equal(JSON.parse(readReference({ name: "uno-maintain" }, MAP)).ok, false);
  assert.equal(JSON.parse(readReference({ name: "method" }, MAP)).ok, false);
});

test("the baked map serves uno-maintain's method under the skill's name", () => {
  const out = JSON.parse(readReference({ name: "uno-maintain/method" }, REFERENCES));
  assert.equal(out.ok, true);
  assert.match(out.text, /^<!-- Shared core/, "the body ships frontmatter-stripped");
  assert.match(out.text, /## 4 · Severity classification/);
  assert.ok(out.text.length > 9_000, `the whole method, not a stub (${out.text.length} chars)`);
});

test("the default map is the baked one", () => {
  assert.equal(JSON.parse(readReference({ name: "uno-maintain/method" })).ok, true);
});

test("the stub that replaces a read at turn end names the reference on one line", () => {
  const stub = referenceStub("uno-maintain/method");
  assert.equal(stub, "[reference uno-maintain/method was read this turn]");
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
