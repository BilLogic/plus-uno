/**
 * Date helpers shared by DatePicker, DateAndTimePicker and the Calendar part.
 * Dates are local calendar days; ISO strings are `YYYY-MM-DD`.
 */

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Parses ISO `YYYY-MM-DD` (or a Date) into a new local Date.
 *
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    const parts = String(value).split('-');
    if (parts.length !== 3) return null;
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Parses what a person typed, `MM/DD/YYYY` (one-digit month and day allowed),
 * into a Date, or null when it is not a real day.
 *
 * @param {string} text
 * @returns {Date|null}
 */
export const parseTyped = (text) => {
    const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text || '');
    if (!match) return null;
    const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(year, month - 1, day);
    // 02/31 rolls over to March; a rolled date was not a real day.
    if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
};

/**
 * The start of a bound's day, for comparisons, or null when unbound.
 *
 * @param {string|Date|null|undefined} bound
 * @returns {number|null}
 */
export const startOfDay = (bound) => {
    const parsed = parseDate(bound);
    if (!parsed) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed.getTime();
};

/**
 * Whether a day falls outside the earliest and latest allowed dates.
 *
 * @param {Date} date
 * @param {string|Date} [minDate]
 * @param {string|Date} [maxDate]
 * @returns {boolean}
 */
export const outOfBounds = (date, minDate, maxDate) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const min = startOfDay(minDate);
    const max = startOfDay(maxDate);
    return (min != null && day < min) || (max != null && day > max);
};

/** @param {Date|null} date @returns {string} `YYYY-MM-DD`, or '' */
export const formatIso = (date) => (date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '');

/** @param {Date|null} date @returns {string} `MM/DD/YYYY`, or '' */
export const formatDisplay = (date) => (date
    ? `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
    : '');

/** @param {Date} date @returns {string} "October 2026" */
export const formatMonthYear = (date) => `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

/** @param {Date|null} a @param {Date|null} b @returns {boolean} */
export const sameDay = (a, b) => Boolean(a && b)
    && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
