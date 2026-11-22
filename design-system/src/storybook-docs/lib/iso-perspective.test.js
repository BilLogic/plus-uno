import { describe, expect, it } from 'vitest';
import { VIEW, projectPoint, rigTransform, stackLayout } from './iso-perspective.js';

describe('iso perspective', () => {
    it('is the canvas angle', () => {
        expect(VIEW).toMatchObject({ rotateX: 58, rotateZ: -38 });
        expect(rigTransform).toBe('rotateX(58deg) rotateZ(-38deg)');
    });

    it('matches the browser matrix for the same transform', () => {
        const x = (58 * Math.PI) / 180;
        const z = (-38 * Math.PI) / 180;
        const [px, py] = [80, 45];
        const ty = px * Math.sin(z) + py * Math.cos(z);
        const p = projectPoint(px, py);
        const w = 1 - (ty * Math.sin(x)) / VIEW.perspective;
        expect(p.x).toBeCloseTo((px * Math.cos(z) - py * Math.sin(z)) / w, 6);
        expect(p.y).toBeCloseTo((ty * Math.cos(x)) / w, 6);
    });

    it('draws nearer edges larger, so parallel plate edges converge', () => {
        const edge = (y) => {
            const a = projectPoint(-80, y);
            const b = projectPoint(80, y);
            return Math.hypot(b.x - a.x, b.y - a.y);
        };
        expect(edge(45)).not.toBeCloseTo(edge(-45), 1);
    });

    it('lifts a higher plate up the screen', () => {
        expect(projectPoint(0, 0, 60).y).toBeLessThan(projectPoint(0, 0, 0).y);
    });

    it('holds every corner of every plate on the stage', () => {
        const box = { w: 160, h: 90, count: 5, stepDy: 52, pad: 14, endPad: 20 };
        const { lifts, width, height, origin } = stackLayout(box);
        expect(lifts).toHaveLength(5);
        expect(lifts[0]).toBeLessThan(lifts[4]);
        for (const z of lifts) {
            for (const [x, y] of [[-80, -45], [80, -45], [80, 45], [-80, 45]]) {
                const p = projectPoint(x, y, z);
                expect(p.x + origin.x).toBeGreaterThanOrEqual(13.99);
                expect(p.x + origin.x).toBeLessThanOrEqual(width - 33.99);
                expect(p.y + origin.y).toBeGreaterThanOrEqual(13.99);
                expect(p.y + origin.y).toBeLessThanOrEqual(height - 13.99);
            }
        }
    });
});
