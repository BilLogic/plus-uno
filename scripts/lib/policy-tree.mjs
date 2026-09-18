/**
 * A throwaway repo root for driving a check's `run({ repoRoot })`.
 *
 * The token policy checks (#611) are tested against a fixture tree rather than
 * the live one: plant a defect, assert the finding; omit or empty the token
 * directory, assert the sentinel floor. `git: true` is for the two fallback
 * checks, which list files through `git ls-files` rather than walking the disk.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * @param {Record<string, string>} files repo-relative path → contents
 * @param {{git?: boolean}} [opts]
 * @returns {{root: string, done: () => void}}
 */
export function policyTree(files, { git = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'token-policy-'));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  if (git) {
    spawnSync('git', ['init', '-q'], { cwd: root, stdio: 'ignore' });
    spawnSync('git', ['add', '-A'], { cwd: root, stdio: 'ignore' });
  }
  return { root, done: () => fs.rmSync(root, { recursive: true, force: true }) };
}

/**
 * The findings a check reports for a fixture, as their messages.
 *
 * @param {(ctx: {repoRoot: string}) => {message: string}[]} run
 * @param {string} root
 * @returns {string[]}
 */
export function messagesOf(run, root) {
  return run({ repoRoot: root }).map((finding) => finding.message);
}
