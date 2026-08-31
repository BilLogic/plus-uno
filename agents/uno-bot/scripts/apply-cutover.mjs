#!/usr/bin/env node
// The repo half of the #288 account move: every file that names the OLD
// account, the OLD KV namespaces or the OLD hostname, rewritten from four
// values in one pass.
//
// WHY A SCRIPT AND NOT SEVEN EDITS. The cost of missing one is silent. An eval
// run pointed at the old deployment scores the wrong Worker and reports a clean
// pass — the failure #249 already cost this repo once, and the reason
// `check-worker-host.mjs` exists at all. A pass that either rewrites every
// occurrence or refuses is the only version of this worth running under time
// pressure with the bot half-moved.
//
// IT REFUSES RATHER THAN NO-OPS. Every replacement declares the literal it
// expects to find. A file that has already moved on — someone edited it by
// hand, an upstream change reworded the line — is reported and nothing is
// written. Re-running after a successful pass is safe: each edit is detected as
// already-applied and skipped.
//
// WHAT IT DOES NOT TOUCH, deliberately:
//
//   * The Slack app itself. `pkce_enabled` permanently disables
//     `apps.manifest.update` for this app (ADR-024), so the manifest here is
//     the repo's record and the rollback point; applying it means pasting into
//     the App Manifest web editor and confirming with `npm run slack:diff`.
//     This script rewrites the FILE so the paste is copy-ready. It cannot make
//     Slack agree.
//   * Secrets. Cloudflare stores them write-only; `npm run secrets:set` is how
//     they are re-entered, on the human's own terminal, never through here.
//   * `docs/plans/` and `docs/evals/runs/`. Those are history — they describe a
//     deployment that existed on the day they were written.
//
// Usage:
//   node scripts/apply-cutover.mjs --check        report what would change
//   node scripts/apply-cutover.mjs                apply, reading .cutover.env
//   node scripts/apply-cutover.mjs --account=… --slack-kv=… --harness-kv=… --host=…
//
// `.cutover.env` is written by `scripts/cutover-wizard.sh` and lives at the
// repo root, untracked.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../../..");

/**
 * What the repo says today — READ, not typed.
 *
 * The first draft hardcoded all four, and `check:worker-host` refused it: a
 * second copy of the hostname is exactly what that check exists to prevent, and
 * a migration script is the worst place to keep one, because it is the file
 * that runs while the host is changing. So the old values are parsed from the
 * files that define them, which also means this script does not become a lie
 * the moment it succeeds — re-run after a move and OLD is the new state.
 */
export function currentState(root = REPO_ROOT) {
  const toml = fs.readFileSync(path.join(root, "agents/uno-bot/wrangler.toml"), "utf8");
  const origin = fs.readFileSync(path.join(root, "agents/uno-bot/scripts/worker-url.mjs"), "utf8");
  return {
    account: value(/^account_id\s*=\s*"([^"]+)"/m.exec(toml), "account_id in wrangler.toml"),
    slackKv: kvId(toml, "SLACK_OAUTH_KV"),
    harnessKv: kvId(toml, "HARNESS_KV"),
    host: new URL(value(/DEFAULT_WORKER_ORIGIN\s*=\s*"([^"]+)"/.exec(origin), "DEFAULT_WORKER_ORIGIN")).host,
  };
}

function value(match, what) {
  if (!match) throw new Error(`apply-cutover: could not read ${what}. The file moved on; update this script.`);
  return match[1];
}

/**
 * The id under a `[[kv_namespaces]]` block with this binding.
 *
 * Anchored on the BINDING rather than on order, because the two blocks are
 * eleven comment lines apart and a positional read would swap them the day
 * someone reorders the file — which would point the Slack OAuth token at the
 * harness namespace and lose it silently.
 */
function kvId(toml, binding) {
  const pattern = new RegExp(`binding\\s*=\\s*"${binding}"[^\\[]*?id\\s*=\\s*"([^"]+)"`, "s");
  const reversed = new RegExp(`id\\s*=\\s*"([^"]+)"[^\\[]*?binding\\s*=\\s*"${binding}"`, "s");
  return value(pattern.exec(toml) ?? reversed.exec(toml), `the ${binding} namespace id in wrangler.toml`);
}

export const OLD = currentState();

/**
 * One rewrite: a file, the literal that must be there, and what replaces it.
 *
 * `count` is asserted too. `SLACK_OAUTH_REDIRECT_URI` is one line and the Slack
 * manifest carries the host twelve times; a rewrite that found the wrong number
 * of them has misunderstood the file, and saying so beats writing it.
 */
export function edits(values) {
  const host = values.host;
  return [
    { file: "agents/uno-bot/wrangler.toml", from: `account_id = "${OLD.account}"`, to: `account_id = "${values.account}"`, count: 1,
      why: "the account every wrangler command runs against" },
    { file: "agents/uno-bot/wrangler.toml", from: `id = "${OLD.slackKv}"`, to: `id = "${values.slackKv}"`, count: 1,
      why: "SLACK_OAUTH_KV — the issued Slack user token and the PKCE verifiers" },
    { file: "agents/uno-bot/wrangler.toml", from: `id = "${OLD.harnessKv}"`, to: `id = "${values.harnessKv}"`, count: 1,
      why: "HARNESS_KV — figma-poll snapshot, delivery-alert throttle, Gemini cache memo" },
    { file: "agents/uno-bot/wrangler.toml", from: OLD.host, to: host, count: 1,
      why: "SLACK_OAUTH_REDIRECT_URI, which Slack matches character for character" },
    { file: "agents/uno-bot/scripts/worker-url.mjs", from: OLD.host, to: host, count: 1,
      why: "DEFAULT_WORKER_ORIGIN — the one definition every consumer imports" },
    { file: ".github/workflows/uno-bot-deploy.yml", from: `"${OLD.account}"`, to: `"${values.account}"`, count: 1,
      why: "CLOUDFLARE_ACCOUNT_ID on the deploy job" },
    { file: ".github/workflows/uno-bot-evals.yml", from: OLD.host, to: host, count: 1,
      why: "the fallback when vars.UNO_BOT_WORKER_URL is unset — a workflow cannot import the module" },
    { file: ".github/workflows/uno-bot-retrieval-evals.yml", from: OLD.host, to: host, count: 1,
      why: "the same fallback on the retrieval evals" },
    { file: "agents/uno-bot/slack-app-manifest.yaml", from: OLD.host, to: host, count: null,
      why: "the OAuth redirect plus the events and interactivity request URLs — pasted by hand into Slack afterwards (ADR-024)" },
    { file: "agents/uno-bot/slack-app-manifest-commands.yaml", from: OLD.host, to: host, count: null,
      why: "the nine command URLs, same paste" },
  ];
}

/** Every occurrence of `from`, or a reason it cannot be rewritten. */
export function plan(edit, source) {
  const found = source.split(edit.from).length - 1;
  if (found === 0) {
    const already = source.split(edit.to).length - 1;
    if (already > 0) return { state: "already", found: already };
    return { state: "missing", found: 0 };
  }
  if (edit.count !== null && found !== edit.count) return { state: "unexpected", found };
  return { state: "ready", found };
}

export function rewrite(source, edit) {
  return source.split(edit.from).join(edit.to);
}

function readValues(argv) {
  const flags = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)=(.+)$/.exec(arg);
    if (match) flags[match[1]] = match[2];
  }
  const envFile = path.join(REPO_ROOT, ".cutover.env");
  const fromFile = {};
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match) fromFile[match[1]] = match[2];
    }
  }
  const values = {
    account: flags.account ?? fromFile.NEW_ACCOUNT_ID,
    slackKv: flags["slack-kv"] ?? fromFile.NEW_SLACK_OAUTH_KV_ID,
    harnessKv: flags["harness-kv"] ?? fromFile.NEW_HARNESS_KV_ID,
    host: (flags.host ?? fromFile.NEW_WORKER_HOST ?? "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
  };
  return values;
}

/** Every value present, and none of them still the old one. */
export function validate(values) {
  const problems = [];
  for (const [key, label] of [["account", "--account"], ["slackKv", "--slack-kv"], ["harnessKv", "--harness-kv"], ["host", "--host"]]) {
    if (!values[key]) problems.push(`${label} is missing (or its .cutover.env line is).`);
  }
  if (values.account === OLD.account) problems.push("--account is the OLD account id. Nothing to do, and nothing this script should write.");
  if (values.host === OLD.host) problems.push("--host is the OLD hostname.");
  if (values.slackKv === OLD.slackKv) problems.push("--slack-kv is the OLD namespace id.");
  if (values.harnessKv === OLD.harnessKv) problems.push("--harness-kv is the OLD namespace id.");
  if (values.host && !/^[a-z0-9.-]+$/i.test(values.host)) problems.push(`--host should be a bare hostname, not "${values.host}".`);
  return problems;
}

function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const values = readValues(argv);
  const problems = validate(values);
  if (problems.length) {
    console.error("\n[apply-cutover] cannot run:\n");
    for (const problem of problems) console.error(`  ${problem}`);
    console.error("\n  Run scripts/cutover-wizard.sh first, or pass the four flags.\n");
    process.exit(1);
  }

  const work = [];
  const blocked = [];
  for (const edit of edits(values)) {
    const full = path.join(REPO_ROOT, edit.file);
    if (!fs.existsSync(full)) { blocked.push(`${edit.file} does not exist.`); continue; }
    const source = fs.readFileSync(full, "utf8");
    const state = plan(edit, source);
    if (state.state === "ready") work.push({ edit, full, source, found: state.found });
    else if (state.state === "already") work.push({ edit, full, source, found: state.found, already: true });
    else if (state.state === "missing") blocked.push(`${edit.file} no longer contains \`${edit.from}\` — and does not contain the new value either.`);
    else blocked.push(`${edit.file} contains \`${edit.from}\` ${state.found}x, expected ${edit.count}x.`);
  }

  if (blocked.length) {
    console.error("\n[apply-cutover] refusing to write — the repo is not where this script expects:\n");
    for (const problem of blocked) console.error(`  ${problem}`);
    console.error("\n  Nothing was changed. Fix the file, or update OLD/edits in this script.\n");
    process.exit(1);
  }

  const pending = work.filter((w) => !w.already);
  console.log(`\n[apply-cutover] ${check ? "would rewrite" : "rewriting"} ${pending.length} occurrence group(s):\n`);
  for (const { edit, found, already } of work) {
    const mark = already ? "· already" : `→ ${found}x`;
    console.log(`  ${mark.padEnd(11)} ${edit.file}`);
    console.log(`              ${edit.why}`);
  }

  if (check) {
    console.log(`\n  --check: nothing written. ${pending.length ? "Run without --check to apply." : "Everything is already applied."}\n`);
    return;
  }

  /*
   * FOLD PER FILE, THEN WRITE ONCE.
   *
   * Every entry in `work` carries the source as it was read during PLANNING.
   * Writing inside the loop therefore rewrites the original four times for
   * wrangler.toml — which has four edits, the account id, both KV ids and the
   * redirect URI — and the last write wins. Three of the four vanish.
   *
   * That is not theoretical. Running this against the real repo produced a
   * wrangler.toml with the new redirect URI (the last edit) and the OLD account
   * and OLD KV ids, which is the half-migrated state this script's header
   * claims it cannot produce: a Worker pointed at the account being left, with
   * a redirect URI Slack would accept. Silent, and exactly the shape of #249.
   */
  const byFile = new Map();
  for (const { edit, full, source, already } of work) {
    if (already) continue;
    byFile.set(full, rewrite(byFile.get(full) ?? source, edit));
  }
  for (const [full, contents] of byFile) fs.writeFileSync(full, contents);

  console.log(
    "\n  Written. Now:\n" +
      "    1. git diff — read it before committing.\n" +
      `    2. node scripts/check-worker-host.mjs --host=${OLD.host}  (from agents/uno-bot)\n` +
      "       That scan ignores the ALLOWED list, so it is the proof the move is complete.\n" +
      "    3. Paste both slack-app-manifest*.yaml into the Slack App Manifest editor,\n" +
      "       then `npm run slack:diff` — Slack cannot be scripted for this app (ADR-024).\n" +
      "    4. Do NOT merge until the new Worker is deployed and serving: merging deploys.\n",
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
