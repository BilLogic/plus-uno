/**
 * `ds add`: install registry items into a consumer project without shadcn.
 * The items are the JSON `scripts/generate-registry.mjs` builds; the packaged `ds`
 * carries them in `registry/` beside its snapshot. Pure planning over a registry folder,
 * then one write step, so the tests run both on a scratch folder.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** The folder every item's files sit under; `ds check` skips it in a project. */
export const INSTALL_FOLDER = 'plus-ds';
const FOLDER = INSTALL_FOLDER;

/** Where the item JSON lives for a lookup root: the package's `registry/`, else a generated `dist/registry/`. */
export function registryDir(root) {
  return ['registry', 'dist/registry'].map((d) => path.join(root, d)).find((d) => fs.existsSync(path.join(d, 'foundation.json'))) ?? null;
}

const nameOf = (dep) => path.posix.basename(dep).replace(/\.json$/, '');

/**
 * The items to install, dependencies first, with every file and npm dependency they bring.
 * Throws on an unknown name, so a typo is a usage error rather than a silent no-op.
 */
export function plan(dir, names) {
  const known = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'registry.json').map((f) => f.slice(0, -5));
  const resolve = (n) => known.find((k) => k === n) ?? known.find((k) => k.toLowerCase() === n.toLowerCase());
  const ordered = [];
  const seen = new Set();
  const visit = (raw) => {
    const name = resolve(raw);
    if (!name) throw new Error(`no registry item "${raw}": \`ds find ${raw}\` names what exists.`);
    if (seen.has(name)) return;
    seen.add(name);
    const item = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
    for (const d of item.registryDependencies ?? []) visit(nameOf(d));
    ordered.push(item);
  };
  names.forEach(visit);
  const files = new Map();
  const dependencies = {};
  for (const item of ordered) {
    for (const f of item.files) files.set(f.target, f.content);
    for (const d of item.dependencies ?? []) {
      const at = d.lastIndexOf('@');
      if (at <= 0) throw new Error(`${item.name}: dependency "${d}" has no version`);
      dependencies[d.slice(0, at)] = d.slice(at + 1);
    }
  }
  return { items: ordered.map((i) => i.name), files: [...files].map(([target, content]) => ({ target, content })), dependencies };
}

/** The folder the items land in: `--dir`, else `src/` when the project has one, else its root; the copied files sit under `plus-ds/`. */
export function baseDir(projectRoot, dir) {
  return path.resolve(projectRoot, dir ?? (fs.existsSync(path.join(projectRoot, 'src')) ? 'src' : '.'));
}

function manager(projectRoot) {
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return ['pnpm', ['install']];
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return ['yarn', ['install']];
  if (fs.existsSync(path.join(projectRoot, 'bun.lockb')) || fs.existsSync(path.join(projectRoot, 'bun.lock'))) return ['bun', ['install']];
  return ['npm', ['install']];
}

/**
 * Write the plan into the project. A file that exists and differs is a conflict and is left alone
 * unless `overwrite`. New npm dependencies go into package.json (an existing range is the project's call),
 * and the package manager runs unless `install` is false.
 * Returns `{ written, unchanged, conflicts, added, installed, missingPeers }`.
 */
export function apply(p, { projectRoot, dir, overwrite = false, install = true, run = spawnSync }) {
  const base = baseDir(projectRoot, dir);
  const out = { base: path.relative(projectRoot, base) || '.', written: [], unchanged: [], conflicts: [], added: [], installed: false, installFailed: false, missingPeers: [], manualDependencies: {} };
  // Decide everything before writing anything, so a conflict or a broken package.json leaves the project untouched.
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : null;
  const todo = [];
  for (const f of p.files) {
    const dest = path.resolve(base, f.target);
    if (path.relative(base, dest).startsWith('..') || path.isAbsolute(path.relative(base, dest))) throw new Error(`refusing to write ${f.target}: it leaves ${out.base}`);
    const rel = path.relative(projectRoot, dest);
    if (fs.existsSync(dest)) {
      if (fs.readFileSync(dest, 'utf8') === f.content) { out.unchanged.push(rel); continue; }
      if (!overwrite) { out.conflicts.push(rel); continue; }
    }
    todo.push({ dest, rel, content: f.content });
  }
  if (out.conflicts.length) return out;
  for (const t of todo) {
    fs.mkdirSync(path.dirname(t.dest), { recursive: true });
    fs.writeFileSync(t.dest, t.content);
    out.written.push(t.rel);
  }

  const have = { ...pkg?.devDependencies, ...pkg?.peerDependencies, ...pkg?.dependencies };
  const missing = Object.entries(p.dependencies).filter(([name]) => !have[name]);
  out.missingPeers = ['react', 'react-dom'].filter((n) => !have[n]);
  if (!pkg) { out.manualDependencies = Object.fromEntries(missing); return out; }
  for (const [name, version] of missing) {
    pkg.dependencies = { ...pkg.dependencies, [name]: `^${version}` };
    out.added.push(name);
  }
  if (out.added.length) {
    pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => (a < b ? -1 : 1)));
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    if (install) {
      const [cmd, args] = manager(projectRoot);
      out.installed = run(cmd, args, { cwd: projectRoot, stdio: ['ignore', 2, 2] }).status === 0;
      out.installFailed = !out.installed;
    }
  }
  return out;
}

export function renderAdd(p, r, projectRoot) {
  const lines = [`ds add: ${p.items.join(', ')}`];
  if (r.written.length) lines.push(`wrote ${r.written.length} file(s) under ${path.posix.join(r.base.split(path.sep).join('/'), FOLDER)}`);
  if (r.unchanged.length) lines.push(`${r.unchanged.length} file(s) already up to date`);
  if (r.conflicts.length) lines.push(`not written, these differ from the registry (--overwrite replaces them):`, ...r.conflicts.map((c) => `  ${c}`));
  if (r.added.length) lines.push(`added to package.json: ${r.added.join(', ')}${r.installed ? ' (installed)' : ' (run your package manager install)'}`);
  if (r.installFailed) lines.push('the install failed: fix it and run your package manager install.');
  if (Object.keys(r.manualDependencies).length) lines.push(`no package.json here; install: ${Object.entries(r.manualDependencies).map(([n, v]) => `${n}@${v}`).join(', ')}`);
  if (r.missingPeers.length) lines.push(`peer dependencies to install yourself: ${r.missingPeers.join(', ')}`);
  if (!r.conflicts.length) lines.push(`Next: import the parts from ${FOLDER}/components/…, load ${FOLDER}/styles/main.scss once at the entry, and paste ${FOLDER}/head.html into your HTML head.`);
  return lines.join('\n');
}
