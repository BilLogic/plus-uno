// The one place production's UsageLog is built, and the one file in the module
// that takes `Env`.
//
// A missing binding is not an error: a Worker deployed without `USAGE_DB` —
// before the database was bound, or in a local `wrangler dev` without it —
// answers every turn as before and records nothing. It says so ONCE per
// isolate, not once per turn.

import type { Env } from "../types";
import { createD1UsageLog } from "./d1";
import { createD1ProposalEventLog } from "./proposal-events-d1";
import type { ProposalEventLog } from "./proposal-events";
import type { UsageLog } from "./store";

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
};

/** Where production records proposal events: the same database as the turns,
 *  and the same silence when it is not bound (`usageLogFor` says so once). */
export function proposalEventLogFor(env: Pick<Env, "USAGE_DB">): ProposalEventLog {
  return env.USAGE_DB ? createD1ProposalEventLog({ db: env.USAGE_DB }) : NO_PROPOSAL_EVENT_LOG;
}

/** `TEST_CHANNEL_IDS`, parsed: comma-separated channel ids, blanks dropped. */
export function testChannelIdsOf(env: Pick<Env, "TEST_CHANNEL_IDS">): string[] {
  return (env.TEST_CHANNEL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
