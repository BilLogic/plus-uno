// Invariants of the eval fixture itself.
//
// #249 is a bug about instruments: a build stamp that said "bump me" and was
// not bumped, and a case count in prose that drifted from the count in the
// file. Both were conventions. The decisions made while fixing it — every
// blocker sampled, a majority deciding — are conventions too unless something
// checks them, so this file checks them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { passesCase } from "./eval-scoring.mjs";

const FIXTURE = new URL("../../../docs/evals/fixtures/uno-bot-cases.json", import.meta.url);
const README = new URL("../../../docs/evals/README.md", import.meta.url);
const SEED_ONE_PLAINTEXT = new URL(
  "../../../docs/evals/fixtures/uno-prototype-seeds/seed-1-lowfi-missing-flows.answers.md",
  import.meta.url,
);
const SEED_ONE_ENCRYPTED = new URL(
  "../../../docs/evals/fixtures/uno-prototype-seeds/seed-1-lowfi-missing-flows.answers.enc.json",
  import.meta.url,
);

const raw = JSON.parse(readFileSync(FIXTURE, "utf8"));
const cases = Array.isArray(raw) ? raw : raw.cases;
const samplesOf = (c) => (Number.isInteger(c.samples) && c.samples > 1 ? c.samples : 1);

test("the fixture parses and holds cases", () => {
  assert.ok(Array.isArray(cases) && cases.length > 0);
});

test("every case id is unique", () => {
  const ids = cases.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate case id");
});

test("the public fixture contains no grader answer key", () => {
  const exposed = cases.filter((c) => Object.hasOwn(c, "judgeNote")).map((c) => c.id);
  assert.deepEqual(exposed, [], `public judgeNote(s): ${exposed.join(", ")}`);
});

test("seed 1 exposes no plaintext grader answer", () => {
  assert.equal(existsSync(SEED_ONE_PLAINTEXT), false, "seed 1 plaintext answer key is public");
  const envelopeText = readFileSync(SEED_ONE_ENCRYPTED, "utf8");
  const envelope = JSON.parse(envelopeText);
  assert.deepEqual(Object.keys(envelope).sort(), ["algorithm", "ciphertext", "iv", "tag", "version"]);
  assert.equal(envelope.algorithm, "aes-256-gcm");
  assert.equal(typeof envelope.ciphertext, "string");
});

test("no blocker is decided by a single judge call", () => {
  // THE DECISION THIS FILE EXISTS TO HOLD. R3, R5, R6, R7, R9 and P2 were
  // blockers at 1 sample, so their red/green turned on one model verdict
  // regardless of what the pass rule is. A majority of one is not a majority.
  const single = cases.filter((c) => c.blocker && samplesOf(c) === 1).map((c) => c.id);
  assert.deepEqual(single, [], `blocker(s) at 1 sample: ${single.join(", ")}`);
});

test("a sampled case uses an odd count, so a majority always exists", () => {
  // 2 of 4 is a split and `passesCase` calls it a fail — defensible, but it
  // means an even sample count spends a run buying nothing. Odd counts make the
  // rule and the cost agree.
  for (const c of cases) {
    const n = samplesOf(c);
    assert.equal(n % 2, 1, `${c.id} has ${n} samples; use an odd count`);
  }
});

test("every blocker survives one dissenting judge", () => {
  // Stated as a property of the fixture rather than of the rule, because it is
  // the combination that matters: the rule is a majority, and the fixture must
  // give each blocker enough samples for a majority to absorb one bad call.
  for (const c of cases.filter((c) => c.blocker)) {
    const n = samplesOf(c);
    assert.equal(passesCase(n - 1, n), true, `${c.id} fails at ${n - 1}/${n}`);
  }
});

test("the README's case count matches the fixture", () => {
  // It said 16 while the file held 20 — R20 and S1–S3 were added without it.
  // A number in prose that nothing compares is a number that will be wrong.
  const readme = readFileSync(README, "utf8");
  const claimed = readme.match(/carries \*\*(\d+) cases\*\*/);
  assert.ok(claimed, "docs/evals/README.md no longer states a case count in the expected form");
  assert.equal(
    Number(claimed[1]),
    cases.length,
    `README says ${claimed[1]} cases, fixture holds ${cases.length}`,
  );
});
