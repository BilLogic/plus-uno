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
            table: { category: 'Design' },
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            table: { category: 'Design' },
        },
        radius: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            table: { category: 'Design' },
        },
        border: {
            control: 'boolean',
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

/** One level on the frame's sunken backdrop, labeled with its fill and shadow. */
const OneLevel = ({ level }) => (
    <div style={{ padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
        <Page level={level} padding="sm" radius="md">
            {slotContent(pairLabel(level))}
        </Page>
    </div>
);

/** sunken: the frame's backdrop, with no shadow. */
export const Sunken = { render: () => <OneLevel level="sunken" /> };
/** default: the page, edged by `--ds-border-surface`. */
export const DefaultLevel = { name: 'Default', render: () => <OneLevel level="default" /> };
/** raised: a card, with the raised shadow. */
export const Raised = { render: () => <OneLevel level="raised" /> };
/** overlay: anything over the UI, with the overlay shadow. */
export const Overlay = { render: () => <OneLevel level="overlay" /> };

/** One padding and radius step on a default Page, on the sunken backdrop. */
const OneStep = ({ step }) => (
    <div style={{ padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
        <Page padding={step} radius={step}>
            {slotContent(`padding ${step}, radius ${step}`)}
        </Page>
    </div>
);

/** padding and radius none: the content runs to the edge. */
export const StepNone = { name: 'None', render: () => <OneStep step="none" /> };
/** padding and radius sm. */
export const StepSmall = { name: 'Small', render: () => <OneStep step="sm" /> };
/** padding and radius md: the frame's own pad. */
export const StepMedium = { name: 'Medium', render: () => <OneStep step="md" /> };
/** padding and radius lg. */
export const StepLarge = { name: 'Large', render: () => <OneStep step="lg" /> };

/** border: a bold 2px border, drawn in place of the default level's edge ring. */
export const Bordered = {
    render: () => (
        <div style={{ padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
            <Page padding="md" radius="md" border>
                {slotContent('border')}
            </Page>
        </div>
    ),
};

/** title: the page's one h1, above the content. */
export const WithTitle = {
    name: 'With title',
    render: () => (
        <Page padding="md" radius="lg" title="Sessions">
            {slotContent('Content slot')}
        </Page>
    ),
};

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
