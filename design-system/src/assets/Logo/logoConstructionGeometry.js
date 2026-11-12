/**
 * The Logo mark's construction, as numbers: a 96 box (1u = 8), the outer and
 * inner circles, the four corner circles, and the plus arm box. The docs
 * overlay (`LogoConstruction.jsx`) and the illustration kit's construction
 * shape both draw from this, so the two cannot drift apart.
 */
export const BOX = 96;
export const CENTER = BOX / 2;
export const CONSTRUCTION_RADII = { outer: 48, inner: 36, corner: 16 };

/** The corner circles' centers: the plus arms sit in the top-right one. */
export const CORNER_CENTERS = [[16, 16], [80, 16], [16, 80], [80, 80]];
/** The circles the overlay draws long-dashed or solid: the two big ones, then the two corners it names. */
export const CIRCLES = [
  { cx: CENTER, cy: CENTER, r: CONSTRUCTION_RADII.outer },
  { cx: CENTER, cy: CENTER, r: CONSTRUCTION_RADII.inner },
];
export const KEY_CORNERS = [[80, 16], [16, 80]];

/** The plus arm box, in the top-right corner circle, and the plus's center. */
export const PLUS_BOX = { x: 56, y: 16, w: 24, h: 24 };
export const PLUS_CENTER = [PLUS_BOX.x + PLUS_BOX.w / 2, PLUS_BOX.y + PLUS_BOX.h / 2];

/** The keyline grid: one line every 8 units, edge excluded. */
export const GRID = Array.from({ length: 11 }, (_, i) => (i + 1) * 8);

export const DIAGONALS = [[0, 0, BOX, BOX], [BOX, 0, 0, BOX]];
