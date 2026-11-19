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
 * (`notHereTable`). `findIn(text)` scans prose with one rule for every kind;
 * `ofKind(kind)` lists the rows of one kind for a check that counts by shape
 * (a JSX tag, an import), and `renames()` is the token plan's old name to new.
 *
 * A row may carry how its words are read: `pattern` (the shape that replaces
 * its text), `caseSensitive`, `in` (the path prefixes it binds; elsewhere it
 * is not retired), `rule` (the name a check groups its findings under) and
 * `shipped` (a name a code comment may cite, but shipped prose and links
 * may not). A `tags` row is a retired name kept off the Not-here table: one that is
 * also an English word (Surface, Overlay) or that no agent meets any more (the
 * `Pattern*` names). It is banned as a JSX tag or import, and a check that wants
 * more asks for the kind. A token is retired when the token plan retired
 * it; the token rows the table lists are names agents invent.
 *
 * Retiring a name replaces every use in the same change
 * (`docs/engineering/coding.md` § Retiring a name); this list only stops it coming back.
 */

import fs from 'node:fs';
import path from 'node:path';

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

/** Whether a row is a retired name; a token row the table only lists is a name agents invent. */
const isRetired = (row) => row.kind !== 'token' || Boolean(row.fromPlan);

const KIND_OF = [
  ['components', 'component'],
  ['tags', 'tag'],
  ['props', 'prop'],
  ['tokens', 'token'],
  ['words', 'word'],
  ['spellings', 'spelling'],
  ['outside', 'outside'],
];
const KINDS = new Set([...KIND_OF.map(([, kind]) => kind), 'avoid']);

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The one matching rule. A spelling is its `pattern`; a token is its name
 * matchers; a component is its exact name; a prop, word, outside name or
 * avoid-word is its text, on word boundaries, in any case.
 */
function matcherOf(row) {
  if (row.kind === 'token') {
    const names = tokenMatchers(row.not);
    return { name: (n) => names.some((re) => re.test(n)), scan: (text) => [...text.matchAll(/--[\w-]+/g)].filter((m) => names.some((re) => re.test(m[0]))) };
  }
  const source = row.pattern ?? `(?<![\\w-])${escape(row.not)}(?![\\w-])`;
  const exact = row.kind === 'component' || row.kind === 'tag' || row.caseSensitive;
  const flags = exact ? 'g' : 'gi';
  const whole = new RegExp(`^(?:${source})$`, exact ? '' : 'i');
  return {
    name: (n) => whole.test(n) || (row.kind === 'spelling' && new RegExp(source, exact ? '' : 'i').test(n)),
    scan: (text) => [...text.matchAll(new RegExp(source, flags))],
  };
}

/**
 * Build the lookup from a repo's list, token plan and glossaries.
 * @param {string} repoRoot
 * @param {{ avoid?: boolean }} [options]  `avoid: false` leaves the glossaries unread, for a caller (the hosted lookup) that bundles only the list
 */
export function loadRetirement(repoRoot, { avoid: readAvoid = true } = {}) {
  const list = JSON.parse(fs.readFileSync(path.join(repoRoot, LIST), 'utf8'));
  // A component row is retired only when marked so; the rest are names agents invent.
  const rows = KIND_OF.flatMap(([key, kind]) => (list[key] ?? []).map((r) => ({ ...r, kind, severity: 'error' }))).filter((r) => !(r.kind === 'component' && !r.retired));
  const renames = retiredRenames();
  // Every name the plan retired is a row, after the hand-kept ones: a table row that covers it answers `retired(name)`, and the plan's row is what makes it retired.
  const plan = [...RETIRED_TOKENS]
    .map((old) => ({ kind: 'token', not: old, use: renames.has(old) ? [renames.get(old)] : [], why: 'retired by the token plan', severity: 'error', fromPlan: true }));
  const avoid = (readAvoid ? GLOSSARIES : []).flatMap((file) => {
    const full = path.join(repoRoot, file);
    return fs.existsSync(full) ? glossaryAvoid(fs.readFileSync(full, 'utf8')) : [];
  }).map((word) => ({ kind: 'avoid', not: word, use: [], why: 'the glossary says not to say it', severity: 'warn' }));
  return makeRetirement([...rows, ...plan, ...avoid], list.allowed ?? [], { components: list.components, props: list.props, tokens: list.tokens }, renames);
}

/** The lookup over built rows and places, and the table rows it renders; `loadRetirement` is its door. */
function makeRetirement(rows, places, table, renamed) {
  const matchers = rows.map((row) => ({ row, ...matcherOf(row) }));
  const ranked = [...matchers].sort((a, b) => (a.row.severity === b.row.severity ? 0 : a.row.severity === 'error' ? -1 : 1));
  return {
    /** The retired row a name matches (errors before warnings), or null. */
    retired(name) {
      return ranked.find((m) => m.name(name))?.row ?? null;
    },
    /**
     * May this repo-relative file say a retired name? A place may keep only
     * some kinds; ask with the kind, or without one to hear only of places that keep every kind.
     */
    allowed(file, kind) {
      return places.some((p) => (p.path.endsWith('/') ? file.startsWith(p.path) : file === p.path) && (!p.kinds || (kind !== undefined && p.kinds.includes(kind))));
    },
    /**
     * Every retired name the text says: `{ row, match, index }`, in text order; an error row wins over a warning on the same words.
     * `kinds` narrows the rows read (a `tag` only when asked for), `retiredOnly` leaves out the names agents merely invent, and `file`
     * leaves out the rows that bind other paths (`in`).
     */
    findIn(text, { kinds, retiredOnly = false, file } = {}) {
      // An `_Avoid_:` line names the old words on purpose, so it is blanked, not scanned.
      const live = text.replace(/^[ \t]*_Avoid_:.*$/gm, (line) => ' '.repeat(line.length));
      const found = new Map();
      for (const { row, scan } of ranked) {
        if (kinds ? !kinds.includes(row.kind) : row.kind === 'tag') continue; // a tag is also an English word: asked for by kind, never in prose
        if (retiredOnly && !isRetired(row)) continue;
        if (file !== undefined && row.in && !row.in.some((prefix) => file.startsWith(prefix))) continue;
        for (const m of scan(live)) {
          const key = `${m.index}:${m[0].toLowerCase()}`;
          if (!found.has(key)) found.set(key, { row, match: m[0], index: m.index });
        }
      }
      return [...found.values()].sort((a, b) => a.index - b.index);
    },
    /** The rows of one kind (`component`, `prop`, `token`, `word`, `spelling`, `outside`, `avoid`), as the list holds them. */
    ofKind(kind) {
      return rows.filter((row) => row.kind === kind).map((row) => ({ ...row }));
    },
    /** The token plan's retired name to its replacement. */
    renames() {
      return new Map(renamed);
    },
    /** The index header's Not-here table, rendered from the list's component, prop and token rows. */
    notHereTable() {
      return renderInventions(table);
    },
  };
}

/**
 * The shape problems of a list (as `_inventions.json` holds it), as messages:
 * a row with no replacement, a spelling with no pattern, a place with no path,
 * reason or known kind. That each replacement exists is `checkInventions`'s.
 */
export function listProblems(list) {
  const problems = [];
  for (const [key, kind] of KIND_OF) {
    for (const r of list[key] ?? []) {
      if (!r.use?.length) problems.push(`${kind} ${r.not}: no replacement`);
      if (kind === 'spelling' && !r.pattern) problems.push(`${kind} ${r.not}: no pattern`);
    }
  }
  for (const p of list.allowed ?? []) {
    if (!p.path) problems.push(`allowed place "${p.path ?? ''}": no path`);
    else if (!p.why) problems.push(`allowed place "${p.path}": no reason`);
    else if ((p.kinds ?? []).some((k) => !KINDS.has(k))) problems.push(`allowed place "${p.path}": unknown kind`);
  }
  return problems;
}
