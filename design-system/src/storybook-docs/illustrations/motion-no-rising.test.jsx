import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CHOREOGRAPHY_DEMOS } from './motion-choreography.jsx';
import { PRINCIPLE_DEMOS } from './motion-principles.jsx';
import { pointsOf } from './trails.js';

/**
 * T5 ruling: nothing arrives by rising (closing gaps after an exit is fine, and
 * intentional broken Don't tiles that scatter across axes opt out via crossing
 * or exit detours). Entering subjects start at or above their landing y (`y0 <= y1`),
 * both in their drawn initial vs landing transforms and in their trail arrows.
 */
const translateYs = (scene, state) => {
  const { container } = render(<svg viewBox={scene.viewBox}>{scene.draw(state)}</svg>);
  return [...container.querySelectorAll('g[transform]')].map((g) => {
    const m = g.getAttribute('transform').match(/translate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\s*\)/);
    return m ? Number(m[2] ?? 0) : 0;
  });
};

// Container growth (`understand-*`), gap-closing after row removal (`space-*`),
// intentional scatter (`direction-scatter`), and wrong-way exit (`retrace-away`)
// are not entering arrivals.
const NON_ENTERING_IDS = new Set([
  'understand-do',
  'understand-dont',
  'space-clear',
  'space-collide',
  'direction-scatter',
  'retrace-away',
]);

const ENTERING_SCENES = [
  ...Object.values(PRINCIPLE_DEMOS).flatMap((d) => d.scenes),
  ...Object.values(CHOREOGRAPHY_DEMOS).flatMap((d) => d.scenes),
].filter((s) => !NON_ENTERING_IDS.has(s.id));

describe('Nothing arrives by rising (T5)', () => {
  it.each(ENTERING_SCENES.map((s) => [s.id, s]))('%s never starts below its landing y', (_id, scene) => {
    for (const arrow of scene.arrows ?? []) {
      const pts = pointsOf(arrow);
      expect(pts[0][1]).toBeLessThanOrEqual(pts[pts.length - 1][1]);
    }
    const startYs = translateYs(scene, scene.initial);
    const landYs = translateYs(scene, { ...scene.initial, ...scene.landing });
    if (startYs.length === landYs.length) {
      startYs.forEach((y0, i) => expect(y0).toBeLessThanOrEqual(landYs[i]));
    }
  });

  it("Choreography Direction unifies laterally without rising while Don't keeps three scattered directions", () => {
    const [unify, scatter] = CHOREOGRAPHY_DEMOS.direction.scenes;
    expect(unify.caption).not.toContain('up and to the left');
    expect(scatter.crossing).toBe(true);
    const angles = scatter.arrows.map((a) => {
      const [s, e] = pointsOf(a);
      return Math.atan2(e[1] - s[1], e[0] - s[0]).toFixed(2);
    });
    expect(new Set(angles).size).toBe(3);
  });
});
