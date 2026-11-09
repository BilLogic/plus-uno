import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import AiIcon, { AI_ICON_NAMES, AI_ICON_SIZES, AI_ICON_ALL_SIZES } from './AiIcon';

/**
 * `AiIcon` -- icons for AI actions.
 *
 * One icon per meaning, in
 * a square box exactly its size, filled with the icon color and paired with a
 * label unless its meaning is obvious. PLUS adds a sparkle badge on the actions
 * that generate.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser: every icon at every size it has, the accessible name, the
 * `currentColor` fill resolved to the icon token in light and dark, and the
 * rendered box.
 */

export default {
    title: 'AI UI/Components for AI/Icon',
    component: AiIcon,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Icons for AI actions: generate, ask, rewrite, summarize, plan, suggest and stop generating. '
                    + 'A Font Awesome Free glyph with a sparkle badge, or the sparkle alone.',
            },
        },
    },
    argTypes: {
        name: { control: 'select', options: AI_ICON_NAMES },
        size: { control: 'inline-radio', options: AI_ICON_ALL_SIZES },
        label: { control: 'text' },
        className: { control: false },
    },
};

const cell = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--inline-sm)', minWidth: 'var(--card-min-width-sm)' };
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

const ModeSet = ({ mode }) => (
    <div
        data-color-mode={mode}
        data-testid={`set-${mode}`}
        style={{
            padding: 'var(--card-pad-default)',
            background: 'var(--ds-surface)',
            color: 'var(--ds-text)',
            borderRadius: 'var(--card-radius)',
            border: 'var(--border-default) solid var(--ds-border)',
        }}
    >
        <div style={{ font: 'var(--heading-small)', marginBottom: 'var(--inline-md)' }}>{mode === 'dark' ? 'Dark' : 'Light'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 'var(--grid-gutter)', justifyContent: 'start' }}>
            {AI_ICON_NAMES.flatMap((name) => AI_ICON_ALL_SIZES.filter((size) => AI_ICON_SIZES[name].includes(size)).map((size) => (
                <div key={`${name}-${size}`} style={cell}>
                    <AiIcon name={name} size={size} data-name={name} data-size={size} />
                    <span style={caption}>{name} {size}</span>
                </div>
            )))}
        </div>
    </div>
);

/* ---------------------------------------------------------------- the set */

export const AllIcons = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--grid-gutter)' }}>
        <ModeSet mode="light" />
        <ModeSet mode="dark" />
    </div>
);

/** Every icon at every size it has, in light and dark: 16 icons each, with 12 only for generate and stop-generating. */
AllIcons.play = async ({ canvasElement }) => {
    const expected = AI_ICON_NAMES.reduce((count, name) => count + AI_ICON_SIZES[name].length, 0);
    for (const mode of ['light', 'dark']) {
        const set = within(canvasElement).getByTestId(`set-${mode}`);
        const icons = [...set.querySelectorAll('svg')];
        await expect(icons, `icons in ${mode}`).toHaveLength(expected);
        for (const svg of icons) {
            const size = Number(svg.dataset.size);
            await expect(px(getComputedStyle(svg).width), `${svg.dataset.name} width`).toBe(size);
            await expect(px(getComputedStyle(svg).height), `${svg.dataset.name} height`).toBe(size);
            await expect(svg.getAttribute('fill'), 'fills with currentColor').toBe('currentColor');
        }
    }
    const light = canvasElement.querySelector('[data-testid="set-light"] svg');
    const dark = canvasElement.querySelector('[data-testid="set-dark"] svg');
    await expect(getComputedStyle(light).color, 'light icon color').not.toBe(getComputedStyle(dark).color);
};

/* ------------------------------------------------------- 1x and 2x, close up */

export const CloseUp = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--grid-gutter)', color: 'var(--ds-icon)' }}>
        {AI_ICON_NAMES.map((name) => (
            <div key={name} style={cell}>
                <span style={{ display: 'inline-flex', transform: 'scale(2)', transformOrigin: 'center', margin: 'var(--pad-y-md)' }}>
                    <AiIcon name={name} size={24} />
                </span>
                <AiIcon name={name} size={24} />
                <span style={caption}>{name}</span>
            </div>
        ))}
    </div>
);

/** The 24px icons drawn at 2x above and 1x below, for checking edges and the gap around each sparkle. */
CloseUp.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(AI_ICON_NAMES.length * 2);
};

/* ------------------------------------------------------------ accessibility */

export const Labeled = () => (
    <div style={{ display: 'flex', gap: 'var(--grid-gutter)', alignItems: 'center' }}>
        <AiIcon name="summarize" label="Summarize" data-testid="named" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
            <AiIcon name="rewrite" data-testid="decorative" />
            Rewrite
        </span>
    </div>
);

/** With a `label` the icon is an image with that name; beside visible text it is hidden. */
Labeled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'Summarize' })).toBeInTheDocument();
    const decorative = canvas.getByTestId('decorative');
    await expect(decorative.getAttribute('aria-hidden')).toBe('true');
    await expect(decorative.getAttribute('role')).toBeNull();
};

/* -------------------------------------------------------------------- color */

export const Color = () => (
    <div style={{ display: 'flex', gap: 'var(--grid-gutter)', alignItems: 'center' }}>
        <AiIcon name="suggest" data-testid="default" />
        <AiIcon name="suggest" data-testid="brand" style={{ color: 'var(--ds-icon-brand)' }} />
    </div>
);

/** The shapes fill with `currentColor`: the icon token by default, and whatever `color` says otherwise. */
Color.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(canvas.getByTestId('default')).color, `icon token, ${mode}`).toBe(tokenColor(canvasElement, '--ds-icon'));
        await expect(getComputedStyle(canvas.getByTestId('brand')).color, `brand override, ${mode}`).toBe(token('--ds-icon-brand'));
    });
    const path = canvas.getByTestId('default').querySelector('path');
    await expect(getComputedStyle(path).fill, 'path fill follows color').toBe(getComputedStyle(canvas.getByTestId('default')).color);
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => <AiIcon {...args} />;
Interactive.args = { name: 'generate', size: 16 };

/** The controls drive `name`, `size` and `label`. */
Interactive.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).not.toBeNull();
};

/** An AI icon is a picture, not a control: its one state is at rest. */
export const Rest = () => <AiIcon name="summarize" label="Summarize" data-testid="rest" />;

Rest.play = async ({ canvasElement }) => {
    const el = within(canvasElement).getByRole('img', { name: 'Summarize' });
    await expect(el).not.toHaveAttribute('tabindex');
};
