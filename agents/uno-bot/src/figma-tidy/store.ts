// The weekly Figma tidy-up's KV records, under `figma-tidy:`: the week's
// listing, what the weeks remember, what each file's pages named and what was
// left as is. Its own file, so the "Leave as is" executor
// (`tools/figma-tidy-up.ts`) reaches the skips without the post's imports.

import type { Env } from "../types";
import { charge } from "../net";
import type { TidyHanded, TidyListing, TidyMemory, TidyRefs, TidySkips } from "./run";

const DAY_S = 24 * 60 * 60;
/** What outlives a quiet stretch — what a file's pages named, what was left
 *  as is: each write keeps it half a year more. */
const KEPT_TTL_S = 26 * 7 * DAY_S;

/** What the tidy-up keeps in KV, by name. */
export interface TidyStored {
  listing: TidyListing;
  memory: TidyMemory;
  refs: TidyRefs;
  skips: TidySkips;
  waiting: TidyHanded;
}

const STORES: Record<keyof TidyStored, { key: string; ttlS: number }> = {
  /** A listing outlives its Monday by a day. */
  listing: { key: "figma-tidy:listing", ttlS: 2 * DAY_S },
  /** The memory outlives its five weeks by one, so a quiet stretch keeps it. */
  memory: { key: "figma-tidy:memory", ttlS: 6 * 7 * DAY_S },
  refs: { key: "figma-tidy:refs", ttlS: KEPT_TTL_S },
  skips: { key: "figma-tidy:skips", ttlS: KEPT_TTL_S },
  /** The week's cards that did not show, for the next morning's message:
   *  gone by the next Monday's, which hands over a week of its own. */
  waiting: { key: "figma-tidy:waiting", ttlS: 7 * DAY_S },
};

/**
 * One of the tidy-up's KV records, read and written whole. The caller has
 * checked `HARNESS_KV` is bound.
 *
 * @param env - Worker bindings
 * @param name - Which record
 */
export function tidyStore<K extends keyof TidyStored>(
  env: Env,
  name: K,
): { read(): Promise<TidyStored[K] | null>; write(v: TidyStored[K] | null): Promise<void> } {
  const kv = env.HARNESS_KV!;
  const { key, ttlS } = STORES[name];
  return {
    async read() {
      charge(1, "kv");
      return (await kv.get<TidyStored[K]>(key, "json")) ?? null;
    },
    async write(value) {
      charge(1, "kv");
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttlS });
    },
  };
}
