import React from 'react';
import PropTypes from 'prop-types';
import { formatMonthYear, outOfBounds, parseDate, sameDay } from './dates';
import './Calendar.scss';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar — the month grid (Figma `_Calendar`), the one calendar DatePicker
 * and DateAndTimePicker both open. It is a part: not exported from the barrel.
 *
 * - **Grid:** always six weeks, 42 cells, so the panel never changes height.
 *   Days of the months either side are drawn and can't be picked.
 * - **Days:** each is a button named with its full date. `aria-pressed` marks
 *   the picked day, or both ends of a range; `data-in-range` marks the days
 *   between; `aria-current="date"` marks today.
 * - **Bounds:** days before `minDate` or after `maxDate` are disabled.
 * - **Size:** small, medium and large draw 28, 36 and 44px days.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const Calendar = ({
    viewDate,
    onViewDateChange,
    selected,
    rangeStart,
    rangeEnd,
    minDate,
    maxDate,
    size = 'medium',
    onPick,
    className = '',
    ...props
}) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastOfPrevious = new Date(year, month, 0).getDate();
    const today = new Date();
    const start = parseDate(rangeStart);
    const end = parseDate(rangeEnd);
    const picked = parseDate(selected);

    const cells = [];
    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
        cells.push(<div key={`prev-${i}`} className="plus-calendar-day plus-calendar-day--outside body2-txt">{lastOfPrevious - i}</div>);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const disabled = outOfBounds(date, minDate, maxDate);
        const isEnd = sameDay(date, start) || sameDay(date, end);
        const isSelected = sameDay(date, picked) || isEnd;
        const inRange = Boolean(start && end) && date > start && date < end;
        const isToday = sameDay(date, today);
        cells.push(
            <button
                key={`day-${day}`}
                type="button"
                disabled={disabled}
                aria-label={date.toLocaleDateString(undefined, {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                data-in-range={inRange || undefined}
                onClick={(event) => {
                    event.preventDefault();
                    onPick(date);
                }}
                className={[
                    'plus-calendar-day',
                    'body2-txt',
                    disabled && 'plus-calendar-day--disabled',
                    isSelected && 'plus-calendar-day--selected',
                    inRange && 'plus-calendar-day--in-range',
                    isToday && 'plus-calendar-day--today',
                ].filter(Boolean).join(' ')}
            >
                {day}
            </button>,
        );
    }
    for (let day = 1; cells.length < 42; day += 1) {
        cells.push(<div key={`next-${day}`} className="plus-calendar-day plus-calendar-day--outside body2-txt">{day}</div>);
    }

    const turn = (step) => onViewDateChange(new Date(year, month + step, 1));

    return (
        <div className={['plus-calendar', `plus-calendar--${size}`, className].filter(Boolean).join(' ')} {...props}>
            <div className="plus-calendar-header">
                <button type="button" className="plus-calendar-nav" onClick={() => turn(-1)} aria-label="Previous month">
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <div className="plus-calendar-month h6" aria-live="polite">{formatMonthYear(viewDate)}</div>
                <button type="button" className="plus-calendar-nav" onClick={() => turn(1)} aria-label="Next month">
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
            </div>
            <div className="plus-calendar-weekdays" aria-hidden="true">
                {WEEKDAYS.map((day) => <div key={day} className="plus-calendar-weekday body3-txt">{day}</div>)}
            </div>
            <div className="plus-calendar-days">{cells}</div>
        </div>
    );
};

Calendar.propTypes = {
    /** Any day in the month on show. */
    viewDate: PropTypes.instanceOf(Date).isRequired,
    /** `(firstOfMonth)` when Previous month or Next month is pressed. */
    onViewDateChange: PropTypes.func.isRequired,
    /** The picked day, as ISO `YYYY-MM-DD` or a Date. */
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** A range's first day; with `rangeEnd`, the days between are marked. */
    rangeStart: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    rangeEnd: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** `(date)` when an enabled day is pressed. */
    onPick: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default Calendar;
