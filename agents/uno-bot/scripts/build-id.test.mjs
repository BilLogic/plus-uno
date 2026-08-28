// The build stamp's derivation, pinned.
//
// #249: `BUILD` was a hand-edited constant with "bump on every release round"
// written above it. r73 stood through 24 commits and 54 deploys; r75 then stood
// through three more. Three eval runs across three different builds all
// reported the same string and were indistinguishable in their own artifacts —
// which is the exact failure the constant was introduced to prevent, pointing
// the other way. Nothing was stale except the label.
//
// So the derivation is a function of the deploy environment, and it is tested
// rather than trusted. The property that matters is NOT the format: it is that
// two deploys of two different commits can never produce the same string.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildId } from "./build-id.mjs";

test("a CI deploy is identified by its run number and commit", () => {
  assert.equal(
    buildId({ runNumber: "412", sha: "80035c2f1a9b4c7d8e6f0a1b2c3d4e5f6a7b8c9d" }),
    "r412-80035c2",
  );
});

test("the sha is short, and short means seven", () => {
  // Long enough to be unambiguous in this repo, short enough to read in a log
  // line and to type into `git show`.
  const id = buildId({ runNumber: "1", sha: "abcdef0123456789abcdef0123456789abcdef01" });
  assert.equal(id, "r1-abcdef0");
});

test("two commits in the same run cannot collide", () => {
  // The whole point. A hand-typed constant fails exactly here.
  const a = buildId({ runNumber: "9", sha: "1111111111111111111111111111111111111111" });
  const b = buildId({ runNumber: "9", sha: "2222222222222222222222222222222222222222" });
  assert.notEqual(a, b);
});

test("two separate runs of the same commit are distinguishable", () => {
  // Redeploying the same commit from a later push still gets its own stamp.
  //
  // NOT true of a RE-RUN: GITHUB_RUN_NUMBER is stable across attempts of one
  // run (GITHUB_RUN_ATTEMPT is what increments), so re-running a deploy
  // produces the same stamp. That is deliberate — the same commit bundled the
  // same way is the same build, and the health check compares equal either way.
  // Stated here so nobody reads this test as a promise it does not make.
  const a = buildId({ runNumber: "9", sha: "1111111111111111111111111111111111111111" });
  const b = buildId({ runNumber: "10", sha: "1111111111111111111111111111111111111111" });
  assert.notEqual(a, b);
});

test("run numbers order deploys, which a sha alone cannot", () => {
  // `r9-...` vs `r10-...`: the run number is what says which is newer. Asserted
  // because someone simplifying to a bare sha would lose it silently.
  assert.ok(buildId({ runNumber: "10", sha: "a".repeat(40) }).startsWith("r10-"));
  assert.ok(buildId({ runNumber: "9", sha: "a".repeat(40) }).startsWith("r9-"));
});

test("outside CI it says so, rather than inventing a release number", () => {
  // A local `wrangler deploy` must not mint something that looks like a CI
  // build. "dev" is unmistakable in a health response and in an eval artifact.
  assert.equal(buildId({}), "dev");
  assert.equal(buildId({ runNumber: "", sha: "" }), "dev");
  assert.equal(buildId({ runNumber: "412" }), "dev");
  assert.equal(buildId({ sha: "80035c2f1a9b" }), "dev");
});

test("the result is safe to embed in a shell argument and a JSON body", () => {
  // It reaches wrangler through `--define` and comes back out of /health and
  // the JSON of half a dozen routes. Anything outside this alphabet would need
  // escaping somewhere and would eventually not get it.
  for (const env of [
    { runNumber: "412", sha: "80035c2f1a9b4c7d8e6f0a1b2c3d4e5f6a7b8c9d" },
    {},
  ]) {
    assert.match(buildId(env), /^[a-z0-9-]+$/);
  }
});
