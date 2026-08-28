#!/usr/bin/env node
// The Worker's host is defined once. This is what holds it there.
//
// #288 moves this Worker to another Cloudflare account, which changes the
// hostname. Before this check the host was written out in five places, and the
// cost of missing one is silent: an eval run pointed at the OLD deployment
// scores the wrong Worker and reports a clean pass. That is the failure #249
// already cost this repo, and the reason the build stamp now derives from the
// deploy instead of being typed.
//
// So the literal is allowed in a small, named set of places and nowhere else.
//
// After the cutover it is also the proof the move was complete, but only when
// asked about the OLD host explicitly:
//
//   node scripts/check-worker-host.mjs --host=uno-bot.old-account.workers.dev
//
// ALLOWED does not apply to that scan. Those entries are exceptions for the host
// this repo currently deploys to — wrangler.toml, the two Slack manifests, the
// two workflow fallbacks — and they are exactly the files a cutover has to
// rewrite, so exempting them there would report the move complete while five
// files still point at a dead account.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_WORKER_ORIGIN } from "./worker-url.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "../../..");

/** The hostname, without scheme — matches bare mentions in prose too. */
export const HOST = new URL(DEFAULT_WORKER_ORIGIN).host;

/**
 * Where the host may still appear, and why. Repo-relative.
 *
 * Each entry is a deliberate exception, not a backlog. A new one needs a reason
 * written next to it.
 */
export const ALLOWED = new Map([
  [
    "agents/uno-bot/scripts/worker-url.mjs",
    "the definition itself",
  ],
  [
    "agents/uno-bot/wrangler.toml",
    "SLACK_OAUTH_REDIRECT_URI, which Slack matches against the app's registered " +
      "value and so cannot be derived — it changes in lockstep with Slack's config",
  ],
  [
    "agents/uno-bot/slack-app-manifest.yaml",
    "the Slack app's own declared config — 9 command URLs, the OAuth redirect, and " +
      "the events and interactivity request URLs. Pushed with `npm run slack:manifest` " +
      "and diffed with `npm run slack:diff`, so it is edited as one file and must match " +
      "the live app exactly (#288)",
  ],
  [
    "agents/uno-bot/slack-app-manifest-commands.yaml",
    "the command half of the same manifest, same reason",
  ],
  [
    ".github/workflows/uno-bot-evals.yml",
    "fallback for vars.UNO_BOT_WORKER_URL — a workflow cannot import the module",
  ],
  [
    ".github/workflows/uno-bot-retrieval-evals.yml",
    "fallback for vars.UNO_BOT_WORKER_URL — a workflow cannot import the module",
  ],
]);

/**
 * Recorded history, which must NOT be rewritten when the host changes.
 *
 * An eval run artifact says which Worker it scored. Editing that to the new
 * host would be falsifying the record — the run really did hit the old one.
 */
const HISTORY = [/^docs\/evals\/runs\//, /^docs\/plans\//];

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "storybook-static", ".test-build"]);

/**
 * A directory holding a `.git` entry is somebody else's checkout, not ours.
 *
 * This repo keeps agent worktrees under `.claude/worktrees/`, each a full copy.
 * Without this, running from the main checkout walked ten of them and reported
 * 112 strays — every allowed file, at a path prefix that is not in ALLOWED. A
 * guard that is red for everyone is as useless as one that cannot fail, and it
 * gets switched off the same way. (`.git` is a file in a worktree, a directory
 * in a clone; existsSync covers both.)
 */
const isNestedCheckout = (dir) => existsSync(path.join(dir, ".git"));
const TEXT = /\.(mjs|js|jsx|ts|tsx|toml|ya?ml|json|md|mdx|sh)$/;

function* files(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue; // a symlink to nowhere is not a finding
    }
    if (s.isDirectory()) {
      if (isNestedCheckout(full)) continue;
      yield* files(full);
    }
    else if (TEXT.test(entry)) yield full;
  }
}

/**
 * What the repo actually contains: tracked files plus new ones, minus whatever
 * .gitignore covers.
 *
 * Preferred over the walk because the walk sees a working copy, not a repo. A
 * local `eval-results.json` — an artifact of `npm run evals`, written to the
 * root and never committed — records the WORKER_URL it hit, so the walk flagged
 * it on the one machine that had run evals and nowhere else. A guard that is red
 * only for the person who used the repo hardest is a guard that gets ignored.
 *
 * `--others` keeps a brand-new file in scope before it is staged, so the answer
 * does not depend on whether `git add` has happened yet.
 *
 * @returns {string[]|null} repo-relative paths, or null if this is not a repo.
 */
function gitFiles(root) {
  const r = spawnSync(
    "git",
    ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8", maxBuffer: 1 << 26 },
  );
  if (r.status !== 0 || typeof r.stdout !== "string") return null;
  return r.stdout.split("\0").filter(Boolean);
}

/** @returns {string[]} repo-relative paths that mention the host and may not. */
export function findStrays(root = REPO_ROOT, host = HOST) {
  // Not `?? []` — a git that fails must fall back to walking, never to an empty
  // list. An empty list here is a green check, which is the one answer this
  // function must not be able to give by accident.
  const rels = gitFiles(root) ?? [...files(root)].map((abs) => path.relative(root, abs));
  // Asking about a foreign host is a cutover audit, not the invariant check.
  const auditing = host !== HOST;
  const strays = [];
  for (const rel of rels) {
    if (!TEXT.test(rel)) continue;
    if (rel.split(path.sep).some((seg) => SKIP_DIRS.has(seg))) continue;
    const abs = path.join(root, rel);
    if (auditing) {
      if (HISTORY.some((re) => re.test(rel))) continue;
    } else if (ALLOWED.has(rel) || HISTORY.some((re) => re.test(rel))) {
      continue;
    }
    let text;
    try {
      text = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (text.includes(host)) strays.push(rel);
  }
  return strays.sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const flag = process.argv.slice(2).find((a) => a.startsWith("--host="));
  const host = flag ? flag.slice("--host=".length) : HOST;
  if (!host) {
    console.error("--host= needs a hostname, e.g. --host=uno-bot.old.workers.dev");
    process.exit(1);
  }
  const strays = findStrays(REPO_ROOT, host);
  if (strays.length) {
    console.error(`[worker-host] ${strays.length} file(s) hardcode ${host}:`);
    for (const rel of strays) console.error(`  ${rel}`);
    console.error("");
    if (host === HOST) {
      console.error("  -> Import workerOrigin()/workerUrl() from scripts/worker-url.mjs, or read");
      console.error("     UNO_BOT_WORKER_URL. If the mention is deliberate, add it to ALLOWED in");
      console.error("     scripts/check-worker-host.mjs with the reason (#288).");
    } else {
      console.error(`  -> These still point at ${host}. The move is not complete until each one`);
      console.error("     names the new host — including the Slack manifests, which are pushed");
      console.error("     with `npm run slack:manifest` and must match the live app exactly.");
    }
    process.exit(1);
  }
  console.log(
    host === HOST
      ? `[worker-host] ${HOST} is defined once; ${ALLOWED.size} documented exception(s).`
      : `[worker-host] no file mentions ${host}.`,
  );
}
