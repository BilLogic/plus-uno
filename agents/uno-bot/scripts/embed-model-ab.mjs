// Score one embedding model against another on the retrieval fixture, WITHOUT
// touching the live index or the live search function.
//
// WHY THIS EXISTS, separate from run-retrieval-evals.mjs: that harness scores
// what the deployed search returns — every arm, fused by RRF, through the
// Worker. It is the right measurement for a ranking change, and the wrong one
// for a MODEL change, because reaching it means building a second index and a
// second copy of search_blueprint first. This script answers the cheaper
// question that has to be answered before any of that is worth doing: on the
// same cases, does the new model's VECTOR ARM find the cells the old one did?
//
// So it is a go/no-go, not a replacement. Its recall and MRR are the vector
// arm's alone and are NOT comparable to a committed harness baseline, which
// includes the keyword and structural arms. A model that wins here still has
// to be confirmed through the candidate-function route before the switch; a
// model that loses here stops the work with one script and no migration.
//
// It also answers the second question the switch depends on: whether a vector
// from the Vertex service account and a vector from the Gemini API — the bot's
// transport and a person's own browser key — land in the SAME space for one
// model. If they do not, one index cannot serve both, whatever the scores say.
//
// Nothing here writes. It reads the source view and embeds in memory.
//
// Env required:
//   SUPABASE_URL                e.g. https://osybxeojvsqcwxkgnalm.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service-role key (read-only use here)
//   GEMINI_PROJECT_ID, GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY   Vertex SA
// Optional:
//   GEMINI_API_KEY   an AI Studio key. Standing in for a PERSON's browser key,
//                    it enables the transport-comparability check. Local only —
//                    production holds no Gemini API key (ADR-018).
//   MODELS           default "text-embedding-005,gemini-embedding-001"
//   CASES_PATH       default docs/evals/fixtures/blueprint-retrieval-cases.json
//   OUT_PATH         default embed-model-ab.json (gitignored working output)
//
// Run (from either the repo root or agents/uno-bot):
//   set -a; . ./agents/uno-bot/.dev.vars; set +a
//   npm run --prefix agents/uno-bot evals:embed-ab

import { createSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The fixture lives at the REPO root, not under agents/uno-bot, and this
 * script is run both ways (npm script from the bot directory, bare node from
 * the root). Resolving from this file's own location means neither invocation
 * has to know where it was launched from.
 */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY,
  GEMINI_PROJECT_ID,
  GEMINI_SA_EMAIL,
  GEMINI_SA_PRIVATE_KEY,
  EMBED_REGION = "us-central1",
  MODELS = "text-embedding-005,gemini-embedding-001",
  CASES_PATH = "docs/evals/fixtures/blueprint-retrieval-cases.json",
  OUT_PATH = "embed-model-ab.json",
} = process.env;

// 768 is the index column's width, so both models are asked for 768 — a model
// scored at its own native width would be measured on an index uno cannot
// build without a schema change.
const EMBED_DIM = 768;
/**
 * Instances per `:predict` call, by model.
 *
 * Not one number: the `text-embedding-00x` family takes up to 250 instances a
 * request, and `gemini-embedding-001` takes ONE. A shared batch size of 100
 * means the candidate model 400s on its first call — after the baseline model
 * has already been paid for — which is the run this script exists to produce.
 */
function batchSizeFor(model) {
  return /^gemini-embedding/.test(model) ? 1 : 100;
}
/** Well above the live corpus; the read throws rather than truncate at it. */
const SOURCE_ROW_CAP = 20000;

function required(name, value) {
  if (!value) throw new Error(`missing env ${name}`);
  return value;
}

// ── Google service-account OAuth (same approach as backfill-semantic-search) ─
function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

async function getGoogleToken() {
  const email = required("GEMINI_SA_EMAIL", GEMINI_SA_EMAIL);
  const key = required("GEMINI_SA_PRIVATE_KEY", GEMINI_SA_PRIVATE_KEY).replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(key));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`google token failed (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

/** Embed through Vertex `:predict` — the transport uno-bot itself uses. */
async function embedVertex(token, model, texts, taskType) {
  const url =
    `https://${EMBED_REGION}-aiplatform.googleapis.com/v1/projects/${required("GEMINI_PROJECT_ID", GEMINI_PROJECT_ID)}` +
    `/locations/${EMBED_REGION}/publishers/google/models/${model}:predict`;
  const batch = batchSizeFor(model);
  const out = [];
  for (let i = 0; i < texts.length; i += batch) {
    const slice = texts.slice(i, i + batch);
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        instances: slice.map((content) => ({ content, task_type: taskType })),
        parameters: { outputDimensionality: EMBED_DIM },
      }),
    });
    if (!res.ok) throw new Error(`vertex ${model} failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    for (const prediction of data.predictions ?? []) {
      const values = prediction?.embeddings?.values;
      if (!values) throw new Error(`vertex ${model} returned a row with no vector`);
      out.push(values);
    }
    process.stderr.write(`  ${model}: ${out.length}/${texts.length}\r`);
  }
  process.stderr.write("\n");
  if (out.length !== texts.length)
    throw new Error(`vertex ${model} returned ${out.length} vectors for ${texts.length} texts`);
  return out;
}

/**
 * Embed through the Gemini API — the transport a PERSON's browser key uses.
 * The key rides in a header, not `?key=`, for the same reason the in-app agent
 * does it that way: a query string is kept in history and proxy logs.
 */
async function embedGeminiApi(model, text, taskType) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": required("GEMINI_API_KEY", GEMINI_API_KEY),
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBED_DIM,
      }),
    },
  );
  if (!res.ok)
    throw new Error(`gemini api ${model} failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const values = data?.embedding?.values;
  if (!values) throw new Error(`gemini api ${model} returned no vector`);
  return values;
}

// ── The corpus, straight off the read-only source view ──────────────────────
async function fetchChunks() {
  const url =
    `${required("SUPABASE_URL", SUPABASE_URL)}/rest/v1/blueprint_chunks_src` +
    `?select=source_key,chunk&limit=${SOURCE_ROW_CAP}`;
  const res = await fetch(url, {
    headers: {
      apikey: required("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      accept: "application/json",
      "accept-profile": "semantic_search",
      // The TOTAL, not just this page. A named `limit` does not defeat the
      // server's own max-rows setting, so the only way to know a read was
      // complete is to compare it against the count the server reports.
      // Scoring a truncated corpus and calling it the whole one is the
      // failure this guards.
      prefer: "count=exact",
    },
  });
  if (!res.ok) throw new Error(`read source view failed (${res.status}): ${await res.text()}`);
  const rows = await res.json();
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  if (Number.isFinite(total) && total !== rows.length)
    throw new Error(
      `the source view holds ${total} rows and the read returned ${rows.length} — the server capped it. Page the read, or raise the project's max-rows, rather than scoring a partial corpus`,
    );
  return rows;
}

// ── Scoring ─────────────────────────────────────────────────────────────────
function cosine(a, b) {
  // Two widths have no cosine. Silently iterating the shorter one prints a
  // confident number for a comparison that never happened — which in the
  // transport check is the whole verdict.
  if (a.length !== b.length)
    throw new Error(`cosine of ${a.length} and ${b.length} dimensions`);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/**
 * One case's rank-of-first-expected-cell under one model, or null for a miss
 * within k. Same scoring shape as the harness: ANY expected id inside top-k is
 * a hit, and MRR is over the rank of the first one.
 */
function rankOfFirstHit(questionVector, chunks, chunkVectors, expected, k) {
  const scored = chunkVectors
    .map((vector, index) => ({ key: chunks[index].source_key, score: cosine(questionVector, vector) }))
    .sort((a, b) => b.score - a.score);
  const wanted = new Set(expected);
  // One rank per CELL, not per chunk: a cell with three chunks must not take
  // three of the five places the harness counts.
  const seen = new Set();
  let rank = 0;
  for (const row of scored) {
    if (seen.has(row.key)) continue;
    seen.add(row.key);
    rank += 1;
    if (rank > k) break;
    if (wanted.has(row.key)) return rank;
  }
  return null;
}

async function main() {
  const models = MODELS.split(",").map((m) => m.trim()).filter(Boolean);
  const casesPath = CASES_PATH.startsWith("/") ? CASES_PATH : join(REPO_ROOT, CASES_PATH)
  const all = JSON.parse(readFileSync(casesPath, "utf8")).filter((c) => c.id && c.q);
  const scorable = (c) => Array.isArray(c.expectCellIds) && c.expectCellIds.length > 0;
  const cases = all.filter(scorable);
  // A cell-id expectation is the only thing a vector ranking can be scored
  // against. The structural, aggregate and absence classes expect a path name,
  // a scenario name or a score BELOW a bar — all of which the keyword and
  // structural arms decide, and none of which this script runs. They are
  // NAMED rather than counted, because "blocker misses: none" over a set that
  // silently dropped a third of the blockers reads as a clean verdict.
  const excluded = all.filter((c) => !scorable(c));
  if (cases.length === 0) throw new Error(`no scorable cases in ${casesPath}`);

  const chunks = await fetchChunks();
  console.log(`${chunks.length} chunks, models: ${models.join(", ")}`);
  console.log(
    `scoring ${cases.length} of ${all.length} cases (${cases.filter((c) => c.blocker).length} blockers)`,
  );
  if (excluded.length > 0)
    console.log(
      `NOT scored — no cell-id expectation, so the vector arm cannot be judged on them: ${excluded
        .map((c) => `${c.id}${c.blocker ? "*" : ""} (${c.class ?? "unclassed"})`)
        .join(", ")}\n  * = a blocker case in the retrieval harness. This run says nothing about it.`,
    );

  const token = await getGoogleToken();
  const results = {};
  for (const model of models) {
    // The asymmetry the index depends on: cells as documents, questions as
    // queries. Scoring both sides as one kind would flatter every model.
    // `row.chunk` ALONE, because that is what the live backfill embeds — and
    // `chunk` already opens with the identical breadcrumb `title` holds (see
    // the source view: the same concat_ws is `title` and `chunk`'s first
    // line). Prepending `title` would double a breadcrumb that is already
    // about half the embedded text, and score both models on a document no
    // index holds, biased toward the breadcrumb matching a past regression
    // was blamed on.
    const chunkVectors = await embedVertex(
      token,
      model,
      chunks.map((row) => row.chunk),
      "RETRIEVAL_DOCUMENT",
    );
    const questionVectors = await embedVertex(
      token,
      model,
      cases.map((c) => c.q),
      "RETRIEVAL_QUERY",
    );
    const perCase = cases.map((c, index) => ({
      id: c.id,
      class: c.class ?? null,
      blocker: Boolean(c.blocker),
      k: c.k ?? 5,
      rank: rankOfFirstHit(questionVectors[index], chunks, chunkVectors, c.expectCellIds, c.k ?? 5),
    }));
    const hits = perCase.filter((r) => r.rank != null);
    results[model] = {
      recall: hits.length / perCase.length,
      mrr: perCase.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) / perCase.length,
      blockerMisses: perCase.filter((r) => r.blocker && r.rank == null).map((r) => r.id),
      perCase,
    };
    const { recall, mrr } = results[model];
    console.log(
      `${model}: recall ${(recall * 100).toFixed(1)}% · MRR ${mrr.toFixed(3)} · blocker misses among the scored ${results[model].blockerMisses.join(", ") || "none"}`,
    );
  }

  // Criterion 2: one model, two transports, one space.
  let transport = null;
  if (GEMINI_API_KEY) {
    const probe = "does a session recording exist for last week";
    for (const model of models) {
      try {
        const [viaVertex] = await embedVertex(token, model, [probe], "RETRIEVAL_QUERY");
        const viaApi = await embedGeminiApi(model, probe, "RETRIEVAL_QUERY");
        const similarity = cosine(viaVertex, viaApi);
        transport = { ...(transport ?? {}), [model]: similarity };
        console.log(`${model}: Vertex-SA vs Gemini-API cosine ${similarity.toFixed(6)}`);
      } catch (error) {
        transport = { ...(transport ?? {}), [model]: `unavailable: ${error.message}` };
        console.log(`${model}: transport check unavailable — ${error.message}`);
      }
    }
  } else {
    console.log(
      "GEMINI_API_KEY not set — the Vertex-SA vs Gemini-API comparability check did not run.",
    );
  }

  const outPath = OUT_PATH.startsWith("/") ? OUT_PATH : join(REPO_ROOT, OUT_PATH);
  writeFileSync(
    outPath,
    `${JSON.stringify(
      {
        chunks: chunks.length,
        cases: cases.length,
        casesInFixture: all.length,
        excluded: excluded.map((c) => ({
          id: c.id,
          class: c.class ?? null,
          blocker: Boolean(c.blocker),
        })),
        results,
        transport,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`wrote ${outPath}`);

  // A per-case table, so a model that wins on average while losing the cases
  // the index exists for is visible rather than averaged away.
  console.log("\ncase   k  " + models.map((m) => m.padEnd(24)).join(""));
  for (const [index, c] of cases.entries()) {
    const cells = models
      .map((m) => {
        const rank = results[m].perCase[index].rank;
        return (rank == null ? "miss" : `#${rank}`).padEnd(24);
      })
      .join("");
    console.log(`${c.id.padEnd(6)} ${String(c.k ?? 5).padEnd(2)} ${cells}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
