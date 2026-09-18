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
  // And it is not the OTHER shape an unconfigured read can take. Three of the
  // blueprint's reads answer an unconfigured deployment with an empty page
  // (`{ rows: [], total: undefined }`) rather than a throw, which is
  // indistinguishable from "the blueprint has nothing on this" — so the one
  // path a model-facing tool takes must never arrive as a served result. No
  // rows, no totals, `ok: false`.
  assert.equal(out.rows, undefined);
  assert.equal(out.retrieval, undefined);
  // The credential names are the operator's business, not the requester's:
  // this payload reaches the model, and from there a Slack reply.
  assert.doesNotMatch(JSON.stringify(out), /SUPABASE/);
  // Whatever the reason, the false-absence guard travels with it: a failure to
  // look is never evidence the subject is missing from the blueprint.
  assert.match(String(out.note), /fabricate/i);
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
