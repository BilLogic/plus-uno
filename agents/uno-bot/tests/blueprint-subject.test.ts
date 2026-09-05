// How an eval scenario's CONDITION becomes a row from the live board (#415).
//
// THE PROPERTY THIS FILE HOLDS: selection reads the board and never remembers
// it. Every assertion below is against fixture rows whose names are invented
// here on purpose — if a rule in blueprint-subject.ts started leaning on a real
// scenario title, a real tool name or a real count, these tests would still
// pass while the live route returned nothing, so the fixtures are deliberately
// unlike production.
//
// The second property: an unsatisfiable condition yields a SUBJECT OF NULL with
// a reason, never a fabricated subject and never a throw. The runner turns that
// into a skip. A condition that quietly returned some other row would be the
// silent-wrong-answer failure this whole effort exists to close, reproduced
// inside the instrument meant to catch it.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUBJECT_NEEDS,
  NEED_FIELDS,
  isSubjectNeed,
  selectSubject,
  walkOutline,
  absentDetailClass,
  pickCellTitle,
  termCandidates,
  CORPUS_TERM_PROBES,
  MAX_CELL_SUBJECT_CHARS,
  type SubjectReads,
  type SubjectSearchResult,
} from "../src/integrations/blueprint-subject";

// A board shaped like the real embed and named like nothing in it.
const OUTLINE = [
  { name: "Alpha Phase", scenarios: [{ name: "Kettle Drum", paths: [{ name: "Happy Path", status: "live" }] }] },
  {
    name: "Beta Phase",
    scenarios: [
      { name: "Paper Lantern", paths: [{ name: "Happy Path", status: "live" }] },
      {
        name: "Quiet Harbour",
        paths: [
          { name: "Happy Path", status: "live" },
          { name: "Second Route", status: "proposed" },
        ],
      },
    ],
  },
];

const TOUCHPOINTS = [
  { name: "Kazoo", kind: "instrument", summary: "a small horn" },
  { name: "Paper Lantern Kit", kind: "artifact", summary: "two words, unusable as one term" },
  { name: "Tuba", kind: "instrument", summary: "a large horn" },
];

const CELL_COLUMNS = ["id", "content", "summary", "function", "form", "owner", "updated_at"];

/** A reads bundle whose every arm is overridable, plus a call log so a test can
 *  assert what was NOT read — the corpus-term probe budget matters. */
function readsWith(over: Partial<SubjectReads> = {}): SubjectReads & { calls: string[] } {
  const calls: string[] = [];
  const outline = over.outline ?? (async () => OUTLINE);
  const touchpoints = over.touchpoints ?? (async () => TOUCHPOINTS);
  const search =
    over.search ?? (async () => ({ rows: [], matched: 0 }) satisfies SubjectSearchResult);
  // Logging wraps the override rather than the default, so every test sees the
  // same call record whichever arm it replaced.
  return {
    calls,
    outline: () => {
      calls.push("outline");
      return outline();
    },
    touchpoints: () => {
      calls.push("touchpoints");
      return touchpoints();
    },
    search: (query, scope) => {
      calls.push(`search(${query}|${JSON.stringify(scope)})`);
      return search(query, scope);
    },
    cellColumns: over.cellColumns ?? CELL_COLUMNS,
  };
}

test("the need list is closed, and every need declares the fields it promises", () => {
  assert.equal(isSubjectNeed("scenario-with-future-paths"), true);
  assert.equal(isSubjectNeed("proposed-cell"), false, "a need nobody serves must not typecheck as one");
  assert.equal(isSubjectNeed(""), false);
  assert.deepEqual(Object.keys(NEED_FIELDS).sort(), [...SUBJECT_NEEDS].sort());
  for (const need of SUBJECT_NEEDS) {
    assert.ok(NEED_FIELDS[need].includes("name"), `${need} must promise 'name'`);
  }
});

test("the outline flattens to phase/scenario/path triples in read order", () => {
  const walked = walkOutline(OUTLINE);
  assert.deepEqual(
    walked.map((s) => `${s.phase}/${s.scenario}`),
    ["Alpha Phase/Kettle Drum", "Beta Phase/Paper Lantern", "Beta Phase/Quiet Harbour"],
  );
  // `live` is not a future status, so it flattens to null — the same rule the
  // board's own markers use, imported rather than restated.
  assert.deepEqual(walked[2]?.paths, [
    { name: "Happy Path", status: null },
    { name: "Second Route", status: "proposed" },
  ]);
});

test("an unnamed row is dropped rather than substituted as an empty subject", () => {
  const walked = walkOutline([
    { name: "  ", scenarios: [{ name: "Orphan" }] },
    { name: "Real", scenarios: [{ name: "" }, { name: "Kept", paths: [{ name: "", status: "proposed" }] }] },
  ]);
  assert.deepEqual(
    walked.map((s) => `${s.phase}/${s.scenario}`),
    ["Real/Kept"],
  );
  assert.deepEqual(walked[0]?.paths, [], "a path with no name cannot be cited");
});

test("walking a non-array payload is empty, not a throw", () => {
  assert.deepEqual(walkOutline(null), []);
  assert.deepEqual(walkOutline({ error: "PGRST202" }), []);
});

test("phase-any and scenario-any take the board's own first", async () => {
  assert.deepEqual((await selectSubject("phase-any", readsWith())).subject, {
    name: "Alpha Phase",
    phase: "Alpha Phase",
  });
  assert.deepEqual((await selectSubject("scenario-any", readsWith())).subject, {
    name: "Kettle Drum",
    scenario: "Kettle Drum",
    phase: "Alpha Phase",
  });
});

test("scenario-with-future-paths finds the non-live path and names its status", async () => {
  // THE CONDITION THE OLD FIXTURE HARD-CODED. It is answered from `status` on
  // paths — the column that replaced the `Planned:` / `Prototype:` naming
  // convention on 2026-08-21 — so the case cannot ask about a marker that no
  // longer exists.
  const pick = await selectSubject("scenario-with-future-paths", readsWith());
  assert.deepEqual(pick.subject, {
    name: "Quiet Harbour",
    scenario: "Quiet Harbour",
    phase: "Beta Phase",
    path: "Second Route",
    status: "proposed",
  });
});

test("an all-live board yields no future-state subject, with a reason", async () => {
  // The skip path, at the source. A board with nothing proposed is a legitimate
  // state of the world; a blocker that went red for it would be measuring the
  // roadmap, not the bot.
  const allLive = [{ name: "P", scenarios: [{ name: "S", paths: [{ name: "Happy Path", status: "live" }] }] }];
  const pick = await selectSubject("scenario-with-future-paths", readsWith({ outline: async () => allLive }));
  assert.equal(pick.subject, null);
  assert.match(pick.reason ?? "", /every path on the board is live/);
});

test("touchpoint-any returns the registry's own row, kind included", async () => {
  const pick = await selectSubject("touchpoint-any", readsWith());
  assert.deepEqual(pick.subject, { name: "Kazoo", touchpoint: "Kazoo", kind: "instrument" });
});

test("an empty registry is a skip, not an invented tool", async () => {
  const pick = await selectSubject("touchpoint-any", readsWith({ touchpoints: async () => [] }));
  assert.equal(pick.subject, null);
  assert.match(pick.reason ?? "", /registry returned no named row/);
});

test("only single-word registry names are usable as a search term", () => {
  assert.deepEqual(termCandidates(TOUCHPOINTS), ["Kazoo", "Tuba"]);
  assert.deepEqual(termCandidates([{ name: "AV" }, { name: "e-mail" }, { name: "  " }, { name: 7 }]), []);
  assert.deepEqual(termCandidates([{ name: "Zoom" }, { name: "zoom" }]), ["Zoom"], "case-insensitive dedupe");
});

test("corpus-term needs a term the corpus matches MORE than one page shows", async () => {
  // Without the gap the completeness question has no wrong answer to catch:
  // counting the rows shown would give the right number by accident, and a bot
  // that never learned to read `matched` would pass.
  const matches: Record<string, SubjectSearchResult> = {
    Kazoo: { rows: [{ kind: "cell", title: "a" }, { kind: "cell", title: "b" }], matched: 2 },
    Tuba: { rows: [{ kind: "cell", title: "a" }], matched: 41 },
  };
  const reads = readsWith({ search: async (q) => matches[q] ?? { rows: [] } });
  const pick = await selectSubject("corpus-term", reads);
  assert.deepEqual(pick.subject, { name: "Tuba", term: "Tuba", matched: 41, shown: 1 });
});

test("a corpus with no such term skips, and the probe budget is honoured", async () => {
  const names = Array.from({ length: 12 }, (_, i) => ({ name: `Term${i}` }));
  const reads = readsWith({
    touchpoints: async () => names,
    search: async () => ({ rows: [{ kind: "cell", title: "only one" }], matched: 1 }),
  });
  const pick = await selectSubject("corpus-term", reads);
  assert.equal(pick.subject, null);
  assert.match(pick.reason ?? "", /matches more cells than one page shows/);
  assert.equal(
    reads.calls.filter((c) => c.startsWith("search(")).length,
    CORPUS_TERM_PROBES,
    "each probe is a subrequest against the same 50-per-invocation cap",
  );
});

test("a search that reports no total is not treated as a count", async () => {
  // `matched_total` is absent on every fallback path. Reading a missing total
  // as zero — or as the row count — would hand the completeness case a subject
  // whose premise the tool cannot support.
  const reads = readsWith({ search: async () => ({ rows: [{ kind: "cell", title: "a" }] }) });
  assert.equal((await selectSubject("corpus-term", reads)).subject, null);
});

test("absent-detail names a class the cells table has no column for", () => {
  assert.equal(absentDetailClass(CELL_COLUMNS), "duration");
  // The ratchet: the day the schema grows the field, the class stops
  // qualifying and the case skips instead of asserting the bot must refuse a
  // question the blueprint can now answer.
  assert.equal(absentDetailClass([...CELL_COLUMNS, "duration_min"]), "volume");
  assert.equal(absentDetailClass([...CELL_COLUMNS, "duration_min", "session_count"]), undefined);
});

test("absent-detail pairs the class with a real, askable cell", async () => {
  const reads = readsWith({
    search: async () => ({
      rows: [
        { kind: "cell", title: `${"x".repeat(MAX_CELL_SUBJECT_CHARS + 1)}` },
        { kind: "cell", title: "Tutor confirms the slot" },
        { kind: "cell", title: "  " },
      ],
    }),
  });
  const pick = await selectSubject("absent-detail", reads);
  assert.deepEqual(pick.subject, {
    name: "Tutor confirms the slot",
    cell: "Tutor confirms the slot",
    detail: "duration",
    scenario: "Kettle Drum",
    phase: "Alpha Phase",
  });
  assert.ok(
    reads.calls.some((c) => c.startsWith('search(|{"filterScenario":"Kettle Drum"')),
    `the cell is fetched filter-only under the chosen scenario (calls: ${reads.calls.join(", ")})`,
  );
});

test("a cell title too long to sit in a question is not picked", () => {
  assert.equal(pickCellTitle([{ kind: "cell", title: "y".repeat(MAX_CELL_SUBJECT_CHARS + 1) }]), undefined);
  // Shortest first, ties alphabetically, so three samples of one case ask about
  // the same row.
  assert.equal(
    pickCellTitle([
      { kind: "cell", title: "bbbb" },
      { kind: "cell", title: "aaa" },
      { kind: "cell", title: "aab" },
    ]),
    "aaa",
  );
  assert.equal(pickCellTitle([{ kind: "path", title: "Happy Path" }]), undefined);
});

test("a scenario whose cells cannot be read skips rather than asking about nothing", async () => {
  const pick = await selectSubject("absent-detail", readsWith({ search: async () => ({ rows: [] }) }));
  assert.equal(pick.subject, null);
  assert.match(pick.reason ?? "", /no cell under 'Kettle Drum'/);
});

test("an empty board skips every outline-backed need", async () => {
  const empty = readsWith({ outline: async () => [] });
  for (const need of ["phase-any", "scenario-any", "scenario-with-future-paths", "absent-detail"] as const) {
    const pick = await selectSubject(need, empty);
    assert.equal(pick.subject, null, `${need} invented a subject from an empty board`);
    assert.ok(pick.reason, `${need} skipped without saying why`);
  }
});
