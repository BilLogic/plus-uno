// ONE entry that answers a blueprint read completely.
//
// WHAT IT OWNS, and why each piece stopped being the caller's problem.
//
//   SEQUENCING. Every enrichment is a metered subrequest and the budget gate
//   reads a running counter (ADR-022), so firing them together can carry the
//   invocation past Cloudflare's cap before the counter catches up. They run
//   one after another, in a fixed order, with the search first — an enrichment
//   failure must never be able to cost the rows it was meant to decorate.
//
//   BUDGET ISOLATION. Each enrichment is isolated, because these decorate a
//   search that has ALREADY succeeded: letting one throw turned a good answer
//   into "couldn't reach the source of truth", i.e. a findings-table hiccup
//   became a false absence. A budget stop is the exception that still
//   propagates — that one is not best-effort, it means the invocation is out
//   of subrequests and the caller must say the lookup was cut short rather
//   than answer from a clipped read.
//
//   THE CAP TOTALS. Three of these reads return a page under a cap plus the
//   source-wide count behind it. A count answer must come from the total,
//   never from counting the page — that mistake shipped once as a confident
//   wrong number. So every enrichment carries its own total and says whether
//   the page was clipped, instead of each caller re-deriving it.
//
//   THE FUSED-OR-FALLBACK SWITCH. `edges` and `findings` ride inside the
//   search call when the fused RPC path serves the query — a metered
//   subrequest not spent. Every fallback path (RPC absent mid-rollout, hybrid
//   off, the semantic or keyword ladder) leaves them absent, and then the
//   separate reads still owe the answer. Holding both here is what makes the
//   switch safe to deploy before the migration is everywhere.
//
//   AVAILABILITY. An OMITTED key is indistinguishable from "there is nothing
//   there", which is the false-absence bug in its purest form. An enrichment
//   asked for at all reports its status, served or unavailable, whether or not
//   it has a value.
//
// A PURE module, like blueprint-scope.ts and blueprint-subject.ts beside it:
// no Env, no fetch, no Workers globals. The reads arrive injected, taking the
// shape `selectSubject(need, reads)` already uses in this domain — so the
// sequencing, the isolation and the totals are asserted against fixture rows
// instead of against production. Injection sits ABOVE the metered call, never
// around it: the reads bound in the Worker are the same countedFetch-backed
// functions everything else calls, because a second way to reach the network
// is exactly what ADR-022 deleted src/http.ts for.

import { rethrowIfBudget } from "../net";
import type { BlueprintCappedBy, BlueprintIndex } from "./blueprint-index";
import type { BlueprintEdge } from "./blueprint-include";
import type { BlueprintScope } from "./blueprint-scope";

/** A row of a table the enrichment reads return, as the columns name it. */
export type BlueprintReadRow = Record<string, unknown>;

/**
 * The opt-in extra reads, in the ORDER they run.
 *
 * `index` is first because it is the orientation read: a turn that asks for it
 * wants to know what exists before it is told what matched. The rest follow
 * cheapest-obligation first. The order is fixed here rather than taken from
 * the caller's `include`, so the spend pattern of a turn does not depend on
 * the order a model happened to list its asks in.
 */
export const BLUEPRINT_ENRICHMENTS = [
  "index",
  "edges",
  "findings",
  "slices",
  "touchpoints",
] as const;

export type BlueprintEnrichment = (typeof BLUEPRINT_ENRICHMENTS)[number];

/** The two enrichments the fused search RPC can carry inside its own call. */
export const FUSED_ENRICHMENTS = ["edges", "findings"] as const;

export type FusedEnrichment = (typeof FUSED_ENRICHMENTS)[number];

export function isBlueprintEnrichment(v: unknown): v is BlueprintEnrichment {
  return typeof v === "string" && (BLUEPRINT_ENRICHMENTS as readonly string[]).includes(v);
}

/** Whether a read that was asked for produced data.
 *
 *  Two states, both stated out loud. "unavailable" is NOT "empty": an empty
 *  `findings` read is a served result saying there are no findings, while an
 *  unavailable one says nothing at all about whether there are. */
export type BlueprintAvailability = "served" | "unavailable";

export interface BlueprintEnrichmentOutcome<T> {
  availability: BlueprintAvailability;
  /** Present exactly when `availability` is "served". */
  value?: T;
  /** The source-wide count behind the returned page, when the read carries
   *  one. THE number a count answer must use. */
  total?: number;
  /** True when `total` exceeds what `value` shows, so the page is partial. */
  capped: boolean;
  /** For the two the search can carry: true when it did, meaning no separate
   *  metered read was spent on this enrichment. */
  fused?: boolean;
}

export interface BlueprintEnrichments {
  index?: BlueprintEnrichmentOutcome<BlueprintIndex>;
  edges?: BlueprintEnrichmentOutcome<BlueprintEdge[]>;
  findings?: BlueprintEnrichmentOutcome<BlueprintReadRow[]>;
  slices?: BlueprintEnrichmentOutcome<BlueprintReadRow[]>;
  /** `words` is what the registry was actually matched on — the absence note
   *  has to name it, so "no touchpoint called that" can say what it looked
   *  for. */
  touchpoints?: BlueprintEnrichmentOutcome<BlueprintReadRow[]> & { words?: string[] };
}

// ── The reads, injected ──────────────────────────────────────────────────────

/** As much of a search result as this module reads. `Retrieval` is a parameter
 *  rather than a named union so the pure module does not have to reach into the
 *  Env-bound one for a type — the caller's own union flows through to the
 *  result unwidened. */
export interface BlueprintSearchReadResult<Row, Retrieval extends string = string> {
  rows: Row[];
  /** Which of the paths served this query. */
  retrieval: Retrieval;
  truncated: boolean;
  capped_by: BlueprintCappedBy;
  cached: boolean;
  age_ms: number;
  thin: boolean;
  top_score?: number;
  /** The corpus-wide count behind the top-k. */
  matched_total?: number;
  /** Present only when the fused path served the query AND they were asked
   *  for. Absence is the signal that the separate reads are still owed. */
  edges?: BlueprintEdge[];
  findings?: { rows: BlueprintReadRow[]; total: number | undefined };
}

export interface BlueprintReads<Row, Retrieval extends string = string> {
  search: (
    query: string,
    options: {
      fresh?: boolean;
      include?: readonly FusedEnrichment[];
      scope: BlueprintScope;
    },
  ) => Promise<BlueprintSearchReadResult<Row, Retrieval>>;
  /** One hop off the matched cells. No cap, so no total. */
  edges: (cellIds: string[]) => Promise<BlueprintEdge[]>;
  findings: (
    cellIds: string[],
  ) => Promise<{ rows: BlueprintReadRow[]; total: number | undefined }>;
  slices: (query: string) => Promise<{ rows: BlueprintReadRow[]; total: number | undefined }>;
  touchpoints: (query: string) => Promise<{
    rows: BlueprintReadRow[];
    registryTotal: number | undefined;
    words: string[];
  }>;
  index: (options: { fresh?: boolean }) => Promise<BlueprintIndex | undefined>;
}

export interface BlueprintReadRequest {
  query: string;
  scope: BlueprintScope;
  /** What else to read. Names outside BLUEPRINT_ENRICHMENTS are ignored, and
   *  a repeat is read once. */
  include?: readonly BlueprintEnrichment[];
  /** Bypass every cache this read can. Set on a correction turn: a re-check
   *  that re-serves a cache is a cache serving a lie. */
  fresh?: boolean;
  /** Attach the orientation index whether or not it was asked for — the
   *  deployment flag, not the model's ask. */
  autoIndex?: boolean;
}

export interface BlueprintReadResult<Row, Retrieval extends string = string> {
  rows: Row[];
  /** Which path served the query. Surfaced so answer quality can be
   *  attributed to retrieval instead of guessed at. */
  retrieval: Retrieval;
  /** The corpus-wide count behind the rows, when the path reports one. */
  matched?: number;
  truncated: boolean;
  capped_by: BlueprintCappedBy;
  cached: boolean;
  age_ms: number;
  thin: boolean;
  top_score?: number;
  /** One entry per enrichment that was ASKED FOR, and none for any that was
   *  not. */
  enrichments: BlueprintEnrichments;
}

// ── The read ─────────────────────────────────────────────────────────────────

/** True when the page is smaller than the count behind it. A missing total
 *  leaves the claim unmade rather than guessing: the note it feeds asserts a
 *  number out loud, and a filtered count wearing that sentence is a confident
 *  wrong answer. */
function cappedBy(total: number | undefined, shown: number): boolean {
  return typeof total === "number" && total !== shown;
}

function served<T>(
  value: T,
  opts: { total?: number | undefined; shown: number; fused?: boolean },
): BlueprintEnrichmentOutcome<T> {
  return {
    availability: "served",
    value,
    ...(typeof opts.total === "number" ? { total: opts.total } : {}),
    capped: cappedBy(opts.total, opts.shown),
    ...(opts.fused === undefined ? {} : { fused: opts.fused }),
  };
}

function unavailable<T>(opts: { fused?: boolean } = {}): BlueprintEnrichmentOutcome<T> {
  return {
    availability: "unavailable",
    capped: false,
    ...(opts.fused === undefined ? {} : { fused: opts.fused }),
  };
}

/**
 * Answer a blueprint read: the rows, the retrieval path that served them, and
 * each requested enrichment with its own total and availability.
 *
 * Throws what the SEARCH throws — a failed search has no rows, so there is no
 * answer to isolate a failure from, and the caller owes the user the
 * difference between "unreachable" and "out of budget". Also throws
 * SubrequestBudgetError from any enrichment, for the same reason: the
 * invocation cannot spend another read, and reporting that as an absent
 * enrichment is how a clipped read becomes a false absence.
 */
export async function readBlueprint<Row extends { kind?: unknown; id?: unknown }, Retrieval extends string>(
  request: BlueprintReadRequest,
  reads: BlueprintReads<Row, Retrieval>,
): Promise<BlueprintReadResult<Row, Retrieval>> {
  const asked = new Set<BlueprintEnrichment>(
    (request.include ?? []).filter(isBlueprintEnrichment),
  );
  if (request.autoIndex) asked.add("index");

  // edges and findings ride INSIDE the search when the fused path serves it:
  // the RPC computes them from the rows it just ranked, so each one asked for
  // here is a metered subrequest not spent.
  const fusedAsks = FUSED_ENRICHMENTS.filter((e) => asked.has(e));
  const search = await reads.search(request.query, {
    ...(request.fresh ? { fresh: true } : {}),
    ...(fusedAsks.length ? { include: fusedAsks } : {}),
    scope: request.scope,
  });

  /** One enrichment, isolated. A failure costs this enrichment and nothing
   *  else; a budget stop costs the whole read. */
  const isolate = async <T>(read: () => Promise<T | undefined>, label: string) => {
    try {
      return await read();
    } catch (e) {
      rethrowIfBudget(e);
      console.log(
        `[blueprint] ${label} enrichment failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      return undefined;
    }
  };

  const enrichments: BlueprintEnrichments = {};

  // Sequential from here, one read at a time, in BLUEPRINT_ENRICHMENTS order.
  if (asked.has("index")) {
    const index = await isolate(
      () => reads.index({ ...(request.fresh ? { fresh: true } : {}) }),
      "index",
    );
    // The index read answers `undefined` rather than throwing on most
    // failures, so both shapes of "could not read it" land here together.
    enrichments.index = index
      ? served(index, { shown: 1 })
      : unavailable<BlueprintIndex>();
  }

  // The cells the enrichment reads key on. A phase or scenario row carries no
  // cell id, and an edge read keyed on one would ask the wrong table.
  const cellIds = search.rows
    .filter((r) => r.kind === "cell" && typeof r.id === "string" && r.id)
    .map((r) => r.id as string);

  if (asked.has("edges")) {
    const fused = search.edges;
    const edges = fused ?? (await isolate(() => reads.edges(cellIds), "edges"));
    enrichments.edges = edges
      ? served(edges, { shown: edges.length, fused: Boolean(fused) })
      : unavailable<BlueprintEdge[]>({ fused: false });
  }

  if (asked.has("findings")) {
    const fused = search.findings;
    const read = fused ?? (await isolate(() => reads.findings(cellIds), "findings"));
    enrichments.findings = read
      ? served(read.rows, { total: read.total, shown: read.rows.length, fused: Boolean(fused) })
      : unavailable<BlueprintReadRow[]>({ fused: false });
  }

  if (asked.has("slices")) {
    const read = await isolate(() => reads.slices(request.query), "slices");
    enrichments.slices = read
      ? served(read.rows, { total: read.total, shown: read.rows.length })
      : unavailable<BlueprintReadRow[]>();
  }

  if (asked.has("touchpoints")) {
    const read = await isolate(() => reads.touchpoints(request.query), "touchpoints");
    enrichments.touchpoints = read
      ? { ...served(read.rows, { total: read.registryTotal, shown: read.rows.length }), words: read.words }
      : unavailable<BlueprintReadRow[]>();
  }

  return {
    rows: search.rows,
    retrieval: search.retrieval,
    ...(typeof search.matched_total === "number" ? { matched: search.matched_total } : {}),
    truncated: search.truncated,
    capped_by: search.capped_by,
    cached: search.cached,
    age_ms: search.age_ms,
    thin: search.thin,
    ...(typeof search.top_score === "number" ? { top_score: search.top_score } : {}),
    enrichments,
  };
}
