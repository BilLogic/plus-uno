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
// Nothing below restates a column name that the contract declares, and since
// plus-uno-blueprint#671 nothing states a role key either: the contract LABELS
// what each direct-read column is for (`botDirectReadRoles`), plus the
// touchpoint projection and the findings table, so the module derives its read
// strings from those labels and this file compares them to the same labels. A
// rename is then FOLLOWED by the next sync rather than caught by a throw and
// retyped by hand — and the expectations here move with the vendored bytes,
// which is the only way they can move.
//
// What the labels cannot say is which TABLES a read spans: a role is stated per
// table, and the prose one feeds a select over five. So two of the tests below
// hold the two halves of the contract to each other — every role naming a column its
// own table declares, and the touchpoint keys a subset of the same table's list
// — the agreement `columnFromAll` and `touchpointSelectFrom` would otherwise
// only discover by refusing to let the Worker start.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROSE_COLUMN,
  POSITION_COLUMN,
  FINDINGS_TABLE,
  TOUCHPOINT_READ_KEYS,
  EDGE_SELECT_COLUMNS,
  CELL_FALLBACK_SELECT,
  selectFrom,
} from "../src/integrations/blueprint-schema";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";

const COLUMNS = BLUEPRINT_CONTRACT.botDirectReadColumns;
const ROLES = BLUEPRINT_CONTRACT.botDirectReadRoles;

/** The contract's columns for `table`, narrowed to the ones a read uses. */
function only(table: keyof typeof COLUMNS, keys: readonly string[]): string {
  return (COLUMNS[table] as readonly string[]).filter((c) => keys.includes(c)).join(",");
}

test("the edge select is the contract's cell_dependencies columns", () => {
  assert.equal(EDGE_SELECT_COLUMNS, COLUMNS.cell_dependencies.join(","));
});

test("the cells fallback select is built from the contract, embed by embed", () => {
  // Rebuilt from the same declarations the module reads, in the same order, so
  // the only thing this can disagree with is a piece still typed by hand. Each
  // structural embed reads its OWN table's name role: the contract labels
  // `slices` with `title`, so one shared spelling was right by luck.
  const expected =
    `${COLUMNS.cells.join(",")},` +
    `resources(${COLUMNS.resources.join(",")}),` +
    `lane:lanes!${BLUEPRINT_CONTRACT.fkConstraints.cellLane}(${COLUMNS.lanes.join(",")}),` +
    `step:steps(${only("steps", [ROLES.steps.name])}),` +
    `path:paths(${only("paths", [ROLES.paths.name])},` +
    `scenario:scenarios(${only("scenarios", [ROLES.scenarios.name])},` +
    `phase:phases(${only("phases", [ROLES.phases.name])})))`;
  assert.equal(CELL_FALLBACK_SELECT, expected);
});

test("every derived read string is the contract's own label", () => {
  // The point of the labels. Each of these is spelled in exactly one place —
  // the vendored contract — so an edit on the blueprint side arrives here as a
  // changed expectation rather than as a second edit someone has to remember,
  // and a piece of it retyped by hand in `blueprint-schema.ts` is a red test.
  assert.equal(PROSE_COLUMN, ROLES.cells.prose);
  assert.equal(POSITION_COLUMN, ROLES.phases.position);
  assert.equal(FINDINGS_TABLE, BLUEPRINT_CONTRACT.botFindingsTable);
  assert.deepEqual([...TOUCHPOINT_READ_KEYS], [...BLUEPRINT_CONTRACT.botTouchpointReadKeys]);
});

test("every role names a column its own table declares", () => {
  // This is what the module-load throw used to do, and all it can still do now
  // that the roles and the column list travel together: catch the app labelling
  // one thing and promising another. A red test on the branch beats a Worker
  // that will not start — and beats a 400 every call site reports to Slack as
  // "the blueprint has nothing on that".
  for (const [table, roles] of Object.entries(ROLES)) {
    const declared = COLUMNS[table as keyof typeof COLUMNS] as readonly string[];
    for (const [role, column] of Object.entries(roles as Record<string, string>)) {
      assert.ok(
        declared.includes(column),
        `botDirectReadRoles.${table}.${role} names \`${column}\`, which botDirectReadColumns.${table} does not declare`,
      );
    }
  }
  // `audit_findings` declares no role at all — a verdict keyed to cells has no
  // label, no prose and no order of its own. The empty entry is a decision
  // recorded, so the sweep above must have something to iterate for it.
  assert.ok("audit_findings" in ROLES, "every direct-read table carries a role entry, empty or not");
  assert.deepEqual(Object.keys(ROLES).sort(), Object.keys(COLUMNS).sort());
});

test("the touchpoint read keys are a subset of that table's columns", () => {
  // `touchpointSelectFrom` throws at module load when they are not; asserting
  // it here is what makes the disagreement visible on the branch instead.
  const declared = COLUMNS.touchpoints as readonly string[];
  for (const key of BLUEPRINT_CONTRACT.botTouchpointReadKeys) {
    assert.ok(declared.includes(key), `botTouchpointReadKeys names \`${key}\`, not in botDirectReadColumns.touchpoints`);
  }
  assert.ok(
    (BLUEPRINT_CONTRACT.botReadTables as readonly string[]).includes(BLUEPRINT_CONTRACT.botFindingsTable),
    "botFindingsTable is not a table botReadTables says the bot reads",
  );
});

test("the prose and position columns are declared on every table they are read from", () => {
  // The half a per-table label cannot carry: the prose column is stated on each
  // table separately, and the keyword fallback selects it on five of them. A
  // column that survives on four and is renamed on the fifth is still a 400 on
  // the fifth read.
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
