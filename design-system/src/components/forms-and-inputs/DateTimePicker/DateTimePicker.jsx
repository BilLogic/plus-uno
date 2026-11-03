import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Dropdown from '../Dropdown/Dropdown';
import useFieldId from '../useFieldId';
import Calendar from '../_internal/Calendar';
import Field, { FieldCaption, toneProps } from '../_internal/Field';
import { popupLayerOf, useAnchoredPopup } from '../_internal/anchorPlacement';
import { formatIso } from '../_internal/dates';
import { knownZone, localTimeZone, timeZoneCaption, wallTimeToUtc } from '../_internal/timeZones';
import '../_internal/Listbox.scss';
import './DateTimePicker.scss';

const DateTimePicker = ({
    id,
    name,
    label,
    isRequired = false,
    /**
     * Hide the field label visually. It is still rendered, still carries
     * `htmlFor`, and still names the `group` — see the accessibility section in
     * `DateTimePicker.mdx` for why it cannot take the name away.
     */
    isLabelHidden = false,
    showSectionLabels = true,
    showDate = true,
    datePlaceholder = 'MM/DD/YY',
    timePlaceholder = '__ : __',
    dateValue,
    timeValue,
    spacing = 'default',
    isDisabled = false,
    isReadOnly = false,
    isInvalid = false,
    isValid = false,
    errorMessage,
    successMessage,
    minDate,
    maxDate,
    calendarAlign = 'left',
    /** The viewer's IANA time zone; times are shown in it and stored in UTC. */
    timeZone,
    /** Name the viewer's zone in a caption under the time. */
    showTimeZone = true,
    /** The other person's zone; when it differs, the caption adds their time. */
    otherTimeZone,
    /** Who the other person is in the caption, such as "the student". */
    otherPerson,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    /**
     * Everything not named above, forwarded to the wrapper — the one target
     * for both halves of the component, since `aria-describedby` wants the
     * field (this element), not either input.
     */
    ...props
}) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewDate, setViewDate] = useState(new Date());
    const [timeHours, setTimeHours] = useState('');
    const [timeMinutes, setTimeMinutes] = useState('');
    const [amPm, setAmPm] = useState('AM');
    const [isAmPmOpen, setIsAmPmOpen] = useState(false);

    const dateFieldRef = useRef(null);
    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);
    const calendarRef = useRef(null);
    // A zone the browser does not know falls back to the viewer's own, and the
    // caption stays off rather than name a zone nobody asked for.
    const zone = knownZone(timeZone) || localTimeZone();
    const showCaption = showTimeZone && (!timeZone || zone === timeZone);

    /**
     * Ids for a field that renders two controls.
     *
     * `label` names the field, not either input, so it labels a `group` and
     * each input is named `<field> Date` / `<field> Time` off the section
     * headings that were already on screen. The date and time ids keep the
     * `-date` / `-time` suffixes they have always had for callers who pass
     * `id`; what changes is that they are now always present, so the label's
     * `htmlFor` reaches one of them instead of reaching nothing.
     *
     * `isLabelHidden` is no part of that. It decides whether the label is
     * *seen*, not whether there is one: a field with a `label` names its group
     * and both inputs whether or not the text is on screen, which is the
     * contract `TextField` carries.
     */
    const fieldId = useFieldId(id);
    const hasLabel = Boolean(label);
    const labelId = hasLabel ? `${fieldId}-label` : undefined;
    const tone = isInvalid ? 'invalid' : (isValid ? 'success' : 'help');
    const message = isInvalid ? errorMessage : (isValid ? successMessage : undefined);
    const validationId = tone !== 'help' && message
        ? `${fieldId}-validation`
        : undefined;
    const timeZoneId = showCaption ? `${fieldId}-time-zone` : undefined;
    const dateInputId = `${fieldId}-date`;
    const timeInputId = `${fieldId}-time`;
    const dateSectionLabelId = showSectionLabels ? `${dateInputId}-section-label` : undefined;
    const timeSectionLabelId = showSectionLabels ? `${timeInputId}-section-label` : undefined;
    const dateLabelledBy = [labelId, dateSectionLabelId].filter(Boolean).join(' ');
    const timeLabelledBy = [labelId, timeSectionLabelId].filter(Boolean).join(' ');

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

                /*
                 * THE HOUR SHOWN IS A 12-HOUR HOUR, because an AM/PM control
                 * sits beside it. Without a period the value is 24-hour, so it
                 * is split into the hour this control can show and the period
                 * that says which half of the day it is — midnight and noon
                 * are the two that do not follow the modulo, and both read as
                 * 12.
                 */
                if (period) {
                    setAmPm(period);
                } else {
                    setAmPm(hours >= 12 ? 'PM' : 'AM');
                    hours = hours % 12 === 0 ? 12 : hours % 12;
                }
                setTimeHours(String(hours).padStart(2, '0'));
                setTimeMinutes(minutes);
            }
        }
    }, [timeValue]);

    /**
     * The UTC moment a date and a 12-hour time stand for in the viewer's zone,
     * or null until both halves are set.
     *
     * @param {Date|null} date
     * @param {string} hours "01"–"12"
     * @param {string} minutes
     * @param {'AM'|'PM'} period
     * @returns {string|null}
     */
    const toUtc = (date, hours, minutes, period) => {
        if (!date || !hours || !minutes) return null;
        const h12 = parseInt(hours, 10) % 12;
        return wallTimeToUtc({
            date: formatIso(date),
            hours: period === 'PM' ? h12 + 12 : h12,
            minutes: parseInt(minutes, 10),
            timeZone: zone,
        });
    };

    /**
     * Tells the caller the value: the date and time as shown, and the moment
     * in UTC, which is what to store.
     */
    const report = (date, hours, minutes, period) => {
        if (!onChange) return;
        onChange({
            date: date ? formatDateForInput(date) : null,
            time: hours && minutes ? `${hours}:${minutes} ${period}` : null,
            utc: toUtc(date, hours, minutes, period),
        });
    };

    // Focus and hover are drawn by `_Field` from `:focus-within`; these only
    // tell the caller.
    const handleFocus = (e) => {
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        // Moving into the calendar or the AM/PM menu is not leaving the field.
        if (calendarRef.current?.contains(e.relatedTarget) ||
            e.relatedTarget?.closest('.plus-datetime-am-pm-dropdown')) {
            return;
        }
        if (onBlur) onBlur(e);
    };

    const handleCalendarToggle = (nextShow) => {
        if (isDisabled || isReadOnly) return;
        setIsCalendarOpen(nextShow);
        if (nextShow) {
            setViewDate(selectedDate || new Date());
        }
    };

    const handleDayClick = (date) => {
        if (isDisabled) return;

        // Validate constraints
        let isValidDate = true;
        if (minDate) {
            const min = parseDate(minDate);
            if (min && date < new Date(min.getFullYear(), min.getMonth(), min.getDate()).setHours(0, 0, 0, 0)) {
                isValidDate = false;
            }
        }
        if (maxDate) {
            const max = parseDate(maxDate);
            if (max && date > new Date(max.getFullYear(), max.getMonth(), max.getDate()).setHours(23, 59, 59, 999)) {
                isValidDate = false;
            }
        }

        if (isValidDate) {
            setSelectedDate(date);
            report(date, timeHours, timeMinutes, amPm);
            setIsCalendarOpen(false);
        }
    };

    const handleTimeChange = (type, value) => {
        if (isDisabled || isReadOnly) return;

        // Validate and format
        if (type === 'hours') {
            const num = parseInt(value) || 0;
            /*
             * Twelve, not twenty-three. The field is displayed beside an AM/PM
             * control, so 23 was a bound from a clock this component does not
             * show: typing 20 was accepted and rendered as `20:00 PM`. Zero
             * stays inside the bound so a leading zero can be typed on the way
             * to `05`.
             */
            if (num >= 0 && num <= 12) {
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

        report(selectedDate, currentHours, currentMinutes, amPm);
    };

    const handleAmPmChange = (newAmPm) => {
        if (isDisabled || isReadOnly) return;
        setAmPm(newAmPm);
        setIsAmPmOpen(false);

        /*
         * Reported whether or not a date has been chosen: the two sibling
         * handlers, `handleTimeChange` and the date handler, both report with
         * whatever half they have, and a control that is silent about a
         * change the reader can see is worse than one that reports a
         * half-complete value.
         */
        report(selectedDate, timeHours, timeMinutes, newAmPm);
    };

    const interactive = !isDisabled && !isReadOnly;
    const tones = toneProps(tone);

    /* The shared calendar, placed by the popup rule: 4px under the date
     * field, left-aligned (or as `calendarAlign` asks), flipping above. */
    const closeCalendar = useCallback(() => setIsCalendarOpen(false), []);
    const calendarPlace = useAnchoredPopup({
        open: isCalendarOpen,
        anchorRef: dateFieldRef,
        popupRef: calendarRef,
        align: calendarAlign,
        onClose: closeCalendar,
    });

    const utc = toUtc(selectedDate, timeHours, timeMinutes, amPm);
    const caption = useMemo(
        () => (showCaption ? timeZoneCaption({ timeZone: zone, otherTimeZone, otherPerson, utc }) : ''),
        [showCaption, zone, otherTimeZone, otherPerson, utc],
    );

    /* The AM/PM control sits in the time field's Trailing slot. Live, it is
     * the PLUS Dropdown, whose menu opens 4px under it by the shared popup
     * rule; disabled or read-only, it only shows the period. */
    const periodToggle = (
        <button
            type="button"
            className="plus-datetime-am-pm-toggle"
            disabled={!interactive}
            aria-haspopup={interactive ? 'true' : undefined}
            aria-expanded={interactive ? isAmPmOpen : undefined}
        >
            {amPm}
            {!isReadOnly && <i className="fa-solid fa-caret-down" aria-hidden="true" />}
        </button>
    );
    const period = interactive ? (
        <Dropdown
            className="plus-datetime-am-pm-dropdown"
            isOpen={isAmPmOpen}
            onToggle={setIsAmPmOpen}
            toggle={periodToggle}
            items={['AM', 'PM'].map((option) => ({
                text: option,
                selected: amPm === option,
                onClick: () => handleAmPmChange(option),
            }))}
        />
    ) : periodToggle;

    /*
     * `{...props}` lands on the wrapper, which is also the `group`, so one
     * target serves both halves of what callers pass: `data-testid` wants the
     * outermost element, and `aria-describedby` wants the thing the
     * description is about — the field, which is this element, not either
     * input. It goes last so a caller's `aria-labelledby` overrides the
     * generated one.
     */
    return (
        <div
            className={`plus-datetime-wrapper ${className}`}
            style={style}
            role={hasLabel ? 'group' : undefined}
            aria-labelledby={labelId}
            {...props}
            /* After the spread, and composed with what the caller passed, so
             * pointing at your own help text does not drop the error and the
             * error does not drop your help text. */
            aria-describedby={[props['aria-describedby'], timeZoneId, validationId]
                .filter(Boolean).join(' ') || undefined}
        >
            {hasLabel && (
                <label
                    id={labelId}
                    htmlFor={showDate ? dateInputId : timeInputId}
                    className={`plus-datetime-label${isLabelHidden ? ' plus-datetime-label-hidden' : ''}`}
                >
                    {label}
                    {isRequired && (
                        <span className="plus-datetime-required" aria-label="required">*</span>
                    )}
                </label>
            )}

            {/* Date: `_Field` with the calendar icon in Trailing, as DatePicker draws it. */}
            {showDate && <div className="plus-datetime-section">
                {showSectionLabels && <div id={dateSectionLabelId} className="plus-datetime-section-label">Date</div>}
                <Field
                    ref={dateFieldRef}
                    spacing={spacing}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    {...tones.field}
                    className="plus-datetime-date-field"
                    trailing={(
                        <span
                            className="plus-datetime-calendar-icon"
                            aria-hidden="true"
                            onMouseDown={(event) => {
                                if (!interactive) return;
                                event.preventDefault();
                                dateInputRef.current?.focus();
                                handleCalendarToggle(!isCalendarOpen);
                            }}
                        >
                            <i className="fa-solid fa-calendar-day" />
                        </span>
                    )}
                >
                    <input
                        ref={dateInputRef}
                        type="text"
                        id={dateInputId}
                        name={name ? `${name}-date` : undefined}
                        aria-labelledby={dateLabelledBy || undefined}
                        aria-label={dateLabelledBy ? undefined : 'Date'}
                        placeholder={datePlaceholder}
                        value={selectedDate ? formatDateForInput(selectedDate) : ''}
                        disabled={isDisabled}
                        readOnly={isReadOnly}
                        className="plus-field__control plus-datetime-date-input"
                        {...tones.control}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onClick={() => interactive && handleCalendarToggle(true)}
                    />
                </Field>
                {isCalendarOpen && createPortal(
                    <div
                        ref={calendarRef}
                        id={`${dateInputId}-calendar`}
                        role="dialog"
                        aria-label="Choose a date"
                        className="plus-listbox plus-listbox--floating plus-date-popup"
                        data-placement={calendarPlace?.placement ?? 'bottom'}
                        style={{
                            top: calendarPlace?.top ?? 0,
                            left: calendarPlace?.left ?? 0,
                            minWidth: calendarPlace?.minWidth,
                            visibility: calendarPlace ? undefined : 'hidden',
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        <Calendar
                            viewDate={viewDate}
                            onViewDateChange={setViewDate}
                            selected={selectedDate}
                            minDate={minDate}
                            maxDate={maxDate}
                            onPick={handleDayClick}
                        />
                    </div>,
                    popupLayerOf(dateFieldRef),
                )}
            </div>}

            {/* Time: `_Field` with the AM/PM menu in Trailing. */}
            <div className="plus-datetime-section">
                {showSectionLabels && <div id={timeSectionLabelId} className="plus-datetime-section-label">Time</div>}
                <Field
                    spacing={spacing}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    {...tones.field}
                    className="plus-datetime-time-field"
                    trailing={period}
                >
                    <input
                        ref={timeInputRef}
                        type="text"
                        id={timeInputId}
                        name={name ? `${name}-time` : undefined}
                        aria-labelledby={timeLabelledBy || undefined}
                        aria-label={timeLabelledBy ? undefined : 'Time'}
                        placeholder={timePlaceholder}
                        value={timeHours && timeMinutes ? `${timeHours}:${timeMinutes}` : (timeHours ? `${timeHours}:` : '')}
                        disabled={isDisabled}
                        readOnly={isReadOnly}
                        className="plus-field__control plus-datetime-time-input"
                        {...tones.control}
                        onFocus={handleFocus}
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
                                report(selectedDate, '', '', amPm);
                            }
                        }}
                    />
                </Field>
                {showCaption && (
                    <div id={timeZoneId} className="plus-datetime-time-zone">{caption}</div>
                )}
            </div>

            {message && (
                <FieldCaption messageId={validationId} message={message} tone={tone} />
            )}
        </div>
    );
};

DateTimePicker.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    isRequired: PropTypes.bool,
    isLabelHidden: PropTypes.bool,
    showSectionLabels: PropTypes.bool,
    showDate: PropTypes.bool,
    datePlaceholder: PropTypes.string,
    timePlaceholder: PropTypes.string,
    dateValue: PropTypes.string,
    timeValue: PropTypes.string,
    /** `default` is 40; `compact` is 32. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    isDisabled: PropTypes.bool,
    isReadOnly: PropTypes.bool,
    isInvalid: PropTypes.bool,
    isValid: PropTypes.bool,
    errorMessage: PropTypes.string,
    successMessage: PropTypes.string,
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    calendarAlign: PropTypes.oneOf(['left', 'center', 'right']),
    /** The viewer's IANA time zone, such as `America/New_York`; defaults to the browser's, as does a zone the browser does not know, which also hides the caption. */
    timeZone: PropTypes.string,
    /** Name the viewer's zone under the time: "Eastern Time (ET)". */
    showTimeZone: PropTypes.bool,
    /** The other person's IANA zone; when it differs, the caption adds their time. */
    otherTimeZone: PropTypes.string,
    /** Who the other person is, as the caption says it: "the student". */
    otherPerson: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default DateTimePicker;
