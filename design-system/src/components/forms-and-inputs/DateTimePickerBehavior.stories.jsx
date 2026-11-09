import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import DateTimePicker from './DateTimePicker/DateTimePicker';

/**
 * What DateTimePicker does, held to a play test each: its calendar is the
 * shared one and opens 4px from the date field, the list of times keeps the
 * same gap, and the time zone caption names the viewer's zone and, when it
 * differs, the other person's time.
 */
export default {
    title: 'Components/Forms and inputs/Date time picker/Behavior',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for the date and time picker: the shared calendar, '
                    + 'the 4px popup gap and the time zone caption.',
            },
        },
    },
};

const page = within(document.body);

/**
 * Both halves are the shared field: the date on `_Field` with the calendar
 * icon in Trailing, as DatePicker draws it, and the time on `_Field` as the
 * searchable Select it is, with no AM/PM toggle. A state marks both boxes.
 */
export const BothHalvesAreTheSharedField = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '296px' }}>
        <DateTimePicker data-testid="dt-plain" label="Session time" dateValue="2026-10-21" timeValue="09:15 AM" timeZone="America/New_York" />
        <DateTimePicker data-testid="dt-invalid" label="Session end" isInvalid errorMessage="Pick an end time" timeZone="America/New_York" />
    </div>
);

BothHalvesAreTheSharedField.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = within(canvas.getByTestId('dt-plain'));
    const date = plain.getByRole('combobox', { name: 'Session time Date' });
    const time = plain.getByRole('combobox', { name: 'Session time Time' });
    await expect(date.closest('.plus-field')).not.toBeNull();
    await expect(date.closest('.plus-field').querySelector('.plus-field__trailing .fa-calendar-day')).not.toBeNull();
    await expect(time.closest('.plus-field')).not.toBeNull();
    // The time half is a list of times: no AM/PM toggle beside it.
    await expect(time.closest('.plus-field').querySelector('.plus-time-picker__period-toggle')).toBeNull();
    await expect(canvasElement.querySelector('.form-control, .input-group, .form-label')).toBeNull();

    const invalid = canvas.getByTestId('dt-invalid');
    const boxes = [...invalid.querySelectorAll('.plus-field')];
    await expect(boxes).toHaveLength(2);
    for (const box of boxes) await expect(box).toHaveClass('plus-field--invalid');
    await expect(within(invalid).getByRole('combobox', { name: 'Session end Date' })).toHaveAttribute('aria-invalid', 'true');
};
/** The date half opens the shared calendar, 4px under the date field (which sits clear of the 8 screen gap). */
/** The date half opens the shared calendar, 4px under the date field. */
export const CalendarOpensFourPixelsBelow = () => (
    <div style={{ maxWidth: '296px', marginLeft: '16px' }}>
        <DateTimePicker label="Session time" dateValue="2026-10-21" timeZone="America/New_York" />
    </div>
);

CalendarOpensFourPixelsBelow.play = async ({ canvasElement }) => {
    const date = within(canvasElement).getByRole('combobox', { name: 'Session time Date' });
    await userEvent.click(date);
    const popup = await waitFor(() => {
        const found = document.body.querySelector('.plus-date-popup');
        expect(found).toBeVisible();
        return found;
    });
    await expect(popup.querySelector('.plus-calendar')).not.toBeNull();
    // Measured from the field's box, as DatePicker's placement test measures it.
    const field = date.closest('.plus-field').getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    await expect(Math.round(box.top - field.bottom)).toBe(4);
    await expect(Math.round(box.left)).toBe(Math.round(field.left));
    await expect(page.getByRole('button', { name: /October 21, 2026/ })).toHaveAttribute('aria-pressed', 'true');
};

/** The time half opens its list of times 4px under the time field. */
export const TimeListOpensFourPixelsBelow = () => (
    <div style={{ maxWidth: '296px' }}>
        <DateTimePicker label="Session time" timeValue="09:15 AM" timeZone="America/New_York" />
    </div>
);

TimeListOpensFourPixelsBelow.play = async ({ canvasElement }) => {
    const time = within(canvasElement).getByRole('combobox', { name: 'Session time Time' });
    const box = time.closest('.plus-field');
    await userEvent.click(time);
    // The list portals to the document body, not canvasElement.
    // Measure the floating surface, not the scrolling list inside it.
    const list = (await page.findByRole('listbox')).closest('.plus-listbox');
    // 4px from the field: below it, or above it when the list flips for room.
    await waitFor(() => {
        const l = list.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        const gap = l.top >= b.bottom ? l.top - b.bottom : b.top - l.bottom;
        expect(Math.round(gap)).toBe(4);
    });
};

/** The caption names the viewer's zone, and adds the other person's time when theirs differs. */
export const TimeZoneCaption = (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '296px' }}>
        <DateTimePicker data-testid="tz-same" label="Session time" dateValue="2026-10-21" timeValue="04:00 PM" timeZone="America/New_York" />
        <DateTimePicker
            data-testid="tz-other"
            label="Session time"
            dateValue="2026-10-21"
            timeValue="01:00 PM"
            timeZone="America/Los_Angeles"
            otherTimeZone="America/New_York"
            otherPerson="the student"
            onChange={args.onChange}
        />
    </div>
);
TimeZoneCaption.args = { onChange: fn() };

TimeZoneCaption.play = async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const same = canvas.getByTestId('tz-same');
    const other = canvas.getByTestId('tz-other');

    await expect(within(same).getByText('Eastern Time (ET)')).toBeVisible();
    await expect(within(other).getByText('Pacific Time (PT) · 4:00 PM for the student (ET)')).toBeVisible();

    // The caption describes the field.
    const caption = within(other).getByText(/Pacific Time/);
    await expect(other.getAttribute('aria-describedby')).toContain(caption.id);

    // The value is stored in UTC: 1:00 AM in Los Angeles is 08:00 UTC.
    // The list portals to the document body, not `other`.
    await userEvent.click(within(other).getByRole('combobox', { name: 'Session time Time' }));
    await userEvent.click(await page.findByRole('option', { name: '1:00 AM' }));
    await waitFor(() => expect(args.onChange).toHaveBeenCalled());
    const last = args.onChange.mock.calls.at(-1)[0];
    await expect(last.utc).toBe('2026-10-21T08:00:00.000Z');
    await expect(canvas.getByText('Pacific Time (PT) · 4:00 AM for the student (ET)')).toBeVisible();
};

/**
 * A zone the browser does not know falls back to the viewer's own and drops the
 * caption rather than throwing: a stored zone can be stale or mistyped.
 */
export const UnknownTimeZone = (args) => (
    <div style={{ maxWidth: '296px' }}>
        <DateTimePicker
            data-testid="tz-unknown"
            label="Session time"
            dateValue="2026-10-21"
            timeValue="01:00 PM"
            timeZone="Sample"
            otherTimeZone="Sample"
            otherPerson="the student"
            onChange={args.onChange}
        />
    </div>
);
UnknownTimeZone.args = { onChange: fn() };

UnknownTimeZone.play = async ({ args, canvasElement }) => {
    const field = within(canvasElement).getByTestId('tz-unknown');

    await expect(field.querySelector('.plus-datetime-time-zone')).toBeNull();
    await expect(field.getAttribute('aria-describedby') ?? '').not.toMatch(/time-zone/);

    // Stored in the viewer's own zone: 1:00 AM local on 21 Oct 2026.
    // The list portals to the document body, not `field`.
    await userEvent.click(within(field).getByRole('combobox', { name: 'Session time Time' }));
    await userEvent.click(await page.findByRole('option', { name: '1:00 AM' }));
    await waitFor(() => expect(args.onChange).toHaveBeenCalled());
    const last = args.onChange.mock.calls.at(-1)[0];
    await expect(last.utc).toBe(new Date(2026, 9, 21, 1, 0).toISOString());
};
