// Which comments a night's read may look at, and which threads it does (#900).
//
// THE WATERMARK. The read switches on once, and its watermark is that moment:
// a comment created before it is never read, so years of old discussion never
// reach #plus-design (#891 story 16). A root resolved after it counts as
// read — resolving is the newest thing said about that thread — but its
// replies from before the watermark stay unread. A thread whose root came
// before the watermark and is still open is read by its replies alone: a
// reply after the watermark is read, the root it answers is not, and the
// thread is shown and quoted by its first such reply.
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
// WHAT IS LEFT TO @uno. A comment that asks uno-bot something was answered as
// it was made (#903, `../figma-ask/`), and a change it asked for went to
// #plus-design as its own card; uno-bot's own replies carry its label. Neither
// is read here, so no ask becomes a second card at night: a thread whose root
// is an ask is read by its other replies alone, as an old root is.
//
// PURE.

import type { FigmaComment } from "../figma/client";
import { asksUno, isOwnComment } from "../figma-ask/trigger";

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
  /** Whether the root itself may be read; false for an open root from before
   *  the watermark, whose thread is read by its replies alone. */
  rootRead: boolean;
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
export function readable(c: Pick<FigmaComment, "created_at" | "resolved_at" | "parent_id" | "message">, watermark: number): boolean {
  if (asksUno(c.message) || isOwnComment(c.message)) return false;
  if (time(c.created_at) > watermark) return true;
  return !c.parent_id && time(c.resolved_at) > watermark;
}

/**
 * A thread's comments the read may show, oldest first: the root when it may
 * be read, then its readable replies. The first is what a card quotes.
 *
 * @param t - The thread
 */
export function readComments(t: CommentThread): FigmaComment[] {
  return t.rootRead ? [t.root, ...t.replies] : t.replies;
}

/**
 * The threads tonight's read looks at: pinned roots with activity in the
 * window, each carrying only the replies it may read.
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
    if (!nodeId) continue;
    const own = (replies.get(root.id) ?? []).sort((a, b) => time(a.created_at) - time(b.created_at));
    const rootRead = readable(root, window.watermark);
    if (!rootRead && !own.length) continue;
    const active =
      (rootRead && inWindow(root.resolved_at)) ||
      (time(root.created_at) > window.watermark && inWindow(root.created_at)) ||
      own.some((r) => inWindow(r.created_at));
    if (active) threads.push({ root, rootRead, replies: own, nodeId });
  }
  return threads;
}
