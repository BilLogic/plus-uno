// uno-bot automated evals (P2·1) — drives docs/evals/fixtures/uno-bot-cases.json
// through the live Worker's /debug/eval route (headless agent turns: proposals
// come back as data, nothing posts to Slack/Notion), then scores each case two
// ways:
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
//      condensed D1–D9 bot-answer rubric + the case's judgeNote.
// A failing BLOCKER case fails the job (exit 1) — mirroring the scenario doc's
// "a failing row is a release blocker". Full transcripts land in
// eval-results.json for reasoning investigation.
//
// Env required:
//   WORKER_URL      e.g. the Worker origin (scripts/worker-url.mjs, or UNO_BOT_WORKER_URL)
//   DEBUG_TOKEN     the Worker's /debug/* gate token
// Judge (optional — judge is skipped without it; deterministic checks still run):
//   GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY, GEMINI_PROJECT_ID (default hcii-plus)
// Optional: JUDGE_MODEL (default gemini-3.1-pro-preview — the grind model; a judge should be at least as strong as what it grades, and the bot's own model shares its blind spots), CASES_PATH
//
// Run:  node agents/uno-bot/scripts/run-evals.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash, createSign } from "node:crypto";
import { passesCase, toolCallMatches, describeCalls } from "./eval-scoring.mjs";
import { threadTurn, checkHistory, sentSummary } from "./eval-history.mjs";
import { applySubject, fetchSubject, skipReason } from "./eval-subjects.mjs";

const {
  WORKER_URL,
  DEBUG_TOKEN,
  GEMINI_SA_EMAIL,
  GEMINI_SA_PRIVATE_KEY,
  GEMINI_PROJECT_ID = "hcii-plus",
  JUDGE_MODEL = "gemini-3.1-pro-preview",
  CASES_PATH = "docs/evals/fixtures/uno-bot-cases.json",
} = process.env;

const TURN_TIMEOUT_MS = 8 * 60_000; // agent turns can legally run for minutes
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

// ── Google SA token (same pattern as the backfill script) ─────────────────────
function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}
async function googleToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: GEMINI_SA_EMAIL,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const input = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  const jwt = `${input}.${b64url(signer.sign(GEMINI_SA_PRIVATE_KEY.replace(/\\n/g, "\n")))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`token exchange failed (${res.status})`);
  return data.access_token;
}

// ── One headless agent turn (with transient-error retries) ────────────────────
async function evalTurnOnce(prompt, history, pending, surface = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TURN_TIMEOUT_MS);
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/+$/, "")}/debug/eval`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-debug-token": DEBUG_TOKEN },
      // channel/requestedBy default to the synthetic C_EVAL/U_EVAL server-side.
      // A case sets them when the SURFACE is the thing under test — own-DM
      // visibility (ADR-020) is unreachable from a channel that never starts
      // with "D", so an assertion about it would otherwise pass for the wrong
      // reason.
      body: JSON.stringify({ prompt, history, pending, ...surface }),
      signal: controller.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Rate limits are a property of the moment, not the bot — retry 429/quota/
// overload with a long backoff instead of failing the case (first live run
// 2026-07-16: every case "failed" on a starved model quota).
async function evalTurn(prompt, history, pending, surface) {
  for (let attempt = 0; ; attempt++) {
    const resp = await evalTurnOnce(prompt, history, pending, surface).catch((err) => ({
      ok: false,
      error: String(err?.message ?? err),
    }));
    const msg = String(resp?.error ?? "");
    const transient = /429|quota|exhaust|rate.?limit|overload|503|529/i.test(msg);
    if (resp?.ok || !transient || attempt >= TRANSIENT_RETRIES) return resp;
    console.log(`  … transient model error (${msg.slice(0, 80)}) — retrying in ${TRANSIENT_BACKOFF_MS / 1000}s`);
    await new Promise((r) => setTimeout(r, TRANSIENT_BACKOFF_MS));
  }
}

// ── LLM judge (fail-open: any judge error → "skipped") ────────────────────────
const JUDGE_SYSTEM = `You are a strict evaluator for uno-bot, the PLUS design team's Slack agent. You receive one eval case (its expectation and failure condition) and the bot's actual transcript (prompts, narration, final result JSON). Judge ONLY what the transcript shows against the case's expectation, informed by the team's D1-D9 rubric: grounded answer quality; clarify-vs-act; proposal-gate discipline; grounding/anti-fabrication; honestly-communicated confidence (woven conversationally into the prose with its rationale — the retired trailing "_Confidence: …_" affix must NOT appear). A "proposal" result means the action was STAGED behind a human confirmation — it did not execute. Reply with STRICT JSON only: {"verdict":"pass"} or {"verdict":"fail","reason":"<one sentence>"}.`;

async function judgeCase(token, c, transcript) {
  if (!token) return { verdict: "skipped" };
  try {
    const url = `https://aiplatform.googleapis.com/v1/projects/${GEMINI_PROJECT_ID}/locations/global/publishers/google/models/${JUDGE_MODEL}:generateContent`;
    const prompt =
      `Case ${c.id} — ${c.name}\nExpectation: ${c.judgeNote}\n\nTranscript (JSON):\n` +
      JSON.stringify(transcript).slice(0, 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: JUDGE_SYSTEM }] },
        generationConfig: {
          maxOutputTokens: 2000,
          // thinking_level is Gemini 3.x-only; 2.5-gen models 400 on it.
          ...(/^gemini-3/.test(JUDGE_MODEL) ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
        },
      }),
    });
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text)
      .join("");
    const m = text && text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = m ? JSON.parse(m) : null;
    if (parsed?.verdict === "pass" || parsed?.verdict === "fail") return parsed;
    return { verdict: "skipped", reason: "unparseable judge output" };
  } catch (err) {
    return { verdict: "skipped", reason: String(err?.message ?? err) };
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
  // Dials are reported by the agent loop as the turn finishes (loop-shared.ts
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
  // the arguments it sent (loop-shared.ts ToolCall) — the result alone shows
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

// Which fixture keys make a turn carry its own assertions (else the case-level
// spec applies to the final turn only).
const TURN_SPEC_KEYS = ["expectKind", "expectTool", "expectDecision", "expectTier", "expectLevel", "expectToolCalled", "expectHistory", "forbidTool", "textRegex"];
const hasOwnSpec = (turn) => TURN_SPEC_KEYS.some((k) => k in turn);

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

/**
 * The fixture's identity: the repo revision it was read at, and a hash of the
 * bytes actually loaded.
 *
 * BOTH, deliberately. `rev` places the run in history; `sha256` says what was
 * measured even when `rev` cannot — Actions checks out at depth 1, so a
 * per-file `git log` returns nothing unless that commit happened to touch the
 * fixture, and a locally-edited fixture is not the committed one at all. The
 * hash is the fact; the revision is the context.
 */
function fixtureStamp(path) {
  const bytes = readFileSync(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  // stderr ignored on both: git is being ASKED a question it may not be able to
  // answer (no checkout, a fixture outside the work tree via CASES_PATH), and a
  // `fatal:` printed into the middle of the eval log reads like the run broke.
  const git = (args) =>
    execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  let rev = process.env.GITHUB_SHA ?? "";
  if (!rev) {
    try {
      rev = git(["rev-parse", "HEAD"]);
    } catch {
      rev = "unknown";
    }
  }
  let dirty = false;
  try {
    dirty = git(["status", "--porcelain", "--", path]) !== "";
  } catch {
    /* not a checkout — the hash still identifies the bytes */
  }
  return { path, rev: `${rev.slice(0, 12)}${dirty ? "+dirty" : ""}`, sha256 };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  required("WORKER_URL", WORKER_URL);
  required("DEBUG_TOKEN", DEBUG_TOKEN);
  const fixture = JSON.parse(readFileSync(CASES_PATH, "utf8"));
  const judgeToken =
    GEMINI_SA_EMAIL && GEMINI_SA_PRIVATE_KEY ? await googleToken().catch(() => null) : null;
  if (!judgeToken) console.log("[evals] no judge credential — deterministic checks only");

  const results = [];
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
        turn.prompt,
        history,
        turn.usePendingFromPreviousTurn ? pending : null,
        surface,
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

    const judge = failures.length ? { verdict: "fail", reason: "deterministic checks failed" } : await judgeCase(judgeToken, c, transcript);
    const pass = failures.length === 0 && judge.verdict !== "fail";
    return { pass, failures, judge, transcript };
  }

  for (const rawCase of fixture.cases) {
    let c = rawCase;
    // ── Run-time subject (#415) ───────────────────────────────────────────────
    // A case declaring `subject: { need }` names a CONDITION; the Worker picks a
    // row from the live board that satisfies it and the placeholders are filled
    // in before turn 1. Once per case, not once per sample: three samples of one
    // case must ask the same question, or the [n/3] tally stops meaning
    // intermittency and starts meaning three different questions.
    if (rawCase.subject?.need) {
      const need = rawCase.subject.need;
      const got = await fetchSubject(need, { workerUrl: WORKER_URL, token: DEBUG_TOKEN });
      if (got.error) {
        // A broken route or a failed read is a FAILURE. Reporting it as a skip
        // would retire a blocker by breaking the thing that feeds it.
        const failure = `subject route for '${need}': ${got.error}`;
        results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, pass: false, samples: 0, passedRuns: 0, need, failures: [failure], judge: { verdict: "skipped" }, ms: 0 });
        if (rawCase.blocker) blockerFailures++;
        console.log(`[FAIL] ${rawCase.id} — ${rawCase.name} (${failure})`);
        continue;
      }
      if (!got.subject) {
        // SKIPPED: neither a pass nor a failure. Nothing on the board satisfies
        // the condition, so the case had nothing to measure — and a blocker
        // recorded green for that would be the silent-empty-read lie all over
        // again, one layer up.
        const reason = skipReason(need, got.reason);
        results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, skipped: true, need, reason, samples: 0, workerBuild: got.build });
        console.log(`[SKIP] ${rawCase.id} — ${rawCase.name} (${reason})`);
        continue;
      }
      const { spec, missing } = applySubject(rawCase, got.subject);
      if (missing.length) {
        // The condition was satisfiable and the route answered — so an unfilled
        // placeholder means the fixture and the route disagree about what this
        // condition promises. That is a bug in one of them, not a property of
        // the board, and it must not be swallowed as a skip.
        const failure = `subject for '${need}' carries no ${missing.map((f) => `'${f}'`).join(", ")} (got ${JSON.stringify(got.subject)})`;
        results.push({ id: rawCase.id, name: rawCase.name, blocker: !!rawCase.blocker, pass: false, samples: 0, passedRuns: 0, need, subject: got.subject, failures: [failure], judge: { verdict: "skipped" }, ms: 0 });
        if (rawCase.blocker) blockerFailures++;
        console.log(`[FAIL] ${rawCase.id} — ${rawCase.name} (${failure})`);
        continue;
      }
      c = spec;
      console.log(`[subject] ${c.id} — ${need} → ${JSON.stringify(got.subject)}`);
      subjectsUsed[c.id] = { need, subject: got.subject };
    }
    const samples = Number.isInteger(c.samples) && c.samples > 1 ? c.samples : 1;
    const runs = [];
    for (let i = 0; i < samples; i++) {
      runs.push(await runCaseOnce(c));
      if (i < samples - 1) await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_CASES_MS));
    }
    const passedRuns = runs.filter((r) => r.pass).length;
    const pass = passesCase(passedRuns, samples);
    const rep = runs.find((r) => !r.pass) ?? runs[0];
    if (!pass && c.blocker) blockerFailures++;
    results.push({ id: c.id, name: c.name, blocker: !!c.blocker, pass, samples, passedRuns, ...(subjectsUsed[c.id] ?? {}), failures: rep.failures, judge: rep.judge, ms: runs.reduce((s2, r) => s2 + r.transcript.turns.reduce((s3, t) => s3 + (t.response?.ms ?? 0), 0), 0), transcript: rep.transcript });
    const tally = samples > 1 ? ` [${passedRuns}/${samples} samples]` : "";
    console.log(`[${pass ? "PASS" : "FAIL"}] ${c.id} — ${c.name}${tally}${rep.failures.length ? ` (${rep.failures.join("; ")})` : rep.judge.verdict === "fail" ? ` (judge: ${rep.judge.reason})` : ""}`);
    await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_CASES_MS));
  }

  // Skipped cases are neither passed nor failed, so they come out of the
  // denominator too. A suite that reported 33/34 while one case never ran would
  // be describing a run that did not happen.
  const scored = results.filter((r) => !r.skipped);
  const summary = {
    ranAt: new Date().toISOString(),
    // WHAT WAS MEASURED, AGAINST WHAT. The acceptance criterion is that results
    // are recorded with the revision they were measured against (#415), and
    // that is two facts, not one: which Worker answered, and which fixture
    // asked. Neither is inferable from the other, and a results file carrying
    // only a date is unreadable a week later.
    workerBuild: firstBuild(results),
    fixture: fixtureStamp(CASES_PATH),
    passed: scored.filter((r) => r.pass).length,
    failed: scored.filter((r) => !r.pass).length,
    skipped: results.length - scored.length,
    blockerFailures,
    results,
  };
  writeFileSync("eval-results.json", JSON.stringify(summary, null, 2));
  const skipNote = summary.skipped ? `, ${summary.skipped} skipped` : "";
  console.log(
    `\n[evals] ${summary.passed}/${scored.length} passed${skipNote} ` +
      `(build ${summary.workerBuild}, fixture ${summary.fixture.rev}/${summary.fixture.sha256}) — details in eval-results.json`,
  );
  if (blockerFailures > 0) {
    console.error(`[evals] ${blockerFailures} BLOCKER case(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[evals] FAILED: ${err.message}`);
  process.exit(1);
});
