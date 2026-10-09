// `ds_precedence_intake` — the one operation a weekly DS precedence card runs,
// past its Review's Approve. A `worker` tool: only the morning post stages it
// (`./jobs.ts`), and the model is never offered it.
//
// WHERE IT WRITES IS DECIDED NOW, not when the card posted. It reads the open
// `harness-intake` issues for the week's marker (`precedenceMarker`): none
// open, it files the week's intake with this component's section; one open,
// it comments the section on it. So the first Approve of the week files the
// intake and each later one adds to it, whichever card is approved first.
// Two Approves landing within the same second could each find none open and
// file two; the window is one GitHub round trip, and a person reading the
// second closes it as a duplicate.
//
// The writes themselves are `github_issue_create` and `github_issue_update`'s
// own executors — the triage labels, the footer and the thread's one line all
// stay theirs — bound in `tools/ds-precedence-intake.ts`.
//
// Pure: every dependency arrives by name.

import { intakeBody, precedenceIntakeTitle, precedenceMarker } from "./report";

export interface IntakeDeps {
  /** The open `harness-intake` issues, each with its body. */
  openIntakes(): Promise<Array<{ number: number; url: string; body: string }>>;
  /** File an intake: `github_issue_create`'s executor, its JSON result. */
  create(input: { title: string; body: string }): Promise<string>;
  /** Comment on an issue: `github_issue_update`'s executor, its JSON result. */
  comment(input: { issue_number: number; comment: string }): Promise<string>;
}

/**
 * Add one component to the week's intake, filing it when the week has none.
 *
 * Never throws: a bad input or a failed read is `ok:false` with the cause.
 *
 * @param input - `week_of`, `component` and `section`, as the card staged them
 * @param deps - The intake reads and the two GitHub writes
 */
export async function addToWeeklyIntake(input: Record<string, unknown>, deps: IntakeDeps): Promise<string> {
  const weekOf = typeof input.week_of === "string" ? input.week_of : "";
  const section = typeof input.section === "string" ? input.section.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) return JSON.stringify({ ok: false, error: "missing 'week_of'" });
  if (!section) return JSON.stringify({ ok: false, error: "missing 'section'" });

  let open: { number: number } | undefined;
  try {
    const marker = precedenceMarker(weekOf);
    open = (await deps.openIntakes()).find((i) => i.body.includes(marker));
  } catch (err) {
    // Filing blind could make a second intake beside the week's open one.
    const cause = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ ok: false, error: `couldn't read the open intakes, so nothing was filed: ${cause}` });
  }
  if (open) return deps.comment({ issue_number: open.number, comment: section });
  return deps.create({ title: precedenceIntakeTitle(weekOf), body: intakeBody(weekOf, section) });
}
