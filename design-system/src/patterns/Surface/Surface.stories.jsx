import React from 'react';
import { expect } from 'storybook/test';
import Surface, { SURFACE_EDGE, SURFACE_LEVELS } from '@/patterns/Surface';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { DemoLabel, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';

const col = { display: 'flex', flexDirection: 'column', gap: '24px' };

/** What each level must draw: its fill and its shadow, as a pair. */
const LEVEL_PAIRS = {
    sunken: ['--ds-surface-sunken', 'none'],
    default: ['--ds-surface', SURFACE_EDGE],
    raised: ['--ds-surface-raised', 'var(--ds-shadow-raised)'],
    overlay: ['--ds-surface-overlay', 'var(--ds-shadow-overlay)'],
};

/** A level's pair, as its slot names it. */
const pairLabel = (level) => {
    const [fill, shadow] = LEVEL_PAIRS[level];
    if (shadow === 'none') return `${fill}, no shadow`;
    if (shadow === SURFACE_EDGE) return `${fill}, edged by --ds-border-surface`;
    return `${fill} + ${shadow.slice('var('.length, -1)}`;
};

/** Every elevation level, lowest to highest, on the frame's sunken backdrop — docs section only */
function SurfaceLevelsDemo() {
    return (
        <div style={{ ...col, padding: 'var(--surface-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
            {SURFACE_LEVELS.map((level) => (
                <div key={level}>
                    <DemoLabel>{level}</DemoLabel>
                    <Surface level={level} padding="sm" radius="md">
                        {slotContent(pairLabel(level))}
                    </Surface>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Surface',
    id: 'foundations-patterns-surfaces',
    component: Surface,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        as: { table: { disable: true } },
        level: {
            control: 'select',
            options: SURFACE_LEVELS,
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
    <Surface padding="md" radius="lg">
        {slotContent('Content slot')}
    </Surface>
);

export const Levels = () => <SurfaceLevelsDemo />;

/** The padding and radius scales, each step on a bordered default surface. */
export const Scales = () => (
    <div style={{ ...col, padding: 'var(--surface-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
        {['sm', 'md', 'lg'].map((step) => (
            <div key={step}>
                <DemoLabel>{`padding ${step}, radius ${step}`}</DemoLabel>
                <Surface padding={step} radius={step}>
                    {slotContent('Content slot')}
                </Surface>
            </div>
        ))}
    </div>
);

/** In every color mode, each level draws its fill with its own shadow, and text in the body color. */
export const ColorModes = {
    render: () => <SurfaceLevelsDemo />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        await inEveryColorMode(async (mode) => {
            for (const level of SURFACE_LEVELS) {
                const el = canvasElement.querySelector(`.plus-pattern-surface-level-${level}`);
                const [fill, shadow] = LEVEL_PAIRS[level];
                const style = getComputedStyle(el);
                await expect(style.backgroundColor, `${mode}: ${level} fill`).toBe(tokenColor(canvasElement, fill));
                await expect(style.boxShadow, `${mode}: ${level} shadow`).toBe(computedShadow(canvasElement, shadow));
                await expect(style.color, `${mode}: ${level} text`).toBe(tokenColor(canvasElement, '--ds-text'));
            }
        });
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
        <Surface {...args}>
            {slotContent('Content slot')}
        </Surface>
    ),
};
