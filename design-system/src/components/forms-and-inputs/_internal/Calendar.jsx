import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SlideViews } from '@/lib/navigationMotion';
import Icon from '../../images-and-icons/Icon';
import { formatMonthYear, outOfBounds, parseDate, sameDay } from './dates';
import { IconButton } from '../IconButton/IconButton';
import './Calendar.scss';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar — the month grid (Figma `_Calendar`), the one calendar DatePicker
 * and DateTimePicker both open. It is a part: not exported from the barrel.
 *
 * - **Grid:** always six weeks, 42 cells, so the panel never changes height.
 *   Days of the months either side are drawn and can't be picked.
 * - **Days:** each is a button named with its full date. `aria-pressed` marks
 *   the picked day, or both ends of a range; `data-in-range` marks the days
 *   between; `aria-current="date"` marks today.
 * - **Bounds:** days before `minDate` or after `maxDate` are disabled.
 * - **Size:** a pixel width, 24, 32 or 40, drawn from the `--calendar-day-*` tokens.
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
    size = 32,
    onPick,
    className = '',
    ...props
}) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthKey = year * 12 + month;
    const prevMonthKeyRef = useRef(monthKey);
    const prevMonthKey = prevMonthKeyRef.current;
    const slideKeys = prevMonthKey === monthKey
        ? [monthKey]
        : [Math.min(prevMonthKey, monthKey), Math.max(prevMonthKey, monthKey)];
    useEffect(() => {
        prevMonthKeyRef.current = monthKey;
    }, [monthKey]);
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastOfPrevious = new Date(year, month, 0).getDate();
    const today = new Date();
    const start = parseDate(rangeStart);
    const end = parseDate(rangeEnd);
    const picked = parseDate(selected);

    const cells = [];
    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
        cells.push(<div key={`prev-${i}`} className="plus-calendar-day plus-calendar-day--outside">{lastOfPrevious - i}</div>);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const disabled = outOfBounds(date, minDate, maxDate);
        const isRange = Boolean(start && end) && !sameDay(start, end);
        const isRangeStart = isRange && sameDay(date, start);
        const isRangeEnd = isRange && sameDay(date, end);
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
                    disabled && 'plus-calendar-day--disabled',
                    isSelected && 'plus-calendar-day--selected',
                    isRangeStart && 'plus-calendar-day--range-start',
                    isRangeEnd && 'plus-calendar-day--range-end',
                    inRange && 'plus-calendar-day--in-range',
                    isToday && 'plus-calendar-day--today',
                ].filter(Boolean).join(' ')}
            >
                {day}
            </button>,
        );
    }
    for (let day = 1; cells.length < 42; day += 1) {
        cells.push(<div key={`next-${day}`} className="plus-calendar-day plus-calendar-day--outside">{day}</div>);
    }

    const turn = (step) => onViewDateChange(new Date(year, month + step, 1));

    return (
        <div
            className={['plus-calendar', className].filter(Boolean).join(' ')}
            data-size={size}
            {...props}
        >
            <div className="plus-calendar-header">
                <IconButton icon={<Icon name="chevron-left" size={12} />} label="Previous month" appearance="subtle" spacing="compact" isTooltipDisabled className="plus-calendar-nav" onClick={() => turn(-1)} />
                <div className="plus-calendar-month" aria-live="polite">{formatMonthYear(viewDate)}</div>
                <IconButton icon={<Icon name="chevron-right" size={12} />} label="Next month" appearance="subtle" spacing="compact" isTooltipDisabled className="plus-calendar-nav" onClick={() => turn(1)} />
            </div>
            <div className="plus-calendar-weekdays" aria-hidden="true">
                {WEEKDAYS.map((day) => <div key={day} className="plus-calendar-weekday">{day}</div>)}
            </div>
            <SlideViews activeKey={monthKey} keys={slideKeys} size="panel">
                <div className="plus-calendar-days">{cells}</div>
            </SlideViews>
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
    /** Day width in pixels: 24, 32 or 40. */
    size: PropTypes.oneOf([24, 32, 40]),
    /** `(date)` when an enabled day is pressed. */
    onPick: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default Calendar;
