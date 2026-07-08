// Worker-safe Figma helpers. Uses only the WHATWG `URL` + `fetch` globals
// (both available in the Workers runtime) — no Node APIs.
//
// `parseFigmaUrl` validates/splits a pasted Figma link (used by the executor
// and the proposal preview). `fetchFigmaImagePngUrl` renders a node to a PNG
// for the Slack proposal preview.

import type { Env } from "../types";

const FIGMA_API = "https://api.figma.com";
const IMAGE_FETCH_TIMEOUT_MS = 8000;
const NODE_FETCH_TIMEOUT_MS = 8000;
const MAX_TEXT_LAYERS = 200;

export interface FigmaNodeContent {
  name: string;
  type: string;
  /** Flattened text-layer strings, in document order. */
  texts: string[];
}

interface FigmaNode {
  name?: string;
  type?: string;
  characters?: string;
  children?: FigmaNode[];
}

function collectText(node: FigmaNode, out: string[]): void {
  if (out.length >= MAX_TEXT_LAYERS) return;
  if (node.type === "TEXT" && typeof node.characters === "string") {
    const t = node.characters.trim();
    if (t) out.push(t);
  }
  for (const child of node.children ?? []) collectText(child, out);
}

/**
 * Read a Figma node's structure + text layers via the REST API (for review /
 * inspection — distinct from the PNG preview). Throws on a missing token or a
 * non-2xx/err response so the caller can surface an honest "couldn't read it".
 */
export async function fetchFigmaNode(
  env: Env,
  fileKey: string,
  nodeId: string,
): Promise<FigmaNodeContent> {
  if (!env.FIGMA_ACCESS_TOKEN) throw new Error("FIGMA_ACCESS_TOKEN not configured on the Worker");

  const url = `${FIGMA_API}/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NODE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "X-Figma-Token": env.FIGMA_ACCESS_TOKEN },
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as {
      err?: string | null;
      nodes?: Record<string, { document?: FigmaNode } | undefined>;
    };
    if (!res.ok || data.err) {
      throw new Error(`Figma nodes ${res.status}${data.err ? `: ${data.err}` : ""}`);
    }
    const doc = data.nodes?.[nodeId]?.document;
    if (!doc) throw new Error(`Figma node ${nodeId} not found in file ${fileKey}`);
    const texts: string[] = [];
    collectText(doc, texts);
    return { name: doc.name ?? "(unnamed)", type: doc.type ?? "NODE", texts };
  } finally {
    clearTimeout(timer);
  }
}

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

/**
 * Render a Figma node to a PNG and return its signed URL, for the Slack
 * proposal preview. Best-effort: returns null (never throws) on a missing
 * token, a non-2xx response, a Figma `err`, or an 8s timeout — the caller
 * posts the proposal without an image rather than blocking on it.
 *
 * The returned URL is a short-lived (~30 min) signed S3 link; Slack mirrors it
 * into its own CDN at post time, so expiry after posting doesn't matter.
 */
export async function fetchFigmaImagePngUrl(
  env: Env,
  fileKey: string,
  nodeId: string,
  scale: 1 | 2 = 1,
): Promise<string | null> {
  if (!env.FIGMA_ACCESS_TOKEN) {
    console.warn("[figma] FIGMA_ACCESS_TOKEN not set — skipping preview image");
    return null;
  }

  const params = new URLSearchParams({ ids: nodeId, format: "png", scale: String(scale) });
  const url = `${FIGMA_API}/v1/images/${fileKey}?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "X-Figma-Token": env.FIGMA_ACCESS_TOKEN },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[figma] images ${fileKey} ${nodeId} -> ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      err?: string | null;
      images?: Record<string, string | null>;
    };
    if (data.err) {
      console.warn(`[figma] images err: ${data.err}`);
      return null;
    }
    // The images map is keyed by the node id exactly as requested.
    return data.images?.[nodeId] ?? null;
  } catch (err) {
    console.warn(`[figma] image fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
