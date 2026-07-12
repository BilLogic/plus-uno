// Full-thread transcript for build delegations (field-scan improvement #8,
// approved 2026-07-12): when a gated implement/scaffold dispatch fires, the
// GitHub Actions runner gets the WHOLE triggering Slack thread — not just the
// trigger message — so codegen sees the discussion (constraints, corrections,
// pasted context) without the designer re-explaining. The bot still never
// edits repos; this only enriches the client_payload the runner receives.
//
// Defensive caps: last TRANSCRIPT_MAX_MESSAGES messages / TRANSCRIPT_MAX_CHARS
// chars, truncating OLDEST first, with truncation noted in the payload itself.
// Every failure degrades to `null` (dispatch proceeds without a transcript) —
// a transcript problem must never block a confirmed build.

import type { Env } from "../types";
import { conversationsReplies, getBotIdentity, usersInfo } from "./api";

export const TRANSCRIPT_MAX_MESSAGES = 50;
export const TRANSCRIPT_MAX_CHARS = 10_000;
// users.info costs one subrequest per unresolved id — cap it so a crowded
// thread can't eat the invocation's 50-subrequest budget at confirm time.
const MAX_NAME_LOOKUPS = 10;

export interface ThreadTranscript {
  /** Messages included in `text` (after truncation). */
  message_count: number;
  /** True when older messages were dropped to fit the caps. */
  truncated: boolean;
  /** Human note about what was dropped; present only when truncated. */
  truncation_note?: string;
  /** "Display Name: message" lines, oldest→newest. */
  text: string;
}

// Per-isolate display-name cache — user ids are stable, names change rarely,
// and the same requester/thread regulars recur across dispatches.
const nameCache = new Map<string, string>();

async function resolveDisplayNames(env: Env, userIds: string[]): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  let lookups = 0;
  for (const id of userIds) {
    const cached = nameCache.get(id);
    if (cached) {
      resolved.set(id, cached);
      continue;
    }
    if (lookups >= MAX_NAME_LOOKUPS) continue; // fall back to <@id> below
    lookups++;
    try {
      const res = await usersInfo(env, id);
      const u = res.ok ? res.user : undefined;
      const name = u?.profile?.display_name || u?.real_name || u?.name;
      if (name) {
        nameCache.set(id, name);
        resolved.set(id, name);
      }
    } catch {
      // leave unresolved — the raw id still identifies the speaker
    }
  }
  return resolved;
}

/**
 * Read the triggering thread and render it as a capped transcript with user
 * ids resolved to display names. Returns null on ANY failure (fail-open — the
 * dispatch itself must not depend on this).
 */
export async function fetchThreadTranscript(
  env: Env,
  channel: string,
  threadTs: string,
): Promise<ThreadTranscript | null> {
  try {
    const [identity, replies] = await Promise.all([
      getBotIdentity(env),
      conversationsReplies(env, channel, threadTs, TRANSCRIPT_MAX_MESSAGES),
    ]);
    if (!replies.ok || !Array.isArray(replies.messages) || replies.messages.length === 0) {
      console.warn(`[transcript] thread read failed for ${channel}/${threadTs}`);
      return null;
    }

    // conversations.replies returns oldest→newest with the parent first. The
    // limit already bounds us to the window's first 50; `has_more` marks a
    // longer thread (the tail past the API page is out of reach — note it).
    const msgs = replies.messages;
    const apiTruncated = replies.has_more === true;

    const humanIds = [...new Set(msgs.map((m) => m.user).filter((u): u is string => !!u))];
    const names = await resolveDisplayNames(env, humanIds);

    const lines = msgs
      .map((m) => {
        const text = (m.text ?? "").trim();
        if (!text) return "";
        const isBot = (!!m.user && m.user === identity?.userId) || (!!m.bot_id && m.bot_id === identity?.botId);
        const author = isBot
          ? "uno-bot"
          : m.user
            ? (names.get(m.user) ?? `<@${m.user}>`)
            : m.bot_id
              ? `bot:${m.bot_id}`
              : "unknown";
        return `${author}: ${text}`;
      })
      .filter(Boolean);

    // Char cap: drop OLDEST lines first until the joined text fits.
    let dropped = 0;
    let kept = [...lines];
    while (kept.length > 1 && kept.join("\n").length > TRANSCRIPT_MAX_CHARS) {
      kept.shift();
      dropped++;
    }
    // Degenerate case: a single enormous message — hard-slice its tail.
    let text = kept.join("\n");
    if (text.length > TRANSCRIPT_MAX_CHARS) {
      text = text.slice(text.length - TRANSCRIPT_MAX_CHARS);
    }

    const truncated = apiTruncated || dropped > 0;
    return {
      message_count: kept.length,
      truncated,
      ...(truncated
        ? {
            truncation_note: `transcript truncated (oldest first): showing the most recent ${kept.length} messages` +
              (dropped > 0 ? `; ${dropped} older message(s) dropped for size` : "") +
              (apiTruncated ? `; the thread has more messages than the ${TRANSCRIPT_MAX_MESSAGES}-message window` : ""),
          }
        : {}),
      text,
    };
  } catch (err) {
    console.warn(`[transcript] failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Attach the transcript to a repository_dispatch client_payload, respecting
 * GitHub's hard limit of 10 top-level client_payload properties (a dispatch
 * with 11 keys 422s — the transcript must never break the build trigger).
 * Keys with `undefined` values are counted out (JSON.stringify drops them).
 */
export function withThreadTranscript(
  payload: Record<string, unknown>,
  transcript: ThreadTranscript | null,
): Record<string, unknown> {
  if (!transcript) return payload;
  const definedKeys = Object.values(payload).filter((v) => v !== undefined).length;
  if (definedKeys >= 10) {
    console.warn("[transcript] skipped: client_payload already at GitHub's 10 top-level key limit");
    return payload;
  }
  return { ...payload, thread_transcript: transcript };
}
