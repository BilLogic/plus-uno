// What a Figma node read yields, and how it must be described.
//
// Pure — no `Env`, no `fetch`, no Workers globals — so `npm test` can compile
// it. `integrations/figma.ts` does the network; this file owns the two things
// that were wrong about the result and are provable without a network call.
//
// ── 1. The cap that said nothing ──────────────────────────────────────────
//
// The walk stops at MAX_TEXT_LAYERS. It used to stop silently, so a frame with
// 400 strings came back indistinguishable from a frame with 200 — and "the
// frame doesn't mention X" was answerable from a reading that had stopped
// before X. A cap the reader cannot see is the same defect as no cap.
//
// ── 2. The note that told the model it was blind ──────────────────────────
//
// The note used to read "It's text only — you cannot judge pixel-level
// visuals." `slack/vision.ts` renders the first frame link in the message and
// attaches the PNG to the same turn, so on the path that matters the model was
// told it could not see the frame while it was looking at it.
//
// The other half is unread vs absent. The Figma response for a node DOES carry
// `fills`, `boundVariables` and `absoluteBoundingBox`; the reader keeps the
// name, the type and the text and drops the rest. "No token on this frame"
// would be a claim about our reader, stated as a claim about the design.
//
// ── 3. The discussion pinned to the frame (#899) ──────────────────────────
//
// A pasted frame also brings the comment threads pinned to it or to a layer
// inside it. Figma pins only a root comment, by `client_meta.node_id`; a reply
// carries no pin and belongs to its root's. So a thread is the frame's when
// its root's node is the frame or one of its descendants, which the node read
// already holds. A comment left on the page is left out: on the canvas it
// carries no node at all, and when a link names the page itself (a CANVAS
// node, e.g. node-id 0:1) a comment pinned to that page node is still the
// page's, so only the threads on layers within the page are read. "No
// comments here" therefore means none pinned to this frame, and a comments
// read that failed says unread, never none.

/** The subset of a Figma node the text and comment walks look at. */
export interface FigmaNode {
  /** Figma's node id, e.g. "158:21725"; on every node a `/nodes` read returns. */
  id?: string;
  name?: string;
  type?: string;
  characters?: string;
  children?: FigmaNode[];
}

export const MAX_TEXT_LAYERS = 200;

/**
 * Flatten a node's TEXT descendants, in document order, capped — and say
 * whether the cap was crossed.
 *
 * `truncated` counts what was SEEN, not what was kept, so a frame sitting
 * exactly on the cap is whole. Reporting a complete-but-full frame as partial
 * would teach every reader to ignore the flag.
 */
export function collectTextLayers(node: FigmaNode): { texts: string[]; truncated: boolean } {
  const texts: string[] = [];
  let seen = 0;
  const walk = (n: FigmaNode): boolean => {
    if (n.type === "TEXT" && typeof n.characters === "string") {
      const t = n.characters.trim();
      if (t) {
        seen++;
        if (seen > MAX_TEXT_LAYERS) return true;
        texts.push(t);
      }
    }
    for (const child of n.children ?? []) {
      if (walk(child)) return true;
    }
    return false;
  };
  const truncated = walk(node);
  return { texts, truncated };
}

/** What `source_read` returns for a figma.com URL, said accurately. */
export const FIGMA_NOTE =
  "Of the frame itself, this payload carries its name, node type and text layers only: no fills, " +
  "tokens, variable bindings or measurements. Never state one from it, and never report one as " +
  "absent, because they are unread here rather than missing. Visual judgement comes from the " +
  "frame's rendered image when one is attached to this turn; this text describes no pixels.";

/** Appended when the walk hit its cap — a partial frame says so. */
export const FIGMA_TRUNCATION_NOTE =
  "The frame has more text than was read, so treat this as a partial reading: what is here is " +
  "quotable, what is missing is unknown rather than nonexistent.";

/** Appended when threads are pinned to the frame. */
export const FIGMA_COMMENTS_NOTE =
  "`comments` are the threads pinned to this frame or to a layer inside it (`layer` names which), " +
  "newest activity first, each with its replies in order. Quote a comment with its author (`by`) " +
  "and date, and say whether its thread is resolved: a resolved thread is settled, an open one is " +
  "still being discussed. A comment left on the page rather than on a layer isn't read here.";

/** Appended when the comments were read and none is pinned to the frame. */
export const FIGMA_NO_COMMENTS_NOTE =
  "No comment is pinned to this frame or to a layer inside it. A comment left on the page rather " +
  "than on a layer isn't read here, so this says nothing about the rest of the file.";

/** Appended when the comments read failed — unknown, not none. */
export const FIGMA_COMMENTS_UNREAD_NOTE =
  "The frame's comments couldn't be read this time (`comments_unread` says why), so whether it " +
  "has any is unknown: say that if asked, and never say it has none.";

/** Appended when a thread was too long for the read and was cut to fit. */
export const FIGMA_REPLIES_CAP_NOTE =
  "A thread too long for this read keeps its opening comment and its newest replies: " +
  "`replies_unread` counts the earlier replies left out, and `text_truncated` marks an opening " +
  "comment cut short. What was cut is unread rather than absent.";

/** The most threads one read lists, newest activity first. */
export const MAX_PINNED_THREADS = 20;
/**
 * The most comment text one read lists, roots and replies together — what a
 * web page's read carries. The thread with the newest activity is always
 * listed, cut to this cap when it runs past it on its own.
 */
export const MAX_PINNED_CHARS = 8_000;

/** Appended when more threads are pinned than are listed. */
export function figmaCommentsCapNote(listed: number, total: number): string {
  return (
    `Only the ${listed} threads with the newest activity are listed, of ${total} pinned here; ` +
    "the older ones are unread rather than absent."
  );
}

/**
 * The subset of a Figma comment the pinned read looks at — `FigmaComment`
 * (`../figma/client.ts`) is one, declared here so this file imports nothing.
 */
export interface FigmaCommentLike {
  id: string;
  /** The root's id on a reply; empty or absent on a root. */
  parent_id?: string | null;
  user: { handle: string };
  created_at: string;
  resolved_at?: string | null;
  message: string;
  /** A root's pin. A reply carries none: it belongs to its root's. */
  client_meta?: { node_id?: string } | null;
}

/** One reply in a pinned thread. */
export interface PinnedReply {
  /** The commenter's Figma handle. */
  by: string;
  /** When it was posted, ISO. */
  at: string;
  text: string;
}

/** A comment thread pinned to a frame or to a layer inside it. */
export interface PinnedThread {
  /** Who started it: their Figma handle. */
  by: string;
  /** When it was started, ISO. */
  at: string;
  /** The layer it is pinned to, by name; absent when it is pinned to the frame itself. */
  layer?: string;
  resolved: boolean;
  /** When it was resolved, ISO; only on a resolved thread. */
  resolved_at?: string;
  text: string;
  /** The opening comment was cut to the text cap; only on a thread cut to fit. */
  text_truncated?: boolean;
  /** Oldest first. */
  replies: PinnedReply[];
  /** How many earlier replies were left out to fit the text cap; only on a thread cut to fit. */
  replies_unread?: number;
}

/** The threads pinned to a frame: the newest that fit both caps, and how many there are. */
export interface PinnedComments {
  threads: PinnedThread[];
  total: number;
}

/** A time Figma stamped, as a number to sort by; 0 when it isn't one. */
const when = (iso: string | null | undefined): number => (iso ? Date.parse(iso) || 0 : 0);

/**
 * The comment threads pinned to `frame` or to any node inside it, newest
 * activity first — a root's, its replies' or its resolution's — up to
 * `MAX_PINNED_THREADS` and `MAX_PINNED_CHARS`, with the uncapped count beside
 * them. The cap stops at the first thread that doesn't fit, so what is listed
 * is always the newest, and what isn't is older. The newest thread is always
 * listed; when it alone runs past `MAX_PINNED_CHARS` it is cut to fit
 * (`fitToCap`), so the text cap holds for every read.
 *
 * The walk covers the whole subtree, uncapped, unlike the text walk: a
 * comment on the 300th layer is as pinned to the frame as one on the first.
 * A thread pinned to a page (a CANVAS node) is the page's, never a layer's,
 * so a link to a page reads only the threads on layers within it.
 *
 * @param frame - The frame's node, its own `id` included
 * @param comments - Every comment on the file, roots and replies
 */
export function pinnedThreads(frame: FigmaNode, comments: readonly FigmaCommentLike[]): PinnedComments {
  const layers = new Map<string, string>();
  const walk = (n: FigmaNode): void => {
    if (n.id && n.type !== "CANVAS") layers.set(n.id, n.name ?? "");
    for (const child of n.children ?? []) walk(child);
  };
  walk(frame);

  const repliesTo = new Map<string, FigmaCommentLike[]>();
  for (const c of comments) {
    if (c.parent_id) repliesTo.set(c.parent_id, [...(repliesTo.get(c.parent_id) ?? []), c]);
  }

  const kept = comments
    .filter((c) => !c.parent_id && layers.has(c.client_meta?.node_id ?? ""))
    .map((root) => {
      const replies = [...(repliesTo.get(root.id) ?? [])].sort((a, b) => when(a.created_at) - when(b.created_at));
      const pinnedTo = root.client_meta!.node_id!;
      const layer = pinnedTo === frame.id ? "" : layers.get(pinnedTo) || "(unnamed)";
      const thread: PinnedThread = {
        by: root.user.handle,
        at: root.created_at,
        ...(layer ? { layer } : {}),
        resolved: Boolean(root.resolved_at),
        ...(root.resolved_at ? { resolved_at: root.resolved_at } : {}),
        text: root.message.trim(),
        replies: replies.map((r) => ({ by: r.user.handle, at: r.created_at, text: r.message.trim() })),
      };
      const activity = Math.max(when(root.created_at), when(root.resolved_at), ...replies.map((r) => when(r.created_at)));
      return { thread, activity };
    })
    .sort((a, b) => b.activity - a.activity);

  const threads: PinnedThread[] = [];
  let chars = 0;
  for (const { thread } of kept) {
    const size = textOf(thread);
    if (threads.length === MAX_PINNED_THREADS || (threads.length && chars + size > MAX_PINNED_CHARS)) break;
    const listed = size > MAX_PINNED_CHARS ? fitToCap(thread) : thread;
    threads.push(listed);
    chars += textOf(listed);
  }
  return { threads, total: kept.length };
}

/** A thread's comment text, opening comment and replies together. */
const textOf = (t: PinnedThread): number => t.text.length + t.replies.reduce((n, r) => n + r.text.length, 0);

/**
 * A thread cut to `MAX_PINNED_CHARS`: its opening comment, cut short if it
 * alone runs past the cap, then the newest replies that fit, still oldest
 * first. The newest replies are kept because they carry where the discussion
 * ended up.
 */
function fitToCap(thread: PinnedThread): PinnedThread {
  const text = thread.text.slice(0, MAX_PINNED_CHARS);
  let room = MAX_PINNED_CHARS - text.length;
  let from = thread.replies.length;
  while (from > 0 && thread.replies[from - 1]!.text.length <= room) {
    from--;
    room -= thread.replies[from]!.text.length;
  }
  return {
    ...thread,
    text,
    ...(text.length < thread.text.length ? { text_truncated: true } : {}),
    replies: thread.replies.slice(from),
    ...(from > 0 ? { replies_unread: from } : {}),
  };
}

/** A pasted frame's read: what the node walk found and, when asked for, the comments pinned in it. */
export interface FigmaFrameRead {
  name: string;
  type: string;
  /** Text layers in document order, capped at MAX_TEXT_LAYERS. */
  texts: string[];
  /** The text walk stopped at its cap with more text in the frame. */
  truncated: boolean;
  /** The threads pinned to the frame or a layer inside it; absent when not asked for, or not read. */
  comments?: PinnedComments;
  /** Why the comments couldn't be read, when they were asked for and weren't. */
  commentsUnread?: string;
}

/**
 * What `source_read` returns for a pasted frame. A frame with no pinned
 * comments carries today's fields and nothing more; the note says which of
 * pinned, none pinned, or unread the comments were.
 *
 * @param url - The link as pasted
 * @param frame - The read, from `fetchFigmaFrame`
 */
export function describeFigmaFrame(url: string, frame: FigmaFrameRead): Record<string, unknown> {
  const notes = [FIGMA_NOTE];
  if (frame.truncated) notes.push(FIGMA_TRUNCATION_NOTE);
  const payload: Record<string, unknown> = {
    ok: true,
    source_type: "figma",
    url,
    title: frame.name,
    node_type: frame.type,
    content: frame.texts.join("\n"),
    text_layers: frame.texts.length,
    text_layers_truncated: frame.truncated,
  };
  if (frame.commentsUnread !== undefined) {
    payload.comments_unread = frame.commentsUnread;
    notes.push(FIGMA_COMMENTS_UNREAD_NOTE);
  } else if (frame.comments?.total) {
    const { threads, total } = frame.comments;
    payload.comments = threads;
    payload.comment_threads = total;
    payload.comments_truncated = threads.length < total;
    notes.push(FIGMA_COMMENTS_NOTE);
    if (threads.length < total) notes.push(figmaCommentsCapNote(threads.length, total));
    if (threads.some((t) => t.text_truncated || t.replies_unread)) notes.push(FIGMA_REPLIES_CAP_NOTE);
  } else if (frame.comments) {
    notes.push(FIGMA_NO_COMMENTS_NOTE);
  }
  payload.note = notes.join(" ");
  return payload;
}

// ── URL parsing ─────────────────────────────────────────────────────────────
//
// Lives here rather than in figma.ts because two Slack-side modules need to
// agree on what counts as a frame link, and everything in figma.ts goes through
// the metered fetch — so a test of the recognizer there would be a test with a
// transport stub in it. A recognizer nothing can unit-test is how vision.ts and
// vision-reference.ts came to hold two different answers to the same question.

export interface FigmaUrlParts {
  fileKey: string;
  /** Canonical colon form the Figma REST API expects, e.g. "158:21725". */
  nodeId: string;
}

/**
 * Parse a Figma share URL into its fileKey + nodeId.
 *
 * Handles the `/design/`, `/file/`, and `/proto/` path shapes and both node-id
 * encodings Figma emits: dash form (`node-id=158-21725`) and colon form
 * (`node-id=158%3A21725` → decoded to `158:21725` by `searchParams`). Returns
 * null for anything that isn't a figma.com URL carrying a node-id.
 */
export function parseFigmaUrl(url: string): FigmaUrlParts | null {
  if (typeof url !== "string" || !url.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (!/(?:^|\.)figma\.com$/i.test(parsed.hostname)) return null;

  const pathMatch = parsed.pathname.match(/^\/(?:design|file|proto)\/([A-Za-z0-9]+)/);
  if (!pathMatch) return null;
  const fileKey = pathMatch[1]!;

  // searchParams.get already percent-decodes, so `%3A` arrives as `:`.
  const rawNode = parsed.searchParams.get("node-id");
  if (!rawNode) return null;

  // Dash form uses a single `-` between the two ids; colon form is already
  // API-ready. Replace only the first `-` so compound ids stay intact.
  const nodeId = rawNode.includes(":") ? rawNode : rawNode.replace("-", ":");
  if (!/^[A-Za-z0-9]+:[A-Za-z0-9]+/.test(nodeId)) return null;

  return { fileKey, nodeId };
}
