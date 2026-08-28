// How a sampled eval case turns into a pass or a fail.
//
// Extracted from run-evals.mjs so the rule can be tested without a live Worker,
// a judge credential, or 58 model calls. The rule is one line; the reason it is
// that line is the rest of this file (#249).
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
