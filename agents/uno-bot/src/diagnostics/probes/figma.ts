// Manual firing of the Figma library poll (the end-of-day job's code path).
// `?dry_run=1` diffs and reports without writing KV. Token-gated: a live run
// advances the snapshot and queues what changed for the morning run's post —
// it posts nothing itself. `/debug/sweep?dry_run=1&run=morning` rehearses the
// post and the tracker.
import { runFigmaPoll } from "../../figma-poll";
import { BUILD } from "../../version";
import { probeFailure } from "../router";
import type { ProbeRun } from "../probe";

export const figmaPollProbe: ProbeRun = async (env, url) => {
  const dryRun = url.searchParams.get("dry_run") === "1";
  try {
    const result = await runFigmaPoll(env, { dryRun });
    return { body: { ok: true, build: BUILD, dryRun, ...result } };
  } catch (err) {
    return { body: { build: BUILD, dryRun, ...probeFailure(err) } };
  }
};
