// github_read on the repo list: what the model's `repo` reaches, and what it
// reads back.
//
// `readGithub` takes its resolver and its reader BY NAME, so fakes stand where
// GitHub would and the repo each read was handed is the assertion. The
// requests the real reader sends are `github-issue-client.test.ts`, over a
// stubbed fetch. Nothing here reaches the real API.
import { test } from "node:test";
import assert from "node:assert/strict";

import { readGithub, type GithubReadDeps } from "../src/tools/github-read";
import { parseRepoList, resolveRepo } from "../src/integrations/repo-list.mjs";

const UNO = "BilLogic/plus-uno";
const SITE = "BilLogic/plus-marketing-website";
const LIST = parseRepoList(
  JSON.stringify([
    { repo: UNO, purpose: "uno-bot and the harness", workflows: [] },
    { repo: SITE, purpose: "the public marketing site", workflows: [] },
  ]),
  UNO,
);

interface Result {
  ok: boolean;
  repo?: string;
  path?: string;
  kind?: string;
  content?: string;
  hits?: unknown[];
  error?: string;
  note?: string;
}

function fakes(): GithubReadDeps & { reads: string[]; searches: string[] } {
  const reads: string[] = [];
  const searches: string[] = [];
  return {
    reads,
    searches,
    resolveRepo: (requested) => resolveRepo(LIST, requested),
    async readPath(target, path) {
      reads.push(`${target.repo}:${path}`);
      return { path, kind: "file", text: '{"name":"site"}', truncated: false };
    },
    async searchCode(target, query) {
      searches.push(`${target.repo}:${query}`);
      return [{ path: "src/hero.astro", url: `https://github.com/${target.repo}/blob/main/src/hero.astro` }];
    },
  };
}

async function run(input: Record<string, unknown>, deps: GithubReadDeps): Promise<Result> {
  return JSON.parse(await readGithub(input, deps)) as Result;
}

test("a listed repo's file is read there, and the result names the repo", async () => {
  const deps = fakes();
  const result = await run({ path: "package.json", repo: SITE }, deps);

  assert.deepEqual(deps.reads, [`${SITE}:package.json`]);
  assert.equal(result.ok, true);
  assert.equal(result.repo, SITE);
  assert.equal(result.content, '{"name":"site"}');
});

test("no repo named reads the default repo, as before there was a list", async () => {
  const deps = fakes();
  const result = await run({ path: "AGENTS.md" }, deps);

  assert.deepEqual(deps.reads, [`${UNO}:AGENTS.md`]);
  assert.equal(result.repo, UNO);
});

test("a code search runs on the listed repo", async () => {
  const deps = fakes();
  const result = await run({ path: "", search: "hero", repo: "plus-marketing-website" }, deps);

  assert.deepEqual(deps.searches, [`${SITE}:hero`]);
  assert.equal(result.ok, true);
  assert.equal(result.repo, SITE);
  assert.equal(result.hits?.length, 1);
});

test("an unlisted repo is refused with the list named, and nothing is read or searched", async () => {
  for (const input of [
    { path: "package.json", repo: "someone/else" },
    { path: "", search: "hero", repo: "someone/else" },
  ]) {
    const deps = fakes();
    const result = await run(input, deps);

    assert.equal(result.ok, false);
    assert.match(result.error!, /someone\/else/);
    assert.match(result.error!, new RegExp(`${UNO}\\b`));
    assert.match(result.error!, new RegExp(SITE));
    assert.deepEqual([...deps.reads, ...deps.searches], []);
  }
});

test("the eval corpus stays withheld on every repo", async () => {
  const deps = fakes();
  const result = await run({ path: "docs/evals/cases.yaml", repo: SITE }, deps);

  assert.equal(result.ok, false);
  assert.deepEqual(deps.reads, []);
});
