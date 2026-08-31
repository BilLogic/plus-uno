import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  attachJudgeNotes,
  loadAnswerKey,
  sealAnswerKey,
} from "./eval-answer-key.mjs";

const KEY = "44d0d0708998b4c8e9fc83adfbd09f774ddc7df8bbf602e6fcf3eecac84ca494";
const CASES = { cases: [{ id: "A", name: "alpha" }, { id: "B", name: "beta" }] };
const ANSWERS = { A: "alpha stays private", B: "beta stays private" };

test("the runner decrypts an authenticated answer key", () => {
  const dir = mkdtempSync(join(tmpdir(), "uno-eval-key-"));
  const path = join(dir, "answers.enc.json");
  writeFileSync(path, sealAnswerKey(ANSWERS, KEY));

  assert.deepEqual(loadAnswerKey(path, KEY), ANSWERS);
});

test("a wrong key cannot produce grader instructions", () => {
  const dir = mkdtempSync(join(tmpdir(), "uno-eval-key-"));
  const path = join(dir, "answers.enc.json");
  writeFileSync(path, sealAnswerKey(ANSWERS, KEY));

  assert.throws(
    () => loadAnswerKey(path, "11".repeat(32)),
    /decrypt eval answer key/i,
  );
});

test("every public case receives exactly one private judge note", () => {
  assert.deepEqual(attachJudgeNotes(CASES, ANSWERS), {
    cases: [
      { id: "A", name: "alpha", judgeNote: "alpha stays private" },
      { id: "B", name: "beta", judgeNote: "beta stays private" },
    ],
  });

  assert.throws(() => attachJudgeNotes(CASES, { A: "only one" }), /missing.*B/i);
  assert.throws(() => attachJudgeNotes(CASES, { ...ANSWERS, C: "extra" }), /unknown.*C/i);
  assert.throws(
    () => attachJudgeNotes({ cases: [{ id: "A", judgeNote: "public" }] }, { A: "private" }),
    /public.*judgeNote/i,
  );
});
