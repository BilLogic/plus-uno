/**
 * Template stylesheet classes carry the `plus-template-` prefix.
 *
 * WHY THIS EXISTS. The code-bearing layout kit was called Patterns and is now
 * Templates; a leftover `plus-pattern-` class in a stylesheet, a className
 * string, a selector in a test or a script that greps for one silently stops
 * matching the markup. This guard fails on any such class in live source.
 *
 * ALLOWED. Archived history: ADR bodies, the eval ledger, knowledge archive.
 *
 * Run: npm run test:scripts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/check-template-class-names.test.mjs';
const ALLOWED = [/^docs\/adr\//, /^docs\/evals\//, /^docs\/knowledge\/archive\//, /^node_modules\//, /^package-lock\.json$/];

test('no plus-pattern- class remains in live source', () => {
  let out = '';
  try {
    out = execFileSync('git', ['grep', '-I', '-n', 'plus-pattern', '--', '.'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch (err) {
    if (err.status !== 1) throw err;
  }
  const hits = out
    .split('\n')
    .filter(Boolean)
    .filter((line) => {
      const file = line.split(':')[0];
      return file !== SELF && !ALLOWED.some((re) => re.test(file));
    })
    .map((line) => line.slice(0, 160));
  assert.deepEqual(hits, [], `plus-pattern- classes left:\n${hits.slice(0, 20).join('\n')}`);
});
