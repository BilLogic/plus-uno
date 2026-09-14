// Manual firing of the Figma library poll (same code path as the cron).
// `?dry_run=1` diffs and reports without writing KV / Notion / Slack.
// Token-gated: a live run posts to Slack and files a PRD.
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
