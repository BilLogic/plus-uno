import React, { useState, useEffect, forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import './DatePicker.scss';

/**
 * Parses ISO `YYYY-MM-DD` (or Date) into a local Date clone (never mutates inputs).
 *
 * @param {string|Date|null|undefined} dateString
 * @returns {Date|null}
 */
const parseDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) {
        if (Number.isNaN(dateString.getTime())) return null;
        return new Date(dateString.getTime());
    }
    const parts = String(dateString).split('-');
    if (parts.length !== 3) return null;
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Start-of-day timestamp for bound comparisons, or null when unbound/invalid.
 *
 * @param {string|Date|null|undefined} bound
 * @returns {number|null}
 */
const boundStartOfDay = (bound) => {
    const parsed = parseDate(bound);
    if (!parsed) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed.getTime();
};

/**
 * Formats a Date as ISO `YYYY-MM-DD` for value/onChange.
 *
 * @param {Date|null} date
 * @returns {string}
 */
const formatDateIso = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formats a Date as `MM/DD/YYYY` for the closed trigger (Figma Month Date Picker).
 *
 * @param {Date|null} date
 * @returns {string}
 */
const formatDateDisplay = (date) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

/**
 * @param {Date} date
 * @returns {string}
 */
const formatMonthYear = (date) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * DatePicker trigger — form field + calendar-day icon (not Dropdown caret).
 * Figma: Month (Date Picker) / Month (no label) on Date & Time Picker page.
 */
const DatePickerToggle = forwardRef(({ displayValue, placeholder, disabled, readOnly, isOpen, calendarId, id, name, onClick, onFocus, onBlur, sizeClass }, ref) => {
    /**
     * Opens/closes the calendar via react-bootstrap Dropdown.Toggle.
     *
     * @param {React.SyntheticEvent} event
     */
    const handleActivate = (event) => {
        event.preventDefault();
        onClick?.(event);
    };

    return (
        <div
            ref={ref}
            className={[
                'plus-date-picker-trigger',
                sizeClass,
                displayValue ? 'plus-date-picker-trigger--filled' : '',
                disabled ? 'plus-date-picker-trigger--disabled' : '',
                readOnly ? 'plus-date-picker-trigger--readonly' : '',
                isOpen ? 'plus-date-picker-trigger--open' : '',
            ].filter(Boolean).join(' ')}
            style={readOnly || disabled ? { pointerEvents: 'none' } : undefined}
            onClick={handleActivate}
        >
            <input
                type="text"
                className="plus-date-picker-input"
                readOnly
                value={displayValue}
                placeholder={placeholder}
                disabled={disabled}
                id={id}
                name={name}
                role="combobox"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={calendarId}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                        handleActivate(event);
                    }
                }}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            <span className="plus-date-picker-trigger__icon" aria-hidden="true">
                <i className="fa-solid fa-calendar-day" />
            </span>
        </div>
    );
});

DatePickerToggle.displayName = 'DatePickerToggle';

DatePickerToggle.propTypes = {
    displayValue: PropTypes.string,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    isOpen: PropTypes.bool,
    calendarId: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    onClick: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    sizeClass: PropTypes.string,
};

/**
 * Date picker (Figma Forms · Date & Time Picker · Month Date Picker).
 * Trigger is a form control with calendar-day trailing icon — distinct from Select's caret.
 *
 * @param {object} props
 */
const DatePicker = ({
    id,
    name,
    placeholder = 'MM/DD/YYYY',
    value,
    size = 'medium',
    disabled = false,
    readOnly = false,
    minDate,
    maxDate,
    calendarAlign = 'left',
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
}) => {
    const autoId = useId();
    const [selectedDate, setSelectedDate] = useState(parseDate(value));
    const [viewDate, setViewDate] = useState(parseDate(value) || new Date());
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (value !== undefined) {
            const parsed = parseDate(value);
            setSelectedDate(parsed);
            if (parsed) setViewDate(parsed);
        }
    }, [value]);

    /**
     * @param {boolean} nextShow
     */
    const handleToggle = (nextShow) => {
        if (disabled || readOnly) return;
        setIsOpen(nextShow);
        if (nextShow) {
            setViewDate(selectedDate || new Date());
        }
    };

    /**
     * @param {Date} date
     */
    const handleDayClick = (date) => {
        if (disabled) return;

        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const minBound = boundStartOfDay(minDate);
        const maxBound = boundStartOfDay(maxDate);
        if (minBound != null && dayStart < minBound) return;
        if (maxBound != null && dayStart > maxBound) return;

        setSelectedDate(date);
        onChange?.(formatDateIso(date));
        setIsOpen(false);
    };

    /**
     * @param {number} dir
     */
    const handleNav = (dir) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));
    };

    /**
     * @returns {React.ReactNode[]}
     */
    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const days = [];

        for (let i = firstDayOfWeek - 1; i >= 0; i -= 1) {
            days.push(
                <div key={`prev-${i}`} className="plus-date-picker-calendar-day plus-date-picker-calendar-day-other-month body2-txt">
                    {prevMonthLastDay - i}
                </div>,
            );
        }

        const minBound = boundStartOfDay(minDate);
        const maxBound = boundStartOfDay(maxDate);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= daysInMonth; i += 1) {
            const date = new Date(year, month, i);
            const dateVal = date.getTime();
            let isDisabled = false;
            if (minBound != null && dateVal < minBound) isDisabled = true;
            if (maxBound != null && dateVal > maxBound) isDisabled = true;

            const isSelected = selectedDate
                && date.getDate() === selectedDate.getDate()
                && date.getMonth() === selectedDate.getMonth()
                && date.getFullYear() === selectedDate.getFullYear();

            const isToday = date.getDate() === today.getDate()
                && date.getMonth() === today.getMonth()
                && date.getFullYear() === today.getFullYear();

            days.push(
                <button
                    key={`curr-${i}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDayClick(date);
                    }}
                    className={[
                        'plus-date-picker-calendar-day',
                        'body2-txt',
                        isDisabled ? 'plus-date-picker-calendar-day-disabled' : '',
                        isSelected ? 'plus-date-picker-calendar-day-selected' : '',
                        isToday ? 'plus-date-picker-calendar-day-today' : '',
                    ].filter(Boolean).join(' ')}
                >
                    {i}
                </button>,
            );
        }

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i += 1) {
            days.push(
                <div key={`next-${i}`} className="plus-date-picker-calendar-day plus-date-picker-calendar-day-other-month body2-txt">
                    {i}
                </div>,
            );
        }

        return days;
    };

    const fieldId = id || name || autoId;
    const sizeClass = size === 'small' ? 'plus-date-picker-trigger--small' : (size === 'large' ? 'plus-date-picker-trigger--large' : '');
    const calendarId = `${fieldId}-calendar`;
    const displayValue = formatDateDisplay(selectedDate);

    return (
        <Dropdown
            show={isOpen}
            onToggle={handleToggle}
            className={[
                'plus-date-picker-wrapper',
                'dropdown',
                size === 'small' ? 'small' : '',
                size === 'large' ? 'large' : '',
                disabled ? 'plus-date-picker-disabled' : '',
                readOnly ? 'plus-date-picker-readonly' : '',
                className,
            ].filter(Boolean).join(' ')}
            style={style}
        >
            <Dropdown.Toggle
                as={DatePickerToggle}
                displayValue={displayValue}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                isOpen={isOpen}
                calendarId={calendarId}
                id={fieldId}
                name={name}
                onFocus={onFocus}
                onBlur={onBlur}
                sizeClass={sizeClass}
            />

            <Dropdown.Menu
                id={calendarId}
                className={`plus-date-picker-calendar plus-date-picker-calendar-align-${calendarAlign}`}
                renderOnMount
            >
                <div className="plus-date-picker-calendar-header">
                    <button type="button" className="plus-date-picker-calendar-nav" onClick={() => handleNav(-1)} aria-label="Previous month">
                        <i className="fas fa-chevron-left" />
                    </button>
                    <div className="plus-date-picker-calendar-month-year h6">
                        {formatMonthYear(viewDate)}
                    </div>
                    <button type="button" className="plus-date-picker-calendar-nav" onClick={() => handleNav(1)} aria-label="Next month">
                        <i className="fas fa-chevron-right" />
                    </button>
                </div>

                <div className="plus-date-picker-calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="plus-date-picker-calendar-weekday body3-txt">{day}</div>
                    ))}
                </div>

                <div className="plus-date-picker-calendar-days">
                    {renderCalendarDays()}
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};

DatePicker.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    calendarAlign: PropTypes.oneOf(['left', 'center', 'right']),
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default DatePicker;
