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
//   EMBED_MODEL    default "text-embedding-004" (AI Studio) / "text-embedding-005" (Vertex)
//   EMBED_REGION   default "us-central1"  (Vertex path only; "global" does not serve embeddings)
//   BLUEPRINT_URL  default "https://uno-blueprint.netlify.app/"  (citation base)
//
// Run:  node scripts/backfill-semantic-search.mjs

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
// Studio key (004) only when no SA exists. Never mix models in one index.
const USE_API_KEY = !(GEMINI_SA_EMAIL && GEMINI_SA_PRIVATE_KEY && GEMINI_PROJECT_ID) && Boolean(GEMINI_API_KEY);
const EMBED_MODEL = process.env.EMBED_MODEL ?? (USE_API_KEY ? "text-embedding-004" : "text-embedding-005");

const SCHEMA = "semantic_search";
const EMBED_DIM = 768;
const EMBED_BATCH = 100; // Vertex predict accepts up to 250 instances/request.

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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
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
async function upsertChunks(rows) {
  const url = `${SUPABASE_URL}/rest/v1/corpus_chunks?on_conflict=source,source_key`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...sbHeaders("write"), prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert failed (${res.status}): ${await res.text()}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Only the Vertex SA path needs a Google token; the API-key path doesn't.
  const token = USE_API_KEY ? null : await getGoogleToken();
  const src = await fetchSourceRows();
  console.log(`[backfill] ${src.length} blueprint chunks to embed`);

  let done = 0;
  for (let i = 0; i < src.length; i += EMBED_BATCH) {
    const batch = src.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(token, batch.map((r) => r.chunk));
    const rows = batch.map((r, j) => ({
      source: "blueprint",
      source_key: r.source_key,
      title: r.title,
      ref_url: BLUEPRINT_URL,
      chunk: r.chunk,
      embedding: embeddings[j],
      updated_at: new Date().toISOString(),
    }));
    await upsertChunks(rows);
    done += rows.length;
    console.log(`[backfill] upserted ${done}/${src.length}`);
  }
  console.log("[backfill] done");
}

main().catch((err) => {
  console.error(`[backfill] FAILED: ${err.message}`);
  process.exit(1);
});
