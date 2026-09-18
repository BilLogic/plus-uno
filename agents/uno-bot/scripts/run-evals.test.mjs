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
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCases } from "./eval-case.mjs";
import { RESULT_KEYS } from "./eval-results.mjs";
import { runEvals, parseArgs } from "./run-evals.mjs";
import { noJudge } from "./eval-judge.mjs";
import { workerTransport } from "./eval-transport.mjs";
import { localTransport } from "./eval-transport-local.mjs";

const ALL = loadCases();
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
    judge: {
      name: "fake",
      judgeCase: async (c, transcript) => {
        judged.push({ id: c.id, transcript });
        return opts.verdict ?? { verdict: "pass" };
      },
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
  assert.equal(result.judged, true, "this pass was graded, and the row says so");
  assert.deepEqual(summary.judge, { name: "fake", pass: 1, fail: 0, skipped: 0, skipReasons: {} });
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
  assert.equal(summary.results[0].judged, false, "nothing graded this answer");
  // And it is not counted as a fail the JUDGE returned: the tally is what the
  // judge did, and it was never asked.
  assert.deepEqual(summary.judge, {
    name: "fake",
    pass: 0,
    fail: 0,
    skipped: 1,
    skipReasons: { "not asked — the deterministic checks failed first": 1 },
  });
  assert.ok(lines.some((l) => l.startsWith("[FAIL] R3")));
});

test("a skipped verdict is not a pass: the row, the summary and the log all say unjudged", async () => {
  // THE MONDAY-CRON FAILURE MODE. The service account expired on Friday, so
  // every case fails open to green off the deterministic checks alone. The
  // case still passes — that is the fail-open contract, and a network hiccup is
  // not evidence about the bot — but nothing in this run may claim it was
  // graded, and the reason has to survive into the results file.
  const judge = noJudge("credential could not be exchanged for a token");
  const { summary, lines } = await run(fixtureOf([caseById("R3")]), fakeTransport([R3_OK]), {
    deps: { judge },
  });

  assert.equal(summary.passed, 1, "fail-open: the deterministic checks still ran and still passed");
  assert.equal(summary.blockerFailures, 0);

  const [row] = summary.results;
  assert.equal(row.pass, true);
  assert.equal(row.judged, false, "a skip must not read as a graded pass");
  assert.equal(row.judge.verdict, "skipped");
  assert.equal(
    row.judge.reason,
    "credential could not be exchanged for a token",
    "the reason survives to the results, where it is read a week later",
  );

  assert.deepEqual(summary.judge, {
    name: "none — credential could not be exchanged for a token; deterministic checks only",
    pass: 0,
    fail: 0,
    // One count per CASE, as `passed` and `failed` are — not per sample.
    skipped: 1,
    skipReasons: { "credential could not be exchanged for a token": 1 },
  });
  assert.ok(
    lines.some((l) => /^\[PASS\] R3 .*\(UNJUDGED: credential could not be exchanged for a token\)/.test(l)),
    `the log must name the skip, got ${JSON.stringify(lines)}`,
  );
});

test("the runner's default judge is a judge that says it was never given one", async () => {
  // No `judge` argument at all — the default must be an object that skips with
  // a reason, not a null and not a silent pass.
  const summary = await runEvals({
    transport: fakeTransport([R3_OK]),
    casesPath: fixtureOf([caseById("R3")]),
    log: () => {},
    sleep: async () => {},
  });
  assert.equal(summary.judge.name, "none — no judge was given to the runner; deterministic checks only");
  assert.equal(summary.judge.pass + summary.judge.fail, 0);
  assert.deepEqual(summary.judge.skipReasons, { "no judge was given to the runner": 1 });
  assert.equal(summary.results[0].judged, false);
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

// ── The local transport scores the same as the Worker would (#512) ──────────

test("a fixture case scores identically through the local transport and a Worker replaying the same replies", async () => {
  const c = caseById("R3");
  const path = fixtureOf([c]);

  // (a) LOCAL: the Turn module in-process, on R3's recorded replies. Each
  // response is kept as it comes back.
  const local = localTransport({ log: () => {} });
  const responses = [];
  const recording = {
    ...local,
    async runTurn(req) {
      const resp = await local.runTurn(req);
      responses.push(resp);
      return resp;
    },
  };
  const fromLocal = await run(path, recording);

  // (b) WORKER: the real `workerTransport`, POSTing to a `fetch` that hands back
  // those same responses. The deployed route IS this same adapter over the same
  // Turn module (`src/eval/turn-adapter.ts`), so replaying its response body is
  // what "the same replies through the Worker" means — and it exercises the
  // worker transport's own request-building and JSON handling on the way.
  let served = 0;
  const worker = workerTransport("https://uno-bot.example.workers.dev", "t", {
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/debug\/eval$/);
      assert.equal(JSON.parse(init.body).prompt, c.turns[0].prompt);
      return { json: async () => responses[served++] };
    },
  });
  const fromWorker = await run(path, worker);

  assert.equal(responses.length, c.samples, "the local transport answered every sample");
  assert.equal(served, c.samples, "the worker transport was asked the same number of times");

  // THE PROPERTY: the same case, the same replies, the same score — and the
  // same reasons, so a divergence cannot hide behind an equal pass count.
  for (const key of ["passed", "failed", "skipped", "blockerFailures"]) {
    assert.equal(fromLocal.summary[key], fromWorker.summary[key], `summary.${key} differs`);
  }
  assert.equal(fromLocal.summary.passed, 1, JSON.stringify(fromLocal.summary.results[0].failures));
  assert.deepEqual(fromLocal.summary.results[0].failures, fromWorker.summary.results[0].failures);
  assert.equal(fromLocal.summary.results[0].passedRuns, fromWorker.summary.results[0].passedRuns);
  assert.deepEqual(
    fromLocal.summary.results[0].transcript.turns.map((t) => t.response.result),
    fromWorker.summary.results[0].transcript.turns.map((t) => t.response.result),
  );

  // What the two runs must NOT agree on is which instrument answered — that is
  // the one field that tells an in-process score from a deployed one.
  assert.equal(fromLocal.summary.transport, "local");
  assert.match(fromWorker.summary.transport, /^worker /);
});

test("an unrecorded case is reported UNREACHABLE, counted apart, and never fails a blocker", async () => {
  // Every fixture case is recorded now, so the unrecorded one is R1 under an
  // id nothing recorded. A red blocker for "no recording" would be a gate that
  // is red by construction; a green one would be a lie. What the case must not
  // be is INVISIBLE: a blocker nothing measured is the thing a reader of this
  // summary most needs told, and `skipped: 1` does not tell them.
  const local = localTransport({ log: () => {} });
  const { summary, lines } = await run(fixtureOf([{ ...caseById("R1"), id: "R0" }]), local);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.passed, 0);
  assert.equal(summary.failed, 0);
  assert.equal(summary.blockerFailures, 0);
  assert.match(summary.results[0].reason, /no recording for R0/);
  assert.equal(summary.results[0].unreachable, true);
  assert.deepEqual(summary.unreachable, ["R0"]);
  assert.deepEqual(summary.census.unreachable, ["R0"]);
  assert.equal(summary.census.total, 1);
  assert.ok(lines.some((l) => l.startsWith("[UNREACHABLE] R0")));
  assert.ok(lines.some((l) => /UNREACHABLE \(no recording\): R0/.test(l)));
});

test("every row of the results file has the same shape, whichever branch wrote it", async () => {
  // THE ENVELOPE (#617). One run, three branches of the walk: a case that ran
  // and passed, a case whose condition nothing satisfied, and a case this
  // transport cannot reach. A reader of eval-results.json — or a jq expression,
  // or the next runner — must not have to tell "this case did not fail" from
  // "this branch never wrote the field".
  const cases = [caseById("R3"), caseById("B2"), { ...caseById("R1"), id: "R0" }];
  const instrument = {
    ...fakeTransport([R3_OK], { subjects: {} }),
    unsupported: (c) => (c.id === "R0" ? "no recording for R0" : null),
  };
  const { summary } = await run(fixtureOf(cases), instrument);
  assert.equal(summary.results.length, 3);
  assert.deepEqual(summary.results.map((r) => Object.keys(r)), summary.results.map(() => RESULT_KEYS));
  // And the three branches really were three: a pass, a skip, an unreachable skip.
  assert.deepEqual(
    summary.results.map((r) => [r.pass, r.skipped, r.unreachable]),
    [[true, false, false], [false, true, false], [false, true, true]],
  );
});

test("a run states its census before it starts", async () => {
  // The count a reader needs is the suite's, not the summary line's: 1/1 passed
  // means something different when the fixture holds 34.
  const c = caseById("R3");
  const { summary, lines } = await run(fixtureOf([c]), fakeTransport([R3_OK]));
  assert.equal(summary.census.total, 1);
  assert.equal(summary.census.blockers, 1);
  // A transport with no recordings to report says so: every case is gated.
  assert.equal(summary.census.recorded, null);
  assert.deepEqual(summary.unreachable, []);
  assert.ok(lines.some((l) => l.startsWith("[evals] 1 cases, 1 blockers")));
});

// ── The CLI's default is the Worker, so the cron is unchanged ────────────────

test("the transport defaults to the worker and an unknown one is refused", () => {
  assert.deepEqual(parseArgs([]), { transport: "worker" });
  assert.deepEqual(parseArgs(["--transport=worker"]), { transport: "worker" });
  assert.deepEqual(parseArgs(["--transport", "worker"]), { transport: "worker" });
  // `local` is a transport now (#512); an invented name still is not.
  assert.deepEqual(parseArgs(["--transport=local"]), { transport: "local" });
  assert.throws(() => parseArgs(["--transport=staging"]), /unknown transport 'staging' \(have: worker\|local\)/);
  assert.throws(() => parseArgs(["--worker-url=x"]), /unknown argument/);
});
