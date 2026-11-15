import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    openOverlay,
    openOverlayCount,
    subscribeOverlays,
    reportFocusLost,
    getOverlayPortalRoot,
    overlayMountOf,
    OverlayContainer,
    useBoundedOverlay,
    useOverlaySlot,
    isPressInRaisedOverlay,
    isOverlayRaisedOver,
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
    it('refuses a Modal while one is open, and warns in development', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(open()).not.toBeNull();
        expect(open()).toBeNull();
        expect(openOverlayCount()).toBe(1);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/never opens on another Modal/);
    });

    it('lets a Modal open again once the first closes, and a release is idempotent', () => {
        const first = open();
        first.release();
        first.release();
        expect(openOverlayCount()).toBe(0);
        expect(open()).not.toBeNull();
        expect(openOverlayCount()).toBe(1);
    });

    it('refuses the second Modal through the hook and calls onRefused', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        open();
        const onRefused = vi.fn();
        const { result } = renderHook(() => useOverlaySlot(true, onRefused));
        expect(result.current[0]).toBe(false);
        expect(onRefused).toHaveBeenCalledTimes(1);
    });
});

describe('subscribeOverlays', () => {
    it('tells a subscriber when a Modal opens and closes, with the count', () => {
        const events = [];
        const unsubscribe = subscribeOverlays((event) => events.push(event));
        const first = open();
        first.release();
        unsubscribe();
        open();
        expect(events).toEqual([
            { type: 'open', count: 1 },
            { type: 'close', count: 0 },
        ]);
    });

    it('says nothing for a refused Modal', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    it('mounts in the nearest .plus-pattern-backdrop ancestor, when there is one', () => {
        const backdrop = document.createElement('div');
        backdrop.className = 'plus-pattern-backdrop';
        const trigger = document.createElement('button');
        backdrop.appendChild(trigger);
        document.body.appendChild(backdrop);
        expect(overlayMountOf(trigger)).toBe(backdrop);
        backdrop.remove();
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

    it('refuses a second slot and calls onRefused, leaving the caller unplaced', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        open();
        const onRefused = vi.fn();
        const { result } = renderHook(() => useOverlaySlot(true, onRefused));
        expect(result.current[0]).toBe(false);
        expect(onRefused).toHaveBeenCalledTimes(1);
        expect(openOverlayCount()).toBe(1);
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

describe('isPressInRaisedOverlay', () => {
    const build = () => {
        document.body.innerHTML = `
            <button id="chat"></button>
            <div id="popup"><span id="popup-text"></span></div>
            <div class="plus-pattern-backdrop" id="backdrop">
                <div role="dialog"><p id="modal-text"></p><button id="inner"></button></div>
            </div>
            <main id="page"></main>`;
        const el = (id) => document.getElementById(id);
        return el;
    };
    afterEach(() => { document.body.innerHTML = ''; });

    it('is true for a press in a Modal the owner sits outside of', () => {
        const el = build();
        expect(isPressInRaisedOverlay(el('modal-text'), el('chat'))).toBe(true);
        expect(isPressInRaisedOverlay(el('backdrop'), el('popup'))).toBe(true);
    });

    it('is false for a press on the page or in the popup itself', () => {
        const el = build();
        expect(isPressInRaisedOverlay(el('page'), el('chat'))).toBe(false);
        expect(isPressInRaisedOverlay(el('popup-text'), el('chat'))).toBe(false);
    });

    it('is false when the owner sits inside that same Modal', () => {
        const el = build();
        expect(isPressInRaisedOverlay(el('modal-text'), el('inner'))).toBe(false);
    });

    it('is false without a target, and true in a Modal when there is no owner', () => {
        const el = build();
        expect(isPressInRaisedOverlay(null, el('chat'))).toBe(false);
        expect(isPressInRaisedOverlay(el('modal-text'), null)).toBe(true);
    });
});

describe('isOverlayRaisedOver', () => {
    afterEach(() => { document.body.innerHTML = ''; });

    it('is false with no overlay open', () => {
        document.body.innerHTML = '<button id="chat"></button>';
        expect(isOverlayRaisedOver(document.getElementById('chat'))).toBe(false);
    });

    it('is true for an owner outside the open Modal, false for one inside it', () => {
        document.body.innerHTML = '<button id="chat"></button><div class="plus-pattern-backdrop"><button id="inner"></button></div>';
        open();
        expect(isOverlayRaisedOver(document.getElementById('chat'))).toBe(true);
        expect(isOverlayRaisedOver(document.getElementById('inner'))).toBe(false);
    });
});

describe('useBoundedOverlay', () => {
    afterEach(() => { document.body.innerHTML = ''; });

    it('returns null outside an OverlayContainer so real app placement and collision rules stay untouched', () => {
        const { result } = renderHook(() => useBoundedOverlay());
        expect(result.current).toBeNull();
    });

    it('returns the container, boundary and side-pinned collision avoidance inside an OverlayContainer', () => {
        const canvas = document.createElement('div');
        const card = document.createElement('div');
        const wrapper = ({ children }) => React.createElement(OverlayContainer, { container: canvas, boundary: card }, children);
        const { result } = renderHook(() => useBoundedOverlay(), { wrapper });
        expect(result.current).toEqual({
            container: canvas,
            collisionBoundary: card,
            collisionAvoidance: { side: 'none', align: 'shift', fallbackAxisSide: 'none' },
        });
    });

    it('yields to an explicit container prop or a Modal Backdrop ancestor', () => {
        const canvas = document.createElement('div');
        const explicit = document.createElement('div');
        const backdrop = document.createElement('div');
        backdrop.className = 'plus-pattern-backdrop';
        const trigger = document.createElement('button');
        backdrop.appendChild(trigger);
        document.body.appendChild(backdrop);

        const wrapper = ({ children }) => React.createElement(OverlayContainer, { container: canvas }, children);
        expect(renderHook(() => useBoundedOverlay({ container: explicit }), { wrapper }).result.current).toBeNull();
        expect(renderHook(() => useBoundedOverlay({ fromNode: trigger }), { wrapper }).result.current).toBeNull();
    });
});

