import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Calendar from '../_internal/Calendar';
import DatePicker from './DatePicker';

export default {
    title: 'Components/Forms and inputs/Date picker',
    component: DatePicker,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
        ],
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
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design', defaultValue: { summary: 'medium' } },
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
        disabled: {
            control: 'boolean',
            description: 'Disable the picker',
            table: { category: 'Behavior' },
        },
        readOnly: {
            control: 'boolean',
            description: 'Make read-only',
            table: { category: 'Behavior' },
        },
        range: {
            control: 'boolean',
            description: 'Pick a first and a last day',
            table: { category: 'Behavior', defaultValue: { summary: 'false' } },
        },
        invalid: {
            control: 'boolean',
            description: 'Draw the field invalid',
            table: { category: 'Validation' },
        },
        valid: {
            control: 'boolean',
            description: 'Draw the field valid',
            table: { category: 'Validation' },
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
        <DatePicker placeholder="MM/DD/YYYY" size="medium" />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formDatePicker }
    }
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '300px' }}>
        <p className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
            Small, medium, and large trigger and calendar.
        </p>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
                <DatePicker size="small" placeholder="Small" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
                <DatePicker size="medium" placeholder="Medium" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
                <DatePicker size="large" placeholder="Large" />
            </div>
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
                <DatePicker disabled placeholder="Disabled" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
                <DatePicker readOnly value="2023-10-25" placeholder="Read Only" />
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
    size: 'medium',
    disabled: false,
    readOnly: false,
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
