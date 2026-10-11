// The weekly Figma tidy-up bound to `Env` — the only file in the folder that
// names it.
//
//   • Figma: the teams `FIGMA_TEAM_IDS` names, listed through the one client.
//   • The Roadmap: one query for the cards the titles name, by number, and a
//     title search for a likely card. A card's owner is its design owner: the
//     first Contributor, through the Team Members map's Notion people, whom
//     the team's roles name a designer (the rule `figma-comments/read.ts` uses).
//   • Slack: where the Figma Review cards post — `FIGMA_ASK_CHANNEL_ID` when
//     set (Bill's DM while the Figma flows are in testing), else #plus-design
//     (`PLUS_DESIGN_CHANNEL_ID`); its members answer. The parent's thread is marked as a
//     sweep card's is, so the team's replies there are not all turns.
//   • KV: the week's listing, what the weeks remember, what each file's pages
//     named and what was left as is (`tools/figma-tidy-up.ts`), under
//     `figma-tidy:`.

import type { Env } from "../types";
import { budgetHeadroom, charge } from "../net";
import { postMessage, updateMessage } from "../slack/api";
import { figmaClientFor } from "../figma/production";
import { figmaTeamsFrom } from "../figma-notify/teams";
import { channelMembers } from "../figma-library/env";
import { queryRoadmapByNumbers, queryRoadmapCards } from "../integrations/notion";
import { storedTeamRoles } from "../usage/production";
import { slackPersonOfNotion } from "../usage/roles";
import { designerAmong } from "../figma-comments/read";
import { tidySkipsStore } from "../tools/figma-tidy-up";
import { markSweepThread } from "../sweep/thread-mark";
import { threadStateFor } from "../thread-state/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import type { PendingProposal } from "../thread-state/index";
import type { JobContext } from "../scheduled/runs";
import { likelyCard, projectWords, type TidyCard } from "./checks";
import {
  runTidyPost,
  runTidyRead,
  type TidyListing,
  type TidyMemory,
  type TidyPostResult,
  type TidyReadResult,
  type TidyRefs,
} from "./run";

const LISTING_KEY = "figma-tidy:listing";
const MEMORY_KEY = "figma-tidy:memory";
const REFS_KEY = "figma-tidy:refs";
/** A listing outlives its Monday by a day. */
const LISTING_TTL_S = 2 * 24 * 60 * 60;
/** The memory outlives its five weeks by one, so a quiet stretch keeps it. */
const MEMORY_TTL_S = 6 * 7 * 24 * 60 * 60;
/** What a file's pages named outlives a quiet stretch: each write keeps it
 *  half a year more. */
const REFS_TTL_S = 26 * 7 * 24 * 60 * 60;

/** The channel the tidy-up posts in: where the Figma Review cards go
 *  (`FIGMA_ASK_CHANNEL_ID`), else #plus-design. */
export function tidyChannel(env: Env): string | null {
  return env.FIGMA_ASK_CHANNEL_ID?.trim() || env.PLUS_DESIGN_CHANNEL_ID?.trim() || null;
}

function kvStore<T>(env: Env, key: string, ttlS: number): { read(): Promise<T | null>; write(v: T | null): Promise<void> } {
  const kv = env.HARNESS_KV!;
  return {
    async read() {
      charge(1, "kv");
      return (await kv.get<T>(key, "json")) ?? null;
    },
    async write(value) {
      charge(1, "kv");
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttlS });
    },
  };
}

/**
 * One read job on `Env`.
 *
 * @param env - Worker bindings
 * @param ctx - `dryRun` keeps nothing; `runDate` is the Monday
 */
export async function runTidyReadOnEnv(env: Env, ctx: JobContext): Promise<TidyReadResult | { summary: string }> {
  const figma = figmaClientFor(env);
  if (!figma) return { summary: "FIGMA_ACCESS_TOKEN not set — no tidy-up" };
  if (!env.HARNESS_KV) return { summary: "HARNESS_KV not bound — nowhere to keep the listing" };
  let teams;
  try {
    teams = figmaTeamsFrom(env.FIGMA_TEAM_IDS);
  } catch (err) {
    return { summary: `no tidy-up: ${err instanceof Error ? err.message : String(err)}` };
  }
  return runTidyRead(
    {
      figma,
      refs: kvStore<TidyRefs>(env, REFS_KEY, REFS_TTL_S),
      teams,
      listing: kvStore<TidyListing>(env, LISTING_KEY, LISTING_TTL_S),
      meter: { headroom: budgetHeadroom },
      runDate: ctx.runDate,
    },
    ctx,
  );
}

/**
 * The post job on `Env`.
 *
 * @param env - Worker bindings
 * @param ctx - `dryRun` posts, stages and keeps nothing; `runDate` is the Monday
 */
export async function runTidyPostOnEnv(env: Env, ctx: JobContext): Promise<TidyPostResult> {
  const channel = tidyChannel(env);
  if (!channel) return { posted: false, summary: "no FIGMA_ASK_CHANNEL_ID or PLUS_DESIGN_CHANNEL_ID — nothing posted" };
  const kv = env.HARNESS_KV;
  if (!kv) return { posted: false, summary: "HARNESS_KV not bound — no listing" };
  const stored = await storedTeamRoles(env);
  const ownerOf = (contributors: readonly string[]): string | null => {
    const slack = contributors.map((id) => slackPersonOfNotion(id, stored?.notionPeople)).filter((id): id is string => !!id);
    return designerAmong(slack, stored?.roles ?? {});
  };
  const threadState = threadStateFor(env);
  return runTidyPost(
    {
      listing: kvStore<TidyListing>(env, LISTING_KEY, LISTING_TTL_S),
      memory: kvStore<TidyMemory>(env, MEMORY_KEY, MEMORY_TTL_S),
      refs: kvStore<TidyRefs>(env, REFS_KEY, REFS_TTL_S),
      skips: tidySkipsStore(env),
      roadmap: {
        async cards(numbers) {
          const rows = await queryRoadmapByNumbers(env, numbers);
          return rows.flatMap((r): TidyCard[] =>
            r.number === undefined
              ? []
              : [
                  {
                    number: r.number,
                    title: r.title,
                    url: r.url,
                    designStatus: r.values["Design Status"]?.[0] ?? null,
                    devStatus: r.values["Dev Status"]?.[0] ?? null,
                    owner: ownerOf((r.persons.Contributor ?? []).map((p) => p.id)),
                  },
                ],
          );
        },
        async likely(project) {
          const words = projectWords(project);
          if (!words.length) return null;
          const { rows } = await queryRoadmapCards(env, { titleTokens: words });
          const found = likelyCard(project, rows.filter((r) => r.card_number !== null));
          return found
            ? { number: found.card_number!, title: found.title, url: found.url, designStatus: found.design_status, devStatus: found.dev_status, owner: null }
            : null;
        },
      },
      members: () => channelMembers(env, channel),
      async post(message, threadTs) {
        const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks, ...(threadTs ? { thread_ts: threadTs } : {}) });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async edit(ts, message) {
        await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
      },
      reports: threadState,
      stage: (proposal) => stageTidyCard(env, proposal),
      markThread: (ts) => markSweepThread(kv, channel, ts),
      channel,
      runDate: ctx.runDate,
      now: () => Date.now(),
    },
    ctx,
  );
}

/** Stage a card the Worker posted, and put it on the usage record like any card. */
async function stageTidyCard(env: Env, proposal: PendingProposal): Promise<void> {
  const { retired } = await threadStateFor(env).putProposal(proposal);
  const now = Date.now();
  await recordProposalEvents(proposalEventLogFor(env), [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
  ]);
}
