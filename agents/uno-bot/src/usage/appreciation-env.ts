// Where `Env` becomes the appreciation log (`./appreciation.ts`), and the
// reaction door's `recordThanks`. Beside `./production.ts` rather than in it,
// as `./feedback-env.ts` is: a caller with an `Env` imports it by path, and
// `./index.ts` does not re-export it.

import type { Env } from "../types";
import { rethrowIfBudget } from "../net";
import { conversationTypeOf } from "../turn/request";
import { createD1AppreciationLog } from "./appreciation-d1";
import type { AppreciationLog } from "./appreciation";

/** A log that keeps nothing — the Worker without `USAGE_DB`. `./production.ts` says so once. */
const NO_APPRECIATION_LOG: AppreciationLog = {
  async record() {},
  async get() {
    return null;
  },
};

export function appreciationLogFor(env: Pick<Env, "USAGE_DB">): AppreciationLog {
  return env.USAGE_DB ? createD1AppreciationLog({ db: env.USAGE_DB }) : NO_APPRECIATION_LOG;
}

/**
 * The reaction door's `recordThanks`, bound: one write, dated now. A budget
 * stop is thrown through, as everywhere; any other failure is logged and
 * dropped, and the reaction goes on as if nothing had been written.
 */
export function thanksRecorderFor(env: Pick<Env, "USAGE_DB">) {
  return async (r: { channel: string; itemTs: string; userId: string; emoji: string }): Promise<void> => {
    try {
      await appreciationLogFor(env).record({
        ...r,
        at: Date.now(),
        conversationType: conversationTypeOf(r.channel) ?? null,
      });
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[usage] thanks reaction not recorded: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}
