// Figma reads for a pasted frame link, over the Figma client (`src/figma/`).
//
// `parseFigmaUrl` validates/splits a pasted Figma link (used by the executor
// and the proposal preview). `fetchFigmaFrame` reads a pasted frame for
// `source_read` — its text, annotations and fills, the comments pinned in it
// (#899) and, given a date, what changed in it since;
// `fetchFigmaNode` reads a frame's text alone, for the drift check;
// `fetchFigmaImagePngUrl` renders a node to a PNG for vision and the Slack
// proposal preview. Each takes the client rather than `Env`, so tests drive
// them over the shared fake.

import type { FigmaCallOptions, FigmaClient } from "../figma/client";
import { collectAnnotations, collectFills, frameChanges } from "./figma-frame-detail";
import { collectTextLayers, pinnedThreads, type FigmaFrameChanges, type FigmaFrameRead, type FigmaNode } from "./figma-reading";

const IMAGE_FETCH_TIMEOUT_MS = 8000;
const NODE_FETCH_TIMEOUT_MS = 8000;
const COMMENTS_FETCH_TIMEOUT_MS = 8000;
/**
 * The most a frame's comments read may wait on pacing and 429 backoff
 * together. Short, because someone is waiting on the frame: a comments read
 * the rate budget would hold reports `comments_unread` instead.
 */
export const COMMENTS_MAX_WAIT_MS = 3000;

export interface FigmaNodeContent {
  name: string;
  type: string;
  /** Flattened text-layer strings, in document order. */
  texts: string[];
  /**
   * The walk stopped at MAX_TEXT_LAYERS with more text still in the frame.
   *
   * Reported rather than swallowed: a caller that cannot tell a whole frame
   * from the first 200 strings of one reads a partial frame as a complete
   * one, and says so to a human. A cap the reader cannot see is the same
   * defect as no cap at all.
   */
  truncated: boolean;
}


/**
 * Read a Figma node's structure + text layers (for review / inspection —
 * distinct from the PNG preview). Throws on a missing client or a refusal the
 * client's retries did not get past, so the caller can surface an honest
 * "couldn't read it".
 *
 * @param figma - The Figma client; undefined when the Worker has no token
 */
export async function fetchFigmaNode(
  figma: Pick<FigmaClient, "nodes"> | undefined,
  fileKey: string,
  nodeId: string,
): Promise<FigmaNodeContent> {
  if (!figma) throw new Error("FIGMA_ACCESS_TOKEN not configured on the Worker");
  const { doc, shown } = await readFrameDoc(figma, fileKey, nodeId);
  return contentOf(doc, shown);
}

/**
 * Read a pasted frame for `source_read`: its name, type, text layers,
 * annotations and fills, the comment threads pinned to it or to a layer
 * inside it (#899), and — given `since` — what changed in it since then.
 *
 * Every call after the node read is made after it has landed. Made beside
 * it, one could be metered first and spend a turn's last lookup, leaving the
 * frame — the part that read fine before — to the budget stop. The node read
 * decides the outcome as `fetchFigmaNode` does: it throws on a missing client
 * or a refusal. A comments or diff read that fails — a refusal, a rate limit
 * it may not wait out, a timeout, the turn's budget stop — never costs the
 * frame: it comes back with `commentsUnread` or `changesUnread`, which say
 * unknown rather than none, and the loop's trip counter still marks a budget
 * stop partial.
 *
 * SUBREQUESTS, first attempts: 1 for the frame, +1 for its comments, and with
 * `since` +1 for each page of the history read (at most MAX_VERSION_PAGES)
 * and +1 for the frame at that version — 4 for a date inside the newest
 * VERSIONS_PAGE_SIZE versions, 6 at most. A retried attempt is one more each.
 *
 * @param figma - The Figma client; undefined when the Worker has no token
 * @param opts - `comments: false` reads the node alone, as the sweep does;
 *   `since` (epoch ms) asks what changed since that moment
 */
export async function fetchFigmaFrame(
  figma: Pick<FigmaClient, "nodes" | "comments" | "versions"> | undefined,
  fileKey: string,
  nodeId: string,
  opts: { comments?: boolean; since?: number } = {},
): Promise<FigmaFrameRead> {
  if (!figma) throw new Error("FIGMA_ACCESS_TOKEN not configured on the Worker");

  const { doc, shown } = await readFrameDoc(figma, fileKey, nodeId);
  // The name shown labels what the read lists; the diff below takes `doc` as Figma holds it.
  const named = { ...doc, name: shown };
  let frame: FigmaFrameRead = { ...contentOf(doc, shown), annotations: collectAnnotations(named), fills: collectFills(named) };

  if (opts.comments !== false) {
    const read = await figma
      .comments(fileKey, { timeoutMs: COMMENTS_FETCH_TIMEOUT_MS, attempts: 2, maxWaitMs: COMMENTS_MAX_WAIT_MS })
      .then(
        (r) => ({ list: r.comments ?? [] }),
        (err: unknown) => ({ error: messageOf(err) }),
      );
    if ("error" in read) {
      console.warn(`[figma] comments ${fileKey} failed: ${read.error}`);
      frame = { ...frame, commentsUnread: read.error };
    } else {
      // The id the link named is the frame's, whether or not the node echoes it.
      frame = { ...frame, comments: pinnedThreads({ ...named, id: doc.id ?? nodeId }, read.list) };
    }
  }

  if (opts.since !== undefined) {
    try {
      frame = { ...frame, ...(await changesSince(figma, fileKey, nodeId, doc, opts.since)) };
    } catch (err) {
      console.warn(`[figma] changes ${fileKey} ${nodeId} failed: ${messageOf(err)}`);
      frame = { ...frame, changesUnread: messageOf(err) };
    }
  }
  return frame;
}

/** How many versions one history page asks for: Figma's most. */
export const VERSIONS_PAGE_SIZE = 50;
/** The most history pages one diff reads, so a date far back costs a bounded number of calls. */
export const MAX_VERSION_PAGES = 3;
/**
 * The most a diff's reads may wait on pacing and 429 backoff, each. The
 * older frame is a Tier 1 read, where uno-bot's share frees one slot every
 * 12 s, so this covers one slot and no more.
 */
export const CHANGES_MAX_WAIT_MS = 12_000;

/**
 * What changed in the frame between the newest version saved at or before
 * `since` and now, or why that is unread when the history does not reach
 * back to `since`. A refusal throws, for the caller to report as unread.
 */
async function changesSince(
  figma: Pick<FigmaClient, "nodes" | "versions">,
  fileKey: string,
  nodeId: string,
  now: FigmaNode,
  since: number,
): Promise<{ changes: FigmaFrameChanges } | { changesUnread: string }> {
  const call = { timeoutMs: NODE_FETCH_TIMEOUT_MS, attempts: 2, maxWaitMs: CHANGES_MAX_WAIT_MS };
  let before: string | undefined;
  let oldest: string | undefined;
  for (let page = 0; page < MAX_VERSION_PAGES; page++) {
    const listed = (await figma.versions(fileKey, { ...call, pageSize: VERSIONS_PAGE_SIZE, ...(before ? { before } : {}) })).versions ?? [];
    const version = listed.find((v) => Date.parse(v.created_at) <= since);
    if (version) {
      const data = await figma.nodes(fileKey, [nodeId], { ...call, version: version.id });
      const then = data.nodes?.[nodeId]?.document ?? null;
      const { changes, total } = frameChanges(then, now);
      return {
        changes: {
          since: new Date(since).toISOString(),
          version: {
            id: version.id,
            ...(version.label ? { label: version.label } : {}),
            at: version.created_at,
            ...(version.user?.handle ? { by: version.user.handle } : {}),
          },
          changes,
          total,
        },
      };
    }
    oldest = listed.at(-1)?.created_at ?? oldest;
    if (listed.length < VERSIONS_PAGE_SIZE) {
      return {
        changesUnread: oldest
          ? `the file's saved history starts at ${oldest}, after ${new Date(since).toISOString()}`
          : "the file lists no saved versions",
      };
    }
    before = listed.at(-1)!.id;
  }
  return {
    changesUnread: `the newest ${MAX_VERSION_PAGES * VERSIONS_PAGE_SIZE} versions reach back only to ${oldest}, after ${new Date(since).toISOString()}`,
  };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** The frame's node as Figma holds it, and the name to show for it — a blank
 *  name falls back to the file's — or a throw the caller reports as "couldn't
 *  read it". A diff compares the node, never the name shown. */
async function readFrameDoc(figma: Pick<FigmaClient, "nodes">, fileKey: string, nodeId: string): Promise<{ doc: FigmaNode; shown: string }> {
  const data = await figma.nodes(fileKey, [nodeId], { timeoutMs: NODE_FETCH_TIMEOUT_MS });
  const doc = data.nodes?.[nodeId]?.document;
  if (!doc) throw new Error(`Figma node ${nodeId} not found in file ${fileKey}`);
  return { doc, shown: doc.name?.trim() || data.name?.trim() || "Figma frame" };
}

/** A node's name, type and text layers. */
function contentOf(doc: FigmaNode, name: string): FigmaNodeContent {
  const { texts, truncated } = collectTextLayers(doc);
  return { name, type: doc.type ?? "NODE", texts, truncated };
}

export { parseFigmaUrl, type FigmaUrlParts } from "./figma-reading";

/** How a render may be bounded: its scale, and the client's wait and attempts. */
export type FigmaRenderOptions = Pick<FigmaCallOptions, "maxWaitMs" | "attempts"> & { scale?: 1 | 2 };

/**
 * Render a Figma node to a PNG and return its signed URL, for vision and the
 * Slack proposal preview. Best-effort: returns null (never throws) on a
 * missing client, any refusal, a Figma `err`, or an 8s timeout — the caller
 * goes on without an image rather than blocking on it. How long it may wait
 * for the rate budget is the caller's (`opts`).
 *
 * The returned URL is a short-lived (~30 min) signed S3 link; Slack mirrors it
 * into its own CDN at post time, so expiry after posting doesn't matter.
 *
 * @param figma - The Figma client; undefined when the Worker has no token
 */
export async function fetchFigmaImagePngUrl(
  figma: Pick<FigmaClient, "images"> | undefined,
  fileKey: string,
  nodeId: string,
  opts: FigmaRenderOptions = {},
): Promise<string | null> {
  if (!figma) {
    console.warn("[figma] FIGMA_ACCESS_TOKEN not set — skipping preview image");
    return null;
  }

  const { scale = 1, ...call } = opts;
  try {
    const data = await figma.images(fileKey, [nodeId], { format: "png", scale, timeoutMs: IMAGE_FETCH_TIMEOUT_MS, ...call });
    // The images map is keyed by the node id exactly as requested.
    return data.images?.[nodeId] ?? null;
  } catch (err) {
    console.warn(`[figma] images ${fileKey} ${nodeId} failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
