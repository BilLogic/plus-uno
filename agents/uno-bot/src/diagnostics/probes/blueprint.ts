// Blueprint probes: what the deployment supports, what a real search returns,
// and which live row satisfies a named condition.
//
// All three know blueprint schema — the selects, the RPC names, the column
// lists — and that knowledge lives here rather than in the Worker entry.
import { BUILD } from "../../version";
import { BLUEPRINT_CONTRACT } from "../../generated/blueprint-contract";
import { countedFetch, runMetered, subrequestsUsed } from "../../net";
import {
  searchBlueprint,
  fetchPhaseOutline,
  fetchTouchpoints,
  TOUCHPOINT_SUBJECT_PAGE,
  isBlueprintConfigured,
} from "../../integrations/blueprint";
import {
  SUBJECT_NEEDS,
  isSubjectNeed,
  selectSubject,
  type SubjectReads,
} from "../../integrations/blueprint-subject";
import {
  CANDIDATE_RPC,
  isCallableCandidate,
  isScoreableEmbedModel,
  SCOREABLE_EMBED_MODELS,
} from "../../integrations/candidate-rpc";
import { embedModelName } from "../../vertex/embed";
import { indexSource, resolveIndexModel } from "../../integrations/index-model";
import { probeFailure } from "../router";
import type { ProbeRun } from "../probe";

// What the blueprint deployment actually supports — the question the code
// could not answer about itself. searchBlueprint degrades semantic -> rpc ->
// table fan-out silently, so "is semantic even deployed?" was unanswerable
// without reading production logs and hoping a search happened.
//
// Reports, per capability: reachable, and readable-by-anon. Token-gated; all
// reads, no writes.
export const blueprintProbe: ProbeRun = async (env) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return { body: { ok: false, error: "SUPABASE_URL / SUPABASE_ANON_KEY not configured" } };
  }
  const base = env.SUPABASE_URL.replace(/\/+$/, "");
  const h = { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };
  const probe = async (label: string, path: string, init?: RequestInit) => {
    try {
      const r = await countedFetch(`${base}${path}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } });
      const body = await r.text();
      return { [label]: { status: r.status, ok: r.ok, sample: body.slice(0, 160) } };
    } catch (err) {
      return { [label]: { error: err instanceof Error ? err.message : String(err) } };
    }
  };
  const out: Record<string, unknown> = { build: BUILD, semantic_flag: env.SEMANTIC_SEARCH ?? "on" };
  Object.assign(out, await probe("rpc_search_blueprint", "/rest/v1/rpc/search_blueprint", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: "tutor" }),
  }));
  Object.assign(out, await probe("rpc_match_corpus_chunks", "/rest/v1/rpc/match_corpus_chunks", {
    method: "POST",
    headers: { "content-type": "application/json", "content-profile": "semantic_search" },
    // Deliberately malformed embedding: a 404/PGRST202 means the function is
    // ABSENT, any other error means it exists and rejected the argument —
    // which is the distinction being probed, with no embedding call spent.
    body: JSON.stringify({ query_embedding: [0], match_count: 1, filter_source: "blueprint" }),
  }));
  // Index health — counts only, via semantic_search.index_health().
  //
  // The other probes answer "does the retrieval path respond". This answers
  // "is what it returns still true", which is the failure that hides: the
  // backfill's orphan prune 403'd nightly from 2026-08-18 and left 43 chunks
  // for hard-deleted cells in the index. Embeddings stayed current, every
  // probe above stayed green, and the only symptom was the bot occasionally
  // citing a cell that no longer exists with a ?cell= link to nothing.
  //
  // orphan_chunks > 0  → the prune is failing (check the embed workflow).
  // stale_chunks  > 0  → cells edited since the last successful run.
  try {
    const r = await countedFetch(`${base}/rest/v1/rpc/index_health`, {
      method: "POST",
      headers: { ...h, "content-type": "application/json", "content-profile": "semantic_search" },
      body: "{}",
    });
    out.index_health = r.ok
      ? (((await r.json()) as unknown[])[0] ?? null)
      : { status: r.status, error: (await r.text()).slice(0, 160) };
  } catch (err) {
    out.index_health = { error: err instanceof Error ? err.message : String(err) };
  }
  // Same list as /health/blueprint, from the same source: a hardcoded copy
  // here kept probing `findings` for a day after the table became
  // `audit_findings`.
  for (const t of BLUEPRINT_CONTRACT.botReadTables) {
    Object.assign(out, await probe(`table_${t}`, `/rest/v1/${t}?select=id&limit=1`));
  }
  return { body: out };
};

// GET /debug/blueprint-search?q=…  — the REAL searchBlueprint() result.
//
// WHY THIS EXISTS: /debug/eval scores full agent turns, which take ~15s, burn
// model quota, and judge the PROSE. An answer can read beautifully while the
// rows behind it are wrong, and the eval suite has no way to tell — it has
// been 19/19 green while 5% of the index pointed at deleted cells.
//
// This route returns row identity (ids, path, scenario, scores, which
// retrieval path answered) so a retrieval eval can assert recall@k directly:
// deterministic, model-free, seconds not minutes.
//
// `fresh=1` bypasses the 60s result cache — the eval must measure retrieval,
// not the cache. Token-gated like every /debug route; read-only.
export const blueprintSearchProbe: ProbeRun = async (env, url) => {
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return { body: { ok: false, error: "missing ?q=" }, status: 400 };

  // `?rpc=` scores a CANDIDATE search function without moving the live one.
  //
  // Retrieval changes used to be measurable only by editing the function the
  // whole product calls, so the loop was "apply to production, run the eval,
  // revert if worse". That is how an OR-ranked keyword arm reached
  // production, fixed one blocker case, broke three others and was rolled
  // back (plus-uno-blueprint#154). A candidate created alongside
  // `search_blueprint` can now be scored while the live one is untouched.
  //
  // ALLOWLISTED BY PREFIX, not merely token-gated. This route already requires
  // the debug token, but the name is interpolated into a PostgREST `/rpc/`
  // path — an arbitrary one would let a token holder invoke any function
  // reachable by the bot's key, which is a much larger surface than "look at
  // search results". The pattern admits the live name and
  // `search_blueprint_<something>` candidates, and nothing else.
  const rpcParam = url.searchParams.get("rpc");
  if (rpcParam !== null && !isCallableCandidate(rpcParam)) {
    return {
      body: {
        ok: false,
        error:
          `rpc must match ${CANDIDATE_RPC.source} — a candidate is named ` +
          `search_blueprint_<suffix>, and only the search family is callable here`,
      },
      status: 400,
    };
  }

  // `?embed_model=` scores a candidate INDEX, which `?rpc=` alone cannot.
  //
  // A candidate function reads a candidate column, and the function refuses
  // a caller whose model does not match the index it is reading — so
  // pointing this route at a candidate while the Worker embedded with the
  // live model produced `embedding model mismatch` and no measurement at
  // all. Allow-listed by VALUE rather than by shape: the database scores an
  // unknown model's vector as noise instead of refusing it, so a typo here
  // would come back as plausible rubbish rather than an error.
  const embedParam = url.searchParams.get("embed_model");
  if (embedParam !== null && !isScoreableEmbedModel(embedParam)) {
    return {
      body: {
        ok: false,
        error:
          `embed_model must be one of ${SCOREABLE_EMBED_MODELS.join(", ")} — ` +
          `a model the index is built with, or one being scored against it`,
      },
      status: 400,
    };
  }

  const started = Date.now();
  try {
    // Metered so the eval can report subrequest cost per query — the number
    // Phase 3 is meant to move (worst case 8 -> 2 against a 50 cap).
    const result = await runMetered(async () => {
      const r = await searchBlueprint(env, q, {
        fresh: url.searchParams.get("fresh") !== "0",
        ...(rpcParam ? { rpcName: rpcParam } : {}),
        ...(embedParam ? { embedModel: embedParam } : {}),
      });
      return { r, subrequests: subrequestsUsed() };
    });
    return {
      body: {
        ok: true,
        build: BUILD,
        q,
        // Echoed ALWAYS, not only when overridden: an eval artifact that does
        // not say which function produced it can be read as the live result a
        // week later, which is the mistake this parameter exists to prevent.
        rpc: rpcParam ?? BLUEPRINT_CONTRACT.rpcs.searchBlueprint,
        // The MODEL is echoed for the same reason as the function, and it is
        // the half that cannot be inferred: two runs against the same
        // candidate function, one on each model, differ in nothing else a
        // reader of the artifact can see.
        embed_model:
          embedParam ??
          (env.SUPABASE_URL && env.SUPABASE_ANON_KEY
            ? await resolveIndexModel(
                env,
                env.SUPABASE_URL.replace(/\/+$/, ""),
                env.SUPABASE_ANON_KEY,
                countedFetch,
                indexSource(rpcParam ?? BLUEPRINT_CONTRACT.rpcs.searchBlueprint),
              )
            : embedModelName(env)),
        ms: Date.now() - started,
        subrequests: result.subrequests,
        ...result.r,
      },
    };
  } catch (err) {
    // Report the failure as a failure. A retrieval eval that reads an error
    // as "no rows" would score a broken path as a recall miss and send
    // someone tuning the ranker.
    return {
      body: { build: BUILD, q, ms: Date.now() - started, ...probeFailure(err) },
    };
  }
};

// GET /debug/blueprint-subject?need=…  — a row from the LIVE board that
// satisfies a named condition (#415).
//
// WHY THIS EXISTS: an eval scenario that names its subject — "walk me through
// Goal Setting", "where do we use Zoom" — encodes a fact about the board on
// the day it was written, and the board is edited daily. A rename turns the
// case red with nothing wrong, which is the same defect #411 exists to fix,
// one layer up. So the fixture names a CONDITION, and this route answers it
// from the database at run time.
//
// The runner holds no Supabase credential and must not gain one — the Worker
// is the only thing here that reads the blueprint, and this route keeps it
// that way. Selection is a pure module (integrations/blueprint-subject.ts);
// everything below binds it to the reads the bot already makes.
//
// Token-gated like every /debug route; read-only. An unknown `need` gets the
// known list back, because "no row satisfies your condition" and "that is not
// a condition" are different answers and only one of them is a finding.
export const blueprintSubjectProbe: ProbeRun = async (env, url) => {
  const need = (url.searchParams.get("need") ?? "").trim();
  if (!isSubjectNeed(need)) {
    return {
      body: { ok: false, build: BUILD, need, error: "unknown need", needs: SUBJECT_NEEDS },
      status: 400,
    };
  }
  if (!isBlueprintConfigured(env)) {
    return {
      body: {
        ok: false,
        build: BUILD,
        need,
        error: "uno-blueprint not configured — missing SUPABASE_URL / SUPABASE_ANON_KEY",
      },
    };
  }
  const reads: SubjectReads = {
    outline: () => fetchPhaseOutline(env),
    // A WIDER page than the bot's own tool reads. Rows come back `name.asc`,
    // and `corpus-term` picks its search term out of these names — so the
    // product's 15-row page quietly turned the condition into "…among the
    // alphabetically-first fifteen tools" and skipped B4 on a board that
    // satisfies it (#452). Still one request.
    touchpoints: async () => (await fetchTouchpoints(env, "", TOUCHPOINT_SUBJECT_PAGE)).rows,
    search: async (query, scope) => {
      const r = await searchBlueprint(env, query, {
        fresh: true,
        scope: {
          ...(scope.filterScenario ? { filterScenario: scope.filterScenario } : {}),
          ...(scope.granularity === "cell" ? { granularity: "cell" as const } : {}),
        },
      });
      return { rows: r.rows, ...(r.matched_total === undefined ? {} : { matched: r.matched_total }) };
    },
    // Read off the vendored contract, not remembered: `absent-detail` claims
    // the blueprint has no field for a duration, and the day it grows one the
    // condition must stop being satisfiable rather than keep asserting that
    // the bot should refuse an answerable question.
    cellColumns: BLUEPRINT_CONTRACT.botDirectReadColumns.cells,
  };
  const started = Date.now();
  try {
    // Metered like the search route: a `corpus-term` pick probes several
    // terms, and a subject read that quietly ate the turn's budget would be
    // indistinguishable from a board with no qualifying row.
    const pick = await runMetered(async () => {
      const p = await selectSubject(need, reads);
      return { p, subrequests: subrequestsUsed() };
    });
    return {
      body: {
        ok: true,
        build: BUILD,
        need,
        ms: Date.now() - started,
        subrequests: pick.subrequests,
        subject: pick.p.subject,
        ...(pick.p.reason ? { reason: pick.p.reason } : {}),
      },
    };
  } catch (err) {
    // A failed READ is not an unsatisfiable condition. Reporting it as
    // `subject: null` would skip the case for the wrong reason and hide a
    // broken blueprint behind a tidy log line.
    return {
      body: { build: BUILD, need, ms: Date.now() - started, ...probeFailure(err) },
    };
  }
};
