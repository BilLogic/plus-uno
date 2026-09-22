// What a `github_workflow_run` asks for, and whether it may be asked for at
// all — pure, so the check before the card (`agent/preflight.ts`) and the
// executor behind the ✅ (`github-workflow.ts`) read the input the same way and
// refuse with the same words.
//
// The allowlist is the repo list's: an entry's `workflows` names the files the
// bot may dispatch on that repo, so a workflow added to a repo is not
// bot-runnable until a PR adds it to `GITHUB_REPOS`.

import type { RepoEntry, RepoResolution } from "../integrations/repo-list.mjs";

/** The model's half of a run: which workflow, at which ref, with which inputs. */
export interface WorkflowRunRequest {
  /** The workflow's file name under `.github/workflows/`. */
  workflow: string;
  /** The ref to run at, or "" for the repo's default branch. */
  ref: string;
  /** `workflow_dispatch` inputs, verbatim. */
  inputs: Record<string, string>;
}

/**
 * The run as the tool input carries it, or why it cannot be one.
 *
 * Inputs are string key/values and pass through untouched — GitHub reads every
 * `workflow_dispatch` input as a string, and the card shows exactly what is
 * sent, so nothing here trims or coerces them.
 */
export function workflowRunFromInput(
  input: Record<string, unknown>,
): { ok: true; run: WorkflowRunRequest } | { ok: false; error: string } {
  const workflow = typeof input.workflow === "string" ? input.workflow.trim() : "";
  if (!workflow) return { ok: false, error: "missing 'workflow' — the workflow's file name, e.g. gates.yml" };
  const ref = typeof input.ref === "string" ? input.ref.trim() : "";
  const raw = input.inputs ?? {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "'inputs' must be string key/values" };
  }
  const inputs: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string") {
      return { ok: false, error: `'inputs' must be string key/values; '${key}' is not a string` };
    }
    inputs[key] = value;
  }
  return { ok: true, run: { workflow, ref, inputs } };
}

/**
 * Why `workflow` may not be run on `entry`, naming what may — or null when it
 * is on the entry's list. The match is exact: a workflow file name is
 * case-sensitive on GitHub, and the list's spelling is the one dispatched.
 */
export function workflowRefusal(entry: RepoEntry, workflow: string): string | null {
  if (entry.workflows.includes(workflow)) return null;
  if (entry.workflows.length === 0) {
    return `No workflow may be run from Slack on ${entry.repo}, so I can't run ${workflow} there.`;
  }
  return (
    `${workflow} is not a workflow I may run on ${entry.repo}. ` +
    `Allowed there: ${entry.workflows.join(", ")}.`
  );
}

/**
 * The whole check, before a card and again before a dispatch: the input reads
 * as a run, the repo is on the list, and the workflow is on that repo's list.
 */
export function checkWorkflowRun(
  input: Record<string, unknown>,
  resolution: RepoResolution,
): { ok: true; entry: RepoEntry; run: WorkflowRunRequest } | { ok: false; error: string } {
  const parsed = workflowRunFromInput(input);
  if (!parsed.ok) return parsed;
  if (!resolution.ok) return resolution;
  const refusal = workflowRefusal(resolution.entry, parsed.run.workflow);
  if (refusal) return { ok: false, error: refusal };
  return { ok: true, entry: resolution.entry, run: parsed.run };
}

/** The workflow's runs page, which is where a dispatched run shows up. */
export function workflowRunsUrl(repo: string, workflow: string): string {
  return `https://github.com/${repo}/actions/workflows/${workflow}`;
}
