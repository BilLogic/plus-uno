// How an eval case's deterministic scoring works — the sample rule, and the
// tool-call matcher the per-turn checks run on.
//
// Extracted from run-evals.mjs so both can be tested without a live Worker, a
// judge credential, or 58 model calls. The sample rule is one line; the reason
// it is that line is most of this file (#249).
/**
 * Does a case pass, given how many of its samples passed?
 *
 * MAJORITY, not unanimity. The old rule was `passedRuns === samples`, and the
 * header above it said so deliberately: sampling was there to make intermittent
 * drift VISIBLE rather than to average it away. The trouble is what that does
 * to a suite used as a release gate. With a per-run flake probability p, a
 * 1-sample case fails at p and a 3-sample case at 1-(1-p)^3 — roughly 3p. The
 * fixture ran 13 cases at 3 samples with 17 of 20 marked blocker, so a 1%
 * judge-flake rate made the job red about 37% of the time with nothing wrong,
 * and 2% made it 60%. Observed across three runs: one green, and a DIFFERENT
 * case failing in each of the other two. A red blocker was not evidence.
 *
 * Under a majority the same 1% flake produces a false red about 0.03% of the
 * time, while a case that genuinely fails 90% of runs still goes red 97% of the
 * time. The visibility the old rule wanted is not lost — `passedRuns/samples`
 * is still recorded and printed for every case, so a 2/3 is right there in the
 * log and in eval-results.json. It just no longer fails the build on one
 * dissenting judge call.
 *
 * STRICT majority: 2 of 4 is a split, not agreement.
 *
 * @param {number} passedRuns - how many samples passed
 * @param {number} samples - how many were run (>= 1)
 * @returns {boolean}
 */
export function passesCase(passedRuns, samples) {
  if (!Number.isInteger(samples) || samples < 1) {
    throw new Error(`samples must be a positive integer, got ${samples}`);
  }
  if (!Number.isInteger(passedRuns) || passedRuns < 0 || passedRuns > samples) {
    throw new Error(`passedRuns must be an integer in [0, ${samples}], got ${passedRuns}`);
  }
  return passedRuns * 2 > samples;
}

/**
 * Does one sent argument satisfy one wanted value?
 *
 * A LIST wanted value matches by MEMBERSHIP — `include: ["touchpoints"]` passes
 * when the call's list holds every member the case named. The model may ask for
 * more than the case cares about, and `===` on two arrays is never true.
 * Everything else is equality.
 */
export function argMatches(sent, want) {
  return Array.isArray(want) ? Array.isArray(sent) && want.every((v) => sent.includes(v)) : sent === want;
}

/**
 * Does some call in `calls` match `want`?
 *
 * `want`: `{ tool, args?, argsOneOf? }`.
 *   - `args` — every named argument must match (see argMatches).
 *   - `argsOneOf` — every named argument must be one OF a list of acceptable
 *     values, the whole list being the assertion.
 *
 * WHY `argsOneOf` EXISTS. Some choices are genuinely open: asked what shape a
 * phase has, `scenario`, `path` and `step` are all correct answers and `cell`
 * is the wrong one (#415). Pinning a single rung would grade the model on a
 * preference nobody holds, and asserting nothing would let the default through
 * — which is the behaviour the case was written to catch. `args` cannot express
 * it: a list there means membership in the SENT value, the opposite direction.
 */
export function toolCallMatches(calls, want) {
  const list = Array.isArray(calls) ? calls : [];
  const wanted = Object.entries(want?.args ?? {});
  const oneOf = Object.entries(want?.argsOneOf ?? {});
  return list.some(
    (c) =>
      c?.name === want?.tool &&
      wanted.every(([k, v]) => argMatches(c.args?.[k], v)) &&
      oneOf.every(([k, vs]) => Array.isArray(vs) && vs.includes(c.args?.[k])),
  );
}

/** What the turn actually called, for the failure line. Calls to the wanted
 *  tool are shown WITH their arguments — "no search_blueprint call with
 *  granularity" beside a bare `search_blueprint` tells you nothing about which
 *  rung it asked for. */
export function describeCalls(calls, tool) {
  const list = Array.isArray(calls) ? calls : [];
  if (!list.length) return "none";
  return list.map((c) => (c?.name === tool ? `${c.name}(${JSON.stringify(c.args ?? {})})` : c?.name)).join(", ");
}
