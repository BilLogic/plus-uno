/**
 * The intake queue uno-maintain drains reads the repos uno-bot can reach.
 *
 * The list has one declaration, `GITHUB_REPOS` in agents/uno-bot/wrangler.toml,
 * parsed by the Worker's own parser. These tests hold the queue to it: the
 * repos it reads are the Worker's repos, a repo added to the list is a repo the
 * queue reads, and the docs that tell a maintain session how to drain the queue
 * name the reader rather than a one-repo command.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { intakeRepos, readQueue, INTAKE_LABEL } from "./intake-queue.mjs";
import { parseRepoList } from "../agents/uno-bot/src/integrations/repo-list.mjs";
import { varValueInWrangler } from "../agents/uno-bot/scripts/secrets.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const WRANGLER = path.join(ROOT, "agents", "uno-bot", "wrangler.toml");
const TOML = readFileSync(WRANGLER, "utf8");

function rootWith(toml) {
  const root = mkdtempSync(path.join(tmpdir(), "intake-queue-"));
  mkdirSync(path.join(root, "agents", "uno-bot"), { recursive: true });
  writeFileSync(path.join(root, "agents", "uno-bot", "wrangler.toml"), toml);
  return root;
}

/* ------------------------------------------------ one list, two readers */

test("the queue reads exactly the repos the Worker's list declares, in its order", () => {
  const worker = parseRepoList(varValueInWrangler(TOML, "GITHUB_REPOS"), varValueInWrangler(TOML, "GITHUB_REPO"));
  assert.deepEqual(intakeRepos({ repoRoot: ROOT }), worker.entries.map((e) => e.repo));
  assert.ok(intakeRepos({ repoRoot: ROOT }).length > 1, "the committed list names more than the harness repo");
});

test("a repo added to the Worker's list is a repo the queue reads", () => {
  const grown = TOML.replace(
    '{"repo": "BilLogic/plus-uno-blueprint", "purpose": "the service-blueprint app and its schema", "workflows": []}',
    '{"repo": "BilLogic/plus-uno-blueprint", "purpose": "the service-blueprint app and its schema", "workflows": []},\n' +
      '  {"repo": "BilLogic/another", "purpose": "a fourth repo", "workflows": []}',
  );
  assert.notEqual(grown, TOML, "the fixture edit found its line");
  assert.ok(intakeRepos({ repoRoot: rootWith(grown) }).includes("BilLogic/another"));
});

test("an unset list is the default repo alone, as it is for the Worker", () => {
  const unset = TOML.replace(/^GITHUB_REPOS = '''[\s\S]*?'''\n/m, "");
  assert.notEqual(unset, TOML, "the fixture edit removed the list");
  assert.deepEqual(intakeRepos({ repoRoot: rootWith(unset) }), ["BilLogic/plus-uno"]);
});

test("a list the Worker would refuse is refused here too, not read as one repo", () => {
  const broken = TOML.replace('"purpose": "uno-bot and the harness", ', "");
  assert.notEqual(broken, TOML, "the fixture edit found its line");
  assert.throws(() => intakeRepos({ repoRoot: rootWith(broken) }), /missing: purpose/);
});

/* ------------------------------------------------ reading the queue */

test("every listed repo is asked for its open intakes, and the answers merge with their repo", () => {
  const asked = [];
  const issues = {
    "o/a": [{ number: 2, title: "two", url: "u2", createdAt: "2026-09-02T00:00:00Z" }],
    "o/b": [{ number: 7, title: "seven", url: "u7", createdAt: "2026-09-01T00:00:00Z" }],
  };
  const { items, failures } = readQueue(["o/a", "o/b"], (repo, label) => {
    asked.push([repo, label]);
    return issues[repo];
  });
  assert.deepEqual(asked, [["o/a", INTAKE_LABEL], ["o/b", INTAKE_LABEL]]);
  assert.equal(INTAKE_LABEL, "harness-intake");
  assert.deepEqual(failures, []);
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

/* ------------------------------------------------ the docs name the reader */

const DRAIN_DOCS = ["skills/uno-maintain/SKILL.md", "skills/uno-maintain/references/method.md"];

test("the maintain docs drain the queue through the reader, never a one-repo command", () => {
  for (const rel of DRAIN_DOCS) {
    const text = readFileSync(path.join(ROOT, rel), "utf8");
    assert.match(text, /npm run intake:queue/, `${rel} names the reader`);
    for (const line of text.split("\n").filter((l) => /gh issue list[^`]*harness-intake/.test(l))) {
      assert.match(line, /--repo/, `${rel} drains one repo only: ${line.trim()}`);
    }
  }
});

test("the reader is bound to its npm name", () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.scripts["intake:queue"], "node scripts/intake-queue.mjs");
});
