// The four direct-read strings, held to what the vendored contract declares.
//
// WHY A THIRD FILE. `tests/blueprint-schema.test.ts` holds these constants to a
// hand-written retired list, and `tests/blueprint-direct-read-names.test.ts`
// sweeps the source for a name the contract does not carry ANYWHERE. Both are
// one-directional: they catch a name that is dead, not a name that MOVED. When
// the app renames `summary` to something else, the contract's
// `botDirectReadColumns` moves with the next `sync-blueprint-contract.mjs` run,
// the retired list says nothing (nobody added the old name to it), and the
// union sweep sees a column the contract no longer carries only for the strings
// whose literals it can read. This file is the other direction: each string is
// rebuilt HERE out of the contract's own declarations and compared, so a string
// that stops being a composition of the contract — a column reintroduced by
// hand, an embed widened or narrowed, a piece pinned to the wrong table — is a
// failure on the branch instead of a 400 that every call site reports to Slack
// as "the blueprint has nothing on that".
//
// Nothing below restates a column name that the contract declares. Where a
// name IS typed here it is a ROLE key — "the prose one", "the position one",
// "the named one" — because `botDirectReadColumns` is an unlabelled list per
// table and has no way to say which of `id,name,summary,position` plays which
// part. Those are asserted to be declared, which is the most the contract can
// currently carry.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROSE_COLUMN,
  POSITION_COLUMN,
  EDGE_SELECT_COLUMNS,
  CELL_FALLBACK_SELECT,
  selectFrom,
} from "../src/integrations/blueprint-schema";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";

const COLUMNS = BLUEPRINT_CONTRACT.botDirectReadColumns;

/** The contract's columns for `table`, narrowed to the ones a read uses. */
function only(table: keyof typeof COLUMNS, keys: readonly string[]): string {
  return (COLUMNS[table] as readonly string[]).filter((c) => keys.includes(c)).join(",");
}

test("the edge select is the contract's cell_dependencies columns", () => {
  assert.equal(EDGE_SELECT_COLUMNS, COLUMNS.cell_dependencies.join(","));
});

test("the cells fallback select is built from the contract, embed by embed", () => {
  // Rebuilt from the same declarations the module reads, in the same order, so
  // the only thing this can disagree with is a piece still typed by hand.
  const name = ["name"];
  const expected =
    `${COLUMNS.cells.join(",")},` +
    `resources(${COLUMNS.resources.join(",")}),` +
    `lane:lanes!${BLUEPRINT_CONTRACT.fkConstraints.cellLane}(${COLUMNS.lanes.join(",")}),` +
    `step:steps(${only("steps", name)}),` +
    `path:paths(${only("paths", name)},` +
    `scenario:scenarios(${only("scenarios", name)},` +
    `phase:phases(${only("phases", name)})))`;
  assert.equal(CELL_FALLBACK_SELECT, expected);
});

test("the prose and position columns are ones the contract declares", () => {
  // A role, not a spelling: the read asks for the prose column of every
  // structural table it selects from, and for the position column of the two
  // it orders. If the contract stops declaring either on the table the module
  // takes it from, that lookup throws at load — this says which tables are in
  // scope for the same rename.
  for (const table of ["cells", "phases", "scenarios", "paths", "touchpoints"] as const) {
    assert.ok(
      (COLUMNS[table] as readonly string[]).includes(PROSE_COLUMN),
      `botDirectReadColumns.${table} does not declare the prose column \`${PROSE_COLUMN}\``,
    );
  }
  for (const table of ["phases", "scenarios"] as const) {
    assert.ok(
      (COLUMNS[table] as readonly string[]).includes(POSITION_COLUMN),
      `botDirectReadColumns.${table} does not declare the position column \`${POSITION_COLUMN}\``,
    );
  }
});

test("a select narrows to the read's keys and keeps the contract's order", () => {
  assert.equal(selectFrom("cell_dependencies"), COLUMNS.cell_dependencies.join(","));
  assert.equal(selectFrom("steps", ["name"]), "name");
  // Reversed keys still come out in the contract's order: the caller states
  // what it reads, the contract states the spelling and the sequence.
  const reversed = [...COLUMNS.resources].reverse();
  assert.equal(selectFrom("resources", reversed), COLUMNS.resources.join(","));
});

test("a select the contract cannot back is a throw, not a 400", () => {
  assert.throws(
    () => selectFrom("steps", ["order_position"]),
    /botDirectReadColumns\.steps does not declare/,
  );
});
