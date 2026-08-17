import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAntecedent, needsAntecedent } from "../src/slack/antecedent";

test("a dangling pronoun asks for the window", () => {
  for (const q of ["is this still true?", "where was that decided?", "what do you make of the screenshot above"]) {
    assert.equal(needsAntecedent(q), true, q);
  }
});

// The narrowing is the feature. A question that names its subject must not pay
// a subrequest and a dozen unrelated messages.
test("a self-contained question does not", () => {
  for (const q of [
    "does the design system have a Badge component?",
    "who owns goal-setting?",
    "file a card for the new onboarding flow",
  ]) {
    assert.equal(needsAntecedent(q), false, q);
  }
});

test("the block is framed as an antecedent, not as a brief", () => {
  const block = formatAntecedent([
    { author: "<@U1>", text: "the checkout flow still hits the old endpoint" },
    { author: "<@U2>", text: "we fixed that last sprint" },
  ]);
  assert.match(block, /WHAT CAME BEFORE/);
  assert.match(block, /NOT the subject/);
  assert.match(block, /do not summarise/i);
});

test("empty input produces no block at all", () => {
  assert.equal(formatAntecedent([]), "");
  assert.equal(formatAntecedent([{ author: "<@U1>", text: "  " }]), "");
});

// Opposite rule to the thread transcript: there is no parent question here, and
// the message just before the @mention is the likely referent.
test("the char cap drops the OLDEST lines", () => {
  const lines = Array.from({ length: 12 }, (_, i) => ({ author: "<@U1>", text: `message ${i}` }));
  const block = formatAntecedent(lines, 60);
  assert.match(block, /message 11/);
  assert.doesNotMatch(block, /message 0\b/);
});
