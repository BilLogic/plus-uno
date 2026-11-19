import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import { expectFieldDisabled, expectFieldFocused, expectFieldHovered, expectFieldInvalid, expectFieldReadOnly, fieldBox } from '@/storybook-docs/lib/field-states.js';
import { px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Calendar from '../_internal/Calendar';
import DatePicker from './DatePicker';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Forms and inputs/Date time picker/Date picker',
    component: DatePicker,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A date field that opens a month calendar: one date, or with `range` a first and a last day. Dates can be picked or typed as MM/DD/YYYY.',
            },
        },
    },
    argTypes: {
        children: {
            storyOnly: true,
            table: { disable: true },
        },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: { table: { disable: true } },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: 'Field height: 40 default, 32 compact',
            table: { category: 'Design', defaultValue: { summary: 'default' } },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        calendarAlign: {
            control: 'select',
            options: ['left', 'center', 'right'],
            description: 'Calendar dropdown alignment',
            table: { category: 'Layout' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the picker',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            description: 'Make read-only',
            table: { category: 'Behavior' },
        },
        range: {
            control: 'boolean',
            description: 'Pick a first and a last day',
            table: { category: 'Behavior', defaultValue: { summary: 'false' } },
        },
        isInvalid: {
            control: 'boolean',
            description: 'Draw the field invalid',
            table: { category: 'Validation' },
        },
        isValid: {
            control: 'boolean',
            description: 'Draw the field valid',
            table: { category: 'Validation' },
        },
        value: {
            control: false,
            description: 'ISO `YYYY-MM-DD`; with `range`, `[start, end]`, either end may be `null`.',
            table: { category: 'Content' },
        },
        onChange: {
            control: false,
            description: '`(iso)`, or `([start, end])` with `range`; `\'\'` or nulls when cleared.',
            table: { category: 'Behavior' },
        },
        minDate: {
            control: 'text',
            description: 'Optional minimum allowed date',
            table: { category: 'Behavior' },
        },
        maxDate: {
            control: 'text',
            description: 'Optional maximum allowed date',
            table: { category: 'Behavior' },
        },
        presets: {
            control: 'boolean',
            description: 'Show preset ranges beside the calendar with Clear and Apply actions',
            table: { category: 'Behavior', defaultValue: { summary: 'false' } },
        },
        label: {
            control: 'text',
            description: 'Filter trigger label for the preset range popup',
            table: { category: 'Content' },
        },
    },
};

export const Overview = () => (
    <div style={{ paddingBottom: 'var(--width-1900)', maxWidth: 'var(--width-1900)' }}>
        <DatePicker placeholder="MM/DD/YYYY" />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formDatePicker }
    }
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-2xl)', paddingBottom: 'var(--width-1900)' }}>
        <div>
            <DemoLabel>DEFAULT (40)</DemoLabel>
            <DatePicker spacing="default" placeholder="MM/DD/YYYY" />
        </div>
        <div>
            <DemoLabel>COMPACT (32)</DemoLabel>
            <DatePicker spacing="compact" placeholder="MM/DD/YYYY" />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-2xl)', paddingBottom: 'var(--width-1900)' }}>
        <p className="body-default" style={{ color: 'var(--ds-text-subtle)' }}>
            Empty, with value, disabled, and read-only.
        </p>
        <div style={{ display: 'flex', gap: 'var(--stack-2xl) var(--inline-2xl)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
                <DemoLabel>DEFAULT</DemoLabel>
                <DatePicker placeholder="MM/DD/YYYY" />
            </div>
            <div>
                <DemoLabel>WITH VALUE</DemoLabel>
                <DatePicker value="2023-10-25" placeholder="MM/DD/YYYY" />
            </div>
            <div>
                <DemoLabel>DISABLED</DemoLabel>
                <DatePicker isDisabled placeholder="MM/DD/YYYY" />
            </div>
            <div>
                <DemoLabel>READ ONLY</DemoLabel>
                <DatePicker isReadOnly value="2023-10-25" placeholder="MM/DD/YYYY" />
            </div>
        </div>
    </div>
);

export const PickDate = () => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: 'var(--width-1900)', maxWidth: 'var(--width-1900)' }}>
            <DatePicker aria-label="Session date" value={date} onChange={setDate} placeholder="Select a date" />
            {date && (
                <div
                    style={{
                        marginTop: 'var(--stack-xl)',
                        padding: 'var(--pad-x-md)',
                        backgroundColor: 'var(--ds-surface-sunken)',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    <p className="body-default" style={{ margin: 0 }}>
                        <strong>Selected:</strong> {date}
                    </p>
                </div>
            )}
        </div>
    );
};
PickDate.storyName = 'Pick Date';
PickDate.parameters = {
    docs: {
        description: {
            story: 'Single date selection scenario. User picks one specific date.',
        },
    },
};

export const PickRange = () => {
    const [range, setRange] = useState(['', '']);
    const [start, end] = range;

    return (
        <div style={{ paddingBottom: 'var(--width-1900)', maxWidth: 'var(--field-width-lg)' }}>
            <p className="heading-xxs" style={{ marginBottom: 'var(--stack-xl)' }}>Select a Date Range</p>
            <p className="body-default" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--stack-xl)' }}>
                Click a first day, then a last day. The days between are marked.
            </p>
            <DatePicker range value={range} onChange={setRange} />
            {(start || end) && (
                <div
                    style={{
                        marginTop: 'var(--stack-xl)',
                        padding: 'var(--pad-x-md)',
                        backgroundColor: 'var(--ds-surface-sunken)',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    <p className="body-default" style={{ margin: 0 }}>
                        <strong>Range:</strong> {start || '(not set)'} → {end || '(not set)'}
                    </p>
                </div>
            )}
        </div>
    );
};
PickRange.storyName = 'Pick Range';
PickRange.parameters = {
    docs: {
        description: {
            story: 'One picker with `range`: the first click sets the first day, the second the last. `onChange` receives `[start, end]`.',
        },
    },
};

export const Bounds = () => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: 'var(--width-1900)', maxWidth: 'var(--width-1900)' }}>
            <DatePicker
                value={date}
                onChange={setDate}
                minDate="2026-10-05"
                maxDate="2026-10-23"
                aria-label="Session date"
            />
        </div>
    );
};
Bounds.storyName = 'Earliest and latest dates';
Bounds.parameters = {
    docs: {
        description: {
            story: 'Days before `minDate` or after `maxDate` are disabled. A typed date outside them is kept and marked invalid, and `onChange` is not called.',
        },
    },
};

export const Interactive = (args) => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: 'var(--width-1900)' }}>
            <p className="body-default">Selected Date: {date || 'None'}</p>
            <DatePicker {...args} value={date} onChange={setDate} />
        </div>
    );
};
Interactive.args = {
    placeholder: 'MM/DD/YYYY',
    spacing: 'default',
    isDisabled: false,
    isReadOnly: false,
};

/**
 * The calendar's colors: a picked day is the Lagoon checked fill with
 * `text.inverse`, the days between a range's ends neutral selection, days of
 * the next and last month `text.subtle`.
 */
export const CalendarColors = () => (
    <Calendar
        viewDate={new Date(2020, 2, 1)}
        onViewDateChange={() => {}}
        rangeStart="2020-03-09"
        rangeEnd="2020-03-13"
        onPick={() => {}}
    />
);
CalendarColors.parameters = { docs: { disable: true } };
CalendarColors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const picked = canvas.getByRole('button', { name: /March 9, 2020/ });
    const between = canvas.getByRole('button', { name: /March 11, 2020/ });
    const plain = canvas.getByRole('button', { name: /March 20, 2020/ });
    const outside = canvasElement.querySelector('.plus-calendar-day--outside');
    const month = canvasElement.querySelector('.plus-calendar-month');
    await expect(picked).toHaveClass('plus-calendar-day--selected');
    await expect(between).toHaveClass('plus-calendar-day--in-range');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(picked).backgroundColor, `${mode}: picked day`).toBe(token('--ds-background-selected-bold'));
        await expect(getComputedStyle(picked).color, `${mode}: picked day text`).toBe(token('--ds-text-inverse'));
        await expect(getComputedStyle(between).backgroundColor, `${mode}: in-range day`).toBe(token('--ds-background-selected'));
        await expect(getComputedStyle(plain).color, `${mode}: day text`).toBe(token('--ds-text'));
        await expect(getComputedStyle(outside).color, `${mode}: outside day`).toBe(token('--ds-text-subtle'));
        await expect(getComputedStyle(month).color, `${mode}: month`).toBe(token('--ds-text'));
    });
};

/** One story per state, for the Examples tab. */
const wrap = { maxWidth: 'var(--width-1900)' };
const field = (canvasElement) => within(canvasElement).getByRole('combobox');

export const Default = {
    render: () => <div style={wrap}><DatePicker aria-label="Session date" /></div>,
    play: async ({ canvasElement }) => {
        await expect(field(canvasElement)).toHaveAttribute('placeholder', 'MM/DD/YYYY');
        await expect(field(canvasElement)).toHaveAttribute('aria-expanded', 'false');
    },
};

export const WithValue = {
    render: () => <div style={wrap}><DatePicker aria-label="Session date" value="2026-10-25" /></div>,
    play: async ({ canvasElement }) => {
        await expect(field(canvasElement)).toHaveValue('10/25/2026');
    },
};

export const Compact = {
    render: () => <div style={wrap}><DatePicker aria-label="Session date" spacing="compact" /></div>,
    play: async ({ canvasElement }) => {
        await expect(fieldBox(canvasElement).getBoundingClientRect().height).toBe(32);
    },
};

export const Invalid = {
    render: () => <div style={wrap}><DatePicker aria-label="Session date" isInvalid value="2026-10-25" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldInvalid(canvasElement, fieldBox(canvasElement), 'date picker');
        await expect(field(canvasElement)).toHaveAttribute('aria-invalid', 'true');
    },
};

export const ReadOnly = {
    render: () => <div style={wrap}><DatePicker aria-label="Session date" isReadOnly value="2026-10-25" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldReadOnly(canvasElement, fieldBox(canvasElement), 'date picker');
        // Nothing to open: the calendar icon is not drawn, and a press leaves the calendar shut.
        await expect(canvasElement.querySelector('.plus-date-picker__icon')).toBeNull();
        await expect(field(canvasElement)).toHaveAttribute('aria-readonly', 'true');
        await userEvent.click(field(canvasElement));
        await expect(field(canvasElement)).toHaveAttribute('aria-expanded', 'false');
    },
};

export const Disabled = {
    render: () => <div style={wrap}><DatePicker aria-label="Session date" isDisabled /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldDisabled(fieldBox(canvasElement), 'date picker');
        await expect(field(canvasElement)).toBeDisabled();
    },
};

/** Hover turns the border `border.focused`. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => <div style={wrap}><DatePicker aria-label="Session date" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldHovered(canvasElement, fieldBox(canvasElement), 'date picker');
    },
};

/** Keyboard focus draws the 2px ring, 2px off the box. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <div style={wrap}><DatePicker aria-label="Session date" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldFocused(canvasElement, fieldBox(canvasElement), field(canvasElement), 'date picker');
    },
};

/** Typing a real date and pressing Enter commits the pick. */
PickDate.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox');
    await userEvent.type(input, '10/21/2026{Enter}');
    await expect(within(canvasElement).getByText('Selected:')).toBeVisible();
    await expect(input).not.toHaveAttribute('aria-invalid');
};

/** Two clicks set a range's ends; the field shows both. */
PickRange.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox');
    await userEvent.click(input);
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog');
    const days = () => [...dialog.querySelectorAll('.plus-calendar-day:not(.plus-calendar-day--outside)')];
    await userEvent.click(days()[9]);
    await userEvent.click(days()[13]);
    await waitFor(() => expect(input.value).toContain(' – '));
};

/** A typed date outside minDate to maxDate is kept and marked invalid. */
Bounds.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox');
    await userEvent.type(input, '10/30/2026{Enter}');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveValue('10/30/2026');
};

const page = within(document.body);
const calendar = () => document.body.querySelector('.plus-date-popup');
const box = (input) => input.closest('.plus-field').getBoundingClientRect();

/** The calendar opens 4px under the field, its left edge on the field's. */
export const CalendarOpensFourPixelsBelow = () => (
    <div style={{ maxWidth: '296px' /* token gap: 296px */, marginLeft: 'var(--pad-x-lg)' }}>
        <DatePicker aria-label="Session date" value="2026-10-21" />
    </div>
);
CalendarOpensFourPixelsBelow.parameters = { docs: { disable: true } };
CalendarOpensFourPixelsBelow.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Session date' });
    await userEvent.click(input);
    await waitFor(() => expect(calendar()).toBeVisible());
    const rect = box(input);
    const popup = calendar().getBoundingClientRect();
    await expect(calendar()).toHaveAttribute('data-placement', 'bottom');
    await expect(Math.round(popup.top - rect.bottom)).toBe(4);
    await expect(Math.round(popup.left)).toBe(Math.round(rect.left));
};

/** With no room below, the calendar opens above, the same 4px away. */
export const CalendarFlipsAboveNearTheBottom = () => (
    <div style={{ position: 'fixed', left: 'var(--pad-x-lg)', bottom: 'var(--stack-xl)', width: '296px' /* token gap: 296px */ }}>
        <DatePicker aria-label="Session date" value="2026-10-21" />
    </div>
);
CalendarFlipsAboveNearTheBottom.parameters = { docs: { disable: true } };
CalendarFlipsAboveNearTheBottom.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Session date' });
    await userEvent.click(input);
    await waitFor(() => expect(calendar()).toHaveAttribute('data-placement', 'top'));
    const rect = box(input);
    const popup = calendar().getBoundingClientRect();
    await expect(Math.round(rect.top - popup.bottom)).toBe(4);
};

/** Two clicks pick a range: the first day, then the last; the days between are marked. */
export const RangePicksASpan = (args) => {
    const [value, setValue] = useState(['2026-10-05', '2026-10-06']);
    return (
        <div style={{ maxWidth: '296px' }}>
            <DatePicker
                aria-label="Report period"
                range
                value={value}
                onChange={(next) => { setValue(next); args.onChange(next); }}
            />
        </div>
    );
};
RangePicksASpan.args = { onChange: fn() };
RangePicksASpan.parameters = { docs: { disable: true } };
RangePicksASpan.play = async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Report period' });
    await expect(input).toHaveValue('10/05/2026 – 10/06/2026');
    await userEvent.click(input);

    // A click on a full range starts a new one.
    await userEvent.click(await page.findByRole('button', { name: /October 19, 2026/ }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['2026-10-19', null]);
    await userEvent.click(page.getByRole('button', { name: /October 23, 2026/ }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['2026-10-19', '2026-10-23']);

    await waitFor(() => expect(input).toHaveValue('10/19/2026 – 10/23/2026'));
    await userEvent.click(input);
    const day = (n) => page.getByRole('button', { name: new RegExp(`October ${n}, 2026`) });
    await expect(day(19)).toHaveAttribute('aria-pressed', 'true');
    await expect(day(23)).toHaveAttribute('aria-pressed', 'true');
    for (const n of [20, 21, 22]) await expect(day(n)).toHaveAttribute('data-in-range', 'true');
    await expect(day(24)).not.toHaveAttribute('data-in-range');
};

/** Days before the earliest date or after the latest can't be picked. */
export const BoundedDatesBehavior = () => (
    <div style={{ maxWidth: '296px' }}>
        <DatePicker aria-label="Session date" value="2026-10-21" minDate="2026-10-12" maxDate="2026-10-25" />
    </div>
);
BoundedDatesBehavior.parameters = { docs: { disable: true } };
BoundedDatesBehavior.play = async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Session date' }));
    const day = (n) => page.getByRole('button', { name: new RegExp(`October ${n}, 2026`) });
    await waitFor(() => expect(day(11)).toBeDisabled());
    await expect(day(26)).toBeDisabled();
    await expect(day(12)).toBeEnabled();
    await expect(day(25)).toBeEnabled();
};

/** A typed date is checked against the same span the calendar enforces. */
export const TypedEntry = (args) => (
    <div style={{ maxWidth: '296px' }}>
        <DatePicker aria-label="Session date" maxDate="2026-10-25" onChange={args.onChange} />
    </div>
);
TypedEntry.args = { onChange: fn() };
TypedEntry.parameters = { docs: { disable: true } };
TypedEntry.play = async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Session date' });

    await userEvent.click(input);
    await userEvent.type(input, '10/21/2026{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('2026-10-21');
    await expect(input).toHaveValue('10/21/2026');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');

    // The calendar follows the typed date.
    await userEvent.click(input);
    await waitFor(() => expect(page.getByRole('button', { name: /October 21, 2026/ })).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.keyboard('{Escape}');

    // Past the latest date: kept as typed, marked invalid, not reported.
    args.onChange.mockClear();
    await userEvent.clear(input);
    await userEvent.type(input, '11/30/2026');
    await userEvent.tab();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveValue('11/30/2026');
    await expect(args.onChange).not.toHaveBeenCalled();
};

/** Regression cover for #331: every day button announces its full date and selected state. */
export const DaysAnnounceTheirDate = () => {
    const [date, setDate] = useState('2026-08-17');
    return (
        <div style={{ maxWidth: '360px' }}>
            <label htmlFor="dpd-starts">Session date</label>
            <DatePicker id="dpd-starts" value={date} onChange={setDate} />
        </div>
    );
};
DaysAnnounceTheirDate.parameters = { docs: { disable: true } };
DaysAnnounceTheirDate.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Session date' });

    await userEvent.click(trigger);

    const seventeenth = await waitFor(() => page.getByRole('button', { name: /August 17, 2026/ }));
    await expect(px(getComputedStyle(page.getByRole('button', { name: 'Previous month' }).querySelector('i')).fontSize), 'calendar chevron is --icon-sm').toBe(tokenLength(canvasElement, '--icon-sm'));
    await expect(seventeenth).toBeTruthy();
    await expect(seventeenth.getAttribute('aria-pressed')).toBe('true');

    const pressed = page.getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true');
    await expect(pressed).toHaveLength(1);

    const eighteenth = page.getByRole('button', { name: /August 18, 2026/ });
    await expect(eighteenth.getAttribute('aria-pressed')).toBe('false');
};

/** Plain ✕ in the field and Clear in the calendar footer appear with a value, empty it, and keep focus in the field. */
export const ClearControl = (args) => {
    const [value, setValue] = useState('');
    const [span, setSpan] = useState(['2026-10-05', '2026-10-06']);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', maxWidth: '296px' }}>
            <DatePicker
                aria-label="Session date"
                value={value}
                onChange={(next) => { setValue(next); args.onChange(next); }}
            />
            <DatePicker
                aria-label="Report period"
                range
                value={span}
                onChange={(next) => { setSpan(next); args.onRangeChange(next); }}
            />
        </div>
    );
};
ClearControl.args = { onChange: fn(), onRangeChange: fn() };
ClearControl.parameters = { docs: { disable: true } };
ClearControl.play = async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Session date' });

    // Empty: neither the field ✕ nor the footer Clear is rendered.
    await expect(canvas.queryByRole('button', { name: 'Clear session date' })).toBeNull();
    await userEvent.click(input);
    await waitFor(() => expect(calendar()).toBeVisible());
    await expect(within(calendar()).queryByRole('button', { name: 'Clear' })).toBeNull();
    await expect(canvasElement.querySelector('.fa-circle-xmark')).toBeNull();
    await expect(calendar().querySelector('.fa-circle-xmark')).toBeNull();

    // Typed invalid text still shows the field ✕, and clicking it clears the text and invalid state.
    await userEvent.type(input, '13/45/2026{Enter}');
    await expect(input).toHaveValue('13/45/2026');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const invalidClear = canvas.getByRole('button', { name: 'Clear session date' });
    await userEvent.click(invalidClear);
    await expect(input).toHaveValue('');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear session date' })).toBeNull();

    // Pick a date: the plain ✕ appears in the field (subtle icon button, icon-sm, no circular cross).
    await userEvent.type(input, '10/21/2026{Enter}');
    await expect(input).toHaveValue('10/21/2026');
    const fieldClear = canvas.getByRole('button', { name: 'Clear session date' });
    await expect(fieldClear).toHaveClass('plus-btn--subtle');
    await expect(fieldClear).toHaveAttribute('tabindex', '-1');
    const xmark = fieldClear.querySelector('.fa-solid.fa-xmark');
    await expect(xmark).not.toBeNull();
    await expect(canvasElement.querySelector('.fa-circle-xmark')).toBeNull();
    const tokenPx = parseFloat(getComputedStyle(canvasElement).getPropertyValue('--icon-sm')) || 12;
    await expect(parseFloat(getComputedStyle(xmark).fontSize)).toBe(tokenPx);

    // Clicking the field ✕ empties the value, calls onChange(''), and keeps focus in the field.
    args.onChange.mockClear();
    await userEvent.click(fieldClear);
    await expect(input).toHaveValue('');
    await expect(args.onChange).toHaveBeenLastCalledWith('');
    await expect(input).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear session date' })).toBeNull();

    // Set a date again and open the calendar: footer Clear is a tab stop, empties the value, and keeps focus in the field.
    await userEvent.type(input, '10/25/2026{Enter}');
    await expect(input).toHaveValue('10/25/2026');
    await userEvent.click(input);
    await waitFor(() => expect(calendar()).toBeVisible());
    await expect(calendar().querySelector('.fa-circle-xmark')).toBeNull();
    const footerClear = within(calendar().querySelector('.plus-listbox-footer')).getByRole('button', { name: 'Clear' });
    await expect(footerClear).toHaveClass('plus-btn--subtle');
    await expect(footerClear).not.toHaveAttribute('tabindex', '-1');

    args.onChange.mockClear();
    await userEvent.click(footerClear);
    await expect(input).toHaveValue('');
    await expect(args.onChange).toHaveBeenLastCalledWith('');
    await expect(input).toHaveFocus();

    // Range DatePicker: clicking the field ✕ empties the span to [null, null] and keeps focus in the field.
    const rangeInput = canvas.getByRole('combobox', { name: 'Report period' });
    const rangeFieldClear = canvas.getByRole('button', { name: 'Clear report period' });
    args.onRangeChange.mockClear();
    await userEvent.click(rangeFieldClear);
    await expect(rangeInput).toHaveValue('');
    await expect(args.onRangeChange).toHaveBeenLastCalledWith([null, null]);
    await expect(rangeInput).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear report period' })).toBeNull();

    // Range DatePicker: footer Clear also empties the span to [null, null] and keeps focus in the field.
    await userEvent.type(rangeInput, '10/05/2026 – 10/06/2026{Enter}');
    await expect(rangeInput).toHaveValue('10/05/2026 – 10/06/2026');
    await userEvent.click(rangeInput);
    const rangeDialog = await page.findByRole('dialog', { name: 'Choose dates' });
    args.onRangeChange.mockClear();
    await userEvent.click(within(rangeDialog.querySelector('.plus-listbox-footer')).getByRole('button', { name: 'Clear' }));
    await expect(rangeInput).toHaveValue('');
    await expect(args.onRangeChange).toHaveBeenLastCalledWith([null, null]);
    await expect(rangeInput).toHaveFocus();
};

/** Turning a month inside the DatePicker popup keeps the popup height unchanged mid-turn and after. */
export const MonthTurnKeepsPopupHeight = () => (
    <div style={{ maxWidth: '296px' }}>
        <DatePicker aria-label="Session date" value="2026-10-21" />
    </div>
);
MonthTurnKeepsPopupHeight.parameters = { docs: { disable: true } };
MonthTurnKeepsPopupHeight.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Session date' });
    await userEvent.click(input);
    const popup = await waitFor(() => {
        const el = calendar();
        if (!el) throw new Error('DatePicker popup not open yet');
        return el;
    });
    await settleAnimations(popup);
    const initialHeight = popup.getBoundingClientRect().height;

    await userEvent.click(within(popup).getByRole('button', { name: 'Next month' }));
    await waitFor(() => {
        if (!popup.querySelector('[data-view-role="previous"]')) {
            throw new Error('Expected previous month view during slide');
        }
    });
    await expect(Math.round(popup.getBoundingClientRect().height), 'popup height unchanged mid-turn').toBe(Math.round(initialHeight));
    await settleAnimations(popup);
    await expect(within(popup).getByText('November 2026')).toBeVisible();
    await expect(Math.round(popup.getBoundingClientRect().height), 'popup height unchanged after turn').toBe(Math.round(initialHeight));
};

/**
 * Filter trigger ("Created: All time") opening the 400px preset range popup:
 * 160px presets left, 192px 24px-day range calendar right, continuous band with
 * week-edge rounding, days after today disabled, and Clear/Apply compact buttons.
 */
export const RangePopup = {
    args: {
        onChange: fn(),
        today: '2026-10-21',
    },
    render: ({ onChange, today }) => {
        const [range, setRange] = useState([null, null]);
        return (
            <div style={{ paddingBottom: 'var(--width-2500)' }}>
                <DatePicker
                    range
                    presets
                    label="Created"
                    today={today}
                    value={range}
                    onChange={(next) => {
                        setRange(next);
                        onChange?.(next);
                    }}
                />
            </div>
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        const trigger = canvas.getByRole('button', { name: 'Created: All time' });
        await userEvent.click(trigger);

        const popup = await page.findByRole('dialog', { name: 'Created' });
        await settleAnimations(popup);

        await expect(Math.round(popup.getBoundingClientRect().width), 'popup width').toBe(400);
        const presetColumn = popup.querySelector('.plus-date-range-popup__presets');
        await expect(Math.round(presetColumn.getBoundingClientRect().width), 'preset column width').toBe(160);
        const calendarColumn = popup.querySelector('.plus-date-range-popup__calendar');
        await expect(Math.round(calendarColumn.getBoundingClientRect().width), 'calendar column width').toBe(192);

        const presetRows = within(presetColumn).getAllByRole('radio');
        await expect(presetRows.map((row) => row.textContent)).toEqual(['All time', 'Today', 'Last 7 days', 'Last 30 days']);
        await expect(Math.round(presetRows[0].getBoundingClientRect().height), 'preset row height').toBe(32);

        const clearBtn = within(popup).getByRole('button', { name: 'Clear' });
        const applyBtn = within(popup).getByRole('button', { name: 'Apply' });
        await expect(Math.round(clearBtn.getBoundingClientRect().height), 'Clear height').toBe(24);
        await expect(Math.round(applyBtn.getBoundingClientRect().height), 'Apply height').toBe(24);
        await expect(applyBtn).toBeDisabled();

        // Days after today (2026-10-21) are disabled when looking back.
        await expect(within(popup).getByRole('button', { name: /October 22, 2026/ })).toBeDisabled();

        // Picking one end keeps Apply disabled; picking the second end enables Apply.
        await userEvent.click(within(popup).getByRole('button', { name: /October 8, 2026/ }));
        await expect(applyBtn).toBeDisabled();
        await userEvent.click(within(popup).getByRole('button', { name: /October 13, 2026/ }));
        await expect(applyBtn).toBeEnabled();

        // Range band: mid-week day is unrounded (0px); week-end / week-start round on outer corners.
        const midWeekStyle = getComputedStyle(within(popup).getByRole('button', { name: /October 9, 2026/ }));
        await expect(px(midWeekStyle.borderTopLeftRadius), 'mid-week top-left').toBe(0);
        await expect(px(midWeekStyle.borderTopRightRadius), 'mid-week top-right').toBe(0);
        await expect(px(midWeekStyle.borderBottomRightRadius), 'mid-week bottom-right').toBe(0);
        await expect(px(midWeekStyle.borderBottomLeftRadius), 'mid-week bottom-left').toBe(0);

        const weekEndStyle = getComputedStyle(within(popup).getByRole('button', { name: /October 10, 2026/ }));
        await expect(px(weekEndStyle.borderTopLeftRadius), 'week-end top-left').toBe(0);
        await expect(px(weekEndStyle.borderBottomLeftRadius), 'week-end bottom-left').toBe(0);
        await expect(px(weekEndStyle.borderTopRightRadius), 'week-end top-right').toBeGreaterThan(0);
        await expect(px(weekEndStyle.borderBottomRightRadius), 'week-end bottom-right').toBeGreaterThan(0);

        const weekStartStyle = getComputedStyle(within(popup).getByRole('button', { name: /October 11, 2026/ }));
        await expect(px(weekStartStyle.borderTopLeftRadius), 'week-start top-left').toBeGreaterThan(0);
        await expect(px(weekStartStyle.borderBottomLeftRadius), 'week-start bottom-left').toBeGreaterThan(0);
        await expect(px(weekStartStyle.borderTopRightRadius), 'week-start top-right').toBe(0);
        await expect(px(weekStartStyle.borderBottomRightRadius), 'week-start bottom-right').toBe(0);

        await userEvent.click(applyBtn);
        await waitFor(() => expect(canvasElement.ownerDocument.querySelector('.plus-date-range-popup')).toBeNull());
        await expect(args.onChange).toHaveBeenLastCalledWith(['2026-10-08', '2026-10-13']);
        await expect(canvas.getByRole('button', { name: 'Created: 10/08/2026 – 10/13/2026' })).toBeVisible();

        // Selecting a preset and clicking Apply updates the filter trigger label.
        await userEvent.click(canvas.getByRole('button', { name: 'Created: 10/08/2026 – 10/13/2026' }));
        const reopened = await page.findByRole('dialog', { name: 'Created' });
        await settleAnimations(reopened);
        await userEvent.click(within(reopened).getByRole('radio', { name: 'Last 7 days' }));
        await userEvent.click(within(reopened).getByRole('button', { name: 'Apply' }));
        await expect(args.onChange).toHaveBeenLastCalledWith(['2026-10-15', '2026-10-21']);
        await expect(canvas.getByRole('button', { name: 'Created: Last 7 days' })).toBeVisible();
    },
};

export const RangePopupPresetKeyboard = {
    args: {
        onChange: fn(),
        today: '2026-10-21',
    },
    parameters: { docs: { disable: true } },
    render: ({ onChange, today }) => {
        const [range, setRange] = useState([null, null]);
        return (
            <div style={{ paddingBottom: 'var(--width-2500)' }}>
                <DatePicker
                    range
                    presets
                    label="Created"
                    today={today}
                    value={range}
                    onChange={(next) => {
                        setRange(next);
                        onChange?.(next);
                    }}
                />
            </div>
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(canvas.getByRole('button', { name: 'Created: All time' }));

        const popup = await page.findByRole('dialog', { name: 'Created' });
        await settleAnimations(popup);

        const allTime = within(popup).getByRole('radio', { name: 'All time' });
        const todayItem = within(popup).getByRole('radio', { name: 'Today' });
        const last7 = within(popup).getByRole('radio', { name: 'Last 7 days' });

        allTime.focus();
        await expect(allTime).toHaveAttribute('tabindex', '0');
        await expect(todayItem).toHaveAttribute('tabindex', '-1');

        await userEvent.keyboard('{ArrowDown}');
        await expect(todayItem).toHaveFocus();
        await expect(todayItem).toHaveAttribute('aria-checked', 'true');
        await expect(todayItem).toHaveAttribute('tabindex', '0');
        await expect(allTime).toHaveAttribute('tabindex', '-1');

        await userEvent.keyboard('{ArrowDown}');
        await expect(last7).toHaveFocus();
        await expect(last7).toHaveAttribute('aria-checked', 'true');

        await userEvent.keyboard('{ArrowUp}');
        await expect(todayItem).toHaveFocus();
        await expect(todayItem).toHaveAttribute('aria-checked', 'true');

        last7.focus();
        await userEvent.keyboard('{Enter}');
        await expect(last7).toHaveAttribute('aria-checked', 'true');

        todayItem.focus();
        await userEvent.keyboard(' ');
        await expect(todayItem).toHaveAttribute('aria-checked', 'true');

        await userEvent.click(within(popup).getByRole('button', { name: 'Apply' }));
        await expect(args.onChange).toHaveBeenLastCalledWith(['2026-10-21', '2026-10-21']);
    },
};

export const RangePopupClearCommits = {
    args: {
        onChange: fn(),
        today: '2026-10-21',
    },
    parameters: { docs: { disable: true } },
    render: ({ onChange, today }) => {
        const [range, setRange] = useState(['2026-10-08', '2026-10-13']);
        return (
            <div style={{ paddingBottom: 'var(--width-2500)' }}>
                <DatePicker
                    range
                    presets
                    label="Created"
                    today={today}
                    value={range}
                    onChange={(next) => {
                        setRange(next);
                        onChange?.(next);
                    }}
                />
            </div>
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        const trigger = canvas.getByRole('button', { name: 'Created: 10/08/2026 – 10/13/2026' });
        await userEvent.click(trigger);

        const popup = await page.findByRole('dialog', { name: 'Created' });
        await settleAnimations(popup);

        await userEvent.click(within(popup).getByRole('button', { name: 'Clear' }));
        await expect(args.onChange).toHaveBeenLastCalledWith([null, null]);
        await expect(canvas.getByRole('button', { name: 'Created: All time' })).toBeVisible();

        const applyBtn = within(popup).getByRole('button', { name: 'Apply' });
        await expect(applyBtn).toBeDisabled();

        // Incomplete single-day draft keeps Apply disabled.
        await userEvent.click(within(popup).getByRole('button', { name: /October 15, 2026/ }));
        await expect(applyBtn).toBeDisabled();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvasElement.ownerDocument.querySelector('.plus-date-range-popup')).toBeNull());

        await userEvent.click(canvas.getByRole('button', { name: 'Created: All time' }));
        const reopened = await page.findByRole('dialog', { name: 'Created' });
        await settleAnimations(reopened);
        await expect(reopened.querySelectorAll('[aria-pressed="true"]').length).toBe(0);
        await expect(within(reopened).getByRole('button', { name: 'Apply' })).toBeDisabled();
    },
};

export const RangePopupPresetBounds = {
    args: {
        onChange: fn(),
        today: '2026-10-21',
    },
    parameters: { docs: { disable: true } },
    render: ({ onChange, today }) => {
        const [range, setRange] = useState([null, null]);
        return (
            <div style={{ paddingBottom: 'var(--width-2500)', display: 'flex', gap: 'var(--inline-lg)' }}>
                <DatePicker
                    range
                    presets
                    label="Created"
                    today={today}
                    minDate="2026-10-20"
                    value={range}
                    onChange={(next) => {
                        setRange(next);
                        onChange?.(next);
                    }}
                />
                <DatePicker
                    range
                    presets
                    label="Stale"
                    today={today}
                    minDate="2026-10-20"
                    value={['2026-10-15', '2026-10-21']}
                    onChange={onChange}
                />
            </div>
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        await userEvent.click(canvas.getByRole('button', { name: 'Created: All time' }));

        const popup = await page.findByRole('dialog', { name: 'Created' });
        await settleAnimations(popup);

        const allTime = within(popup).getByRole('radio', { name: 'All time' });
        const todayItem = within(popup).getByRole('radio', { name: 'Today' });
        const last7 = within(popup).getByRole('radio', { name: 'Last 7 days' });
        const last30 = within(popup).getByRole('radio', { name: 'Last 30 days' });

        await expect(allTime).not.toHaveAttribute('aria-disabled', 'true');
        await expect(todayItem).not.toHaveAttribute('aria-disabled', 'true');
        await expect(last7).toHaveAttribute('aria-disabled', 'true');
        await expect(last30).toHaveAttribute('aria-disabled', 'true');

        await userEvent.click(last7);
        await expect(within(popup).getByRole('button', { name: 'Apply' })).toBeDisabled();
        await expect(args.onChange).not.toHaveBeenCalled();

        // Arrow navigation skips disabled presets.
        allTime.focus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(todayItem).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(allTime).toHaveFocus();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvasElement.ownerDocument.querySelector('.plus-date-range-popup')).toBeNull());

        // An out-of-bounds value cannot be committed by Apply.
        await userEvent.click(canvas.getByRole('button', { name: /Stale:/ }));
        const stalePopup = await page.findByRole('dialog', { name: 'Stale' });
        await settleAnimations(stalePopup);
        const staleApply = within(stalePopup).getByRole('button', { name: 'Apply' });
        await expect(staleApply).toBeDisabled();
        staleApply.click();
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};

export const RangePopupReadOnly = {
    args: {
        onChange: fn(),
        today: '2026-10-21',
    },
    parameters: { docs: { disable: true } },
    render: ({ onChange, today }) => (
        <DatePicker
            range
            presets
            label="Created"
            today={today}
            isReadOnly
            value={['2026-10-08', '2026-10-13']}
            onChange={onChange}
        />
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Created: 10/08/2026 – 10/13/2026' });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(trigger);
        trigger.focus();
        await userEvent.keyboard('{Enter}');

        await expect(canvasElement.ownerDocument.querySelector('[role="dialog"]')).toBeNull();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};


