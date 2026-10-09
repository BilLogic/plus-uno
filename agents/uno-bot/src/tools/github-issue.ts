// github_issue_create executor — files a GitHub intake on a repo from the
// Worker's repo list, then posts the issue link back in the thread. Side
// effect → runs only past the ✅ gate, from `agent/resolve-proposal.ts`.
//
// A direct REST create, not a third `repository_dispatch`: the two dispatch
// tools start Actions, this one writes one issue, so it stays its own named
// tool rather than the start of a generic `github_dispatch`.
//
// The model's input is a title, a body and, optionally, a repo. The repo
// reaches GitHub only as the entry the resolver returns (the default,
// `GITHUB_REPO`, when none is named), so one off the list is refused here and
// nothing is sent. Everything else is the Worker's: the two triage labels and
// the footer naming the requester and the thread (`github-issue-render.ts`),
// added here so the model can neither choose a label nor leave the footer out.
//
// IT TAKES NAMED DEPENDENCIES — the GitHub client, the requester's name,
// whether the ask came from a private place, the thread permalink and the thread post — so `fileGithubIssue` is driven in
// `tests/github-intake.test.ts` with a fake client, and `Env` enters only in
// `executeGithubIssueCreate`, the binding at the foot of this file.

import type { Env, SlackContext } from "../types";
import { conversationsInfo, getPermalink, postMessage } from "../slack/api";
import { requesterName } from "./requester-name";
import { escapeSlackText } from "../slack/mrkdwn";
import {
  GithubRequestError,
  githubIssueClient,
  resolveRepoFor,
  type CreatedIssue,
  type GithubIssueClient,
} from "../integrations/github";
import {
  INTAKE_LABELS,
  issueDraftFromInput,
  pasteableDraft,
  renderIssueBody,
} from "./github-issue-render";

export interface GithubIssueDeps {
  /** Creates the issue on the one resolved repo. */
  github: GithubIssueClient;
  /** The requester's display name, for the footer. */
  requesterName(): Promise<string>;
  /** Whether the request came from anywhere but a public channel — a private
   *  channel, a group DM or a DM — whose link stays out of a public issue.
   *  Answers true when it cannot tell. */
  requestedPrivately(): Promise<boolean>;
  /** The source thread's permalink, or null when Slack would not give one. */
  threadPermalink(): Promise<string | null>;
  /** Say what happened, in the thread the card was approved in. */
  postToThread(text: string): Promise<void>;
}

/**
 * File the approved draft, and tell the thread.
 *
 * Never throws: a refusal from GitHub becomes `ok:false` with the cause named,
 * and the thread gets the drafted title and body to file by hand — a request
 * that failed to file is still a request, and the draft is the work.
 */
export async function fileGithubIssue(
  input: Record<string, unknown>,
  deps: GithubIssueDeps,
): Promise<string> {
  const draft = issueDraftFromInput(input);
  if (!draft.title) return JSON.stringify({ ok: false, error: "missing 'title'" });
  if (!draft.body) return JSON.stringify({ ok: false, error: "missing 'body'" });

  const repo = deps.github.repo;
  let issue: CreatedIssue;
  try {
    // A private place's link is never fetched: the issue may be public, and a
    // private channel, a group DM or a DM stays where it is.
    const privatePlace = await deps.requestedPrivately();
    const [requester, permalink] = await Promise.all([
      deps.requesterName(),
      privatePlace ? null : deps.threadPermalink(),
    ]);
    issue = await deps.github.createIssue({
      title: draft.title,
      body: renderIssueBody(draft, { requester, permalink, privatePlace }),
      labels: INTAKE_LABELS,
    });
  } catch (err) {
    const cause = failureCause(err, repo);
    await say(
      deps,
      `:x: Couldn't file that GitHub issue — ${cause}. Here's the draft to file by hand:\n` +
        pasteableDraft(draft),
    );
    return JSON.stringify({ ok: false, status: "github_failed", error: cause, draft });
  }

  // Filed. A post that fails from here on must not read as a failed filing —
  // the issue exists, and the result says so either way.
  await say(
    deps,
    // The title is escaped inside the label: a `>` in it would end the link.
    `:white_check_mark: Filed <${issue.url}|#${issue.number} ${escapeSlackText(draft.title)}> on ${repo} — ` +
      `labelled \`${INTAKE_LABELS.join("` + `")}\`, so it's in the triage queue.`,
  );
  return JSON.stringify({
    ok: true,
    status: "filed",
    issue_number: issue.number,
    issue_url: issue.url,
    message: `Filed GitHub issue #${issue.number} on ${repo}: ${issue.url}`,
  });
}

/** Post to the thread, best-effort: the result JSON is the record either way. */
async function say(deps: GithubIssueDeps, text: string): Promise<void> {
  try {
    await deps.postToThread(text);
  } catch (err) {
    console.warn(`[github] thread post failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Why GitHub said no, in words that name the fix. */
function failureCause(err: unknown, repo: string): string {
  if (!(err instanceof GithubRequestError)) {
    return err instanceof Error ? err.message : String(err);
  }
  switch (err.status) {
    case 401:
      return `GitHub rejected the bot's token (401) — it has expired or been revoked`;
    case 403:
      return `the bot's GitHub token lacks permission to create issues on ${repo} (403 — it needs Issues: write)`;
    case 404:
      return `GitHub answered 404 for ${repo} — the bot's token cannot reach that repo's issues`;
    case 410:
      return `issues are turned off on ${repo} (410)`;
    default:
      // A 2xx lands here only when it named no issue; its message says so.
      return err.status < 300 ? err.message : `GitHub answered ${err.status} for ${repo}`;
  }
}

/**
 * The binding: `Env` and the thread, turned into the named dependencies.
 * @param env - Worker bindings
 * @param input - Tool args from the model — `title`, `body` and `repo`
 * @param slack - Thread context: where to post, and who asked
 */
export async function executeGithubIssueCreate(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  // The model's repo, through the same resolver as every GitHub tool — so an
  // unlisted repo or a misconfigured list refuses the filing rather than
  // falling back to a repo. Preflight refused it before staging; this is the
  // backstop for a card staged before the list changed.
  const target = resolveRepoFor(env, input.repo);
  if (!target.ok) return JSON.stringify({ ok: false, status: "github_failed", error: target.error });
  return fileGithubIssue(input, { github: githubIssueClient(env, target.entry), ...slackFilingDeps(env, slack) });
}

/** The Slack half of a GitHub write's dependencies — who asked, whether it was
 *  a DM, the thread's link, and the post back — shared by every executor that
 *  writes to GitHub on a requester's behalf. */
export type SlackFilingDeps = Pick<GithubIssueDeps, "requesterName" | "requestedPrivately" | "threadPermalink" | "postToThread">;

/**
 * Whether a conversation is anything but a public channel, by its kind — not
 * its id's first letter: a private channel's id starts with C like a public
 * one's. A DM's id is taken as it stands; anything else asks Slack, and a
 * conversation Slack will not describe is treated as private, since a public
 * issue can only link what it knows is public.
 *
 * @param env - Worker bindings
 * @param channel - The conversation id
 */
export async function isPrivateConversation(env: Env, channel: string): Promise<boolean> {
  if (channel.startsWith("D")) return true;
  const res = await conversationsInfo(env, channel).catch(() => null);
  if (!res?.ok || !res.channel) return true;
  return !!(res.channel.is_private || res.channel.is_im || res.channel.is_mpim);
}

/**
 * The binding for `SlackFilingDeps`: `Env` and the thread, turned into the four
 * named dependencies.
 * @param env - Worker bindings
 * @param slack - Thread context: where to post, and who asked
 */
export function slackFilingDeps(env: Env, slack: SlackContext): SlackFilingDeps {
  let privately: Promise<boolean> | undefined;
  return {
    requesterName: () => requesterName(env, slack),
    // By the conversation's kind, read once per filing.
    requestedPrivately: () => (privately ??= isPrivateConversation(env, slack.channel)),
    async threadPermalink() {
      // The request message's own link opens the thread around it.
      return getPermalink(env, slack.channel, slack.userMsgTs).catch(() => null);
    },
    async postToThread(text) {
      // Under the real ts the card was posted with (`SlackContext.replyTs`) —
      // in a threadless DM the conversation key is not one Slack accepts.
      await postMessage(env, { channel: slack.channel, thread_ts: slack.replyTs ?? slack.threadTs, text });
    },
  };
}
