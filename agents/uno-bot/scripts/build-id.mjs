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

/**
 * The stamp for the current process.
 *
 * TWO CI SYSTEMS DEPLOY THIS WORKER. The GitHub Actions workflow is the gated
 * one — it runs typecheck, check:fetch, check:contract, test:bundle and
 * bundle:harness before deploying. Cloudflare Workers Builds also builds this
 * repo and deploys on its own, and on 2026-08-28 it was found to be winning:
 * production served `dev` on every sample while the Actions run had just
 * deployed r128 (#278).
 *
 * Recognising Cloudflare's own variables does not fix that — the decision about
 * which deployer owns production is in #278 — but it makes the answer visible.
 * After this, /health says which path produced what is serving:
 *
 *   r<n>-<sha>    the gated GitHub Actions deploy
 *   cf<id>-<sha>  Cloudflare Workers Builds, going through scripts/deploy.mjs
 *   dev           something deployed WITHOUT this script at all
 *
 * That third case is the one worth alarming on, and until now it was
 * indistinguishable from the second.
 */
export function buildIdFromEnv(env = process.env) {
  if (env.GITHUB_RUN_NUMBER && env.GITHUB_SHA) {
    return buildId({ runNumber: env.GITHUB_RUN_NUMBER, sha: env.GITHUB_SHA });
  }
  // Workers Builds has no monotonic run counter, so the build UUID stands in:
  // it distinguishes two builds of one commit, which is what run_number buys.
  if (env.WORKERS_CI_BUILD_UUID && env.WORKERS_CI_COMMIT_SHA) {
    return `cf${env.WORKERS_CI_BUILD_UUID.replace(/-/g, "").slice(0, 8)}-${env.WORKERS_CI_COMMIT_SHA.slice(0, SHORT_SHA)}`;
  }
  return "dev";
}
