// The weekly DS precedence check bound to `Env` — the only file in the folder
// that names it. The code side is read from `GITHUB_REPO`, the harness repo,
// where the intake is filed too; the library is `FIGMA_FILE_KEY` over REST;
// the report goes to #plus-universal (`PLUS_UNIVERSAL_CHANNEL_ID`), as the
// library card's does. The report and each posted message's record are JSON
// in HARNESS_KV beside the library poll's keys; each report's cards and their
// decisions are on ThreadState, as every decision report's are.

import type { Env } from "../types";
import { charge } from "../net";
import { postMessage, updateMessage } from "../slack/api";
import { REVIEW_ONLY_POST } from "../slack/gate-note";
import type { SlackMessageEvent } from "../slack/types";
import { typedEmojiDecision } from "../gate/reactions";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import type { PendingProposal } from "../thread-state/index";
import { threadStateFor } from "../thread-state/production";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { FINDINGS_KV_KEY, kvJson } from "../figma-poll";
import { figmaClientFor } from "../figma/production";
import { channelMembers, REGISTRY_PATH, TRACKED_KV_KEY } from "../figma-library/env";
import type { LibraryChangeSet } from "../figma-library/draft";
import type { TrackedPublish } from "../figma-library/track";
import type { JobContext } from "../scheduled/runs";
import { inFlightComponents, type PrecedenceRegistry } from "./compare";
import { precedenceRuleUrl } from "./report";
import {
  postPrecedenceReport,
  precedenceChannel,
  runPrecedenceCheck,
  type CheckResult,
  type PostedThread,
  type PostResult,
  type PrecedenceReport,
} from "./jobs";

const REPORT_KV_KEY = "ds-precedence:report";
/** Every posted report is recorded under its own ts, so a later week's never
 *  displaces an earlier one's. */
const THREAD_KV_PREFIX = "ds-precedence:thread:";
/** How long a report's thread stays one: well past its cards' six days, so
 *  the replies people still add to it are not taken as turns. */
const THREAD_RECORD_TTL_S = 30 * 24 * 60 * 60;
const INDEX_FILE = "design-system/agent-views/components/index.md";

/**
 * The check job on `Env`.
 * @param env - Worker bindings
 * @param opts - `dryRun` writes nothing; `runDate` is the week the report is labelled with
 */
export async function runDsPrecedenceCheck(env: Env, opts: JobContext): Promise<CheckResult> {
  const figma = figmaClientFor(env);
  if (!figma || !env.FIGMA_FILE_KEY) {
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
      figma,
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
      runDate: opts.runDate,
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
  const channel = precedenceChannel({
    plusUniversal: env.PLUS_UNIVERSAL_CHANNEL_ID?.trim() || undefined,
    plusDesign: env.PLUS_DESIGN_CHANNEL_ID?.trim() || undefined,
  });
  if (!channel) return { posted: false, summary: "PLUS_UNIVERSAL_CHANNEL_ID not set — nothing posted" };
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { posted: false, summary: `no repo: ${target.error}` };
  return postPrecedenceReport(
    {
      report: kvJson<PrecedenceReport | null>(env, REPORT_KV_KEY, null),
      recordThread: (thread) => threadRecord(env, thread.ts).write(thread),
      members: () => channelMembers(env, channel),
      async post(message) {
        const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async edit(ts, message) {
        await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
      },
      reports: threadStateFor(env),
      stage: (proposal) => stageWeeklyCard(env, proposal),
      channel,
      ruleUrl: precedenceRuleUrl(target.entry.repo),
      now: () => Date.now(),
    },
    opts,
  );
}

/**
 * Whether a #plus-universal thread is a weekly DS precedence report's — any
 * week's, for `THREAD_RECORD_TTL_S` after it posted, whether or not uno-bot
 * has answered there since. One KV read, and only for a thread reply in that
 * channel.
 *
 * @param env - Worker bindings
 * @param channel - The reply's channel
 * @param threadTs - The reply's thread
 */
export async function isWeeklyPrecedenceThread(env: Env, channel: string, threadTs: string): Promise<boolean> {
  if (!env.HARNESS_KV || channel !== env.PLUS_UNIVERSAL_CHANNEL_ID?.trim()) return false;
  const thread = await threadRecord(env, threadTs).read();
  return !!thread && thread.channel === channel && thread.ts === threadTs;
}

/**
 * Whether a message could be a typed gate emoji in a weekly report's thread:
 * a person's whole-message ✅ or ⛔ in a #plus-universal thread. Reads
 * nothing; `replyHandlerAt` then checks the thread.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export function isPrecedenceGateCandidate(env: Env, event: SlackMessageEvent): boolean {
  const channel = env.PLUS_UNIVERSAL_CHANNEL_ID?.trim();
  if (!channel || event.channel !== channel || !event.thread_ts || !env.HARNESS_KV) return false;
  if (event.bot_id || !event.user || (event.subtype && event.subtype !== "thread_broadcast")) return false;
  return typedEmojiDecision(event.text ?? "") !== null;
}

/**
 * A typed ✅ or ⛔ in a weekly report's thread, ahead of the turn: each card
 * is decided in its own Review, so it gets the shared review-only line and
 * runs nothing, and no turn starts.
 *
 * @param env - Worker bindings
 * @param event - The message
 * @returns Whether it was one, answered
 */
export async function handlePrecedenceGateReply(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!isPrecedenceGateCandidate(env, event)) return false;
  if (!(await isWeeklyPrecedenceThread(env, event.channel, event.thread_ts!))) return false;
  await postMessage(env, { channel: event.channel, thread_ts: event.thread_ts!, text: REVIEW_ONLY_POST });
  return true;
}

/**
 * Stage a weekly card the Worker posted, and put it on the usage record like
 * any card — a staged row via the Worker in #plus-universal, and a superseded
 * row for any card the staging retired — as the sweep and the library card do.
 */
async function stageWeeklyCard(env: Env, proposal: PendingProposal): Promise<void> {
  const { retired } = await threadStateFor(env).putProposal(proposal);
  const now = Date.now();
  await recordProposalEvents(proposalEventLogFor(env), [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
  ]);
}

/** One report thread's record in HARNESS_KV, kept `THREAD_RECORD_TTL_S`. */
function threadRecord(env: Env, threadTs: string): { read(): Promise<PostedThread | null>; write(t: PostedThread | null): Promise<void> } {
  const key = `${THREAD_KV_PREFIX}${threadTs}`;
  return {
    async read() {
      if (!env.HARNESS_KV) return null;
      charge(1, "kv");
      return (await env.HARNESS_KV.get<PostedThread>(key, "json")) ?? null;
    },
    async write(thread) {
      if (!env.HARNESS_KV || !thread) return;
      charge(1, "kv");
      await env.HARNESS_KV.put(key, JSON.stringify(thread), { expirationTtl: THREAD_RECORD_TTL_S });
    },
  };
}
