// The local turn transport, and the recordings it replays (#512).
//
// Two kinds of test here, and the second is the one that keeps the instrument
// honest over time:
//
//   1. the recording format — what is accepted, what is refused by name, and
//      which recorded turn answers which request;
//   2. THE REPO'S OWN RECORDINGS against the repo's own fixture. A recording is
//      keyed on the prompt, so a case whose wording is edited would otherwise
//      keep scoring green against the OLD question's draw — the same class of
//      defect as a fixture that names a blueprint row. The check below makes
//      that edit fail here instead.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { applySubject } from "./eval-subjects.mjs";
import {
  RECORDINGS_DIR,
  UNRECORDED_TOOL_RESULT,
  loadRecordings,
  localTransport,
  parseRecording,
  turnIndexOf,
} from "./eval-transport-local.mjs";

const FIXTURE = new URL("../../../docs/evals/fixtures/uno-bot-cases.json", import.meta.url);
const cases = JSON.parse(readFileSync(FIXTURE, "utf8")).cases;
const caseById = (id) => cases.find((c) => c.id === id);

const MINIMAL = {
  case: "X1",
  source: "authored",
  turns: [{ prompt: "hello", replies: [{ text: "hi" }] }],
};

// ── (1) the format ──────────────────────────────────────────────────────────

test("a minimal recording parses, with the optional fields defaulted", () => {
  const rec = parseRecording(structuredClone(MINIMAL));
  assert.equal(rec.case, "X1");
  assert.equal(rec.source, "authored");
  assert.deepEqual(rec.turns[0].toolResults, []);
  assert.deepEqual(rec.turns[0].references, []);
  assert.equal(rec.turns[0].gateAsk, null);
});

test("a recording with no source, or an invented one, is refused by name", () => {
  const { source: _drop, ...noSource } = structuredClone(MINIMAL);
  assert.throws(() => parseRecording(noSource), /'source' must be one of authored, captured/);
  assert.throws(
    () => parseRecording({ ...structuredClone(MINIMAL), source: "synthetic" }),
    /'source' must be one of/,
  );
});

test("a malformed recording names the file and the turn", () => {
  const bad = { ...structuredClone(MINIMAL), turns: [{ replies: [] }] };
  assert.throws(() => parseRecording(bad, { file: "X1.json" }), /X1\.json: turn 1: no 'prompt'/);
  const noReplies = { ...structuredClone(MINIMAL), turns: [{ prompt: "hi" }] };
  assert.throws(() => parseRecording(noReplies, { file: "X1.json" }), /turn 1: no 'replies' array/);
});

test("a turn is keyed on its place in the case, not on call order", () => {
  // R5 asks the SAME thing at turn 1 and turn 3 — that IS the case — and a
  // 3-sample case replays turn 1 three times. The index comes off the history.
  assert.equal(turnIndexOf([]), 0);
  assert.equal(turnIndexOf([{ role: "user", content: "a" }, { role: "assistant", content: "b" }]), 1);
  assert.equal(turnIndexOf(undefined), 0);
});

// ── (2) the repo's recordings, against the repo's fixture ───────────────────

const recordings = loadRecordings(RECORDINGS_DIR);

test("the repo has at least one recording, and each names a case the fixture has", () => {
  assert.ok(recordings.size > 0, `no recordings in ${RECORDINGS_DIR}`);
  for (const id of recordings.keys()) {
    assert.ok(caseById(id), `recording ${id}.json names no fixture case`);
  }
});

test("every recorded prompt is the fixture's prompt, verbatim", () => {
  for (const [id, rec] of recordings) {
    const spec = caseById(id);
    assert.equal(
      rec.turns.length,
      spec.turns.length,
      `${id}: recording covers ${rec.turns.length} turns, the case has ${spec.turns.length}`,
    );
    // A `need` case's recorded prompt is the FILLED-IN one — the runner
    // substitutes the subject before turn 1 — so the comparison is against the
    // case as the recording's own row fills it.
    const filled = rec.subject ? applySubject(spec, rec.subject).spec : spec;
    filled.turns.forEach((turn, i) => {
      assert.equal(
        rec.turns[i].prompt,
        turn.prompt,
        `${id} turn ${i + 1}: the recording replays a prompt the case no longer asks — re-record it`,
      );
    });
  }
});

test("an authored recording says so in its own note", () => {
  // The `source` field is what the runner and the results file read; the note is
  // what a person reads. A file whose replies were written by hand and whose
  // note does not say so is how "the suite is green" comes to mean more than it
  // does.
  for (const [id, rec] of recordings) {
    if (rec.source !== "authored") continue;
    assert.match(rec.note, /AUTHORED/, `${id}: an authored recording must say so in its note`);
  }
});

// ── (3) the transport ───────────────────────────────────────────────────────

test("an unrecorded case is unsupported — a reason, not a failure", () => {
  const t = localTransport({ recordings, build: false });
  assert.equal(t.unsupported(caseById("R3")), null);
  assert.match(t.unsupported(caseById("R1")), /no recording for R1/);
});

test("a subject case with no recording gets an honest skip, never a fabricated row", () => {
  const t = localTransport({ recordings, build: false, env: {} });
  return t.fetchSubject("scenario-any").then((got) => {
    assert.equal(got.subject, null);
    assert.match(got.reason, /reaches no blueprint/);
    assert.match(got.reason, /--transport=worker/);
  });
});

// ── (4) a run-time subject, from the recording (#541) ───────────────────────

/** B2 — `what happens in {{subject.scenario}}?`, one turn, one row. */
const B2_SUBJECT = { name: "Goal Setting", scenario: "Goal Setting", phase: "Onboarding" };
const b2Recording = () => {
  const spec = applySubject(caseById("B2"), B2_SUBJECT).spec;
  return parseRecording({
    case: "B2",
    source: "authored",
    note: "AUTHORED — a blueprint answer for the recorded row, for this test.",
    subject: B2_SUBJECT,
    turns: [
      {
        prompt: spec.turns[0].prompt,
        replies: [
          { text: `In the service blueprint, the ${B2_SUBJECT.scenario} scenario runs across the ${B2_SUBJECT.phase} phase.` },
        ],
      },
    ],
  });
};

test("a need case answers its condition from the recording's own row", async () => {
  const t = localTransport({ recordings: new Map([["B2", b2Recording()]]), log: () => {}, env: {} });
  const got = await t.fetchSubject("scenario-any", caseById("B2"));
  // The worker transport's success shape — `{ subject, build }` — so the runner
  // threads `{ need, subject }` into the result and the judge prompt with no
  // branching on which transport answered.
  assert.deepEqual(got.subject, B2_SUBJECT);
  assert.match(String(got.build), /authored recording/);
  assert.equal(got.reason, undefined);
  assert.equal(got.error, undefined);

  // And the filled-in prompt replays: the row the condition answered with is the
  // row the recorded turn was recorded against.
  const spec = applySubject(caseById("B2"), got.subject).spec;
  const resp = await t.runTurn({ prompt: spec.turns[0].prompt, history: [], pending: null });
  assert.equal(resp.ok, true, resp.error);
  assert.match(resp.result.text, new RegExp(B2_SUBJECT.scenario));
});

test("a need case whose recording carries no subject skips, by name", async () => {
  const { subject: _drop, ...noSubject } = b2Recording();
  const t = localTransport({ recordings: new Map([["B2", noSubject]]), build: false, env: {} });
  const got = await t.fetchSubject("scenario-any", caseById("B2"));
  assert.equal(got.subject, null);
  assert.match(got.reason, /recording for B2 carries no 'subject'/);
  assert.match(got.reason, /eval-record\.mjs/);
});

test("a 'subject' that is not a row is refused where it can still be named", () => {
  assert.throws(
    () => parseRecording({ ...structuredClone(MINIMAL), subject: ["Goal Setting"] }, { file: "X1.json" }),
    /X1\.json: 'subject' is not a row object/,
  );
});

test("R3 runs through Turn in-process and stages the recorded tool", async () => {
  const t = localTransport({ recordings, log: () => {} });
  const resp = await t.runTurn({ prompt: caseById("R3").turns[0].prompt, history: [], pending: null });
  assert.equal(resp.ok, true, resp.error);
  assert.equal(resp.result.kind, "proposal");
  assert.equal(resp.result.toolName, "shareout_post");
  assert.match(String(resp.build), /authored recording/);
  assert.equal(resp.turn.staged, true);
});

test("a prompt with no recorded turn at that position is named, not replayed", async () => {
  const t = localTransport({ recordings, log: () => {} });
  const resp = await t.runTurn({ prompt: "a question nobody recorded", history: [], pending: null });
  assert.equal(resp.ok, false);
  assert.match(resp.error, /no recorded turn 1 for this prompt/);
});

test("an unrecorded lookup answers empty, and says it was not recorded", () => {
  // The alternative — "" — reads to the model as a tool that answered with
  // nothing, which is the silent-empty-read failure this whole suite exists to
  // catch, reproduced inside the instrument.
  const parsed = JSON.parse(UNRECORDED_TOOL_RESULT);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.rows, []);
  assert.match(parsed.note, /no result recorded/);
});
