// Live list of real DS components, for validating `implement` payloads before
// a confirmation card is staged (R2 shipped confirm cards for invented
// components — "Surface", "SpacingToken"). Source of truth is the library
// itself: one folder per component under design-system/src/components on main,
// listed via the GitHub contents API (GITHUB_TOKEN already on the Worker for
// repository_dispatch). Cached per-isolate; fail-open — validation is a guard,
// not a wall, so a GitHub hiccup must not block legitimate implements.

import type { Env } from "../types";

const CACHE_TTL_MS = 10 * 60_000;
const FETCH_TIMEOUT_MS = 8000;

let cache: { at: number; names: string[] } | null = null;

/** Component folder names (e.g. "Badge", "Button"), or null when unavailable. */
export async function listDsComponents(env: Env): Promise<string[] | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.names;
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return null;

  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/design-system/src/components`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "uno-bot",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[ds-components] GitHub contents ${res.status}`);
      return null;
    }
    const entries = (await res.json()) as { name?: string; type?: string }[];
    if (!Array.isArray(entries)) return null;
    // Component folders are PascalCase directories ("Badge"); skip files like
    // index.js/constants.js and lowercase dirs like layout/.
    const names = entries
      .filter((e) => e.type === "dir" && typeof e.name === "string" && /^[A-Z]/.test(e.name))
      .map((e) => e.name as string);
    if (!names.length) return null;
    cache = { at: Date.now(), names };
    return names;
  } catch (err) {
    console.warn(`[ds-components] fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Case-insensitive membership check returning the canonical name, if any. */
export function matchComponent(name: string, list: string[]): string | null {
  const target = name.trim().toLowerCase();
  return list.find((c) => c.toLowerCase() === target) ?? null;
}

/** Up to `max` plausible near-matches for a name that isn't in the library. */
export function closestComponents(name: string, list: string[], max = 3): string[] {
  const target = name.trim().toLowerCase();
  if (!target) return [];
  const scored = list
    .map((c) => {
      const lc = c.toLowerCase();
      let score = 0;
      if (lc.startsWith(target) || target.startsWith(lc)) score = 3;
      else if (lc.includes(target) || target.includes(lc)) score = 2;
      else {
        // Shared-prefix length as a cheap similarity signal.
        let i = 0;
        while (i < Math.min(lc.length, target.length) && lc[i] === target[i]) i++;
        if (i >= 3) score = 1;
      }
      return { c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((s) => s.c);
}
