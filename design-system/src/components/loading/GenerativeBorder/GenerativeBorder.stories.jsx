import React, { useState } from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expect, userEvent, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import GenerativeBorder, { GENERATIVE_BORDER_RADII } from './GenerativeBorder';

/**
 * `GenerativeBorder` -- the border that shows the AI is generating content.
 *
 * The ring
 * appears while content is being generated and goes away when generation ends.
 * PLUS draws it as a 2px stroke in flat lagoon and purple segments.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. The ring is asserted as what a person gets: absent while
 * idle, decorative while generating, the two border colors resolved from
 * tokens in every color mode, `aria-busy` on the wrapper, and the same
 * segments held still under reduced motion.
 */

export default {
    title: 'Components/Loading/Generative border',
    component: GenerativeBorder,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The border that shows the AI is generating content: a 2px rounded stroke in two flat colors, '
                    + 'in hard-edged segments running clockwise. Generation in progress only; never decoration.',
            },
        },
    },
    argTypes: {
        isActive: { control: 'boolean' },
        radius: { control: 'inline-radio', options: GENERATIVE_BORDER_RADII },
        children: { control: false },
        className: { control: false },
    },
};

const box = {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--inline-md)',
    padding: 'var(--card-pad-default)',
    border: 'var(--border-default) solid var(--ds-border)',
    borderRadius: 'var(--generative-border-radius, var(--card-radius))',
    background: 'var(--ds-surface-raised)',
    color: 'var(--ds-text)',
};

/** A wrapper is as wide as its parent, so a story sets the width of the thing it surrounds. */
const wrap = { maxWidth: 'var(--section-min-width-main)' };

const toggle = {
    padding: 'var(--pad-y-md) var(--pad-x-md)',
    border: 'var(--border-default) solid var(--ds-border-input)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--ds-background-input)',
    color: 'var(--ds-text)',
    font: 'var(--body-default)',
    cursor: 'pointer',
};

const Draft = ({ text = 'Here is a first draft of the session summary.' }) => (
    <div style={box}>
        <strong style={{ font: 'var(--heading-small)' }}>Session summary</strong>
        <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{text}</span>
    </div>
);

const ringOf = (canvasElement) => canvasElement.querySelector('.plus-generative-border__ring');

/* --------------------------------------------------------------------- idle */

export const Idle = () => (
    <GenerativeBorder data-testid="wrapper" style={wrap}>
        <Draft />
    </GenerativeBorder>
);

/** Idle, the children render inside the wrapper with no ring and the wrapper reads as not busy. */
Idle.play = async ({ canvasElement }) => {
    const wrapper = within(canvasElement).getByTestId('wrapper');
    await expect(ringOf(canvasElement), 'no ring while idle').toBeNull();
    await expect(wrapper.getAttribute('aria-busy'), 'not busy').toBe('false');
    await expect(within(wrapper).getByText('Session summary')).toBeVisible();
};

/* --------------------------------------------------------------- generating */

export const Generating = () => (
    <GenerativeBorder isActive data-testid="wrapper" style={wrap}>
        <Draft text="Drafting the session summary…" />
    </GenerativeBorder>
);

/**
 * The ring lies over the edge of the box at 2px, hidden from assistive
 * technology, while the wrapper says it is busy. Its two colors are the brand
 * and discovery borders in every color mode, and the segments turn.
 */
Generating.play = async ({ canvasElement }) => {
    const wrapper = within(canvasElement).getByTestId('wrapper');
    const ring = ringOf(canvasElement);
    await expect(ring, 'ring while generating').not.toBeNull();
    await expect(ring.getAttribute('aria-hidden'), 'ring is decorative').toBe('true');
    await expect(wrapper.getAttribute('aria-busy'), 'busy').toBe('true');
    await expect(px(getComputedStyle(ring).paddingTop), 'ring is 2px').toBe(2);
    await expect(getComputedStyle(ring).animationName, 'turning').toBe('plus-generative-border-turn');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        const image = getComputedStyle(ring).backgroundImage;
        await expect(image, `conic, ${mode}`).toMatch(/conic-gradient/);
        await expect(image, `lagoon segments, ${mode}`).toContain(token('--ds-border-brand'));
        await expect(image, `purple segments, ${mode}`).toContain(token('--ds-border-discovery'));
        await expect(image, `no blur or tint, ${mode}`).not.toMatch(/rgba\(.*,\s*0?\.\d/);
    });
};

/* ----------------------------------------------------------- reduced motion */

export const ReducedMotion = () => (
    <GenerativeBorder isActive data-testid="wrapper" style={wrap}>
        <Draft text="Drafting the session summary…" />
    </GenerativeBorder>
);

/*
 * Only this story touches the motion preference. The test runner emulates it
 * through Playwright; in plain Storybook there is no runner, so the play
 * function stops there: change the OS setting to see the still ring.
 */
ReducedMotion.beforeEach = async () => async () => {
    await emulateReducedMotion(null);
};

/** Under reduced motion the ring stops turning and keeps the same segments. */
ReducedMotion.play = async ({ canvasElement }) => {
    if (!(await emulateReducedMotion('reduce'))) return;
    const ring = ringOf(canvasElement);
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches, 'the runner emulates the preference').toBe(true);
    await expect(getComputedStyle(ring).animationName, 'no animation').toBe('none');
    const image = getComputedStyle(ring).backgroundImage;
    await expect(image, 'same segments').toContain(tokenColor(canvasElement, '--ds-border-brand'));
    await expect(image, 'same segments').toContain(tokenColor(canvasElement, '--ds-border-discovery'));
};

/* ------------------------------------------------------------------- radius */

export const Radii = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--grid-gutter)' }}>
        {GENERATIVE_BORDER_RADII.map((radius) => (
            <GenerativeBorder key={radius} isActive radius={radius}>
                <div style={{ ...box, minWidth: 'var(--card-min-width-sm)' }}>
                    <span style={{ font: 'var(--body-small)' }}>{radius}</span>
                </div>
            </GenerativeBorder>
        ))}
    </div>
);

/** Each radius token name sets the ring's corners, so the ring meets the content it wraps. */
Radii.play = async ({ canvasElement }) => {
    const rings = [...canvasElement.querySelectorAll('.plus-generative-border__ring')];
    const radii = rings.map((ring) => getComputedStyle(ring).borderTopLeftRadius);
    await expect(rings, 'one ring per radius').toHaveLength(GENERATIVE_BORDER_RADII.length);
    await expect(new Set(radii).size, 'radii differ by token').toBeGreaterThan(1);
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => {
    const [isActive, setIsActive] = useState(Boolean(args.isActive));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--grid-gutter)', alignItems: 'flex-start' }}>
            <GenerativeBorder {...args} isActive={isActive} data-testid="wrapper" style={wrap}>
                <Draft />
            </GenerativeBorder>
            <button type="button" style={toggle} onClick={() => setIsActive((v) => !v)}>
                {isActive ? 'Finish generating' : 'Start generating'}
            </button>
        </div>
    );
};
Interactive.args = { isActive: false, radius: 'radius-100' };

/** Starting and finishing generation flips the ring and `aria-busy` together. */
Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = canvas.getByTestId('wrapper');
    await userEvent.click(canvas.getByRole('button', { name: 'Start generating' }));
    await expect(wrapper.getAttribute('aria-busy')).toBe('true');
    await expect(ringOf(canvasElement)).not.toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Finish generating' }));
    await expect(wrapper.getAttribute('aria-busy')).toBe('false');
    await expect(ringOf(canvasElement)).toBeNull();
};

/* ------------------------------------------------------------------- states */


const Subject = (props) => <GenerativeBorder {...props}><p style={{ margin: 0, padding: 'var(--pad-x-lg)' }}>Session summary</p></GenerativeBorder>;
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: generative border. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expect(root(canvasElement)).toHaveAttribute('aria-busy', 'false');
        await expect(canvasElement.querySelector('.plus-generative-border__ring')).toBeNull();
    },
};

/** Hovered: a display component has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'generative border');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'generative border');
    },
};

/** Focused: not a control, so Tab skips it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(root(canvasElement), 'generative border');
    },
};
