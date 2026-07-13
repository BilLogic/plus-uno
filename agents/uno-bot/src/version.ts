// Build tag baked into the Worker bundle at deploy time. Bump on every release
// round. Surfaced at GET /health and in the per-request telemetry line so an
// eval run (or anyone) can verify WHICH code is actually live — round 2 of the
// MVP eval accidentally tested a stale deployment because nothing exposed this.
export const BUILD = "r7-2026-07-12";
