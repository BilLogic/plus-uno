import React from 'react';
import { expect, within } from 'storybook/test';
import PatternModal from '@/patterns/PatternModal';
import Overlay, { OVERLAY_HEIGHTS, OVERLAY_WIDTHS } from '@/patterns/Overlay';
import { Button } from '@/components';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { probe, tokenLength } from '@/storybook-docs/lib/style-probes.js';

/** The stand-in screen the docs draw the overlay at: the Large mode, and a short template. */
const SCREEN = { width: 1024, height: 520 };

/** Figma's Modal/width-modal-* at 1024: 6 · 8 · 10 screen columns plus 2 × 16. */
const WIDTHS_AT_1024 = { sm: 512, md: 677, lg: 843 };

const bodyCopy = (
    <p style={{ margin: 0, font: 'var(--body-default)' }}>
        Move Thursday’s session with Ana Ruiz to 4:30 PM? Ana and her tutor get an email with the new time.
    </p>
);

const longBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        {Array.from({ length: 12 }, (_, i) => (
            <p key={i} style={{ margin: 0, font: 'var(--body-default)' }}>
                {`Paragraph ${i + 1}: long body content, so the body scrolls once the modal reaches its cap.`}
            </p>
        ))}
    </div>
);

const footerActions = (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text="Move session" style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

/** An inline Overlay at the stand-in screen, holding one modal. */
const InOverlay = ({ children, height = SCREEN.height }) => (
    <Overlay inline screenWidth={SCREEN.width} screenHeight={height}>
        {children}
    </Overlay>
);

const dialogs = (canvasElement) => within(canvasElement).getAllByRole('dialog');

export default {
    title: 'Foundations/Patterns/Modal',
    component: PatternModal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        onClose: { table: { disable: true } },
        footer: { table: { disable: true } },
        title: {
            control: 'text',
            description: 'Modal title',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: OVERLAY_WIDTHS,
            description: 'Screen-grid columns: 6 · 8 · 10 plus the modal pad',
            table: { category: 'Design' },
        },
        height: {
            control: 'inline-radio',
            options: OVERLAY_HEIGHTS,
            description: 'Hug the content to the screen less 128, or fill to it',
            table: { category: 'Design' },
        },
        maxHeight: { table: { disable: true } },
        padding: { table: { disable: true } },
        gap: { table: { disable: true } },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

/** A sm, hug modal in its Overlay: the scrim, the pads and the modal centered. */
export const Overview = {
    render: () => (
        <InOverlay>
            <PatternModal title="Move session" onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InOverlay>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-overlay');
        const [modal] = dialogs(canvasElement);
        const style = getComputedStyle(modal);
        await expect(style.paddingTop, 'Modal/pad').toBe(`${tokenLength(canvasElement, '--modal-pad')}px`);
        await expect(style.rowGap, 'Modal/stack-md').toBe(`${tokenLength(canvasElement, '--modal-stack-md')}px`);
        await expect(style.borderTopLeftRadius, 'Modal/radius').toBe(`${tokenLength(canvasElement, '--modal-radius')}px`);
        const overlayStyle = getComputedStyle(overlay);
        await expect(overlayStyle.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--overlay-pad-x')}px`);
        await expect(overlayStyle.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--overlay-pad-y')}px`);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `scrim is the blanket (${mode})`).toBe(token('--ds-blanket'));
            await expect(getComputedStyle(modal).backgroundColor, `surface overlay (${mode})`).toBe(token('--ds-surface-overlay'));
            await expect(getComputedStyle(modal).boxShadow, `shadow overlay (${mode})`).toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-overlay)'));
        });
    },
};

/** sm · md · lg at the 1024 screen: 512 · 677 · 843, as Figma's Large mode draws them. */
export const Widths = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            {OVERLAY_WIDTHS.map((width) => (
                <InOverlay key={width} height={320}>
                    <PatternModal title={`width="${width}"`} width={width} onClose={() => {}} footer={footerActions}>
                        {bodyCopy}
                    </PatternModal>
                </InOverlay>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const modals = dialogs(canvasElement);
        for (const [i, width] of OVERLAY_WIDTHS.entries()) {
            await expect(modals[i].getBoundingClientRect().width, `width ${width} at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
        }
    },
};

/**
 * Hug grows with its content up to the screen less the overlay pad above and
 * below, then the body scrolls; Fill always sits at that height.
 */
export const Heights = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <InOverlay>
                <PatternModal title='height="hug", short' onClose={() => {}} footer={footerActions}>
                    {bodyCopy}
                </PatternModal>
            </InOverlay>
            <InOverlay>
                <PatternModal title='height="hug", long' onClose={() => {}} footer={footerActions}>
                    {longBody}
                </PatternModal>
            </InOverlay>
            <InOverlay>
                <PatternModal title='height="fill"' height="fill" onClose={() => {}} footer={footerActions}>
                    {bodyCopy}
                </PatternModal>
            </InOverlay>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [short, long, fill] = dialogs(canvasElement);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--overlay-pad-y');
        await expect(short.getBoundingClientRect().height, 'a short hug modal hugs').toBeLessThan(cap);
        await expect(long.getBoundingClientRect().height, 'a long hug modal stops at the cap').toBeCloseTo(cap, 0);
        await expect(fill.getBoundingClientRect().height, 'fill sits at the cap').toBeCloseTo(cap, 0);
        const body = long.querySelector('.plus-pattern-modal-body');
        await expect(body.scrollHeight, 'the long body scrolls').toBeGreaterThan(body.clientHeight);
        await expect(body, 'a body that scrolls is a tab stop').toHaveAttribute('tabindex', '0');
        await expect(fill.querySelector('.plus-pattern-modal-body')).toHaveAttribute('tabindex', '0');
    },
};

export const Interactive = {
    args: {
        title: 'Move session',
        width: 'sm',
        height: 'hug',
    },
    render: (args) => (
        <InOverlay>
            <PatternModal
                title={args.title}
                width={args.width}
                height={args.height}
                onClose={() => {}}
                footer={footerActions}
            >
                {longBody}
            </PatternModal>
        </InOverlay>
    ),
};
