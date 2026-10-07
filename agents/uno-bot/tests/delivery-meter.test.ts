// The meter's delivery label: a Slack delivery call made while a lookup's
// limit is active is not that lookup's spend. It does not count toward the
// lookup ceiling, cannot be refused by it, and never bumps the trip count that
// marks the lookup's result partial — but it is still an external subrequest,
// so it counts toward the invocation total and the real cap still refuses it.
import assert from "node:assert/strict";
import test from "node:test";

import { SUBREQUEST_CAP } from "../src/agent/loop-policy";
import {
  asDelivery,
  countedFetch,
  isSubrequestBudgetError,
  runMetered,
  subrequestBudgetTrips,
  subrequestsUsed,
  withSubrequestLimit,
} from "../src/net";

const call = (tag: string) => countedFetch(`data:text/plain,${tag}`);

test("a delivery call inside a lookup's limit is not refused by it and does not trip it", async () => {
  await runMetered(async () => {
    await withSubrequestLimit(2, async () => {
      await call("lookup-1");
      await call("lookup-2");
      // The lookup is at its limit; a card update fired now is delivery's spend.
      await asDelivery(() => call("card"));
      assert.equal(subrequestBudgetTrips(), 0);
    });
    // Still a real subrequest against the invocation's total.
    assert.equal(subrequestsUsed(), 3);
  });
});

test("a delivery call does not use up the lookup's remaining limit", async () => {
  await runMetered(async () => {
    await withSubrequestLimit(2, async () => {
      await call("lookup-1");
      await asDelivery(() => call("card"));
      // Without the label the card would have taken the lookup's last call.
      await call("lookup-2");
      assert.equal(subrequestBudgetTrips(), 0);
      await assert.rejects(call("lookup-3"), isSubrequestBudgetError);
    });
    assert.equal(subrequestsUsed(), 3);
  });
});

test("the real cap still refuses a delivery call, without marking a lookup partial", async () => {
  await runMetered(async () => {
    for (let i = 0; i < SUBREQUEST_CAP; i++) await call(`spent-${i}`);
    await withSubrequestLimit(10, async () => {
      await assert.rejects(asDelivery(() => call("card")), isSubrequestBudgetError);
    });
    await assert.rejects(asDelivery(() => call("answer")), isSubrequestBudgetError);
    assert.equal(subrequestBudgetTrips(), 0);
    assert.equal(subrequestsUsed(), SUBREQUEST_CAP);
  });
});

test("the label is scoped to its call: a lookup call after it is metered as before", async () => {
  await runMetered(async () => {
    await withSubrequestLimit(1, async () => {
      await asDelivery(() => call("card"));
      await call("lookup-1");
      await assert.rejects(call("lookup-2"), isSubrequestBudgetError);
      assert.equal(subrequestBudgetTrips(), 1);
    });
  });
});

test("a fire-and-forget delivery call keeps its label while the lookup runs on", async () => {
  await runMetered(async () => {
    await withSubrequestLimit(1, async () => {
      // The adapter fires card updates with `void`, from inside the lookup.
      const card = asDelivery(() => call("card"));
      await call("lookup-1");
      await card;
      assert.equal(subrequestBudgetTrips(), 0);
    });
    assert.equal(subrequestsUsed(), 2);
  });
});

test("outside a metered invocation a delivery call is a plain call", async () => {
  await asDelivery(() => call("card"));
  assert.equal(subrequestsUsed(), 0);
});
