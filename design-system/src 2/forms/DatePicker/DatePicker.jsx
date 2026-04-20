import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import './DatePicker.scss';

const DatePicker = ({
    id,
    name,
    placeholder = "Select date",
    value,
    size = "medium",
    disabled = false,
    readOnly = false,
    minDate,
    maxDate,
    calendarAlign = "left",
    onChange,
    onFocus,
    onBlur,
    className = '',
    style
}) => {
    // Utility functions
    const parseDate = (dateString) => {
        if (!dateString) return null;
        if (dateString instanceof Date) return dateString;
        const parts = dateString.split("-");
        if (parts.length !== 3) return null;
        // Construct date using local time values
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return isNaN(date.getTime()) ? null : date;
    };

    const formatDateForInput = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formatMonthYear = (date) => {
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // State
    const [selectedDate, setSelectedDate] = useState(parseDate(value));
    const [viewDate, setViewDate] = useState(parseDate(value) || new Date());
    const [isOpen, setIsOpen] = useState(false);

    // Sync with external value
    useEffect(() => {
        if (value !== undefined) {
            const parsed = parseDate(value);
            setSelectedDate(parsed);
            if (parsed) setViewDate(parsed);
        }
    }, [value]);

    const handleToggle = (nextShow) => {
        if (disabled || readOnly) return;
        setIsOpen(nextShow);
        if (nextShow) {
            // Reset view to selected date or today
            setViewDate(selectedDate || new Date());
        }
    };

    const handleDayClick = (date) => {
        if (disabled) return;

        // Validate constraints
        let isValid = true;
        if (minDate && date < parseDate(minDate).setHours(0, 0, 0, 0)) isValid = false;
        if (maxDate && date > parseDate(maxDate).setHours(0, 0, 0, 0)) isValid = false;

        if (isValid) {
            setSelectedDate(date);
            if (onChange) onChange(formatDateForInput(date));
            setIsOpen(false);
        }
    };

    const handleNav = (dir) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);
        setViewDate(newDate);
    };

    // Calendar Render Logic
    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay(); // 0 = Sun

        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="plus-date-picker-calendar-day plus-date-picker-calendar-day-other-month body2-txt">
                    {prevMonthLastDay - i}
                </div>
            );
        }

        // Current month days
        const normalizedMin = minDate ? parseDate(minDate) : null;
        if (normalizedMin) normalizedMin.setHours(0, 0, 0, 0);

        const normalizedMax = maxDate ? parseDate(maxDate) : null;
        if (normalizedMax) normalizedMax.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateVal = date.getTime();

            let isDisabled = false;
            if (normalizedMin && dateVal < normalizedMin.getTime()) isDisabled = true;
            if (normalizedMax && dateVal > normalizedMax.getTime()) isDisabled = true;

            let isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            let isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

            days.push(
                <button
                    key={`curr-${i}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDayClick(date); }}
                    className={`
                        plus-date-picker-calendar-day body2-txt
                        ${isDisabled ? 'plus-date-picker-calendar-day-disabled' : ''}
                        ${isSelected ? 'plus-date-picker-calendar-day-selected' : ''}
                        ${isToday ? 'plus-date-picker-calendar-day-today' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }

        // Next month days (fill row)
        const totalCells = days.length;
        // Optional: fill to 42 cells (6 rows) like legacy
        const remaining = 42 - totalCells;
        for (let i = 1; i <= remaining; i++) {
            days.push(
                <div key={`next-${i}`} className="plus-date-picker-calendar-day plus-date-picker-calendar-day-other-month body2-txt">
                    {i}
                </div>
            );
        }

        return days;
    };

    // Styling logic based on legacy
    const sizeClass = size === 'small' ? 'small body3-txt' : (size === 'large' ? 'large body1-txt' : 'body2-txt');

    // Custom toggle to match legacy structure exactly
    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <button
            ref={ref}
            type="button"
            className={`pdropdown-default-toggle dropdown-toggle ${sizeClass} ${selectedDate ? 'selected' : ''}`}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            disabled={disabled}
            style={readOnly || disabled ? { pointerEvents: 'none' } : {}}
            id={id ? `${id}-toggle` : undefined}
            aria-haspopup="true"
            aria-expanded={isOpen}
        >
            <span className="plus-date-picker-content">
                <input
                    type="text"
                    className="plus-date-picker-input"
                    readOnly
                    value={selectedDate ? formatDateForInput(selectedDate) : ''}
                    placeholder={placeholder}
                    disabled={disabled}
                    id={id}
                    name={name}
                    style={{
                        border: 'none', background: 'transparent', padding: 0, margin: 0,
                        width: '100%', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit',
                        fontWeight: 'inherit', lineHeight: 'inherit', cursor: disabled ? 'default' : 'pointer'
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </span>
        </button>
    ));

    return (
        <Dropdown
            show={isOpen}
            onToggle={handleToggle}
            className={`plus-date-picker-wrapper pdropdown dropdown pdropdown-primary pdropdown-outline ${size === 'small' ? 'small' : size === 'large' ? 'large' : ''} ${disabled ? 'plus-date-picker-disabled' : ''} ${readOnly ? 'plus-date-picker-readonly' : ''} ${className}`}
            style={style}
        >
            <Dropdown.Toggle as={CustomToggle} />

            <Dropdown.Menu
                className={`plus-date-picker-calendar plus-date-picker-calendar-align-${calendarAlign}`}
                renderOnMount // Force render to ensure it exists
            >
                <div className="plus-date-picker-calendar-header">
                    <button type="button" className="plus-date-picker-calendar-nav" onClick={() => handleNav(-1)} aria-label="Previous month">
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="plus-date-picker-calendar-month-year h6">
                        {formatMonthYear(viewDate)}
                    </div>
                    <button type="button" className="plus-date-picker-calendar-nav" onClick={() => handleNav(1)} aria-label="Next month">
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                <div className="plus-date-picker-calendar-weekdays">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="plus-date-picker-calendar-weekday body3-txt">{d}</div>
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
    style: PropTypes.object
};

export default DatePicker;
