// figma_tidy_up executor — a weekly Figma tidy-up card's one operation, past
// its Review's "Leave as is": the file and check stay quiet until the file's
// title cards change. What it decides is `figma-tidy/run.ts` (`leaveAsIs`);
// this file only binds `Env`.

import type { Env } from "../types";
import { charge } from "../net";
import { leaveAsIs, type TidySkips } from "../figma-tidy/run";

const SKIPS_KEY = "figma-tidy:skips";
/** Items left as is outlive a quiet stretch: each write keeps them half a year more. */
const SKIPS_TTL_S = 26 * 7 * 24 * 60 * 60;

/** Where items left as is are kept: the post reads them, a "Leave as is" adds one. */
export function tidySkipsStore(env: Env): { read(): Promise<TidySkips | null>; write(v: TidySkips | null): Promise<void> } {
  const kv = env.HARNESS_KV!;
  return {
    async read() {
      charge(1, "kv");
      return (await kv.get<TidySkips>(SKIPS_KEY, "json")) ?? null;
    },
    async write(value) {
      charge(1, "kv");
      await kv.put(SKIPS_KEY, JSON.stringify(value), { expirationTtl: SKIPS_TTL_S });
    },
  };
}

/** "Leave as is" on a tidy-up card, on `Env`. */
export async function executeTidyLeaveAsIs(env: Env, input: Record<string, unknown>): Promise<string> {
  if (!env.HARNESS_KV) return JSON.stringify({ ok: false, error: "HARNESS_KV not bound — nowhere to keep it" });
  return leaveAsIs(tidySkipsStore(env), input);
}
