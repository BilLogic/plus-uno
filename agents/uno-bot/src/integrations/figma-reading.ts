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
