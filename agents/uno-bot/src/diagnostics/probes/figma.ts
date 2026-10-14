// Manual firing of the Figma library poll (the end-of-day job's code path).
// `?dry_run=1` reads and reports without writing KV. Token-gated: a live run
// advances the snapshot and records any refresh a publish owes the repo's
// snapshot — it posts nothing.
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

// Manual run of Dev Mode links (src/figma-links/): posts Review cards in a
// test channel (`TEST_CHANNEL_IDS`) — a debug route's post never reaches a
// team channel — and writes nothing to Figma; a card's Approve does. `?component=Button` is the live check's component; `?all=1`, every registry
// component still to link on one batch card, only once FIGMA_DEV_LINKS is on
// (`figma-links/gate.ts`) — this route is the only way the batch is asked for.
// A run reads and plans and posts nothing unless `post=1` says to: the cards
// land in someone's channel, so posting is asked for, never defaulted.
export const figmaDevLinksProbe: ProbeRun = async (env, url) => {
  const dryRun = url.searchParams.get("post") !== "1";
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
