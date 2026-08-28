// The Worker's build stamp, derived from the deploy rather than typed.
//
// `src/version.ts` used to hold a hand-edited constant with "bump on every
// release round" written above it. That is an instruction, not a mechanism, and
// it was not followed: r73 stood through 24 commits to src/ and 54 successful
// deploys, and r75 then stood through three more. Eval runs across different
// builds all reported the same string, so nothing in eval-results.json could
// tell them apart — the exact failure the constant was introduced to prevent,
// pointing the other way (#249).
//
// The stamp is injected at bundle time via wrangler's `--define`, so there is
// nothing left to remember.
const SHORT_SHA = 7;

/**
 * The build id for a deploy.
 *
 * Both halves earn their place. The sha says WHICH CODE is serving, which a
 * run number cannot; the run number ORDERS deploys, which a sha cannot. A
 * re-run of the same commit is a different deploy and gets a different stamp,
 * because a health check that answers the same for both cannot tell you which
 * one is live.
 *
 * @param {{ runNumber?: string, sha?: string }} env - normally GITHUB_RUN_NUMBER / GITHUB_SHA
 * @returns {string} e.g. `r412-80035c2`, or `dev` outside CI
 */
export function buildId({ runNumber, sha } = {}) {
  // Outside CI, say so. A local `wrangler deploy` minting something that looks
  // like a release number is worse than no number: it would be believed.
  if (!runNumber || !sha) return "dev";
  return `r${runNumber}-${sha.slice(0, SHORT_SHA)}`;
}

/** The stamp for the current process, from the standard GitHub Actions vars. */
export function buildIdFromEnv(env = process.env) {
  return buildId({ runNumber: env.GITHUB_RUN_NUMBER, sha: env.GITHUB_SHA });
}
