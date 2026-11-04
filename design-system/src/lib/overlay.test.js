import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    openOverlay,
    openOverlayCount,
    subscribeOverlays,
    reportFocusLost,
    getOverlayPortalRoot,
    overlayMountOf,
    useOverlaySlot,
} from './overlay';

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
    it('stacks two overlays: a modal (or drawer) and the confirm it raises', () => {
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

describe('getOverlayPortalRoot', () => {
    it('is document.body — no dedicated wrapper that would hide a portaled node a level deeper', () => {
        expect(getOverlayPortalRoot()).toBe(document.body);
    });
});

describe('overlayMountOf', () => {
    it('mounts in the nearest .plus-pattern-blanket ancestor, when there is one', () => {
        const blanket = document.createElement('div');
        blanket.className = 'plus-pattern-blanket';
        const trigger = document.createElement('button');
        blanket.appendChild(trigger);
        document.body.appendChild(blanket);
        expect(overlayMountOf(trigger)).toBe(blanket);
        blanket.remove();
    });

    it('falls back to the shared portal root outside a modal', () => {
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        expect(overlayMountOf(trigger)).toBe(getOverlayPortalRoot());
        trigger.remove();
    });

    it('falls back to the shared portal root for a node-less trigger', () => {
        expect(overlayMountOf(null)).toBe(getOverlayPortalRoot());
        expect(overlayMountOf(undefined)).toBe(getOverlayPortalRoot());
    });
});

describe('useOverlaySlot', () => {
    it('takes a slot once active, and releases it on unmount', () => {
        const { result, unmount } = renderHook(({ active }) => useOverlaySlot(active), {
            initialProps: { active: true },
        });
        expect(openOverlayCount()).toBe(1);
        expect(result.current[0]).toBe(true);
        unmount();
        expect(openOverlayCount()).toBe(0);
    });

    it('refuses a third slot and calls onRefused, leaving the caller unplaced', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        open();
        open();
        const onRefused = vi.fn();
        const { result } = renderHook(() => useOverlaySlot(true, onRefused));
        expect(result.current[0]).toBe(false);
        expect(onRefused).toHaveBeenCalledTimes(1);
        expect(openOverlayCount()).toBe(2);
    });

    it('takes no slot while inactive', () => {
        const { result } = renderHook(() => useOverlaySlot(false));
        expect(result.current[0]).toBe(false);
        expect(openOverlayCount()).toBe(0);
    });

    it('releases its own slot and frees it for the next one when active flips off', () => {
        const { result, rerender } = renderHook(({ active }) => useOverlaySlot(active), {
            initialProps: { active: true },
        });
        expect(openOverlayCount()).toBe(1);
        act(() => rerender({ active: false }));
        expect(result.current[0]).toBe(false);
        expect(openOverlayCount()).toBe(0);
    });
});
