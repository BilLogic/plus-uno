import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form, Dropdown } from 'react-bootstrap';
import './DateAndTimePicker.scss';

const DateAndTimePicker = ({
    id,
    name,
    label,
    required = false,
    showLabel = true,
    datePlaceholder = 'MM/DD/YY',
    timePlaceholder = '__ : __',
    dateValue,
    timeValue,
    size = 'medium',
    disabled = false,
    readonly = false,
    validation = 'none', // 'none', 'invalid', 'success'
    validationMessage,
    minDate,
    maxDate,
    calendarAlign = 'left',
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [dateFocused, setDateFocused] = useState(false);
    const [timeFocused, setTimeFocused] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewDate, setViewDate] = useState(new Date());
    const [timeHours, setTimeHours] = useState('');
    const [timeMinutes, setTimeMinutes] = useState('');
    const [amPm, setAmPm] = useState('AM');
    const [isAmPmOpen, setIsAmPmOpen] = useState(false);
    
    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);
    const calendarRef = useRef(null);

    // Utility functions
    const parseDate = (dateString) => {
        if (!dateString) return null;
        if (dateString instanceof Date) return dateString;
        // Try MM/DD/YY format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1;
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]) + 2000; // Assume 20XX for YY
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
        }
        // Try YYYY-MM-DD format
        const isoParts = dateString.split('-');
        if (isoParts.length === 3) {
            const date = new Date(parseInt(isoParts[0]), parseInt(isoParts[1]) - 1, parseInt(isoParts[2]));
            return isNaN(date.getTime()) ? null : date;
        }
        return null;
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${month}/${day}/${year}`;
    };

    const formatMonthYear = (date) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Sync with external values
    useEffect(() => {
        if (dateValue !== undefined) {
            const parsed = parseDate(dateValue);
            setSelectedDate(parsed);
            if (parsed) setViewDate(parsed);
        }
    }, [dateValue]);

    useEffect(() => {
        if (timeValue !== undefined) {
            // Parse time value (format: "HH:MM AM/PM" or "HH:MM")
            const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                const period = timeMatch[3]?.toUpperCase() || '';
                
                if (period) {
                    // 12-hour format
                    setAmPm(period);
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                }
                setTimeHours(String(hours).padStart(2, '0'));
                setTimeMinutes(minutes);
            }
        }
    }, [timeValue]);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        // Don't blur if clicking on calendar or AM/PM dropdown
        if (calendarRef.current?.contains(e.relatedTarget) || 
            e.relatedTarget?.closest('.plus-datetime-am-pm-dropdown')) {
            return;
        }
        setIsFocused(false);
        setDateFocused(false);
        setTimeFocused(false);
        if (onBlur) onBlur(e);
    };

    const handleDateFocus = (e) => {
        setDateFocused(true);
        handleFocus(e);
    };

    const handleTimeFocus = (e) => {
        setTimeFocused(true);
        handleFocus(e);
    };

    const handleCalendarToggle = (nextShow) => {
        if (disabled || readonly) return;
        setIsCalendarOpen(nextShow);
        if (nextShow) {
            setViewDate(selectedDate || new Date());
        }
    };

    const handleDayClick = (date) => {
        if (disabled) return;

        // Validate constraints
        let isValid = true;
        if (minDate) {
            const min = parseDate(minDate);
            if (min && date < new Date(min.getFullYear(), min.getMonth(), min.getDate()).setHours(0, 0, 0, 0)) {
                isValid = false;
            }
        }
        if (maxDate) {
            const max = parseDate(maxDate);
            if (max && date > new Date(max.getFullYear(), max.getMonth(), max.getDate()).setHours(23, 59, 59, 999)) {
                isValid = false;
            }
        }

        if (isValid) {
            setSelectedDate(date);
            const formattedDate = formatDateForInput(date);
            if (onChange) {
                onChange({
                    date: formattedDate,
                    time: timeHours && timeMinutes ? `${timeHours}:${timeMinutes} ${amPm}` : null
                });
            }
            setIsCalendarOpen(false);
        }
    };

    const handleNav = (dir) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);
        setViewDate(newDate);
    };

    const handleTimeChange = (type, value) => {
        if (disabled || readonly) return;
        
        // Validate and format
        if (type === 'hours') {
            const num = parseInt(value) || 0;
            if (num >= 0 && num <= 23) {
                setTimeHours(String(num).padStart(2, '0'));
            } else if (value === '') {
                setTimeHours('');
            }
        } else if (type === 'minutes') {
            const num = parseInt(value) || 0;
            if (num >= 0 && num <= 59) {
                setTimeMinutes(String(num).padStart(2, '0'));
            } else if (value === '') {
                setTimeMinutes('');
            }
        }
        
        // Trigger onChange with current values
        const currentHours = type === 'hours' ? (value ? String(parseInt(value) || 0).padStart(2, '0') : '') : timeHours;
        const currentMinutes = type === 'minutes' ? (value ? String(parseInt(value) || 0).padStart(2, '0') : '') : timeMinutes;
        
        if (onChange) {
            onChange({
                date: selectedDate ? formatDateForInput(selectedDate) : null,
                time: currentHours && currentMinutes ? `${currentHours}:${currentMinutes} ${amPm}` : null
            });
        }
    };

    const handleAmPmChange = (newAmPm) => {
        if (disabled || readonly) return;
        setAmPm(newAmPm);
        setIsAmPmOpen(false);
        
        if (onChange && selectedDate) {
            onChange({
                date: formatDateForInput(selectedDate),
                time: timeHours && timeMinutes ? `${timeHours}:${timeMinutes} ${newAmPm}` : null
            });
        }
    };

    // Determine border color based on state
    const getBorderColor = () => {
        if (disabled || readonly) return 'var(--color-outline-variant)';
        if (validation === 'invalid') return 'var(--color-danger)';
        if (validation === 'success') return 'var(--color-success)';
        if (isFocused) return 'var(--color-primary)';
        return 'var(--color-outline-variant)';
    };

    // Determine background color based on state
    const getBackgroundColor = () => {
        if (disabled) return 'var(--color-surface-container-low)';
        if (readonly) return 'var(--color-surface-container)';
        return 'var(--color-surface-container-lowest)';
    };

    // Determine text color based on state
    const getTextColor = () => {
        if (disabled) return 'var(--color-on-surface-variant)';
        if (readonly && !selectedDate) return 'var(--color-on-surface-variant)';
        return 'var(--color-on-surface)';
    };

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    // Calendar Render Logic
    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();

        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="plus-datetime-calendar-day plus-datetime-calendar-day-other-month body2-txt">
                    {prevMonthLastDay - i}
                </div>
            );
        }

        // Current month days
        const normalizedMin = minDate ? parseDate(minDate) : null;
        if (normalizedMin) normalizedMin.setHours(0, 0, 0, 0);

        const normalizedMax = maxDate ? parseDate(maxDate) : null;
        if (normalizedMax) normalizedMax.setHours(23, 59, 59, 999);

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
                        plus-datetime-calendar-day body2-txt
                        ${isDisabled ? 'plus-datetime-calendar-day-disabled' : ''}
                        ${isSelected ? 'plus-datetime-calendar-day-selected' : ''}
                        ${isToday ? 'plus-datetime-calendar-day-today' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }

        // Next month days
        const totalCells = days.length;
        const remaining = 42 - totalCells;
        for (let i = 1; i <= remaining; i++) {
            days.push(
                <div key={`next-${i}`} className="plus-datetime-calendar-day plus-datetime-calendar-day-other-month body2-txt">
                    {i}
                </div>
            );
        }

        return days;
    };

    const validationIcon = validation === 'invalid' ? (
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
    ) : validation === 'success' ? (
        <i className="fa-solid fa-circle-check" aria-hidden="true" />
    ) : null;

    // Custom date toggle for calendar
    const DateToggle = React.forwardRef(({ children, onClick }, ref) => (
        <div
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            style={{ display: 'contents' }}
        />
    ));

    return (
        <div 
            className={`plus-datetime-wrapper ${className}`} 
            style={style}
        >
            {showLabel && label && (
                <Form.Label htmlFor={id || name} className="plus-datetime-label">
                    {label}
                    {required && (
                        <span className="plus-datetime-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            
            <div className="plus-datetime-container">
                {/* Date Picker */}
                <div className="plus-datetime-date-wrapper">
                    <Dropdown
                        show={isCalendarOpen}
                        onToggle={handleCalendarToggle}
                        className="plus-datetime-date-dropdown"
                    >
                        <Dropdown.Toggle as={DateToggle} />
                        <div className="plus-datetime-date-input-container">
                            <Form.Control
                                ref={dateInputRef}
                                type="text"
                                id={id ? `${id}-date` : undefined}
                                name={name ? `${name}-date` : undefined}
                                placeholder={datePlaceholder}
                                value={selectedDate ? formatDateForInput(selectedDate) : ''}
                                disabled={disabled}
                                readOnly={readonly}
                                className={`plus-datetime-date-input ${sizeClass}`}
                                style={{
                                    borderColor: getBorderColor(),
                                    backgroundColor: getBackgroundColor(),
                                    color: getTextColor(),
                                    paddingRight: '40px'
                                }}
                                onFocus={handleDateFocus}
                                onBlur={handleBlur}
                                onClick={() => !disabled && !readonly && setIsCalendarOpen(true)}
                            />
                            <div 
                                className="plus-datetime-calendar-icon"
                                onClick={() => !disabled && !readonly && setIsCalendarOpen(!isCalendarOpen)}
                            >
                                <i className="fa-regular fa-calendar" aria-hidden="true" />
                            </div>
                        </div>
                        <Dropdown.Menu
                            ref={calendarRef}
                            className={`plus-datetime-calendar plus-datetime-calendar-align-${calendarAlign}`}
                            renderOnMount
                        >
                            <div className="plus-datetime-calendar-header">
                                <button 
                                    type="button" 
                                    className="plus-datetime-calendar-nav" 
                                    onClick={() => handleNav(-1)} 
                                    aria-label="Previous month"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="plus-datetime-calendar-month-year h6">
                                    {formatMonthYear(viewDate)}
                                </div>
                                <button 
                                    type="button" 
                                    className="plus-datetime-calendar-nav" 
                                    onClick={() => handleNav(1)} 
                                    aria-label="Next month"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            <div className="plus-datetime-calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="plus-datetime-calendar-weekday body3-txt">{d}</div>
                                ))}
                            </div>
                            <div className="plus-datetime-calendar-days">
                                {renderCalendarDays()}
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                {/* Time Picker */}
                <div className="plus-datetime-time-wrapper">
                    <div className="plus-datetime-time-input-container">
                        <Form.Control
                            ref={timeInputRef}
                            type="text"
                            id={id ? `${id}-time` : undefined}
                            name={name ? `${name}-time` : undefined}
                            placeholder={timePlaceholder}
                            value={timeHours && timeMinutes ? `${timeHours}:${timeMinutes}` : (timeHours ? `${timeHours}:` : '')}
                            disabled={disabled}
                            readOnly={readonly}
                            className={`plus-datetime-time-input ${sizeClass}`}
                            style={{
                                borderColor: getBorderColor(),
                                backgroundColor: timeFocused ? 'var(--color-primary-state-08)' : getBackgroundColor(),
                                color: getTextColor()
                            }}
                            onFocus={handleTimeFocus}
                            onBlur={handleBlur}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                // Handle format like "HH:MM" or "HHMM" or "H:MM"
                                const match = value.match(/(\d{1,2}):?(\d{0,2})/);
                                if (match) {
                                    const hours = match[1];
                                    const minutes = match[2] || '';
                                    handleTimeChange('hours', hours);
                                    if (minutes) {
                                        handleTimeChange('minutes', minutes);
                                    }
                                } else if (value === '') {
                                    setTimeHours('');
                                    setTimeMinutes('');
                                    if (onChange) {
                                        onChange({
                                            date: selectedDate ? formatDateForInput(selectedDate) : null,
                                            time: null
                                        });
                                    }
                                }
                            }}
                        />
                    </div>
                    <Dropdown
                        show={isAmPmOpen}
                        onToggle={setIsAmPmOpen}
                        className="plus-datetime-am-pm-dropdown"
                    >
                        <Dropdown.Toggle
                            className={`plus-datetime-am-pm-toggle ${sizeClass} ${isAmPmOpen ? 'plus-datetime-am-pm-toggle-active' : ''}`}
                            disabled={disabled || readonly}
                            style={{
                                borderColor: getBorderColor(),
                                backgroundColor: isAmPmOpen ? 'var(--color-primary-state-08)' : (timeFocused ? 'var(--color-primary-state-08)' : getBackgroundColor()),
                                color: isAmPmOpen ? 'var(--color-primary)' : getTextColor()
                            }}
                        >
                            {amPm}
                            <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleAmPmChange('AM')}>AM</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleAmPmChange('PM')}>PM</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            {validation !== 'none' && validationMessage && (
                <div className={`plus-datetime-validation plus-datetime-validation-${validation}`}>
                    {validationIcon}
                    <span className="plus-datetime-validation-message">{validationMessage}</span>
                </div>
            )}
        </div>
    );
};

DateAndTimePicker.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    datePlaceholder: PropTypes.string,
    timePlaceholder: PropTypes.string,
    dateValue: PropTypes.string,
    timeValue: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.string,
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    calendarAlign: PropTypes.oneOf(['left', 'center', 'right']),
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default DateAndTimePicker;
