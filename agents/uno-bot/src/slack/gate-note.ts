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
// `Delivery.postGateNote`, and `slack/delivery-adapter.ts` calls this.
//
// The wordings themselves are load-bearing and have each been earned:
//
//   • THE LOST RACE is one wording for all four doors, and deliberately
//     without a mention: the model's signal has no user, and a message that
//     differs by door is a message that drifts by door.
//   • AN AGED-OUT CARD is never met with silence. Live 2026-07-10, silence
//     read as "the bot is broken" to someone who believed they had just
//     confirmed something.
//   • A REPLACED CARD gets its own line rather than the expiry one (#573). The
//     person did not wait too long, they acted on the card above the one being
//     held — and unlike an aged-out card there is a live one in the thread to
//     send them to.
//
// Import-free and Env-free: it renders and posts nothing.

import type { GateNote } from "../turn/index";

/** The lost race. */
export const STALE_POST =
  ":hourglass: That proposal was already resolved — another confirmation got there first, " +
  "so nothing was executed twice.";

/** The delayed ✅/❌ on a card that aged out. */
export const EXPIRED_POST =
  ":hourglass: That proposal had already expired — nothing was executed. " +
  "Proposals stay live for an hour. Ask me again and I'll set the same thing up fresh.";

/** The ✅/⛔ on a proposal a revision replaced (#573). */
export const SUPERSEDED_POST =
  ":arrows_counterclockwise: That proposal was replaced by a newer one — nothing was executed. " +
  "Confirm on the newest :warning: card in this thread instead.";

/** The default narrative, when the winning signal brought no words of its own. */
export function defaultNarrative(decision: "confirm" | "cancel"): string {
  return decision === "confirm" ? "Got it — kicking that off." : "Cancelled.";
}

/** One verdict, as the line a person reads. */
export function renderGateNote(note: GateNote): string {
  switch (note.kind) {
    case "resolved":
      return defaultNarrative(note.decision);
    case "said":
      return note.text;
    case "already-resolved":
      return STALE_POST;
    case "expired":
      return EXPIRED_POST;
    case "superseded":
      return SUPERSEDED_POST;
    case "not-on-the-card":
      // Say where the card is, and name who is being answered: this is the one
      // verdict aimed at a specific person's specific gesture, so it is the one
      // that mentions them.
      return (
        `:eyes: <@${note.userId}> I saw your :${note.glyph}:, but it is not on the proposal I am holding — ` +
        `nothing was executed. Use the buttons on the :warning: card for *${note.toolName}* just above, ` +
        `or react there.`
      );
    case "which-card":
      // Only an unthreaded DM line reaches this: anywhere else a typed emoji
      // sits in a card's own thread and answers that card. Two cards are two different writes, and a ✅ outside both threads says
      // nothing about which one it meant. Guessing runs the wrong one.
      return (
        `:point_up: ${note.count} proposals are waiting in this DM, so I can't tell which one that is for — ` +
        `nothing was executed. React on the :warning: card you mean, or use its buttons.`
      );
    case "resolve-failed":
      return `:warning: I caught your :${note.glyph}: but hit a snag executing it — give it another go, or tell me and I'll retry.`;
  }
}
