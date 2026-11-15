import { describe, expect, it } from 'vitest';
import { TURN, turnPoint, turnTransform } from './iso-turn.js';

describe('iso turn', () => {
    it('is the Templates cover projection: skewY(-12deg) scaleX(.8)', () => {
        expect(TURN).toEqual({ skew: -12, scaleX: 0.8 });
        expect(turnTransform(10, 20)).toBe('translate(10 20) skewY(-12) scale(0.8 1)');
    });

    it('maps a plate-local point the way the SVG transform does', () => {
        expect(turnPoint(10, 20, 0, 0)).toEqual({ x: 10, y: 20 });
        const p = turnPoint(10, 20, 100, 50);
        expect(p.x).toBeCloseTo(10 + 80);
        // The right side rises by tan(12deg) of its drawn width.
        expect(p.y).toBeCloseTo(20 + 50 - Math.tan((12 * Math.PI) / 180) * 80);
    });
});
