/**
 * `npm run check:doc-identifiers` — every name a docs page uses must exist in
 * source.
 *
 * WHY IT EXISTS. The generated half of the component docs cannot drift: it is
 * derived from propTypes, defaults and SCSS on every run, and
 * `check:component-docs` fails the build if the derivation is stale. The
 * authored half can lie, and the way it lies is by naming something that
 * resolves to nothing. Three of those shipped and were hand-fixed in a single
 * day, 2026-08-25:
 *
 *   #78  elevation.md documented `--elevation-none/-sm/-md/-lg`. The real names
 *        are `--elevation-light-1..5`.                            (0c454cce)
 *   #79  spacing.md's token values contradicted _spacing_semantics.scss. (dbdcf099)
 *   #98  layout.md invented `--size-surface-container-pad-x-sm`.
 *
 * All three are the same defect: a name in prose with no referent in source. An
 * agent reading the page writes `var(--elevation-sm)`, gets no shadow, and has
 * no way to know the doc was wrong. This check is what makes the fourth one
 * impossible to merge.
 *
 * WHAT IT CHECKS. Four claim shapes, extracted by `scripts/doc-identifiers.mjs`
 * and resolved here against source:
 *
 *   token      `--x` in a span, a `var(--x)`, or a `--x:` declaration in a css
 *              fence  →  must be defined in a stylesheet under design-system/.
 *   prop       an attribute in a fenced `<Component ... />` example  →  must be
 *              in that component's propTypes or destructured signature.
 *   variant    a string value for an enum prop, in a fence or written inline as
 *              `size="h1"`  →  must be one of that prop's `oneOf` values.
 *   name       a bare identifier span on a component page — `primaryButton`,
 *              `TagInput`, `plus-btn--icon-only`  →  must be a prop, a
 *              component, a token, an enum value, a standard web/React name, or
 *              appear literally in that component's own source.
 *
 * WHAT IT DELIBERATELY DOES NOT CHECK.
 *
 *   Behaviour. `Select` declares `required`, `onFocus` and `onBlur` and never
 *   wires them (#207); eight components mis-wire `htmlFor` (#206). Those props
 *   EXIST — the docs are right that they are there and right that they do
 *   nothing. Existence is this check's remit; #206 and #207 own the behaviour.
 *   A check that failed on a correctly-documented bug would be teaching authors
 *   to stop documenting bugs.
 *
 *   Bare lowercase words. `active`, `size`, `text` and `loading` are all real
 *   props and all ordinary English. A span holding one is unresolvable from the
 *   span alone, so only the three shapes in `IDENTIFIER_SHAPES` are read as
 *   identifiers. A fabricated single-word lowercase prop named in prose and
 *   nowhere else gets past this gate — the story test is the second net.
 *
 *   Pass-through attributes. Every component here spreads its rest props, so
 *   `aria-pressed`, `data-*` and `onKeyDown` land on the DOM whatever propTypes
 *   says. Naming one is not a claim about the component.
 *
 * Usage:
 *   node scripts/check-doc-identifiers.mjs            fail on any unresolved name
 *   node scripts/check-doc-identifiers.mjs --report   print findings, always exit 0
 *   node scripts/check-doc-identifiers.mjs --stats    print corpus + vocabulary sizes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DOM_EVENTS,
  HTML_ELEMENTS,
  PLATFORM_NAMES,
  STANDARD_ATTRIBUTES,
  definedTokens,
  implSymbol,
  jsxClaims,
  parsePropTypes,
  parseSignatureProps,
  parseSubComponents,
  proseAttrClaims,
  proseNameClaims,
  relativeImports,
  tokenClaims,
} from './doc-identifiers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DS_SRC = path.join(REPO_ROOT, 'design-system/src');
const GUIDELINES = path.join(REPO_ROOT, 'design-system/guidelines');

const REPORT = process.argv.includes('--report');
const STATS = process.argv.includes('--stats');

const rel = (p) => path.relative(REPO_ROOT, p).replace(/\\/g, '/');
const read = (p) => fs.readFileSync(p, 'utf8');
const readIf = (p) => (fs.existsSync(p) ? read(p) : '');

function walk(dir, test, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, test, out);
    else if (test(entry.name)) out.push(full);
  }
  return out;
}

/* ---------------------------------------------------------- source truth */

/**
 * Every CSS custom property defined anywhere under design-system/ or src/.
 * Deliberately wide: a token declared in a component's own SCSS is as real as
 * one in tokens/, and treating it as fabricated would be a false alarm.
 */
function collectTokens() {
  const set = new Set();
  for (const root of [path.join(REPO_ROOT, 'design-system'), path.join(REPO_ROOT, 'src')]) {
    for (const file of walk(root, (n) => /\.(scss|css|sass)$/.test(n))) {
      for (const t of definedTokens(read(file))) set.add(t);
    }
  }
  return set;
}

/**
 * The component index: name → { file, props, subComponents }.
 *
 * Every `<Symbol>.propTypes = { ... }` in every `.jsx` under design-system/src
 * is indexed, not just the one matching the filename. `ListGroupItem` and
 * `CardHeader` are declared inside their parent's file and are reachable from
 * an example as `<ListGroup.Item>` — indexing only file-named symbols made
 * `selectable="single"` look fabricated when it is `ListGroupItem`'s own prop.
 */
function collectComponents() {
  const index = new Map();
  const roots = ['components', 'dataviz', 'patterns', 'specs', 'assets'].map((d) => path.join(DS_SRC, d));
  const files = roots.flatMap((root) =>
    walk(root, (n) => n.endsWith('.jsx') && !/\.(stories|test)\.jsx$/.test(n)),
  );

  for (const file of files) {
    const source = read(file);
    const symbols = new Set([...source.matchAll(/^([A-Z][\w]*)\.propTypes\s*=/gm)].map((m) => m[1]));
    const fileName = path.basename(file, '.jsx');
    if (/^[A-Z]/.test(fileName)) symbols.add(implSymbol(source, fileName));

    for (const symbol of symbols) {
      const props = new Map();
      for (const p of parsePropTypes(source, symbol)) props.set(p.name, p.enumValues);
      for (const p of parseSignatureProps(source, symbol)) if (!props.has(p)) props.set(p, null);
      const entry = { name: symbol, file, symbol, props, subComponents: parseSubComponents(source, symbol) };
      if (!index.has(symbol) || index.get(symbol).props.size < props.size) index.set(symbol, entry);
      // `<Name>` when the file exports the implementation under the filename
      if (symbol !== fileName && /^[A-Z]/.test(fileName) && implSymbol(source, fileName) === symbol) {
        if (!index.has(fileName)) index.set(fileName, { ...entry, name: fileName });
      }
    }
  }

  // `ListGroup.Item` → the symbol it is assigned, so an example resolves.
  for (const entry of [...index.values()]) {
    for (const sub of entry.subComponents) {
      const impl = index.get(sub.impl) ?? index.get(`${entry.name}${sub.name}`);
      if (impl) index.set(`${entry.name}.${sub.name}`, impl);
    }
  }
  return index;
}

/* ---------------------------------------------------------------- corpus */

/**
 * The pages under check. Generated `.md` under components/ is excluded — it
 * carries the generator's header, cannot drift, and is already guarded by
 * `check:component-docs`.
 */
const GENERATED_HEADER = '<!-- DO NOT EDIT BY HAND.';

function collectPages(components) {
  const pages = [];

  for (const file of walk(DS_SRC, (n) => n.endsWith('.mdx'))) {
    const name = path.basename(file, '.mdx');
    const dir = path.dirname(file);
    const component = components.get(name);
    const isOwnPage = component && path.dirname(component.file) === dir;
    pages.push({
      file,
      text: read(file),
      component: isOwnPage ? component : null,
      sourceText: isOwnPage ? pageSourceText(file, dir, name, components) : '',
    });
  }

  for (const file of walk(GUIDELINES, (n) => n.endsWith('.md'))) {
    const text = read(file);
    if (text.startsWith(GENERATED_HEADER)) continue;
    pages.push({ file, text, component: null, sourceText: '' });
  }

  return pages;
}

/**
 * The source a component page is allowed to draw names from:
 *
 *   its own implementation, stylesheet and stories — `handleSelect` and
 *   `scrollable-region-focusable` are real names inside `Select.jsx` and
 *   `Modal.jsx`, and a page explaining internals is not fabricating;
 *   the demo modules the page imports — Button's variant tables live in
 *   `button-segmented-demos.jsx`, not in Button.jsx;
 *   the source of every component the page names — Select's page says its
 *   chips carry a hard-coded `Dismiss` label, which is a string in `Badge.jsx`,
 *   the component Select renders.
 */
function pageSourceText(mdxFile, dir, name, components) {
  const text = read(mdxFile);
  const parts = [];
  for (const ext of ['.jsx', '.scss', '.stories.jsx', '.module.scss']) {
    parts.push(readIf(path.join(dir, `${name}${ext}`)));
  }
  for (const spec of relativeImports(text)) {
    const resolved = path.resolve(dir, spec);
    for (const candidate of [resolved, `${resolved}.jsx`, `${resolved}.js`]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        parts.push(read(candidate));
        break;
      }
    }
  }
  for (const named of new Set(text.match(/`([A-Z][A-Za-z0-9]+)`/g) ?? [])) {
    const target = components.get(named.replace(/`/g, ''));
    if (target && target.file !== path.join(dir, `${name}.jsx`)) parts.push(read(target.file));
  }
  return parts.join('\n');
}

/* -------------------------------------------------------------- checking */

const isPassThrough = (attr) =>
  STANDARD_ATTRIBUTES.has(attr) ||
  /^(aria|data)-/.test(attr) ||
  DOM_EVENTS.has(attr) ||
  attr.startsWith('...');

function check() {
  const tokens = collectTokens();
  const components = collectComponents();

  const allProps = new Set();
  const allEnumValues = new Set();
  const allSubComponents = new Set();
  for (const c of components.values()) {
    for (const [prop, values] of c.props) {
      allProps.add(prop);
      for (const v of values ?? []) allEnumValues.add(v);
    }
    for (const s of c.subComponents) allSubComponents.add(s.name);
  }

  // `forms-and-inputs`, `layout-and-structure` — the group a page belongs to is
  // a real name in this repo, spelled exactly like a kebab-case enum value.
  const folderNames = new Set();
  const collectDirs = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      folderNames.add(entry.name);
      collectDirs(path.join(dir, entry.name));
    }
  };
  collectDirs(DS_SRC);
  collectDirs(GUIDELINES);

  /**
   * Runs of segments inside real token names. The colour roles are referred to
   * by role — "additive `on-surface` overlays" — and `--color-on-surface` is
   * where that role is defined. A run that appears in no token name is still a
   * fabrication.
   */
  const tokenSegments = new Set();
  for (const token of tokens) {
    const parts = token.replace(/^--/, '').split('-');
    for (let i = 0; i < parts.length; i += 1) {
      for (let j = i + 2; j <= parts.length; j += 1) tokenSegments.add(parts.slice(i, j).join('-'));
    }
  }

  const cssClasses = new Set();
  for (const file of walk(path.join(REPO_ROOT, 'design-system'), (n) => /\.(scss|css)$/.test(n))) {
    for (const m of read(file).matchAll(/\.([a-z][a-z0-9]*(?:-{1,2}[a-z0-9]+)+)/g)) cssClasses.add(m[1]);
  }

  const pages = collectPages(components);
  const findings = [];
  const record = (page, line, kind, identifier, message) =>
    findings.push({ file: rel(page.file), line, kind, identifier, message });

  for (const page of pages) {
    /* ---- tokens: every page, every position ---- */
    for (const claim of tokenClaims(page.text)) {
      if (tokens.has(claim.name)) continue;
      record(page, claim.line, 'token', claim.name, 'is not defined in any stylesheet under design-system/');
    }

    /* ---- props and variants in fenced JSX examples ---- */
    for (const el of jsxClaims(page.text)) {
      if (el.markedIncorrect) continue;
      const target = components.get(el.tag);
      if (!target || target.props.size === 0) continue;
      for (const attr of el.attrs) {
        if (isPassThrough(attr.name)) continue;
        if (!target.props.has(attr.name)) {
          record(page, el.line, 'prop', `<${el.tag} ${attr.name}=…>`,
            `${attr.name} is not a prop of ${el.tag} (${rel(target.file)})`);
          continue;
        }
        const enumValues = target.props.get(attr.name);
        if (enumValues?.length && attr.value !== null && !enumValues.includes(attr.value)) {
          record(page, el.line, 'variant', `<${el.tag} ${attr.name}="${attr.value}">`,
            `is not one of ${enumValues.map((v) => `"${v}"`).join(', ')}`);
        }
      }
    }

    /* ---- inline `prop="value"` claims in prose ---- */
    for (const claim of proseAttrClaims(page.text)) {
      if (isPassThrough(claim.prop)) continue;
      if (!allProps.has(claim.prop)) {
        record(page, claim.line, 'prop', `${claim.prop}="${claim.value}"`,
          'is written as a prop but is not a prop of any component in design-system/src');
        continue;
      }
      // A prose span carries no element, so the owner is whichever component
      // the page is about — and when the page is about none (a guidelines
      // page), the legal set is every value any component gives that prop.
      const owner = page.component?.props.has(claim.prop) ? page.component : null;
      const legal = owner
        ? owner.props.get(claim.prop)
        : unionEnum(components, claim.prop);
      if (legal?.length && !legal.includes(claim.value)) {
        record(page, claim.line, 'variant', `${claim.prop}="${claim.value}"`,
          owner
            ? `is not one of ${owner.name}'s ${claim.prop} values: ${legal.map((v) => `"${v}"`).join(', ')}`
            : `is not a ${claim.prop} value on any component: ${legal.map((v) => `"${v}"`).join(', ')}`);
      }
    }

    /* ---- bare identifier spans, component pages only ---- */
    if (!page.component) continue;
    for (const claim of proseNameClaims(page.text)) {
      if (
        allProps.has(claim.name) ||
        components.has(claim.name) ||
        allSubComponents.has(claim.name) ||
        allEnumValues.has(claim.name) ||
        tokens.has(claim.name) ||
        tokenSegments.has(claim.name) ||
        cssClasses.has(claim.name) ||
        folderNames.has(claim.name) ||
        STANDARD_ATTRIBUTES.has(claim.name) ||
        PLATFORM_NAMES.has(claim.name) ||
        HTML_ELEMENTS.has(claim.name) ||
        /^(aria|data)-/.test(claim.name) ||
        DOM_EVENTS.has(claim.name) ||
        appearsInSource(page.sourceText, claim.name)
      ) {
        continue;
      }
      record(page, claim.line, 'name', claim.name,
        `resolves to nothing: not a prop, component, token, enum value or standard attribute, ` +
          `and does not appear in ${page.component.name}'s own source`);
    }
  }

  return { findings, pages, tokens, components };
}

/**
 * Every value any component gives an enum prop of this name. Null when no
 * component declares it as an enum — a free-form prop has no illegal value.
 */
function unionEnum(components, prop) {
  const values = new Set();
  let sawEnum = false;
  for (const c of components.values()) {
    const v = c.props.get(prop);
    if (v?.length) { sawEnum = true; for (const x of v) values.add(x); }
  }
  return sawEnum ? [...values] : null;
}

const appearsInSource = (source, name) =>
  source.length > 0 && new RegExp(`(^|[^\\w-])${escapeRe(name)}([^\\w-]|$)`).test(source);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* --------------------------------------------------------------- reporting */

const { findings, pages, tokens, components } = check();

if (STATS) {
  console.log(`pages         ${pages.length} (${pages.filter((p) => p.component).length} with a component context)`);
  console.log(`components    ${components.size}`);
  console.log(`tokens        ${tokens.size}`);
  console.log(`findings      ${findings.length}`);
}

const byKind = findings.reduce((acc, f) => ({ ...acc, [f.kind]: (acc[f.kind] ?? 0) + 1 }), {});

if (!findings.length) {
  console.log(
    `✓ check:doc-identifiers — every name in ${pages.length} docs pages resolves ` +
      `(${tokens.size} tokens, ${components.size} components)`,
  );
  process.exit(0);
}

const grouped = new Map();
for (const f of findings) {
  if (!grouped.has(f.file)) grouped.set(f.file, []);
  grouped.get(f.file).push(f);
}

const out = REPORT ? console.log : console.error;
for (const [file, list] of [...grouped].sort()) {
  out(`\n${file}`);
  for (const f of list.sort((a, b) => a.line - b.line)) {
    out(`  ${String(f.line).padStart(4)}  ${f.kind.padEnd(8)} ${f.identifier}`);
    out(`        ${f.message}`);
  }
}

const summary =
  `${findings.length} unresolved name(s) across ${grouped.size} page(s) — ` +
  Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ');

if (REPORT) {
  console.log(`\n${summary}`);
  process.exit(0);
}

console.error(
  `\n${'─'.repeat(72)}\n✗ check:doc-identifiers — ${summary}` +
    '\n\n  -> Each line above names the page, the line and the identifier that has no' +
    '\n     referent. Fix the page to use the real name, or add the missing prop,' +
    '\n     token or variant to the source the page is describing.',
);
process.exit(1);
