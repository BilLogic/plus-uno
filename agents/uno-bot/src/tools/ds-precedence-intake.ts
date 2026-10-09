// ds_precedence_intake executor — a weekly DS precedence card's one operation,
// past its Review's Approve: the week's intake found among the open ones on
// the harness repo, then `github_issue_create` or `github_issue_update`'s own
// executor, with the thread the card is in. What it decides is
// `ds-precedence/intake.ts`; this file only binds `Env`.

import type { Env, SlackContext } from "../types";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { addToWeeklyIntake } from "../ds-precedence/intake";
import { executeGithubIssueCreate } from "./github-issue";
import { executeGithubIssueUpdate } from "./github-issue-update";

/**
 * Add the card's component to the week's intake.
 *
 * @param env - Worker bindings
 * @param input - The card's operation input
 * @param slack - The thread the card was approved in
 */
export async function executeDsPrecedenceIntake(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return JSON.stringify({ ok: false, error: target.error });
  const reads = githubLibraryReads(env, target.entry);
  return addToWeeklyIntake(input, {
    openIntakes: () => reads.openIntakes(),
    create: (issue) => executeGithubIssueCreate(env, issue, slack),
    comment: (update) => executeGithubIssueUpdate(env, update, slack),
  });
}
