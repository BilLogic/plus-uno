// When a commitment is due, and when uno-bot may say so. A promise — in a
// thread or in a DM — runs on one timeline (§ One promise timeline, below);
// a card follow-up and a "remind me" keep the rules just below.
//
// A COMMITMENT is due at the end of the day its promiser named — "by Thu",
// "tomorrow", "EOD", "Oct 3" — or, when they named none, at the end of the
// second working day after the promise. Days are the team's: US Eastern, Monday
// to Friday. Nothing is ever posted then: a nudge goes out at the first weekday
// morning run after `due_at` (`postableAt`, the sweep's rule), and only while
// that run is going (`isMorningRunTime`).
//
// A ⏳ re-arms `due_at` two working days out, at most `MAX_SNOOZES` times, and
// a nudge nobody answers re-arms it the same way for its one follow-up.
//
// A DAY here is an ET calendar date carried as the epoch ms of that date's UTC
// midnight, so adding a day is adding 24 h and its weekday is `getUTCDay`.
//
// PURE: no `Env`, no Slack, no Workers global.

import { etDayOf, etHourOn, etParts, isWorkday, MORNING_RUN_HOUR_ET, morningRunOn, postableAt } from "../sweep/schedule";

export { etDayOf };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Working days after the promise when no deadline was stated. */
export const DEFAULT_WORKING_DAYS = 2;
/** Working days a ⏳, or an unanswered nudge, re-arms `due_at` by. */
export const REARM_WORKING_DAYS = 2;
/** ⏳ re-arms a commitment at most this many times. */
export const MAX_SNOOZES = 2;
/** A commitment's wording outlives its due date by this, so every nudge a
 *  ⏳ or a follow-up can still bring finds it. */
export const TEXT_KEEP_MS = 30 * DAY_MS;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** The instant an ET day ends: the next ET midnight, 04:00 or 05:00 UTC. */
export function endOfEtDay(day: number): number {
  const edt = day + DAY_MS + 4 * 60 * 60 * 1000;
  return etParts(edt).h === 0 ? edt : edt + 60 * 60 * 1000;
}

function isWeekendDay(day: number): boolean {
  const wd = new Date(day).getUTCDay();
  return wd === 0 || wd === 6;
}

/** `n` Monday-to-Friday days after `day`. */
export function addWorkingDays(day: number, n: number): number {
  let at = day;
  for (let left = n; left > 0; ) {
    at += DAY_MS;
    if (!isWeekendDay(at)) left -= 1;
  }
  return at;
}

const WEEKDAY_WORDS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const MONTH_WORDS: Record<string, number> = Object.fromEntries(
  ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].flatMap(
    (name, i) => [
      [name, i],
      [name.slice(0, 3), i],
      ...(name === "september" ? [["sept", i] as const] : []),
    ],
  ),
);

/**
 * The ET day a stated deadline names, or null when it names none this parser
 * reads — the commitment is then due on the default.
 *
 * Read: "EOD" (and "today", "tonight", "end of day"), "tomorrow", a weekday
 * (the next one strictly after the promise's day — said on a Thursday, "Thu"
 * is a week out), "end of week" (that week's Friday, or the next one past a
 * weekend), an ISO date, "10/3" or "10/3/2026", and "Oct 3" or "3 October". A
 * date that has passed is none; a month and day without a year that has
 * passed this year is next year's.
 *
 * @param text - The deadline as the detector returned it
 * @param promisedAt - When the promise was made, epoch ms
 */
export function deadlineDay(text: string | null | undefined, promisedAt: number): number | null {
  const today = etDayOf(promisedAt);
  const lowered = (text ?? "").toLowerCase();
  // A time alone ("at 1:30") names today; with a day, the day names it.
  const withoutTime = lowered.replace(CLOCK_TIME, " ").replace(/\s+/g, " ").trim();
  if (!withoutTime && CLOCK_TIME.test(lowered)) return today;
  const said = withoutTime
    .replace(/[.,!]+$/g, "")
    .replace(/^(by|on|before|until|till|at)\s+/, "")
    .replace(/^(the\s+)?(eod|cob|end of (the )?day)\s+/, "")
    .replace(/\s+(eod|cob)$/, "")
    .trim();
  if (!said) return null;
  if (/^(eod|cob|end of (the )?day|today|tonight|this evening)$/.test(said)) return today;
  if (/^(tomorrow|tmrw|tmr)$/.test(said)) return today + DAY_MS;
  if (/^(eow|end of (the )?week|this week)$/.test(said)) {
    let day = today;
    while (new Date(day).getUTCDay() !== 5) day += DAY_MS;
    return day;
  }
  const weekday = WEEKDAY_WORDS[said.replace(/^(this|next)\s+/, "")];
  if (weekday !== undefined) {
    let day = today + DAY_MS;
    while (new Date(day).getUTCDay() !== weekday) day += DAY_MS;
    return day;
  }
  const { y } = etParts(promisedAt);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(said);
  if (iso) return dateOrNull(Number(iso[1]), Number(iso[2]), Number(iso[3]), today, false);
  const slashed = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(said);
  if (slashed) {
    const year = slashed[3] ? Number(slashed[3].length === 2 ? `20${slashed[3]}` : slashed[3]) : y;
    return dateOrNull(year, Number(slashed[1]), Number(slashed[2]), today, !slashed[3]);
  }
  const monthFirst = /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/.exec(said);
  const dayFirst = /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)$/.exec(said);
  const [monthWord, dayWord] = monthFirst ? [monthFirst[1]!, monthFirst[2]!] : dayFirst ? [dayFirst[2]!, dayFirst[1]!] : [];
  const month = monthWord === undefined ? undefined : MONTH_WORDS[monthWord];
  if (month !== undefined && dayWord !== undefined) return dateOrNull(y, month + 1, Number(dayWord), today, true);
  return null;
}

/** A clock time, which a date never is: a minute or an "am"/"pm" after the
 *  hour ("1:30", "at 2pm"), never a bare number ("Oct 12"). */
const CLOCK_TIME = /(?:^|\s)(?:at\s+)?\d{1,2}(?::\d{2}\s*(?:am|pm|a\.m\.|p\.m\.)?|\s*(?:am|pm|a\.m\.|p\.m\.))(?=\s|$)/;

/** A time of day as said: "1:30", "at 1:30", "1:30pm", "2 pm", "13:30". */
const TIME_SAID = /(?:^|\s)(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?=\s|$)/;

/**
 * The time of day a stated deadline names, ET, or null when it names none.
 * A bare hour needs "am" or "pm", or a minute ("1:30"); a time without "am"
 * or "pm" is read as a working-hours time, so "1:30" is 1:30 PM and "9:30" is
 * 9:30 AM.
 *
 * @param text - The deadline as the detector returned it
 */
export function deadlineTime(text: string | null | undefined): { h: number; m: number } | null {
  const said = (text ?? "").toLowerCase();
  // A date's numbers are not a time.
  if (/\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2}/.test(said)) return null;
  const hit = TIME_SAID.exec(said);
  if (!hit) return null;
  const [, hh, mm, half] = hit;
  if (mm === undefined && half === undefined) return null;
  let h = Number(hh);
  const m = Number(mm ?? 0);
  if (h > 23 || m > 59) return null;
  if (half?.startsWith("p") && h < 12) h += 12;
  else if (half?.startsWith("a") && h === 12) h = 0;
  else if (half === undefined && h >= 1 && h <= 7) h += 12;
  return { h, m };
}

function dateOrNull(y: number, m: number, d: number, today: number, rollYear: boolean): number | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  let day = Date.UTC(y, m - 1, d);
  if (new Date(day).getUTCDate() !== d) return null; // Feb 30 and the like
  if (day < today && rollYear) day = Date.UTC(y + 1, m - 1, d);
  return day < today ? null : day;
}

/**
 * When a commitment falls due: the end of the day it names, or of the second
 * working day after the promise.
 *
 * @param promisedAt - When the promise was made, epoch ms
 * @param deadline - The stated deadline, as the detector returned it
 * @returns `dueAt` in epoch ms, and whether a stated deadline set it
 */
export function commitmentDueAt(promisedAt: number, deadline: string | null | undefined): { dueAt: number; stated: boolean } {
  const named = deadlineDay(deadline, promisedAt);
  if (named !== null) return { dueAt: endOfEtDay(named), stated: true };
  return { dueAt: endOfEtDay(addWorkingDays(etDayOf(promisedAt), DEFAULT_WORKING_DAYS)), stated: false };
}

// ── One promise timeline ─────────────────────────────────────────────────────
//
// Every promise, meetings included, runs on one timeline:
//   • DUE MOMENT — the day the promise names, at the time it names ("at 1:30")
//     or the day's end. None named, it has no due moment.
//   • HEADS-UP — the 9:00 ET morning run on the working day before the due
//     day; when that day is the day the promise was made, or no working day,
//     the morning of the due day. None when it is due the day it was made, or
//     when that morning is already past its moment.
//   • CHECK-IN — the morning run after the due moment, if the judge still
//     reads it open.
//   • NO DATE — the Monday morning run at least two working days after the
//     promise, asking for a date.
//   • OWED TO YOU — a check-in only, never a heads-up.
// After a check-in, a new date restarts the timeline; no answer gets one more
// check-in two working days on, and then the row lapses.

const ET_DAY = DAY_MS;

/**
 * A promise's due moment: the day it names at the time it names, or the end
 * of that day; null when it names no day.
 *
 * @param promisedAt - When the promise was made, epoch ms
 * @param deadline - The stated deadline, as the detector returned it
 */
export function promiseDueAt(promisedAt: number, deadline: string | null | undefined): number | null {
  const day = deadlineDay(deadline, promisedAt);
  if (day === null) return null;
  const time = deadlineTime(deadline);
  if (!time) return endOfEtDay(day);
  return etHourOn(day, time.h) + time.m * 60 * 1000;
}

/** The ET day a due moment falls on: a time's own day, an end of day's day. */
function dueDay(dueAt: number): number {
  return etDayOf(dueAt - 1);
}

/**
 * When the heads-up goes out: the morning run on the working day before the
 * due day, or on the due day itself when that day is the day the promise was
 * made or no working day. Null when due the day it was made, or when that
 * morning is not before the due moment.
 *
 * @param promisedAt - When the promise was made, epoch ms
 * @param dueAt - Its due moment (`promiseDueAt`)
 */
export function headsUpAt(promisedAt: number, dueAt: number): number | null {
  const made = etDayOf(promisedAt);
  const due = dueDay(dueAt);
  if (due <= made) return null;
  const before = due - ET_DAY;
  let day = before === made || !isWorkday(before) ? due : before;
  if (!isWorkday(day)) {
    // Due on a weekend, which has no run: the last working day before it,
    // when that comes after the day it was made.
    do day -= ET_DAY;
    while (!isWorkday(day));
    if (day <= made) return null;
  }
  const at = morningRunOn(day);
  return at < dueAt && at > promisedAt ? at : null;
}

/** When the check-in goes out: the first morning run after the due moment. */
export function checkInAt(dueAt: number): number {
  return postableAt(dueAt);
}

/**
 * When a promise that names no date is asked for one: the Monday morning run
 * on or after the second working day after it was made.
 *
 * @param promisedAt - When the promise was made, epoch ms
 */
export function askDateAt(promisedAt: number): number {
  let day = addWorkingDays(etDayOf(promisedAt), DEFAULT_WORKING_DAYS);
  while (new Date(day).getUTCDay() !== 1) day += ET_DAY;
  return morningRunOn(day);
}

/** When an unanswered check-in gets its one more: the morning run two
 *  working days on. */
export function followUpAt(at: number): number {
  return morningRunOn(addWorkingDays(etDayOf(at), REARM_WORKING_DAYS));
}

/**
 * The first time a promise's row is due: its heads-up, else its check-in, else
 * the Monday it is asked for a date. A promise owed to you gets no heads-up.
 *
 * @param promisedAt - When the promise was made, epoch ms
 * @param dueAt - Its due moment, or null when it names no day
 * @param owedToYou - Someone else's promise to the person reminded
 */
export function firstReminderAt(promisedAt: number, dueAt: number | null, owedToYou = false): number {
  if (dueAt === null) return askDateAt(promisedAt);
  return (owedToYou ? null : headsUpAt(promisedAt, dueAt)) ?? checkInAt(dueAt);
}

/** Which reminder a due row is: before its due moment, a heads-up; after, a
 *  check-in; with no due moment, the ask for a date. */
export type ReminderPhase = "heads-up" | "check-in" | "ask-date";

/**
 * The reminder a row due now is.
 *
 * @param dueAt - Its due moment, or null when it names no day
 * @param now - The morning's clock
 */
export function reminderPhase(dueAt: number | null, now: number): ReminderPhase {
  if (dueAt === null) return "ask-date";
  return now < dueAt ? "heads-up" : "check-in";
}

/**
 * `due_at` re-armed from `at`: the end of the second working day after it —
 * for a ⏳, and for the one follow-up an unanswered nudge gets.
 */
export function rearmedDueAt(at: number): number {
  return endOfEtDay(addWorkingDays(etDayOf(at), REARM_WORKING_DAYS));
}

/**
 * Whether a ⏳ may still re-arm a commitment that has been snoozed `snoozes`
 * times.
 */
export function maySnooze(snoozes: number): boolean {
  return snoozes < MAX_SNOOZES;
}

/** The first weekday morning run after `dueAt` — when its nudge may go out. */
export function nudgeAt(dueAt: number): number {
  return postableAt(dueAt);
}

/**
 * True only while a weekday's morning run is going: Monday to Friday, in the
 * 09:00 ET hour. Nothing is sent outside it, whatever job asks.
 */
export function isMorningRunTime(now: number): boolean {
  const wd = new Date(etDayOf(now)).getUTCDay();
  return wd >= 1 && wd <= 5 && etParts(now).h === MORNING_RUN_HOUR_ET;
}

/**
 * An ET day as people say it: its weekday ("Thu") within the six days after
 * `from`, otherwise its date ("Oct 3").
 *
 * @param day - The ET day
 * @param from - The ET day it is said on
 */
export function dayLabel(day: number, from: number): string {
  const d = new Date(day);
  const away = Math.abs(day - from) / DAY_MS;
  return away <= 6 ? WEEKDAY_NAMES[d.getUTCDay()]! : `${MONTH_NAMES[d.getUTCMonth()]!} ${d.getUTCDate()}`;
}

/** The ET day a stated `dueAt` names — the day before its closing midnight. */
export function dueDayOf(dueAt: number): number {
  return etDayOf(dueAt - 1);
}
