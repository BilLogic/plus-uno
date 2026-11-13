import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import Backdrop from '@/patterns/Backdrop';
import PatternModal from '@/patterns/PatternModal';
import { FloatingPanel } from './Backdrop.examples.jsx';
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
        <Button text="Cancel" spacing="compact" onClick={() => {}} />
        <Button text={primary} appearance="primary" spacing="compact" onClick={() => {}} />
    </>
);

/**
 * Stories for the Backdrop pattern. They are docs-only: the Backdrop section of the Modal page in the
 * Patterns group draws them inline, at a stand-in screen.
 */
export default {
    title: 'Templates/Modal/Modal/Backdrop',
    component: Backdrop,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        className: { table: { disable: true } },
        onBackdropClick: { table: { disable: true } },
        inline: { table: { disable: true } },
        screenHeight: { table: { disable: true } },
        screenWidth: {
            control: 'inline-radio',
            options: [768, 1024, 1440],
            table: { category: 'Design' },
        },
    },
};

/** Inline at the 768 screen: the backdrop, pad 16 at the sides and 64 above and below, the modal centered. */
export const Inline = {
    args: { onBackdropClick: fn() },
    render: (args) => (
        <Backdrop inline screenWidth={768} screenHeight={520} onBackdropClick={args.onBackdropClick}>
            <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                {body}
            </PatternModal>
        </Backdrop>
    ),
    play: async ({ args, canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-backdrop');
        const modal = within(canvasElement).getByRole('dialog', { name: 'Move session' });
        const box = overlay.getBoundingClientRect();
        const inner = modal.getBoundingClientRect();
        await expect(box.width, 'the stand-in screen').toBeCloseTo(Math.min(768, canvasElement.clientWidth), 0);
        await expect(box.height, 'the stand-in screen').toBeCloseTo(520, 0);
        await expect(inner.width, 'width-modal-sm at 768').toBeCloseTo(384, 0);
        await expect(getComputedStyle(overlay).paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--blanket-pad-y')}px`);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `the backdrop (${mode})`).toBe(token('--ds-blanket'));
        });
        await userEvent.click(modal);
        await expect(args.onBackdropClick, 'a click on the modal is not a backdrop click').not.toHaveBeenCalled();
        await userEvent.click(overlay, { clientX: box.left + 4, clientY: box.top + 4 });
        await expect(args.onBackdropClick).toHaveBeenCalledTimes(1);
    },
};

/**
 * A confirm Modal may open over a Panel, a Popup or a focused task, and brings
 * its own Backdrop: the Panel floats with none, so the confirm's is the only one.
 * A confirm is sm. A Modal never opens on another Modal.
 */
export const ConfirmOverPanel = {
    render: () => (
        <div style={{ position: 'relative' }}>
            <FloatingPanel screenHeight={520} />
            <Backdrop inline screenWidth={1024} screenHeight={520} style={{ position: 'absolute', inset: 0 }}>
                <PatternModal title="Discard changes?" onClose={() => {}} footer={footer('Discard')}>
                    <p style={{ margin: 0, font: 'var(--body-default)' }}>Your edits to this session are not saved.</p>
                </PatternModal>
            </Backdrop>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const confirm = within(canvasElement).getByRole('dialog', { name: 'Discard changes?' });
        await expect(confirm.getBoundingClientRect().width, 'width-modal-sm at 1024').toBeCloseTo(512, 0);
        const { left, top, width, height } = confirm.getBoundingClientRect();
        const hit = document.elementFromPoint(left + width / 2, top + height / 2);
        await expect(confirm.contains(hit), 'the confirm is on top').toBe(true);
        await expect(canvasElement.querySelectorAll('.plus-pattern-backdrop').length, 'only the confirm has a Backdrop: the Panel floats without one').toBe(1);
    },
};

/** Fixed over the page, on the backdrop layer (500), its modal on the modal layer (510). */
export const Layers = {
    render: () => (
        <Backdrop>
            <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                {body}
            </PatternModal>
        </Backdrop>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-backdrop');
        const modal = within(canvasElement).getByRole('dialog');
        const z = (token) => probe(canvasElement, 'zIndex', `var(${token})`, { position: 'relative' });
        await expect(getComputedStyle(overlay).position).toBe('fixed');
        await expect(getComputedStyle(overlay).zIndex, 'backdrop layer').toBe(z('--layer-blanket'));
        await expect(getComputedStyle(modal).zIndex, 'modal layer').toBe(z('--layer-modal'));
        const box = overlay.getBoundingClientRect();
        await expect(box.width, 'covers the viewport').toBeCloseTo(window.innerWidth, 0);
        await expect(box.height, 'covers the viewport').toBeCloseTo(window.innerHeight, 0);
    },
};

// The stand-in screen sizes and the 48 in the grid width are stage geometry for the docs, not design values; the real values come from the tokens.
/** The tint a guide paints over the stand-in screen. */
const guideFill = (token, percent) => `color-mix(in srgb, var(${token}) ${percent}%, transparent)`;

/** A label centered in a guide band. */
const bandStyle = (extra) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    background: guideFill('--ds-background-information-bold', 24),
    color: 'var(--ds-text-information-bolder)',
    font: 'var(--body-small)',
    zIndex: 1,
    ...extra,
});

/**
 * The pads: Overlay/pad-x 16 at the sides and Overlay/pad-y 64 above and
 * below, shaded, with the modal centered inside them.
 */
export const Pads = {
    render: () => (
        <div style={{ position: 'relative', width: 768, maxWidth: '100%' }}>
            <Backdrop inline screenWidth={768} screenHeight={520}>
                <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                    {body}
                </PatternModal>
            </Backdrop>
            <div data-guide="pad-y" style={bandStyle({ top: 0, left: 0, right: 0, height: 'var(--blanket-pad-y)' })}>pad-y 64</div>
            <div data-guide="pad-y" style={bandStyle({ bottom: 0, left: 0, right: 0, height: 'var(--blanket-pad-y)' })}>pad-y 64</div>
            <div data-guide="pad-x" style={bandStyle({ top: 'var(--blanket-pad-y)', bottom: 'var(--blanket-pad-y)', left: 0, width: 'var(--blanket-pad-x)' })} />
            <div data-guide="pad-x" style={bandStyle({ top: 'var(--blanket-pad-y)', bottom: 'var(--blanket-pad-y)', right: 0, width: 'var(--blanket-pad-x)' })} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-backdrop');
        const style = getComputedStyle(overlay);
        await expect(style.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--blanket-pad-x')}px`);
        await expect(style.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--blanket-pad-y')}px`);
        const [top] = canvasElement.querySelectorAll('[data-guide="pad-y"]');
        await expect(top.getBoundingClientRect().height, 'the shaded band is the pad').toBeCloseTo(tokenLength(canvasElement, '--blanket-pad-y'), 0);
    },
};

const SCREEN_GRID = { width: 1024, height: 520 };

/** The screen grid the modal widths come from: 12 columns, centered and capped at 1232. */
export const ScreenGrid = {
    render: () => {
        // The grid is the screen less 2 × 24, never under 720 nor over 1232.
        const grid = Math.min(1232, Math.max(720, SCREEN_GRID.width - 48));
        return (
            <Backdrop inline screenWidth={SCREEN_GRID.width} screenHeight={SCREEN_GRID.height}>
                <div
                    data-guide="screen-grid"
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '50%',
                        width: grid,
                        maxWidth: '100%',
                        transform: 'translateX(-50%)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                        columnGap: 'var(--grid-gutter)',
                        pointerEvents: 'none',
                    }}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} style={{ background: guideFill('--ds-background-danger-bold', 12) }} />
                    ))}
                </div>
                <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                    {body}
                </PatternModal>
            </Backdrop>
        );
    },
    play: async ({ canvasElement }) => {
        const grid = canvasElement.querySelector('[data-guide="screen-grid"]');
        await expect(grid.children, '12 columns').toHaveLength(12);
        const modal = within(canvasElement).getByRole('dialog');
        await expect(modal.getBoundingClientRect().width, 'six columns plus 2 × 16 at 1024').toBeCloseTo(512, 0);
    },
};

export const Interactive = {
    args: { screenWidth: 1024 },
    render: (args) => (
        <Backdrop inline screenWidth={args.screenWidth} screenHeight={420}>
            <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                {body}
            </PatternModal>
        </Backdrop>
    ),
};
