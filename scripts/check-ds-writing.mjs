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
 *   bare-number         a number in a rule (its heading or its body), or in a
 *                       Usage table row on a strict page, with no constant
 *                       behind it. A number shown through an MDX
 *                       expression (`{MAX_STACK}`) is the constant itself and
 *                       never reaches the page model's text; a sentence that
 *                       names its constant in backticks (`MAX_STACK`) is held
 *                       by it. Code spans and value names like `6-col` are words.
 *   stale-marker        "known stale", "outdated" or `TODO` in a page's text,
 *                       or in a markdown file under `design-system/guidelines/`,
 *                       outside code. A known gap lives in an issue; the page
 *                       states current behavior.
 *   props-parity        the stories meta's argTypes against the component's
 *                       propTypes: an argType naming no prop, and an argType's
 *                       `options` disagreeing with the prop's `oneOf`. A prop
 *                       with no argType is no finding: Storybook infers its row
 *                       from the component, so the Code tab already shows it.
 *                       Options are compared as written: strings and numbers,
 *                       `undefined` (the unset choice) left out, `...NAME` and a
 *                       bare `NAME` read from the `const NAME = [...]` in the
 *                       stories or the component file, and `Object.keys(NAME)` of
 *                       a `const NAME = {...}` there. A list the check cannot read
 *                       (a name found nowhere, a call, a cycle), or options on a
 *                       prop whose values are empty or unreadable, is a finding;
 *                       a list left out on purpose carries `optionsUnchecked: true`
 *                       with a comment above it giving the reason.
 *                       AN ARG THE STORY USES THAT IS NOT A PROP (`children`,
 *                       `onClick`, `style`, a `*Preset` or `*Label` that
 *                       drives the demo) is marked in its argType with
 *                       `storyOnly: true`, e.g.
 *                       `itemCount: { storyOnly: true, control: 'number' }`.
 *                       Marking an arg that does name a prop is a finding, so
 *                       a mark never outlives the reason for it.
 *
 * SEVERITY. Every rule warns on every page, so the check rolls out without
 * blocking a merge, except `stale-marker`, which fails anywhere: a defect stated
 * as fact is the one finding with no reading in which it is right. `props-parity`
 * fails anywhere too: a Controls panel that disagrees with the props is wrong
 * on every page, and every page now agrees, so a new mismatch fails the check.
 *
 * THE STRICT LIST, AND ITS SWITCH. `STRICT_PAGES` (`scripts/lib/ds-strict.mjs`,
 * shared with `check:ds-vocabulary`) names the pages held to every rule, and on
 * a strict page `bare-number` also reads the Usage tables' rows. `ENFORCE_STRICT`
 * is true, so a strict page's finding is an error marked `(strict)` and fails
 * `check:harness`. Set to false, the same findings report as warnings and
 * `npm run check:ds-writing -- --strict` runs the check as the gate would. A page
 * joins the list when it passes `--strict`, and the list grows from there.
 *
 * Usage:
 *   npm run check:ds-writing               strict pages and errors listed, other warnings
 *                                          rolled up per rule; exit 1 on an error
 *   npm run check:ds-writing -- --all      every finding listed
 *   npm run check:ds-writing -- --strict   the strict list enforced; exit 1 on its findings
 *   npm run check:ds-writing -- --counts   warnings per rule; exit 0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main, report } from './lib/findings.mjs';
import { createPageFinder, readDocsPage, topLevelEntries } from './lib/docs-page.mjs';
import { lineOf, readJson, readText, withoutCode, withoutFences } from './lib/ds-check-helpers.mjs';
import { ENFORCE_STRICT, STRICT_PAGES } from './lib/ds-strict.mjs';
import { trackedFiles } from './lib/tracked-sources.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'design-system/agent-views/components.json';
const INDEX = 'design-system/agent-views/components/index.md';
const REGISTRY = 'design-system/figma/component-registry.json';
const GUIDELINES = 'design-system/guidelines';
const DS_SRC = 'design-system/src';
const NAME = 'check:ds-writing';

export { ENFORCE_STRICT, STRICT_PAGES };

export const RULES = ['usage-spine', 'alternatives-route', 'bare-number', 'stale-marker', 'props-parity'];
const ALWAYS_ERROR = new Set(['stale-marker', 'props-parity']);

export const SPINE = ['Usage', 'Alternatives', 'Best practices', 'Accessibility', 'Related'];

// ── text helpers ────────────────────────────────────────────────────────────

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

/** The body rows of the tables in a section's text, header and divider rows left out. */
const tableRowsOf = (text) =>
  withoutFences(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l, k, all) => l.startsWith('|') && !/^\|[\s|:-]+\|$/.test(l) && !/^\|[\s|:-]+\|$/.test(all[k + 1] ?? ''));

function bareNumberFindings(page, { strict = false } = {}) {
  const out = [];
  if (strict) {
    const usage = page.sections.find((s) => s.title.toLowerCase() === 'usage');
    for (const row of tableRowsOf(usage?.text)) {
      if (CONSTANT.test(row)) continue;
      const numbers = withoutCode(row).match(NUMBER);
      if (numbers) {
        out.push({ rule: 'bare-number', message: `a Usage table row states ${numbers.map((n) => `"${n}"`).join(', ')} with no constant behind it: "${row}"`, anchor: row.split('|')[1]?.trim() || row });
      }
    }
  }
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

/** The stale markers in a text, outside code. */
function staleIn(text) {
  const out = [];
  for (const line of withoutCode(text).split('\n')) {
    const marker = STALE.map((re) => line.match(re)?.[0]).find(Boolean);
    if (marker) out.push({ rule: 'stale-marker', message: `"${marker}" states a defect as fact; fix it, delete it, or file an issue: "${line.trim()}"`, anchor: line.trim() });
  }
  return out;
}

const staleFindings = (page) => staleIn([page.intro, ...page.sections.map((s) => `## ${s.title}\n${s.text}`)].join('\n'));

/** Every markdown file under the design-system guidelines, repo-relative. */
const guidelineFiles = (root) => trackedFiles(root, [GUIDELINES]).filter((file) => file.endsWith('.md')).sort();

/** The text between the bracket at `open` and its match, strings skipped; null when unbalanced. */
function bracketBody(src, open) {
  const close = { '[': ']', '{': '}', '(': ')' }[src[open]];
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === src[open]) depth++;
    else if (c === close && --depth === 0) return src.slice(open + 1, i);
  }
  return null;
}

/** An object literal's top-level entries: key → `{value, note}`, `note` true when a comment leads the entry. Null when not an object literal or a key is computed. */
function keyedEntries(text) {
  const t = text.trim();
  if (!t.startsWith('{')) return null;
  const map = new Map();
  for (const raw of topLevelEntries(t, 0)) {
    let rest = raw;
    let note = false;
    for (let m; (m = rest.match(/^(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*/)); ) {
      note = true;
      rest = rest.slice(m[0].length);
    }
    const m = rest.match(/^(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))\s*(?::\s*([\s\S]*))?$/);
    if (!m) return null;
    map.set(m[1] ?? m[2], { value: (m[3] ?? m[2]).trim(), note });
  }
  return map;
}

/** The expression a `const NAME = ...` binds in the first source that declares it, or null. */
function constExpr(name, sources, lookup = null) {
  const re = new RegExp(`\\bconst\\s+${name.replace(/\$/g, '\\$')}\\s*=\\s*(?=[\\[{])`);
  const hit = lookup?.(name);
  for (const src of hit ? [...sources, hit] : sources) {
    const m = src.match(re);
    if (!m) continue;
    const open = m.index + m[0].length;
    const body = bracketBody(src, open);
    if (body != null) return src.slice(open, open + body.length + 2);
  }
  return null;
}

/**
 * The values an expression lists, as strings, or null when the check cannot read it:
 * an array literal (strings and numbers as written, `undefined` and `null` the unset
 * choice left out, `...EXPR` read the same way), a `const NAME` bound to one, or
 * `Object.keys(NAME)` of a `const NAME` object literal with plain keys. A name found in
 * no source, a call, or a cycle is null.
 */
function valuesOf(expr, sources, lookup, seen = new Set()) {
  const t = expr.trim();
  let m;
  if (t.startsWith('[')) {
    const out = [];
    for (const raw of topLevelEntries(t, 0)) {
      const el = raw.trim();
      if ((m = el.match(/^["']([^"']*)["']$/))) out.push(m[1]);
      else if (/^-?\d+(?:\.\d+)?$/.test(el)) out.push(el);
      else if (el === 'true' || el === 'false') out.push(el);
      else if (el === 'undefined' || el === 'null') continue;
      else if (el.startsWith('...')) {
        const inner = valuesOf(el.slice(3), sources, lookup, seen);
        if (!inner) return null;
        out.push(...inner);
      } else return null;
    }
    return out;
  }
  if ((m = t.match(/^[A-Za-z_$][\w$]*$/))) {
    if (seen.has(t)) return null;
    const alias = [...sources, lookup?.(t) ?? ''].map((src) => src.match(new RegExp(`\\bconst\\s+${t.replace(/\$/g, '\\$')}\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*;`))?.[1]).find(Boolean);
    if (alias) return valuesOf(alias, sources, lookup, new Set([...seen, t]));
    const bound = constExpr(t, sources, lookup);
    return bound?.startsWith('[') ? valuesOf(bound, sources, lookup, new Set([...seen, t])) : null;
  }
  if ((m = t.match(/^Object\.keys\(\s*([A-Za-z_$][\w$]*)\s*\)$/))) {
    const bound = constExpr(m[1], sources, lookup);
    const entries = bound?.startsWith('{') ? keyedEntries(bound) : null;
    return entries ? [...entries.keys()] : null;
  }
  return null;
}

/**
 * The meta's argTypes, from the first `argTypes:` object in a stories file outside a string:
 * `[{name, options, readable, storyOnly, unchecked, noted}]`. `options` is the list the argType
 * names (null with none), `readable` false when it names one the check cannot read. The marks are
 * read as top-level keys of the argType object: `storyOnly: true`, an arg the story uses that is not a prop,
 * and `optionsUnchecked: true`, an options list left out of the comparison, which a comment leading it
 * must explain (`noted`). `extraSources` are the files a named constant may be declared in,
 * and `lookup(name)` the source of the file that exports one, for a constant imported through a barrel.
 */
export function argTypesOf(source, extraSources = [], lookup = null) {
  const src = String(source ?? '');
  const sources = [src, ...extraSources.map(String)];
  const meta = src.search(/export\s+default\b|\bconst\s+meta\b/);
  const at = src.indexOf('argTypes:', meta === -1 ? 0 : meta);
  if (at === -1) return [];
  const open = src.indexOf('{', at);
  if (open === -1) return [];
  return topLevelEntries(src, open).flatMap((raw) => {
    const m = raw.match(/^(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))\s*:\s*([\s\S]*)$/);
    if (!m) return [];
    const keys = keyedEntries(m[3]);
    const opt = keys?.get('options');
    const options = opt ? valuesOf(opt.value, sources, lookup) : null;
    const flag = (k) => keys?.get(k)?.value === 'true';
    return [{
      name: m[1] ?? m[2],
      options,
      readable: !opt || options !== null,
      storyOnly: flag('storyOnly'),
      unchecked: flag('optionsUnchecked'),
      noted: Boolean(keys?.get('optionsUnchecked')?.note),
    }];
  });
}

function parityFindings(props, storiesSource, componentSource, lookup) {
  if (!storiesSource || !props) return [];
  const argTypes = argTypesOf(storiesSource, componentSource ? [componentSource] : [], lookup);
  if (!argTypes.length) return [];
  const anchor = 'argTypes';
  const finding = (message) => ({ rule: 'props-parity', message, anchor });
  const real = argTypes.filter((a) => !a.storyOnly);
  if (!props.length) {
    return real.length ? [finding(`argTypes name ${real.length} prop(s), and the component declares no propTypes.`)] : [];
  }
  const byName = new Map(props.map((p) => [p.name, p]));
  const out = [];
  for (const arg of argTypes) {
    const prop = byName.get(arg.name);
    if (arg.storyOnly) {
      if (prop) out.push(finding(`argType \`${arg.name}\` is marked storyOnly but names a prop in the component's propTypes; remove the mark.`));
      continue;
    }
    if (!prop) {
      out.push(finding(`argType \`${arg.name}\` names no prop in the component's propTypes; mark a story-only arg with \`storyOnly: true\`.`));
      continue;
    }
    if (arg.unchecked) {
      if (!arg.noted) out.push(finding(`argType \`${arg.name}\` has \`optionsUnchecked: true\` with no comment above it giving the reason.`));
      continue;
    }
    if (arg.options === null && arg.readable) continue;
    if (!arg.readable) {
      out.push(finding(`argType \`${arg.name}\` options cannot be read; list the values, name a const array or \`Object.keys\` of a const object, or add \`optionsUnchecked: true\` under a comment giving the reason.`));
      continue;
    }
    const values = prop.values?.length ? prop.values : prop.type === 'bool' ? [true, false] : null;
    if (!values) {
      out.push(finding(`argType \`${arg.name}\` lists options, and the prop's values are empty or unreadable; add \`optionsUnchecked: true\` under a comment giving the reason.`));
      continue;
    }
    const a = [...arg.options].sort().join(', ');
    const p = values.map(String).sort().join(', ');
    if (a !== p) out.push(finding(`argType \`${arg.name}\` options [${a}] differ from the prop's values [${p}].`));
  }
  return out;
}

/**
 * Every rule over one page: `[{rule, message, anchor}]`, ungraded.
 * `names` is the components index's names; `props` and `storiesSource` feed
 * props-parity, which is skipped without them.
 */
export function writingFindings({ page, names, props = null, storiesSource = null, componentSource = null, lookup = null, strict = false }) {
  return [
    ...spineFindings(page),
    ...routeFindings(page, names),
    ...bareNumberFindings(page, { strict }),
    ...staleFindings(page),
    ...parityFindings(props, storiesSource, componentSource, lookup),
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

/** For a constant name, the source of the design-system file that exports it, or undefined; the files are read once per repo root. */
const constLookup = byRoot((repoRoot) => {
  const files = trackedFiles(repoRoot, [DS_SRC])
    .filter((rel) => /\.(?:jsx?|mjs)$/.test(rel) && !/\.(?:stories|test)\./.test(rel))
    .map((rel) => readText(repoRoot, rel));
  const cache = new Map();
  return (name) => {
    if (!cache.has(name)) cache.set(name, files.find((f) => f.includes(`export const ${name} =`)));
    return cache.get(name);
  };
});

/** Every component page with its raw findings, read once per repo root. */
const inputs = byRoot((repoRoot) => {
  const manifest = readJson(repoRoot, MANIFEST) ?? { components: [] };
  const names = indexNames(readText(repoRoot, INDEX) ?? '');
  // The old name of a listed template still resolves, so a route may keep naming it until the contract step.
  for (const t of manifest.components ?? []) {
    if (t.kind !== 'template' || !names.has(t.name)) continue;
    for (const o of manifest.components) if (o.kind === 'pattern' && o.source && o.source === t.source) names.add(o.name);
  }
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
    const strict = STRICT_PAGES.includes(record.name);
    const raw = writingFindings({
      page: readDocsPage(source),
      names,
      props: record.props ?? [],
      storiesSource: readText(repoRoot, stories),
      componentSource: readText(repoRoot, record.source),
      lookup: constLookup(repoRoot),
      strict,
    });
    pages.push({
      name: record.name,
      file,
      stories,
      strict,
      raw: raw.map((f) => ({ ...f, line: f.anchor === 'argTypes' ? 1 : lineOf(source, f.anchor) })),
    });
  }
  const guidelines = guidelineFiles(repoRoot).flatMap((file) => {
    const source = readText(repoRoot, file);
    return staleIn(source).map((f) => ({ ...f, file, line: lineOf(source, f.anchor) }));
  });
  return { pages, pageless, guidelines };
});

/**
 * The findings. A strict page's findings and every error are listed one by
 * one; the warnings on the other pages are rolled up into one line per rule,
 * so the gate's output stays readable while the rollout runs, and `all`
 * (`-- --all`) lists every one.
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT, enforceStrict = ENFORCE_STRICT, all = false } = {}) {
  const { pages, guidelines } = inputs(repoRoot);
  const listed = guidelines.map((f) => ({ file: f.file, line: f.line, severity: 'error', message: `[${f.rule}] ${f.message}` }));
  const rolled = new Map();
  for (const { file, stories, strict, raw } of pages) {
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
  const { pages, pageless } = inputs(repoRoot);
  const whole = pages.filter(({ raw }) => !raw.some((f) => f.rule === 'usage-spine')).length;
  return `${whole} of ${pages.length} component page(s) hold the whole Usage spine (${pageless} component(s) have no page).`;
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
