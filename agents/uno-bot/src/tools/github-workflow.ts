// github_workflow_run executor — starts an allowed workflow on a listed repo,
// then posts that workflow's runs page back in the thread. Side effect → runs
// only past the ✅ gate, from `agent/resolve-proposal.ts`.
//
// The generic dispatch the two named Actions tools deferred until a third
// Action appeared. `component_implement` and `prototype_scaffold` stay as they
// are: they carry structured payloads (a PRD, a Figma frame, the transcript).
//
// What may run is the repo list's, not the model's: the repo resolves through
// the one resolver, and the workflow must be on that entry's `workflows`
// (`github-workflow-render.ts`). Preflight refuses anything else before a card
// is staged; this checks again, because the executor does not rely on it.
//
// IT TAKES NAMED DEPENDENCIES — the resolver, a client per resolved repo and
// the thread post — so `runGithubWorkflow` is driven in
// `tests/github-workflow.test.ts` with fakes, and `Env` enters only in
// `executeGithubWorkflowRun`, the binding at the foot of this file.

import type { Env, SlackContext } from "../types";
import { slackFilingDeps } from "./github-issue";
import {
  GithubRequestError,
  githubWorkflowClient,
  resolveRepoFor,
  type GithubWorkflowClient,
  type RepoEntry,
  type RepoResolution,
} from "../integrations/github";
import { checkWorkflowRun, workflowRunsUrl } from "./github-workflow-render";

export interface GithubWorkflowDeps {
  /** The model's `repo`, resolved against the bot's repo list. */
  resolveRepo(requested: unknown): RepoResolution;
  /** The dispatch client on one resolved repo. */
  clientFor(target: RepoEntry): GithubWorkflowClient;
  /** Say what happened, in the thread the card was approved in. */
  postToThread(text: string): Promise<void>;
}

/**
 * Start the approved run, and tell the thread where to follow it.
 *
 * Never throws: a refusal — the Worker's or GitHub's — becomes `ok:false`
 * with the cause named.
 */
export async function runGithubWorkflow(
  input: Record<string, unknown>,
  deps: GithubWorkflowDeps,
): Promise<string> {
  const checked = checkWorkflowRun(input, deps.resolveRepo(input.repo));
  if (!checked.ok) return JSON.stringify({ ok: false, status: "refused", error: checked.error });

  const { entry, workflow } = checked;
  const repo = entry.repo;
  const runs = workflowRunsUrl(repo, workflow);
  const github = deps.clientFor(entry);
  let ref: string;
  try {
    // Always the default branch: the reviewed copy of the allowed file.
    ref = await github.defaultBranch();
    await github.dispatchWorkflow(workflow, ref);
  } catch (err) {
    const cause = failureCause(err, repo, workflow);
    await say(deps, `:x: Couldn't start \`${workflow}\` on ${repo} — ${cause}.`);
    return JSON.stringify({ ok: false, status: "github_failed", error: cause });
  }

  await say(
    deps,
    `:white_check_mark: Started \`${workflow}\` on ${repo} at \`${ref}\` — ` +
      `follow it on <${runs}|its runs page>.`,
  );
  return JSON.stringify({
    ok: true,
    status: "dispatched",
    runs_url: runs,
    message: `Started ${workflow} on ${repo} at ${ref}; its runs: ${runs}`,
  });
}

/** Post to the thread, best-effort: the result JSON is the record either way. */
async function say(deps: GithubWorkflowDeps, text: string): Promise<void> {
  try {
    await deps.postToThread(text);
  } catch (err) {
    console.warn(`[github] thread post failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Why GitHub said no, in words that name the fix. */
function failureCause(err: unknown, repo: string, workflow: string): string {
  if (!(err instanceof GithubRequestError)) {
    return err instanceof Error ? err.message : String(err);
  }
  switch (err.status) {
    case 401:
      return `GitHub rejected the bot's token (401) — it has expired or been revoked`;
    case 403:
      return `the bot's GitHub token lacks permission to run workflows on ${repo} (403 — it needs Actions: Read and write)`;
    case 404:
      return `GitHub answered 404 for ${workflow} on ${repo} — the workflow is not on the default branch, or the token cannot see the repo's Actions`;
    case 422:
      return `GitHub refused the run on ${repo} (422) — ${workflow} has no workflow_dispatch trigger on the default branch`;
    default:
      // A 2xx lands here only from the default-branch read naming no branch.
      return err.status < 300 ? err.message : `GitHub answered ${err.status} for ${workflow} on ${repo}`;
  }
}

/**
 * The binding: `Env` and the thread, turned into the named dependencies.
 * @param env - Worker bindings
 * @param input - Tool args from the model — `repo` and `workflow`
 * @param slack - Thread context: where to post
 */
export async function executeGithubWorkflowRun(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  return runGithubWorkflow(input, {
    resolveRepo: (requested) => resolveRepoFor(env, requested),
    clientFor: (target) => githubWorkflowClient(env, target),
    // The post back, under the real ts the card was posted with — the same
    // Slack binding every GitHub write uses.
    postToThread: slackFilingDeps(env, slack).postToThread,
  });
}
