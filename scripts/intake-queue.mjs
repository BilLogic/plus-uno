#!/usr/bin/env node
// The intake queue uno-maintain drains: every open `harness-intake` issue on
// every repo uno-bot can reach.
//
// Headless sweeps file intakes on the harness repo; uno-bot files them on
// whichever listed repo the change belongs to. A drain that reads one repo
// leaves the others' intakes orphaned. So the repos come from the one
// declaration the Worker reads — `GITHUB_REPOS` in agents/uno-bot/wrangler.toml
// — through the Worker's own parser, and are never typed out here. A list the
// Worker would refuse is refused here too.
//
// Read-only: `gh issue list` per repo, nothing written. A repo that cannot be
// read is reported as a failure and the exit code is 1, so an unreadable queue
// never passes for an empty one.
//
//   npm run intake:queue            table, oldest first
//   npm run intake:queue -- --json  the merged list as JSON
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseRepoList } from "../agents/uno-bot/src/integrations/repo-list.mjs";
import { varValueInWrangler } from "../agents/uno-bot/scripts/secrets.mjs";
import { isEntry } from "./lib/findings.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..");

/** The label every intake carries, whoever filed it. */
export const INTAKE_LABEL = "harness-intake";

/**
 * The repos the queue reads: the Worker's list, in its order.
 * @param {{ repoRoot?: string }} [ctx]
 * @returns {string[]}
 */
export function intakeRepos({ repoRoot = REPO_ROOT } = {}) {
  const toml = readFileSync(path.join(repoRoot, "agents", "uno-bot", "wrangler.toml"), "utf8");
  const list = parseRepoList(varValueInWrangler(toml, "GITHUB_REPOS"), varValueInWrangler(toml, "GITHUB_REPO"));
  return list.entries.map((e) => e.repo);
}

/**
 * @typedef {{ number: number, title: string, url: string, createdAt: string }} Issue
 * @typedef {(repo: string, label: string) => Issue[]} ListIssues
 */

/**
 * Ask each repo for its open intakes and merge the answers, oldest first.
 * @param {readonly string[]} repos
 * @param {ListIssues} listIssues
 * @returns {{ items: (Issue & { repo: string })[], failures: { repo: string, error: string }[] }}
 */
export function readQueue(repos, listIssues) {
  const items = [];
  const failures = [];
  for (const repo of repos) {
    try {
      for (const issue of listIssues(repo, INTAKE_LABEL)) items.push({ repo, ...issue });
    } catch (err) {
      failures.push({ repo, error: err instanceof Error ? err.message : String(err) });
    }
  }
  items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { items, failures };
}

/** @type {ListIssues} */
const ghListIssues = (repo, label) =>
  JSON.parse(
    execFileSync(
      "gh",
      ["issue", "list", "--repo", repo, "--label", label, "--state", "open", "--limit", "200",
        "--json", "number,title,url,createdAt"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  );

if (isEntry(import.meta.url)) {
  const repos = intakeRepos();
  const { items, failures } = readQueue(repos, ghListIssues);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ repos, items, failures }, null, 2));
  } else {
    console.log(`Open ${INTAKE_LABEL} issues across ${repos.length} repos (${repos.join(", ")}): ${items.length}`);
    for (const i of items) console.log(`  ${i.createdAt.slice(0, 10)}  ${i.repo}#${i.number}  ${i.title}  ${i.url}`);
    for (const f of failures) console.error(`  could not read ${f.repo}: ${f.error.trim()}`);
  }
  if (failures.length) process.exitCode = 1;
}
