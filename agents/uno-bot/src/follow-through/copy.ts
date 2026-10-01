// What a card follow-up says, and what each answer to it means.
//
// Fixed by the scenario table: F3 offers to draft the card ("Want me to draft
// the card for <X>?"), F4 asks who is taking the card ("Who's taking
// <card>?"), F5 asks whether it is still moving ("Still moving?"). Each
// mentions its owner and nobody else by default — the assignee or a note's
// takers, the card's creator, its Contributors — and never the lead unless the
// lead is that person.
//
// Every Notion string (a title, a status) and every to-do summary is escaped
// with `escapeSlackText` before it reaches a message: a title holding
// `<!channel>` pings nobody. A link is Slack's own `<url|label>`.
//
// PURE: no `Env`, no Slack module, no Workers global.

import { escapeSlackText } from "../slack/mrkdwn";
import { reminderAnswer, type ReminderFooter } from "../commitments/copy";

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

/** What sits under each kind's first message and its follow-up: buttons where a
 *  tap answers it, a line of words where only a typed reply can (F4 names a
 *  person). */
export const CARD_FOOTERS: Record<"card_todo" | "card_unowned" | "card_stale", ReminderFooter> = {
  card_todo: {
    choices: [
      { glyph: "white_check_mark", label: "✅ Draft it" },
      { glyph: "no_good", label: "🙅 No thanks" },
    ],
  },
  card_unowned: "Reply here with an @mention, or \"me\", and I'll draft the Contributor change",
  card_stale: {
    choices: [
      { glyph: "raised_hands", label: "🙌 Finished" },
      { glyph: "hourglass_flowing_sand", label: "⏳ Still going" },
      { glyph: "no_good", label: "🙅 Drop it" },
    ],
  },
};

/** What replaces the legend once someone answers. */
export function cardAcknowledgement(answer: CardAnswer | "owner" | "status", staged: boolean): string {
  switch (answer) {
    case "draft":
      return "On it, thanks. The draft card is in this thread; a ✅ there files it.";
    case "owner":
      return staged ? "Thanks. The Contributor change is in this thread; a ✅ there applies it." : "Thanks.";
    case "status":
      return staged ? "Thanks. The status change is in this thread; a ✅ there applies it." : "Thanks.";
    case "done":
      return staged ? "Nice. Pick the card's new Design Status in this thread." : "Nice, noted.";
    case "still_on_it":
      return "Got it, thanks. I'll leave it be for now.";
    case "drop":
      return staged ? "Understood. Pick the card's new Design Status in this thread." : "Understood. I won't ask again.";
  }
}

function mentionsOf(people: readonly string[]): string {
  return [...new Set(people.filter(Boolean))].map((p) => `<@${p}>`).join(" ");
}

function cardLink(card: { title: string; url: string }): string {
  const title = escapeSlackText(card.title.replace(/\s+/g, " ").trim() || "untitled");
  return card.url ? `<${card.url}|${title}>` : title;
}

/**
 * F3's offer.
 *
 * @param input.people - The assignee, or the note's takers
 * @param input.what - The card's subject, as the detector summarised it
 * @param input.sourceUrl - The thread's permalink or the note's link, when known
 * @param input.fromNote - Whether a running note, not a thread, held the to-do
 */
export function todoOfferText(input: { people: readonly string[]; what: string; sourceUrl: string | null; fromNote: boolean }): string {
  const where = input.fromNote ? "the running note" : "this thread";
  const from = input.sourceUrl ? `<${input.sourceUrl}|${where}>` : where;
  return `${mentionsOf(input.people)} Would it help if I drafted a Roadmap card for ${escapeSlackText(input.what)}? It came up as a to-do in ${from}, and I couldn't find a matching card. No worries if not.`;
}

/** F4's question. */
export function unownedText(input: { creator: string; card: { title: string; url: string; status: string | null } }): string {
  const status = input.card.status ? ` in *${escapeSlackText(input.card.status)}*` : "";
  return `<@${input.creator}> Quick question when you have a moment: who's the right person to take ${cardLink(input.card)}? It's been${status} for over a week without a Contributor, and I didn't want it to slip through.`;
}

/** F5's question. */
export function staleText(input: { people: readonly string[]; card: { title: string; url: string; status: string | null } }): string {
  const status = input.card.status ? ` in *${escapeSlackText(input.card.status)}*` : "";
  return `${mentionsOf(input.people)} Checking in on ${cardLink(input.card)}, in case it helps. It's been${status} for about three weeks with no comments. Is it still moving, finished, or better to drop? Any of those is fine.`;
}

/** The one follow-up, a week on. */
export function cardFollowUpText(kind: "card_todo" | "card_unowned" | "card_stale", people: readonly string[]): string {
  switch (kind) {
    case "card_todo":
      return `${mentionsOf(people)} One more note from me, then I'll leave it be: would a drafted card still help? Either button is fine.`;
    case "card_unowned":
      return `${mentionsOf(people)} One more note from me, then I'll leave it be: this card still has no Contributor. Reply with an @mention, or "me", whenever you're ready and I'll draft the change.`;
    case "card_stale":
      return `${mentionsOf(people)} One more note from me, then I'll leave it be. Whichever button fits is fine.`;
  }
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
