// Dev Mode links bound to `Env` — the only file in the folder that names it.
// (Approve's binding is `tools/figma-dev-links.ts`: the tool table imports it,
// and this file's imports reach back into that table.)
//
//   • the registry: `component-registry.json` read from the harness repo
//     (`GITHUB_REPO`), which is also where the Code links point;
//   • Figma: the one client (`figmaClientFor`), paced and backing off on 429;
//   • Slack: a debug route's card posts in a test channel (`TEST_CHANNEL_IDS`,
//     `devLinksDebugChannel`), never a team channel; the morning's card, for
//     the library PRs merged since the last, goes on the sweep's #plus-design
//     message (`./morning.ts`), and #plus-design's members decide it;
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
import { channelMembers } from "../slack/channel-members";
import { REGISTRY_PATH } from "../figma/registry";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { kvJson } from "../figma-poll";
import { threadStateFor } from "../thread-state/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor, testChannelIdsOf } from "../usage/production";
import { teamPostChannel } from "../usage/record";
import type { JobContext } from "../scheduled/runs";
import { sectionHandOffIn, type SweepSection } from "../sweep/sections";
import { devLinksOn } from "./gate";
import { DEV_LINKS_SECTION, devLinksSection, handOverDevLinks, MERGED_THROUGH_KV_KEY, type DevLinksHanded } from "./morning";
import {
  planDevLinksCard,
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
 * Where a debug route's card posts: a test channel, by the usage record's
 * test-traffic rule (`teamPostChannel`) — a card a debug route set off never
 * reaches a team channel (#1223).
 *
 * @param env - `TEST_CHANNEL_IDS`
 */
export function devLinksDebugChannel(env: Pick<Env, "TEST_CHANNEL_IDS">): string | { refused: string } {
  // A debug route has no channel of its own and no team channel to aim at:
  // the rule sends it to the first test channel.
  const channel = teamPostChannel({ origin: "debug", channel: "", testChannelIds: testChannelIdsOf(env) }, "");
  return channel || { refused: "no TEST_CHANNEL_IDS — a debug route's card posts only in a test channel" };
}

/**
 * The run's dependencies on `Env`, or why there are none. The registry and
 * the channel's members are read once, however many requests use them.
 *
 * @param env - Worker bindings
 * @param channel - Where the card posts
 */
function devLinksDepsFor(env: Env, channel: string): DevLinksDeps | { refused: string } {
  const figma = figmaClientFor(env);
  if (!figma) return { refused: "FIGMA_ACCESS_TOKEN not set — nothing posted" };
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
  const channel = devLinksDebugChannel(env);
  // A rehearsal posts nothing, so it plans with or without a test channel.
  if (typeof channel !== "string" && !opts.dryRun) return { posted: false, cards: 0, retry: true, summary: channel.refused };
  const deps = devLinksDepsFor(env, typeof channel === "string" ? channel : "");
  if ("refused" in deps) return { posted: false, cards: 0, retry: true, summary: deps.refused };
  return runDevLinksPost(deps, request, opts);
}

/**
 * The morning's hand-over of a Dev Mode links card for the library PRs merged
 * since the last, on `Env`.
 *
 * @param env - Worker bindings
 * @param ctx - The morning run
 */
export async function runDevLinksMorningOnEnv(env: Env, ctx: JobContext): Promise<{ summary: string }> {
  const channel = env.PLUS_DESIGN_CHANNEL_ID?.trim();
  if (!channel || !env.HARNESS_KV) return { summary: "PLUS_DESIGN_CHANNEL_ID or HARNESS_KV not set — nothing handed over" };
  const deps = devLinksDepsFor(env, channel);
  if ("refused" in deps) return { summary: deps.refused };
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { summary: `no repo: ${target.error}` };
  return handOverDevLinks(
    {
      on: devLinksOn(env.FIGMA_DEV_LINKS),
      closedPulls: () => githubLibraryReads(env, target.entry).closedPulls(),
      mergedThrough: kvJson<string | null>(env, MERGED_THROUGH_KV_KEY, null),
      plan: (request) => planDevLinksCard(deps, request),
      members: deps.members,
      ...(ctx.runStorage ? { handOff: sectionHandOffIn<DevLinksHanded>(ctx.runStorage, DEV_LINKS_SECTION) } : {}),
      channel,
      date: ctx.runDate,
      now: () => Date.now(),
    },
    { dryRun: ctx.dryRun },
  );
}

/**
 * The Dev Mode links card as a section of the sweep's #plus-design message,
 * or undefined without the channel, HARNESS_KV or the run's storage.
 *
 * @param env - Worker bindings
 * @param ctx - The morning run
 */
export function devLinksSectionFor(env: Env, ctx: JobContext): SweepSection | undefined {
  const channel = env.PLUS_DESIGN_CHANNEL_ID?.trim();
  if (!channel || !env.HARNESS_KV || !ctx.runStorage) return undefined;
  const threadState = threadStateFor(env);
  return devLinksSection(
    {
      reports: threadState,
      async stage(proposal) {
        const { retired } = await threadState.putProposal(proposal);
        const now = Date.now();
        await recordProposalEvents(proposalEventLogFor(env), [
          ...supersededEvents(retired, now, "worker"),
          stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
        ]);
      },
      async edit(ts, message) {
        // The message's own tag, kept: it is the sweep's.
        await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks, ...(message.metadata ? { metadata: message.metadata } : {}) });
      },
      carded: kvJson<Record<string, CardedMark> | null>(env, CARDED_KV_KEY, null),
      mergedThrough: kvJson<string | null>(env, MERGED_THROUGH_KV_KEY, null),
      now: () => Date.now(),
    },
    sectionHandOffIn<DevLinksHanded>(ctx.runStorage, DEV_LINKS_SECTION),
    ctx.runDate,
  );
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
