import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import Overlay from '@/patterns/Overlay';
import PatternModal from '@/patterns/PatternModal';
import { Button } from '@/components';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { probe, tokenLength } from '@/storybook-docs/lib/style-probes.js';

const body = (
    <p style={{ margin: 0, font: 'var(--body-default)' }}>
        Move Thursday’s session with Ana Ruiz to 4:30 PM? Ana and her tutor get an email with the new time.
    </p>
);

const footer = (primary) => (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text={primary} style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

/**
 * Test-only stories for the Overlay pattern; the Patterns pages document it.
 * The docs page draws it inline, at a stand-in screen.
 */
export default {
    title: 'Foundations/Patterns/Overlay',
    component: Overlay,
    tags: ['!dev', '!autodocs'],
};

/** Inline at the 768 screen: the blanket, pad 16 at the sides and 64 above and below, the modal centered. */
export const Inline = {
    args: { onScrimClick: fn() },
    render: (args) => (
        <Overlay inline screenWidth={768} screenHeight={520} onScrimClick={args.onScrimClick}>
            <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                {body}
            </PatternModal>
        </Overlay>
    ),
    play: async ({ args, canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-overlay');
        const modal = within(canvasElement).getByRole('dialog', { name: 'Move session' });
        const box = overlay.getBoundingClientRect();
        const inner = modal.getBoundingClientRect();
        await expect(box.width, 'the stand-in screen').toBeCloseTo(Math.min(768, canvasElement.clientWidth), 0);
        await expect(box.height, 'the stand-in screen').toBeCloseTo(520, 0);
        await expect(inner.width, 'width-modal-sm at 768').toBeCloseTo(384, 0);
        await expect(getComputedStyle(overlay).paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--overlay-pad-y')}px`);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `the blanket (${mode})`).toBe(token('--ds-blanket'));
        });
        await userEvent.click(modal);
        await expect(args.onScrimClick, 'a click on the modal is not a scrim click').not.toHaveBeenCalled();
        await userEvent.click(overlay, { clientX: box.left + 4, clientY: box.top + 4 });
        await expect(args.onScrimClick).toHaveBeenCalledTimes(1);
    },
};

/**
 * A confirm raised from a modal is a second Overlay later in the page: it
 * reuses the scrim and modal layers and covers the first. A confirm is sm.
 */
export const NestedConfirm = {
    render: () => (
        <div style={{ position: 'relative' }}>
            <Overlay inline screenWidth={1024} screenHeight={520}>
                <PatternModal title="Session settings" width="lg" height="fill" onClose={() => {}} footer={footer('Save')}>
                    {body}
                </PatternModal>
            </Overlay>
            <Overlay inline screenWidth={1024} screenHeight={520} style={{ position: 'absolute', inset: 0 }}>
                <PatternModal title="Discard changes?" onClose={() => {}} footer={footer('Discard')}>
                    <p style={{ margin: 0, font: 'var(--body-default)' }}>Your edits to this session are not saved.</p>
                </PatternModal>
            </Overlay>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const confirm = within(canvasElement).getByRole('dialog', { name: 'Discard changes?' });
        await expect(confirm.getBoundingClientRect().width, 'width-modal-sm at 1024').toBeCloseTo(512, 0);
        const { left, top, width, height } = confirm.getBoundingClientRect();
        const hit = document.elementFromPoint(left + width / 2, top + height / 2);
        await expect(confirm.contains(hit), 'the confirm is on top').toBe(true);
    },
};

/** Fixed over the page, on the scrim layer (500), its modal on the modal layer (510). */
export const Layers = {
    render: () => (
        <Overlay>
            <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                {body}
            </PatternModal>
        </Overlay>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-overlay');
        const modal = within(canvasElement).getByRole('dialog');
        const z = (token) => probe(canvasElement, 'zIndex', `var(${token})`, { position: 'relative' });
        await expect(getComputedStyle(overlay).position).toBe('fixed');
        await expect(getComputedStyle(overlay).zIndex, 'scrim layer').toBe(z('--layout-z-index-scrim'));
        await expect(getComputedStyle(modal).zIndex, 'modal layer').toBe(z('--layout-z-index-modal'));
        const box = overlay.getBoundingClientRect();
        await expect(box.width, 'covers the viewport').toBeCloseTo(window.innerWidth, 0);
        await expect(box.height, 'covers the viewport').toBeCloseTo(window.innerHeight, 0);
    },
};
