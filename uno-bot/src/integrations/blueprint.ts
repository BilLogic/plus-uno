// Read-only client for the uno-blueprint Supabase — the grounded source of
// truth for the Plus service blueprint (D8). No SDK: we call PostgREST over
// fetch to keep the Worker bundle small (same approach as the Notion/Slack
// clients). Read-only by design — the bot never writes to the blueprint.
//
// The blueprint models the Plus tutoring service as:
//   service_lifecycles → phases → service_scenarios → paths → (steps × layers = cells)
// Human-readable text lives in the name/description of those rows and in
// `cells.content`. search() runs a case-insensitive substring match across
// those fields and returns a normalized, citable shape.
//
// Config (see wrangler.toml):
//   SUPABASE_URL       project URL (non-secret [vars] entry)
//   SUPABASE_ANON_KEY  publishable/anon read key (secret) — RLS-protected

import type { Env } from "../types";

const REQUEST_TIMEOUT_MS = 10000;
const PER_TABLE_LIMIT = 6;
const MAX_ROWS = 15;

// Which tables to search and how to normalize them. `columns` are ilike-matched;
// `title`/`snippet` map a raw row onto the citable shape.
interface Source {
  table: string;
  kind: string;
  columns: string[];
  select: string;
}
const SOURCES: Source[] = [
  { table: "phases", kind: "phase", columns: ["name", "description"], select: "id,name,description" },
  { table: "service_scenarios", kind: "scenario", columns: ["name", "description"], select: "id,name,description" },
  { table: "paths", kind: "path", columns: ["name", "description"], select: "id,name,description,path_type" },
  { table: "steps", kind: "step", columns: ["name"], select: "id,name" },
  { table: "cells", kind: "cell", columns: ["content"], select: "id,content" },
];

export interface BlueprintRow {
  kind: string;
  id: string;
  title: string;
  snippet?: string;
}

export function isBlueprintConfigured(env: Env): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

// Split a free-text query into safe ilike terms: alphanumeric words of length
// >= 3 (so "session" matches but noise like "of"/"a" doesn't), capped so a long
// query can't explode the filter. Stripping non-alphanumerics also keeps the
// PostgREST or() filter syntax (which uses , . ( ) *) safe from injection.
function toTerms(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 3),
    ),
  ).slice(0, 5);
}

function normalize(src: Source, row: Record<string, unknown>): BlueprintRow | null {
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;
  if (src.kind === "cell") {
    const content = typeof row.content === "string" ? row.content.trim() : "";
    if (!content) return null;
    return { kind: src.kind, id, title: content.slice(0, 80), snippet: content };
  }
  const name = typeof row.name === "string" ? row.name : "";
  const description = typeof row.description === "string" ? row.description : undefined;
  if (!name) return null;
  return { kind: src.kind, id, title: name, snippet: description };
}

async function searchSource(
  base: string,
  key: string,
  src: Source,
  terms: string[],
  signal: AbortSignal,
): Promise<BlueprintRow[]> {
  const clauses = terms.flatMap((t) => src.columns.map((c) => `${c}.ilike.*${t}*`));
  if (!clauses.length) return [];
  const url =
    `${base}/rest/v1/${src.table}` +
    `?or=(${clauses.join(",")})&select=${src.select}&limit=${PER_TABLE_LIMIT}`;
  const res = await fetch(url, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Supabase ${res.status} on ${src.table}: ${err.message ?? "query failed"}`);
  }
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map((r) => normalize(src, r)).filter((r): r is BlueprintRow => r !== null);
}

/**
 * Search the uno-blueprint for rows matching a free-text query across the
 * service-blueprint tables. Throws on failure (caller surfaces it). Read-only.
 */
export async function searchBlueprint(env: Env, query: string): Promise<BlueprintRow[]> {
  if (!isBlueprintConfigured(env)) {
    throw new Error("uno-blueprint not configured — missing SUPABASE_URL / SUPABASE_ANON_KEY");
  }
  const terms = toTerms(query);
  if (!terms.length) return [];

  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const key = env.SUPABASE_ANON_KEY!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // One request per table, in parallel; a single failing table shouldn't sink
    // the whole search, so failures degrade to empty for that source.
    const perSource = await Promise.all(
      SOURCES.map((src) =>
        searchSource(base, key, src, terms, controller.signal).catch((err) => {
          console.warn(`[blueprint] ${src.table} search failed: ${err instanceof Error ? err.message : String(err)}`);
          return [] as BlueprintRow[];
        }),
      ),
    );
    return perSource.flat().slice(0, MAX_ROWS);
  } finally {
    clearTimeout(timer);
  }
}
