/**
 * Time zones for DateAndTimePicker. Times are stored in UTC and shown in the
 * viewer's zone, which the caption under the time names; when the other
 * person in a session is in another zone, the caption adds their time.
 */

/** The viewer's own zone, as the browser reports it. */
export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * The zone if the browser knows it, else null. A stored zone can be stale or
 * mistyped, and Intl throws on one it does not know.
 *
 * @param {string|undefined} timeZone IANA name
 * @returns {string|null}
 */
export const knownZone = (timeZone) => {
    if (!timeZone) return null;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
        return timeZone;
    } catch {
        return null;
    }
};

/**
 * One part of a date formatted in a zone.
 *
 * @param {Date} at
 * @param {string} timeZone
 * @param {'longGeneric'|'shortGeneric'} style
 * @returns {string}
 */
const zonePart = (at, timeZone, style) => new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: style })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value ?? timeZone;

/**
 * "Eastern Time (ET)": the zone's generic name and its abbreviation.
 *
 * @param {string} timeZone IANA name
 * @param {Date} [at] the moment, which decides nothing for generic names but keeps Intl honest
 * @returns {string}
 */
export const zoneName = (timeZone, at = new Date()) => {
    const long = zonePart(at, timeZone, 'longGeneric');
    const short = zonePart(at, timeZone, 'shortGeneric');
    return short && short !== long ? `${long} (${short})` : long;
};

/**
 * How far a zone is ahead of UTC at a moment, in ms.
 *
 * @param {number} utcMs
 * @param {string} timeZone
 * @returns {number}
 */
const offset = (utcMs, timeZone) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    }).formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]));
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return asUtc - utcMs;
};

/**
 * The UTC moment a wall time stands for in a zone.
 *
 * @param {object} options
 * @param {string} options.date ISO `YYYY-MM-DD`
 * @param {number} options.hours 0–23
 * @param {number} options.minutes
 * @param {string} options.timeZone IANA name
 * @returns {string} ISO 8601 in UTC
 */
export const wallTimeToUtc = ({ date, hours, minutes, timeZone }) => {
    const [year, month, day] = date.split('-').map(Number);
    const wall = Date.UTC(year, month - 1, day, hours, minutes);
    // The offset at the guess, then again at the corrected moment, settles DST edges.
    let utc = wall - offset(wall, timeZone);
    utc = wall - offset(utc, timeZone);
    return new Date(utc).toISOString();
};

/**
 * The caption under the time.
 *
 * @param {object} options
 * @param {string} options.timeZone the viewer's zone
 * @param {string} [options.otherTimeZone] the other person's zone
 * @param {string} [options.otherPerson] who they are, such as "the student"
 * @param {string} [options.utc] the stored moment, when date and time are both set
 * @param {Date} [options.at] the moment to name the zone at, when there is no `utc`
 * @returns {string}
 */
export const timeZoneCaption = ({ timeZone, otherTimeZone, otherPerson, utc, at }) => {
    const moment = utc ? new Date(utc) : (at || new Date());
    const own = zoneName(timeZone, moment);
    if (!utc || !knownZone(otherTimeZone) || zoneName(otherTimeZone, moment) === own) return own;
    const theirs = new Intl.DateTimeFormat('en-US', { timeZone: otherTimeZone, hour: 'numeric', minute: '2-digit' }).format(moment);
    const who = otherPerson ? ` for ${otherPerson}` : '';
    return `${own} · ${theirs}${who} (${zonePart(moment, otherTimeZone, 'shortGeneric')})`;
};
