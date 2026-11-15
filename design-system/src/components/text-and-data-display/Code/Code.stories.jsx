import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';

import Code from './Code';

/**
 * `Code` -- an inline snippet for code inside a sentence.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. The snippet is asserted as what a person sees: the monospace
 * family, a size of 0.875 of the surrounding text, the neutral fill and the
 * code ink resolved from tokens in every color mode. Never a class name.
 */

export default {
    title: 'Components/Text and data display/Code/Code',
    component: Code,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'An inline snippet for a short piece of code in a sentence: the code typeface at 0.875 of '
                    + 'the text around it, on a neutral fill.',
            },
        },
    },
    argTypes: {
        children: { control: 'text' },
        className: { control: false },
    },
};

/* ------------------------------------------------------------------ default */

export const Overview = () => (
    <p className="plus-body-1" style={{ margin: 0 }}>
        Call <Code>getSession()</Code> before you render the page.
    </p>
);

/**
 * The snippet is a `code` element in the code family, 0.875 of its parent, and its
 * fill and ink are the code tokens, in every color mode.
 */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const snippet = canvas.getByText('getSession()');
    await expect(snippet.tagName, 'it is a code element').toBe('CODE');
    const parent = px(getComputedStyle(snippet.parentElement).fontSize);
    await expect(px(getComputedStyle(snippet).fontSize), 'it is 0.875 of the text around it').toBeCloseTo(parent * 0.875, 1);
    await expect(getComputedStyle(snippet).fontFamily, 'it uses the code family').toMatch(/Noto Sans Mono/);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(snippet).backgroundColor, `fill, ${mode}`).toBe(token('--ds-background-neutral'));
        await expect(getComputedStyle(snippet).color, `ink, ${mode}`).toBe(token('--ds-text-code-default'));
    });
    await expect(canvas.getByText(/Call/), 'the sentence around it is unchanged').toBeVisible();
};

/* ------------------------------------------------------------------- scaling */

export const InHeading = () => (
    <h2 className="plus-heading-sm" style={{ margin: 0 }}>
        The <Code>useSession</Code> hook
    </h2>
);

/** The snippet follows the text it sits in: 0.875 of a heading, not of the body. */
InHeading.play = async ({ canvasElement }) => {
    const snippet = within(canvasElement).getByText('useSession');
    const parent = px(getComputedStyle(snippet.parentElement).fontSize);
    await expect(px(getComputedStyle(snippet).fontSize)).toBeCloseTo(parent * 0.875, 1);
    await expect(snippet.parentElement.tagName).toBe('H2');
};

/* ------------------------------------------------------------------- wrapping */

export const WrapsAtTheEdge = () => (
    <p className="plus-body-1" style={{ margin: 0, width: 160 }}>
        <Code>a_very_long_identifier_with_no_spaces_in_it</Code>
    </p>
);

/** A long token breaks inside the snippet instead of pushing the page sideways. */
WrapsAtTheEdge.play = async ({ canvasElement }) => {
    const snippet = within(canvasElement).getByText('a_very_long_identifier_with_no_spaces_in_it');
    await expect(snippet.parentElement.scrollWidth, 'nothing overflows its box').toBeLessThanOrEqual(snippet.parentElement.clientWidth);
};

/* ---------------------------------------------------------------- playground */

export const Interactive = (args) => (
    <p className="plus-body-1" style={{ margin: 0 }}>
        Run <Code {...args} /> to start.
    </p>
);
Interactive.args = { children: 'npm run dev' };
Interactive.argTypes = { children: { control: 'text' } };

const codeOf = (canvasElement) => within(canvasElement).getByText('getSession()');

/** Rest: the neutral fill and the code ink. */
export const Rest = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        const snippet = codeOf(canvasElement);
        await expect(getComputedStyle(snippet).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(getComputedStyle(snippet).color).toBe(tokenColor(canvasElement, '--ds-text-code-default'));
    },
};

/** Hovered: the snippet is text, so a pointer over it changes nothing. */
export const Hovered = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(codeOf(canvasElement), ':hover', 'code snippet');
    },
};

/** Pressed: nothing changes under a press either. */
export const Pressed = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(codeOf(canvasElement), ':active', 'code snippet');
    },
};

/** Focused and disabled: the snippet is not a control, so Tab skips it and it is never dimmed. */
export const NotAControl = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(codeOf(canvasElement), 'code snippet');
    },
};
