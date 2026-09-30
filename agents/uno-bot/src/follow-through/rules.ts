// What makes a Roadmap card worth a follow-up, and when — the rules of
// scenarios F3 to F5 of the Follow through job, as pure functions.
//
//   • F3 — a to-do to make a card ("Bill to create a card for the facelift's
//     last stage") with no matching card two working days on. A card matches
//     when its title carries the to-do's own words (`matchesTodo`).
//   • F4 — a card being worked (`UNOWNED_STATUSES`: WIP, Under Review) with no
//     Contributor for `UNOWNED_AFTER_MS`. Ready for Design and Need PRD are
//     queue states, where no owner yet is expected.
//   • F5 — an active card with a Contributor that has sat in one Design Status
//     for `STALE_AFTER_MS` with no comment in that time.
//
// Notion does not say when a status or a Contributor last changed, so both are
// read off the card's `last_edited_time`: a card nobody has edited for a week
// has had no Contributor for a week, and one nobody has edited for three weeks
// has held its status that long. That misses a card someone keeps editing
// while it sits, and never flags one too early. Each follow-up is an EPISODE
// keyed on that stamp (`cardFollowUpId`): the same untouched card is the same
// follow-up, and an edit starts the count again.
//
// Design Status values are exact-matched (hard rule 4): the three active ones
// are the Roadmap's own options, spelled as the board spells them.
//
// PURE: no `Env`, no Slack, no Workers global.

const DAY_MS = 24 * 60 * 60 * 1000;

/** The Design Status options a card is being worked in, exact. */
export const ACTIVE_DESIGN_STATUSES: readonly string[] = ["Ready for Design", "WIP", "Under Review"];
/** F4's statuses, exact: work under way, where a card should have an owner. */
export const UNOWNED_STATUSES: readonly string[] = ["WIP", "Under Review"];
/** F4: a card in one of those with no Contributor, unedited this long. */
export const UNOWNED_AFTER_MS = 7 * DAY_MS;
/** F5: an active card, unedited and uncommented this long. */
export const STALE_AFTER_MS = 21 * DAY_MS;
/** One message a card, at most, in this long — a follow-up included. */
export const CARD_MESSAGE_GAP_MS = 7 * DAY_MS;
/** Working days a card follow-up's one follow-up waits: a week, so a card
 *  never gets two messages in one. */
export const CARD_REARM_WORKING_DAYS = 5;
/** New top-level card questions one channel gets in one morning; the rest
 *  wait a morning. */
export const MAX_CARD_POSTS_PER_CHANNEL = 2;
/** How long an F5 owner's choice of Design Status stays open: a proposal
 *  card's life. */
export const CHOICE_TTL_MS = 72 * 60 * 60 * 1000;

/** An active Roadmap card, as the end of day reads it. */
export interface ActiveCard {
  pageId: string;
  url: string;
  title: string;
  designStatus: string | null;
  /** `Product Pillar` values. */
  pillars: string[];
  /** `Contributor`, as Notion user ids and names, in the card's order. */
  contributors: Array<{ id: string; name: string }>;
  /** Who created the card, as a Notion user id. */
  creatorId: string | null;
  /** `last_edited_time`, epoch ms. */
  lastEditedAt: number;
  archived: boolean;
}

/** Which follow-up a card is due, if any. */
export type CardCondition = "unowned" | "stale";

/** True when the card sits in an active Design Status, exact-matched. */
export function isActive(card: Pick<ActiveCard, "designStatus" | "archived">): boolean {
  return !card.archived && card.designStatus !== null && ACTIVE_DESIGN_STATUSES.includes(card.designStatus);
}

/**
 * Whether a card may be F4's, going by what the query alone says — a
 * candidate for F5 still needs its comments read (`cardCondition`).
 */
export function maybeCondition(card: ActiveCard, now: number): CardCondition | null {
  if (!isActive(card)) return null;
  if (!card.contributors.length) {
    const working = card.designStatus !== null && UNOWNED_STATUSES.includes(card.designStatus);
    return working && card.lastEditedAt <= now - UNOWNED_AFTER_MS ? "unowned" : null;
  }
  return card.lastEditedAt <= now - STALE_AFTER_MS ? "stale" : null;
}

/**
 * The follow-up a card is due: F4 when it is active with no Contributor and
 * unedited for a week; F5 when it is active with a Contributor, unedited for
 * three weeks, and uncommented as long. Never both: F5 mentions the
 * Contributor, and an unowned card has none to mention.
 *
 * @param card - The card
 * @param lastCommentAt - Its newest comment's time, epoch ms, or null for none;
 *   only read for an F5 candidate
 * @param now - Now, epoch ms
 */
export function cardCondition(card: ActiveCard, lastCommentAt: number | null, now: number): CardCondition | null {
  const maybe = maybeCondition(card, now);
  if (maybe !== "stale") return maybe;
  return lastCommentAt === null || lastCommentAt <= now - STALE_AFTER_MS ? "stale" : null;
}

/** One follow-up per card per condition per untouched stretch. */
export function cardFollowUpId(pageId: string, condition: CardCondition, lastEditedAt: number): string {
  return `card:${pageId}:${condition}:${lastEditedAt}`;
}

/**
 * Whether a card may be followed up tonight, given what it last had: nothing,
 * or a follow-up that is over and whose last message is a week old.
 *
 * @param latest - The card's latest follow-up, or null
 * @param now - Now, epoch ms
 */
export function mayFollowUpCard(
  latest: { state: string; remindedOn: string | null; detectedAt: number } | null,
  now: number,
): boolean {
  if (!latest) return true;
  if (latest.state === "open" || latest.state === "nudged" || latest.state === "snoozed") return false;
  const last = latest.remindedOn ? Date.parse(`${latest.remindedOn}T00:00:00Z`) : latest.detectedAt;
  return last <= now - CARD_MESSAGE_GAP_MS;
}

/** The Design Status options offered first after 🙌 (done) and 🙅 (drop). */
export const LIKELY_STATUSES: Readonly<Record<"done" | "drop", readonly string[]>> = {
  done: ["Shipped", "Under Dev"],
  drop: ["Archived"],
};

/**
 * The Design Status options a stuck card's owner picks from: the Roadmap's
 * live options, exactly as the schema has them, the likely ones for the
 * answer first and the rest in the schema's order, the card's current status
 * left out.
 *
 * @param options - The schema's options, in its order
 * @param answer - 🙌 (`done`) or 🙅 (`drop`)
 * @param current - The card's Design Status now
 */
export function orderStatusOptions(options: readonly string[], answer: "done" | "drop", current: string | null): string[] {
  const live = [...new Set(options.filter((o) => o && o !== current))];
  const likely = LIKELY_STATUSES[answer].filter((o) => live.includes(o));
  return [...likely, ...live.filter((o) => !likely.includes(o))];
}

/**
 * The option a reply picks: a number from the list, or one option's name
 * typed whole (case and surrounding space aside). Null for anything else.
 *
 * @param reply - The reply's text
 * @param options - The options offered, in the order shown
 */
export function pickStatus(reply: string, options: readonly string[]): string | null {
  const said = reply.replace(/<@[^>]+>/g, " ").trim().replace(/^["'“]|["'”.!]$/g, "").trim();
  if (/^\d{1,2}$/.test(said)) return options[Number(said) - 1] ?? null;
  return options.find((o) => o.toLowerCase() === said.toLowerCase()) ?? null;
}

/** Words that say "make a card" rather than what the card is about. */
const TODO_NOISE = new Set([
  "a", "an", "the", "for", "to", "of", "on", "in", "and", "with", "about", "this", "that", "it",
  "card", "cards", "ticket", "roadmap", "create", "make", "file", "open", "add", "draft", "new",
]);

/** A to-do's or a title's significant words, lowercased. */
export function todoWords(text: string): string[] {
  return [...new Set(
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 2 && !TODO_NOISE.has(w)),
  )];
}

/**
 * Whether a Roadmap card's title matches a card to-do: at least half the
 * to-do's own words are in the title, and at least two when it has two or
 * more. "facelift last stage" matches "Facelift — last stage polish"; it does
 * not match "Facelift kickoff".
 *
 * @param what - The to-do's subject, as the detector summarised it
 * @param title - A card's title
 */
export function matchesTodo(what: string, title: string): boolean {
  const want = todoWords(what);
  if (!want.length) return false;
  const have = new Set(todoWords(title));
  const shared = want.filter((w) => have.has(w)).length;
  return shared >= Math.min(2, want.length) && shared * 2 >= want.length;
}
