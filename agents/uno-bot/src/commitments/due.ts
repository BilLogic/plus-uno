// When a commitment is due, and when uno-bot may say so.
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

import { MORNING_RUN_HOUR_UTC, postableAt } from "../sweep/schedule";

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

const TEAM_ZONE = "America/New_York";
const ET = new Intl.DateTimeFormat("en-US", {
  timeZone: TEAM_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function etParts(at: number): { y: number; m: number; d: number; h: number } {
  const parts = Object.fromEntries(ET.formatToParts(new Date(at)).map((p) => [p.type, p.value]));
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day), h: Number(parts.hour) };
}

/** The ET calendar day `at` falls on. */
export function etDayOf(at: number): number {
  const { y, m, d } = etParts(at);
  return Date.UTC(y, m - 1, d);
}

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
  const said = (text ?? "")
    .toLowerCase()
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
 * 14:00 UTC hour. Nothing is sent outside it, whatever job asks.
 */
export function isMorningRunTime(now: number): boolean {
  const d = new Date(now);
  const wd = d.getUTCDay();
  return wd >= 1 && wd <= 5 && d.getUTCHours() === MORNING_RUN_HOUR_UTC;
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
