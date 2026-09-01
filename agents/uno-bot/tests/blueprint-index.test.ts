// The live table of contents, and the two caps that used to lie about it.
//
// Both halves of this file cover the same defect class: a result that claims to
// be whole while something clipped it. The index exists so "there is no future
// state" becomes a lookup against a listing; `truncated`/`capped_by` exist so a
// clipped listing cannot present itself as the whole blueprint.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderBlueprintIndex,
  futureStatus,
  FUTURE_STATUSES,
  INDEX_LEGEND,
  semanticCap,
  mergedCap,
} from "../src/integrations/blueprint-index";

const READ_AT = "2026-08-17";

/** Shaped like the PostgREST embed: phases → scenarios → paths. */
const LIVE = [
  {
    name: "Application",
    scenarios: [
      { name: "Discovery", paths: [{ name: "All conditions", status: "live" }] },
      {
        name: "Interview & Offer",
        paths: [
          { name: "All conditions", status: "live" },
          { name: "Clearance redesign", status: "proposed" },
        ],
      },
    ],
  },
  {
    name: "In-session",
    scenarios: [
      {
        name: "Wrap-Up",
        paths: [
          { name: "All conditions", status: "live" },
          { name: "Missed last session", status: "live" },
          { name: "Session creation", status: "planned" },
          { name: "Reflection redesign", status: "proposed" },
        ],
      },
    ],
  },
];

test("renders one line per phase, labelling each scenario's future paths", () => {
  const index = renderBlueprintIndex(LIVE, READ_AT);
  assert.deepEqual(index.phases, [
    "Application: Discovery(1), Interview & Offer(2)[proposed]",
    // Both statuses under one scenario render as a set: a scheduled change and
    // a separate exploration are different facts and must not collapse.
    "In-session: Wrap-Up(4)[proposed,planned]",
  ]);
  assert.equal(index.scale, "2 phases / 3 scenarios / 7 paths");
  assert.equal(index.legend, INDEX_LEGEND);
  assert.equal(index.readAt, READ_AT);
});

test("futureStatus accepts the domain's non-live values and nothing else", () => {
  for (const s of FUTURE_STATUSES) assert.equal(futureStatus(s), s);
  assert.equal(futureStatus("  proposed  "), "proposed");
  // `live` is current state, so it is not a marker. A missing status is `live`
  // too: the column is `not null default 'live'`, so an absent value means the
  // READ did not ask for it — and marking the whole board on that would be the
  // same false claim as marking none of it.
  for (const notFuture of ["live", "", "   ", "LIVE", "planned!", "future"]) {
    assert.equal(futureStatus(notFuture), null, JSON.stringify(notFuture));
  }
  for (const notString of [undefined, null, 0, {}, ["planned"]]) {
    assert.equal(futureStatus(notString), null, JSON.stringify(notString));
  }
});

test("the marker comes from the path's STATUS, never from its name", () => {
  // Until 2026-08-21 the marker came from a `Planned:` / `Prototype:` name
  // prefix. The convention was removed that day and this module kept matching
  // on it, so every scenario rendered clean while 6 paths were `proposed` —
  // the index answering "no future state" in the voice of a complete read.
  // A name that still looks like the old convention proves nothing now.
  const index = renderBlueprintIndex(
    [
      {
        name: "Wrap",
        scenarios: [
          {
            name: "Named like the old way",
            paths: [{ name: "Planned: Reconfirmation", status: "live" }],
          },
          {
            name: "Ordinary name, not live",
            paths: [{ name: "Under 12 hours", status: "proposed" }],
          },
        ],
      },
    ],
    READ_AT,
  );
  assert.deepEqual(index.phases, [
    "Wrap: Named like the old way(1), Ordinary name, not live(1)[proposed]",
  ]);
});

test("a path with no status reads as live, not as future", () => {
  const index = renderBlueprintIndex(
    [{ name: "Wrap", scenarios: [{ name: "Silent", paths: [{ name: "Standard" }] }] }],
    READ_AT,
  );
  assert.deepEqual(index.phases, ["Wrap: Silent(1)"]);
});

test("markers order by the domain, not by the order rows arrive", () => {
  const scenario = (paths: Array<Record<string, unknown>>) => renderBlueprintIndex(
    [{ name: "P", scenarios: [{ name: "S", paths }] }],
    READ_AT,
  ).phases[0];
  const forward = scenario([{ name: "a", status: "proposed" }, { name: "b", status: "built" }]);
  const reverse = scenario([{ name: "b", status: "built" }, { name: "a", status: "proposed" }]);
  assert.equal(forward, reverse);
  assert.equal(forward, "P: S(2)[proposed,built]");
});

test("no paths still lists the scenario, with a zero count", () => {
  // A scenario with no paths EXISTS. Dropping it would recreate the original
  // failure one level down: absence of a row read as absence of a scenario.
  const index = renderBlueprintIndex(
    [{ name: "Application", scenarios: [{ name: "Discovery", paths: [] }] }],
    READ_AT,
  );
  assert.deepEqual(index.phases, ["Application: Discovery(0)"]);
  assert.equal(index.scale, "1 phases / 1 scenarios / 0 paths");
});

test("a phase with no scenarios is listed as empty, not omitted", () => {
  const index = renderBlueprintIndex([{ name: "Offboarding" }], READ_AT);
  assert.deepEqual(index.phases, ["Offboarding: (no scenarios)"]);
  assert.equal(index.scale, "1 phases / 0 scenarios / 0 paths");
});

test("unnamed rows are skipped, and non-array input renders an empty index", () => {
  const index = renderBlueprintIndex(
    [
      { name: "", scenarios: [{ name: "Orphan", paths: [{ name: "Happy Path" }] }] },
      { name: "Kept", scenarios: [{ name: "" }, { name: "Real", paths: [{}] }] },
    ],
    READ_AT,
  );
  // The unnamed phase takes its scenarios with it — nothing under it is citable.
  assert.deepEqual(index.phases, ["Kept: Real(1)"]);
  assert.equal(index.scale, "1 phases / 1 scenarios / 1 paths");

  for (const bad of [null, undefined, {}, "rows"]) {
    const empty = renderBlueprintIndex(bad, READ_AT);
    assert.deepEqual(empty.phases, []);
    assert.equal(empty.scale, "0 phases / 0 scenarios / 0 paths");
    // Even empty, the legend ships: the caller renders a block either way and
    // an unexplained marker is worse than none.
    assert.equal(empty.legend, INDEX_LEGEND);
  }
});

test("the index names no paths — the compact form is the shipped form", () => {
  // Inlining every path name measured ~3x the payload for information the
  // count and the labels already carry. Guard it, or it grows back.
  const rendered = renderBlueprintIndex(LIVE, READ_AT).phases.join("\n");
  assert.ok(!rendered.includes("Happy Path"));
  assert.ok(!rendered.includes("Edge case"));
});

// ── the caps ─────────────────────────────────────────────────────────────────

test("a full semantic house is truncated, and says which cap did it", () => {
  // The regression: this shape reported truncated:false unconditionally while
  // the RPC was asked for at most 15 chunks — the MOST COMMON result claiming
  // completeness while clipped.
  assert.deepEqual(semanticCap(15, 15), { truncated: true, capped_by: "semantic" });
  assert.deepEqual(semanticCap(14, 15), { truncated: false, capped_by: null });
  // `>=`, not `===`: a match function that over-returns must not read as whole.
  assert.deepEqual(semanticCap(16, 15), { truncated: true, capped_by: "semantic" });
});

test("a merged result is capped only when it OVERFLOWS max_rows", () => {
  // Exactly MAX_ROWS is not truncation: every row found was returned. Off by
  // one here and every full page claims there is more, which erodes the flag
  // the same way a false negative does.
  assert.deepEqual(mergedCap(30, 30), { truncated: false, capped_by: null });
  assert.deepEqual(mergedCap(31, 30), { truncated: true, capped_by: "max_rows" });
  assert.deepEqual(mergedCap(0, 30), { truncated: false, capped_by: null });
});

test("the two caps are distinguishable — same flag, opposite advice", () => {
  // "semantic" → try DIFFERENT words; "max_rows" → try a NARROWER query. A
  // caller that only sees `truncated` cannot tell those apart.
  assert.notEqual(semanticCap(15, 15).capped_by, mergedCap(31, 30).capped_by);
});
