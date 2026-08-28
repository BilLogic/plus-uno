// Is the build this run deployed the build that is actually serving — and does
// it STAY that way?
//
// The old inline check exited 0 on the first correct answer. That is a claim
// about a moment, not about the deploy: this Worker HAD a second deployer, and
// whatever it shipped afterwards replaced ours silently while the run reported
// success. It was disconnected on 2026-08-28 (#278); the hold stays, because it
// is what would notice a third one, or that one coming back.
//
// Measured 2026-08-28 on 50782f79 (#278): the Actions run deployed
// r131-50782f7 and confirmed it at 17:20:45. Thirty-six seconds later /health
// turned over to `dev` and STAYED there — 24 consecutive samples across six
// minutes — with the Actions run green throughout. So the check converges and
// then HOLDS, and a stamp that leaves ours during the hold fails the run.
//
// It lives in a module rather than in the workflow's `run:` block because it is
// now logic with edge cases, and a bash loop inside a YAML string cannot be
// tested. See verify-deployed.test.mjs.

/**
 * How many samples to hold for, from the repo variable.
 *
 * Three cases, and the first is the one that bites: an UNSET GitHub repo
 * variable interpolates to the empty string, not to undefined. If that fell
 * through to `Number("")` it would be 0 — silently disabling the hold on every
 * deploy, which is the behaviour this whole module exists to remove, restored
 * with no error and no log line saying so.
 *
 * @returns {number|null} null when the value is unusable, so the caller can
 *   refuse to run rather than guess.
 */
export function holdSamples(raw, fallback = 30) {
  if (raw === undefined || raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** What a build stamp implies about the path that produced it. */
export function diagnose(serving) {
  if (/\bok unstamped\b/.test(serving)) {
    return (
      "`unstamped` means no --define reached the bundle, so scripts/deploy.mjs did " +
      "NOT run — and nothing ran typecheck, check:fetch, check:contract, test:bundle " +
      "or bundle:harness either. Production is ungated. See #278."
    );
  }
  if (/\bok dev\b/.test(serving)) {
    return (
      "`dev` means deploy.mjs DID run — so the gates ran — but outside any CI it " +
      "recognises. Most likely a deploy from a laptop; if it followed a push, the " +
      "other CI is running deploy.mjs without the variables that name it. See #278."
    );
  }
  if (/\bok cf[0-9a-f]{8}-/.test(serving)) {
    return (
      "A `cf…` stamp is Cloudflare Workers Builds going through scripts/deploy.mjs, " +
      "so that deploy DID run the gates — this is two deployers racing rather than " +
      "an ungated one. Pick one owner for production. See #278."
    );
  }
  return "Something other than this run is deploying this Worker. See #278.";
}

/**
 * Poll until `expected` is serving, then keep watching to see that it stays.
 *
 * @param {object} o
 * @param {string} o.expected           The build stamp this run deployed.
 * @param {string} o.url                The /health URL.
 * @param {number} [o.convergeAttempts] Samples to wait for our build to appear.
 * @param {number} [o.holdAttempts]     Samples to watch afterwards. 0 disables
 *                                      the hold, restoring first-answer-wins.
 * @param {number} [o.intervalMs]       Delay between samples.
 * @param {Function} [o.fetchImpl]      Injected for tests.
 * @param {Function} [o.sleep]          Injected for tests.
 * @param {Function} [o.log]
 * @returns {Promise<{ok: boolean, reason?: string, serving?: string, diagnosis?: string}>}
 */
export async function verifyDeployed({
  expected,
  url,
  convergeAttempts = 18,
  holdAttempts = 30,
  intervalMs = 5000,
  // Every read is bounded. The bash loop this replaced used `curl --max-time
  // 15`; without an equivalent, an edge that accepts the connection and never
  // answers hangs the step until GitHub's six-hour job limit instead of
  // counting as one unreachable sample.
  timeoutMs = 15000,
  fetchImpl = globalThis.fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  log = console.log,
} = {}) {
  const want = `uno-bot ok ${expected}`;

  /**
   * One sample. `null` means the read did not happen — a timeout, a 503, a
   * refused connection.
   *
   * Distinguishing that from a wrong answer is the whole point: treating an
   * unreachable Worker as "something else is serving" would fail deploys for a
   * blip on Cloudflare's side, which is a worse failure than the one being
   * caught here.
   */
  const sample = async () => {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res?.ok) return null;
      return (await res.text()).trim();
    } catch {
      return null;
    }
  };

  let last = null;
  let converged = false;
  for (let i = 0; i < convergeAttempts; i += 1) {
    await sleep(intervalMs);
    const body = await sample();
    log(`  [converge ${i + 1}] ${body ?? "(unreachable)"}`);
    if (body !== null) last = body;
    if (body === want) {
      converged = true;
      break;
    }
  }

  if (!converged) {
    return {
      ok: false,
      reason: "never-served",
      serving: last ?? "(unreachable)",
      diagnosis: last ? diagnose(last) : "The worker did not answer. See #278.",
    };
  }

  log(`worker is serving ${expected}`);
  if (holdAttempts <= 0) {
    log("hold disabled — not watching for an overwrite");
    return { ok: true };
  }

  // The hold. Every observed overwrite landed within ~40s of our deploy, so
  // this window is set well past that in the workflow rather than trimmed to
  // the measurement — a hold that only just covers the one case we have seen
  // proves nothing about the next one.
  log(`holding for ${holdAttempts} samples to see whether it stays`);
  for (let i = 0; i < holdAttempts; i += 1) {
    await sleep(intervalMs);
    const body = await sample();
    log(`  [hold ${i + 1}] ${body ?? "(unreachable)"}`);
    if (body === null || body === want) continue;
    return { ok: false, reason: "overwritten", serving: body, diagnosis: diagnose(body) };
  }

  log(`${expected} held for the whole window`);
  return { ok: true };
}
