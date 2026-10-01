// File drift on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • The store: HARNESS_KV. The queue is one key per channel under
//     `figma-drift:findings:` (each end-of-day channel job writes only its
//     own), a finding older than 30 days dropped as it is read; a file's intake
//     mark under `figma-drift:intake:`, kept past its card's 72 h; a thread's
//     ask record under `figma-drift:ask:`, kept 30 days. KV, not D1: the queue
//     holds the thread's words (ADR-030).
//   • Slack: `chat.postMessage` in the thread, tagged with the sweep's message
//     metadata so a reply under it is read by the sweep thread's rule
//     (`isSweepCardPost`); `chat.getPermalink`; `chat.update` to withdraw.
//   • Staging: the sweep's own (`stageSweepCard`) — ThreadState, the staged
//     row on the usage record, and the thread mark.
//   • The publisher: the Figma client's `/versions` read (`src/figma/`),
//     newest publish's handle, or no client and no publisher without a token.
//   • The pillar options: the Roadmap database's schema
//     (`NOTION_ROADMAP_DB_ID`, `Product Pillar`).
//
// A Worker without HARNESS_KV asks nothing, and the sweep counts file drift
// and leaves it, as it did before.

import type { Env } from "../types";
import { budgetHeadroom, charge } from "../net";
import { getPermalink, postMessage, updateMessage, type SlackMessageMetadata } from "../slack/api";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import type { SlackMessageEvent } from "../slack/types";
import { threadStateFor } from "../thread-state/production";
import { proposalReplyThread, type PendingProposal } from "../thread-state/index";
import { proposalEvent, recordProposalEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { databaseOptions } from "../integrations/notion";
import { figmaClientFor } from "../figma/production";
import { measured } from "../sweep/env";
import { stageSweepCard } from "../sweep/run";
import { SWEEP_CARD_EVENT } from "../sweep/cards";
import { markSweepThread } from "../sweep/thread-mark";
import type { ScheduledJob } from "../scheduled/runs";
import { DRIFT_CARD_TTL_MS } from "./copy";
import { DRIFT_KEY, type FileDriftFinding, type FileDriftSink } from "./finding";
import {
  answerDriftAsk,
  isDriftAnswerCandidate,
  runDriftAsks,
  type AskRecord,
  type DriftPostReport,
  type DriftStore,
  type IntakeMark,
} from "./run";

const QUEUE_PREFIX = "figma-drift:findings:";
const MARK_PREFIX = "figma-drift:intake:";
const ASK_PREFIX = "figma-drift:ask:";
const DAY_S = 24 * 60 * 60;
/** A queued finding not asked within 30 days is dropped as the queue is read. */
const QUEUE_MAX_AGE_MS = 30 * DAY_S * 1000;
/** A mark outlives its card by a day, so a retry still finds it. */
const MARK_TTL_S = DRIFT_CARD_TTL_MS / 1000 + DAY_S;
/** A thread is not asked twice about a file for this long. */
const ASK_TTL_S = 30 * DAY_S;

/**
 * Where the end-of-day sweep hands its file drift, or undefined when there is
 * nowhere to keep it.
 *
 * @param env - Worker bindings
 */
export function fileDriftSinkFor(env: Env): FileDriftSink | undefined {
  return env.HARNESS_KV ? kvDriftStore(env.HARNESS_KV) : undefined;
}

/**
 * The morning's `figma-drift-post` job on `Env`.
 *
 * @param env - Worker bindings
 * @param job - The job
 * @param opts - `dryRun` reads and drafts, and posts, stages and writes nothing
 */
export async function runDriftAsksOnEnv(
  env: Env,
  job: ScheduledJob,
  opts: { dryRun: boolean },
): Promise<DriftPostReport | { summary: string }> {
  if (!env.HARNESS_KV) return { summary: "HARNESS_KV not bound — no file drift to ask about" };
  const kv = env.HARNESS_KV;
  const threadState = threadStateFor(env);
  const roadmap = env.NOTION_ROADMAP_DB_ID?.trim();
  const figma = figmaClientFor(env);
  return runDriftAsks(job, {
    store: kvDriftStore(kv),
    slack: {
      async post(to, message) {
        const res = await postMessage(env, {
          channel: to.channel,
          text: message.text,
          ...(message.blocks ? { blocks: message.blocks } : {}),
          metadata: driftTag(message.card ? "drift-card" : "drift-question"),
          ...(to.threadTs ? { thread_ts: to.threadTs } : {}),
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      permalink: (channel, ts) => measured(() => getPermalink(env, channel, ts)),
      async withdraw(channel, ts, text) {
        // Out of reach first: a card that says it didn't go through can't be ✅'d.
        await threadState.retireProposal(ts);
        await updateMessage(env, { channel, ts, text, metadata: driftTag("drift-withdrawn") });
      },
      async markThread(channel, threadTs) {
        if (!(await threadState.readHistory({ channel, thread: threadTs })).length) await markSweepThread(kv, channel, threadTs);
      },
    },
    render(card) {
      const rendered = renderProposalCard(card);
      return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
    },
    async stage(proposal, channelKind) {
      await stageSweepCard(
        proposal,
        {
          threadState,
          proposalEvents: proposalEventLogFor(env),
          markThread: (channel, thread) => markSweepThread(kv, channel, thread),
        },
        Date.now(),
        channelKind,
      );
    },
    async cardLive(ts) {
      return (await threadState.getProposalByTs(ts)).state === "found";
    },
    async threadBusy(channel, threadTs) {
      return !!(await driftCardIn(env, channel, threadTs));
    },
    ...(figma ? { figma: { versions: (fileKey: string) => measured(() => figma.versions(fileKey)) } } : {}),
    async pillarOptions() {
      if (!roadmap) return null;
      return measured(() => databaseOptions(env, roadmap, "Product Pillar"));
    },
    config: {
      plusDesign: env.PLUS_DESIGN_CHANNEL_ID?.trim() || undefined,
      plusUniversal: env.PLUS_UNIVERSAL_CHANNEL_ID?.trim() || undefined,
      unoBot: env.UNO_BOT_CHANNEL_ID?.trim() || undefined,
    },
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  });
}

/**
 * Whether a message could be a "yes, it's up to date" — no reads.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export function isDriftAnswerCandidateFor(env: Env, event: SlackMessageEvent): boolean {
  return !!env.HARNESS_KV && isDriftAnswerCandidate(event);
}

/**
 * Whether a message is a candidate yes in a thread uno-bot asked about a file
 * — one KV read, and only for a candidate — so the event handler queues it
 * without queueing every "yes" in every thread.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export async function isDriftAnswerFor(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!env.HARNESS_KV || !isDriftAnswerCandidate(event)) return false;
  try {
    return Object.keys(await kvDriftStore(env.HARNESS_KV).asked(event.channel, event.thread_ts!)).length > 0;
  } catch {
    return false;
  }
}

/**
 * A queued reply that says an asked file is up to date: withdraw its card.
 * Runs at the head of the thread's job (`slack/message-job.ts`).
 *
 * @param env - Worker bindings
 * @param event - The message
 * @returns Whether a card was withdrawn — the turn is then skipped
 */
export async function handleDriftAnswer(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!env.HARNESS_KV || !isDriftAnswerCandidate(event)) return false;
  const store = kvDriftStore(env.HARNESS_KV);
  const threadState = threadStateFor(env);
  // `answerDriftAsk` catches its own failures but a budget stop, so a reply
  // it could not read takes the ordinary engagement rule, never a turn.
  return answerDriftAsk(
    { channel: event.channel, threadTs: event.thread_ts!, user: event.user!, text: event.text ?? "" },
    {
      asked: (channel, threadTs) => store.asked(channel, threadTs),
      liveCard: (channel, thread) => driftCardIn(env, channel, thread),
      async hasTurnCard(channel, thread) {
        const cards = await threadState.getProposalsByChannel(channel);
        return cards.some((p) => !p.supersedeKey && !p.sweepRun && proposalReplyThread(p) === thread);
      },
      async retire(ts) {
        return (await threadState.retireProposal(ts)).retired;
      },
      async edit(channel, ts, text) {
        await updateMessage(env, { channel, ts, text, metadata: driftTag("drift-withdrawn") });
      },
      async post(channel, threadTs, text) {
        await postMessage(env, { channel, thread_ts: threadTs, text, metadata: driftTag("drift-question") });
      },
      async recordWithdrawn(proposal, user) {
        await recordProposalEvents(proposalEventLogFor(env), [
          { ...proposalEvent(proposal.proposalTs, "cancelled", Date.now(), "typed"), actorId: user },
        ]);
      },
    },
  );
}

/** The live drift card in a thread, a revision of it included. */
async function driftCardIn(env: Env, channel: string, thread: string): Promise<PendingProposal | null> {
  const cards = await threadStateFor(env).getProposalsByChannel(channel);
  return cards.find((p) => p.supersedeKey === DRIFT_KEY && proposalReplyThread(p) === thread) ?? null;
}

/** The sweep's tag, with this job's role: a reply under it is read by the
 *  sweep thread's rule, and the sweep's own card search passes it over. */
function driftTag(role: "drift-card" | "drift-question" | "drift-withdrawn"): SlackMessageMetadata {
  return { event_type: SWEEP_CARD_EVENT, event_payload: { role } };
}

/** The store in KV. Reads and writes are charged to the internal bucket. */
function kvDriftStore(kv: KVNamespace): DriftStore & FileDriftSink {
  const fresh = (findings: FileDriftFinding[]) => findings.filter((f) => Date.now() - f.detectedAt <= QUEUE_MAX_AGE_MS);
  const read = async (channel: string): Promise<FileDriftFinding[]> => {
    charge(1, "kv");
    return fresh((await kv.get<FileDriftFinding[]>(`${QUEUE_PREFIX}${channel}`, "json")) ?? []);
  };
  const write = async (channel: string, findings: FileDriftFinding[]): Promise<void> => {
    charge(1, "kv");
    const key = `${QUEUE_PREFIX}${channel}`;
    if (findings.length) await kv.put(key, JSON.stringify(findings), { expirationTtl: QUEUE_MAX_AGE_MS / 1000 });
    else await kv.delete(key);
  };
  const channelOf = (id: string) => id.slice(0, id.indexOf(":"));
  return {
    async add(added) {
      for (const channel of new Set(added.map((f) => f.evidence.channel))) {
        const byId = new Map((await read(channel)).map((f) => [f.id, f] as const));
        for (const f of added.filter((x) => x.evidence.channel === channel)) byId.set(f.id, f);
        await write(channel, [...byId.values()]);
      }
    },
    async pending() {
      charge(1, "kv");
      const listed = await kv.list({ prefix: QUEUE_PREFIX });
      const all: FileDriftFinding[] = [];
      for (const { name } of listed.keys) all.push(...(await read(name.slice(QUEUE_PREFIX.length))));
      return all;
    },
    async remove(ids) {
      // A finding's id leads with its channel (`FileDriftFinding.id`).
      for (const channel of new Set(ids.map(channelOf))) {
        const drop = new Set(ids);
        await write(channel, (await read(channel)).filter((f) => !drop.has(f.id)));
      }
    },
    async intakeMark(group) {
      charge(1, "kv");
      return (await kv.get<IntakeMark>(`${MARK_PREFIX}${group}`, "json")) ?? null;
    },
    async setIntakeMark(group, mark) {
      charge(1, "kv");
      await kv.put(`${MARK_PREFIX}${group}`, JSON.stringify(mark), { expirationTtl: MARK_TTL_S });
    },
    async clearIntakeMark(group) {
      charge(1, "kv");
      await kv.delete(`${MARK_PREFIX}${group}`);
    },
    async asked(channel, threadTs) {
      charge(1, "kv");
      return (await kv.get<AskRecord>(`${ASK_PREFIX}${channel}:${threadTs}`, "json")) ?? {};
    },
    async saveAsked(channel, threadTs, record) {
      charge(1, "kv");
      await kv.put(`${ASK_PREFIX}${channel}:${threadTs}`, JSON.stringify(record), { expirationTtl: ASK_TTL_S });
    },
  };
}
