import React, { useState } from 'react';
import { Button } from '@/components';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import ChangeTag, {
    CHANGE_TAG_FORMATS,
    CHANGE_TAG_GOOD_DIRECTIONS,
    CHANGE_TAG_SPACINGS,
} from './ChangeTag';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';

/**
 * `ChangeTag` — change over time.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe —
 * the shown text, what a screen reader hears, the arrow, focus, computed size,
 * color and animation — and never a class name. Colors are compared against
 * the token they should resolve to, read through a probe element.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Labels/Change tag',
    component: ChangeTag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Change over time: a signed value whose arrow follows the sign, a tone set by '
                    + 'which way is good, and the change spoken in words.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const grid = { display: 'grid', gap: '12px' };

const SIZE = { default: 20, compact: 16 };

/** [fill, text, inside border] per tone. */
const TONE_LOOK = {
    neutral: ['--ds-background-neutral', '--ds-text', '--ds-background-neutral-pressed'],
    success: ['--ds-background-success', '--ds-text-success', '--ds-background-success-pressed'],
    danger: ['--ds-background-danger', '--ds-text-danger', '--ds-background-danger-pressed'],
};

/** The 1px inside border is an inset box-shadow, so the height stays exact. */
const innerBorder = (el) => {
    const shadow = getComputedStyle(el).boxShadow;
    const match = shadow.match(/^(rgba?\([^)]*\)) 0px 0px 0px 1px inset$/);
    return match ? match[1] : null;
};

/** The glyph a Font Awesome solid class draws, read through a probe icon. */
const glyphOf = (host, iconClass) => {
    const probe = document.createElement('i');
    probe.className = `fa-solid ${iconClass}`;
    host.appendChild(probe);
    const glyph = getComputedStyle(probe, '::before').content;
    probe.remove();
    return glyph;
};

/** What a screen reader hears: the text of everything not `aria-hidden`. */
const heard = (el) => {
    const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE || node.getAttribute('aria-hidden') === 'true') return '';
        return [...node.childNodes].map(walk).join('');
    };
    return walk(el).replace(/\s+/g, ' ').trim();
};

/** What a sighted reader sees: the chip and comparison text, never the spoken copy. */
const seen = (el) => [...el.children]
    .filter((child) => child.getAttribute('aria-hidden') === 'true')
    .map((child) => child.textContent)
    .join(' ');

const chipOf = (el) => el.firstElementChild;
const iconIn = (el) => el.querySelector('i');

/* ----------------------------------------------------------------- stories */

/**
 * The three tones. Up is good for sessions held, so +3 is success; down is
 * good for no-shows, so +2 is danger; hours tutored has no good direction.
 */
export const Overview = () => (
    <div style={row}>
        <ChangeTag value={3} goodDirection="up" comparison="vs last week" data-testid="up-good" />
        <ChangeTag value={2} goodDirection="down" comparison="vs last week" data-testid="up-bad" />
        <ChangeTag value={-12} format="percent" goodDirection="up" comparison="vs last month" data-testid="down-bad" />
        <ChangeTag value={-1} goodDirection="down" data-testid="down-good" />
        <ChangeTag value={4.5} format="points" comparison="vs last term" data-testid="up-none" />
        <ChangeTag value={0} goodDirection="up" comparison="vs last week" data-testid="flat" />
        <ChangeTag value={null} comparison="vs last week" data-testid="none" />
    </div>
);
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);
    const cases = [
        ['up-good', '+3 vs last week', 'Up 3 vs last week', 'success', 'fa-arrow-up'],
        ['up-bad', '+2 vs last week', 'Up 2 vs last week', 'danger', 'fa-arrow-up'],
        ['down-bad', '−12% vs last month', 'Down 12% vs last month', 'danger', 'fa-arrow-down'],
        ['down-good', '−1', 'Down 1', 'success', 'fa-arrow-down'],
        ['up-none', '+4.5 pts vs last term', 'Up 4.5 points vs last term', 'neutral', 'fa-arrow-up'],
        ['flat', '0 vs last week', 'No change vs last week', 'neutral', 'fa-arrow-right'],
        ['none', '— vs last week', 'No change data vs last week', 'neutral', null],
    ];
    for (const [id, shown, spoken, tone, icon] of cases) {
        const el = canvas.getByTestId(id);
        const chip = chipOf(el);
        await expect(seen(el), `${id} shows`).toBe(shown);
        await expect(heard(el), `${id} is heard as`).toBe(spoken);
        await expect(getComputedStyle(chip).backgroundColor, `${id} fill`).toBe(token(TONE_LOOK[tone][0]));
        await expect(getComputedStyle(chip).color, `${id} text`).toBe(token(TONE_LOOK[tone][1]));
        if (icon) {
            await expect(getComputedStyle(iconIn(el), '::before').content, `${id} arrow`).toBe(glyphOf(canvasElement, icon));
        } else {
            await expect(iconIn(el), `${id} draws no arrow`).toBeNull();
        }
    }
};

/** Every tone at every spacing, and the comparison in subtle text outside the fill. */
export const Styles = () => (
    <div style={grid}>
        {CHANGE_TAG_SPACINGS.map((size) => (
            <div key={size} style={row}>
                <ChangeTag value={0} spacing={size} comparison="vs last week" data-testid={`neutral-${size}`} />
                <ChangeTag value={3} goodDirection="up" spacing={size} comparison="vs last week" data-testid={`success-${size}`} />
                <ChangeTag value={3} goodDirection="down" spacing={size} comparison="vs last week" data-testid={`danger-${size}`} />
            </div>
        ))}
    </div>
);
Styles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    await inEveryColorModeOf(canvasElement, async (mode, themed) => {
        for (const size of CHANGE_TAG_SPACINGS) {
            for (const [tone, [fill, ink, edge]] of Object.entries(TONE_LOOK)) {
                const chip = chipOf(canvas.getByTestId(`${tone}-${size}`));
                const name = `${mode}: ${tone}-${size}`;
                chip.style.transition = 'none';
                await expect(getComputedStyle(chip).backgroundColor, `${name} fill`).toBe(themed(fill));
                await expect(getComputedStyle(chip).color, `${name} text`).toBe(themed(ink));
                await expect(innerBorder(chip), `${name} border`).toBe(themed(edge));
            }
        }
    });

    for (const size of CHANGE_TAG_SPACINGS) {
        for (const [tone, [, ink]] of Object.entries(TONE_LOOK)) {
            const name = `${tone}-${size}`;
            const el = canvas.getByTestId(name);
            const chip = chipOf(el);
            await expect(chip.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
            await expect(px(getComputedStyle(chip).borderRadius), `${name} radius`).toBe(4);
            const glyph = iconIn(el);
            await expect(glyph).toHaveAttribute('aria-hidden', 'true');
            await expect(getComputedStyle(glyph).color, `${name} arrow color`).toBe(token(ink));
            await expect(px(getComputedStyle(glyph).fontSize), `${name} arrow size`).toBe(12);
            const comparison = within(el).getByText('vs last week', { selector: '[aria-hidden="true"]' });
            await expect(getComputedStyle(comparison).color, `${name} comparison`).toBe(token('--ds-text-subtle'));
            await expect(chip.contains(comparison), `${name} comparison sits outside the fill`).toBe(false);
        }
    }
};

/** Each format, always signed: a count, a percent and points. */
export const Formats = () => (
    <div style={row}>
        {CHANGE_TAG_FORMATS.map((format) => (
            <React.Fragment key={format}>
                <ChangeTag value={1200} format={format} goodDirection="up" data-testid={`${format}-up`} />
                <ChangeTag value={-1} format={format} goodDirection="up" data-testid={`${format}-down`} />
            </React.Fragment>
        ))}
    </div>
);
Formats.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases = {
        'number-up': ['+1,200', 'Up 1,200'],
        'number-down': ['−1', 'Down 1'],
        'percent-up': ['+1,200%', 'Up 1,200%'],
        'percent-down': ['−1%', 'Down 1%'],
        'points-up': ['+1,200 pts', 'Up 1,200 points'],
        'points-down': ['−1 pts', 'Down 1 point'],
    };
    for (const [id, [shown, spoken]] of Object.entries(cases)) {
        const el = canvas.getByTestId(id);
        await expect(seen(el), `${id} shows`).toBe(shown);
        await expect(heard(el), `${id} is heard as`).toBe(spoken);
    }
};

/** `iconBefore` replaces the direction arrow; it stays decorative. */
export const CustomIcon = () => (
    <ChangeTag value={8} format="percent" goodDirection="up" iconBefore="arrow-trend-up" comparison="vs last week" data-testid="trend" />
);
CustomIcon.play = async ({ canvasElement }) => {
    const el = within(canvasElement).getByTestId('trend');
    await expect(getComputedStyle(iconIn(el), '::before').content).toBe(glyphOf(canvasElement, 'fa-arrow-trend-up'));
    await expect(iconIn(el)).toHaveAttribute('aria-hidden', 'true');
    await expect(heard(el)).toBe('Up 8% vs last week');
};

/**
 * A new value fades in while the chip's color moves to its new tone. The
 * first render does not animate, and a re-render with the same value does not
 * replay it.
 */
export const ValueChange = () => {
    const [value, setValue] = useState(-2);
    const [, setTick] = useState(0);
    return (
        <div style={row}>
            <Button onClick={() => setValue(5)}>Next week</Button>
            <Button onClick={() => setTick((n) => n + 1)}>Re-render</Button>
            <ChangeTag value={value} goodDirection="up" comparison="vs last week" data-testid="change" />
        </div>
    );
};
ValueChange.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);
    const el = canvas.getByTestId('change');
    const valueEl = () => within(chipOf(el)).getByText(/\d/);

    await expect(getComputedStyle(valueEl()).animationName, 'the first render does not animate').toBe('none');

    await userEvent.click(canvas.getByRole('button', { name: 'Next week' }));
    await expect(seen(el)).toBe('+5 vs last week');
    await expect(heard(el)).toBe('Up 5 vs last week');
    const entering = valueEl();
    await expect(getComputedStyle(entering).animationName, 'the new value fades in').not.toBe('none');
    await expect(getComputedStyle(chipOf(el)).transitionProperty, 'the color moves').toContain('background-color');
    // Read outside waitFor: a probe adds an element, which would wake waitFor again, forever.
    const success = token('--ds-background-success');
    await waitFor(() => expect(getComputedStyle(chipOf(el)).backgroundColor).toBe(success));

    await userEvent.click(canvas.getByRole('button', { name: 'Re-render' }));
    await expect(valueEl(), 'the same value keeps its element').toBe(entering);
};

/**
 * A Change tag is never a button: no button role, no click handler. An
 * `onClick`, a `role` or a `tabIndex` passed to it is dropped with a
 * development warning.
 */
export const NeverAButton = () => {
    const [mounted, setMounted] = useState(false);
    const [clicks, setClicks] = useState(0);
    return (
        <div style={row}>
            <Button onClick={() => setMounted(true)}>Mount a Change tag with onClick</Button>
            <span data-testid="clicks">{clicks}</span>
            {mounted && (
                <ChangeTag
                    value={3}
                    data-testid="change"
                    onClick={() => setClicks((n) => n + 1)}
                    role="button"
                    tabIndex={0}
                />
            )}
        </div>
    );
};
NeverAButton.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount a Change tag with onClick' }));
        const change = canvas.getByTestId('change');
        for (const name of ['onClick', 'role', 'tabIndex']) {
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining(`\`${name}\` is ignored`));
        }
        await expect(change).not.toHaveAttribute('role');
        await expect(change).not.toHaveAttribute('tabindex');
        await userEvent.click(change);
        await expect(canvas.getByTestId('clicks')).toHaveTextContent('0');
    } finally {
        warn.mockRestore();
    }
};

/** An unknown format, good direction or spacing falls back to the default, with a development warning. */
export const UnknownValuesFallBack = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={row}>
            <Button onClick={() => setMounted(true)}>Mount unknown values</Button>
            <ChangeTag value={3} data-testid="plain" />
            {mounted && <ChangeTag value={3} format="ratio" goodDirection="sideways" spacing="huge" data-testid="fallback" />}
        </div>
    );
};
UnknownValuesFallBack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount unknown values' }));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('falls back to number'));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('falls back to none'));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('falls back to default'));
        const fallback = canvas.getByTestId('fallback');
        const plain = canvas.getByTestId('plain');
        await expect(seen(fallback)).toBe(seen(plain));
        await expect(getComputedStyle(chipOf(fallback)).backgroundColor).toBe(getComputedStyle(chipOf(plain)).backgroundColor);
        await expect(chipOf(fallback).getBoundingClientRect().height).toBe(20);
    } finally {
        warn.mockRestore();
    }
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        value: 3,
        format: 'number',
        goodDirection: 'up',
        comparison: 'vs last week',
        spacing: 'default',
    },
    argTypes: {
        value: { control: 'number' },
        format: { control: 'inline-radio', options: CHANGE_TAG_FORMATS },
        goodDirection: { control: 'inline-radio', options: CHANGE_TAG_GOOD_DIRECTIONS },
        spacing: { control: 'inline-radio', options: CHANGE_TAG_SPACINGS },
        comparison: { control: 'text' },
        iconBefore: { control: 'text' },
    },
    render: (args) => <ChangeTag {...args} />,
};

/* ------------------------------------------------------------------- states */

/** Rest, the only state: a change tag is a label, not a control. */
export const Rest = {
    render: () => <ChangeTag value={3} goodDirection="up" comparison="vs last week" data-testid="change" />,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('change');
        await expect(px(getComputedStyle(chipOf(el)).height), 'default is 20').toBe(20);
        await expect(el).not.toHaveAttribute('tabindex');
    },
};

/** Hovered: nothing changes. */
export const Hovered = {
    render: () => <ChangeTag value={3} goodDirection="up" data-testid="change" />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(chipOf(within(canvasElement).getByTestId('change')), ':hover', 'ChangeTag');
    },
};

/** Pressed: nothing changes. */
export const Pressed = {
    render: () => <ChangeTag value={3} goodDirection="up" data-testid="change" />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(chipOf(within(canvasElement).getByTestId('change')), ':active', 'ChangeTag');
    },
};

/** Focused: not in the tab order, so Tab skips it. */
export const Focused = {
    render: () => <ChangeTag value={3} goodDirection="up" data-testid="change" />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(within(canvasElement).getByTestId('change'), 'ChangeTag');
    },
};

/** Disabled: there is none. A label is never dimmed. */
export const Disabled = {
    render: () => <ChangeTag value={3} goodDirection="up" data-testid="change" />,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('change');
        await expect(el).not.toHaveAttribute('aria-disabled');
        await expect(getComputedStyle(el).opacity, 'never dimmed').toBe('1');
    },
};
