// "Remind me": a commitment a person makes to themselves, set in the turn.
//
// Someone asks uno-bot directly, in its DM or in a thread where they mention
// it: "remind me Thu to review the PRD", "remind me in 2 days about this
// thread". The model passes the time as said and a short summary of the
// subject to `reminder_set`; this reads the time, keeps a `self_reminder` row
// beside the promises the sweep reads, and answers with the one line the
// model confirms with ("Got it, Thu 10 am ET."). A time it cannot place, or
// one that could mean two days, comes back as the one question to ask, and
// nothing is kept. No proposal card: nothing is written outside uno-bot.
//
// DELIVERY is the morning job's (`./run.ts`): at the first weekday morning run
// on or after the day named, in the same DM or thread, mentioning only the
// requester. A DM's reminder goes back only to that DM, and #uno-bot is never
// a destination.
//
// PURE: no `Env`, no Slack, no Workers global.

import type { ChannelKind } from "../sweep/finding";
import { MORNING_RUN_HOUR_UTC } from "../sweep/schedule";
import { cleanWhat } from "./copy";
import { addWorkingDays, dayLabel, deadlineDay, etDayOf, TEXT_KEEP_MS } from "./due";
import type { CommitmentRecord, CommitmentStore } from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Working days a ⏳ on a reminder moves it by. */
export const SNOOZE_WORKING_DAYS = 2;

/** Where a time was placed: the ET day, and the morning run it is delivered at.
 *  `rolledYear` when a date said with no year had passed this year and was
 *  read as next year's — the confirmation then names the year. */
export type ReminderWhen = { ok: true; day: number; runAt: number; rolledYear?: boolean } | { ok: false; ask: string };

/** A date said with no year that has passed this year is read as next year's
 *  only this close; further out, it is asked about. */
export const MAX_ROLLED_DAYS = 60;

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const COUNTS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  "a couple": 2, "a couple of": 2, "a few": 3,
};

const ASK_WHEN = "When should I remind you? A day like Thu, tomorrow, in 2 days or Oct 3 works.";

/** The morning run on an ET day: that date's 14:00 UTC. */
export function morningRunOn(day: number): number {
  return day + MORNING_RUN_HOUR_UTC * HOUR_MS;
}

/** The day itself on a weekday, else the Monday after — runs are weekday-only. */
function weekdayOnOrAfter(day: number): number {
  let at = day;
  while ([0, 6].includes(new Date(at).getUTCDay())) at += DAY_MS;
  return at;
}

function dateLabel(day: number): string {
  return `${WEEKDAY_NAMES[new Date(day).getUTCDay()]!} ${monthDay(day)}`;
}

function monthDay(day: number): string {
  const d = new Date(day);
  return `${MONTH_NAMES[d.getUTCMonth()]!} ${d.getUTCDate()}`;
}

/**
 * The morning run a reminder time names, or the one question to ask.
 *
 * Read: "today" (while its run is still ahead), "tomorrow", a weekday ("Thu",
 * "on Thursday", "this Fri" — the next one after today), "next week" (its
 * Monday), "in N days", "in N working days", "in N weeks", and the dates
 * `deadlineDay` reads (ISO, "10/3", "Oct 3"). A time of day is dropped: every
 * reminder goes out at the morning run. A weekend day moves to the Monday.
 *
 * Asked about: "next Thu" (this coming one or the one after?), a weekday that
 * is today (today or in a week?), today once its run has gone, a date that
 * has passed, and anything else it cannot place.
 *
 * @param when - The time as the person said it
 * @param now - When they said it, epoch ms
 */
export function parseReminderWhen(when: string, now: number): ReminderWhen {
  const today = etDayOf(now);
  const said = when
    .toLowerCase()
    .replace(/[.,!?]+/g, " ")
    .replace(/\b(at\s+)?\d{1,2}(:\d{2})?\s*(am|pm)\b/g, " ")
    .replace(/\bat\s+\d{1,2}(:\d{2})?\b/g, " ")
    .replace(/\b(at\s+)?noon\b/g, " ")
    .replace(/\b(first thing\s+)?(in the\s+)?(morning|afternoon|evening|night)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(on|by|for|this coming|come)\s+/, "")
    .trim();
  const place = (day: number): ReminderWhen => {
    const onWeekday = weekdayOnOrAfter(day);
    const runAt = morningRunOn(onWeekday);
    if (runAt <= now) return { ok: false, ask: "Today's 10 am ET run has already gone. Tomorrow instead?" };
    return { ok: true, day: onWeekday, runAt };
  };
  if (!said) return { ok: false, ask: ASK_WHEN };
  if (/^(today|this morning)$/.test(said)) return place(today);
  if (/^(tomorrow|tmrw|tmr)$/.test(said)) return place(today + DAY_MS);
  if (/^next week$/.test(said)) {
    let day = today + DAY_MS;
    while (new Date(day).getUTCDay() !== 1) day += DAY_MS;
    return place(day);
  }

  const next = /^next\s+([a-z]+)$/.exec(said);
  if (next && WEEKDAYS[next[1]!] !== undefined) {
    const coming = nextWeekday(today, WEEKDAYS[next[1]!]!);
    return { ok: false, ask: `This coming ${dateLabel(coming)}, or the one after (${dateLabel(coming + 7 * DAY_MS)})?` };
  }
  const weekday = WEEKDAYS[said.replace(/^this\s+/, "")];
  if (weekday !== undefined) {
    if (new Date(today).getUTCDay() === weekday) {
      return { ok: false, ask: `Today, or next ${dateLabel(today + 7 * DAY_MS)}?` };
    }
    return place(nextWeekday(today, weekday));
  }

  const relative = /^(?:in\s+)?(\d+|a couple of|a couple|a few|an?|one|two|three|four|five|six|seven|eight|nine|ten)\s+(working\s+|business\s+)?(days?|weeks?)(?:\s+from now)?$/.exec(said);
  if (relative) {
    const n = /^\d+$/.test(relative[1]!) ? Number(relative[1]) : COUNTS[relative[1]!]!;
    if (n < 1) return { ok: false, ask: ASK_WHEN };
    const weeks = relative[3]!.startsWith("week");
    if (relative[2] && !weeks) return place(addWorkingDays(today, n));
    return place(today + n * (weeks ? 7 : 1) * DAY_MS);
  }

  if (/\d/.test(said)) {
    const day = deadlineDay(said, now);
    const namedYear = /\b\d{4}\b|\d\/\d{1,2}\/\d{2}/.test(said);
    if (day !== null && !namedYear && new Date(day).getUTCFullYear() > new Date(today).getUTCFullYear()) {
      if (day - today > MAX_ROLLED_DAYS * DAY_MS) {
        return { ok: false, ask: `${monthDay(day)} has passed this year. Did you mean ${monthDay(day)}, ${new Date(day).getUTCFullYear()}, or another day?` };
      }
      const placed = place(day);
      return placed.ok ? { ...placed, rolledYear: true } : placed;
    }
    if (day !== null) return place(day);
    return { ok: false, ask: "I couldn't place that date, or it has passed. Which day did you mean?" };
  }
  return { ok: false, ask: ASK_WHEN };
}

function nextWeekday(today: number, weekday: number): number {
  let day = today + DAY_MS;
  while (new Date(day).getUTCDay() !== weekday) day += DAY_MS;
  return day;
}

/** The one line the model confirms with: "Got it, Thu 10 am ET." — with the
 *  year ("Jan 5, 2027") when a date said without one was read as next year's. */
export function reminderConfirmation(day: number, now: number, withYear = false): string {
  const label = withYear ? `${monthDay(day)}, ${new Date(day).getUTCFullYear()}` : dayLabel(day, etDayOf(now));
  return `Got it, ${label} 10 am ET.`;
}

/** The answer to a second, different reminder asked from one message. */
export const ONE_PER_MESSAGE = "One reminder per message: send the other one as its own message.";

/** Where a ⏳ moves a reminder: the morning run two working days out. */
export function snoozedRunAt(now: number): number {
  return morningRunOn(addWorkingDays(etDayOf(now), SNOOZE_WORKING_DAYS));
}

/**
 * The kind of place a turn happened in, as a commitment row keeps it — from
 * Slack's conversation type, else what the channel id proves (an app DM is
 * `D…`), else private. Fails closed: an unknown place is never public.
 */
export function channelKindFor(channel: string, conversationType?: string): ChannelKind {
  switch (conversationType) {
    case "channel":
      return "public";
    case "group":
      return "private";
    case "mpim":
      return "group-dm";
    case "im":
      return "dm";
  }
  return channel.startsWith("D") ? "dm" : "private";
}

/** Where a reminder was asked for, as the turn knows it. */
export interface ReminderPlace {
  channel: string;
  channelKind: ChannelKind;
  /** The thread the reminder replies in: the thread root, or the asking
   *  message when it started none. */
  threadTs: string;
  /** The asking message — one reminder per message. */
  messageTs: string;
  /** The person asking, the one person the reminder mentions. */
  userId: string;
}

export type SetReminderResult =
  | { ok: true; confirm: string; runAt: string }
  | { ok: false; ask: string }
  | { ok: false; error: string };

/**
 * Keep a "remind me" as a `self_reminder` commitment, or say what to ask.
 * One per message: the same reminder asked again from it — a retried call, a
 * corrected time — starts that reminder over; a different one is refused
 * (`ONE_PER_MESSAGE`).
 *
 * @param input - `when` as said, `what` as the model summarised it
 * @param place - Where it was asked, and by whom
 * @param deps - The store, #uno-bot's id, the clock
 */
export async function setSelfReminder(
  input: { when: unknown; what: unknown },
  place: ReminderPlace,
  deps: { store: CommitmentStore; unoBot?: string; now(): number },
): Promise<SetReminderResult> {
  if (place.channel === deps.unoBot) {
    return { ok: false, error: "reminders are not delivered in #uno-bot; ask in a DM with uno-bot or in a team thread" };
  }
  const what = cleanWhat(typeof input.what === "string" ? input.what : "");
  if (!what) return { ok: false, error: "missing what: a short summary of what to remind them about" };
  const now = deps.now();
  const when = parseReminderWhen(typeof input.when === "string" ? input.when : "", now);
  if (!when.ok) return { ok: false, ask: when.ask };

  const id = `${place.channel}:${place.messageTs}`;
  const until = when.runAt + TEXT_KEEP_MS;
  const existing = await deps.store.get(id);
  if (existing) {
    if (existing.kind !== "self_reminder") return { ok: false, error: "that message already holds a commitment" };
    // The same reminder set again (a retried call, a corrected time) starts
    // over; a different one from the same message is refused.
    const kept = (await deps.store.text(id))?.what;
    if (kept && kept.toLowerCase() !== what.toLowerCase()) return { ok: false, error: ONE_PER_MESSAGE };
    await deps.store.update(id, {
      dueAt: when.runAt,
      deadlineAt: when.runAt,
      state: "open",
      nudges: 0,
      snoozes: 0,
      holds: 0,
      checkedOn: null,
      resolvedAt: null,
    });
  } else {
    const row: CommitmentRecord = {
      id,
      kind: "self_reminder",
      channel: place.channel,
      channelKind: place.channelKind,
      threadTs: place.threadTs,
      messageTs: place.messageTs,
      promiserId: place.userId,
      requesterId: place.userId,
      deadlineAt: when.runAt,
      dueAt: when.runAt,
      state: "open",
      nudges: 0,
      snoozes: 0,
      confidence: 1,
      promisedAt: Math.round(Number(place.messageTs) * 1000) || now,
      detectedAt: now,
      runDate: new Date(now).toISOString().slice(0, 10),
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    };
    await deps.store.addCommitments([row]);
  }
  await deps.store.saveText(id, { what, bodies: {} }, until);
  return { ok: true, confirm: reminderConfirmation(when.day, now, when.rolledYear), runAt: new Date(when.runAt).toISOString() };
}
