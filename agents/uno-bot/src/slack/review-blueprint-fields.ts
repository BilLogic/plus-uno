// Which rows of a blueprint revision a confirmer may edit in the Review
// pop-up: the text of every added and changed row, in step order, up to
// `MAX_EDITABLE_ROWS`. `review-fields.ts` takes these as the tool's row of
// its table, so every edit passes the same guards and rides Submit into the
// rows the Approve writes (`rows.<i>.content` in the operation's input).
//
// WHAT STAYS LOCKED. A row's step, lane and status are its place in the
// structure, so moving one is a redraft (Needs changes), never an edit: no
// field is offered for them, and a value the pop-up never offered is not read.
// A deprecated row's only edit is "keep it", which is Needs changes too. A
// proposal's rows are not inputs: they are `proposed`, cheap to change on the
// canvas, and the requester is in the conversation. A card staged before its
// facts rode the proposal offers nothing, and approves as staged.
//
// Past the cap, the rows are drawn as text, and Needs changes corrects them:
// every input stays on the view, and the view stays under Slack's 100 blocks.
//
// PURE: the card in, the fields out.
import type { FieldSpec } from "./review-fields";
import type { PendingProposal } from "../thread-state/index";

/** Rows a revision offers as inputs, at most. */
export const MAX_EDITABLE_ROWS = 20;

/** Said under the first row's input. */
export const ROW_HINT = "The cell's sentence of record. Step and lane are locked; Needs changes moves a row.";

/** The key a row's text is edited at, in the operation's input. */
export const rowPath = (row: number) => `rows.${row}.content`;

/**
 * A revision's editable rows: each added row's text, labelled by its lane,
 * and each changed row's, "Lane, new text", in the order its pop-up draws
 * them. None for a proposal, a retirement, or a card with no facts.
 *
 * @param _input - The operation's input; the rows are read off the facts
 * @param proposal - The card, whose facts say which rows are added or changed
 */
export function blueprintReviseFields(_input: Record<string, unknown>, proposal: PendingProposal): FieldSpec[] {
  const facts = proposal.facts?.kind === "blueprint_revision" ? proposal.facts : null;
  if (!facts || facts.retires) return [];
  const specs: FieldSpec[] = [];
  for (const step of facts.steps) {
    for (const row of step.added ?? []) specs.push({ path: rowPath(row.row), label: row.lane, kind: "text", required: true });
    for (const row of step.changed ?? []) specs.push({ path: rowPath(row.row), label: `${row.lane}, new text`, kind: "text", required: true });
  }
  return specs.slice(0, MAX_EDITABLE_ROWS).map((s, i) => (i === 0 ? { ...s, hint: ROW_HINT } : s));
}
