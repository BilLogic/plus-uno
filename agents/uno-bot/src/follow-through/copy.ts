// What a card follow-up says, and what each answer to it means.
//
// A follow-up goes up on the shared decision card (§ On the shared decision
// card, at the end): F3's card holds the drafted Roadmap card, F4's the
// Contributor change, F5's the Design Status move, each behind Review. Each
// mentions its owner and nobody else by default — the assignee or a note's
// takers, the card's creator, its Contributors — and never the lead unless the
// lead is that person.
//
// A follow-up posted before the shared card keeps its own words until it
// closes: the buttons and reactions that answer it, the edit that replaces
// them, F4's typed owner and F5's typed Design Status. Those are the rest of
// this file.
//
// Every Notion string (a title, a status) and every to-do summary is escaped
// with `escapeSlackText` before it reaches mrkdwn: a title holding
// `<!channel>` pings nobody. A link is Slack's own `<url|label>`.
//
// PURE: no `Env`, no Slack module, no Workers global.

import { escapeSlackText } from "../slack/mrkdwn";
import { reminderAnswer } from "../commitments/copy";
import type { ReportItem, ReviewChoice } from "../thread-state/index";

/** F3's draft is asked for with ✅ (or ✔️) alone — not 👍, which reads as a
 *  nod rather than "draft it". */
const DRAFT_GLYPHS: ReadonlySet<string> = new Set(["white_check_mark", "heavy_check_mark"]);

/** What an answer to a card follow-up means. */
export type CardAnswer = "draft" | "done" | "still_on_it" | "drop";

/**
 * The answer a reaction carries on a follow-up of this kind, or null. F3
 * takes ✅ (draft it) and 🙅 (drop it); F5 takes 🙌 ⏳ 🙅; F4 is answered by a
 * reply naming someone, so no reaction answers it.
 */
export function cardAnswer(kind: "card_todo" | "card_unowned" | "card_stale", glyph: string): CardAnswer | null {
  const bare = glyph.replace(/::skin-tone-\d$/, "");
  const reminder = reminderAnswer(bare);
  if (kind === "card_todo") {
    if (DRAFT_GLYPHS.has(bare)) return "draft";
    return reminder === "not_doing" ? "drop" : null;
  }
  if (kind === "card_stale") {
    if (reminder === "done") return "done";
    if (reminder === "soon") return "still_on_it";
    if (reminder === "not_doing") return "drop";
  }
  return null;
}

/** What replaces the legend once someone answers. */
export function cardAcknowledgement(answer: CardAnswer | "owner" | "status", staged: boolean): string {
  switch (answer) {
    case "draft":
      return "On it. The draft card is in this thread; a ✅ there files it.";
    case "owner":
      return staged ? "Thanks. The Contributor change is in this thread; a ✅ there applies it." : "Thanks.";
    case "status":
      return staged ? "Thanks. The status change is in this thread; a ✅ there applies it." : "Thanks.";
    case "done":
      return staged ? "Nice. Pick the card's new Design Status in this thread." : "Nice, noted.";
    case "still_on_it":
      return "Got it. I'll leave it be for now.";
    case "drop":
      return staged ? "Understood. Pick the card's new Design Status in this thread." : "Understood. I won't ask again.";
  }
}

/** Ends the edit that replaces a follow-up's buttons: anyone may answer one,
 *  so the thread sees who did. */
export function answeredBy(user: string): string {
  return `Answered by <@${user}>.`;
}

/** Why a Draft it changed nothing when the draft did not go up: the row stays
 *  live, so another tap tries again. */
export const DRAFT_NOT_POSTED = "The draft card didn't go up, so nothing changed. Try again in a moment.";

function mentionsOf(people: readonly string[]): string {
  return [...new Set(people.filter(Boolean))].map((p) => `<@${p}>`).join(" ");
}

function cardLink(card: { title: string; url: string }): string {
  const title = escapeSlackText(card.title.replace(/\s+/g, " ").trim() || "untitled");
  return card.url ? `<${card.url}|${title}>` : title;
}

/** The owner's choice of Design Status, numbered as `pickStatus` reads it. */
export function statusChoiceText(input: { owner: string; card: { title: string; url: string }; options: readonly string[] }): string {
  const list = input.options.map((o, i) => `${i + 1}. ${escapeSlackText(o)}`).join("\n");
  return `<@${input.owner}> Which Design Status should ${cardLink(input.card)} move to? Reply with a name or a number:\n${list}`;
}

/** A reply that named no live option: the options again, on one line. */
export function statusRetryText(options: readonly string[]): string {
  return `That isn't one of the card's Design Status options. Reply with one of: ${options.map((o, i) => `${i + 1}. ${escapeSlackText(o)}`).join(" · ")}`;
}

/** A card's subject as a card title: its first letter raised. */
export function draftTitle(what: string): string {
  const t = what.replace(/\s+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// ── On the shared decision card ──────────────────────────────────────────────
//
// A parent line naming the people asked, then one card per follow-up, each
// with Review and Open (`slack/decision-cards.ts`). Review is the only way to
// answer: no glyph, nothing to type. A card's title and body are plain text,
// so nothing in them is escaped; its subtitle and the parent line are mrkdwn.

type Kind = "card_todo" | "card_unowned" | "card_stale";

/**
 * The parent line: whom it is for, and what the job found, in one sentence.
 *
 * @param kinds - Each card's kind, in the order shown
 * @param people - Everyone it mentions
 * @param first - The first ask, or the one follow-up a week on
 */
export function followUpParent(kinds: readonly Kind[], people: readonly string[], first: boolean): string {
  const n = kinds.length;
  const one = new Set(kinds).size === 1 ? kinds[0]! : null;
  const who = mentionsOf(people);
  const lead = who ? `${who} ` : "";
  if (!first) {
    const noun = one === "card_todo" ? (n === 1 ? "this to-do" : `these ${n} to-dos`) : n === 1 ? "this card" : `these ${n} cards`;
    return `${lead}Checking in once more on ${noun}.`;
  }
  switch (one) {
    case "card_todo":
      return n === 1
        ? `${lead}A to-do to make a Roadmap card came up, and I couldn't find the card.`
        : `${lead}${n} to-dos to make Roadmap cards came up, and I couldn't find the cards.`;
    case "card_unowned":
      return n === 1
        ? `${lead}A Roadmap card has been worked for over a week with no Contributor.`
        : `${lead}${n} Roadmap cards have been worked for over a week with no Contributor.`;
    case "card_stale":
      return n === 1 ? `${lead}Checking in on a Roadmap card that has gone quiet.` : `${lead}Checking in on ${n} Roadmap cards that have gone quiet.`;
    default:
      return `${lead}Checking in on ${n} Roadmap cards.`;
  }
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim() || "untitled";
}

function statusWords(status: string | null): string {
  return status ? escapeSlackText(oneLine(status)) : "no Design Status";
}

/** F3's card: the to-do, who and where, and the drafted card behind Review. */
export function todoItem(input: { id: string; owner: string; what: string; sourceUrl: string; fromNote: boolean }): ReportItem {
  return {
    id: input.id,
    title: draftTitle(input.what) || "untitled",
    subtitle: `<@${input.owner}> · from ${input.fromNote ? "the running note" : "this thread"}`,
    body: "No Roadmap card found for this. Review holds the drafted card.",
    done: "the drafted Roadmap card is filed.",
    open: { label: "Open source", url: input.sourceUrl },
  };
}

/** F4's card: the card, its status, a week with no Contributor, and what
 *  each answer does. */
export function unownedItem(input: { id: string; creator: string; card: { title: string; url: string; status: string | null } }): ReportItem {
  return {
    id: input.id,
    title: oneLine(input.card.title),
    subtitle: `<@${input.creator}> · ${statusWords(input.card.status)} · no Contributor for a week`,
    body: "Who should take it? Assign makes the person asked its Contributor. Leave it sets nobody, and I won't ask again until the card changes.",
    done: "the person asked is its Contributor.",
    open: { label: "Open card", url: input.card.url },
  };
}

/**
 * F5's card: the card, its status, three quiet weeks, and what each answer
 * does.
 *
 * @param input.to - The Design Status Done proposes, the schema's spelling
 */
export function staleItem(input: { id: string; people: readonly string[]; card: { title: string; url: string; status: string | null }; to: string }): ReportItem {
  return {
    id: input.id,
    title: oneLine(input.card.title),
    subtitle: `${mentionsOf(input.people)} · ${statusWords(input.card.status)} · no comments for 3 weeks`,
    body: `Is it still moving? Done moves it to ${oneLine(input.to)} or another status, Still on it checks again in 3 weeks, Drop it archives it.`,
    done: "its Design Status is moved.",
    open: { label: "Open card", url: input.card.url },
  };
}

/** A day as ET's calendar has it: "Oct 30". */
export function etDay(at: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(new Date(at));
}

/**
 * F4's answers: Assign the person asked, or Leave it.
 *
 * @param creator - The person asked, a Slack id
 */
export function unownedChoices(creator: string): ReviewChoice[] {
  return [
    { value: "assign", label: `Assign <@${creator}>`, past: `Assigned <@${creator}>`, verdict: "confirm" },
    { value: "leave", label: "Leave it", past: "Left unassigned", verdict: "cancel", decided: "No Contributor set. Not asked again until the card changes." },
  ];
}

/**
 * F5's answers: Done writes the Design Status in the pop-up's select, Still
 * on it writes nothing and checks again on `again`, Drop it archives the
 * card — offered only when the board has that status.
 *
 * @param again - When Still on it is checked again, epoch ms
 * @param drop - The board's drop status, exact, or null when it has none
 */
export function staleChoices(again: number, drop: string | null): ReviewChoice[] {
  return [
    { value: "done", label: "Done", verdict: "confirm" },
    { value: "still", label: "Still on it", verdict: "cancel", decided: `Nothing written. Checked again ${etDay(again)}.` },
    ...(drop
      ? [{ value: "drop", label: "Drop it", past: "Dropped", verdict: "confirm" as const, args: { properties: { "Design Status": drop } }, decided: `Written: moved to ${drop}.` }]
      : []),
  ];
}

/** What Review shows for F3's drafted card. */
export function todoReviewLead(title: string): string {
  return `Draft Roadmap card for the to-do: *${escapeSlackText(oneLine(title))}*, on the PRD template and linked to where it came up. Approve files it; Edit fields changes its title, summary or pillar first.`;
}

/** What Review shows for F4's Contributor change. */
export function unownedReviewLead(card: { title: string; url: string }, slackUser: string): string {
  return `<${card.url}|${escapeSlackText(oneLine(card.title))}> has no Contributor. Assign makes <@${slackUser}>, the person asked, its Contributor. Leave it sets nobody, and I won't ask again until the card changes.`;
}

/** What Review shows for F5's status change. */
export function staleReviewLead(card: { title: string; url: string; status: string | null }, to: string): string {
  const from = card.status ? ` in *${escapeSlackText(card.status)}*` : "";
  return `<${card.url}|${escapeSlackText(oneLine(card.title))}> has sat${from} with no comments for about three weeks. Done moves it to *${escapeSlackText(to)}*, or the Design Status picked under Edit fields. Still on it writes nothing and checks again in 3 weeks. Drop it archives it.`;
}

/** A card that went up and did not stage: it comes back the next morning. */
export const FOLLOW_UP_NOT_STAGED = "Didn't go through, so it comes back tomorrow morning";

/** A tap or a reaction on a follow-up that is on the shared card. */
export const ANSWER_ON_CARD = "Press Review on its card to answer this one, so that changed nothing.";

/** What a turn that would revise a follow-up's card is told instead: the
 *  pop-up is the one way to change it. */
export const FOLLOW_UP_REVISION: Record<Kind, string> = {
  card_todo: "To change the drafted card, press Review on it and use Edit fields before you approve.",
  card_unowned: "To give this card to someone else, set its Contributor in Notion and choose Leave it in its Review.",
  card_stale: "To move this card somewhere else, press Review on it and pick the Design Status under Edit fields.",
};
