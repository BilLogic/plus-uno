// uno-bot automated evals (P2·1) — drives docs/evals/fixtures/uno-bot-cases.json
// through a TURN TRANSPORT (by default the live Worker's /debug/eval route:
// headless agent turns, proposals come back as data, nothing posts to
// Slack/Notion), then scores each case two ways:
//   1. deterministic checks from the fixture (expectKind / expectTool /
//      textRegex / forbidTool / gateAsk escape hatch, expectTier /
//      expectLevel against the dials the route reports — the tier the turn
//      ran on and the thinking level it was SENT with, #421 — and
//      expectToolCalled against the tool calls the route lists, so a case can
//      assert a read happened mid-turn and what it named, #423 — and
//      expectHistory against the history this runner SENT to a later turn,
//      so a case can assert a fetched reference reached the next turn as its
//      receipt and not as its text, #426), and
//   2. an LLM judge (Gemini on Vertex, same SA as everything else) against the
//      D1–D9 bot-answer rubric — loaded from docs/evals/rubrics/bot-answer.md
//      and quoted verbatim, scripts/eval-judge.mjs — + the case's judgeNote.
// A failing BLOCKER case fails the job (exit 1) — mirroring the scenario doc's
// "a failing row is a release blocker". Full transcripts land in
// eval-results.json for reasoning investigation.
//
// A case may also declare `subject: { need }` — a CONDITION the live blueprint
// answers with a row, fetched once before turn 1 through the transport (the
// Worker's /debug/blueprint-subject route) and substituted into every `{{subject.…}}` the
// case spells (#415, scripts/eval-subjects.mjs). A condition nothing on the
// board satisfies makes the case SKIPPED: neither a pass nor a failure, counted
// apart in the summary. A case that named its subject instead would encode a
// fact about a board that is edited daily.
//
// HOW A TURN IS RUN is a dependency (#511). `--transport=worker` (the default,
// so the cron and every documented invocation are unchanged) POSTs to the
// deployed Worker's /debug/eval route — scripts/eval-transport.mjs, where that
// adapter now lives. Everything else here — the fixture walk, the subject
// substitution, the deterministic checks, the history threading, the sampling
// arithmetic — is transport-agnostic, and `runEvals` below takes the transport
// (and its judge, log, clock and writer) as arguments, so the composition is
// itself testable: scripts/run-evals.test.mjs drives it with a fake transport.
//
// `--transport=local` (#512) is the second one: the Worker's Turn module called
// IN-PROCESS from recorded model replies (scripts/eval-transport-local.mjs), so
// a pull request can run the suite with no deployment, no debug token and no
// model spend. It measures the turn against a fixed draw, not the model — and
// only the cases that have a recording in docs/evals/fixtures/recordings/; the
// rest are reported UNGATED by name, counted apart, never failed.
//
// WHAT A CASE IS — its declared shape, its one loader and the census of them —
// is scripts/eval-case.mjs. Nothing here parses the fixture, and no count in
// this file or in the documents about it is typed: a run states its census
// before it starts, and names the cases it could not measure.
//
// WHO GRADES is the other dependency, and the same shape: a judge is
// `{ name, judgeCase(case, transcript) }` and scripts/eval-judge.mjs owns all
// of it — the rubric, the service-account credential, the Vertex call, the
// transcript cut and the fail-open to "skipped". `judgeFromEnv()` hands back
// the Vertex judge when the SA is present and a judge that skips when it is
// not, so a run with no credential is a run with fewer VERDICTS, not a crash.
//
// FEWER VERDICTS, AND THE RUN SAYS SO. Failing open means a skipped case stays
// green, so the summary carries a `judge` stanza — who graded, how many
// verdicts came back, and the reason behind every skip — and each result row
// carries `judged`. Without it "34/34 passed" reads the same whether the grind
// tier approved every case or an expired service account graded none, which is
// the one thing a weekly drift check must never be ambiguous about.
//
// Env required (by the WORKER transport — another transport needs neither):
//   WORKER_URL      e.g. the Worker origin (scripts/worker-url.mjs, or UNO_BOT_WORKER_URL)
//   DEBUG_TOKEN     the Worker's /debug/* gate token
// Judge (optional — judge is skipped without it; deterministic checks still run):
//   GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY, GEMINI_PROJECT_ID (default hcii-plus)
// Optional: JUDGE_MODEL (default gemini-3.1-pro-preview, the GRIND tier's model — the judge grades on that tier, model and thinking level together, because a judge should be at least as strong as what it grades and the bot's own model shares its blind spots; the level travels with the tier and is not overridable), CASES_PATH
//
// Run:  node agents/uno-bot/scripts/run-evals.mjs [--transport=worker|local]

import { writeFileSync } from "node:fs";
import { argv } from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { censusOf, describeCensus, fixtureStamp, hasOwnSpec, loadCases } from "./eval-case.mjs";
import { passesCase, toolCallMatches, describeCalls } from "./eval-scoring.mjs";
import { threadTurn, checkHistory, sentSummary } from "./eval-history.mjs";
import { applySubject, skipReason } from "./eval-subjects.mjs";
import { workerTransport } from "./eval-transport.mjs";
import { localTransport } from "./eval-transport-local.mjs";
import { describeTally, judgeFromEnv, judgeSkipped, judgeTally, noJudge } from "./eval-judge.mjs";

const {
  WORKER_URL,
  DEBUG_TOKEN,
  CASES_PATH = "docs/evals/fixtures/uno-bot-cases.json",
} = process.env;

const PAUSE_BETWEEN_CASES_MS = 10_000; // stay clear of per-minute model quotas
const TRANSIENT_RETRIES = 2; // extra attempts per turn on 429/quota/overload
const TRANSIENT_BACKOFF_MS = 65_000; // sit out the per-minute quota window

function required(name, v) {
  if (!v) {
    console.error(`missing env ${name}`);
    process.exit(2);
  }
  return v;
}

// ── One headless agent turn (with transient-error retries) ────────────────────
// The turn itself belongs to the transport (scripts/eval-transport.mjs); the
// retry does not. Rate limits are a property of the moment, not the bot — retry
// 429/quota/overload with a long backoff instead of failing the case (first
// live run 2026-07-16: every case "failed" on a starved model quota), and that
// is true of any transport that reaches a model.
async function evalTurn(transport, req, { log, sleep }) {
  for (let attempt = 0; ; attempt++) {
    const resp = await transport.runTurn(req).catch((err) => ({
      ok: false,
      error: String(err?.message ?? err),
    }));
    const msg = String(resp?.error ?? "");
    const transient = /429|quota|exhaust|rate.?limit|overload|503|529/i.test(msg);
    if (resp?.ok || !transient || attempt >= TRANSIENT_RETRIES) return resp;
    log(`  … transient model error (${msg.slice(0, 80)}) — retrying in ${TRANSIENT_BACKOFF_MS / 1000}s`);
    await sleep(TRANSIENT_BACKOFF_MS);
  }
}

// ── Deterministic checks ──────────────────────────────────────────────────────
// `historySent` is the history this runner handed the route for the turn —
// checked before the response is, because what was sent is a fact of the run
// even when the turn errored (eval-history.mjs checkHistory, #426).
function checkTurn(spec, resp, historySent = []) {
  const failures = checkHistory(spec, historySent);
  if (!resp?.ok) {
    failures.push(`turn errored: ${resp?.error ?? "no response"}`);
    return failures;
  }
  const r = resp.result ?? {};
  const kinds = spec.expectKind ?? [];
  const gateEscape = spec.allowProposalIfGateAsk && r.kind === "proposal" && !!resp.gateAsk;
  if (kinds.length && !kinds.includes(r.kind) && !gateEscape) {
    failures.push(`kind=${r.kind} (expected ${kinds.join("|")}${spec.allowProposalIfGateAsk ? " or gated proposal" : ""})`);
  }
  if (spec.expectTool && r.kind === "proposal" && r.toolName !== spec.expectTool) {
    failures.push(`tool=${r.toolName} (expected ${spec.expectTool})`);
  }
  if (spec.forbidTool && r.kind === "proposal" && r.toolName === spec.forbidTool) {
    failures.push(`forbidden tool ${spec.forbidTool} was proposed`);
  }
  if (spec.expectDecision && r.kind === "resolved" && r.decision !== spec.expectDecision) {
    failures.push(`decision=${r.decision} (expected ${spec.expectDecision})`);
  }
  if (spec.textRegex && r.kind === "text" && !new RegExp(spec.textRegex).test(r.text ?? "")) {
    failures.push(`text missing /${spec.textRegex}/`);
  }
  // Dials are reported by the agent loop as the turn finishes (agent/run-agent.ts
  // TurnDials): the tier it routed to, and the model + level the LAST model
  // call went out with. A missing block is a failure, not a pass — a turn that
  // reports nothing cannot prove it ran at the level the case asserts.
  const dials = resp.dials ?? null;
  if (spec.expectTier && dials?.tier !== spec.expectTier) {
    failures.push(`tier=${dials?.tier ?? "unreported"} (expected ${spec.expectTier})`);
  }
  if (spec.expectLevel && dials?.level !== spec.expectLevel) {
    failures.push(`level=${dials?.level ?? "unreported"} (expected ${spec.expectLevel}; model=${dials?.model ?? "?"})`);
  }
  // Tool calls are listed by the route in the order the model made them, with
  // the arguments it sent (agent/run-agent.ts ToolCall) — the result alone shows
  // only the final text or proposal, so a read made on the way to it is
  // invisible there. `expectToolCalled: { tool, args? }` passes when some call
  // matches the tool and every named arg exactly; a missing list is a failure.
  // A LIST arg (B1: `include: ["touchpoints"]`) passes when the call's list
  // holds every wanted member — the model may ask for more than the case
  // names, and `===` on two arrays is never true. `argsOneOf` is the other
  // direction: the SENT value must be one of several acceptable ones, for a
  // choice that is genuinely open (B3's granularity rung). Both live in
  // eval-scoring.mjs, where they are tested.
  if (spec.expectToolCalled) {
    const want = spec.expectToolCalled;
    if (!toolCallMatches(resp.tools, want)) {
      const wanted = [
        ...(want.args ? [`with ${JSON.stringify(want.args)}`] : []),
        ...(want.argsOneOf ? [`one of ${JSON.stringify(want.argsOneOf)}`] : []),
      ].join(" and ");
      failures.push(
        `no ${want.tool} call${wanted ? ` ${wanted}` : ""} (calls: ${describeCalls(resp.tools, want.tool)})`,
      );
    }
  }
  return failures;
}

// WHICH FIXTURE KEYS MAKE A TURN CARRY ITS OWN ASSERTIONS is the case module's
// (`eval-case.mjs`, `hasOwnSpec`), with the rest of a case's declared shape.
// The list lived here and the validation lived in a test file, so a key could
// be added to one and not the other.

// ── What this run measured, and what it measured it with ─────────────────────

/** The Worker build that answered. Scanned across results rather than read off
 *  the first one: a first case that skipped, or failed before its turn ran, has
 *  no response to carry a build, and "unknown" in a results file is a fact
 *  nobody can recover later. */
function firstBuild(results) {
  for (const r of results) {
    if (r.workerBuild) return r.workerBuild;
    for (const t of r.transcript?.turns ?? []) {
      if (t.response?.build) return t.response.build;
    }
  }
  return "unknown";
}

// ── Which transport a run uses ────────────────────────────────────────────────
// The CLI default is the WORKER, so the cron's plain `node …/run-evals.mjs`, and
// every invocation docs/evals/README.md describes, mean exactly what they meant
// before. `WORKER_URL` and `DEBUG_TOKEN` are required HERE — by the transport
// that needs them — and not by the runner, which no longer knows what a URL is.
//
// `local` (#512) runs the same Turn module in-process from recorded model
// replies — no deployment, no token, no model call — which is what lets a pull
// request run the suite at all. It measures the TURN against a fixed draw, not
// the model; the summary's `transport` field is what keeps the two apart, and
// a case with no recording SKIPS (see `transport.unsupported` below).
const TRANSPORTS = {
  worker: () => workerTransport(required("WORKER_URL", WORKER_URL), required("DEBUG_TOKEN", DEBUG_TOKEN)),
  local: () => localTransport(),
};

/** @returns {{transport: string}} */
export function parseArgs(args) {
  const names = Object.keys(TRANSPORTS).join("|");
  const opts = { transport: "worker" };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const inline = /^--transport=(.*)$/.exec(arg);
    if (inline) {
      opts.transport = inline[1];
      continue;
    }
    if (arg === "--transport") {
      opts.transport = args[++i] ?? "";
      continue;
    }
    throw new Error(`unknown argument ${arg} (usage: run-evals.mjs [--transport=${names}])`);
  }
  if (!TRANSPORTS[opts.transport]) {
    throw new Error(`unknown transport '${opts.transport}' (have: ${names})`);
  }
  return opts;
}

// ── The run ───────────────────────────────────────────────────────────────────
/**
 * Walk the fixture through one transport and return the summary.
 *
 * Everything the run reaches outside itself is an argument: the transport (how
 * a turn happens, and how a run-time subject is answered), the judge (what the
 * rubric is and who grades against it — scripts/eval-judge.mjs, the same shape
 * as the transport), the log, the clock. Nothing here writes a file or exits a
 * process — `main` below does both — so scripts/run-evals.test.mjs can replay a
 * fixture case in milliseconds and read the summary it produced (#511).
 *
 * @param {object} deps
 * @param {{name: string, runTurn: Function, fetchSubject?: Function, unsupported?: Function, recordedCases?: string[]}} deps.transport
 * @param {string} [deps.casesPath]
 * @param {{name: string, judgeCase: (c: object, transcript: object) => Promise<{verdict: string, reason?: string}>}} [deps.judge]
 * @param {(line: string) => void} [deps.log]
 * @param {(ms: number) => Promise<void>} [deps.sleep]
 * @param {number} [deps.pauseMs] - the wait between cases and between samples
 */
export async function runEvals({
  transport,
  casesPath = CASES_PATH,
  judge = noJudge("no judge was given to the runner"),
  log = console.log,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  pauseMs = PAUSE_BETWEEN_CASES_MS,
}) {
  const fixture = loadCases(casesPath);

  // WHAT THIS RUN CAN MEASURE, said before it starts. A transport that answers
  // from recordings reaches only the cases it has one for; the rest skip by
  // name, which is right — failing them would make a gate that is red by
  // construction — but a skip nobody counts is a case that gates nothing while
  // reading as though it did. So they are counted and named here as UNGATED,
  // and the count travels in the summary.
  const census = censusOf(fixture.cases, { recorded: transport.recordedCases ?? null });
  log(`[evals] ${describeCensus(census)}`);

  /** A verdict for a case the judge was never asked about. Not "skipped" for
   *  the judge's own reasons — the case failed before grading, or never ran —
   *  and the results must be able to tell the two apart. */
  const notAsked = (why) => judgeSkipped(`not asked — ${why}`);

  const results = [];
  /** Every verdict this run collected for a case that RAN, in case order — the
   *  judge stanza's input. A case skipped before its first turn (no recording,
   *  no satisfying subject) is not in here: it is `summary.skipped`, and
   *  counting it as unjudged would blame the judge for the instrument. */
  const judgeVerdicts = [];
  /** case id → the condition it asked for and the row the board answered with,
   *  so a transcript read a week later says WHICH scenario "what happens in X"
   *  was actually about. */
  const subjectsUsed = {};
  let blockerFailures = 0;

  // A case may declare `samples: N` (default 1) and passes on a MAJORITY of
  // them — see scripts/eval-scoring.mjs for the rule and the arithmetic.
  //
  // This used to require every sample to pass, which made `samples: 3` roughly
  // TRIPLE a case's false-red rate rather than damp it. With 17 of 20 cases
  // marked blocker, a 1% judge-flake rate turned the job red ~37% of the time
  // with nothing wrong, and that is what was observed: one green run in three,
  // a different case failing in each of the other two (#249).
  //
  // The visibility that rule wanted is kept — `passedRuns/samples` is still
  // recorded per case and printed as `[2/3 samples]`, so intermittency is
  // visible in the log and in eval-results.json. It just no longer fails the
  // build on one dissenting judge.
  async function runCaseOnce(c) {
    const transcript = { id: c.id, name: c.name, turns: [] };
    const history = [];
    let pending = null;
    const failures = [];

    for (const turn of c.turns) {
      const surface = {};
      const channel = turn.channel ?? c.channel;
      const requestedBy = turn.requestedBy ?? c.requestedBy;
      if (channel) surface.channel = channel;
      if (requestedBy) surface.requestedBy = requestedBy;
      const resp = await evalTurn(
        transport,
        {
          prompt: turn.prompt,
          history,
          pending: turn.usePendingFromPreviousTurn ? pending : null,
          surface,
        },
        { log, sleep },
      );
      // `sent` is the compact record of what this turn was handed — size and
      // reference receipts — so a reviewer can read the clearing case's
      // evidence off the transcript without the judge paying for the history.
      transcript.turns.push({ prompt: turn.prompt, sent: sentSummary(history), response: resp });
      // Per-turn checks: turn-level spec if present, else the case-level spec on
      // the final turn only. `history` here is still what the route received.
      const spec = hasOwnSpec(turn) ? turn : (turn === c.turns[c.turns.length - 1] ? c : {});
      failures.push(...checkTurn(spec, resp, history).map((f) => `${c.id}${c.turns.length > 1 ? ` t${transcript.turns.length}` : ""}: ${f}`));
      // Thread state forward for multi-turn cases, the way production records
      // a turn: reply text or outcome marker, and the reference RECEIPT on the
      // user turn — never the reference text (eval-history.mjs).
      pending = threadTurn(history, turn.prompt, resp, pending);
    }

    // A case that already failed its deterministic checks is not sent to the
    // judge, so `asked` travels with the verdict: "deterministic checks failed"
    // is the RUNNER talking, and counting it among the judge's fails would
    // credit the judge with work it never did.
    const asked = failures.length === 0;
    const verdict = asked
      ? await judge.judgeCase(c, transcript)
      : { verdict: "fail", reason: "deterministic checks failed" };
    const pass = asked && verdict.verdict !== "fail";
    return { pass, failures, asked, judge: verdict, transcript };
  }

  for (const rawCase of fixture.cases) {
    let c = rawCase;
    // ── A case this transport cannot measure (#512) ───────────────────────────
    // Asked BEFORE the subject read, because "there is no recording for this
    // case" is a fact about the instrument and costs nothing to answer, while
    // the subject read is a live one.
    //
    // SKIPPED, like a condition nothing satisfies: neither a pass nor a
    // failure, out of the denominator, reason recorded. The local transport
    // covers the recorded cases only, and failing the rest would mean a PR
    // gate that is red by construction — switched off within a week.
    //
    // UNGATED is what the result is MARKED, and the word is the point: this
    // case was not measured, so whatever it asserts is not being enforced on
    // this run. `[SKIP]` on its own reads like a case that chose to sit out.
    const unsupported = transport.unsupported?.(rawCase) ?? null;
    if (unsupported) {
      results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, skipped: true, ungated: true, reason: unsupported, samples: 0 });
      log(`[UNGATED] ${rawCase.id} — ${rawCase.name} (${unsupported})`);
      continue;
    }
    // ── Run-time subject (#415) ───────────────────────────────────────────────
    // A case declaring `subject: { need }` names a CONDITION; the transport asks
    // for a row from the live board that satisfies it and the placeholders are
    // filled in before turn 1. Once per case, not once per sample: three samples of one
    // case must ask the same question, or the [n/3] tally stops meaning
    // intermittency and starts meaning three different questions.
    if (rawCase.subject?.need) {
      const need = rawCase.subject.need;
      // A transport that cannot answer a condition says so by name. Running the
      // case with its `{{subject.…}}` placeholders unfilled, or skipping it,
      // would both report something about the board — and the board was never
      // asked.
      // The CASE travels with the condition: a transport that answers from a
      // recording (#541) holds one row per case, and three cases declare
      // `scenario-any`. The worker transport asks the live board and ignores it.
      const got = transport.fetchSubject
        ? await transport.fetchSubject(need, rawCase)
        : { error: `transport '${transport.name}' resolves no run-time subjects` };
      if (got.error) {
        // A broken route or a failed read is a FAILURE. Reporting it as a skip
        // would retire a blocker by breaking the thing that feeds it.
        const failure = `subject route for '${need}': ${got.error}`;
        results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, pass: false, samples: 0, passedRuns: 0, need, failures: [failure], judged: false, judge: notAsked("the subject read failed"), ms: 0 });
        judgeVerdicts.push(notAsked("the subject read failed"));
        if (rawCase.blocker) blockerFailures++;
        log(`[FAIL] ${rawCase.id} — ${rawCase.name} (${failure})`);
        continue;
      }
      if (!got.subject) {
        // SKIPPED: neither a pass nor a failure. Nothing on the board satisfies
        // the condition, so the case had nothing to measure — and a blocker
        // recorded green for that would be the silent-empty-read lie all over
        // again, one layer up.
        const reason = skipReason(need, got.reason);
        results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, skipped: true, need, reason, samples: 0, workerBuild: got.build });
        log(`[SKIP] ${rawCase.id} — ${rawCase.name} (${reason})`);
        continue;
      }
      const { spec, missing } = applySubject(rawCase, got.subject);
      if (missing.length) {
        // The condition was satisfiable and the route answered — so an unfilled
        // placeholder means the fixture and the route disagree about what this
        // condition promises. That is a bug in one of them, not a property of
        // the board, and it must not be swallowed as a skip.
        const failure = `subject for '${need}' carries no ${missing.map((f) => `'${f}'`).join(", ")} (got ${JSON.stringify(got.subject)})`;
        results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, pass: false, samples: 0, passedRuns: 0, need, subject: got.subject, failures: [failure], judged: false, judge: notAsked("the case never ran"), ms: 0 });
        judgeVerdicts.push(notAsked("the case never ran"));
        if (rawCase.blocker) blockerFailures++;
        log(`[FAIL] ${rawCase.id} — ${rawCase.name} (${failure})`);
        continue;
      }
      c = spec;
      log(`[subject] ${c.id} — ${need} → ${JSON.stringify(got.subject)}`);
      subjectsUsed[c.id] = { need, subject: got.subject };
    }
    const samples = Number.isInteger(c.samples) && c.samples > 1 ? c.samples : 1;
    const runs = [];
    for (let i = 0; i < samples; i++) {
      runs.push(await runCaseOnce(c));
      if (i < samples - 1) await sleep(pauseMs);
    }
    const passedRuns = runs.filter((r) => r.pass).length;
    const pass = passesCase(passedRuns, samples);
    const rep = runs.find((r) => !r.pass) ?? runs[0];
    if (!pass && c.blocker) blockerFailures++;
    // `judged` is what keeps a FAIL-OPEN pass from reading as a graded one: the
    // case is green either way, and only this field and the judge's reason say
    // whether anything actually looked at the answer.
    judgeVerdicts.push(rep.asked ? rep.judge : notAsked("the deterministic checks failed first"));
    results.push({ id: c.id, name: c.name, blocker: !!c.blocker, pass, samples, passedRuns, ...(subjectsUsed[c.id] ?? {}), failures: rep.failures, judged: rep.asked && rep.judge.verdict !== "skipped", judge: rep.judge, ms: runs.reduce((s2, r) => s2 + r.transcript.turns.reduce((s3, t) => s3 + (t.response?.ms ?? 0), 0), 0), transcript: rep.transcript });
    const tally = samples > 1 ? ` [${passedRuns}/${samples} samples]` : "";
    const note = rep.failures.length
      ? ` (${rep.failures.join("; ")})`
      : rep.judge.verdict === "fail"
        ? ` (judge: ${rep.judge.reason})`
        : rep.judge.verdict === "skipped"
          ? ` (UNJUDGED: ${rep.judge.reason})`
          : "";
    log(`[${pass ? "PASS" : "FAIL"}] ${c.id} — ${c.name}${tally}${note}`);
    await sleep(pauseMs);
  }

  // Skipped cases are neither passed nor failed, so they come out of the
  // denominator too. A suite that reported 33/34 while one case never ran would
  // be describing a run that did not happen.
  const scored = results.filter((r) => !r.skipped);
  return {
    ranAt: new Date().toISOString(),
    // HOW the turns were run. A results file whose scores were produced
    // in-process and one produced against a deployment are different
    // measurements, and nothing else in here tells them apart.
    transport: transport.name,
    // WHO GRADED, AND HOW MUCH OF THE RUN THEY GRADED. `passed` below cannot
    // answer it: a skipped verdict fails open to a pass, so a run judged by
    // nobody and a run judged clean produce the same score. The name is the
    // judge's own (an expired service account names itself apart from an
    // absent one) and the counts are over the verdicts this run collected.
    judge: { name: judge.name, ...judgeTally(judgeVerdicts) },
    // WHAT WAS MEASURED, AGAINST WHAT. The acceptance criterion is that results
    // are recorded with the revision they were measured against (#415), and
    // that is two facts, not one: which Worker answered, and which fixture
    // asked. Neither is inferable from the other, and a results file carrying
    // only a date is unreadable a week later.
    workerBuild: firstBuild(results),
    fixture: fixtureStamp(casesPath),
    // WHAT THE SUITE IS, counted rather than typed — and which of its cases
    // this instrument could not reach. `ungated` is the number a reader needs
    // to know how much of the suite a green run actually stands for.
    census,
    passed: scored.filter((r) => r.pass).length,
    failed: scored.filter((r) => !r.pass).length,
    skipped: results.length - scored.length,
    ungated: results.filter((r) => r.ungated).map((r) => r.id),
    blockerFailures,
    results,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(argv.slice(2));
  const transport = TRANSPORTS[opts.transport]();
  const judge = await judgeFromEnv();
  console.log(`[evals] judge ${judge.name}`);

  const summary = await runEvals({
    transport,
    judge,
    // The 10s pause between cases and samples sits out a per-minute MODEL
    // quota. A transport that reaches no model says so by declaring its own
    // pause (the local one declares 0), which is the difference between a CI
    // job of seconds and one of minutes spent asleep.
    ...(Number.isFinite(transport.pauseMs) ? { pauseMs: transport.pauseMs } : {}),
  });

  const scored = summary.results.filter((r) => !r.skipped);
  writeFileSync("eval-results.json", JSON.stringify(summary, null, 2));
  const skipped = summary.skipped - summary.ungated.length;
  const notes = [
    skipped ? `${skipped} skipped` : null,
    // Named, never just counted. "2 ungated" is a number; "2 ungated: D1, V1"
    // is the two assertions this run did not make.
    summary.ungated.length ? `${summary.ungated.length} UNGATED (${summary.ungated.join(", ")})` : null,
  ].filter(Boolean);
  console.log(
    `\n[evals] ${summary.passed}/${scored.length} passed${notes.length ? `, ${notes.join(", ")}` : ""} ` +
      `of ${summary.census.total} cases ` +
      `(build ${summary.workerBuild}, fixture ${summary.fixture.rev}/${summary.fixture.sha256}) — details in eval-results.json`,
  );
  // Beside the score, always: what the score was judged by. A pass count on its
  // own is the deterministic checks plus however much grading happened to
  // succeed, and those are not the same measurement week to week.
  console.log(`[evals] judge ${summary.judge.name} — ${describeTally(summary.judge)}`);
  // Stated, not WARNED. A local run has no credential by construction, so a
  // warning would fire on every pull request and be trained away — and the
  // reason on the line above is what tells a credential that was never there
  // from one that expired. This says what the score is, which is the fact.
  if (summary.judge.pass + summary.judge.fail === 0 && summary.judge.skipped > 0) {
    console.log(`[evals] no answer was graded — this score is the deterministic checks alone`);
  }
  if (summary.blockerFailures > 0) {
    console.error(`[evals] ${summary.blockerFailures} BLOCKER case(s) failed`);
    process.exit(1);
  }
}

// Imported by the test, executed by the Action — so the walk only starts when
// this file IS the entry point.
if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`[evals] FAILED: ${err.message}`);
    process.exit(1);
  });
}
