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
import type { TeamRoles } from "./roles";
import { charge } from "../net";
import { findTeamMembers } from "../integrations/notion";
import { slackDirectoryFor } from "../tools/slack-people";
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

/** A proposal-event log that keeps nothing — the eval transport's, whose cards
 *  live in an in-memory store and must never reach the production table. */
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

/** `TEST_CHANNEL_IDS`, parsed: comma-separated channel ids, blanks dropped. */
export function testChannelIdsOf(env: Pick<Env, "TEST_CHANNEL_IDS">): string[] {
  return (env.TEST_CHANNEL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * The stored role map (`./team-roles-sync.ts`), or an empty one — every role
 * then reads unknown — when none is stored, KV is not bound or the read fails.
 * One KV read, charged to the internal bucket.
 */
export async function teamRolesFor(env: Pick<Env, "HARNESS_KV">): Promise<TeamRoles> {
  if (!env.HARNESS_KV) return {};
  try {
    charge(1, "kv");
    return (await env.HARNESS_KV.get<StoredTeamRoles>(TEAM_ROLES_KV_KEY, "json"))?.roles ?? {};
  } catch (err) {
    console.warn(`[usage] team roles not read: ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
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
      async write(stored) {
        if (!kv) return;
        charge(1, "kv");
        await kv.put(TEAM_ROLES_KV_KEY, JSON.stringify(stored), { expirationTtl: TEAM_ROLES_TTL_S });
      },
      now: () => Date.now(),
    },
    opts,
  );
}
