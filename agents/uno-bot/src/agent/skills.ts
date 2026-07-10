// Build the agent's system prompt as an array of content blocks:
//   - Block 0: the stable skill content (AGENTS.md + SKILL.md files), cached
//     via Anthropic prompt caching. Same content across requests.
//   - Block 1 (optional): per-request pending-proposal context. NOT cached,
//     since it varies per Slack thread + per request.
//
// Skill files are fetched from GitHub Raw at runtime (env.SKILLS_BASE_URL).
// Per-isolate cache for the stable content; first call fetches in parallel.

import type { Env } from "../types";

const SKILL_PATHS = [
  "AGENTS.md", // the constitution (repo root)
  "agents/uno-bot/AGENT.md", // this embodiment's persona delta
  // Per skill: references/method.md (runtime-neutral core) then bot.md (Worker delta)
  "skills/uno-research/references/method.md",
  "skills/uno-research/bot.md",
  "skills/uno-synthesize/references/method.md",
  "skills/uno-synthesize/bot.md",
  "skills/uno-prototype/references/method.md",
  "skills/uno-prototype/bot.md",
  "skills/uno-publish/references/method.md",
  "skills/uno-publish/bot.md",
  "skills/uno-review/references/method.md",
  "skills/uno-review/bot.md",
  "skills/uno-maintain/references/method.md",
  "skills/uno-maintain/bot.md",
  "docs/conventions/terminology.md",
  "docs/conventions/notion.md",
  "docs/conventions/figma-workspace.md",
  "docs/conventions/slack.md",
  "docs/conventions/supabase.md",
  "docs/conventions/writing-style.md",
] as const;

// In-memory cache with a TTL: a merged harness change takes effect within
// CACHE_TTL_MS on every isolate — previously the cache lived until the isolate
// recycled (minutes to hours, unpredictable), which broke the "merge a doc PR =
// reprogram the bot" contract. The assembled text is byte-stable between
// refreshes, so Anthropic prompt caching still hits.
const CACHE_TTL_MS = 5 * 60_000;
let cachedSystem: { at: number; promise: Promise<string> } | null = null;

// Last-known-good harness (KV) + loud failure alerting. fetchSkillFile degrades
// a 404/transient failure to "" so one broken file can't take the bot down —
// but silently running with pieces of the brain missing is its own failure
// mode. So: every fully-successful assembly is stored in KV; when files come
// back missing, we alert #uno-bot (throttled) and serve the KV copy instead.
const KV_LAST_GOOD = "harness:last_good";
const KV_ALERT_AT = "harness:alert_at";
// Fresh-assembly KV cache: on an in-memory miss (fresh isolate — which is what
// every AgentRunner alarm invocation may be), serving the harness costs ONE KV
// read instead of 20 GitHub Raw fetches. On the free tier's 50-subrequest
// budget that's the difference between a comfortable turn and a blown one
// (live incident 2026-07-10). Same 5-min freshness as the in-memory cache, so
// "merge a doc PR = reprogram the bot within minutes" still holds.
const KV_CACHE = "harness:cache";
const ALERT_THROTTLE_MS = 60 * 60_000; // at most one alert per hour
const UNO_BOT_CHANNEL = "C0ARJ2A3A69"; // #uno-bot (ops/alerts)

export interface PendingContext {
  toolName: string;
  input: Record<string, unknown>;
  requesterUserId: string;
}

export interface SenderContext {
  userId: string;
}

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: "5m" | "1h" };
}

async function fetchSkillFile(env: Env, path: string): Promise<string> {
  const base = env.SKILLS_BASE_URL.replace(/\/+$/, "");
  const url = `${base}/${path}`;
  // Resilient: a missing/renamed skill file (404) or a transient fetch error
  // must NOT take the whole bot down. Skip it (return "") and log — the agent
  // degrades by one skill rather than erroring on every message. This decouples
  // deleting a runtime-fetched skill from needing a perfectly-synced redeploy.
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[skills] GET ${url} -> ${res.status} (skipping)`);
      return "";
    }
    return res.text();
  } catch (err) {
    console.warn(`[skills] GET ${url} failed: ${err instanceof Error ? err.message : String(err)} (skipping)`);
    return "";
  }
}

/** Alert #uno-bot that harness files failed to fetch — throttled via KV so an
 *  outage produces one ping an hour, not one per message. Never throws. */
async function alertHarnessDegraded(env: Env, missing: string[], usingFallback: boolean): Promise<void> {
  try {
    if (env.HARNESS_KV) {
      const last = await env.HARNESS_KV.get(KV_ALERT_AT);
      if (last && Date.now() - Number(last) < ALERT_THROTTLE_MS) return;
      await env.HARNESS_KV.put(KV_ALERT_AT, String(Date.now()));
    }
    const { postMessage } = await import("../slack/api");
    await postMessage(env, {
      channel: UNO_BOT_CHANNEL,
      text:
        `:warning: *uno-bot harness fetch degraded* — ${missing.length} file(s) failed to load from GitHub Raw:\n` +
        missing.map((p) => `• \`${p}\``).join("\n") +
        `\n${usingFallback ? "Serving the last-known-good harness from KV." : "No KV fallback available — running with those files MISSING."}` +
        ` Check GitHub Raw availability / recent renames of these paths.`,
    });
  } catch (err) {
    console.warn(`[skills] alert failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function assembleSystem(env: Env): Promise<string> {
  const parts = await Promise.all(SKILL_PATHS.map((p) => fetchSkillFile(env, p)));
  const missing = SKILL_PATHS.filter((_, i) => !parts[i]);
  // Generic assembly: each fetched file gets a divider headed by its repo
  // path, so the prompt is self-describing and adding/removing a path can
  // never desync from a hand-maintained label list (the v1 destructuring
  // bug: labels ran in the old 8-entry order and dropped the tail).
  const assembled = parts
    .map((text, i) => {
      if (!text) return "";
      return i === 0 ? text : `\n\n---\n\n<!-- ${SKILL_PATHS[i]} -->\n\n${text}`;
    })
    .join("");

  if (missing.length === 0) {
    // Fully healthy — refresh the last-known-good copy AND the fresh cache
    // (guarded; KV optional).
    if (env.HARNESS_KV) {
      try {
        await env.HARNESS_KV.put(KV_LAST_GOOD, assembled);
        await env.HARNESS_KV.put(KV_CACHE, JSON.stringify({ at: Date.now(), text: assembled }));
      } catch (err) {
        console.warn(`[skills] KV put failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return assembled;
  }

  // Degraded — prefer the last fully-good harness over a partial brain, and say
  // so loudly in #uno-bot either way.
  let fallback: string | null = null;
  if (env.HARNESS_KV) {
    try {
      fallback = await env.HARNESS_KV.get(KV_LAST_GOOD);
    } catch (err) {
      console.warn(`[skills] KV get failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.warn(`[skills] harness degraded — missing: ${missing.join(", ")} (fallback: ${fallback ? "KV" : "none"})`);
  await alertHarnessDegraded(env, [...missing], fallback !== null);
  return fallback ?? assembled;
}

async function getStableSystem(env: Env): Promise<string> {
  if (!cachedSystem || Date.now() - cachedSystem.at > CACHE_TTL_MS) {
    const promise = loadSystem(env).catch((err) => {
      cachedSystem = null;
      throw err;
    });
    cachedSystem = { at: Date.now(), promise };
  }
  return cachedSystem.promise;
}

// In-memory miss: try the KV fresh-cache (1 subrequest) before the full 20-fetch
// assembly. Any KV problem falls straight through to assembly — the cache is an
// optimization, never a dependency.
async function loadSystem(env: Env): Promise<string> {
  if (env.HARNESS_KV) {
    try {
      const raw = await env.HARNESS_KV.get(KV_CACHE);
      if (raw) {
        const cached = JSON.parse(raw) as { at?: number; text?: string };
        if (cached.text && cached.at && Date.now() - cached.at < CACHE_TTL_MS) {
          return cached.text;
        }
      }
    } catch (err) {
      console.warn(`[skills] KV cache read failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return assembleSystem(env);
}

export async function buildSystemBlocks(
  env: Env,
  pending: PendingContext | null,
  sender: SenderContext | null,
): Promise<SystemBlock[]> {
  const stable = await getStableSystem(env);
  // 1h cache TTL on the stable block: design-team traffic gaps blow the 5-min
  // cache TTL; 1h costs 2× on write, pays back on the first reuse within the
  // hour. (ttl is post-SDK-0.32 — SystemBlock carries it; the API accepts it.)
  const blocks: SystemBlock[] = [
    { type: "text", text: stable, cache_control: { type: "ephemeral", ttl: "1h" } },
  ];
  if (pending) {
    blocks.push({ type: "text", text: renderPendingBlock(pending, sender) });
  }
  return blocks;
}

function renderPendingBlock(p: PendingContext, sender: SenderContext | null): string {
  const senderIsRequester = sender ? sender.userId === p.requesterUserId : false;
  return [
    "<pending_proposal>",
    "You previously proposed a side-effect action in this Slack thread that is awaiting confirmation:",
    `- tool: ${p.toolName}`,
    `- parameters: ${JSON.stringify(p.input, null, 2)}`,
    `- requester: <@${p.requesterUserId}>`,
    sender ? `- current message sender: <@${sender.userId}>` : "",
    "",
    "If the user's current message clearly confirms or cancels this proposal, invoke the `proposal_resolve` tool. Otherwise reply conversationally and the proposal will sit until ✅, ❌, or 60-minute expiry.",
    "",
    `IMPORTANT: while this proposal is pending, do NOT invoke \`${p.toolName}\` (or any side-effect tool) again for the same action. An approval is handled ONLY by proposal_resolve with decision "confirm" — re-invoking the tool re-stages a duplicate confirmation card instead of executing, which reads as ignoring the user's approval.`,
    "",
    sender && !senderIsRequester
      ? `The current sender (<@${sender.userId}>) is NOT the requester (<@${p.requesterUserId}>) — do NOT invoke proposal_resolve. Reply explaining that only the original requester can confirm.`
      : `Authorization rule: only <@${p.requesterUserId}> may confirm or cancel. The Worker will reject resolution attempts from other users.`,
    "</pending_proposal>",
  ].filter(Boolean).join("\n");
}
