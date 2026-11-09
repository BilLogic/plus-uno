import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import DateTimePicker from './DateTimePicker/DateTimePicker';

/**
 * A time surviving a round trip through the control that shows it.
 *
 * WHY THIS FILE EXISTS. The time half once converted a 12-hour value up to
 * 24-hour and showed it beside the period it came from: `timeValue="02:30 PM"`
 * displayed as `14:30` with `PM` next to it, and `onChange` reported
 * `"14:30 PM"`. A value could not pass through its own component unchanged.
 * The time half is now a list of times, each with its own period, and these
 * plays hold the same promise: a value given in either clock reads back as the
 * same time, a typed time that is not a time is refused, and a pick is
 * reported with or without a date.
 *
 * None of this is visible in a screenshot of a component at rest, which is
 * why the cover is an interaction and a rendered value rather than a snapshot.
 */
export default {
    title: 'Components/Forms and inputs/Date time picker/Round trip',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Behavior cover for the time half of DateTimePicker: a 12-hour value renders '
                    + 'as it was given, a 24-hour value reads as the same time, a typed text that is '
                    + 'not a time is refused, and a picked time is reported with or without a date.',
            },
        },
    },
};

/** The time field is the one labeled `Time`; the date field sits beside it. */
const timeField = (canvas) => canvas.getByLabelText('Time');

/** The list portals to the document body, not the canvas. */
const page = within(document.body);

export const TwelveHourValueSurvives = {
    render: () => (
        <DateTimePicker label="Session start" timeValue="02:30 PM" dateValue="03/14/26" />
    ),
};

TwelveHourValueSurvives.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(timeField(canvas)).toHaveValue('2:30 PM'));
};

export const TwentyFourHourValueReadsAsTwelveHour = {
    render: () => <DateTimePicker label="Session start" timeValue="14:30" />,
};

TwentyFourHourValueReadsAsTwelveHour.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A value with no period is 24-hour: it reads as the same time, with its period.
    await waitFor(() => expect(timeField(canvas)).toHaveValue('2:30 PM'));
};

export const MidnightAndNoonReadAsTwelve = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DateTimePicker label="Midnight" timeValue="00:15" />
            <DateTimePicker label="Noon" timeValue="12:45" />
        </div>
    ),
};

MidnightAndNoonReadAsTwelve.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The two that do not follow the modulo. 0 and 12 both read as 12, and only
    // the period tells them apart.
    const [midnight, noon] = canvas.getAllByLabelText('Time');
    await waitFor(() => expect(midnight).toHaveValue('12:15 AM'));
    await expect(noon).toHaveValue('12:45 PM');
};

export const TypedTextThatIsNotATimeIsRefused = {
    render: () => <DateTimePicker label="Session start" />,
};

TypedTextThatIsNotATimeIsRefused.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const time = timeField(canvas);

    // A minute past 59 is not a time: nothing is picked and the field says so.
    await userEvent.click(time);
    await userEvent.type(time, '0199{Enter}');
    await waitFor(() => expect(time).toHaveAttribute('aria-invalid', 'true'));

    // A real time, typed, is picked and the mark goes.
    await userEvent.clear(time);
    await userEvent.type(time, '1130{Enter}');
    await waitFor(() => expect(time).toHaveValue('11:30 AM'));
    await expect(time).not.toHaveAttribute('aria-invalid', 'true');
};

export const PickIsReportedWithoutADate = {
    args: { onChange: fn() },
    render: (args) => (
        <DateTimePicker label="Session start" timeValue="09:15 AM" onChange={args.onChange} />
    ),
};

PickIsReportedWithoutADate.play = async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(timeField(canvas)).toHaveValue('9:15 AM'));
    args.onChange.mockClear();

    await userEvent.click(timeField(canvas));
    await userEvent.click(await page.findByRole('option', { name: '9:30 PM' }));

    // The date is deliberately absent: a time is reported with whatever half is set.
    await waitFor(() => expect(args.onChange).toHaveBeenCalled());
    const last = args.onChange.mock.calls.at(-1)[0];
    await expect(last.date).toBe(null);
    await expect(last.time).toBe('09:30 PM');
};
