// File drift on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • The store: HARNESS_KV. The queue is one key per channel under
//     `figma-drift:findings:` (each end-of-day channel job writes only its
//     own), a finding older than 30 days dropped as it is read; a file's intake
//     mark under `figma-drift:intake:`, kept past its card's 72 h; a thread's
//     ask record under `figma-drift:ask:`, kept 30 days; each posted ask's live
//     record under `figma-drift:live:<channel>:<thread>:<ts>`, kept the card's
//     72 h, and beside it `figma-drift:live-file:<file>`, the one read a
//     file-change notification makes before it looks further. KV, not D1: the queue and the live records hold the thread's words
//     (ADR-030), and expire.
//   • Slack: `chat.postMessage` in the thread, tagged with the sweep's message
//     metadata so a reply under it is read by the sweep thread's rule
//     (`isSweepCardPost`); `chat.getPermalink`; `chat.update` to redraw a
//     report or edit the pointers.
//   • Staging: the sweep's own (`stageSweepCard`) — ThreadState, the staged
//     row on the usage record, and the thread mark — one card at a time; each
//     report's record in ThreadState beside them (`putReport`).
//   • The file: the Figma client (`src/figma/`) — `/versions` for a file's
//     last change and its newest publish's handle, `/nodes` for the linked
//     frame; no client, and no file is looked at, without a token.
//   • The judge: the `chill` tier through `selectProvider` (`./judge.ts`).
//   • The pillar options: the Roadmap database's schema
//     (`NOTION_ROADMAP_DB_ID`, `Product Pillar`).
//
// A Worker without HARNESS_KV asks nothing, and the sweep counts file drift
// and leaves it, as it did before.

import type { Env } from "../types";
import { budgetHeadroom, charge } from "../net";
import { getPermalink, postMessage, updateMessage, type SlackMessageMetadata } from "../slack/api";
import { threadStateFor } from "../thread-state/production";
import { proposalEvent, recordProposalEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { databaseOptions } from "../integrations/notion";
import { figmaClientFor } from "../figma/production";
import type { FigmaClient } from "../figma/client";
import { selectProvider } from "../agent/run-agent";
import { measured } from "../sweep/env";
import { stageSweepCard } from "../sweep/run";
import { SWEEP_CARD_EVENT } from "../sweep/cards";
import { markSweepThread } from "../sweep/thread-mark";
import type { ScheduledJob } from "../scheduled/runs";
import { DRIFT_CARD_TTL_MS } from "./copy";
import { LEGACY_DRIFT_KEY, type FileDriftFinding, type FileDriftSink } from "./finding";
import { proposalReplyThread } from "../thread-state/index";
import { modelFrameJudge } from "./judge";
import {
  recheckLiveAsks,
  recheckOnUpdate,
  runDriftAsks,
  type AskRecord,
  type DriftPostReport,
  type DriftRecheckReport,
  type DriftStore,
  type IntakeMark,
  type LiveAsk,
} from "./run";

const QUEUE_PREFIX = "figma-drift:findings:";
const MARK_PREFIX = "figma-drift:intake:";
const ASK_PREFIX = "figma-drift:ask:";
const LIVE_PREFIX = "figma-drift:live:";
/** Not under LIVE_PREFIX: `live-file:` never matches the `live:` list. */
const LIVE_FILE_PREFIX = "figma-drift:live-file:";
const DAY_S = 24 * 60 * 60;
/** A queued finding not asked within 30 days is dropped as the queue is read. */
const QUEUE_MAX_AGE_MS = 30 * DAY_S * 1000;
/** A mark outlives its card by a day, so a retry still finds it. */
const MARK_TTL_S = DRIFT_CARD_TTL_MS / 1000 + DAY_S;
/** A thread is not asked twice about a file for this long. */
const ASK_TTL_S = 30 * DAY_S;
/** A live record lasts as long as its question may be withdrawn. */
const LIVE_TTL_S = DRIFT_CARD_TTL_MS / 1000;

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
 * @param opts - `dryRun` reads, judges and drafts, and posts, stages and writes nothing
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
  const figma = figmaFor(env);
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
      async edit(channel, ts, message) {
        await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks, metadata: driftTag("drift-card") });
      },
      async markThread(channel, threadTs) {
        if (!(await threadState.readHistory({ channel, thread: threadTs })).length) await markSweepThread(kv, channel, threadTs);
      },
    },
    reports: threadState,
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
    ...(figma ? { figma, judge: modelFrameJudge(selectProvider(env)) } : {}),
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
 * The `figma-drift-recheck` job on `Env`, in both scheduled runs: each live
 * card whose Figma file now shows its decision, and each pointer-only message
 * whose files all do, is edited in place.
 *
 * @param env - Worker bindings
 * @param job - The job
 * @param opts - `dryRun` reads and judges, and edits, retires and writes nothing
 */
export async function runDriftRecheckOnEnv(
  env: Env,
  job: ScheduledJob,
  opts: { dryRun: boolean },
): Promise<DriftRecheckReport | { summary: string }> {
  if (!env.HARNESS_KV) return { summary: "HARNESS_KV not bound — no live question to look at" };
  return recheckLiveAsks(job, recheckDepsFor(env, env.HARNESS_KV, opts.dryRun));
}

/**
 * A file-change notification's look at one file, on `Env` (#896): one KV read
 * when no live drift question names the file, the re-check when one does.
 * Runs as the FILE_UPDATE job on the `figma/events` runner
 * (`figma-notify/job.ts`), a backstop's queued change included.
 *
 * @param env - Worker bindings
 * @param figmaKey - The changed file's Figma key
 * @returns What it did, for the job's log line
 */
export async function recheckOnUpdateOnEnv(env: Env, figmaKey: string): Promise<string> {
  if (!env.HARNESS_KV) return "no HARNESS_KV binding, so no drift question to look at";
  const report = await recheckOnUpdate(figmaKey, recheckDepsFor(env, env.HARNESS_KV, false));
  return report ? `drift re-check: ${report.summary}` : "no live drift question names it";
}

/** The re-check's dependencies on `Env`. */
function recheckDepsFor(env: Env, kv: KVNamespace, dryRun: boolean): Parameters<typeof recheckOnUpdate>[1] {
  const figma = figmaFor(env);
  const threadState = threadStateFor(env);
  return {
    store: kvDriftStore(kv),
    ...(figma ? { figma, judge: modelFrameJudge(selectProvider(env)) } : {}),
    async retire(ts) {
      return (await threadState.retireProposal(ts)).retired;
    },
    async edit(channel, ts, message) {
      await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks, metadata: driftTag("drift-withdrawn") });
    },
    reports: threadState,
    async recordWithdrawn(proposalTs) {
      await recordProposalEvents(proposalEventLogFor(env), [proposalEvent(proposalTs, "cancelled", Date.now(), "worker")]);
    },
    async legacyCard(channel, thread) {
      const cards = await threadState.getProposalsByChannel(channel);
      return cards.find((p) => p.supersedeKey === LEGACY_DRIFT_KEY && proposalReplyThread(p) === thread) ?? null;
    },
    async cardFiled(ts) {
      return (await proposalEventLogFor(env).eventsOf(ts)).some((e) => e.event === "confirmed");
    },
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun,
  };
}

/** The Figma reads a drift job makes, each measured against the budget. */
function figmaFor(env: Env): Pick<FigmaClient, "versions" | "nodes"> | undefined {
  const figma = figmaClientFor(env);
  if (!figma) return undefined;
  return {
    versions: (fileKey, opts) => measured(() => figma.versions(fileKey, opts)),
    nodes: (fileKey, ids, opts) => measured(() => figma.nodes(fileKey, ids, opts)),
  };
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
  const liveKey = (a: Pick<LiveAsk, "channel" | "threadTs" | "ts">) => `${LIVE_PREFIX}${a.channel}:${a.threadTs}:${a.ts}`;
  const liveUnder = async (prefix: string): Promise<LiveAsk[]> => {
    charge(1, "kv");
    const listed = await kv.list({ prefix });
    const out: LiveAsk[] = [];
    for (const { name } of listed.keys) {
      charge(1, "kv");
      const ask = await kv.get<LiveAsk>(name, "json");
      if (ask) out.push(ask);
    }
    return out.sort((a, b) => a.askedAt - b.askedAt);
  };
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
    liveAsks: () => liveUnder(LIVE_PREFIX),
    // The trailing colon keeps thread `1.0` from matching thread `1.01`.
    liveAsksIn: (channel, threadTs) => liveUnder(`${LIVE_PREFIX}${channel}:${threadTs}:`),
    async saveLiveAsk(ask) {
      charge(1, "kv");
      // Its TTL runs from when it was asked, so a re-save never lengthens it.
      const left = Math.ceil((ask.askedAt + DRIFT_CARD_TTL_MS - Date.now()) / 1000);
      if (left < 60) return;
      await kv.put(liveKey(ask), JSON.stringify(ask), { expirationTtl: Math.min(left, LIVE_TTL_S) });
    },
    async dropLiveAsk(ask) {
      charge(1, "kv");
      await kv.delete(liveKey(ask));
    },
    async markLiveFile(fileKey, until) {
      // Written, never read back first: the newest ask's expiry is the latest,
      // and an older one expiring early only skips a look the runs still make.
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left < 60) return;
      charge(1, "kv");
      await kv.put(`${LIVE_FILE_PREFIX}${fileKey}`, JSON.stringify({ until }), { expirationTtl: Math.min(left, LIVE_TTL_S) });
    },
    async liveFileUntil(fileKey) {
      charge(1, "kv");
      return (await kv.get<{ until: number }>(`${LIVE_FILE_PREFIX}${fileKey}`, "json"))?.until ?? null;
    },
  };
}
