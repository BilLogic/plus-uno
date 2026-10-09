// Which comments a night's read may look at, and which threads it does (#900).
//
// THE WATERMARK. The read switches on once, and its watermark is that moment:
// a comment created before it is never read, so years of old discussion never
// reach #plus-design (#891 story 16). A root resolved after it counts as
// read — resolving is the newest thing said about that thread — but its
// replies from before the watermark stay unread. A thread whose root came
// before the watermark is read only once that root is resolved: until then
// its root is unread, and a new reply alone would be read out of its thread.
//
// THE WINDOW. Each night reads (from, until]: a thread is looked at when one
// of its readable comments was created in it, or its root was resolved in it.
// So a thread is looked at again when it gets a new reply or is resolved, and
// never twice for the same activity.
//
// WHAT COUNTS AS A THREAD. Figma pins only a root comment, by
// `client_meta.node_id`; a reply carries no pin and belongs to its root. A root
// pinned to no node — left on the page — has nowhere to be in a section, so it
// is never a candidate (#891).
//
// PURE.

import type { FigmaComment } from "../figma/client";

/** The night's bounds, epoch ms. */
export interface ReadWindow {
  /** Nothing created before this is ever read. */
  watermark: number;
  /** Activity after this … */
  from: number;
  /** … up to and including this is tonight's. */
  until: number;
}

/** A thread a night looks at: its root and the replies it may read, oldest first. */
export interface CommentThread {
  root: FigmaComment;
  replies: FigmaComment[];
  /** The node its root is pinned to. */
  nodeId: string;
}

const time = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : Number.NaN);

/**
 * Whether a comment may be read at all: created after the watermark, or a
 * root resolved after it.
 *
 * @param c - The comment
 * @param watermark - Epoch ms
 */
export function readable(c: Pick<FigmaComment, "created_at" | "resolved_at" | "parent_id">, watermark: number): boolean {
  if (time(c.created_at) > watermark) return true;
  return !c.parent_id && time(c.resolved_at) > watermark;
}

/**
 * The threads tonight's read looks at: pinned roots it may read, with
 * activity in the window, each carrying only the replies it may read.
 *
 * @param comments - Every comment on the file, roots and replies
 * @param window - The watermark and tonight's bounds
 */
export function candidateThreads(comments: readonly FigmaComment[], window: ReadWindow): CommentThread[] {
  const inWindow = (iso: string | null | undefined) => {
    const t = time(iso);
    return t > window.from && t <= window.until;
  };
  const replies = new Map<string, FigmaComment[]>();
  for (const c of comments) {
    if (c.parent_id && readable(c, window.watermark)) replies.set(c.parent_id, [...(replies.get(c.parent_id) ?? []), c]);
  }
  const threads: CommentThread[] = [];
  for (const root of comments) {
    if (root.parent_id) continue;
    const nodeId = root.client_meta?.node_id;
    if (!nodeId || !readable(root, window.watermark)) continue;
    const own = (replies.get(root.id) ?? []).sort((a, b) => time(a.created_at) - time(b.created_at));
    const rootCreatedReadable = time(root.created_at) > window.watermark;
    const active =
      inWindow(root.resolved_at) || (rootCreatedReadable && inWindow(root.created_at)) || own.some((r) => inWindow(r.created_at));
    if (active) threads.push({ root, replies: own, nodeId });
  }
  return threads;
}
