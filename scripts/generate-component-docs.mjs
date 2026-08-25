/**
 * Generate the per-component agent doc and the per-group index.
 *
 *   design-system/src/components/<group>/<Name>/index.md   ← per component
 *   design-system/src/components/<group>/index.md          ← group index + coverage
 *
 * Everything here is derived from source that is maintained for its own
 * reasons — propTypes, destructured defaults, JSDoc, story argTypes, SCSS token
 * usage. There is no second corpus to keep in sync, which is why the skeleton
 * pipeline deleted in #156 could not work and this can: nothing has to be
 * written for a component to be documented.
 *
 * The authored half (#166 — when to use, correct/incorrect, accessibility) is
 * NOT written here. It is detected and counted, so a section sitting at 0%
 * coverage is visible in the group index rather than silently absent.
 *
 * Usage:
 *   node scripts/generate-component-docs.mjs
 *   node scripts/generate-component-docs.mjs --check   (CI: fail if stale, write nothing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_ROOT = path.join(REPO_ROOT, 'design-system/src/components');
const CHECK = process.argv.includes('--check');

/** Groups are the folders directly under components/, minus the barrel files. */
const GROUP_TITLES = {
  actions: 'Actions',
  'forms-and-inputs': 'Forms and inputs',
  'layout-and-structure': 'Layout and structure',
  messaging: 'Messaging',
  navigation: 'Navigation',
  overlays: 'Overlays',
  'status-and-loading': 'Status and loading',
  _internal: 'Internal',
};

/**
 * The authored sections that change agent behaviour (#166). Detection is by
 * heading text in the component's MDX; a section that is not there is omitted
 * from the page and counted as missing, never stubbed.
 */
const AUTHORED_SECTIONS = [
  { key: 'whenToUse', label: 'When to use', match: /^#{2,4}\s*when (to use|not to use)/i },
  { key: 'correctIncorrect', label: 'Correct/incorrect', match: /^#{2,4}\s*(correct|do(s)? and don|usage (do|guidance))/i },
  { key: 'accessibility', label: 'Accessibility', match: /^#{2,4}\s*accessibility/i },
];

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};

/* ------------------------------------------------------------------ parsing */

/** The JSDoc block immediately above `export const <Name> =` / `const <Name> =`. */
function jsdocFor(source, name) {
  const decl = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=`, 'g');
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
  // The first line is almost always "<Name> Component" — a title, not a description.
  if (lines[0] && new RegExp(`^${name}\\b`, 'i').test(lines[0]) && lines.length > 1) lines.shift();
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
  const entries = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
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
    const type = m[2].replace(/\s+/g, ' ').trim();
    const oneOf = type.match(/PropTypes\.oneOf\(\[([\s\S]*?)\]\)/);
    props.push({
      name: m[1],
      type: prettyType(type),
      description,
      enumValues: oneOf ? [...oneOf[1].matchAll(/'([^']+)'/g)].map((v) => v[1]) : null,
    });
  }
  return props;
}

function prettyType(raw) {
  if (/PropTypes\.oneOf\(\[/.test(raw)) return 'enum';
  if (/PropTypes\.oneOfType/.test(raw)) {
    const inner = [...raw.matchAll(/PropTypes\.(\w+)/g)].map((m) => m[1]).filter((t) => t !== 'oneOfType');
    return [...new Set(inner)].join(' or ');
  }
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

const scssTokens = (src) =>
  src ? [...new Set([...src.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))].sort() : [];

function authoredCoverage(mdxSource) {
  const found = {};
  const lines = mdxSource ? mdxSource.split('\n') : [];
  for (const s of AUTHORED_SECTIONS) found[s.key] = lines.some((l) => s.match.test(l.trim()));
  return found;
}

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
const rel = (p) => path.relative(REPO_ROOT, p).replace(/\\/g, '/');

/* ----------------------------------------------------------------- emitting */

function componentDoc(c, siblings) {
  const source = fs.readFileSync(c.jsx, 'utf8');
  const base = c.flat ? path.join(c.dir, c.name) : path.join(c.dir, c.name);
  const stories = readIf(`${base}.stories.jsx`);
  const scss = readIf(`${base}.scss`);
  const mdx = readIf(`${base}.mdx`);

  const symbol = implSymbol(source, c.name);
  const props = parsePropTypes(source, symbol);
  if (props === null) {
    fail(`${rel(c.jsx)}: ${symbol}.propTypes is present but unbalanced — refusing to emit an empty props table`);
    return null;
  }
  if (!props.length && /\.propTypes\s*=/.test(source)) {
    fail(
      `${rel(c.jsx)}: the file declares propTypes but none resolve to \`${symbol}\` — ` +
        `the props table would be silently empty. Name the implementation ${c.name}, or teach implSymbol() this shape.`
    );
    return null;
  }
  const defaults = parseDefaults(source, symbol);
  const descriptions = parseArgTypeDescriptions(stories);
  const tokens = scssTokens(scss);
  const coverage = authoredCoverage(mdx);
  const enums = props.filter((p) => p.enumValues && p.enumValues.length);

  let d = `<!-- DO NOT EDIT BY HAND. Generated by npm run generate:component-docs -->\n`;
  d += `<!-- Every fact below is derived from source. To change one, change the source. -->\n\n`;
  d += `# ${c.name}\n\n`;

  const jsdoc = jsdocFor(source, symbol);
  if (jsdoc) d += `${jsdoc}\n\n`;
  if (symbol !== c.name) {
    d += `> Implemented as \`${symbol}\` in the source and exported as \`${c.name}\`. `;
    d += `Import the exported name; read the source under the implementation name.\n\n`;
  }

  d += `**Import:** \`import { ${c.name} } from '@/components';\`\n\n`;
  d += `**Source:** \`${rel(c.jsx)}\`\n\n`;
  if (stories) d += `**Stories:** \`${rel(`${base}.stories.jsx`)}\` — ${storyExports(stories).join(', ') || 'none exported'}\n\n`;
  if (mdx) d += `**Storybook page:** \`${rel(`${base}.mdx`)}\`\n\n`;

  if (props.length) {
    d += `## Props\n\n| Prop | Type | Default | Description |\n|------|------|---------|-------------|\n`;
    for (const p of props) {
      const def = defaults[p.name] ? `\`${defaults[p.name]}\`` : '—';
      d += `| \`${p.name}\` | ${p.type} | ${def} | ${descriptions[p.name] || p.description || '—'} |\n`;
    }
    d += `\n`;
  }

  if (enums.length) {
    d += `## Variants\n\n`;
    for (const e of enums) {
      d += `**\`${e.name}\`** — ${e.enumValues.map((v) => `\`${v}\``).join(' · ')}\n\n`;
    }
    d += `Anything not listed is not a valid value.\n\n`;
  }

  if (tokens.length) {
    d += `## Tokens touched\n\n`;
    d += tokens.map((t) => `\`${t}\``).join(' · ') + `\n\n`;
    d += `From \`${rel(`${base}.scss`)}\`. Override these through the token layer, never with a literal.\n\n`;
  }

  const subs = subComponents(source, symbol);
  if (subs.length) {
    d += `## Sub-components\n\n`;
    for (const sub of subs) {
      const subProps = parsePropTypes(source, sub.impl) || [];
      d += `### \`${c.name}.${sub.name}\`\n\n`;
      d += `Implemented as \`${sub.impl}\`.\n\n`;
      if (subProps.length) {
        d += `| Prop | Type | Default | Description |\n|------|------|---------|-------------|\n`;
        for (const sp of subProps) {
          d += `| \`${sp.name}\` | ${sp.type} | — | ${sp.description || '—'} |\n`;
        }
        d += `\n`;
      }
    }
  }

  const related = siblings.filter((s) => s !== c.name);
  if (related.length) {
    d += `## Related\n\n`;
    d += `Same group: ${related.map((r) => `\`${r}\``).join(' · ')}\n\n`;
  }

  const missing = AUTHORED_SECTIONS.filter((s) => !coverage[s.key]);
  d += `<!-- authored coverage: `;
  d += AUTHORED_SECTIONS.map((s) => `${s.key}=${coverage[s.key] ? 'yes' : 'no'}`).join(' ');
  d += ` -->\n`;
  if (missing.length === AUTHORED_SECTIONS.length) {
    d += `\n> No authored guidance yet — when to use, correct/incorrect, and accessibility\n`;
    d += `> are unwritten for this component (#166). Nothing above tells you whether\n`;
    d += `> reaching for \`${c.name}\` is the right call, only what it accepts.\n`;
  } else if (missing.length) {
    d += `\n> Authored guidance is partial — missing: ${missing.map((m) => m.label.toLowerCase()).join(', ')} (#166).\n`;
  }

  return { doc: d, coverage, propCount: props.length };
}

function groupIndex(group, results) {
  const title = GROUP_TITLES[group.name] || group.name;
  let d = `<!-- DO NOT EDIT BY HAND. Generated by npm run generate:component-docs -->\n\n`;
  d += `# ${title}\n\n`;
  d += `${group.components.length} component${group.components.length === 1 ? '' : 's'}. `;
  d += `Each row links to the generated facts; the three columns after it are the\n`;
  d += `authored half (#166), counted rather than assumed.\n\n`;
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
let stale = 0;

for (const group of groups) {
  const names = group.components.map((c) => c.name);
  const results = {};

  for (const c of group.components) {
    const built = componentDoc(c, names);
    if (!built) continue;
    results[c.name] = built;
    const out = c.flat ? path.join(c.dir, `${c.name}.md`) : path.join(c.dir, 'index.md');
    written.push([out, built.doc]);
  }

  written.push([path.join(group.dir, 'index.md'), groupIndex(group, results)]);
}

/**
 * A component that is deleted must take its doc with it. Only files carrying
 * this generator's header are ever removed — an authored .md that happens to
 * sit under components/ is not this script's to delete.
 */
const GENERATED_HEADER = '<!-- DO NOT EDIT BY HAND. Generated by npm run generate:component-docs -->';
const expected = new Set(written.map(([out]) => out));
const orphans = [];
const sweep = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sweep(full);
    else if (entry.name.endsWith('.md') && !expected.has(full)) {
      if (fs.readFileSync(full, 'utf8').startsWith(GENERATED_HEADER)) orphans.push(full);
    }
  }
};
sweep(COMPONENTS_ROOT);

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
  if (stale) {
    fail(`${stale} generated component doc(s) out of date — run \`npm run generate:component-docs\``);
  } else {
    console.log(`✓ component docs up to date (${written.length} files across ${groups.length} groups)`);
  }
} else {
  console.log(`✓ wrote ${written.length} files across ${groups.length} groups`);
}
