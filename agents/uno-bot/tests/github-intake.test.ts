// A GitHub intake, from the draft on the card to the issue on the repo.
//
// Three seams, each driven across its own interface:
//
// - the RENDERER — the drafted body plus the footer the Worker adds, a pure
//   function, so the footer is asserted as text rather than trusted;
// - the EXECUTOR — `fileGithubIssue`, which takes its GitHub client, the
//   requester's name, the thread permalink and the thread post BY NAME, so a
//   fake client stands where GitHub would and the request it was handed is
//   the assertion: exactly the two triage labels, the footer, the permalink;
// - the GATE'S NOTE — the executor's result run through `runOperations` and
//   `batchOutcomeNote`, the path a won verdict takes in production, so "the
//   issue URL comes back" is asserted where the model will read it next turn.
//
// The integration's own request is `github-issue-client.test.ts`, over a
// stubbed fetch — a file of its own because the stub has to be installed
// before `net.ts` first evaluates. Nothing here reaches the real API.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  INTAKE_LABELS,
  issueDraftFromInput,
  renderIssueBody,
} from "../src/tools/github-issue-render";
import { fileGithubIssue, type GithubIssueDeps } from "../src/tools/github-issue";
import {
  GithubRequestError,
  type CreatedIssue,
  type GithubIssueClient,
  type NewIssue,
} from "../src/integrations/github";
import { batchOutcomeNote, runOperations } from "../src/gate/index";

// ── the fakes the executor takes by name ─────────────────────────────────────

const REPO = "BilLogic/plus-uno";
const PERMALINK = "https://plus.slack.com/archives/C1/p1700000000000190?thread_ts=1700000000.000100";

const DRAFT = {
  title: "uno-bot can't open a GitHub issue from Slack",
  body: [
    "**Problem.** Asked to track a gap on GitHub, uno-bot says it can't.",
    "",
    "**Expected.** It files the issue after a ✅.",
    "",
    "**Actual.** It offers a template to paste by hand.",
  ].join("\n"),
};

function fakeClient(answer: (issue: NewIssue) => CreatedIssue | Error): GithubIssueClient & {
  sent: NewIssue[];
} {
  const sent: NewIssue[] = [];
  return {
    repo: REPO,
    sent,
    async createIssue(issue) {
      sent.push(issue);
      const result = answer(issue);
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

function deps(github: GithubIssueClient, over: Partial<GithubIssueDeps> = {}) {
  const posted: string[] = [];
  const bound: GithubIssueDeps = {
    github,
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

const FILED: CreatedIssue = { number: 701, url: "https://github.com/BilLogic/plus-uno/issues/701" };

// ── the renderer ─────────────────────────────────────────────────────────────

test("the body carries the draft verbatim, then the footer naming the requester and the thread", () => {
  const body = renderIssueBody(DRAFT, { requester: "Bill Guo", permalink: PERMALINK });

  assert.ok(body.startsWith(DRAFT.body), body);
  assert.match(body, /Filed from Slack by uno-bot on behalf of Bill Guo/);
  assert.ok(body.includes(PERMALINK), body);
  // The footer sits BELOW the draft, set apart, so a reader can tell the
  // requester's words from the bot's.
  assert.ok(body.indexOf("Filed from Slack") > body.indexOf(DRAFT.body.split("\n").at(-1)!), body);
});

test("a thread with no permalink still names the requester, and says the link is missing", () => {
  const body = renderIssueBody(DRAFT, { requester: "Bill Guo", permalink: null });
  assert.match(body, /on behalf of Bill Guo/);
  assert.doesNotMatch(body, /https:\/\/[^\s]*slack\.com/);
  assert.match(body, /thread link unavailable/i);
});

test("a DM's footer says it came from a DM, and carries no link into it", () => {
  const body = renderIssueBody(DRAFT, { requester: "Bill Guo", permalink: null, dm: true });
  assert.match(body, /on behalf of Bill Guo/);
  assert.match(body, /filed from a DM/i);
  assert.doesNotMatch(body, /thread link unavailable/i);
  assert.doesNotMatch(body, /slack\.com/);
});

test("the draft is title and body only — anything else the model sent is not read", () => {
  const draft = issueDraftFromInput({
    title: "  a title  ",
    body: "a body",
    labels: ["ready-for-agent"],
    repo: "someone/else",
  });
  assert.deepEqual(draft, { title: "a title", body: "a body" });
});

// ── the executor, behind the gate ────────────────────────────────────────────

test("an approved intake is filed with exactly the two triage labels, the footer and the permalink", async () => {
  const github = fakeClient(() => FILED);
  const { deps: d } = deps(github);

  // The model tried to choose: a label that would skip triage, and another repo.
  await fileGithubIssue({ ...DRAFT, labels: ["ready-for-agent"], repo: "someone/else" }, d);

  assert.equal(github.sent.length, 1);
  const sent = github.sent[0]!;
  assert.equal(sent.title, DRAFT.title);
  assert.deepEqual([...sent.labels], ["harness-intake", "needs-triage"]);
  assert.deepEqual([...sent.labels], [...INTAKE_LABELS]);
  assert.ok(sent.body.startsWith(DRAFT.body), sent.body);
  assert.match(sent.body, /Filed from Slack by uno-bot on behalf of Bill Guo/);
  assert.ok(sent.body.includes(PERMALINK), sent.body);
});

test("the issue link is posted back in the thread and comes back in the gate's note", async () => {
  const github = fakeClient(() => FILED);
  const { deps: d, posted } = deps(github);

  // The path a won verdict takes: the batch runner, then the history note the
  // model reads on its next turn.
  const outcomes = await runOperations(
    [{ toolName: "github_issue_create", input: { ...DRAFT } }],
    (op) => fileGithubIssue(op.input, d),
  );

  assert.equal(outcomes[0]!.ok, true);
  const note = batchOutcomeNote(outcomes);
  assert.ok(note.includes(FILED.url), note);
  assert.doesNotMatch(note, /Notion/, "a GitHub issue is not a Notion link");
  assert.equal(posted.length, 1);
  assert.ok(posted[0]!.includes(FILED.url), String(posted[0]));
});

for (const [status, cause] of [
  [403, /permission/i],
  [404, /404/],
] as const) {
  test(`a ${status} from GitHub is a failure note naming the cause, with the draft kept for pasting`, async () => {
    const github = fakeClient(() => new GithubRequestError(status, `GitHub issues ${status}`));
    const { deps: d, posted } = deps(github);

    const outcomes = await runOperations(
      [{ toolName: "github_issue_create", input: { ...DRAFT } }],
      (op) => fileGithubIssue(op.input, d),
    );

    assert.equal(outcomes[0]!.ok, false);
    const note = batchOutcomeNote(outcomes);
    assert.match(note, /did NOT complete/);
    assert.match(note, cause);
    assert.ok(note.includes(REPO), note);

    // The person is told why, and handed the draft to file by hand.
    assert.equal(posted.length, 1);
    assert.match(posted[0]!, cause);
    assert.ok(posted[0]!.includes(DRAFT.title), String(posted[0]));
    assert.ok(posted[0]!.includes(DRAFT.body), String(posted[0]));
    const result = JSON.parse(outcomes[0]!.result) as { draft?: { title: string; body: string } };
    assert.deepEqual(result.draft, DRAFT);
  });
}

test("an intake asked for in a DM files without the DM's link, and says where it came from", async () => {
  const github = fakeClient(() => FILED);
  let asked = false;
  const { deps: d } = deps(github, {
    requestedInDm: true,
    threadPermalink: async () => {
      asked = true;
      return "https://plus.slack.com/archives/D0123/p1700000000000190";
    },
  });

  await fileGithubIssue({ ...DRAFT }, d);

  const sent = github.sent[0]!;
  assert.equal(asked, false, "a DM's permalink is never fetched for a public issue");
  assert.doesNotMatch(sent.body, /slack\.com/);
  assert.match(sent.body, /filed from a DM/i);
  assert.match(sent.body, /on behalf of Bill Guo/);
});

test("the pasteable draft survives a body that carries its own code fence", async () => {
  const body = "Repro:\n```js\nbot.file()\n```\nthen it refuses.";
  const github = fakeClient(() => new GithubRequestError(403, "GitHub issues 403"));
  const { deps: d, posted } = deps(github);

  await fileGithubIssue({ title: DRAFT.title, body }, d);

  // A fence longer than any backtick run inside, so the body's own ``` cannot
  // close the block early.
  assert.ok(posted[0]!.includes("````\n" + body + "\n````"), String(posted[0]));
});

test("a draft with no title or no body files nothing", async () => {
  for (const input of [{ body: DRAFT.body }, { title: DRAFT.title }, { title: " ", body: " " }]) {
    const github = fakeClient(() => FILED);
    const result = JSON.parse(await fileGithubIssue(input, deps(github).deps)) as { ok: boolean };
    assert.equal(result.ok, false, JSON.stringify(input));
    assert.equal(github.sent.length, 0, JSON.stringify(input));
  }
});
