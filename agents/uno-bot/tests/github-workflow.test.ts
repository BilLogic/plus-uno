// An allowed workflow run, from the check before the card to the dispatch
// behind the ✅.
//
// Two seams, each driven across its own interface:
//
// - PREFLIGHT — the substance check that runs before a card is staged: a
//   workflow off the repo's `workflows` list, or a repo off the bot's list, is
//   an ask naming what IS allowed, so nothing unlisted ever reaches a card;
// - the EXECUTOR — `runGithubWorkflow`, which takes its resolver, its client
//   and the thread post BY NAME, so a fake client stands where GitHub would
//   and the dispatch it was handed is the assertion. Its result goes through
//   `runOperations` and `batchOutcomeNote`, the path a won verdict takes.
//
// The request that would reach GitHub is `github-workflow-client.test.ts`,
// over a stubbed fetch. Nothing here reaches the real API.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import { preflight } from "../src/agent/preflight";
import { runGithubWorkflow, type GithubWorkflowDeps } from "../src/tools/github-workflow";
import { GithubRequestError, type GithubWorkflowClient } from "../src/integrations/github";
import { parseRepoList, resolveRepo, type RepoEntry } from "../src/integrations/repo-list.mjs";
import { batchOutcomeNote, runOperations } from "../src/gate/index";

const HARNESS = "BilLogic/plus-uno";
const SITE = "BilLogic/plus-marketing-website";
const BLUEPRINT = "BilLogic/plus-uno-blueprint";
const REPOS = JSON.stringify([
  { repo: HARNESS, purpose: "uno-bot and the harness", workflows: [] },
  { repo: SITE, purpose: "the public marketing site", workflows: ["sync-notion.yml"] },
  { repo: BLUEPRINT, purpose: "the service-blueprint app", workflows: ["render-walk.yml", "gates.yml"] },
]);
const LIST = parseRepoList(REPOS, HARNESS);

interface Dispatch {
  repo: string;
  workflow: string;
  ref: string;
}

function fakeClients(answer: () => Error | null = () => null) {
  const dispatched: Dispatch[] = [];
  const clientFor = (target: RepoEntry): GithubWorkflowClient => ({
    repo: target.repo,
    async defaultBranch() {
      return "trunk";
    },
    async dispatchWorkflow(workflow, ref) {
      dispatched.push({ repo: target.repo, workflow, ref });
      const err = answer();
      if (err) throw err;
    },
  });
  return { clientFor, dispatched };
}

function deps(clients: ReturnType<typeof fakeClients>) {
  const posted: string[] = [];
  const bound: GithubWorkflowDeps = {
    resolveRepo: (requested) => resolveRepo(LIST, requested),
    clientFor: clients.clientFor,
    postToThread: async (text) => {
      posted.push(text);
    },
  };
  return { deps: bound, posted };
}

const RUNS = (repo: string, file: string) => `https://github.com/${repo}/actions/workflows/${file}`;

// ── preflight: nothing unlisted is staged ─────────────────────────────────────

const ctx = { env: { GITHUB_REPO: HARNESS, GITHUB_REPOS: REPOS } as Env, prd: null };

test("a workflow off the repo's list is refused before staging, naming the ones allowed there", async () => {
  const ask = await preflight("github_workflow_run", { repo: BLUEPRINT, workflow: "live-schema.yml" }, ctx);
  assert.ok(ask, "an unlisted workflow must not reach a card");
  assert.match(ask.ask, /live-schema\.yml/);
  assert.match(ask.ask, /render-walk\.yml/);
  assert.match(ask.ask, /gates\.yml/);
});

test("a repo that lists no workflows says none may be run there", async () => {
  const ask = await preflight("github_workflow_run", { workflow: "uno-bot-deploy.yml" }, ctx);
  assert.ok(ask);
  assert.ok(ask.ask.includes(HARNESS), ask.ask);
  assert.match(ask.ask, /no workflow/i);
});

test("a repo off the bot's list is refused before staging, naming the list", async () => {
  const ask = await preflight("github_workflow_run", { repo: "someone/else", workflow: "gates.yml" }, ctx);
  assert.ok(ask);
  assert.match(ask.ask, /someone\/else/);
  assert.ok(ask.ask.includes(BLUEPRINT), ask.ask);
});

test("a listed workflow on a listed repo goes through to the card", async () => {
  assert.equal(await preflight("github_workflow_run", { repo: "plus-uno-blueprint", workflow: "render-walk.yml" }, ctx), null);
  assert.equal(await preflight("github_workflow_run", { repo: SITE, workflow: "sync-notion.yml" }, ctx), null);
});

// ── the executor, behind the Gate ────────────────────────────────────────────

test("an approved run dispatches the listed workflow on the listed repo's default branch", async () => {
  const clients = fakeClients();
  const { deps: d } = deps(clients);

  await runGithubWorkflow({ repo: "plus-uno-blueprint", workflow: "render-walk.yml" }, d);

  // The list's spelling of the repo, never the model's.
  assert.deepEqual(clients.dispatched, [{ repo: BLUEPRINT, workflow: "render-walk.yml", ref: "trunk" }]);
});

test("a ref the model sent anyway is ignored: a branch could carry another file under an allowed name", async () => {
  const clients = fakeClients();
  const { deps: d } = deps(clients);

  await runGithubWorkflow({ repo: SITE, workflow: "sync-notion.yml", ref: "evil-branch", inputs: { x: "y" } }, d);

  assert.deepEqual(clients.dispatched, [{ repo: SITE, workflow: "sync-notion.yml", ref: "trunk" }]);
});

test("the runs page comes back in the thread and in the gate's note", async () => {
  const clients = fakeClients();
  const { deps: d, posted } = deps(clients);

  const outcomes = await runOperations(
    [{ toolName: "github_workflow_run", input: { repo: SITE, workflow: "sync-notion.yml" } }],
    (op) => runGithubWorkflow(op.input, d),
  );

  assert.equal(outcomes[0]!.ok, true);
  const note = batchOutcomeNote(outcomes);
  assert.ok(note.includes(RUNS(SITE, "sync-notion.yml")), note);
  assert.doesNotMatch(note, /Notion link/, "a runs page is not a Notion link");
  assert.equal(posted.length, 1);
  assert.ok(posted[0]!.includes(RUNS(SITE, "sync-notion.yml")), String(posted[0]));
  assert.ok(posted[0]!.includes("trunk"), String(posted[0]));
});

for (const [label, input] of [
  ["an unlisted workflow", { repo: BLUEPRINT, workflow: "live-schema.yml" }],
  ["an unlisted repo", { repo: "someone/else", workflow: "gates.yml" }],
  ["a workflow on a repo that lists none", { workflow: "uno-bot-deploy.yml" }],
  ["no workflow", { repo: SITE }],
] as const) {
  test(`${label} is refused at execution too, and nothing is dispatched`, async () => {
    const clients = fakeClients();
    const { deps: d } = deps(clients);
    const result = JSON.parse(await runGithubWorkflow({ ...input }, d)) as { ok: boolean; error?: string };
    assert.equal(result.ok, false);
    assert.ok(result.error, "the refusal says why");
    assert.deepEqual(clients.dispatched, []);
  });
}

for (const [status, cause] of [
  [403, /Actions: Read and write/],
  [404, /404/],
  [422, /workflow_dispatch/],
] as const) {
  test(`a ${status} from GitHub is a failure note naming the cause`, async () => {
    const clients = fakeClients(() => new GithubRequestError(status, `GitHub dispatch ${status}`));
    const { deps: d, posted } = deps(clients);

    const outcomes = await runOperations(
      [{ toolName: "github_workflow_run", input: { repo: BLUEPRINT, workflow: "gates.yml" } }],
      (op) => runGithubWorkflow(op.input, d),
    );

    assert.equal(outcomes[0]!.ok, false);
    const note = batchOutcomeNote(outcomes);
    assert.match(note, /did NOT complete/);
    assert.match(note, cause);
    assert.ok(note.includes(BLUEPRINT), note);
    assert.equal(posted.length, 1);
    assert.match(posted[0]!, cause);
  });
}
