// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import { openOverlay, openOverlayCount, subscribeOverlays, reportFocusLost } from './overlayStack';

const opened = [];
const open = () => {
    const handle = openOverlay();
    if (handle) opened.push(handle);
    return handle;
};

afterEach(() => {
    while (opened.length) opened.pop().release();
    vi.restoreAllMocks();
});

describe('openOverlay', () => {
    it('stacks two overlays: a modal and the confirm it raises', () => {
        expect(open()).not.toBeNull();
        expect(open()).not.toBeNull();
        expect(openOverlayCount()).toBe(2);
    });

    it('refuses a third and warns in development', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        open();
        open();
        expect(open()).toBeNull();
        expect(openOverlayCount()).toBe(2);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/At most 2 overlays stack/);
    });

    it('frees a place when one closes, and a release is idempotent', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        open();
        const second = open();
        second.release();
        second.release();
        expect(openOverlayCount()).toBe(1);
        expect(open()).not.toBeNull();
        expect(openOverlayCount()).toBe(2);
    });
});

describe('subscribeOverlays', () => {
    it('tells a subscriber when an overlay opens and closes, with the count', () => {
        const events = [];
        const unsubscribe = subscribeOverlays((event) => events.push(event));
        const first = open();
        open();
        first.release();
        unsubscribe();
        open();
        expect(events).toEqual([
            { type: 'open', count: 1 },
            { type: 'open', count: 2 },
            { type: 'close', count: 1 },
        ]);
    });

    it('says nothing for a refused overlay', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        open();
        open();
        const events = [];
        const unsubscribe = subscribeOverlays((event) => events.push(event));
        open();
        unsubscribe();
        expect(events).toEqual([]);
    });

    it('passes on a closed overlay whose trigger is gone', () => {
        const events = [];
        const unsubscribe = subscribeOverlays((event) => events.push(event));
        reportFocusLost();
        unsubscribe();
        expect(events).toEqual([{ type: 'focus-lost', count: 0 }]);
    });
});
