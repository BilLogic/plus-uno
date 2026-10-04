// What a Figma notification says, read — and what uno-bot keeps of it (#895).
//
// THE PAYLOADS (developers.figma.com/docs/rest-api/webhooks-events, read
// 2026-10-03; `research/figma-api-facts.md` § 2). Every delivery carries
// `event_type`, `passcode`, `timestamp` (when the event was triggered) and
// `webhook_id`. FILE_COMMENT adds `file_key`, `file_name`, `comment` (text and
// mention fragments), `comment_id`, `parent_id` (set on a reply), `created_at`,
// `resolved_at`, `mentions` and `triggered_by`. FILE_UPDATE adds only
// `file_key` and `file_name`, about 30 minutes after editing stops. PING is
// what a newly created subscription sends.
//
// THERE IS NO EVENT ID, so one is derived from what a redelivery repeats
// exactly — Figma retries at 5 min, 30 min and 3 h with the same body:
//   • a comment: `comment:<comment_id>`, and `:resolved:<resolved_at>` when
//     set. Whether resolving a thread notifies at all is undocumented; if it
//     does, it is a second event about the same comment and must not read as a
//     repeat of the first.
//   • a file change: `update:<file_key>:<timestamp>`.
//
// WHAT IS KEPT (ADR-030: ids and timestamps, never words). The queued job and
// the KV notes hold the file key, the comment, reply and user ids, and times.
// Never the comment's text, the file's name or anyone's handle: a reader that
// needs the words re-fetches the comment by id, which also brings its frame
// anchor — the one thing the payload lacks.
//
// The two notes, in HARNESS_KV with an expiry:
//   • `figma-notify:commented:<ET date>:<file_key>` — the file got comments
//     that day. Kept 8 days, for a weekly reader plus one. Written once per
//     file per day: a second comment finds it there.
//   • `figma-notify:changed:<file_key>` — the file's last change. Kept 30
//     days. Moved only forward, so a retry that arrives after a later change
//     cannot move it back.
// Free KV allows 1,000 writes a day across the namespace (ADR-030), which is
// why neither note is written when it would say nothing new, and why repeats
// are caught in the runner's storage rather than with a KV mark.
//
// PURE.

import { etDayOf } from "../sweep/schedule";

const DAY_S = 24 * 60 * 60;

/** How long the commented-that-day note is kept: a week's reader, plus one. */
export const COMMENTED_TTL_S = 8 * DAY_S;
/** How long a file's last-change note is kept. */
export const CHANGED_TTL_S = 30 * DAY_S;

export const COMMENTED_PREFIX = "figma-notify:commented:";
export const CHANGED_PREFIX = "figma-notify:changed:";

/** One notification, read. `null` from `readFigmaEvent` is one it could not. */
export type FigmaEvent =
  | { type: "PING"; webhookId: string }
  | {
      type: "FILE_COMMENT";
      webhookId: string;
      fileKey: string;
      commentId: string;
      /** The root's id, when this comment is a reply. */
      parentId?: string;
      /** Who commented — their Figma user id, never their handle. */
      userId?: string;
      createdAt?: string;
      resolvedAt?: string;
      /** When Figma says the event happened. */
      at?: string;
    }
  | { type: "FILE_UPDATE"; webhookId: string; fileKey: string; at: string }
  /** An event this route is not subscribed to. Answered and dropped. */
  | { type: "OTHER"; webhookId: string; eventType: string };

/** The work one new event queues: ids and times only. */
export interface FigmaEventJob {
  eventId: string;
  type: "FILE_COMMENT" | "FILE_UPDATE";
  webhookId: string;
  fileKey: string;
  commentId?: string;
  parentId?: string;
  userId?: string;
  at?: string;
}

/** A note in KV: the key, the time it records, how long it stays, and when it
 *  may be written over. */
export interface FigmaNote {
  key: string;
  at: string;
  ttlS: number;
  write: "if-absent" | "if-newer";
}

/** An id as Figma sends it — a string, or a number in some payloads. */
function idOf(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

/** A timestamp field, kept as Figma wrote it when it parses. */
function timeOf(value: unknown): string | undefined {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : undefined;
}

/**
 * A payload whose passcode has already been checked, read.
 *
 * @param payload - The parsed body
 * @returns The event, or `null` when a file event lacks what its id or its
 *   notes need — a retry would carry the same gap, so it is answered and dropped
 */
export function readFigmaEvent(payload: Record<string, unknown>): FigmaEvent | null {
  const eventType = typeof payload.event_type === "string" ? payload.event_type : "";
  const webhookId = idOf(payload.webhook_id) ?? "?";
  if (eventType === "PING") return { type: "PING", webhookId };
  if (eventType !== "FILE_COMMENT" && eventType !== "FILE_UPDATE") {
    return { type: "OTHER", webhookId, eventType: eventType || "(none)" };
  }
  const fileKey = idOf(payload.file_key);
  if (!fileKey) return null;
  const at = timeOf(payload.timestamp);
  if (eventType === "FILE_UPDATE") return at ? { type: "FILE_UPDATE", webhookId, fileKey, at } : null;

  const commentId = idOf(payload.comment_id);
  if (!commentId) return null;
  const parentId = idOf(payload.parent_id);
  const userId = idOf((payload.triggered_by as { id?: unknown } | null | undefined)?.id);
  const createdAt = timeOf(payload.created_at);
  const resolvedAt = timeOf(payload.resolved_at);
  return {
    type: "FILE_COMMENT",
    webhookId,
    fileKey,
    commentId,
    ...(parentId ? { parentId } : {}),
    ...(userId ? { userId } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(resolvedAt ? { resolvedAt } : {}),
    ...(at ? { at } : {}),
  };
}

/** The id a redelivery of this event repeats exactly (see the header). */
export function eventIdOf(event: Extract<FigmaEvent, { type: "FILE_COMMENT" | "FILE_UPDATE" }>): string {
  if (event.type === "FILE_UPDATE") return `update:${event.fileKey}:${event.at}`;
  return `comment:${event.commentId}${event.resolvedAt ? `:resolved:${event.resolvedAt}` : ""}`;
}

/** The job a new event queues. */
export function jobOf(event: Extract<FigmaEvent, { type: "FILE_COMMENT" | "FILE_UPDATE" }>, eventId: string): FigmaEventJob {
  if (event.type === "FILE_UPDATE") {
    return { eventId, type: event.type, webhookId: event.webhookId, fileKey: event.fileKey, at: event.at };
  }
  const at = event.resolvedAt ?? event.createdAt ?? event.at;
  return {
    eventId,
    type: event.type,
    webhookId: event.webhookId,
    fileKey: event.fileKey,
    commentId: event.commentId,
    ...(event.parentId ? { parentId: event.parentId } : {}),
    ...(event.userId ? { userId: event.userId } : {}),
    ...(at ? { at } : {}),
  };
}

/** The ET calendar date an instant falls on, `YYYY-MM-DD`. */
export function etDateOf(at: number): string {
  return new Date(etDayOf(at)).toISOString().slice(0, 10);
}

/**
 * The note a new event leaves.
 *
 * A comment is dated by when it was resolved, else created, else when Figma
 * sent it, else now — on the ET day, the team's day, so the midnight run reads
 * the day that just ended.
 *
 * @param event - A new file event
 * @param now - Epoch ms, for a comment that carries no time of its own
 */
export function noteFor(event: Extract<FigmaEvent, { type: "FILE_COMMENT" | "FILE_UPDATE" }>, now: number): FigmaNote {
  if (event.type === "FILE_UPDATE") {
    return { key: `${CHANGED_PREFIX}${event.fileKey}`, at: event.at, ttlS: CHANGED_TTL_S, write: "if-newer" };
  }
  const at = event.resolvedAt ?? event.createdAt ?? event.at ?? new Date(now).toISOString();
  return {
    key: `${COMMENTED_PREFIX}${etDateOf(Date.parse(at))}:${event.fileKey}`,
    at,
    ttlS: COMMENTED_TTL_S,
    write: "if-absent",
  };
}
