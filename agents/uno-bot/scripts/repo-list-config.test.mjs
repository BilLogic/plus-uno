/**
 * The committed repo list, read the way `check:secrets` reads it.
 *
 * `GITHUB_REPOS` is a JSON array inside a ''' string in wrangler.toml's
 * [vars]. The Worker parses it with `src/integrations/repo-list.mjs`; so does
 * the offline check, so a list the check passes is one the Worker reads. Here:
 * the reader that pulls the value out of the file, the committed list itself,
 * the tool schemas offering exactly its repos, and the check failing a list
 * the Worker would refuse.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { varValueInWrangler, varsInWrangler } from "./secrets.mjs";
import { parseRepoList } from "../src/integrations/repo-list.mjs";
import { run as checkSecrets } from "./check-secrets.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(here, "..");
const TOML = readFileSync(path.join(PKG, "wrangler.toml"), "utf8");

/* ------------------------------------------------------ reading the value */

test("a ''' value is read whole, and its JSON lines are not taken for keys or tables", () => {
  const toml = [
    "[vars]",
    'A = "1"',
    "LIST = '''[",
    '  {"repo": "o/r"},',
    "[not-a-table]",
    "  B = 2",
    "]'''",
    'C = "3"',
    "[observability]",
    "D = 4",
  ].join("\n");
  assert.equal(varValueInWrangler(toml, "LIST"), '[\n  {"repo": "o/r"},\n[not-a-table]\n  B = 2\n]');
  assert.deepEqual(varsInWrangler(toml), ["A", "LIST", "C"]);
  assert.equal(varValueInWrangler(toml, "C"), "3");
  assert.equal(varValueInWrangler(toml, "D"), undefined);
});

test("one-line strings are read, and a var the table does not assign is undefined", () => {
  const toml = "[vars]\nA = \"x\" # note\nB = 'y'\nL = '''z'''\n";
  assert.equal(varValueInWrangler(toml, "A"), "x");
  assert.equal(varValueInWrangler(toml, "B"), "y");
  assert.equal(varValueInWrangler(toml, "L"), "z");
  assert.equal(varValueInWrangler(toml, "MISSING"), undefined);
});

test("a value this reader cannot read throws rather than reading as unset", () => {
  assert.throws(() => varValueInWrangler("[vars]\nL = '''[\n{}\n", "L"), /never closes/);
  assert.throws(() => varValueInWrangler('[vars]\nL = ["a"]\n', "L"), /not a plain string/);
  assert.throws(() => varValueInWrangler('[vars]\nL = "a\\"b"\n', "L"), /not a plain string/);
});

/* ------------------------------------------------------ the committed list */

const LIST = parseRepoList(varValueInWrangler(TOML, "GITHUB_REPOS"), varValueInWrangler(TOML, "GITHUB_REPO"));

test("the committed list declares the three repos, each with a purpose and its runnable workflows", () => {
  assert.deepEqual(
    LIST.entries.map((e) => e.repo),
    ["BilLogic/plus-uno", "BilLogic/plus-marketing-website", "BilLogic/plus-uno-blueprint"],
  );
  assert.equal(LIST.defaultEntry.repo, "BilLogic/plus-uno");
  for (const e of LIST.entries) assert.ok(e.purpose.length > 0, `${e.repo} has no purpose`);
  // Which workflows a Slack ✅ may start is a reviewed choice: a change here is
  // a change to what the bot can run, so it is spelled out rather than counted.
  assert.deepEqual(
    Object.fromEntries(LIST.entries.map((e) => [e.repo, e.workflows])),
    {
      "BilLogic/plus-uno": [],
      "BilLogic/plus-marketing-website": ["sync-notion.yml"],
      "BilLogic/plus-uno-blueprint": [
        "bot-contract-probe.yml",
        "docs-harness.yml",
        "gates.yml",
        "offline-board.yml",
        "render-walk.yml",
      ],
    },
  );
});

test("github_workflow_run offers exactly the workflows the list allows", () => {
  // The enum is the model's copy of the allowlist; the Worker still checks
  // the workflow against the chosen repo's own entry.
  const tools = JSON.parse(readFileSync(path.join(PKG, "tool-definitions.json"), "utf8"));
  const run = tools.find((t) => t.name === "github_workflow_run");
  assert.ok(run, "github_workflow_run has a schema");
  assert.deepEqual(
    run.input_schema.properties.workflow.enum,
    LIST.entries.flatMap((e) => e.workflows),
  );
});

test("every tool schema that takes a repo offers exactly the listed repos", () => {
  // The schema's enum is the model's copy of the list. A repo added to the
  // list and not here is one the model cannot name; one here and not on the
  // list is one the Worker refuses.
  const tools = JSON.parse(readFileSync(path.join(PKG, "tool-definitions.json"), "utf8"));
  const withRepo = tools.filter((t) => t.input_schema?.properties?.repo);
  assert.ok(withRepo.length >= 2, "github_read and github_intake_search take a repo");
  for (const t of withRepo) {
    assert.deepEqual(t.input_schema.properties.repo.enum, LIST.entries.map((e) => e.repo), t.name);
    assert.ok(!(t.input_schema.required ?? []).includes("repo"), `${t.name}: repo is optional`);
  }
});

/* ------------------------------------------------------ the offline check */

function fixtureRoot(tomlText) {
  const root = mkdtempSync(path.join(tmpdir(), "repo-list-"));
  mkdirSync(path.join(root, "agents", "uno-bot", "src"), { recursive: true });
  writeFileSync(path.join(root, "agents", "uno-bot", "wrangler.toml"), tomlText);
  writeFileSync(
    path.join(root, "agents", "uno-bot", "src", "types.ts"),
    readFileSync(path.join(PKG, "src", "types.ts"), "utf8"),
  );
  return root;
}

test("check:secrets passes the committed list", () => {
  const findings = checkSecrets({ repoRoot: fixtureRoot(TOML), fix: false });
  assert.deepEqual(findings.filter((f) => /repo list/.test(f.message)), []);
});

test("check:secrets fails a list the Worker would refuse, saying why", () => {
  const broken = TOML.replace(
    '{"repo": "BilLogic/plus-uno", "purpose": "uno-bot and the harness", "workflows": []},',
    '{"repo": "BilLogic/plus-uno", "purpose": "uno-bot and the harness"},',
  );
  assert.notEqual(broken, TOML, "the fixture edit found its line");
  const findings = checkSecrets({ repoRoot: fixtureRoot(broken), fix: false });
  const repoFindings = findings.filter((f) => /repo list/.test(f.message));
  assert.equal(repoFindings.length, 1);
  assert.match(repoFindings[0].message, /missing: workflows/);
});
