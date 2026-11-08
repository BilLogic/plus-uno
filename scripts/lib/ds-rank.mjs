/**
 * The ranker behind ds_find: field-weighted BM25 over a component's authored
 * text. Pure: words in, scored ids out, no files read, so the hosted server or
 * a Slack find can import it as it is.
 *
 *   tokenize(text)            words: camelCase split, lowercase, stopwords out, stemmed
 *   stem(word)                a crude suffix stemmer, the same on both sides of a match
 *   createRanker(docs, w?)    { score(query) → [{id, score}] }, best first
 *
 * A doc is `{id, fields}`, each field a string or an array of strings, under
 * the keys of `WEIGHTS`. Related is indexed at zero: its text names what to use
 * instead, so scoring it would rank a component for its alternatives.
 */

export const WEIGHTS = Object.freeze({ name: 5, aliases: 4, summary: 2, usage: 1, best: 0.5, related: 0 });

const K1 = 1.2;
const B = 0.75;

export const STOPWORDS = new Set(
  (
    'a an and the of for to with in on or my our is it that this which what i we need want use show build make ' +
    'be by as at from when user users so than then into its are can not no like one some any each has have does do'
  ).split(' '),
);

/** Folds plurals and a few suffixes. Crude on purpose: both sides of a match stem alike. */
export function stem(word) {
  const w = word;
  if (w.length <= 3) return w;
  return w
    .replace(/ies$/, 'y')
    .replace(/sses$/, 'ss')
    .replace(/([^s])s$/, '$1')
    .replace(/(ing|ed|ly|ment|ness|tion|ions|ers?)$/, (m) => (w.length - m.length >= 3 ? '' : m))
    .replace(/e$/, '');
}

const splitCamel = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

/** The words of a text as the ranker reads them. */
export function tokenize(text) {
  const words = splitCamel(String(text ?? '')).toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.filter((w) => w.length > 1 && !STOPWORDS.has(w)).map(stem);
}

const fieldTokens = (value) => (Array.isArray(value) ? value.flatMap(tokenize) : tokenize(value));

/**
 * @param {{id: string, fields: Record<string, string|string[]>}[]} docs
 * @param {Partial<typeof WEIGHTS>} [weights]
 */
export function createRanker(docs, weights = {}) {
  const w = { ...WEIGHTS, ...weights };
  const fields = Object.keys(w);
  const index = docs.map((d) => {
    const tf = {};
    const len = {};
    for (const f of fields) {
      const toks = fieldTokens(d.fields?.[f]);
      len[f] = toks.length;
      const counts = new Map();
      for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1);
      tf[f] = counts;
    }
    return { id: d.id, tf, len };
  });

  const n = index.length;
  const df = new Map();
  for (const d of index) {
    const words = new Set(fields.flatMap((f) => [...d.tf[f].keys()]));
    for (const word of words) df.set(word, (df.get(word) ?? 0) + 1);
  }
  const avg = Object.fromEntries(fields.map((f) => [f, index.reduce((s, d) => s + d.len[f], 0) / n || 1]));
  const idf = (word) => {
    const k = df.get(word) ?? 0;
    return Math.log(1 + (n - k + 0.5) / (k + 0.5));
  };

  function score(query) {
    const words = [...new Set(tokenize(query))];
    if (!words.length) return [];
    const out = [];
    for (const d of index) {
      let s = 0;
      for (const word of words) {
        let tf = 0;
        for (const f of fields) {
          if (!w[f]) continue;
          const count = d.tf[f].get(word);
          if (count) tf += (w[f] * count) / (1 - B + (B * d.len[f]) / avg[f]);
        }
        if (tf) s += idf(word) * ((tf * (K1 + 1)) / (tf + K1));
      }
      if (s > 0) out.push({ id: d.id, score: s });
    }
    return out.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  return { score };
}
