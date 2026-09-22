// github_issue_update executor — follows up on an issue in a listed repo: a
// comment, a close (completed / not planned) or reopen, labels added or
// removed. Side effect → runs only past the ✅ gate, from
// `agent/resolve-proposal.ts`.
//
// The model names the repo (optional), the issue and what to do. The Worker
// owns the rest: the repo is the resolver's entry, never the model's string;
// every comment ends with the footer naming the requester
// (`github-issue-render.ts`); a label must already exist on the repo, and the
// triage outcomes are refused whichever way they move — before anything is
// written, so a refused update leaves the issue exactly as it was.
//
// The writes run in the order a reader expects them: the comment first (so a
// closing comment is on the issue before it closes), then the labels, then the
// state. The first refusal stops the rest, and the result names what was
// already done.
//
// IT TAKES NAMED DEPENDENCIES — the resolver, a client per listed repo, the
// requester's name, whether the ask came from a DM, the thread permalink and
// the thread post — so `updateGithubIssue` is driven in
// `tests/github-issue-update.test.ts` with fakes, and `Env` enters only in
// `executeGithubIssueUpdate`, the binding at the foot of this file.

import type { Env, SlackContext } from "../types";
import { getPermalink, postMessage, usersInfo } from "../slack/api";
import {
  GithubRateLimitError,
  GithubRequestError,
  githubIssueUpdateClient,
  resolveRepoFor,
  type GithubIssueUpdateClient,
  type RepoEntry,
  type RepoResolution,
} from "../integrations/github";
import { renderCommentBody } from "./github-issue-render";
import {
  codeList,
  describeIssueUpdate,
  issueUpdateFromInput,
  sameLabel,
  stateWords,
  type IssueUpdate,
} from "./github-issue-update-render";

export interface GithubIssueUpdateDeps {
  /** The model's `repo` input, resolved against the repo list. */
  resolveRepo(requested: unknown): RepoResolution;
  /** The issue client on one listed repo. */
  github(target: RepoEntry): GithubIssueUpdateClient;
  /** The requester's display name, for the comment footer. */
  requesterName(): Promise<string>;
  /** Whether the request came from a DM — whose link stays off a public repo. */
  requestedInDm: boolean;
  /** The source thread's permalink, or null when Slack would not give one. */
  threadPermalink(): Promise<string | null>;
  /** Say what happened, in the thread the card was approved in. */
  postToThread(text: string): Promise<void>;
}

/**
 * Run the approved follow-up, and tell the thread.
 *
 * Never throws: a refusal — the Worker's or GitHub's — becomes `ok:false`
 * with the cause named.
 */
export async function updateGithubIssue(
  input: Record<string, unknown>,
  deps: GithubIssueUpdateDeps,
): Promise<string> {
  const read = issueUpdateFromInput(input);
  if (!read.ok) return refuse(deps, read.error);
  const update = read.update;

  const target = deps.resolveRepo(input.repo);
  if (!target.ok) return refuse(deps, target.error);
  const repo = target.entry.repo;
  const github = deps.github(target.entry);
  const ref = `${repo}#${update.issue}`;
  const issueUrl = `https://github.com/${repo}/issues/${update.issue}`;

  // Labels must already exist on the repo — a write that invents one would
  // create it — and are sent in the repo's own spelling.
  let addLabels: string[] = [];
  let removeLabels: string[] = [];
  if (update.addLabels.length || update.removeLabels.length) {
    let known: string[];
    try {
      known = await github.labels();
    } catch (err) {
      return refuse(deps, `couldn't read the labels on ${repo} — ${failureCause(err, ref, "read labels")}`);
    }
    const spelled = (l: string) => known.find((k) => sameLabel(k, l));
    const missing = [...update.addLabels, ...update.removeLabels].filter((l) => !spelled(l));
    if (missing.length) {
      return refuse(deps, `${codeList(missing)} ${missing.length === 1 ? "is not a label" : "are not labels"} on ${repo}`);
    }
    addLabels = update.addLabels.map((l) => spelled(l)!);
    removeLabels = update.removeLabels.map((l) => spelled(l)!);
  }

  const done: string[] = [];
  let commentUrl: string | null = null;
  const step = async (what: string, run: () => Promise<void>): Promise<string | null> => {
    try {
      await run();
      done.push(what);
      return null;
    } catch (err) {
      return failureCause(err, ref, what);
    }
  };

  const steps: Array<[string, () => Promise<void>]> = [];
  if (update.comment) {
    const text = update.comment;
    steps.push(["comment", async () => {
      const [requester, permalink] = await Promise.all([
        deps.requesterName(),
        // A DM's link is never fetched: the repo is public and a DM stays a DM.
        deps.requestedInDm ? null : deps.threadPermalink(),
      ]);
      commentUrl = (await github.comment(update.issue, renderCommentBody(text, { requester, permalink, dm: deps.requestedInDm }))).url;
    }]);
  }
  if (addLabels.length) steps.push([`add ${codeList(addLabels)}`, () => github.addLabels(update.issue, addLabels)]);
  for (const label of removeLabels) {
    steps.push([`remove \`${label}\``, () => github.removeLabel(update.issue, label)]);
  }
  if (update.state) {
    const { state, reason } = apiState(update.state);
    steps.push([stateWords(update.state), () => github.setState(update.issue, state, reason)]);
  }

  for (const [what, run] of steps) {
    const cause = await step(what, run);
    if (cause) {
      const pending = steps.slice(done.length).map(([w]) => w);
      const already = done.length ? ` Done before it stopped: ${pastTense(done)}.` : "";
      return refuse(deps, `${cause}.${already} Not done: ${pending.join(", ")}`, ref);
    }
  }

  const summary = describeIssueUpdate(update).join(" · ");
  await say(deps, `:white_check_mark: Updated <${issueUrl}|${ref}> — ${summary}.`);
  return JSON.stringify({
    ok: true,
    status: "updated",
    issue_url: issueUrl,
    ...(commentUrl ? { comment_url: commentUrl } : {}),
    message: `Updated GitHub issue ${ref} (${summary}): ${issueUrl}`,
  });
}

/** GitHub's state and state_reason for each change. */
function apiState(change: IssueUpdate["state"] & string): {
  state: "open" | "closed";
  reason: "completed" | "not_planned" | "reopened";
} {
  if (change === "open") return { state: "open", reason: "reopened" };
  return { state: "closed", reason: change === "closed_completed" ? "completed" : "not_planned" };
}

function pastTense(done: string[]): string {
  return done.map((d) => (d === "comment" ? "commented" : d)).join(", ");
}

/** Refused before or during the writes: the thread hears why, and the result
 *  says so where the model reads it next. */
async function refuse(deps: GithubIssueUpdateDeps, cause: string, ref?: string): Promise<string> {
  await say(deps, `:x: Couldn't update ${ref ?? "that GitHub issue"} — ${cause}.`);
  return JSON.stringify({ ok: false, status: "github_failed", error: cause });
}

/** Post to the thread, best-effort: the result JSON is the record either way. */
async function say(deps: GithubIssueUpdateDeps, text: string): Promise<void> {
  try {
    await deps.postToThread(text);
  } catch (err) {
    console.warn(`[github] thread post failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Why GitHub said no to one step, in words that name the fix. */
function failureCause(err: unknown, ref: string, what: string): string {
  if (err instanceof GithubRateLimitError) {
    return `the bot's GitHub rate limit is spent (${err.status}) — try again in a few minutes`;
  }
  if (!(err instanceof GithubRequestError)) {
    return err instanceof Error ? err.message : String(err);
  }
  const repo = ref.split("#")[0];
  switch (err.status) {
    case 401:
      return `GitHub rejected the bot's token (401) — it has expired or been revoked`;
    case 403:
      return `the bot's GitHub token lacks permission to ${what} on ${repo} (403 — it needs Issues: write), or the issue is locked`;
    case 404:
      return what.startsWith("remove")
        ? `GitHub answered 404 — ${what.slice("remove ".length)} is not on ${ref}`
        : `GitHub answered 404 for ${ref} — no such issue, or the bot's token cannot reach it`;
    case 410:
      return `${ref} was deleted, or issues are turned off on ${repo} (410)`;
    case 422:
      return `GitHub refused the ${what} on ${ref} as invalid (422)`;
    default:
      return `GitHub answered ${err.status} for ${ref}`;
  }
}

/**
 * The binding: `Env` and the thread, turned into the named dependencies.
 * @param env - Worker bindings
 * @param input - Tool args from the model — `repo`, `issue_number`, and any of
 *   `comment`, `state`, `add_labels`, `remove_labels`
 * @param slack - Thread context: where to post, and who asked
 */
export async function executeGithubIssueUpdate(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  return updateGithubIssue(input, {
    resolveRepo: (requested) => resolveRepoFor(env, requested),
    github: (target) => githubIssueUpdateClient(env, target),
    async requesterName() {
      if (!slack.requestedBy) return "a Slack teammate";
      const res = await usersInfo(env, slack.requestedBy).catch(() => null);
      const user = res?.ok ? res.user : undefined;
      return user?.profile?.display_name || user?.real_name || user?.name || "a Slack teammate";
    },
    // Slack's DM (im) conversation ids start with D.
    requestedInDm: slack.channel.startsWith("D"),
    async threadPermalink() {
      return getPermalink(env, slack.channel, slack.userMsgTs).catch(() => null);
    },
    async postToThread(text) {
      // Under the real ts the card was posted with, as the intake posts.
      await postMessage(env, { channel: slack.channel, thread_ts: slack.replyTs ?? slack.threadTs, text });
    },
  });
}
