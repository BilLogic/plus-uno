// What a `github_issue_update` asks for, read out of the staged input — and the
// words the card and the thread use for it.
//
// Pure, and apart from the executor, so the card (`turn/turn.ts`) and the
// executor (`github-issue-update.ts`) read the same input the same way: what a
// person approves is exactly what runs.

import { TRIAGE_OUTCOME_LABELS } from "./github-issue-render";

/** The state an update leaves the issue in — close with GitHub's reason, or
 *  reopen. */
export type IssueStateChange = "closed_completed" | "closed_not_planned" | "open";

const STATE_CHANGES: readonly IssueStateChange[] = ["closed_completed", "closed_not_planned", "open"];

/** One issue follow-up: any of a comment, a state change and label changes. */
export interface IssueUpdate {
  issue: number;
  comment: string | null;
  state: IssueStateChange | null;
  addLabels: string[];
  removeLabels: string[];
}

export type IssueUpdateRead = { ok: true; update: IssueUpdate } | { ok: false; error: string };

/**
 * The staged input as one update, or why it is not one.
 *
 * Refuses a triage outcome in either label list here, before any client
 * exists — so the refusal is the same on the card's reading and the
 * executor's. `repo` is not read: the resolver owns it.
 */
export function issueUpdateFromInput(input: Record<string, unknown>): IssueUpdateRead {
  const issue = issueNumberOf(input.issue_number);
  if (issue === null) return { ok: false, error: "'issue_number' must be an issue number, e.g. 688" };

  const comment = typeof input.comment === "string" && input.comment.trim() ? input.comment.trim() : null;

  let state: IssueStateChange | null = null;
  if (input.state !== undefined && input.state !== null && input.state !== "") {
    if (!STATE_CHANGES.includes(input.state as IssueStateChange)) {
      return { ok: false, error: `'state' must be one of ${STATE_CHANGES.join(", ")}` };
    }
    state = input.state as IssueStateChange;
  }

  const addLabels = labelsOf(input.add_labels);
  const removeLabels = labelsOf(input.remove_labels);
  if (addLabels === null) return { ok: false, error: "'add_labels' must be a list of label names" };
  if (removeLabels === null) return { ok: false, error: "'remove_labels' must be a list of label names" };

  const both = addLabels.filter((l) => removeLabels.some((r) => sameLabel(l, r)));
  if (both.length) return { ok: false, error: `${codeList(both)} is both added and removed` };

  const triage = [...addLabels, ...removeLabels].filter(isTriageOutcome);
  if (triage.length) {
    return {
      ok: false,
      error:
        `${codeList(triage)} is a triage outcome, and triage outcomes stay a maintainer's decision — ` +
        "I can't apply or remove them",
    };
  }

  if (!comment && !state && !addLabels.length && !removeLabels.length) {
    return { ok: false, error: "nothing to do — give a comment, a state or a label change" };
  }
  return { ok: true, update: { issue, comment, state, addLabels, removeLabels } };
}

/** Each operation of an update, in the order it runs, as a person reads it. */
export function describeIssueUpdate(update: IssueUpdate): string[] {
  const steps: string[] = [];
  if (update.comment) steps.push("comment");
  if (update.addLabels.length) steps.push(labelStep("add", update.addLabels));
  if (update.removeLabels.length) steps.push(labelStep("remove", update.removeLabels));
  if (update.state) steps.push(stateWords(update.state));
  return steps;
}

/** A label change as a step: "add label `bug`", "remove labels `a`, `b`". */
export function labelStep(verb: "add" | "remove", labels: readonly string[]): string {
  return `${verb} ${plural("label", labels)} ${codeList(labels)}`;
}

/** A step once it has run, for the thread: "comment" → "commented", "add
 *  label `bug`" → "added label `bug`", "close as completed" → "closed as
 *  completed". The success line and a part-way failure both say it this way. */
export function pastTense(step: string): string {
  if (step === "comment") return "commented";
  return step.replace(/^(add|remove|reopen|close)\b/, (verb) => (verb.endsWith("e") ? `${verb}d` : `${verb}ed`));
}

export function stateWords(state: IssueStateChange): string {
  return state === "open" ? "reopen" : state === "closed_completed" ? "close as completed" : "close as not planned";
}

/** GitHub matches label names without regard to case. */
export function sameLabel(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function isTriageOutcome(label: string): boolean {
  return TRIAGE_OUTCOME_LABELS.some((t) => sameLabel(t, label));
}

export function codeList(labels: readonly string[]): string {
  return labels.map((l) => `\`${l}\``).join(", ");
}

function plural(word: string, items: readonly unknown[]): string {
  return items.length === 1 ? word : `${word}s`;
}

function issueNumberOf(raw: unknown): number | null {
  const n =
    typeof raw === "number" ? raw : typeof raw === "string" && /^#?\d+$/.test(raw.trim()) ? Number(raw.trim().replace("#", "")) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** A label list, trimmed and deduplicated; absent is empty, anything else
 *  but a list of strings is null. */
function labelsOf(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.some((l) => typeof l !== "string")) return null;
  const out: string[] = [];
  for (const l of raw as string[]) {
    const name = l.trim();
    if (name && !out.some((o) => sameLabel(o, name))) out.push(name);
  }
  return out;
}
