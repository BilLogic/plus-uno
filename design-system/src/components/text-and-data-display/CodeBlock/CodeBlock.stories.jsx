import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';

import CodeBlock from './CodeBlock';

/**
 * `CodeBlock` -- several lines of code, with line numbers, highlighted lines,
 * and wrap or scroll for long lines.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. Line numbers and highlights are asserted as what a person
 * or a screen reader gets: the text each line holds, the words announced at the
 * start and end of a highlight, the focusable named region a keyboard user
 * scrolls, and the token colors resolved in every color mode.
 */

export default {
    title: 'Components/Text and data display/Code/Code block',
    component: CodeBlock,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A block of code in the code typeface on the code surface. Line numbers are on by default, '
                    + 'highlight takes lines like "2,4-5", and long lines scroll in a focusable region or wrap.',
            },
        },
    },
    argTypes: {
        text: { control: 'text' },
        language: { control: 'text' },
        showLineNumbers: { control: 'boolean' },
        highlight: { control: 'text' },
        wrap: { control: 'boolean' },
        label: { control: 'text' },
        className: { control: false },
    },
};

const SNIPPET = `const session = await getSession(id);
if (!session) {
    throw new Error('No such session');
}
render(session);`;

const LONG = `const message = 'This line is much longer than the box it sits in, so it either scrolls sideways or wraps onto the next line.';
done();`;

/* ------------------------------------------------------------------ default */

export const Overview = () => <CodeBlock text={SNIPPET} language="javascript" />;

/**
 * Every line is present, numbered 1 to 5 in a gutter a screen reader skips, and
 * the block is drawn on the code surface in the code typeface in every mode.
 */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const block = canvas.getByRole('region', { name: 'Code snippet' });
    await expect(canvas.getByText('render(session);'), 'the last line is there').toBeVisible();
    const numbers = canvasElement.querySelectorAll('[data-line-number]');
    await expect(numbers.length, 'five lines are numbered').toBe(5);
    await expect(numbers[4].textContent, 'the last is numbered 5').toBe('5');
    for (const n of numbers) await expect(n.getAttribute('aria-hidden'), 'numbers are not read').toBe('true');
    await expect(getComputedStyle(block).fontFamily, 'the code family').toMatch(/Noto Sans Mono/);
    await expect(block.querySelector('code').className, 'language is kept for tools').toBe('language-javascript');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(block).backgroundColor, `surface, ${mode}`).toBe(token('--ds-background-code-default'));
        await expect(getComputedStyle(block).color, `ink, ${mode}`).toBe(token('--ds-text-code-default'));
        await expect(getComputedStyle(numbers[0]).color, `gutter ink, ${mode}`).toBe(token('--ds-text-code-gutter'));
        await expect(getComputedStyle(numbers[0]).backgroundColor, `gutter fill, ${mode}`).toBe(token('--ds-background-code-gutter'));
    });
};

/* --------------------------------------------------------------- line numbers */

export const WithoutLineNumbers = () => <CodeBlock text={SNIPPET} showLineNumbers={false} />;

/** With numbers off there is no gutter at all, and every line is still there. */
WithoutLineNumbers.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-line-number]').length, 'no gutter').toBe(0);
    await expect(within(canvasElement).getByText(/throw new Error/), 'code still renders').toBeVisible();
};

/* ---------------------------------------------------------------- highlighting */

export const HighlightedLines = () => <CodeBlock text={SNIPPET} highlight="2-4" />;

/**
 * Lines 2 to 4 sit on the highlight fill, and a screen reader hears where the
 * run starts and ends, once each, because color alone says nothing to it.
 */
HighlightedLines.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Highlight start').length, 'one start').toBe(1);
    await expect(canvas.getAllByText('Highlight end').length, 'one end').toBe(1);
    const lines = canvasElement.querySelectorAll('[data-line]');
    await expect(lines[1].hasAttribute('data-highlighted'), 'line 2 is highlighted').toBe(true);
    await expect(lines[3].hasAttribute('data-highlighted'), 'line 4 is highlighted').toBe(true);
    await expect(lines[0].hasAttribute('data-highlighted'), 'line 1 is not').toBe(false);
    await expect(lines[4].hasAttribute('data-highlighted'), 'line 5 is not').toBe(false);
    await expect(lines[1].textContent, 'start is announced on line 2').toMatch(/Highlight start/);
    await expect(lines[3].textContent, 'end is announced on line 4').toMatch(/Highlight end/);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(lines[1]).backgroundColor, `highlight, ${mode}`).toBe(token('--ds-background-code-highlight'));
        await expect(getComputedStyle(lines[0]).backgroundColor, `plain line, ${mode}`).not.toBe(token('--ds-background-code-highlight'));
    });
};

export const SeparateHighlights = () => <CodeBlock text={SNIPPET} highlight={[1, 3, 4]} />;

/** An array works too, and each separate run is announced on its own. */
SeparateHighlights.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Highlight start').length, 'two runs start').toBe(2);
    await expect(canvas.getAllByText('Highlight end').length, 'two runs end').toBe(2);
};

/* ------------------------------------------------------------- scroll and wrap */

export const ScrollsLongLines = () => (
    <div style={{ width: 320 }}>
        <CodeBlock text={LONG} label="Message example" />
    </div>
);

/**
 * Long lines scroll sideways inside a region a keyboard can focus and a screen
 * reader can name, so nothing is cut off and the page does not scroll.
 */
ScrollsLongLines.play = async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Message example' });
    await expect(region.scrollWidth, 'it overflows its box').toBeGreaterThan(region.clientWidth);
    await expect(getComputedStyle(region).overflowX, 'and scrolls').toBe('auto');
    await expect(region.tabIndex, 'a keyboard can reach it').toBe(0);
    region.focus();
    await expect(document.activeElement, 'it takes focus').toBe(region);
    await expect(px(getComputedStyle(region).outlineWidth), 'with a visible ring').toBeGreaterThan(0);
};

export const WrapsLongLines = () => (
    <div style={{ width: 320 }}>
        <CodeBlock text={LONG} wrap />
    </div>
);

/** With wrap on, the lines fold inside the box and there is nothing to scroll. */
WrapsLongLines.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pre = canvasElement.querySelector('pre');
    await expect(pre.scrollWidth, 'nothing to scroll').toBeLessThanOrEqual(pre.clientWidth);
    await expect(pre.tabIndex, 'not a tab stop').toBe(-1);
    await expect(canvas.queryByRole('region'), 'no region to name').toBeNull();
    await expect(getComputedStyle(canvasElement.querySelector('[data-line]')).whiteSpace).toMatch(/pre-wrap|break-spaces/);
};

/* ---------------------------------------------------------------- empty lines */

export const BlankLines = () => <CodeBlock text={'first\n\nthird'} />;

/** A blank line keeps its height and its number, so numbers stay true. */
BlankLines.play = async ({ canvasElement }) => {
    const lines = canvasElement.querySelectorAll('[data-line]');
    await expect(lines.length).toBe(3);
    await expect(lines[1].getBoundingClientRect().height, 'blank line keeps its height')
        .toBeCloseTo(lines[0].getBoundingClientRect().height, 0);
    await expect(canvasElement.querySelectorAll('[data-line-number]')[2].textContent).toBe('3');
};

/* ---------------------------------------------------------------- playground */

export const Interactive = (args) => <CodeBlock {...args} />;
Interactive.args = {
    text: SNIPPET,
    language: 'javascript',
    showLineNumbers: true,
    highlight: '2',
    wrap: false,
    label: 'Code snippet',
};
Interactive.argTypes = {
    text: { control: 'text' },
    language: { control: 'text' },
    showLineNumbers: { control: 'boolean' },
    highlight: { control: 'text' },
    wrap: { control: 'boolean' },
    label: { control: 'text' },
};

const blockOf = (canvasElement) => canvasElement.querySelector('.plus-code-block');

/** Rest: the code surface and ink, a hairline edge, and highlighted lines on the highlight fill. */
export const Rest = {
    render: () => <CodeBlock text={SNIPPET} highlight="2" />,
    play: async ({ canvasElement }) => {
        const block = blockOf(canvasElement);
        await expect(getComputedStyle(block).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-code-default'));
        await expect(getComputedStyle(block).color).toBe(tokenColor(canvasElement, '--ds-text-code-default'));
        const marked = block.querySelector('[data-highlighted]');
        await expect(getComputedStyle(marked).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-code-highlight'));
    },
};

/** Hovered: the block does not react to a pointer. */
export const Hovered = {
    render: () => <CodeBlock text={SNIPPET} />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(blockOf(canvasElement), ':hover', 'code block');
    },
};

/** Pressed: nothing changes under a press. */
export const Pressed = {
    render: () => <CodeBlock text={SNIPPET} />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(blockOf(canvasElement), ':active', 'code block');
    },
};

/** Focused: a scrolling block is a named region; keyboard focus draws the 2px ring inset in the block. */
export const Focused = {
    render: () => <CodeBlock text={SNIPPET} />,
    play: async ({ canvasElement }) => {
        const block = blockOf(canvasElement);
        block.focus({ focusVisible: true });
        await expect(block.matches(':focus-visible')).toBe(true);
        const style = getComputedStyle(block);
        await expect(style.outlineStyle).toBe('solid');
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        block.blur();
    },
};

/** A wrapping block has nothing to scroll, so it is not in the tab order. */
export const WrapNotFocusable = {
    render: () => <CodeBlock text={SNIPPET} wrap />,
    play: async ({ canvasElement }) => {
        await expect(blockOf(canvasElement)).not.toHaveAttribute('tabindex');
    },
};
