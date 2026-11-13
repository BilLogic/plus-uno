/**
 * The registry generator's decisions: which files make an item, what makes
 * an import shippable, how an import is rewritten, where an npm version comes from.
 * Pure over a repo root so tests run it on a fixture tree; `scripts/generate-registry.mjs`
 * writes the JSON and `check:registry` fails on any refusal.
 *
 * Item shape follows shadcn's registry-item schema (`registry:lib` for the foundation,
 * `registry:ui` for a component). Files keep the design system's own folder shape under
 * one target folder (`TARGET`), so every import between copied files is relative and the
 * consumer needs no alias configuration.
 */
import fs from 'node:fs';
import path from 'node:path';

export const LIBRARY = 'design-system/src';
export const TARGET = 'plus-ds';
export const COMPONENT_INDEX = 'design-system/agent-views/components/index.md';
export const PATTERN_INDEX = 'design-system/agent-views/_patterns.json';
/** Foundation owns these folders of the library; a component imports them, so it depends on the foundation. */
const FOUNDATION_DIRS = ['tokens', 'styles', 'lib'];
const EXTS = ['', '.jsx', '.js', '.mjs', '.scss', '.css', '/index.jsx', '/index.js'];
const JS_IMPORT = /(^\s*(?:import|export)[^'"\n;]*?from\s*|^\s*import\s*|\bimport\()\s*(['"])([^'"\n]+)\2/gm;
const SCSS_USE = /(@(?:use|forward|import)\s+|meta\.load-css\(\s*)(['"])([^'"\n]+)\2/g;
/** Parts that are not the system's current, shippable source. */
const NOT_SOURCE = /(\.stories\.|-node\.mjs$|\.test\.|\.mdx$|\.md$|(^|\/)\.storybook\/|(^|\/)storybook-docs\/|(^|\/)prototypes\/|(^|\/)(retired|deprecated|_retired|_deprecated)\/)/;
const DEPRECATED_TAG = /^\s*\*?\s*@deprecated\b/m;

const BARRELS = { '@/components': `${LIBRARY}/components/index.js`, '@/patterns': `${LIBRARY}/patterns/index.js` };
const BARREL_IMPORT = /import\s*\{([^}]*)\}\s*from\s*(['"])(@\/components|@\/patterns)\2;?/g;

/** name -> { spec, imported } for each named export a barrel re-exports from one part (`default as X` maps X to the default). */
export function barrelMap(root, barrel) {
  const out = new Map();
  const dir = path.posix.dirname(barrel);
  for (const m of read(root, barrel).replace(/^\s*\/\/.*$/gm, '').matchAll(/export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const spec = m[2].startsWith('.') ? `@/${path.posix.relative(LIBRARY, path.posix.join(dir, m[2]))}` : m[2];
    for (const item of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
      const [imported, exported = imported] = item.split(/\s+as\s+/);
      out.set(exported, { spec, imported });
    }
  }
  return out;
}

/** A named import from a barrel becomes one import per part, so a copied file never needs the barrel. Unknown names stay and are refused later. */
export function expandBarrelImports(root, text) {
  return text.replace(BARREL_IMPORT, (whole, names, q, barrel) => {
    const map = barrelMap(root, BARRELS[barrel]);
    const byPart = new Map();
    for (const item of names.split(',').map((x) => x.trim()).filter(Boolean)) {
      const [name, local = name] = item.split(/\s+as\s+/);
      const hit = map.get(name);
      if (!hit) return whole;
      const list = byPart.get(hit.spec) ?? [];
      list.push(hit.imported === 'default' ? { def: local } : { named: local === hit.imported ? hit.imported : `${hit.imported} as ${local}` });
      byPart.set(hit.spec, list);
    }
    return [...byPart].map(([spec, list]) => {
      const def = list.find((x) => x.def)?.def;
      const named = list.filter((x) => x.named).map((x) => x.named);
      return `import ${[def, named.length ? `{ ${named.join(', ')} }` : null].filter(Boolean).join(', ')} from ${q}${spec}${q};`;
    }).join('\n');
  });
}

/** The foundation's stylesheet entry loads every component's styles; a component item brings its own. */
export function stripComponentStyles(file, text) {
  return file === `${LIBRARY}/styles/main.scss` ? text.replace(/^[ \t]*@include meta\.load-css\(\s*["']\.\.\/(?:components|assets|patterns)\/[^\n]*\n/gm, '') : text;
}

export class Refusal extends Error {}

const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const isFile = (root, rel) => { try { return fs.statSync(path.join(root, rel)).isFile(); } catch { return false; } };
const isScss = (f) => f.endsWith('.scss');

/** Line comments (`//`, SCSS and JS) and block comments become spaces, so a commented-out import is not an import and offsets hold. */
function blankComments(file, text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  const noBlock = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  return isScss(file) || /\.m?jsx?$/.test(file) ? noBlock.replace(/(^|[^:'"\w])\/\/[^\n]*/g, (m, pre) => pre + blank(m.slice(pre.length))) : noBlock;
}

/** Every import specifier in a file: `{ spec, start, end }` spans over the specifier text. */
export function importsOf(file, text) {
  text = blankComments(file, text);
  const re = isScss(file) ? SCSS_USE : file.endsWith('.css') ? /(@import\s+(?:url\()?)(['"])([^'"\n]+)\2/g : JS_IMPORT;
  return [...text.matchAll(re)].map((m) => {
    const start = m.index + m[0].lastIndexOf(m[3]);
    return { spec: m[3], start, end: start + m[3].length };
  });
}

/** `@/x` is the library; `.`-led is relative; anything else is a package. */
export function classify(spec) {
  if (spec.startsWith('@/')) return 'alias';
  if (spec.startsWith('.')) return 'relative';
  if (spec.startsWith('sass:') || spec.startsWith('node:')) return 'builtin';
  return 'package';
}

export function packageName(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Resolve a specifier from `from` to a repo-relative file, or null. SCSS also tries the `_partial` name. */
export function resolveImport(root, from, spec) {
  const base = classify(spec) === 'alias' ? path.posix.join(LIBRARY, spec.slice(2)) : path.posix.join(path.posix.dirname(from), spec);
  const dir = path.posix.dirname(base);
  const name = path.posix.basename(base);
  const candidates = isScss(from) ? [`${base}.scss`, path.posix.join(dir, `_${name}.scss`), base] : EXTS.map((e) => base + e);
  return candidates.find((c) => isFile(root, c)) ?? null;
}

/** The component folders the generated index lists: `{ name: 'Button', dir: '…/Button', source }`. */
export function componentList(root) {
  const out = [];
  for (const m of read(root, COMPONENT_INDEX).matchAll(/^- \[(\w+)\]\(\.\.\/\.\.\/(src\/[^)]+)\)/gm)) {
    const doc = path.posix.join('design-system', m[2]);
    const flat = !doc.endsWith('/index.md');
    out.push({ name: m[1], dir: flat ? null : path.posix.dirname(doc), main: flat ? doc.replace(/\.md$/, '.jsx') : null });
  }
  return out;
}

const underFoundation = (file) => FOUNDATION_DIRS.some((d) => file.startsWith(`${LIBRARY}/${d}/`));

/**
 * The closure of `entries` over imports. Returns `{ files, packages, refusals, edges }`:
 * `edges` maps each file to the files it imports, so ownership can split them afterwards.
 */
export function closure(root, entries) {
  const source = (f) => stripComponentStyles(f, expandBarrelImports(root, read(root, f)));
  const files = new Set();
  const edges = new Map();
  const packages = new Set();
  const refusals = [];
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop();
    if (files.has(file)) continue;
    files.add(file);
    const text = source(file);
    if (DEPRECATED_TAG.test(text)) refusals.push(`${file}: marked @deprecated`);
    const deps = [];
    for (const { spec } of importsOf(file, text)) {
      const kind = classify(spec);
      if (kind === 'builtin') continue;
      // Sass resolves a bare name beside the file first (`@use "type"`), so try that before calling it a package.
      const sibling = kind === 'package' && isScss(file) ? resolveImport(root, file, `./${spec}`) : null;
      if (kind === 'package' && !sibling) { packages.add(packageName(spec)); continue; }
      const target = sibling ?? resolveImport(root, file, spec);
      if (!target) { refusals.push(`${file}: imports ${spec}, which does not resolve`); continue; }
      if (!target.startsWith(`${LIBRARY}/`)) { refusals.push(`${file}: imports ${spec}, outside the design system`); continue; }
      if (NOT_SOURCE.test(target)) { refusals.push(`${file}: imports ${spec}, an internal or retired part the registry will not ship`); continue; }
      if (target === `${LIBRARY}/components/index.js` || target === `${LIBRARY}/patterns/index.js`) { refusals.push(`${file}: imports the ${spec} barrel; import the part directly`); continue; }
      deps.push(target);
      queue.push(target);
    }
    edges.set(file, deps);
  }
  return { files: [...files].sort(), edges, packages: [...packages].sort(), refusals };
}

/** Rewrite every library-alias import to a path relative to the file; relative imports stay. */
export function rewriteImports(file, text) {
  const spans = importsOf(file, text).filter((i) => classify(i.spec) === 'alias');
  let out = text;
  for (const { spec, start, end } of spans.reverse()) {
    let rel = path.posix.relative(path.posix.dirname(file), path.posix.join(LIBRARY, spec.slice(2)));
    if (!rel.startsWith('.')) rel = `./${rel}`;
    out = out.slice(0, start) + rel + out.slice(end);
  }
  return out;
}

/** npm versions from the root lockfile: `{ name: version }` for the names asked, throwing on a name the lock lacks. */
export function lockVersions(root, names) {
  const lock = JSON.parse(read(root, 'package-lock.json'));
  const out = {};
  for (const n of names) {
    const v = lock.packages?.[`node_modules/${n}`]?.version;
    if (!v) throw new Refusal(`${n} is imported but the root lockfile does not carry it`);
    out[n] = v;
  }
  return out;
}

const PEERS = new Set(['react', 'react-dom']);
const target = (file) => `${TARGET}/${file.slice(LIBRARY.length + 1)}`;

const FILE_TYPES = [['components/', 'registry:ui'], ['patterns/', 'registry:component'], ['dataviz/', 'registry:component'], ['templates/', 'registry:page']];

function fileEntry(root, file) {
  const content = rewriteImports(file, stripComponentStyles(file, expandBarrelImports(root, read(root, file))));
  const type = file.endsWith('.scss') || file.endsWith('.css') ? 'registry:file' : FILE_TYPES.find(([d]) => file.startsWith(`${LIBRARY}/${d}`))?.[1] ?? 'registry:lib';
  return { path: file, type, content, target: target(file) };
}

/** Where a file belongs: an item's folder or listed files, the foundation, or nowhere in particular (copied with whoever imports it). */
export function ownerOf(file, units, foundation) {
  if (foundation.has(file)) return 'foundation';
  return units.find((c) => c.dir && file.startsWith(`${c.dir}/`))?.name ?? units.find((c) => c.main === file || c.files?.includes(file))?.name ?? null;
}

/** Patterns, as the hand-kept pattern index names them, each at the folder its barrel export comes from. */
export function patternList(root) {
  if (!isFile(root, PATTERN_INDEX) || !isFile(root, `${LIBRARY}/patterns/index.js`)) return [];
  const map = barrelMap(root, `${LIBRARY}/patterns/index.js`);
  // A name the patterns barrel does not export is a component the index points at (Popup), already an item.
  return JSON.parse(read(root, PATTERN_INDEX)).patterns.filter(({ name }) => map.has(name)).map(({ name }) => ({ name, dir: `${LIBRARY}/${map.get(name).spec.slice(2)}`, type: 'registry:component', title: name }));
}

/** Page templates: one folder under `templates/` per item, named for its folder. */
export function templateList(root) {
  const dir = `${LIBRARY}/templates`;
  if (!fs.existsSync(path.join(root, dir))) return [];
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => ({ name: e.name, dir: `${dir}/${e.name}`, type: 'registry:page', title: e.name }));
}

const CHART_THEME = 'chart-theme';
const chartFile = (f) => /\.(jsx?|css)$/.test(f) && !NOT_SOURCE.test(f) && !/^index\.js$/.test(f);

/** Charts: every export of the data-viz barrel, plus one shared theme item holding the helpers each imports. */
export function chartList(root) {
  const barrel = `${LIBRARY}/dataviz/index.js`;
  if (!isFile(root, barrel)) return [];
  const rootFiles = fs.readdirSync(path.join(root, `${LIBRARY}/dataviz`)).filter(chartFile).map((f) => `${LIBRARY}/dataviz/${f}`);
  const charts = [...read(root, barrel).matchAll(/export\s*\{\s*default as (\w+)\s*\}\s*from\s*'\.\/([^']+)'/g)]
    .map((m) => ({ name: m[1], dir: `${LIBRARY}/dataviz/${path.posix.dirname(m[2])}`, type: 'registry:component', title: m[1] }));
  return [{ name: CHART_THEME, files: rootFiles, type: 'registry:lib', title: 'PLUS chart theme', description: 'The data-viz theme, palette and Highcharts setup every PLUS chart shares.' }, ...charts];
}

/** The foundation's files: tokens, the stylesheet entry and its partials, and the lib helpers that stay inside the foundation. */
export function foundationFiles(root) {
  const entries = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (!NOT_SOURCE.test(rel) && /\.(jsx?|mjs|scss|css)$/.test(e.name) && (!rel.startsWith(`${LIBRARY}/styles/`) || /\/(_[^/]+\.scss|main\.scss)$/.test(rel))) entries.push(rel);
    }
  };
  for (const d of FOUNDATION_DIRS) walk(`${LIBRARY}/${d}`);
  // Drop helpers whose closure leaves the foundation (a lib file that imports a component travels with that component).
  const inside = new Set(entries);
  return new Set(entries.filter((f) => {
    const { files } = closure(root, [f]);
    return files.every((x) => inside.has(x) || x === f);
  }));
}

/** Build every item: `{ items: [...], refusals: [...] }`. `release` stamps each item. */
export function buildRegistry(root, release) {
  const components = componentList(root);
  const foundation = foundationFiles(root);
  const refusals = [];
  const stamp = { release };
  if (!foundation.has(`${LIBRARY}/styles/main.scss`)) refusals.push('foundation: styles/main.scss is not self-contained, so the foundation would ship without its stylesheet entry');

  const fclose = closure(root, [...foundation]);
  refusals.push(...fclose.refusals.map((r) => `foundation: ${r}`));
  const fnames = new Set([...foundation]);
  // The copied styles are Sass; the project compiles them, so the foundation brings `sass` (no file imports it by name).
  const items = [{
    name: 'foundation', type: 'registry:lib', title: 'PLUS foundation',
    description: 'Tokens, global styles, fonts, Font Awesome Free setup and the shared helpers every component uses.',
    dependencies: Object.entries(lockVersions(root, [...fclose.packages.filter((p) => !PEERS.has(p)), 'sass'])).map(([n, v]) => `${n}@${v}`),
    registryDependencies: [],
    files: [...fnames].sort().map((f) => fileEntry(root, f)).concat([headSnippet(root)]),
    meta: stamp,
  }];

  const units = [...components.map((c) => ({ ...c, type: 'registry:ui', title: c.name })), ...patternList(root), ...templateList(root), ...chartList(root)];
  const seen = new Set(['foundation']);
  for (const u of units) {
    if (seen.has(u.name)) refusals.push(`${u.name}: more than one registry item has this name`);
    seen.add(u.name);
  }
  for (const c of units) {
    const entries = c.files ?? (c.dir ? walkSource(root, c.dir, c.type !== 'registry:ui') : [c.main, c.main.replace(/\.jsx$/, '.scss')].filter((f) => isFile(root, f)));
    const own = closure(root, entries);
    refusals.push(...own.refusals.map((r) => `${c.name}: ${r}`));
    // Walk from the item's own files, stopping at another item's: a shared helper no item owns travels with whoever imports it.
    const owned = new Set();
    const needs = new Set();
    const walk = [...entries];
    while (walk.length) {
      const f = walk.pop();
      if (owned.has(f)) continue;
      owned.add(f);
      for (const d of own.edges.get(f) ?? []) {
        const o = ownerOf(d, units, fnames);
        if (o === null || o === c.name) walk.push(d);
        else needs.add(o);
      }
    }
    // Every item styles itself on the foundation's tokens: directly, or through an item that does.
    if (!needs.size || c.name === CHART_THEME) needs.add('foundation');
    const deps = lockVersions(root, own.packages.filter((p) => !PEERS.has(p)));
    items.push({
      name: c.name, type: c.type, title: c.title,
      ...(c.description ? { description: c.description } : {}),
      dependencies: Object.entries(deps).map(([n, v]) => `${n}@${v}`),
      registryDependencies: [...needs].sort(),
      files: [...owned].sort().map((f) => fileEntry(root, f)),
      meta: stamp,
    });
  }
  return { items, refusals: [...new Set(refusals)] };
}

/** A pattern's folder also holds docs examples and demos built on the docs chrome; they stay behind (`bare`). */
const EXAMPLE = /\.examples\.|[dD]emo\.jsx$|Cases\.jsx$/;

function walkSource(root, dir, bare = false) {
  const out = [];
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (e.name !== '_internal') out.push(...walkSource(root, rel, bare)); } else if (!NOT_SOURCE.test(rel) && !(bare && EXAMPLE.test(rel)) && /\.(jsx?|scss)$/.test(e.name) && !/\.d\./.test(e.name)) out.push(rel);
  }
  return out;
}

/** The two stylesheet links the project's HTML head needs: the fonts and Font Awesome Free. Read from Storybook's preview head. */
function headSnippet(root) {
  const head = isFile(root, '.storybook/preview-head.html') ? read(root, '.storybook/preview-head.html') : '';
  const links = [...head.matchAll(/<link[^>]*(?:fonts\.googleapis\.com|fontawesome-free)[^>]*>/g)].map((m) => m[0]);
  return { path: `${LIBRARY}/head.html`, type: 'registry:file', target: `${TARGET}/head.html`, content: `<!-- Paste into <head>: the PLUS fonts and Font Awesome Free. -->\n${links.join('\n')}\n` };
}

/** Each item's own files plus its registry dependencies' must hold every relative import. Returns refusals. */
export function verify(items, root) {
  const bundles = new Map(items.map((i) => [i.name, i]));
  const problems = [];
  for (const item of items) {
    const have = new Set();
    const collect = (n, seen = new Set()) => {
      if (seen.has(n)) return;
      seen.add(n);
      for (const f of bundles.get(n)?.files ?? []) have.add(f.target);
      for (const d of bundles.get(n)?.registryDependencies ?? []) collect(d, seen);
    };
    collect(item.name);
    for (const f of item.files) {
      if (!/\.(jsx?|mjs|scss|css)$/.test(f.path)) continue;
      for (const { spec } of importsOf(f.path, f.content)) {
        if (classify(spec) !== 'relative') continue;
        const t = path.posix.join(path.posix.dirname(f.target), spec);
        const ok = [t, `${t}.jsx`, `${t}.js`, `${t}.mjs`, `${t}.scss`, `${t}.css`, `${t}/index.js`, `${t}/index.jsx`, path.posix.join(path.posix.dirname(t), `_${path.posix.basename(t)}.scss`)].some((c) => have.has(c));
        if (!ok) problems.push(`${item.name}: ${f.target} imports ${spec}, which no file of the item or its dependencies provides`);
      }
    }
  }
  return problems;
}
