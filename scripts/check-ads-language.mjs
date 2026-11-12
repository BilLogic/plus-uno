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
 * purpose, as history or as what not to say.
 *
 * WHAT IT COUNTS, per rule and per file, keyed `<rule> <path>`:
 *   state-step       lines naming a `--*-state-NN` custom property, NN being 08, 12 or 16.
 *   component:<Name> JSX tags `<Name` plus import statements binding `Name`,
 *                    for the retired names: the Not-here rows marked `retired`
 *                    (`design-system/agent-views/_inventions.json`), plus the retired
 *                    `Overlay` and `Surface` pattern names.
 *   prop:style|fill|size   lines with the retired prop values: `style="primary"`
 *                    (a bare identifier, which no inline CSS is), `fill="filled"`,
 *                    `size="small|medium|large|sm|md|lg"`. A `<Heading>`'s size is the type
 *                    scale (xxlarge to xxsmall), current vocabulary, so it is exempt.
 *   proptype:size    lines declaring `size: PropTypes.oneOf(['small', ...])`, the prop-type
 *                    side of `prop:size`: a component that declares the old vocabulary
 *                    never writes it as JSX, so only the declaration shows it.
 *   class:plus-btn   lines naming `plus-btn--(filled|tonal|...|large)`.
 *   word:<word>      lines naming `surface container`, `scrim` or `Rovo`.
 *   word:Atlassian   zero allowed: MDX prose, story doc strings and `atlassian.design` links.
 *   word:PLUS-AI  lines under `design-system/src` naming the AI "PLUS AI": the product's
 *                    AI is unnamed and shows as AI (decision 1 of #1591). Prototypes keep
 *                    their own recorded copy.
 *
 * AGENT-READ MARKDOWN. The `.md` docs agents learn from (`DOC_ROOTS`: the
 * constitution, glossary and README, skills, agents, docs, the design-system
 * guidelines) are held to one rule:
 *   retired-name:<Name> lines naming a retired component (the `NOT_HERE.components`
 *                    rows marked retired) as a word; the finding names the replacement.
 * A table or paragraph that maps old names to new on purpose carries
 * `<!-- retired-names-ok: why -->`, which covers the contiguous non-blank block
 * it sits in. A generated file (a `GENERATED` banner in its first lines) is
 * regenerated from its source, so it is skipped; the source is checked.
 *
 * The old token names are `check:old-system`'s.
 *
 * EVERY RULE ALLOWS ZERO. A hit is a finding; there is no baseline to hold it
 * and no `--update` to record it. A word that is legitimately cited (a Figma
 * layer name, a decision record) goes into the allowlist below, named.
 */

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { SOURCE_ROOTS } from './lib/ds-facts.mjs';
import { main } from './lib/findings.mjs';
import { renamedInProse, retiredComponents } from './lib/inventions.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
/** The library's own source and consumer code: the language binds both. */
export const SEARCH_ROOTS = SOURCE_ROOTS;
export const SEARCHED = /\.(scss|css|jsx|js|mjs|html|mdx)$/;
/** Files that record the old words on purpose: history and decisions. */
const ALLOWED_PATHS = [
  /^docs\/knowledge\/archive\//,
  /^docs\/adr\//,
];
/**
 * Decision records that cite the benchmark on purpose, so the citation is the
 * content. Named, not globbed; a new record earns its own line here. None today.
 */
const ATLASSIAN_RECORDS = [];
/** The agent-read markdown: what uno, uno-bot and the review skills learn from. */
export const DOC_ROOTS = ['AGENTS.md', 'GLOSSARY.md', 'README.md', 'skills', 'agents', 'docs', 'design-system/guidelines'];
const DOC_FILE = /\.md$/;
/**
 * Plans are working notes, deleted once landed; eval scenarios are fixtures an
 * eval hands to the agent under test, written in the old names on purpose. The
 * archive and ADRs are history (ALLOWED_PATHS).
 */
const DOC_SKIPPED = /^docs\/(?:plans|evals\/scenarios)\//;
/** A block that maps retired names to their replacements on purpose. */
const RETIRED_OK = /<!--\s*retired-names-ok:\s*.+?-->/i;
/** A generated file's banner, within its first lines: `GENERATED by …` or `DO NOT EDIT BY HAND`. */
const GENERATED = /\bGENERATED by\b|DO NOT EDIT BY HAND/;
/** A retired name that is also an English verb, used as one: `Switch the set…`, `Collapse the panel`. */
const VERB_USE = (name) => new RegExp(`\\b${name}\\s+(?:the|a|an|it|its|this|that)\\b`, 'g');
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
/** A glossary line saying what not to say. */
const ALLOWED_LINE = /^\s*_Avoid_:/;

/** The Not-here table: the one list of retired names, each with its replacement. */
const NOT_HERE = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'design-system/agent-views/_inventions.json'), 'utf8'));

/** The retired component names: the Not-here rows marked `retired`. Retire one there, not here. */
export const LEGACY_COMPONENTS = retiredComponents(NOT_HERE);
/** Retired pattern names, counted the same way as the retired components. */
const PATTERN_COMPONENTS = ['Overlay', 'Surface'];

/** A component renamed with no alias (ADR-037 "clean replace"), the Not-here rows marked `inProse`: the old name may not survive in doc prose either. */
export const RENAMED_NO_ALIAS = renamedInProse(NOT_HERE);
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
];

/**
 * Components whose `size` is the type scale (xxlarge to xxsmall), the current
 * vocabulary, not the retired small / medium / large control sizes.
 */
const TYPE_SCALE_TAGS = new Set(['Heading']);

/**
 * Is every retired `size="…"` on line `i` on a type-scale tag? Each one is
 * owned by the nearest `<Tag` before it that no `>` has closed yet.
 */
function typeScaleSize(lines, i) {
  const prior = lines.slice(Math.max(0, i - 20), i).join('\n');
  const line = lines[i];
  const owner = (head) => {
    const open = [...head.matchAll(/<([A-Za-z][\w.]*)/g)].pop();
    if (!open || /(?<!=)>/.test(head.slice(open.index + 1))) return null;
    return open[1];
  };
  const bad = [...line.matchAll(/\bsize="(?:small|medium|large|sm|md|lg)"/g)];
  return bad.length > 0 && bad.every((m) => TYPE_SCALE_TAGS.has(owner(`${prior}\n${line.slice(0, m.index)}`)));
}

/** An import statement that binds `name`; capture 1 is where it comes from. */
const importOf = (name) =>
  new RegExp(
    `\\bimport\\s+(?:[\\w$]+\\s*,\\s*)?(?:\\*\\s+as\\s+${name}|\\{[^}]*\\b${name}\\b[^}]*\\}|${name})\\s+from\\s+['"]([^'"]+)['"]`,
    'g',
  );

const tagCount = (text, name) => (text.match(new RegExp(`<${name}(?=[\\s>/]|$)`, 'gm')) ?? []).length;

/** Count one component's tags and imports. */
function componentCount(text, name) {
  const imports = [...text.matchAll(importOf(name))].length;
  return tagCount(text, name) + imports;
}

/**
 * Is this line shipped doc that names Atlassian? Every MDX line is; in code
 * only a non-comment line of a story is (its `docs` strings);
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
    if (DOC_FILE.test(file)) {
      measureDoc(file, text, add);
      continue;
    }
    const live = text.split('\n').map((l) => (ALLOWED_LINE.test(l) ? '' : l));
    for (const [rule, re] of LINE_RULES) {
      const hits = live.flatMap((l, i) => (re.test(l) && !(rule === 'prop:size' && typeScaleSize(live, i)) ? [i + 1] : []));
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
    for (const name of [...LEGACY_COMPONENTS, ...PATTERN_COMPONENTS]) {
      add(`component:${name}`, file, componentCount(body, name), where(name));
    }
  }
  return found;
}

/**
 * One agent-read markdown file: each retired name, counted per line, outside
 * the blocks a `retired-names-ok` marker covers. A generated file is skipped.
 */
function measureDoc(file, text, add) {
  const lines = text.split('\n');
  if (GENERATED.test(lines.slice(0, 6).join('\n'))) return;
  const exempt = new Set();
  lines.forEach((line, i) => {
    if (!RETIRED_OK.test(line)) return;
    for (let j = i; j >= 0 && lines[j].trim(); j--) exempt.add(j);
    for (let j = i; j < lines.length && lines[j].trim(); j++) exempt.add(j);
  });
  const live = lines.map((l, i) => (exempt.has(i) || ALLOWED_LINE.test(l) ? '' : l));
  for (const name of LEGACY_COMPONENTS) {
    const word = new RegExp(`\\b${name}\\b`);
    const verb = VERB_USE(name);
    const hits = live.flatMap((l, i) => (word.test(l.replace(verb, '')) ? [i + 1] : []));
    add(`retired-name:${name}`, file, hits.length, hits[0]);
  }
}

/** Every tracked, searched file under the roots, read: the code and MDX, then the agent-read markdown. */
export function sourcesOf(repoRoot) {
  const docs = trackedSources(repoRoot, DOC_ROOTS, DOC_FILE).filter(({ path: p }) => !DOC_SKIPPED.test(p));
  return [...trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED), ...docs];
}

/** Per-rule reason, keyed by rule name; a rule without one gets the generic line. */
const RULE_MESSAGE = new Map([
  ...NOT_HERE.components
    .filter((r) => r.retired)
    .map((r) => [
      `retired-name:${r.not}`,
      `\`${r.not}\` is retired; write ${r.use.map((u) => `\`${u}\``).join(' or ')}${r.why ? ` (${r.why})` : ''}, or mark a table that maps old names to new with <!-- retired-names-ok: why -->`,
    ]),
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
