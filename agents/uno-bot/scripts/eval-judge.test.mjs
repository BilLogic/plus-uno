// The judge grades against the rubric document, and against all of it (#511).
//
// THE PROPERTY THIS FILE HOLDS: every dimension docs/evals/rubrics/bot-answer.md
// declares reaches the judge's system prompt, verbatim. The prompt used to
// carry a hand-written paraphrase of five of the nine, so a dimension added or
// sharpened in the document changed nothing about what was measured — and
// nothing said so. This test is what makes that silence impossible.
//
// The credential's own property is here too: the judge asks for a token PER
// CASE. The fake below issues tokens that EXPIRE, and rejects a bearer it
// issued more than an hour of fake-clock ago, so a judge that captures one
// token fails this file rather than a Monday run (#657).
//
// And the second half: the credential, the call, the cut and the fail-open are
// exercised here with no network and no service account, because they are the
// judge module's now rather than closures in the runner.
//
// The fail-open half carries its own property, asserted from "a skip is not a
// pass" downwards: every skip names a reason, no two no-judge reasons share a
// name, and the tally a run publishes counts what was graded rather than what
// came out green. An expired service account must not read like a deliberate
// deterministic-only run — that is the same thing as the suite being honest
// about what it measured.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import {
  DEFAULT_JUDGE_MODEL,
  JUDGE_TIER,
  JUDGE_TIER_DIALS,
  RUBRIC_PATH,
  UNRECORDED_SKIP_REASON,
  describeRubric,
  describeTally,
  dimensionIds,
  TOKEN_SAFETY_MS,
  extractBlock,
  googleAccessToken,
  googleTokenSource,
  judgeFromEnv,
  judgeSkipped,
  judgeSystem,
  judgeTally,
  loadRubric,
  noJudge,
  vertexJudge,
} from "./eval-judge.mjs";

/** A throwaway RSA key: the signing is real, the service account is not. */
const TEST_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
}).privateKey;

test("the canonical rubric loads, and carries the nine dimensions it is named for", () => {
  const rubric = loadRubric();
  assert.deepEqual(rubric.ids, ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]);
  assert.equal(describeRubric(rubric), "9 dimensions (D1–D9)");
});

test("every D-id in the document reaches the judge prompt, with its definition", () => {
  const doc = readFileSync(RUBRIC_PATH, "utf8");
  const ids = dimensionIds(extractBlock(doc, "dimensions"));
  assert.ok(ids.length >= 9, `the document declares ${ids.length} dimensions`);
  const prompt = judgeSystem(loadRubric());
  for (const id of ids) {
    assert.ok(prompt.includes(`id: ${id}`), `${id} is in the rubric but not in the judge prompt`);
  }
  // Verbatim, not summarised: the definitions travel as written. D9's clause
  // about the retired confidence affix is the one the old paraphrase had to
  // restate by hand.
  assert.ok(
    prompt.includes("the retired trailing high/medium/low affix must NOT appear"),
    "the dimension definitions must reach the prompt as written, not as a précis",
  );
  assert.ok(prompt.includes("docs/evals/rubrics/bot-answer.md"), "the prompt cites where the rubric came from");
  assert.ok(prompt.includes('{"verdict":"pass"}'), "the prompt still asks for the strict-JSON verdict");
});

test("a rubric edit reaches the prompt without touching the prompt", () => {
  // A tenth dimension, invented here: the loader reads the document, so the
  // prompt grows a D10 nobody wrote into the prompt.
  const doc = readFileSync(RUBRIC_PATH, "utf8").replace(
    "hard_gates:",
    '  - id: D10\n    definition: "a dimension added today"\nhard_gates:',
  );
  const block = extractBlock(doc, "dimensions");
  const ids = dimensionIds(block);
  assert.equal(ids[ids.length - 1], "D10");
  const prompt = judgeSystem({ block, ids });
  assert.ok(prompt.includes("a dimension added today"));
});

test("the block stops at the next top-level key, and keeps its own indentation", () => {
  const doc = ["---", "scale: 1-5", "dimensions:", "  - id: D1", '    definition: "x"', "hard_gates:", "  - never", "---", "", "# body"].join("\n");
  assert.equal(extractBlock(doc, "dimensions"), 'dimensions:\n  - id: D1\n    definition: "x"');
  assert.equal(extractBlock(doc, "hard_gates"), "hard_gates:\n  - never");
  assert.equal(extractBlock(doc, "absent"), "");
  assert.equal(extractBlock("# no frontmatter\n", "dimensions"), "");
});

test("a document with no dimensions is an error, not a judge with no rubric", () => {
  assert.throws(() => loadRubric(new URL("./eval-judge.mjs", import.meta.url)), /no dimensions block/);
});

// ── The judge as a dependency: credential, call, truncation, fail-open ────────

/** A fetch that records what it was asked and replies with what it is told. */
function fakeFetch(reply) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return typeof reply === "function" ? reply(url, init) : reply;
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

/** A Vertex generateContent 200 carrying `text` as the model's only part. */
function vertexReply(text) {
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) };
}

const CASE = { id: "R3", name: "a share-out is proposed", judgeNote: "the bot proposes rather than posts" };

test("the judge posts the rubric and the case to the model, and reads the verdict back", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = vertexJudge({
    accessToken: async () => "ya29.fake",
    rubric: loadRubric(),
    model: "gemini-3.1-pro-preview",
    projectId: "hcii-plus",
    fetchImpl,
  });

  assert.equal(
    j.name,
    "gemini-3.1-pro-preview at high (the grind tier) against 9 dimensions (D1–D9) from docs/evals/rubrics/bot-answer.md",
  );
  assert.deepEqual(await j.judgeCase(CASE, { turns: [] }), { verdict: "pass" });

  const [{ url, init }] = fetchImpl.calls;
  assert.equal(
    url,
    "https://aiplatform.googleapis.com/v1/projects/hcii-plus/locations/global/publishers/google/models/gemini-3.1-pro-preview:generateContent",
  );
  assert.equal(init.headers.authorization, "Bearer ya29.fake");
  const body = JSON.parse(init.body);
  assert.match(body.systemInstruction.parts[0].text, /id: D9/, "the rubric travels in the system instruction");
  assert.match(body.contents[0].parts[0].text, /Case R3 — a share-out is proposed/);
  assert.match(body.contents[0].parts[0].text, /the bot proposes rather than posts/);
  // THE TIER'S LEVEL, not one the judge picked (#605). It was "low" beside
  // grind's model until then — a pair no tier described (ADR-028).
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "high");
});

// A RATCHET over the one thing this file cannot import. The Worker's grind row
// lives in TypeScript (src/agent/gemini-tiers.ts) and a Node script cannot read
// it, so `JUDGE_TIER_DIALS` restates it — and a restatement with nothing
// holding it is how the rubric paraphrase this module deleted got there. Move
// grind on the Worker and this fails until the judge moves with it.
test("the judge's grind tier is the Worker adapter's grind tier", () => {
  const tiers = readFileSync(new URL("../src/agent/gemini-tiers.ts", import.meta.url), "utf8");
  const row = /grind:\s*\{\s*model:\s*"([^"]+)",\s*level:\s*"([^"]+)"\s*\}/.exec(tiers);
  assert.ok(row, "GEMINI_TIERS.grind is not where this test expects it");
  assert.equal(JUDGE_TIER, "grind");
  assert.deepEqual(JUDGE_TIER_DIALS, { model: row[1], level: row[2] });
  assert.equal(DEFAULT_JUDGE_MODEL, row[1]);
});

test("thinking_level is a 3.x key — an older judge model is not sent one", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"fail","reason":"it posted"}'));
  const j = vertexJudge({ accessToken: async () => "t", rubric: loadRubric(), model: "gemini-2.5-pro", projectId: "p", fetchImpl });
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "fail", reason: "it posted" });
  assert.equal(JSON.parse(fetchImpl.calls[0].init.body).generationConfig.thinkingConfig, undefined);
});

test("a transcript longer than the cut is truncated, and says so where the judge can read it", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = vertexJudge({ accessToken: async () => "t", rubric: loadRubric(), model: "m", projectId: "p", fetchImpl, transcriptChars: 200 });
  await j.judgeCase(CASE, { turns: [{ text: "x".repeat(5000) }] });
  const sent = JSON.parse(fetchImpl.calls[0].init.body).contents[0].parts[0].text;
  assert.match(sent, /…\[transcript truncated at 200 chars — judge only what is shown\]/);
  assert.ok(sent.length < 600, "the cut actually cut");
});

test("a transcript inside the cut travels whole, with no truncation marker", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = vertexJudge({ accessToken: async () => "t", rubric: loadRubric(), model: "m", projectId: "p", fetchImpl });
  const transcript = { turns: [{ text: "short" }] };
  await j.judgeCase(CASE, transcript);
  const sent = JSON.parse(fetchImpl.calls[0].init.body).contents[0].parts[0].text;
  assert.ok(sent.includes(JSON.stringify(transcript)));
  assert.ok(!sent.includes("truncated at"));
});

test("the judge fails OPEN: a thrown call, an HTTP error and unparseable output all skip", async () => {
  const thrown = vertexJudge({
    accessToken: async () => "t",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: async () => {
      throw new Error("ECONNRESET");
    },
  });
  assert.deepEqual(await thrown.judgeCase(CASE, {}), { verdict: "skipped", reason: "ECONNRESET" });

  const http500 = vertexJudge({
    accessToken: async () => "t",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: fakeFetch({ ok: false, status: 500, json: async () => ({ error: { message: "boom" } }) }),
  });
  // A rejected call names the status, not a parse failure: the body is unread.
  assert.deepEqual(await http500.judgeCase(CASE, {}), {
    verdict: "skipped",
    reason: "judge call rejected (HTTP 500)",
  });

  const babble = vertexJudge({
    accessToken: async () => "t",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: fakeFetch(vertexReply("I think it is fine, honestly")),
  });
  assert.deepEqual(await babble.judgeCase(CASE, {}), {
    verdict: "skipped",
    reason: "unparseable judge output (HTTP 200)",
  });

  // Every one of those is a SKIP WITH A REASON. A skip failing open to a green
  // case is only tolerable while the run can still say the case was not graded
  // and why, so a reasonless skip is the shape this module must not produce.
  for (const [what, judge] of [["thrown", thrown], ["HTTP error", http500], ["babble", babble]]) {
    const v = await judge.judgeCase(CASE, {});
    assert.equal(v.verdict, "skipped");
    assert.ok(v.reason && v.reason !== UNRECORDED_SKIP_REASON, `the ${what} skip records no reason`);
  }
});

test("a skip is a verdict with a reason, and a reasonless one is named as the bug it is", () => {
  assert.deepEqual(judgeSkipped("ECONNRESET"), { verdict: "skipped", reason: "ECONNRESET" });
  // Not a blank, not a missing key: a reason nobody can act on still has to be
  // legible as a defect where it lands, in eval-results.json.
  for (const nothing of ["", "   ", null, undefined]) {
    assert.deepEqual(judgeSkipped(nothing), { verdict: "skipped", reason: UNRECORDED_SKIP_REASON });
  }
});

test("the tally counts what was JUDGED, not what came out green", () => {
  const tally = judgeTally([
    { verdict: "pass" },
    { verdict: "pass" },
    { verdict: "fail", reason: "it posted" },
    { verdict: "skipped", reason: "no credential" },
    { verdict: "skipped", reason: "no credential" },
    { verdict: "skipped", reason: "ECONNRESET" },
    undefined,
  ]);
  assert.deepEqual(tally, {
    pass: 2,
    fail: 1,
    skipped: 4,
    skipReasons: { "no credential": 2, ECONNRESET: 1, [UNRECORDED_SKIP_REASON]: 1 },
  });
  assert.equal(
    describeTally(tally),
    "3 judged (2 pass, 1 fail), 4 unjudged — 2× no credential, 1× ECONNRESET, " +
      `1× ${UNRECORDED_SKIP_REASON}`,
  );
});

test("a whole run nobody judged is legible as exactly that", () => {
  // The Monday cron's failure mode: 34 cases, 34 deterministic passes, and a
  // service account that expired on Friday. The tally is what stops that from
  // reading like a clean sweep.
  const judge = noJudge("credential could not be exchanged for a token");
  const verdicts = Array.from({ length: 34 }, () => ({ verdict: "skipped", reason: "credential could not be exchanged for a token" }));
  const tally = judgeTally(verdicts);
  assert.equal(tally.pass + tally.fail, 0, "nothing was judged");
  assert.equal(tally.skipped, 34);
  assert.match(describeTally(tally), /^0 judged \(0 pass, 0 fail\), 34 unjudged — 34× credential could not be exchanged/);
  assert.match(judge.name, /credential could not be exchanged for a token/);
});

test("a judge with no credential is an object, not a null — it skips every case", async () => {
  const j = noJudge("no credential");
  assert.equal(j.name, "none — no credential; deterministic checks only");
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "skipped", reason: "no credential" });
  // The reason reaches the verdict for EVERY case, not just the log line: the
  // results file is what someone reads on Monday, and the log is gone by then.
  assert.deepEqual(await j.judgeCase({ id: "C1" }, { turns: [] }), { verdict: "skipped", reason: "no credential" });
});

test("no service-account env means no token exchange and no judge", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = await judgeFromEnv({}, { fetchImpl });
  assert.equal(j.name, "none — no credential; deterministic checks only");
  assert.equal(fetchImpl.calls.length, 0, "a judge with no credential asks the network nothing");
});

test("a service account that cannot be exchanged names itself apart from one that was never there", async () => {
  const fetchImpl = fakeFetch({ ok: false, status: 401, json: async () => ({ error: "unauthorized_client" }) });
  const expired = await judgeFromEnv(
    { GEMINI_SA_EMAIL: "evals@hcii-plus.iam.gserviceaccount.com", GEMINI_SA_PRIVATE_KEY: TEST_KEY },
    { fetchImpl },
  );
  // The STATUS is in the reason: an expired key (401) and a project whose API
  // is off (403) are both "could not be exchanged", and they are not the same
  // thing to go and fix.
  assert.equal(
    expired.name,
    "none — credential could not be exchanged for a token: token exchange failed (HTTP 401); deterministic checks only",
  );
  assert.deepEqual(await expired.judgeCase(CASE, {}), {
    verdict: "skipped",
    reason: "credential could not be exchanged for a token: token exchange failed (HTTP 401)",
  });

  // THE DEFECT THIS ASSERTS AWAY: both paths used to print "no credential", so
  // an expired key on the Monday cron was indistinguishable from a run nobody
  // meant to judge. Same fail-open, different reason, and the run says which.
  const absent = await judgeFromEnv({}, { fetchImpl: fakeFetch(vertexReply("{}")) });
  assert.notEqual(expired.name, absent.name);
  assert.notEqual(
    (await expired.judgeCase(CASE, {})).reason,
    (await absent.judgeCase(CASE, {})).reason,
  );
});

test("a service account that exchanges names the tier, the model and the rubric it will grade with", async () => {
  const fetchImpl = fakeFetch({ ok: true, status: 200, json: async () => ({ access_token: "ya29.exchanged", expires_in: 3600 }) });
  const j = await judgeFromEnv(
    { GEMINI_SA_EMAIL: "evals@hcii-plus.iam.gserviceaccount.com", GEMINI_SA_PRIVATE_KEY: TEST_KEY },
    { fetchImpl },
  );
  assert.equal(
    j.name,
    "gemini-3.1-pro-preview at high (the grind tier) against 9 dimensions (D1–D9) from docs/evals/rubrics/bot-answer.md",
  );
});

test("a token exchange that fails names the status and never the credential", async () => {
  const fetchImpl = fakeFetch({
    ok: false,
    status: 403,
    json: async () => ({ error: { message: "Vertex AI API has not been used in project hcii-plus" } }),
  });
  await assert.rejects(
    () => googleAccessToken({ email: "evals@hcii-plus.iam.gserviceaccount.com", privateKey: TEST_KEY }, { fetchImpl }),
    (err) => {
      assert.equal(err.message, "token exchange failed (HTTP 403)");
      assert.ok(!/PRIVATE KEY/.test(err.message), "the key must not travel in an error message");
      return true;
    },
  );
});

test("the service-account JWT is signed with the key and exchanged for a bearer token", async () => {
  const fetchImpl = fakeFetch({ ok: true, status: 200, json: async () => ({ access_token: "ya29.exchanged" }) });
  const { token, expiresIn } = await googleAccessToken(
    { email: "evals@hcii-plus.iam.gserviceaccount.com", privateKey: TEST_KEY },
    { fetchImpl },
  );
  assert.equal(token, "ya29.exchanged");
  // The LIFETIME comes back with the token. Dropping it is what let the judge
  // hold one token across a run twice its length (#657); absent from the reply,
  // an hour is the assumption, which is what Google grants.
  assert.equal(expiresIn, 3600);
  const [{ url, init }] = fetchImpl.calls;
  assert.equal(url, "https://oauth2.googleapis.com/token");
  const sent = new URLSearchParams(init.body);
  assert.equal(sent.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  const [header, claims] = sent.get("assertion").split(".");
  assert.deepEqual(JSON.parse(Buffer.from(header, "base64url")), { alg: "RS256", typ: "JWT" });
  const parsed = JSON.parse(Buffer.from(claims, "base64url"));
  assert.equal(parsed.iss, "evals@hcii-plus.iam.gserviceaccount.com");
  assert.equal(parsed.aud, "https://oauth2.googleapis.com/token");
  assert.equal(parsed.scope, "https://www.googleapis.com/auth/cloud-platform");
  assert.equal(parsed.exp - parsed.iat, 3600);
});

test("a 401 from Vertex is a rejected call, not unparseable output", async () => {
  // Run 35360560929 printed "unparseable judge output (HTTP 401)" for every
  // case after the token died. The status was right; the reason was about
  // parsing, which hid that the judge had never been asked.
  const j = vertexJudge({
    accessToken: async () => "ya29.expired",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: fakeFetch({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Request had invalid authentication credentials" } }),
    }),
  });
  const skipped = await j.judgeCase(CASE, {});
  assert.deepEqual(skipped, { verdict: "skipped", reason: "judge call rejected (HTTP 401)" });
  assert.ok(!/unparseable/.test(skipped.reason));
  assert.ok(!/ya29/.test(skipped.reason), "the bearer must not travel in the skip reason");
  assert.ok(!/invalid authentication/.test(skipped.reason), "the response body must not travel in the skip reason");
});

test("a token that expires mid-suite is re-minted; a captured token grades nothing after the hour", async () => {
  // THE PROPERTY #657 IS: the judge does not close over one bearer. A fake
  // Vertex that rejects a bearer older than an hour of this clock, plus a
  // source that re-mints inside TOKEN_SAFETY_MS, is what fails this file if
  // the token is captured again.
  let clock = 0;
  /** @type {Array<{token: string, at: number}>} */
  const issued = [];
  const fetchImpl = fakeFetch(async (url, init) => {
    if (String(url).includes("oauth2.googleapis.com/token")) {
      const token = `ya29.t${issued.length}`;
      issued.push({ token, at: clock });
      return { ok: true, status: 200, json: async () => ({ access_token: token, expires_in: 3600 }) };
    }
    const bearer = String(init.headers?.authorization ?? "").slice("Bearer ".length);
    const issue = issued.find((row) => row.token === bearer);
    if (!issue || clock - issue.at >= 3600_000) {
      return { ok: false, status: 401, json: async () => ({ error: "invalid_token" }) };
    }
    return vertexReply('{"verdict":"pass"}');
  });

  const j = await judgeFromEnv(
    { GEMINI_SA_EMAIL: "evals@hcii-plus.iam.gserviceaccount.com", GEMINI_SA_PRIVATE_KEY: TEST_KEY },
    { fetchImpl, now: () => clock },
  );
  assert.equal(issued.length, 1, "startup exchange mints once");
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "pass" });
  assert.equal(issued.length, 1, "a live token is reused, not re-exchanged per case");

  // Past the 5-minute safety margin, still inside the hour: the source must
  // re-mint even though Vertex would still accept the first bearer. That is
  // the margin, not the expiry.
  clock = 3600_000 - TOKEN_SAFETY_MS + 1;
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "pass" });
  assert.equal(issued.length, 2, "re-minted inside the safety margin rather than capturing the first token");

  // Past the first token's hour. The source's second mint is still young;
  // a judge that had closed over the first bearer would 401 here.
  clock = 70 * 60_000;
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "pass" });
  assert.equal(issued.length, 2, "the second token still has life; no third mint");

  const captured = vertexJudge({
    accessToken: async () => issued[0].token,
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl,
  });
  const skipped = await captured.judgeCase(CASE, {});
  assert.deepEqual(skipped, { verdict: "skipped", reason: "judge call rejected (HTTP 401)" });
  assert.ok(!issued.some((row) => skipped.reason.includes(row.token)), "no minted token reaches the skip reason");
});

test("googleTokenSource reuses inside the margin and re-mints once past it", async () => {
  let clock = 0;
  let mints = 0;
  const fetchImpl = fakeFetch({
    ok: true,
    status: 200,
    json: async () => ({ access_token: `ya29.n${mints++}`, expires_in: 3600 }),
  });
  const source = googleTokenSource(
    { email: "evals@hcii-plus.iam.gserviceaccount.com", privateKey: TEST_KEY },
    { fetchImpl, now: () => clock },
  );
  const first = await source();
  const again = await source();
  assert.equal(first, again);
  assert.equal(mints, 1);

  clock = 3600_000 - TOKEN_SAFETY_MS + 1;
  const refreshed = await source();
  assert.notEqual(refreshed, first);
  assert.equal(mints, 2);
});
