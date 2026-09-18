// One blueprint read, and the property the whole module exists for: A FAILED
// READ IS NEVER A SERVED EMPTY ONE.
//
// THE DEFECT THIS FILE IS WRITTEN AGAINST. A first pass at readBlueprint
// isolated only THROWS. But the live reads mostly do not throw on failure —
// they answer empty: the index read `undefined`, the edge read `[]`, the three
// paged reads `{ rows: [], total: undefined }`. Every one of those arrived at
// the caller as `served`, which is the false absence this module exists to
// prevent, reintroduced by the module that owns preventing it. So each read's
// REAL failure answer is asserted here by shape, not only by throw, and beside
// it the real EMPTY answer that must come out different.
//
// Fixture rows, invented on purpose, and NO transport stub of any kind: the
// reads arrive injected, so sequencing, dispositions and totals are asserted
// against fixtures instead of against production. The `fetch` below is a
// tripwire, not a transport — this suite must cost ZERO metered subrequests
// (ADR-022), so any outbound call fails it.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BLUEPRINT_ENRICHMENTS,
  BlueprintUnavailableError,
  dispositionOf,
  isBlueprintEnrichment,
  readBlueprint,
  type BlueprintReads,
  type BlueprintSearchReadResult,
} from "../src/integrations/blueprint-read";
import { SubrequestBudgetError } from "../src/net";

globalThis.fetch = (async (input: unknown) => {
  throw new Error(`this suite must not reach the network: ${String(input)}`);
}) as typeof fetch;

// ── Fixtures ─────────────────────────────────────────────────────────────────

type Row = { kind?: unknown; id?: unknown; title?: string };

/** An index, as the renderer shapes it. Invented counts: a fixture that echoed
 *  the real board would go stale the next time someone edits it. */
const INDEX_FIXTURE = {
  scale: "6 phases",
  legend: "",
  phases: ["Application: Discovery(1)"],
  readAt: "2026-09-18",
};

const CELLS: Row[] = [
  { kind: "cell", id: "cell-aaa", title: "Rehearse the handover" },
  { kind: "cell", id: "cell-bbb", title: "Post the summary" },
  // No id, so it must not reach a read that keys on cell ids.
  { kind: "scenario", title: "Windmill Onboarding" },
];

function searchResult(
  over: Partial<BlueprintSearchReadResult<Row, "hybrid">> = {},
): BlueprintSearchReadResult<Row, "hybrid"> {
  return {
    rows: CELLS,
    retrieval: "hybrid",
    truncated: false,
    capped_by: null,
    cached: false,
    age_ms: 0,
    thin: false,
    ...over,
  };
}

/** Reads that record the order they were called in, so "sequential, search
 *  first" is an assertion rather than a comment. Every one answers the real
 *  SERVED shape; a test overrides the one read it is about. */
function recordingReads(
  over: Partial<BlueprintReads<Row, "hybrid">> = {},
  log: string[] = [],
): { reads: BlueprintReads<Row, "hybrid">; log: string[] } {
  // Records entry AND exit, so an overlap — two reads in flight at once — is
  // visible in the log rather than invisible in a passing assertion.
  const trace = <A extends unknown[], T>(name: string, fn: (...a: A) => Promise<T>) =>
    async (...a: A): Promise<T> => {
      log.push(`${name}:start`);
      const out = await fn(...a);
      log.push(`${name}:end`);
      return out;
    };
  const base: BlueprintReads<Row, "hybrid"> = {
    search: async () => searchResult(),
    index: async () => ({ index: INDEX_FIXTURE, disposition: "served" as const }),
    edges: async () => ({ edges: [{ from: "a", to: "b", direction: "downstream", kind: "leads_to" }], disposition: "served" as const }),
    findings: async () => ({ rows: [{ id: "f1" }], total: 3, disposition: "served" as const }),
    slices: async () => ({ rows: [{ id: "s1" }], total: 14, disposition: "served" as const }),
    touchpoints: async () => ({ rows: [{ name: "Zoom" }], registryTotal: 41, words: ["zoom"], disposition: "served" as const }),
  };
  const merged = { ...base, ...over };
  return {
    reads: {
      search: trace("search", merged.search),
      index: trace("index", merged.index),
      edges: trace("edges", merged.edges),
      findings: trace("findings", merged.findings),
      slices: trace("slices", merged.slices),
      touchpoints: trace("touchpoints", merged.touchpoints),
    },
    log,
  };
}

const ALL = [...BLUEPRINT_ENRICHMENTS];

/** One read replaced by a fixture answer. The three paged reads differ in the
 *  name of their total, so the answer is built by the caller and the shape is
 *  asserted, not typed, here. */
function override(
  name: "findings" | "slices" | "touchpoints",
  answer: () => Record<string, unknown>,
): Partial<BlueprintReads<Row, "hybrid">> {
  return { [name]: async () => answer() } as Partial<BlueprintReads<Row, "hybrid">>;
}

// ── The disposition rule, read off the answer ────────────────────────────────

test("the six reads' REAL failure answers are `failed`, not served", () => {
  // fetchBlueprintIndex, before it declared its own disposition.
  assert.equal(dispositionOf(undefined), "failed");
  assert.equal(dispositionOf(null), "failed");
  // fetchEdges. `[]` carries no evidence either way, so it is not served.
  assert.equal(dispositionOf([]), "failed");
  // fetchRows, and so fetchFindings / fetchSlices / fetchTouchpoints.
  assert.equal(dispositionOf({ rows: [], total: undefined }), "failed");
  assert.equal(dispositionOf({ rows: [] }), "failed");
});

test("a declared disposition is taken at its word", () => {
  assert.equal(dispositionOf({ rows: [], total: undefined, disposition: "failed" }), "failed");
  assert.equal(dispositionOf({ rows: [], total: undefined, disposition: "unavailable" }), "unavailable");
  assert.equal(dispositionOf({ edges: [], disposition: "unavailable" }), "unavailable");
  // A declared `served` empty page IS an answer — that is the whole point of
  // the reads declaring it.
  assert.equal(dispositionOf({ rows: [], total: 0, disposition: "served" }), "served");
});

test("an empty answer is served only on positive evidence of a read", () => {
  // The count rides the same PostgREST response as the page, so a page that
  // came back at all came back with a total. That is the evidence.
  assert.equal(dispositionOf({ rows: [], total: 0 }), "served");
  assert.equal(dispositionOf({ rows: [], total: 14 }), "served");
  // Rows are evidence on their own.
  assert.equal(dispositionOf({ rows: [{ id: "x" }], total: undefined }), "served");
  assert.equal(dispositionOf([{ from: "a", to: "b" }]), "served");
  // An index is its own evidence: it exists, so it was read.
  assert.equal(dispositionOf({ scale: "6 phases" }), "served");
});

test("the enrichment names are a closed set, and `include` ignores the rest", async () => {
  assert.ok(isBlueprintEnrichment("findings"));
  assert.equal(isBlueprintEnrichment("cells"), false);
  const { reads, log } = recordingReads();
  const out = await readBlueprint(
    { query: "handover", scope: {}, include: ["findings", "findings", "nonsense"] },
    reads,
  );
  assert.deepEqual(Object.keys(out.enrichments), ["findings"]);
  // Read ONCE, not once per mention.
  assert.equal(log.filter((l) => l === "findings:start").length, 1);
});

// ── Per-read: the failure answer is failed, the empty answer is served ───────
//
// One case per read, each fed the exact value its live function answers with.

test("index: `undefined` is a failed read, an index is a served one", async () => {
  const failed = await readBlueprint(
    { query: "q", scope: {}, include: ["index"] },
    recordingReads({ index: async () => undefined }).reads,
  );
  assert.equal(failed.enrichments.index?.disposition, "failed");
  assert.equal(failed.enrichments.index?.value, undefined);

  // And a read that CLAIMS served with nothing in it is still not a served
  // index: the value is the evidence.
  const lying = await readBlueprint(
    { query: "q", scope: {}, include: ["index"] },
    recordingReads({ index: async () => ({ disposition: "served" as const }) }).reads,
  );
  assert.equal(lying.enrichments.index?.disposition, "failed");

  const served = await readBlueprint({ query: "q", scope: {}, include: ["index"] }, recordingReads().reads);
  assert.equal(served.enrichments.index?.disposition, "served");
  assert.equal(served.enrichments.index?.value?.scale, "6 phases");
});

test("edges: `[]` from a failure is failed; `[]` the read really returned is served", async () => {
  // The pre-#606 shape, the one that reached Slack as "no dependencies".
  const undeclared = await readBlueprint(
    { query: "q", scope: {}, include: ["edges"] },
    recordingReads({ edges: async () => ({ edges: [] }) }).reads,
  );
  assert.equal(undeclared.enrichments.edges?.disposition, "failed");

  const failed = await readBlueprint(
    { query: "q", scope: {}, include: ["edges"] },
    recordingReads({ edges: async () => ({ edges: [], disposition: "failed" as const }) }).reads,
  );
  assert.equal(failed.enrichments.edges?.disposition, "failed");
  assert.equal(failed.enrichments.edges?.value, undefined);

  // The distinguishable pair: these cells genuinely have no dependencies.
  const empty = await readBlueprint(
    { query: "q", scope: {}, include: ["edges"] },
    recordingReads({ edges: async () => ({ edges: [], disposition: "served" as const }) }).reads,
  );
  assert.equal(empty.enrichments.edges?.disposition, "served");
  assert.deepEqual(empty.enrichments.edges?.value, []);
  assert.notDeepEqual(empty.enrichments.edges, failed.enrichments.edges);
});

for (const name of ["findings", "slices", "touchpoints"] as const) {
  test(`${name}: an empty page from a failure is failed, and a real empty page is served`, async () => {
    // The real failure answer of every read over fetchRows.
    const answer = (
      over: Record<string, unknown>,
    ): Record<string, unknown> =>
      name === "touchpoints"
        ? { rows: [], registryTotal: undefined, words: ["zoom"], ...over }
        : { rows: [], total: undefined, ...over };

    const undeclared = await readBlueprint(
      { query: "zoom", scope: {}, include: [name] },
      recordingReads(override(name, () => answer({}))).reads,
    );
    assert.equal(undeclared.enrichments[name]?.disposition, "failed");
    assert.equal(undeclared.enrichments[name]?.value, undefined);
    assert.equal(undeclared.enrichments[name]?.total, undefined);

    const failed = await readBlueprint(
      { query: "zoom", scope: {}, include: [name] },
      recordingReads(override(name, () => answer({ disposition: "failed" }))).reads,
    );
    assert.equal(failed.enrichments[name]?.disposition, "failed");

    const unavailable = await readBlueprint(
      { query: "zoom", scope: {}, include: [name] },
      recordingReads(override(name, () => answer({ disposition: "unavailable" }))).reads,
    );
    assert.equal(unavailable.enrichments[name]?.disposition, "unavailable");

    // The distinguishable pair: the source really holds nothing for this query,
    // and says so with the count that rode the same response.
    const totalKey = name === "touchpoints" ? "registryTotal" : "total";
    const empty = await readBlueprint(
      { query: "zoom", scope: {}, include: [name] },
      recordingReads(override(name, () => answer({ [totalKey]: 0, disposition: "served" }))).reads,
    );
    assert.equal(empty.enrichments[name]?.disposition, "served");
    assert.deepEqual(empty.enrichments[name]?.value, []);
    assert.equal(empty.enrichments[name]?.total, 0);
    assert.notDeepEqual(empty.enrichments[name], failed.enrichments[name]);
  });
}

test("every read that was asked for reports a disposition, whatever happened", async () => {
  const { reads } = recordingReads({
    index: async () => undefined,
    edges: async () => ({ edges: [] }),
    findings: async () => ({ rows: [], total: undefined }),
    slices: async () => ({ rows: [], total: undefined }),
    touchpoints: async () => ({ rows: [], registryTotal: undefined, words: [] }),
  });
  const out = await readBlueprint({ query: "q", scope: {}, include: ALL }, reads);
  for (const name of ALL) {
    const got = out.enrichments[name];
    assert.ok(got, `${name} was asked for, so it must be reported`);
    assert.equal(got.disposition, "failed", `${name} answered empty on failure`);
  }
  // An OMITTED key means "not asked", and can therefore never be read as
  // absence.
  const none = await readBlueprint({ query: "q", scope: {} }, recordingReads().reads);
  assert.deepEqual(none.enrichments, {});
});

// ── Throws: isolated, except the two that are not absence ────────────────────

test("a throwing enrichment costs that enrichment and not the rows", async () => {
  const { reads } = recordingReads({
    findings: async () => {
      throw new Error("findings table hiccup");
    },
  });
  const out = await readBlueprint({ query: "q", scope: {}, include: ALL }, reads);
  assert.equal(out.enrichments.findings?.disposition, "failed");
  assert.equal(out.rows.length, CELLS.length);
  // And the reads AFTER it still ran.
  assert.equal(out.enrichments.slices?.disposition, "served");
  assert.equal(out.enrichments.touchpoints?.disposition, "served");
});

test("an unconfigured source raised by an enrichment is `unavailable`, not absence", async () => {
  const { reads } = recordingReads({
    slices: async () => {
      throw new BlueprintUnavailableError(
        "uno-blueprint not configured — missing SUPABASE_URL / SUPABASE_ANON_KEY",
      );
    },
  });
  const out = await readBlueprint({ query: "q", scope: {}, include: ["slices"] }, reads);
  assert.equal(out.enrichments.slices?.disposition, "unavailable");
  assert.equal(out.enrichments.slices?.value, undefined);
  // The credential names are the operator's business and stay in the log. This
  // result is model-facing — a tool result can be echoed into Slack, where a
  // variable name reads like a stack trace to a designer.
  assert.doesNotMatch(JSON.stringify(out), /SUPABASE/);
  assert.doesNotMatch(JSON.stringify(out), /not configured/);
});

test("a budget stop is not an absent enrichment — it propagates", async () => {
  const { reads } = recordingReads({
    edges: async () => {
      throw new SubrequestBudgetError(38);
    },
  });
  await assert.rejects(
    () => readBlueprint({ query: "q", scope: {}, include: ALL }, reads),
    (e: unknown) => e instanceof SubrequestBudgetError,
  );
});

test("the search's failure is the whole read's failure", async () => {
  const { reads, log } = recordingReads({
    search: async () => {
      throw new BlueprintUnavailableError("missing SUPABASE_URL / SUPABASE_ANON_KEY");
    },
  });
  await assert.rejects(
    () => readBlueprint({ query: "q", scope: {}, include: ALL, autoIndex: true }, reads),
    (e: unknown) => e instanceof BlueprintUnavailableError,
  );
  // Nothing else was read. This is what makes #608's `not_configured` honest:
  // the search is the read that throws, and it goes first.
  assert.deepEqual(log, ["search:start"]);
});

// ── Sequencing ───────────────────────────────────────────────────────────────

test("the search runs FIRST, and the enrichments follow it in a fixed order", async () => {
  const { reads, log } = recordingReads();
  await readBlueprint({ query: "q", scope: {}, include: [...ALL].reverse() }, reads);
  assert.deepEqual(log, [
    "search:start",
    "search:end",
    ...ALL.flatMap((n) => [`${n}:start`, `${n}:end`]),
  ]);
  // The order is the module's, not the caller's: `include` arrived reversed and
  // the spend pattern did not move.
  assert.deepEqual(ALL, ["index", "edges", "findings", "slices", "touchpoints"]);
});

test("the reads are sequential — never two in flight", async () => {
  const { reads, log } = recordingReads();
  await readBlueprint({ query: "q", scope: {}, include: ALL, autoIndex: true }, reads);
  // Every `start` is immediately followed by its own `end`. Concurrent reads
  // would interleave, and each one is a metered subrequest against a counter
  // that is read before the call (ADR-022).
  for (let i = 0; i < log.length; i += 2) {
    assert.equal(log[i + 1], log[i]!.replace(":start", ":end"), `${log[i]} overlapped`);
  }
});

test("autoIndex reads the index without it being asked for, and still after the search", async () => {
  const { reads, log } = recordingReads();
  const out = await readBlueprint({ query: "q", scope: {}, autoIndex: true }, reads);
  assert.equal(out.enrichments.index?.disposition, "served");
  assert.deepEqual(log, ["search:start", "search:end", "index:start", "index:end"]);
});

// ── The fused-or-fallback switch ─────────────────────────────────────────────

test("edges and findings ride inside the search when the fused path serves it", async () => {
  const { reads, log } = recordingReads({
    search: async () =>
      searchResult({
        edges: [{ from: "a", to: "b", direction: "downstream", kind: "leads_to" }],
        findings: { rows: [{ id: "f1" }, { id: "f2" }], total: 9 },
      }),
  });
  const out = await readBlueprint({ query: "q", scope: {}, include: ["edges", "findings"] }, reads);
  assert.equal(out.enrichments.edges?.fused, true);
  assert.equal(out.enrichments.findings?.fused, true);
  assert.equal(out.enrichments.findings?.total, 9);
  // Not one metered subrequest spent on either.
  assert.deepEqual(log, ["search:start", "search:end"]);
});

test("a fallback path leaves them to the separate reads, which say they were not fused", async () => {
  const { reads, log } = recordingReads({ search: async () => searchResult({ retrieval: "hybrid" }) });
  const out = await readBlueprint({ query: "q", scope: {}, include: ["edges", "findings"] }, reads);
  assert.equal(out.enrichments.edges?.fused, false);
  assert.equal(out.enrichments.findings?.fused, false);
  assert.ok(log.includes("edges:start") && log.includes("findings:start"));
});

test("the fused asks are the only ones handed to the search", async () => {
  let asked: readonly string[] | undefined;
  const { reads } = recordingReads({
    search: async (_q, options) => {
      asked = options.include;
      return searchResult();
    },
  });
  await readBlueprint({ query: "q", scope: {}, include: ALL }, reads);
  assert.deepEqual([...(asked ?? [])], ["edges", "findings"]);
});

test("only matched CELLS are handed to the reads that key on cell ids", async () => {
  let forEdges: string[] | undefined;
  let forFindings: string[] | undefined;
  const { reads } = recordingReads({
    edges: async (ids) => {
      forEdges = ids;
      return { edges: [], disposition: "served" as const };
    },
    findings: async (ids) => {
      forFindings = ids;
      return { rows: [], total: 0, disposition: "served" as const };
    },
  });
  await readBlueprint({ query: "q", scope: {}, include: ["edges", "findings"] }, reads);
  // The scenario row carries no cell id, and a read keyed on one would ask the
  // wrong table.
  assert.deepEqual(forEdges, ["cell-aaa", "cell-bbb"]);
  assert.deepEqual(forFindings, ["cell-aaa", "cell-bbb"]);
});

// ── The cap totals ───────────────────────────────────────────────────────────

test("a capped page carries the source-wide total and says it is clipped", async () => {
  const { reads } = recordingReads({
    findings: async () => ({ rows: [{ id: "f1" }], total: 12, disposition: "served" as const }),
    slices: async () => ({ rows: [{ id: "s1" }], total: 14, disposition: "served" as const }),
    touchpoints: async () => ({
      rows: [{ name: "Zoom" }],
      registryTotal: 41,
      words: ["zoom"],
      disposition: "served" as const,
    }),
  });
  const out = await readBlueprint(
    { query: "zoom", scope: {}, include: ["findings", "slices", "touchpoints"] },
    reads,
  );
  // THE number a count answer must use — never the page's length.
  assert.equal(out.enrichments.findings?.total, 12);
  assert.equal(out.enrichments.findings?.capped, true);
  assert.equal(out.enrichments.slices?.total, 14);
  assert.equal(out.enrichments.slices?.capped, true);
  // The registry total, not this page's count: "how many tools do we use" must
  // not inherit the query's narrowing.
  assert.equal(out.enrichments.touchpoints?.total, 41);
  assert.deepEqual(out.enrichments.touchpoints?.words, ["zoom"]);
});

test("an uncapped page makes no cap claim, and a failed one makes none either", async () => {
  const { reads } = recordingReads({
    findings: async () => ({ rows: [{ id: "f1" }], total: 1, disposition: "served" as const }),
    slices: async () => ({ rows: [], total: undefined, disposition: "failed" as const }),
  });
  const out = await readBlueprint({ query: "q", scope: {}, include: ["findings", "slices"] }, reads);
  assert.equal(out.enrichments.findings?.capped, false);
  assert.equal(out.enrichments.slices?.capped, false);
  // A missing total leaves the claim unmade rather than guessing: the note it
  // feeds asserts a number out loud.
  assert.equal(out.enrichments.slices?.total, undefined);
});

test("a served page with no total is served, with the count claim simply unmade", async () => {
  // fetchSlices' head-count read can fail behind a page that came back fine.
  const { reads } = recordingReads({
    slices: async () => ({ rows: [{ id: "s1" }], total: undefined, disposition: "served" as const }),
  });
  const out = await readBlueprint({ query: "q", scope: {}, include: ["slices"] }, reads);
  assert.equal(out.enrichments.slices?.disposition, "served");
  assert.equal(out.enrichments.slices?.total, undefined);
  assert.equal(out.enrichments.slices?.capped, false);
});

// ── The rows, and the retrieval path that served them ────────────────────────

test("the result carries the retrieval path and the corpus-wide count beside the rows", async () => {
  const { reads } = recordingReads({
    search: async () =>
      searchResult({
        matched_total: 113,
        truncated: true,
        capped_by: "semantic",
        cached: true,
        age_ms: 4200,
        thin: true,
        top_score: 0.82,
      }),
  });
  const out = await readBlueprint({ query: "zoom", scope: {} }, reads);
  assert.equal(out.retrieval, "hybrid");
  assert.equal(out.matched, 113);
  assert.equal(out.truncated, true);
  assert.equal(out.capped_by, "semantic");
  assert.equal(out.cached, true);
  assert.equal(out.age_ms, 4200);
  assert.equal(out.thin, true);
  assert.equal(out.top_score, 0.82);
  assert.deepEqual(out.rows, CELLS);
});

test("`fresh` and the scope reach the search, and `fresh` reaches the index", async () => {
  let searchOpts: Record<string, unknown> | undefined;
  let indexOpts: Record<string, unknown> | undefined;
  const { reads } = recordingReads({
    search: async (_q, options) => {
      searchOpts = options as unknown as Record<string, unknown>;
      return searchResult();
    },
    index: async (options) => {
      indexOpts = options as Record<string, unknown>;
      return { index: INDEX_FIXTURE, disposition: "served" as const };
    },
  });
  await readBlueprint(
    { query: "q", scope: { filterScenario: "Windmill Onboarding" }, fresh: true, include: ["index"] },
    reads,
  );
  assert.equal(searchOpts?.fresh, true);
  assert.deepEqual(searchOpts?.scope, { filterScenario: "Windmill Onboarding" });
  assert.equal(indexOpts?.fresh, true);
});
