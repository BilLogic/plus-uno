// Manual firing of the Figma library poll (the end-of-day job's code path).
// `?dry_run=1` diffs and reports without writing KV. Token-gated: a live run
// advances the snapshot and queues what changed for the morning run's post —
// it posts nothing itself. `/debug/sweep?dry_run=1&run=morning` rehearses the
// post and the tracker.
import { runFigmaPoll } from "../../figma-poll";
import { devLinksRequestOf } from "../../figma-links/gate";
import { runDevLinksOnEnv } from "../../figma-links/env";
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

// Manual run of Dev Mode links (src/figma-links/): posts Review cards where
// the Figma Review-card setting says, and writes nothing to Figma — a card's
// Approve does. `?component=Button` is one component; `?all=1`, every registry
// component, only once FIGMA_DEV_LINKS is on (`figma-links/gate.ts`).
// `?dry_run=1` reads and plans, and posts nothing.
export const figmaDevLinksProbe: ProbeRun = async (env, url) => {
  const dryRun = url.searchParams.get("dry_run") === "1";
  const asked = devLinksRequestOf(
    { component: url.searchParams.get("component"), all: url.searchParams.get("all") === "1" },
    env.FIGMA_DEV_LINKS,
  );
  if ("refused" in asked) return { body: { ok: false, build: BUILD, dryRun, error: asked.refused } };
  try {
    const result = await runDevLinksOnEnv(env, asked.request, { dryRun });
    return { body: { ok: true, build: BUILD, dryRun, ...result } };
  } catch (err) {
    return { body: { build: BUILD, dryRun, ...probeFailure(err) } };
  }
};
