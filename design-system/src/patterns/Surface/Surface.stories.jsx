import React from 'react';
import { expect } from 'storybook/test';
import Surface, { SURFACE_LEVELS } from '@/patterns/Surface';
import { computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';

const col = { display: 'flex', flexDirection: 'column', gap: '24px' };

const slotContent = (label) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '96px',
            border: 'var(--size-element-border) dashed var(--ds-border-bold)',
            borderRadius: 'var(--size-element-radius-md)',
            color: 'var(--ds-text-subtle)',
        }}
        className="body1-txt"
    >
        {label}
    </div>
);

const levelLabel = {
    display: 'block',
    marginBottom: 'var(--element-stack-md)',
    font: 'var(--heading-xxsmall)',
    color: 'var(--ds-text-subtle)',
};

/** What each level pairs: its fill, and the shadow that goes with it. */
const PAIRS = {
    sunken: '--ds-surface-sunken, no shadow',
    default: '--ds-surface, edged by --ds-border-surface',
    raised: '--ds-surface-raised + --ds-shadow-raised',
    overlay: '--ds-surface-overlay + --ds-shadow-overlay',
};

/** Every elevation level, lowest to highest, on the frame's sunken backdrop — docs section only */
function SurfaceLevelsDemo() {
    return (
        <div style={{ ...col, padding: 'var(--surface-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
            {SURFACE_LEVELS.map((level) => (
                <div key={level}>
                    <span style={levelLabel}>{level}</span>
                    <Surface level={level} padding="sm" radius="md">
                        {slotContent(PAIRS[level])}
                    </Surface>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Surfaces',
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

/** What each level must draw: its fill and its shadow, as a pair. */
const LEVEL_PAIRS = {
    sunken: ['--ds-surface-sunken', 'none'],
    default: ['--ds-surface', '0 0 0 var(--size-surface-border) var(--ds-border-surface)'],
    raised: ['--ds-surface-raised', 'var(--ds-shadow-raised)'],
    overlay: ['--ds-surface-overlay', 'var(--ds-shadow-overlay)'],
};

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
