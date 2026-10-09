// ds_precedence_intake executor — a weekly DS precedence card's one operation,
// past its Review's Approve: the week's intake through its ThreadState filing,
// then `github_issue_create` or `github_issue_update`'s own executor, with the
// thread the card is in — and the same write for a Needs changes on the card,
// which is a dispute. What each decides is `ds-precedence/intake.ts` and
// `ds-precedence/dispute.ts`; this file only binds `Env`.

import type { Env, SlackContext } from "../types";
import { githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { threadStateFor } from "../thread-state/production";
import { proposalReplyThread, type PendingProposal } from "../thread-state/index";
import { postMessage, updateMessage } from "../slack/api";
import { addToWeeklyIntake, type IntakeDeps } from "../ds-precedence/intake";
import { disputePrecedenceItem } from "../ds-precedence/dispute";
import { executeGithubIssueCreate } from "./github-issue";
import { executeGithubIssueUpdate } from "./github-issue-update";
import { requesterName } from "./requester-name";

/**
 * The intake's dependencies on `Env`, for the thread `slack` names.
 *
 * @param env - Worker bindings
 * @param slack - The thread the card is in, and who the write is for
 */
export function weeklyIntakeDeps(env: Env, slack: SlackContext): IntakeDeps | { error: string } {
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return { error: target.error };
  const reads = githubLibraryReads(env, target.entry);
  const store = threadStateFor(env);
  return {
    filing: { claim: (key) => store.claimFiling(key), settle: (key, issue) => store.settleFiling(key, issue) },
    intakesSince: (since) => reads.intakesSince(since),
    create: (issue) => executeGithubIssueCreate(env, issue, slack),
    comment: (update) => executeGithubIssueUpdate(env, update, slack),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

/**
 * A Needs changes on a weekly card, on `Env`: the dispute written on the
 * week's intake (`ds-precedence/dispute.ts`), in the card's thread.
 *
 * @param env - Worker bindings
 * @param request - The card's proposal, the note and who sent it
 */
export async function disputeOnEnv(env: Env, request: { proposal: PendingProposal; note: string; userId: string }): Promise<void> {
  const { proposal, userId } = request;
  const thread = proposalReplyThread(proposal);
  const slack: SlackContext = { channel: proposal.channel, threadTs: proposal.threadTs, replyTs: thread, userMsgTs: proposal.userMsgTs, requestedBy: userId };
  const deps = weeklyIntakeDeps(env, slack);
  await disputePrecedenceItem(
    {
      store: threadStateFor(env),
      name: (id) => requesterName(env, { ...slack, requestedBy: id }),
      write: async (input) => ("error" in deps ? JSON.stringify({ ok: false, error: deps.error }) : addToWeeklyIntake(input, deps)),
      edit: async (ts, message) => {
        await updateMessage(env, { channel: proposal.channel, ts, text: message.text, blocks: message.blocks });
      },
      say: async (text) => {
        await postMessage(env, { channel: proposal.channel, thread_ts: thread, text });
      },
      now: () => Date.now(),
    },
    request,
  );
}

/**
 * Add the card's component to the week's intake.
 *
 * @param env - Worker bindings
 * @param input - The card's operation input
 * @param slack - The thread the card was approved in
 */
export async function executeDsPrecedenceIntake(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const deps = weeklyIntakeDeps(env, slack);
  if ("error" in deps) return JSON.stringify({ ok: false, error: deps.error });
  return addToWeeklyIntake(input, deps);
}
