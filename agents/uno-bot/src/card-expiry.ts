// When a proposal card expires: the one rule every card and every button the
// bot asks someone to press takes its deadline from (#1315).
//
// 24 WEEKDAY HOURS, COUNTED IN ET. A card staged Monday 10:00 ET expires
// Tuesday 10:00 ET; one staged Friday 15:00 ET expires Monday 15:00 ET; one
// staged on Saturday or Sunday counts from Monday 00:00 ET and expires Tuesday
// 00:00 ET. The count is in ET wall-clock time, so a deadline across a clock
// change keeps its hour (Friday 15:00 EDT → Monday 15:00 EST is 73 real hours).
// The US clocks change on a Sunday, which is never counted, so no deadline
// falls in a skipped or repeated hour.
//
// Before this rule, cards expired on five clocks — an hour for a turn's card,
// a day, three days and six — and none said which. Cards staged before it keep
// the `ttlMs` they were stored with; the store stamps the rule on every card
// staged without one (`thread-state/store.ts` `stampedTtl`).
//
// PURE and import-free: the thread store sits on it.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The longest lifetime the rule gives: a Friday staging over the weekend
 *  the clocks go back, 72 h + 1. A bound for whatever has to outlive a card —
 *  a KV mark, a report's own record. */
export const MAX_CARD_TTL_MS = 73 * HOUR_MS;

/** How the rule is said, wherever a card states its window. */
export const CARD_WINDOW_WORDS = "24 weekday hours";

const ET = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

/** The ET wall clock at `at`, carried as the epoch ms that reads the same in
 *  UTC — so a day is 24 h and its weekday is `getUTCDay`. */
function etWall(at: number): number {
  const p = Object.fromEntries(ET.formatToParts(new Date(at)).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!) + (((at % 1000) + 1000) % 1000);
}

/** The instant an ET wall-clock time names: four hours on under EDT, five
 *  under EST. Only ever asked about a weekday, which has exactly one. */
function fromEtWall(wall: number): number {
  const edt = wall + 4 * HOUR_MS;
  return etWall(edt) === wall ? edt : wall + 5 * HOUR_MS;
}

function isWeekend(wall: number): boolean {
  const wd = new Date(wall).getUTCDay();
  return wd === 0 || wd === 6;
}

/**
 * When a card staged at `stagedAt` stops being confirmable.
 *
 * @param stagedAt - When the card was staged, epoch ms
 */
export function cardExpiresAt(stagedAt: number): number {
  let wall = etWall(stagedAt);
  if (isWeekend(wall)) {
    wall -= wall % DAY_MS;
    while (isWeekend(wall)) wall += DAY_MS;
  }
  let end = wall + DAY_MS;
  while (isWeekend(end)) end += DAY_MS;
  return fromEtWall(end);
}

/**
 * How long a card staged at `stagedAt` lives — what the store keeps as its
 * `ttlMs`.
 *
 * @param stagedAt - When the card was staged, epoch ms
 */
export function cardTtlMs(stagedAt: number): number {
  return cardExpiresAt(stagedAt) - stagedAt;
}

/**
 * Whether a card staged at `stagedAt` is still confirmable at `now`: through
 * its exact deadline, and not a millisecond past it — as the thread store,
 * which holds the card, reads it (`thread-state/store.ts` `cardExpiryDueAt`).
 * A job that asks whether one of its cards is live asks this, so the two
 * never disagree at the deadline.
 *
 * @param stagedAt - When the card was staged, epoch ms
 * @param now - The time asked about, epoch ms
 */
export function cardLiveAt(stagedAt: number, now: number): boolean {
  return now <= cardExpiresAt(stagedAt);
}
