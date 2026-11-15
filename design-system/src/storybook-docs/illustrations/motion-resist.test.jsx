import { describe, expect, it } from 'vitest';
import { resisted, unresisted } from './motion.jsx';
import { limitRest, limitWidth } from './motion-playground.jsx';

describe('resistance past a limit', () => {
  it('unresisted undoes resisted, so a second grab picks up where the Panel is', () => {
    for (const extra of [0, 1, 7.5, 20, 64]) expect(unresisted(resisted(extra))).toBeCloseTo(extra, 9);
  });
  it('follows one to one up to the limit and less past it', () => {
    expect(limitWidth(10) - limitWidth(0)).toBe(10);
    expect(limitWidth(45) - limitWidth(35)).toBeLessThan(10);
  });
  it('comes to rest at the limit when let go past it, and where it is below it', () => {
    expect(limitRest(limitWidth(45))).toBe(limitWidth(25));
    expect(limitRest(limitWidth(10))).toBe(limitWidth(10));
  });
});
