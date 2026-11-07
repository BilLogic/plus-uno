// Promise reminders as cards: one morning message in a person's DM with
// uno-bot, one `card` per promise in a carousel, the layout the decision
// reports use, so the two look alike everywhere.
//
// Each card answers three questions in a fixed order: what (its title, the
// promise starting with a verb), when (its subtitle, one of four openings and
// the date) and why it's yours (its body: what exactly was promised and to
// whom, then where and when, linked). Its buttons are three at most, the main
// answer furthest right. Buttons are the only control Slack allows on a card,
// so New date, Pick a date and Wait open a pop-up with Slack's date picker,
// and Drop it a pop-up with its two choices — the same path Review takes.
//
// The words of a promise are regenerated from its message at post time and
// never stored (ADR-030): a card is drawn from what the caller read then, and
// an answered card is redrawn from the message Slack already shows.
//
// PURE: no Env, no Slack client. Words and blocks only.

import { carouselOf, logoFor } from "../slack/answer-cards-block";
import { escapeSlackText } from "../slack/mrkdwn";
import type { ReminderPhase } from "./due";

/** A message's cards: Slack's carousel holds 1 to 10; the rest wait for the
 *  next morning. */
export const MAX_PROMISE_CARDS = 10;
/** A card title's length: the promise, short enough to read at a glance. */
export const PROMISE_TITLE_CHARS = 60;
/** Slack's cap on a card's body. */
const CARD_BODY_CHARS = 200;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Which card a promise gets. */
export type PromiseCardKind = "due-soon" | "overdue" | "no-date" | "owed";

/** One promise, as its card shows it. */
export interface PromiseCardInput {
  /** The row it answers to: which store, then its id (`promiseRef`). */
  ref: string;
  kind: PromiseCardKind;
  /** What was promised, a verb phrase as it would follow "you said you'd". */
  what: string;
  /** The other person, by name: whom it was promised to, or, owed to you,
   *  who promised it. */
  other?: string;
  /** The ET day it's due, or none for a promise that named no day. */
  dueDay?: number;
  /** The ET day it was made. */
  madeDay: number;
  /** The ET day the card is posted. */
  today: number;
  /** Where it was said: a link to the message, and how to name the place. */
  place: { url: string; label: string };
}

/** The card each step of a promise's timeline shows, for a promise the
 *  person made (one owed to them is always `owed`). */
export const PHASE_CARD_KIND: Record<ReminderPhase, PromiseCardKind> = {
  "heads-up": "due-soon",
  "check-in": "overdue",
  "ask-date": "no-date",
};

/** Which store a promise's row is in: a thread promise's, or DM watch's. */
export type PromiseStore = "thread" | "dm";

/** A row as a card's buttons carry it. */
export function promiseRef(store: PromiseStore, id: string): string {
  return `${store === "thread" ? "c" : "d"}|${id}`;
}

/** A ref read back: its store and its row's id, or null when it is no ref. */
export function refOf(ref: string): { store: PromiseStore; id: string } | null {
  const m = /^([cd])\|(.+)$/.exec(ref);
  return m ? { store: m[1] === "c" ? "thread" : "dm", id: m[2]! } : null;
}

/** An answer a promise card's button gives. */
export type CardAnswer = "done" | "on-track" | "new-date" | "pick-date" | "drop" | "wait" | "got-it";

/** Every promise card's buttons start with this, then the answer, then the
 *  ref: unique within a message, as Slack asks of action ids. */
export const PROMISE_ACTION_PREFIX = "uno_promise:";

/** A press on a promise card: its answer and its row, or null for any other
 *  button. */
export function promisePressOf(actionId: string): { answer: CardAnswer; ref: string } | null {
  if (!actionId.startsWith(PROMISE_ACTION_PREFIX)) return null;
  const rest = actionId.slice(PROMISE_ACTION_PREFIX.length);
  const at = rest.indexOf(":");
  if (at < 0) return null;
  const answer = rest.slice(0, at) as CardAnswer;
  const ref = rest.slice(at + 1);
  return ANSWERS.has(answer) && refOf(ref) ? { answer, ref } : null;
}

/** A card button's value: its row, and the day the card shows it due, so a
 *  date pop-up opens from what the person saw. */
export function cardValue(ref: string, dueDay?: number): string {
  return dueDay === undefined ? ref : `${ref}#${pickerDate(dueDay)}`;
}

/** A card button's value read back; null when it is not one. */
export function cardValueOf(value: string | undefined): { ref: string; dueDay?: number } | null {
  const m = /^(.+?)(?:#(\d{4})-(\d{2})-(\d{2}))?$/.exec(value ?? "");
  if (!m || !refOf(m[1]!)) return null;
  return { ref: m[1]!, ...(m[2] ? { dueDay: Date.UTC(Number(m[2]), Number(m[3]) - 1, Number(m[4])) } : {}) };
}

const ANSWERS: ReadonlySet<string> = new Set(["done", "on-track", "new-date", "pick-date", "drop", "wait", "got-it"]);

/** Each kind's buttons, left to right, the main one last. */
const BUTTONS: Record<PromiseCardKind, Array<[CardAnswer, string]>> = {
  "due-soon": [["new-date", "New date"], ["on-track", "On track"], ["done", "Done"]],
  overdue: [["drop", "Drop it"], ["new-date", "New date"], ["done", "Done"]],
  "no-date": [["drop", "Drop it"], ["pick-date", "Pick a date"], ["done", "Done"]],
  owed: [["drop", "Drop it"], ["wait", "Wait"], ["got-it", "Got it"]],
};

/** An ET day as a card says it: "Tue Oct 20". */
export function cardDay(day: number): string {
  const d = new Date(day);
  return `${WEEKDAYS[d.getUTCDay()]!} ${MONTHS[d.getUTCMonth()]!} ${d.getUTCDate()}`;
}

/** When a promise was made, as its body says it: "today", "yesterday", "on
 *  Tue" earlier this week, "last Thu" within the week before, else "Oct 14". */
export function madeLabel(madeDay: number, today: number): string {
  const ago = Math.round((today - madeDay) / DAY_MS);
  if (ago <= 0) return "today";
  if (ago === 1) return "yesterday";
  const d = new Date(madeDay);
  const weekday = WEEKDAYS[d.getUTCDay()]!;
  if (ago <= 6) return new Date(madeDay).getUTCDay() < new Date(today).getUTCDay() ? `on ${weekday}` : `last ${weekday}`;
  return `${MONTHS[d.getUTCMonth()]!} ${d.getUTCDate()}`;
}

/** Text on one line, cut to `max`, its last character an ellipsis when cut. */
function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

/** A sentence's first letter raised. */
function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A card's title: the promise, starting with its verb; owed to you, the
 *  person's name first. At most `PROMISE_TITLE_CHARS`. */
export function promiseTitle(input: Pick<PromiseCardInput, "kind" | "what" | "other">): string {
  const what = input.what.trim().replace(/[.!]+$/, "");
  return clip(input.kind === "owed" && input.other ? `${input.other}: ${what}` : capitalized(what), PROMISE_TITLE_CHARS);
}

/** A card's subtitle: one of four openings, then the date. */
export function promiseSubtitle(input: Pick<PromiseCardInput, "kind" | "dueDay" | "today">): string {
  const { kind, dueDay, today } = input;
  if (kind === "no-date") return "Set a date";
  if (dueDay === undefined) return kind === "owed" ? "Owed to you" : "Set a date";
  const day = cardDay(dueDay);
  if (kind === "owed") return dueDay < today ? `Owed to you, was due ${day}` : `Owed to you, due ${day}`;
  if (kind === "overdue") return `Overdue, was due ${day}`;
  if (dueDay === today) return `Due today, ${day}`;
  if (dueDay === today + DAY_MS) return `Due tomorrow, ${day}`;
  return `Due ${day}`;
}

/**
 * A card's body: what exactly was promised and to whom, in one sentence, then
 * where and when, linked. Never "this": it names the thing. mrkdwn, at most
 * Slack's 200 characters, the sentence cut before the link ever is.
 */
export function promiseBody(input: Pick<PromiseCardInput, "kind" | "what" | "other" | "madeDay" | "today" | "place">): string {
  const what = escapeSlackText(input.what.trim().replace(/[.!]+$/, ""));
  const other = input.other ? escapeSlackText(input.other) : undefined;
  const sentence =
    input.kind === "owed"
      ? `${other ?? "They"} told you they'd ${what}.`
      : input.kind === "no-date"
        ? `${other ? `You told ${other}` : "You said"} you'd ${what}. Pick a date and I'll remind you the day before.`
        : `${other ? `You told ${other}` : "You said"} you'd ${what}.`;
  const where = ` <${input.place.url}|${escapeSlackText(input.place.label)}>, ${madeLabel(input.madeDay, input.today)}.`;
  const room = CARD_BODY_CHARS - where.length;
  return `${clip(sentence, room)}${where}`;
}

/** One promise's card, open. */
export function promiseCard(input: PromiseCardInput): Record<string, unknown> {
  const logo = logoFor("https://plus-uno.netlify.app/");
  return {
    type: "card",
    icon: { type: "image", image_url: logo.url, alt_text: logo.name },
    title: { type: "plain_text", text: promiseTitle(input) || "A promise" },
    subtitle: { type: "plain_text", text: promiseSubtitle(input) },
    body: { type: "mrkdwn", text: promiseBody(input) },
    actions: BUTTONS[input.kind].map(([answer, label]) => ({
      type: "button",
      action_id: `${PROMISE_ACTION_PREFIX}${answer}:${input.ref}`,
      text: { type: "plain_text", text: label },
      value: cardValue(input.ref, input.dueDay),
    })),
  };
}

/** How the opener counts each kind. */
function openerLines(cards: readonly PromiseCardInput[]): string[] {
  const due = cards.filter((c) => c.kind !== "no-date").length;
  const dateless = cards.filter((c) => c.kind === "no-date").length;
  const lines: string[] = [];
  if (due) lines.push(`• ${due} ${due === 1 ? "promise" : "promises"} due or overdue.`);
  if (dateless) lines.push(`• ${dateless} ${dateless === 1 ? "promise needs" : "promises need"} a date.`);
  return lines;
}

/**
 * A morning's message: one bullet per kind, then the cards, one card alone or
 * a carousel, at most `MAX_PROMISE_CARDS`; the rest are held for the next
 * morning.
 *
 * @param cards - Every promise due this morning, in order
 */
export function promiseMessage(cards: readonly PromiseCardInput[]): { text: string; blocks: unknown[]; shown: PromiseCardInput[]; held: PromiseCardInput[] } {
  const shown = cards.slice(0, MAX_PROMISE_CARDS);
  const held = cards.slice(MAX_PROMISE_CARDS);
  const opener = openerLines(shown).join("\n");
  return {
    text: [opener, ...shown.map((c) => `• ${promiseTitle(c)}: ${promiseSubtitle(c)}`)].join("\n"),
    blocks: [{ type: "section", text: { type: "mrkdwn", text: opener } }, carouselOf(shown.map(promiseCard))],
    shown,
    held,
  };
}

/** What a card says once answered, in place of its subtitle. Its buttons go,
 *  and its body keeps the promise. */
export type PromiseOutcome =
  | { kind: "done" }
  | { kind: "on-track" }
  | { kind: "moved"; day: number }
  | { kind: "dropped" }
  | { kind: "not-a-promise" };

/** An answered card's subtitle. */
export function outcomeLine(outcome: PromiseOutcome): string {
  switch (outcome.kind) {
    case "done":
      return "Done";
    case "on-track":
      return "On track";
    case "moved":
      return `Moved to ${cardDay(outcome.day)}`;
    case "dropped":
      return "Dropped";
    case "not-a-promise":
      return "Not a promise, won't track";
  }
}

/**
 * The morning's message with one card answered: its subtitle the outcome,
 * its buttons gone, everything else as Slack shows it. Null when the message
 * holds no card for that ref.
 *
 * @param blocks - The message's blocks, as the press carried them or a read
 *   of the message returned them
 * @param ref - The answered card's row
 * @param outcome - What the answer did
 */
export function answeredMessage(blocks: readonly unknown[], ref: string, outcome: PromiseOutcome): unknown[] | null {
  let found = false;
  const answer = (card: Record<string, unknown>): Record<string, unknown> => {
    const actions = (card.actions ?? []) as Array<{ value?: string }>;
    if (!actions.some((a) => cardValueOf(a.value)?.ref === ref)) return card;
    found = true;
    const { actions: _gone, ...rest } = card;
    return { ...rest, subtitle: { type: "plain_text", text: outcomeLine(outcome) } };
  };
  const out = blocks.map((block) => {
    const b = block as Record<string, unknown>;
    if (b.type === "card") return answer(b);
    if (b.type === "carousel") return { ...b, elements: (b.elements as Record<string, unknown>[]).map(answer) };
    return block;
  });
  return found ? out : null;
}

// ── The two pop-ups ──────────────────────────────────────────────────────────

/** The date pop-up's callback id. */
export const PROMISE_DATE_CALLBACK_ID = "uno_promise_date";
/** The Drop it pop-up's callback id. */
export const PROMISE_DROP_CALLBACK_ID = "uno_promise_drop";
/** The date picker's block and action. */
export const PROMISE_DATE_BLOCK = "uno_promise_date_block";
export const PROMISE_DATE_ACTION = "uno_promise_date_pick";
/** Drop it's choice block and action. */
export const PROMISE_DROP_BLOCK = "uno_promise_drop_block";
export const PROMISE_DROP_ACTION = "uno_promise_drop_pick";

/** What a promise pop-up carries for its Save: the card's message and its row. */
export interface PromiseViewMeta {
  channel: string;
  ts: string;
  ref: string;
}

/** An ET day as Slack's date picker takes it: "2026-10-22". */
export function pickerDate(day: number): string {
  return new Date(day).toISOString().slice(0, 10);
}

/** The day a date picker opens on: the next working day after the promise's
 *  due day, or after today when it named none or that day has passed. */
export function initialPickDay(dueDay: number | undefined, today: number): number {
  let day = Math.max(dueDay ?? today, today) + DAY_MS;
  while (new Date(day).getUTCDay() === 0 || new Date(day).getUTCDay() === 6) day += DAY_MS;
  return day;
}

/**
 * The pop-up New date, Pick a date and Wait open: Slack's date picker, set to
 * the next working day after the current due date, and Save.
 *
 * @param meta - The card's message and row
 * @param initialDay - The ET day it opens on (`initialPickDay`)
 * @param title - The pop-up's title: "New date", "Pick a date" or "Wait"
 */
export function dateView(meta: PromiseViewMeta, initialDay: number, title: "New date" | "Pick a date" | "Wait until"): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: PROMISE_DATE_CALLBACK_ID,
    title: { type: "plain_text", text: title },
    submit: { type: "plain_text", text: "Save" },
    close: { type: "plain_text", text: "Cancel" },
    private_metadata: JSON.stringify(meta),
    blocks: [
      {
        type: "input",
        block_id: PROMISE_DATE_BLOCK,
        label: { type: "plain_text", text: title === "Wait until" ? "Check again on" : "Due on" },
        element: { type: "datepicker", action_id: PROMISE_DATE_ACTION, initial_date: pickerDate(initialDay) },
      },
    ],
  };
}

/** Drop it's two choices. */
export const DROP_CHOICES = [
  { value: "no-longer-needed", label: "No longer needed" },
  { value: "not-a-promise", label: "It wasn't a promise" },
] as const;

/** The pop-up Drop it opens: one choice, and Save. "It wasn't a promise"
 *  teaches the detector, as 🤔 does. */
export function dropView(meta: PromiseViewMeta): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: PROMISE_DROP_CALLBACK_ID,
    title: { type: "plain_text", text: "Drop it" },
    submit: { type: "plain_text", text: "Save" },
    close: { type: "plain_text", text: "Cancel" },
    private_metadata: JSON.stringify(meta),
    blocks: [
      {
        type: "input",
        block_id: PROMISE_DROP_BLOCK,
        label: { type: "plain_text", text: "Why drop it?" },
        element: {
          type: "radio_buttons",
          action_id: PROMISE_DROP_ACTION,
          initial_option: option(DROP_CHOICES[0]),
          options: DROP_CHOICES.map(option),
        },
      },
    ],
  };
}

function option(c: { value: string; label: string }) {
  return { text: { type: "plain_text", text: c.label }, value: c.value };
}

/** A view's state, as Slack sends it on Save. */
type ViewState = { values?: Record<string, Record<string, { selected_date?: string | null; selected_option?: { value?: string } | null }>> };

/** The meta a promise pop-up carries, read back; null when it is not one. */
export function promiseViewMetaOf(privateMetadata: string | undefined): PromiseViewMeta | null {
  try {
    const m = JSON.parse(privateMetadata ?? "") as Partial<PromiseViewMeta>;
    return typeof m.channel === "string" && typeof m.ts === "string" && typeof m.ref === "string" && refOf(m.ref) ? (m as PromiseViewMeta) : null;
  } catch {
    return null;
  }
}

/** The day a date pop-up saved, as an ET day; null when none was picked. */
export function pickedDayOf(state: ViewState | undefined): number | null {
  const picked = state?.values?.[PROMISE_DATE_BLOCK]?.[PROMISE_DATE_ACTION]?.selected_date;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(picked ?? "");
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** Drop it's choice; null when none was picked. */
export function droppedAsOf(state: ViewState | undefined): "no-longer-needed" | "not-a-promise" | null {
  const value = state?.values?.[PROMISE_DROP_BLOCK]?.[PROMISE_DROP_ACTION]?.selected_option?.value;
  return value === "no-longer-needed" || value === "not-a-promise" ? value : null;
}


/** The rows whose cards in this message still carry their buttons. */
export function openRefs(blocks: readonly unknown[]): string[] {
  const refs: string[] = [];
  const take = (card: Record<string, unknown>) => {
    const ref = ((card.actions ?? []) as Array<{ value?: string }>).map((a) => cardValueOf(a.value)?.ref).find(Boolean);
    if (ref) refs.push(ref);
  };
  for (const block of blocks as Array<Record<string, unknown>>) {
    if (block.type === "card") take(block);
    if (block.type === "carousel") for (const card of (block.elements ?? []) as Array<Record<string, unknown>>) take(card);
  }
  return refs;
}

/** A morning message's fallback text, read back from its opener. */
export function openerOf(blocks: readonly unknown[]): string {
  const section = (blocks as Array<{ type?: string; text?: { text?: string } }>).find((b) => b.type === "section");
  return section?.text?.text || "Promise reminders";
}
