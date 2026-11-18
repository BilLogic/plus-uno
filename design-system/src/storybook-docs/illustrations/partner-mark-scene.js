import { PAINT } from './paint.js';

/**
 * Shared geometry and role bindings for the Partner mark kit composition.
 * Both `compositions.jsx` (story/docs React SVG) and `scripts/export-kit-art.mjs`
 * (static light/dark SVG asset export) render from this single scene.
 */
export const PARTNER_MARK_BOX = {
  width: 64,
  height: 64,
  exportWidth: 64,
  exportHeight: 64,
};

export const partnerMarkNodes = ({
  x = 0,
  y = 0,
  w = PARTNER_MARK_BOX.width,
  h = PARTNER_MARK_BOX.height,
  accent = false,
} = {}) => {
  const sx = w / PARTNER_MARK_BOX.width;
  const sy = h / PARTNER_MARK_BOX.height;
  const s = Math.min(sx, sy);

  return [
    { kind: 'rect', x, y, w, h, fill: accent ? PAINT.accent : PAINT.shape, corner: 'card' },
    { kind: 'circle', cx: x + 23 * sx, cy: y + 23 * sy, r: 9 * s, fill: PAINT.pageSurface },
    { kind: 'rect', x: x + 14 * sx, y: y + 36 * sy, w: 18 * sx, h: 14 * sy, fill: PAINT.pageSurface, corner: 'shape' },
    { kind: 'rect', x: x + 36 * sx, y: y + 14 * sy, w: 14 * sx, h: 36 * sy, fill: PAINT.pageSurface, corner: 'shape' },
  ];
};
