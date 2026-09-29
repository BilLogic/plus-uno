// The weekly DS precedence check bound to `Env` — the only file in the folder
// that names it. The code side is read from `GITHUB_REPO`, the harness repo,
// where the intake is filed too; the library is `FIGMA_FILE_KEY` over REST;
// the thread goes to #plus-universal (`PLUS_UNIVERSAL_CHANNEL_ID`), as the
// library card's does. The report and the posted thread are JSON in
// HARNESS_KV beside the library poll's keys.

import type { Env } from "../types";
import type { SlackMessageEvent } from "../slack/types";
import { postMessage } from "../slack/api";
import { threadStateFor } from "../thread-state/production";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { FINDINGS_KV_KEY, figmaGet, kvJson, type FigmaComponentsResponse } from "../figma-poll";
import { channelMembers, REGISTRY_PATH, TRACKED_KV_KEY } from "../figma-library/env";
import type { LibraryChangeSet } from "../figma-library/draft";
import type { TrackedPublish } from "../figma-library/track";
import { inFlightComponents, type PrecedenceRegistry } from "./compare";
import { disputedItems, PRECEDENCE_MARKER } from "./report";
import {
  disputePrecedenceItems,
  postPrecedenceReport,
  runPrecedenceCheck,
  type CheckResult,
  type PostedThread,
  type PostResult,
  type PrecedenceReport,
} from "./jobs";

const REPORT_KV_KEY = "ds-precedence:report";
const THREAD_KV_KEY = "ds-precedence:thread";
const INDEX_FILE = "design-system/agent-views/components/index.md";

/**
 * The check job on `Env`.
 * @param env - Worker bindings
 * @param opts - `dryRun` writes nothing
 */
export async function runDsPrecedenceCheck(env: Env, opts: { dryRun: boolean }): Promise<CheckResult> {
  if (!env.FIGMA_ACCESS_TOKEN || !env.FIGMA_FILE_KEY) {
    return { found: 0, summary: "FIGMA_ACCESS_TOKEN / FIGMA_FILE_KEY not configured — check skipped" };
  }
  if (!env.HARNESS_KV) return { found: 0, summary: "HARNESS_KV not bound — nowhere to keep the report; check skipped" };
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { found: 0, summary: `no repo: ${target.error}` };
  const reads = githubLibraryReads(env, target.entry);
  const fileKey = env.FIGMA_FILE_KEY;
  return runPrecedenceCheck(
    {
      github: {
        indexMarkdown: () => reads.rawFile(INDEX_FILE),
        registry: async () => JSON.parse(await reads.rawFile(REGISTRY_PATH)) as PrecedenceRegistry,
      },
      figma: { components: () => figmaGet<FigmaComponentsResponse>(env, `/files/${fileKey}/components`) },
      report: kvJson<PrecedenceReport | null>(env, REPORT_KV_KEY, null),
      inFlight: async (registry) =>
        inFlightComponents(
          await kvJson<TrackedPublish[]>(env, TRACKED_KV_KEY, []).read(),
          await kvJson<LibraryChangeSet[]>(env, FINDINGS_KV_KEY, []).read(),
          registry,
        ),
      fileKey,
      repo: target.entry.repo,
      now: () => Date.now(),
    },
    opts,
  );
}

/**
 * The morning post on `Env`.
 * @param env - Worker bindings
 * @param opts - `dryRun` posts, stages and writes nothing
 */
export async function runDsPrecedencePost(env: Env, opts: { dryRun: boolean }): Promise<PostResult> {
  const channel = env.PLUS_UNIVERSAL_CHANNEL_ID?.trim();
  if (!channel) return { posted: false, summary: "PLUS_UNIVERSAL_CHANNEL_ID not set — nothing posted" };
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { posted: false, summary: `no repo: ${target.error}` };
  const reads = githubLibraryReads(env, target.entry);
  return postPrecedenceReport(
    {
      report: kvJson<PrecedenceReport | null>(env, REPORT_KV_KEY, null),
      thread: kvJson<PostedThread | null>(env, THREAD_KV_KEY, null),
      members: () => channelMembers(env, channel),
      async openIntake() {
        const open = (await reads.openIntakes()).find((i) => i.body.includes(PRECEDENCE_MARKER));
        return open ? { number: open.number, url: open.url } : null;
      },
      post: (message) => post(env, channel, message),
      stage: (proposal) => threadStateFor(env).putProposal(proposal),
      channel,
      now: () => Date.now(),
    },
    opts,
  );
}

/**
 * Whether a message could be a dispute of the weekly thread: a person's reply
 * (or "also send to channel" broadcast) in a #plus-universal thread that starts
 * with `dispute N`. Reads nothing — the dispatch uses it to queue the reply on
 * the thread's runner, where `handleDsPrecedenceReply` decides.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export function isDsPrecedenceCandidate(env: Env, event: SlackMessageEvent): boolean {
  const channel = env.PLUS_UNIVERSAL_CHANNEL_ID?.trim();
  if (!channel || event.channel !== channel || !event.thread_ts || !env.HARNESS_KV) return false;
  if (event.bot_id || !event.user || (event.subtype && event.subtype !== "thread_broadcast")) return false;
  return disputedItems(event.text ?? "").length > 0;
}

/**
 * A queued reply that disputes items of the live weekly thread: revise its
 * card. Runs at the head of the thread's job (`slack/message-job.ts`).
 *
 * @param env - Worker bindings
 * @param event - The message
 * @returns Whether it was a dispute, handled — the turn is then skipped
 */
export async function handleDsPrecedenceReply(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!isDsPrecedenceCandidate(env, event)) return false;
  const store = threadStateFor(env);
  return disputePrecedenceItems(
    {
      thread: kvJson<PostedThread | null>(env, THREAD_KV_KEY, null),
      post: (message) => post(env, event.channel, message),
      stage: (proposal) => store.putProposal(proposal),
      retire: (ts) => store.retireProposal(ts),
      pending: async (ts) => (await store.getProposalByTs(ts)).state === "found",
      now: () => Date.now(),
    },
    { channel: event.channel, threadTs: event.thread_ts!, user: event.user!, text: event.text ?? "" },
  );
}

/**
 * Whether a #plus-universal thread is the weekly DS precedence thread — one
 * whose only uno-bot posts are its scheduled list and card. One KV read, and
 * only for a thread reply in that channel.
 *
 * @param env - Worker bindings
 * @param channel - The reply's channel
 * @param threadTs - The reply's thread
 */
export async function isScheduledOnlyThread(env: Env, channel: string, threadTs: string): Promise<boolean> {
  if (!env.HARNESS_KV || channel !== env.PLUS_UNIVERSAL_CHANNEL_ID?.trim()) return false;
  const thread = await kvJson<PostedThread | null>(env, THREAD_KV_KEY, null).read();
  return !!thread && thread.channel === channel && thread.ts === threadTs;
}

async function post(
  env: Env,
  channel: string,
  message: { text: string; blocks?: unknown[]; thread_ts?: string },
): Promise<{ ok: boolean; ts?: string }> {
  const res = await postMessage(env, {
    channel,
    text: message.text,
    ...(message.blocks ? { blocks: message.blocks } : {}),
    ...(message.thread_ts ? { thread_ts: message.thread_ts } : {}),
  });
  return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
}
