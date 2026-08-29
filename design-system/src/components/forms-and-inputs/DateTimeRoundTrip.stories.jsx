import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import DateAndTimePicker from './DateAndTimePicker';

/**
 * A time surviving a round trip through the control that shows it.
 *
 * WHY THIS FILE EXISTS. `DateAndTimePicker` renders an hour, a minute and an
 * AM/PM control. Its `timeValue` parser converted a 12-hour value UP to
 * 24-hour — `if (period === 'PM' && hours !== 12) hours += 12` — and then the
 * component rendered that number beside the period it had just been derived
 * from. `timeValue="02:30 PM"` displayed as `14:30` with `PM` next to it, and
 * `onChange` reported `"14:30 PM"`: a value could not pass through its own
 * component unchanged.
 *
 * The hour field carried the same mistake from the other side. It accepted
 * 0-23, a bound from a clock this component does not show, so typing `20` was
 * accepted and rendered as `20:00 PM`.
 *
 * And `handleAmPmChange` reported nothing unless a date had already been
 * chosen — `if (onChange && selectedDate)` — while both sibling handlers report
 * with whatever half they have. Switching AM to PM on a form where the time was
 * filled and the date was not told the caller nothing at all.
 *
 * None of the three is visible in a screenshot of a component at rest, which is
 * why the cover is an interaction and a rendered value rather than a snapshot.
 */
export default {
    title: 'Components/Forms and Inputs/Date and time round trip',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Behaviour cover for the time half of DateAndTimePicker: a 12-hour value renders '
                    + 'as it was given, a 24-hour value is split into an hour and a period, the hour '
                    + 'field refuses a number the control cannot show, and an AM/PM change is '
                    + 'reported with or without a date.',
            },
        },
    },
};

/** The time field is the one labelled `Time`; the date field sits beside it. */
const timeField = (canvas) => canvas.getByLabelText('Time');

/**
 * The period as the control DISPLAYS it.
 *
 * `getByText('PM')` finds three nodes: the toggle and both dropdown items,
 * which react-bootstrap renders whether or not the menu is open. Only the
 * toggle says what the control is currently set to.
 */
const period = (root) => root.querySelector('.plus-datetime-am-pm-toggle').textContent.trim();

export const TwelveHourValueSurvives = {
    render: () => (
        <DateAndTimePicker label="Session start" timeValue="02:30 PM" dateValue="03/14/26" />
    ),
};

TwelveHourValueSurvives.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(timeField(canvas)).toHaveValue('02:30'));
    // The hour is shown as given, not converted to the 24-hour clock the
    // component has no control for.
    await expect(timeField(canvas)).not.toHaveValue('14:30');
    await expect(period(canvasElement)).toBe('PM');
};

export const TwentyFourHourValueIsSplit = {
    render: () => <DateAndTimePicker label="Session start" timeValue="14:30" />,
};

TwentyFourHourValueIsSplit.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A value with no period IS 24-hour, so it is split into the hour this
    // control can show and the period that says which half of the day it is.
    await waitFor(() => expect(timeField(canvas)).toHaveValue('02:30'));
    await expect(period(canvasElement)).toBe('PM');
};

export const MidnightAndNoonReadAsTwelve = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DateAndTimePicker label="Midnight" timeValue="00:15" />
            <DateAndTimePicker label="Noon" timeValue="12:45" />
        </div>
    ),
};

MidnightAndNoonReadAsTwelve.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The two that do not follow the modulo. 0 and 12 both read as 12, and only
    // the period tells them apart.
    const [midnight, noon] = canvas.getAllByLabelText('Time');
    await waitFor(() => expect(midnight).toHaveValue('12:15'));
    await expect(noon).toHaveValue('12:45');
    const toggles = [...canvasElement.querySelectorAll('.plus-datetime-am-pm-toggle')];
    await expect(toggles[0].textContent.trim()).toBe('AM');
    await expect(toggles[1].textContent.trim()).toBe('PM');
};

export const HourFieldRefusesWhatItCannotShow = {
    render: () => <DateAndTimePicker label="Session start" />,
};

HourFieldRefusesWhatItCannotShow.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const time = timeField(canvas);

    /*
     * Pasted, not typed. The field inserts its own colon after the first
     * digit, so typing `2` then `0` produces `02:00` and never reaches an hour
     * of 20 at all — the bound is only reachable by a paste or a programmatic
     * value, which is exactly why nothing had noticed it.
     */
    await userEvent.click(time);
    await userEvent.paste('20:30');
    // 20 is a legal hour on a 24-hour clock. This control shows AM/PM, so it is
    // not a legal hour here, and the field keeps only what it can render.
    await waitFor(() => expect(time).not.toHaveValue('20:30'));

    await userEvent.clear(time);
    await userEvent.paste('11:30');
    await waitFor(() => expect(time).toHaveValue('11:30'));
};

export const PeriodChangeIsReportedWithoutADate = {
    args: { onChange: fn() },
    render: (args) => (
        <DateAndTimePicker label="Session start" timeValue="09:15 AM" onChange={args.onChange} />
    ),
};

PeriodChangeIsReportedWithoutADate.play = async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(timeField(canvas)).toHaveValue('09:15'));
    args.onChange.mockClear();

    await userEvent.click(canvasElement.querySelector('.plus-datetime-am-pm-toggle'));
    await userEvent.click(await canvas.findByRole('button', { name: 'PM' }));

    /*
     * The date is deliberately absent. This used to be guarded by
     * `if (onChange && selectedDate)`, so a reader who set a time, saw the
     * period flip in front of them, and had not yet picked a date got no event
     * at all — while both sibling handlers report with whatever half they have.
     */
    await waitFor(() => expect(args.onChange).toHaveBeenCalled());
    const last = args.onChange.mock.calls.at(-1)[0];
    await expect(last.date).toBe(null);
    await expect(last.time).toBe('09:15 PM');
    await expect(period(canvasElement)).toBe('PM');
};
