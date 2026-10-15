// What a frame read keeps beyond its text: the Dev Mode annotations on it, the
// fills it paints with, and — between two versions of it — what changed, said
// in plain words. PURE: it reads nodes the caller already holds.
//
// ── Annotations ────────────────────────────────────────────────────────────
//
// The team writes agent-readable context as annotations (docs/connectors/
// figma/overview.md), so a frame's annotations are as quotable as its text. Each comes
// back with the layer it sits on, its text and the properties it pins. Its
// category is a per-file id that REST cannot name, so it is left out rather
// than shown as a bare id.
//
// ── Fills ──────────────────────────────────────────────────────────────────
//
// Distinct visible fills across the frame, most-used first: a solid as hex
// (with its alpha when not opaque), a gradient by its stops, an image as
// such. A fill a variable binds says so, because the variable's NAME is not
// readable on this token (its plan has no variables scope): the hex is what
// renders, the token behind it is unread.
//
// ── Changes ────────────────────────────────────────────────────────────────
//
// Layers are matched by node id, which Figma keeps across versions. Added and
// removed are said of the outermost layer only — a removed group's children
// went with it. Position is not compared: a layer that moved because its
// neighbour grew did not change.

import type { FigmaAnnotation, FigmaColor, FigmaNode, FigmaPaint } from "./figma-reading";

/** The most annotations one read lists. */
export const MAX_ANNOTATIONS = 50;
/** The most distinct fills one read lists. */
export const MAX_FILLS = 30;
/** How many layer names each fill names. */
export const FILL_EXAMPLES = 3;
/** The most changes one diff lists. */
export const MAX_CHANGES = 60;
/** How much of a text layer a change quotes. */
const QUOTE_CHARS = 120;

/** One annotation, with the layer it is on. */
export interface FrameAnnotation {
  /** The layer it sits on, by name; absent when it is on the frame itself. */
  layer?: string;
  text: string;
  /** The layer properties it pins, e.g. `width`; only when it pins some. */
  properties?: string[];
}

/** One distinct fill, and where it is used. */
export interface FrameFill {
  fill: string;
  /** How many layers paint with it. */
  layers: number;
  /** Up to FILL_EXAMPLES of those layers, by name, in document order. */
  on: string[];
  /** A variable binds it on at least one layer; the variable's name is unread. */
  variable?: true;
}

/** Every node under `root`, itself included, in document order. */
function* walk(root: FigmaNode): Generator<FigmaNode> {
  yield root;
  for (const child of root.children ?? []) yield* walk(child);
}

const annotationText = (a: FigmaAnnotation): string => (a.label ?? a.labelMarkdown ?? "").trim();

/** An annotation's text and properties, or null when it has neither. */
function annotationOf(a: FigmaAnnotation, layer: string | undefined): FrameAnnotation | null {
  const text = annotationText(a);
  const properties = (a.properties ?? []).map((p) => p.type).filter((t): t is string => Boolean(t));
  if (!text && !properties.length) return null;
  return { ...(layer !== undefined ? { layer } : {}), text, ...(properties.length ? { properties } : {}) };
}

/**
 * The annotations on `frame` and every layer inside it, in document order, up
 * to MAX_ANNOTATIONS, with the uncapped count.
 */
export function collectAnnotations(frame: FigmaNode): { annotations: FrameAnnotation[]; total: number } {
  const all: FrameAnnotation[] = [];
  for (const node of walk(frame)) {
    const layer = node === frame ? undefined : node.name || "(unnamed)";
    for (const a of node.annotations ?? []) {
      const read = annotationOf(a, layer);
      if (read) all.push(read);
    }
  }
  return { annotations: all.slice(0, MAX_ANNOTATIONS), total: all.length };
}

const hexByte = (channel: number): string =>
  Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

const hexOf = (c: FigmaColor): string => `#${hexByte(c.r)}${hexByte(c.g)}${hexByte(c.b)}`;

/** A paint in words: `#2563EB`, `#2563EB at 50%`, `linear gradient #A → #B`, `image`. */
export function describePaint(p: FigmaPaint): string {
  const opacity = p.opacity ?? 1;
  if (p.type === "SOLID" && p.color) {
    const alpha = (p.color.a ?? 1) * opacity;
    return alpha < 1 ? `${hexOf(p.color)} at ${Math.round(alpha * 100)}%` : hexOf(p.color);
  }
  if (p.type?.startsWith("GRADIENT_")) {
    const kind = p.type.slice("GRADIENT_".length).toLowerCase();
    const stops = (p.gradientStops ?? []).map((s) => hexOf(s.color)).join(" → ");
    return `${kind} gradient${stops ? ` ${stops}` : ""}`;
  }
  return (p.type ?? "paint").toLowerCase();
}

const visibleFills = (n: FigmaNode): FigmaPaint[] => (n.fills ?? []).filter((p) => p.visible !== false);

/**
 * The distinct visible fills on `frame` and the layers inside it, most-used
 * first (ties in document order), up to MAX_FILLS, with the uncapped count.
 */
export function collectFills(frame: FigmaNode): { fills: FrameFill[]; total: number } {
  const byFill = new Map<string, FrameFill>();
  for (const node of walk(frame)) {
    const seen = new Set<string>();
    for (const paint of visibleFills(node)) {
      const fill = describePaint(paint);
      const entry = byFill.get(fill) ?? { fill, layers: 0, on: [] };
      if (!seen.has(fill)) {
        seen.add(fill);
        entry.layers++;
        if (entry.on.length < FILL_EXAMPLES) entry.on.push(node.name || "(unnamed)");
      }
      if (paint.boundVariables && Object.keys(paint.boundVariables).length) entry.variable = true;
      byFill.set(fill, entry);
    }
  }
  const fills = [...byFill.values()].sort((a, b) => b.layers - a.layers);
  return { fills: fills.slice(0, MAX_FILLS), total: fills.length };
}

const quote = (s: string | undefined): string => {
  const t = (s ?? "").trim();
  return `"${t.length > QUOTE_CHARS ? `${t.slice(0, QUOTE_CHARS)}…` : t}"`;
};

const fillsOf = (n: FigmaNode): string => visibleFills(n).map(describePaint).join(", ") || "none";
const sizeOf = (n: FigmaNode): string | null =>
  n.absoluteBoundingBox ? `${Math.round(n.absoluteBoundingBox.width)}×${Math.round(n.absoluteBoundingBox.height)}` : null;
const kindOf = (n: FigmaNode): string => (n.type ?? "layer").toLowerCase().replace(/_/g, " ");

/** Each node by id, with its parent's id. */
function indexOf(root: FigmaNode | null): Map<string, { node: FigmaNode; parent: string | null }> {
  const map = new Map<string, { node: FigmaNode; parent: string | null }>();
  const visit = (n: FigmaNode, parent: string | null): void => {
    if (n.id) map.set(n.id, { node: n, parent });
    for (const c of n.children ?? []) visit(c, n.id ?? parent);
  };
  if (root) visit(root, null);
  return map;
}

/**
 * What changed in a frame between an older version of it and now, one plain
 * sentence per change, in the current document order with removals last, up
 * to MAX_CHANGES, with the uncapped count.
 *
 * @param then - The frame at the older version; null when it did not exist then
 * @param now - The frame as it stands
 */
export function frameChanges(then: FigmaNode | null, now: FigmaNode): { changes: string[]; total: number } {
  if (!then) return { changes: ["The frame itself is new: it did not exist in that version."], total: 1 };
  const before = indexOf(then);
  const after = indexOf(now);
  const changes: string[] = [];

  for (const [id, { node, parent }] of after) {
    const old = before.get(id)?.node;
    const name = quote(node.name);
    if (!old) {
      if (parent === null || before.has(parent)) changes.push(`Added ${kindOf(node)} ${name}.`);
      continue;
    }
    if ((old.name ?? "") !== (node.name ?? "")) changes.push(`Renamed ${quote(old.name)} to ${name}.`);
    if ((old.characters ?? "").trim() !== (node.characters ?? "").trim()) {
      changes.push(`Text of ${name} changed from ${quote(old.characters)} to ${quote(node.characters)}.`);
    }
    if (fillsOf(old) !== fillsOf(node)) changes.push(`Fill of ${name} changed from ${fillsOf(old)} to ${fillsOf(node)}.`);
    const [wasSize, isSize] = [sizeOf(old), sizeOf(node)];
    if (wasSize && isSize && wasSize !== isSize) changes.push(`Resized ${name} from ${wasSize} to ${isSize}.`);
    const wasNotes = (old.annotations ?? []).map(annotationText).filter(Boolean);
    const isNotes = (node.annotations ?? []).map(annotationText).filter(Boolean);
    for (const note of isNotes) if (!wasNotes.includes(note)) changes.push(`Annotation on ${name} added: ${quote(note)}.`);
    for (const note of wasNotes) if (!isNotes.includes(note)) changes.push(`Annotation on ${name} removed: ${quote(note)}.`);
  }
  for (const [id, { node, parent }] of before) {
    if (after.has(id)) continue;
    if (parent === null || after.has(parent)) changes.push(`Removed ${kindOf(node)} ${quote(node.name)}.`);
  }
  return { changes: changes.slice(0, MAX_CHANGES), total: changes.length };
}
