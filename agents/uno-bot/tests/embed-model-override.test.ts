// `/debug/blueprint-search?embed_model=` — the half of a candidate measurement
// that `?rpc=` does not cover.
//
// WHY IT EXISTS: a candidate search function reads a candidate COLUMN, and the
// function refuses a caller whose model does not match the index it is reading.
// So pointing the route at `search_blueprint_cand001` while the Worker went on
// embedding with the live model produced `embedding model mismatch` and no
// measurement at all — a candidate RANKING was scoreable, a candidate INDEX
// was not.
//
// WHAT CAN GO WRONG, and why it is asserted rather than reasoned about:
//
//   the allow-list admits a name the index has never heard of, and the
//   database scores that vector as noise rather than refusing it — a typo
//   comes back as a plausible number instead of an error, which is worse than
//   a failure because somebody writes it down
//
//   the model reaches the embedding call but not the argument the function
//   checks, so the query is embedded with one model and declared as another,
//   which is the exact mismatch the declaration exists to catch
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCOREABLE_EMBED_MODELS,
  isScoreableEmbedModel,
} from "../src/integrations/candidate-rpc";
import { embedModelName } from "../src/vertex/embed-model";
import type { EmbedCredentials } from "../src/vertex/embed-model";

const WITH_SA: EmbedCredentials = {
  GEMINI_SA_EMAIL: "bot@example.iam.gserviceaccount.com",
  GEMINI_SA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----\n",
  GEMINI_PROJECT_ID: "a-project",
};

const WITHOUT_SA: EmbedCredentials = { GEMINI_API_KEY: "a-local-dev-key" };

// A deployment that names a project but never got the key pair. It must NOT
// count as the SA path: it would declare 005 while embedding through the other
// transport, which is the mismatch by hand.
const HALF_SA: EmbedCredentials = { GEMINI_PROJECT_ID: "a-project" };

test("the two models in play are scoreable, and nothing else is", () => {
  assert.ok(isScoreableEmbedModel("text-embedding-005"));
  assert.ok(isScoreableEmbedModel("gemini-embedding-001"));
  // The deprecated one is NOT admitted. It was this bot's own fallback until
  // Google retired it on 2026-01-14, and it is 768-dim like the live model —
  // so a vector from it fits the column, scores as noise, and looks fine.
  assert.equal(isScoreableEmbedModel("text-embedding-004"), false);
  for (const attempt of [
    "gemini-embedding-2",
    "gemini-embedding-001 ",
    "GEMINI-EMBEDDING-001",
    "text-embedding-3-small",
    "",
  ]) {
    assert.equal(
      isScoreableEmbedModel(attempt),
      false,
      `admitted ${JSON.stringify(attempt)}`,
    );
  }
});

test("the list is a closed set, so adding a third model is deliberate", () => {
  assert.deepEqual([...SCOREABLE_EMBED_MODELS], [
    "text-embedding-005",
    "gemini-embedding-001",
  ]);
});

test("an override names itself, so the query is declared as what it was embedded with", () => {
  // One function answers both questions — which model to call, and which model
  // to declare to the database — precisely so the two cannot disagree.
  assert.equal(embedModelName(WITH_SA), "text-embedding-005");
  assert.equal(
    embedModelName(WITH_SA, "gemini-embedding-001"),
    "gemini-embedding-001",
  );
});

test("a half-configured service account is not the service-account path", () => {
  assert.equal(embedModelName(HALF_SA), "gemini-embedding-001");
});

test("without a service account, local dev speaks the model the index is moving to", () => {
  // It used to answer `text-embedding-004`, which had been a dead endpoint for
  // months. `gemini-embedding-001` is reachable through both the service
  // account and a personal key, which is the property that lets one index
  // serve the bot and a person's own browser key.
  assert.equal(embedModelName(WITHOUT_SA), "gemini-embedding-001");
  assert.equal(embedModelName(WITHOUT_SA, "text-embedding-005"), "text-embedding-005");
});
