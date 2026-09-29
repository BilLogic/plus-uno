// #uno-bot as the intake channel: a post there is the team reporting a problem
// with uno-bot, or asking for a change to it.
//
// Two readers, one rule. The event gate (`slack/events.ts`) engages on a
// top-level post there with no @mention, and Turn tells the model what such a
// post is for. Both ask `isIntakeChannel` against the Worker's config
// (`UNO_BOT_CHANNEL_ID`), so what counts as a match is decided here and the
// channel id is never a literal.
//
// The drafting itself rides tools that already exist: the duplicate check
// (`github_intake_search`), the gated `github_issue_create` whose executor
// fixes the `harness-intake` label and appends the post's link and the
// reporter, and `github_issue_update` for a comment on a match. What this
// module adds is the instruction that points a post at them, and who may
// confirm the card: the poster plus the people who have replied in its thread,
// held on the card as its confirmer set (`PendingProposal.confirmers`).
//
// PURE: no `Env`, no Slack module, so Turn can import it (`turn.test.ts`
// asserts Turn imports no Slack module) and a Node test can drive it.

import type { PendingProposal } from "../thread-state/index";

/** A message in #uno-bot, as far as the intake cares: who has posted in its
 *  thread so far, poster first. The envelope reads them off the thread it
 *  already fetched for history; a top-level post is its poster alone. */
export interface IntakeThread {
  participants: string[];
}

/**
 * True when `channel` is the configured #uno-bot. Unset config means there is
 * no intake channel, so nothing matches.
 */
export function isIntakeChannel(channel: string, configured: string | undefined): boolean {
  const id = configured?.trim();
  return Boolean(id) && channel === id;
}

/**
 * The model-visible block for a turn in #uno-bot.
 *
 * On the post itself the reporter is its poster, named by Slack id. On a reply
 * in its thread the replier is refining a report someone else opened, so the
 * block names the thread's opener instead.
 */
export function intakeChannelInstruction(message: { senderId: string; isReply: boolean }): string {
  const who = message.isReply ? "the person who opened this thread" : `<@${message.senderId}>`;
  return [
    "(system: INTAKE CHANNEL — this is #uno-bot, where the team reports problems with uno-bot and asks for changes to it.",
    "When the message reports a problem or asks for a change, it is an intake:",
    "1. Run `github_intake_search` first.",
    "2. An open intake that matches → stage `github_issue_update` with a comment on that issue carrying this report, and link the issue. No match → stage `github_issue_create` on the default repo.",
    `3. Draft it to spec grade: what happened; what was expected; the evidence (any thread, link or screenshot the post references — the post's own link is appended when it files); who reported it (${who}); a suggested label or area.`,
    "4. Reply in one short line — \"Want me to file this?\" — with the card as the draft. A reply here that refines it gets a revised card.",
    "A question gets its answer and no card; add the intake offer only when it also reports a problem or asks for a change.)",
  ].join("\n");
}

/**
 * Who may confirm a card staged in #uno-bot: everyone the card it revises
 * already admitted (or that card's requester, when it had no set), the thread's
 * participants, and the person whose turn stages it — each once, in that order.
 *
 * Grows with the thread: a reply that revises the card joins its replier, and
 * inherits everyone before.
 */
export function intakeConfirmers(
  thread: IntakeThread,
  pending: Pick<PendingProposal, "confirmers" | "requesterUserId"> | null,
  senderId: string,
): string[] {
  const before = pending ? (pending.confirmers ?? [pending.requesterUserId]) : [];
  return [...new Set([...before, ...thread.participants, senderId])];
}
