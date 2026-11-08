/**
 * The glossary's design-system vocabulary, as DS search reads it. Pure: the
 * glossary's text and the design system's names in, terms and aliases out.
 *
 *   parseGlossary(markdown)          [{term, section, avoid: [{word, plain, named?}]}]
 *   vocabularyAliases(terms, facts)  {aliases, excluded, unmatched, collisions}
 *   componentOf(term, names)        the component or pattern a term names, or null
 *   searchAliases(glossary, facts)   {rows, vocabulary}: the hand-kept aliases with the glossary's appended
 *   DS_SECTION                       the `###` headings whose terms feed DS search
 *
 * ONLY THE DESIGN-SYSTEM SECTIONS FEED SEARCH. A product term's avoid-words
 * name things in the product's language: "alert" is an avoid-word for
 * Escalation, and routed through `ds_find` it would send "show an alert" to a
 * term that is not a component. So only the terms under a `### Design system: …`
 * heading are read for aliases.
 *
 * A TERM MAPS TO ITS COMPONENT BY NAME. "Section message" is `SectionMessage`;
 * a pattern term with no component of its own name maps to its `Pattern` name
 * ("Card" is `PatternCard`). A term with neither (a prop, a token tier, "Close /
 * Dismiss") is reported as unmatched and feeds nothing.
 *
 * A WORD AVOIDED "AS A NAME" IS PLAIN. `"region" as a name` is ordinary
 * English avoided only as the name of the term's thing: it feeds search like a
 * plain word and carries `named: true`, so `check:ds-vocabulary` flags it only
 * where it names something.
 *
 * ONLY A PLAIN AVOID-WORD BECOMES AN ALIAS. A plain word is one quoted word
 * standing alone in the `_Avoid_` list. A qualified one ("popup" for a blocking
 * dialog, bare "dropdown", "tile" (Tile is its own component)) is avoided in one
 * sense only, and a code name (`style`) is a prop, not a word a person asks by.
 * A word that is a not-here name (`_inventions.json`) is skipped too: `ds_find`
 * already answers it with what to use instead. A plain word two terms both
 * avoid ("side panel", for Panel and Drawer) names neither, so it feeds neither.
 *
 * A COLLISION IS A DEFECT. A plain avoid-word equal to another component's name or
 * hand-kept alias would route that component's word to this term. It is never
 * an alias, and `check:ds-vocabulary` fails on it.
 */

/** The qualifier that keeps a word plain but avoids it only as a name: `"region" as a name`. */
export const NAMED = 'as a name';

/** The `###` headings whose terms feed DS search. */
export const DS_SECTION = /^Design system\b/i;

/** Lowercase with case and spacing folded, for comparing names and words. */
const squash = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '');
/** A word as an alias: camelCase split, lowercase, one space. */
const aliasOf = (word) =>
  word
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** One `_Avoid_` list's entries: each a quoted word or code name and whether it stands alone. */
function avoidList(text) {
  const items = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    if (i === text.length || (!quote && depth === 0 && (ch === ',' || ch === ';'))) {
      items.push(text.slice(start, i).trim());
      start = i + 1;
    } else if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === '`') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
  }
  return items.flatMap((item) => {
    const m = item.match(/(["`])([^"`]+)\1/);
    if (!m) return [];
    if (m[1] === '"' && item === `${m[0]} ${NAMED}`) return [{ word: m[2], plain: true, named: true }];
    return [{ word: m[2], plain: m[1] === '"' && item === m[0] }];
  });
}

/**
 * Every glossary term under a `###` section, with its avoid-words. A `##`
 * heading other than the one holding the sections ends them.
 * @returns {{term: string, section: string, avoid: {word: string, plain: boolean}[]}[]}
 */
export function parseGlossary(markdown) {
  const terms = [];
  let section = null;
  let current = null;
  for (const line of String(markdown ?? '').split('\n')) {
    const h = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (h) {
      section = h[1] === '###' ? h[2] : null;
      current = null;
      continue;
    }
    if (!section) continue;
    const t = line.match(/^\*\*(.+?)\*\*:\s*$/);
    if (t) {
      current = { term: t[1], section, avoid: [] };
      terms.push(current);
      continue;
    }
    const a = line.match(/^_Avoid_:\s*(.*)$/);
    if (a && current) current.avoid.push(...avoidList(a[1]));
  }
  return terms;
}

/** The component or pattern a design-system term names, by name or its `Pattern` name, or null. */
export function componentOf(term, names) {
  const want = [squash(term), `pattern${squash(term)}`];
  for (const w of want) {
    const hit = names.find((n) => squash(n) === w);
    if (hit) return hit;
  }
  return null;
}

/**
 * The aliases the design-system terms add to DS search.
 * @param {ReturnType<typeof parseGlossary>} terms
 * @param {{names: string[], notHere?: string[], handAliases?: Record<string, string[]>}} facts
 * @returns {{
 *   aliases: Record<string, string[]>,
 *   excluded: {term: string, word: string, reason: 'qualified'|'shared'|'not-here'}[],
 *   unmatched: string[],
 *   collisions: {term: string, word: string, with: string}[],
 * }}
 */
export function vocabularyAliases(terms, { names, notHere = [], handAliases = {} }) {
  const byName = new Map(names.map((n) => [squash(n), n]));
  const notHereSet = new Set(notHere.map(squash));
  const handOwners = new Map();
  for (const [name, list] of Object.entries(handAliases)) for (const a of list) handOwners.set(squash(a), [...(handOwners.get(squash(a)) ?? []), name]);

  // A plain word two design-system terms both avoid names neither of them.
  const avoiders = new Map();
  for (const { term, section, avoid } of terms) {
    if (!DS_SECTION.test(section)) continue;
    for (const { word, plain } of avoid) if (plain) avoiders.set(squash(word), new Set([...(avoiders.get(squash(word)) ?? []), term]));
  }

  const aliases = {};
  const excluded = [];
  const unmatched = [];
  const collisions = [];
  for (const { term, section, avoid } of terms) {
    if (!DS_SECTION.test(section)) continue;
    const name = componentOf(term, names);
    if (!name) {
      unmatched.push(term);
      continue;
    }
    for (const { word, plain } of avoid) {
      if (!plain) {
        excluded.push({ term, word, reason: 'qualified' });
        continue;
      }
      const key = squash(word);
      const owner = byName.get(key);
      const other = owner && owner !== name ? owner : (handOwners.get(key) ?? []).find((n) => n !== name);
      if (other) {
        collisions.push({ term, word, with: other });
        continue;
      }
      if (avoiders.get(key).size > 1) {
        excluded.push({ term, word, reason: 'shared' });
        continue;
      }
      if (notHereSet.has(key)) {
        excluded.push({ term, word, reason: 'not-here' });
        continue;
      }
      const alias = aliasOf(word);
      const have = new Set([...(handAliases[name] ?? []), ...(aliases[name] ?? [])].map(squash));
      if (owner === name || have.has(key)) continue;
      (aliases[name] ??= []).push(alias);
    }
  }
  return { aliases, excluded, unmatched, collisions };
}

/**
 * Every component's search aliases: its hand-kept ones (`_aliases.json`) first,
 * then the glossary's. The facts module and the component-docs generator both
 * call this, so `ds_find`, `ds_get` and the generated file carry the same list.
 * @param {string} glossary  the glossary's text ('' when there is none)
 * @param {Parameters<typeof vocabularyAliases>[1]} facts
 */
export function searchAliases(glossary, facts) {
  const vocabulary = vocabularyAliases(parseGlossary(glossary), facts);
  const hand = facts.handAliases ?? {};
  const rows = {};
  for (const name of new Set([...Object.keys(hand), ...Object.keys(vocabulary.aliases)])) rows[name] = [...(hand[name] ?? []), ...(vocabulary.aliases[name] ?? [])];
  return { rows, vocabulary };
}
