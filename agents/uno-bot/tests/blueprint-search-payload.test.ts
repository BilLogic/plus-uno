// The eight fixes the blueprint tool used to carry as comments, as assertions
// (#607).
//
// WHAT CHANGED THAT MADE THIS FILE POSSIBLE. Every one of these behaviours was
// a fix applied to `blueprint-search.ts` and then guarded by a paragraph of
// prose above it, because the only way to reach the tool was through `Env`,
// `searchBlueprint` and the network — so the alternative to a comment was a
// transport stub, and a transport stub asserts what a fake HTTP layer does.
// Now the reads are `readBlueprint`'s (#606) and what is left in the tool is
// input validation and NOTE ASSEMBLY, which is pure: hand
// `blueprintSearchPayload` a read result and read the sentences back.
//
// The four failures named in the ticket, each with its own test below:
//   · a count answered off a capped page
//   · an enrichment failure read as a false absence
//   · a zero-row note contradicting the index
//   · a cache hit narrated as a fresh read
//
// The fixture read results are invented. `fetch` is a tripwire, not a
// transport: this suite must cost ZERO metered subrequests (ADR-022), so any
// outbound call fails it — and nothing here should want one.
import { test } from "node:test";
import assert from "node:assert/strict";

import { blueprintSearchPayload } from "../src/tools/blueprint-search";
import type {
  BlueprintEnrichments,
  BlueprintReadResult,
} from "../src/integrations/blueprint-read";
import type { BlueprintRetrieval, BlueprintRow } from "../src/integrations/blueprint";
import {
  cacheNote,
  enrichmentFailureNote,
  orientationNote,
  GROUNDING_NOTE,
  INDEX_NOTE,
  NO_ROWS_NOTE,
} from "../src/tools/blueprint-search-notes";

globalThis.fetch = (async (input: unknown) => {
  throw new Error(`this suite must not reach the network: ${String(input)}`);
}) as typeof fetch;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CELLS: BlueprintRow[] = [
  { kind: "cell", id: "cell-aaa", title: "Rehearse the handover" },
  { kind: "cell", id: "cell-bbb", title: "Post the summary" },
];

/** An index as the renderer shapes it. Invented counts — a fixture echoing the
 *  real board goes stale the next time someone edits it. */
const INDEX_FIXTURE = {
  scale: "6 phases",
  legend: "",
  phases: ["Application: Discovery(1)"],
  readAt: "2026-09-18",
};

function readResult(
  over: Partial<BlueprintReadResult<BlueprintRow, BlueprintRetrieval>> = {},
): BlueprintReadResult<BlueprintRow, BlueprintRetrieval> {
  return {
    rows: CELLS,
    retrieval: "hybrid",
    truncated: false,
    capped_by: null,
    cached: false,
    age_ms: 0,
    thin: false,
    enrichments: {},
    ...over,
  };
}

function payload(
  over: Partial<BlueprintReadResult<BlueprintRow, BlueprintRetrieval>> = {},
  query = "how does the handover work",
): { notes: string[]; rest: Record<string, unknown> } {
  const rest = blueprintSearchPayload({
    query,
    scope: {},
    appUrl: "https://uno-blueprint.example/",
    read: readResult(over),
  });
  return { notes: rest.notes as string[], rest };
}

/** A served enrichment, spelled the way `readBlueprint` spells one. */
function served<T>(value: T, opts: { total?: number; capped?: boolean } = {}) {
  return {
    disposition: "served" as const,
    value,
    ...(typeof opts.total === "number" ? { total: opts.total } : {}),
    capped: Boolean(opts.capped),
  };
}

/** A read that was attempted and did not answer. No value, no total, and —
 *  the property every test below turns on — no claim about what is there. */
const FAILED = { disposition: "failed" as const, capped: false };

// ── A count answered off a capped page ───────────────────────────────────────

test("a count answer comes from the total, never from counting the capped page", () => {
  // The mistake that shipped: "5 of 14" said as "5". The page and the count
  // behind it now arrive separately, and `capped` is the read's own comparison
  // of the two — the tool no longer re-derives it.
  const { notes, rest } = payload({
    enrichments: {
      findings: served([{ id: "f1" }, { id: "f2" }], { total: 20, capped: true }),
      slices: served([{ id: "s1" }], { total: 14, capped: true }),
    },
  });
  assert.equal(rest.findingsTotal, 20);
  assert.equal(rest.sliceTotal, 14);
  const findingsCount = notes.find((n) => n.includes("count-of-findings"));
  const sliceCount = notes.find((n) => n.includes("count-of-slices"));
  assert.match(String(findingsCount), /^20 open findings/);
  assert.match(String(findingsCount), /use 20\./);
  assert.match(String(sliceCount), /14 saved slices in total/);
  assert.match(String(sliceCount), /use 14\./);
});

test("an uncapped page earns no count note — the page IS the answer", () => {
  // The other half, and the reason the note is conditional: restating a count
  // that equals the page teaches the model to distrust the page.
  const { notes } = payload({
    enrichments: {
      findings: served([{ id: "f1" }], { total: 1, capped: false }),
      slices: served([{ id: "s1" }], { total: 1, capped: false }),
    },
  });
  assert.equal(notes.find((n) => n.includes("count-of-findings")), undefined);
  assert.equal(notes.find((n) => n.includes("count-of-slices")), undefined);
});

// ── A truncated result says WHICH cap fired ─────────────────────────────────

test("a truncated result names the cap, because the two caps want opposite moves", () => {
  // Same flag, opposite advice: a semantic cap wants DIFFERENT words, a row
  // cap wants a NARROWER query. A note that said only "this was capped" sent
  // half the retries the wrong way.
  const semantic = payload({ truncated: true, capped_by: "semantic", retrieval: "semantic" });
  assert.match(
    String(semantic.notes.find((n) => n.includes("CAPPED"))),
    /semantic match limit.*DIFFERENT words/s,
  );
  const rowCap = payload({ truncated: true, capped_by: "max_rows" });
  assert.match(String(rowCap.notes.find((n) => n.includes("CAPPED"))), /NARROWER query/);
});

// ── An enrichment failure is never a false absence ──────────────────────────

test("a failing enrichment read still returns the rows, and says it failed", () => {
  // The bug: an isolated failure left the key off the result, which is the
  // same shape as a table that really holds nothing — so a findings-table 400
  // reached Slack as "there are no findings against these cells".
  const { notes, rest } = payload({
    enrichments: { findings: FAILED, edges: FAILED, slices: FAILED, touchpoints: FAILED },
  });
  // The rows survive their decoration failing. That is the whole reason the
  // enrichments are isolated at all.
  assert.deepEqual(rest.rows, CELLS);
  assert.equal(rest.findings, undefined);
  assert.equal(rest.findingsTotal, undefined);
  for (const name of ["edges", "findings", "slices", "touchpoints"] as const) {
    assert.ok(
      notes.includes(enrichmentFailureNote(name, "failed")),
      `no failure note for ${name}`,
    );
  }
  // And the sentence forbids the conclusion the missing key used to invite.
  const findingsFailure = notes.find((n) => n.startsWith("`findings`"));
  assert.match(String(findingsFailure), /failure to LOOK, not evidence of absence/);
  assert.match(String(findingsFailure), /do NOT report that there are none/);
});

test("a served EMPTY enrichment is a different answer from a failed one", () => {
  // The distinction #606 bought, spent here: an empty page the source really
  // returned earns no failure note, because "nothing there" is an answer.
  const { notes } = payload({
    enrichments: { findings: served([] as Record<string, unknown>[], { total: 0 }) },
  });
  assert.equal(notes.find((n) => n.startsWith("`findings`")), undefined);
});

test("an unconfigured enrichment sends a person to the config, not to an outage", () => {
  const { notes } = payload({
    enrichments: { slices: { disposition: "unavailable", capped: false } },
  });
  assert.ok(notes.includes(enrichmentFailureNote("slices", "unavailable")));
  assert.match(String(notes.find((n) => n.startsWith("`slices`"))), /not configured on this deployment/);
});

test("a failed registry read does not become 'no touchpoint matched'", () => {
  // The absence note ASSERTS that the registry holds no such entry. A read
  // that failed has not earned that sentence, and emitting it anyway is the
  // false absence wearing the fix's clothes.
  const failed = payload({ enrichments: { touchpoints: FAILED } });
  assert.equal(failed.notes.find((n) => n.includes("No touchpoint in the registry")), undefined);
  assert.ok(failed.notes.includes(enrichmentFailureNote("touchpoints", "failed")));

  // A served empty read still says it, and still says what it searched for.
  const empty = payload({
    enrichments: {
      touchpoints: { ...served([] as Record<string, unknown>[], { total: 93 }), words: ["zoom"] },
    },
  });
  assert.match(
    String(empty.notes.find((n) => n.includes("No touchpoint in the registry"))),
    /matched "zoom" by name, kind or summary \(93 registry entries checked\)/,
  );
});

// ── A zero-row note that does not contradict the index ──────────────────────

test("a zero-row result is a statement about the QUERY, and points at the index", () => {
  // It used to say "the blueprint has nothing on this", which becomes wrong
  // the moment the attached index shows the scenario exists — the two notes
  // would have given opposite instructions in the same payload.
  const { notes, rest } = payload({
    rows: [],
    enrichments: { index: served(INDEX_FIXTURE) },
  });
  assert.equal(rest.count, 0);
  assert.equal(notes[0], NO_ROWS_NOTE);
  // It FORBIDS the claim it used to make, rather than making it.
  assert.match(NO_ROWS_NOTE, /do NOT say the blueprint has nothing on the subject/);
  assert.match(NO_ROWS_NOTE, /statement about the query, not about the blueprint/);
  assert.match(NO_ROWS_NOTE, /Check `index`/);
  // The index rides the zero-row branch, so the reader has the list that
  // contradicts the absence rather than only the absence.
  assert.ok(notes.includes(INDEX_NOTE));
  assert.deepEqual(rest.index, INDEX_FIXTURE);
  assert.equal(rest.orientation, "live");
});

test("a zero-row result with a failed index says it could not check", () => {
  const { notes, rest } = payload({ rows: [], enrichments: { index: FAILED } });
  assert.equal(rest.index, undefined);
  assert.equal(notes.find((n) => n === INDEX_NOTE), undefined);
  assert.ok(notes.includes(orientationNote("failed")));
  assert.match(String(notes.find((n) => n.includes("NO list of what exists"))), /say you could not check/);
});

// ── A cache hit narrated as a cache hit ─────────────────────────────────────

test("a cache-served read is narrated as cached, with its age", () => {
  // AGENT.md requires a freshness claim to be backed by a read THIS turn. A
  // user pushing back ("check again") got the same rows and was told they had
  // been re-fetched, which is a cache serving a lie.
  const { notes, rest } = payload({ cached: true, age_ms: 42_000 });
  assert.equal(rest.cached, true);
  assert.equal(rest.age_ms, 42_000);
  assert.ok(notes.includes(cacheNote(42_000)));
  assert.match(String(notes.find((n) => n.includes("short-lived cache"))), /\(42s old\)/);
});

test("a fresh read makes no cache claim at all", () => {
  const { notes } = payload({ cached: false, age_ms: 0 });
  assert.equal(notes.find((n) => n.includes("short-lived cache")), undefined);
});

// ── Orientation: three values, because "no index" had two causes ────────────

test("orientation is stated whenever the index was asked for, and says which no", () => {
  // An OMITTED key is indistinguishable from "no future path exists", which is
  // the bug. And until #607 the two ways of having no index — an outage and an
  // unwired deployment — shared one word.
  const asked = (enrichments: BlueprintEnrichments) =>
    blueprintSearchPayload({
      query: "q",
      scope: {},
      appUrl: undefined,
      read: readResult({ enrichments }),
    }).orientation;
  assert.equal(asked({ index: served(INDEX_FIXTURE) }), "live");
  assert.equal(asked({ index: FAILED }), "failed");
  assert.equal(asked({ index: { disposition: "unavailable", capped: false } }), "unavailable");
  // Not asked for at all is the one case with no status, because there is no
  // question to answer.
  assert.equal(asked({}), undefined);
});

test("an index that claims served with nothing in it attaches no index note", () => {
  // `readBlueprint` already downgrades that shape to `failed`; this is the
  // tool's half — the note ships only when there is an index to read.
  const { notes, rest } = payload({ enrichments: { index: FAILED } });
  assert.equal(rest.index, undefined);
  assert.equal(notes.find((n) => n === INDEX_NOTE), undefined);
});

// ── The payload's own shape ─────────────────────────────────────────────────

test("the grounding rule leads a result with rows, and nothing from a read's error travels", () => {
  const { notes, rest } = payload({
    enrichments: { findings: FAILED, index: FAILED },
  });
  assert.equal(notes[0], GROUNDING_NOTE);
  assert.equal(rest.ok, true);
  // The operator detail — credential names, HTTP bodies — is logged by the
  // read and never reaches here. A tool result can be echoed into Slack.
  assert.doesNotMatch(JSON.stringify(rest), /SUPABASE|Bearer|apikey/i);
});

test("an enrichment nobody asked for is silent — no key, no note", () => {
  const { notes, rest } = payload();
  for (const key of ["edges", "findings", "slices", "touchpoints", "index", "orientation"]) {
    assert.equal(rest[key], undefined, `${key} should be absent when it was not asked for`);
  }
  assert.equal(notes.find((n) => n.includes("failure to LOOK")), undefined);
});
