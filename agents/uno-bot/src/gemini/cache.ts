// Explicit context caching for the Gemini lane's system prompt.
//
// Why this exists: skills.ts marks the stable harness block with a 1h
// `cache_control`, and ONLY the Anthropic lane honours it. The Gemini API has
// no such field, so on the production lane (`MODEL_PROVIDER = "gemini"`) the
// ~40k-token harness was billed as fresh input on every iteration of every
// turn — up to MAX_ITERATIONS per user message. Vertex's `cachedContents`
// resource is the equivalent: create it once, reference it by name, and the
// cached prefix bills at the (much cheaper) cached-input rate.
//
// Three things this must never do, in order of severity:
//   1. Break a turn. Every failure path returns null and the caller falls back
//      to sending the system prompt inline — the old behaviour, exactly.
//   2. Retry a hopeless call every turn. A failure is remembered (negative
//      cache) for the same hour, so an unsupported configuration costs ONE
//      wasted subrequest per hour, not one per message.
//   3. Serve a stale prompt. The cache key includes BUILD, so a deploy that
//      changes the harness can never hit a cache built from the old text.
import type { Env } from "../types";
import { countedFetch, charge } from "../net";
import { vertexBase } from "./client";
import { BUILD } from "../version";

/** Vertex TTL for the cached prompt. Refreshed well before it lapses. */
const TTL_SECONDS = 3600;
/** Refresh at 50 min so a turn never picks up a name that expires mid-flight. */
const REFRESH_BEFORE_MS = 50 * 60 * 1000;
/** How long a failure is remembered before we try again. */
const NEGATIVE_TTL_SECONDS = 3600;

/** Isolate-local memo: free reuse within an isolate, no KV round-trip. */
let memo: { key: string; name: string | null; expiresAt: number } | null = null;

interface CachedContentResponse {
  name?: string;
  expireTime?: string;
  usageMetadata?: { totalTokenCount?: number };
  error?: { code?: number; message?: string };
}

export interface HarnessCacheResult {
  /** Full resource name to pass as `cachedContent`, or null to inline the prompt. */
  name: string | null;
  /** Why, when null — surfaced by /debug/gemini-cache, never by the bot. */
  reason?: string;
  /** Tokens the cache holds, when Vertex reports it. */
  tokens?: number;
}

function cacheKey(model: string, region: string): string {
  return `gemini:cache:${region}:${model}:${BUILD}`;
}

/**
 * The cached-prompt name for this (model, region, build), creating it if needed.
 *
 * @param env - Worker env (needs the Vertex SA + HARNESS_KV to memo across isolates)
 * @param model - Exact model id the generateContent call will use
 * @param systemText - The STABLE harness text only — never per-request blocks,
 *   which would change the cached bytes every turn and defeat the point
 * @returns A resource name, or null with a reason when the prompt must go inline
 */
export async function ensureHarnessCache(
  env: Env,
  model: string,
  systemText: string,
): Promise<HarnessCacheResult> {
  const base = await vertexBase(env).catch(() => null);
  if (!base) return { name: null, reason: "not on the Vertex service-account path" };

  // Context caching is a REGIONAL resource. The `global` endpoint does not
  // serve cachedContents, and a cache created in one region cannot be used by
  // a generateContent call in another — so on `global` the honest answer is to
  // inline, and say so, rather than to create a cache nothing can reference.
  if (base.region === "global") {
    return { name: null, reason: "GEMINI_REGION is `global`; cachedContents is a regional resource" };
  }

  const key = cacheKey(model, base.region);
  const now = Date.now();
  if (memo && memo.key === key && memo.expiresAt > now) {
    return { name: memo.name, reason: memo.name ? undefined : "negative-cached this hour" };
  }

  // KV is the cross-isolate memo. Charged so it shows up in telemetry: KV calls
  // don't go through fetch, so the meter cannot see them. They land in the
  // INTERNAL bucket (1,000 cap), not the 50 that gates lookups — net.ts charge().
  if (env.HARNESS_KV) {
    charge(1, "kv");
    const stored = await env.HARNESS_KV.get<{ name: string | null; expiresAt: number }>(key, "json").catch(() => null);
    if (stored && stored.expiresAt > now) {
      memo = { key, name: stored.name, expiresAt: stored.expiresAt };
      return { name: stored.name, reason: stored.name ? undefined : "negative-cached this hour" };
    }
  }

  const remember = async (name: string | null, ttlSeconds: number): Promise<void> => {
    const expiresAt = now + ttlSeconds * 1000;
    memo = { key, name, expiresAt };
    if (!env.HARNESS_KV) return;
    charge(1, "kv");
    await env.HARNESS_KV.put(key, JSON.stringify({ name, expiresAt }), { expirationTtl: ttlSeconds }).catch(() => {});
  };

  try {
    const url = `https://${base.host}/v1/projects/${base.project}/locations/${base.region}/cachedContents`;
    const res = await countedFetch(
      url,
      {
        method: "POST",
        headers: base.headers,
        body: JSON.stringify({
          model: `projects/${base.project}/locations/${base.region}/publishers/google/models/${model}`,
          systemInstruction: { parts: [{ text: systemText }] },
          ttl: `${TTL_SECONDS}s`,
          displayName: `uno-bot harness ${BUILD}`,
        }),
      },
      20_000,
    );
    const data = (await res.json().catch(() => ({}))) as CachedContentResponse;
    if (!res.ok || !data.name) {
      // Most likely causes, none of which get better by retrying this hour:
      // the model is below the minimum cacheable token count, the region does
      // not offer caching, or the SA lacks the permission.
      const reason = `HTTP ${res.status}: ${data.error?.message ?? "no cache name returned"}`.slice(0, 200);
      console.warn(`[gemini-cache] disabled for ${model} this hour — ${reason}`);
      await remember(null, NEGATIVE_TTL_SECONDS);
      return { name: null, reason };
    }
    // Refresh before Vertex's own expiry so no turn references a lapsed name.
    await remember(data.name, Math.floor(REFRESH_BEFORE_MS / 1000));
    console.log(
      `[gemini-cache] created ${data.name} (${data.usageMetadata?.totalTokenCount ?? "?"} tokens, ttl ${TTL_SECONDS}s)`,
    );
    return { name: data.name, tokens: data.usageMetadata?.totalTokenCount };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[gemini-cache] create failed for ${model} — ${reason}`);
    await remember(null, NEGATIVE_TTL_SECONDS);
    return { name: null, reason };
  }
}
