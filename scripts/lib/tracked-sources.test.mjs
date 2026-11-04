import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

import { trackedFiles, trackedSources } from './tracked-sources.mjs';

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
