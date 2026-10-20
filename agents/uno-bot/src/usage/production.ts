// The one place production's UsageLog is built, and one of the module's two
// files that take `Env` (the other is `./resolution-env.ts`).
//
// A missing binding is not an error: a Worker deployed without `USAGE_DB` —
// before the database was bound, or in a local `wrangler dev` without it —
// answers every turn as before and records nothing. It says so ONCE per
// isolate, not once per turn.

import type { Env } from "../types";
import { createD1AskCategories, type AskCategoryStore } from "./category-store";
import { selectProvider } from "../agent/run-agent";
import { classifyAsks, type SubType } from "./categories";
import { createD1UsageLog } from "./d1";
import { createD1ProposalEventLog } from "./proposal-events-d1";
import type { ProposalEventLog } from "./proposal-events";
import type { UsageLog } from "./store";
import { activePeopleOf, type ActivePeople, type FigmaPeople, type NotionPeople, type TeamRoles } from "./roles";
import { charge, rethrowIfBudget } from "../net";
import { findTeamMembers } from "../integrations/notion";
import { slackDirectoryFor } from "../tools/slack-people";
import { openConversation, postMessage } from "../slack/api";
import { gapNotes, type GapNotes } from "./gap-notes";
import {
  syncTeamRoles,
  TEAM_ROLES_KV_KEY,
  TEAM_ROLES_TTL_S,
  type StoredTeamRoles,
  type TeamRolesSyncReport,
} from "./team-roles-sync";

let warnedUnbound = false;

/** A log that keeps nothing. */
const NO_USAGE_LOG: UsageLog = {
  async record() {},
  async get() {
    return null;
  },
};

export function usageLogFor(env: Pick<Env, "USAGE_DB">): UsageLog {
  if (env.USAGE_DB) return createD1UsageLog({ db: env.USAGE_DB });
  if (!warnedUnbound) {
    warnedUnbound = true;
    console.warn("[usage] no USAGE_DB binding — turns are not being recorded");
  }
  return NO_USAGE_LOG;
}

/** A proposal-event log that keeps nothing — a debug-origin turn's, whose cards
 *  are nobody's writes and must never reach the production table. */
export const NO_PROPOSAL_EVENT_LOG: ProposalEventLog = {
  async record() {},
  async eventsOf() {
    return [];
  },
  async overdue() {
    return [];
  },
  async expireOverdue() {
    return 0;
  },
  async noteSelfFiledTicket() {},
  async ticketFor() {
    return null;
  },
};

/** Where production records proposal events: the same database as the turns,
 *  and the same silence when it is not bound (`usageLogFor` says so once). */
export function proposalEventLogFor(env: Pick<Env, "USAGE_DB">): ProposalEventLog {
  return env.USAGE_DB ? createD1ProposalEventLog({ db: env.USAGE_DB }) : NO_PROPOSAL_EVENT_LOG;
}

/** The classifier's store, or null when no database is bound — the usage
 *  jobs then have nothing to do. */
export function askCategoriesFor(env: Pick<Env, "USAGE_DB">): AskCategoryStore | null {
  return env.USAGE_DB ? createD1AskCategories({ db: env.USAGE_DB }) : null;
}

/** The in-turn classifier, on the turn's own adapter — or none when no
 *  database is bound, so no call is spent on a label nothing would keep. */
export function classifyAskFor(env: Env): ((text: string) => Promise<SubType | null>) | undefined {
  if (!env.USAGE_DB) return undefined;
  return async (text) => (await classifyAsks(selectProvider(env), [text]))[0] ?? null;
}

/** `TEST_CHANNEL_IDS`, parsed — kept beside the rule that reads it
 *  (`./record.ts`), so a module with no bindings can read it too. */
export { testChannelIdsOf } from "./record";

/**
 * The stored role map (`./team-roles-sync.ts`), or an empty one — every role
 * then reads unknown — when none is stored, KV is not bound or the read fails.
 * One KV read, charged to the internal bucket.
 *
 * @throws A budget stop, which is the caller's to handle rather than an
 *   empty map
 */
export async function teamRolesFor(env: Pick<Env, "HARNESS_KV">): Promise<TeamRoles> {
  return (await storedTeamRoles(env))?.roles ?? {};
}

/**
 * The stored Figma user id → Slack id map, kept with the role map: how a
 * Figma commenter is known to be a teammate (`./roles.ts` `slackPersonOfFigma`).
 * Empty — every commenter then maps to nobody — on the same terms as
 * `teamRolesFor`, and for a map stored before Figma ids were kept.
 *
 * @throws A budget stop, rather than an empty map: the caller treats the
 *   commenter as unmapped (public facts only, no write proposals) or defers
 */
export async function figmaPeopleFor(env: Pick<Env, "HARNESS_KV">): Promise<FigmaPeople> {
  return (await storedTeamRoles(env))?.figmaPeople ?? {};
}

/**
 * The stored Notion user id → Slack id map, kept with the role map: how a
 * card follow-up tags a Notion person before it falls back to a name search
 * (`../follow-through/people.ts`). Empty on the same terms as `teamRolesFor`.
 *
 * @throws A budget stop, rather than an empty map
 */
export async function notionPeopleFor(env: Pick<Env, "HARNESS_KV">): Promise<NotionPeople> {
  return (await storedTeamRoles(env))?.notionPeople ?? {};
}

/**
 * Who may be tagged or named from a roster (`./roles.ts` `isActive`), read
 * from the stored map once for the life of the returned function: one job's
 * run. No map, a map stored before the list was kept, no KV or a failed read
 * makes nobody active, so a failed read names nobody.
 *
 * @throws A budget stop, rather than nobody: the caller defers
 */
export function activePeopleFor(env: Pick<Env, "HARNESS_KV">): () => Promise<ActivePeople> {
  let read: Promise<ActivePeople> | undefined;
  return () => (read ??= storedTeamRoles(env).then(activePeopleOf));
}

/** The stored map, or null when none is stored, KV is not bound or the read
 *  fails. One KV read, charged to the internal bucket. */
export async function storedTeamRoles(env: Pick<Env, "HARNESS_KV">): Promise<StoredTeamRoles | null> {
  if (!env.HARNESS_KV) return null;
  try {
    charge(1, "kv");
    return await env.HARNESS_KV.get<StoredTeamRoles>(TEAM_ROLES_KV_KEY, "json");
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[usage] team roles not read: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * The Team Members gap notes on `Env`: the stored map, a 30-day mark per
 * person in HARNESS_KV, and a DM to `LEAD_USER_ID` alone, in their DM with
 * uno-bot, with the bot token. No HARNESS_KV, or no lead, notes nobody: a
 * note with no mark would repeat.
 *
 * @param env - Worker bindings
 */
export function gapNotesFor(env: Env): GapNotes {
  const kv = env.HARNESS_KV;
  return gapNotes({
    lead: (kv && env.LEAD_USER_ID?.trim()) || null,
    read: () => storedTeamRoles(env),
    marks: {
      async has(key) {
        charge(1, "kv");
        return (await kv!.get(key)) !== null;
      },
      async put(key, ttlS) {
        charge(1, "kv");
        await kv!.put(key, "1", { expirationTtl: ttlS });
      },
    },
    async dm(userId, text) {
      const open = await openConversation(env, userId);
      if (!open.ok) return { ok: false, error: open.error };
      const res = await postMessage(env, { channel: open.channel, text });
      return res.ok ? { ok: true } : { ok: false, error: res.error ?? "post failed" };
    },
  });
}

/**
 * The daily role-map sync on `Env`: Team Members from Notion, the directory
 * from users.list with the bot token, the map into HARNESS_KV.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` writes nothing
 */
export async function runTeamRolesSync(env: Env, opts: { dryRun: boolean }): Promise<TeamRolesSyncReport> {
  const kv = env.HARNESS_KV;
  // A dry run writes nothing, so it rehearses the reads with or without KV.
  if (!kv && !opts.dryRun) {
    return { written: false, matched: 0, unmatched: 0, ambiguous: 0, summary: "HARNESS_KV not bound — sync skipped" };
  }
  const directory = slackDirectoryFor(env);
  return syncTeamRoles(
    {
      roster: () => findTeamMembers(env),
      listUsers: (cursor) => directory.listUsers(cursor),
      async read() {
        if (!kv) return null;
        charge(1, "kv");
        return kv.get<StoredTeamRoles>(TEAM_ROLES_KV_KEY, "json");
      },
      async write(stored, ttlS) {
        if (!kv) return;
        charge(1, "kv");
        await kv.put(TEAM_ROLES_KV_KEY, JSON.stringify(stored), { expirationTtl: ttlS });
      },
      now: () => Date.now(),
    },
    opts,
  );
}
