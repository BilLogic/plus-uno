// search_blueprint's scope: tool input → contract wire names → RPC body, and
// the schema the model reads asserted against the contract it has to match.
//
// Two promises are tested separately because they failed separately. A NAME
// the contract declares can be sent and silently ignored if the spelling
// drifts — so the body builder is checked against the contract's wire names,
// never a literal. A VALUE the contract lists can still be refused by the
// function body (the layers→lanes rename missed the guard clause and `lane`
// was rejected for a day) — so the schema enum is checked against the
// contract's accepted list, and the production verification on #413 checks
// that list against the live RPC. Neither check can stand in for the other.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";
import {
  GRANULARITY,
  hasFilter,
  hasScope,
  isGranularity,
  matchedNote,
  scopeBody,
  scopeFromInput,
  scopeKey,
} from "../src/integrations/blueprint-scope";

const PARAM = BLUEPRINT_CONTRACT.searchBlueprintParams;

function searchTool(): { description: string; input_schema: Record<string, unknown> } {
  const defs = JSON.parse(readFileSync(resolve(process.cwd(), "tool-definitions.json"), "utf8")) as Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  const tool = defs.find((t) => t.name === BLUEPRINT_CONTRACT.rpcs.searchBlueprint);
  assert.ok(tool, "search_blueprint is not in tool-definitions.json");
  return tool;
}

// ── The body builder ─────────────────────────────────────────────────────────

test("the body is keyed by the contract's wire names and nothing else", () => {
  const body = scopeBody({
    filterPhase: "Discovery",
    filterScenario: "No-show",
    filterPathKind: "exception",
    filterLaneRole: "backstage_actions",
    granularity: "path",
  });
  assert.deepEqual(body, {
    [PARAM.filterPhase]: "Discovery",
    [PARAM.filterScenario]: "No-show",
    [PARAM.filterPathKind]: "exception",
    [PARAM.filterLaneRole]: "backstage_actions",
    // text[] on the wire — production signature, verified 2026-09-05 (#413).
    [PARAM.granularity]: ["path"],
  });
  // The names really are the wire spellings the RPC binds by.
  assert.deepEqual(Object.keys(body).sort(), [
    "filter_lane_role",
    "filter_path_kind",
    "filter_phase",
    "filter_scenario",
    "granularity",
  ]);
});

test("unset fields are omitted, not sent as null — the portal's defaults apply", () => {
  assert.deepEqual(scopeBody({}), {});
  assert.deepEqual(scopeBody({ filterPhase: "Discovery" }), { [PARAM.filterPhase]: "Discovery" });
  assert.deepEqual(scopeBody({ granularity: "cell" }), { [PARAM.granularity]: ["cell"] });
});

test("the exact-match filters enumerate the values the account lists", () => {
  // Production binds `filter_path_kind` and `filter_lane_role` with `=`
  // (verified 2026-09-05 on #413: 'Happy' and 'Customer Actions' match no
  // rows). The schema enumerates the values so the model cannot mis-case them,
  // and the enums are read back against the vendored account's catalog — the
  // one place those vocabularies are rendered from the live schema.
  const account = readFileSync(resolve(process.cwd(), "..", "..", "docs", "connectors", "supabase", "blueprint.md"), "utf8");
  const props = searchTool().input_schema.properties as Record<string, { enum?: string[] }>;
  const kinds = props[PARAM.filterPathKind]!.enum!;
  const roles = props[PARAM.filterLaneRole]!.enum!;
  assert.deepEqual(kinds, ["happy", "variant", "exception"]);
  assert.equal(roles.length, 8);
  const laneRow = account.split("\n").find((l) => l.startsWith("| `lane_role` |"));
  assert.ok(laneRow, "the account's lanes catalog has a lane_role row");
  for (const role of roles) assert.ok(laneRow!.includes(role), `${role} is a canonical lane_role in the account`);
  const kindRow = account.split("\n").find((l) => l.startsWith("| `kind` |") && l.includes("main route"));
  assert.ok(kindRow, "the account's paths catalog has a kind row");
  for (const kind of kinds) assert.ok(kindRow!.includes(kind), `${kind} is a path kind in the account`);
});

test("scopeFromInput reads the wire-named keys, trims, and drops empties", () => {
  const { scope, error } = scopeFromInput({
    query: "zoom",
    [PARAM.filterPhase]: "  Discovery ",
    [PARAM.filterScenario]: "",
    [PARAM.filterLaneRole]: "customer_actions",
    [PARAM.granularity]: "lane",
  });
  assert.equal(error, undefined);
  assert.deepEqual(scope, { filterPhase: "Discovery", filterLaneRole: "customer_actions", granularity: "lane" });
});

test("a granularity the contract does not list is an error, not a silent default", () => {
  const { error } = scopeFromInput({ [PARAM.granularity]: "layer" });
  assert.ok(error, "expected an error");
  assert.match(error, /granularity/);
  assert.match(error, /"layer"/);
  for (const rung of GRANULARITY) assert.match(error, new RegExp(`\\b${rung}\\b`));
});

test("filter-only mode needs a FILTER; a rung alone is not a scope to list", () => {
  assert.equal(hasFilter({}), false);
  assert.equal(hasFilter({ granularity: "phase" }), false);
  assert.equal(hasFilter({ filterPathKind: "exception" }), true);
  assert.equal(hasScope({ granularity: "phase" }), true);
  assert.equal(hasScope({}), false);
});

test("the cache key is empty when unscoped and distinct per scope", () => {
  assert.equal(scopeKey({}), "");
  const a = scopeKey({ filterPhase: "Discovery" });
  const b = scopeKey({ filterPhase: "Discovery", granularity: "step" });
  const c = scopeKey({ filterScenario: "Discovery" });
  assert.notEqual(a, "");
  assert.notEqual(a, b);
  assert.notEqual(a, c);
  // Order-independent: the same scope always renders the same key.
  assert.equal(
    scopeKey({ filterPhase: "A", filterScenario: "B" }),
    scopeKey({ filterScenario: "B", filterPhase: "A" }),
  );
});

// ── The result shape ─────────────────────────────────────────────────────────

test("matchedNote says the corpus-wide count beside the page, and nothing when they agree", () => {
  assert.equal(matchedNote(15, 15), undefined);
  const note = matchedNote(113, 15);
  assert.ok(note);
  assert.match(note, /^113 cells match corpus-wide; the top 15 are here\./);
  assert.match(note, /use 113/);
  assert.match(matchedNote(4, 3, "path")!, /^4 paths match/);
  assert.match(matchedNote(1, 0, "phase")!, /^1 phase match/);
});

// ── The schema the model reads ───────────────────────────────────────────────

test("the tool schema exposes the five scope parameters under the contract's names", () => {
  const props = searchTool().input_schema.properties as Record<string, { type: string; description: string }>;
  for (const key of [
    PARAM.filterPhase,
    PARAM.filterScenario,
    PARAM.filterPathKind,
    PARAM.filterLaneRole,
    PARAM.granularity,
  ]) {
    assert.ok(props[key], `schema lacks ${key}`);
    assert.equal(props[key]!.type, "string", `${key} is a string`);
    assert.ok(props[key]!.description.length > 40, `${key} is described`);
  }
});

test("the schema's granularity enum IS the contract's accepted list, in order", () => {
  const props = searchTool().input_schema.properties as Record<string, { enum?: string[] }>;
  assert.deepEqual(props[PARAM.granularity]!.enum, [...BLUEPRINT_CONTRACT.searchBlueprintGranularity.accepted]);
  assert.deepEqual([...GRANULARITY], [...BLUEPRINT_CONTRACT.searchBlueprintGranularity.accepted]);
  for (const rung of props[PARAM.granularity]!.enum!) assert.ok(isGranularity(rung), rung);
  // The rungs double as row kinds — the contract says so, and the executor
  // relies on it when it labels the count.
  assert.deepEqual([...GRANULARITY], [...BLUEPRINT_CONTRACT.searchBlueprintKinds]);
});

test("query is optional in the schema, and its description says when", () => {
  const schema = searchTool().input_schema;
  const required = (schema.required as string[] | undefined) ?? [];
  assert.ok(!required.includes("query"), "query must not be required (filter-only mode)");
  const props = schema.properties as Record<string, { description: string }>;
  assert.match(props.query!.description, /filter_\*/);
});

test("the description shed its schema vocabulary and did not grow past the pre-#413 size", () => {
  const { description } = searchTool();
  // 2,254 chars on 2026-09-05, before the five parameters were added.
  assert.ok(description.length <= 2254, `description is ${description.length} chars`);
  // Status values and the phase › scenario › path › step hierarchy now live in
  // docs/connectors/supabase/blueprint.md, which rides in the prompt.
  assert.ok(!description.includes("`at_risk`"), "status values belong to the vendored account");
  assert.ok(!description.includes("›"), "the hierarchy belongs to the vendored account");
  // What it keeps: mode selection, confidence reading, source-conflict routing.
  assert.match(description, /Use it first/);
  assert.match(description, /`matchedBy`/);
  assert.match(description, /Help Center/);
  assert.match(description, /`matched`/);
});
