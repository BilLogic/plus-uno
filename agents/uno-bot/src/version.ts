// Build tag baked into the Worker bundle at deploy time. Bump on every release
// round. Surfaced at GET /health and in the per-request telemetry line so an
// eval run (or anyone) can verify WHICH code is actually live — round 2 of the
// MVP eval accidentally tested a stale deployment because nothing exposed this.
//
// "Bump on every release round" is an instruction, not a mechanism, and it has
// not been followed: r73 stood through 24 commits to src/ and 54 successful
// deploys, so three eval runs across three different builds all reported r73
// and were indistinguishable in their own artifacts. That is the same class of
// failure the paragraph above describes, pointing the other way — nothing was
// stale except the label. #249 replaces this constant with something the deploy
// writes and nobody has to remember.
export const BUILD = "r74-2026-08-26";
