// How a case's CONDITION becomes a filled-in case, and what happens when the
// board cannot satisfy it (#415).
//
// THE PROPERTY THIS FILE HOLDS: the three outcomes of asking for a subject stay
// apart. A row comes back and the case runs; nothing satisfies the condition and
// the case is SKIPPED — neither passed nor failed; the route or the read broke
// and the case FAILS. Collapsing the last two is the exact failure the parent
// spec exists to close, reproduced inside the instrument built to catch it: from
// Slack, "the column moved" and "the blueprint has nothing on that" are the same
// answer, and here "the roadmap is empty" and "the outline read 400'd" would be
// too.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  NEED_FIELDS,
  SUBJECT_NEEDS,
  placeholdersIn,
  substitute,
  applySubject,
  subjectUrl,
  fetchSubject,
  skipReason,
} from "./eval-subjects.mjs";

const SUBJECT = { name: "Quiet Harbour", scenario: "Quiet Harbour", phase: "Beta Phase", status: "proposed" };

/** A case shaped like the fixture's, with a placeholder in each of the four
 *  places a case can carry one. */
const CASE = {
  id: "B2",
  subject: { need: "scenario-with-future-paths" },
  turns: [{ prompt: "is any future state planned for {{subject.scenario}}?" }],
  textRegex: "\\b{{subject.status}}\\b",
  expectToolCalled: { tool: "search_blueprint", args: { filter_scenario: "{{subject.scenario}}" } },
  judgeNote: "The reply names {{subject.scenario}}'s non-live path in words.",
};

// ── Substitution ─────────────────────────────────────────────────────────────

test("every string in a case is substituted, wherever it sits", () => {
  // Wholesale on purpose: naming the keys would mean a new assertion key
  // silently opting out and reading as a literal `{{subject.scenario}}` against
  // the bot's reply — an assertion that can never fire.
  const { spec, missing } = applySubject(CASE, SUBJECT);
  assert.deepEqual(missing, []);
  assert.equal(spec.turns[0].prompt, "is any future state planned for Quiet Harbour?");
  assert.equal(spec.textRegex, "\\bproposed\\b");
  assert.deepEqual(spec.expectToolCalled.args, { filter_scenario: "Quiet Harbour" });
  assert.match(spec.judgeNote, /Quiet Harbour's non-live path/);
  // And the original is untouched, so a later sample cannot be handed a case
  // that was already filled in.
  assert.match(CASE.turns[0].prompt, /\{\{subject\.scenario\}\}/);
});

test("a substituted textRegex still matches the reply it was written for", () => {
  const { spec } = applySubject(CASE, SUBJECT);
  assert.equal(new RegExp(spec.textRegex).test("There is a proposed path here."), true);
  assert.equal(new RegExp(spec.textRegex).test("Everything here is live."), false);
});

test("a numeric field substitutes as its digits", () => {
  // `matched` is a count, and a count in a prompt is a string like any other.
  assert.equal(substitute("{{subject.matched}} cells", { matched: 41 }), "41 cells");
  assert.equal(substitute("{{ subject.term }}", { term: "Tuba" }), "Tuba", "inner spaces tolerated");
});

test("a case with no placeholder comes back unchanged", () => {
  const plain = { id: "R1", turns: [{ prompt: "What's the difference between Card and Surface?" }] };
  assert.deepEqual(applySubject(plain, SUBJECT), { spec: plain, missing: [] });
  assert.deepEqual(placeholdersIn(plain), []);
});

test("a field the subject does not carry is reported, and left visible", () => {
  // Blanking it would produce "is any future state planned for ?" — a prompt
  // that reads fine and asserts nothing. The placeholder survives so the
  // failure is legible in the log.
  const { spec, missing } = applySubject(CASE, { name: "X", scenario: "X" });
  assert.deepEqual(missing, ["status"]);
  assert.equal(spec.textRegex, "\\b{{subject.status}}\\b");
});

test("placeholders are found in every nesting a case uses", () => {
  assert.deepEqual(placeholdersIn(CASE).sort(), ["scenario", "status"]);
  assert.deepEqual(placeholdersIn({ a: [{ b: "{{subject.cell}}" }] }), ["cell"]);
  assert.deepEqual(placeholdersIn("{{subject.a}} {{subject.b}} {{subject.a}}"), ["a", "b"]);
  assert.deepEqual(placeholdersIn(null), [], "a null leaf is not a crash");
});

// ── The three outcomes of asking ─────────────────────────────────────────────

const ok = (body) => ({ status: 200, json: async () => body });

test("a row comes back as a subject", async () => {
  let seen = "";
  const got = await fetchSubject("scenario-with-future-paths", {
    workerUrl: "https://worker.example/",
    token: "tok",
    fetchImpl: async (u, init) => {
      seen = `${u}|${init.headers["x-debug-token"]}`;
      return ok({ ok: true, build: "r400-abc", subject: SUBJECT });
    },
  });
  assert.deepEqual(got.subject, SUBJECT);
  assert.equal(got.build, "r400-abc");
  assert.equal(seen, "https://worker.example/debug/blueprint-subject?need=scenario-with-future-paths|tok");
});

test("an unsatisfiable condition is a SKIP carrying the board's own reason", async () => {
  // THE CASE THIS FILE EXISTS FOR. An all-live board is a legitimate state of
  // the world. A blocker that went red for it would be measuring the roadmap.
  const got = await fetchSubject("scenario-with-future-paths", {
    workerUrl: "https://worker.example",
    token: "tok",
    fetchImpl: async () => ok({ ok: true, build: "r400-abc", subject: null, reason: "every path on the board is live" }),
  });
  assert.equal(got.subject, null);
  assert.equal(got.error, undefined, "a skip is not an error");
  assert.equal(
    skipReason("scenario-with-future-paths", got.reason),
    "no subject satisfies scenario-with-future-paths — every path on the board is live",
  );
});

test("a route that answers with no subject and no reason still skips legibly", async () => {
  const got = await fetchSubject("phase-any", {
    workerUrl: "https://worker.example",
    token: "tok",
    fetchImpl: async () => ok({ ok: true, subject: null }),
  });
  assert.equal(got.subject, null);
  assert.match(skipReason("phase-any", got.reason), /no subject satisfies phase-any — the route named no reason/);
});

test("a broken read is an ERROR, not a skip", async () => {
  // The distinction that matters. `subject: null` retires the case for the
  // afternoon; an error must fail it, or a blocker can be silenced by breaking
  // the thing that feeds it.
  const got = await fetchSubject("phase-any", {
    workerUrl: "https://worker.example",
    token: "tok",
    fetchImpl: async () => ok({ ok: false, error: "uno-blueprint not configured" }),
  });
  assert.equal(got.subject, undefined);
  assert.match(got.error, /not configured/);
});

test("an unknown need comes back with the list of known ones", async () => {
  const got = await fetchSubject("proposed-cell", {
    workerUrl: "https://worker.example",
    token: "tok",
    fetchImpl: async () => ({ status: 400, json: async () => ({ ok: false, error: "unknown need", needs: SUBJECT_NEEDS }) }),
  });
  assert.match(got.error, /unknown need \(known: phase-any, /);
});

test("an unreachable route and a non-JSON body are errors, not crashes", async () => {
  const down = await fetchSubject("phase-any", {
    workerUrl: "https://worker.example",
    token: "tok",
    fetchImpl: async () => {
      throw new Error("ECONNREFUSED");
    },
  });
  assert.match(down.error, /unreachable: ECONNREFUSED/);

  const html = await fetchSubject("phase-any", {
    workerUrl: "https://worker.example",
    token: "tok",
    fetchImpl: async () => ({
      status: 404,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    }),
  });
  assert.match(html.error, /non-JSON \(404\)/, "a 404 page is a missing route, not an empty board");
});

test("the URL is built once, and survives a trailing slash", () => {
  assert.equal(
    subjectUrl("https://worker.example///", "corpus-term"),
    "https://worker.example/debug/blueprint-subject?need=corpus-term",
  );
});

// ── The mirror stays in step ─────────────────────────────────────────────────

test("NEED_FIELDS mirrors the Worker module that populates it", () => {
  // The runner cannot import a Worker module, so NEED_FIELDS is a hand-kept
  // copy — and a hand-kept copy is exactly what rotted for eleven days in the
  // defect this whole effort is about. Reading the TypeScript source as text is
  // crude, but it is a subject that can be WRONG while everything still runs, so
  // it is the kind of check that would have caught that one.
  const src = readFileSync(new URL("../src/integrations/blueprint-subject.ts", import.meta.url), "utf8");
  const block = src.match(/export const NEED_FIELDS[^=]*=\s*\{([\s\S]*?)\n\};/);
  assert.ok(block, "NEED_FIELDS is no longer declared in the shape this check reads");
  const canonical = {};
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*"([a-z-]+)":\s*\[([^\]]*)\],?\s*$/);
    if (!m) continue;
    canonical[m[1]] = m[2].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  }
  assert.deepEqual(canonical, NEED_FIELDS);

  const needList = src.match(/export const SUBJECT_NEEDS = \[([\s\S]*?)\] as const;/);
  assert.ok(needList, "SUBJECT_NEEDS is no longer declared in the shape this check reads");
  const names = [...needList[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(names.sort(), [...SUBJECT_NEEDS].sort());
});
