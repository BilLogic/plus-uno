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

let cachedSystemPromise: Promise<string> | null = null;

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
  cache_control?: { type: "ephemeral" };
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

async function getStableSystem(env: Env): Promise<string> {
  if (!cachedSystemPromise) {
    cachedSystemPromise = (async () => {
      const parts = await Promise.all(SKILL_PATHS.map((p) => fetchSkillFile(env, p)));
      // Generic assembly: each fetched file gets a divider headed by its repo
      // path, so the prompt is self-describing and adding/removing a path can
      // never desync from a hand-maintained label list (the v1 destructuring
      // bug: labels ran in the old 8-entry order and dropped the tail).
      return parts
        .map((text, i) => {
          if (!text) return "";
          return i === 0 ? text : `\n\n---\n\n<!-- ${SKILL_PATHS[i]} -->\n\n${text}`;
        })
        .join("");
    })().catch((err) => {
      cachedSystemPromise = null;
      throw err;
    });
  }
  return cachedSystemPromise;
}

export async function buildSystemBlocks(
  env: Env,
  pending: PendingContext | null,
  sender: SenderContext | null,
): Promise<SystemBlock[]> {
  const stable = await getStableSystem(env);
  const blocks: SystemBlock[] = [
    { type: "text", text: stable, cache_control: { type: "ephemeral" } },
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
    "If the user's current message clearly confirms or cancels this proposal, invoke the `resolve_pending_proposal` tool. Otherwise reply conversationally and the proposal will sit until ✅, ❌, or 15-minute expiry.",
    "",
    `IMPORTANT: while this proposal is pending, do NOT invoke \`${p.toolName}\` (or any side-effect tool) again for the same action. An approval is handled ONLY by resolve_pending_proposal with decision "confirm" — re-invoking the tool re-stages a duplicate confirmation card instead of executing, which reads as ignoring the user's approval.`,
    "",
    sender && !senderIsRequester
      ? `The current sender (<@${sender.userId}>) is NOT the requester (<@${p.requesterUserId}>) — do NOT invoke resolve_pending_proposal. Reply explaining that only the original requester can confirm.`
      : `Authorization rule: only <@${p.requesterUserId}> may confirm or cancel. The Worker will reject resolution attempts from other users.`,
    "</pending_proposal>",
  ].filter(Boolean).join("\n");
}
