// Read-only marketplace search. Fetches src/pages/PrototypeMarket/prototypes-data.js
// from GitHub Raw, extracts the `prototypes` array, normalizes the JS object
// literal to JSON, parses, and filters case-insensitively.
//
// The normalization is intentionally narrow: this works for the current
// catalog format (single-quoted strings, unquoted keys, trailing commas, no
// apostrophes in values). If the catalog grows template literals or
// embedded apostrophes, swap this for a JSON mirror generated at commit
// time. See bot-skills/uno-marketplace/SKILL.md for the contract.

import type { Env } from "../types";

interface Prototype {
  id: string;
  title: string;
  description: string;
  deploymentUrl: string | null;
  notionCardUrl?: string | null;
  notionCardId?: string | null;
  stage: "low" | "mid" | "high";
  lastUpdated?: string;
  creators: string[];
  contributors?: string[];
  productPillar: string;
  localPath?: string | null;
  repoPath: string;
  loomVideoUrl?: string | null;
}

const CATALOG_PATH = "src/pages/PrototypeMarket/prototypes-data.js";
const MAX_RESULTS = 10;

let cachedCatalog: { fetchedAt: number; data: Prototype[] } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute — short, so edits show up quickly

export async function executeMarketplaceSearch(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) {
    return JSON.stringify({ ok: false, error: "empty query" });
  }

  let catalog: Prototype[];
  try {
    catalog = await fetchCatalog(env);
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: `failed to load catalog: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  const matches = scoreAndRank(catalog, query).slice(0, MAX_RESULTS);
  return JSON.stringify({
    ok: true,
    query,
    total_matches: matches.length,
    total_catalog: catalog.length,
    results: matches,
  });
}

async function fetchCatalog(env: Env): Promise<Prototype[]> {
  if (cachedCatalog && Date.now() - cachedCatalog.fetchedAt < CACHE_TTL_MS) {
    return cachedCatalog.data;
  }
  const url = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/main/${CATALOG_PATH}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const code = await res.text();
  const data = parsePrototypesArray(code);
  cachedCatalog = { fetchedAt: Date.now(), data };
  return data;
}

// Pulls just the `export const prototypes = [ … ];` array out of the .js file
// and converts the object-literal text to JSON for safe parsing.
export function parsePrototypesArray(jsSource: string): Prototype[] {
  const match = jsSource.match(/export\s+const\s+prototypes\s*=\s*(\[[\s\S]*?\n\];)/);
  if (!match || !match[1]) {
    throw new Error("could not locate `export const prototypes = [...]`");
  }
  const arrayLiteral = match[1].replace(/;\s*$/, "");
  const json = arrayLiteral
    // single-quoted strings → JSON-safe double-quoted (JSON.stringify handles escapes)
    .replace(/'([^']*)'/g, (_, s: string) => JSON.stringify(s))
    // unquoted object keys → quoted (only at { or , positions)
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // trailing commas
    .replace(/,(\s*[\]}])/g, "$1");
  return JSON.parse(json) as Prototype[];
}

interface ScoredPrototype extends Prototype {
  _score: number;
}

function scoreAndRank(catalog: Prototype[], query: string): Prototype[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: ScoredPrototype[] = [];
  for (const p of catalog) {
    const haystack = [
      p.id,
      p.title,
      p.description,
      p.productPillar,
      p.stage,
      ...(p.creators ?? []),
      ...(p.contributors ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const t of terms) {
      if (haystack.includes(t)) score += 1;
      if (p.id === t) score += 5; // exact id hit
      if (p.title.toLowerCase() === t) score += 3;
    }
    if (score > 0) scored.push({ ...p, _score: score });
  }
  scored.sort((a, b) => b._score - a._score);
  return scored.map(({ _score, ...rest }) => rest);
}
