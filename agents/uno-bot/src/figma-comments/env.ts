// The Figma comment read and post on `Env` — the one file in the folder that
// names it (#900).
//
// What each port becomes:
//   • Figma: the Worker's one client (`figmaClientFor`), paced and retried.
//   • The notes: HARNESS_KV lists under the notification route's prefixes,
//     each key's time read from its metadata; a note with none has no time.
//   • A card: `queryRoadmapCards` by its number, one Notion query.
//   • The team's roles: the role map the daily sync keeps (`teamRolesFor`),
//     one KV read, which names a card's design owner.
//   • The detector: the Worker's one ModelProvider.
//   • The queue, the carded marks, MISC's list and each thread's record:
//     HARNESS_KV, with an expiry. The queue holds words, so never D1 (ADR-030).
//   • Slack: `chat.postMessage` and `chat.update` in #plus-design
//     (`PLUS_DESIGN_CHANNEL_ID`), its members, and a card staged in ThreadState
//     and put on the usage record as staged by the Worker.
//   • New wording for a decision (`./revise.ts`) — Review's Needs changes, or
//     a reply on an explicit cue: the thread's record, the card in
//     ThreadState and its Needs changes lock, the page read fresh as the
//     sweep reads one, and the revised card staged the same way.
//
// Every KV call is charged to the invocation's internal bucket.

import type { Env } from "../types";
import type { ModelProvider } from "../agent/model-provider";
import { selectProvider } from "../agent/run-agent";
import type { SlackMessageEvent } from "../slack/types";
import { measured, readSource } from "../sweep/env";
import { charge, rethrowIfBudget } from "../net";
import { figmaClientFor } from "../figma/production";
import { figmaTeamsFrom } from "../figma-notify/teams";
import { queryRoadmapCards } from "../integrations/notion";
import { postMessage, updateMessage } from "../slack/api";
import { channelMembers } from "../figma-library/env";
import { threadStateFor } from "../thread-state/production";
import type { PendingProposal } from "../thread-state/index";
import { proposalEventLogFor, teamRolesFor } from "../usage/production";
import { getBotIdentity } from "../slack/api";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { modelDecisionDetector } from "./detector";
import { reviseDecision } from "./revise";
import type { DecisionThread, QueuedFile, SweepFigmaComments } from "./queue";

const DAY_S = 24 * 60 * 60;

/** One key per file waiting for its morning. */
export const QUEUE_PREFIX = "sweep:figma-decisions:";
/** A week's mornings, and one: a file the post could not reach for longer is dropped. */
export const QUEUE_TTL_S = 8 * DAY_S;
/** A thread carded once is never carded again, for this long. */
export const CARDED_PREFIX = "figma-comments:carded:";
export const CARDED_TTL_S = 90 * DAY_S;
/** MISC's file list, refreshed weekly by the read itself. */
export const MISC_KEY = "figma-comments:misc-files";
export const MISC_TTL_S = 8 * DAY_S;
/** A decision thread's record, for as long as its cards can be reworded and a day more. */
export const THREAD_PREFIX = "figma-decisions:thread:";
export const THREAD_TTL_S = 4 * DAY_S;
/** KV list pages read under one prefix. */
const LIST_PAGES = 5;

/**
 * The comment read's and post's ports on `Env`, or undefined when the Worker
 * has no Figma token.
 *
 * @param env - Worker bindings
 * @param kv - HARNESS_KV
 * @param provider - The model the detector asks
 */
export function figmaCommentsFor(env: Env, kv: KVNamespace, provider: ModelProvider): SweepFigmaComments | undefined {
  const figma = figmaClientFor(env);
  if (!figma) return undefined;
  let miscTeamId: string | undefined;
  try {
    miscTeamId = figmaTeamsFrom(env.FIGMA_TEAM_IDS).find((t) => t.name.toLowerCase() === "misc")?.id;
  } catch (err) {
    console.warn(`[figma-comments] FIGMA_TEAM_IDS unread, so no file is left out as MISC: ${err instanceof Error ? err.message : String(err)}`);
  }
  const json = <T>(key: string) => {
    charge(1, "kv");
    return kv.get<T>(key, "json");
  };
  const put = (key: string, value: unknown, ttlS: number) => {
    charge(1, "kv");
    return kv.put(key, JSON.stringify(value), { expirationTtl: ttlS });
  };
  const channel = env.PLUS_DESIGN_CHANNEL_ID?.trim();

  return {
    figma,
    notes: {
      async list(prefix) {
        const out: Array<{ key: string; at: string | null }> = [];
        let cursor: string | undefined;
        for (let page = 0; page < LIST_PAGES; page++) {
          charge(1, "kv");
          const res = await kv.list<{ at?: string }>({ prefix, ...(cursor ? { cursor } : {}) });
          // A key's time is its metadata, read with the list. A note written
          // before the route kept metadata has none and reads as null — for
          // a `changed:` note, no window holds it — rather than costing a
          // get each night until it expires.
          for (const k of res.keys) out.push({ key: k.name, at: k.metadata?.at ?? null });
          if (res.list_complete) break;
          cursor = res.cursor;
        }
        return out;
      },
    },
    async card(number) {
      const { rows } = await queryRoadmapCards(env, { cardNumber: number });
      const card = rows.find((r) => r.card_number === number);
      return card ? { url: card.url, title: card.title } : null;
    },
    roles: () => teamRolesFor(env),
    detector: modelDecisionDetector(provider),
    ...(miscTeamId ? { miscTeamId } : {}),
    queue: {
      async list() {
        const files: QueuedFile[] = [];
        let cursor: string | undefined;
        for (let page = 0; page < LIST_PAGES; page++) {
          charge(1, "kv");
          const res = await kv.list({ prefix: QUEUE_PREFIX, ...(cursor ? { cursor } : {}) });
          for (const k of res.keys) {
            const file = await json<QueuedFile>(k.name);
            if (file) files.push(file);
          }
          if (res.list_complete) break;
          cursor = res.cursor;
        }
        return files;
      },
      read: (fileKey) => json<QueuedFile>(`${QUEUE_PREFIX}${fileKey}`),
      write: (file) => put(`${QUEUE_PREFIX}${file.fileKey}`, file, QUEUE_TTL_S),
      async remove(fileKey) {
        charge(1, "kv");
        await kv.delete(`${QUEUE_PREFIX}${fileKey}`);
      },
    },
    carded: {
      async has(commentId) {
        return (await json<number>(`${CARDED_PREFIX}${commentId}`)) !== null;
      },
      async add(commentIds) {
        for (const id of commentIds) await put(`${CARDED_PREFIX}${id}`, Date.now(), CARDED_TTL_S);
      },
    },
    misc: {
      read: () => json<{ files: string[]; at: number }>(MISC_KEY),
      write: (value) => put(MISC_KEY, value, MISC_TTL_S),
    },
    ...(channel
      ? {
          slack: {
            channel,
            async post(message) {
              const res = await postMessage(env, {
                channel,
                text: message.text,
                ...(message.blocks ? { blocks: message.blocks } : {}),
                ...(message.thread_ts ? { thread_ts: message.thread_ts } : {}),
              });
              return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
            },
            async edit(ts, message) {
              await updateMessage(env, { channel, ts, text: message.text, ...(message.blocks ? { blocks: message.blocks } : {}) });
            },
            members: () => channelMembers(env, channel),
            stage: (proposal) => stageDecisionCard(env, proposal),
            reports: threadStateFor(env),
          },
        }
      : {}),
    threads: decisionThreadsOn(kv),
  };
}

/** Each decision thread's record in HARNESS_KV. */
export function decisionThreadsOn(kv: KVNamespace): NonNullable<SweepFigmaComments["threads"]> {
  return {
    async read(ts) {
      charge(1, "kv");
      return kv.get<DecisionThread>(`${THREAD_PREFIX}${ts}`, "json");
    },
    async write(thread) {
      charge(1, "kv");
      await kv.put(`${THREAD_PREFIX}${thread.ts}`, JSON.stringify(thread), { expirationTtl: THREAD_TTL_S });
    },
  };
}

/**
 * Stage a decision card the Worker posted, and put it on the usage record like
 * any card — staged via the Worker in #plus-design, and superseded for any
 * card the staging retired (a reworded revision's predecessor).
 */
export async function stageDecisionCard(env: Env, proposal: PendingProposal): Promise<void> {
  const { retired } = await threadStateFor(env).putProposal(proposal);
  const now = Date.now();
  await recordProposalEvents(proposalEventLogFor(env), [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
  ]);
}

// ── A reply in a decision thread ──────────────────────────────────────────────

/**
 * Whether a message may be a reply rewording a decision: a person's reply in a
 * #plus-design thread, with text. Shape only — whether the thread is a
 * decision thread is one KV read, in `isFigmaDecisionThread`.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export function isFigmaDecisionCandidate(env: Env, event: SlackMessageEvent): boolean {
  const channel = env.PLUS_DESIGN_CHANNEL_ID?.trim();
  if (!channel || event.channel !== channel || !event.thread_ts || event.thread_ts === event.ts || !env.HARNESS_KV) return false;
  if (event.bot_id || !event.user || (event.subtype && event.subtype !== "thread_broadcast")) return false;
  return !!event.text?.trim();
}

/**
 * Whether a #plus-design thread is a comment-decision thread, for as long as
 * its record lasts. One KV read, and only for a reply in that channel.
 *
 * @param env - Worker bindings
 * @param channel - The reply's channel
 * @param threadTs - The reply's thread
 */
export async function isFigmaDecisionThread(env: Env, channel: string, threadTs: string): Promise<boolean> {
  if (!env.HARNESS_KV || channel !== env.PLUS_DESIGN_CHANNEL_ID?.trim()) return false;
  const thread = await decisionThreadsOn(env.HARNESS_KV).read(threadTs);
  return !!thread && thread.channel === channel && thread.ts === threadTs;
}

/**
 * A queued reply in a decision thread: revise the decision it rewords. Runs
 * at the head of the thread's job (`slack/message-job.ts`).
 *
 * @param env - Worker bindings
 * @param event - The message
 * @returns Whether it was a rewording, handled — the turn is then skipped
 */
export async function handleFigmaDecisionReply(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!isFigmaDecisionCandidate(env, event)) return false;
  const text = event.text ?? "";
  const kv = env.HARNESS_KV!;
  const threads = decisionThreadsOn(kv);
  const store = threadStateFor(env);
  const events = proposalEventLogFor(env);
  return reviseDecision(
    {
      thread: { read: () => threads.read(event.thread_ts!), write: (t) => threads.write(t) },
      async card(ts) {
        const found = await store.getProposalByTs(ts);
        return found.state === "found" ? found.proposal : null;
      },
      page: (url) => measured(() => readSource(env, url, "notion")),
      detector: modelDecisionDetector(selectProvider(env)),
      async post(message) {
        const res = await postMessage(env, {
          channel: event.channel,
          text: message.text,
          thread_ts: message.thread_ts,
          ...(message.blocks ? { blocks: message.blocks } : {}),
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      stage: (proposal) => stageDecisionCard(env, proposal),
      async edit(ts, message) {
        await updateMessage(env, { channel: event.channel, ts, text: message.text, blocks: message.blocks });
      },
      reports: store,
      async restore(proposal) {
        // Back in place, not staged anew: its staged row stands.
        const { retired } = await store.putProposal(proposal);
        await recordProposalEvents(events, supersededEvents(retired, Date.now(), "worker"));
      },
      async retire(ts) {
        await store.retireProposal(ts);
      },
      clearRevising: (ts) => store.clearRevising(ts),
      superseded: (tss) => recordProposalEvents(events, supersededEvents(tss, Date.now(), "worker")),
      now: () => Date.now(),
    },
    { channel: event.channel, threadTs: event.thread_ts!, user: event.user!, text, mentionsBot: await mentionsBot(env, text) },
  );
}

/**
 * Whether a message @mentions uno-bot. With the bot's identity unread, any
 * mention counts: a question for the turn taken as new wording would retire a
 * card, and a rewording sent to the turn costs only an answer.
 */
async function mentionsBot(env: Env, text: string): Promise<boolean> {
  if (!/<@[A-Z0-9]+/.test(text)) return false;
  const identity = await getBotIdentity(env).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  return identity ? text.includes(`<@${identity.userId}`) : true;
}
