import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { SlideViews } from '@/lib/navigationMotion';
import Icon from '../../images-and-icons/Icon';
import { formatMonthYear, outOfBounds, parseDate, sameDay, formatIso } from './dates';
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
 * - **Roles:** a `grid` named by the month, a `row` of `columnheader`s, then six
 *   `row`s of `gridcell`s. `aria-selected` marks the picked day (or range ends) and
 *   `aria-disabled` a day outside `minDate`/`maxDate`.
 * - **Keyboard:** one day is in the tab order (the picked day, else today, else
 *   the first enabled day) and the arrows move from it, the way a date grid
 *   does: Left and Right by a day, Up and Down by a week, Home and End to the
 *   start and end of the week, Page Up and Page Down by a month (Shift for a
 *   year). Moving past the month on show turns to that month; `minDate` and
 *   `maxDate` stop the move. Base UI has no date grid, so this is the one
 *   hand-rolled roving focus, on the WAI-ARIA date grid keys.
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
    const [focusDate, setFocusDate] = useState(null);
    const pendingFocus = useRef(false);
    const gridRef = useRef(null);
    const start = parseDate(rangeStart);
    const end = parseDate(rangeEnd);
    const picked = parseDate(selected);

    const inView = (date) => date && date.getFullYear() === year && date.getMonth() === month;
    const isEnabled = (date) => !outOfBounds(date, minDate, maxDate);
    const firstEnabled = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)).find(isEnabled);
    const tabDay = [focusDate, picked, start, today, firstEnabled]
        .find((date) => inView(date) && isEnabled(date));

    useEffect(() => {
        if (!pendingFocus.current || !focusDate) return;
        const target = gridRef.current?.querySelector(`[data-date="${formatIso(focusDate)}"]`);
        if (target) {
            pendingFocus.current = false;
            target.focus();
        }
    }, [focusDate, monthKey]);

    const moveFocus = (from, event) => {
        const { shiftKey } = event;
        let next;
        switch (event.key) {
            case 'ArrowLeft': next = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1); break;
            case 'ArrowRight': next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1); break;
            case 'ArrowUp': next = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 7); break;
            case 'ArrowDown': next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7); break;
            case 'Home': next = new Date(from.getFullYear(), from.getMonth(), from.getDate() - from.getDay()); break;
            case 'End': next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6 - from.getDay()); break;
            case 'PageUp': case 'PageDown': {
                const step = (event.key === 'PageUp' ? -1 : 1) * (shiftKey ? 12 : 1);
                const target = new Date(from.getFullYear(), from.getMonth() + step, 1);
                const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
                next = new Date(target.getFullYear(), target.getMonth(), Math.min(from.getDate(), last));
                break;
            }
            default: return;
        }
        event.preventDefault();
        const min = parseDate(minDate);
        const max = parseDate(maxDate);
        if (min && next < min) next = min;
        if (max && next > max) next = max;
        if (sameDay(next, from)) return;
        pendingFocus.current = true;
        setFocusDate(next);
        if (next.getFullYear() !== year || next.getMonth() !== month) {
            onViewDateChange(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    };

    const cells = [];
    // A day sits in a gridcell; its column (0-6) is what the range ends are drawn from.
    const cell = (key, node, props = {}) => (
        <div key={key} role="gridcell" className="plus-calendar-cell" {...props}>{node}</div>
    );
    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
        cells.push(cell(
            `prev-${i}`,
            <span data-column={cells.length % 7} className="plus-calendar-day plus-calendar-day--outside">{lastOfPrevious - i}</span>,
            { 'aria-disabled': true },
        ));
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
        cells.push(cell(
            `day-${day}`,
            <button
                type="button"
                data-column={cells.length % 7}
                disabled={disabled}
                aria-label={date.toLocaleDateString(undefined, {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
                data-date={formatIso(date)}
                tabIndex={tabDay && sameDay(date, tabDay) ? 0 : -1}
                onKeyDown={(event) => moveFocus(date, event)}
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
            { 'aria-selected': isSelected, 'aria-disabled': disabled || undefined },
        ));
    }
    for (let day = 1; cells.length < 42; day += 1) {
        cells.push(cell(
            `next-${day}`,
            <span data-column={cells.length % 7} className="plus-calendar-day plus-calendar-day--outside">{day}</span>,
            { 'aria-disabled': true },
        ));
    }
    const weeks = Array.from({ length: 6 }, (_, week) => (
        <div key={week} role="row" className="plus-calendar-week">{cells.slice(week * 7, week * 7 + 7)}</div>
    ));

    const monthId = useId();
    const turn = (step) => onViewDateChange(new Date(year, month + step, 1));

    return (
        <div
            className={['plus-calendar', className].filter(Boolean).join(' ')}
            data-size={size}
            ref={gridRef}
            {...props}
        >
            <div className="plus-calendar-header">
                <IconButton icon={<Icon name="chevron-left" size={12} />} label="Previous month" appearance="subtle" spacing="compact" isTooltipDisabled className="plus-calendar-nav" onClick={() => turn(-1)} />
                <div id={monthId} className="plus-calendar-month" aria-live="polite">{formatMonthYear(viewDate)}</div>
                <IconButton icon={<Icon name="chevron-right" size={12} />} label="Next month" appearance="subtle" spacing="compact" isTooltipDisabled className="plus-calendar-nav" onClick={() => turn(1)} />
            </div>
            <div role="grid" aria-labelledby={monthId} className="plus-calendar-grid">
                <div role="row" className="plus-calendar-weekdays">
                    {WEEKDAYS.map((day) => <div key={day} role="columnheader" className="plus-calendar-weekday">{day}</div>)}
                </div>
                <SlideViews activeKey={monthKey} keys={slideKeys} size="panel">
                    <div className="plus-calendar-days">{weeks}</div>
                </SlideViews>
            </div>
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
