import React, { useState } from 'react';
import { Button } from '@/components';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { alpha, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import DateTag, { DATE_TAG_APPEARANCES, DATE_TAG_SPACINGS } from './DateTag';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';

/**
 * `DateTag` — a due or event date.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe —
 * rendered text, roles, focus, the tooltip, computed size and color — and
 * never a class name. Colors are compared against the token they should
 * resolve to, read through a probe element.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Labels/Date tag',
    component: DateTag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A due or event date, outlined with a fixed icon. The app picks the '
                    + 'appearance from the date and the due-soon window, never taste.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const grid = { display: 'grid', gap: '12px' };

const SIZE = { default: 20, spacious: 32 };
const PAD = { default: 4, spacious: 12 };

/** [border, text, icon] per appearance. A Date tag is outlined: it has no fill. */
const DATE_LOOK = {
    neutral: ['--ds-border', '--ds-text-subtle', 'fa-calendar'],
    warning: ['--ds-border-warning-subtle', '--ds-text-warning', 'fa-clock'],
    danger: ['--ds-border-danger-subtle', '--ds-text-danger', 'fa-triangle-exclamation'],
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

const iconIn = (el) => el.querySelector('i');

/* ----------------------------------------------------------------- stories */

/** One of each appearance, outlined with its fixed icon: calendar, clock, alert. */
export const Overview = () => (
    <div style={row}>
        <DateTag data-testid="neutral">Due Oct 14</DateTag>
        <DateTag appearance="warning" data-testid="warning">Due tomorrow</DateTag>
        <DateTag appearance="danger" data-testid="danger">2 days overdue</DateTag>
    </div>
);

/** Every appearance at every spacing. */
export const Styles = () => (
    <div style={grid}>
        {DATE_TAG_SPACINGS.map((size) => (
            <div key={size} style={row}>
                <DateTag spacing={size} data-testid={`neutral-${size}`}>Due Oct 14</DateTag>
                <DateTag appearance="warning" spacing={size} data-testid={`warning-${size}`}>Due tomorrow</DateTag>
                <DateTag appearance="danger" spacing={size} data-testid={`danger-${size}`}>2 days overdue</DateTag>
            </div>
        ))}
    </div>
);
Styles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    await inEveryColorModeOf(canvasElement, async (mode, themed) => {
        for (const size of DATE_TAG_SPACINGS) {
            for (const [style, [edge, ink]] of Object.entries(DATE_LOOK)) {
                const el = canvas.getByTestId(`${style}-${size}`);
                const name = `${mode}: ${style}-${size}`;
                await expect(innerBorder(el), `${name} border`).toBe(themed(edge));
                await expect(getComputedStyle(el).color, `${name} text`).toBe(themed(ink));
            }
        }
    });

    for (const size of DATE_TAG_SPACINGS) {
        for (const [style, [edge, ink, icon]] of Object.entries(DATE_LOOK)) {
            const name = `${style}-${size}`;
            const el = canvas.getByTestId(name);
            const s = getComputedStyle(el);
            await expect(el.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
            await expect(px(s.borderRadius), `${name} radius`).toBe(size === 'spacious' ? 8 : 4);
            await expect(alpha(s.backgroundColor), `${name} has no fill`).toBe(0);
            await expect(innerBorder(el), `${name} border`).toBe(token(edge));
            await expect(s.color, `${name} text`).toBe(token(ink));

            const glyph = iconIn(el);
            await expect(glyph, `${name} has an icon`).not.toBeNull();
            await expect(getComputedStyle(glyph, '::before').content, `${name} icon is ${icon}`).toBe(glyphOf(canvasElement, icon));
            await expect(glyph).toHaveAttribute('aria-hidden', 'true');
            await expect(getComputedStyle(glyph).color, `${name} icon color`).toBe(token(ink));
            await expect(px(getComputedStyle(glyph).fontSize), `${name} icon size`).toBe(size === 'spacious' ? 16 : 12);

            const box = el.getBoundingClientRect();
            const label = el.querySelector('.plus-date-tag__label').getBoundingClientRect();
            await expect(box.right - label.right, `${name} right padding`).toBe(PAD[size]);
        }
    }
};

/**
 * Past `maxWidth` (200) the label ends in an ellipsis, and the full text is a
 * tooltip reachable by pointer and by keyboard. A Date tag that fits is not a
 * tab stop.
 */
export const Truncation = () => (
    <div style={row}>
        <Button>Before</Button>
        <DateTag appearance="warning" data-testid="short">Due tomorrow</DateTag>
        <DateTag appearance="danger" data-testid="long">
            This session was due several days ago and still has not been rescheduled
        </DateTag>
    </div>
);
Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const full = 'This session was due several days ago and still has not been rescheduled';
    const long = canvas.getByTestId('long');
    const label = within(long).getByText(full);

    await expect(long.getBoundingClientRect().width, 'capped at 200').toBeLessThanOrEqual(200);
    await expect(label.scrollWidth, 'the label really is clipped').toBeGreaterThan(label.clientWidth);
    await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');

    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await expect(long, 'the truncated Date tag is the next tab stop').toHaveFocus();
    await expect(canvas.getByTestId('short')).not.toHaveAttribute('tabindex');
    const tooltip = await within(document.body).findByRole('tooltip');
    await expect(tooltip).toHaveTextContent(full);
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull());

    await userEvent.hover(long);
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent(full);
    await userEvent.unhover(long);
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull());
};

/**
 * A Date tag is never a button: no button role, no click handler. An
 * `onClick`, a `role` or a `tabIndex` passed to it is dropped with a
 * development warning.
 */
export const NeverAButton = () => {
    const [mounted, setMounted] = useState(false);
    const [clicks, setClicks] = useState(0);
    return (
        <div style={row}>
            <Button onClick={() => setMounted(true)}>Mount a Date tag with onClick</Button>
            <span data-testid="clicks">{clicks}</span>
            {mounted && (
                <DateTag
                    appearance="warning"
                    data-testid="date"
                    onClick={() => setClicks((n) => n + 1)}
                    role="button"
                    tabIndex={0}
                >
                    Due tomorrow
                </DateTag>
            )}
        </div>
    );
};
NeverAButton.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount a Date tag with onClick' }));
        const date = canvas.getByTestId('date');
        for (const name of ['onClick', 'role', 'tabIndex']) {
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining(`\`${name}\` is ignored`));
        }
        await expect(date).not.toHaveAttribute('role');
        await expect(date).not.toHaveAttribute('tabindex');
    } finally {
        warn.mockRestore();
    }
};

/** An unknown appearance falls back to neutral, with a development warning. */
export const UnknownAppearanceFallsBack = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={row}>
            <Button onClick={() => setMounted(true)}>Mount an unknown appearance</Button>
            <DateTag data-testid="neutral">Due Oct 14</DateTag>
            {mounted && <DateTag appearance="success" data-testid="fallback">Due Oct 14</DateTag>}
        </div>
    );
};
UnknownAppearanceFallsBack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount an unknown appearance' }));
        const fallback = canvas.getByTestId('fallback');
        const neutral = canvas.getByTestId('neutral');
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('falls back to neutral'));
        await expect(innerBorder(fallback)).toBe(innerBorder(neutral));
        await expect(getComputedStyle(fallback).color).toBe(getComputedStyle(neutral).color);
        await expect(getComputedStyle(iconIn(fallback), '::before').content).toBe(glyphOf(canvasElement, 'fa-calendar'));
    } finally {
        warn.mockRestore();
    }
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        children: 'Due tomorrow',
        appearance: 'warning',
        spacing: 'default',
        maxWidth: 200,
    },
    argTypes: {
        appearance: { control: 'inline-radio', options: DATE_TAG_APPEARANCES },
        spacing: { control: 'inline-radio', options: DATE_TAG_SPACINGS },
    },
    render: (args) => <DateTag {...args} />,
};

/* ------------------------------------------------------------------- states */

/** Rest, the only state: a date tag is a label, not a control. */
export const Rest = {
    render: () => <DateTag data-testid="date">Due tomorrow</DateTag>,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('date');
        await expect(px(getComputedStyle(el).height), 'default is 20').toBe(20);
        await expect(el).not.toHaveAttribute('tabindex');
    },
};

/** Hovered: nothing changes. */
export const Hovered = {
    render: () => <DateTag data-testid="date">Due tomorrow</DateTag>,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(within(canvasElement).getByTestId('date'), ':hover', 'DateTag');
    },
};

/** Pressed: nothing changes. */
export const Pressed = {
    render: () => <DateTag data-testid="date">Due tomorrow</DateTag>,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(within(canvasElement).getByTestId('date'), ':active', 'DateTag');
    },
};

/** Focused: not in the tab order, so Tab skips it. */
export const Focused = {
    render: () => <DateTag data-testid="date">Due tomorrow</DateTag>,
    play: async ({ canvasElement }) => {
        await expectNotAControl(within(canvasElement).getByTestId('date'), 'DateTag');
    },
};

/** Disabled: there is none. A label is never dimmed; a disabled thing is described by the control beside it. */
export const Disabled = {
    render: () => <DateTag data-testid="date">Due tomorrow</DateTag>,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('date');
        await expect(el).not.toHaveAttribute('aria-disabled');
        await expect(getComputedStyle(el).opacity, 'never dimmed').toBe('1');
    },
};
