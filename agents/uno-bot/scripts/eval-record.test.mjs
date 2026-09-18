// Capturing a recording off a live Worker — without one (#541).
//
// The script's whole job is to turn /debug/eval responses into the local
// transport's input, and its one live dependency is the transport. So the
// transport is the seam these tests cross: a fake one answers the subject read
// and the turns, and what lands in the recording is asserted. No network, no
// token, no model spend — which is also the only way this file can run in the
// same `node --test` pass as everything else.
import { test } from "node:test";
import assert from "node:assert/strict";

import { loadCases } from "./eval-case.mjs";
import { parseArgs, recordCase, reconstructReplies, resolveSubject } from "./eval-record.mjs";
import { parseRecording } from "./eval-transport-local.mjs";

const { cases } = loadCases();
const caseById = (id) => cases.find((c) => c.id === id);

/** B2 declares `subject: { need: "scenario-any" }` and asks one question. */
const ROW = { name: "Goal Setting", scenario: "Goal Setting", phase: "Onboarding" };

/**
 * A transport that answers like the deployed Worker's, from a script.
 *
 * `prompts` records what it was asked, which is how a test sees that the
 * placeholders were filled in BEFORE the turn was sent rather than after.
 */
function fakeTransport({ subject = undefined, reason, error, text = "…" } = {}) {
  const prompts = [];
  return {
    name: "fake worker",
    prompts,
    async fetchSubject(need, spec) {
      prompts.push({ need, case: spec?.id });
      if (error) return { error };
      if (!subject) return { subject: null, reason };
      return { subject, build: "fake" };
    },
    async runTurn({ prompt }) {
      prompts.push({ prompt });
      return { ok: true, result: { kind: "text", text }, tools: [], narration: [] };
    },
  };
}

test("--case and --all are the only ways to name work", () => {
  assert.deepEqual(parseArgs(["--case=R3", "--case=R5"]).cases, ["R3", "R5"]);
  assert.equal(parseArgs(["--all"]).all, true);
  assert.throws(() => parseArgs(["R3"]), /unknown argument R3/);
});

test("a turn's answer is reconstructed as one final reply", () => {
  const replies = reconstructReplies({ result: { kind: "text", text: "here it is" }, tools: [] });
  assert.deepEqual(replies, [{ text: "here it is" }]);
});

test("a captured case with a subject writes the row into the recording", async () => {
  const transport = fakeTransport({ subject: ROW });
  const { recording, skipped } = await recordCase(caseById("B2"), transport);
  assert.equal(skipped, undefined);
  assert.deepEqual(recording.subject, ROW);
  assert.equal(recording.source, "captured");
  // The prompt that was SENT carried the row, so the prompt recorded does too —
  // that is what the local transport keys a replayed turn on.
  assert.match(recording.turns[0].prompt, /what happens in Goal Setting\?/);
  assert.ok(!recording.turns[0].prompt.includes("{{subject"));
  assert.match(recording.note, /subject row below/);
  // And the file the local transport would load parses.
  const parsed = parseRecording(JSON.parse(JSON.stringify(recording)), { file: "B2.json" });
  assert.deepEqual(parsed.subject, ROW);
});

test("a case with no condition writes no subject", async () => {
  const { recording } = await recordCase(caseById("R3"), fakeTransport());
  assert.equal("subject" in recording, false);
  assert.equal(recording.turns.length, caseById("R3").turns.length);
});

test("a condition nothing satisfies is a skip, by name — there is nothing to record", async () => {
  const transport = fakeTransport({ reason: "no scenario carries future state" });
  const { recording, skipped } = await recordCase(caseById("B5"), transport);
  assert.equal(recording, undefined);
  assert.match(skipped, /no subject satisfies scenario-with-future-paths/);
  assert.match(skipped, /no scenario carries future state/);
});

test("a broken subject route stops the case, rather than recording around it", async () => {
  const transport = fakeTransport({ error: "subject route 500" });
  await assert.rejects(
    () => recordCase(caseById("B2"), transport),
    /subject route for 'scenario-any': subject route 500/,
  );
});

test("a row missing a field the case asks for is a failure, not a filled-in blank", async () => {
  // The condition was satisfiable and the route answered, so an unfilled
  // placeholder means the fixture and the route disagree about what
  // 'scenario-any' promises — the same division run-evals.mjs makes.
  const transport = fakeTransport({ subject: { name: "Goal Setting" } });
  await assert.rejects(
    () => resolveSubject(caseById("B2"), transport),
    /subject for 'scenario-any' carries no 'scenario'/,
  );
});
