// Build tag baked into the Worker bundle at deploy time. Surfaced at GET
// /health, in the per-request telemetry line, and in the JSON of half a dozen
// routes, so an eval run (or anyone) can verify WHICH code is actually live —
// round 2 of the MVP eval accidentally tested a stale deployment because
// nothing exposed this.
//
// IT IS NO LONGER TYPED BY HAND. This was `export const BUILD = "r75-..."` with
// "bump on every release round" written above it, and that instruction was not
// followed: r73 stood through 24 commits to src/ and 54 successful deploys, and
// r75 then stood through three more. Eval runs against three different builds
// all reported the same string, so nothing in eval-results.json distinguished
// them — the same failure the paragraph above describes, pointing the other
// way. Nothing was stale except the label (#249).
//
// `scripts/deploy.mjs` computes the stamp from GITHUB_RUN_NUMBER and GITHUB_SHA
// and passes it to wrangler as a `--define`, so esbuild substitutes the literal
// into the bundle. The derivation is `scripts/build-id.mjs`, tested in
// `scripts/build-id.test.mjs`.
declare const __BUILD_ID__: string;

/**
 * `typeof` rather than a plain reference, because an UNSUBSTITUTED identifier
 * is a ReferenceError at runtime and this constant is read on the health path.
 * `typeof` on an undeclared name is the one form JavaScript defines as safe, so
 * a bundle built without the define degrades instead of 500ing every route that
 * reports a build.
 *
 * The fallback is "unstamped", NOT "dev", and the difference is the whole point
 * of #278. `deploy.mjs` stamps "dev" when it runs outside CI — so while both
 * said "dev", a Worker reporting it could equally mean "someone deployed from a
 * laptop" or "something deployed WITHOUT deploy.mjs, and therefore without
 * typecheck, check:fetch, check:contract, test:bundle or bundle:harness". Those
 * need completely different responses and were indistinguishable.
 *
 * Now they are not, and the distinction costs nothing and depends on nothing:
 *
 *   unstamped     no --define reached the bundle. deploy.mjs did NOT run.
 *   dev           deploy.mjs ran, outside any CI it recognises.
 *   r<n>-<sha>    the gated GitHub Actions deploy.
 *   cf<id>-<sha>  Cloudflare Workers Builds, through deploy.mjs (#280).
 *
 * That last pair is why this is worth a word: #280 taught the stamp Cloudflare's
 * WORKERS_CI_* variables, and identifying a Workers Build depends on those names
 * being right. "unstamped" does not depend on knowing any variable name.
 */
export const BUILD = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "unstamped";
