// Blueprint probes: what the deployment supports, and what a real search
// returns.
//
// Both know blueprint schema — the selects, the RPC names, the column
// lists — and that knowledge lives here rather than in the Worker entry.
import { BUILD } from "../../version";
import { BLUEPRINT_CONTRACT } from "../../generated/blueprint-contract";
import { countedFetch, runMetered, subrequestsUsed } from "../../net";
import {
  searchBlueprint,
} from "../../integrations/blueprint";
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
// WHY THIS EXISTS: an answer can read beautifully while the rows behind it are
// wrong, and a full agent turn takes ~15s, burns model quota and shows only
// the prose.
//
// This route returns row identity (ids, path, scenario, scores, which
// retrieval path answered), so a retrieval question is answered directly:
// deterministic, model-free, seconds not minutes.
//
// `fresh=1` bypasses the 60s result cache, to measure retrieval rather than
// the cache. Token-gated like every /debug route; read-only.
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
