// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { placePopup } from './anchorPlacement';

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

    it('honors a caller offset', () => {
        expect(placePopup({ anchor: field, width: 296, height: 330, viewport, offset: 8 }).top).toBe(142);
    });

    it('centers or right-aligns on request', () => {
        // Centering would start at -10, so it is held 8 from the screen's edge.
        expect(placePopup({ anchor: field, width: 300, height: 330, viewport, align: 'center' }).left).toBe(8);
        expect(placePopup({ anchor: { ...field, left: 400, right: 600 }, width: 300, height: 330, viewport, align: 'center' }).left).toBe(350);
        expect(placePopup({ anchor: { ...field, left: 400, right: 600 }, width: 300, height: 330, viewport, align: 'right' }).left).toBe(300);
    });

    it('right-aligns near the viewport’s right edge instead of running off it', () => {
        const edge = { ...field, left: 1100, right: 1260 };
        expect(placePopup({ anchor: edge, width: 296, height: 330, viewport }).left).toBe(1260 - 296);
    });
});

describe('placePopup keeps 8 from the screen edge', () => {
    it('holds a popup that would start left of the screen 8 in from it', () => {
        const flush = { ...field, left: 0, right: 200 };
        expect(placePopup({ anchor: flush, width: 300, height: 100, viewport, align: 'center' }).left).toBe(8);
    });

    it('pulls a popup wider than the room to the right back to 8 from the right edge', () => {
        // Right-aligned with a narrow field near the right edge, a 320 menu still
        // fits; one anchored on a field that itself runs to the edge does not.
        const edge = { ...field, left: 1180, right: 1280, width: 100 };
        expect(placePopup({ anchor: edge, width: 320, height: 100, viewport }).left).toBe(1280 - 8 - 320);
    });

    it('holds a flipped popup 8 below the top of the screen', () => {
        const low = { ...field, top: 300, bottom: 334 };
        const placed = placePopup({ anchor: low, width: 296, height: 320, viewport: { width: 1280, height: 400 } });
        expect(placed).toMatchObject({ placement: 'top', top: 8 });
    });

    it('honors a caller screen gap', () => {
        const flush = { ...field, left: 0, right: 200 };
        expect(placePopup({ anchor: flush, width: 300, height: 100, viewport, align: 'center', screenGap: 16 }).left).toBe(16);
    });
});
