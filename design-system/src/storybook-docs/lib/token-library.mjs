/**
 * The data behind Foundations ▸ Tokens ▸ Library: one row per token, with its
 * light and dark value, filtered by search and by collection, tier and scope,
 * then grouped by collection and subgroup.
 *
 * Placement is `placeToken` in `token-collections.mjs` and nothing here
 * restates it, so a token is on exactly one collection page and one Library
 * row. Plain ESM with no Node-only import, so the page and `node --test` load
 * the same file.
 */
import { readTokens, resolveToken } from '../../lib/tokens.mjs';
import { COLLECTIONS, COLLECTION_TITLES, SCOPE_TITLES, SCOPES, placeToken } from './token-collections.mjs';

const DARK_BLOCK = /\[data-color-mode="dark"\]\s*\{/;

/** The declarations of the first plain dark-mode block of a stylesheet (not the contrast variants). */
export function readDarkTokens(text) {
  const start = DARK_BLOCK.exec(text);
  if (!start) return new Map();
  let depth = 1;
  let i = start.index + start[0].length;
  const open = i;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
    i += 1;
  }
  return readTokens(text.slice(open, i - 1));
}

/**
 * @param {Map<string, {raw: string, value: string, file: string}>} corpus
 * @param {{darkSources?: {file: string, text: string}[], intents?: Map<string, string>}} [options]
 * @returns {{name: string, light: string, dark: string|null, description: string, collection: string, tier: string, scope: string|null}[]}
 */
export function buildLibrary(corpus, { darkSources = [], intents = new Map() } = {}) {
  const darkRaw = new Map();
  for (const { text } of darkSources) for (const [k, v] of readDarkTokens(text)) darkRaw.set(k, v);
  const overlay = new Map();
  for (const [name, entry] of corpus) overlay.set(name, darkRaw.get(name) ?? entry.raw);
  const rows = [];
  for (const [name, entry] of corpus) {
    const place = placeToken(name, entry.file);
    if (!place) continue;
    const dark = resolveToken(name, overlay);
    const touched = darkRaw.has(name) || (dark !== undefined && dark !== entry.value);
    rows.push({
      name,
      light: entry.value,
      dark: touched ? dark ?? entry.value : null,
      description: intents.get(name) ?? '',
      ...place,
    });
  }
  return rows;
}

const bare = (s) => s.trim().toLowerCase().replace(/^-+/, '');

/**
 * Search (substring of the name, or the whole name with `exact`; leading
 * dashes optional) combined with the collection, tier and scope filters. An
 * unset or `all` filter lets everything through.
 */
export function filterLibrary(rows, { query = '', exact = false, collection = 'all', tier = 'all', scope = 'all' } = {}) {
  const q = bare(query);
  return rows.filter((r) => {
    if (collection !== 'all' && r.collection !== collection) return false;
    if (tier !== 'all' && r.tier !== tier) return false;
    if (scope !== 'all' && r.scope !== scope) return false;
    if (!q) return true;
    const name = bare(r.name);
    return exact ? name === q : name.includes(q);
  });
}

/** Rows grouped by collection (in page order), then Primitives and each semantic scope. */
export function groupLibrary(rows) {
  const out = [];
  for (const collection of COLLECTIONS) {
    const inCollection = rows.filter((r) => r.collection === collection);
    if (!inCollection.length) continue;
    const sections = [
      { id: 'primitives', title: 'Primitives', rows: inCollection.filter((r) => r.tier === 'primitive') },
      ...SCOPES.map((s) => ({ id: `semantics-${s}`, title: `Semantic · ${SCOPE_TITLES[s]}`, rows: inCollection.filter((r) => r.tier === 'semantic' && r.scope === s) })),
    ].filter((s) => s.rows.length);
    out.push({ collection, title: COLLECTION_TITLES[collection], sections });
  }
  return out;
}
