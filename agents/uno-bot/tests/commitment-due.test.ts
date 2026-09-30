// When a commitment falls due, and when uno-bot may say so — the arithmetic,
// as tables. 2026-09-29 is a Tuesday; ET is UTC-4 until 2026-11-01, then UTC-5.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addWorkingDays,
  commitmentDueAt,
  dayLabel,
  deadlineDay,
  dueDayOf,
  endOfEtDay,
  etDayOf,
  isMorningRunTime,
  maySnooze,
  MAX_SNOOZES,
  nudgeAt,
  rearmedDueAt,
} from "../src/commitments/index";

const utc = (m: number, d: number, h = 0, min = 0) => Date.UTC(2026, m - 1, d, h, min);
const day = (m: number, d: number) => Date.UTC(2026, m - 1, d);
const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString().slice(0, 16));

test("an ET day starts and ends on ET midnights, in summer and in winter", () => {
  // 01:00 UTC on Sep 30 is still Sep 29 in New York.
  assert.equal(etDayOf(utc(9, 30, 1)), day(9, 29));
  assert.equal(etDayOf(utc(9, 30, 5)), day(9, 30));
  assert.equal(iso(endOfEtDay(day(9, 29))), "2026-09-30T04:00");
  assert.equal(iso(endOfEtDay(day(12, 1))), "2026-12-02T05:00");
  // The day DST ends still closes on the next midnight.
  assert.equal(iso(endOfEtDay(day(11, 1))), "2026-11-02T05:00");
});

test("working days skip the weekend", () => {
  const table: Array<[string, number, number, number]> = [
    ["Tue + 2 → Thu", day(9, 29), 2, day(10, 1)],
    ["Thu + 2 → Mon", day(10, 1), 2, day(10, 5)],
    ["Fri + 2 → Tue", day(10, 2), 2, day(10, 6)],
    ["Sat + 2 → Tue", day(10, 3), 2, day(10, 6)],
    ["Sun + 1 → Mon", day(10, 4), 1, day(10, 5)],
  ];
  for (const [name, from, n, want] of table) assert.equal(addWorkingDays(from, n), want, name);
});

test("a stated deadline names its ET day", () => {
  const tue = utc(9, 29, 15); // Tue 11:00 ET
  const table: Array<[string | null, string | null]> = [
    ["EOD", "2026-09-29"],
    ["by EOD", "2026-09-29"],
    ["today", "2026-09-29"],
    ["tomorrow", "2026-09-30"],
    ["EOD tomorrow", "2026-09-30"],
    ["Thu", "2026-10-01"],
    ["by Thursday", "2026-10-01"],
    ["thu eod", "2026-10-01"],
    ["Tue", "2026-10-06"], // said on a Tuesday: a week out
    ["Monday", "2026-10-05"],
    ["end of week", "2026-10-02"],
    ["2026-10-07", "2026-10-07"],
    ["10/9", "2026-10-09"],
    ["Oct 12", "2026-10-12"],
    ["12 October", "2026-10-12"],
    ["Oct 3rd", "2026-10-03"],
    ["Jan 5", "2027-01-05"], // a month and day already past roll to next year
    ["2026-09-01", null], // an ISO date already past names nothing
    ["Feb 30", null],
    ["soon", null],
    ["next sprint", null],
    ["", null],
    [null, null],
  ];
  for (const [said, want] of table) {
    const got = deadlineDay(said, tue);
    assert.equal(got === null ? null : new Date(got).toISOString().slice(0, 10), want, String(said));
  }
});

test("due_at: the end of the named day, or of the second working day after the promise", () => {
  const table: Array<[string, number, string | null, string, boolean]> = [
    ["Tue, by Thu", utc(9, 29, 15), "Thu", "2026-10-02T04:00", true],
    ["Tue, EOD", utc(9, 29, 15), "EOD", "2026-09-30T04:00", true],
    ["Tue, tomorrow", utc(9, 29, 15), "tomorrow", "2026-10-01T04:00", true],
    ["Tue, no deadline → Thu", utc(9, 29, 15), null, "2026-10-02T04:00", false],
    ["Thu, no deadline → Mon", utc(10, 1, 15), null, "2026-10-06T04:00", false],
    ["Fri evening ET, no deadline → Tue", utc(10, 3, 1), null, "2026-10-07T04:00", false],
    ["Tue, unreadable deadline → default", utc(9, 29, 15), "soon", "2026-10-02T04:00", false],
    ["Dec, no deadline, in EST", utc(12, 1, 15), null, "2026-12-04T05:00", false],
  ];
  for (const [name, promisedAt, deadline, want, stated] of table) {
    const got = commitmentDueAt(promisedAt, deadline);
    assert.equal(iso(got.dueAt), want, name);
    assert.equal(got.stated, stated, name);
  }
});

test("a nudge goes out at the first weekday morning run after due_at", () => {
  const table: Array<[string, number, string]> = [
    ["due Thu night → Fri 14:00", utc(10, 2, 4), "2026-10-02T14:00"],
    ["due Fri night → Mon 14:00", utc(10, 3, 4), "2026-10-05T14:00"],
    ["due Sat night → Mon 14:00", utc(10, 4, 4), "2026-10-05T14:00"],
  ];
  for (const [name, due, want] of table) assert.equal(iso(nudgeAt(due)), want, name);
});

test("⏳ re-arms due_at two working days out, at most twice", () => {
  // A ⏳ on Monday: due Wednesday night, checked Thursday morning.
  assert.equal(iso(rearmedDueAt(utc(10, 5, 15))), "2026-10-08T04:00");
  // On Thursday: due Monday night.
  assert.equal(iso(rearmedDueAt(utc(10, 1, 15))), "2026-10-06T04:00");
  assert.equal(MAX_SNOOZES, 2);
  assert.deepEqual([0, 1, 2, 3].map(maySnooze), [true, true, false, false]);
});

test("nothing is sent outside the weekday 14:00 UTC run", () => {
  const table: Array<[string, number, boolean]> = [
    ["Tue 14:00", utc(9, 29, 14), true],
    ["Tue 14:40", utc(9, 29, 14, 40), true],
    ["Tue 13:59", utc(9, 29, 13, 59), false],
    ["Tue 15:00", utc(9, 29, 15), false],
    ["Tue 22:00, the end-of-day run", utc(9, 29, 22), false],
    ["Sat 14:00", utc(10, 3, 14), false],
    ["Sun 14:00", utc(10, 4, 14), false],
  ];
  for (const [name, now, want] of table) assert.equal(isMorningRunTime(now), want, name);
});

test("days are said as a weekday within the week, a date past it", () => {
  assert.equal(dayLabel(day(10, 1), day(9, 29)), "Thu");
  assert.equal(dayLabel(day(9, 29), day(10, 1)), "Tue");
  assert.equal(dayLabel(day(10, 12), day(9, 29)), "Oct 12");
  assert.equal(dueDayOf(commitmentDueAt(utc(9, 29, 15), "Thu").dueAt), day(10, 1));
});
