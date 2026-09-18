// An unconfigured blueprint says so — it does not arrive as "unreachable".
//
// `searchBlueprint` promises one error mode of its own: the deployment has no
// Supabase credentials at all, so there is nothing to reach. The tool's catch
// names three reasons and this is the third — `subrequest_budget` for a read
// that ran out of budget, `unreachable` for anything else, which tells the
// model the source of truth exists and could not be read this turn. Letting
// this one fall through to `unreachable` would lose the only actionable
// reason: "this deployment was never wired up" is a fact about the Worker's
// config, not about the blueprint being down, and a person told "I couldn't
// reach the blueprint" goes looking for an outage that is not there.
//
// The fetch stub is a tripwire, not a transport: reporting an unconfigured
// blueprint must cost ZERO metered subrequests (ADR-022), so any outbound call
// on this path fails the test.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

globalThis.fetch = (async (input: unknown) => {
  throw new Error(`an unconfigured blueprint must not be fetched: ${String(input)}`);
}) as typeof fetch;

/** A deployment with no blueprint credentials. Nothing else is needed: the
 *  configuration test is the first thing the read does. */
const UNCONFIGURED = {} as unknown as Env;

test("searchBlueprint refuses an unconfigured deployment with its own error type", async () => {
  const { searchBlueprint, BlueprintUnavailableError } = await import("../src/integrations/blueprint.js");
  await assert.rejects(
    () => searchBlueprint(UNCONFIGURED, "how does goal setting work"),
    (e: unknown) => {
      assert.ok(
        e instanceof BlueprintUnavailableError,
        `expected BlueprintUnavailableError, got ${e instanceof Error ? e.name : typeof e}`,
      );
      return true;
    },
  );
});

test("the tool reports an unconfigured blueprint with its own reason, not `unreachable`", async () => {
  const { executeBlueprintSearch } = await import("../src/tools/blueprint-search.js");
  const out = JSON.parse(
    await executeBlueprintSearch(UNCONFIGURED, { query: "how does goal setting work" }),
  ) as Record<string, unknown>;

  assert.equal(out.ok, false);
  assert.equal(out.reason, "not_configured");
  // The distinction is the whole point: the generic reason means "the source
  // exists and the read failed", which is a different thing to tell a person.
  assert.notEqual(out.reason, "unreachable");
  assert.match(String(out.error), /not configured on this deployment/i);
  // And it is not the OTHER shape an unconfigured read can take. The rest of
  // the blueprint's reads answer an unconfigured deployment with an empty page
  // rather than a throw — which was indistinguishable from "the blueprint has
  // nothing on this" until each one started declaring
  // `disposition: "unavailable"` beside it (#606). The one path a model-facing
  // tool takes must never arrive as a served result either way: no rows, no
  // totals, `ok: false`.
  assert.equal(out.rows, undefined);
  assert.equal(out.retrieval, undefined);
  // The credential names are the operator's business, not the requester's:
  // this payload reaches the model, and from there a Slack reply.
  assert.doesNotMatch(JSON.stringify(out), /SUPABASE/);
  // Whatever the reason, the false-absence guard travels with it: a failure to
  // look is never evidence the subject is missing from the blueprint.
  assert.match(String(out.note), /fabricate/i);
});

test("the read entry puts the search FIRST, so an unconfigured deployment still throws", async () => {
  // The ORDERING, not just the shape. `not_configured` is honest only because
  // `searchBlueprint` is the first read on the tool's path and is the one that
  // throws; every other read answers instead of throwing. Cache ahead of it,
  // or let an enrichment run first, and an unconfigured deployment becomes a
  // served empty result again — which the tests above would not catch, because
  // they pin what the tool RETURNS and not the order it reads in.
  const { searchBlueprint, fetchBlueprintIndex, fetchEdges, fetchFindings, fetchSlices, fetchTouchpoints } =
    await import("../src/integrations/blueprint.js");
  const { readBlueprint, BlueprintUnavailableError } = await import(
    "../src/integrations/blueprint-read.js"
  );
  await assert.rejects(
    () =>
      readBlueprint(
        { query: "how does goal setting work", scope: {}, autoIndex: true, include: ["edges", "findings", "slices", "touchpoints"] },
        {
          search: (query, options) => searchBlueprint(UNCONFIGURED, query, options),
          index: (options) => fetchBlueprintIndex(UNCONFIGURED, options),
          edges: (cellIds) => fetchEdges(UNCONFIGURED, cellIds),
          findings: (cellIds) => fetchFindings(UNCONFIGURED, cellIds),
          slices: (query) => fetchSlices(UNCONFIGURED, query),
          touchpoints: (query) => fetchTouchpoints(UNCONFIGURED, query),
        },
      ),
    (e: unknown) => e instanceof BlueprintUnavailableError,
  );
});

test("and if the order ever moved, each enrichment read still says `unavailable`", async () => {
  // Defence in depth for the test above: the ordering is the guarantee, and
  // this is what stops a reordering from being SILENT. Every one of these
  // answers an unconfigured deployment with an empty page rather than a throw
  // — which is indistinguishable from "the blueprint has nothing on this"
  // unless the read says how it went. Now each one does.
  const { fetchBlueprintIndex, fetchEdges, fetchFindings, fetchSlices, fetchTouchpoints } =
    await import("../src/integrations/blueprint.js");
  assert.equal((await fetchBlueprintIndex(UNCONFIGURED)).disposition, "unavailable");
  assert.equal((await fetchEdges(UNCONFIGURED, ["cell-aaa"])).disposition, "unavailable");
  assert.equal((await fetchFindings(UNCONFIGURED, ["cell-aaa"])).disposition, "unavailable");
  assert.equal((await fetchSlices(UNCONFIGURED, "goal setting")).disposition, "unavailable");
  assert.equal((await fetchTouchpoints(UNCONFIGURED, "zoom")).disposition, "unavailable");
  // Zero subrequests: the tripwire at the top of this file is what asserts it.
});

test("a scope or query error still precedes the configuration report", async () => {
  // Order matters for the model's next move: a malformed call is worth
  // retrying with a fixed call, and telling it the blueprint is unconfigured
  // instead would send it off to a different (wrong) fallback.
  const { executeBlueprintSearch } = await import("../src/tools/blueprint-search.js");
  const out = JSON.parse(await executeBlueprintSearch(UNCONFIGURED, {})) as Record<string, unknown>;
  assert.equal(out.ok, false);
  assert.equal(out.reason, undefined);
  assert.match(String(out.error), /missing 'query'/);
});
