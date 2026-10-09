// The Figma comment read and post on `Env` — the one file in the folder that
// names it (#900).
//
// What each port becomes:
//   • Figma: the Worker's one client (`figmaClientFor`), paced and retried.
//   • The notes: HARNESS_KV lists under the notification route's prefixes,
//     each key's time read from its metadata; a note written before the
//     metadata was costs one get.
//   • A card: `queryRoadmapCards` by its number, one Notion query.
//   • The detector: the Worker's one ModelProvider.
//   • The queue, the carded marks, MISC's list and each thread's record:
//     HARNESS_KV, with an expiry. The queue holds words, so never D1 (ADR-030).
//   • Slack: `chat.postMessage` and `chat.update` in #plus-design
//     (`PLUS_DESIGN_CHANNEL_ID`), its members, and a card staged in ThreadState
//     and put on the usage record as staged by the Worker.
//
// Every KV call is charged to the invocation's internal bucket.

import type { Env } from "../types";
import type { ModelProvider } from "../agent/model-provider";
import { charge } from "../net";
import { figmaClientFor } from "../figma/production";
import { figmaTeamsFrom } from "../figma-notify/teams";
import { queryRoadmapCards } from "../integrations/notion";
import { postMessage, updateMessage } from "../slack/api";
import { channelMembers } from "../figma-library/env";
import { threadStateFor } from "../thread-state/production";
import type { PendingProposal } from "../thread-state/index";
import { proposalEventLogFor } from "../usage/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { modelDecisionDetector } from "./detector";
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
          for (const k of res.keys) {
            const at = k.metadata?.at ?? (await json<{ at?: string }>(k.name))?.at ?? null;
            out.push({ key: k.name, at });
          }
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
