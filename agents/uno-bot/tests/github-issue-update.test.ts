// A follow-up on a GitHub issue — a comment, a close or reopen, a label change —
// from the approved card to the calls that reach the repo.
//
// Three seams, each across its own interface:
//
// - the RENDERER — the staged input read into one update, and the comment the
//   Worker posts (the text, then the footer), pure;
// - the EXECUTOR — `updateGithubIssue`, which takes the resolver, a client per
//   listed repo, the requester's name, the DM flag, the permalink and the
//   thread post BY NAME, so a fake client stands where GitHub would and what
//   it was asked to do is the assertion;
// - the GATE'S NOTE — the executor's result through `runOperations` and
//   `batchOutcomeNote`, as a won verdict runs it.
//
// The client's own requests are `github-issue-client.test.ts`, over a stubbed
// fetch. Nothing here reaches the real API.
import { test } from "node:test";
import assert from "node:assert/strict";

import { TRIAGE_OUTCOME_LABELS, renderCommentBody } from "../src/tools/github-issue-render";
import { describeIssueUpdate, issueUpdateFromInput } from "../src/tools/github-issue-update-render";
import { updateGithubIssue, type GithubIssueUpdateDeps } from "../src/tools/github-issue-update";
import {
  GithubRequestError,
  type GithubIssueUpdateClient,
  type RepoEntry,
} from "../src/integrations/github";
import { parseRepoList, resolveRepo } from "../src/integrations/repo-list.mjs";
import { batchOutcomeNote, runOperations } from "../src/gate/index";

const UNO = "BilLogic/plus-uno";
const SITE = "BilLogic/plus-marketing-website";
const LIST = parseRepoList(
  JSON.stringify([
    { repo: UNO, purpose: "uno-bot and the harness", workflows: [] },
    { repo: SITE, purpose: "the public marketing site", workflows: [] },
  ]),
  UNO,
);
const PERMALINK = "https://plus.slack.com/archives/C1/p1700000000000190?thread_ts=1700000000.000100";
const REPO_LABELS = ["bug", "Enhancement", "harness-intake", "needs-triage", ...TRIAGE_OUTCOME_LABELS];

type Step =
  | { op: "comment"; issue: number; body: string }
  | { op: "state"; issue: number; state: string; reason: string }
  | { op: "add"; issue: number; labels: string[] }
  | { op: "remove"; issue: number; label: string };

/** A client per repo that records every write; `fail` names the step that
 *  throws, and with what. */
function fakeGithub(fail?: { op: Step["op"]; err: Error }) {
  const steps: Array<Step & { repo: string }> = [];
  const labelReads: string[] = [];
  const clientFor = (target: RepoEntry): GithubIssueUpdateClient => {
    const record = async (step: Step) => {
      if (fail?.op === step.op) throw fail.err;
      steps.push({ ...step, repo: target.repo });
    };
    return {
      repo: target.repo,
      async labels() {
        labelReads.push(target.repo);
        return REPO_LABELS;
      },
      async comment(issue, body) {
        await record({ op: "comment", issue, body });
        return { url: `https://github.com/${target.repo}/issues/${issue}#issuecomment-1` };
      },
      async setState(issue, state, reason) {
        await record({ op: "state", issue, state, reason });
      },
      async addLabels(issue, labels) {
        await record({ op: "add", issue, labels: [...labels] });
      },
      async removeLabel(issue, label) {
        await record({ op: "remove", issue, label });
      },
    };
  };
  return { steps, labelReads, clientFor };
}

function deps(github: ReturnType<typeof fakeGithub>, over: Partial<GithubIssueUpdateDeps> = {}) {
  const posted: string[] = [];
  const bound: GithubIssueUpdateDeps = {
    resolveRepo: (requested) => resolveRepo(LIST, requested),
    github: github.clientFor,
    requesterName: async () => "Bill Guo",
    requestedInDm: false,
    threadPermalink: async () => PERMALINK,
    postToThread: async (text) => {
      posted.push(text);
    },
    ...over,
  };
  return { deps: bound, posted };
}

const parse = (result: string) => JSON.parse(result) as { ok: boolean; error?: string; message?: string; issue_url?: string };

// ── the renderer ─────────────────────────────────────────────────────────────

test("a comment carries the text verbatim, then the footer naming the requester and the thread", () => {
  const body = renderCommentBody("Repro: open the card twice.", { requester: "Bill Guo", permalink: PERMALINK });
  assert.ok(body.startsWith("Repro: open the card twice.\n\n---\n"), body);
  assert.match(body, /Posted from Slack by uno-bot on behalf of Bill Guo\./);
  assert.ok(body.includes(PERMALINK), body);
});

test("a comment asked for in a DM says so and links nothing", () => {
  const body = renderCommentBody("x", { requester: "Bill Guo", permalink: null, dm: true });
  assert.match(body, /on behalf of Bill Guo, posted from a DM/);
  assert.doesNotMatch(body, /slack\.com|thread link/);
});

test("the input reads into one update; the issue number may carry a #", () => {
  const read = issueUpdateFromInput({
    issue_number: "#688",
    comment: "  done in r384  ",
    state: "closed_completed",
    add_labels: ["bug", "bug", " "],
  });
  assert.ok(read.ok);
  assert.deepEqual(read.update, {
    issue: 688,
    comment: "done in r384",
    state: "closed_completed",
    addLabels: ["bug"],
    removeLabels: [],
  });
  assert.deepEqual(describeIssueUpdate(read.update), ["comment", "add label `bug`", "close as completed"]);
});

test("an input with no operation, a bad number or a bad state is refused before anything runs", () => {
  for (const input of [
    { issue_number: 688 },
    { issue_number: 0, comment: "x" },
    { issue_number: "six", comment: "x" },
    { issue_number: 688, state: "closed" },
    { issue_number: 688, add_labels: "bug" },
    { issue_number: 688, add_labels: ["bug"], remove_labels: ["BUG"] },
  ]) {
    assert.equal(issueUpdateFromInput(input).ok, false, JSON.stringify(input));
  }
});

// ── the executor, behind the gate ────────────────────────────────────────────

test("an approved comment is posted with the footer, on the default repo", async () => {
  const github = fakeGithub();
  const { deps: d, posted } = deps(github);

  const result = parse(await updateGithubIssue({ issue_number: 688, comment: "Repro: open the card twice." }, d));

  assert.equal(result.ok, true, String(result.error));
  assert.equal(github.steps.length, 1);
  const step = github.steps[0]!;
  assert.equal(step.op, "comment");
  assert.equal(step.repo, UNO);
  assert.equal(step.issue, 688);
  const body = (step as { body: string }).body;
  assert.ok(body.startsWith("Repro: open the card twice."), body);
  assert.match(body, /Posted from Slack by uno-bot on behalf of Bill Guo/);
  assert.ok(body.includes(PERMALINK), body);
  // Nothing to label, so the repo's labels are never read.
  assert.deepEqual(github.labelReads, []);
  assert.equal(posted.length, 1);
  assert.ok(posted[0]!.includes(`${UNO}#688`), String(posted[0]));
});

test("a DM's comment carries no link into the DM, and its permalink is never fetched", async () => {
  const github = fakeGithub();
  let asked = false;
  const { deps: d } = deps(github, {
    requestedInDm: true,
    threadPermalink: async () => {
      asked = true;
      return "https://plus.slack.com/archives/D0123/p1";
    },
  });
  await updateGithubIssue({ issue_number: 688, comment: "x" }, d);
  const body = (github.steps[0] as { body: string }).body;
  assert.equal(asked, false);
  assert.doesNotMatch(body, /slack\.com/);
  assert.match(body, /posted from a DM/);
});

test("close carries its reason, after the comment that explains it", async () => {
  for (const [state, want] of [
    ["closed_completed", { state: "closed", reason: "completed" }],
    ["closed_not_planned", { state: "closed", reason: "not_planned" }],
    ["open", { state: "open", reason: "reopened" }],
  ] as const) {
    const github = fakeGithub();
    const { deps: d } = deps(github);
    const result = parse(await updateGithubIssue({ repo: SITE, issue_number: 12, comment: "why", state }, d));
    assert.equal(result.ok, true, String(result.error));
    assert.deepEqual(
      github.steps.map((s) => s.op),
      ["comment", "state"],
      "the closing comment lands before the close",
    );
    const close = github.steps[1] as { state: string; reason: string; repo: string };
    assert.deepEqual({ state: close.state, reason: close.reason }, want);
    assert.equal(close.repo, SITE);
  }
});

test("labels are added and removed in the repo's own spelling", async () => {
  const github = fakeGithub();
  const { deps: d } = deps(github);
  const result = parse(
    await updateGithubIssue({ issue_number: 688, add_labels: ["enhancement"], remove_labels: ["bug"] }, d),
  );
  assert.equal(result.ok, true, String(result.error));
  assert.deepEqual(
    github.steps.map(({ repo: _repo, ...s }) => s),
    [
      { op: "add", issue: 688, labels: ["Enhancement"] },
      { op: "remove", issue: 688, label: "bug" },
    ],
  );
});

test("a triage outcome is refused whichever way it moves, and nothing is written", async () => {
  for (const input of [
    { issue_number: 688, comment: "ready now", add_labels: ["ready-for-agent"] },
    { issue_number: 688, remove_labels: ["Wontfix"] },
    { issue_number: 688, add_labels: ["bug", "ready-for-human"] },
  ]) {
    const github = fakeGithub();
    const { deps: d, posted } = deps(github);
    const result = parse(await updateGithubIssue(input, d));
    assert.equal(result.ok, false, JSON.stringify(input));
    assert.match(result.error!, /triage/i);
    assert.deepEqual(github.steps, [], "not even the comment");
    assert.equal(posted.length, 1);
    assert.match(posted[0]!, /triage/i);
  }
});

test("a label the repo does not have is refused by name, and nothing is written", async () => {
  const github = fakeGithub();
  const { deps: d } = deps(github);
  const result = parse(await updateGithubIssue({ issue_number: 688, comment: "x", add_labels: ["bug", "p0"] }, d));
  assert.equal(result.ok, false);
  assert.match(result.error!, /`p0`/);
  assert.match(result.error!, new RegExp(UNO));
  assert.deepEqual(github.steps, []);
});

test("an unlisted repo is refused with the list named, and no client is made", async () => {
  const github = fakeGithub();
  let made = 0;
  const { deps: d } = deps(github, {
    github: (t) => {
      made++;
      return github.clientFor(t);
    },
  });
  const result = parse(await updateGithubIssue({ repo: "someone/else", issue_number: 1, comment: "x" }, d));
  assert.equal(result.ok, false);
  assert.match(result.error!, /not on the bot's repo list/);
  assert.ok(result.error!.includes(SITE), String(result.error));
  assert.equal(made, 0);
});

for (const [status, cause] of [
  [403, /permission.*403/i],
  [404, /404.*#688/],
  [422, /422/],
] as const) {
  test(`a ${status} from GitHub is a failure note naming the cause`, async () => {
    const github = fakeGithub({ op: "comment", err: new GithubRequestError(status, `GitHub ${status}`) });
    const { deps: d, posted } = deps(github);
    const outcomes = await runOperations(
      [{ toolName: "github_issue_update", input: { issue_number: 688, comment: "x", state: "closed_completed" } }],
      (op) => updateGithubIssue(op.input, d),
    );
    assert.equal(outcomes[0]!.ok, false);
    const note = batchOutcomeNote(outcomes);
    assert.match(note, /did NOT complete/);
    assert.match(note, cause);
    assert.ok(note.includes(UNO), note);
    assert.deepEqual(github.steps, [], "the close does not run after the comment failed");
    assert.equal(posted.length, 1);
    assert.match(posted[0]!, cause);
  });
}

test("a failure part-way names what was done before it stopped", async () => {
  const github = fakeGithub({ op: "state", err: new GithubRequestError(403, "GitHub 403") });
  const { deps: d } = deps(github);
  const result = parse(await updateGithubIssue({ issue_number: 688, comment: "x", state: "closed_not_planned" }, d));
  assert.equal(result.ok, false);
  assert.match(result.error!, /commented/);
  assert.match(result.error!, /close as not planned/);
});

test("the issue link comes back in the gate's note", async () => {
  const github = fakeGithub();
  const { deps: d } = deps(github);
  const outcomes = await runOperations(
    [{ toolName: "github_issue_update", input: { issue_number: 688, state: "open" } }],
    (op) => updateGithubIssue(op.input, d),
  );
  assert.equal(outcomes[0]!.ok, true);
  const note = batchOutcomeNote(outcomes);
  assert.ok(note.includes(`https://github.com/${UNO}/issues/688`), note);
  assert.match(note, /reopen/);
  assert.doesNotMatch(note, /Notion/);
});
