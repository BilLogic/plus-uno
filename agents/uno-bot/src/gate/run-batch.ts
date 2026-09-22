// Running an approved batch, and saying what it did.
//
// One ✅ approves every operation on the card, so one ✅ runs every operation —
// in order, past a failure, and with a per-operation account at the end. The
// incident this exists for is the opposite: an approved four-document plan
// executed its first append, reported "appended 4 block(s)", and left the other
// three documents untouched with nothing in the thread or the logs saying so.
//
// Env-free on purpose. The executor arrives as a function, so `tsconfig.test.json`
// compiles this file and a test can fail operation two on demand without a
// Notion account. `agent/resolve-proposal.ts` is the caller that has `Env` and
// hands in the real side-effect tool table.
//
// AND SLACK-FREE, since #623: what the thread is TOLD about a finished batch —
// the ✅/❌ marks, the grouped mrkdwn list — is `slack/batch-result.ts`. It was
// written here, which made Gate import `slack/proposal-render.ts` to reuse the
// card's grouping, and made the module declared "results, never effects" the
// author of the message a person reads. What stays is the outcome each
// operation came to, and the history note the MODEL reads.

import type { ProposalOperation } from "../thread-state/index";

/** What one operation came to. */
export interface OperationOutcome {
  toolName: string;
  /** The operation's own input, carried through so the result message can group
   *  and label an outcome exactly as the card grouped and labelled the plan.
   *  Optional for an outcome recorded before this shipped. */
  input?: Record<string, unknown>;
  ok: boolean;
  /** The executor's own JSON result, verbatim — the record of what happened. */
  result: string;
  /** One human line for this operation. The history note and the posted result
   *  both read this field, so the two can never disagree about an operation. */
  message: string;
}

/**
 * Run the batch in order, and keep going past a failure.
 *
 * Stopping at the first failure would hide operations three and four behind
 * operation two, which is the same silence in a different place: a person who
 * approved four things is owed four answers.
 */
export async function runOperations(
  operations: ProposalOperation[],
  execute: (operation: ProposalOperation) => Promise<string>,
  /**
   * Told as each operation comes back, before the next one starts — how the
   * execution record learns which side effects are done, so a run cut off
   * part-way is never offered back whole (`ThreadState.settleOperation`). A
   * failure here is logged and never stops the batch: the bookkeeping is not
   * worth an approved operation.
   */
  onSettled?: (index: number, outcome: OperationOutcome) => Promise<void>,
): Promise<OperationOutcome[]> {
  const outcomes: OperationOutcome[] = [];
  for (const [index, operation] of operations.entries()) {
    let result: string;
    try {
      result = await execute(operation);
    } catch (err) {
      // A throw is a failed operation, not a failed batch — the remaining ones
      // are still approved and still run.
      result = JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    console.log(`[gate] ${operation.toolName} executed: ${result}`);
    const outcome: OperationOutcome = {
      toolName: operation.toolName,
      input: operation.input,
      ok: isOkResult(result),
      result,
      message: describeOutcome(operation.toolName, result),
    };
    outcomes.push(outcome);
    try {
      await onSettled?.(index, outcome);
    } catch (err) {
      console.warn(
        `[gate] ${operation.toolName} settled but not recorded: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return outcomes;
}

/** True unless the executor explicitly reported ok:false. */
export function isOkResult(resultJson: string): boolean {
  try {
    return (JSON.parse(resultJson) as { ok?: boolean }).ok !== false;
  } catch {
    return false;
  }
}

/** One operation, in words. Surfaces the result message and any URL, so the
 *  bot remembers on a later turn what it actually did — and says plainly when
 *  an operation did not happen, so it never claims a write it did not make. */
function describeOutcome(toolName: string, resultJson: string): string {
  try {
    const r = JSON.parse(resultJson) as {
      ok?: boolean; message?: string; url?: string; error?: string; detail?: string;
    };
    if (r.ok === false) {
      return `(${toolName} did NOT complete: ${r.error ?? r.detail ?? "unknown error"}. Nothing was created — do not claim success.)`;
    }
    const msg = r.message ?? `${toolName} completed.`;
    return r.url ? `${msg} Notion link: ${r.url}` : msg;
  } catch {
    return `${toolName} completed.`;
  }
}

/**
 * The history note for a whole batch — ONE note, listing every operation.
 *
 * A one-operation batch reads exactly as it did before the batch shipped: the
 * overwhelming majority of proposals are still one write, and the note the
 * model reads on the next turn should not have grown ceremony it does not need.
 */
export function batchOutcomeNote(outcomes: OperationOutcome[]): string {
  if (outcomes.length === 1) return outcomes[0]!.message;
  const done = outcomes.filter((o) => o.ok).length;
  const lines = outcomes.map(
    (o, i) => `${i + 1}. ${o.ok ? "done" : "FAILED"} — ${o.message}`,
  );
  return [
    `(Ran the approved batch of ${outcomes.length} operations: ${done} done, ${outcomes.length - done} failed.)`,
    ...lines,
  ].join("\n");
}

/**
 * The batch's telemetry, one line per Proposal.
 *
 * Proposed, approved and executed are three different numbers and the whole
 * point is that a log can show them disagreeing: the incident behind this work
 * was four proposed, four approved, one executed, and nothing anywhere said so.
 */
export function batchTelemetryLine(input: {
  proposalTs: string;
  proposed: number;
  approved: number;
  outcomes: OperationOutcome[];
}): string {
  const executed = input.outcomes.filter((o) => o.ok).length;
  const failed = input.outcomes.length - executed;
  return (
    `[gate] proposal ${input.proposalTs}: proposed=${input.proposed} ` +
    `approved=${input.approved} executed=${executed} failed=${failed}`
  );
}
