import React from 'react';
import { expect } from 'storybook/test';
import Page, { PAGE_EDGE, PAGE_LEVELS } from '@/patterns/Page';
import { computedShadow, probe, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { DemoLabel, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';

const col = { display: 'flex', flexDirection: 'column', gap: '24px' };

/** What each level must draw: its fill and its shadow, as a pair. */
const LEVEL_PAIRS = {
    sunken: ['--ds-surface-sunken', 'none'],
    default: ['--ds-surface', PAGE_EDGE],
    raised: ['--ds-surface-raised', 'var(--ds-shadow-raised)'],
    overlay: ['--ds-surface-overlay', 'var(--ds-shadow-overlay)'],
};

/** A level's pair, as its slot names it. */
const pairLabel = (level) => {
    const [fill, shadow] = LEVEL_PAIRS[level];
    if (shadow === 'none') return `${fill}, no shadow`;
    if (shadow === PAGE_EDGE) return `${fill}, edged by --ds-border-surface`;
    return `${fill} + ${shadow.slice('var('.length, -1)}`;
};

/** Every elevation level, lowest to highest, on the frame's sunken backdrop — docs section only */
function PageLevelsDemo() {
    return (
        <div style={{ ...col, padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
            {PAGE_LEVELS.map((level) => (
                <div key={level}>
                    <DemoLabel>{level}</DemoLabel>
                    <Page level={level} padding="sm" radius="md">
                        {slotContent(pairLabel(level))}
                    </Page>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Patterns/Page/Page',
    id: 'patterns-page-page',
    component: Page,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        as: { table: { disable: true } },
        level: {
            control: 'select',
            options: PAGE_LEVELS,
            description: 'Elevation level: a fill and its shadow',
            table: { category: 'Design' },
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            description: 'Padding scale',
            table: { category: 'Design' },
        },
        radius: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            description: 'Radius scale',
            table: { category: 'Design' },
        },
        border: {
            control: 'boolean',
            description: 'A bold border',
            table: { category: 'Design' },
        },
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

export const Overview = () => (
    <Page padding="md" radius="lg">
        {slotContent('Content slot')}
    </Page>
);

export const Levels = () => <PageLevelsDemo />;

/** The padding and radius scales, each step on a bordered default page. */
export const Scales = () => (
    <div style={{ ...col, padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
        {['sm', 'md', 'lg'].map((step) => (
            <div key={step}>
                <DemoLabel>{`padding ${step}, radius ${step}`}</DemoLabel>
                <Page padding={step} radius={step}>
                    {slotContent('Content slot')}
                </Page>
            </div>
        ))}
    </div>
);

/** In every color mode, each level draws its fill with its own shadow, and text in the body color. */
export const ColorModes = {
    render: () => <PageLevelsDemo />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        await inEveryColorMode(async (mode) => {
            for (const level of PAGE_LEVELS) {
                const el = canvasElement.querySelector(`.plus-pattern-page-level-${level}`);
                const [fill, shadow] = LEVEL_PAIRS[level];
                const style = getComputedStyle(el);
                await expect(style.backgroundColor, `${mode}: ${level} fill`).toBe(tokenColor(canvasElement, fill));
                await expect(style.boxShadow, `${mode}: ${level} shadow`).toBe(computedShadow(canvasElement, shadow));
                await expect(style.color, `${mode}: ${level} text`).toBe(tokenColor(canvasElement, '--ds-text'));
            }
        });
    },
};

/** A Page used alone pads as the content box inside the frame does: the frame's `--page-pad`, on every side. */
export const MediumPad = {
    render: () => (
        <Page padding="md">
            {slotContent('Content slot')}
        </Page>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const style = getComputedStyle(canvasElement.querySelector('.plus-pattern-page'));
        const pad = px(probe(canvasElement, 'paddingTop', 'var(--page-pad)', { display: 'block' }));
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            await expect(px(style[`padding${side}`]), `pad ${side.toLowerCase()}`).toBe(pad);
        }
    },
};

export const Interactive = {
    args: {
        level: 'default',
        padding: 'md',
        radius: 'lg',
        border: false,
    },
    render: (args) => (
        <Page {...args}>
            {slotContent('Content slot')}
        </Page>
    ),
};
