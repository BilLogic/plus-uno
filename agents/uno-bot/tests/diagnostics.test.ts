// Diagnostics: the router, the envelope, the gate and the route table.
//
// The three things the module made shared are exactly the three that were
// previously re-decided in every probe body, so they are asserted once here
// rather than trusted thirteen times:
//
//   the GATE — a token-gated probe answers an unauthenticated caller with the
//   same `404 not found` the Worker entry's fall-through gave, so a closed
//   probe and an absent one stay indistinguishable
//
//   the ENVELOPE — build, duration and the subrequest accounting (ADR-022) ride
//   on every report, merged UNDER the payload so a probe that already reports
//   its own `ms`/`subrequests` from an inner meter keeps its own numbers
//
//   the TABLE — one address per probe. Two probes on one path answer as
//   whichever was declared first, which reads as a probe that silently stopped
//   existing.
//
// Driven with FAKE probes: the real bodies take an `Env` and make real calls
// through it, so there is nothing to hand them here. The real route TABLE is
// read directly, so the gate and uniqueness assertions are about the registry
// that ships, not a restatement of it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIAGNOSTIC_ROUTES, duplicateRoutes, type ProbeRoute } from "../src/diagnostics/routes";
import {
  routeProbes,
  probeFailure,
  type MeterReading,
  type Probe,
  type ProbeReport,
} from "../src/diagnostics/router";
import { debugAuthorized } from "../src/diagnostics/auth";

const TOKEN = "s3cret-debug-token";
const env: { DEBUG_TOKEN?: string } = { DEBUG_TOKEN: TOKEN };
/** A deployment with the token unset — the probes are closed, not open. */
const unconfigured: { DEBUG_TOKEN?: string } = {};

const READING: MeterReading = {
  subrequests: 7,
  subrequest_hosts: "slack.com:7",
  internal_subrequests: 2,
  budget_trips: 1,
};

/** The router's context, with a clock that advances 12ms per read. */
function ctx() {
  let t = 1_000;
  return { build: "test-build", meter: () => ({ ...READING }), now: () => (t += 12) };
}

/** A probe at a real address, answering with whatever is passed. */
function fake(route: ProbeRoute, report: ProbeReport | (() => Promise<ProbeReport>)): Probe<typeof env> {
  return {
    name: "fake",
    ...route,
    run: typeof report === "function" ? report : async () => report,
  };
}

const ROUTE_LIST = Object.values(DIAGNOSTIC_ROUTES) as ProbeRoute[];
const ask = (route: ProbeRoute, headers: Record<string, string> = {}) =>
  new Request(`https://worker.example${route.path}`, { method: route.method, headers });

test("every token-gated probe refuses an unauthenticated request with 404 not found", async () => {
  const gated = ROUTE_LIST.filter((r) => r.auth === "debug-token");
  assert.equal(gated.length, 11, "eleven /debug/* probes are registered");
  for (const route of gated) {
    const probes = [fake(route, { body: { reached: true } })];
    const res = await routeProbes(probes, ask(route), new URL(`https://w${route.path}`), env, ctx());
    assert.equal(res.status, 404, `${route.method} ${route.path} status`);
    assert.equal(await res.text(), "not found", `${route.method} ${route.path} body`);
  }
});

test("a wrong token is refused the same way, and so is an unconfigured one", async () => {
  const route = DIAGNOSTIC_ROUTES.gemini;
  const probes = [fake(route, { body: { reached: true } })];
  const url = new URL(`https://w${route.path}`);

  const wrong = await routeProbes(probes, ask(route, { "x-debug-token": "nope" }), url, env, ctx());
  assert.equal(wrong.status, 404);

  // No DEBUG_TOKEN configured means the probes are CLOSED, never
  // open-by-default — even when the caller presents the empty string.
  const unset = await routeProbes(probes, ask(route, { "x-debug-token": "" }), url, unconfigured, ctx());
  assert.equal(unset.status, 404);
  assert.equal(debugAuthorized(ask(route), unconfigured), false);
  assert.equal(debugAuthorized(ask(route, { "x-debug-token": TOKEN }), env), true);
  // Same length, different bytes — the compare runs to a verdict, not a match.
  assert.equal(debugAuthorized(ask(route, { "x-debug-token": "s3cret-debug-tokeN" }), env), false);
});

test("the public contract probe answers without a token", async () => {
  const route = DIAGNOSTIC_ROUTES["blueprint-health"];
  assert.equal(route.auth, "public");
  const res = await routeProbes(
    [fake(route, { body: { ok: true, probes: { table_cells: true } } })],
    ask(route),
    new URL(`https://w${route.path}`),
    unconfigured,
    ctx(),
  );
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json() as { probes: unknown }).probes, { table_cells: true });
});

test("an authenticated probe comes back in the shared envelope", async () => {
  const route = DIAGNOSTIC_ROUTES["gemini-cache"];
  const res = await routeProbes(
    [fake(route, { body: { ok: true, cached: true } })],
    ask(route, { "x-debug-token": TOKEN }),
    new URL(`https://w${route.path}`),
    env,
    ctx(),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.build, "test-build");
  assert.equal(body.ms, 12);
  assert.equal(body.subrequests, 7);
  assert.equal(body.subrequest_hosts, "slack.com:7");
  assert.equal(body.internal_subrequests, 2);
  assert.equal(body.budget_trips, 1);
  // The probe's own payload is untouched beside it.
  assert.equal(body.ok, true);
  assert.equal(body.cached, true);
});

test("a probe's own build/ms/subrequests win over the envelope's", async () => {
  const route = DIAGNOSTIC_ROUTES["blueprint-search"];
  const res = await routeProbes(
    [fake(route, { body: { ok: true, build: "probe-build", ms: 999, subrequests: 3, rows: [] } })],
    ask(route, { "x-debug-token": TOKEN }),
    new URL(`https://w${route.path}`),
    env,
    ctx(),
  );
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.build, "probe-build");
  assert.equal(body.ms, 999);
  assert.equal(body.subrequests, 3);
  // The fields it does NOT report still arrive.
  assert.equal(body.budget_trips, 1);
});

test("a probe's status is honoured", async () => {
  const route = DIAGNOSTIC_ROUTES["slack-stream"];
  const res = await routeProbes(
    [fake(route, { body: { ok: false, error: "channel required" }, status: 400 })],
    ask(route, { "x-debug-token": TOKEN }),
    new URL(`https://w${route.path}`),
    env,
    ctx(),
  );
  assert.equal(res.status, 400);
  assert.equal((await res.json() as { error: string }).error, "channel required");
});

test("a verbatim report passes through untouched", async () => {
  // `/debug/eval` already reports build, ms and the meter itself, and the eval
  // runner reads that shape field by field.
  const route = DIAGNOSTIC_ROUTES["turn-eval"];
  const verbatim = Response.json({ outcome: "answered", meter: { subrequests: 41 } });
  const res = await routeProbes(
    [fake(route, { verbatim })],
    ask(route, { "x-debug-token": TOKEN }),
    new URL(`https://w${route.path}`),
    env,
    ctx(),
  );
  assert.deepEqual(await res.json(), { outcome: "answered", meter: { subrequests: 41 } });
});

test("a probe that throws answers in the shared error shape, enveloped", async () => {
  const route = DIAGNOSTIC_ROUTES.blueprint;
  const res = await routeProbes(
    [fake(route, async () => { throw new Error("upstream 503"); })],
    ask(route, { "x-debug-token": TOKEN }),
    new URL(`https://w${route.path}`),
    env,
    ctx(),
  );
  assert.equal(res.status, 500);
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.ok, false);
  assert.equal(body.error, "upstream 503");
  assert.equal(body.build, "test-build");
  assert.equal(body.budget_trips, 1);
  // The same shape a probe that catches its own failure reports.
  assert.deepEqual(probeFailure(new Error("upstream 503")), { ok: false, error: "upstream 503" });
  assert.deepEqual(probeFailure("plain string"), { ok: false, error: "plain string" });
});

test("an unknown path and a wrong method both get the fall-through 404", async () => {
  const route = DIAGNOSTIC_ROUTES.home;
  const probes = [fake(route, { body: { ok: true } })];
  const auth = { "x-debug-token": TOKEN };

  const unknown = await routeProbes(
    probes,
    new Request("https://w/debug/nope", { headers: auth }),
    new URL("https://w/debug/nope"),
    env,
    ctx(),
  );
  assert.equal(unknown.status, 404);
  assert.equal(await unknown.text(), "not found");

  const wrongMethod = await routeProbes(
    probes,
    new Request(`https://w${route.path}`, { method: "POST", headers: auth }),
    new URL(`https://w${route.path}`),
    env,
    ctx(),
  );
  assert.equal(wrongMethod.status, 404);
  assert.equal(await wrongMethod.text(), "not found");
});

test("the probe table claims each address once", () => {
  assert.deepEqual(duplicateRoutes(DIAGNOSTIC_ROUTES), []);
  assert.equal(Object.keys(DIAGNOSTIC_ROUTES).length, 12, "eleven /debug/* probes + /health/blueprint");

  // The check has teeth: a second claim on one address is reported.
  assert.deepEqual(
    duplicateRoutes({
      gemini: DIAGNOSTIC_ROUTES.gemini,
      "gemini-again": { method: "GET", path: "/debug/gemini", auth: "debug-token" },
    }),
    ["GET /debug/gemini"],
  );
  // A different method on the same path is a different address, not a clash.
  assert.deepEqual(
    duplicateRoutes({
      gemini: DIAGNOSTIC_ROUTES.gemini,
      "gemini-post": { method: "POST", path: "/debug/gemini", auth: "debug-token" },
    }),
    [],
  );
});

test("the contract paths CI and the eval runners read are still the registered ones", () => {
  // These strings live in scripts, workflows and fixtures. A rename here is a
  // rename of somebody else's green build.
  const addresses = ROUTE_LIST.map((r) => `${r.method} ${r.path}`);
  for (const expected of [
    "GET /health/blueprint",
    "POST /debug/eval",
    "GET /debug/blueprint-search",
    "GET /debug/blueprint-subject",
    "GET /debug/gemini",
    "GET /debug/gemini-cache",
    "GET /debug/slack-search",
    "GET /debug/figma-poll",
  ]) {
    assert.ok(addresses.includes(expected), `${expected} is registered`);
  }
});
