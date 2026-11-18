import { PAINT } from './paint.js';

/**
 * Shared geometry and role bindings for the Session summary kit composition.
 * Both `compositions.jsx` (story/docs React SVG) and `scripts/export-kit-art.mjs`
 * (static light/dark SVG asset export) render from this single scene.
 */
export const SESSION_SUMMARY_BOX = {
  width: 160,
  height: 90,
  exportWidth: 320,
  exportHeight: 180,
};

const BAR_HEIGHTS = [22, 16, 24, 19, 26];

export const sessionSummaryNodes = ({ x = 0, y = 0, w = SESSION_SUMMARY_BOX.width, h = SESSION_SUMMARY_BOX.height, accent = false } = {}) => {
  const cardX = x + 12;
  const cardY = y + 10;
  const cardW = w - 24;
  const cardH = h - 20;
  const padX = 8;
  const innerX = cardX + padX;
  const innerW = cardW - padX * 2;
  const avatarX = innerX + 6;
  const avatarY = cardY + 14;
  const dividerY = cardY + 30;
  const chartBottom = cardY + cardH - 10;
  const barCount = BAR_HEIGHTS.length;
  const barGap = 10;
  const barW = (innerW - barGap * (barCount - 1)) / barCount;

  const bars = BAR_HEIGHTS.map((bh, index) => {
    const bx = innerX + index * (barW + barGap);
    const by = chartBottom - bh;
    const isLast = index === barCount - 1;
    const fill = accent && isLast ? PAINT.accent : PAINT.shape;
    return {
      kind: 'rect',
      x: bx,
      y: by,
      w: barW,
      h: bh,
      fill,
      corner: 'shape',
    };
  });

  return [
    { kind: 'rect', x, y, w, h, fill: PAINT.frameSunken, corner: 'shape' },
    { kind: 'rect', x: cardX, y: cardY, w: cardW, h: cardH, fill: PAINT.pageSurface, stroke: PAINT.frameDivider, corner: 'card' },
    { kind: 'circle', cx: avatarX, cy: avatarY, r: 6, fill: accent ? PAINT.accent : PAINT.shape, opacity: accent ? 0.16 : undefined },
    { kind: 'circle', cx: avatarX, cy: avatarY, r: 2.5, fill: accent ? PAINT.accent : PAINT.iconGlyph },
    { kind: 'skeleton', x: avatarX + 11, y: cardY + 10, w: 48, h: 4, tone: PAINT.placeholderHeading },
    { kind: 'skeleton', x: avatarX + 11, y: cardY + 17, w: 30, h: 3, tone: PAINT.placeholderText },
    { kind: 'rect', x: innerX + innerW - 22, y: cardY + 10, w: 22, h: 8, fill: accent ? PAINT.accent : PAINT.countSurface, opacity: accent ? 0.16 : undefined, corner: 'count' },
    { kind: 'skeleton', x: innerX + innerW - 18, y: cardY + 13, w: 14, h: 2, tone: PAINT.placeholderText },
    { kind: 'rule', x1: innerX, x2: innerX + innerW, y1: dividerY, y2: dividerY, stroke: PAINT.frameDivider },
    ...bars,
  ];
};
