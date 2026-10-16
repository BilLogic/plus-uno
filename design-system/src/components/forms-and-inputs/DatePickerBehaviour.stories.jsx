import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import DatePicker from './DatePicker/DatePicker';

/**
 * What DatePicker does, held to a play test each: where its calendar opens,
 * picking a range, the earliest and latest dates, and typing a date.
 *
 * The calendar renders in a portal on `document.body`, so the tests look for it
 * there rather than inside the story's canvas.
 */
export default {
    title: 'Components/Forms and inputs/Date picker behaviour',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for the date picker: the 4px popup gap and its flip, ranges, '
                    + 'earliest and latest dates, and typed entry.',
            },
        },
    },
};

const page = within(document.body);
const calendar = () => document.body.querySelector('.plus-date-popup');
const box = (input) => input.closest('.plus-field').getBoundingClientRect();

/** The calendar opens 4px under the field, its left edge on the field's. */
export const CalendarOpensFourPixelsBelow = () => (
    <div style={{ maxWidth: '296px' }}>
        <DatePicker aria-label="Session date" value="2026-10-21" />
    </div>
);

CalendarOpensFourPixelsBelow.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Session date' });
    await userEvent.click(input);
    await waitFor(() => expect(calendar()).toBeVisible());
    const field = box(input);
    const popup = calendar().getBoundingClientRect();
    await expect(calendar()).toHaveAttribute('data-placement', 'bottom');
    await expect(Math.round(popup.top - field.bottom)).toBe(4);
    await expect(Math.round(popup.left)).toBe(Math.round(field.left));
};

/** With no room below, the calendar opens above, the same 4px away. */
export const CalendarFlipsAboveNearTheBottom = () => (
    <div style={{ position: 'fixed', left: '16px', bottom: '16px', width: '296px' }}>
        <DatePicker aria-label="Session date" value="2026-10-21" />
    </div>
);

CalendarFlipsAboveNearTheBottom.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Session date' });
    await userEvent.click(input);
    await waitFor(() => expect(calendar()).toHaveAttribute('data-placement', 'top'));
    const field = box(input);
    const popup = calendar().getBoundingClientRect();
    await expect(Math.round(field.top - popup.bottom)).toBe(4);
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
export const EarliestAndLatestDates = () => (
    <div style={{ maxWidth: '296px' }}>
        <DatePicker aria-label="Session date" value="2026-10-21" minDate="2026-10-12" maxDate="2026-10-25" />
    </div>
);

EarliestAndLatestDates.play = async ({ canvasElement }) => {
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
