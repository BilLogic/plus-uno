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

/** Speak MCP over stdio to `npx ds mcp` in `cwd`: initialize, then tools/list. */
function mcpTools(cwd) {
  const input = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'seam-test', version: '0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ].map((m) => JSON.stringify(m)).join('\n') + '\n';
  const out = execFileSync('npx', ['--no-install', 'ds', 'mcp'], { cwd, input, encoding: 'utf8', timeout: 60_000 });
  const reply = out.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((m) => m.id === 2);
  return reply.result.tools;
}

test('package name is held in one constant', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
  assert.equal(pkg.name, PACKAGE_NAME);
  assert.equal(PACKAGE_NAME, '@plus-uno/cli');
  assert.equal(pkg.bin.ds, 'bin/ds.mjs');
  assert.equal(pkg.publishConfig?.access, 'public');
});

test('the README install lines read the constant', () => {
  const readme = fs.readFileSync(path.join(PKG, 'README.md'), 'utf8');
  const named = readme.match(/@plus-uno\/[\w-]+/g) ?? [];
  assert.ok(named.length > 0 && named.every((n) => n === PACKAGE_NAME), `README names ${[...new Set(named)]}, not only ${PACKAGE_NAME}`);
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
    assert.deepEqual(data.results[0], { kind: 'component', name: 'Button', status: 'exists', import: "import { Button } from '@/components';", summary: 'Button: triggers an action.', aliasOf: null });

    assert.match(sh('npx', ['--no-install', 'ds', 'get', 'Button'], project), /Button/);
    assert.ok(sh('npx', ['--no-install', 'ds', 'tokens', 'color'], project).length > 0);
    assert.ok(sh('npx', ['--no-install', 'ds', 'guide'], project).length > 0);

    // `ds mcp`: the stdio server from the installed tarball lists its five tools.
    const tools = mcpTools(project);
    assert.deepEqual(tools.map((t) => t.name), ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check']);
    assert.ok(!('paths' in tools.find((t) => t.name === 'ds_check').inputSchema.properties), 'the packaged server reads no paths');
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test('the repo root `ds` script is unchanged and still answers', () => {
  assert.match(sh('node', ['scripts/ds.mjs', 'find', 'Button'], REPO_ROOT), /Button/);
});

test('the registry builds into dist/registry: foundation and component items, stamped, no alias left in a copied file', { timeout: 120_000 }, () => {
  sh('node', ['scripts/generate-registry.mjs'], REPO_ROOT);
  const dir = path.join(REPO_ROOT, 'dist/registry');
  const read = (n) => JSON.parse(fs.readFileSync(path.join(dir, `${n}.json`), 'utf8'));
  const index = read('registry');
  assert.ok(index.items.some((i) => i.name === 'foundation') && index.items.some((i) => i.name === 'Button'));
  const button = read('Button');
  assert.ok(button.registryDependencies.some((d) => d.endsWith('/foundation.json')));
  for (const item of [read('foundation'), button]) {
    assert.match(item.meta.release, /^v\d/);
    for (const f of item.files) assert.ok(!/from\s+['"]@\//.test(f.content) && !/@use\s+['"]@\//.test(f.content), `${f.target} still imports through the @ alias`);
  }
});
