// The firings of wrangler.toml's two scheduled-run triggers, for the tests
// that walk the real schedule.

const HOUR = 60 * 60 * 1000;

/**
 * Every firing of `0 4,5 * * TUE-SAT` and `0 13,14 * * MON-FRI`, from `from`
 * for `days` days: the end-of-day run's two UTC hours and the morning run's.
 */
export function cronFirings(from: number, days: number): number[] {
  const times: number[] = [];
  const start = Math.ceil(from / HOUR) * HOUR;
  for (let t = start; t < from + days * 24 * HOUR; t += HOUR) {
    const d = new Date(t);
    const h = d.getUTCHours();
    const wd = d.getUTCDay();
    if (([4, 5].includes(h) && wd >= 2 && wd <= 6) || ([13, 14].includes(h) && wd >= 1 && wd <= 5)) times.push(t);
  }
  return times;
}
