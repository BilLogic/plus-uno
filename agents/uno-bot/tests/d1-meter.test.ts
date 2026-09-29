// The meter's D1 query counter: every D1 query is counted against its own
// per-invocation cap (Cloudflare's Free plan allows 50), charged to the internal
// bucket beside Durable Object hops and KV, and refused past the cap exactly as
// an external call past the subrequest limit is.
import assert from "node:assert/strict";
import test from "node:test";

import {
  D1_QUERY_CAP,
  chargeD1Query,
  d1QueriesUsed,
  internalSubrequestsUsed,
  isSubrequestBudgetError,
  meterBreakdown,
  runMetered,
  subrequestBudgetTrips,
  subrequestsUsed,
} from "../src/net";

test("the cap sits below the Free plan's 50 queries per invocation", () => {
  assert.ok(D1_QUERY_CAP < 50);
  assert.ok(D1_QUERY_CAP > 0);
});

test("a D1 query is counted, and charged to the internal bucket, not the external one", async () => {
  await runMetered(async () => {
    chargeD1Query();
    chargeD1Query();
    assert.equal(d1QueriesUsed(), 2);
    assert.equal(internalSubrequestsUsed(), 2);
    assert.equal(subrequestsUsed(), 0);
    assert.match(meterBreakdown(), /internal d1:2/);
  });
});

test("the query past the cap is refused as a budget stop, and counted as a trip", async () => {
  await runMetered(async () => {
    for (let i = 0; i < D1_QUERY_CAP; i++) chargeD1Query();
    const tripsBefore = subrequestBudgetTrips();
    assert.throws(
      () => chargeD1Query(),
      (err: unknown) => isSubrequestBudgetError(err) && /D1 query budget/.test(String(err)),
    );
    assert.equal(subrequestBudgetTrips(), tripsBefore + 1);
    // The refused query was never spent.
    assert.equal(d1QueriesUsed(), D1_QUERY_CAP);
  });
});

test("outside a metered invocation a D1 query is free and never refused", () => {
  for (let i = 0; i < D1_QUERY_CAP + 5; i++) chargeD1Query();
  assert.equal(d1QueriesUsed(), 0);
});
