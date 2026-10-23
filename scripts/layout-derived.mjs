/**
 * The derived rows of the Layout collection, computed from the frame rules in
 * the Layout Grid Lab rather than typed in.
 *
 * Figma has no expressions, so `Layout/width-content`, `Layout/width-column`,
 * `Layout/width-modal-*` and `Layout/pad-left-container` are plain numbers per
 * mode. They were filled by running this arithmetic at each mode's screen
 * width, and the token test checks the export against it, so a mode value that
 * drifts from the rules is caught instead of shipped.
 *
 * The rules, at a screen `width`:
 * - The surface container pads 8 on every side. The sidebar docks from 1024
 *   and is 240 from the screen edge; below 1024 it floats and the surface
 *   starts at the container pad.
 * - The surface pads 16 below 1440 and 24 from 1440.
 * - Content is the surface's inner width, capped at 1232 and never under 720.
 * - The grid is 12 columns with gutter 16.
 * - A modal spans 6 · 8 · 10 columns of the SCREEN grid (the page grid with
 *   the sidebar closed) plus its own 16 pad on each side.
 *
 * The constants restate rules rather than read tokens on purpose: this is the
 * oracle the exported values are checked against, so it cannot take its
 * inputs from the export.
 */

/** The spacing / layout modes, by their Figma names, and the screen width each is worked at. */
export const LAYOUT_MODES = { 'Medium (768px)': 768, 'Large (1024px)': 1024, 'X-Large (1440px)': 1440 };

const CONTAINER_PAD = 8;
const SIDEBAR = 240;
const DOCK_FROM = 1024;
const SURFACE_PAD = 16;
const WIDE_SURFACE_PAD = 24;
const WIDE_PAD_FROM = 1440;
const MAX_CONTENT = 1232;
const MIN_CONTENT = 720;
const COLUMNS = 12;
const GUTTER = 16;
const MODAL_PAD = 16;
const MODAL_SPANS = { sm: 6, md: 8, lg: 10 };

const clamp = (n) => Math.min(MAX_CONTENT, Math.max(MIN_CONTENT, n));
const column = (content) => (content - (COLUMNS - 1) * GUTTER) / COLUMNS;
const span = (n, col) => n * col + (n - 1) * GUTTER;

/**
 * @param {number} width the screen width a mode stands for
 * @returns {{ 'pad-left-container': number, 'width-content': number,
 *   'width-column': number, 'width-modal-sm': number, 'width-modal-md': number,
 *   'width-modal-lg': number }}
 */
export function deriveLayout(width) {
  const docked = width >= DOCK_FROM;
  const surfacePad = width >= WIDE_PAD_FROM ? WIDE_SURFACE_PAD : SURFACE_PAD;
  const surfaceX = docked ? SIDEBAR : CONTAINER_PAD;
  const content = clamp(width - surfaceX - CONTAINER_PAD - 2 * surfacePad);
  const screenColumn = column(clamp(width - 2 * CONTAINER_PAD - 2 * surfacePad));
  const modal = (n) => span(n, screenColumn) + 2 * MODAL_PAD;
  return {
    'pad-left-container': docked ? 0 : CONTAINER_PAD,
    'width-content': content,
    'width-column': column(content),
    'width-modal-sm': modal(MODAL_SPANS.sm),
    'width-modal-md': modal(MODAL_SPANS.md),
    'width-modal-lg': modal(MODAL_SPANS.lg),
  };
}
