import { describe, expect, it } from 'vitest';

import { CIRCLES, CORNER_CENTERS, CONSTRUCTION_RADII, PLUS_BOX, PLUS_CENTER } from '../../assets/Logo/logoConstructionGeometry.js';
import { crossings } from './trails.js';
import { chime, isoMatrix, pathGeometry, spring, springStills, stopAtEdge, waveHeights } from './shapes-geometry.js';

describe('spring', () => {
  it('starts at rest, overshoots the target, and settles on it', () => {
    expect(spring(0)).toBe(0);
    expect(Math.max(...Array.from({ length: 40 }, (_, i) => spring(i * 0.05)))).toBeGreaterThan(1);
    expect(spring(3)).toBeCloseTo(1, 2);
  });
});

describe('springStills', () => {
  const stills = springStills({ n: 9, from: [20, 80], to: [20, 20] });
  it('has one still per step, first at the start, equal in time', () => {
    expect(stills).toHaveLength(9);
    expect([stills[0].x, stills[0].y]).toEqual([20, 80]);
    expect(stills[8].t).toBe(1);
  });
  it('travels toward the target and passes it once (the overshoot)', () => {
    expect(stills[2].y).toBeLessThan(stills[1].y);
    expect(stills.some((s) => s.y < 20)).toBe(true);
  });
  it('is evenly stepped in time, so the gaps shrink as it settles', () => {
    const gap = (i) => Math.abs(stills[i + 1].y - stills[i].y);
    expect(gap(0)).toBeLessThan(gap(1));
    expect(gap(7)).toBeLessThan(gap(1));
  });
});

describe('stopAtEdge', () => {
  const rect = { x: 40, y: 20, w: 20, h: 10 };
  it('stops a path from the left at the left edge', () => {
    expect(stopAtEdge([0, 25], rect)).toEqual([40, 25]);
  });
  it('stops a path from above at the top edge', () => {
    const [x, y] = stopAtEdge([50, -20], rect);
    expect([x, y]).toEqual([50, 20]);
  });
  it('enters a diagonal path on the first edge it reaches', () => {
    const [x, y] = stopAtEdge([0, 0], rect);
    expect(x).toBeCloseTo(40, 5);
    expect(y).toBeGreaterThanOrEqual(20);
    expect(y).toBeLessThanOrEqual(30);
  });
  it('leaves a start inside the target alone', () => {
    expect(stopAtEdge([45, 25], rect)).toEqual([45, 25]);
  });
});

describe('pathGeometry', () => {
  it('points the head along the line, tip at the landing', () => {
    const g = pathGeometry([0, 0], [30, 0]);
    expect(g.tip).toEqual([30, 0]);
    expect(g.angle).toBe(0);
    expect(g.head[0][1]).toBeCloseTo(-g.head[1][1], 5);
    expect(g.head[0][0]).toBeLessThan(30);
  });
  it('measures the angle in screen space, y down', () => {
    expect(pathGeometry([0, 0], [0, 20]).angle).toBeCloseTo(Math.PI / 2, 5);
  });
  it('stops the arrowhead at the target edge, not its center', () => {
    const g = pathGeometry([0, 25], [50, 25], { rect: { x: 40, y: 20, w: 20, h: 10 } });
    expect(g.tip).toEqual([40, 25]);
    expect(g.lineEnd[0]).toBeLessThan(40);
  });
  it('ends the line inside the head, so the stroke never pokes past the point', () => {
    const g = pathGeometry([0, 0], [40, 0], { headLength: 5 });
    expect(g.lineEnd[0]).toBeLessThan(40);
    expect(g.lineEnd[0]).toBeGreaterThan(40 - 5);
  });
  it('keeps paths that share a direction from crossing', () => {
    const arrows = [[[0, 0], [40, 10]], [[0, 12], [40, 22]], [[0, 24], [40, 34]]].map(([a, b]) => {
      const g = pathGeometry(a, b);
      return [g.start, g.tip];
    });
    expect(crossings(arrows)).toEqual([]);
  });
});

describe('isoMatrix', () => {
  it('squashes the plane to cos(tilt) of its height', () => {
    const [a, b, c, d] = isoMatrix({ tilt: 60, rotate: 0 });
    expect([a, b, c]).toEqual([1, 0, -0]);
    expect(d).toBeCloseTo(0.5, 5);
  });
});

describe('waveHeights', () => {
  it('follows the envelope: a chime is tall at the strike, short at the tail', () => {
    const h = waveHeights(24, chime);
    expect(Math.max(...h.slice(0, 5))).toBeGreaterThan(Math.max(...h.slice(-5)));
    expect(h.every((v) => v >= 0.12 && v <= 1)).toBe(true);
  });
});

describe('Logo construction geometry', () => {
  it('has the circles the mark is built on: outer 48, inner 36, centered in the 96 box', () => {
    expect(CIRCLES).toEqual([
      { cx: 48, cy: 48, r: CONSTRUCTION_RADII.outer },
      { cx: 48, cy: 48, r: CONSTRUCTION_RADII.inner },
    ]);
    expect(CONSTRUCTION_RADII.corner).toBe(16);
  });
  it('hangs the plus box off the top-right corner circle, plus centered in it', () => {
    expect(PLUS_CENTER).toEqual([68, 28]);
    const [cx, cy] = CORNER_CENTERS[1];
    expect([PLUS_BOX.x + PLUS_BOX.w, PLUS_BOX.y]).toEqual([cx, cy]);
    expect([PLUS_BOX.w, PLUS_BOX.h]).toEqual([24, 24]);
  });
});
