import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DatePicker from '../DatePicker/DatePicker';
import TimePicker from '../TimePicker/TimePicker';
import useFieldId from '../useFieldId';
import { FieldCaption } from '../_internal/FieldFrame';
import { formatIso, parseDate } from '../_internal/dates';
import { knownZone, localTimeZone, timeZoneCaption, wallTimeToUtc } from '../_internal/timeZones';
import './DateTimePicker.scss';

/**
 * A typed date, `MM/DD/YYYY` or legacy `MM/DD/YY` (assumed 20XX), or ISO
 * `YYYY-MM-DD`, into a Date — or null.
 *
 * @param {string|Date|null|undefined} input
 * @returns {Date|null}
 */
const parseLegacyDate = (input) => {
    if (!input) return null;
    if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
    const slashParts = input.split('/');
    if (slashParts.length === 3) {
        const month = parseInt(slashParts[0], 10) - 1;
        const day = parseInt(slashParts[1], 10);
        const year = slashParts[2].length === 2 ? parseInt(slashParts[2], 10) + 2000 : parseInt(slashParts[2], 10);
        const date = new Date(year, month, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    return parseDate(input);
};

/** @param {Date|null} date @returns {string} `MM/DD/YY` */
const formatDateForInput = (date) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
};

/** A 12-hour string ("02:30 PM") into 24-hour parts, or null until both halves are set. */
const parseTimeText = (value) => {
    if (!value) return null;
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    const h12 = parseInt(match[1], 10) % 12;
    const period = match[3].toUpperCase();
    return { hours: period === 'PM' ? h12 + 12 : h12, minutes: parseInt(match[2], 10) };
};

/**
 * DateTimePicker — a date field and a time field read as one moment.
 * Composed from DatePicker and TimePicker, laid out as labeled sections with a
 * shared time-zone caption under the time.
 */
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
    const [dateIso, setDateIso] = useState(() => {
        const date = parseLegacyDate(dateValue);
        return date ? formatIso(date) : '';
    });
    const [timeText, setTimeText] = useState(() => timeValue || '');

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

    // Sync with external values.
    useEffect(() => {
        if (dateValue === undefined) return;
        const date = parseLegacyDate(dateValue);
        setDateIso(date ? formatIso(date) : '');
    }, [dateValue]);

    useEffect(() => {
        if (timeValue === undefined) return;
        setTimeText(timeValue || '');
    }, [timeValue]);

    /**
     * Tells the caller the value: the date and time as shown, and the moment
     * in UTC, which is what to store.
     */
    const report = (iso, text) => {
        if (!onChange) return;
        const date = parseDate(iso);
        const time = parseTimeText(text);
        onChange({
            date: date ? formatDateForInput(date) : null,
            time: text || null,
            utc: (iso && time) ? wallTimeToUtc({ date: iso, hours: time.hours, minutes: time.minutes, timeZone: zone }) : null,
        });
    };

    const handleDateChange = (iso) => {
        setDateIso(iso);
        report(iso, timeText);
    };

    const handleTimeChange = (text) => {
        setTimeText(text || '');
        report(dateIso, text);
    };

    const utc = useMemo(() => {
        const time = parseTimeText(timeText);
        return (dateIso && time) ? wallTimeToUtc({ date: dateIso, hours: time.hours, minutes: time.minutes, timeZone: zone }) : null;
    }, [dateIso, timeText, zone]);
    const caption = useMemo(
        () => (showCaption ? timeZoneCaption({ timeZone: zone, otherTimeZone, otherPerson, utc }) : ''),
        [showCaption, zone, otherTimeZone, otherPerson, utc],
    );

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

            {/* Date: the real DatePicker, as its own page draws it. */}
            {showDate && <div className="plus-datetime-section">
                {showSectionLabels && <div id={dateSectionLabelId} className="plus-datetime-section-label">Date</div>}
                <DatePicker
                    id={dateInputId}
                    name={name ? `${name}-date` : undefined}
                    aria-labelledby={dateLabelledBy || undefined}
                    aria-label={dateLabelledBy ? undefined : 'Date'}
                    placeholder={datePlaceholder}
                    value={dateIso}
                    spacing={spacing}
                    isDisabled={isDisabled}
                    isReadOnly={isReadOnly}
                    isInvalid={isInvalid}
                    isValid={isValid}
                    minDate={minDate}
                    maxDate={maxDate}
                    calendarAlign={calendarAlign}
                    className="plus-datetime-date-field"
                    onChange={handleDateChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </div>}

            {/* Time: the real TimePicker, as its own page draws it. */}
            <div className="plus-datetime-section">
                {showSectionLabels && <div id={timeSectionLabelId} className="plus-datetime-section-label">Time</div>}
                <TimePicker
                    id={timeInputId}
                    name={name ? `${name}-time` : undefined}
                    aria-labelledby={timeLabelledBy || undefined}
                    aria-label={timeLabelledBy ? undefined : 'Time'}
                    placeholder={timePlaceholder}
                    value={timeText}
                    spacing={spacing}
                    isDisabled={isDisabled}
                    isReadOnly={isReadOnly}
                    isInvalid={isInvalid}
                    isValid={isValid}
                    className="plus-datetime-time-field"
                    onChange={handleTimeChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
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
    /** The visible label above the field. */
    label: PropTypes.node,
    /** Shows an asterisk on the label. */
    isRequired: PropTypes.bool,
    isLabelHidden: PropTypes.bool,
    /** Shows the Date and Time labels above each input. Defaults to `true`. */
    showSectionLabels: PropTypes.bool,
    showDate: PropTypes.bool,
    /** Hint text shown while the date input is empty. Defaults to `MM/DD/YY`. */
    datePlaceholder: PropTypes.string,
    /** Hint text shown while the time input is empty. Defaults to `__ : __`. */
    timePlaceholder: PropTypes.string,
    dateValue: PropTypes.string,
    timeValue: PropTypes.string,
    /** `default` is 40; `compact` is 32. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Disables both the date and time inputs. */
    isDisabled: PropTypes.bool,
    /** Shows both values without letting the user change them. */
    isReadOnly: PropTypes.bool,
    /** Draws both inputs invalid and shows `errorMessage`. */
    isInvalid: PropTypes.bool,
    /** Draws both inputs valid and shows `successMessage`. */
    isValid: PropTypes.bool,
    /** Message shown under the field when `isInvalid` is set. */
    errorMessage: PropTypes.string,
    /** Message shown under the field when `isValid` is set. `isInvalid` takes precedence. */
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
