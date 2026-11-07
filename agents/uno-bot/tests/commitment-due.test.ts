// When a commitment falls due, and when uno-bot may say so — the arithmetic,
// as tables. 2026-09-29 is a Tuesday; ET is UTC-4 until 2026-11-01, then UTC-5.
import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import {
  addWorkingDays,
  askDateAt,
  checkInAt,
  commitmentDueAt,
  deadlineTime,
  firstReminderAt,
  followUpAt,
  headsUpAt,
  promiseDueAt,
  reminderPhase,
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
    ["due Thu night → Fri 09:00 ET", utc(10, 2, 4), "2026-10-02T13:00"],
    ["due Fri night → Mon 09:00 ET", utc(10, 3, 4), "2026-10-05T13:00"],
    ["due Sat night → Mon 09:00 ET", utc(10, 4, 4), "2026-10-05T13:00"],
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

test("nothing is sent outside the weekday 09:00 ET run (13:00 UTC in EDT)", () => {
  const table: Array<[string, number, boolean]> = [
    ["Tue 13:00", utc(9, 29, 13), true],
    ["Tue 13:40", utc(9, 29, 13, 40), true],
    ["Tue 12:59", utc(9, 29, 12, 59), false],
    ["Tue 14:00", utc(9, 29, 14), false],
    ["Wed 04:00, the end-of-day run", utc(9, 30, 4), false],
    ["Sat 13:00", utc(10, 3, 13), false],
    ["Sun 13:00", utc(10, 4, 13), false],
  ];
  for (const [name, now, want] of table) assert.equal(isMorningRunTime(now), want, name);
});

test("days are said as a weekday within the week, a date past it", () => {
  assert.equal(dayLabel(day(10, 1), day(9, 29)), "Thu");
  assert.equal(dayLabel(day(9, 29), day(10, 1)), "Tue");
  assert.equal(dayLabel(day(10, 12), day(9, 29)), "Oct 12");
  assert.equal(dueDayOf(commitmentDueAt(utc(9, 29, 15), "Thu").dueAt), day(10, 1));
});

test("the morning run is 09:00 ET on both sides of the 1 Nov 2026 change", () => {
  const table: Array<[string, number, boolean]> = [
    ["Fri 30 Oct 13:00 UTC, 09:00 EDT", utc(10, 30, 13), true],
    ["Fri 30 Oct 14:00 UTC, 10:00 EDT", utc(10, 30, 14), false],
    ["Mon 2 Nov 13:00 UTC, 8:00 EST", utc(11, 2, 13), false],
    ["Mon 2 Nov 14:00 UTC, 09:00 EST", utc(11, 2, 14), true],
    ["Mon 2 Nov 14:45 UTC", utc(11, 2, 14, 45), true],
    ["Mon 2 Nov 15:00 UTC", utc(11, 2, 15), false],
  ];
  for (const [name, now, want] of table) assert.equal(isMorningRunTime(now), want, name);
  // A commitment due Fri night is nudged Monday at 09:00 EST.
  assert.equal(iso(nudgeAt(endOfEtDay(day(10, 30)))), "2026-11-02T14:00");
  // One due Thu night is nudged Friday at 09:00 EDT.
  assert.equal(iso(nudgeAt(endOfEtDay(day(10, 29)))), "2026-10-30T13:00");
});

// ── One promise timeline ─────────────────────────────────────────────────────
// The worked cases, Made → Due → Heads-up → Check-in, the week of Mon Oct 19
// 2026 (EDT: 9:00 ET is 13:00 UTC).

/** An ET wall-clock time in October 2026, as epoch ms. */
const oct = (day: number, h = 9, m = 0) => Date.UTC(2026, 9, day, h + 4, m);
/** The 9:00 ET morning run on an October day. */
const morning = (day: number) => oct(day, 9);

describe("one promise timeline", () => {
  const cases: Array<[string, number, string | null, number | null, number | null, number | null]> = [
    // name, made, deadline, due moment, heads-up, check-in
    ['"by Thu": Mon → Thu → Wed → Fri', oct(19, 15), "Thu", oct(23, 0), morning(21), morning(23)],
    ['"tomorrow": Mon → Tue → Tue → Wed', oct(19, 15), "tomorrow", oct(21, 0), morning(20), morning(21)],
    ['"by Mon": Fri → Mon → Mon → Tue', oct(23, 15), "Mon", oct(27, 0), morning(26), morning(27)],
    ['"call at 1:30": Wed 12:07 → Wed 13:30 → none', oct(21, 12, 7), "1:30", oct(21, 13, 30), null, morning(22)],
    ['"review next Tue": Wed → Tue → Mon', oct(21, 15), "next Tue", oct(28, 0), morning(26), morning(28)],
    ['"update the PRD": Mon → none', oct(19, 15), null, null, null, null],
  ];
  for (const [name, made, deadline, due, headsUp, checkIn] of cases) {
    it(name, () => {
      const dueAt = promiseDueAt(made, deadline);
      assert.equal(dueAt, due, "due moment");
      if (dueAt === null) return;
      assert.equal(headsUpAt(made, dueAt), headsUp, "heads-up");
      assert.equal(checkInAt(dueAt), checkIn, "check-in");
      assert.equal(firstReminderAt(made, dueAt), headsUp ?? checkIn);
    });
  }

  it('"update the PRD": no date, so the next Monday run at least two working days on asks for one', () => {
    assert.equal(askDateAt(oct(19, 15)), morning(26), "Mon → next Mon");
    assert.equal(firstReminderAt(oct(19, 15), null), morning(26));
    assert.equal(askDateAt(oct(22, 15)), morning(26), "Thu: two working days on is Mon, so that Monday");
    assert.equal(askDateAt(oct(23, 15)), Date.UTC(2026, 10, 2, 14), "Fri: two working days on is Tue, so the Monday after");
  });

  it("a promise owed to you gets the check-in only, never a heads-up", () => {
    const dueAt = promiseDueAt(oct(19, 15), "Thu")!;
    assert.equal(firstReminderAt(oct(19, 15), dueAt, true), morning(23));
  });

  it("a stored time ends that day's moment at the time, not at the day's end", () => {
    assert.equal(promiseDueAt(oct(21, 9), "today at 1:30"), oct(21, 13, 30));
    assert.equal(promiseDueAt(oct(21, 9), "at 2pm"), oct(21, 14));
    assert.equal(promiseDueAt(oct(21, 9), "Thu at 10:15"), oct(22, 10, 15));
    assert.equal(promiseDueAt(oct(21, 9), "Thu"), oct(23, 0), "no time: the day's end");
    assert.deepEqual(deadlineTime("9:30"), { h: 9, m: 30 });
    assert.deepEqual(deadlineTime("1:30"), { h: 13, m: 30 });
    assert.equal(deadlineTime("10/3"), null, "a date is not a time");
    assert.equal(deadlineTime("Oct 3"), null);
  });

  it("no heads-up on a morning already past the due moment", () => {
    const dueAt = promiseDueAt(oct(19, 15), "tomorrow at 8am")!;
    assert.equal(headsUpAt(oct(19, 15), dueAt), null);
  });

  it("names each reminder by where the row stands: heads-up before its moment, check-in after, ask with none", () => {
    assert.equal(reminderPhase(oct(23, 0), morning(21)), "heads-up");
    assert.equal(reminderPhase(oct(23, 0), morning(23)), "check-in");
    assert.equal(reminderPhase(null, morning(26)), "ask-date");
  });

  it("an unanswered check-in gets one more, two working days on", () => {
    assert.equal(followUpAt(morning(23)), morning(27), "Fri → Tue");
  });
});
