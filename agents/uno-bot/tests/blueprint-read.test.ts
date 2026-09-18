// What ONE blueprint read owes its caller, asserted on fixture rows.
//
// THE PROPERTIES THIS FILE HOLDS, each of which was previously a rule the
// caller had to remember:
//
//   1. SEQUENCING. The enrichment reads run one after another, never
//      overlapping. The budget gate reads a running counter, so a fan-out can
//      cross the cap before the counter catches up (ADR-022).
//   2. ISOLATION. Each enrichment is an enrichment of a search that ALREADY
//      succeeded, so one failing read must not turn a good answer into "we
//      couldn't reach the source of truth" — which reads to the model as
//      absence.
//   3. THE BUDGET IS NOT BEST-EFFORT. A budget stop propagates out of the
//      whole read: it means the invocation is out of subrequests, and
//      swallowing it is how a false absence gets manufactured.
//   4. CAP TOTALS. A capped read reports the source-wide total beside the
//      page, and says it was capped — a count answer comes from the total,
//      never from counting the page.
//   5. THE FUSED-OR-FALLBACK SWITCH. Edges and findings ride inside the search
//      on the fused path and must be read separately on every fallback path.
//
// No global fetch stub anywhere: the reads arrive injected, the way
// selectSubject's do in the same domain.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SubrequestBudgetError } from "../src/net";
import {
  readBlueprint,
  BLUEPRINT_ENRICHMENTS,
  type BlueprintReads,
  type BlueprintSearchReadResult,
} from "../src/integrations/blueprint-read";
import type { BlueprintIndex } from "../src/integrations/blueprint-index";

interface Row {
  kind: string;
  id: string;
  title: string;
}

// Rows named like nothing on the real board, so a rule that started leaning on
// a production title would fail here rather than pass while the live read
// returned nothing.
const ROWS: Row[] = [
  { kind: "cell", id: "c-kazoo", title: "Kazoo hand-off" },
  { kind: "cell", id: "c-tuba", title: "Tuba reconfirm" },
  { kind: "phase", id: "p-alpha", title: "Alpha Phase" },
];

// The orientation read's shape, with a scale nobody could mistake for the
// board's own.
const INDEX: BlueprintIndex = {
  scale: "2 phases / 3 scenarios / 4 paths",
  legend: "markers explained here",
  phases: ["Alpha Phase: Kettle Drum(1)"],
  readAt: "2026-09-18",
};

const SEARCH: BlueprintSearchReadResult<Row, "hybrid"> = {
  rows: ROWS,
  retrieval: "hybrid",
  truncated: false,
  capped_by: null,
  cached: false,
  age_ms: 0,
  thin: false,
  matched_total: 113,
  top_score: 0.71,
};

/** A reads bundle whose every arm is overridable, plus a log of the order the
 *  arms were entered and left — which is what makes sequencing assertable
 *  without a global anything. */
function readsWith(over: Partial<BlueprintReads<Row, "hybrid">> = {}) {
  const log: string[] = [];
  const wrap = <A extends unknown[], T>(label: string, fn: (...a: A) => Promise<T>) =>
    async (...args: A): Promise<T> => {
      log.push(`${label}:start`);
      try {
        return await fn(...args);
      } finally {
        log.push(`${label}:end`);
      }
    };
  const base: BlueprintReads<Row, "hybrid"> = {
    search: over.search ?? (async () => SEARCH),
    edges:
      over.edges ??
      (async () => [{ from: "c-kazoo", to: "c-tuba", direction: "downstream", kind: "leads_to" }]),
    findings: over.findings ?? (async () => ({ rows: [{ id: "f-1" }], total: 7 })),
    slices: over.slices ?? (async () => ({ rows: [{ id: "s-1" }], total: 14 })),
    touchpoints:
      over.touchpoints ??
      (async () => ({ rows: [{ name: "Kazoo" }], registryTotal: 31, words: ["kazoo"] })),
    index: over.index ?? (async () => INDEX),
  };
  return {
    log,
    reads: {
      search: wrap("search", base.search),
      edges: wrap("edges", base.edges),
      findings: wrap("findings", base.findings),
      slices: wrap("slices", base.slices),
      touchpoints: wrap("touchpoints", base.touchpoints),
      index: wrap("index", base.index),
    } satisfies BlueprintReads<Row, "hybrid">,
  };
}

const ALL = BLUEPRINT_ENRICHMENTS;

test("one read answers with the rows, the retrieval path and the corpus-wide total", async () => {
  const { reads } = readsWith();
  const result = await readBlueprint({ query: "kazoo", scope: {} }, reads);
  assert.deepEqual(result.rows, ROWS);
  assert.equal(result.retrieval, "hybrid");
  assert.equal(result.matched, 113);
  assert.equal(result.cached, false);
  assert.equal(result.top_score, 0.71);
  // Nothing was asked for, so nothing is reported — an enrichment key that
  // appeared unasked would read as an availability claim about a read that
  // never happened.
  assert.deepEqual(result.enrichments, {});
});

test("an enrichment nobody asked for is never read", async () => {
  const { reads, log } = readsWith();
  await readBlueprint({ query: "kazoo", scope: {} }, reads);
  assert.deepEqual(log, ["search:start", "search:end"]);
});

test("the enrichment reads run in sequence, never overlapping", async () => {
  const { reads, log } = readsWith();
  await readBlueprint({ query: "kazoo", scope: {}, include: ALL }, reads);
  // Every start is immediately followed by its own end: no arm begins while
  // another is in flight. A Promise.all would interleave them.
  for (let i = 0; i < log.length; i += 2) {
    const started = log[i] ?? "";
    const ended = log[i + 1] ?? "";
    assert.ok(started.endsWith(":start"), `${started} should be a start`);
    assert.ok(ended.endsWith(":end"), `${ended} should be an end`);
    assert.equal(started.replace(":start", ""), ended.replace(":end", ""));
  }
  // And the search is first: an enrichment failure must never be able to cost
  // the rows.
  assert.equal(log[0], "search:start");
  assert.equal(log.length, (ALL.length + 1) * 2);
});

test("each requested enrichment reports its own total and whether it was capped", async () => {
  const { reads } = readsWith();
  const { enrichments } = await readBlueprint(
    { query: "kazoo", scope: {}, include: ALL },
    reads,
  );
  assert.equal(enrichments.findings?.total, 7);
  assert.equal(enrichments.findings?.capped, true);
  assert.equal(enrichments.slices?.total, 14);
  assert.equal(enrichments.slices?.capped, true);
  assert.equal(enrichments.touchpoints?.total, 31);
  assert.equal(enrichments.touchpoints?.capped, true);
  assert.deepEqual(enrichments.touchpoints?.words, ["kazoo"]);
  // Edges are one hop off the matched cells, not a page of a larger set —
  // there is no total to beat, so none is invented.
  assert.equal(enrichments.edges?.total, undefined);
  assert.equal(enrichments.edges?.capped, false);
});

test("a total equal to the page is not a cap", async () => {
  const { reads } = readsWith({
    slices: async () => ({ rows: [{ id: "s-1" }], total: 1 }),
    findings: async () => ({ rows: [], total: 0 }),
  });
  const { enrichments } = await readBlueprint(
    { query: "kazoo", scope: {}, include: ["slices", "findings"] },
    reads,
  );
  assert.equal(enrichments.slices?.capped, false);
  assert.equal(enrichments.findings?.capped, false);
});

test("a missing total leaves the cap unclaimed rather than guessing", async () => {
  const { reads } = readsWith({
    slices: async () => ({ rows: [{ id: "s-1" }], total: undefined }),
  });
  const { enrichments } = await readBlueprint(
    { query: "kazoo", scope: {}, include: ["slices"] },
    reads,
  );
  assert.equal(enrichments.slices?.total, undefined);
  assert.equal(enrichments.slices?.capped, false);
});

test("availability is reported per enrichment, served or not", async () => {
  const { reads } = readsWith({
    findings: async () => {
      throw new Error("findings table hiccup");
    },
  });
  const result = await readBlueprint(
    { query: "kazoo", scope: {}, include: ["edges", "findings", "slices"] },
    reads,
  );
  // The rows survive a failed enrichment. This is the false-absence bug: the
  // search succeeded, so the answer is good and only one enrichment is missing.
  assert.deepEqual(result.rows, ROWS);
  assert.equal(result.enrichments.findings?.availability, "unavailable");
  assert.equal(result.enrichments.findings?.value, undefined);
  assert.equal(result.enrichments.edges?.availability, "served");
  assert.equal(result.enrichments.slices?.availability, "served");
});

test("an enrichment that failed is still reported, so absence is never inferred from a missing key", async () => {
  const { reads } = readsWith({ index: async () => undefined });
  const result = await readBlueprint({ query: "kazoo", scope: {}, include: ["index"] }, reads);
  // The index read answers `undefined` on failure instead of throwing, and an
  // OMITTED key is indistinguishable from "no such scenario exists" — which is
  // the bug. Asked for at all means the status is stated.
  assert.equal(result.enrichments.index?.availability, "unavailable");
});

test("the index is attached when the deployment asks for it, without being in include", async () => {
  const { reads, log } = readsWith();
  const result = await readBlueprint({ query: "kazoo", scope: {}, autoIndex: true }, reads);
  assert.equal(result.enrichments.index?.availability, "served");
  assert.deepEqual(result.enrichments.index?.value, INDEX);
  assert.deepEqual(log, ["search:start", "search:end", "index:start", "index:end"]);
});

test("a budget stop is not best-effort — it comes out of the whole read", async () => {
  const { reads } = readsWith({
    findings: async () => {
      throw new SubrequestBudgetError(38);
    },
  });
  await assert.rejects(
    () => readBlueprint({ query: "kazoo", scope: {}, include: ["findings", "slices"] }, reads),
    SubrequestBudgetError,
  );
});

test("a budget stop during an enrichment stops the reads after it", async () => {
  const { reads, log } = readsWith({
    edges: async () => {
      throw new SubrequestBudgetError(38);
    },
  });
  await assert.rejects(
    () => readBlueprint({ query: "kazoo", scope: {}, include: ALL }, reads),
    SubrequestBudgetError,
  );
  assert.ok(!log.includes("slices:start"), "no read is spent after the budget is gone");
});

test("a search failure is the caller's to handle — the read does not swallow it", async () => {
  const { reads } = readsWith({
    search: async () => {
      throw new Error("supabase unreachable");
    },
  });
  await assert.rejects(
    () => readBlueprint({ query: "kazoo", scope: {}, include: ALL }, reads),
    /supabase unreachable/,
  );
});

test("edges and findings ride inside the search when the fused path served it", async () => {
  const fused: BlueprintSearchReadResult<Row, "hybrid"> = {
    ...SEARCH,
    edges: [{ from: "c-tuba", to: "c-kazoo", direction: "upstream", kind: "enables" }],
    findings: { rows: [{ id: "f-fused" }], total: 4 },
  };
  const { reads, log } = readsWith({ search: async () => fused });
  const { enrichments } = await readBlueprint(
    { query: "kazoo", scope: {}, include: ["edges", "findings"] },
    reads,
  );
  assert.equal(enrichments.edges?.fused, true);
  assert.equal(enrichments.findings?.fused, true);
  assert.deepEqual(enrichments.findings?.value, [{ id: "f-fused" }]);
  assert.equal(enrichments.findings?.total, 4);
  // The whole point: a fused enrichment is a metered subrequest NOT spent.
  assert.deepEqual(log, ["search:start", "search:end"]);
});

test("the fused pair is asked for inside the search only when it was requested", async () => {
  const asked: Array<readonly string[] | undefined> = [];
  const { reads } = readsWith({
    search: async (_q, options) => {
      asked.push(options.include);
      return SEARCH;
    },
  });
  await readBlueprint({ query: "kazoo", scope: {}, include: ["findings", "slices"] }, reads);
  assert.deepEqual(asked, [["findings"]]);
});

test("every fallback path still owes the separate reads", async () => {
  // No `edges`/`findings` on the result is the signal that a fallback path —
  // RPC absent mid-rollout, hybrid off, the semantic or keyword ladder —
  // served this query. Keeping both is what makes the switch safe to deploy
  // before the migration is everywhere.
  const { reads, log } = readsWith({
    search: async () => ({ ...SEARCH, retrieval: "hybrid" as const }),
  });
  const { enrichments } = await readBlueprint(
    { query: "kazoo", scope: {}, include: ["edges", "findings"] },
    reads,
  );
  assert.equal(enrichments.edges?.fused, false);
  assert.equal(enrichments.findings?.fused, false);
  assert.deepEqual(enrichments.findings?.value, [{ id: "f-1" }]);
  assert.deepEqual(log, [
    "search:start",
    "search:end",
    "edges:start",
    "edges:end",
    "findings:start",
    "findings:end",
  ]);
});

test("the cell-keyed reads are given the matched cells' ids, and nothing else's", async () => {
  const seen: string[][] = [];
  const { reads } = readsWith({
    edges: async (ids) => {
      seen.push(ids);
      return [];
    },
    findings: async (ids) => {
      seen.push(ids);
      return { rows: [], total: 0 };
    },
  });
  await readBlueprint({ query: "kazoo", scope: {}, include: ["edges", "findings"] }, reads);
  // The phase row carries no cell id, and an edge read keyed on one would ask
  // the wrong table for the wrong thing.
  assert.deepEqual(seen, [
    ["c-kazoo", "c-tuba"],
    ["c-kazoo", "c-tuba"],
  ]);
});

test("the query text drives the query-keyed reads", async () => {
  const seen: string[] = [];
  const { reads } = readsWith({
    slices: async (q) => {
      seen.push(q);
      return { rows: [], total: 0 };
    },
    touchpoints: async (q) => {
      seen.push(q);
      return { rows: [], registryTotal: 0, words: [] };
    },
  });
  await readBlueprint(
    { query: "who books the kazoo", scope: {}, include: ["slices", "touchpoints"] },
    reads,
  );
  assert.deepEqual(seen, ["who books the kazoo", "who books the kazoo"]);
});

test("a fresh read bypasses every cache it can, search and index alike", async () => {
  const freshness: Array<boolean | undefined> = [];
  const { reads } = readsWith({
    search: async (_q, options) => {
      freshness.push(options.fresh);
      return SEARCH;
    },
    index: async (options) => {
      freshness.push(options.fresh);
      return INDEX;
    },
  });
  await readBlueprint({ query: "kazoo", scope: {}, fresh: true, include: ["index"] }, reads);
  assert.deepEqual(freshness, [true, true]);
});

test("the scope reaches the search verbatim — a filtered question never gets an unfiltered answer", async () => {
  const seen: unknown[] = [];
  const { reads } = readsWith({
    search: async (_q, options) => {
      seen.push(options.scope);
      return SEARCH;
    },
  });
  const scope = { filterScenario: "Quiet Harbour", granularity: "phase" } as const;
  await readBlueprint({ query: "", scope }, reads);
  assert.deepEqual(seen, [scope]);
});

test("the cap flags the search itself reports come through untouched", async () => {
  const { reads } = readsWith({
    search: async () => ({
      ...SEARCH,
      truncated: true,
      capped_by: "semantic" as const,
      cached: true,
      age_ms: 12_000,
      thin: true,
      matched_total: undefined,
      top_score: undefined,
    }),
  });
  const result = await readBlueprint({ query: "kazoo", scope: {} }, reads);
  assert.equal(result.truncated, true);
  assert.equal(result.capped_by, "semantic");
  assert.equal(result.cached, true);
  assert.equal(result.age_ms, 12_000);
  assert.equal(result.thin, true);
  assert.equal(result.matched, undefined);
  assert.equal(result.top_score, undefined);
});

test("an enrichment name that is not one of ours is ignored, not read", async () => {
  const { reads, log } = readsWith();
  await readBlueprint(
    // The tool filters the model's `include` against the same set; this is the
    // read entry refusing to be the second place that has to be right.
    { query: "kazoo", scope: {}, include: ["edges", "wishes"] as never },
    reads,
  );
  assert.deepEqual(log, ["search:start", "search:end", "edges:start", "edges:end"]);
});

test("asking for the same enrichment twice reads it once", async () => {
  const { reads, log } = readsWith();
  await readBlueprint({ query: "kazoo", scope: {}, include: ["slices", "slices"] }, reads);
  assert.deepEqual(log, ["search:start", "search:end", "slices:start", "slices:end"]);
});
