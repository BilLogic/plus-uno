import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScope, SCOPES } from "../src/agent/scope-keywords";

test("a leading keyword is stripped and resolved", () => {
  const r = parseScope("ds: does Badge exist?");
  assert.equal(r?.scope.name, "ds");
  assert.equal(r?.text, "does Badge exist?");
});

test("spacing and case are tolerated", () => {
  assert.equal(parseScope("Notion : who owns goal-setting")?.scope.name, "notion");
  assert.equal(parseScope("  BLUEPRINT:how does checkout work")?.scope.name, "blueprint");
});

// The reason it is leading-only. Scanning anywhere would fire on prose and on
// every pasted URL.
test("a keyword mid-sentence is not a scope", () => {
  for (const text of [
    "check the blueprint: it's stale",
    "see https://github.com/BilLogic/plus-uno",
    "the config has a github: field in it",
  ]) {
    assert.equal(parseScope(text), null, text);
  }
});

test("a bare keyword with no question is left alone", () => {
  assert.equal(parseScope("notion:"), null);
  assert.equal(parseScope("ds:   "), null);
});

// A scope is a hint, never a filter — every instruction has to say what to do
// when the answer is not where the asker thought.
test("every scope tells the model to look elsewhere on a miss", () => {
  for (const scope of Object.values(SCOPES)) {
    assert.match(scope.instruction, /not there/i, scope.name);
  }
});

// The blueprint scope used to open "it is the record of how the service works
// TODAY", full stop — an in-prompt axiom that the board holds no future state.
// The bot repeated it at a user whose future path was sitting in the data.
test("the blueprint scope names the future-state carve-out, not a today-only axiom", () => {
  const { instruction } = SCOPES.blueprint;
  // The carve-out is spelled in `status`, not in a path-name prefix: the
  // `Planned:` / `Prototype:` convention was removed on 2026-08-21, and the
  // hint named it until #443. Both decided readings, and their confidence:
  // `planned` and `proposed` differ in it, so naming only one would leave the
  // other reported at the wrong one.
  assert.match(instruction, /`status`/);
  assert.match(instruction, /only `live` describes/);
  assert.match(instruction, /`planned` is decided and scheduled/);
  assert.match(instruction, /`proposed` is exploratory/);
  assert.doesNotMatch(instruction, /Planned:|Prototype:/);
  // The retired axiom, verbatim: an unqualified "it is" with nothing after
  // TODAY but a full stop. "most of it is …, but" is the fix, not the bug.
  assert.doesNotMatch(instruction, /blueprint — it is the record of how the service works TODAY\./);
});
