// What a job hands the Gate to stage a blueprint revision: the one operation
// the card runs, and who alone may approve it.

import type { PendingProposal, ProposalOperation } from "../thread-state/index";
import type { BlueprintRevision } from "./revision";

/**
 * The gate half of a revision card, to spread onto the `PendingProposal` a job
 * stages beside its own text, blocks, thread and lifetime.
 *
 * The confirmers are exactly the people named — for a shipped card its owner
 * and the lead, for a drawn proposal its requester — and the deployment's standing
 * confirmers are NOT added (`exclusiveConfirmers`): product truth changes only
 * with the person who shipped it or the person who makes product calls.
 *
 * @param revision - The drafted revision; its worst-case cost must fit a press
 *   (`revisionWriteCalls`), or the ✅ will answer that it cannot afford it
 * @param confirmers - Slack user ids, each admitted once
 */
export function revisionCard(
  revision: BlueprintRevision,
  confirmers: readonly string[],
): Pick<PendingProposal, "toolName" | "input" | "operations" | "confirmers" | "exclusiveConfirmers"> {
  const operation: ProposalOperation = { toolName: "blueprint_revise", input: { ...revision } as Record<string, unknown> };
  return {
    toolName: operation.toolName,
    input: operation.input,
    operations: [operation],
    confirmers: [...new Set(confirmers)],
    exclusiveConfirmers: true,
  };
}
