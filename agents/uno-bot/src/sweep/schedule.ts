// When the day's runs happen, in the team's time, and when a sweep finding may
// be posted: at the first weekday morning run after it was detected.
//
// Both runs are ET times all year: the morning run at 10:00 ET and the
// end-of-day run at 18:00 ET. In UTC that is 14:00 and 22:00 under EDT and
// 15:00 and 23:00 under EST, which the weekday `*/15 13-23` cron covers either
// way, so the firing reads its ET hour rather than a fixed UTC one.
//
// Detection runs in the end-of-day jobs and posting at the morning run, so
// people see a card at the start of their day and its 72 h clock starts when
// they can act on it. A finding detected on a Friday evening therefore waits
// for Monday morning. Stated as a function of the detection time, not of which
// run is asking, so a morning job that runs late, twice, or on a rehearsal
// cannot post a finding before its morning.
//
// A DAY here is an ET calendar date carried as the epoch ms of that date's UTC
// midnight, so adding a day is adding 24 h and its weekday is `getUTCDay`.
//
// PURE.

/** The ET hour of the morning run (`scheduled/runs.ts` anchors it). */
export const MORNING_RUN_HOUR_ET = 10;
/** The ET hour of the end-of-day run. */
export const END_OF_DAY_RUN_HOUR_ET = 18;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const ET = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});

/** The ET calendar date and hour `at` falls on. */
export function etParts(at: number): { y: number; m: number; d: number; h: number } {
  const parts = Object.fromEntries(ET.formatToParts(new Date(at)).map((p) => [p.type, p.value]));
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day), h: Number(parts.hour) };
}

/** The ET calendar day `at` falls on. */
export function etDayOf(at: number): number {
  const { y, m, d } = etParts(at);
  return Date.UTC(y, m - 1, d);
}

/** The instant an ET day reaches `hour` o'clock: `hour` + 4 UTC under EDT,
 *  `hour` + 5 under EST. */
export function etHourOn(day: number, hour: number): number {
  const edt = day + (hour + 4) * HOUR_MS;
  return etParts(edt).h === hour ? edt : edt + HOUR_MS;
}

/** The morning run on an ET day: that date's 10:00 ET. */
export function morningRunOn(day: number): number {
  return etHourOn(day, MORNING_RUN_HOUR_ET);
}

/**
 * The first weekday morning run strictly after `detectedAt`.
 *
 * @param detectedAt - When the finding was detected, epoch ms
 */
export function postableAt(detectedAt: number): number {
  let day = etDayOf(detectedAt);
  if (morningRunOn(day) <= detectedAt) day += DAY_MS;
  while (isWeekend(day)) day += DAY_MS;
  return morningRunOn(day);
}

function isWeekend(day: number): boolean {
  const wd = new Date(day).getUTCDay();
  return wd === 0 || wd === 6;
}
