import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { engines, findings, hardcoded, nvmrcMajor, wranglerFloor } from './node-floor.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

/** A throwaway repo shaped like this one, so the tests never touch the real files. */
function fixture({ nvmrc = '22\n', floor = '>=22', workflows = {}, manifests = { node: '>=22' } } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'node-floor-'));
  if (nvmrc !== null) fs.writeFileSync(path.join(root, '.nvmrc'), nvmrc);
  const wrangler = path.join(root, 'agents/uno-bot/node_modules/wrangler');
  fs.mkdirSync(wrangler, { recursive: true });
  fs.writeFileSync(path.join(wrangler, 'package.json'), JSON.stringify({ engines: { node: floor } }));
  fs.mkdirSync(path.join(root, '.github/workflows'), { recursive: true });
  for (const [name, body] of Object.entries(workflows)) {
    fs.writeFileSync(path.join(root, '.github/workflows', name), body);
  }
  for (const f of ['package.json', 'agents/uno-bot/package.json']) {
    fs.writeFileSync(path.join(root, f), JSON.stringify(manifests ? { engines: manifests } : {}));
  }
  return root;
}

test('the repository as it stands has no findings', () => {
  assert.deepEqual(findings(REPO_ROOT), []);
});

test('the floor is read from wrangler, not written here', () => {
  // The assertion that matters: bump wrangler past a Node major and this moves
  // on its own, which is the whole reason it is not a constant.
  assert.equal(wranglerFloor(fixture({ floor: '>=24' })), 24);
  assert.equal(wranglerFloor(fixture({ floor: '>=22.0.0' })), 22);
  assert.equal(nvmrcMajor(REPO_ROOT), 22);
});

test('an .nvmrc below the wrangler floor is a finding', () => {
  const out = findings(fixture({ nvmrc: '20\n', manifests: { node: '>=20' } }));
  assert.match(out.join(' '), /would refuse to start/);
});

test('a missing .nvmrc is a finding, and does not crash the engines comparison', () => {
  const out = findings(fixture({ nvmrc: null }));
  assert.equal(out.length, 1);
  assert.match(out[0], /\.nvmrc is missing/);
});

test('a hardcoded node-version in any workflow is a finding, with its line', () => {
  const root = fixture({
    workflows: {
      'a.yml': 'steps:\n  - uses: actions/setup-node@v4\n    with:\n      node-version: "20"\n',
      'b.yml': 'steps:\n  - with:\n      node-version-file: ".nvmrc"\n',
    },
  });
  assert.deepEqual(hardcoded(root), [{ file: '.github/workflows/a.yml', line: 4, version: '20' }]);
  assert.match(findings(root).join(' '), /a\.yml:4 pins node-version: "20"/);
  // The literal is a finding even when it AGREES with .nvmrc: a second copy of
  // the floor is the defect, not the number it currently holds.
  const agreeing = fixture({ workflows: { 'c.yml': '      node-version: "22"\n' } });
  assert.equal(hardcoded(agreeing).length, 1);
});

test('a manifest without engines, or with the wrong one, is a finding', () => {
  assert.match(findings(fixture({ manifests: null })).join(' '), /declares no engines\.node/);
  assert.match(findings(fixture({ manifests: { node: '>=20' } })).join(' '), /declares engines\.node ">=20"/);
  assert.deepEqual(engines(REPO_ROOT).map((e) => e.node), ['>=22', '>=22']);
});
