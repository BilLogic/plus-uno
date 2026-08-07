import { test } from "node:test";
import assert from "node:assert/strict";
import { footerKindFor } from "../src/slack/footer-kind";

test("acknowledgements get no footer", () => {
  for (const ack of [
    "Got it — cancelled.",
    "Noted, thanks.",
    "Cancelled, nothing was changed.",
    "Hey — what are we working on today?",
  ]) {
    assert.equal(footerKindFor(ack), "none", ack);
  }
});

test("anything with a link is substantive", () => {
  const withLink = "Yes — see <https://plus-uno.netlify.app/storybook/|Storybook Docs: Badge>.";
  assert.equal(footerKindFor(withLink), "full");
});

test("anything with a list is substantive", () => {
  const list = "Two things:\n• the tutor shares their screen\n• the lead assigns students";
  assert.equal(footerKindFor(list), "full");
});

test("a long prose answer is substantive even with no link or list", () => {
  const long = "The tutor check-in happens in the In-session phase. ".repeat(6);
  assert.equal(footerKindFor(long), "full");
});

test("unknown / empty falls back to the footer, never to nothing", () => {
  // The failure to avoid is a factual answer with no disclaimer, so ambiguity
  // resolves toward showing it.
  assert.equal(footerKindFor(""), "full");
  assert.equal(footerKindFor("   "), "full");
});

test("a borderline short answer that cites is still substantive", () => {
  assert.equal(footerKindFor("Yes — RM-2482, see https://app.notion.com/p/x"), "full");
});
