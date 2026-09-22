// github_issue_create executor — files a GitHub intake on the Worker's repo,
// then posts the issue link back in the thread. Side effect → runs only past
// the ✅ gate, from `agent/resolve-proposal.ts`.
//
// A direct REST create, not a third `repository_dispatch`: the two dispatch
// tools start Actions, this one writes one issue, so it stays its own named
// tool rather than the start of a generic `github_dispatch`.
//
// The model's input is a title and a body. Everything else is the Worker's:
// the repo (the repo list's default, `GITHUB_REPO`, resolved in the binding),
// the two triage labels and the
// footer naming the requester and the thread (`github-issue-render.ts`), added
// here so the model can neither choose a label nor leave the footer out.
//
// IT TAKES NAMED DEPENDENCIES — the GitHub client, the requester's name,
// whether the ask came from a DM, the thread permalink and the thread post — so `fileGithubIssue` is driven in
// `tests/github-intake.test.ts` with a fake client, and `Env` enters only in
// `executeGithubIssueCreate`, the binding at the foot of this file.

import type { Env, SlackContext } from "../types";
import { getPermalink, postMessage, usersInfo } from "../slack/api";
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
  /** Creates the issue on its one repo. */
  github: GithubIssueClient;
  /** The requester's display name, for the footer. */
  requesterName(): Promise<string>;
  /** Whether the request came from a DM — whose link stays out of a public
   *  issue. */
  requestedInDm: boolean;
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
    // A DM's link is never fetched: the issue is public and a DM stays a DM.
    const [requester, permalink] = await Promise.all([
      deps.requesterName(),
      deps.requestedInDm ? null : deps.threadPermalink(),
    ]);
    issue = await deps.github.createIssue({
      title: draft.title,
      body: renderIssueBody(draft, { requester, permalink, dm: deps.requestedInDm }),
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
    `:white_check_mark: Filed <${issue.url}|#${issue.number} ${draft.title}> on ${repo} — ` +
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
 * @param input - Tool args from the model — `title` and `body`
 * @param slack - Thread context: where to post, and who asked
 */
export async function executeGithubIssueCreate(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  // The default repo, through the same resolver as every GitHub tool — so a
  // misconfigured list refuses the filing rather than falling back to a repo.
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) return JSON.stringify({ ok: false, status: "github_failed", error: target.error });
  return fileGithubIssue(input, {
    github: githubIssueClient(env, target.entry),
    async requesterName() {
      if (!slack.requestedBy) return "a Slack teammate";
      const res = await usersInfo(env, slack.requestedBy).catch(() => null);
      const user = res?.ok ? res.user : undefined;
      return user?.profile?.display_name || user?.real_name || user?.name || "a Slack teammate";
    },
    // Slack's DM (im) conversation ids start with D.
    requestedInDm: slack.channel.startsWith("D"),
    async threadPermalink() {
      // The request message's own link opens the thread around it.
      return getPermalink(env, slack.channel, slack.userMsgTs).catch(() => null);
    },
    async postToThread(text) {
      // Under the real ts the card was posted with (`SlackContext.replyTs`) —
      // in a threadless DM the conversation key is not one Slack accepts.
      await postMessage(env, { channel: slack.channel, thread_ts: slack.replyTs ?? slack.threadTs, text });
    },
  });
}
