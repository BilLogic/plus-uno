import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import Overlay, { OVERLAY_PLACEMENTS } from '@/patterns/Overlay';
import PatternModal from '@/patterns/PatternModal';
import PatternDrawer from '@/patterns/PatternDrawer';
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
 * Stories for the Overlay pattern. They are docs-only: the Overlay page in the
 * Patterns group draws them inline, at a stand-in screen.
 */
export default {
    title: 'Foundations/Patterns/Overlay',
    component: Overlay,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        className: { table: { disable: true } },
        onScrimClick: { table: { disable: true } },
        inline: { table: { disable: true } },
        screenHeight: { table: { disable: true } },
        placement: {
            control: 'inline-radio',
            options: OVERLAY_PLACEMENTS,
            description: 'center for a modal; start or end holds a drawer full height at that edge',
            table: { category: 'Design' },
        },
        screenWidth: {
            control: 'inline-radio',
            options: [768, 1024, 1440],
            description: 'The stand-in screen width the layer inside takes its width from',
            table: { category: 'Design' },
        },
    },
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
            <Overlay inline screenWidth={768} screenHeight={520}>
                <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                    {body}
                </PatternModal>
            </Overlay>
            <div data-guide="pad-y" style={bandStyle({ top: 0, left: 0, right: 0, height: 'var(--overlay-pad-y)' })}>pad-y 64</div>
            <div data-guide="pad-y" style={bandStyle({ bottom: 0, left: 0, right: 0, height: 'var(--overlay-pad-y)' })}>pad-y 64</div>
            <div data-guide="pad-x" style={bandStyle({ top: 'var(--overlay-pad-y)', bottom: 'var(--overlay-pad-y)', left: 0, width: 'var(--overlay-pad-x)' })} />
            <div data-guide="pad-x" style={bandStyle({ top: 'var(--overlay-pad-y)', bottom: 'var(--overlay-pad-y)', right: 0, width: 'var(--overlay-pad-x)' })} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-overlay');
        const style = getComputedStyle(overlay);
        await expect(style.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--overlay-pad-x')}px`);
        await expect(style.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--overlay-pad-y')}px`);
        const [top] = canvasElement.querySelectorAll('[data-guide="pad-y"]');
        await expect(top.getBoundingClientRect().height, 'the shaded band is the pad').toBeCloseTo(tokenLength(canvasElement, '--overlay-pad-y'), 0);
    },
};

/** The screen grid the modal widths come from: 12 columns, centered and capped at 1232. */
export const ScreenGrid = {
    render: () => {
        // The grid is the screen less 2 × 24, never under 720 nor over 1232.
        const grid = Math.min(1232, Math.max(720, SCREEN_GRID.width - 48));
        return (
            <Overlay inline screenWidth={SCREEN_GRID.width} screenHeight={SCREEN_GRID.height}>
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
                        columnGap: 'var(--layout-gutter)',
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
            </Overlay>
        );
    },
    play: async ({ canvasElement }) => {
        const grid = canvasElement.querySelector('[data-guide="screen-grid"]');
        await expect(grid.children, '12 columns').toHaveLength(12);
        const modal = within(canvasElement).getByRole('dialog');
        await expect(modal.getBoundingClientRect().width, 'six columns plus 2 × 16 at 1024').toBeCloseTo(512, 0);
    },
};

const SCREEN_GRID = { width: 1024, height: 520 };

/** `center` holds a modal; `start` and `end` hold a drawer full height at that edge, with no pad. */
export const Placements = {
    render: () => {
        const drawer = (placement) => (
            <PatternDrawer
                inline
                screenWidth={1024}
                screenHeight={360}
                placement={placement}
                title="Session details"
                description="Thursday · 4:00–5:00 PM"
                onClose={() => {}}
                footer={footer('Save changes')}
            >
                {body}
            </PatternDrawer>
        );
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
                <Overlay inline screenWidth={1024} screenHeight={360}>
                    <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                        {body}
                    </PatternModal>
                </Overlay>
                {drawer('end')}
                {drawer('start')}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const overlays = canvasElement.querySelectorAll('.plus-pattern-overlay');
        const [modal, end, start] = within(canvasElement).getAllByRole('dialog');
        await expect(getComputedStyle(overlays[0]).paddingTop, 'center keeps the pad').not.toBe('0px');
        await expect(getComputedStyle(overlays[1]).paddingTop, 'an edge drops the pad').toBe('0px');
        await expect(end.getBoundingClientRect().right).toBeCloseTo(overlays[1].getBoundingClientRect().right, 0);
        await expect(start.getBoundingClientRect().left).toBeCloseTo(overlays[2].getBoundingClientRect().left, 0);
        await expect(modal.getBoundingClientRect().width).toBeCloseTo(512, 0);
    },
};

export const Interactive = {
    args: { placement: 'center', screenWidth: 1024 },
    render: (args) => (
        args.placement === 'center' ? (
            <Overlay inline screenWidth={args.screenWidth} screenHeight={420} placement="center">
                <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                    {body}
                </PatternModal>
            </Overlay>
        ) : (
            <PatternDrawer
                inline
                screenWidth={args.screenWidth}
                screenHeight={420}
                placement={args.placement}
                title="Session details"
                onClose={() => {}}
                footer={footer('Save changes')}
            >
                {body}
            </PatternDrawer>
        )
    ),
};
