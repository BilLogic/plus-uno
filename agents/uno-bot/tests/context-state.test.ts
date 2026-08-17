import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildContextBlock,
  compactHistory,
  deriveState,
  detectDrift,
  renderState,
  type HistoryTurn,
} from "../src/agent/context-state";

const CONVERSATION: HistoryTurn[] = [
  { role: "user", content: "Help me draft a PRD for the new onboarding checklist." },
  { role: "assistant", content: "Sure — what does the checklist need to cover?" },
  { role: "user", content: "Keep it to three steps. Don't include the email nudge, that's a separate card." },
  { role: "assistant", content: "Drafted. (confirmed — executing the proposal) https://notion.so/onboarding-prd" },
];

test("the goal is the opening ask, verbatim", () => {
  const s = deriveState(CONVERSATION, "what's next?");
  assert.match(s.goal, /onboarding checklist/);
});

test("constraints are the person's own words, not a paraphrase", () => {
  const s = deriveState(CONVERSATION, "what's next?");
  assert.ok(s.constraints.some((c) => c.includes("three steps")), JSON.stringify(s.constraints));
  assert.ok(s.constraints.some((c) => /Don't include the email nudge/i.test(c)));
});

// The trustworthiness of the whole block rests on this: decisions come from the
// relay's own outcome notes, never from model prose.
test("decisions and artifacts come from the relay's records", () => {
  const s = deriveState(CONVERSATION, "what's next?");
  assert.ok(s.decisions.some((d) => /confirmed/i.test(d)));
  assert.deepEqual(s.artifacts, ["https://notion.so/onboarding-prd"]);
});

test("an opinion is not a constraint", () => {
  const s = deriveState(
    [{ role: "user", content: "I don't think that card is right. Can you check it?" }],
    "check it",
  );
  assert.deepEqual(s.constraints, []);
});

test("a thin conversation renders no block — a goal alone is not worth tokens", () => {
  const s = deriveState([{ role: "user", content: "hey what's up" }], "hey");
  assert.equal(renderState(s), "");
});

test("drift fires on a subject change and not on a follow-up", () => {
  const s = deriveState(CONVERSATION, "");
  assert.equal(detectDrift(s, "and who owns the design-system Badge component?").drifted, true);
  assert.equal(detectDrift(s, "can the onboarding checklist have four steps?").drifted, false);
});

test("naming a known artifact counts as continuity whatever the words are", () => {
  const s = deriveState(CONVERSATION, "");
  assert.equal(detectDrift(s, "archive https://notion.so/onboarding-prd please").drifted, false);
});

test("a drifted turn gets the note appended to the state block", () => {
  const block = buildContextBlock(CONVERSATION, "who owns the Badge component?");
  assert.match(block, /CHANGED THE SUBJECT/);
});

// The point of compaction: what is dropped is REPLACED by a count. A model
// handed a silent gap reasons across it.
test("compaction keeps the opening ask and says how much is missing", () => {
  const long: HistoryTurn[] = Array.from({ length: 40 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `turn ${i} `.repeat(40),
  }));
  const { turns, dropped } = compactHistory(long, { keepRecent: 6, maxChars: 2000 });
  assert.ok(dropped > 0);
  assert.equal(turns[0], long[0]);
  assert.match(turns[1]!.content, new RegExp(`${dropped} earlier message`));
  assert.equal(turns[turns.length - 1], long[long.length - 1]);
});

test("a short conversation is passed through untouched", () => {
  const { turns, dropped } = compactHistory(CONVERSATION, { keepRecent: 12, maxChars: 12_000 });
  assert.equal(dropped, 0);
  assert.deepEqual(turns, CONVERSATION);
});
