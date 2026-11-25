import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import React from 'react';
import { MotionPreferenceContext } from '@/lib/motionPreference';

export const withReducedMotion = (Story) => React.createElement(MotionPreferenceContext.Provider, { value: true }, React.createElement(Story));

const seconds = (raw) => {
    const value = raw.trim();
    return parseFloat(value) / (value.endsWith('ms') ? 1000 : 1);
};

/**
 * The menu family (Popup, Select, DropdownMenu, FilterMenu, PopupSelect,
 * TreeSelect) enters and exits on the same fade: `plus-overlay-fade` in,
 * `plus-overlay-fade-out` out, both on `--ds-motion-appearance-fast`, and the
 * open state applies no clip-path, transform, translate or scale.
 */
export async function expectMenuFade(surface, phase = 'enter') {
    const style = getComputedStyle(surface);
    const root = getComputedStyle(surface.ownerDocument.documentElement);
    const fast = seconds(root.getPropertyValue('--ds-motion-appearance-fast-duration'));
    const names = style.animationName.split(',').map((n) => n.trim());
    await expect(names, `${phase}: one fade and nothing else`).toEqual([phase === 'enter' ? 'plus-overlay-fade' : 'plus-overlay-fade-out']);
    await expect(seconds(style.animationDuration), `${phase}: on appearance.fast`).toBeCloseTo(fast, 3);
    await expect(style.clipPath, `${phase}: no clip`).toBe('none');
    await expect(style.transform, `${phase}: no transform`).toBe('none');
    await expect(style.translate, `${phase}: no translate`).toBe('none');
    await expect(style.scale, `${phase}: no scale`).toBe('none');
}

/** Assert the public surface stays for its exit, then leaves the document. */
export async function expectOverlayExit(surface, close, reduced) {
    if (!reduced) await expect(getComputedStyle(surface).animationName).not.toBe('none');
    await waitFor(() => expect(surface).toBeVisible());
    close();
    if (!reduced) await expect(surface.isConnected).toBe(true);
    await waitFor(() => expect(surface.isConnected).toBe(false), { timeout: 3000 });
}

/** The same lifecycle for a menu, held to the fade on the way in and out. Under in-app reduced motion nothing animates, so only the lifecycle is read. */
export async function expectMenuExit(surface, close, reduced) {
    if (!reduced) await expectMenuFade(surface, 'enter');
    await waitFor(() => expect(surface).toBeVisible());
    close();
    if (!reduced) {
        await expect(surface.isConnected).toBe(true);
        await expectMenuFade(surface, 'exit');
    }
    await waitFor(() => expect(surface.isConnected).toBe(false));
}

export const selectMotionPlay = (reduced = false) => async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox');
    await userEvent.click(field);
    const list = await within(canvasElement.ownerDocument.body).findByRole('listbox');
    const surface = list.closest('.plus-listbox');
    if (reduced) await expect(getComputedStyle(surface).animationName).toBe('plus-overlay-fade');
    await expectMenuExit(surface, () => fireEvent.keyDown(field, { key: 'Escape' }), reduced);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
};

const DEFAULT_SETTLE_TIMEOUT_MS = 2000;

const runningFiniteAnimations = (element) => {
    if (!element?.getAnimations) return [];
    return element.getAnimations({ subtree: true }).filter((animation) => {
        if (animation.playState !== 'running') return false;
        return animation.effect?.getComputedTiming?.().iterations !== Infinity;
    });
};

/**
 * A PresenceSlot still entering. Its opacity and height run on motion's
 * JavaScript timeline and its fade starts on a timer after the room opens, so
 * between those phases `getAnimations()` is empty while the content is still
 * at opacity 0. The slot's phase attribute is the one signal that covers the
 * whole entrance.
 */
const enteringPresenceSlots = (element) => {
    if (!element?.querySelectorAll) return false;
    return element.querySelector('[data-presence-phase="entering"]') != null;
};

/**
 * Geometry, hit testing, and the a11y scan read a settled surface rather than
 * an entrance frame. Loops until no finite running animations remain (so
 * multi-phase animations finish their follow-up) and while a PresenceSlot is
 * still entering, capped
 * at `timeoutMs` so a looping or stuck animation cannot hang.
 */
export async function settleAnimations(element, timeoutMs = DEFAULT_SETTLE_TIMEOUT_MS) {
    if (!element?.getAnimations) return;
    const deadline = Date.now() + timeoutMs;
    while (true) {
        const animations = runningFiniteAnimations(element);
        const remaining = deadline - Date.now();
        if (animations.length === 0) {
            if (!enteringPresenceSlots(element) || remaining <= 0) break;
            await new Promise((resolve) => setTimeout(resolve, Math.min(16, remaining)));
            continue;
        }
        if (remaining <= 0) break;
        let timer;
        const settled = Promise.allSettled(animations.map((animation) => animation.finished));
        const timedOut = new Promise((resolve) => {
            timer = setTimeout(() => resolve('timeout'), remaining);
        });
        const winner = await Promise.race([settled.then(() => 'settled'), timedOut]);
        clearTimeout(timer);
        if (winner === 'timeout') break;
    }
}
