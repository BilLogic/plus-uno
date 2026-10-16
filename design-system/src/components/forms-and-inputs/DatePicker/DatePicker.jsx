import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Field from '../_internal/Field';
import Calendar from '../_internal/Calendar';
import { useAnchoredPopup } from '../_internal/anchorPlacement';
import { formatDisplay, formatIso, outOfBounds, parseDate, parseTyped } from '../_internal/dates';
import '../_internal/Listbox.scss';
import './DatePicker.scss';

/** Joins a range's two ends in the field: "10/19/2026 – 10/23/2026". */
const RANGE_JOIN = ' – ';

/**
 * The text a value shows in the field.
 *
 * @param {Date|null|Array<Date|null>} picked
 * @returns {string}
 */
const display = (picked) => {
    if (!Array.isArray(picked)) return formatDisplay(picked);
    const [start, end] = picked;
    if (!start && !end) return '';
    return `${formatDisplay(start)}${RANGE_JOIN}${formatDisplay(end)}`.trim();
};

/**
 * The value a `value` prop stands for: a Date, or a range's two ends.
 *
 * @param {string|string[]|undefined} value
 * @param {boolean} range
 * @returns {Date|null|Array<Date|null>}
 */
const fromValue = (value, range) => {
    if (!range) return parseDate(Array.isArray(value) ? value[0] : value);
    const [start, end] = Array.isArray(value) ? value : [value, null];
    return [parseDate(start), parseDate(end)];
};

/**
 * DatePicker — a date field that opens a month calendar (Figma `DatePicker`).
 *
 * Built from the shared parts: the field is `_Field` with the calendar icon in
 * Trailing, and the calendar is the shared `Calendar` on the `_Listbox`
 * surface, which DateAndTimePicker opens too.
 *
 * - **Typing:** the field takes MM/DD/YYYY (and, with `range`, two dates
 *   joined by a dash). It is checked when you press Enter or leave the field:
 *   a real day inside `minDate`…`maxDate` is picked, anything else is kept as
 *   typed and marked invalid, and `onChange` is not called.
 * - **Range:** the first click sets the first day, the second the last; a click
 *   before the first day starts again. `onChange` receives `[start, end]`.
 * - **Popup:** opens 4px (`--size-element-gap-xs`) below the field, left-aligned
 *   (or as `calendarAlign` asks), and flips above with the same gap when there
 *   is no room below.
 *
 * Props it does not name (`aria-label`, `aria-labelledby`, `aria-describedby`,
 * `data-*`) go to the input, which is the control a screen reader lands on:
 * DatePicker has no `label` prop, so that is how a caller names it.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const DatePicker = ({
    id,
    name,
    placeholder,
    value,
    range = false,
    size = 'medium',
    disabled = false,
    readOnly = false,
    invalid = false,
    valid = false,
    minDate,
    maxDate,
    calendarAlign = 'left',
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const autoId = useId();
    const fieldId = id || name || `plus-date-picker-${autoId.replace(/:/g, '')}`;
    const popupId = `${fieldId}-calendar`;

    const [picked, setPicked] = useState(() => fromValue(value, range));
    const [text, setText] = useState(() => display(fromValue(value, range)));
    const [typedInvalid, setTypedInvalid] = useState(false);
    const [open, setOpen] = useState(false);
    const firstDay = (current) => (Array.isArray(current) ? current[0] || current[1] : current);
    const [viewDate, setViewDate] = useState(() => firstDay(fromValue(value, range)) || new Date());

    const fieldRef = useRef(null);
    const inputRef = useRef(null);
    const popupRef = useRef(null);

    const valueKey = Array.isArray(value) ? value.join('|') : value;
    useEffect(() => {
        if (value === undefined) return;
        const next = fromValue(value, range);
        setPicked(next);
        setText(display(next));
        setTypedInvalid(false);
        if (firstDay(next)) setViewDate(firstDay(next));
    }, [valueKey, range]); // eslint-disable-line react-hooks/exhaustive-deps

    const close = useCallback(() => setOpen(false), []);
    const place = useAnchoredPopup({ open, anchorRef: fieldRef, popupRef, align: calendarAlign, onClose: close });

    const interactive = !disabled && !readOnly;

    const openCalendar = () => {
        if (!interactive || open) return;
        setViewDate(firstDay(picked) || new Date());
        setOpen(true);
    };

    /** Records a pick and tells the caller. */
    const commit = (next) => {
        setPicked(next);
        setText(display(next));
        setTypedInvalid(false);
        if (Array.isArray(next)) onChange?.(next.map((date) => (date ? formatIso(date) : null)));
        else onChange?.(formatIso(next));
    };

    /** Reads the typed text: picks a valid date, marks anything else invalid. */
    const commitText = () => {
        if (text === display(picked)) return;
        if (!text.trim()) {
            commit(range ? [null, null] : null);
            return;
        }
        const allowed = (date) => date && !outOfBounds(date, minDate, maxDate);
        if (range) {
            const [first, second = ''] = text.split(/\s*[–—-]\s*/);
            const start = parseTyped(first);
            const end = second.trim() ? parseTyped(second) : null;
            const ok = allowed(start) && (!second.trim() || (allowed(end) && end >= start));
            if (!ok) { setTypedInvalid(true); return; }
            commit([start, end]);
            setViewDate(start);
            return;
        }
        const date = parseTyped(text);
        if (!allowed(date)) { setTypedInvalid(true); return; }
        commit(date);
        setViewDate(date);
    };

    const pick = (date) => {
        if (!range) {
            commit(date);
            setOpen(false);
            inputRef.current?.focus();
            return;
        }
        const [start, end] = Array.isArray(picked) ? picked : [null, null];
        if (!start || end || date < start) {
            commit([date, null]);
            return;
        }
        commit([start, date]);
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitText();
            setOpen(false);
        } else if (event.key === 'Escape') {
            if (open) event.preventDefault();
            setOpen(false);
        } else if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            openCalendar();
        }
    };

    // Leaving the field reads what was typed, including a Tab into the
    // calendar, which then shows the typed day.
    const handleBlur = (event) => {
        commitText();
        onBlur?.(event);
    };

    const isInvalid = invalid || typedInvalid;
    const [rangeStart, rangeEnd] = Array.isArray(picked) ? picked : [null, null];

    return (
        <>
            <Field
                ref={fieldRef}
                size={size}
                disabled={disabled}
                readOnly={readOnly}
                invalid={isInvalid}
                valid={valid}
                className={['plus-date-picker', open && 'plus-date-picker--open', className].filter(Boolean).join(' ')}
                style={style}
                trailing={(
                    <span
                        className="plus-date-picker__icon"
                        aria-hidden="true"
                        onMouseDown={(event) => {
                            if (!interactive) return;
                            event.preventDefault();
                            inputRef.current?.focus();
                            if (open) setOpen(false); else openCalendar();
                        }}
                    >
                        <i className="fa-solid fa-calendar-day" />
                    </span>
                )}
            >
                <input
                    {...props}
                    ref={inputRef}
                    type="text"
                    id={fieldId}
                    name={name}
                    className="plus-date-picker__input"
                    role="combobox"
                    autoComplete="off"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-controls={open ? popupId : undefined}
                    aria-invalid={isInvalid || undefined}
                    placeholder={placeholder ?? (range ? `MM/DD/YYYY${RANGE_JOIN}MM/DD/YYYY` : 'MM/DD/YYYY')}
                    value={text}
                    disabled={disabled}
                    readOnly={readOnly}
                    onClick={openCalendar}
                    onChange={(event) => {
                        setText(event.target.value);
                        setTypedInvalid(false);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={onFocus}
                    onBlur={handleBlur}
                />
            </Field>
            {open && createPortal(
                <div
                    ref={popupRef}
                    id={popupId}
                    role="dialog"
                    aria-label={range ? 'Choose dates' : 'Choose a date'}
                    className="plus-listbox plus-listbox--floating plus-date-popup"
                    data-placement={place?.placement ?? 'bottom'}
                    style={{
                        top: place?.top ?? 0,
                        left: place?.left ?? 0,
                        minWidth: place?.minWidth,
                        visibility: place ? undefined : 'hidden',
                    }}
                    // Keep focus in the field while a day is pressed.
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <Calendar
                        viewDate={viewDate}
                        onViewDateChange={setViewDate}
                        selected={range ? undefined : picked}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        minDate={minDate}
                        maxDate={maxDate}
                        size={size}
                        onPick={pick}
                    />
                </div>,
                document.body,
            )}
        </>
    );
};

DatePicker.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** Defaults to MM/DD/YYYY, or two of them for a range. */
    placeholder: PropTypes.string,
    /** ISO `YYYY-MM-DD`; with `range`, `[start, end]`, either end may be null. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    /** Pick a first and a last day. */
    range: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    /** Draws the field invalid; a typed date outside the allowed span does too. */
    invalid: PropTypes.bool,
    /** Draws the field valid, as a form does once a date is accepted. */
    valid: PropTypes.bool,
    /** The earliest day that can be picked or typed. */
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** The latest day that can be picked or typed. */
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** Which edge of the field the calendar lines up with. */
    calendarAlign: PropTypes.oneOf(['left', 'center', 'right']),
    /** `(iso)`, or `([start, end])` with `range`; '' or nulls when cleared. */
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default DatePicker;
