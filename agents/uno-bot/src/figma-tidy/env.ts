// The weekly Figma tidy-up bound to `Env` — the only file in the folder that
// names it.
//
//   • Figma: the teams `FIGMA_TEAM_IDS` names, listed through the one client.
//   • The Roadmap: one query for the cards the titles name, by number, and a
//     title search for a likely card. A card's owner is its design owner: the
//     first Contributor, through the Team Members map's Notion people, whom
//     the team's roles name a designer (the rule `figma-comments/read.ts` uses).
//   • Slack: where the Figma Review cards post (`figmaReviewChannel`) —
//     Bill's DM while the Figma flows are in testing; its members answer. The
//     parent's thread is marked as a sweep card's is, so the team's replies
//     there are not all turns.
//   • KV: the week's listing, what the weeks remember, what each file's pages
//     named and what was left as is (`./store.ts`).

import type { Env } from "../types";
import { budgetHeadroom } from "../net";
import { postMessage, updateMessage } from "../slack/api";
import { figmaClientFor } from "../figma/production";
import { figmaTeamsFrom } from "../figma-notify/teams";
import { channelMembers } from "../figma-library/env";
import { figmaReviewChannel } from "../figma-ask/env";
import { queryRoadmapByNumbers, queryRoadmapCards } from "../integrations/notion";
import { storedTeamRoles } from "../usage/production";
import { roleOf, slackPersonOfNotion, type NotionPeople, type TeamRoles } from "../usage/roles";
import { designerAmong } from "../figma-comments/read";
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
  type TidyPostResult,
  type TidyReadResult,
} from "./run";
import { tidyStore } from "./store";


/** A Roadmap card's fields, whichever query read it. */
type RoadmapFields = Pick<TidyCard, "number" | "title" | "url" | "designStatus" | "devStatus">;

/**
 * A Roadmap card as the checks read it: its design owner the first of its
 * Contributors the roles name a designer (`designerAmong`), and every such
 * Contributor's first name for a title's designers.
 */
function tidyCardOf(
  fields: RoadmapFields,
  contributors: ReadonlyArray<{ id: string; name: string }>,
  team: { notionPeople?: NotionPeople; roles: TeamRoles },
): TidyCard {
  const designers = contributors.flatMap((p) => {
    const slack = slackPersonOfNotion(p.id, team.notionPeople);
    return slack && roleOf(slack, team.roles) === "design" ? [{ slack, name: p.name.trim().split(/\s+/)[0] ?? "" }] : [];
  });
  return {
    ...fields,
    owner: designerAmong(designers.map((d) => d.slack), team.roles),
    designers: [...new Set(designers.map((d) => d.name).filter(Boolean))],
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
      refs: tidyStore(env, "refs"),
      teams,
      listing: tidyStore(env, "listing"),
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
  const channel = figmaReviewChannel(env);
  if (!channel) return { posted: false, summary: "no FIGMA_ASK_CHANNEL_ID or PLUS_DESIGN_CHANNEL_ID — nothing posted" };
  const kv = env.HARNESS_KV;
  if (!kv) return { posted: false, summary: "HARNESS_KV not bound — no listing" };
  const stored = await storedTeamRoles(env);
  const team = { ...(stored?.notionPeople ? { notionPeople: stored.notionPeople } : {}), roles: stored?.roles ?? {} };
  const threadState = threadStateFor(env);
  return runTidyPost(
    {
      listing: tidyStore(env, "listing"),
      memory: tidyStore(env, "memory"),
      refs: tidyStore(env, "refs"),
      skips: tidyStore(env, "skips"),
      roadmap: {
        async cards(numbers) {
          const rows = await queryRoadmapByNumbers(env, numbers);
          return rows.flatMap((r): TidyCard[] =>
            r.number === undefined
              ? []
              : [
                  tidyCardOf(
                    {
                      number: r.number,
                      title: r.title,
                      url: r.url,
                      designStatus: r.values["Design Status"]?.[0] ?? null,
                      devStatus: r.values["Dev Status"]?.[0] ?? null,
                    },
                    r.persons.Contributor ?? [],
                    team,
                  ),
                ],
          );
        },
        async likely(project) {
          const words = projectWords(project);
          if (!words.length) return null;
          const { rows } = await queryRoadmapCards(env, { titleTokens: words });
          const found = likelyCard(project, rows.filter((r) => r.card_number !== null));
          // A likely card is named, not owned: its Contributors are not read.
          return found
            ? tidyCardOf(
                { number: found.card_number!, title: found.title, url: found.url, designStatus: found.design_status, devStatus: found.dev_status },
                [],
                team,
              )
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
