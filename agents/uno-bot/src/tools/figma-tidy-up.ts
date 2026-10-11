// figma_tidy_up executor — a weekly Figma tidy-up card's one operation, past
// its Review's "Leave as is": the file and check stay quiet until the file's
// title cards change. What it decides is `figma-tidy/run.ts` (`leaveAsIs`);
// this file only binds `Env`.

import type { Env } from "../types";
import { leaveAsIs } from "../figma-tidy/run";
import { tidyStore } from "../figma-tidy/store";

/** "Leave as is" on a tidy-up card, on `Env`. */
export async function executeTidyLeaveAsIs(env: Env, input: Record<string, unknown>): Promise<string> {
  if (!env.HARNESS_KV) return JSON.stringify({ ok: false, error: "HARNESS_KV not bound — nowhere to keep it" });
  return leaveAsIs(tidyStore(env, "skips"), input);
}
