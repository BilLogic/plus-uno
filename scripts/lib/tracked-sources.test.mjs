import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

import { REPO_ROOT, documents, text } from './corpus.mjs';
import { inCheckout, trackedFiles, trackedSources } from './tracked-sources.mjs';

let root;
const put = (rel, text) => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tracked-sources-'));
  execFileSync('git', ['-C', root, 'init', '-q']);
  put('src/a.js', 'a');
  put('src/b.scss', 'b');
  put('other/c.js', 'c');
  put('src/gone.js', 'gone');
  execFileSync('git', ['-C', root, 'add', '.']);
  fs.rmSync(path.join(root, 'src/gone.js'));
  put('src/untracked.js', 'u');
});
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('trackedFiles lists every tracked file, under the roots when given', () => {
  assert.deepEqual(trackedFiles(root).sort(), ['other/c.js', 'src/a.js', 'src/b.scss', 'src/gone.js']);
  assert.deepEqual(trackedFiles(root, ['other']), ['other/c.js']);
});

test('trackedSources reads matching tracked files, skipping deleted and untracked ones', () => {
  assert.deepEqual(trackedSources(root, ['src'], /\.js$/), [{ path: 'src/a.js', text: 'a' }]);
});

test('untracked: true adds the files git would not ignore, and still skips the ignored ones', () => {
  put('.gitignore', 'ignored.js\n');
  put('src/ignored.js', 'i');
  assert.deepEqual(trackedFiles(root, ['src'], { untracked: true }).sort(), ['src/a.js', 'src/b.scss', 'src/gone.js', 'src/untracked.js']);
  assert.deepEqual(trackedFiles(root, ['src']).sort(), ['src/a.js', 'src/b.scss', 'src/gone.js']);
});

test('outside a git checkout, the files on disk stand in for the tracked list', () => {
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'tracked-sources-bare-'));
  try {
    for (const rel of ['prototypes/a/src/App.jsx', 'prototypes/a/node_modules/x.js', 'prototypes/.hidden/b.jsx', 'src/c.scss', 'top.md']) {
      fs.mkdirSync(path.join(bare, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(bare, rel), rel);
    }
    assert.equal(inCheckout(bare), false);
    assert.deepEqual(trackedFiles(bare, ['prototypes', 'src', 'missing']), ['prototypes/a/src/App.jsx', 'src/c.scss']);
    assert.deepEqual(trackedFiles(bare, ['top.md']), ['top.md']);
    assert.deepEqual(trackedFiles(bare), ['prototypes/a/src/App.jsx', 'src/c.scss', 'top.md']);
    assert.deepEqual(trackedSources(bare, ['src'], /\.scss$/), [{ path: 'src/c.scss', text: 'src/c.scss' }]);
  } finally {
    fs.rmSync(bare, { recursive: true, force: true });
  }
});

test('inside a checkout, inCheckout says so', () => {
  assert.equal(inCheckout(root), true);
});

test('no check, and no reader a check calls, walks the file system itself', () => {
  const readers = ['scripts/lib/docs-page.mjs', 'scripts/lib/storybook-pages.mjs'];
  const checks = documents('scripts', { ext: ['.mjs'], root: REPO_ROOT }).filter((f) => /^scripts\/check-[^/]+\.mjs$/.test(f) && !f.endsWith('.test.mjs'));
  assert.ok(checks.length > 40, `only ${checks.length} checks read`);
  for (const file of [...checks, ...readers]) {
    assert.equal(/\b(?:readdirSync|opendirSync|globSync)\b/.test(text(file)), false, `${file} walks the file system itself`);
  }
});
