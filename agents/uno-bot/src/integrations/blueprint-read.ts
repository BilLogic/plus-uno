// ONE entry that answers a blueprint read completely — and one place that
// decides, per read, whether it was answered at all.
//
// WHAT IT OWNS, and why each piece stopped being the caller's problem.
//
//   SEQUENCING. Every enrichment is a metered subrequest and the budget gate
//   reads a running counter (ADR-022), so firing them together can carry the
//   invocation past Cloudflare's cap before the counter catches up. They run
//   one after another, in a fixed order, with the SEARCH FIRST — and that
//   order is load-bearing twice over. An enrichment failure must never cost
//   the rows it was meant to decorate; and the search is the only read on this
//   path that throws when the deployment has no blueprint credentials, so it
//   is what makes an unconfigured deployment say `not_configured` instead of
//   answering an empty result (#608). Put a cache, an index or any enrichment
//   ahead of it and that report turns back into a served absence.
//
//   PER-READ DISPOSITION. Each read is isolated, because these decorate a
//   search that has ALREADY succeeded: letting one throw turned a good answer
//   into "couldn't reach the source of truth", i.e. a findings-table hiccup
//   became a false absence. But isolation that catches only THROWS is the same
//   bug wearing the fix's clothes, because most of these reads do not throw on
//   failure — they answer empty. So every read gets a `disposition`
//   (served · failed · unavailable) decided from the answer's SHAPE as well as
//   from a throw, and a page the source really returned empty is a different
//   value from a page a failure returned empty. See `dispositionOf`.
//
//   A budget stop is the one exception that still propagates: it means the
//   invocation is out of subrequests, and reporting that as an absent
//   enrichment is exactly how a clipped read becomes a false absence. The
//   tool's `optional()` swallowed every non-budget throw, so a
//   `BlueprintUnavailableError` raised by an enrichment read as absence; here
//   it is a disposition of its own.
//
//   THE CAP TOTALS. Three of these reads return a page under a cap plus the
//   source-wide count behind it. A count answer must come from the total,
//   never from counting the page — that mistake shipped once as a confident
//   wrong number ("5 of 14"). So every enrichment carries its own total and
//   says whether the page was clipped, instead of each caller re-deriving it.
//
//   THE FUSED-OR-FALLBACK SWITCH. `edges` and `findings` ride inside the
//   search call when the fused RPC path serves the query — a metered
//   subrequest not spent. Every fallback path (RPC absent mid-rollout, hybrid
//   off, the semantic or keyword ladder) leaves them absent, and then the
//   separate reads still owe the answer. Holding both here is what makes the
//   switch safe to deploy before the migration is everywhere.
//
// NOTHING FROM AN ERROR REACHES THE RESULT. The operator detail is logged; the
// outcome carries a disposition and no message. `BlueprintUnavailableError`
// names the missing credentials, and this result is model-facing — a tool
// result can be echoed into Slack, where a variable name reads like a stack
// trace to a designer. Same split as slack/api.ts.
//
// A PURE module, like blueprint-scope.ts and blueprint-subject.ts beside it:
// no Env, no fetch, no Workers globals. The reads arrive injected, taking the
// shape `selectSubject(need, reads)` already uses in this domain — so the
// sequencing, the dispositions and the totals are asserted against fixture
// rows with no transport stub at all, instead of against production.
// Injection sits ABOVE the metered call, never around it: the reads bound in
// the Worker are the same countedFetch-backed functions everything else calls,
// because a second way to reach the network is exactly what ADR-022 deleted
// src/http.ts for.
//
// ONE CALLER: `src/tools/blueprint-search.ts`, rewired onto this in #607 —
// which is what turned the eight fixes the tool used to carry in comments into
// assertions, and what the per-read dispositions are for: the tool's notes can
// now say "the findings table could not be read" where a failed read and an
// empty table used to leave the same silence.

import { rethrowIfBudget } from "../net";
import type { BlueprintCappedBy, BlueprintIndex } from "./blueprint-index";
import type { BlueprintEdge } from "./blueprint-include";
import type { BlueprintScope } from "./blueprint-scope";

/** This deployment has no blueprint credentials, so there is nothing to reach.
 *
 *  Declared in this pure module, and re-exported by blueprint.ts under the
 *  same name, so the disposition rule below can tell an unconfigured source
 *  from a failed read without the pure module importing an Env-bound one.
 *
 *  Its MESSAGE names the missing variables, for the operator's log. Never for
 *  a model-facing payload — see the module header. */
export class BlueprintUnavailableError extends Error {}

/** A row of a table the enrichment reads return, as the columns name it. */
export type BlueprintReadRow = Record<string, unknown>;

/**
 * How one read went.
 *
 * - `served` — the read answered. An empty `value` here means the source
 *   really holds nothing for this query, which is an answer.
 * - `failed` — the read was attempted and did not answer. Says NOTHING about
 *   what the source holds.
 * - `unavailable` — the read was never made, because the blueprint is not
 *   configured on this deployment. Also says nothing about the source.
 *
 * The two failure states are kept apart because they send a person to
 * different places: `failed` to an outage, `unavailable` to the Worker's
 * configuration. Neither is ever evidence of absence.
 */
export type BlueprintDisposition = "served" | "failed" | "unavailable";

/**
 * How a read went, read off the answer it gave.
 *
 * TWO channels, and the second is the whole reason this function exists.
 *
 * A read that DECLARES its disposition is taken at its word — every live
 * blueprint read now does (`fetchRows` and the three reads over it, plus
 * `fetchEdges` and `fetchBlueprintIndex`), because only the read itself can
 * tell a 400 from an empty table.
 *
 * A read that does NOT declare one is judged on shape, and the rule is
 * deliberately asymmetric: emptiness is `served` only when something in the
 * answer is positive evidence that the source was reached — a row, a numeric
 * total, an object of its own. An empty answer with no such evidence is
 * `failed`.
 *
 * WHY asymmetric. A first pass at this module isolated only THROWS, and these
 * reads mostly do not throw: the index answers `undefined`, the edge read `[]`,
 * the paged reads `{ rows: [], total: undefined }`. Every one of those arrived
 * as a served empty result — the false absence this module exists to prevent,
 * reintroduced by the module that owns preventing it. Calling an unexplained
 * emptiness `failed` costs, at worst, a "could not read it" where "nothing
 * there" was true. The other way round costs a confident wrong answer, which
 * is the failure this whole domain is built around.
 *
 * @param answer - Whatever the injected read resolved to
 */
export function dispositionOf(answer: unknown): BlueprintDisposition {
  // The index read's failure answer, and the one shape that carries nothing at
  // all to judge.
  if (answer === undefined || answer === null) return "failed";
  const declared = (answer as { disposition?: unknown }).disposition;
  if (declared === "served" || declared === "failed" || declared === "unavailable") {
    return declared;
  }
  // The list the answer carries, however it is spelled: the reads answer with
  // a bare array, a `rows` page or an `edges` list.
  const carried = (key: "rows" | "edges") => (answer as Record<string, unknown>)[key];
  const list = Array.isArray(answer)
    ? answer
    : [carried("rows"), carried("edges")].find(Array.isArray);
  if (list) {
    if (list.length > 0) return "served";
    // An empty page WITH its count is the paged reads' honest empty: PostgREST
    // answers `count=exact` in the same response, so a page that came back at
    // all came back with a total. No total, no evidence — and the edge read
    // has no count to offer at all, which is why `[]` there is `failed` until
    // the read says otherwise.
    return typeof (answer as { total?: unknown }).total === "number" ? "served" : "failed";
  }
  // An object that is neither a page nor a list is the read's own rendered
  // answer — the index. It exists, so it was served.
  return "served";
}

/**
 * The opt-in extra reads, in the ORDER they run.
 *
 * `index` is first because it is the orientation read: a turn that asks for it
 * wants to know what exists before it is told what matched. The rest follow
 * cheapest-obligation first. The order is fixed here rather than taken from
 * the caller's `include`, so the spend pattern of a turn does not depend on
 * the order a model happened to list its asks in.
 *
 * None of them precedes the search — see the module header for why that is a
 * correctness property and not a preference.
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

export interface BlueprintEnrichmentOutcome<T> {
  /** How the read went. `value` is present exactly when this is `served`. */
  disposition: BlueprintDisposition;
  /** What the read returned. An empty one here is a real empty. */
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
   *  for. Derived from the query, not from the read, so it survives a failure
   *  and the note can still name the search that did not happen. */
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

/** A page of rows under a cap, with the count behind it and how the read went.
 *  `disposition` is optional in the TYPE so a fixture or a future read that
 *  does not declare one still compiles — and is then judged on shape, which is
 *  the conservative direction. */
export interface BlueprintPageAnswer {
  rows: BlueprintReadRow[];
  total: number | undefined;
  disposition?: BlueprintDisposition;
}

export interface BlueprintReads<Row, Retrieval extends string = string> {
  /** The search. FIRST, always, and the one read whose failure is the whole
   *  read's failure: there are no rows to decorate, and the caller owes the
   *  user the difference between unconfigured, out-of-budget and unreachable.
   *  So it is not isolated — it throws through. */
  search: (
    query: string,
    options: {
      fresh?: boolean;
      include?: readonly FusedEnrichment[];
      scope: BlueprintScope;
    },
  ) => Promise<BlueprintSearchReadResult<Row, Retrieval>>;
  /** One hop off the matched cells. No cap, so no total. */
  edges: (
    cellIds: string[],
  ) => Promise<{ edges: BlueprintEdge[]; disposition?: BlueprintDisposition }>;
  findings: (cellIds: string[]) => Promise<BlueprintPageAnswer>;
  slices: (query: string) => Promise<BlueprintPageAnswer>;
  touchpoints: (query: string) => Promise<{
    rows: BlueprintReadRow[];
    /** The registry's own size — unfiltered, so a "how many tools" answer does
     *  not inherit the query's narrowing. */
    registryTotal: number | undefined;
    words: string[];
    disposition?: BlueprintDisposition;
  }>;
  index: (options: {
    fresh?: boolean;
  }) => Promise<{ index?: BlueprintIndex; disposition?: BlueprintDisposition } | undefined>;
}

export interface BlueprintReadRequest {
  query: string;
  scope: BlueprintScope;
  /** What else to read. Names outside BLUEPRINT_ENRICHMENTS are ignored, and
   *  a repeat is read once. */
  include?: readonly string[];
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
   *  not. An outcome that is present always carries a disposition, so an
   *  omitted key means "not asked" and never "nothing there". */
  enrichments: BlueprintEnrichments;
}

// ── The read ─────────────────────────────────────────────────────────────────

/** True when the page is smaller than the count behind it. A missing total
 *  leaves the claim unmade rather than guessing: the note it feeds asserts a
 *  number out loud, and a filtered count wearing that sentence is a confident
 *  wrong answer. */
function isCapped(total: number | undefined, shown: number): boolean {
  return typeof total === "number" && total !== shown;
}

function outcome<T>(
  disposition: BlueprintDisposition,
  opts: { value?: T; total?: number | undefined; shown?: number; fused?: boolean } = {},
): BlueprintEnrichmentOutcome<T> {
  const served = disposition === "served";
  return {
    disposition,
    // No value on anything but `served`, so a caller cannot read a failure's
    // shape as data by reaching past the disposition.
    ...(served && opts.value !== undefined ? { value: opts.value } : {}),
    ...(served && typeof opts.total === "number" ? { total: opts.total } : {}),
    capped: served ? isCapped(opts.total, opts.shown ?? 0) : false,
    ...(opts.fused === undefined ? {} : { fused: opts.fused }),
  };
}

/** One read, attempted. A throw costs this read and nothing else — except a
 *  budget stop, which costs the whole invocation and says so. */
type Attempt<T> =
  | { ok: true; answer: T }
  | { ok: false; disposition: Exclude<BlueprintDisposition, "served"> };

async function attempt<T>(read: () => Promise<T>, label: string): Promise<Attempt<T>> {
  try {
    return { ok: true, answer: await read() };
  } catch (e) {
    rethrowIfBudget(e);
    // The operator gets the detail, here, where the person who can fix it is
    // looking. Nothing from the error travels on the result.
    console.warn(
      `[blueprint] ${label} read failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return {
      ok: false,
      disposition: e instanceof BlueprintUnavailableError ? "unavailable" : "failed",
    };
  }
}

/** The disposition of an attempted read: the throw's if it threw, the answer's
 *  shape otherwise. */
function dispositionOfAttempt<T>(a: Attempt<T>): BlueprintDisposition {
  return a.ok ? dispositionOf(a.answer) : a.disposition;
}

/**
 * Answer a blueprint read: the rows, the retrieval path that served them, and
 * each requested enrichment with its own disposition, total and cap state.
 *
 * Throws what the SEARCH throws — a failed search has no rows, so there is no
 * answer to isolate a failure from, and the caller owes the user the difference
 * between unconfigured, out of budget, and unreachable. Also throws
 * SubrequestBudgetError from any enrichment, for the same reason: the
 * invocation cannot spend another read, and reporting that as an absent
 * enrichment is how a clipped read becomes a false absence.
 *
 * @param request - The query, its scope, and what else to read
 * @param reads - The injected reads; bound to the countedFetch-backed
 *   functions in the Worker, to fixtures in tests
 */
export async function readBlueprint<
  Row extends { kind?: unknown; id?: unknown },
  Retrieval extends string,
>(
  request: BlueprintReadRequest,
  reads: BlueprintReads<Row, Retrieval>,
): Promise<BlueprintReadResult<Row, Retrieval>> {
  const asked = new Set<BlueprintEnrichment>(
    (request.include ?? []).filter(isBlueprintEnrichment),
  );
  if (request.autoIndex) asked.add("index");

  // FIRST, before any cache, index or enrichment. See the module header: this
  // is the read that throws on an unconfigured deployment, and it is the only
  // reason `not_configured` is honest rather than an empty served result.
  //
  // edges and findings ride INSIDE this call when the fused path serves it:
  // the RPC computes them from the rows it just ranked, so each one asked for
  // here is a metered subrequest not spent.
  const fusedAsks = FUSED_ENRICHMENTS.filter((e) => asked.has(e));
  const search = await reads.search(request.query, {
    ...(request.fresh ? { fresh: true } : {}),
    ...(fusedAsks.length ? { include: fusedAsks } : {}),
    scope: request.scope,
  });

  const enrichments: BlueprintEnrichments = {};

  // Sequential from here, one read at a time, in BLUEPRINT_ENRICHMENTS order.
  if (asked.has("index")) {
    const read = await attempt(
      () => reads.index({ ...(request.fresh ? { fresh: true } : {}) }),
      "index",
    );
    // The index read answers `undefined` rather than throwing on most
    // failures, so both shapes of "could not read it" land on the same
    // disposition — and neither arrives as an index with nothing in it. The
    // VALUE is the evidence here: a read claiming `served` without one has not
    // served an index, whatever it says.
    const declared = dispositionOfAttempt(read);
    const index = read.ok ? read.answer?.index : undefined;
    enrichments.index = outcome<BlueprintIndex>(
      declared === "served" && !index ? "failed" : declared,
      { ...(index ? { value: index } : {}), shown: 1 },
    );
  }

  // The cells the enrichment reads key on. A phase or scenario row carries no
  // cell id, and an edge read keyed on one would ask the wrong table.
  const cellIds = search.rows
    .filter((r) => r.kind === "cell" && typeof r.id === "string" && r.id)
    .map((r) => r.id as string);

  if (asked.has("edges")) {
    const fused = search.edges;
    if (fused) {
      enrichments.edges = outcome<BlueprintEdge[]>("served", {
        value: fused,
        shown: fused.length,
        fused: true,
      });
    } else {
      const read = await attempt(() => reads.edges(cellIds), "edges");
      enrichments.edges = outcome<BlueprintEdge[]>(dispositionOfAttempt(read), {
        ...(read.ok ? { value: read.answer.edges } : {}),
        shown: read.ok ? read.answer.edges.length : 0,
        fused: false,
      });
    }
  }

  if (asked.has("findings")) {
    const fused = search.findings;
    if (fused) {
      enrichments.findings = outcome<BlueprintReadRow[]>("served", {
        value: fused.rows,
        total: fused.total,
        shown: fused.rows.length,
        fused: true,
      });
    } else {
      const read = await attempt(() => reads.findings(cellIds), "findings");
      enrichments.findings = outcome<BlueprintReadRow[]>(dispositionOfAttempt(read), {
        ...(read.ok ? { value: read.answer.rows, total: read.answer.total } : {}),
        shown: read.ok ? read.answer.rows.length : 0,
        fused: false,
      });
    }
  }

  if (asked.has("slices")) {
    const read = await attempt(() => reads.slices(request.query), "slices");
    enrichments.slices = outcome<BlueprintReadRow[]>(dispositionOfAttempt(read), {
      ...(read.ok ? { value: read.answer.rows, total: read.answer.total } : {}),
      shown: read.ok ? read.answer.rows.length : 0,
    });
  }

  if (asked.has("touchpoints")) {
    const read = await attempt(() => reads.touchpoints(request.query), "touchpoints");
    // `registryTotal` is the UNFILTERED registry size, not this page's count:
    // "how many tools do we use" must not inherit the query's narrowing.
    enrichments.touchpoints = {
      ...outcome<BlueprintReadRow[]>(dispositionOfAttempt(read), {
        ...(read.ok ? { value: read.answer.rows, total: read.answer.registryTotal } : {}),
        shown: read.ok ? read.answer.rows.length : 0,
      }),
      // The words survive a failed read on purpose — the absence note names
      // what was searched for, and a failure still owes that.
      ...(read.ok && read.answer.words.length ? { words: read.answer.words } : {}),
    };
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
