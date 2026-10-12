// Dev Mode links bound to `Env` — the only file in the folder that names it.
//
//   • the registry: `component-registry.json` read from the harness repo
//     (`GITHUB_REPO`), which is also where the Code links point;
//   • Figma: the one client (`figmaClientFor`), paced and backing off on 429;
//   • Slack: where the Figma Review cards post (`figmaReviewChannel`) — Bill's
//     DM while the Figma flows are in testing; its members decide;
//   • KV: merged library PRs waiting for their card (`./queue.ts`), queued by
//     the library tracker (`figma-library/env.ts`).

import type { Env } from "../types";
import { postMessage, updateMessage } from "../slack/api";
import { figmaClientFor } from "../figma/production";
import { figmaReviewChannel } from "../figma-ask/env";
import { channelMembers, REGISTRY_PATH } from "../figma-library/env";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { kvJson } from "../figma-poll";
import { markSweepThread } from "../sweep/thread-mark";
import { threadStateFor } from "../thread-state/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { devLinksOn } from "./gate";
import { PR_QUEUE_KV_KEY, runQueuedPrLinks, type QueuedPrLinks } from "./queue";
import { runDevLinksPost, type DevLinkRegistry, type DevLinksRequest, type DevLinksResult } from "./run";

function prQueue(env: Env) {
  return kvJson<QueuedPrLinks[]>(env, PR_QUEUE_KV_KEY, []);
}

/**
 * Post the Review cards a request needs, on `Env`.
 *
 * @param env - Worker bindings
 * @param request - What the run is for (`./gate.ts` decides what a manual run may ask)
 * @param opts - `dryRun` reads and plans, and posts nothing
 */
export async function runDevLinksOnEnv(env: Env, request: DevLinksRequest, opts: { dryRun?: boolean } = {}): Promise<DevLinksResult> {
  const figma = figmaClientFor(env);
  if (!figma) return { posted: false, cards: 0, retry: true, summary: "FIGMA_ACCESS_TOKEN not set — nothing posted" };
  const channel = figmaReviewChannel(env);
  if (!channel) return { posted: false, cards: 0, retry: true, summary: "no FIGMA_ASK_CHANNEL_ID or PLUS_DESIGN_CHANNEL_ID — nothing posted" };
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { posted: false, cards: 0, retry: true, summary: `no repo: ${target.error}` };
  const threadState = threadStateFor(env);
  return runDevLinksPost(
    {
      registry: async () => JSON.parse(await githubLibraryReads(env, target.entry).rawFile(REGISTRY_PATH)) as DevLinkRegistry,
      figma,
      repo: target.entry.repo,
      members: () => channelMembers(env, channel),
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
      channel,
    },
    request,
    opts,
  );
}

/**
 * The morning `figma-dev-links-pr` job on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` posts nothing and keeps the queue
 */
export function runQueuedPrLinksOnEnv(env: Env, opts: { dryRun?: boolean }): Promise<{ summary: string }> {
  return runQueuedPrLinks(
    { queue: prQueue(env), on: devLinksOn(env.FIGMA_DEV_LINKS), post: (request, o) => runDevLinksOnEnv(env, request, o) },
    opts,
  );
}
