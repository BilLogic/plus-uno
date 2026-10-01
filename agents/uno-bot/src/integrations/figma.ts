// Figma reads for a pasted frame link, over the Figma client (`src/figma/`).
//
// `parseFigmaUrl` validates/splits a pasted Figma link (used by the executor
// and the proposal preview). `fetchFigmaNode` reads a frame's text for
// `source_read`; `fetchFigmaImagePngUrl` renders a node to a PNG for vision
// and the Slack proposal preview. Each takes the client rather than `Env`, so
// tests drive them over the shared fake.

import type { FigmaCallOptions, FigmaClient } from "../figma/client";
import { collectTextLayers } from "./figma-reading";

const IMAGE_FETCH_TIMEOUT_MS = 8000;
const NODE_FETCH_TIMEOUT_MS = 8000;

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

  const data = await figma.nodes(fileKey, [nodeId], { timeoutMs: NODE_FETCH_TIMEOUT_MS });
  const doc = data.nodes?.[nodeId]?.document;
  if (!doc) throw new Error(`Figma node ${nodeId} not found in file ${fileKey}`);
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
