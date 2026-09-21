// The duplicate check before a GitHub intake: the search, and what the model
// reads back from it.
//
// `findOpenIntakes` takes its GitHub search BY NAME, so a fake stands where
// GitHub would and the search it was handed is the assertion: the label is the
// intake label, whatever the model sent, and a qualifier the model slipped into
// its keywords cannot widen the search to another repo, a closed issue or
// another label. The mapping is asserted where the model reads it — the JSON a
// tool result carries.
//
// The request the real search sends (repo, `is:open`, the label) is
// `github-issue-client.test.ts`, over a stubbed fetch, beside the create.
// Nothing here reaches the real API.
import { test } from "node:test";
import assert from "node:assert/strict";

import { findOpenIntakes, intakeSearchTerms } from "../src/tools/github-intake-search";
import {
  GithubRequestError,
  type GithubIssueSearch,
  type OpenIssue,
} from "../src/integrations/github";

const REPO = "BilLogic/plus-uno";

const SEEDED: OpenIssue = {
  number: 702,
  title: "uno-bot says it can't open GitHub issues",
  url: "https://github.com/BilLogic/plus-uno/issues/702",
  updated: "2026-09-21T18:40:00Z",
};

function fakeSearch(answer: () => OpenIssue[] | Error): GithubIssueSearch & {
  asked: Array<{ label: string; terms: string }>;
} {
  const asked: Array<{ label: string; terms: string }> = [];
  return {
    repo: REPO,
    asked,
    async searchOpenIssues(label, terms) {
      asked.push({ label, terms });
      const result = answer();
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

interface SearchResult {
  ok: boolean;
  repo?: string;
  count?: number;
  matches?: OpenIssue[];
  note?: string;
  error?: string;
}

async function run(input: Record<string, unknown>, github: GithubIssueSearch): Promise<SearchResult> {
  return JSON.parse(await findOpenIntakes(input, { github })) as SearchResult;
}

test("the search is for open intakes — the intake label, the model's keywords", async () => {
  const github = fakeSearch(() => []);
  await run({ keywords: "github issue refuses" }, github);

  assert.deepEqual(github.asked, [{ label: "harness-intake", terms: "github issue refuses" }]);
});

test("a likely duplicate comes back with its title and link, and the note offers the choice", async () => {
  const github = fakeSearch(() => [SEEDED]);
  const result = await run({ keywords: "github issue" }, github);

  assert.equal(result.ok, true);
  assert.equal(result.count, 1);
  assert.deepEqual(result.matches, [SEEDED]);
  // The model's next move, said where it reads it: name the match and let
  // the requester choose, rather than staging a card over it.
  assert.match(result.note!, /title and link/i);
  assert.match(result.note!, /file (?:a new one )?anyway/i);
  assert.match(result.note!, /github_issue_create/);
});

test("no match says so, and clears the way to stage the card", async () => {
  const result = await run({ keywords: "slack canvas timeout" }, fakeSearch(() => []));

  assert.equal(result.ok, true);
  assert.equal(result.count, 0);
  assert.deepEqual(result.matches, []);
  assert.match(result.note!, /no open intake/i);
  assert.match(result.note!, /github_issue_create/);
});

test("a qualifier in the keywords cannot aim the search elsewhere", () => {
  // The repo, the state and the label are the Worker's; only words pass.
  assert.equal(
    intakeSearchTerms('repo:someone/else is:closed label:ready-for-agent  "dm relay"   fails'),
    "dm relay fails",
  );
  assert.equal(intakeSearchTerms("  canvas   export  "), "canvas export");
});

test("keywords that are only qualifiers, or none, search nothing", async () => {
  for (const input of [{}, { keywords: " " }, { keywords: "is:closed repo:x/y" }]) {
    const github = fakeSearch(() => [SEEDED]);
    const result = await run(input, github);
    assert.equal(result.ok, false, JSON.stringify(input));
    assert.equal(github.asked.length, 0, JSON.stringify(input));
  }
});

test("a failed search is reported, and does not block filing", async () => {
  const github = fakeSearch(() => new GithubRequestError(403, "GitHub issue search 403"));
  const result = await run({ keywords: "github issue" }, github);

  assert.equal(result.ok, false);
  assert.match(result.error!, /403/);
  // The check is a courtesy to the tracker, not a gate on the request.
  assert.match(result.note!, /couldn't check/i);
  assert.match(result.note!, /github_issue_create/);
});
