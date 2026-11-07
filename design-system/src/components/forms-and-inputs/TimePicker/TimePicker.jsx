import React, { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import DropdownMenu from '../DropdownMenu/DropdownMenu';
import { ButtonItem } from '@/components/navigation/MenuGroup';
import FieldBox from '../_internal/FieldBox';
import './TimePicker.scss';

/**
 * Parses a 12-hour time string ("02:30 PM") or a 24-hour one ("14:30") into
 * the parts this control shows: an hour it can display (1–12), a minute, and
 * the period that says which half of the day a 24-hour value meant.
 *
 * @param {string|undefined} value
 * @returns {{ hours: string, minutes: string, period: 'AM'|'PM' }}
 */
const fromValue = (value) => {
    if (!value) return { hours: '', minutes: '', period: 'AM' };
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return { hours: '', minutes: '', period: 'AM' };
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const given = match[3]?.toUpperCase();
    const period = given || (hours >= 12 ? 'PM' : 'AM');
    if (!given) hours = hours % 12 === 0 ? 12 : hours % 12;
    return { hours: String(hours).padStart(2, '0'), minutes, period };
};

/** The 12-hour value this control reports: "02:30 PM", or null until both halves are set. */
const toValue = (hours, minutes, period) => (hours && minutes ? `${hours}:${minutes} ${period}` : null);

/** The text the field shows: "09:30", a bare hour while there is no minute yet, or ''. */
const displayText = (hours, minutes) => (hours && minutes ? `${hours}:${minutes}` : hours);

/**
 * Reads what was typed, honoring the 1–12 clock: a leading `0` or `1` can
 * start a two-digit hour (10, 11, 12); any other first digit is already a
 * complete hour, so the digit after it starts the minute. Accepts a colon
 * ("9:30") or bare digits ("0930").
 *
 * @param {string} text
 * @returns {{ hours: string, minutes: string }|null}
 */
const parseTyped = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length < 3) return null;
    const first = digits[0];
    const twoDigitHour = (first === '0' || first === '1') ? digits.slice(0, 2) : null;
    const hour = (twoDigitHour && parseInt(twoDigitHour, 10) >= 1 && parseInt(twoDigitHour, 10) <= 12)
        ? twoDigitHour
        : first;
    const minute = digits.slice(hour.length, hour.length + 2);
    if (minute.length < 2) return null;
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    return { hours: String(h).padStart(2, '0'), minutes: String(m).padStart(2, '0') };
};

/**
 * TimePicker — a time field with an AM/PM toggle (Figma `Time picker`).
 *
 * Built from the shared parts: the field is `FieldBox`, which owns the box,
 * the border, the fill, the size and every state, same as DatePicker; the
 * AM/PM menu in Trailing is the PLUS DropdownMenu.
 *
 * - **Typing:** the field takes an hour and a minute, with or without a
 *   colon. It is checked when you press Enter or leave the field: a real time
 *   (hour 1–12, minute 0–59) is picked, anything else is kept as typed and
 *   marked invalid, and `onChange` is not called.
 * - **Value:** a 12-hour string, "02:30 PM". A 24-hour value given through
 *   `value` is split into the hour this control can show and the period
 *   that says which half of the day it is.
 * - **AM/PM:** a separate toggle, since the field itself has no notion of
 *   one. Changing it reports immediately, with whichever half of the time is
 *   already set.
 *
 * Props it does not name (`aria-label`, `aria-labelledby`, `aria-describedby`,
 * `data-*`) go to the input, which is the control a screen reader lands on:
 * TimePicker has no `label` prop, so that is how a caller names it.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const TimePicker = ({
    id,
    name,
    placeholder = '__ : __',
    value,
    spacing = 'default',
    isDisabled = false,
    isReadOnly = false,
    isInvalid = false,
    isValid = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const autoId = useId();
    const fieldId = id || name || `plus-time-picker-${autoId.replace(/:/g, '')}`;

    const [hours, setHours] = useState(() => fromValue(value).hours);
    const [minutes, setMinutes] = useState(() => fromValue(value).minutes);
    const [period, setPeriod] = useState(() => fromValue(value).period);
    const [text, setText] = useState(() => displayText(fromValue(value).hours, fromValue(value).minutes));
    const [typedInvalid, setTypedInvalid] = useState(false);
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);

    useEffect(() => {
        if (value === undefined) return;
        const next = fromValue(value);
        setHours(next.hours);
        setMinutes(next.minutes);
        setPeriod(next.period);
        setText(displayText(next.hours, next.minutes));
        setTypedInvalid(false);
    }, [value]);

    const interactive = !isDisabled && !isReadOnly;

    const report = (nextHours, nextMinutes, nextPeriod) => {
        onChange?.(toValue(nextHours, nextMinutes, nextPeriod));
    };

    /** Reads the typed text: commits a real time, marks anything else invalid. */
    const commitText = () => {
        if (text === displayText(hours, minutes)) return;
        if (!text.trim()) {
            setHours('');
            setMinutes('');
            setText('');
            setTypedInvalid(false);
            report('', '', period);
            return;
        }
        const parsed = parseTyped(text);
        if (!parsed) { setTypedInvalid(true); return; }
        setHours(parsed.hours);
        setMinutes(parsed.minutes);
        setText(displayText(parsed.hours, parsed.minutes));
        setTypedInvalid(false);
        report(parsed.hours, parsed.minutes, period);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitText();
        } else if (event.key === 'Escape') {
            setText(displayText(hours, minutes));
            setTypedInvalid(false);
        }
    };

    const handleBlur = (event) => {
        commitText();
        onBlur?.(event);
    };

    const handlePeriodChange = (nextPeriod) => {
        if (!interactive) return;
        setPeriod(nextPeriod);
        setIsPeriodOpen(false);
        report(hours, minutes, nextPeriod);
    };

    const invalid = isInvalid || typedInvalid;

    const periodToggle = (
        <button
            type="button"
            className="plus-time-picker__period-toggle"
            disabled={!interactive}
        >
            {period}
            {!isReadOnly && <i className="fa-solid fa-caret-down" aria-hidden="true" />}
        </button>
    );
    const trailing = interactive ? (
        <DropdownMenu
            trigger={periodToggle}
            isOpen={isPeriodOpen}
            onOpenChange={setIsPeriodOpen}
        >
            {['AM', 'PM'].map((option) => (
                <ButtonItem key={option} isSelected={period === option} onClick={() => handlePeriodChange(option)}>
                    {option}
                </ButtonItem>
            ))}
        </DropdownMenu>
    ) : periodToggle;

    return (
        <FieldBox
            spacing={spacing}
            disabled={isDisabled}
            readOnly={isReadOnly}
            invalid={invalid}
            valid={isValid}
            className={['plus-time-picker', className].filter(Boolean).join(' ')}
            style={style}
            trailing={trailing}
        >
            <input
                {...props}
                type="text"
                id={fieldId}
                name={name}
                className="plus-time-picker__input"
                placeholder={placeholder}
                value={text}
                disabled={isDisabled}
                readOnly={isReadOnly}
                aria-invalid={invalid || undefined}
                onChange={(event) => {
                    setText(event.target.value);
                    setTypedInvalid(false);
                }}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onBlur={handleBlur}
            />
        </FieldBox>
    );
};

TimePicker.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** Defaults to `__ : __`. */
    placeholder: PropTypes.string,
    /** A 12-hour string ("02:30 PM") or a 24-hour one ("14:30"), split on read. */
    value: PropTypes.string,
    /** `default` is 40; `compact` is 32. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Disables the hour and minute inputs and the period menu. */
    isDisabled: PropTypes.bool,
    /** Shows the time without letting the user change it. */
    isReadOnly: PropTypes.bool,
    /** Draws the field invalid; a typed time outside 1–12 / 0–59 does too. */
    isInvalid: PropTypes.bool,
    /** Draws the field valid. */
    isValid: PropTypes.bool,
    /** `(value)` — a 12-hour string, or null once either half is cleared. */
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default TimePicker;
