// The touchpoint registry read (#414): its select is the contract's column
// list, its filter names live columns, and its app link is the root — because
// there is no page per touchpoint to link to.
//
// The reads these names feed do not fail loudly (see blueprint-schema.test.ts):
// a renamed column is a 400 that every call site reports as an empty result.
// Six selects rotted that way because each was a copy; this one is derived,
// and what is asserted here is that derivation, and that losing a column the
// code reads is a thrown error rather than a quiet "no touchpoint matched".
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DIRECT_READ_STRINGS,
  namesRetiredColumn,
  TOUCHPOINTS_TABLE,
  TOUCHPOINT_SELECT,
  TOUCHPOINT_READ_KEYS,
  touchpointSelectFrom,
  touchpointFilter,
  touchpointsTableIsPublic,
} from "../src/integrations/blueprint-schema";
import { appRootUrl } from "../src/integrations/blueprint-link";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";

test("the touchpoint select is the contract's column list, not a copy of it", () => {
  // Built from BLUEPRINT_CONTRACT.botDirectReadColumns.touchpoints at module
  // load. When the sync moves that list, this string moves with it — which is
  // the difference between this read and the six that rotted.
  assert.equal(TOUCHPOINT_SELECT, BLUEPRINT_CONTRACT.botDirectReadColumns.touchpoints.join(","));
  for (const key of TOUCHPOINT_READ_KEYS) {
    assert.ok(TOUCHPOINT_SELECT.split(",").includes(key), `select lacks \`${key}\`, which the read uses`);
  }
  assert.equal(namesRetiredColumn(TOUCHPOINT_SELECT), undefined);
  assert.ok(DIRECT_READ_STRINGS.includes(TOUCHPOINT_SELECT), "the select must be in the retired-name sweep");
});

test("MUTATION: a column the read uses but the contract stops declaring fails loudly", () => {
  // The contract minus `url` — the shape a blueprint-side rename produces
  // after the sync vendors it. The select must refuse to build rather than
  // ask PostgREST for a column that 400s into an empty result.
  const without = BLUEPRINT_CONTRACT.botDirectReadColumns.touchpoints.filter((c) => c !== "url");
  assert.throws(
    () => touchpointSelectFrom(without),
    /reads `url`, which the contract's botDirectReadColumns\.touchpoints does not declare/,
  );
  // And the contract as vendored builds.
  assert.doesNotThrow(() => touchpointSelectFrom(BLUEPRINT_CONTRACT.botDirectReadColumns.touchpoints));
});

test("the registry is anon-readable by the contract, and not yet a probed table", () => {
  // publicReadTables is the grant the read stands on. botReadTables is the
  // probe list the blueprint's CI checks against the DEPLOYED Worker, so the
  // table joins it one deploy after this read ships; until then index.ts
  // carries the `table_touchpoints` probe by hand. When the second assertion
  // fails, the blueprint has added the table and the hand-written probe line
  // in index.ts is a duplicate to delete.
  assert.ok(touchpointsTableIsPublic(), `${TOUCHPOINTS_TABLE} not in publicReadTables`);
  assert.ok(
    !(BLUEPRINT_CONTRACT.botReadTables as readonly string[]).includes(TOUCHPOINTS_TABLE),
    "touchpoints is in botReadTables now — drop the hand-written probe line in index.ts",
  );
});

test("the registry filter matches any word on name, kind or summary", () => {
  assert.equal(touchpointFilter(["zoom"]), "or=(name.ilike.*zoom*,kind.ilike.*zoom*,summary.ilike.*zoom*)");
  assert.match(touchpointFilter(["zoom", "room"]), /^or=\(.*name\.ilike\.\*room\*.*\)$/);
  assert.equal(namesRetiredColumn(touchpointFilter(["zoom"])), undefined);
  assert.ok(DIRECT_READ_STRINGS.some((s) => s.startsWith("or=(name.ilike")), "the filter must be in the retired-name sweep");
});

test("a registry row links to the app root, and to nothing when no app is configured", () => {
  // No per-touchpoint route exists in the app's URL layer, so the honest link
  // is the blueprint itself — never a minted `?touchpoint=` the app ignores.
  assert.equal(appRootUrl("https://uno-blueprint.netlify.app"), "https://uno-blueprint.netlify.app/");
  assert.equal(appRootUrl("https://uno-blueprint.netlify.app///"), "https://uno-blueprint.netlify.app/");
  assert.equal(appRootUrl(undefined), undefined);
  assert.equal(appRootUrl("not a url"), undefined);
  assert.ok(!("touchpoint" in BLUEPRINT_CONTRACT.urlParams), "the app grew a touchpoint route — link it instead of the root");
});
