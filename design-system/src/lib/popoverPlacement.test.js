// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { popoverOverlayProps, readPopoverOffset, readScreenGap } from './popoverPlacement';

/** A window whose root computes each token in `values`, and nothing else. */
const stubWindow = (values) => {
    globalThis.window = { getComputedStyle: () => ({ getPropertyValue: (name) => values[name] ?? '' }) };
    globalThis.document = { documentElement: {} };
};

afterEach(() => { delete globalThis.window; delete globalThis.document; });

describe('readPopoverOffset', () => {
    it('reads --popover-offset', () => {
        stubWindow({ '--popover-offset': ' 6px' });
        expect(readPopoverOffset()).toBe(6);
    });

    it('falls back to 4px when the token is missing', () => {
        stubWindow({});
        expect(readPopoverOffset()).toBe(4);
    });

    it('is 4px outside a browser', () => {
        expect(readPopoverOffset()).toBe(4);
    });
});

describe('readScreenGap', () => {
    it('reads --popover-gap-screen', () => {
        stubWindow({ '--popover-gap-screen': ' 12px' });
        expect(readScreenGap()).toBe(12);
    });

    it('falls back to 8px when the token is missing, and outside a browser', () => {
        stubWindow({});
        expect(readScreenGap()).toBe(8);
        delete globalThis.window;
        expect(readScreenGap()).toBe(8);
    });
});

describe('popoverOverlayProps', () => {
    it('opens the offset from the trigger and pads Popper by the screen gap', () => {
        stubWindow({ '--popover-offset': '4px', '--popover-gap-screen': '8px' });
        const { offset, popperConfig } = popoverOverlayProps();
        expect(offset).toEqual([0, 4]);
        expect(popperConfig.modifiers).toEqual([
            { name: 'preventOverflow', options: { padding: 8 } },
            { name: 'flip', options: { padding: 8 } },
        ]);
    });

    it('keeps a caller offset', () => {
        expect(popoverOverlayProps([0, 12]).offset).toEqual([0, 12]);
    });
});
