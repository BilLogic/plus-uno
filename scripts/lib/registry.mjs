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

function fileEntry(root, file) {
  const content = rewriteImports(file, stripComponentStyles(file, expandBarrelImports(root, read(root, file))));
  return { path: file, type: file.endsWith('.scss') || file.endsWith('.css') ? 'registry:file' : file.startsWith(`${LIBRARY}/components/`) ? 'registry:ui' : 'registry:lib', content, target: target(file) };
}

/** Where a file belongs: a component's folder (its item), the foundation, or nowhere in particular (copied with whoever imports it). */
export function ownerOf(file, components, foundation) {
  if (foundation.has(file)) return 'foundation';
  return components.find((c) => c.dir && file.startsWith(`${c.dir}/`))?.name ?? components.find((c) => c.main === file)?.name ?? null;
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
  const items = [{
    name: 'foundation', type: 'registry:lib', title: 'PLUS foundation',
    description: 'Tokens, global styles, fonts, Font Awesome Free setup and the shared helpers every component uses.',
    dependencies: Object.entries(lockVersions(root, fclose.packages.filter((p) => !PEERS.has(p)))).map(([n, v]) => `${n}@${v}`),
    registryDependencies: [],
    files: [...fnames].sort().map((f) => fileEntry(root, f)).concat([headSnippet(root)]),
    meta: stamp,
  }];

  for (const c of components) {
    const entries = c.dir ? walkSource(root, c.dir) : [c.main, c.main.replace(/\.jsx$/, '.scss')].filter((f) => isFile(root, f));
    const own = closure(root, entries);
    refusals.push(...own.refusals.map((r) => `${c.name}: ${r}`));
    const owned = new Set();
    const needs = new Set();
    for (const f of own.files) {
      const o = ownerOf(f, components, fnames);
      if (o === c.name || o === null) owned.add(f);
      else needs.add(o);
    }
    const deps = lockVersions(root, own.packages.filter((p) => !PEERS.has(p)));
    const depFiles = [...needs];
    items.push({
      name: c.name, type: 'registry:ui', title: c.name,
      dependencies: Object.entries(deps).map(([n, v]) => `${n}@${v}`),
      registryDependencies: [...new Set(depFiles.map((n) => (n === 'foundation' ? 'foundation' : n)))].sort(),
      files: [...owned].sort().map((f) => fileEntry(root, f)),
      meta: stamp,
    });
  }
  return { items, refusals: [...new Set(refusals)] };
}

function walkSource(root, dir) {
  const out = [];
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (e.name !== '_internal') out.push(...walkSource(root, rel)); } else if (!NOT_SOURCE.test(rel) && /\.(jsx?|scss)$/.test(e.name) && !/\.d\./.test(e.name)) out.push(rel);
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
