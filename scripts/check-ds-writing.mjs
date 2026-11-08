#!/usr/bin/env node
/**
 * `npm run check:ds-writing` — every component page holds the Usage spine
 * (`design-system/guidelines/documentation-ia.md` § The Usage spine), read
 * through the page model (`scripts/lib/docs-page.mjs`).
 *
 * THE RULES, AND THE IMPLICIT STATE EACH ONE SURFACES.
 *
 *   usage-spine         Usage, Alternatives, Best practices, Accessibility and
 *                       Related, in that order; each Alternatives line a route
 *                       ("For <situation>, use `X`."); Best practices as `###`
 *                       rules, each one sentence ending in a stop, ids unique;
 *                       each Related line carrying its "use when".
 *   alternatives-route  every component a route names is in the generated
 *                       components index, the existence law, so a route never
 *                       sends a reader to a component that is not there.
 *   bare-number         a number in a rule (its heading or its body) with no
 *                       constant behind it. A number shown through an MDX
 *                       expression (`{MAX_STACK}`) is the constant itself and
 *                       never reaches the page model's text; a sentence that
 *                       names its constant in backticks (`MAX_STACK`) is held
 *                       by it. Code spans and value names like `6-col` are words.
 *   stale-marker        "known stale", "outdated" or `TODO` in a page's text,
 *                       outside code. A known gap lives in an issue; the page
 *                       states current behavior.
 *   props-parity        the stories meta's argTypes against the component's
 *                       propTypes: an argType naming no prop, and an argType's
 *                       `options` disagreeing with the prop's `oneOf`. A prop
 *                       with no argType is no finding: Storybook infers its row
 *                       from the component, so the Code tab already shows it.
 *
 * SEVERITY. Every rule warns on every page, so the check rolls out without
 * blocking a merge, except `stale-marker`, which fails anywhere: a defect stated
 * as fact is the one finding with no reading in which it is right.
 *
 * THE STRICT LIST, AND ITS SWITCH. `STRICT_PAGES` names the pages held to every
 * rule. While `ENFORCE_STRICT` is false their findings are reported as warnings
 * marked `(strict)`, and `npm run check:ds-writing -- --strict` runs the check as
 * the gate will once enforced, exiting 1 on them. Flipping `ENFORCE_STRICT` to
 * true makes `check:harness` fail on a strict page's finding; a page joins the
 * list when it passes `--strict`, and the list grows from there.
 *
 * Usage:
 *   npm run check:ds-writing               strict pages and errors listed, other warnings
 *                                          rolled up per rule; exit 1 on an error
 *   npm run check:ds-writing -- --all      every finding listed
 *   npm run check:ds-writing -- --strict   the strict list enforced; exit 1 on its findings
 *   npm run check:ds-writing -- --counts   warnings per rule; exit 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main, report } from './lib/findings.mjs';
import { createPageFinder, readDocsPage } from './lib/docs-page.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'design-system/agent-views/components.json';
const INDEX = 'design-system/agent-views/components/index.md';
const REGISTRY = 'design-system/figma/component-registry.json';
const NAME = 'check:ds-writing';

/** The pages held to every rule, by component name. */
export const STRICT_PAGES = ['Modal'];

/** The switch: true makes a strict page's finding fail `check:harness`. */
export const ENFORCE_STRICT = true;

export const RULES = ['usage-spine', 'alternatives-route', 'bare-number', 'stale-marker', 'props-parity'];
const ALWAYS_ERROR = new Set(['stale-marker']);

export const SPINE = ['Usage', 'Alternatives', 'Best practices', 'Accessibility', 'Related'];

// ── text helpers ────────────────────────────────────────────────────────────

/** Text with fenced code blocks blanked. */
const withoutFences = (text) => text.replace(/^[ \t]*(`{3,}|~{3,})[\s\S]*?^[ \t]*\1[^\n]*$/gm, '');
/** Text with fenced code blocks and code spans blanked, so code never reads as prose. */
const withoutCode = (text) => withoutFences(text).replace(/`+[^`\n]*`+/g, ' ');

const sentencesOf = (text) => text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

const ROUTE = /^For\b[^,]*,\s*use\s+`[A-Z]/;
const CONSTANT = /`[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+`|`[A-Z]{3,}`/;
/** A standalone number: no word, hyphen or dot joined to it (`6-col`, `v2`, `1.5x` are words). */
const NUMBER = /(?<![\w.#-])\d+(?:\.\d+)?(?![\w-]|\.\d)/g;
const STALE = [/known stale/i, /\boutdated\b/i, /\bTODO\b/];

// ── rules over one page model ───────────────────────────────────────────────

function spineFindings(page) {
  const out = [];
  const titles = page.sections.map((s) => s.title.toLowerCase());
  const at = (t) => titles.indexOf(t.toLowerCase());
  let last = null;
  for (const title of SPINE) {
    if (at(title) === -1) {
      // A missing section is placed after the spine section before it, where it belongs.
      out.push({ rule: 'usage-spine', message: `no "${title}" section; the Usage spine is ${SPINE.join(', ')}.`, anchor: `## ${last ?? title}` });
      continue;
    }
    if (last && at(title) < at(last)) {
      out.push({ rule: 'usage-spine', message: `"${title}" comes before "${last}"; the Usage spine is ${SPINE.join(', ')}.`, anchor: `## ${title}` });
    }
    if (!last || at(title) > at(last)) last = title;
  }

  for (const alt of page.alternatives) {
    if (!ROUTE.test(alt.text)) {
      out.push({ rule: 'usage-spine', message: `Alternatives line is not a route ("For <situation>, use \`X\`."): "${alt.text}"`, anchor: alt.text });
    }
  }

  const best = page.sections.find((s) => s.title.toLowerCase() === 'best practices');
  if (best && !page.rules.length) {
    out.push({ rule: 'usage-spine', message: 'Best practices has no `###` rule; write each rule as one `###` sentence.', anchor: '## Best practices' });
  }
  const seen = new Map();
  for (const r of page.rules) {
    const sentence = r.sentence.replace(/`[^`]*`/g, 'x').trim();
    if (!/[.!?]$/.test(sentence) || /[.!?]\s+\S/.test(sentence)) {
      out.push({ rule: 'usage-spine', message: `rule "${r.sentence}" is not one sentence ending in a stop.`, anchor: r.sentence });
    }
    if (seen.has(r.id)) {
      out.push({ rule: 'usage-spine', message: `rules "${seen.get(r.id)}" and "${r.sentence}" share the id "${r.id}".`, anchor: r.sentence });
    } else seen.set(r.id, r.sentence);
  }

  for (const line of page.related) {
    if (!/\buse when\b/i.test(line)) {
      out.push({ rule: 'usage-spine', message: `Related line has no "use when": "${line}"`, anchor: line });
    }
  }
  return out;
}

function routeFindings(page, names) {
  const out = [];
  for (const alt of page.alternatives) {
    for (const [, name] of alt.text.matchAll(/`([A-Z][A-Za-z0-9]*)`/g)) {
      if (!names.has(name)) {
        out.push({ rule: 'alternatives-route', message: `route names \`${name}\`, which the components index does not list.`, anchor: alt.text });
      }
    }
  }
  return out;
}

function bareNumberFindings(page) {
  const out = [];
  for (const r of page.rules) {
    for (const sentence of sentencesOf(withoutFences(`${r.sentence}\n${r.text}`))) {
      if (CONSTANT.test(sentence)) continue;
      const numbers = withoutCode(sentence).match(NUMBER);
      if (numbers) {
        out.push({
          rule: 'bare-number',
          message: `rule "${r.id}" states ${numbers.map((n) => `"${n}"`).join(', ')} with no constant behind it: "${sentence}"`,
          anchor: r.sentence,
        });
      }
    }
  }
  return out;
}

function staleFindings(page) {
  const text = [page.intro, ...page.sections.map((s) => `## ${s.title}\n${s.text}`)].join('\n');
  const out = [];
  for (const line of withoutCode(text).split('\n')) {
    const marker = STALE.map((re) => line.match(re)?.[0]).find(Boolean);
    if (marker) out.push({ rule: 'stale-marker', message: `"${marker}" states a defect as fact; fix it, delete it, or file an issue: "${line.trim()}"`, anchor: line.trim() });
  }
  return out;
}

/** The meta's argTypes: `[{name, options}]`, from the first `argTypes:` object in a stories file outside a string. */
export function argTypesOf(source) {
  const src = String(source ?? '');
  const meta = src.search(/export\s+default\b|\bconst\s+meta\b/);
  const at = src.indexOf('argTypes:', meta === -1 ? 0 : meta);
  if (at === -1) return [];
  const open = src.indexOf('{', at);
  if (open === -1) return [];
  const out = [];
  let depth = 0;
  let entryStart = open + 1;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      for (i++; i < src.length && src[i] !== ch; i++) if (src[i] === '\\') i++;
    } else if (ch === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      if (i === -1) break;
    } else if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') {
      depth--;
      if (depth === 0) {
        pushEntry(src.slice(entryStart, i));
        break;
      }
    } else if (ch === ',' && depth === 1) {
      pushEntry(src.slice(entryStart, i));
      entryStart = i + 1;
    }
  }
  function pushEntry(raw) {
    const m = raw.trim().match(/^(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))\s*:\s*([\s\S]*)$/);
    if (!m) return;
    const opts = m[3].match(/\boptions\s*:\s*\[([^\]]*)\]/);
    const options = opts ? [...opts[1].matchAll(/["']([^"']*)["']/g)].map((o) => o[1]) : null;
    out.push({ name: m[1] ?? m[2], options });
  }
  return out;
}

function parityFindings(props, storiesSource) {
  if (!storiesSource || !props) return [];
  const argTypes = argTypesOf(storiesSource);
  if (!argTypes.length) return [];
  const anchor = 'argTypes';
  if (!props.length) {
    return [{ rule: 'props-parity', message: `argTypes name ${argTypes.length} prop(s), and the component declares no propTypes.`, anchor }];
  }
  const byName = new Map(props.map((p) => [p.name, p]));
  const out = [];
  for (const arg of argTypes) {
    const prop = byName.get(arg.name);
    if (!prop) {
      out.push({ rule: 'props-parity', message: `argType \`${arg.name}\` names no prop in the component's propTypes.`, anchor });
      continue;
    }
    if (arg.options && prop.values?.length) {
      const a = [...arg.options].sort().join(', ');
      const p = [...prop.values].sort().join(', ');
      if (a !== p) out.push({ rule: 'props-parity', message: `argType \`${arg.name}\` options [${a}] differ from the prop's values [${p}].`, anchor });
    }
  }
  return out;
}

/**
 * Every rule over one page: `[{rule, message, anchor}]`, ungraded.
 * `names` is the components index's names; `props` and `storiesSource` feed
 * props-parity, which is skipped without them.
 */
export function writingFindings({ page, names, props = null, storiesSource = null }) {
  return [
    ...spineFindings(page),
    ...routeFindings(page, names),
    ...bareNumberFindings(page),
    ...staleFindings(page),
    ...parityFindings(props, storiesSource),
  ];
}

/** The names the generated components index lists, outside its "Not here" table. */
export function indexNames(markdown) {
  const names = new Set();
  let listed = true;
  for (const line of String(markdown).split('\n')) {
    if (/^## /.test(line)) listed = !/^## Not here/i.test(line);
    if (!listed) continue;
    for (const [, name] of line.matchAll(/\[`?([A-Z][A-Za-z0-9]*)`?\]\(/g)) names.add(name);
  }
  return names;
}

/** Severity for each finding: a warning, a stale marker an error, a strict page's finding an error once enforced. */
export function gradeFindings(raw, { strict, enforce }) {
  return raw.map((f) => ({
    ...f,
    severity: ALWAYS_ERROR.has(f.rule) || (strict && enforce) ? 'error' : 'warning',
  }));
}

// ── the tree ────────────────────────────────────────────────────────────────

const readJson = (root, rel) => (fs.existsSync(path.join(root, rel)) ? JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) : null);
const readText = (root, rel) => (rel && fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : null);

/** The 1-based line of the first source line containing `anchor` (or its first words), else 1. */
function lineOf(source, anchor) {
  const lines = source.split('\n');
  const probes = [anchor, anchor?.replace(/`/g, '').slice(0, 40), anchor?.slice(0, 24)].filter((p) => p && p.length > 3);
  for (const probe of probes) {
    const k = lines.findIndex((l) => l.includes(probe));
    if (k !== -1) return k + 1;
  }
  return 1;
}

/** Every component page with its raw findings, read once per repo root. */
const inputs = byRoot((repoRoot) => {
  const manifest = readJson(repoRoot, MANIFEST) ?? { components: [] };
  const names = indexNames(readText(repoRoot, INDEX) ?? '');
  const findPage = createPageFinder(repoRoot, readJson(repoRoot, REGISTRY));
  const pages = [];
  let pageless = 0;
  for (const record of manifest.components ?? []) {
    if (!record.source) continue;
    const file = findPage({ name: record.name, source: record.source });
    if (!file) {
      pageless++;
      continue;
    }
    const source = readText(repoRoot, file);
    const stories = record.source.replace(/\.[jt]sx?$/, '.stories.jsx');
    const raw = writingFindings({
      page: readDocsPage(source),
      names,
      props: record.props ?? [],
      storiesSource: readText(repoRoot, stories),
    });
    pages.push({
      name: record.name,
      file,
      stories,
      strict: STRICT_PAGES.includes(record.name),
      raw: raw.map((f) => ({ ...f, line: f.anchor === 'argTypes' ? 1 : lineOf(source, f.anchor) })),
    });
  }
  return { pages, pageless };
});

/**
 * The findings. A strict page's findings and every error are listed one by
 * one; the warnings on the other pages are rolled up into one line per rule,
 * so the gate's output stays readable while the rollout runs, and `all`
 * (`-- --all`) lists every one.
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT, enforceStrict = ENFORCE_STRICT, all = false } = {}) {
  const listed = [];
  const rolled = new Map();
  for (const { file, stories, strict, raw } of inputs(repoRoot).pages) {
    for (const f of gradeFindings(raw, { strict, enforce: enforceStrict })) {
      if (!all && !strict && f.severity === 'warning') {
        const entry = rolled.get(f.rule) ?? { findings: 0, pages: new Set() };
        entry.findings++;
        entry.pages.add(file);
        rolled.set(f.rule, entry);
        continue;
      }
      listed.push({
        file: f.anchor === 'argTypes' ? stories : file,
        line: f.anchor === 'argTypes' ? lineOf(readText(repoRoot, stories) ?? '', 'argTypes') : f.line,
        severity: f.severity,
        message: `${strict ? '(strict) ' : ''}[${f.rule}] ${f.message}`,
      });
    }
  }
  const summaries = RULES.filter((r) => rolled.has(r)).map((rule) => ({
    severity: 'warning',
    message: `[${rule}] ${rolled.get(rule).findings} finding(s) on ${rolled.get(rule).pages.size} page(s); \`npm run check:ds-writing -- --all\` lists them.`,
  }));
  return [...listed, ...summaries];
}

/** Warnings per rule, over every page. */
export function counts({ repoRoot = REPO_ROOT } = {}) {
  const { pages, pageless } = inputs(repoRoot);
  const per = Object.fromEntries(RULES.map((r) => [r, { findings: 0, pages: 0 }]));
  for (const { raw } of pages) {
    for (const rule of RULES) {
      const n = raw.filter((f) => f.rule === rule).length;
      per[rule].findings += n;
      if (n) per[rule].pages++;
    }
  }
  return { per, pages: pages.length, pageless };
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { pages, pageless } = counts({ repoRoot });
  return `${pages} component page(s) hold the Usage spine (${pageless} component(s) have no page).`;
}

export const REMEDY =
  '  -> The shape is design-system/guidelines/documentation-ia.md § The Usage spine; each rule\n' +
  '     and its reason is in the header of scripts/check-ds-writing.mjs. A stale marker goes:\n' +
  '     fix the text, delete it, or move the gap to a GitHub issue.';

function printCounts() {
  const { per, pages, pageless } = counts();
  console.log(`${NAME} — ${pages} page(s), ${pageless} component(s) with no page\n`);
  for (const rule of RULES) console.log(`  ${rule.padEnd(20)} ${String(per[rule].findings).padStart(4)} finding(s) on ${per[rule].pages} page(s)`);
}

main(import.meta.url, NAME, {
  run,
  summary,
  remedy: REMEDY,
  flags: {
    '--strict': () => report(NAME, run({ enforceStrict: true }), { remedy: REMEDY }),
    '--all': () => report(NAME, run({ all: true }), { remedy: REMEDY }),
    '--counts': printCounts,
  },
});
