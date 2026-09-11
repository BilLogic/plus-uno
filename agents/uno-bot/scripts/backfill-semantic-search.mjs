// Backfill / refresh the semantic_search.corpus_chunks index from the blueprint.
//
// One-off (and nightly) job — runs in NODE (locally or in a GitHub Action),
// NOT in the Worker (no subrequest cap here). It reads the read-only source view
// semantic_search.blueprint_chunks_src, embeds each chunk with Vertex
// text-embedding-005, and upserts into semantic_search.corpus_chunks. Idempotent:
// re-running updates rows in place (unique on source, source_key).
//
// Reads the blueprint but NEVER writes to it — only to semantic_search.*.
//
// Env required:
//   SUPABASE_URL                e.g. https://osybxeojvsqcwxkgnalm.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service-role key (bypasses RLS; keep it secret)
//   and ONE embedding credential (the SA is PREFERRED when both exist, so the
//   index model stays text-embedding-005 — mixing embedding models in one
//   index breaks similarity comparisons):
//     GEMINI_PROJECT_ID, GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY  (Vertex SA)
//   …or, only when no SA is configured:
//     GEMINI_API_KEY            AI Studio key (text-embedding-004)
// Optional:
//   EMBED_MODEL    default "gemini-embedding-001" (AI Studio) / "text-embedding-005" (Vertex)
//   EMBED_REGION   default "us-central1"  (Vertex path only; "global" does not serve embeddings)
//   BLUEPRINT_URL  default "https://uno-blueprint.netlify.app/"  (citation base)
//
// Run:  node scripts/backfill-semantic-search.mjs
//
// A CANDIDATE column, for scoring a model before switching to it:
//   node scripts/backfill-semantic-search.mjs --column=embedding_001 \
//     --model=gemini-embedding-001
//
// That pass fills a SECOND vector column beside the live one and leaves the
// live one untouched, so the deployed bot keeps answering from the index it
// was built with while the candidate is measured. Which column belongs to
// which model is not a convention held in somebody's head: each column has a
// row in semantic_search.index_meta naming its model, and this script refuses
// to write a model into a column that row does not name (see MODEL_COLUMNS).

import { createSign } from "node:crypto";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY,
  GEMINI_PROJECT_ID,
  GEMINI_SA_EMAIL,
  GEMINI_SA_PRIVATE_KEY,
  EMBED_REGION = "us-central1",
  BLUEPRINT_URL = "https://uno-blueprint.netlify.app/",
} = process.env;

// SA first (text-embedding-005 — what the live index is built with); the AI
// Studio key only when no SA exists. Never mix embedding models in one column:
// vectors from two models are not comparable, and because every model here is
// 768-dim, nothing in the stack can tell by looking.
const USE_API_KEY = !(GEMINI_SA_EMAIL && GEMINI_SA_PRIVATE_KEY && GEMINI_PROJECT_ID) && Boolean(GEMINI_API_KEY);
const ARGV = process.argv.slice(2);
const flag = (name) => {
  const hit = ARGV.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return hit === undefined ? undefined : hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "";
};

/**
 * Which vector column this pass fills, and which index_meta row describes it.
 *
 * The model a column holds is a FACT IN THE DATABASE, not a convention: the
 * search function refuses a query whose declared model does not match the row
 * for the index it reads. So this script reads the same row and refuses to
 * write the wrong model in — otherwise a candidate pass run with a forgotten
 * `--model` fills the candidate column with live-model vectors, every score
 * comes back plausible, and the measurement is worthless in a way nothing
 * downstream can detect.
 */
const MODEL_COLUMNS = {
  embedding: "blueprint",
  embedding_001: "blueprint_cand001",
};

const EMBED_COLUMN = flag("column") || "embedding";
if (!Object.hasOwn(MODEL_COLUMNS, EMBED_COLUMN)) {
  throw new Error(
    `--column must be one of ${Object.keys(MODEL_COLUMNS).join(", ")}, got "${EMBED_COLUMN}"`,
  );
}
const INDEX_SOURCE = MODEL_COLUMNS[EMBED_COLUMN];

const EMBED_MODEL =
  flag("model") ||
  process.env.EMBED_MODEL ||
  (USE_API_KEY ? "gemini-embedding-001" : "text-embedding-005");

const SCHEMA = "semantic_search";
const EMBED_DIM = 768;

/**
 * Instances per request. 100 for the models that take a batch; ONE for
 * `gemini-embedding-001`, which rejects a multi-instance `:predict` outright —
 * so a batched candidate pass fails on its first call rather than partway
 * through.
 */
const EMBED_BATCH = /^gemini-embedding/.test(EMBED_MODEL) ? 1 : 100;

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

// ── Text embeddings (batched) — AI Studio key path OR Vertex SA path ──────────
async function embedBatch(token, texts) {
  if (USE_API_KEY) {
    // AI Studio (generativelanguage) batchEmbedContents — one simple key.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents`;
    const res = await fetch(url, {
      method: "POST",
      // The key rides in a HEADER, not `?key=` — a query string is kept in
      // proxy logs and error reports, and this path is the one a local run
      // with a personal key uses.
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${EMBED_MODEL}`,
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
    `/locations/${EMBED_REGION}/publishers/google/models/${EMBED_MODEL}:predict`;
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
 * The row the search function checks a caller's model against. Read here for
 * the opposite reason: so a WRITE cannot disagree with it.
 */
async function fetchIndexModel() {
  const url = `${SUPABASE_URL}/rest/v1/index_meta?select=model,dims&source=eq.${INDEX_SOURCE}`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`index_meta read failed (${res.status}): ${await res.text()}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/** Which source_keys have no vector in this column yet. */
async function fetchKeysMissingVector() {
  const url =
    `${SUPABASE_URL}/rest/v1/corpus_chunks?select=source_key&source=eq.blueprint` +
    `&${EMBED_COLUMN}=is.null&limit=10000`;
  const res = await fetch(url, { headers: sbHeaders("read") });
  if (!res.ok) throw new Error(`missing-vector scan failed (${res.status}): ${await res.text()}`);
  return new Set((await res.json()).map((r) => r.source_key));
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
  const candidate = EMBED_COLUMN !== "embedding";

  // REFUSED BEFORE ANYTHING IS EMBEDDED: the column's own index_meta row must
  // name the model this pass is about to write. A candidate pass run without
  // `--model` would otherwise fill the candidate column with live-model
  // vectors — every score comes back plausible, and nothing downstream can
  // tell the measurement apart from a real one.
  const meta = await fetchIndexModel();
  if (!meta) {
    throw new Error(
      `${SCHEMA}.index_meta has no row for source "${INDEX_SOURCE}" — the column ` +
        `${EMBED_COLUMN} has nothing declaring which model it holds`,
    );
  }
  if (meta.model !== EMBED_MODEL) {
    throw new Error(
      `${EMBED_COLUMN} holds ${meta.model} (index_meta.source=${INDEX_SOURCE}), but this pass ` +
        `embeds with ${EMBED_MODEL} — pass --model=${meta.model}, or move the index_meta row first`,
    );
  }
  if (meta.dims !== EMBED_DIM) {
    throw new Error(`${EMBED_COLUMN} is declared ${meta.dims}-dim; this pass writes ${EMBED_DIM}`);
  }
  console.log(`[backfill] column ${EMBED_COLUMN} <- ${EMBED_MODEL} @ ${EMBED_DIM}`);

  // Only the Vertex SA path needs a Google token; the API-key path doesn't.
  const token = USE_API_KEY ? null : await getGoogleToken();
  const src = await fetchSourceRows();

  // Embed only what changed. The index stores the SOURCE row's updated_at (not
  // the embed time), so a row whose stored stamp already matches is current.
  //
  // This is tidiness, not relief: EMBED_BATCH is 100, so a full run is ~9 API
  // requests — negligible against any quota. It saves roughly $0.26/yr. Do not
  // let it mask a real staleness bug; --full forces everything, and a view
  // change (which alters chunk TEXT without touching cells.updated_at) REQUIRES
  // it, because no stamp moves when the view is redefined.
  let todo = src;
  if (full) {
    // everything
  } else if (candidate) {
    // A CANDIDATE pass cannot use the stamp: the live pass already stored each
    // row's source stamp, so every row looks current while its candidate
    // vector is still null. What is stale here is the COLUMN, so ask the
    // column.
    const missing = await fetchKeysMissingVector();
    todo = src.filter((r) => missing.has(r.source_key));
  } else {
    const known = await fetchIndexedStamps();
    todo = src.filter((r) => known.get(r.source_key) !== r.updated_at);
  }
  console.log(
    `[backfill] ${src.length} eligible chunks; ${todo.length} to embed` +
      `${full ? " (--full)" : ` (${src.length - todo.length} unchanged)`}`,
  );

  let done = 0;
  for (let i = 0; i < todo.length; i += EMBED_BATCH) {
    const batch = todo.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(token, batch.map((r) => r.chunk));
    const rows = batch.map((r, j) => ({
      source: "blueprint",
      source_key: r.source_key,
      title: r.title,
      // Deep link to the cell, not the app root. Every chunk used to carry the
      // same homepage URL, which is not a citation — it is a link to "go look
      // for it yourself". `?cell=` is the app's param (uno-blueprint
      // src/lib/urlViewState.ts) and source_key IS the cell id.
      ref_url: `${BLUEPRINT_URL.replace(/\/+$/, "")}/?cell=${r.source_key}`,
      chunk: r.chunk,
      // The column this pass fills — and ONLY that one. A candidate pass names
      // no other vector column, so the live vectors are not in the payload and
      // the upsert cannot touch them.
      [EMBED_COLUMN]: embeddings[j],
      // The SOURCE row's date, not now(). Stamping the embed time made every
      // chunk look freshly authored, so the "flag a stale blueprint" rule the
      // tool hands the model could never fire — the index always claimed today.
      updated_at: r.updated_at ?? new Date().toISOString(),
    }));
    await upsertChunks(rows);
    done += rows.length;
    console.log(`[backfill] upserted ${done}/${todo.length}`);
  }

  // The orphan pass DELETES rows, and it belongs to the live index's upkeep,
  // not to a scoring run. A candidate pass is measurement: it should not be
  // able to remove anything the bot serves.
  if (!candidate) {
    const removed = await pruneOrphans();
    if (removed > 0) console.log(`[backfill] pruned ${removed} orphaned chunk(s)`);
  }
  console.log("[backfill] done");
}

main().catch((err) => {
  console.error(`[backfill] FAILED: ${err.message}`);
  process.exit(1);
});
