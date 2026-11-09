import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Select from '../Select/Select';
import './TimePicker.scss';

/** Every half hour of the day, as 24-hour `HH:mm`: the list a time picker offers by default. */
export const DEFAULT_TIMES = Array.from({ length: 48 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, '0');
    return `${hours}:${i % 2 ? '30' : '00'}`;
});

/**
 * Reads a time in any of the shapes people type or callers pass: "02:30 PM",
 * "2:30pm", "2:30 p", "14:30", "1430", "930", "9". A time with AM or PM takes
 * an hour 1–12; one without is read as 24-hour, 0–23. Returns the canonical
 * 12-hour value this control reports, "02:30 PM", or null for anything that
 * is not a real time.
 *
 * @param {string|undefined|null} text
 * @returns {string|null}
 */
export const parseTime = (text) => {
    if (!text) return null;
    const raw = String(text).trim().toLowerCase();
    const periodMatch = raw.match(/([ap])\.?\s*m?\.?$/);
    const period = periodMatch ? periodMatch[1] : null;
    const body = periodMatch ? raw.slice(0, periodMatch.index).trim() : raw;
    if (!/^\d{1,2}(:?\d{2})?$/.test(body)) return null;

    const digits = body.replace(':', '');
    const split = body.includes(':') ? body.indexOf(':') : (digits.length > 2 ? digits.length - 2 : digits.length);
    let hours = parseInt(digits.slice(0, split), 10);
    const minutes = digits.length > split ? parseInt(digits.slice(split), 10) : 0;
    if (Number.isNaN(hours) || minutes > 59) return null;

    if (period) {
        if (hours < 1 || hours > 12) return null;
        if (period === 'a' && hours === 12) hours = 0;
        if (period === 'p' && hours !== 12) hours += 12;
    } else if (hours > 23) {
        return null;
    }

    const shown = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(shown).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
};

/** "02:30 PM" → "2:30 PM", the way a time reads in a list and a field. */
const labelFor = (value) => value.replace(/^0(\d)/, '$1');

/** Minutes since midnight, to keep the list in the order of the day. */
const minutesOf = (value) => {
    const [, h, m, period] = value.match(/(\d{2}):(\d{2}) (AM|PM)/);
    return ((parseInt(h, 10) % 12) + (period === 'PM' ? 12 : 0)) * 60 + parseInt(m, 10);
};

/**
 * TimePicker — a time field: type a time, or pick one from the list of the
 * day's times under it (Figma `Time picker`).
 *
 * It is the PLUS Select, searchable: the field is the shared `FieldBox`, the
 * list is the shared `Listbox`, so the box, the list, the keyboard and every
 * state are Select's. There is no separate AM/PM control: each time in the
 * list carries its own period, and typing "2:30p" or "1430" finds it.
 *
 * - **List:** `times`, 24-hour `HH:mm` strings, every half hour by default,
 *   shown as "2:30 PM". Typing filters it.
 * - **Typing a time that is not in the list** (`timeIsEditable`, on by
 *   default): Enter on the "Create" row reads it — "9:05", "905a", "21:05" —
 *   and picks it. Text that is not a real time is refused and the field is
 *   marked invalid.
 * - **Value:** a 12-hour string, "02:30 PM", or null once cleared. A 24-hour
 *   `value` ("14:30") is accepted and read the same way.
 *
 * Props it does not name (`aria-label`, `aria-labelledby`, `aria-describedby`,
 * `data-*`) go to the combobox, which is the control a screen reader lands
 * on: TimePicker has no `label` prop, so that is how a caller names it.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const TimePicker = ({
    id,
    name,
    placeholder = '__ : __',
    value,
    times = DEFAULT_TIMES,
    timeIsEditable = true,
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
    const [current, setCurrent] = useState(() => parseTime(value));
    const [typedInvalid, setTypedInvalid] = useState(false);

    useEffect(() => {
        if (value === undefined) return;
        setCurrent(parseTime(value));
        setTypedInvalid(false);
    }, [value]);

    // The day's times, in order, with the picked one added if it is between them.
    const options = useMemo(() => {
        const values = new Set(times.map(parseTime).filter(Boolean));
        if (current) values.add(current);
        return [...values]
            .sort((a, b) => minutesOf(a) - minutesOf(b))
            .map((v) => ({ value: v, label: labelFor(v) }));
    }, [times, current]);

    const commit = (next) => {
        setCurrent(next);
        setTypedInvalid(false);
        onChange?.(next);
    };

    const createOption = (text) => {
        const parsed = parseTime(text);
        if (!parsed) {
            setTypedInvalid(true);
            return null;
        }
        return { value: parsed, label: labelFor(parsed) };
    };

    return (
        <Select
            {...props}
            id={id}
            name={name}
            className={['plus-time-picker', className].filter(Boolean).join(' ')}
            style={style}
            options={options}
            value={current ?? null}
            placeholder={placeholder}
            isSearchable
            isCreatable={timeIsEditable}
            createOption={createOption}
            spacing={spacing}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            isInvalid={isInvalid || typedInvalid}
            isValid={isValid}
            onChange={(next) => commit(next ?? null)}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    );
};

TimePicker.propTypes = {
    /** The `id` of the combobox input. */
    id: PropTypes.string,
    /** Submitted with a form, as the 12-hour value. */
    name: PropTypes.string,
    /** Defaults to `__ : __`. */
    placeholder: PropTypes.string,
    /** A 12-hour string ("02:30 PM") or a 24-hour one ("14:30"). */
    value: PropTypes.string,
    /** The times the list offers, as 24-hour `HH:mm`. Every half hour of the day by default. */
    times: PropTypes.arrayOf(PropTypes.string),
    /** Lets a typed time that is not in the list be picked. On by default. */
    timeIsEditable: PropTypes.bool,
    /** `default` is 40; `compact` is 32. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Dims the field and blocks opening and changing it. */
    isDisabled: PropTypes.bool,
    /** Shows the time without letting the user change it. */
    isReadOnly: PropTypes.bool,
    /** Draws the field invalid; a typed text that is not a time does too. */
    isInvalid: PropTypes.bool,
    /** Draws the field valid. */
    isValid: PropTypes.bool,
    /** `(value)` — a 12-hour string, "02:30 PM", or null once cleared. */
    onChange: PropTypes.func,
    /** Focus entering the field from outside it. */
    onFocus: PropTypes.func,
    /** Focus leaving the field and its list. */
    onBlur: PropTypes.func,
    /** Extra class names on the field's wrapper, beside its own. */
    className: PropTypes.string,
    /** Inline style on the field's wrapper. */
    style: PropTypes.object,
};

export default TimePicker;
