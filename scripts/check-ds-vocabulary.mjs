#!/usr/bin/env node
/**
 * `npm run check:ds-vocabulary` — design-system docs pages speak the glossary's
 * terms, and the glossary's design-system avoid-words route cleanly in search.
 *
 * THE RULES.
 *
 *   avoid-word   a plain avoid-word of a design-system term that names a
 *                component or pattern (`GLOSSARY.md`, any `### Design system: …`
 *                section; the words that also feed `ds_find`) in the prose of a
 *                component, pattern or foundation page, outside code. The
 *                finding names the term to say instead. A qualified avoid-word
 *                ("popup" for a blocking dialog) is avoided in one sense only,
 *                so no text match can tell it apart and it is not checked; a
 *                product term's avoid-words ("alert" for Escalation) are the
 *                product's vocabulary, not the design system's.
 *   collision    a plain avoid-word equal to another component's name or
 *                hand-kept alias. Fed to `ds_find`, it would route that
 *                component's word to this term (`scripts/lib/ds-vocabulary.mjs`).
 *
 * SEVERITY. `avoid-word` warns on every page while the rollout runs, except on
 * `STRICT_PAGES`, held to it once `ENFORCE_STRICT` is on, the same list and
 * switch as `check:ds-writing`. `collision` always fails.
 *
 * Usage:
 *   npm run check:ds-vocabulary               errors and strict pages listed, other warnings rolled up
 *   npm run check:ds-vocabulary -- --all      every finding listed
 *   npm run check:ds-vocabulary -- --strict   the strict list enforced; exit 1 on its findings
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main, report } from './lib/findings.mjs';
import { createPageFinder, readDocsPage } from './lib/docs-page.mjs';
import { DS_SECTION, componentOf, parseGlossary, vocabularyAliases } from './lib/ds-vocabulary.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GLOSSARY = 'GLOSSARY.md';
const VIEWS = 'design-system/agent-views';
const REGISTRY = 'design-system/figma/component-registry.json';
/** The docs pages the vocabulary binds: component, pattern and foundation pages. */
const PAGE_ROOTS = ['design-system/src/components', 'design-system/src/patterns', 'design-system/src/styles'];
const NAME = 'check:ds-vocabulary';

/** The pages held to every rule, by component name: the same list as `check:ds-writing`. */
export const STRICT_PAGES = ['Modal'];

/** The switch: true makes a strict page's finding fail `check:harness`. */
export const ENFORCE_STRICT = true;

export const RULES = ['avoid-word', 'collision'];

/**
 * The plain avoid-words of the design-system terms that name a component or
 * pattern, the vocabulary that also feeds search: `[{word, term}]`. A term with
 * no component (a prop such as `size`, a token tier, Category) is left out: its
 * avoid-words are ordinary English ("small", "actions") whose qualifier the
 * `_Avoid_` list cannot scope to one word.
 */
export function avoidWords(terms, names) {
  return terms.filter((t) => DS_SECTION.test(t.section) && componentOf(t.term, names)).flatMap((t) => t.avoid.filter((a) => a.plain).map((a) => ({ word: a.word, term: t.term })));
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A word as a whole-word, case-blind match: no letter, digit or hyphen joined to either end, any run of spaces inside. */
const matcherOf = (word) => new RegExp(`(?<![\\w-])${word.split(/\s+/).map(escape).join('\\s+')}(?![\\w-])`, 'gi');

/** Text with fenced code blocks and code spans blanked, so code never reads as prose. */
const withoutCode = (text) =>
  text.replace(/^[ \t]*(`{3,}|~{3,})[\s\S]*?^[ \t]*\1[^\n]*$/gm, '').replace(/`+[^`\n]*`+/g, ' ');

/** Every avoid-word in a page's prose: `[{rule, message, anchor}]`, ungraded. */
export function vocabularyFindings(text, words) {
  const matchers = words.map((w) => ({ ...w, re: matcherOf(w.word) }));
  const out = [];
  for (const line of withoutCode(String(text)).split('\n')) {
    for (const { term, re } of matchers) {
      for (const [hit] of line.matchAll(re)) {
        out.push({ rule: 'avoid-word', message: `"${hit}" is a glossary avoid-word; say ${term}: "${line.trim()}"`, anchor: line.trim() });
      }
    }
  }
  return out;
}

const readText = (root, rel) => (fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : null);
const readJson = (root, rel, fallback) => JSON.parse(readText(root, rel) ?? 'null') ?? fallback;

function mdxUnder(root, rel) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.mdx')) out.push(path.relative(root, full).split(path.sep).join('/'));
    }
  };
  walk(path.join(root, rel));
  return out;
}

/** The 1-based line of the first source line containing `anchor` (or its first words), else 1. */
function lineOf(source, anchor) {
  const lines = source.split('\n');
  for (const probe of [anchor, anchor.slice(0, 40), anchor.slice(0, 24)].filter((p) => p.length > 3)) {
    const k = lines.findIndex((l) => l.includes(probe));
    if (k !== -1) return k + 1;
  }
  return 1;
}

const inputs = byRoot((repoRoot) => {
  const glossary = readText(repoRoot, GLOSSARY) ?? '';
  const terms = parseGlossary(glossary);
  const manifest = readJson(repoRoot, `${VIEWS}/components.json`, { components: [] });
  const { collisions } = vocabularyAliases(terms, {
    names: manifest.components.map((c) => c.name),
    notHere: readJson(repoRoot, `${VIEWS}/_inventions.json`, { components: [] }).components.map((r) => r.not),
    handAliases: readJson(repoRoot, `${VIEWS}/_aliases.json`, { components: {} }).components,
  });
  const findPage = createPageFinder(repoRoot, readJson(repoRoot, REGISTRY, null));
  const strictFiles = new Set(
    STRICT_PAGES.map((name) => manifest.components.find((c) => c.name === name)).filter((c) => c?.source).map((c) => findPage({ name: c.name, source: c.source })),
  );
  const words = avoidWords(terms, manifest.components.map((c) => c.name));
  const pages = PAGE_ROOTS.flatMap((rel) => mdxUnder(repoRoot, rel)).sort().map((file) => {
    const source = readText(repoRoot, file);
    const page = readDocsPage(source);
    const text = [page.intro, ...page.sections.map((s) => `## ${s.title}\n${s.text}`)].join('\n');
    return { file, strict: strictFiles.has(file), raw: vocabularyFindings(text, words).map((f) => ({ ...f, line: lineOf(source, f.anchor) })) };
  });
  const collisionFindings = collisions.map((c) => ({
    file: GLOSSARY,
    line: lineOf(glossary, `**${c.term}**`),
    severity: 'error',
    message: `[collision] "${c.word}", an avoid-word of ${c.term}, is ${c.with}'s name or alias; qualify it ("${c.word}" (${c.with} is its own component)) or drop it.`,
  }));
  return { pages, collisionFindings };
});

/**
 * The findings: every error and a strict page's findings listed one by one,
 * the other pages' warnings rolled up into one line, `all` listing every one.
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT, enforceStrict = ENFORCE_STRICT, all = false } = {}) {
  const { pages, collisionFindings } = inputs(repoRoot);
  const listed = [...collisionFindings];
  let rolled = 0;
  const rolledPages = new Set();
  for (const { file, strict, raw } of pages) {
    for (const f of raw) {
      const severity = strict && enforceStrict ? 'error' : 'warning';
      if (!all && !strict) {
        rolled++;
        rolledPages.add(file);
        continue;
      }
      listed.push({ file, line: f.line, severity, message: `${strict ? '(strict) ' : ''}[${f.rule}] ${f.message}` });
    }
  }
  if (rolled) {
    listed.push({ severity: 'warning', message: `[avoid-word] ${rolled} finding(s) on ${rolledPages.size} page(s); \`npm run ${NAME} -- --all\` lists them.` });
  }
  return listed;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).pages.length} design-system docs page(s) use the glossary's terms; no avoid-word collides with a component.`;
}

export const REMEDY =
  '  -> Say the glossary term the finding names (GLOSSARY.md § Design system). A collision is\n' +
  '     fixed in the glossary: qualify the avoid-word or drop it. The rules and their reasons\n' +
  '     are in the header of scripts/check-ds-vocabulary.mjs.';

main(import.meta.url, NAME, {
  run,
  summary,
  remedy: REMEDY,
  flags: {
    '--strict': () => report(NAME, run({ enforceStrict: true }), { remedy: REMEDY }),
    '--all': () => report(NAME, run({ all: true }), { remedy: REMEDY }),
  },
});
