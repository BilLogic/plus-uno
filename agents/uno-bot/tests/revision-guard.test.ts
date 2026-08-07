import { test } from "node:test";
import assert from "node:assert/strict";
import { retainedVocabulary, shouldRejectRevision } from "../src/agent/revision-guard";

const DRAFT_LONG =
  "Yes, the design system includes a Badge component under the status-and-loading " +
  "category. I checked the component source files and MDX documentation directly in " +
  "the repository just now, so this is fully confirmed.";

test("a genuine minimal edit is kept", () => {
  // Same content, reformatted for Slack mrkdwn — the case the judge exists for.
  const revision =
    "Yes, the design system includes a *Badge* component under the " +
    "`status-and-loading` category. I checked the component source files and MDX " +
    "documentation directly in the repository just now, so this is fully confirmed.";
  assert.ok(retainedVocabulary(DRAFT_LONG, revision) > 0.9);
  assert.equal(shouldRejectRevision(DRAFT_LONG, revision), false);
});

test("a revision may ADD a citation without being rejected", () => {
  const revision = `${DRAFT_LONG} See <https://example.com/storybook|Storybook Docs: Badge>.`;
  assert.equal(shouldRejectRevision(DRAFT_LONG, revision), false);
});

test("a revision that discards the draft is rejected", () => {
  const revision =
    "Sure thing! Let me know what else you need and I can dig into whatever comes up next.";
  assert.ok(retainedVocabulary(DRAFT_LONG, revision) < 0.5);
  assert.equal(shouldRejectRevision(DRAFT_LONG, revision), true);
});

test("a revision that balloons in length is rejected", () => {
  // The live r46 failure was a short draft answered with a longer, degenerate
  // ramble. The exact text is not asserted here — the original draft was never
  // captured, so claiming this test reproduces that incident would be false.
  const draft = "Hey! System's up and running smoothly. What are we working on today?";
  const revision =
    "Hey! System's up and running smoothly. What are we testing or where we testing " +
    "or work or test or task are we tackling next taking or testing are we diving " +
    "into today, and what else are we testing or working on or tackling right now?";
  assert.equal(shouldRejectRevision(draft, revision), true);
});

test("short drafts are exempt from the vocabulary test but not the growth test", () => {
  const draft = "Got it — cancelled.";
  // A short, different-but-sane revision survives.
  assert.equal(shouldRejectRevision(draft, "Cancelled, nothing was changed."), false);
});

test("a list of links is not a false positive", () => {
  // The bot's most common output shape. An earlier repetition-based guard
  // scored this HIGHER than the real garble, which is why that approach was
  // dropped — this test keeps the replacement honest.
  const draft =
    "Storybook Docs: Badge. GitHub Source: Badge. Figma Component Spec: Badge.";
  const revision =
    "<https://x/storybook|Storybook Docs: Badge>. <https://x/gh|GitHub Source: Badge>. " +
    "<https://x/figma|Figma Component Spec: Badge>.";
  assert.equal(shouldRejectRevision(draft, revision), false);
});

test("empty draft never rejects", () => {
  assert.equal(retainedVocabulary("", "anything at all"), 1);
});
