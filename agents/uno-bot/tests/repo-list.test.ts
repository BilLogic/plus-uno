// The repo list and its resolver: what a tool's `repo` input turns into.
//
// Driven through `parseRepoList` and `resolveRepo` directly, and through the
// Worker's binding `resolveRepoFor` for the one case only the binding owns — a
// list that does not parse refuses every repo rather than throwing into a
// turn. That the COMMITTED list parses, and that the tool schemas offer
// exactly its repos, is `scripts/secrets.test.mjs`, beside the offline check
// that reads wrangler.toml.
import { test } from "node:test";
import assert from "node:assert/strict";

import { RepoListError, parseRepoList, resolveRepo } from "../src/integrations/repo-list.mjs";
import { resolveRepoFor } from "../src/integrations/github";
import type { Env } from "../src/types";

const UNO = "BilLogic/plus-uno";
const SITE = "BilLogic/plus-marketing-website";
const BLUEPRINT = "BilLogic/plus-uno-blueprint";

const ENTRIES = [
  { repo: UNO, purpose: "uno-bot and the harness", workflows: [] },
  { repo: SITE, purpose: "the public marketing site", workflows: ["sync-notion.yml"] },
  { repo: BLUEPRINT, purpose: "the service-blueprint app and its schema", workflows: [] },
];
const LIST = parseRepoList(JSON.stringify(ENTRIES), UNO);

function resolved(requested: unknown): string {
  const r = resolveRepo(LIST, requested);
  assert.ok(r.ok, JSON.stringify(r));
  return r.entry.repo;
}

// ── the resolver ─────────────────────────────────────────────────────────────

test("no repo named is the default repo", () => {
  for (const requested of [undefined, null, "", "   "]) {
    assert.equal(resolved(requested), UNO, JSON.stringify(requested));
  }
});

test("a listed repo resolves to the list's own entry, whatever the case", () => {
  assert.equal(resolved(SITE), SITE);
  assert.equal(resolved("billogic/PLUS-UNO-BLUEPRINT"), BLUEPRINT);
  const r = resolveRepo(LIST, SITE);
  assert.ok(r.ok);
  assert.deepEqual(r.entry, ENTRIES[1]);
});

test("a bare repo name resolves when one listed repo carries it", () => {
  assert.equal(resolved("plus-marketing-website"), SITE);
  assert.equal(resolved(" plus-uno "), UNO);
});

test("an unlisted repo is refused, and the refusal names every listed repo", () => {
  for (const requested of ["someone/else", "BilLogic/plus-uno-private", "other-org/plus-uno", "plus", 42]) {
    const r = resolveRepo(LIST, requested);
    assert.equal(r.ok, false, JSON.stringify(requested));
    if (r.ok) continue;
    for (const repo of [UNO, SITE, BLUEPRINT]) assert.match(r.error, new RegExp(repo), JSON.stringify(requested));
    // The purposes ride along, so the refusal is enough to ask which one.
    assert.match(r.error, /the public marketing site/);
    assert.match(r.error, /default/);
  }
});

// ── the list ─────────────────────────────────────────────────────────────────

test("an unset list is the default repo alone", () => {
  for (const raw of [undefined, "", "  \n"]) {
    const list = parseRepoList(raw, UNO);
    assert.deepEqual(list.entries, [{ repo: UNO, purpose: "", workflows: [] }]);
    assert.equal(list.defaultEntry, list.entries[0]);
    const refused = resolveRepo(list, SITE);
    assert.equal(refused.ok, false);
  }
});

test("an invalid list is refused, saying what is wrong", () => {
  const cases: Array<[string, RegExp]> = [
    ["not json", /not JSON/],
    ["{}", /non-empty JSON array/],
    ["[]", /non-empty JSON array/],
    ['["BilLogic/plus-uno"]', /must be an object/],
    [JSON.stringify([{ repo: UNO, purpose: "x" }]), /missing: workflows/],
    [JSON.stringify([{ ...ENTRIES[0], visibility: "public" }]), /unknown keys: visibility/],
    [JSON.stringify([{ ...ENTRIES[0], repo: "plus-uno" }]), /owner\/name/],
    [JSON.stringify([{ ...ENTRIES[0], repo: "https://github.com/BilLogic/plus-uno" }]), /owner\/name/],
    [JSON.stringify([{ ...ENTRIES[0], purpose: " " }]), /purpose/],
    [JSON.stringify([{ ...ENTRIES[0], purpose: "x".repeat(81) }]), /purpose/],
    [JSON.stringify([{ ...ENTRIES[0], workflows: "gates.yml" }]), /workflows/],
    [JSON.stringify([{ ...ENTRIES[0], workflows: ["../gates.yml"] }]), /workflows/],
    [JSON.stringify([{ ...ENTRIES[0], workflows: ["gates.yml", "gates.yml"] }]), /twice/],
    [JSON.stringify([ENTRIES[0], { ...ENTRIES[1], repo: "billogic/PLUS-UNO" }]), /second time/],
    [JSON.stringify([ENTRIES[1]]), /does not list GITHUB_REPO/],
  ];
  for (const [raw, message] of cases) {
    assert.throws(
      () => parseRepoList(raw, UNO),
      (err) => err instanceof RepoListError && message.test(err.message),
      raw,
    );
  }
  assert.throws(() => parseRepoList(undefined, ""), RepoListError);
  assert.throws(() => parseRepoList(undefined, "plus-uno"), RepoListError);
});

// ── the Worker's binding ─────────────────────────────────────────────────────

const env = (vars: Partial<Env>) => ({ GITHUB_TOKEN: "ghp_test", GITHUB_REPO: UNO, ...vars }) as Env;

test("the binding resolves against the Worker's two vars", () => {
  const listed = env({ GITHUB_REPOS: JSON.stringify(ENTRIES) });
  const site = resolveRepoFor(listed, SITE);
  assert.ok(site.ok);
  assert.equal(site.entry.repo, SITE);

  const unset = resolveRepoFor(env({}), undefined);
  assert.ok(unset.ok);
  assert.equal(unset.entry.repo, UNO);
  assert.equal(resolveRepoFor(env({}), SITE).ok, false);
});

test("a misconfigured list refuses every repo, the default too, and says the list is the cause", () => {
  const broken = env({ GITHUB_REPOS: JSON.stringify([ENTRIES[1]]) });
  for (const requested of [undefined, UNO, SITE]) {
    const r = resolveRepoFor(broken, requested);
    assert.equal(r.ok, false, JSON.stringify(requested));
    if (!r.ok) assert.match(r.error, /repo list is misconfigured/);
  }
});
