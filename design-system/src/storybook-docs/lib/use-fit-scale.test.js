import { describe, expect, it } from 'vitest';
import { stageLayout } from './use-fit-scale.js';

describe('stageLayout', () => {
    it('lays a stage out at its own width and scales it down outside the docs', () => {
        expect(stageLayout({ width: 1024, available: 414 })).toEqual({ layout: 1024, scale: 414 / 1024 });
    });

    it('never scales a stage up', () => {
        expect(stageLayout({ width: 640, available: 1000, reflow: true })).toEqual({ layout: 640, scale: 1 });
    });

    it('reflows a screen to the canvas on a docs page, at full size', () => {
        expect(stageLayout({ width: 1024, available: 900, reflow: true })).toEqual({ layout: 900, scale: 1 });
    });

    it('stops reflowing at the floor and scales from there', () => {
        expect(stageLayout({ width: 1024, available: 720, reflow: true, floor: 768 })).toEqual({ layout: 768, scale: 720 / 768 });
    });

    it('keeps a stage narrower than the floor at its own width', () => {
        expect(stageLayout({ width: 640, available: 600, reflow: true, floor: 768 })).toEqual({ layout: 640, scale: 600 / 640 });
    });
});
