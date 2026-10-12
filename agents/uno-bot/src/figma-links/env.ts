// Dev Mode links bound to `Env` — the only file in the folder that names it.
//
//   • the registry: `component-registry.json` read from the harness repo
//     (`GITHUB_REPO`), which is also where the Code links point;
//   • Figma: the one client (`figmaClientFor`), paced and backing off on 429;
//   • Slack: where the Figma Review cards post (`figmaReviewChannel`) — Bill's
//     DM while the Figma flows are in testing; its members decide;
//   • KV: the cards still open, so a later run never offers one twice, and
//     merged library PRs waiting for their card (`./queue.ts`), queued by the
//     library tracker (`figma-library/env.ts`, through `prQueueFor`);
//   • the meter: each run stages only what its D1 and subrequest budget allow
//     (`budgetHeadroom`), and the next run carries on.

import type { Env } from "../types";
import { budgetHeadroom } from "../net";
import { postMessage, updateMessage } from "../slack/api";
import { figmaClientFor } from "../figma/production";
import { figmaReviewChannel } from "../figma-ask/env";
import { channelMembers } from "../slack/channel-members";
import { REGISTRY_PATH } from "../figma/registry";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { kvJson } from "../figma-poll";
import { markSweepThread } from "../sweep/thread-mark";
import { threadStateFor } from "../thread-state/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { devLinksOn } from "./gate";
import { PR_QUEUE_KV_KEY, runQueuedPrLinks, type QueuedPrLinks } from "./queue";
import { runDevLinksPost, type DevLinkRegistry, type DevLinksDeps, type DevLinksRequest, type DevLinksResult } from "./run";

/** The cards still open, by card id: when each closes. */
const CARDED_KV_KEY = "figma-links:carded";

/** Where merged library PRs wait for their card. */
export function prQueueFor(env: Env) {
  return kvJson<QueuedPrLinks[]>(env, PR_QUEUE_KV_KEY, []);
}

/**
 * The run's dependencies on `Env`, or why there are none. The registry and
 * the channel's members are read once, however many requests use them.
 *
 * @param env - Worker bindings
 */
function devLinksDepsFor(env: Env): DevLinksDeps | { refused: string } {
  const figma = figmaClientFor(env);
  if (!figma) return { refused: "FIGMA_ACCESS_TOKEN not set — nothing posted" };
  const channel = figmaReviewChannel(env);
  if (!channel) return { refused: "no FIGMA_ASK_CHANNEL_ID or PLUS_DESIGN_CHANNEL_ID — nothing posted" };
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { refused: `no repo: ${target.error}` };
  const threadState = threadStateFor(env);
  let registry: Promise<DevLinkRegistry> | undefined;
  let members: Promise<string[] | null> | undefined;
  return {
    registry: () => (registry ??= githubLibraryReads(env, target.entry).rawFile(REGISTRY_PATH).then((raw) => JSON.parse(raw) as DevLinkRegistry)),
    figma,
    repo: target.entry.repo,
    members: () => (members ??= channelMembers(env, channel)),
    async post(message, threadTs) {
      const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks, ...(threadTs ? { thread_ts: threadTs } : {}) });
      return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
    },
    async edit(ts, message) {
      await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
    },
    reports: threadState,
    async stage(proposal) {
      const { retired } = await threadState.putProposal(proposal);
      const now = Date.now();
      await recordProposalEvents(proposalEventLogFor(env), [
        ...supersededEvents(retired, now, "worker"),
        stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
      ]);
    },
    markThread: async (ts) => {
      if (env.HARNESS_KV) await markSweepThread(env.HARNESS_KV, channel, ts);
    },
    carded: kvJson<Record<string, number> | null>(env, CARDED_KV_KEY, null),
    headroom: budgetHeadroom,
    channel,
    now: () => Date.now(),
  };
}

/**
 * Post the Review cards a request needs, on `Env`.
 *
 * @param env - Worker bindings
 * @param request - What the run is for (`./gate.ts` decides what a manual run may ask)
 * @param opts - `dryRun` reads and plans, and posts nothing
 */
export async function runDevLinksOnEnv(env: Env, request: DevLinksRequest, opts: { dryRun?: boolean } = {}): Promise<DevLinksResult> {
  const deps = devLinksDepsFor(env);
  if ("refused" in deps) return { posted: false, cards: 0, retry: true, summary: deps.refused };
  return runDevLinksPost(deps, request, opts);
}

/**
 * The morning `figma-dev-links-pr` job on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` posts nothing and keeps the queue
 */
export function runQueuedPrLinksOnEnv(env: Env, opts: { dryRun?: boolean }): Promise<{ summary: string }> {
  let deps: ReturnType<typeof devLinksDepsFor> | undefined;
  return runQueuedPrLinks(
    {
      queue: prQueueFor(env),
      on: devLinksOn(env.FIGMA_DEV_LINKS),
      async post(request, o) {
        deps ??= devLinksDepsFor(env);
        if ("refused" in deps) return { posted: false, cards: 0, retry: true, summary: deps.refused };
        return runDevLinksPost(deps, request, o);
      },
    },
    opts,
  );
}
