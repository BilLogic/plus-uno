// Card follow-ups on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • The Roadmap reads and the Notion users: `./notion.ts`, each measured.
//   • People: a Notion user's name matched to one Slack member (the sweep's
//     directory lookup), and a Slack member's real or display name matched to
//     one Notion person — exactly one either way, or nobody.
//   • The store: commitment reminders' own (`USAGE_DB` + HARNESS_KV).
//   • Slack: `chat.postMessage`, `chat.update` and `chat.getPermalink` with the
//     bot token; a proposal card rendered by the proposal renderer, posted in
//     the follow-up's thread and staged the sweep's way (`stageSweepCard`), so
//     it lands on the usage record as staged.
//   • The thread marks: the sweep card's (`markSweepThread`), so the team's
//     replies under a follow-up don't start turns; and the follow-up reply
//     mark (`./reply-mark.ts`), so only a reply in a thread holding an F4
//     question or an F5 list reaches the D1 read that finds its follow-up.
//   • A running note's card to-dos: a hook the capture sweep's notes job calls
//     for each team note past its guard (`cardTodoNoteHookFor`).
//
// A Worker missing a binding keeps no follow-ups and sends nothing.

import type { Env } from "../types";
import { selectProvider } from "../agent/run-agent";
import { budgetHeadroom } from "../net";
import { getBotIdentity, getPermalink, postMessage, updateMessage, usersInfo } from "../slack/api";
import type { SlackMessageEvent } from "../slack/types";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import { findSlackUsers, slackDirectoryFor } from "../tools/slack-people";
import { threadStateFor } from "../thread-state/production";
import { proposalEventLogFor } from "../usage/production";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import type { CommitmentRecord } from "../commitments/store";
import { TAP_REFUSED } from "../commitments/copy";
import type { ReminderReaction } from "../commitments/run";
import { commitmentStoreFor as storeFor } from "../commitments/store-env";
import { measured } from "../sweep/env";
import { stageSweepCard } from "../sweep/run";
import { markSweepThread } from "../sweep/thread-mark";
import type { SweepThread } from "../sweep/finding";
import { isReplyThread, markReplyThread, readScanSkips, writeScanSkips } from "./reply-mark";
import {
  lastCommentAt,
  notionBotUserId,
  notionUserForName,
  notionUserName,
  queryActiveCards,
  readCard,
  roadmapOptions,
  roadmapTitlesMatching,
} from "./notion";
import {
  answerCardFollowUp,
  cardFollowUps,
  cardTodoNoteHook,
  cardTodoThreadHook,
  followThroughProposal,
  handleCardReplySafely,
  type ReadNote,
  runCardFollowThroughScan,
  type AnswerDeps,
  type CardFollowUps,
  type CardPeople,
  type CardProposal,
  type CardReads,
  type FollowThroughConfig,
  type ScanReport,
} from "./run";
import { modelCardTodoDetector } from "./todo";

function configFor(env: Env, botUserId?: string | null): FollowThroughConfig {
  return {
    plusDesign: env.PLUS_DESIGN_CHANNEL_ID?.trim() || undefined,
    plusUniversal: env.PLUS_UNIVERSAL_CHANNEL_ID?.trim() || undefined,
    unoBot: env.UNO_BOT_CHANNEL_ID?.trim() || undefined,
    botUserId: botUserId ?? null,
  };
}

function readsFor(env: Env): CardReads {
  return {
    activeCards: () => measured(() => queryActiveCards(env)),
    card: (pageId) => measured(() => readCard(env, pageId)),
    lastCommentAt: (pageId) => measured(() => lastCommentAt(env, pageId, Date.now())),
    titlesMatching: (words) => measured(() => roadmapTitlesMatching(env, words)),
    pillarOptions: () => measured(() => roadmapOptions(env, "Product Pillar")),
    statusOptions: () => measured(() => roadmapOptions(env, "Design Status")),
    botUserId: () => measured(() => notionBotUserId(env)).catch(() => null),
  };
}

/** People lookups, each answer kept for the life of the object — one job or
 *  one reaction. */
function peopleFor(env: Env): CardPeople {
  const directory = slackDirectoryFor(env);
  const cache = new Map<string, Promise<string | null>>();
  const once = (key: string, fn: () => Promise<string | null>) => {
    if (!cache.has(key)) cache.set(key, fn().catch(() => null));
    return cache.get(key)!;
  };
  const slackIdForName = (name: string) =>
    once(`slack:${name}`, async () => {
      if (!name.trim()) return null;
      const raw = await measured(() => findSlackUsers(directory, name));
      const r = JSON.parse(raw) as { ok?: boolean; matches?: { id?: string }[] };
      return r.ok && r.matches?.length === 1 ? (r.matches[0]!.id ?? null) : null;
    });
  return {
    slackIdForName,
    slackIdForNotionUser: (id) =>
      once(`notion-user:${id}`, async () => {
        const name = await measured(() => notionUserName(env, id));
        return name ? slackIdForName(name) : null;
      }),
    notionUserForSlack: (slackId) =>
      once(`slack-user:${slackId}`, async () => {
        const res = await measured(() => usersInfo(env, slackId));
        const user = res.ok ? res.user : undefined;
        if (!user || user.is_bot || user.deleted) return null;
        for (const name of [user.real_name, user.profile?.display_name]) {
          const id = name ? await measured(() => notionUserForName(env, name)) : null;
          if (id) return id;
        }
        return null;
      }),
  };
}

/**
 * The end-of-day `card-follow-through` job on `Env`.
 *
 * @param env - Worker bindings
 * @param job - The job
 * @param opts - `dryRun` reads and keeps nothing; `runDate` dates what it keeps
 */
export async function runCardFollowThroughOnEnv(env: Env, job: ScheduledJob, opts: JobContext): Promise<ScanReport | { summary: string }> {
  const store = storeFor(env);
  if (!store) return { summary: "USAGE_DB or HARNESS_KV not bound — no card follow-ups" };
  if (!env.NOTION_ROADMAP_DB_ID) return { summary: "NOTION_ROADMAP_DB_ID not set — no card follow-ups" };
  const kv = env.HARNESS_KV!;
  return runCardFollowThroughScan(job, {
    reads: readsFor(env),
    people: peopleFor(env),
    store,
    skips: { read: () => readScanSkips(kv), write: (marks) => writeScanSkips(kv, marks, Date.now()) },
    config: configFor(env),
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}

/**
 * The sweep's per-thread hook for card to-dos, or undefined without the
 * bindings.
 */
export function cardTodoThreadHookFor(env: Env, opts: JobContext): ((thread: SweepThread, since: string) => Promise<void>) | undefined {
  const store = storeFor(env);
  if (!store) return undefined;
  const detector = modelCardTodoDetector(selectProvider(env));
  return cardTodoThreadHook({
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    store,
    config: configFor(env),
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}

/**
 * The morning's handler for card rows, for the commitment job.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` reads and posts nothing
 * @param botUserId - The bot's own id
 */
export function cardFollowUpsFor(env: Env, opts: { dryRun: boolean }, botUserId?: string | null): CardFollowUps | undefined {
  const store = storeFor(env);
  if (!store || !env.HARNESS_KV) return undefined;
  const kv = env.HARNESS_KV;
  return cardFollowUps({
    reads: readsFor(env),
    slack: {
      permalink: (channel, ts) => measured(() => getPermalink(env, channel, ts)),
      async post(to, message) {
        const res = await postMessage(env, {
          channel: to.channel,
          text: message.text,
          blocks: message.blocks,
          ...(to.threadTs ? { thread_ts: to.threadTs } : {}),
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
    },
    store,
    markThread: (channel, thread) => markSweepThread(kv, channel, thread),
    markReplyThread: (channel, thread, ttlMs) => markReplyThread(kv, channel, thread, ttlMs),
    config: configFor(env, botUserId),
    dryRun: opts.dryRun,
  });
}

/**
 * The capture sweep's per-note hook for card to-dos, or undefined without the
 * bindings. The notes job calls it only for a team note past its guard.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` detects and keeps nothing; `runDate` dates what it keeps
 */
export function cardTodoNoteHookFor(env: Env, opts: JobContext): ((note: ReadNote) => Promise<void>) | undefined {
  const store = storeFor(env);
  if (!store) return undefined;
  const detector = modelCardTodoDetector(selectProvider(env));
  return cardTodoNoteHook({
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    store,
    people: peopleFor(env),
    config: configFor(env),
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}

function answerDepsFor(env: Env, botUserId?: string | null): AnswerDeps | undefined {
  const store = storeFor(env);
  if (!store || !env.HARNESS_KV) return undefined;
  const kv = env.HARNESS_KV;
  return {
    store,
    reads: readsFor(env),
    people: peopleFor(env),
    async update(channel, ts, message) {
      return (await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks })).ok;
    },
    async post(to, text) {
      await postMessage(env, { channel: to.channel, thread_ts: to.threadTs, text });
    },
    stage: (proposal) => stageCardOnEnv(env, kv, proposal),
    markReplyThread: (channel, thread, ttlMs) => markReplyThread(kv, channel, thread, ttlMs),
    isReplyThread: (channel, thread) => isReplyThread(kv, channel, thread),
    config: configFor(env, botUserId),
    now: () => Date.now(),
  };
}

/** Post a follow-through card in its thread and stage it; false when it did
 *  not go up. */
async function stageCardOnEnv(env: Env, kv: KVNamespace, p: CardProposal): Promise<boolean> {
  const rendered = renderProposalCard(p.card);
  const sent = await postMessage(env, {
    channel: p.channel,
    thread_ts: p.threadTs,
    text: rendered.text,
    blocks: rendered.blocks ?? proposalCardBlocks(rendered.text),
  });
  if (!sent.ok || !sent.ts) return false;
  await stageSweepCard(
    followThroughProposal(p, { ts: sent.ts, text: rendered.text }),
    {
      threadState: threadStateFor(env),
      proposalEvents: proposalEventLogFor(env),
      markThread: (channel, thread) => markSweepThread(kv, channel, thread),
    },
    Date.now(),
    p.channelKind,
  );
  return true;
}

/**
 * A reaction on a card follow-up, for the reminder door
 * (`ReminderDoorDeps.cards`).
 *
 * @param env - Worker bindings
 */
export function cardAnswerFor(env: Env): ((c: CommitmentRecord, r: ReminderReaction) => Promise<string | void>) | undefined {
  if (!storeFor(env)) return undefined;
  return async (c, r) => {
    const deps = answerDepsFor(env, (await getBotIdentity(env))?.userId ?? null);
    return deps ? answerCardFollowUp(c, r, deps) : TAP_REFUSED.gone;
  };
}

/** A pick of Design Status is a word or two, or a number: one short line. */
const SHORT_REPLY_CHARS = 60;

/**
 * Whether a message could answer a card follow-up, by its shape alone: a
 * person's reply in a #plus-design or #plus-universal thread that @-mentions
 * someone (F4's owner) or is one short line (F5's pick). Reads nothing; the
 * dispatch also asks the thread's reply mark (`mayBeCardReply`), and
 * `handleCardReplyOnEnv` asks it again before any D1 read.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export function isCardReplyCandidate(env: Env, event: SlackMessageEvent): boolean {
  const channels = [env.PLUS_DESIGN_CHANNEL_ID?.trim(), env.PLUS_UNIVERSAL_CHANNEL_ID?.trim()].filter(Boolean);
  if (!event.thread_ts || event.thread_ts === event.ts || !channels.includes(event.channel)) return false;
  if (event.bot_id || !event.user || (event.subtype && event.subtype !== "thread_broadcast")) return false;
  if (!env.USAGE_DB || !env.HARNESS_KV) return false;
  const text = (event.text ?? "").trim();
  return /<@[UW][A-Z0-9]+(?:\|[^>]*)?>/.test(text) || (!!text && text.length <= SHORT_REPLY_CHARS && !text.includes("\n"));
}

/**
 * Whether a message should be queued as a possible follow-up answer: the
 * right shape (`isCardReplyCandidate`) in a thread carrying the reply mark.
 * One KV read, and only for a message of that shape.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export async function mayBeCardReply(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!isCardReplyCandidate(env, event) || !env.HARNESS_KV) return false;
  return isReplyThread(env.HARNESS_KV, event.channel, event.thread_ts!).catch(() => false);
}

/**
 * A queued reply under a card follow-up (`handleCardReplySafely`). True when
 * it was one, and the turn is then skipped. Never throws, a budget stop
 * included: a failure reads as "not one", and the reply takes its ordinary
 * path, engagement check and all.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export async function handleCardReplyOnEnv(env: Env, event: SlackMessageEvent): Promise<boolean> {
  try {
    if (!isCardReplyCandidate(env, event)) return false;
    const deps = answerDepsFor(env, (await getBotIdentity(env))?.userId ?? null);
    if (!deps) return false;
    return await handleCardReplySafely({ channel: event.channel, threadTs: event.thread_ts!, user: event.user!, text: event.text ?? "" }, deps);
  } catch (err) {
    console.error(`[follow-through] reply not handled: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
