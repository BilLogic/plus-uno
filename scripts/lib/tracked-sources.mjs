/**
 * The tracked corpus: the one `git ls-files` walk the source guards share.
 *
 * A filesystem walk finds a second copy of the tree (a worktree, a build
 * output), so a guard that counts occurrences lists what git tracks and reads
 * only what is still on disk. The source guards read through `trackedSources`
 * and list through `trackedFiles`; no check walks the file system itself.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const git = (repoRoot, args) =>
  execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });

/** Whether `repoRoot` is inside a git work tree. An archive copy, or a fixture root, is not. */
export function inCheckout(repoRoot) {
  try {
    return git(repoRoot, ['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {
    return false;
  }
}

/** Every file on disk under `roots`, repo-relative and sorted: `node_modules` and dot folders skipped. */
function filesOnDisk(repoRoot, roots) {
  const out = [];
  const walk = (rel) => {
    const abs = path.join(repoRoot, rel);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      return;
    }
    if (stat.isFile()) {
      out.push(rel);
      return;
    }
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(rel === '' ? entry.name : `${rel}/${entry.name}`); // repo-relative paths are POSIX, as git prints them
    }
  };
  for (const root of roots.length ? roots : ['']) walk(root.replace(/\/$/, ''));
  return out.sort();
}

/**
 * Tracked paths under `roots` (the whole repo when none), repo-relative.
 *
 * Outside a git checkout (an archive copy the usage eval builds in, a fixture
 * root) the files on disk stand in, `node_modules` and dot folders skipped.
 * `untracked: true` also lists the files git would not ignore but does not
 * track yet: what a reader of a working copy, rather than of a commit, wants.
 * `skipHidden: true` drops what sits in a `node_modules` or dot folder below
 * the root it was listed under, as the on-disk walk always does.
 */
export function trackedFiles(repoRoot, roots = [], { untracked = false, skipHidden = false } = {}) {
  const files = list(repoRoot, roots, untracked);
  if (!skipHidden) return files;
  return files.filter((file) => {
    const root = roots.map((r) => r.replace(/\/$/, '')).find((r) => r !== '' && file.startsWith(`${r}/`));
    const below = root === undefined ? file : file.slice(root.length + 1);
    return !below.split('/').some((segment) => segment === 'node_modules' || segment.startsWith('.'));
  });
}

function list(repoRoot, roots, untracked) {
  if (!inCheckout(repoRoot)) return filesOnDisk(repoRoot, roots);
  const flags = untracked ? ['--cached', '--others', '--exclude-standard'] : [];
  return execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...flags, ...roots], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
    .split('\0')
    .filter(Boolean);
}

/**
 * Every tracked file under `roots` whose path matches `pattern` and still
 * exists on disk, read: `{path, text}`.
 */
export function trackedSources(repoRoot, roots, pattern, options) {
  return trackedFiles(repoRoot, roots, options)
    .filter((rel) => pattern.test(rel) && fs.existsSync(path.join(repoRoot, rel)))
    .map((rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') }));
}
