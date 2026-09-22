/**
 * The intake queue uno-maintain drains reads the repos uno-bot can reach.
 *
 * The list has one declaration, `GITHUB_REPOS` in agents/uno-bot/wrangler.toml,
 * parsed by the Worker's own parser. These tests hold the queue to it: the
 * repos it reads are the Worker's repos, a repo added to the list is a repo the
 * queue reads, and the docs that tell a maintain session how to drain the queue
 * name the reader rather than a direct `gh` command.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { intakeRepos, readQueue, INTAKE_LABEL, PER_REPO_LIMIT } from "./intake-queue.mjs";
import { parseRepoList } from "../agents/uno-bot/src/integrations/repo-list.mjs";
import { varValueInWrangler } from "../agents/uno-bot/scripts/secrets.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const TOML = readFileSync(path.join(ROOT, "agents", "uno-bot", "wrangler.toml"), "utf8");
const WORKER = parseRepoList(varValueInWrangler(TOML, "GITHUB_REPOS"), varValueInWrangler(TOML, "GITHUB_REPO"));

/** The committed toml with its `GITHUB_REPOS` block replaced by `entries`, or
 *  removed for `null` — fixtures follow the parsed list, not its line spelling. */
function tomlWithRepos(entries) {
  const block = /^GITHUB_REPOS = '''[\s\S]*?'''\n/m;
  assert.match(TOML, block, "the committed toml carries a GITHUB_REPOS block");
  return TOML.replace(block, () => (entries === null ? "" : `GITHUB_REPOS = '''${JSON.stringify(entries)}'''\n`));
}

function rootWith(toml) {
  const root = mkdtempSync(path.join(tmpdir(), "intake-queue-"));
  mkdirSync(path.join(root, "agents", "uno-bot"), { recursive: true });
  writeFileSync(path.join(root, "agents", "uno-bot", "wrangler.toml"), toml);
  return root;
}

/* ------------------------------------------------ one list, two readers */

test("the queue reads exactly the repos the Worker's list declares, in its order", () => {
  assert.deepEqual(intakeRepos({ repoRoot: ROOT }), WORKER.entries.map((e) => e.repo));
  assert.ok(WORKER.entries.length > 1, "the committed list names more than the harness repo");
});

test("a repo added to the Worker's list is a repo the queue reads", () => {
  const grown = tomlWithRepos([...WORKER.entries, { repo: "BilLogic/another", purpose: "a fourth repo", workflows: [] }]);
  assert.deepEqual(intakeRepos({ repoRoot: rootWith(grown) }), [...WORKER.entries.map((e) => e.repo), "BilLogic/another"]);
});

test("an unset list is the default repo alone, as it is for the Worker", () => {
  assert.deepEqual(intakeRepos({ repoRoot: rootWith(tomlWithRepos(null)) }), [WORKER.defaultEntry.repo]);
});

test("a list the Worker would refuse is refused here too, not read as one repo", () => {
  const [first, ...rest] = WORKER.entries;
  const { purpose: _dropped, ...noPurpose } = first;
  assert.throws(() => intakeRepos({ repoRoot: rootWith(tomlWithRepos([noPurpose, ...rest])) }), /missing: purpose/);
});

/* ------------------------------------------------ reading the queue */

test("every listed repo is asked for its open intakes, and the answers merge with their repo", () => {
  const asked = [];
  const issues = {
    "o/a": [{ number: 2, title: "two", url: "u2", createdAt: "2026-09-02T00:00:00Z" }],
    "o/b": [{ number: 7, title: "seven", url: "u7", createdAt: "2026-09-01T00:00:00Z" }],
  };
  const { items, failures, truncated } = readQueue(["o/a", "o/b"], (repo, label) => {
    asked.push([repo, label]);
    return issues[repo];
  });
  assert.deepEqual(asked, [["o/a", INTAKE_LABEL], ["o/b", INTAKE_LABEL]]);
  assert.equal(INTAKE_LABEL, "harness-intake");
  assert.deepEqual(failures, []);
  assert.deepEqual(truncated, []);
  assert.deepEqual(
    items.map((i) => `${i.repo}#${i.number}`),
    ["o/b#7", "o/a#2"],
    "oldest first, across repos",
  );
});

test("a repo that cannot be read is named as a failure, not dropped as an empty queue", () => {
  const { items, failures } = readQueue(["o/a", "o/b"], (repo) => {
    if (repo === "o/b") throw new Error("HTTP 404");
    return [];
  });
  assert.deepEqual(items, []);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].repo, "o/b");
  assert.match(failures[0].error, /404/);
});

test("a repo that answers with the whole per-repo limit is named as possibly truncated", () => {
  const full = Array.from({ length: PER_REPO_LIMIT }, (_, n) => ({
    number: n,
    title: "t",
    url: "u",
    createdAt: "2026-09-01T00:00:00Z",
  }));
  const { items, truncated } = readQueue(["o/a", "o/b"], (repo) => (repo === "o/a" ? full : []));
  assert.deepEqual(truncated, ["o/a"]);
  assert.equal(items.length, PER_REPO_LIMIT);
});

/* ------------------------------------------------ the docs name the reader */

const DRAIN_DOCS = ["skills/uno-maintain/SKILL.md", "skills/uno-maintain/references/method.md"];

test("the maintain docs drain the queue through the reader, never gh directly", () => {
  for (const rel of DRAIN_DOCS) {
    const doc = readFileSync(path.join(ROOT, rel), "utf8");
    assert.match(doc, /npm run intake:queue/, `${rel} names the reader`);
    const direct = doc.split("\n").filter((l) => /gh issue list[^\n]*harness-intake/.test(l));
    assert.deepEqual(direct, [], `${rel} drains the queue with gh instead of npm run intake:queue`);
  }
});
