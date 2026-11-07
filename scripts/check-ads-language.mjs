#!/usr/bin/env node
/**
 * `npm run check:ads-language` — the guard on the component language.
 *
 * The library speaks the ADS names: `appearance`, `spacing`, named state
 * tokens, Blanket / Frame / Page. The old words (Alert, Toast, Switch, NavTabs,
 * Badge, `style` x `fill`, small / medium / large, the 08 / 12 / 16 state
 * steps, surface container, scrim, Rovo) are gone from the tree, and the ban is
 * hard: any hit is a finding, with no baseline and no exemption beyond the
 * allowlist below.
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js .html .mdx` file under
 * `design-system/src`, `prototypes` and `src` (`.mjs` counts as js), by `git ls-files` (a filesystem
 * walk finds a second copy of the tree under `.claude/worktrees/`), the token
 * files included. `docs/knowledge/archive/`, `docs/adr/` and
 * `_Avoid_:` glossary lines are allowlisted: they record the old words on
 * purpose, as history or as what not to say. `tokens/_elevation.scss` and
 * `tokens/_color_roles.scss` are also allowlisted: they are the legacy
 * `--surface-*`/`--color-surface*` alias chain itself (the shadow-or-
 * lightness decision is still open), not a component using it.
 *
 * WHAT IT COUNTS, per rule and per file, keyed `<rule> <path>`:
 *   state-step       lines naming a `--*-state-NN` custom property, NN being 08, 12 or 16.
 *   component:<Name> JSX tags `<Name` plus import statements binding `Name`,
 *                    for the legacy names. `Overlay` and `Surface` count only
 *                    where they are the pattern, not React-Bootstrap's Overlay.
 *   prop:style|fill|size   lines with the retired prop values: `style="primary"`
 *                    (a bare identifier, which no inline CSS is), `fill="filled"`,
 *                    `size="small|medium|large|sm|md|lg"`.
 *   proptype:size    lines declaring `size: PropTypes.oneOf(['small', ...])`, the prop-type
 *                    side of `prop:size`: a component that declares the old vocabulary
 *                    never writes it as JSX, so only the declaration shows it.
 *   class:plus-btn   lines naming `plus-btn--(filled|tonal|...|large)`.
 *   word:<word>      lines naming `surface container`, `scrim` or `Rovo`.
 *   word:Atlassian   zero allowed: MDX prose, story doc strings and `atlassian.design` links.
 *   word:PLUS-AI  lines under `design-system/src` naming the AI "PLUS AI": the product's
 *                    AI is unnamed and shows as AI (decision 1 of #1591). Prototypes keep
 *                    their own recorded copy.
 *   token:surface-layout  a `var(--surface-*)` read of a legacy layout token (#1755).
 *   token:color-surface   a `var(--color-surface*)` or `var(--color-on-surface*)` read (#1755).
 *
 * EVERY RULE ALLOWS ZERO. A hit is a finding; there is no baseline to hold it
 * and no `--update` to record it. A word that is legitimately cited (a Figma
 * layer name, a decision record) goes into the allowlist below, named.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
export const SEARCH_ROOTS = ['design-system/src', 'prototypes', 'src'];
export const SEARCHED = /\.(scss|css|jsx|js|mjs|html|mdx)$/;
/**
 * Files that record the old words on purpose: history, decisions, or — for the
 * two legacy token files below — the alias chain that keeps `--surface-*` and
 * `--color-surface*`/`--color-on-surface*` resolvable while the shadow-or-
 * lightness decision is still open (`_elevation.scss` "THE ROLE LAYER"). The
 * surface-to-zero sweep (#1755) moved every component off these names; their
 * own definitions are not a component, so they stay while that decision is open.
 */
const ALLOWED_PATHS = [
  /^docs\/knowledge\/archive\//,
  /^docs\/adr\//,
  /^design-system\/src\/tokens\/_elevation\.scss$/,
  /^design-system\/src\/tokens\/_color_roles\.scss$/,
];
/**
 * The two files that define `--color-scrim` (the generated value and its alias
 * to `--ds-blanket`). Removing a token waits on the token-removal decision, so
 * the word may stay here and only here, and only the `word:` rules are lenient:
 * every other rule still reads these files.
 */
const TOKEN_NAME_FILES = [
  /^design-system\/src\/tokens\/_colors\.scss$/,
  /^design-system\/src\/tokens\/color\/_legacy-aliases\.scss$/,
];
/**
 * Decision records that cite the benchmark on purpose, so the citation is the
 * content. Named, not globbed; a new record earns its own line here. None today.
 */
const ATLASSIAN_RECORDS = [];
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
/** A glossary line saying what not to say. */
const ALLOWED_LINE = /^\s*_Avoid_:/;

export const LEGACY_COMPONENTS = [
  'Alert', 'Toast', 'ToastContainer', 'Switch', 'NavTabs', 'NavPills', 'Badge', 'BadgeVariants',
  'Jumbotron', 'ListGroup', 'MediaObject', 'Navbar', 'Scrollspy', 'Collapse', 'InputGroup',
  'NumberInput', 'CustomThemeButton',
];
/** Patterns whose old names collide with React-Bootstrap's: counted only when not imported from it. */
const PATTERN_COMPONENTS = ['Overlay', 'Surface'];

/** A component renamed with no alias (ADR-037 "clean replace"): the old name may not survive in doc prose either. */
const RENAMED_NO_ALIAS = { Toast: 'Flag' };
/** Where doc prose is checked for a stale renamed-away name — component docs, not specs or prototypes. */
const DOC_PATH = /^design-system\/src\/components\/.*\.mdx$/;
/** The AI's old product name; the AI is unnamed (decision 1 of #1591), held to zero in the design system. */
const AI_NAME = /\bPLUS AI\b/;
const DESIGN_SYSTEM_PATH = /^design-system\/src\//;

const LINE_RULES = [
  ['state-step', /--[a-z0-9-]*-state-(?:08|12|16)(?![0-9])/],
  ['prop:style', /\bstyle="[a-z][a-z-]*"/],
  ['prop:fill', /\bfill="(?:filled|tonal|outline|ghost|text)"/],
  ['prop:size', /\bsize="(?:small|medium|large|sm|md|lg)"/],
  ['proptype:size', /\bsize:\s*(?:PropTypes\.)?oneOf\(\s*\[\s*['"](?:small|medium|large|sm|md|lg)['"]/],
  ['class:plus-btn', /plus-btn--(?:filled|tonal|outline|ghost|text|small|medium|large)/],
  ['word:surface-container', /surface container/i],
  ['word:scrim', /\bscrim/i],
  ['word:Rovo', /\bRovo\b/],
  ['token:surface-layout', /var\(--surface-[a-z-]+\)/i],
  ['token:color-surface', /var\(--color-(?:on-)?surface(?:-[a-z]+)*\)/i],
];

/** An import statement that binds `name`; capture 1 is where it comes from. */
const importOf = (name) =>
  new RegExp(
    `\\bimport\\s+(?:[\\w$]+\\s*,\\s*)?(?:\\*\\s+as\\s+${name}|\\{[^}]*\\b${name}\\b[^}]*\\}|${name})\\s+from\\s+['"]([^'"]+)['"]`,
    'g',
  );

const tagCount = (text, name) => (text.match(new RegExp(`<${name}(?=[\\s>/]|$)`, 'gm')) ?? []).length;

/** Count one component's tags and imports; a React-Bootstrap `Overlay` is not the pattern. */
function componentCount(text, name, { pattern }) {
  let imports = 0;
  let foreign = false;
  for (const match of text.matchAll(importOf(name))) {
    if (pattern && /react-bootstrap/.test(match[1])) foreign = true;
    else imports += 1;
  }
  if (pattern && foreign && imports === 0) return 0;
  return tagCount(text, name) + imports;
}

/**
 * Is this line shipped doc that names Atlassian? Every MDX line is; in code
 * only a non-comment line of a story is (its `docs` and `changelog` strings);
 * and an `atlassian.design` link is anywhere, because JSDoc flows into the
 * generated agent views.
 */
function atlassianShipped(file, line) {
  if (/atlassian\.design/i.test(line)) return true;
  if (!/atlassian/i.test(line)) return false;
  if (/\.mdx$/.test(file)) return true;
  return /\.stories\.jsx$/.test(file) && !COMMENT_LINE.test(line);
}

/**
 * Measure sources: `{ path, text }[]` in, `Map<key, {count, line}>` out, where
 * `line` is the first line the pair was found on, for the finding to point at.
 *
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  const add = (rule, file, count, line) => {
    if (count > 0) found.set(`${rule} ${file}`, { count, line });
  };
  for (const { path: file, text } of sources) {
    if (ALLOWED_PATHS.some((re) => re.test(file))) continue;
    const live = text.split('\n').map((l) => (ALLOWED_LINE.test(l) ? '' : l));
    for (const [rule, re] of LINE_RULES) {
      if (rule.startsWith('word:') && TOKEN_NAME_FILES.some((p) => p.test(file))) continue;
      const hits = live.flatMap((l, i) => (re.test(l) ? [i + 1] : []));
      add(rule, file, hits.length, hits[0]);
    }
    // `size: PropTypes.oneOf(SIZES)` with `const SIZES = ['sm', ...]` in the same file.
    const constSize = text.match(/\bsize:\s*(?:PropTypes\.)?oneOf\(\s*([A-Z_]+)\s*\)/);
    if (constSize && new RegExp(`const\\s+${constSize[1]}\\s*=\\s*\\[\\s*['"](?:small|medium|large|sm|md|lg)['"]`).test(text)) {
      const line = live.findIndex((l) => constSize[0] && l.includes(constSize[0])) + 1;
      add('proptype:size', file, 1, line || 1);
    }
    if (DOC_PATH.test(file)) {
      for (const [oldName] of Object.entries(RENAMED_NO_ALIAS)) {
        const re = new RegExp(`\\b${oldName}\\b`);
        const hits = live.flatMap((l, i) => (re.test(l) ? [i + 1] : []));
        add(`stale-name:${oldName}`, file, hits.length, hits[0]);
      }
    }
    if (DESIGN_SYSTEM_PATH.test(file)) {
      const hits = live.flatMap((l, i) => (AI_NAME.test(l) ? [i + 1] : []));
      add('word:PLUS-AI', file, hits.length, hits[0]);
    }
    if (!ATLASSIAN_RECORDS.some((re) => re.test(file))) {
      const hits = live.flatMap((l, i) => (atlassianShipped(file, l) ? [i + 1] : []));
      add('word:Atlassian', file, hits.length, hits[0]);
    }
    const body = live.join('\n');
    const where = (name) => Math.max(1, live.findIndex((l) => l.includes(name)) + 1);
    for (const name of LEGACY_COMPONENTS) {
      add(`component:${name}`, file, componentCount(body, name, { pattern: false }), where(name));
    }
    for (const name of PATTERN_COMPONENTS) {
      add(`component:${name}`, file, componentCount(body, name, { pattern: true }), where(name));
    }
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

/** Per-rule reason, keyed by rule name; a rule without one gets the generic line. */
const RULE_MESSAGE = new Map([
  ...Object.entries(RENAMED_NO_ALIAS).map(([oldName, newName]) => [
    `stale-name:${oldName}`,
    `${newName} was renamed with no alias; \`${oldName}\` may not survive in doc prose either`,
  ]),
  [
    'word:Atlassian',
    'shipped docs state the PLUS rule and do not cite the benchmark (no name, no atlassian.design link); a decision record that must is named in ATLASSIAN_RECORDS',
  ],
  [
    'word:PLUS-AI',
    'the AI is unnamed and shows as AI: say "AI" or "the AI", never a product name for it',
  ],
  [
    'state-step',
    'the 08 / 12 / 16 state steps are gone (use the named hovered, pressed and selected tokens)',
  ],
  [
    'token:surface-layout',
    'every component moved off the legacy `--surface-*` layout tokens; use the `--ds-surface-*` family',
  ],
  [
    'token:color-surface',
    'every component moved off `--color-surface*`/`--color-on-surface*`; use `--ds-surface-*`, `--ds-text`/`--ds-text-subtle` or `--ds-icon`/`--ds-icon-subtle`',
  ],
]);

export const REMEDY = '  -> use the ADS names (spec #1604 section 2); the old language may not come back.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  return [...found].map(([key, { count, line }]) => {
    const [rule, ...rest] = key.split(' ');
    return {
      file: rest.join(' '),
      line,
      message: `old language: ${count} x ${rule}; ${RULE_MESSAGE.get(rule) ?? 'use the current prop, class or word'}`,
    };
  });
}

/** The total, for the one-line summary. */
export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  return `${now} old-language hits in ${found.size} rule/file pairs`;
}

main(import.meta.url, 'check:ads-language', { run, summary, remedy: REMEDY });
