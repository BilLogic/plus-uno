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
// A RESULT TABLE (CONTEXT.md § result table): the post is a head line and a
// table of where, what and result, a row per operation, with what an
// operation created linked from its row. The grouped list is the message's
// text copy — notifications read it — and the whole post when Slack refuses
// the table or the batch has more operations than a table has rows.
//
// The model-facing counterpart stays in Gate: `batchOutcomeNote` is the
// history note, and it carries no emoji and no mrkdwn.

import type { OperationOutcome } from "../gate/index";
import { MAX_ROWS, type ResultRow, type ResultTable } from "../turn/result-table";
import { groupOperations, operationKindSummary } from "./proposal-render";
import { resultTableBlock } from "./result-table-block";

/** The longest failure reason a cell carries; the text copy has it whole. */
const REASON_CHARS = 200;

function headOf(outcomes: OperationOutcome[]): string {
  const failed = outcomes.filter((o) => !o.ok).length;
  return failed
    ? `:warning: Ran ${outcomes.length} operations — ${outcomes.length - failed} done, ${failed} failed:`
    : `:white_check_mark: Ran all ${outcomes.length} operations:`;
}

const planOf = (outcomes: OperationOutcome[]) => outcomes.map((o) => ({ toolName: o.toolName, input: o.input ?? {} }));

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
  const planned = planOf(outcomes);
  const lines: string[] = [];
  for (const group of groupOperations(planned)) {
    lines.push(group.heading);
    for (const i of group.members) {
      const o = outcomes[i]!;
      // In words: a sign on every row would put one per operation on the
      // message, and the head line already carries the one sign it needs.
      lines.push(`  ${i + 1}. *${operationKindSummary(planned[i]!)}* — ${o.ok ? "done" : "failed"}: ${o.message}`);
    }
  }
  return [headOf(outcomes), ...lines].join("\n");
}

/** The executor's own result, read for what a row needs. */
function resultOf(outcome: OperationOutcome): { url?: string; reason?: string } {
  try {
    const r = JSON.parse(outcome.result) as Record<string, unknown>;
    const url = [r.url, r.issue_url].find((u): u is string => typeof u === "string" && /^https?:\/\/\S+$/.test(u));
    const reason = [r.error, r.detail].find((e): e is string => typeof e === "string" && e.trim() !== "");
    return { ...(url ? { url } : {}), ...(reason ? { reason: reason.trim() } : {}) };
  } catch {
    return {};
  }
}

/** "done", or "failed" and why — the executor's own reason, else its line. */
function resultWords(outcome: OperationOutcome, reason: string | undefined): string {
  if (outcome.ok) return "done";
  const why = reason ?? outcome.message;
  return `failed: ${why.length > REASON_CHARS ? `${why.slice(0, REASON_CHARS - 1)}…` : why}`;
}

/**
 * The batch as a result table: where, what and result, a row per operation in
 * the card's grouping. Where links to the target the input named; what links
 * to the item the operation created, when its result carries the address.
 *
 * `null` for a single operation, as `batchResultMessage` is, and for a batch
 * longer than a table holds — every operation is a row, or there is no table.
 */
export function batchResultTable(outcomes: OperationOutcome[]): ResultTable | null {
  if (outcomes.length <= 1 || outcomes.length > MAX_ROWS) return null;
  const planned = planOf(outcomes);
  const rows: ResultRow[] = [];
  for (const group of groupOperations(planned)) {
    for (const i of group.members) {
      const o = outcomes[i]!;
      const what = operationKindSummary(planned[i]!);
      const { url, reason } = resultOf(o);
      const result = resultWords(o, reason);
      rows.push({
        cells: [group.name, what, result],
        links: [group.url, url, undefined],
        line: `${i + 1}. ${group.name} · ${what} · ${result}`,
        names: [],
        mentions: [],
      });
    }
  }
  const failed = outcomes.filter((o) => !o.ok).length;
  return {
    lookup: "batch",
    columns: [
      { label: "Where", numeric: false },
      { label: "What", numeric: false },
      { label: "Result", numeric: false },
    ],
    rows,
    caption: `${outcomes.length} operations: ${outcomes.length - failed} done, ${failed} failed`,
    total: outcomes.length,
    partial: false,
    labels: [],
  };
}

/**
 * The post itself: the grouped list as its text and, when the batch fits a
 * table, the head line and the table as its blocks. `null` for a single
 * operation.
 */
export function batchResultPost(
  outcomes: OperationOutcome[],
): { text: string; blocks?: Array<Record<string, unknown>> } | null {
  const text = batchResultMessage(outcomes);
  if (text === null) return null;
  const table = batchResultTable(outcomes);
  if (!table) return { text };
  const head = headOf(outcomes).replace(/:$/, "");
  return { text, blocks: [{ type: "section", text: { type: "mrkdwn", text: head } }, resultTableBlock(table)] };
}
