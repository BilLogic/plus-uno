import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Heading, { HEADING_SIZES, HeadingContextProvider } from './Heading';

/**
 * `Heading` -- a text style with its own tag, resolved from the ambient
 * heading level set by `HeadingContextProvider`.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser: the resolved tag, the resolved font and the resolved
 * color, in every color mode. Never a class name.
 */

export default {
    title: 'Components/Text and data display/Heading',
    component: Heading,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A text style with its own HTML tag, kept separate so the same size can land on any '
                    + 'level of the page.',
            },
        },
    },
    argTypes: {
        size: { control: 'select', options: HEADING_SIZES },
        as: { control: 'select', options: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'] },
        color: { control: 'select', options: ['color.text', 'color.text.inverse', 'color.text.warning.inverse'] },
        children: { control: 'text' },
    },
};

/* ------------------------------------------------------------------ default */

export const Overview = () => <Heading size={'large'}>Student progress</Heading>;

/** At the top level (no provider above it) a heading opens at h1. */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByText('Student progress');
    await expect(heading.tagName, 'defaults to the top-level tag').toBe('H1');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(heading).color, `ink, ${mode}`).toBe(token('--ds-text'));
    });
};

/* ------------------------------------------------------------------- sizes */

export const Sizes = () => (
    <>
        {HEADING_SIZES.map((size) => (
            <Heading key={size} as="div" size={size}>{size}</Heading>
        ))}
    </>
);

/** Each size resolves to its own text style, largest to smallest. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let previous = Infinity;
    for (const size of HEADING_SIZES) {
        const el = canvas.getByText(size);
        const px = parseFloat(getComputedStyle(el).fontSize);
        await expect(px, `${size} is smaller than the size before it`).toBeLessThanOrEqual(previous);
        previous = px;
    }
};

/* --------------------------------------------------------------------- tag */

export const OverridesTheTag = () => <Heading as="div" size="xxsmall">Section label</Heading>;

/** `as` wins over the ambient level. */
OverridesTheTag.play = async ({ canvasElement }) => {
    const heading = within(canvasElement).getByText('Section label');
    await expect(heading.tagName).toBe('DIV');
};

/* --------------------------------------------------------------- nesting */

export const NestedContext = () => (
    <HeadingContextProvider value={2}>
        <Heading size="xxlarge">Page section</Heading>
        <HeadingContextProvider>
            <Heading size={'medium'}>Subsection</Heading>
        </HeadingContextProvider>
    </HeadingContextProvider>
);

/** A provider sets the level outright; a nested one with no `value` counts one deeper. */
NestedContext.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Page section').tagName, 'the provided level').toBe('H2');
    await expect(canvas.getByText('Subsection').tagName, 'one level below its parent').toBe('H3');
};

/* -------------------------------------------------------------------- color */

export const InverseColor = () => (
    <div style={{ background: 'var(--ds-text)', padding: 16 }}>
        <Heading as="div" size={'medium'} color="color.text.inverse">On a dark ground</Heading>
    </div>
);

/** `color.text.inverse` resolves to the inverse text token in every color mode. */
InverseColor.play = async ({ canvasElement }) => {
    const heading = within(canvasElement).getByText('On a dark ground');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(heading).color, `inverse ink, ${mode}`).toBe(token('--ds-text-inverse'));
    });
};

/* ---------------------------------------------------------------- playground */

export const Interactive = (args) => <Heading {...args} />;
Interactive.args = { size: 'medium', children: 'Interactive heading' };

const headingOf = (canvasElement) => within(canvasElement).getByText('Student progress');

/** Rest: the text color is the default ink. */
export const Rest = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(headingOf(canvasElement)).color).toBe(tokenColor(canvasElement, '--ds-text'));
    },
};

/** Hovered: a heading does not react to a pointer. */
export const Hovered = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(headingOf(canvasElement), ':hover', 'heading');
    },
};

/** Pressed: nothing changes under a press. */
export const Pressed = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(headingOf(canvasElement), ':active', 'heading');
    },
};

/** Focused and disabled: a heading is not a control, so Tab skips it and it is never dimmed. */
export const NotAControl = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(headingOf(canvasElement), 'heading');
    },
};
