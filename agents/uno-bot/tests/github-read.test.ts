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

test("the eval corpus stays withheld on the harness repo, the default", async () => {
  for (const repo of [undefined, UNO]) {
    const deps = fakes();
    const result = await run({ path: "docs/evals/cases.yaml", repo }, deps);

    assert.equal(result.ok, false, String(repo));
    assert.deepEqual(deps.reads, []);
  }
});

test("another repo's docs/evals/ is an ordinary folder, read like any other", async () => {
  const deps = fakes();
  const result = await run({ path: "docs/evals/cases.yaml", repo: SITE }, deps);

  assert.equal(result.ok, true);
  assert.deepEqual(deps.reads, [`${SITE}:docs/evals/cases.yaml`]);
});

// An answer posted in Figma names its source by a link a lookup returned
// (`figma-ask/job.ts`), so a read tells the model to link what it read at the
// `url` it hands back.
test("a file read tells the model to link its url rather than cite a bare path", async () => {
  const result = await run({ path: "package.json" }, fakes());

  assert.match(result.note ?? "", /`url`/);
  assert.doesNotMatch(result.note ?? "", /cite the path/i);
});

// uno-bot cannot read Storybook, so a Storybook link it wrote was one it made
// up (#1563). A read of a design-system component's files hands back the real
// docs page, from the registry baked at deploy (`integrations/storybook-docs.ts`).
test("a component file read in the default repo carries the component's Storybook docs link", async () => {
  const result = (await run({ path: "design-system/src/components/forms-and-inputs/Button/Button.mdx" }, fakes())) as Result & {
    storybook?: { title: string; url: string };
  };

  assert.deepEqual(result.storybook, {
    title: "Storybook: Button",
    url: "https://plus-uno.netlify.app/storybook/?path=/docs/components-forms-and-inputs-button-button--docs",
  });
  assert.match(result.note ?? "", /storybook\.url/);
});

test("a component folder listing carries its Storybook docs link too, and a flat component's file its own", async () => {
  const deps = { ...fakes(), readPath: async (_t: unknown, path: string) => ({ path, kind: "dir" as const, entries: ["Button.jsx"] }) };
  const dir = (await run({ path: "design-system/src/components/forms-and-inputs/Button" }, deps)) as Result & { storybook?: { url: string } };
  assert.match(dir.storybook?.url ?? "", /components-forms-and-inputs-button-button--docs$/);

  const flat = (await run({ path: "design-system/src/components/forms-and-inputs/Checkbox.stories.jsx" }, fakes())) as Result & { storybook?: { url: string } };
  assert.match(flat.storybook?.url ?? "", /components-forms-and-inputs-checkbox--docs$/);
});

test("no Storybook link for a path outside a component, or for the same path in another repo", async () => {
  const other = (await run({ path: "README.md" }, fakes())) as Result & { storybook?: unknown };
  assert.equal(other.storybook, undefined);
  const site = (await run({ path: "design-system/src/components/forms-and-inputs/Button/Button.mdx", repo: SITE }, fakes())) as Result & { storybook?: unknown };
  assert.equal(site.storybook, undefined);
});
