// Dev Mode links bound to `Env` — the only file in the folder that names it.
// (Approve's binding is `tools/figma-dev-links.ts`: the tool table imports it,
// and this file's imports reach back into that table.)
//
//   • the registry: `component-registry.json` read from the harness repo
//     (`GITHUB_REPO`), which is also where the Code links point;
//   • Figma: the one client (`figmaClientFor`), paced and backing off on 429;
//   • Slack: where the Figma Review cards post (`figmaReviewChannel`) — #plus-design
//     unless `FIGMA_ASK_CHANNEL_ID` names another; its members decide;
//   • KV: the cards posted and the message each is in, so a later run never
//     offers one twice while it is undecided (`./run.ts` reads its report);
//   • the meter: a run stages its one card only when its D1 and subrequest
//     budget allow (`budgetHeadroom`), and Approve writes only the Figma calls
//     this invocation has room for;
//   • the AgentRunner: the rest of an approved write, a runner job of its own
//     (`runDevLinksWriteJobOnEnv`), so it never queues behind a person's turn.

import type { Env } from "../types";
import { budgetHeadroom } from "../net";
import { devLinksStopped } from "./copy";
import { postMessage, updateMessage } from "../slack/api";
import { figmaClientFor } from "../figma/production";
import { figmaReviewChannel } from "../figma-ask/env";
import { channelMembers } from "../slack/channel-members";
import { REGISTRY_PATH } from "../figma/registry";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { kvJson } from "../figma-poll";
import { threadStateFor } from "../thread-state/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import {
  runDevLinksPost,
  runDevLinksWriteJob,
  type CardedMark,
  type DevLinkRegistry,
  type DevLinksDeps,
  type DevLinksRequest,
  type DevLinksResult,
  type DevLinksWriteJob,
} from "./run";

/** The cards posted, by card id: when each closes, and its message. */
const CARDED_KV_KEY = "figma-links:carded";

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
    async post(message) {
      const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks });
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
    carded: kvJson<Record<string, CardedMark> | null>(env, CARDED_KV_KEY, null),
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

/** Subrequests a runner step leaves for its reply. */
const JOB_RESERVE = 3;

/**
 * One step of an approved write carried on, on `Env`: the runner job's body.
 *
 * @param env - Worker bindings
 * @param job - The handed-on write
 */
export async function runDevLinksWriteJobOnEnv(env: Env, job: DevLinksWriteJob): Promise<"handled" | { deferred: DevLinksWriteJob }> {
  const figma = figmaClientFor(env);
  if (!figma) {
    await postMessage(env, { channel: job.channel, text: devLinksStopped("FIGMA_ACCESS_TOKEN is not set"), ...(job.threadTs ? { thread_ts: job.threadTs } : {}) });
    return "handled";
  }
  return runDevLinksWriteJob(
    {
      figma,
      calls: () => budgetHeadroom().subrequests - JOB_RESERVE,
      async reply(text) {
        const res = await postMessage(env, { channel: job.channel, text, ...(job.threadTs ? { thread_ts: job.threadTs } : {}) });
        if (!res.ok) console.warn(`[figma-links] the finishing reply did not post: ${res.error ?? "no error code"}`);
      },
      now: () => Date.now(),
    },
    job,
  );
}
