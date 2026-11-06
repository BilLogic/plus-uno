import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { expectFieldDisabled, expectFieldFocused, expectFieldHovered, expectFieldInvalid, expectFieldReadOnly, fieldBox } from '@/storybook-docs/lib/field-states.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Calendar from '../_internal/Calendar';
import DatePicker from './DatePicker';

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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
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
    },
};

export const Overview = () => (
    <div style={{ paddingBottom: '300px', maxWidth: '300px' }}>
        <DatePicker placeholder="MM/DD/YYYY" />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formDatePicker }
    }
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '300px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT (40)</span>
            <DatePicker spacing="default" placeholder="Default" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">COMPACT (32)</span>
            <DatePicker spacing="compact" placeholder="Compact" />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '300px' }}>
        <p className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
            Empty, with value, disabled, and read-only.
        </p>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
                <DatePicker placeholder="Default" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH VALUE</span>
                <DatePicker value="2023-10-25" placeholder="With Value" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <DatePicker isDisabled placeholder="Disabled" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
                <DatePicker isReadOnly value="2023-10-25" placeholder="Read Only" />
            </div>
        </div>
    </div>
);

export const PickDate = () => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: '300px', maxWidth: '300px' }}>
            <h6 style={{ marginBottom: '16px' }}>Select a Single Date</h6>
            <p style={{ fontSize: '14px', color: 'var(--ds-text-subtle)', marginBottom: '16px' }}>
                Click on the input to open the calendar and select a date.
            </p>
            <DatePicker value={date} onChange={setDate} placeholder="Select a date" />
            {date && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--ds-surface-container)',
                        borderRadius: '4px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '14px' }}>
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
        <div style={{ paddingBottom: '300px', maxWidth: '320px' }}>
            <h6 style={{ marginBottom: '16px' }}>Select a Date Range</h6>
            <p style={{ fontSize: '14px', color: 'var(--ds-text-subtle)', marginBottom: '16px' }}>
                Click a first day, then a last day. The days between are marked.
            </p>
            <DatePicker range value={range} onChange={setRange} />
            {(start || end) && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--ds-surface-container)',
                        borderRadius: '4px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '14px' }}>
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
        <div style={{ paddingBottom: '300px', maxWidth: '300px' }}>
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
        <div style={{ paddingBottom: '300px' }}>
            <p>Selected Date: {date || 'None'}</p>
            <DatePicker {...args} value={date} onChange={setDate} />
        </div>
    );
};
Interactive.args = {
    placeholder: 'Select a date',
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
const wrap = { maxWidth: '300px' };
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
