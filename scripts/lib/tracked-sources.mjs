/**
 * The tracked corpus: the one `git ls-files` walk the source guards share.
 *
 * A filesystem walk finds a second copy of the tree (a worktree, a build
 * output), so a guard that counts occurrences lists what git tracks and reads
 * only what is still on disk. `check-ads-language`, `check-old-system`,
 * `check-inline-jsx-tokens` and `check-state-mixin` read through `trackedSources`; `check-deps` lists
 * through `trackedFiles`.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Tracked paths under `roots` (the whole repo when none), repo-relative. */
export function trackedFiles(repoRoot, roots = []) {
  return execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...roots], {
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
export function trackedSources(repoRoot, roots, pattern) {
  return trackedFiles(repoRoot, roots)
    .filter((rel) => pattern.test(rel) && fs.existsSync(path.join(repoRoot, rel)))
    .map((rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') }));
}
