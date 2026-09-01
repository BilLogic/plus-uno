// `include` rows → the shapes fetchEdges/fetchFindings used to return.
//
// These two mappers are the seam where an optimisation could quietly become a
// behaviour change. The bot stopped making two subrequests and started reading
// the same facts out of rows the search already returned; if the mapping drifts,
// the model still gets a well-formed payload — just a wrong one. That reads in
// Slack as the blueprint having changed, not as a bug.
//
// Rows below are shaped exactly as public.search_blueprint returns them
// (verified against production 2026-08-20, RE-verified 2026-09-01).
//
// The re-verification is the point. Between those two dates 20260830190000
// renamed two payload keys — the edge why-line `label` became `name`, and
// `check_name` became `check_key` — and these fixtures kept the old spelling,
// so the mappers kept reading keys the RPC no longer sends and the tests kept
// passing. A fixture written to match the code tests nothing; it has to be
// written from the wire, and its authority is the date it was last read.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mapIncludeEdges, mapIncludeFindings } from "../src/integrations/blueprint-include";

const HIT = "a0000000-0000-4000-8000-000000040103";
const OTHER = "a0000000-0000-4000-8000-000000040903";

function edgeRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: "edge",
    id: "e1",
    title: "Edge · trigger",
    snippet: "Creates breakout rooms. --trigger--> Reminds tutors",
    description: null,
    links: {
      source_cell_id: HIT,
      target_cell_id: OTHER,
      source_content: "Creates breakout rooms.",
      target_content: "Reminds tutors to go through rooms in order.",
      kind: "sets_off",
      name: null,
    },
    updated_at: "2026-08-01T00:00:00Z",
    ...over,
  };
}

/** One mapped edge, asserting the mapper produced exactly one. */
function oneEdge(rows: Record<string, unknown>[], hits: Set<string>) {
  const out = mapIncludeEdges(rows, hits);
  assert.equal(out.length, 1, "expected exactly one mapped edge");
  return out[0]!;
}

test("an edge whose source is a matched cell points downstream", () => {
  const edge = oneEdge([edgeRow()], new Set([HIT]));
  assert.equal(edge.direction, "downstream");
  assert.equal(edge.from, "Creates breakout rooms.");
  assert.equal(edge.to, "Reminds tutors to go through rooms in order.");
  assert.equal(edge.kind, "leads_to");
});

test("an edge that only TARGETS a matched cell points upstream", () => {
  const edge = oneEdge([edgeRow()], new Set([OTHER]));
  assert.equal(edge.direction, "upstream");
});

test("`enables` is preserved and anything else falls back to `leads_to`", () => {
  // Distinct relations in the app: narrating an `enables` edge as one thing
  // leading to another misstates the blueprint, which is why this is not a
  // cosmetic default.
  const enables = oneEdge(
    [edgeRow({ links: { ...(edgeRow().links as object), kind: "enables" } })],
    new Set([HIT]),
  );
  assert.equal(enables.kind, "enables");

  const unknown = oneEdge(
    [edgeRow({ links: { ...(edgeRow().links as object), kind: "wat" } })],
    new Set([HIT]),
  );
  assert.equal(unknown.kind, "leads_to");
});

test("an edge with a missing endpoint is dropped, not half-emitted", () => {
  const rows = mapIncludeEdges(
    [edgeRow({ links: { ...(edgeRow().links as object), target_content: "" } })],
    new Set([HIT]),
  );
  assert.equal(rows.length, 0);
});

test("the edge's name and the row description join into one why-line", () => {
  const edge = oneEdge(
    [
      edgeRow({
        description: "confirmed with ops",
        links: { ...(edgeRow().links as object), name: "after roll call" },
      }),
    ],
    new Set([HIT]),
  );
  assert.equal(edge.note, "after roll call — confirmed with ops");
});

test("edges are capped at 40 so a broad query cannot balloon the payload", () => {
  const many = Array.from({ length: 60 }, () => edgeRow());
  assert.equal(mapIncludeEdges(many, new Set([HIT])).length, 40);
});

test("non-edge rows are ignored by the edge mapper", () => {
  const cell = { kind: "cell", id: "c1", title: "a cell", links: {} };
  assert.equal(mapIncludeEdges([cell, edgeRow()], new Set([HIT])).length, 1);
});

test("a finding keeps every field the model reads as its own key", () => {
  const row = {
    kind: "finding",
    id: "f1",
    title: "Finding · gap-sweep (critical, open)",
    snippet: "Front Stage Actions lane is completely unpopulated",
    links: {
      cell_ids: [HIT, OTHER],
      check_key: "gap-sweep",
      severity: "critical",
      status: "open",
      source: "audit",
    },
    updated_at: "2026-08-02T00:00:00Z",
  };
  const { rows, total } = mapIncludeFindings([row]);
  assert.equal(total, 1);
  assert.deepEqual(rows[0]!, {
    id: "f1",
    check_key: "gap-sweep",
    severity: "critical",
    status: "open",
    source: "audit",
    cell_ids: [HIT, OTHER],
    // the note travels as `snippet` on the wire and must land as `note`, which
    // is the key fetchFindings' raw rows used
    note: "Front Stage Actions lane is completely unpopulated",
    updated_at: "2026-08-02T00:00:00Z",
  });
});

test("findings total equals the row count — there is no capped page to under-count", () => {
  // fetchFindings needed count=exact because its page stopped at 20. The RPC's
  // findings branch has no LIMIT, so the returned set IS the matched set.
  const rows = Array.from({ length: 25 }, (_, i) => ({
    kind: "finding",
    id: `f${i}`,
    snippet: "x",
    links: { status: "open" },
  }));
  const { total, rows: out } = mapIncludeFindings(rows);
  assert.equal(total, 25);
  assert.equal(out.length, 25);
});
