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

/** The subset of a Figma node the text walk looks at. */
export interface FigmaNode {
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
  "The frame's name, node type and text layers — nothing else. This payload carries no fills, " +
  "tokens, variable bindings or measurements: never state one from it, and never report one as " +
  "absent, because they are unread here rather than missing. Visual judgement comes from the " +
  "frame's rendered image when one is attached to this turn; this text describes no pixels.";

/** Appended when the walk hit its cap — a partial frame says so. */
export const FIGMA_TRUNCATION_NOTE =
  "The frame has more text than was read, so treat this as a partial reading: what is here is " +
  "quotable, what is missing is unknown rather than nonexistent.";

// ── URL parsing ─────────────────────────────────────────────────────────────
//
// Lives here rather than in figma.ts because two Slack-side modules need to
// agree on what counts as a frame link, and figma.ts imports the Workers fetch
// wrapper — which the test build cannot compile. A recognizer nothing can
// unit-test is how vision.ts and vision-reference.ts came to hold two
// different answers to the same question.

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
