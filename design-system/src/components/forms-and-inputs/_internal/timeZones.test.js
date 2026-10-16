// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { knownZone, timeZoneCaption, wallTimeToUtc, zoneName } from './timeZones';

const oct21 = new Date(Date.UTC(2026, 9, 21, 12));

describe('zoneName', () => {
    it('names a zone the way the caption reads it', () => {
        expect(zoneName('America/New_York', oct21)).toBe('Eastern Time (ET)');
        expect(zoneName('America/Los_Angeles', oct21)).toBe('Pacific Time (PT)');
    });
});

describe('wallTimeToUtc', () => {
    it('stores a wall time as the UTC moment it is in that zone', () => {
        // 4:00 PM in New York on 21 Oct 2026 is daylight time, UTC−4.
        expect(wallTimeToUtc({ date: '2026-10-21', hours: 16, minutes: 0, timeZone: 'America/New_York' }))
            .toBe('2026-10-21T20:00:00.000Z');
        // After the clocks change, the same wall time is UTC−5.
        expect(wallTimeToUtc({ date: '2026-11-21', hours: 16, minutes: 0, timeZone: 'America/New_York' }))
            .toBe('2026-11-21T21:00:00.000Z');
    });
});

describe('timeZoneCaption', () => {
    it('names the viewer’s zone', () => {
        expect(timeZoneCaption({ timeZone: 'America/New_York', at: oct21 })).toBe('Eastern Time (ET)');
    });

    it('adds the other person’s time when their zone differs', () => {
        const utc = '2026-10-21T20:00:00.000Z';
        expect(timeZoneCaption({
            timeZone: 'America/Los_Angeles', otherTimeZone: 'America/New_York', otherPerson: 'the student', utc,
        })).toBe('Pacific Time (PT) · 4:00 PM for the student (ET)');
    });

    it('says nothing more when both are in one zone, or no time is set', () => {
        expect(timeZoneCaption({
            timeZone: 'America/New_York', otherTimeZone: 'America/New_York', otherPerson: 'the student', utc: '2026-10-21T20:00:00.000Z',
        })).toBe('Eastern Time (ET)');
        expect(timeZoneCaption({
            timeZone: 'America/Los_Angeles', otherTimeZone: 'America/New_York', otherPerson: 'the student', at: oct21,
        })).toBe('Pacific Time (PT)');
    });

    it('leaves the other person out when their zone is not a real one', () => {
        expect(timeZoneCaption({
            timeZone: 'America/New_York', otherTimeZone: 'Sample', otherPerson: 'the student', utc: '2026-10-21T20:00:00.000Z',
        })).toBe('Eastern Time (ET)');
    });
});

describe('knownZone', () => {
    it('keeps a real IANA zone and drops anything else', () => {
        expect(knownZone('America/New_York')).toBe('America/New_York');
        expect(knownZone('Sample')).toBeNull();
        expect(knownZone('')).toBeNull();
        expect(knownZone(undefined)).toBeNull();
    });
});
