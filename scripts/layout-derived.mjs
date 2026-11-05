/**
 * The derived rows of the Layout collection, computed from the Frame rules
 * rather than typed in.
 *
 * Figma has no expressions, so `Layout/width-content`, `Layout/width-column`,
 * `Layout/width-column-screen` and `Layout/width-modal-*` are plain numbers
 * per mode. They were filled by running this arithmetic at each mode's screen
 * width, and the token test checks the export against it, so a mode value that
 * drifts from the rules is caught instead of shipped.
 *
 * The rules, at a screen `width`:
 * - The Frame has no seams: the Page runs to the window edges. The Sidebar
 *   docks from 1024 and is 240 from the screen edge; below 1024 it is an
 *   overlay and takes no room.
 * - The Page pads 24 at every width.
 * - Content is the Page's inner width, capped at 1232 and never under 720:
 *   the width, less the docked Sidebar, less two Page pads.
 * - The grid is 12 columns with gutter 16.
 * - The screen grid (Modals and Drawers, the Page grid with the Sidebar
 *   closed) has its own pad, 24 · 24 · 32, so it does not move when the Page
 *   pad does. It is 12 columns with gutter 16, centered, and capped at 1232
 *   like content.
 * - A modal spans 6 · 8 · 10 columns of the screen grid plus its own 16 pad
 *   on each side, rounded to a whole pixel.
 *
 * The constants restate rules rather than read tokens on purpose: this is the
 * oracle the exported values are checked against, so it cannot take its
 * inputs from the export.
 */

/** The spacing / layout modes, by their Figma names, and the screen width each is worked at. */
export const LAYOUT_MODES = { 'Medium (768px)': 768, 'Large (1024px)': 1024, 'X-Large (1440px)': 1440 };

const SIDEBAR = 240;
const DOCK_FROM = 1024;
const PAGE_PAD = 24;
const SCREEN_PAD = 24;
const WIDE_SCREEN_PAD = 32;
const WIDE_SCREEN_PAD_FROM = 1440;
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
 * @returns {{ 'width-screen': number, 'pad-x-screen': number,
 *   'width-content': number, 'width-column': number,
 *   'width-column-screen': number, 'width-modal-sm': number,
 *   'width-modal-md': number, 'width-modal-lg': number }}
 */
export function deriveLayout(width) {
  const docked = width >= DOCK_FROM;
  const content = clamp(width - (docked ? SIDEBAR : 0) - 2 * PAGE_PAD);
  const padXScreen = width >= WIDE_SCREEN_PAD_FROM ? WIDE_SCREEN_PAD : SCREEN_PAD;
  const screenColumn = column(clamp(width - 2 * padXScreen));
  const modal = (n) => Math.round(span(n, screenColumn) + 2 * MODAL_PAD);
  return {
    'width-screen': width,
    'pad-x-screen': padXScreen,
    'width-content': content,
    'width-column': column(content),
    'width-column-screen': screenColumn,
    'width-modal-sm': modal(MODAL_SPANS.sm),
    'width-modal-md': modal(MODAL_SPANS.md),
    'width-modal-lg': modal(MODAL_SPANS.lg),
  };
}
