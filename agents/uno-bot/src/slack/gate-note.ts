// What a gate verdict says, in Slack.
//
// Gate resolves a staged proposal and returns a `GateNote` — which verdict this
// is, and the facts it turned on. This file is the only place those become
// words, which is the point: every one of these lines used to be a string
// constant in `gate/gate.ts`, a module documented as "results, never effects;
// no Slack call", and one of them carried a `<@user>` mention (#623).
//
// Four doors post them and not one of them may hold Slack's copy — three live
// in Gate (`gate/reaction-door.ts`, the button door's resolver, the model's
// `proposal_resolve`) and one in Turn. They all hand the note to
// `Delivery.postGateNote`, and `slack/delivery-adapter.ts` calls this. A note
// about the card's own state — aged out, replaced, waiting on someone else —
// arrives with the card, and the adapter edits it onto the card as its last
// line (`renderCardNote`) instead of posting a new message.
//
// The wordings themselves are load-bearing and have each been earned:
//
//   • THE LOST RACE is one wording for every door, and deliberately
//     without a mention: the model's signal has no user, and a message that
//     differs by door is a message that drifts by door.
//   • AN AGED-OUT CARD is never met with silence. Live 2026-07-10, silence
//     read as "the bot is broken" to someone who believed they had just
//     confirmed something. Every card, whoever staged it, ends on the one
//     line `EXPIRED_CARD` once its deadline passes — edited on by the gesture
//     that found it or by the store's alarm at the deadline (#1316). The
//     card showed its deadline all along, so the line names none.
//   • A REPLACED CARD gets its own line rather than the expiry one (#573). The
//     person did not wait too long, they acted on the card above the one being
//     held — and unlike an aged-out card there is a live one in the thread to
//     send them to.
//   • A STATED CARD (the Dev Mode links card, the weekly DS precedence card) is one
//     nobody asked for, with no ⚠️ and a ⛔ that means what its footer says.
//     "Tell me what to change", "ask me again" and "the newest card" are all
//     wrong on it, so it carries its own words for a ⛔ and a late
//     decision (`PendingProposal.stated`, written beside each card's copy),
//     and a replaced card or a gesture beside it gets a stated line here.
//     These follow the Figma copy rules (`docs/connectors/slack/shapes.md` § Figma
//     messages), and `tests/figma-copy.test.ts` holds them to it.
//
// Import-free and Env-free: it renders and posts nothing.

import type { CardOutcome, GateNote } from "../turn/index";
import type { StatedCardWords } from "../thread-state/index";
import { SLACK_USER_ID, escapeSlackText } from "./mrkdwn";

/** The lost race. */
export const STALE_POST =
  "That proposal was already resolved — another confirmation got there first, " +
  "so nothing was executed twice.";

/**
 * An expired card's message, on every path that expires one (#1316): the
 * line a card ends on once its deadline passed, and the answer to a gesture
 * that came after it. Nothing ran — an expired card cannot run anything — and
 * a fresh card is one ask away.
 */
export const EXPIRED_CARD = "Expired. Ask again for a fresh card.";

/** The ✅/⛔ on a proposal a revision replaced (#573). */
export const SUPERSEDED_POST =
  "That proposal was replaced by a newer one — nothing was executed. " +
  "Confirm on the newest card in this thread instead.";

/** The ✅/⛔ on a proposal a revision replaced, naming the card that did:
 *  with several live cards in a thread, the newest may be another matter's
 *  (#1319). When that card no longer waits either, it is still named, and
 *  said to be done, rather than the person sent to some other card (story
 *  18). The headline is the model's input, so escaped. */
export function supersededBy(headline: string, waiting = true): string {
  const named = `*${escapeSlackText(headline)}*`;
  return waiting
    ? `That proposal was replaced by ${named} — nothing was executed. Confirm on that card instead.`
    : `That proposal was replaced by ${named}, which is no longer waiting either — nothing was executed. Ask again for a fresh card.`;
}

/** The ✅/⛔ on a stated card a revision replaced. */
export const STATED_SUPERSEDED_POST =
  "That card was revised, so nothing ran. Decide on the newest card in this thread.";

/**
 * A stated card's last line once a ⛔ has decided it, where its buttons were:
 * what the ⛔ did, and who decided. Only a Slack user id is mentioned, which is
 * what the markup sanitizer keeps (`SLACK_USER_ID`).
 */
export function statedCancelledNote(words: Pick<StatedCardWords, "cancelled">, userId: string): string {
  return `${words.cancelled}${SLACK_USER_ID.test(userId) ? `, decided by <@${userId}>` : ""}.`;
}

/**
 * A decided card's last line, where its buttons were: who approved it, or who
 * canceled it and how to have it staged again — a stated card in its own
 * words, the pop-up's Reject with its reason. One line whatever the door, so
 * a card decided by a press reads the same as one decided by a reaction or in
 * words (`Delivery.closeCard`).
 */
export function decidedCardLine(outcome: CardOutcome): string {
  const by = outcome.by ? ` by <@${outcome.by}>` : "";
  if (outcome.decision === "confirm") return `Approved${by}`;
  if (outcome.cancelled) return statedCancelledNote({ cancelled: outcome.cancelled }, outcome.by ?? "");
  if (outcome.rejected) {
    return `Rejected${by}${outcome.rejected.reason ? `: ${escapeSlackText(outcome.rejected.reason)}` : ""}`;
  }
  return `Canceled${by} — tell me what to change and I'll stage it again.`;
}

/** The default narrative, when the winning signal brought no words of its own. */
export function defaultNarrative(decision: "confirm" | "cancel"): string {
  return decision === "confirm" ? "Got it — kicking that off." : "Canceled.";
}

/** The pop-up's Reject, and the reason given with it: the person's own words,
 *  so text and never markup. */
export function rejectedLine(reason?: string): string {
  return reason ? `Rejected, so nothing runs. Reason: ${escapeSlackText(reason)}` : "Rejected, so nothing runs.";
}

/** A signal on a card sent back with Needs changes, while its revision is
 *  written. Nothing ran, and the new card is where to decide. */
export const BEING_REVISED_POST =
  "That proposal is being revised, so nothing ran. Decide on the revised card when it posts in the thread.";

/** A typed emoji or a worded answer to one item of a decision report, which
 *  only its own Review decides. */
export const REVIEW_ONLY_POST = "Each card here is decided from its own Review button, so nothing ran.";

/**
 * What a turn's staging did, said just above its card (#1318): a revision
 * replaced the card it names; a separate proposal posted beside the cards
 * still waiting. Either way the person can catch a wrong call at once and
 * correct it in words. The headlines are the model's input, so escaped.
 */
export function stagingLine(note: Extract<GateNote, { kind: "revised" | "staged-beside" }>): string {
  if (note.kind === "revised") return `Revised *${escapeSlackText(note.replaced)}*: the card below replaces the one above.`;
  const names = note.waiting.map((w) => `*${escapeSlackText(w)}*`);
  const listed = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)} above are` : `${names[0]} above is`;
  return `Added a new card below. ${listed} still waiting.`;
}

/**
 * A revision named one card but writes what another card writes: say so,
 * name both, and that nothing changed, so the person can say which card the
 * change belongs on. The headlines are the model's input, so escaped.
 */
export function aimedElsewhereLine(note: Extract<GateNote, { kind: "aimed-elsewhere" }>): string {
  return (
    `That change was for *${escapeSlackText(note.named)}*, but it writes the same page or issue as *${escapeSlackText(note.other)}*, ` +
    "so I didn't stage it and both cards are still waiting. Say which card it belongs on."
  );
}

/**
 * The "which one?" question (#1319): how many cards wait, and that nothing
 * ran — the line above the question's Choose… button (`which-card.ts`). The
 * pop-up it opens only cancels, so a question an approval asked says where
 * one is made instead (`WHICH_APPROVE_HINT`).
 */
export function whichCardQuestion(note: Extract<GateNote, { kind: "which-card" }>): string {
  const asked = `${note.cards.length} cards are waiting, nothing ran yet.`;
  return note.decision === "confirm" ? `${asked} ${WHICH_APPROVE_HINT}` : asked;
}

/** Said after the question's count when an approval asked it: the pop-up
 *  only cancels, and an approval is made on the card. */
export const WHICH_APPROVE_HINT = "Approve from a card's Review.";

/** The question's text copy: the question, and the cards by headline — what
 *  a notification and a screen reader get, since the message itself lists
 *  them only in its pop-up. Headlines come from the model's input, so
 *  escaped. */
function whichCardText(note: Extract<GateNote, { kind: "which-card" }>): string {
  const names = note.cards.map((card) => `*${escapeSlackText(card.headline)}*`);
  return `${whichCardQuestion(note)} Waiting: ${names.join(", ")}.`;
}

/** One verdict, as the line a person reads. */
export function renderGateNote(note: GateNote): string {
  switch (note.kind) {
    case "revised":
    case "staged-beside":
      return stagingLine(note);
    case "aimed-elsewhere":
      return aimedElsewhereLine(note);
    case "resolved":
      // A stated card's ⛔ says what its footer promised, in the card's words.
      if (note.decision === "cancel" && note.cancelled) return `${note.cancelled}.`;
      if (note.decision === "cancel" && note.rejected) return rejectedLine(note.rejected.reason);
      return defaultNarrative(note.decision);
    case "said":
      return note.text;
    case "already-resolved":
      return STALE_POST;
    case "expired":
      return note.words ?? EXPIRED_CARD;
    case "superseded":
      if (note.stated) return STATED_SUPERSEDED_POST;
      return note.by ? supersededBy(note.by, note.byWaiting !== false) : SUPERSEDED_POST;
    case "not-on-the-card":
      // Say where the card is, and name who is being answered: this is the one
      // verdict aimed at a specific person's specific gesture, so it is the one
      // that mentions them.
      // It points at Review, the one gate a card teaches: the reactions a
      // card still takes are a fallback, never advertised.
      if (note.stated) {
        return `<@${note.userId}> I saw your :${note.glyph}:, but it's not on the card, so nothing ran. Press Review on the card to decide it.`;
      }
      return (
        `:warning: <@${note.userId}> I saw your :${note.glyph}:, but it is not on the proposal I am holding — ` +
        `nothing was executed. Press Review on the card for *${note.toolName}* just above.`
      );
    case "which-card":
      // Two cards are two different writes, and a decision that names neither
      // says nothing about which one it meant. Guessing runs the wrong one.
      // The buttons are the message's own (`which-card.ts`); this is its text.
      return whichCardText(note);
    case "review-only":
      return REVIEW_ONLY_POST;
    case "not-a-confirmer":
      return notAConfirmerLine(note);
    case "being-revised":
      return BEING_REVISED_POST;
    case "resolve-failed":
      return `:x: I caught your :${note.glyph}: but hit a snag executing it — give it another go, or tell me and I'll retry.`;
    case "cut-off":
      return cutOffLine(note);
  }
}

/**
 * A verdict as the line edited onto its card (`Delivery.postGateNote` with a
 * card): the same words as in the thread, without the mention of the person
 * whose gesture it answered — a line on the card stays there for everyone,
 * and an edit notifies no one anyway. An expired card says `EXPIRED_CARD`,
 * a stated one too: its own words are for the person who acted.
 */
export function renderCardNote(note: GateNote): string {
  if (note.kind === "expired") return EXPIRED_CARD;
  return note.kind === "not-a-confirmer" ? notAConfirmerLine({ ...note, userId: undefined }) : renderGateNote(note);
}

/** Whether the card a note sits on can still be decided: only one waiting on
 *  someone else is. Every other card note closes it. */
export function cardStaysLive(note: GateNote): boolean {
  return note.kind === "not-a-confirmer";
}

/**
 * A signal from someone the card does not accept. Names who can confirm,
 * since that is what the person needs in order to get it moving. Only Slack
 * user ids are mentioned, which is what the markup sanitizer keeps
 * (`SLACK_USER_ID`); anything else would blank the post, so it is left out.
 */
function notAConfirmerLine(note: Extract<GateNote, { kind: "not-a-confirmer" }>): string {
  const to = note.userId && SLACK_USER_ID.test(note.userId) ? `<@${note.userId}> ` : "";
  const who = note.confirmers.filter((id) => SLACK_USER_ID.test(id)).map((id) => `<@${id}>`);
  const can = who.length
    ? `Only ${joinNames(who)} can confirm or cancel this proposal`
    : "Nobody here can confirm or cancel this proposal";
  return `:warning: ${to}${can} — nothing was executed.`;
}

/** "a", "a or b", "a, b or c". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * An approved run that never reported back. Three things, in the order a
 * person needs them: that it was cut off, what came back, and what did not —
 * which may have happened, so it is never promised either way. Tool names are
 * the only interpolation, and they are identifiers, so nothing here needs
 * escaping.
 */
function cutOffLine(note: Extract<GateNote, { kind: "cut-off" }>): string {
  // Only a Slack user id is mentioned, which is what the markup sanitizer
  // keeps (`SLACK_USER_ID`); anything else would blank the post.
  const to = note.mention && SLACK_USER_ID.test(note.mention) ? `<@${note.mention}> ` : "";
  const lines = [
    `:warning: ${to}That approved run was cut off before it reported back, so this may not all have run.`,
  ];
  if (note.finished.length) {
    const done = note.finished
      .map((op) => `\`${op.toolName}\` ${op.ok ? "done" : "failed"}`)
      .join(", ");
    lines.push(`Finished: ${done}.`);
  }
  if (note.unfinished.length) {
    const open = note.unfinished.map((name) => `\`${name}\``).join(", ");
    lines.push(
      `Didn't report back: ${open} — ${note.unfinished.length === 1 ? "it" : "these"} may or may not have happened, so check before approving again.`,
    );
    lines.push(
      note.restaged
        ? "I've put just what didn't report back on a fresh card below. Nothing runs until you approve it."
        : "Nothing was re-staged. Ask me if you want it set up again.",
    );
  } else {
    lines.push("Everything came back, so there is nothing to run again.");
  }
  return lines.join("\n");
}
