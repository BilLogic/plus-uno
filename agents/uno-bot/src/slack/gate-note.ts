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
//     confirmed something.
//   • A REPLACED CARD gets its own line rather than the expiry one (#573). The
//     person did not wait too long, they acted on the card above the one being
//     held — and unlike an aged-out card there is a live one in the thread to
//     send them to.
//   • A STATED CARD (the library card, the weekly DS precedence card) is one
//     nobody asked for, with no ⚠️ and a ⛔ that means what its footer says.
//     "Tell me what to change", "ask me again" and "the newest card" are all
//     wrong on it, so it carries its own words for a ⛔ and a late
//     decision (`PendingProposal.stated`, written beside each card's copy),
//     and a replaced card or a gesture beside it gets a stated line here.
//     These follow the Figma copy rules (`docs/connectors/slack.md` § Figma
//     messages), and `tests/figma-copy.test.ts` holds them to it.
//
// Import-free and Env-free: it renders and posts nothing.

import type { GateNote } from "../turn/index";
import { PROPOSAL_TTL_MS, type StatedCardWords } from "../thread-state/index";
import { SLACK_USER_ID, escapeSlackText } from "./mrkdwn";
import { gateWordsFor } from "../agent/tool-table";

/** The lost race. */
export const STALE_POST =
  "That proposal was already resolved — another confirmation got there first, " +
  "so nothing was executed twice.";

/**
 * The delayed ✅/❌ on a card that aged out, naming how long it was live — the
 * card's own lifetime, which is an hour unless it set one.
 */
export function expiredPost(ttlMs?: number): string {
  return (
    "That proposal had already expired — nothing was executed. " +
    `It stayed live for ${lifetimeWords(ttlMs ?? PROPOSAL_TTL_MS)}. ` +
    "Ask me again and I'll set the same thing up fresh."
  );
}

/** The expiry line for a card on the default hour. */
export const EXPIRED_POST = expiredPost();

/** A lifetime as a person says it: "an hour", "72 hours", "30 minutes". */
function lifetimeWords(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes % 60 !== 0) return minutes === 1 ? "a minute" : `${minutes} minutes`;
  const hours = minutes / 60;
  return hours === 1 ? "an hour" : `${hours} hours`;
}

/** The ✅/⛔ on a proposal a revision replaced (#573). */
export const SUPERSEDED_POST =
  "That proposal was replaced by a newer one — nothing was executed. " +
  "Confirm on the newest card in this thread instead.";

/** The ✅/⛔ on a stated card a revision replaced. */
export const STATED_SUPERSEDED_POST =
  "That card was revised, so nothing ran. Decide on the newest card in this thread.";

/**
 * A stated card's last line once a ⛔ has decided it, where its buttons were:
 * what the ⛔ did, and who decided. Only a Slack user id is mentioned, which is
 * what the markup sanitiser keeps (`SLACK_USER_ID`).
 */
export function statedCancelledNote(words: Pick<StatedCardWords, "cancelled">, userId: string): string {
  return `:no_entry: ${words.cancelled}${SLACK_USER_ID.test(userId) ? `, decided by <@${userId}>` : ""}.`;
}

/** The default narrative, when the winning signal brought no words of its own. */
export function defaultNarrative(decision: "confirm" | "cancel"): string {
  return decision === "confirm" ? "Got it — kicking that off." : "Cancelled.";
}

/** The pop-up's Reject, and the reason given with it: the person's own words,
 *  so text and never markup. */
export function rejectedLine(reason?: string): string {
  return reason ? `Rejected, so nothing runs. Reason: ${escapeSlackText(reason)}` : "Rejected, so nothing runs.";
}

/**
 * A ⛔ on a card that runs part of itself on a cancel. Worded from each row's
 * own operation kind, so it says what goes ahead rather than naming a tool.
 */
function cancelStillRuns(toolNames: readonly string[]): string {
  const kinds = [...new Set(toolNames.map((name) => thirdPerson(gateWordsFor(name)?.kind ?? name)))];
  return `Cancelled — this card still ${kinds.join(" and ")} on a cancel, so that part goes ahead.`;
}

/** "file an issue" → "files an issue": a row's kind is a bare verb phrase. */
function thirdPerson(phrase: string): string {
  return phrase.replace(/^(\w+)/, (verb) => (/(s|sh|ch|x)$/.test(verb) ? `${verb}es` : `${verb}s`));
}

/** A signal on a card sent back with Needs changes, while its revision is
 *  written. Nothing ran, and the new card is where to decide. */
export const BEING_REVISED_POST =
  "That proposal is being revised, so nothing ran. Decide on the revised card when it posts in the thread.";

/** One verdict, as the line a person reads. */
export function renderGateNote(note: GateNote): string {
  switch (note.kind) {
    case "resolved":
      // A stated card's ⛔ says what its footer promised, in the card's words.
      if (note.decision === "cancel" && note.cancelled) return `${note.cancelled}.`;
      if (note.decision === "cancel" && note.rejected && !note.stillRuns?.length) return rejectedLine(note.rejected.reason);
      return note.stillRuns?.length ? cancelStillRuns(note.stillRuns) : defaultNarrative(note.decision);
    case "said":
      return note.text;
    case "already-resolved":
      return STALE_POST;
    case "expired":
      return note.words ?? expiredPost(note.ttlMs);
    case "superseded":
      return note.stated ? STATED_SUPERSEDED_POST : SUPERSEDED_POST;
    case "not-on-the-card":
      // Say where the card is, and name who is being answered: this is the one
      // verdict aimed at a specific person's specific gesture, so it is the one
      // that mentions them.
      if (note.stated) {
        return (
          `<@${note.userId}> I saw your :${note.glyph}:, but it's not on the card, so nothing ran. ` +
          `Use the card's buttons, or react on the card itself.`
        );
      }
      return (
        `:warning: <@${note.userId}> I saw your :${note.glyph}:, but it is not on the proposal I am holding — ` +
        `nothing was executed. Use the buttons on the card for *${note.toolName}* just above, ` +
        `or react there.`
      );
    case "which-card":
      // Only an unthreaded DM line reaches this: anywhere else a typed emoji
      // sits in a card's own thread and answers that card. Two cards are two different writes, and a ✅ outside both threads says
      // nothing about which one it meant. Guessing runs the wrong one.
      return (
        `:warning: ${note.count} proposals are waiting in this DM, so I can't tell which one that is for — ` +
        `nothing was executed. React on the card you mean, or use its buttons.`
      );
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
 * and an edit notifies no one anyway.
 */
export function renderCardNote(note: GateNote): string {
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
 * user ids are mentioned, which is what the markup sanitiser keeps
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
  // Only a Slack user id is mentioned, which is what the markup sanitiser
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
