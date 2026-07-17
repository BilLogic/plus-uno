// Read-only client for the uno-blueprint Supabase — the grounded source of
// truth for the Plus service blueprint (D8). No SDK: we call PostgREST over
// fetch to keep the Worker bundle small. Read-only by design.
//
// Primary path: the server-side `search_blueprint(q text)` function — the
// join/union across blueprint tables happens in ONE subrequest (Cloudflare caps
// subrequests per request; the old 5-table fan-out per search could exhaust
// that budget on a multi-step question and kill the agent loop).
//
// Fallback: if that function doesn't exist yet (not created in Supabase), we run
// direct table queries so grounding still works — just with a few more
// subrequests. Both paths return each cell's `layer` (actor/stage, e.g.
// "Regular Tutor" / "Back Stage Actions") and `step`, so the bot attributes
// activities to the right actor instead of guessing.
//
// The SQL for search_blueprint lives in the project docs; run it once and
// `grant execute ... to anon` to get the single-subrequest path.

import type { Env } from "../types";
import { embedText, embeddingsConfigured } from "../vertex/embed";

const REQUEST_TIMEOUT_MS = 10000;
const RPC_NAME = "search_blueprint";
const PER_TABLE_LIMIT = 8;
const MAX_ROWS = 30;

// ── semantic_search (vector) path ─────────────────────────────────────────────
// Primary retrieval: embed the query, ask semantic_search.match_corpus_chunks
// for the nearest blueprint chunks (~2 subrequests total). Falls back to the
// keyword paths below on any miss, so it never regresses. Disable by setting the
// SEMANTIC_SEARCH var to "off".
const SEMANTIC_RPC = "match_corpus_chunks";
const SEMANTIC_SCHEMA = "semantic_search";
const SEMANTIC_MATCH_COUNT = 6;
// Cosine-similarity floor: below this, treat as no confident match and fall back
// to keyword search. Tunable from the semantic-quality of real queries.
const SEMANTIC_MIN_SIMILARITY = 0.5;

export interface BlueprintRow {
  kind: string;
  id: string;
  title: string;
  snippet?: string;
  /** For cells: the layer = actor/stage (e.g. "Regular Tutor", "Back Stage Actions"). */
  layer?: string;
  step?: string;
  scenario?: string;
  phase?: string;
  /** Cosine similarity, present only on semantic (vector) matches. */
  score?: number;
}

export class BlueprintUnavailableError extends Error {}

export function isBlueprintConfigured(env: Env): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

// Per-isolate result cache (same pattern as marketplace-search). A multi-step
// question often re-searches near-identical queries; serving repeats from cache
// costs zero subrequests — which matters on the free plan's 50/request cap.
const CACHE_TTL_MS = 60_000;
const searchCache = new Map<string, { at: number; rows: BlueprintRow[] }>();

function headers(key: string): Record<string, string> {
  return { apikey: key, authorization: `Bearer ${key}` };
}

function terms(query: string): string[] {
  return Array.from(
    new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)),
  ).slice(0, 6);
}

/**
 * Search the uno-blueprint. Tries the search_blueprint() RPC (1 subrequest);
 * falls back to direct table queries if the function isn't present. Throws
 * BlueprintUnavailableError when Supabase isn't configured at all. Read-only.
 */
export async function searchBlueprint(env: Env, query: string): Promise<BlueprintRow[]> {
  if (!isBlueprintConfigured(env)) {
    throw new BlueprintUnavailableError(
      "uno-blueprint not configured — missing SUPABASE_URL / SUPABASE_ANON_KEY",
    );
  }
  const q = query.trim();
  if (!q) return [];

  const cacheKey = terms(q).sort().join(" ");
  const hit = searchCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;

  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const key = env.SUPABASE_ANON_KEY!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Primary: semantic (vector) search. Any miss/failure → keyword paths below.
    if (env.SEMANTIC_SEARCH !== "off" && embeddingsConfigured(env)) {
      const sem = await trySemantic(env, base, key, q, controller.signal).catch(() => null);
      if (sem && sem.length) {
        console.log(`[blueprint] semantic hit (${sem.length})`);
        searchCache.set(cacheKey, { at: Date.now(), rows: sem });
        return sem;
      }
    }

    const rpc = await tryRpc(base, key, q, controller.signal);
    const rows = rpc !== null
      ? rpc.slice(0, MAX_ROWS)
      // RPC absent → direct-query fallback.
      : (await searchViaTables(base, key, q, controller.signal)).slice(0, MAX_ROWS);
    searchCache.set(cacheKey, { at: Date.now(), rows });
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

// Embed the query + call semantic_search.match_corpus_chunks. Returns null on
// any failure (unconfigured, embed error, RPC error, or nothing above the
// similarity floor) so the caller falls back to keyword search.
async function trySemantic(
  env: Env,
  base: string,
  key: string,
  q: string,
  signal: AbortSignal,
): Promise<BlueprintRow[] | null> {
  const embedding = await embedText(env, q, "RETRIEVAL_QUERY");
  if (!embedding) return null;
  const res = await fetch(`${base}/rest/v1/rpc/${SEMANTIC_RPC}`, {
    method: "POST",
    headers: {
      ...headers(key),
      "content-type": "application/json",
      // The match function lives in the semantic_search schema (exposed to the API).
      "content-profile": SEMANTIC_SCHEMA,
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: SEMANTIC_MATCH_COUNT,
      filter_source: "blueprint",
    }),
    signal,
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => [])) as Array<{
    title?: string;
    chunk?: string;
    ref_url?: string;
    similarity?: number;
  }>;
  if (!Array.isArray(data)) return null;
  const rows = data
    .filter((r) => (r.similarity ?? 0) >= SEMANTIC_MIN_SIMILARITY)
    .map((r): BlueprintRow => ({
      kind: "cell",
      id: "",
      title: r.title ?? "",
      snippet: r.chunk ?? "",
      score: typeof r.similarity === "number" ? Math.round(r.similarity * 1000) / 1000 : undefined,
    }));
  return rows.length ? rows : null;
}

// Returns rows, or null if the function doesn't exist (so the caller falls back).
async function tryRpc(
  base: string,
  key: string,
  q: string,
  signal: AbortSignal,
): Promise<BlueprintRow[] | null> {
  const res = await fetch(`${base}/rest/v1/rpc/${RPC_NAME}`, {
    method: "POST",
    headers: { ...headers(key), "content-type": "application/json" },
    body: JSON.stringify({ q }),
    signal,
  });
  if (res.ok) {
    const data = (await res.json().catch(() => [])) as BlueprintRow[];
    return Array.isArray(data) ? data : [];
  }
  const err = (await res.json().catch(() => ({}))) as { code?: string };
  if (res.status === 404 || err.code === "PGRST202") return null; // function not created yet
  throw new Error(`Supabase rpc ${res.status}${err.code ? ` ${err.code}` : ""}`);
}

interface Source {
  table: string;
  kind: string;
  columns: string[];
  select: string;
}
const SOURCES: Source[] = [
  { table: "phases", kind: "phase", columns: ["name", "description"], select: "id,name,description" },
  { table: "service_scenarios", kind: "scenario", columns: ["name", "description"], select: "id,name,description" },
  { table: "steps", kind: "step", columns: ["name"], select: "id,name,scenario:service_scenarios(name)" },
  {
    table: "cells",
    kind: "cell",
    columns: ["content"],
    select: "id,content,layer:layers(name),step:steps(name),path:paths(name,scenario:service_scenarios(name))",
  },
];

async function searchViaTables(
  base: string,
  key: string,
  q: string,
  signal: AbortSignal,
): Promise<BlueprintRow[]> {
  const words = terms(q);
  if (!words.length) return [];

  const perSource = await Promise.all(
    SOURCES.map(async (src) => {
      const clauses = words.flatMap((t) => src.columns.map((c) => `${c}.ilike.*${t}*`));
      const url = `${base}/rest/v1/${src.table}?or=(${clauses.join(",")})&select=${src.select}&limit=${PER_TABLE_LIMIT}`;
      try {
        const res = await fetch(url, { headers: headers(key), signal });
        if (!res.ok) return [] as BlueprintRow[];
        const rows = (await res.json()) as Record<string, unknown>[];
        return rows.map((r) => normalize(src, r)).filter((r): r is BlueprintRow => r !== null);
      } catch {
        return [] as BlueprintRow[];
      }
    }),
  );
  return perSource.flat();
}

function normalize(src: Source, row: Record<string, unknown>): BlueprintRow | null {
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;
  const scenarioName = (row.scenario as { name?: string } | undefined)?.name;
  if (src.kind === "cell") {
    const content = typeof row.content === "string" ? row.content.trim() : "";
    if (!content) return null;
    const path = row.path as { scenario?: { name?: string } } | undefined;
    return {
      kind: "cell",
      id,
      title: content.slice(0, 80),
      snippet: content,
      layer: (row.layer as { name?: string } | undefined)?.name,
      step: (row.step as { name?: string } | undefined)?.name,
      scenario: path?.scenario?.name,
    };
  }
  const name = typeof row.name === "string" ? row.name : "";
  if (!name) return null;
  return {
    kind: src.kind,
    id,
    title: name,
    snippet: typeof row.description === "string" ? row.description : undefined,
    scenario: scenarioName,
  };
}
