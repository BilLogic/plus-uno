// What a `github_workflow_run` asks for, and whether it may be asked for at
// all — pure, so the check before the card (`agent/preflight.ts`) and the
// executor behind the ✅ (`github-workflow.ts`) read the input the same way and
// refuse with the same words.
//
// The allowlist is the repo list's: an entry's `workflows` names the files the
// bot may dispatch on that repo, so a workflow added to a repo is not
// bot-runnable until a PR adds it to `GITHUB_REPOS`.
//
// THE MODEL NAMES NO REF. A dispatched workflow runs as its file exists at the
// ref it is dispatched on, so a branch of the model's choosing could carry a
// different file under an allowed name — the allowlist would name a file and
// run another. Every run goes to the repo's default branch, which is the copy
// that was reviewed and merged.

import type { RepoEntry, RepoResolution } from "../integrations/repo-list.mjs";

/**
 * The workflow the tool input names, or why it names none. Reads `workflow`
 * and nothing else, so a `ref` or `inputs` the model sent anyway goes nowhere —
 * the schema refuses them too, but the executor does not rely on the schema.
 */
export function workflowFromInput(input: Record<string, unknown>): { ok: true; workflow: string } | { ok: false; error: string } {
  const workflow = typeof input.workflow === "string" ? input.workflow.trim() : "";
  return workflow
    ? { ok: true, workflow }
    : { ok: false, error: "missing 'workflow' — the workflow's file name, e.g. gates.yml" };
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
 * The whole check, before a card and again before a dispatch: the input names
 * a workflow, the repo is on the list, and the workflow is on that repo's list.
 */
export function checkWorkflowRun(
  input: Record<string, unknown>,
  resolution: RepoResolution,
): { ok: true; entry: RepoEntry; workflow: string } | { ok: false; error: string } {
  const named = workflowFromInput(input);
  if (!named.ok) return named;
  if (!resolution.ok) return resolution;
  const refusal = workflowRefusal(resolution.entry, named.workflow);
  if (refusal) return { ok: false, error: refusal };
  return { ok: true, entry: resolution.entry, workflow: named.workflow };
}

/** The workflow's runs page, which is where a dispatched run shows up. */
export function workflowRunsUrl(repo: string, workflow: string): string {
  return `https://github.com/${repo}/actions/workflows/${workflow}`;
}
