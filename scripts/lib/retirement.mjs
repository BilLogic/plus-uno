/**
 * The one retirement list, and the one interface over it.
 *
 * Every retired name lives in `design-system/agent-views/_inventions.json`
 * (the Not-here list): components, props, tokens, words, spellings and the
 * outside names (another design system's words), each with what to use
 * instead, and `allowed`, the one list of places old names may stay (decision
 * records, the knowledge archive, changelogs, eval history, Figma-side names).
 * Retired tokens the generator needs stay in the token plan
 * (`tokens/plan.mjs`, ADR-038) and are read through the same lookup, and the
 * glossary's `_Avoid_:` words join it as warnings.
 *
 * A retired name fails; a glossary avoid-word warns. A check asks two
 * questions of the list and holds no list of its own:
 *
 *   retired(name)  is this name retired, what replaces it, how severe
 *   allowed(file)  may this file say a retired name
 *
 * The components index's Not-here table is rendered from the same rows
 * (`notHereTable`).
 */

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';
import { renderInventions, tokenMatchers } from './inventions.mjs';
import { RETIRED_TOKENS, retiredRenames } from './tokens/plan.mjs';

const LIST = 'design-system/agent-views/_inventions.json';
/** The glossaries whose `_Avoid_:` lines name words not to say. */
const GLOSSARIES = ['GLOSSARY.md', 'docs/conventions/design-system-glossary.md'];

/** The quoted words of every `_Avoid_:` line. */
export function glossaryAvoid(text) {
  return text
    .split('\n')
    .filter((line) => /^\s*_Avoid_:/.test(line))
    .flatMap((line) => [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

const KIND_OF = [
  ['components', 'component'],
  ['props', 'prop'],
  ['tokens', 'token'],
  ['words', 'word'],
  ['spellings', 'spelling'],
  ['outside', 'outside'],
];

/**
 * Build the lookup from a repo's list, token plan and glossaries.
 * @param {string} [repoRoot]
 */
export function loadRetirement(repoRoot = REPO_ROOT) {
  const list = JSON.parse(fs.readFileSync(path.join(repoRoot, LIST), 'utf8'));
  const rows = KIND_OF.flatMap(([key, kind]) => (list[key] ?? []).map((r) => ({ ...r, kind, severity: 'error' })));
  const listed = rows.filter((r) => r.kind === 'token').flatMap((r) => tokenMatchers(r.not));
  const renames = retiredRenames();
  const plan = [...RETIRED_TOKENS]
    .filter((old) => !listed.some((re) => re.test(old)))
    .map((old) => ({ kind: 'token', not: old, use: renames.has(old) ? [renames.get(old)] : [], why: 'retired by the token plan', severity: 'error', fromPlan: true }));
  const avoid = GLOSSARIES.flatMap((file) => {
    const full = path.join(repoRoot, file);
    return fs.existsSync(full) ? glossaryAvoid(fs.readFileSync(full, 'utf8')) : [];
  }).map((word) => ({ kind: 'avoid', not: word, use: [], why: 'the glossary says not to say it', severity: 'warn' }));
  return makeRetirement([...rows, ...plan, ...avoid], list.allowed ?? []);
}

/** The lookup over already-built rows and places; `loadRetirement` is its usual door. */
export function makeRetirement(rows, places) {
  const matchers = rows.map((row) => {
    if (row.kind === 'token') return { row, test: (n) => tokenMatchers(row.not).some((re) => re.test(n)) };
    if (row.pattern) {
      const re = new RegExp(row.pattern, 'i');
      return { row, test: (n) => re.test(n) };
    }
    const lower = row.not.toLowerCase();
    return { row, test: (n) => n.toLowerCase() === lower };
  });
  return {
    rows,
    places,
    /** The retired row a name matches (errors before warnings), or null. */
    retired(name) {
      const hit = matchers.find((m) => m.row.severity === 'error' && m.test(name)) ?? matchers.find((m) => m.test(name));
      return hit ? hit.row : null;
    },
    /** May this repo-relative file say a retired name? */
    allowed(file) {
      return places.some((p) => (p.path.endsWith('/') ? file.startsWith(p.path) : file === p.path));
    },
  };
}

/** Rows or places that cannot answer a lookup, as messages. */
export function retirementProblems({ rows, places }) {
  const problems = [];
  for (const r of rows) if (r.kind !== 'avoid' && !(r.use?.length || r.kind === 'token')) problems.push(`${r.kind} ${r.not}: no replacement`);
  for (const p of places) {
    if (!p.path) problems.push(`allowed place "${p.path ?? ''}": no path`);
    else if (!p.why) problems.push(`allowed place "${p.path}": no reason`);
  }
  return problems;
}

/** The index header's Not-here table, rendered from the list's component, prop and token rows. */
export function notHereTable({ rows }) {
  const of = (kind) => rows.filter((r) => r.kind === kind && !r.fromPlan);
  return renderInventions({ components: of('component'), props: of('prop'), tokens: of('token') });
}
