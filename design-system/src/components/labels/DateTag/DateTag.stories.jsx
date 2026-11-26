import React, { useState } from 'react';
import { Button, Calendar } from '@/components';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { alpha, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import DateTag, { DATE_TAG_APPEARANCES, DATE_TAG_SPACINGS } from './DateTag';
import { expectGroundUnder, expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';

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

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-xl) var(--inline-xl)', alignItems: 'center' };
const grid = { display: 'grid', gap: 'var(--stack-lg)' };

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

/* --------------------------------------------------------------- with a menu */

/** The calendar a Date tag opens: pick a day and the popup keeps showing it. */
const PickCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date(2026, 10, 1));
    const [selected, setSelected] = useState('2026-11-27');
    return <Calendar viewDate={viewDate} onViewDateChange={setViewDate} selected={selected} onPick={setSelected} />;
};

const LABELS = { neutral: 'Due Dec 4', warning: 'Due tomorrow', danger: '2 days overdue' };
const CHEVRON_BOX = { default: 12, spacious: 16 };
const MENU_GAP = { default: 4, spacious: 6 };

/** Every appearance at both spacings, each a calendar trigger. */
const MenuMatrix = ({ tagProps = {} }) => (
    <div style={grid}>
        {DATE_TAG_SPACINGS.map((size) => (
            <div key={size} style={row}>
                {DATE_TAG_APPEARANCES.map((appearance) => (
                    <DateTag
                        key={appearance}
                        appearance={appearance}
                        spacing={size}
                        menu={<PickCalendar />}
                        aria-label={`Due date, Session 12: ${LABELS[appearance]}`}
                        data-testid={`${appearance}-${size}`}
                        {...tagProps}
                    >
                        {LABELS[appearance]}
                    </DateTag>
                ))}
            </div>
        ))}
    </div>
);

const eachMenuTag = async (canvasElement, check) => {
    const canvas = within(canvasElement);
    for (const size of DATE_TAG_SPACINGS) {
        for (const appearance of DATE_TAG_APPEARANCES) {
            await check(canvas.getByTestId(`${appearance}-${size}`), appearance, size, `${appearance}-${size}`);
        }
    }
};

/** The popup is portaled out of the canvas, so it is found from the document. */
const inDocument = (canvasElement) => within(canvasElement.ownerDocument.body);

/**
 * With a `menu`, normally a Calendar, the tag is a button that opens it in a
 * Popup. Same outline as the label, plus the `angle-down` chevron: 12 in a
 * default tag, 16 in a spacious one, with equal padding on both sides.
 */
export const WithCalendar = () => <MenuMatrix />;
WithCalendar.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        const [border, ink] = DATE_LOOK[appearance];
        const s = getComputedStyle(el);
        await expect(el.tagName, `${name} is a button`).toBe('BUTTON');
        await expect(el, `${name} has a popup`).toHaveAttribute('aria-haspopup');
        await expect(el, `${name} is closed`).toHaveAttribute('aria-expanded', 'false');
        await expect(el.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
        await expect(alpha(s.backgroundColor), `${name} has no fill at rest`).toBe(0);
        await expect(s.color, `${name} text`).toBe(tokenColor(canvasElement, ink));
        await expect(innerBorder(el), `${name} edge`).toBe(tokenColor(canvasElement, border));

        const box = el.getBoundingClientRect();
        const icon = el.querySelector('.plus-date-tag__visual').getBoundingClientRect();
        const label = within(el).getByText(LABELS[appearance]).getBoundingClientRect();
        const chevron = el.querySelector('.plus-date-tag__chevron');
        const glyph = chevron.querySelector('i');
        await expect(getComputedStyle(glyph, '::before').content, `${name} draws angle-down`).toBe(glyphOf(canvasElement, 'fa-angle-down'));
        await expect(px(getComputedStyle(glyph).fontSize), `${name} chevron size`).toBe(CHEVRON_BOX[size]);
        await expect(icon.left - box.left, `${name} leading padding`).toBe(PAD[size]);
        await expect(box.right - chevron.getBoundingClientRect().right, `${name} trailing padding`).toBe(PAD[size]);
        await expect(chevron.getBoundingClientRect().left - label.right, `${name} gap before the chevron`).toBe(MENU_GAP[size]);
    });
};

/** Rest: no fill, outlined, in the tab order. */
export const CalendarRest = () => <MenuMatrix />;
CalendarRest.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expect(el, `${name} is enabled`).toBeEnabled();
        await expect(getComputedStyle(el).cursor, `${name} cursor`).toBe('pointer');
    });
};

/** Hovered: the neutral subtle hovered background. The outline stays. */
export const CalendarHovered = () => <MenuMatrix />;
CalendarHovered.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expectGroundUnder(canvasElement, el, ':hover', '--ds-background-neutral-subtle-hovered', name);
        await expect(innerBorder(el), `${name} keeps its edge`).toBe(tokenColor(canvasElement, DATE_LOOK[appearance][0]));
    });
};

/** Pressed: the neutral subtle pressed background. */
export const CalendarPressed = () => <MenuMatrix />;
CalendarPressed.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expectGroundUnder(canvasElement, el, ':active', '--ds-background-neutral-subtle-pressed', name);
    });
};

/** Focused: the standard focus ring. */
export const CalendarFocused = () => <MenuMatrix />;
CalendarFocused.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await userEvent.tab();
        await expect(el, `${name} takes focus from Tab`).toHaveFocus();
        const s = getComputedStyle(el);
        await expect(s.outlineStyle, `${name} ring`).toBe('solid');
        await expect(s.outlineColor, `${name} ring color`).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(px(s.outlineWidth), `${name} ring width`).toBe(2);
    });
};

/** Open: the Calendar shows in a Popup, the tag is drawn selected (the pressed background) and the chevron flips to `angle-up`. */
export const CalendarOpen = () => <MenuMatrix />;
CalendarOpen.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await userEvent.click(el);
        await waitFor(() => expect(el, `${name} reports open`).toHaveAttribute('aria-expanded', 'true'));
        await waitFor(async () => expect(await doc.findByRole('dialog'), `${name} opens a popup`).toBeVisible());
        await expect(doc.getByRole('button', { name: /November 27/ }), `${name} shows the current day picked`).toHaveAttribute('aria-pressed', 'true');
        await expectGroundUnder(canvasElement, el, undefined, '--ds-background-neutral-subtle-pressed', `${name} open`);
        await expect(getComputedStyle(el.querySelector('.plus-date-tag__chevron i'), '::before').content, `${name} draws angle-up`)
            .toBe(glyphOf(canvasElement, 'fa-angle-up'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(doc.queryByRole('dialog')).toBeNull());
    });
};

/** Loading: the content hides but keeps its width; one spinner, 12 on default and 16 on spacious, sits centered. */
export const CalendarLoading = () => (
    <div style={grid}>
        <MenuMatrix tagProps={{ isLoading: true }} />
        <div style={row}>
            {DATE_TAG_SPACINGS.map((size) => (
                <React.Fragment key={size}>
                    <DateTag spacing={size} menu={<PickCalendar />} aria-label="Due date, at rest" data-testid={`rest-${size}`}>Due tomorrow</DateTag>
                    <DateTag spacing={size} menu={<PickCalendar />} aria-label="Due date, loading" isLoading data-testid={`loading-${size}`}>Due tomorrow</DateTag>
                </React.Fragment>
            ))}
        </div>
    </div>
);
CalendarLoading.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expect(el, `${name} is busy`).toHaveAttribute('aria-busy', 'true');
        await expect(el.querySelectorAll('.plus-spinner'), `${name} has one spinner`).toHaveLength(1);
        const spinner = el.querySelector('.plus-spinner');
        await expect(spinner.getBoundingClientRect().width, `${name} spinner size`).toBe(CHEVRON_BOX[size]);
        const box = el.getBoundingClientRect();
        const ring = spinner.getBoundingClientRect();
        await expect(Math.abs((ring.left + ring.width / 2) - (box.left + box.width / 2)), `${name} spinner centered across`).toBeLessThan(1);
        await expect(Math.abs((ring.top + ring.height / 2) - (box.top + box.height / 2)), `${name} spinner centered down`).toBeLessThan(1);
        await expect(getComputedStyle(el.querySelector('.plus-date-tag__content')).opacity, `${name} content hidden`).toBe('0');
    });
    for (const size of DATE_TAG_SPACINGS) {
        await expect(canvas.getByTestId(`loading-${size}`).getBoundingClientRect().width, `${size} keeps its width while loading`)
            .toBe(canvas.getByTestId(`rest-${size}`).getBoundingClientRect().width);
    }
};

/** Disabled: the disabled text and edge, no fill, never an opacity fade, and it does not open. */
export const CalendarDisabled = () => <MenuMatrix tagProps={{ isDisabled: true }} />;
CalendarDisabled.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        const s = getComputedStyle(el);
        await expect(el, `${name} is disabled`).toBeDisabled();
        await expect(s.color, `${name} text`).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
        await expect(innerBorder(el), `${name} edge`).toBe(tokenColor(canvasElement, '--ds-border-disabled'));
        await expect(s.opacity, `${name} is never faded`).toBe('1');
        await userEvent.click(el, { pointerEventsCheck: 0 });
        await expect(doc.queryByRole('dialog'), `${name} does not open`).toBeNull();
    });
};

/**
 * Keyboard: Enter and Space open the popup; Escape closes it and returns focus
 * to the tag.
 */
export const CalendarKeyboard = () => (
    <DateTag appearance="warning" menu={<PickCalendar />} aria-label="Due date, Session 12: Due tomorrow" data-testid="keyboard">Due tomorrow</DateTag>
);
CalendarKeyboard.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    const el = within(canvasElement).getByTestId('keyboard');
    await userEvent.tab();
    await expect(el).toHaveFocus();
    for (const key of ['{Enter}', ' ']) {
        await userEvent.keyboard(key);
        await waitFor(async () => expect(await doc.findByRole('dialog'), `${JSON.stringify(key)} opens the popup`).toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(doc.queryByRole('dialog')).toBeNull());
        await expect(el, 'Escape returns focus to the tag').toHaveFocus();
    }
};

/** The accessible name reads "<field>, <record>: <date>". */
export const CalendarAccessibleName = () => (
    <DateTag appearance="warning" menu={<PickCalendar />} aria-label="Due date, Session 12: Due tomorrow" data-testid="named">Due tomorrow</DateTag>
);
CalendarAccessibleName.play = async ({ canvasElement }) => {
    const el = within(canvasElement).getByTestId('named');
    await expect(el).toHaveAccessibleName('Due date, Session 12: Due tomorrow');
    await expect(el).toHaveAttribute('aria-haspopup');
    await expect(el).toHaveAttribute('aria-expanded', 'false');
};
