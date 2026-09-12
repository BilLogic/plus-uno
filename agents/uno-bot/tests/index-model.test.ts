// The model comes from the index, not from a constant in the Worker.
//
// WHY IT IS ASSERTED. A vector index and its caller must agree on one model,
// and the database enforces that by refusing the pairing. So the two ways
// this module can be wrong are both silent until a search fails: it can cache
// an answer past the moment the index changed, and it can fail to notice that
// the mismatch it was just handed is exactly the error a re-read fixes.
//
// The fallback is asserted for the opposite reason: a metadata read that
// times out must not take the search down with it. A search answered with the
// credential-implied model either works — because the index still names that
// model — or fails loudly at the database, which is where the check belongs.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  forgetIndexModel,
  indexSource,
  isModelMismatch,
  resolveIndexModel,
} from "../src/integrations/index-model";

const WITH_SA = {
  GEMINI_SA_EMAIL: "bot@example.iam.gserviceaccount.com",
  GEMINI_SA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----\n",
  GEMINI_PROJECT_ID: "a-project",
};

type Fetch = typeof globalThis.fetch;

/** Answer every read with `model`, and count the reads. */
function stubIndexMeta(model: string | null): { calls: () => number; restore: () => void } {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify(model === null ? [] : [{ model }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as Fetch;
  return { calls: () => calls, restore: () => { globalThis.fetch = original; } };
}

test("the model is read from the index, not from the credentials", async () => {
  forgetIndexModel("blueprint");
  const stub = stubIndexMeta("gemini-embedding-001");
  try {
    // The service account implies `text-embedding-005`. The index says
    // otherwise, and the index is the one that has to be satisfied.
    assert.equal(
      await resolveIndexModel(WITH_SA, "https://db.example", "anon-key"),
      "gemini-embedding-001",
    );
  } finally {
    stub.restore();
  }
});

test("the answer is held, so a search is not a metadata read", async () => {
  forgetIndexModel("blueprint");
  const stub = stubIndexMeta("gemini-embedding-001");
  try {
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key");
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key");
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key");
    assert.equal(stub.calls(), 1);
  } finally {
    stub.restore();
  }
});

test("forgetting makes the next resolve read the row again", async () => {
  forgetIndexModel("blueprint");
  let stub = stubIndexMeta("text-embedding-005");
  try {
    assert.equal(
      await resolveIndexModel(WITH_SA, "https://db.example", "anon-key"),
      "text-embedding-005",
    );
  } finally {
    stub.restore();
  }
  // The swap lands. Without forgetting, this Worker would go on declaring the
  // old model for the rest of the cache window — which is the window the
  // mismatch retry exists to close.
  forgetIndexModel("blueprint");
  stub = stubIndexMeta("gemini-embedding-001");
  try {
    assert.equal(
      await resolveIndexModel(WITH_SA, "https://db.example", "anon-key"),
      "gemini-embedding-001",
    );
  } finally {
    stub.restore();
  }
});

test("a failed read falls back to the credential-implied model", async () => {
  forgetIndexModel("blueprint");
  const original = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("network"); }) as Fetch;
  try {
    assert.equal(
      await resolveIndexModel(WITH_SA, "https://db.example", "anon-key"),
      "text-embedding-005",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("a row that names no model is not an answer", async () => {
  forgetIndexModel("blueprint");
  const stub = stubIndexMeta(null);
  try {
    assert.equal(
      await resolveIndexModel(WITH_SA, "https://db.example", "anon-key"),
      "text-embedding-005",
    );
  } finally {
    stub.restore();
  }
});

test("each function reads the index it searches", () => {
  assert.equal(indexSource("search_blueprint"), "blueprint");
  assert.equal(indexSource("search_blueprint_cand001"), "blueprint_cand001");
  // A name this does not recognise answers for the live index rather than
  // inventing a source that no row describes.
  assert.equal(indexSource("something_else"), "blueprint");
});

test("only the index's own refusal is a mismatch", () => {
  assert.equal(
    isModelMismatch(
      new Error(
        "Supabase rpc search_blueprint 400 P0001: embedding model mismatch: caller=x index=y",
      ),
    ),
    true,
  );
  assert.equal(isModelMismatch(new Error("Supabase rpc search_blueprint 503")), false);
  assert.equal(isModelMismatch("embedding model mismatch"), false);
});
