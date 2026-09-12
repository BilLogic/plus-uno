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
  type IndexMetaRead,
} from "../src/integrations/index-model";

const WITH_SA = {
  GEMINI_SA_EMAIL: "bot@example.iam.gserviceaccount.com",
  GEMINI_SA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----\n",
  GEMINI_PROJECT_ID: "a-project",
};

/** Answer every read with `model`, and count the reads.
 *
 *  The read is a parameter, not the global: this module is handed the metered
 *  fetch by its caller, so a test hands it one too and nothing patches
 *  `globalThis`. */
function stubIndexMeta(model: string | null): { read: IndexMetaRead; calls: () => number } {
  let calls = 0;
  const read: IndexMetaRead = async () => {
    calls += 1;
    return new Response(JSON.stringify(model === null ? [] : [{ model }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { read, calls: () => calls };
}

/** A read that never answers. */
const readThatFails: IndexMetaRead = async () => {
  throw new Error("network");
};

test("the model is read from the index, not from the credentials", async () => {
  forgetIndexModel("blueprint");
  const stub = stubIndexMeta("gemini-embedding-001");
  // The service account implies `text-embedding-005`. The index says
  // otherwise, and the index is the one that has to be satisfied.
  assert.equal(
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read),
    "gemini-embedding-001",
  );
});

test("the answer is held, so a search is not a metadata read", async () => {
  forgetIndexModel("blueprint");
  const stub = stubIndexMeta("gemini-embedding-001");
  await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read);
  await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read);
  await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read);
  assert.equal(stub.calls(), 1);
});

test("forgetting makes the next resolve read the row again", async () => {
  forgetIndexModel("blueprint");
  let stub = stubIndexMeta("text-embedding-005");
  assert.equal(
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read),
    "text-embedding-005",
  );
  // The swap lands. Without forgetting, this Worker would go on declaring the
  // old model for the rest of the cache window — which is the window the
  // mismatch retry exists to close.
  forgetIndexModel("blueprint");
  stub = stubIndexMeta("gemini-embedding-001");
  assert.equal(
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read),
    "gemini-embedding-001",
  );
});

test("a failed read falls back to the credential-implied model", async () => {
  forgetIndexModel("blueprint");
  assert.equal(
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", readThatFails),
    "text-embedding-005",
  );
});

test("a row that names no model is not an answer", async () => {
  forgetIndexModel("blueprint");
  const stub = stubIndexMeta(null);
  assert.equal(
    await resolveIndexModel(WITH_SA, "https://db.example", "anon-key", stub.read),
    "text-embedding-005",
  );
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
