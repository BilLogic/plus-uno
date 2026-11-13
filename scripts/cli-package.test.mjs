// The seam for the @plus-uno/cli package (#2117): pack it, install the tarball into a
// scratch project outside the repo, and run `npx ds` against the baked snapshot.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { REPO_ROOT } from './lib/corpus.mjs';
import { PACKAGE_NAME } from '../packages/cli/src/constants.mjs';

const PKG = path.join(REPO_ROOT, 'packages/cli');
const sh = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' } });

test('package name is held in one constant', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
  assert.equal(pkg.name, PACKAGE_NAME);
  assert.equal(PACKAGE_NAME, '@plus-uno/cli');
  assert.equal(pkg.bin.ds, 'bin/ds.mjs');
  assert.equal(pkg.publishConfig?.access, 'public');
});

test('npm pack, install in a scratch project, `npx ds find Button` answers from the snapshot', { timeout: 300_000 }, () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'plus-uno-cli-'));
  try {
    const out = sh('npm', ['pack', '--json', '--pack-destination', scratch], PKG);
    const [{ filename, size, unpackedSize }] = JSON.parse(out.slice(out.indexOf('[\n')));
    const budget = JSON.parse(fs.readFileSync(path.join(PKG, 'snapshot-budget.json'), 'utf8'));
    assert.ok(size <= budget.packedBytes, `tarball ${size} B is over the ${budget.packedBytes} B budget`);
    assert.ok(unpackedSize <= budget.unpackedBytes, `unpacked ${unpackedSize} B is over the ${budget.unpackedBytes} B budget`);

    const project = path.join(scratch, 'project');
    fs.mkdirSync(project);
    fs.writeFileSync(path.join(project, 'package.json'), '{"name":"scratch","private":true}');
    sh('npm', ['install', '--no-package-lock', path.join(scratch, filename)], project);

    const find = sh('npx', ['--no-install', 'ds', 'find', 'Button'], project);
    assert.match(find, /Button/);
    const data = JSON.parse(sh('npx', ['--no-install', 'ds', 'find', 'Button', '--json'], project));
    assert.ok(JSON.stringify(data).includes('"Button"'));

    assert.match(sh('npx', ['--no-install', 'ds', 'get', 'Button'], project), /Button/);
    assert.ok(sh('npx', ['--no-install', 'ds', 'tokens', 'color'], project).length > 0);
    assert.ok(sh('npx', ['--no-install', 'ds', 'guide'], project).length > 0);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test('the repo root `ds` script is unchanged and still answers', () => {
  assert.match(sh('node', ['scripts/ds.mjs', 'find', 'Button'], REPO_ROOT), /Button/);
});
