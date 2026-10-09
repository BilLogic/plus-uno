// Figma reads for a pasted frame link, over the Figma client (`src/figma/`).
//
// `parseFigmaUrl` validates/splits a pasted Figma link (used by the executor
// and the proposal preview). `fetchFigmaFrame` reads a pasted frame for
// `source_read` — its text and the comments pinned in it (#899);
// `fetchFigmaNode` reads a frame's text alone, for the drift check;
// `fetchFigmaImagePngUrl` renders a node to a PNG for vision and the Slack
// proposal preview. Each takes the client rather than `Env`, so tests drive
// them over the shared fake.

import type { FigmaCallOptions, FigmaClient } from "../figma/client";
import { collectTextLayers, pinnedThreads, type FigmaFrameRead, type FigmaNode } from "./figma-reading";

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
  return contentOf(await readFrameDoc(figma, fileKey, nodeId));
}

/**
 * Read a pasted frame for `source_read`: its name, type and text layers, and
 * the comment threads pinned to it or to a layer inside it (#899).
 *
 * The comments come from one more call, made after the node read has
 * landed. Made beside it, the comments call could be metered first and spend
 * a turn's last lookup, leaving the frame — the part that read fine before —
 * to the budget stop. The node read decides the outcome as `fetchFigmaNode`
 * does: it throws on a missing client or a refusal. A comments read that
 * fails — a refusal, a rate limit it may not wait out (`COMMENTS_MAX_WAIT_MS`),
 * a timeout, the turn's budget stop — never costs the frame: its text comes
 * back with `commentsUnread`, which says unknown rather than none, and the
 * loop's trip counter still marks a budget stop partial.
 *
 * @param figma - The Figma client; undefined when the Worker has no token
 * @param opts - `comments: false` reads the node alone, as the sweep does
 */
export async function fetchFigmaFrame(
  figma: Pick<FigmaClient, "nodes" | "comments"> | undefined,
  fileKey: string,
  nodeId: string,
  opts: { comments?: boolean } = {},
): Promise<FigmaFrameRead> {
  if (!figma) throw new Error("FIGMA_ACCESS_TOKEN not configured on the Worker");

  const doc = await readFrameDoc(figma, fileKey, nodeId);
  const content = contentOf(doc);
  if (opts.comments === false) return content;

  const read = await figma
    .comments(fileKey, { timeoutMs: COMMENTS_FETCH_TIMEOUT_MS, attempts: 2, maxWaitMs: COMMENTS_MAX_WAIT_MS })
    .then(
      (r) => ({ list: r.comments ?? [] }),
      (err: unknown) => ({ error: err instanceof Error ? err.message : String(err) }),
    );
  if ("error" in read) {
    console.warn(`[figma] comments ${fileKey} failed: ${read.error}`);
    return { ...content, commentsUnread: read.error };
  }
  // The id the link named is the frame's, whether or not the node echoes it.
  return { ...content, comments: pinnedThreads({ ...doc, id: doc.id ?? nodeId }, read.list) };
}

/** The frame's node, or a throw the caller reports as "couldn't read it". */
async function readFrameDoc(figma: Pick<FigmaClient, "nodes">, fileKey: string, nodeId: string): Promise<FigmaNode> {
  const data = await figma.nodes(fileKey, [nodeId], { timeoutMs: NODE_FETCH_TIMEOUT_MS });
  const doc = data.nodes?.[nodeId]?.document;
  if (!doc) throw new Error(`Figma node ${nodeId} not found in file ${fileKey}`);
  return { ...doc, name: doc.name?.trim() || data.name?.trim() || "Figma frame" };
}

/** A node's name, type and text layers. */
function contentOf(doc: FigmaNode): FigmaNodeContent {
  const { texts, truncated } = collectTextLayers(doc);
  return { name: doc.name ?? "(unnamed)", type: doc.type ?? "NODE", texts, truncated };
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
