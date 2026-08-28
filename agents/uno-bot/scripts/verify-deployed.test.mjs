/**
 * The deploy's "is my build actually serving?" check.
 *
 * #278: this Worker has TWO deployers. The gated GitHub Actions workflow runs
 * typecheck, check:fetch, check:contract, test:bundle and bundle:harness before
 * shipping; Cloudflare Workers Builds also builds this repo and deploys on its
 * own, from a command that lives in the Cloudflare dashboard and cannot be read
 * from here.
 *
 * Measured 2026-08-28 on 50782f79: the Actions run deployed r131-50782f7 and
 * its health check confirmed it at 17:20:45. Thirty-six seconds later /health
 * turned over and STAYED there — 24 consecutive samples across six minutes,
 * with the Actions run green the whole time. It read `dev` then, because that
 * was still the no-define fallback; the same bundle reports `unstamped` after
 * the src/version.ts change that came with this work.
 *
 * That is the hole this closes. The old check exited 0 on the FIRST correct
 * answer, which is a claim about a moment, not about the deploy: whatever lands
 * afterwards replaces it silently and the run still reports success. So the
 * check now CONVERGES and then HOLDS, and a stamp that leaves ours during the
 * hold fails the run.
 *
 * Dependency-free and injectable — no network, no real clock. A check that can
 * only be exercised by deploying is a check nobody exercises.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { holdSamples, verifyDeployed } from "./verify-deployed.mjs";

const OURS = "uno-bot ok r131-50782f7";
const THEIRS = "uno-bot ok unstamped";
const LOCAL = "uno-bot ok dev";
const CF = "uno-bot ok cfa1b2c3d4-50782f7";

/**
 * A fake worker that answers each element of `script` in turn, repeating the
 * last one forever. `sleep` resolves immediately, so a 150-second hold costs
 * nothing to test.
 */
function fake(script) {
  const seen = [];
  let i = 0;
  return {
    seen,
    opts: {
      expected: "r131-50782f7",
      url: "https://example.invalid/health",
      convergeAttempts: 5,
      holdAttempts: 4,
      intervalMs: 5000,
      sleep: async () => {},
      log: () => {},
      fetchImpl: async () => {
        const body = script[Math.min(i, script.length - 1)];
        i += 1;
        seen.push(body);
        if (body === null) throw new Error("network down");
        return { ok: true, text: async () => body };
      },
    },
  };
}

test("a build that converges and stays put passes", async () => {
  const f = fake([THEIRS, OURS]);
  const result = await verifyDeployed(f.opts);
  assert.equal(result.ok, true);
});

test("a build that never appears fails, and says what was serving instead", async () => {
  const f = fake([THEIRS]);
  const result = await verifyDeployed(f.opts);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "never-served");
  assert.equal(result.serving, THEIRS);
});

test("a build that is overwritten AFTER converging fails — the #278 case", async () => {
  // Green-then-clobbered. The old check exited 0 at the second sample here and
  // never looked again, which is exactly what happened on 50782f79.
  const f = fake([OURS, OURS, THEIRS]);
  const result = await verifyDeployed(f.opts);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "overwritten");
  assert.equal(result.serving, THEIRS);
});

test("the overwrite has to be caught late, not just on the next sample", async () => {
  // The observed gap was ~36s against a 5s interval. A hold that only checked
  // once would have passed this.
  const f = fake([OURS, OURS, OURS, OURS, THEIRS]);
  const result = await verifyDeployed({ ...f.opts, holdAttempts: 6 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "overwritten");
});

test("`unstamped` is diagnosed as a deploy that never ran deploy.mjs", async () => {
  // The distinction #278 turns on. `unstamped` can only come from the `typeof`
  // fallback in src/version.ts, which means no --define reached the bundle.
  const f = fake([OURS, THEIRS]);
  const result = await verifyDeployed(f.opts);
  assert.match(result.diagnosis, /did\s+NOT run/i);
  assert.match(result.diagnosis, /ungated/);
  assert.match(result.diagnosis, /#278/);
});

test("`dev` is diagnosed as the OPPOSITE — deploy.mjs ran, off CI", async () => {
  // Before #278 these were the same string, so a Worker reporting it could mean
  // "someone deployed from a laptop" or "production is ungated". One of those
  // is an incident.
  const f = fake([OURS, LOCAL]);
  const result = await verifyDeployed(f.opts);
  assert.match(result.diagnosis, /DID run/);
  assert.doesNotMatch(result.diagnosis, /ungated/);
});

test("a `cf` stamp is diagnosed as Workers Builds, which is a different problem", async () => {
  // Named separately on purpose: `cf…` means the other CI DID run the gates,
  // so the fix is picking one deployer. `unstamped` means production is ungated.
  const f = fake([OURS, CF]);
  const result = await verifyDeployed(f.opts);
  assert.equal(result.reason, "overwritten");
  assert.match(result.diagnosis, /Workers Builds/);
  assert.match(result.diagnosis, /DID run the gates/);
  // It must not make the `dev` claim. Phrasing it as "not ungated" is fine —
  // asserting on the bare word would have failed that, which is why this
  // pins the claim rather than the vocabulary.
  assert.doesNotMatch(result.diagnosis, /Production is ungated/);
});

test("a transient network error during convergence is not a failure", async () => {
  // Edge reads fail. Only a definite wrong answer counts.
  const f = fake([null, null, OURS]);
  const result = await verifyDeployed(f.opts);
  assert.equal(result.ok, true);
});

test("a network error during the HOLD does not invent an overwrite", async () => {
  // The dangerous inversion: treating an unreachable worker as "something else
  // is serving" would fail deploys for a blip on Cloudflare's side.
  const f = fake([OURS, null, null, OURS]);
  const result = await verifyDeployed(f.opts);
  assert.equal(result.ok, true);
});

test("holdAttempts: 0 restores the old first-answer-wins behaviour", async () => {
  // The escape hatch, so the hold can be turned off from the workflow without
  // a code change if it ever becomes the thing standing between a fix and
  // production. It must be a deliberate 0, never the default.
  const f = fake([OURS, THEIRS]);
  const result = await verifyDeployed({ ...f.opts, holdAttempts: 0 });
  assert.equal(result.ok, true);
});

test("it actually waits between samples, rather than spinning", async () => {
  const waits = [];
  const f = fake([THEIRS, OURS]);
  await verifyDeployed({ ...f.opts, sleep: async (ms) => waits.push(ms) });
  assert.ok(waits.length >= 2, `expected repeated waits, got ${waits.length}`);
  for (const ms of waits) assert.equal(ms, 5000);
});

test("a non-200 response is treated as unreachable, not as a wrong build", async () => {
  let n = 0;
  const result = await verifyDeployed({
    ...fake([OURS]).opts,
    fetchImpl: async () => {
      n += 1;
      if (n < 3) return { ok: false, status: 503, text: async () => "error" };
      return { ok: true, text: async () => OURS };
    },
  });
  assert.equal(result.ok, true);
});

test("every read is bounded — a hung edge counts as unreachable, not as a stall", () => {
  // Regression guard for the rewrite: the bash loop this replaced used
  // `curl --max-time 15`. Without an equivalent, a connection that is accepted
  // and never answered hangs the step until GitHub's six-hour job limit.
  let saw = null;
  return verifyDeployed({
    ...fake([OURS]).opts,
    timeoutMs: 15000,
    fetchImpl: async (_url, init) => {
      saw = init;
      return { ok: true, text: async () => OURS };
    },
  }).then(() => {
    assert.ok(saw?.signal, "no AbortSignal was passed to fetch");
    assert.equal(typeof saw.signal.aborted, "boolean");
  });
});

/* --------------------------------------------- how long the hold is asked for */

test("an UNSET repo variable arrives as an empty string, and must not read as 0", () => {
  // The case that bites. `Number("")` is 0, which would silently disable the
  // hold on every deploy — the behaviour this module exists to remove, restored
  // with no error and no log line saying so.
  assert.equal(holdSamples(""), 30);
  assert.equal(holdSamples("   "), 30);
  assert.equal(holdSamples(undefined), 30);
  assert.equal(holdSamples(null), 30);
});

test("an explicit 0 disables the hold — deliberately, never by default", () => {
  assert.equal(holdSamples("0"), 0);
});

test("a usable number is taken at face value", () => {
  assert.equal(holdSamples("12"), 12);
  assert.equal(holdSamples("12", 99), 12);
});

test("junk is rejected rather than coerced, so the caller can refuse to run", () => {
  for (const raw of ["abc", "-1", "3.5", "1e3x", "NaN"]) {
    assert.equal(holdSamples(raw), null, `expected ${JSON.stringify(raw)} to be rejected`);
  }
});
