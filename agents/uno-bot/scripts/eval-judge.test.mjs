// The judge grades against the rubric document, and against all of it (#511).
//
// THE PROPERTY THIS FILE HOLDS: every dimension docs/evals/rubrics/bot-answer.md
// declares reaches the judge's system prompt, verbatim. The prompt used to
// carry a hand-written paraphrase of five of the nine, so a dimension added or
// sharpened in the document changed nothing about what was measured — and
// nothing said so. This test is what makes that silence impossible.
//
// And the second half: the credential, the call, the cut and the fail-open are
// exercised here with no network and no service account, because they are the
// judge module's now rather than closures in the runner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import {
  RUBRIC_PATH,
  describeRubric,
  dimensionIds,
  extractBlock,
  googleAccessToken,
  judgeFromEnv,
  judgeSystem,
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
    token: "ya29.fake",
    rubric: loadRubric(),
    model: "gemini-3.1-pro-preview",
    projectId: "hcii-plus",
    fetchImpl,
  });

  assert.equal(
    j.name,
    "gemini-3.1-pro-preview against 9 dimensions (D1–D9) from docs/evals/rubrics/bot-answer.md",
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
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
});

test("thinking_level is a 3.x key — an older judge model is not sent one", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"fail","reason":"it posted"}'));
  const j = vertexJudge({ token: "t", rubric: loadRubric(), model: "gemini-2.5-pro", projectId: "p", fetchImpl });
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "fail", reason: "it posted" });
  assert.equal(JSON.parse(fetchImpl.calls[0].init.body).generationConfig.thinkingConfig, undefined);
});

test("a transcript longer than the cut is truncated, and says so where the judge can read it", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = vertexJudge({ token: "t", rubric: loadRubric(), model: "m", projectId: "p", fetchImpl, transcriptChars: 200 });
  await j.judgeCase(CASE, { turns: [{ text: "x".repeat(5000) }] });
  const sent = JSON.parse(fetchImpl.calls[0].init.body).contents[0].parts[0].text;
  assert.match(sent, /…\[transcript truncated at 200 chars — judge only what is shown\]/);
  assert.ok(sent.length < 600, "the cut actually cut");
});

test("a transcript inside the cut travels whole, with no truncation marker", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = vertexJudge({ token: "t", rubric: loadRubric(), model: "m", projectId: "p", fetchImpl });
  const transcript = { turns: [{ text: "short" }] };
  await j.judgeCase(CASE, transcript);
  const sent = JSON.parse(fetchImpl.calls[0].init.body).contents[0].parts[0].text;
  assert.ok(sent.includes(JSON.stringify(transcript)));
  assert.ok(!sent.includes("truncated at"));
});

test("the judge fails OPEN: a thrown call, an HTTP error and unparseable output all skip", async () => {
  const thrown = vertexJudge({
    token: "t",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: async () => {
      throw new Error("ECONNRESET");
    },
  });
  assert.deepEqual(await thrown.judgeCase(CASE, {}), { verdict: "skipped", reason: "ECONNRESET" });

  const http500 = vertexJudge({
    token: "t",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: fakeFetch({ ok: false, status: 500, json: async () => ({ error: { message: "boom" } }) }),
  });
  assert.equal((await http500.judgeCase(CASE, {})).verdict, "skipped");

  const babble = vertexJudge({
    token: "t",
    rubric: loadRubric(),
    model: "m",
    projectId: "p",
    fetchImpl: fakeFetch(vertexReply("I think it is fine, honestly")),
  });
  assert.deepEqual(await babble.judgeCase(CASE, {}), {
    verdict: "skipped",
    reason: "unparseable judge output",
  });
});

test("a judge with no credential is an object, not a null — it skips every case", async () => {
  const j = noJudge("no credential");
  assert.equal(j.name, "none — no credential, deterministic checks only");
  assert.deepEqual(await j.judgeCase(CASE, {}), { verdict: "skipped", reason: "no credential" });
});

test("no service-account env means no token exchange and no judge", async () => {
  const fetchImpl = fakeFetch(vertexReply('{"verdict":"pass"}'));
  const j = await judgeFromEnv({}, { fetchImpl });
  assert.equal(j.name, "none — no credential, deterministic checks only");
  assert.equal(fetchImpl.calls.length, 0, "a judge with no credential asks the network nothing");
});

test("a service account that cannot be exchanged for a token fails open to no judge", async () => {
  const fetchImpl = fakeFetch({ ok: false, status: 401, json: async () => ({ error: "unauthorized_client" }) });
  const j = await judgeFromEnv(
    { GEMINI_SA_EMAIL: "evals@hcii-plus.iam.gserviceaccount.com", GEMINI_SA_PRIVATE_KEY: TEST_KEY },
    { fetchImpl },
  );
  assert.equal(j.name, "none — no credential, deterministic checks only");
});

test("a service account that exchanges names the model and the rubric it will grade with", async () => {
  const fetchImpl = fakeFetch({ ok: true, status: 200, json: async () => ({ access_token: "ya29.exchanged" }) });
  const j = await judgeFromEnv(
    { GEMINI_SA_EMAIL: "evals@hcii-plus.iam.gserviceaccount.com", GEMINI_SA_PRIVATE_KEY: TEST_KEY },
    { fetchImpl },
  );
  assert.equal(j.name, "gemini-3.1-pro-preview against 9 dimensions (D1–D9) from docs/evals/rubrics/bot-answer.md");
});

test("the service-account JWT is signed with the key and exchanged for a bearer token", async () => {
  const fetchImpl = fakeFetch({ ok: true, status: 200, json: async () => ({ access_token: "ya29.exchanged" }) });
  const token = await googleAccessToken(
    { email: "evals@hcii-plus.iam.gserviceaccount.com", privateKey: TEST_KEY },
    { fetchImpl },
  );
  assert.equal(token, "ya29.exchanged");
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
