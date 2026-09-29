// The corpus categories an ask is tagged with: the Sub-type options, the map
// from Sub-type to pain_category, the exact match a classifier's answer must
// pass, and the one-shot classification call on the `chill` tier.
import assert from "node:assert/strict";
import test from "node:test";

import { fakeProvider } from "../src/agent/providers/fake";
import {
  CLASSIFY_TIER,
  ClassifyError,
  PAIN_CATEGORY_OF_SUB_TYPE,
  classifyMaxTokens,
  SUB_TYPES,
  classifyAsks,
  painCategoryOf,
  subTypeOf,
} from "../src/usage/index";

// The map as #755 and the metric changes on #742 give it, restated here so the
// table is checked against the ticket rather than against itself.
const TICKET_MAP: [string, number][] = [
  ["Artifact location", 1],
  ["Status recap", 2],
  ["Decision recall", 2],
  ["Assignment recall", 2],
  ["Agenda/reminder", 2],
  ["Convention explainer", 3],
  ["Sync/drift", 3],
  ["Token governance", 3],
  ["Design system taxonomy", 3],
  ["Dev handoff docs", 3],
  ["Component placement", 3],
  ["Documentation standard", 3],
  ["Relay/routing", 4],
  ["Access request", 4],
  ["Institutional memory", 5],
  ["Prior-cohort work recall", 5],
  ["Repeat teaching", 5],
  ["Domain fact", 5],
  ["Tooling onboarding", 5],
  ["Design judgment", 6],
];

for (const [subType, pain] of TICKET_MAP) {
  test(`Sub-type "${subType}" is pain_category ${pain}`, () => {
    assert.equal(painCategoryOf(subTypeOf(subType), false), pain);
  });
}

test("the map covers every Sub-type option, and nothing else", () => {
  assert.deepEqual([...SUB_TYPES].sort(), TICKET_MAP.map(([s]) => s).sort());
  assert.deepEqual(Object.keys(PAIN_CATEGORY_OF_SUB_TYPE).sort(), [...SUB_TYPES].sort());
});

test("a turn that staged a card or intake is pain_category 7, whatever its Sub-type", () => {
  assert.equal(painCategoryOf("Status recap", true), 7);
  assert.equal(painCategoryOf(null, true), 7);
});

test("a blank Sub-type on an unstaged turn has no pain_category", () => {
  assert.equal(painCategoryOf(null, false), null);
});

test("a value outside the options is blank — the match is exact", () => {
  for (const raw of ["status recap", "Status Recap", "Status", "Other", "", "Sync / drift", undefined, 3, null]) {
    assert.equal(subTypeOf(raw), null, `${JSON.stringify(raw)} is not an option`);
  }
  assert.equal(subTypeOf("  Status recap\n"), "Status recap", "surrounding whitespace is not part of a value");
});

test("a batch is one chill call, and each ask gets its own answer back", async () => {
  const fake = fakeProvider({
    generateReplies: [JSON.stringify({ "1": "Artifact location", "2": "Not a sub-type", "3": "Design judgment" })],
  });
  const labels = await classifyAsks(fake, ["where is the PRD?", "lol", "does this look right?"]);
  assert.deepEqual(labels, ["Artifact location", null, "Design judgment"]);
  assert.equal(fake.generated.length, 1);
  assert.equal(fake.generated[0]!.tier, "chill");
  assert.equal(CLASSIFY_TIER, "chill");
  // Every option is offered verbatim.
  for (const s of SUB_TYPES) assert.ok(fake.generated[0]!.system!.includes(s), s);
});

test("an ask the answer leaves out is blank", async () => {
  const fake = fakeProvider({ generateReplies: ['```json\n{"2": "Status recap"}\n```'] });
  assert.deepEqual(await classifyAsks(fake, ["a", "b"]), [null, "Status recap"]);
});

test("a failed call or an unreadable answer throws, so nothing is written from it", async () => {
  await assert.rejects(classifyAsks(fakeProvider({ generateFailMessage: "429" }), ["a"]), (err: unknown) => {
    assert.ok(err instanceof ClassifyError);
    assert.equal(err.kind, "failed");
    return true;
  });
  await assert.rejects(classifyAsks(fakeProvider({ generateUnavailableMessage: "no key" }), ["a"]), /unavailable/);
});

test("an unreadable answer's error names its length, never its words", async () => {
  const reply = "I think SECRET-PHRASE is a recap";
  await assert.rejects(classifyAsks(fakeProvider({ generateReplies: [reply] }), ["a"]), (err: unknown) => {
    assert.ok(err instanceof ClassifyError);
    assert.equal(err.kind, "unreadable");
    assert.equal(err.message, `classifier unreadable: ${reply.length} chars, not a JSON object`);
    assert.ok(!err.message.includes("SECRET"));
    return true;
  });
});

test("the output ceiling leaves room for the tier's thinking", async () => {
  assert.equal(classifyMaxTokens(1), 2_048);
  assert.equal(classifyMaxTokens(20), 2_048);
  assert.equal(classifyMaxTokens(40), 2_600);
  const fake = fakeProvider({ generateReplies: ['{"1": "Domain fact"}'] });
  await classifyAsks(fake, ["a"]);
  assert.equal(fake.generated[0]!.maxTokens, 2_048);
});

test("no asks, no call", async () => {
  const fake = fakeProvider();
  assert.deepEqual(await classifyAsks(fake, []), []);
  assert.equal(fake.generated.length, 0);
});
