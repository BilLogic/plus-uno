#!/usr/bin/env node
/**
 * The post-edit hook: run `check:ds-usage` on the file an agent just edited
 * and hand any escape straight back, so the agent fixes it before going on.
 *
 * Wired in two places, one script:
 *   Claude Code  `.claude/settings.json` PostToolUse on Edit|Write|MultiEdit.
 *                Exit 2 puts stderr in front of the agent; the edit has
 *                already happened, so nothing is blocked.
 *   Cursor       `.cursor/hooks.json` afterFileEdit. Cursor reads no reply
 *                from this event, so there the hook only logs.
 *
 * Only consumer code is checked (the same scope as the checker: `prototypes/`
 * and `src/`); any other edit returns at once without reading a file. Every
 * run appends one line to `.local/ds-usage-runs.jsonl` (git-ignored): time,
 * file, session, and the count of findings by rule.
 *
 * The edited file is held to zero, the same rule `check:ds-usage` applies to a
 * file a change touches: recorded debt in it comes back too, so an edit to an
 * old file is the moment its escapes get fixed.
 *
 * Off switch: `DS_USAGE_HOOK=off` in the environment. A checker that fails to
 * load or throws exits 0 with nothing said: a broken hook must not stall an
 * agent. `DS_USAGE_HOOK_LOG` moves the log (the tests use it).
 *
 * `DS_USAGE_ROOT` names another repo to check: its edited files, facts and
 * log, with this repo's checker. The usage eval's checker-removed arm runs the
 * hook that way, so its copy keeps the hook and loses the checker.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFAULT_LOG = '.local/ds-usage-runs.jsonl';

/** The edited file, repo-relative, from a Claude Code or a Cursor payload; null when there is none. */
export function editedPath(input, repoRoot) {
  const file = input?.tool_input?.file_path ?? input?.tool_input?.path ?? input?.file_path;
  if (typeof file !== 'string' || !file) return null;
  const abs = path.isAbsolute(file) ? file : path.join(repoRoot, file);
  const rel = path.relative(repoRoot, abs).split(path.sep).join('/');
  return rel.startsWith('..') ? null : rel;
}

const print = (f) => `${f.file}:${f.line}:${f.col}  ${f.rule}  ${f.message}\n    -> ${f.fix}`;

/**
 * Decide what one hook call does. `check(rel)` returns the file's findings;
 * `inScope(rel)` says whether the checker reads it.
 * @returns {{ran: boolean, exitCode: 0|2, stderr: string, log: object|null}}
 */
export function handle(input, { repoRoot = ROOT, check, inScope, env = process.env, now = () => new Date().toISOString() }) {
  const quiet = { ran: false, exitCode: 0, stderr: '', log: null };
  if (env.DS_USAGE_HOOK === 'off') return quiet;
  const rel = editedPath(input, repoRoot);
  if (!rel || !inScope(rel)) return quiet;
  let findings;
  try {
    findings = check(rel);
  } catch {
    return quiet;
  }
  const fail = findings.filter((f) => f.level === 'fail');
  const byRule = {};
  for (const f of fail) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
  const log = {
    time: now(),
    file: rel,
    session: input.session_id ?? input.conversation_id ?? null,
    fail: fail.length,
    warn: findings.length - fail.length,
    by_rule: byRule,
  };
  if (!fail.length) return { ran: true, exitCode: 0, stderr: '', log };
  const stderr =
    `check:ds-usage found ${fail.length} escape(s) from the design system in ${rel}. Fix them before going on ` +
    `(rules: docs/engineering/ds-usage-rules.md):\n${fail.map(print).join('\n')}\n`;
  return { ran: true, exitCode: 2, stderr, log };
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    return;
  }
  const root = process.env.DS_USAGE_ROOT ? path.resolve(process.env.DS_USAGE_ROOT) : ROOT;
  if (process.env.DS_USAGE_HOOK === 'off' || !editedPath(input, root)) return;
  let checker;
  try {
    checker = await import(path.join(ROOT, 'scripts/check-ds-usage.mjs'));
  } catch {
    return;
  }
  const out = handle(input, { repoRoot: root, check: (rel) => checker.escapes(root, [rel]), inScope: checker.inScope });
  if (out.log) {
    try {
      const logFile = path.resolve(root, process.env.DS_USAGE_HOOK_LOG ?? DEFAULT_LOG);
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, `${JSON.stringify(out.log)}\n`);
    } catch {
      // a log that cannot be written is not the agent's problem
    }
  }
  if (out.stderr) process.stderr.write(out.stderr);
  process.exitCode = out.exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
