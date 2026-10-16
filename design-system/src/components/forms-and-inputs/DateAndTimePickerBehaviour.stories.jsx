import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import DateAndTimePicker from './DateAndTimePicker';

/**
 * What DateAndTimePicker does, held to a play test each: its calendar is the
 * shared one and opens 4px from the date field, the AM/PM menu keeps the same
 * gap, and the time zone caption names the viewer's zone and, when it
 * differs, the other person's time.
 */
export default {
    title: 'Components/Forms and inputs/Date and time picker behaviour',
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

/** The date half opens the shared calendar, 4px under the date field. */
export const CalendarOpensFourPixelsBelow = () => (
    <div style={{ maxWidth: '296px' }}>
        <DateAndTimePicker label="Session time" dateValue="2026-10-21" timeZone="America/New_York" />
    </div>
);

CalendarOpensFourPixelsBelow.play = async ({ canvasElement }) => {
    const date = within(canvasElement).getByRole('textbox', { name: 'Session time Date' });
    await userEvent.click(date);
    const popup = await waitFor(() => {
        const found = document.body.querySelector('.plus-date-popup');
        expect(found).toBeVisible();
        return found;
    });
    await expect(popup.querySelector('.plus-calendar')).not.toBeNull();
    const field = date.getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    await expect(Math.round(box.top - field.bottom)).toBe(4);
    await expect(Math.round(box.left)).toBe(Math.round(field.left));
    await expect(page.getByRole('button', { name: /October 21, 2026/ })).toHaveAttribute('aria-pressed', 'true');
};

/** The AM/PM menu opens 4px under its toggle. */
export const PeriodMenuOpensFourPixelsBelow = () => (
    <div style={{ maxWidth: '296px' }}>
        <DateAndTimePicker label="Session time" timeValue="09:15 AM" timeZone="America/New_York" />
    </div>
);

PeriodMenuOpensFourPixelsBelow.play = async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector('.plus-datetime-am-pm-toggle');
    await userEvent.click(toggle);
    const menu = await waitFor(() => {
        const found = canvasElement.querySelector('.dropdown-menu.show');
        expect(found).toBeVisible();
        return found;
    });
    await waitFor(() => expect(
        Math.round(menu.getBoundingClientRect().top - toggle.getBoundingClientRect().bottom),
    ).toBe(4));
};

/** The caption names the viewer's zone, and adds the other person's time when theirs differs. */
export const TimeZoneCaption = (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '296px' }}>
        <DateAndTimePicker data-testid="tz-same" label="Session time" dateValue="2026-10-21" timeValue="04:00 PM" timeZone="America/New_York" />
        <DateAndTimePicker
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
    await userEvent.click(other.querySelector('.plus-datetime-am-pm-toggle'));
    await userEvent.click(await within(other).findByRole('button', { name: 'AM' }));
    await waitFor(() => expect(args.onChange).toHaveBeenCalled());
    const last = args.onChange.mock.calls.at(-1)[0];
    await expect(last.utc).toBe('2026-10-21T08:00:00.000Z');
    await expect(canvas.getByText('Pacific Time (PT) · 4:00 AM for the student (ET)')).toBeVisible();
};
