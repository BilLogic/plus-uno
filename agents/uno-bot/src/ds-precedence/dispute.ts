// Needs changes on a weekly DS precedence card is a DISPUTE: the person says
// the library is right, or the difference is deliberate, and their note says
// why. Review requires the note. Nothing is redrafted: the note is written on
// the week's intake — "Button: disputed by Maya — ghost is library-only on
// purpose" — through the same one-at-a-time filing an Approve uses
// (`./intake.ts`), so a dispute that comes first files the intake with it.
// Then the card reads "Disputed by X" with the note, and its proposal is
// retired, so nothing else decides it.
//
// A dispute whose write fails lifts the card's Needs changes lock, puts it
// back to open, and says so in one line in the thread, so it can be decided
// again.
//
// Pure: every dependency arrives by name; `tools/ds-precedence-intake.ts`
// binds them.

import { settleItem, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import type { PendingProposal, ThreadState } from "../thread-state/index";
import { PRECEDENCE_INTAKE_TOOL, disputeSection } from "./report";

export interface DisputeDeps {
  store: ReportStore & Pick<ThreadState, "retireProposal" | "clearRevising">;
  /** The person's display name, as GitHub reads it. */
  name(userId: string): Promise<string>;
  /** Add a section to the week's intake (`addToWeeklyIntake`): its JSON result. */
  write(input: { week_of: string; section: string }): Promise<string>;
  /** Edit the report's message in place. */
  edit(messageTs: string, message: ReportMessage): Promise<void>;
  /** One line in the report's thread. */
  say(text: string): Promise<void>;
  now(): number;
}

/** Whether a proposal is one weekly DS precedence card. */
export function isPrecedenceCard(proposal: PendingProposal): boolean {
  return !!proposal.item && proposal.operations?.[0]?.toolName === PRECEDENCE_INTAKE_TOOL;
}

/**
 * Write a Needs changes on a weekly card as a dispute on the week's intake.
 *
 * @param deps - The store, the name lookup, the intake write and the posts
 * @param request - The card's proposal, the note and who sent it
 */
export async function disputePrecedenceItem(
  deps: DisputeDeps,
  request: { proposal: PendingProposal; note: string; userId: string },
): Promise<void> {
  const { proposal, note, userId } = request;
  const item = proposal.item!;
  const input = proposal.operations![0]!.input as { week_of?: unknown; component?: unknown };
  const component = String(input.component ?? item.id);
  const name = await deps.name(userId).catch(() => "a teammate");
  const result = await deps
    .write({ week_of: String(input.week_of ?? ""), section: disputeSection(component, name, note) })
    .catch((err: unknown) => JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  const written = (JSON.parse(result) as { ok?: boolean }).ok !== false;

  if (written) {
    await deps.store.retireProposal(proposal.proposalTs).catch(() => {});
    const message = await settleItem(deps.store, item, { kind: "disputed", by: userId, note }, deps.now());
    if (message) await deps.edit(item.messageTs, message).catch(() => {});
    return;
  }
  const cause = (JSON.parse(result) as { error?: unknown }).error;
  console.error(`[ds-precedence] dispute on ${component} not written: ${String(cause)}`);
  await deps.store.clearRevising(proposal.proposalTs).catch(() => {});
  const message = await settleItem(deps.store, item, { kind: "open" }, deps.now()).catch(() => null);
  if (message) await deps.edit(item.messageTs, message).catch(() => {});
  await deps.say(`Your dispute on ${component} didn't reach this week's intake, so its card is open again. Press Review to send it once more.`).catch(() => {});
}
