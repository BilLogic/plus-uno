import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { apply, plan, registryDir } from './ds-add.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-add-'));
  const reg = path.join(root, 'registry');
  fs.mkdirSync(reg);
  const put = (name, item) => fs.writeFileSync(path.join(reg, `${name}.json`), JSON.stringify({ name, registryDependencies: [], dependencies: [], files: [], ...item }));
  put('foundation', { dependencies: ['sass@1.0.0'], files: [{ target: 'plus-ds/styles/main.scss', content: 'a{}' }] });
  put('Icon', { registryDependencies: ['https://x.test/registry/foundation.json'], files: [{ target: 'plus-ds/Icon.jsx', content: 'icon' }] });
  put('Button', { registryDependencies: ['Icon', 'foundation'], dependencies: ['clsx@2.1.1'], files: [{ target: 'plus-ds/Button.jsx', content: 'button' }] });
  return { root, reg };
}

test('plan: dependencies first, once each, names case-insensitive, deps merged', () => {
  const { reg } = fixture();
  const p = plan(reg, ['button']);
  assert.deepEqual(p.items, ['foundation', 'Icon', 'Button']);
  assert.deepEqual(p.dependencies, { sass: '1.0.0', clsx: '2.1.1' });
  assert.equal(p.files.length, 3);
});

test('plan: an unknown item names the way to find it', () => {
  const { reg } = fixture();
  assert.throws(() => plan(reg, ['Nope']), /ds find Nope/);
});

test('registryDir: the package folder, else a generated dist/registry, else null', () => {
  const { root } = fixture();
  assert.equal(registryDir(root), path.join(root, 'registry'));
  assert.equal(registryDir(os.tmpdir()), null);
});

test('apply: writes under src/, adds missing npm deps, leaves conflicts alone, is idempotent', () => {
  const { reg, root } = fixture();
  const project = path.join(root, 'project');
  fs.mkdirSync(path.join(project, 'src'), { recursive: true });
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ dependencies: { clsx: '^2.0.0' } }));
  const p = plan(reg, ['Button']);
  const calls = [];
  const run = (...a) => { calls.push(a[0]); return { status: 0 }; };
  const first = apply(p, { projectRoot: project, run });
  assert.equal(first.written.length, 3);
  assert.ok(fs.existsSync(path.join(project, 'src/plus-ds/Button.jsx')));
  const pkg = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
  assert.deepEqual(first.added, ['sass'], 'a range the project already has is its own call');
  assert.equal(pkg.dependencies.clsx, '^2.0.0');
  assert.deepEqual(calls, ['npm']);
  assert.deepEqual(first.missingPeers, ['react', 'react-dom']);

  assert.equal(apply(p, { projectRoot: project, run }).written.length, 0);
  fs.writeFileSync(path.join(project, 'src/plus-ds/Button.jsx'), 'edited');
  assert.deepEqual(apply(p, { projectRoot: project, run }).conflicts, ['src/plus-ds/Button.jsx']);
  assert.equal(fs.readFileSync(path.join(project, 'src/plus-ds/Button.jsx'), 'utf8'), 'edited');
  assert.equal(apply(p, { projectRoot: project, run, overwrite: true }).written.length, 1);
});

test('apply: --no-install writes package.json but runs nothing', () => {
  const { reg, root } = fixture();
  fs.writeFileSync(path.join(root, 'package.json'), '{}');
  const calls = [];
  apply(plan(reg, ['Icon']), { projectRoot: root, dir: 'lib', install: false, run: () => calls.push(1) });
  assert.equal(calls.length, 0);
  assert.ok(fs.existsSync(path.join(root, 'lib/plus-ds/Icon.jsx')));
});
