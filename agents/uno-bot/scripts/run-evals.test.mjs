// The eval runner's SEQUENCING, driven end to end with a fake transport (#511).
//
// THE PROPERTY THIS FILE HOLDS: the composition of the four tested helpers is
// itself tested. `eval-scoring`, `eval-history`, `eval-subjects` and
// `eval-fixture` each have a test beside them; the runner that calls all four —
// per turn, per sample, per case, in that order — had none, because running it
// meant a deployed Worker, a debug token and 58 model calls. The transport seam
// removes that: the cases below replay real fixture cases through a fake
// transport and read the summary the runner produced.
//
// The cases are the repo's own (R3, C1, B2 out of docs/evals/fixtures/
// uno-bot-cases.json), copied into a temp fixture one at a time. Replaying a
// hand-written case would test the runner against a shape nothing runs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runEvals, parseArgs } from "./run-evals.mjs";

const FIXTURE = new URL("../../../docs/evals/fixtures/uno-bot-cases.json", import.meta.url);
const ALL = JSON.parse(readFileSync(FIXTURE, "utf8"));
const caseById = (id) => {
  const c = ALL.cases.find((x) => x.id === id);
  assert.ok(c, `fixture has no case ${id}`);
  return structuredClone(c);
};

/** One temp fixture holding just these cases. */
function fixtureOf(cases) {
  const dir = mkdtempSync(join(tmpdir(), "uno-evals-"));
  const path = join(dir, "cases.json");
  writeFileSync(path, JSON.stringify({ _readme: "test fixture", cases }));
  return path;
}

/**
 * A transport that answers each turn from a list, and records what it was sent.
 * `subjects` is the board it pretends to be; omitting it makes a transport that
 * resolves no subjects at all.
 *
 * `replies` is indexed by the turn's place IN ITS CASE, read off the history it
 * was handed — not by call order. A 3-sample case runs turn 1 three times, and
 * a per-call index would answer the second sample's first turn with the first
 * sample's second reply.
 */
function fakeTransport(replies, { subjects } = {}) {
  const sent = [];
  const t = {
    name: "fake",
    calls: sent,
    async runTurn(req) {
      sent.push(structuredClone(req));
      const turnIndex = (req.history ?? []).filter((h) => h.role === "assistant").length;
      const reply = replies[Math.min(turnIndex, replies.length - 1)];
      return typeof reply === "function" ? reply(req, turnIndex) : reply;
    },
  };
  if (subjects) t.fetchSubject = async (need) => subjects[need] ?? { subject: null, reason: "nothing on this board" };
  return t;
}

/** Run with the clock and the log captured — a test must not wait 10s a case. */
async function run(casesPath, transport, opts = {}) {
  const lines = [];
  const waits = [];
  const judged = [];
  const summary = await runEvals({
    transport,
    casesPath,
    log: (l) => lines.push(l),
    sleep: async (ms) => waits.push(ms),
    judge: async (c, transcript) => {
      judged.push({ id: c.id, transcript });
      return opts.verdict ?? { verdict: "pass" };
    },
    ...opts.deps,
  });
  return { summary, lines, waits, judged };
}

// ── R3: one turn, a proposal, the deterministic tool check ───────────────────

const R3_OK = {
  ok: true,
  build: "r512",
  ms: 1234,
  result: { kind: "proposal", toolName: "shareout_post", input: { url: "https://plus-uno.netlify.app/home" } },
  tools: [{ name: "search_blueprint", args: { query: "empty states" } }],
};

test("a fixture case replays end to end: transport → scoring → judge → summary", async () => {
  const c = caseById("R3");
  const transport = fakeTransport([R3_OK]);
  const { summary, lines, waits, judged } = await run(fixtureOf([c]), transport);

  // Sampling: R3 declares samples: 3, so the turn ran three times and the
  // runner paused between them — with the injected clock, not the real one.
  assert.equal(c.samples, 3);
  assert.equal(transport.calls.length, 3);
  assert.equal(judged.length, 3);
  assert.ok(waits.length >= 3, `expected pauses between samples, got ${waits.length}`);

  // What the transport was handed is what the route used to be POSTed.
  assert.deepEqual(transport.calls[0], {
    prompt: c.turns[0].prompt,
    history: [],
    pending: null,
    surface: {},
  });

  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 0);
  assert.equal(summary.skipped, 0);
  assert.equal(summary.blockerFailures, 0);
  assert.equal(summary.transport, "fake", "the summary records HOW the turns were run");
  assert.equal(summary.workerBuild, "r512", "the build is read off the responses");
  assert.equal(summary.fixture.sha256.length, 12);

  const [result] = summary.results;
  assert.equal(result.id, "R3");
  assert.deepEqual(result.failures, []);
  assert.equal(result.passedRuns, 3);
  assert.equal(result.ms, 1234 * 3);
  assert.equal(result.transcript.turns.length, 1);
  assert.equal(result.judge.verdict, "pass");
  assert.ok(lines.some((l) => l.startsWith("[PASS] R3")) && lines.some((l) => l.includes("[3/3 samples]")));

  // The judge sees the transcript, not the fixture's answer key.
  assert.equal(judged[0].transcript.turns[0].response.result.toolName, "shareout_post");
});

test("a case fails deterministically on the wrong tool, and a failing blocker is counted", async () => {
  const wrong = { ...R3_OK, result: { kind: "proposal", toolName: "marketplace_register", input: {} } };
  const { summary, lines, judged } = await run(fixtureOf([caseById("R3")]), fakeTransport([wrong]));
  assert.equal(summary.passed, 0);
  assert.equal(summary.failed, 1);
  assert.equal(summary.blockerFailures, 1, "R3 is a blocker");
  assert.match(summary.results[0].failures[0], /R3: tool=marketplace_register \(expected shareout_post\)/);
  // A case that failed its deterministic checks is never sent to the judge —
  // a paid verdict on an answer already known to be wrong.
  assert.equal(judged.length, 0);
  assert.equal(summary.results[0].judge.reason, "deterministic checks failed");
  assert.ok(lines.some((l) => l.startsWith("[FAIL] R3")));
});

test("a turn that errors fails the case, and a transient error is retried first", async () => {
  // The first attempt of the run is rate-limited; every attempt after it lands.
  let attempts = 0;
  const transport = fakeTransport([
    () => (++attempts === 1 ? { ok: false, error: "429 quota exhausted for the model" } : R3_OK),
  ]);
  const { summary, waits } = await run(fixtureOf([caseById("R3")]), transport);
  assert.equal(summary.passed, 1, "the retry, not the case, absorbed the rate limit");
  assert.ok(waits.some((ms) => ms === 65_000), "the transient backoff was waited out");

  const dead = fakeTransport([() => ({ ok: false, error: "no such route (404)" })]);
  const { summary: s2 } = await run(fixtureOf([caseById("R3")]), dead);
  assert.equal(s2.failed, 1);
  assert.match(s2.results[0].failures[0], /turn errored: no such route/);
  assert.equal(dead.calls.length, 3, "a non-transient error is not retried; three samples still ran");
});

// ── C1: two turns, and the history the runner SENDS to the second ────────────

test("a two-turn case threads the reference receipt into turn 2's history", async () => {
  const c = caseById("C1");
  const method = "uno-maintain/method";
  const turn1 = {
    ok: true,
    build: "r512",
    result: { kind: "text", text: "Tier 2 — it touches a skill, so it is not a direct fix." },
    tools: [{ name: "read_reference", args: { name: method } }],
    references: [method],
  };
  const turn2 = {
    ok: true,
    build: "r512",
    result: { kind: "text", text: "Tier 2, because the direct-fix whitelist is typos, links, dates and formatting." },
    tools: [],
  };
  const transport = fakeTransport([turn1, turn2]);
  const { summary } = await run(fixtureOf([c]), transport);

  assert.equal(summary.passed, 1, JSON.stringify(summary.results[0].failures));
  // Turn 2 was sent the thread: the prompt, the reply, and the RECEIPT on the
  // user turn that read the reference — never the method's text (#426).
  const second = transport.calls[1];
  assert.equal(second.prompt, c.turns[1].prompt);
  assert.deepEqual(second.history[0], { role: "user", content: c.turns[0].prompt, references: [method] });
  assert.equal(second.history.length, 2);
  assert.ok(JSON.stringify(second.history).length < 8000);
  assert.equal(summary.results[0].transcript.turns.length, 2);
});

test("turn 2's expectHistory fails when the reference text rides the thread", async () => {
  const c = caseById("C1");
  const method = "uno-maintain/method";
  const bloated = {
    ok: true,
    // No `references`: nothing to thread as a receipt, so the assertion on
    // turn 2's history has nothing to find.
    result: { kind: "text", text: `Tier 2. ${"The severity pipeline, in full. ".repeat(320)}` },
    tools: [{ name: "read_reference", args: { name: method } }],
  };
  const { summary } = await run(fixtureOf([c]), fakeTransport([bloated]));
  assert.equal(summary.failed, 1);
  assert.ok(
    summary.results[0].failures.some((f) => /t2: history/.test(f)),
    `expected a turn-2 history failure, got ${JSON.stringify(summary.results[0].failures)}`,
  );
});

// ── B2: the run-time subject comes from the transport ────────────────────────

test("a subject case is filled in from the transport's row before turn 1", async () => {
  const c = caseById("B2");
  const subject = { name: "Session Cancellation", scenario: "Session Cancellation", phase: "During" };
  const transport = fakeTransport(
    [
      {
        ok: true,
        result: { kind: "text", text: "In Session Cancellation the tutor calls off and the CPO reconfirms." },
        tools: [{ name: "search_blueprint", args: { query: "cancellation", filter_scenario: "Session Cancellation" } }],
      },
    ],
    { subjects: { "scenario-any": { subject } } },
  );
  const { summary, lines } = await run(fixtureOf([c]), transport);

  assert.equal(summary.passed, 1, JSON.stringify(summary.results[0].failures));
  assert.equal(transport.calls[0].prompt, "what happens in Session Cancellation?");
  assert.deepEqual(summary.results[0].subject, subject);
  assert.equal(summary.results[0].need, "scenario-any");
  assert.ok(lines.some((l) => l.startsWith("[subject] B2 — scenario-any")));
});

test("a condition nothing satisfies is a SKIP, and comes out of the denominator", async () => {
  const transport = fakeTransport([R3_OK], { subjects: {} });
  const { summary, lines } = await run(fixtureOf([caseById("B2")]), transport);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.passed, 0);
  assert.equal(summary.failed, 0);
  assert.equal(summary.blockerFailures, 0, "a skip is not a failed blocker");
  assert.equal(transport.calls.length, 0, "no turn ran — there was nothing to ask about");
  assert.ok(lines.some((l) => l.startsWith("[SKIP] B2")));
});

test("a transport that resolves no subjects fails the case by name", async () => {
  const { summary } = await run(fixtureOf([caseById("B2")]), fakeTransport([R3_OK]));
  assert.equal(summary.failed, 1);
  assert.equal(summary.skipped, 0, "an unanswerable condition is not a fact about the board");
  assert.match(summary.results[0].failures[0], /transport 'fake' resolves no run-time subjects/);
});

// ── The CLI's default is the Worker, so the cron is unchanged ────────────────

test("the transport defaults to the worker and an unknown one is refused", () => {
  assert.deepEqual(parseArgs([]), { transport: "worker" });
  assert.deepEqual(parseArgs(["--transport=worker"]), { transport: "worker" });
  assert.deepEqual(parseArgs(["--transport", "worker"]), { transport: "worker" });
  assert.throws(() => parseArgs(["--transport=local"]), /unknown transport 'local'/);
  assert.throws(() => parseArgs(["--worker-url=x"]), /unknown argument/);
});
