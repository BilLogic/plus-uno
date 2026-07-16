// uno-bot automated evals (P2·1) — drives docs/evals/fixtures/uno-bot-cases.json
// through the live Worker's /debug/eval route (headless agent turns: proposals
// come back as data, nothing posts to Slack/Notion), then scores each case two
// ways:
//   1. deterministic checks from the fixture (expectKind / expectTool /
//      textRegex / forbidTool / gateAsk escape hatch), and
//   2. an LLM judge (Gemini on Vertex, same SA as everything else) against the
//      condensed D1–D9 bot-answer rubric + the case's judgeNote.
// A failing BLOCKER case fails the job (exit 1) — mirroring the scenario doc's
// "a failing row is a release blocker". Full transcripts land in
// eval-results.json for reasoning investigation.
//
// Env required:
//   WORKER_URL      e.g. https://uno-bot.bryanhuang628.workers.dev
//   DEBUG_TOKEN     the Worker's /debug/* gate token
// Judge (optional — judge is skipped without it; deterministic checks still run):
//   GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY, GEMINI_PROJECT_ID (default hcii-plus)
// Optional: JUDGE_MODEL (default gemini-3.5-flash), CASES_PATH
//
// Run:  node agents/uno-bot/scripts/run-evals.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";

const {
  WORKER_URL,
  DEBUG_TOKEN,
  GEMINI_SA_EMAIL,
  GEMINI_SA_PRIVATE_KEY,
  GEMINI_PROJECT_ID = "hcii-plus",
  JUDGE_MODEL = "gemini-3.5-flash",
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
async function evalTurnOnce(prompt, history, pending) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TURN_TIMEOUT_MS);
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/+$/, "")}/debug/eval`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-debug-token": DEBUG_TOKEN },
      body: JSON.stringify({ prompt, history, pending }),
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
async function evalTurn(prompt, history, pending) {
  for (let attempt = 0; ; attempt++) {
    const resp = await evalTurnOnce(prompt, history, pending).catch((err) => ({
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
const JUDGE_SYSTEM = `You are a strict evaluator for uno-bot, the PLUS design team's Slack agent. You receive one eval case (its expectation and failure condition) and the bot's actual transcript (prompts, narration, final result JSON). Judge ONLY what the transcript shows against the case's expectation, informed by the team's D1-D9 rubric: grounded answer quality; clarify-vs-act; proposal-gate discipline; grounding/anti-fabrication; honest confidence line. A "proposal" result means the action was STAGED behind a human confirmation — it did not execute. Reply with STRICT JSON only: {"verdict":"pass"} or {"verdict":"fail","reason":"<one sentence>"}.`;

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
        generationConfig: { maxOutputTokens: 2000, thinkingConfig: { thinkingLevel: "low" } },
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
function checkTurn(spec, resp) {
  const failures = [];
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
  return failures;
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
  let blockerFailures = 0;

  for (const c of fixture.cases) {
    const transcript = { id: c.id, name: c.name, turns: [] };
    const history = [];
    let pending = null;
    const failures = [];

    for (const turn of c.turns) {
      const resp = await evalTurn(turn.prompt, history, turn.usePendingFromPreviousTurn ? pending : null);
      transcript.turns.push({ prompt: turn.prompt, response: resp });
      // Per-turn checks: turn-level spec if present, else the case-level spec on
      // the final turn only.
      const spec = turn.expectKind || turn.expectTool || turn.expectDecision ? turn : (turn === c.turns[c.turns.length - 1] ? c : {});
      failures.push(...checkTurn(spec, resp).map((f) => `${c.id}${c.turns.length > 1 ? ` t${transcript.turns.length}` : ""}: ${f}`));
      // Thread state forward for multi-turn cases.
      const r = resp?.result;
      history.push({ role: "user", content: turn.prompt });
      if (r?.kind === "text") history.push({ role: "assistant", content: r.text ?? "" });
      else if (r?.kind === "proposal") {
        history.push({ role: "assistant", content: `(staged a ${r.toolName} proposal awaiting confirmation)` });
        pending = { toolName: r.toolName, input: r.input ?? {} };
      } else if (r?.kind === "resolved") {
        history.push({ role: "assistant", content: r.messageToUser ?? `(${r.decision})` });
        pending = null;
      }
    }

    const judge = failures.length ? { verdict: "fail", reason: "deterministic checks failed" } : await judgeCase(judgeToken, c, transcript);
    const pass = failures.length === 0 && judge.verdict !== "fail";
    if (!pass && c.blocker) blockerFailures++;
    results.push({ id: c.id, name: c.name, blocker: !!c.blocker, pass, failures, judge, ms: transcript.turns.reduce((s, t) => s + (t.response?.ms ?? 0), 0), transcript });
    console.log(`[${pass ? "PASS" : "FAIL"}] ${c.id} — ${c.name}${failures.length ? ` (${failures.join("; ")})` : judge.verdict === "fail" ? ` (judge: ${judge.reason})` : ""}`);
    await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_CASES_MS));
  }

  const summary = {
    ranAt: new Date().toISOString(),
    workerBuild: results[0]?.transcript?.turns?.[0]?.response?.build ?? "unknown",
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    blockerFailures,
    results,
  };
  writeFileSync("eval-results.json", JSON.stringify(summary, null, 2));
  console.log(`\n[evals] ${summary.passed}/${results.length} passed (build ${summary.workerBuild}) — details in eval-results.json`);
  if (blockerFailures > 0) {
    console.error(`[evals] ${blockerFailures} BLOCKER case(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[evals] FAILED: ${err.message}`);
  process.exit(1);
});
