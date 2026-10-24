// The tag on uno-bot's posts that are not answers: a gate note, a card, a
// narration line, the blueprint check's offer and its results.
//
// The DM sweep tells uno-bot's answers from its other posts by this: a tagged
// bot post is context and never new (`dm-sweep/detector.ts` § `isFresh`), so a
// status line that says "I couldn't…" is never read back as an answer that
// came up empty and asked about the next morning. An answer goes up untagged.
//
// Tag at post time, and send the tag again with an edit that has one to hand
// (as a decision report's redraw does), rather than lean on Slack keeping it.
//
// PURE.

import type { SlackMessageMetadata } from "./api";

/** The message-metadata type of every status post. */
export const STATUS_EVENT = "uno_status";

/** What a status post is, for whoever reads the tag back. */
export type StatusKind = "note" | "card" | "narration" | "checklist" | "blueprint_check";

/**
 * A status post's tag.
 *
 * @param kind - What the post is; nothing branches on it today
 */
export function statusTag(kind: StatusKind): SlackMessageMetadata {
  return { event_type: STATUS_EVENT, event_payload: { kind } };
}
