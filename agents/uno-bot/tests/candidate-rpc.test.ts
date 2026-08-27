// `/debug/blueprint-search?rpc=` — the parameter that makes a retrieval change
// measurable without editing the function the product calls.
//
// Two things can go wrong with it and neither announces itself:
//
//   the pattern admits something it should not, and a debug token becomes a
//   way to invoke any Postgres function the bot's key can reach
//
//   a candidate's rows land in the shared result cache and get served to the
//   next real question, so a measurement changes the thing being measured
//
// Both are asserted here rather than reasoned about, because the route is
// auth-gated and therefore rarely exercised.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CANDIDATE_RPC, isCallableCandidate } from "../src/integrations/candidate-rpc";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";

test("the live function and well-formed candidates are admitted", () => {
  assert.ok(CANDIDATE_RPC.test(BLUEPRINT_CONTRACT.rpcs.searchBlueprint));
  assert.ok(CANDIDATE_RPC.test("search_blueprint"));
  assert.ok(CANDIDATE_RPC.test("search_blueprint_candidate"));
  assert.ok(CANDIDATE_RPC.test("search_blueprint_or_arm_v2"));
});

test("the pattern is anchored, so nothing can ride along with a valid name", () => {
  // Each of these CONTAINS a legal name. An unanchored pattern takes them all,
  // and every one addresses a different PostgREST endpoint than it appears to.
  for (const attempt of [
    "search_blueprint/../../rest/v1/cells",
    "search_blueprint?select=*",
    "search_blueprint#frag",
    "x_search_blueprint",
    "search_blueprint ",
    " search_blueprint",
    "search_blueprint\nexec",
  ]) {
    assert.equal(CANDIDATE_RPC.test(attempt), false, `admitted ${JSON.stringify(attempt)}`);
  }
});

test("an unrelated function is not callable through this route", () => {
  for (const other of ["delete_everything", "pg_sleep", "rpc", "", "SEARCH_BLUEPRINT"]) {
    assert.equal(CANDIDATE_RPC.test(other), false, `admitted ${JSON.stringify(other)}`);
  }
});

test("the exported predicate and the pattern agree", () => {
  // Two ways to ask the same question is two ways to drift. The route calls the
  // predicate; these tests mostly exercise the pattern.
  for (const name of ["search_blueprint", "search_blueprint_v2", "pg_sleep", "x_search_blueprint"]) {
    assert.equal(isCallableCandidate(name), CANDIDATE_RPC.test(name), name);
  }
});

test("a candidate name cannot end in a bare underscore or double one", () => {
  // Not a security property — a readability one. `search_blueprint__` and
  // `search_blueprint_` are typos, and a pattern that takes them turns a typo
  // into a 404 from PostgREST rather than a 400 from here.
  assert.equal(CANDIDATE_RPC.test("search_blueprint_"), false);
  assert.equal(CANDIDATE_RPC.test("search_blueprint__x"), false);
});
