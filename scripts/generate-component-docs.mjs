/**
 * Generate the per-component agent doc, the per-group index and the
 * components manifest.
 *
 *   design-system/src/components/<group>/<Name>/index.md   ← per component (`<group>/<Name>.md` when filed flat)
 *   design-system/src/patterns/<Folder>/index.md           ← per pattern, and PageLayout and the Logo beside their source
 *   design-system/src/components/<group>/index.md          ← group index + coverage
 *   design-system/agent-views/components.json              ← the manifest
 *
 * The facts are derived from source that is maintained for its own reasons —
 * propTypes, destructured defaults, JSDoc, story argTypes, SCSS token usage —
 * and parsed into the manifest first. Each doc is then rendered from that
 * in-memory manifest and the component's docs page, by the one render the
 * DS lookup's `get` returns (`scripts/lib/component-render.mjs`), so the file
 * and `get` agree byte for byte. The authored half (Usage, Alternatives, rules,
 * accessibility) is the page's, carried over and never written here; what is
 * missing is counted in the group index.
 *
 * Usage:
 *   node scripts/generate-component-docs.mjs
 *   node scripts/generate-component-docs.mjs --check   (CI: fail if stale, write nothing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { documents } from './lib/corpus.mjs';
import { AUTHORED_SECTIONS, coverageOf } from './lib/authored-coverage.mjs';
import { GENERATED_HEADER, componentFacts, docPathOf, renderComponent } from './lib/component-render.mjs';
import { createPageFinder, readDocsPage } from './lib/docs-page.mjs';
import { resolveNamedOneOf } from './doc-identifiers.mjs';
import { varReferencePattern } from '../design-system/src/lib/tokens.mjs';
import { readBarrel } from './lib/ds-facts.mjs';
import { searchAliases } from './lib/ds-vocabulary.mjs';
import { buildComponentsManifest, serializeManifest } from './lib/agent-manifests.mjs';
import { AGENT_ROOT } from './agent-views-paths.js';
import { enumValuesOf } from './lib/enum-values.mjs';
import { coverage as coverageTotals, describeGap, gapKeys } from './lib/doc-coverage.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_ROOT = path.join(REPO_ROOT, 'design-system/src/components');
const CHECK = process.argv.includes('--check');
const UPDATE = process.argv.includes('--update');
const BASELINE = 'scripts/baselines/component-docs.json';
/** Every folder a generated doc is written under: the components, the pattern barrels' folders, the assets. */
const DOC_ROOTS = ['components', 'patterns', 'specs/Universal/Pages', 'assets'].map((d) => path.join(REPO_ROOT, 'design-system/src', d));
/** The record's own explanation, written once when `--update` creates it; the file is its home after that. */
const RECORD_WHY =
  'Prop rows and components the generated component docs leave undescribed, as `<Component> <prop>` or `<Component> (summary)`. ' +
  'A gap may leave the record and none may join it: a new component or prop ships described. ' +
  'Regenerate with `npm run generate:component-docs -- --update`; never edit by hand.';

/**
 * Groups are the folders directly under components/, minus the barrel files.
 * Each folder is a category from `storybook.taxonomy.json` in kebab case, so
 * the title is read from there rather than listed a second time;
 * `check:storybook-categories` holds folders and taxonomy together.
 */
const GROUP_TITLES = {
  ...Object.fromEntries(
    Object.keys(
      JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'storybook.taxonomy.json'), 'utf8')).componentGroups,
    ).map((category) => [category.toLowerCase().replace(/ /g, '-'), category]),
  ),
  _internal: 'Internal',
};

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
  failed = true;
};

/* ------------------------------------------------------------------ parsing */

/** The JSDoc block immediately above `export const <Name> =` / `const <Name> =`. */
function jsdocFor(source, name) {
  const decl = new RegExp(`(?:export\\s+)?(?:const\\s+${name}\\s*=|function\\s+${name}\\s*\\()`, 'g');
  let declIndex = -1;
  for (const m of source.matchAll(decl)) declIndex = m.index;
  if (declIndex === -1) return '';

  // nearest preceding /** ... */, and only if nothing but whitespace separates them
  const before = source.slice(0, declIndex);
  const close = before.lastIndexOf('*/');
  if (close === -1 || before.slice(close + 2).trim() !== '') return '';
  const open = before.lastIndexOf('/**', close);
  if (open === -1) return '';

  const lines = before
    .slice(open + 3, close)
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'));
  // A first line that is only a title ("<Name> Component") is not a description; one that goes on ("<Name>: a …", "<Name> — …") is.
  if (lines[0] && new RegExp(`^${name}\\b`, 'i').test(lines[0]) && !new RegExp(`^${name}\\s*[:—–-]\\s`, 'i').test(lines[0]) && lines.length > 1) lines.shift();
  return lines.join(' ').trim();
}

/**
 * The symbol the component is actually implemented as.
 *
 * The filename is not reliable: StaticBadgeSmart.jsx implements `SmartBadges`
 * and re-exports it under the file's name, and RadioButtonGroup.jsx implements
 * `Scale`. Assuming filename === symbol made both emit no Props section at all
 * — a silent under-report, which is the defect class this generator exists to
 * make impossible.
 */
function implSymbol(source, fileName) {
  if (new RegExp(`\\b${fileName}\\.propTypes\\s*=`).test(source)) return fileName;

  // `export { X as <fileName> }` — the alias points at the implementation
  const aliased = source.match(new RegExp(`export\\s*\\{\\s*(\\w+)\\s+as\\s+${fileName}\\s*\\}`));
  if (aliased) return aliased[1];

  // `export default X`
  const def = source.match(/export\s+default\s+(\w+)\s*;/);
  if (def) return def[1];

  return fileName;
}

/**
 * `<Name>.propTypes = { ... }` → [{ name, type, enumValues }].
 *
 * Returns null when the block exists but cannot be read, so the caller can fail
 * the build. An empty props table for a component that has props is the same
 * class of defect as an index that silently under-reports.
 */
function parsePropTypes(source, name) {
  const marker = `${name}.propTypes`;
  const at = source.indexOf(marker);
  if (at === -1) return [];
  const open = source.indexOf('{', at);
  const close = matchBrace(source, open);
  if (close === -1) return null;
  const body = source.slice(open + 1, close);

  // Split at depth-0 commas, keeping each entry's leading /** ... */ as its
  // description. Splitting on a regex instead dropped 3 of StaticBadgeSmart's
  // 4 props, because a JSDoc comment sits between every pair.
  //
  // A COMMENT IS ATOMIC, and that is what `inBlockComment` is for. Without it
  // this scanner reads the PROSE inside a JSDoc as source: depth is 0 while
  // scanning a comment, so the comma in "A color square, for a tag acting as a
  // chart legend entry" split the entry in two. Neither half survived — the
  // first has an unterminated `/**` and no `name:`, the second has a stray `*/`
  // and starts mid-sentence, so both failed the `^propName:` match below and
  // were dropped by `continue`. The prop then vanished from the generated page
  // with no error anywhere.
  //
  // It was silent because it deleted the DOCUMENTATION rather than the prop:
  // the component kept working, the table just stopped mentioning a prop it
  // had. Measured across the repo when this was found: 17 props on 7
  // components, 11 of them on `Tag` and `BadgeVariants` — the two components
  // #276 exists to document, whose props are the most heavily commented in the
  // corpus and so the most exposed to it.
  //
  // `//` line comments have the same latent flaw and no component source
  // exercises it today. Left alone deliberately rather than fixed blind: a fix
  // for a case with no example is a guess.
  //
  // WHERE THIS IS TESTED, since it is not here. This module runs its work in
  // its body with no `main()` guard, so importing it to unit-test the parser
  // would run the generator — nothing can import `parsePropTypes` from it. Two
  // things cover it instead, and both are real:
  //   1. `scripts/doc-identifiers.mjs` had this defect independently, in its
  //      own copy of the same scan. That copy IS exported, and
  //      `check-doc-identifiers.test.mjs` now asserts the comma case directly.
  //   2. The generated `.md` files are committed and `check:component-docs`
  //      compares them to a fresh run, so reintroducing this here turns that
  //      check red on the 7 files whose props would vanish again.
  const entries = [];
  let depth = 0;
  let buf = '';
  let inBlockComment = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (inBlockComment) {
      buf += ch;
      if (ch === '*' && body[i + 1] === '/') {
        buf += '/';
        i += 1;
        inBlockComment = false;
      }
      continue;
    }
    if (ch === '/' && body[i + 1] === '*') {
      inBlockComment = true;
      buf += ch;
      continue;
    }
    if ('([{'.includes(ch)) depth += 1;
    else if (')]}'.includes(ch)) depth -= 1;
    if (ch === ',' && depth === 0) {
      entries.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) entries.push(buf);

  const props = [];
  for (const raw of entries) {
    const jsdoc = raw.match(/\/\*\*([\s\S]*?)\*\//);
    const description = jsdoc
      ? jsdoc[1].replace(/\s*\*\s?/g, ' ').replace(/\s+/g, ' ').trim()
      : '';
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim();
    if (!cleaned) continue;
    const m = cleaned.match(/^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
    if (!m) continue;
    // `PropTypes.oneOf(STYLES)` names an array; when this file declares it and
    // every element is a literal, it is documented as if written inline. An
    // array that cannot be read (a spread, an import) stays `oneOf(NAME)`.
    const type = resolveNamedOneOf(m[2].replace(/\s+/g, ' ').trim(), source);
    const oneOf = type.match(/^PropTypes\.oneOf\(\[([\s\S]*?)\]\)/);
    props.push({
      name: m[1],
      raw: type,
      type: prettyType(type),
      description,
      enumValues: oneOf
        ? [...oneOf[1].matchAll(/'([^']+)'|(?<![\w.'])(-?\d+(?:\.\d+)?)(?![\w.'])/g)].map((v) => v[1] ?? v[2])
        : null,
    });
  }
  return props;
}

function prettyType(raw) {
  // A union is read first: `oneOfType([string, oneOf([false])])` holds an
  // inline oneOf but is not an enum.
  if (/^PropTypes\.oneOfType/.test(raw)) {
    const inner = [...raw.matchAll(/PropTypes\.(\w+)/g)]
      .map((m) => m[1])
      .filter((t) => t !== 'oneOfType')
      .map((t) => (t === 'oneOf' ? 'enum' : t));
    return [...new Set(inner)].join(' or ');
  }
  if (/PropTypes\.oneOf\(\[/.test(raw)) return 'enum';
  const simple = raw.match(/PropTypes\.(\w+)/);
  let t = simple ? simple[1] : raw;
  if (/\.isRequired/.test(raw)) t += ' (required)';
  return t;
}

/** Defaults from the destructured signature: `style = 'primary',`. */
function parseDefaults(source, name) {
  const sig = source.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*\\(\\{([\\s\\S]*?)\\}\\s*\\)`, 'm'));
  if (!sig) return {};
  const out = {};
  for (const m of sig[1].matchAll(/([A-Za-z_$][\w$]*)\s*=\s*([^,\n]+)/g)) {
    out[m[1]] = m[2].replace(/\/\/.*$/, '').trim();
  }
  return out;
}

/** `description:` strings from the stories file's argTypes — authored, and already maintained. */
function parseArgTypeDescriptions(storiesSource) {
  const out = {};
  if (!storiesSource) return out;
  const at = storiesSource.indexOf('argTypes:');
  if (at === -1) return out;

  const blockOpen = storiesSource.indexOf('{', at);
  const blockEnd = matchBrace(storiesSource, blockOpen);
  if (blockEnd === -1) return out;
  const body = storiesSource.slice(blockOpen + 1, blockEnd);

  // walk entries at depth 0 of the argTypes object: `name: { ... }`
  const entry = /([A-Za-z_$][\w$]*)\s*:\s*\{/g;
  let m;
  while ((m = entry.exec(body)) !== null) {
    const open = m.index + m[0].length - 1;
    const end = matchBrace(body, open);
    if (end === -1) break;
    const inner = body.slice(open + 1, end);
    // only the description of THIS prop, not one nested inside table:{}
    const desc = inner.match(/description:\s*'((?:[^'\\]|\\.)*)'|description:\s*"((?:[^"\\]|\\.)*)"/);
    if (desc) out[m[1]] = (desc[1] || desc[2]).trim();
    entry.lastIndex = end + 1;
  }
  return out;
}

/** Index of the `}` matching the `{` at `open`, or -1. */
function matchBrace(src, open) {
  if (src[open] !== '{') return -1;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * `ListGroup.Item = ListGroupItem` — a sub-component an agent can call as
 * `<ListGroup.Item>`. Its props live on the assigned symbol, so without this
 * the doc says nothing about a name the component genuinely exposes.
 */
function subComponents(source, symbol) {
  const out = [];
  const re = new RegExp(`^${symbol}\\.([A-Z]\\w*)\\s*=\\s*(\\w+)\\s*;`, 'gm');
  for (const m of source.matchAll(re)) out.push({ name: m[1], impl: m[2] });
  return out;
}

const storyExports = (src) =>
  src ? [...src.matchAll(/^export const ([A-Za-z0-9_]+)/gm)].map((m) => m[1]) : [];

/** Every token the component's stylesheet uses. Grammar from the module (#507). */
const scssTokens = (src) =>
  src ? [...new Set([...src.matchAll(varReferencePattern())].map((m) => m[1]))].sort() : [];

/* ---------------------------------------------------------------- discovery */

function discover() {
  const groups = [];
  for (const groupName of fs.readdirSync(COMPONENTS_ROOT).sort()) {
    const groupDir = path.join(COMPONENTS_ROOT, groupName);
    if (!fs.statSync(groupDir).isDirectory()) continue;

    const components = [];
    for (const entry of fs.readdirSync(groupDir).sort()) {
      const full = path.join(groupDir, entry);
      // A component is either <Name>/<Name>.jsx or a flat <Name>.jsx.
      if (fs.statSync(full).isDirectory()) {
        const name = entry;
        if (fs.existsSync(path.join(full, `${name}.jsx`))) {
          components.push({ name, dir: full, jsx: path.join(full, `${name}.jsx`), flat: false });
        }
      } else if (entry.endsWith('.jsx') && !/\.(stories|test)\.jsx$/.test(entry) && /^[A-Z]/.test(entry)) {
        const name = entry.replace(/\.jsx$/, '');
        components.push({ name, dir: groupDir, jsx: full, flat: true });
      }
    }
    if (components.length) groups.push({ name: groupName, dir: groupDir, components });
  }
  return groups;
}

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const readOrNull = (p) => (fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p, 'utf8') : null);
/** The import aliases `vite.config.js` declares for design-system source. */
const ENUM_ALIAS = { alias: { '@plus-ds': path.join(REPO_ROOT, 'design-system/src'), '@': path.join(REPO_ROOT, 'design-system/src') } };
const rel = (p) => path.relative(REPO_ROOT, p).replace(/\\/g, '/');

/* ------------------------------------------------------------------ parsing a component */

/**
 * One component or pattern parsed from source: its manifest entry, with the
 * facts its generated doc carries beyond props under `doc`
 * (`scripts/lib/component-render.mjs`), and its description gaps. Null when
 * its props cannot be read, after failing the run.
 */
function parseEntry({ name, group, jsx }) {
  const source = fs.readFileSync(jsx, 'utf8');
  const base = jsx.replace(/\.jsx$/, '');
  const stories = readIf(`${base}.stories.jsx`);
  const scss = readIf(`${base}.scss`);

  const symbol = implSymbol(source, name);
  const props = parsePropTypes(source, symbol);
  if (props === null) {
    fail(`${rel(jsx)}: ${symbol}.propTypes is present but unbalanced — refusing to emit an empty props table`);
    return null;
  }
  if (!props.length && /\.propTypes\s*=/.test(source)) {
    fail(
      `${rel(jsx)}: the file declares propTypes but none resolve to \`${symbol}\` — ` +
        `the props table would be silently empty. Name the implementation ${name}, or teach implSymbol() this shape.`
    );
    return null;
  }
  const summary = jsdocFor(source, symbol);
  const gaps = { rows: props.length, summary: !summary, props: props.filter((p) => !p.description).map((p) => p.name) };
  const subs = subComponents(source, symbol).map((sub) => {
    const subProps = parsePropTypes(source, sub.impl) || [];
    gaps.rows += subProps.length;
    for (const sp of subProps) if (!sp.description) gaps.props.push(`${sub.name}.${sp.name}`);
    return {
      name: sub.name,
      impl: sub.impl,
      props: subProps.map((sp) => ({ name: sp.name, type: sp.type.replace(/\s*\(required\)$/, ''), required: /\(required\)$/.test(sp.type), default: null, description: sp.description || null })),
    };
  });
  const tokens = scssTokens(scss);
  const entry = manifestEntryOf({ name, group, jsx, summary, props, defaults: parseDefaults(source, symbol), descriptions: parseArgTypeDescriptions(stories) });
  // Only what is there: the manifest carries no empty field for each of these.
  entry.doc = {
    ...(symbol !== name ? { implementedAs: symbol } : {}),
    ...(stories ? { stories: storyExports(stories) } : {}),
    ...(tokens.length ? { tokens } : {}),
    ...(subs.length ? { subComponents: subs } : {}),
  };
  return { entry, gaps };
}

/** The machine record for one parsed component or pattern (`scripts/lib/agent-manifests.mjs`). */
function manifestEntryOf({ name, group, jsx, summary, props, defaults, descriptions }) {
  return {
    name,
    group,
    source: rel(jsx),
    summary: summary || null,
    // An enum whose list lives in another file is read there, so a checker can
    // hold the prop to it (scripts/lib/enum-values.mjs).
    // A union (`oneOfType([oneOf([...]), number])`) also accepts its other
    // members, so its listed values are not the whole set: no list is given.
    props: props.map((p) => {
      if (/^PropTypes\.oneOfType/.test(p.raw)) return { ...p, enumValues: null };
      if (p.enumValues && p.enumValues.length) return p;
      return { ...p, enumValues: enumValuesOf(p.raw, jsx, readOrNull, ENUM_ALIAS) };
    }),
    defaults,
    descriptions,
  };
}

/**
 * The barrels patterns come from: the patterns, and the page templates
 * `PageLayout` comes from. Each gets a generated doc beside its source, as a
 * component does.
 */
const PATTERN_BARRELS = ['@/patterns', '@/specs/Universal/Pages'];

/**
 * Each pattern barrel's components, parsed from source the way a component
 * is. A pattern's file is named for the folder its barrel line points at, not
 * for its export: `PatternSidebar` is `patterns/Sidebar/Sidebar.jsx`.
 */
function patternEntries() {
  const patterns = [];
  const parsed = [];
  for (const spec of PATTERN_BARRELS) {
    const dir = path.join(REPO_ROOT, 'design-system/src', spec.slice(2));
    const { components, aliases } = readBarrel(REPO_ROOT, spec, {
      onUnresolved: (star) => fail(`${spec} barrel: cannot resolve \`export * from '${star}'\``),
    });
    for (const name of components) {
      patterns.push({ name, from: spec });
      const folder = aliases[name] ?? name;
      const jsx = path.join(dir, folder, `${folder}.jsx`);
      if (!fs.existsSync(jsx)) {
        fail(`${spec} exports ${name}, and ${rel(jsx)} is not a file: its props cannot be read`);
        continue;
      }
      const built = parseEntry({ name, group: path.basename(dir).toLowerCase(), jsx });
      if (built) parsed.push(built.entry);
    }
  }
  return { patterns, parsed };
}

/**
 * Barrel components implemented outside src/components/, in
 * src/assets/<Name>/<Name>.jsx (the Logo), parsed the way a component is.
 */
function assetEntries(exports, known) {
  const out = [];
  for (const name of exports) {
    if (known.has(name)) continue;
    const jsx = path.join(REPO_ROOT, 'design-system/src/assets', name, `${name}.jsx`);
    if (!fs.existsSync(jsx)) continue;
    const built = parseEntry({ name, group: 'assets', jsx });
    if (built) out.push(built.entry);
  }
  return out;
}

function groupIndex(group, results) {
  const title = GROUP_TITLES[group.name] || group.name;
  let d = `<!-- DO NOT EDIT BY HAND. Generated by npm run generate:component-docs -->\n\n`;
  d += `# ${title}\n\n`;
  d += `${group.components.length} component${group.components.length === 1 ? '' : 's'}. `;
  d += `Each row links to the generated facts; the three columns after it are the\n`;
  d += `authored half, counted rather than assumed.\n\n`;
  d += `| Component | Props | ${AUTHORED_SECTIONS.map((s) => s.label).join(' | ')} |\n`;
  d += `|-----------|------:|${AUTHORED_SECTIONS.map(() => ':---:').join('|')}|\n`;

  const totals = Object.fromEntries(AUTHORED_SECTIONS.map((s) => [s.key, 0]));
  for (const c of group.components) {
    const r = results[c.name];
    if (!r) continue;
    const link = c.flat ? `${c.name}.md` : `${c.name}/index.md`;
    const cells = AUTHORED_SECTIONS.map((s) => {
      if (r.coverage[s.key]) totals[s.key] += 1;
      return r.coverage[s.key] ? '✅' : '✕';
    });
    d += `| [${c.name}](${link}) | ${r.propCount} | ${cells.join(' | ')} |\n`;
  }

  const n = group.components.length;
  d += `\n**Authored coverage:** `;
  d += AUTHORED_SECTIONS.map((s) => `${s.label} ${totals[s.key]}/${n} (${Math.round((100 * totals[s.key]) / n)}%)`).join(' · ');
  d += `\n\n✕ means the section is not written. It is omitted from the component page\n`;
  d += `rather than stubbed — a missing section says nothing, and a stub says\n`;
  d += `something false.\n`;
  return d;
}

/* --------------------------------------------------------------------- main */

const groups = discover();
const written = [];
const manifestEntries = [];
const gapsByComponent = {};
let stale = 0;
let described = 0;
let failed = false;

const parsedByName = new Map();
for (const group of groups) {
  for (const c of group.components) {
    const built = parseEntry({ name: c.name, group: group.name, jsx: c.jsx });
    if (!built) continue;
    parsedByName.set(c.name, built.entry);
    manifestEntries.push(built.entry);
    gapsByComponent[c.name] = built.gaps;
  }
}

/**
 * The machine copy of the same facts, for checkers and the eval
 * (`scripts/lib/agent-manifests.mjs`). Keyed to the barrels, so it lists exactly
 * what `agent-views/components/index.md` lists: the components, then the
 * patterns and `PageLayout` from theirs.
 */
const { components: exports } = readBarrel(REPO_ROOT, '@/components', {
  onUnresolved: (spec) => fail(`components barrel: cannot resolve \`export * from '${spec}'\``),
});
// The design system ships from this repo's root package; its version is the one to stamp.
const { version } = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
const { patterns, parsed: parsedPatterns } = patternEntries();
manifestEntries.push(...assetEntries(exports, new Set(manifestEntries.map((e) => e.name))));
const manifest = buildComponentsManifest({ exports, components: manifestEntries, patterns, parsedPatterns, version });
written.push([path.join(AGENT_ROOT, 'components.json'), serializeManifest(manifest, 'npm run generate:agent')]);

/**
 * Each doc is rendered from the manifest built above, in memory, never the
 * one the last run wrote: the same render the lookup's `get` returns
 * (`scripts/lib/component-render.mjs`). A component the barrel does not export
 * has no record there; it is rendered from its own parse, with no import.
 */
const registry = JSON.parse(readIf(path.join(REPO_ROOT, 'design-system/figma/component-registry.json')) || '{}');
const findPage = createPageFinder(REPO_ROOT, registry);
/** The words each component is asked by: `agent-views/_aliases.json`, then the glossary's design-system avoid-words. */
const { rows: aliasRows } = searchAliases(readIf(path.join(REPO_ROOT, 'GLOSSARY.md')) || '', {
  names: manifest.components.map((c) => c.name),
  notHere: (JSON.parse(readIf(path.join(AGENT_ROOT, '_inventions.json')) || '{}').components ?? []).map((r) => r.not),
  handAliases: JSON.parse(readIf(path.join(AGENT_ROOT, '_aliases.json')) || '{}').components ?? {},
});
const docsOf = (record) => {
  const page = findPage({ name: record.name, source: record.source });
  return page ? { path: page, page: readDocsPage(fs.readFileSync(path.join(REPO_ROOT, page), 'utf8')) } : null;
};
const rendered = new Map();
const renderOne = (facts) => {
  const docs = docsOf(facts);
  written.push([path.join(REPO_ROOT, docPathOf(facts)), renderComponent(facts, docs)]);
  rendered.set(facts.name, { coverage: coverageOf(docs?.page), propCount: (facts.props ?? []).length });
};
for (const record of manifest.components) if (record.source) renderOne(componentFacts(manifest, record.name, aliasRows));
for (const [name, entry] of parsedByName) {
  if (rendered.has(name)) continue;
  const [record] = buildComponentsManifest({ exports: [name], components: [entry], version }).components;
  renderOne({ ...componentFacts({ components: [...manifest.components, record] }, name, aliasRows), import: null });
}
for (const group of groups) written.push([path.join(group.dir, 'index.md'), groupIndex(group, Object.fromEntries(rendered))]);

/**
 * Description coverage, held by the ratchet (`scripts/lib/doc-coverage.mjs`).
 * A gap the record does not hold fails every mode. A filled gap is stale until
 * `--update` takes it off the record; `--update` refuses to record a new gap.
 */
{
  const keys = gapKeys(gapsByComponent);
  const ratchet = openRatchet({ file: BASELINE, repoRoot: REPO_ROOT });
  const totals = coverageTotals(gapsByComponent);
  console.log(`  prop descriptions: ${totals.described}/${totals.rows} rows (${totals.percent}%) · ${totals.summaries} component(s) without a summary`);
  // `--update` writes a record that is absent; it never writes one a new gap is in.
  const failures = UPDATE && ratchet.absent ? [] : ratchet.failures(keys);
  for (const f of failures) fail(f.kind === 'absent' ? f.message : describeGap(f.key));
  if (UPDATE && !failures.length) {
    ratchet.update(keys, {
      seed: { why: RECORD_WHY },
    });
  } else if (!UPDATE) {
    for (const { key } of ratchet.stale(keys)) {
      if (CHECK) {
        console.error(`✗ described now: ${key}`);
        described += 1;
      }
    }
  }
}

/**
 * A component that is deleted must take its doc with it. Only files carrying
 * this generator's header are ever removed — an authored .md that happens to
 * sit under components/ is not this script's to delete.
 */
const expected = new Set(written.map(([out]) => out));
const orphans = [];
for (const root of DOC_ROOTS) {
  for (const rel of documents('.', { root })) {
    const full = path.join(root, rel);
    if (expected.has(full)) continue;
    if (fs.readFileSync(full, 'utf8').startsWith(GENERATED_HEADER)) orphans.push(full);
  }
}

for (const orphan of orphans) {
  if (CHECK) {
    console.error(`✗ orphan: ${rel(orphan)} — its component no longer exists`);
    stale += 1;
  } else {
    fs.unlinkSync(orphan);
    console.log(`  − ${rel(orphan)} (component gone)`);
  }
}

for (const [out, doc] of written) {
  const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  if (CHECK) {
    if (prev !== doc) {
      console.error(`✗ stale: ${rel(out)}`);
      stale += 1;
    }
    continue;
  }
  if (prev !== doc) fs.writeFileSync(out, doc);
}

if (CHECK) {
  if (stale) fail(`${stale} generated component doc(s) out of date — run \`npm run generate:component-docs\``);
  if (described) fail(`${described} recorded gap(s) are described now — take them off the record with \`npm run generate:component-docs -- --update\``);
  if (!failed) {
    console.log(`✓ component docs up to date (${written.length} files across ${groups.length} groups)`);
  }
} else {
  console.log(`✓ wrote ${written.length} files across ${groups.length} groups`);
}
