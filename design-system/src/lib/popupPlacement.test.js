// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { readPopupOffset, readScreenGap } from './popupPlacement';

/** A window whose root computes each token in `values`, and nothing else. */
const stubWindow = (values) => {
    globalThis.window = { getComputedStyle: () => ({ getPropertyValue: (name) => values[name] ?? '' }) };
    globalThis.document = { documentElement: {} };
};

afterEach(() => { delete globalThis.window; delete globalThis.document; });

describe('readPopupOffset', () => {
    it('reads --popup-offset', () => {
        stubWindow({ '--popup-offset': ' 6px' });
        expect(readPopupOffset()).toBe(6);
    });

    it('falls back to 4px when the token is missing', () => {
        stubWindow({});
        expect(readPopupOffset()).toBe(4);
    });

    it('is 4px outside a browser', () => {
        expect(readPopupOffset()).toBe(4);
    });
});

describe('readScreenGap', () => {
    it('reads --popup-gap-screen', () => {
        stubWindow({ '--popup-gap-screen': ' 12px' });
        expect(readScreenGap()).toBe(12);
    });

    it('falls back to 8px when the token is missing, and outside a browser', () => {
        stubWindow({});
        expect(readScreenGap()).toBe(8);
        delete globalThis.window;
        expect(readScreenGap()).toBe(8);
    });
});
