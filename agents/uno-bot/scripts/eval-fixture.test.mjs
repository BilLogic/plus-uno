// Invariants of the eval fixture itself.
//
// #249 is a bug about instruments: a build stamp that said "bump me" and was
// not bumped, and a case count in prose that drifted from the count in the
// file. Both were conventions. The decisions made while fixing it — every
// blocker sampled, a majority deciding — are conventions too unless something
// checks them, so this file checks them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { passesCase } from "./eval-scoring.mjs";

const FIXTURE = new URL("../../../docs/evals/fixtures/uno-bot-cases.json", import.meta.url);
const README = new URL("../../../docs/evals/README.md", import.meta.url);
const PROTOTYPE_SEEDS = new URL("../../../docs/evals/fixtures/uno-prototype-seeds/", import.meta.url);

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

test("every case carries its rubric, in plain text", () => {
  // The inverse of what this asserted for one day. Hiding the judgeNote from
  // the bot by encrypting it hid it from every reviewer too, and the key went
  // to a write-only Actions secret — within a day nobody could read what a
  // case asserted. The bot is kept out by src/integrations/repo-read-guard.ts
  // instead, which holds at every ref and needs no secret.
  //
  // A case with no judgeNote is a case the judge grades on the rubric alone,
  // which is how P2 asserted a retired rule for eight days while reading green.
  const missing = cases.filter((c) => !String(c.judgeNote ?? "").trim()).map((c) => c.id);
  assert.deepEqual(missing, [], `case(s) with no rubric: ${missing.join(", ")}`);
});

test("every prototype seed has an answer key, and the guard withholds it", () => {
  // Plain text, deliberately. The earlier design sealed these with AES-256-GCM
  // and failed twice: the plaintext stayed in public git history, which
  // `githubReadPath`'s `ref` parameter reaches, so nothing was prevented; and
  // the key went to a write-only Actions secret, so within a day no human could
  // read the rubric to review it. `src/integrations/repo-read-guard.ts`
  // replaces both properties — it holds at every ref and needs no secret.
  const filenames = readdirSync(PROTOTYPE_SEEDS).sort();
  const seedPrds = filenames.filter((name) => /^seed-[^.]+\.md$/.test(name));
  assert.ok(seedPrds.length > 0, "no seed PRDs found");

  const categoryBearingNames = seedPrds.filter(
    (name) => !/^seed-\d+-(?:lowfi|midfi|hifi)\.md$/.test(name),
  );
  assert.deepEqual(
    categoryBearingNames,
    [],
    `seed filename(s) expose gap categories: ${categoryBearingNames.join(", ")}`,
  );

  const missing = seedPrds
    .map((name) => name.replace(/\.md$/, ".answers.md"))
    .filter((expected) => !filenames.includes(expected));
  assert.deepEqual(missing, [], `seed(s) with no answer key: ${missing.join(", ")}`);

  // That these paths are REFUSED to the bot is asserted in
  // tests/repo-read-guard.test.ts, which can import the guard: this file is
  // plain .mjs and node --test cannot load a .ts module from it.
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

test("a history assertion sits on a later turn of a multi-turn case", () => {
  // `expectHistory` asserts on what the runner SENT to a turn — the thread so
  // far. On a first turn that is always empty, so the assertion would pass
  // with nothing under test (C1, #426).
  for (const c of cases) {
    c.turns.forEach((turn, i) => {
      if ("expectHistory" in turn) assert.ok(i > 0, `${c.id} asserts history on its first turn`);
    });
    assert.equal("expectHistory" in c, false, `${c.id}: expectHistory is a turn key, not a case key`);
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
