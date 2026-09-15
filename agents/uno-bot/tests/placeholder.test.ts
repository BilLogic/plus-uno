// What the placeholder guard refuses, and what it must not.
//
// The cases that matter are the two directions of the same mistake: a decision
// record whose body honestly says flows are "parked in Figma under TBD" was
// refused by the old word list (2026-09-15), and a field that is genuinely an
// unfilled slot must still never be filed. Every case drives the detector
// through its public entry and reads the refusal a person would.
import { test } from "node:test";
import assert from "node:assert/strict";

import { placeholderRefusal } from "../src/agent/placeholder";

const decision = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  surface: "decision",
  title: "Calendar Sync scope cut",
  ...over,
});

// ── real content that merely says the word ───────────────────────────────────

test("a decision body that mentions TBD in a sentence is filed, not refused", () => {
  const refusal = placeholderRefusal(
    "notion_create",
    decision({
      summary: "Scope cut to the one-way sync; the remaining flows are parked in Figma under TBD.",
      sections: [{ heading: "Why", body: "The TBD frames stay out of scope until Q4." }],
    }),
  );

  assert.equal(refusal, null);
});

test("a token named in quotes or a code span is content, not a slot", () => {
  const refusal = placeholderRefusal(
    "notion_create",
    decision({
      summary: 'The board column is literally called "TBD", and the template ships `[TBD]` in it.',
    }),
  );

  assert.equal(refusal, null);
});

test("markdown links and checkboxes are not template slots", () => {
  const refusal = placeholderRefusal(
    "notion_create",
    decision({
      summary: "See [TBD](https://notion.so/tbd-board) for the parked frames.",
      sections: [{ heading: "Next", body: "- [ ] confirm with Max\n- [x] file the cut" }],
    }),
  );

  assert.equal(refusal, null);
});

// ── genuinely unfilled ───────────────────────────────────────────────────────

test("a field that is nothing but the token is refused, named with its field and text", () => {
  const refusal = placeholderRefusal(
    "notion_create",
    decision({ summary: "TBD", sections: [{ heading: "Why", body: "The one-way sync shipped." }] }),
  );

  assert.ok(refusal, "a bare token is refused");
  assert.match(refusal, /decision record/);
  assert.match(refusal, /\*summary\*/);
  assert.match(refusal, /`TBD`/);
  // Never "a card": the surface is named as the person asked for it.
  assert.doesNotMatch(refusal, /\ba card\b/);
});

test("a bracketed slot is refused and named by the section it sits in", () => {
  const refusal = placeholderRefusal(
    "notion_create",
    decision({
      summary: "The scope change, recorded.",
      sections: [{ heading: "Decision", body: "[TBD]" }],
    }),
  );

  assert.ok(refusal, "an unfilled slot is refused");
  assert.match(refusal, /\*Decision section\*/);
  assert.match(refusal, /`\[TBD\]`/);
});

test("templated slots — mustache, angle brackets, a fill-in rule — are refused", () => {
  for (const [body, matched] of [
    ["Owner: {{owner}}", "{{owner}}"],
    ["Owner: <fill in the DRI>", "<fill in the DRI>"],
    ["Owner: ______", "______"],
  ] as const) {
    const refusal = placeholderRefusal(
      "notion_create",
      decision({ summary: "The scope change, recorded.", sections: [{ heading: "Owner", body }] }),
    );
    assert.ok(refusal, `${body} is refused`);
    assert.ok(refusal.includes(`\`${matched}\``), `${matched} is named back: ${refusal}`);
  }
});

test("a required field left empty is refused before anything else is scanned", () => {
  const refusal = placeholderRefusal("notion_create", { surface: "prd", title: "   " });

  assert.ok(refusal, "an empty title is refused");
  assert.match(refusal, /PRD/);
  assert.match(refusal, /\*title\*/);
});

// ── the rules' edges ─────────────────────────────────────────────────────────

test("a slot the call's own source text already carries is the source's wording", () => {
  const refusal = placeholderRefusal(
    "notion_create",
    decision({
      summary: "Reconciling the hub TLDR.",
      sections: [{ heading: "Old TLDR", body: "Two-way sync, dates [TBD]" }],
      source_text: "Two-way sync, dates [TBD]",
    }),
  );

  assert.equal(refusal, null);
});

test("surfaces the guard does not cover are left alone", () => {
  assert.equal(placeholderRefusal("notion_update", { append: { sections: [{ body: "[TBD]" }] } }), null);
  assert.equal(placeholderRefusal("shareout_post", { summary: "TBD" }), null);
});
