import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import GenerativeBorder, { GENERATIVE_BORDER_RADII } from './GenerativeBorder';

/**
 * `GenerativeBorder` -- a ring that shows content is being generated.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. The ring is asserted as what a person gets: absent while
 * idle, decorative while generating, the two AI tones resolved from tokens in
 * every color mode, `aria-busy` on the wrapper, and a still solid line under
 * reduced motion.
 */

export default {
    title: 'AI/Components/Generative border',
    component: GenerativeBorder,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A flat two-tone ring around content the agent is generating right now. '
                    + 'Generation in progress only; never decoration.',
            },
        },
    },
    argTypes: {
        active: { control: 'boolean' },
        radius: { control: 'inline-radio', options: GENERATIVE_BORDER_RADII },
        children: { control: false },
        className: { control: false },
    },
};

const box = {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--element-inline-md)',
    padding: 'var(--card-pad-md)',
    border: 'var(--border-default) solid var(--ds-border)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface-raised)',
    color: 'var(--ds-text)',
};

/** A wrapper is as wide as its parent, so a story sets the width of the thing it surrounds. */
const wrap = { maxWidth: 'var(--section-min-width-main)' };

const toggle = {
    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
    border: 'var(--border-default) solid var(--ds-border-input)',
    borderRadius: 'var(--size-element-radius-md)',
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

/* --------------------------------------------------------------------- idle */

export const Idle = () => (
    <GenerativeBorder data-testid="wrapper" style={wrap}>
        <Draft />
    </GenerativeBorder>
);

/** Idle, the children render inside the wrapper with no ring and the wrapper reads as not busy. */
Idle.play = async ({ canvasElement }) => {
    const wrapper = within(canvasElement).getByTestId('wrapper');
    await expect(canvasElement.querySelector('.plus-generative-border__ring'), 'no ring while idle').toBeNull();
    await expect(wrapper.getAttribute('aria-busy'), 'not busy').toBe('false');
    await expect(within(wrapper).getByText('Session summary')).toBeVisible();
};

/* --------------------------------------------------------------- generating */

export const Generating = () => (
    <GenerativeBorder active data-testid="wrapper" style={wrap}>
        <Draft text="Drafting the session summary…" />
    </GenerativeBorder>
);

/**
 * The ring lies over the edge of the box at the border-width token, hidden
 * from assistive technology, while the wrapper says it is busy. Its two tones
 * are the AI edge and the AI bold ground in every color mode, and it turns.
 */
Generating.play = async ({ canvasElement }) => {
    const wrapper = within(canvasElement).getByTestId('wrapper');
    const ring = canvasElement.querySelector('.plus-generative-border__ring');
    await expect(ring, 'ring while generating').not.toBeNull();
    await expect(ring.getAttribute('aria-hidden'), 'ring is decorative').toBe('true');
    await expect(wrapper.getAttribute('aria-busy'), 'busy').toBe('true');
    await expect(px(getComputedStyle(ring).paddingTop), 'ring thickness is the stroke token').toBe(2);
    await expect(getComputedStyle(ring).animationName, 'turning').toBe('plus-generative-border-turn');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        const image = getComputedStyle(ring).backgroundImage;
        await expect(image, `gradient is conic, ${mode}`).toMatch(/conic-gradient/);
        await expect(image, `AI edge, ${mode}`).toContain(token('--ds-ai-border'));
        await expect(image, `AI bold ground, ${mode}`).toContain(token('--ds-ai-background-bold'));
    });
};

/* ----------------------------------------------------------- reduced motion */

export const ReducedMotion = () => (
    <GenerativeBorder active data-testid="wrapper" style={wrap}>
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

/** Under reduced motion the ring stops turning and is one solid AI edge line. */
ReducedMotion.play = async ({ canvasElement }) => {
    if (!(await emulateReducedMotion('reduce'))) return;
    const ring = canvasElement.querySelector('.plus-generative-border__ring');
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches, 'the runner emulates the preference').toBe(true);
    await expect(getComputedStyle(ring).animationName, 'no animation').toBe('none');
    await expect(getComputedStyle(ring).backgroundImage, 'no gradient').toBe('none');
    await expect(getComputedStyle(ring).backgroundColor, 'solid AI edge').toBe(tokenColor(canvasElement, '--ds-ai-border'));
};

/* ------------------------------------------------------------------- radius */

export const Radii = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--layout-gutter)' }}>
        {GENERATIVE_BORDER_RADII.map((radius) => (
            <GenerativeBorder key={radius} active radius={radius}>
                <div style={{ ...box, borderRadius: 'var(--generative-border-radius)', minWidth: 'var(--card-min-width-sm)' }}>
                    <span style={{ font: 'var(--body-small)' }}>{radius}</span>
                </div>
            </GenerativeBorder>
        ))}
    </div>
);

/** Each radius name follows its token, so the ring meets the corners of the content it wraps. */
Radii.play = async ({ canvasElement }) => {
    const rings = [...canvasElement.querySelectorAll('.plus-generative-border__ring')];
    const radii = rings.map((ring) => getComputedStyle(ring).borderTopLeftRadius);
    await expect(rings, 'one ring per radius').toHaveLength(GENERATIVE_BORDER_RADII.length);
    await expect(new Set(radii).size, 'radii differ by name').toBeGreaterThan(1);
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => {
    const [active, setActive] = useState(Boolean(args.active));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gutter)', alignItems: 'flex-start' }}>
            <GenerativeBorder {...args} active={active} data-testid="wrapper" style={wrap}>
                <Draft />
            </GenerativeBorder>
            <button type="button" style={toggle} onClick={() => setActive((v) => !v)}>
                {active ? 'Finish generating' : 'Start generating'}
            </button>
        </div>
    );
};
Interactive.args = { active: false, radius: 'card' };

/** Starting and finishing generation flips the ring and `aria-busy` together. */
Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = canvas.getByTestId('wrapper');
    await userEvent.click(canvas.getByRole('button', { name: 'Start generating' }));
    await expect(wrapper.getAttribute('aria-busy')).toBe('true');
    await expect(canvasElement.querySelector('.plus-generative-border__ring')).not.toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Finish generating' }));
    await expect(wrapper.getAttribute('aria-busy')).toBe('false');
    await expect(canvasElement.querySelector('.plus-generative-border__ring')).toBeNull();
};
