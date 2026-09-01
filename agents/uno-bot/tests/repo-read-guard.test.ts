// The bot must not read the file that says what a passing answer looks like.
//
// This repository is public and holds its own grader instructions. The first
// attempt at closing that hole encrypted the answer key, and it failed twice
// over: the plaintext stayed in public git history (every judgeNote is still
// at `02776be3^`, and `githubReadPath` takes a `ref`), and the key went to a
// write-only Actions secret, so within a day nobody could read the rubric to
// review it. The guard replaces both properties — it holds at every ref, and
// it keeps the answer key legible to humans.
//
// The cases below are the ways around it that a normalisation bug would open.
import { describe, it } from "node:test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { isWithheldRepoPath, WITHHELD_NOTE } from "../src/integrations/repo-read-guard";

describe("the eval corpus is withheld from the bot", () => {
  it("withholds the answer key and the cases beside it", () => {
    for (const path of [
      "docs/evals/fixtures/uno-bot-cases.json",
      "docs/evals/fixtures/uno-prototype-seeds/seed-1-lowfi.md",
      "docs/evals/rubrics/uno-bot.md",
      "docs/evals/runs/2026-08-02-cursor-scenario-map/README.md",
    ]) {
      assert.equal(isWithheldRepoPath(path), true, path);
    }
  });

  it("the same path spelled differently is the same path", () => {
    // A guard that only catches one spelling is a guard against typos. The
    // `blob/<ref>/` form matters most: it is how a github.com URL names a
    // HISTORICAL read, which is the route encryption never closed.
    for (const path of [
      "/docs/evals/fixtures/uno-bot-cases.json",
      "./docs/evals/fixtures/uno-bot-cases.json",
      "docs//evals//fixtures/uno-bot-cases.json",
      "https://github.com/BilLogic/plus-uno/blob/main/docs/evals/fixtures/uno-bot-cases.json",
      "https://github.com/BilLogic/plus-uno/blob/02776be3/docs/evals/fixtures/uno-bot-cases.json",
      "https://raw.githubusercontent.com/BilLogic/plus-uno/02776be3/docs/evals/fixtures/uno-bot-cases.json",
    ]) {
      assert.equal(isWithheldRepoPath(path), true, path);
    }
  });

  it("leaves the rest of the repository alone", () => {
    // The guard is narrow on purpose: github_read is how the bot confirms a
    // component exists before naming it (R8), and breaking that to protect
    // the evals would trade a real capability for a measurement.
    for (const path of [
      "design-system/src/components/Badge/Badge.tsx",
      "design-system/src/tokens/_colors.scss",
      "agents/uno-bot/AGENT.md",
      "docs/adr/020-requester-scoped-slack-visibility-per-user-tokens-own.md",
      "docs/connectors/figma.md",
      "docs/plans/2026-07-09-001-refactor-uno-bot-architecture-consolidation-plan.md",
    ]) {
      assert.equal(isWithheldRepoPath(path), false, path);
    }
  });

  it("a path that merely mentions the words is not the corpus", () => {
    assert.equal(isWithheldRepoPath("docs/evaluation/notes.md"), false);
    assert.equal(isWithheldRepoPath("src/docs-evals-helper.ts"), false);
    assert.equal(isWithheldRepoPath("agents/uno-bot/scripts/run-evals.mjs"), false);
  });

  it("empty and malformed input is not withheld", () => {
    // The caller reports "missing path" for these; swallowing them here would
    // turn a usage error into a refusal and hide the real message.
    assert.equal(isWithheldRepoPath(""), false);
    assert.equal(isWithheldRepoPath("   "), false);
    assert.equal(isWithheldRepoPath(undefined as unknown as string), false);
  });

  it("covers every file that actually sits in the eval corpus today", () => {
    // The pairing rule lives in scripts/eval-fixture.test.mjs, which is plain
    // .mjs and cannot import this module. This is the other half: the answer
    // keys are kept in PLAIN TEXT, and the only thing making that safe is the
    // guard. If it ever stops covering the directory, this goes red before the
    // rubric goes readable to the thing being graded.
    // Resolved from the working directory, not import.meta: the test build is
    // CommonJS, and `npm test` runs at agents/uno-bot. Same convention as
    // tests/write-surface's REPO_ROOT.
    const seeds = "docs/evals/fixtures/uno-prototype-seeds";
    const names = readdirSync(resolve(process.cwd(), "../..", seeds));
    assert.ok(names.some((n) => n.endsWith(".answers.md")), "no plaintext answer key to protect");
    for (const name of names) {
      assert.equal(isWithheldRepoPath(`${seeds}/${name}`), true, name);
    }
    assert.equal(isWithheldRepoPath("docs/evals/fixtures/uno-bot-cases.json"), true);
  });

  it("the refusal names its cause and a route, per AGENT.md § My lane", () => {
    assert.match(WITHHELD_NOTE, /grader instructions/i);
    assert.match(WITHHELD_NOTE, /github\.com/i);
  });
});
