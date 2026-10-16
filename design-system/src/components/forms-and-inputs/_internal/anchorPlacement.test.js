// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { placePopup, readAnchorGap } from './anchorPlacement';

/** A field 200px wide and 34px tall, its top-left at (40, 100). */
const field = { top: 100, bottom: 134, left: 40, right: 240, width: 200, height: 34 };
const viewport = { width: 1280, height: 800 };

describe('placePopup', () => {
    it('opens below the field, 4px from its edge, left-aligned and at least as wide', () => {
        expect(placePopup({ anchor: field, width: 296, height: 330, viewport })).toEqual({
            placement: 'bottom', top: 138, left: 40, minWidth: 200,
        });
    });

    it('flips above with the same 4px gap when there is no room below', () => {
        const low = { ...field, top: 600, bottom: 634 };
        expect(placePopup({ anchor: low, width: 296, height: 330, viewport })).toMatchObject({
            placement: 'top', top: 600 - 4 - 330,
        });
    });

    it('stays below when neither side fits and below has more room', () => {
        const middle = { ...field, top: 300, bottom: 334 };
        expect(placePopup({ anchor: middle, width: 296, height: 600, viewport }).placement).toBe('bottom');
    });

    it('honours a caller gap', () => {
        expect(placePopup({ anchor: field, width: 296, height: 330, viewport, gap: 8 }).top).toBe(142);
    });

    it('centres or right-aligns on request', () => {
        // Centring would start at -10, so it is held at the viewport's edge.
        expect(placePopup({ anchor: field, width: 300, height: 330, viewport, align: 'center' }).left).toBe(0);
        expect(placePopup({ anchor: { ...field, left: 400, right: 600 }, width: 300, height: 330, viewport, align: 'center' }).left).toBe(350);
        expect(placePopup({ anchor: { ...field, left: 400, right: 600 }, width: 300, height: 330, viewport, align: 'right' }).left).toBe(300);
    });

    it('right-aligns near the viewport’s right edge instead of running off it', () => {
        const edge = { ...field, left: 1100, right: 1260 };
        expect(placePopup({ anchor: edge, width: 296, height: 330, viewport }).left).toBe(1260 - 296);
    });
});

describe('readAnchorGap', () => {
    /** A window whose root computes `--size-element-gap-xs` to `value`. */
    const stubWindow = (value) => {
        globalThis.window = { getComputedStyle: () => ({ getPropertyValue: (name) => (name === '--size-element-gap-xs' ? value : '') }) };
        globalThis.document = { documentElement: {} };
    };
    afterEach(() => { delete globalThis.window; delete globalThis.document; });

    it('reads --size-element-gap-xs', () => {
        stubWindow(' 6px');
        expect(readAnchorGap()).toBe(6);
    });

    it('falls back to 4px when the token is missing', () => {
        stubWindow('');
        expect(readAnchorGap()).toBe(4);
    });

    it('is 4px outside a browser', () => {
        expect(readAnchorGap()).toBe(4);
    });
});
