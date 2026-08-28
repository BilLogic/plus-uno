// uno-bot retrieval evals — scores WHICH ROWS come back, not how the answer reads.
//
// WHY THIS EXISTS, separate from run-evals.mjs: that harness drives full agent
// turns through /debug/eval — ~15s each, model quota, an LLM judge on the prose.
// It has been 19/19 green while 5% of the semantic index pointed at cells that
// no longer existed, because a fabricated citation reads exactly like a good
// one. Nothing in it asserts row identity.
//
// This one hits GET /debug/blueprint-search directly: no model, no judge, no
// quota, whole suite in seconds. It answers "did the right cell come back",
// which is the only question that can tell you whether a retrieval change
// helped.
//
// Scoring per case (k is per-case, from the fixture):
//   expectCellIds      — ANY of these ids within top-k        (hit)
//   expectAllCellIds   — ALL of these ids within top-k
//   expectPath         — >= minMatches rows carry this path name
//   expectScenario     — >= minMatches rows carry this scenario name
//   expectTopScoreBelow— the best similarity is under a bar   (absence cases)
// Reported: recall (share of cases hit), MRR over rank-of-first-hit, plus the
// retrieval path, subrequest cost and latency each query actually spent.
//
// A failing `blocker: true` case exits 1. Everything else reports and does not
// fail the job — the aggregate and absence classes are DIAGNOSTICS that are
// expected to fail before Phase 2 (see the fixture's notes on BR25).
//
// Env:
//   WORKER_URL   e.g. the Worker origin (scripts/worker-url.mjs, or UNO_BOT_WORKER_URL)
//   DEBUG_TOKEN  the Worker's /debug/* gate token
// Optional:
//   CASES_PATH   default docs/evals/fixtures/blueprint-retrieval-cases.json
//   OUT_PATH     default retrieval-eval-results.json (gitignored working output)
//   BASELINE     path to a previous results file; prints a per-class delta
//
// Run:  npm run evals:retrieval           (from agents/uno-bot)
//       npm run evals:retrieval:selftest  (no network — pins the scorer itself)
//
// BASELINE CONVENTION: the working output is gitignored, like eval-results.json.
// A run worth keeping gets copied to docs/evals/runs/YYYY-MM-DD-retrieval-*.json
// and committed — that is what BASELINE points at. Phase 2 must not start
// before one exists, or there is nothing to have improved on.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const {
  WORKER_URL,
  DEBUG_TOKEN,
  CASES_PATH = "docs/evals/fixtures/blueprint-retrieval-cases.json",
  OUT_PATH = "retrieval-eval-results.json",
  BASELINE,
  // Score a CANDIDATE search function instead of the live one.
  //
  // Unset in CI and for every normal run: the point of this suite is what the
  // product actually does. Set it to `search_blueprint_<suffix>` to measure a
  // ranking change BEFORE it becomes the function everything calls — which is
  // the loop that was missing when an OR-ranked keyword arm was applied to
  // production, fixed BR3, broke BR1/BR5/BR25/BR26 and had to be reverted
  // (plus-uno-blueprint#154).
  //
  //   RPC_NAME=search_blueprint_min_overlap npm run evals:retrieval
  RPC_NAME,
} = process.env;

const REQUEST_TIMEOUT_MS = 30_000;

function required(name, v) {
  if (!v) {
    console.error(`missing env ${name}`);
    process.exit(2);
  }
  return v;
}

/** One query against the live Worker. Never throws — a transport failure is a
 *  RESULT ("this case errored"), not a crash that loses the other 25 cases. */
async function search(q) {
  const url =
    `${WORKER_URL.replace(/\/+$/, "")}/debug/blueprint-search` +
    `?q=${encodeURIComponent(q)}&fresh=1` +
    (RPC_NAME ? `&rpc=${encodeURIComponent(RPC_NAME)}` : "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "x-debug-token": DEBUG_TOKEN },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

/** Rank (1-based) of the first row matching `pred`, or 0 when absent. */
function rankOf(rows, pred) {
  for (let i = 0; i < rows.length; i++) if (pred(rows[i])) return i + 1;
  return 0;
}

function scoreCase(c, res) {
  if (!res.ok) return { pass: false, rank: 0, reasons: [`request failed: ${res.error}`] };

  const k = c.k ?? 10;
  const rows = (res.rows ?? []).slice(0, k);
  const reasons = [];
  let rank = 0;
  let pass = true;

  if (c.expectCellIds?.length) {
    rank = rankOf(rows, (r) => c.expectCellIds.includes(r.id));
    if (!rank) {
      pass = false;
      reasons.push(`none of ${c.expectCellIds.length} expected cell id(s) in top-${k}`);
    }
  }

  if (c.expectAllCellIds?.length) {
    const got = new Set(rows.map((r) => r.id));
    const missing = c.expectAllCellIds.filter((id) => !got.has(id));
    if (missing.length) {
      pass = false;
      reasons.push(`missing ${missing.length}/${c.expectAllCellIds.length} required cell id(s)`);
    }
    if (!rank) rank = rankOf(rows, (r) => c.expectAllCellIds.includes(r.id));
  }

  if (c.expectPath) {
    const n = rows.filter((r) => r.path === c.expectPath).length;
    const need = c.minMatches ?? 1;
    if (n < need) {
      pass = false;
      reasons.push(`path "${c.expectPath}": ${n} row(s) in top-${k}, needed ${need}`);
    }
    if (!rank) rank = rankOf(rows, (r) => r.path === c.expectPath);
  }

  if (c.expectScenario) {
    const n = rows.filter((r) => r.scenario === c.expectScenario).length;
    const need = c.minMatches ?? 1;
    if (n < need) {
      pass = false;
      reasons.push(`scenario "${c.expectScenario}": ${n} row(s) in top-${k}, needed ${need}`);
    }
    if (!rank) rank = rankOf(rows, (r) => r.scenario === c.expectScenario);
  }

  if (c.expectMatchedByOnly) {
    // Absence cases. NOT a similarity threshold — that was tried and measured
    // impossible: the two answer-less queries scored 0.607/0.654, between real
    // hits at 0.565 and 0.647, so any floor rejecting them rejects six good
    // cases too. What retrieval can honestly assert is that nothing matched
    // the blueprint's own words — only the vector list fired.
    const others = rows.filter((r) => r.matchedBy && r.matchedBy !== c.expectMatchedByOnly);
    if (others.length) {
      pass = false;
      reasons.push(
        `expected ${c.expectMatchedByOnly}-only corroboration, got ${[...new Set(others.map((r) => r.matchedBy))].join(", ")}`,
      );
    }
  }

  if (c.expectTopScoreBelow !== undefined) {
    // Absence cases. `top_score` is only present on semantic results; a keyword
    // answer has no similarity to compare, so treat it as unscoreable rather
    // than silently passing a case that measured nothing.
    const top = res.top_score;
    if (top === undefined) {
      reasons.push(`no top_score to judge (retrieval=${res.retrieval}) — unscoreable`);
      pass = false;
    } else if (!(top < c.expectTopScoreBelow)) {
      pass = false;
      reasons.push(`top_score ${top} >= floor ${c.expectTopScoreBelow}`);
    }
  }

  return { pass, rank, reasons };
}

function pct(n, d) {
  return d ? `${((100 * n) / d).toFixed(0)}%` : "n/a";
}

// ── self-test ────────────────────────────────────────────────────────────────
// `node run-retrieval-evals.mjs --self-test` — no network, no Worker.
//
// The scorer IS the instrument for every later phase. A bug here doesn't look
// like a bug; it looks like a confident recall number, and someone spends a day
// tuning a ranker against it. These pin the cases that are easy to get subtly
// wrong: k-truncation, any-of vs all-of, minMatches, and an errored request
// scoring as a miss rather than a pass.
function selfTest() {
  const row = (id, extra = {}) => ({ id, scenario: "S", path: "P", step: "T", layer: "L", ...extra });
  const ok = (rows, extra = {}) => ({ ok: true, rows, retrieval: "semantic", ...extra });
  const checks = [];
  const check = (name, cond) => checks.push({ name, pass: !!cond });

  // any-of within k
  check("any-of hits at rank 2",
    scoreCase({ k: 5, expectCellIds: ["b"] }, ok([row("a"), row("b")])).rank === 2);
  check("any-of respects k truncation",
    scoreCase({ k: 1, expectCellIds: ["b"] }, ok([row("a"), row("b")])).pass === false);

  // all-of
  check("all-of fails when one is missing",
    scoreCase({ k: 5, expectAllCellIds: ["a", "z"] }, ok([row("a"), row("b")])).pass === false);
  check("all-of passes when all present",
    scoreCase({ k: 5, expectAllCellIds: ["a", "b"] }, ok([row("a"), row("b")])).pass === true);

  // minMatches on path / scenario
  check("path minMatches unmet fails",
    scoreCase({ k: 5, expectPath: "P", minMatches: 3 }, ok([row("a"), row("b")])).pass === false);
  check("path minMatches met passes",
    scoreCase({ k: 5, expectPath: "P", minMatches: 2 }, ok([row("a"), row("b")])).pass === true);
  check("scenario counts only matching rows",
    scoreCase({ k: 5, expectScenario: "S", minMatches: 2 },
      ok([row("a"), row("b", { scenario: "OTHER" })])).pass === false);

  // absence
  check("absence passes below the floor",
    scoreCase({ k: 5, expectTopScoreBelow: 0.5 }, ok([row("a")], { top_score: 0.4 })).pass === true);
  check("absence fails at or above the floor",
    scoreCase({ k: 5, expectTopScoreBelow: 0.5 }, ok([row("a")], { top_score: 0.5 })).pass === false);
  check("absence is unscoreable without top_score",
    scoreCase({ k: 5, expectTopScoreBelow: 0.5 }, ok([row("a")])).pass === false);

  // a failed request must never read as a pass
  check("transport failure is not a pass",
    scoreCase({ k: 5, expectCellIds: ["a"] }, { ok: false, error: "boom" }).pass === false);

  const failed = checks.filter((c) => !c.pass);
  for (const c of checks) console.log(`  ${c.pass ? "ok" : "FAIL"}  ${c.name}`);
  console.log(`\n[self-test] ${checks.length - failed.length}/${checks.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes("--self-test")) selfTest();

async function main() {
  required("WORKER_URL", WORKER_URL);
  required("DEBUG_TOKEN", DEBUG_TOKEN);

  const cases = JSON.parse(readFileSync(CASES_PATH, "utf8")).filter((c) => c.id);
  console.log(`[retrieval] ${cases.length} cases against ${WORKER_URL}\n`);

  const results = [];
  for (const c of cases) {
    const res = await search(c.q);
    const { pass, rank, reasons } = scoreCase(c, res);
    results.push({
      id: c.id,
      class: c.class,
      blocker: !!c.blocker,
      q: c.q,
      pass,
      rank,
      reasons,
      retrieval: res.retrieval ?? null,
      top_score: res.top_score ?? null,
      rows: res.rows?.length ?? 0,
      subrequests: res.subrequests ?? null,
      ms: res.ms ?? null,
      // Keep the judged window for eyeballing a miss without re-running by
      // hand. `k`, not 3: a case is scored on top-k, and recording fewer rows
      // than were judged means a miss cannot be diagnosed from the artifact —
      // which is exactly what happened when the `Lane:` breadcrumb re-embed
      // moved BR3 and BR4 (plus-uno-blueprint#154).
      //
      // `r.lane`, not `r.layer`: the RPC's output column was renamed by
      // 20260820120100 and this line was not, so every artifact since has
      // recorded `undefined` — dropped silently by JSON.stringify, so the
      // field simply vanished rather than reading as wrong.
      top: (res.rows ?? []).slice(0, c.k ?? 10).map((r) => ({
        id: r.id, scenario: r.scenario, path: r.path, step: r.step, lane: r.lane, score: r.score,
      })),
    });
    const tag = pass ? "PASS" : c.blocker ? "FAIL" : "diag";
    console.log(
      `[${tag}] ${c.id} (${c.class}) rank=${rank || "-"} ` +
        `retrieval=${res.retrieval ?? "?"} sub=${res.subrequests ?? "?"} ${res.ms ?? "?"}ms` +
        `${reasons.length ? ` — ${reasons.join("; ")}` : ""}`,
    );
  }

  // ── Per-class rollup ────────────────────────────────────────────────────────
  const classes = [...new Set(results.map((r) => r.class))];
  const byClass = {};
  for (const cls of classes) {
    const rs = results.filter((r) => r.class === cls);
    const hits = rs.filter((r) => r.pass);
    // MRR over cases that produced a rank; a miss contributes 0, which is the
    // standard definition and keeps it comparable across runs.
    const mrr = rs.reduce((s, r) => s + (r.rank ? 1 / r.rank : 0), 0) / rs.length;
    byClass[cls] = {
      cases: rs.length,
      passed: hits.length,
      recall: hits.length / rs.length,
      mrr: Number(mrr.toFixed(3)),
    };
  }

  const blockers = results.filter((r) => r.blocker);
  const blockerFails = blockers.filter((r) => !r.pass);
  const subs = results.map((r) => r.subrequests).filter((n) => typeof n === "number");
  const summary = {
    ranAt: new Date().toISOString(),
    worker: WORKER_URL,
    // Which function produced these numbers. Recorded ALWAYS, not only when
    // overridden: a results file that does not say is one someone compares
    // against the live baseline a week later without noticing it is not one.
    rpc: RPC_NAME ?? "search_blueprint",
    cases: results.length,
    passed: results.filter((r) => r.pass).length,
    blockers: blockers.length,
    blockerFailures: blockerFails.length,
    recallOverall: Number((results.filter((r) => r.pass).length / results.length).toFixed(3)),
    subrequestsAvg: subs.length ? Number((subs.reduce((a, b) => a + b, 0) / subs.length).toFixed(2)) : null,
    subrequestsMax: subs.length ? Math.max(...subs) : null,
    byClass,
  };

  console.log("\n── by class ──");
  for (const [cls, s] of Object.entries(byClass)) {
    console.log(`  ${cls.padEnd(17)} recall ${pct(s.passed, s.cases).padStart(4)} (${s.passed}/${s.cases})  MRR ${s.mrr}`);
  }
  console.log(
    `\n  overall ${summary.passed}/${summary.cases}` +
      `   subrequests avg ${summary.subrequestsAvg} max ${summary.subrequestsMax}`,
  );

  if (BASELINE && existsSync(BASELINE)) {
    const base = JSON.parse(readFileSync(BASELINE, "utf8")).summary;
    console.log("\n── vs baseline ──");
    for (const cls of classes) {
      const b = base.byClass?.[cls];
      if (!b) continue;
      const d = byClass[cls].recall - b.recall;
      const sign = d > 0 ? "+" : "";
      console.log(`  ${cls.padEnd(17)} ${sign}${(d * 100).toFixed(0)}pp recall, MRR ${sign}${(byClass[cls].mrr - b.mrr).toFixed(3)}`);
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify({ summary, results }, null, 2));
  console.log(`\n[retrieval] wrote ${OUT_PATH}`);

  if (blockerFails.length) {
    console.error(`\n[retrieval] ${blockerFails.length} BLOCKER case(s) failed: ${blockerFails.map((r) => r.id).join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[retrieval] FAILED: ${err.message}`);
  process.exit(2);
});
