// The one place production's UsageLog is built, and the one file in the module
// that takes `Env`.
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
