/**
 * The data behind Foundations ▸ Tokens ▸ Library: one row per token, filtered
 * by search and by collection, tier and scope, then grouped by collection and
 * subgroup.
 *
 * Placement is `tokenCollections` in `token-collections.mjs` and nothing here
 * restates it, so a token is on exactly one collection page and one Library
 * row. Plain ESM with no Node-only import, so the page and `node --test` load
 * the same file.
 */
import { COLLECTION_TITLES, SCOPE_TITLES, SCOPES, COLLECTIONS } from './token-collections.mjs';

/**
 * One row per token, in page order, from the docs token collections.
 *
 * @param {ReturnType<import('./token-collections.mjs').tokenCollections>} collections
 * @returns {{name: string, light: string, description: string, collection: string, tier: string, scope: string|null}[]}
 */
export const buildLibrary = (collections) =>
  collections.flatMap(({ collection, sections }) =>
    sections.flatMap(({ tier, scope, tokens }) =>
      tokens.map((t) => ({
        name: t.name,
        light: t.value,
        description: t.intent || fallbackDescription({ collection, tier, scope }),
        collection,
        tier,
        scope,
      }))));

/** A token with no written intent is still described by where it sits. */
const fallbackDescription = ({ collection, tier, scope }) =>
  tier === 'primitive'
    ? `Primitive ${COLLECTION_TITLES[collection].toLowerCase()} value`
    : `${SCOPE_TITLES[scope]} ${COLLECTION_TITLES[collection].toLowerCase()} token`;

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
