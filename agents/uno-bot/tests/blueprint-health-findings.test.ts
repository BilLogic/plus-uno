// `/health/blueprint` probes findings through the search, never the table.
//
// `audit_findings` refuses the anon key once 20261101130000 is applied, so a
// probe that selected it would read false and turn the public endpoint red the
// moment the migration lands — while the read the bot actually answers from,
// `search_blueprint`'s findings branch, kept working. This holds the probe to
// that read: no key for any signed-in-only relation, and an `include_findings`
// probe that asks the RPC for exactly the findings branch.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Env } from "../src/types";

/** Every request the probe sent: the path, and the body when there was one. */
const sent: Array<{ url: string; body?: string }> = [];
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  sent.push({ url: String(input), ...(typeof init?.body === "string" ? { body: init.body } : {}) });
  return Response.json([]);
}) as typeof fetch;

const ENV = { SUPABASE_URL: "https://db.example", SUPABASE_ANON_KEY: "anon" } as unknown as Env;

test("the health probe reads findings through the search's include branch, and no closed table", async () => {
  const { blueprintHealthProbe, resetBlueprintHealthCache } = await import(
    "../src/diagnostics/probes/blueprint-health.js"
  );
  const { BLUEPRINT_CONTRACT } = await import("../src/generated/blueprint-contract.js");
  resetBlueprintHealthCache();

  const url = new URL("https://w/health/blueprint");
  const res = await blueprintHealthProbe(ENV, url, new Request(url));
  const probes = (res.body as { probes: Record<string, boolean> }).probes;

  assert.equal(probes.include_findings, true);
  const closed: readonly string[] = BLUEPRINT_CONTRACT.signedInReadTables;
  for (const key of Object.keys(probes)) {
    assert.ok(!closed.some((t) => key.includes(t)), `probe ${key} names a signed-in-only relation`);
  }
  for (const { url } of sent) {
    const relation = new URL(url).pathname.replace("/rest/v1/", "");
    assert.ok(!closed.includes(relation), `the probe selected ${relation}, which the anon key is refused on`);
  }

  const rpc = `/rest/v1/rpc/${BLUEPRINT_CONTRACT.rpcs.searchBlueprint}`;
  const include = BLUEPRINT_CONTRACT.searchBlueprintParams.include;
  const findingsAsk = sent.find(
    (r) => new URL(r.url).pathname === rpc && r.body && JSON.parse(r.body)[include] !== undefined,
  );
  assert.ok(findingsAsk, "no search call asked for an include");
  assert.deepEqual(JSON.parse(findingsAsk.body!)[include], ["findings"]);
});

test("findings outside the search are a failure to look, and cost no request", async () => {
  const { findingsWithoutSearch } = await import("../src/integrations/blueprint.js");
  const before = sent.length;
  const answer = await findingsWithoutSearch(ENV, ["cell-aaa"]);
  assert.equal(answer.disposition, "failed", "a read that cannot be made is never an empty table");
  assert.deepEqual(answer.rows, []);
  assert.equal(answer.total, undefined, "no count may be claimed for findings nobody looked at");
  assert.equal(sent.length, before, "the anon key is refused on audit_findings; asking anyway is a wasted subrequest");
  assert.deepEqual(await findingsWithoutSearch(ENV, []), { rows: [], total: 0, disposition: "served" });
});
