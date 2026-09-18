// What the thread is told once an approved batch has run.
//
// Slack's, not Gate's (#623). The account of a finished batch is grouped and
// labelled exactly as the card grouped and labelled the plan — the person is
// checking the result AGAINST the card they approved, and two different shapes
// for the same batch make them do that matching by hand. That grouping is
// `proposal-render.ts`'s, which is why this line belongs on this side of the
// seam: writing it in `gate/run-batch.ts` was what made Gate reach into a
// Slack module for the card's own renderer.
//
// The model-facing counterpart stays in Gate: `batchOutcomeNote` is the
// history note, and it carries no emoji and no mrkdwn.

import type { OperationOutcome } from "../gate/index";
import { groupOperations, operationKindSummary } from "./proposal-render";

/**
 * What the thread is told once the batch has run — every operation named, done
 * or failed, so a partial result is visible rather than hidden behind the one
 * that succeeded.
 *
 * Grouped by target and labelled by kind, the same way the card grouped and
 * labelled the plan: the person is checking the result AGAINST the card they
 * approved, and two different shapes for the same batch make them do that
 * matching by hand.
 *
 * `null` for a single operation: nothing there needs disambiguating, and the
 * tool's own reply already says what happened.
 */
export function batchResultMessage(outcomes: OperationOutcome[]): string | null {
  if (outcomes.length <= 1) return null;
  const failed = outcomes.filter((o) => !o.ok).length;
  const head = failed
    ? `:warning: Ran ${outcomes.length} operations — ${outcomes.length - failed} done, ${failed} failed:`
    : `:white_check_mark: Ran all ${outcomes.length} operations:`;
  const planned = outcomes.map((o) => ({ toolName: o.toolName, input: o.input ?? {} }));
  const lines: string[] = [];
  for (const group of groupOperations(planned)) {
    lines.push(group.heading);
    for (const i of group.members) {
      const o = outcomes[i]!;
      const mark = o.ok ? ":white_check_mark:" : ":x:";
      lines.push(`  ${i + 1}. ${mark} *${operationKindSummary(planned[i]!)}* — ${o.message}`);
    }
  }
  return [head, ...lines].join("\n");
}
