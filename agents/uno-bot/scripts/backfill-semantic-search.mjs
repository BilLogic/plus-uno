// Backfill / refresh the blueprint's semantic index.
//
// One-off (and nightly) job — runs in NODE (locally or in a GitHub Action),
// NOT in the Worker (no subrequest cap here). It reads the read-only source
// view semantic_search.blueprint_chunks_src, embeds each chunk, and writes the
// vectors. Idempotent: re-running updates rows in place.
//
// Reads the blueprint but NEVER writes to it — only to semantic_search.*.
//
// ── ONE INDEX, SEVERAL MODELS ────────────────────────────────────────────────
//
// The index can hold vectors from more than one embedding model, one set per
// model, because the people who search it do not all hold the same key: a
// person using the in-app agent embeds their question with their OWN key, and
// a question embedded by one model cannot be scored against cells embedded by
// another. `public.search_blueprint` picks the set by the model name the caller
// declares, and raises `embedding model mismatch` when it holds none.
//
// The two sets live in two places, and which one this pass writes is decided
// by the model, not by a flag:
//
//   the INDEX'S OWN model   semantic_search.index_meta names it for the
//                           `blueprint` source, and its vectors live in
//                           corpus_chunks.embedding — the column
//                           match_corpus_chunks and index_health read.
//   any OTHER model         one row per (source, source_key, model) in
//                           semantic_search.chunk_embeddings.
//
// A second-model pass writes VECTORS ONLY. It never touches the chunk row's
// text or its `updated_at`, because that stamp is how the index's own pass
// knows what is stale — moving it here would make the primary index look
// current forever while it silently froze.
//
// Env required:
//   SUPABASE_URL                e.g. https://osybxeojvsqcwxkgnalm.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service-role key (bypasses RLS; keep it secret)
//   and ONE embedding credential for the provider this pass uses:
//     google — GEMINI_PROJECT_ID, GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY
//              (Vertex SA; PREFERRED when both exist) …or GEMINI_API_KEY
//     openai — OPENAI_API_KEY
// Optional:
//   EMBED_MODEL    the model to embed with. Default: whatever index_meta names
//                  for the blueprint index.
//   EMBED_REGION   default "us-central1"  (Vertex path only; "global" does not
//                  serve embeddings)
//   BLUEPRINT_URL  default "https://uno-blueprint.netlify.app/"  (citation base)
//
// Run:  node scripts/backfill-semantic-search.mjs
//
// A SECOND MODEL, beside the index's own:
//   OPENAI_API_KEY=sk-… node scripts/backfill-semantic-search.mjs \
//     --model=text-embedding-3-small
//
// WITH NO KEY FOR THAT PROVIDER IT SKIPS, and says so, rather than failing.
// That is the state this deployment is in and expects to stay in: the nightly
// carries the OpenAI pass so that turning it on is setting one secret, and an
// unset secret must not turn the nightly red every night for a set nobody
// asked for. A MISSING key is a skip; a WRONG key is a failure, because that
// one is somebody trying.

import { createSign } from "node:crypto";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY,
  GEMINI_PROJECT_ID,
  GEMINI_SA_EMAIL,
  GEMINI_SA_PRIVATE_KEY,
  OPENAI_API_KEY,
  EMBED_REGION = "us-central1",
  BLUEPRINT_URL = "https://uno-blueprint.netlify.app/",
} = process.env;

const ARGV = process.argv.slice(2);
const flag = (name) => {
  const hit = ARGV.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return hit === undefined ? undefined : hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "";
};

/**
 * Which model this pass embeds with, and which API can reach it.
 *
 * The model is the whole decision. It picks the provider, and — once
 * `index_meta` has been read — it picks whether the vectors land in the
 * index's own column or in a row of their own. There is no `--column`: a
 * column was something a person could name wrongly, and the swap that retired
 * `embedding_001` took the last one with it.
 */
const EMBED_MODEL = flag("model") || process.env.EMBED_MODEL || null;

/**
 * Inferred from the model's own name, because the name IS the provider's.
 * `text-embedding-3-small` is OpenAI's; everything Google publishes here is
 * `gemini-embedding-*` or `text-embedding-00*`. `--provider` overrides it for
 * a model this list has not heard of.
 */
function providerFor(model) {
  const named = flag("provider");
  if (named) return named;
  if (model && /^text-embedding-\d+-/.test(model)) return "openai";
  return "google";
}

// SA first — the Vertex path; the AI Studio key only when no SA exists. Never
// mix embedding models in one set: vectors from two models are not comparable,
// and because every model here is 768-dim, nothing in the stack can tell by
// looking.
const USE_API_KEY = !(GEMINI_SA_EMAIL && GEMINI_SA_PRIVATE_KEY && GEMINI_PROJECT_ID) && Boolean(GEMINI_API_KEY);

const SCHEMA = "semantic_search";
const EMBED_DIM = 768;

/**
 * Instances per request. 100 for the models that take a batch; ONE for
 * `gemini-embedding-001`, which rejects a multi-instance `:predict` outright —
 * so a pass on that model fails on its first call rather than partway through.
 *
 * A function rather than a constant, because the model is not known until
 * `index_meta` has been read: a pass with no `--model` embeds with whatever
 * the index says it holds.
 */
function batchSizeFor(model) {
  return /^gemini-embedding/.test(model) ? 1 : 100;
}

function required(name, val) {
  if (!val) throw new Error(`missing env ${name}`);
  return val;
}

// ── Google service-account OAuth (same approach as the Worker's gemini/auth.ts) ─
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
  const input = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  const jwt = `${input}.${b64url(signer.sign(key))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`google token exchange failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ── Text embeddings (batched) — one function per provider ────────────────────
async function embedWithGoogle(token, texts, model) {
  if (USE_API_KEY) {
    // AI Studio (generativelanguage) batchEmbedContents — one simple key.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`;
    const res = await fetch(url, {
      method: "POST",
      // The key rides in a HEADER, not `?key=` — a query string is kept in
      // proxy logs and error reports, and this path is the one a local run
      // with a personal key uses.
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: EMBED_DIM,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`embed failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
    return data.embeddings.map((e) => e.values);
  }
  // Vertex predict (service-account bearer token).
  const url =
    `https://${EMBED_REGION}-aiplatform.googleapis.com/v1/projects/${GEMINI_PROJECT_ID}` +
    `/locations/${EMBED_REGION}/publishers/google/models/${model}:predict`;
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      instances: texts.map((content) => ({ content, task_type: "RETRIEVAL_DOCUMENT" })),
      parameters: { outputDimensionality: EMBED_DIM },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`embed failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  return data.predictions.map((p) => p.embeddings.values);
}

/**
 * OpenAI embeddings.
 *
 * `dimensions` is sent on every call and is not optional. OpenAI's default is
 * the model's full width — 1536 for `text-embedding-3-small` — and a vector of
 * that width cannot go into a `vector(768)` column at all. The database would
 * refuse it, which is the good case; what the parameter really buys is that the
 * question the browser embeds asks for the same 768 (see the app's
 * `embedQuestion.ts`), so both sides of a comparison are the same space.
 *
 * The key rides in the Authorization header, never a query string. It is a
 * SERVER secret here: the browser's own OpenAI key embeds one question and
 * never reaches this job.
 */
async function embedWithOpenAi(texts, model) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, input: texts, dimensions: EMBED_DIM }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`embed failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  // `index` is returned on every item and the order is not promised, so the
  // batch is reassembled by it rather than by position. A silently shuffled
  // batch pairs every chunk with another chunk's vector — an index that still
  // answers, and answers wrongly, with nothing downstream able to see it.
  const out = new Array(texts.length);
  for (const item of data.data ?? []) out[item.index] = item.embedding;
  if (out.some((v) => !Array.isArray(v))) {
    throw new Error(`embed returned ${data.data?.length ?? 0} vectors for ${texts.length} chunks`);
  }
  return out;
}

async function embedBatch(provider, token, texts, model) {
  return provider === "openai"
    ? embedWithOpenAi(texts, model)
    : embedWithGoogle(token, texts, model);
}

// ── Supabase REST helpers (service-role; semantic_search schema) ──────────────
function sbHeaders(profile) {
  const key = required("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  const h = {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
  if (profile === "read") h["accept-profile"] = SCHEMA;
  if (profile === "write") h["content-profile"] = SCHEMA;
  return h;
}
async function fetchSourceRows() {
  const url = `${required("SUPABASE_URL", SUPABASE_URL)}/rest/v1/blueprint_chunks_src` +
    `?select=source_key,title,chunk,updated_at`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`read source view failed (${res.status}): ${await res.text()}`);
  return res.json();
}
// (source_key -> stored updated_at) for the incremental pass above.
async function fetchIndexedStamps() {
  const url = `${SUPABASE_URL}/rest/v1/corpus_chunks?select=source_key,updated_at&source=eq.blueprint&limit=10000`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`index scan failed (${res.status}): ${await res.text()}`);
  return new Map((await res.json()).map((r) => [r.source_key, r.updated_at]));
}
async function upsertChunks(rows) {
  const url = `${SUPABASE_URL}/rest/v1/corpus_chunks?on_conflict=source,source_key`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...sbHeaders("write"), prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert failed (${res.status}): ${await res.text()}`);
}
/**
 * The row naming the index's own model. It decides two things: what a pass
 * with no `--model` embeds with, and — for a pass that names one — whether
 * these vectors belong in the index's own column or in a row of their own.
 */
async function fetchIndexModel() {
  const url = `${required("SUPABASE_URL", SUPABASE_URL)}/rest/v1/index_meta?select=model,dims&source=eq.blueprint`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`index_meta read failed (${res.status}): ${await res.text()}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/**
 * (source_key -> stored updated_at) for ONE second model.
 *
 * The side table carries its own stamp per (chunk, model), so a second model's
 * staleness is its own question: the index's own pass may have re-embedded
 * every row this morning and this set still be a week behind.
 */
async function fetchModelStamps(model) {
  const url =
    `${SUPABASE_URL}/rest/v1/chunk_embeddings?select=source_key,updated_at` +
    `&source=eq.blueprint&model=eq.${encodeURIComponent(model)}&limit=10000`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`model index scan failed (${res.status}): ${await res.text()}`);
  return new Map((await res.json()).map((r) => [r.source_key, r.updated_at]));
}

/** Which source_keys already have a chunk row, and so can carry a vector. */
async function fetchChunkKeys() {
  const url = `${SUPABASE_URL}/rest/v1/corpus_chunks?select=source_key&source=eq.blueprint&limit=10000`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`chunk scan failed (${res.status}): ${await res.text()}`);
  return new Set((await res.json()).map((r) => r.source_key));
}

/**
 * Vectors for a model that is not the index's own.
 *
 * VECTORS ONLY. No title, no chunk text, no chunk `updated_at` — those belong
 * to the chunk row, and the index's own pass reads that stamp to decide what
 * is stale. A second-model pass that touched it would make the primary index
 * report itself current while it quietly stopped being re-embedded.
 */
async function upsertModelVectors(rows) {
  const url = `${SUPABASE_URL}/rest/v1/chunk_embeddings?on_conflict=source,source_key,model`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...sbHeaders("write"), prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`vector upsert failed (${res.status}): ${await res.text()}`);
}

// Orphan pass: a cell deleted or re-keyed in the app leaves its chunk behind,
// and an upsert-only index serves it forever — the bot then cites content that
// no longer exists and hands out a dead ?cell= link. Measured 2026-08-19 before
// this worked: 43 orphans, and 10% of sampled searches surfaced one in top-15.
//
// This calls semantic_search.prune_orphans() rather than issuing its own
// DELETE. The function's WHERE lives inside a security definer, so the caller
// can only ever remove the orphan set — where the table-level grant permitted
// `delete from corpus_chunks` with any predicate, or none. Same shape the
// schema already uses for reads, where match_corpus_chunks is the only door.
//
// This is step 2 of the sequence written into that migration; step 3 is
// revoking the table grant, which is now safe to do.
async function pruneOrphans() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/prune_orphans`, {
    method: "POST",
    headers: { ...sbHeaders("write"), "content-type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`orphan prune failed (${res.status}): ${await res.text()}`);
  const removed = await res.json();
  return typeof removed === "number" ? removed : 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const full = ARGV.includes("--full");
  const asked = EMBED_MODEL;
  const provider = providerFor(asked);

  // THE SKIP, AND IT COMES FIRST. Before Supabase, before the source view,
  // before anything that could fail for a different reason. A nightly that
  // carries an OpenAI pass with no OPENAI_API_KEY set must do nothing and say
  // why — that is the state this deployment is in, and a red run every night
  // for a set nobody asked for is how a job stops being read.
  //
  // MISSING is a skip. WRONG is a failure: a key that is set and rejected is
  // somebody trying, and swallowing that would hide the one case where a
  // person is waiting for an index to appear.
  if (provider === "openai" && !OPENAI_API_KEY) {
    console.log(
      `[backfill] SKIPPED: ${asked ?? "the openai pass"} needs OPENAI_API_KEY and no such secret is set. ` +
        "Nothing was embedded and nothing was written.",
    );
    console.log(
      "[backfill] To build this set: set OPENAI_API_KEY as a server secret, re-run this pass, " +
        "and only then list the index in the app's `agent.search.indexes`. In that order — " +
        "an index listed before it exists makes every meaning search raise.",
    );
    return;
  }

  // The index's own model, which settles both the default and the target.
  const meta = await fetchIndexModel();
  if (!meta) {
    throw new Error(
      `${SCHEMA}.index_meta has no row for source "blueprint" — nothing declares which ` +
        "model this index was built with, so this pass cannot know where its vectors belong",
    );
  }
  if (meta.dims !== EMBED_DIM) {
    throw new Error(`the blueprint index is declared ${meta.dims}-dim; this pass writes ${EMBED_DIM}`);
  }

  const model = asked ?? meta.model;
  const own = model === meta.model;
  console.log(
    `[backfill] ${model} @ ${EMBED_DIM} via ${provider} -> ` +
      (own ? "corpus_chunks.embedding (the index's own model)" : `chunk_embeddings (beside ${meta.model})`),
  );

  // Only the Vertex SA path needs a Google token; neither key path does.
  const token = provider === "google" && !USE_API_KEY ? await getGoogleToken() : null;
  const src = await fetchSourceRows();

  // Embed only what changed. Both passes store the SOURCE row's updated_at (not
  // the embed time), so a row whose stored stamp already matches is current.
  //
  // This is tidiness, not relief: a full run is a few API requests. Do not let
  // it mask a real staleness bug; --full forces everything, and a view change
  // (which alters chunk TEXT without touching cells.updated_at) REQUIRES it,
  // because no stamp moves when the view is redefined.
  let todo = src;
  let skippedForNoChunk = 0;
  if (own) {
    if (!full) {
      const known = await fetchIndexedStamps();
      todo = src.filter((r) => known.get(r.source_key) !== r.updated_at);
    }
  } else {
    // A second-model pass writes vectors for chunks that already exist. It does
    // not create them: the chunk row carries the text and the stamp the index's
    // own pass owns, and a set built for cells this index has never chunked
    // would be a set the search can never join back to anything.
    const chunked = await fetchChunkKeys();
    const eligible = src.filter((r) => chunked.has(r.source_key));
    skippedForNoChunk = src.length - eligible.length;
    if (full) {
      todo = eligible;
    } else {
      const known = await fetchModelStamps(model);
      todo = eligible.filter((r) => known.get(r.source_key) !== r.updated_at);
    }
  }
  console.log(
    `[backfill] ${src.length} eligible chunks; ${todo.length} to embed` +
      `${full ? " (--full)" : ` (${src.length - todo.length - skippedForNoChunk} unchanged)`}` +
      (skippedForNoChunk > 0
        ? `; ${skippedForNoChunk} cell(s) have no chunk yet — run the ${meta.model} pass first`
        : ""),
  );

  const batchSize = batchSizeFor(model);
  let done = 0;
  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize);
    const embeddings = await embedBatch(provider, token, batch.map((r) => r.chunk), model);
    if (own) {
      await upsertChunks(
        batch.map((r, j) => ({
          source: "blueprint",
          source_key: r.source_key,
          title: r.title,
          // Deep link to the cell, not the app root. Every chunk used to carry
          // the same homepage URL, which is not a citation — it is a link to
          // "go look for it yourself". `?cell=` is the app's param — declared
          // by the vendored contract as `urlParams.cell` — and source_key IS
          // the cell id. (The app module that reads it is no longer in the
          // uno-blueprint repo at all: that deployment imports the application
          // from the agentic-service-blueprinting package.)
          ref_url: `${BLUEPRINT_URL.replace(/\/+$/, "")}/?cell=${r.source_key}`,
          chunk: r.chunk,
          embedding: embeddings[j],
          // The SOURCE row's date, not now(). Stamping the embed time made every
          // chunk look freshly authored, so the "flag a stale blueprint" rule the
          // tool hands the model could never fire — the index always claimed today.
          updated_at: r.updated_at ?? new Date().toISOString(),
        })),
      );
    } else {
      await upsertModelVectors(
        batch.map((r, j) => ({
          source: "blueprint",
          source_key: r.source_key,
          model,
          embedding: embeddings[j],
          updated_at: r.updated_at ?? new Date().toISOString(),
        })),
      );
    }
    done += batch.length;
    console.log(`[backfill] upserted ${done}/${todo.length}`);
  }

  // The orphan pass DELETES chunk rows, and it belongs to the index's own
  // upkeep. A second-model pass is additive; it should not be able to remove
  // anything the bot serves. It does not need to either: chunk_embeddings
  // cascades from the chunk, so a pruned chunk takes every model's vector with
  // it in the same statement.
  if (own) {
    const removed = await pruneOrphans();
    if (removed > 0) console.log(`[backfill] pruned ${removed} orphaned chunk(s)`);
  }
  console.log("[backfill] done");
}

main().catch((err) => {
  console.error(`[backfill] FAILED: ${err.message}`);
  process.exit(1);
});
