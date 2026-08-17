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
import { countedFetch, rethrowIfBudget, subrequestBudgetSpent } from "../net";
import { cellUrl, sliceUrl, parseChunkTitle, chunkBody } from "./blueprint-link";
import {
  renderBlueprintIndex,
  semanticCap,
  mergedCap,
  type BlueprintIndex,
  type BlueprintCappedBy,
} from "./blueprint-index";

// Re-exported so the tool layer has ONE import for the blueprint integration.
export { renderBlueprintIndex, FUTURE_LABELS, futureLabel } from "./blueprint-index";
export type { BlueprintIndex, BlueprintCappedBy } from "./blueprint-index";

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
// Was 6, out of ~800 indexed chunks. A niche-but-real future path (the
// Prototype branch under Wrap-Up) never made a top-6 cut against the mass of
// happy-path cells, so the bot reported it does not exist. 15 is still one
// subrequest and one response; the cost is response tokens, not latency or
// subrequest budget.
const SEMANTIC_MATCH_COUNT = 15;
// Cosine-similarity floor: below this, treat as no confident match and fall back
// to keyword search. Tunable from the semantic-quality of real queries.
const SEMANTIC_MIN_SIMILARITY = 0.5;
// Below this many surviving semantic hits, ALSO run the keyword pass and merge.
//
// The tradeoff: the old code short-circuited on >= 1 hit above the floor, so a
// single weak-but-passing vector match suppressed keyword search entirely — and
// keyword is the ONLY path that can match a path by its NAME (`Planned:` /
// `Prototype:` — see SOURCES below). One extra subrequest, and only when the
// semantic result
// is thin; a healthy semantic result (>= 3) still short-circuits exactly as
// before, so the common case costs nothing.
const SEMANTIC_THIN_RESULTS = 3;

export interface BlueprintRow {
  kind: string;
  id: string;
  title: string;
  snippet?: string;
  /** cells.description — the longer detail field. A cell can carry ALL of its
   *  evidence here with an empty `content` (blueprint-navigation.md § 2), so
   *  dropping it lost real answers. */
  description?: string;
  /** For cells: the layer = actor/stage (e.g. "Regular Tutor", "Back Stage Actions"). */
  layer?: string;
  step?: string;
  scenario?: string;
  phase?: string;
  /** Cosine similarity, present only on semantic (vector) matches. */
  score?: number;
  /** cells.links — URLs the blueprint AUTHORS attached to this cell. Already in
   *  the table; never surfaced before, so the richest citation material the
   *  blueprint has was being fetched and thrown away. */
  links?: string[];
  /** cells.updated_at. The tool tells the model to flag a stale blueprint; it
   *  could not, because it was never given a date to judge. */
  updatedAt?: string;
  /** The path variant (e.g. "Happy Path (happy)", "Prototype: Reflection redesign (named)").
   *  On semantic hits it comes from the indexed breadcrumb; on keyword hits from
   *  `paths.name` — never `path_type`, per blueprint-navigation.md § 4. */
  path?: string;
  /** Deep link that opens this row in the blueprint app. Present only when
   *  BLUEPRINT_APP_URL is set AND the row has an id to link to — a URL that
   *  resolves to nothing is worse than no URL. */
  url?: string;
}

/** Which retrieval path answered, and whether the result was capped.
 *
 *  Three paths degrade silently into each other (semantic → RPC → table
 *  fan-out) and nothing reported which one ran, so "are blueprint answers any
 *  good?" was unanswerable — the same silent-degradation class as the
 *  chat.startStream null that cost a day of wrong conclusions. */
export type BlueprintRetrieval = "semantic" | "rpc" | "tables";

export interface BlueprintSearchResult {
  rows: BlueprintRow[];
  retrieval: BlueprintRetrieval;
  /** True when a cap clipped the result — the model must be able to say
   *  "there is more than this" instead of narrating a partial view as whole. */
  truncated: boolean;
  /** Which cap did the clipping; null when nothing was clipped. */
  capped_by: BlueprintCappedBy;
  /** True when these rows came from the per-isolate cache rather than a fetch
   *  made during THIS call.
   *
   *  AGENT.md requires a freshness claim ("I checked just now") to be backed by
   *  a read this turn. Nothing distinguished a fetch from a cache hit, so the
   *  claim was unauditable — and a user pushing back got the same rows while
   *  being told they were re-fetched. */
  cached: boolean;
  /** How old the cached rows are, in ms. 0 on a fresh fetch. */
  age_ms: number;
  /** True when the semantic pass did NOT produce a healthy result
   *  (fewer than SEMANTIC_THIN_RESULTS confident matches) — which includes the
   *  case where it did not run at all. Thin means the keyword pass carried the
   *  answer, so per-row `score` is absent or weak and confidence should follow. */
  thin: boolean;
  /** Best cosine similarity across the returned rows; absent when no row
   *  carries a score (keyword-only result). */
  top_score?: number;
}

/** cells.links is jsonb — authored by humans, so it arrives as bare URL strings
 *  OR as objects. Anything that is not a usable http(s) URL is dropped rather
 *  than passed to the model: a half-parsed link is a fabricated citation, which
 *  is the one thing this tool exists to prevent. */
function normalizeLinks(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const item of raw) {
    const url =
      typeof item === "string"
        ? item
        : typeof (item as { url?: unknown } | null)?.url === "string"
          ? (item as { url: string }).url
          : "";
    if (/^https?:\/\//i.test(url)) out.push(url);
  }
  return out.length ? out : undefined;
}

export class BlueprintUnavailableError extends Error {}

export function isBlueprintConfigured(env: Env): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

// Per-isolate result cache (same pattern as marketplace-search). A multi-step
// question often re-searches near-identical queries; serving repeats from cache
// costs zero subrequests — which matters on the free plan's 50/request cap.
const CACHE_TTL_MS = 60_000;
const searchCache = new Map<string, { at: number; result: BlueprintSearchResult }>();

function headers(key: string): Record<string, string> {
  return { apikey: key, authorization: `Bearer ${key}` };
}

/** The query, safe to put in a log line: one line, bounded, quoted.
 *
 *  Every `[blueprint]` line carried retrieval/rows/cache but not WHAT was
 *  asked, so a bad answer in Slack could not be traced back to the query that
 *  produced it — the eval rubric's retrieval question (R14) was unscoreable
 *  from logs alone. 120 chars is past the point where two questions look alike.
 */
function logQuery(q: string): string {
  const flat = q.replace(/\s+/g, " ").trim();
  return ` q="${(flat.length > 120 ? `${flat.slice(0, 120)}…` : flat).replace(/"/g, "'")}"`;
}

function terms(query: string): string[] {
  return Array.from(
    new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)),
  ).slice(0, 6);
}

export interface BlueprintSearchOptions {
  /** Skip the 60s result cache and hit Supabase again.
   *
   *  WHY: the cache keys on the query's terms, so a user pushing back ("no,
   *  check again — it IS in there") re-runs a near-identical query and gets the
   *  SAME cached rows back, while the bot says it just re-checked. That is a
   *  cache serving a lie, not a stale read.
   *
   *  INTENDED CALL SITE: the correction-detection path in
   *  src/tools/blueprint-search.ts — when the turn is a user correction or an
   *  explicit re-check, pass `{ fresh: true }`. Everything else keeps the
   *  cache, which is what protects the subrequest budget on multi-step
   *  questions. The fresh result still POPULATES the cache, so the re-check
   *  costs one round trip, not every subsequent one. */
  fresh?: boolean;
}

/**
 * Search the uno-blueprint. Tries the search_blueprint() RPC (1 subrequest);
 * falls back to direct table queries if the function isn't present. Throws
 * BlueprintUnavailableError when Supabase isn't configured at all. Read-only.
 */
export async function searchBlueprint(
  env: Env,
  query: string,
  options: BlueprintSearchOptions = {},
): Promise<BlueprintSearchResult> {
  if (!isBlueprintConfigured(env)) {
    throw new BlueprintUnavailableError(
      "uno-blueprint not configured — missing SUPABASE_URL / SUPABASE_ANON_KEY",
    );
  }
  const q = query.trim();
  if (!q) {
    return {
      rows: [],
      retrieval: "tables",
      truncated: false,
      capped_by: null,
      cached: false,
      age_ms: 0,
      thin: false,
    };
  }

  // Keyed on the NORMALISED QUERY, not on its term bag. `terms()` lowercases,
  // drops words under 3 characters, dedupes and then keeps only the first six —
  // so two genuinely different questions that happen to share those six words
  // collided, and the second one was served the first one's rows while the
  // payload still described them as a read of the second query. Whitespace and
  // case are still folded, which is all the reuse this cache was ever meant to
  // capture on a multi-step question.
  const cacheKey = q.toLowerCase().replace(/\s+/g, " ").trim();
  const hit = options.fresh ? undefined : searchCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    const age = Date.now() - hit.at;
    // A cache hit used to return here BEFORE any logging, so the failing thread
    // looked like it never searched at all. One line per served result,
    // whichever way it was served.
    console.log(
      `[blueprint] retrieval=${hit.result.retrieval} rows=${hit.result.rows.length} cached=1 age_ms=${age}${logQuery(q)}`,
    );
    return { ...hit.result, cached: true, age_ms: age };
  }

  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const key = env.SUPABASE_ANON_KEY!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Primary: semantic (vector) search. Any miss/failure → keyword paths below.
    let semantic: BlueprintRow[] = [];
    if (env.SEMANTIC_SEARCH !== "off" && embeddingsConfigured(env)) {
      const sem = await trySemantic(env, base, key, q, controller.signal)
        .catch((e) => { rethrowIfBudget(e); return null; });
      if (sem && sem.length) {
        semantic = sem;
        // Short-circuit only on a HEALTHY semantic result. A thin one falls
        // through to the keyword pass and the two get merged — see
        // SEMANTIC_THIN_RESULTS for why one weak hit must not silence keyword.
        // No withUrls() here: trySemantic already carries each row's `url`.
        if (semantic.length >= SEMANTIC_THIN_RESULTS) {
          // The vector pass asks for at most SEMANTIC_MATCH_COUNT chunks. A full
          // house means the cut-off, not the corpus, ended the list — this
          // shape used to report truncated:false, i.e. the MOST COMMON result
          // claimed completeness while clipped.
          const cap = semanticCap(semantic.length, SEMANTIC_MATCH_COUNT);
          const result: BlueprintSearchResult = {
            rows: semantic,
            retrieval: "semantic",
            ...cap,
            cached: false,
            age_ms: 0,
            thin: false,
            ...topScore(semantic),
          };
          console.log(
            `[blueprint] retrieval=semantic rows=${semantic.length} cached=0 age_ms=0` +
              `${cap.truncated ? " (truncated capped_by=semantic)" : ""}` +
              `${result.top_score !== undefined ? ` top_score=${result.top_score}` : ""}` +
              logQuery(q),
          );
          searchCache.set(cacheKey, { at: Date.now(), result });
          return result;
        }
      }
    }

    // The keyword pass is a SUPPLEMENT once semantic rows exist. Letting it
    // throw here discarded rows the semantic pass had already found and turned
    // a thin-but-real result into "blueprint query failed" — a false absence
    // manufactured by the more reliable path being taken down by the less
    // reliable one. A budget error still propagates: that means the invocation
    // is out of reads, which the caller has to report rather than paper over.
    let rpc: BlueprintRow[] | null = null;
    let keyword: BlueprintRow[] = [];
    let keywordFailed = false;
    try {
      rpc = await tryRpc(base, key, q, controller.signal);
      keyword = rpc !== null ? rpc : await searchViaTables(base, key, q, controller.signal);
    } catch (e) {
      rethrowIfBudget(e);
      if (!semantic.length) throw e; // nothing else to fall back on — report honestly
      keywordFailed = true;
      console.log(
        `[blueprint] keyword pass failed, serving ${semantic.length} semantic row(s): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    // Semantic rows lead when they exist: they are the higher-precision path,
    // and MAX_ROWS clips from the tail.
    const found = semantic.length ? mergeRows(semantic, keyword) : keyword;
    // Attribute the merged case to "semantic" — it is the path that ran first
    // and the one whose caveat (chunks carry no authored `links`) still applies
    // to part of the result.
    const retrieval: BlueprintRetrieval = semantic.length ? "semantic" : rpc !== null ? "rpc" : "tables";
    // Counted BEFORE the slice: after it, the overflow is invisible.
    const cap = mergedCap(found.length, MAX_ROWS);
    const rows = withUrls(env, found).slice(0, MAX_ROWS);
    const result: BlueprintSearchResult = {
      rows,
      retrieval,
      ...cap,
      cached: false,
      age_ms: 0,
      // Reaching here at all means the semantic pass was thin (or absent) —
      // the healthy case short-circuited above.
      thin: semantic.length < SEMANTIC_THIN_RESULTS,
      ...topScore(rows),
    };
    // One line per search saying WHICH path served it. Without this the tool
    // degrades semantic → rpc → tables in silence, and answer quality drifts
    // with nothing to attribute it to.
    console.log(
      `[blueprint] retrieval=${retrieval} rows=${result.rows.length} cached=0 age_ms=0` +
        `${cap.truncated ? " (truncated capped_by=max_rows)" : ""}` +
        `${result.thin ? " thin=1" : ""}` +
        `${keywordFailed ? " keyword=failed" : ""}` +
        `${result.top_score !== undefined ? ` top_score=${result.top_score}` : ""}` +
        logQuery(q),
    );
    searchCache.set(cacheKey, { at: Date.now(), result });
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Attach the app deep link to every row that can carry one.
 *
 * Cells only. A phase/scenario/step row has an id, but the app's URL vocabulary
 * has no param for them (uno-blueprint src/lib/urlViewState.ts: `cell`, `slice`,
 * `mode`, `frame`) — inventing `?step=` here would hand the model a link that
 * silently opens the plain blueprint and looks like it worked.
 */
function withUrls(env: Env, rows: BlueprintRow[]): BlueprintRow[] {
  if (!env.BLUEPRINT_APP_URL) return rows;
  return rows.map((row) =>
    row.kind === "cell" && row.id ? { ...row, url: cellUrl(env.BLUEPRINT_APP_URL, row.id) } : row,
  );
}

/** Text signature used to spot the same cell arriving from two paths.
 *
 *  Ids alone cannot dedupe across paths on older deployments (`source_key` was
 *  added to `match_corpus_chunks`'s return late; before that, semantic rows
 *  have no id). This compares the body text instead — and it can compare it
 *  directly, because `chunkBody` has already stripped the breadcrumb line the
 *  semantic chunk repeats, so both paths present plain cell prose.
 *
 *  Deliberately loose. A missed duplicate costs tokens; a false merge would
 *  delete evidence, so it errs toward keeping both. */
function signature(row: BlueprintRow): string {
  return (row.snippet ?? row.title ?? "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Best per-row similarity, as a spreadable partial so an absent score omits
 *  the key rather than emitting `top_score: undefined` into the tool payload.
 *
 *  Every row already carried `score`; nothing ever read it, so "was this a
 *  confident match or the best of a bad set?" was computed and thrown away on
 *  every search. */
function topScore(rows: BlueprintRow[]): { top_score?: number } {
  let best: number | undefined;
  for (const r of rows) {
    if (typeof r.score === "number" && (best === undefined || r.score > best)) best = r.score;
  }
  return best === undefined ? {} : { top_score: best };
}

/** Semantic rows first, then the keyword rows that add something new. */
function mergeRows(semantic: BlueprintRow[], keyword: BlueprintRow[]): BlueprintRow[] {
  const seen = new Set(semantic.map(signature).filter(Boolean));
  const extra = keyword.filter((r) => {
    const sig = signature(r);
    if (sig && seen.has(sig)) return false;
    if (sig) seen.add(sig);
    return true;
  });
  return [...semantic, ...extra];
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
  const res = await countedFetch(`${base}/rest/v1/rpc/${SEMANTIC_RPC}`, {
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
    source_key?: string;
    title?: string;
    chunk?: string;
    ref_url?: string;
    updated_at?: string;
    similarity?: number;
  }>;
  if (!Array.isArray(data)) return null;
  // `source_key` is the cell uuid and `title` is the breadcrumb the backfill
  // built. Both were being discarded, which is why the best-recall path was
  // also the only uncitable, unlinkable one (`source_key` was added to
  // `match_corpus_chunks`'s return late; older deployments get no id/url here).
  const rows = data
    .filter((r) => (r.similarity ?? 0) >= SEMANTIC_MIN_SIMILARITY)
    .map((r): BlueprintRow => {
      const crumb = parseChunkTitle(r.title);
      const id = typeof r.source_key === "string" ? r.source_key : "";
      return {
        kind: "cell",
        id,
        title: r.title ?? "",
        snippet: chunkBody(r.chunk, r.title),
        layer: crumb.layer,
        step: crumb.step,
        scenario: crumb.scenario,
        // The breadcrumb's leading `Phase:` segment. Without it
        // the model cannot cite `phase › scenario › path — layer × step` on the
        // PRIMARY retrieval path, and guesses the phase from a scenario name
        // that sounds like one.
        phase: crumb.phase,
        path: crumb.path,
        score: typeof r.similarity === "number" ? Math.round(r.similarity * 1000) / 1000 : undefined,
        updatedAt: typeof r.updated_at === "string" ? r.updated_at.slice(0, 10) : undefined,
        url: cellUrl(env.BLUEPRINT_APP_URL, id),
      };
    });
  return rows.length ? rows : null;
}

// Returns rows, or null if the function doesn't exist (so the caller falls back).
async function tryRpc(
  base: string,
  key: string,
  q: string,
  signal: AbortSignal,
): Promise<BlueprintRow[] | null> {
  const res = await countedFetch(`${base}/rest/v1/rpc/${RPC_NAME}`, {
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
  // paths was missing entirely, so a path named `Planned: …` / `Prototype: …`
  // could not be matched by keyword at all — the one retrieval path that can
  // match a structural name rather than cell prose. The whole future-state
  // branch of the blueprint was unreachable by name.
  {
    table: "paths",
    kind: "path",
    columns: ["name", "description"],
    select: "id,name,description,scenario:service_scenarios(name)",
  },
  {
    table: "cells",
    kind: "cell",
    // `description` was not searchable — which is why cells whose evidence
    // begins "PLANNED (not shipped as of Aug 2026):" never matched a keyword
    // query about planned/future work.
    columns: ["content", "description"],
    // Spec columns ride along (function/form/value_props/owner/perceived_owner
    // are public-read): "who owns this touchpoint / what does it do" questions
    // were answered "not in the blueprint" while the data sat one select away.
    select:
      "id,content,description,function,form,value_props,owner,perceived_owner,links,updated_at,layer:layers(name,owner_team,kpis),step:steps(name),path:paths(name,scenario:service_scenarios(name,phase:phases(name)))",
  },
];

/**
 * Tables the keyword fallback fans out over — one subrequest each. Derived from
 * SOURCES, not copied, so adding a table updates blueprint_search's worst-case
 * bound in loop-shared automatically instead of silently exceeding it.
 */
export const BLUEPRINT_TABLE_FANOUT = SOURCES.length;

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
        const res = await countedFetch(url, { headers: headers(key), signal });
        if (!res.ok) return [] as BlueprintRow[];
        const rows = (await res.json()) as Record<string, unknown>[];
        return rows.map((r) => normalize(src, r)).filter((r): r is BlueprintRow => r !== null);
      } catch (e) {
        // An empty table is a fine answer to a failed query, but a LIE about a
        // budget stop — that would report "not in the blueprint" for a scenario
        // we simply ran out of budget to read.
        rethrowIfBudget(e);
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
    const description = typeof row.description === "string" ? row.description.trim() : "";
    const links = normalizeLinks(row.links);
    // A cell can carry ALL of its evidence in `description` or `links` with an
    // empty `content` (blueprint-navigation.md § 2: "A cell can carry real
    // evidence with an empty content ... Check all four before calling a topic
    // empty"). Dropping on empty content silently deleted exactly the rows a
    // description-matched query had just found.
    if (!content && !description && !links?.length) return null;
    const path = row.path as
      | { name?: string; scenario?: { name?: string; phase?: { name?: string } } }
      | undefined;
    const layer = (row.layer as { name?: string } | undefined)?.name;
    const step = (row.step as { name?: string } | undefined)?.name;
    // Falls back to the cell's coordinate so a links-only cell still has a
    // human-readable handle instead of an empty title.
    const primary =
      content || description || [layer, step].filter(Boolean).join(" × ") || "(cell)";
    return {
      kind: "cell",
      id,
      title: primary.slice(0, 80),
      snippet: content || undefined,
      description: description || undefined,
      layer,
      step,
      path: path?.name,
      scenario: path?.scenario?.name,
      phase: path?.scenario?.phase?.name,
      links,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at.slice(0, 10) : undefined,
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

// ── Live table of contents ───────────────────────────────────────────────────
//
// Search answers "where is X". Nothing answered "what EXISTS" — so a retrieval
// miss and a real absence were indistinguishable, and the bot reported a path
// named `Planned: …` / `Prototype: …` as non-existent because its query never
// reached it.
// The index is the structural skeleton (phases › scenarios › path counts) read
// live, so an absence claim becomes a LOOKUP against a listing rather than an
// inference from an empty result set.
//
// The renderer is pure and lives in ./blueprint-index (where unit tests can
// reach it); only the read and its cache are here.

/** Orientation TTL. Ten minutes, versus 60s for search results: the structure
 *  changes when someone adds a scenario, not when someone asks a question. */
const INDEX_TTL_MS = 600_000;

/** Module-scope SINGLE slot — the index takes no arguments, so there is exactly
 *  one value to cache per isolate. See fetchBlueprintIndex for why `fresh` does
 *  NOT clear it. */
let indexCache: { at: number; index: BlueprintIndex } | undefined;

/**
 * Read the live index: one PostgREST call, both FKs declared so the two-level
 * embed resolves server-side (6 phases / 23 scenarios / 39 paths ≈ 2.3KB).
 *
 * Returns undefined rather than throwing on any failure — same degradation
 * posture as fetchEdges/fetchRows. The caller distinguishes "unavailable" from
 * "no future path exists"; an omitted key that reads as absence is the exact
 * bug this exists to fix.
 *
 * @param env - Worker env (SUPABASE_URL / SUPABASE_ANON_KEY)
 * @param opts - `fresh` is accepted for signature symmetry with
 *   searchBlueprint and DELIBERATELY does not bust this cache. Orientation is
 *   per-isolate STRUCTURAL data, not per-query data: a user pushing back
 *   re-queries cells, and re-reading the same 23 scenarios each time would
 *   multiply index fetches against LOOKUP_CEILING = 38 (loop-shared.ts) —
 *   three searches a turn already cost 36. The TTL, not the caller, decides.
 */
export async function fetchBlueprintIndex(
  env: Env,
  opts: { fresh?: boolean } = {},
): Promise<BlueprintIndex | undefined> {
  void opts.fresh; // see @param — intentionally ignored, not forgotten
  if (!isBlueprintConfigured(env)) return undefined;

  const hit = indexCache;
  if (hit && Date.now() - hit.at < INDEX_TTL_MS) return hit.index;

  // Checked BEFORE the fetch, and never caught-and-swallowed after it: the
  // index is an enrichment on a search that has ALREADY succeeded, so it must
  // not be the call that trips the ceiling and unwinds that search. (The check
  // itself records a budget trip, so the boundary still learns the turn
  // returned less than it was asked for.)
  if (subrequestBudgetSpent()) {
    console.warn("[blueprint] index read failed (subrequest budget spent)");
    return undefined;
  }

  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const select = "name,service_scenarios(name,paths(name))";
  const url =
    `${base}/rest/v1/phases?select=${encodeURIComponent(select)}` +
    `&order=order_position&service_scenarios.order=order_position`;
  try {
    const res = await countedFetch(
      url,
      { headers: headers(env.SUPABASE_ANON_KEY!) },
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      console.warn(`[blueprint] index read failed (${res.status})`);
      return undefined;
    }
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) {
      console.warn("[blueprint] index read failed (unexpected payload)");
      return undefined;
    }
    const index = renderBlueprintIndex(data, new Date().toISOString().slice(0, 10));
    indexCache = { at: Date.now(), index };
    return index;
  } catch (e) {
    // rethrowIfBudget FIRST: a swallowed budget stop would report the structure
    // as unreadable when it was merely unaffordable — the false-absence bug.
    rethrowIfBudget(e);
    console.warn(`[blueprint] index read failed (${(e as Error)?.message ?? "error"})`);
    return undefined;
  }
}

// ── Opt-in reads: edges, findings, slices ────────────────────────────────────
//
// These answer questions cells alone cannot — "what breaks if we drop X",
// "what's already flagged here", "is there a view I can show someone" — and
// every one of them is readable by the anon role (supabase/DATABASE.md:117:
// "Blueprint tables and `services` have RLS enabled with public SELECT
// policies").
//
// OPT-IN, not automatic. Each is one subrequest against a 50-per-invocation
// cap that a blueprint fallback search can already spend BLUEPRINT_TABLE_FANOUT
// of (one per entry in SOURCES — 5 since `paths` was added). A status
// question must not pay for the impact graph it will never look at.

export interface BlueprintEdge {
  from: string;
  to: string;
  direction: "downstream" | "upstream";
  /** "trigger" = source sets target in motion (temporal); "needs" = source
   *  depends on target existing (functional). Distinct relations in the app —
   *  narrating a needs edge as "what it sets off" misstates the blueprint. */
  kind: "trigger" | "needs";
  /** Authored why-line for the edge, when the designer wrote one. */
  note?: string;
}

/**
 * Cells that trigger, or are triggered by, the given cells — one hop.
 *
 * One subrequest: PostgREST embeds both ends of the FK, so the neighbour's
 * content arrives with the edge instead of needing a second lookup per id.
 *
 * One hop only, deliberately. The plugin walks the graph with a dedicated
 * impact-tracer agent and a visited set for cycles (loops_to_phase cycles are
 * legal in this data). Reproducing that here would be a worse version of
 * something that already exists — the bot's honest job is "here is what sits
 * next to this, go trace it properly", not a half-built tracer.
 */
export async function fetchEdges(env: Env, cellIds: string[]): Promise<BlueprintEdge[]> {
  const ids = cellIds.filter(Boolean).slice(0, 10);
  if (!isBlueprintConfigured(env) || ids.length === 0) return [];
  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const list = `(${ids.join(",")})`;
  const select =
    "source_cell_id,target_cell_id,kind,label,note," +
    "source:cells!cell_triggers_source_cell_id_fkey(content)," +
    "target:cells!cell_triggers_target_cell_id_fkey(content)";
  const url =
    `${base}/rest/v1/cell_triggers` +
    `?or=(source_cell_id.in.${list},target_cell_id.in.${list})` +
    `&select=${encodeURIComponent(select)}&limit=40`;
  const res = await countedFetch(url, { headers: headers(env.SUPABASE_ANON_KEY!) });
  if (!res.ok) {
    console.warn(`[blueprint] edges read failed (${res.status})`);
    return [];
  }
  const data = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
  if (!Array.isArray(data)) return [];
  const text = (v: unknown) =>
    typeof (v as { content?: unknown } | null)?.content === "string"
      ? (v as { content: string }).content.slice(0, 120)
      : "";
  return data.flatMap((r): BlueprintEdge[] => {
    const from = text(r.source);
    const to = text(r.target);
    if (!from || !to) return [];
    const startedHere = ids.includes(String(r.source_cell_id));
    const kind = r.kind === "needs" ? "needs" : "trigger";
    const note =
      [r.label, r.note]
        .filter((v): v is string => typeof v === "string" && v.length > 0)
        .join(" — ") || undefined;
    return [
      {
        from,
        to,
        direction: startedHere ? "downstream" : "upstream",
        kind,
        ...(note ? { note } : {}),
      },
    ];
  });
}

/** Rows from a table whose columns this Worker does not pin.
 *
 *  `findings` and `slices` were added after supabase/schema.reference.sql was
 *  captured, so their columns are read with select=* and passed through as-is
 *  rather than mapped against a shape that might be wrong. Guessing a column
 *  name here would produce a confidently empty field, which is worse than
 *  handing the model what the table actually returned. */
async function fetchRows(
  env: Env,
  table: string,
  qs: string,
  limit: number,
): Promise<{ rows: Array<Record<string, unknown>>; total: number | undefined }> {
  if (!isBlueprintConfigured(env)) return { rows: [], total: undefined };
  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const res = await countedFetch(`${base}/rest/v1/${table}?select=*&${qs}&limit=${limit}`, {
    // count=exact rides the SAME request (PostgREST answers in
    // content-range), so the table's true size arrives with the page. A
    // capped page without its total is how "how many X" answers became the
    // page size (the model counted what it was shown).
    headers: { ...headers(env.SUPABASE_ANON_KEY!), prefer: "count=exact" },
  });
  if (!res.ok) {
    // A missing table is a legitimate outcome (not every deployment has run
    // every migration), so this degrades to "no rows" rather than failing the
    // whole search.
    console.warn(`[blueprint] ${table} read failed (${res.status})`);
    return { rows: [], total: undefined };
  }
  const data = await res.json().catch(() => []);
  // content-range: "0-9/14" — the denominator is the unfiltered-by-limit total.
  const range = res.headers.get("content-range");
  const totalText = range?.split("/")[1];
  const total =
    totalText && totalText !== "*" && Number.isFinite(Number(totalText))
      ? Number(totalText)
      : undefined;
  return {
    rows: Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [],
    total,
  };
}

/** Audit findings already recorded against these cells. A READ — triage is a
 *  write, so it stays in the app where a service-tier session can do it.
 *
 *  `findings.cell_ids` is a uuid ARRAY (one finding can span cells), not a
 *  scalar `cell_id`. The old `cell_id=in.(…)` filter asked for a column that
 *  does not exist: PostgREST 400s, fetchRows logs a warning and returns [], and
 *  the tool reported "no findings" for cells that had them. Array overlap
 *  (`ov`) is the correct operator, and it needs `{}`, not `()`. */
export async function fetchFindings(
  env: Env,
  cellIds: string[],
): Promise<{ rows: Array<Record<string, unknown>>; total: number | undefined }> {
  const ids = cellIds.filter(Boolean).slice(0, 10);
  if (ids.length === 0) return { rows: [], total: 0 };
  // Open findings only: the app's triage invariant is "dismissed stays
  // dismissed" — re-surfacing closed findings in Slack re-litigates a call
  // the team already made in-app, and closed rows eat the 20-row cap.
  //
  // The total rides along: `fetchRows` already counted the full matched set
  // under count=exact, and dropping it re-creates the counted-the-capped-page
  // bug that 258cfd02 fixed for slices ("5 of 14").
  const { rows, total } = await fetchRows(env, "findings", `cell_ids=ov.{${ids.join(",")}}&status=eq.open`, 20);
  return { rows, total };
}

/** Named slices someone already cut. Points at an existing view instead of
 *  improvising a worse one in a Slack message.
 *
 *  Matched on `title` + `actor`: the table has no `name` column, so the old
 *  `name.ilike` filter 400d on every call and this read has been returning
 *  nothing since it shipped. Each row carries its `?slice=` deep link, which is
 *  the whole point of pointing at an existing view. */
export async function fetchSlices(
  env: Env,
  query: string,
): Promise<{ rows: Array<Record<string, unknown>>; total: number | undefined }> {
  const words = terms(query);
  const filter = words.length
    ? `or=(${words.flatMap((w) => [`title.ilike.*${w}*`, `actor.ilike.*${w}*`]).join(",")})`
    : "order=updated_at.desc";
  const { rows, total } = await fetchRows(env, "slices", filter, 10);
  // `total` counts the FILTERED set. A worded query narrows it, and a "how
  // many slices are there" answer must not inherit that narrowing — so when
  // a filter was applied, fetch the table's true size with a rows-free
  // head-count (limit=0 still carries content-range under count=exact).
  //
  // If that head-count read fails, the total is UNDEFINED, not the filtered
  // number: the consumer's note asserts "the blueprint has N slices in
  // total", and a filtered count wearing that sentence is a confident wrong
  // answer — the exact bug the note exists to prevent. Undefined drops the
  // note instead.
  const tableTotal =
    words.length > 0 ? (await fetchRows(env, "slices", "limit=0", 0)).total : total;
  return {
    rows: rows.map((row) => {
      const url = typeof row.id === "string" ? sliceUrl(env.BLUEPRINT_APP_URL, row.id) : undefined;
      return url ? { ...row, url } : row;
    }),
    total: tableTotal,
  };
}
