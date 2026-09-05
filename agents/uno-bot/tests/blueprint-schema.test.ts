import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROSE_COLUMN,
  POSITION_COLUMN,
  FINDINGS_TABLE,
  EDGE_SELECT_COLUMNS,
  CELL_FALLBACK_SELECT,
  DIRECT_READ_STRINGS,
  RETIRED_NAMES,
  namesRetiredColumn,
  findingsTableIsInContract,
} from "../src/integrations/blueprint-schema";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";

// The reads these names feed do not fail loudly. PostgREST answers a renamed
// column with 400 and a renamed table with 404; every call site logs a warning
// and returns an empty array, which reaches Slack as "the blueprint has nothing
// on that". So the names have to be asserted, because production will not.

test("no direct read names a column the schema retired", () => {
  for (const s of DIRECT_READ_STRINGS) {
    const dead = namesRetiredColumn(s);
    assert.equal(dead, undefined, `direct read names retired \`${dead}\`: ${s}`);
  }
});

test("the retired list matches on whole words only", () => {
  // `filter_path_type` is an RPC PARAMETER, not a column, and lived through the
  // column rename under its own name for a while. A substring match would have
  // condemned it.
  assert.equal(namesRetiredColumn("filter_path_kind"), undefined);
  assert.equal(namesRetiredColumn("descriptions"), undefined);
  assert.equal(namesRetiredColumn("id,name,description"), "description");
  assert.equal(namesRetiredColumn("order=order_position"), "order_position");
});

test("the findings table is one the contract says the bot reads", () => {
  // This is the pin. `check:contract` fails uno-bot's build when the app
  // renames a table, which rewrites botReadTables, which fails this — so the
  // rename surfaces as two red checks instead of a silent 404.
  assert.ok(findingsTableIsInContract(), `${FINDINGS_TABLE} not in botReadTables`);
  assert.ok(!BLUEPRINT_CONTRACT.botReadTables.includes("findings" as never));
});

test("the cells fallback still reads the resources embed", () => {
  // `cells.links` was dropped when one jsonb column was split three ways. The
  // embed is what keeps a links-only cell findable by the keyword fallback —
  // drop it and the "check all four before calling a topic empty" guard in
  // normalize() loses a third of what it checks.
  assert.match(CELL_FALLBACK_SELECT, /resources\(name,url,kind\)/);
  // Two FKs cells → lanes since 20260830180000; an unhinted embed is PGRST201.
  assert.match(
    CELL_FALLBACK_SELECT,
    new RegExp(`lane:lanes!${BLUEPRINT_CONTRACT.fkConstraints.cellLane}\\(`),
    "the lanes embed carries the contract's hint",
  );
  assert.equal(BLUEPRINT_CONTRACT.fkConstraints.cellLane, "cells_lane_id_fkey");
  assert.match(CELL_FALLBACK_SELECT, new RegExp(`(^|,)${PROSE_COLUMN}(,|$)`));
});

test("the edge select carries the why-line column", () => {
  assert.match(EDGE_SELECT_COLUMNS, /(^|,)name(,|$)/);
  assert.ok(!EDGE_SELECT_COLUMNS.split(",").includes("note"));
});

test("the position column is the one every table shares", () => {
  assert.equal(POSITION_COLUMN, "position");
  assert.ok(RETIRED_NAMES.includes("order_position"));
});
