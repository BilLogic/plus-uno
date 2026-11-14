/**
 * The flat turn the docs' exploded views draw a plate at: skewed and narrowed,
 * with no perspective, so edges stay parallel and skeleton bars stay crisp.
 * The Templates overview cover and the Elevation stack both draw with it, so
 * the two figures share one angle.
 */
export const TURN = { skew: -12, scaleX: 0.8 };

/** How far a plate's top edge climbs per unit of drawn width. */
const SLOPE = Math.tan((TURN.skew * Math.PI) / 180);

/** The SVG transform that sets a plate's top-left corner at (x, y) and turns it. */
export const turnTransform = (x, y) => `translate(${x} ${y}) skewY(${TURN.skew}) scale(${TURN.scaleX} 1)`;

/** Where a point at (lx, ly) on a plate placed at (x, y) lands once turned. */
export const turnPoint = (x, y, lx, ly) => ({ x: x + TURN.scaleX * lx, y: y + ly + SLOPE * TURN.scaleX * lx });
