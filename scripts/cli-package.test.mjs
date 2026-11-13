// The seam for the @plus-uno/cli package (#2117): pack it, install the tarball into a
// scratch project outside the repo, and run `npx ds` against the baked snapshot.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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
    // --save keeps the tarball in package.json, so the install `ds add` runs later does not prune it.
    sh('npm', ['install', '--no-package-lock', '--save', path.join(scratch, filename)], project);

    const find = sh('npx', ['--no-install', 'ds', 'find', 'Button'], project);
    assert.match(find, /Button/);
    assert.match(find, /ds add Button/, 'find names the registry item to add');
    const data = JSON.parse(sh('npx', ['--no-install', 'ds', 'find', 'Button', '--json'], project));
    assert.deepEqual(data.results[0], { kind: 'component', name: 'Button', status: 'exists', import: "import { Button } from '@/components';", summary: 'Button: triggers an action.', aliasOf: null, registryItem: 'Button' });

    assert.match(sh('npx', ['--no-install', 'ds', 'get', 'Button'], project), /Button/);
    assert.ok(sh('npx', ['--no-install', 'ds', 'tokens', 'color'], project).length > 0);
    assert.ok(sh('npx', ['--no-install', 'ds', 'guide'], project).length > 0);

    // `ds check` reads the project's own files against the baked facts, with CI-suitable exit codes.
    fs.mkdirSync(path.join(project, 'src'));
    fs.writeFileSync(path.join(project, 'src/Clean.jsx'), "import { Button } from '@/components';\nexport const Clean = () => <Button>Save</Button>;\n");
    assert.match(sh('npx', ['--no-install', 'ds', 'check', 'src/Clean.jsx'], project), /Clean: no escapes/);
    fs.writeFileSync(path.join(project, 'src/Bad.jsx'), "export const Bad = () => <i className=\"fa-light fa-grid-2\" style={{ color: '#ff0000' }} />;\n");
    const bad = spawnSync('npx', ['--no-install', 'ds', 'check', 'src', '--json'], { cwd: project, encoding: 'utf8' });
    assert.equal(bad.status, 1, 'a raw color or Pro icon exits 1');
    const verdict = JSON.parse(bad.stdout);
    assert.ok(verdict.failing >= 2 && verdict.findings.every((f) => f.file.startsWith('src/')), 'findings name the project file');
    assert.equal(spawnSync('npx', ['--no-install', 'ds', 'check', 'src/Clean.jsx'], { cwd: project }).status, 0);
    const missing = spawnSync('npx', ['--no-install', 'ds', 'check', 'nope.jsx'], { cwd: project, encoding: 'utf8' });
    assert.equal(missing.status, 2, 'a missing path is a usage error, not a pass');
    assert.match(missing.stderr, /no such path: nope\.jsx/);
    fs.mkdirSync(path.join(project, 'empty'));
    assert.equal(spawnSync('npx', ['--no-install', 'ds', 'check'], { cwd: path.join(project, 'empty') }).status, 2, 'no files to check is not a pass');

    // `ds add`: the foundation and Button into a plain Vite + React project, which then builds and checks clean.
    fs.rmSync(path.join(project, 'src/Bad.jsx'));
    sh('npm', ['install', '--no-package-lock', '--save', 'react', 'react-dom'], project);
    sh('npm', ['install', '--no-package-lock', '--save-dev', 'vite', '@vitejs/plugin-react'], project);
    fs.writeFileSync(path.join(project, 'vite.config.js'), "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };\n");
    fs.writeFileSync(path.join(project, 'index.html'), '<!doctype html><div id="root"></div><script type="module" src="/src/main.jsx"></script>\n');
    fs.writeFileSync(path.join(project, 'src/main.jsx'), "import { createRoot } from 'react-dom/client';\nimport './plus-ds/styles/main.scss';\nimport { Button } from './plus-ds/components/forms-and-inputs/Button';\ncreateRoot(document.getElementById('root')).render(<Button>Save</Button>);\n");
    const added = JSON.parse(sh('npx', ['--no-install', 'ds', 'add', 'foundation', 'Button', '--json'], project));
    assert.ok(added.items.includes('foundation') && added.items.includes('Button') && added.items.includes('Spinner'), 'dependent items come along');
    assert.ok(added.written.some((f) => f === 'src/plus-ds/components/forms-and-inputs/Button/Button.jsx'));
    assert.ok(added.added.includes('sass') && added.installed, 'npm dependencies are added and installed');
    assert.equal(JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')).dependencies.clsx.startsWith('^'), true);
    assert.deepEqual(JSON.parse(sh('npx', ['--no-install', 'ds', 'add', 'Button', '--json'], project)).written, [], 'a second add writes nothing');
    fs.appendFileSync(path.join(project, 'src/plus-ds/components/forms-and-inputs/Button/Button.jsx'), '// local edit\n');
    assert.equal(spawnSync('npx', ['--no-install', 'ds', 'add', 'Button'], { cwd: project }).status, 1, 'a locally edited file is a conflict, not overwritten');
    assert.equal(spawnSync('npx', ['--no-install', 'ds', 'add', 'Nope'], { cwd: project }).status, 2, 'an unknown item is a usage error');
    sh('npx', ['--no-install', 'ds', 'add', 'Button', '--overwrite'], project);
    sh('npx', ['--no-install', 'vite', 'build'], project);
    const after = spawnSync('npx', ['--no-install', 'ds', 'check', 'src', '--json'], { cwd: project, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    assert.equal(JSON.parse(after.stdout).failing, 0, `ds check finds no fail-level escape: ${after.stdout.slice(0, 400)}`);

    // A page template and a chart: patterns and the chart theme come along, and the project builds.
    const more = JSON.parse(sh('npx', ['--no-install', 'ds', 'add', 'ListPage', 'BarChart', '--json'], project));
    for (const name of ['ListPage', 'Frame', 'PatternSection', 'PatternTable', 'BarChart', 'chart-theme']) assert.ok(more.items.includes(name), `${name} comes along`);
    assert.ok(more.added.includes('highcharts'), 'the chart brings highcharts');
    fs.writeFileSync(path.join(project, 'src/main.jsx'), [
      "import { createRoot } from 'react-dom/client';",
      "import './plus-ds/styles/main.scss';",
      "import ListPage from './plus-ds/templates/ListPage/ListPage';",
      "import BarChart from './plus-ds/dataviz/comparison/BarChart/BarChart';",
      "createRoot(document.getElementById('root')).render(<><ListPage /><BarChart categories={['A', 'B']} series={[{ name: 'Sessions', data: [3, 5] }]} /></>);",
      '',
    ].join('\n'));
    sh('npx', ['--no-install', 'vite', 'build'], project);
    const final = spawnSync('npx', ['--no-install', 'ds', 'check', 'src', '--json'], { cwd: project, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    assert.equal(JSON.parse(final.stdout).failing, 0, `ds check finds no fail-level escape: ${final.stdout.slice(0, 400)}`);

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
