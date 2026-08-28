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
 * a bundle built without the define degrades to "dev" instead of 500ing every
 * route that reports a build.
 */
export const BUILD = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";
