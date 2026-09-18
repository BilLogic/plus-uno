// The eval runner's JUDGE — the whole of it: the rubric it grades against, the
// credential it grades with, the call, the cut and the fail-open.
//
// This module used to hold only the rubric, while the credential, the HTTP
// call, the transcript truncation and the fail-open behaviour sat as closures
// in run-evals.mjs. The judge was half a module and half a runner, and the half
// in the runner was reachable only by running the suite against Vertex.
//
// So the judge has the same shape as the TURN TRANSPORT it sits beside
// (eval-transport.mjs). A judge is an object:
//
//   {
//     name,                                  // for the log
//     judgeCase(case, transcript) -> Promise<{verdict, reason?}>,
//   }
//
// `verdict` is "pass", "fail" or "skipped", and SKIPPED IS THE FAILURE MODE: a
// judge that cannot be reached, cannot be parsed or was never given a
// credential must not turn the suite red, because the deterministic checks
// still ran and a network hiccup is not evidence about the bot. Every path out
// of `judgeCase` below is one of those three, never a throw.
//
// A SKIP IS NOT A PASS, THOUGH, AND MUST NOT READ AS ONE. Failing open means a
// skipped case stays green, so on its own it is indistinguishable from a case
// the grind model read and approved — "34/34 passed" would say the same thing
// whether every case was judged or an expired service account judged none. Two
// rules keep a run honest about that, and both are this module's:
//
//   1. every skip carries its REASON — `judgeSkipped` below is the only way to
//      make one, so no path can forget — and
//   2. `judgeTally` counts the verdicts a run actually collected, which the
//      runner records in the summary and prints beside the score.
//
// On the rubric, which this module has always owned: the judge prompt used to
// carry its own condensed paraphrase of D1–D9 as a string constant in
// run-evals.mjs, beside the canonical rubric in docs/evals/rubrics/bot-answer.md.
// Two copies of "what good means" is one copy too many: D9 was redesigned on
// 2026-07-16 (the trailing confidence affix retired) and the paraphrase
// happened to be updated with it — nothing made that happen, and nothing would
// have said so if it had not.
//
// So the rubric has one home. The judge loads the document and quotes its
// dimensions block VERBATIM: not summarised, not reordered, not reworded, so a
// dimension added or a definition sharpened reaches the judge on the next run
// with no second edit. scripts/eval-judge.test.mjs asserts that every D-id in
// the document reaches the prompt, so a rubric edit cannot be silently dropped.

import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

/** The canonical rubric. Resolved from this file, not from the cwd: the runner
 *  is invoked from the repo root by the Action and from agents/uno-bot by the
 *  tests, and the rubric sits at neither place relative to both. */
export const RUBRIC_PATH = new URL("../../../docs/evals/rubrics/bot-answer.md", import.meta.url);

/**
 * One top-level frontmatter block, verbatim — the key line and every indented
 * line under it, stopping at the next top-level key or the end of the
 * frontmatter.
 *
 * Deliberately textual rather than a YAML parse. What the judge should read is
 * the rubric AS WRITTEN, wording and ordering included; a parse-and-reformat
 * would quietly become a third rendering of it.
 *
 * @param {string} doc - the whole markdown document
 * @param {string} key - e.g. "dimensions"
 * @returns {string} the block, newline-joined, or "" when the key is absent
 */
export function extractBlock(doc, key) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(doc);
  if (!fm) return "";
  const lines = fm[1].split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start === -1) return "";
  const out = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    // A top-level key ends the block; a blank line inside it does not.
    if (line.trim() !== "" && !/^\s/.test(line)) break;
    out.push(line);
  }
  // Trailing blank lines belong to the gap, not to the block.
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

/** Every dimension id the block declares, in document order. */
export function dimensionIds(block) {
  return [...String(block).matchAll(/^\s*-\s*id:\s*(D\d+)\s*$/gm)].map((m) => m[1]);
}

/**
 * Load the rubric's D1–D9 block.
 *
 * Throws when the document carries no dimensions. A judge running without a
 * rubric would grade on the model's own idea of "good" and report verdicts that
 * look exactly like rubric verdicts — failing loudly is the only honest option.
 *
 * @param {string|URL} [path]
 * @returns {{path: string, block: string, ids: string[]}}
 */
export function loadRubric(path = RUBRIC_PATH) {
  const doc = readFileSync(path, "utf8");
  const block = extractBlock(doc, "dimensions");
  const ids = dimensionIds(block);
  if (!ids.length) {
    throw new Error(`no dimensions block in ${path} — the judge has no rubric to grade against`);
  }
  return { path: String(path), block, ids };
}

/** What the run logged it graded against: "9 dimensions (D1–D9)". */
export function describeRubric(rubric) {
  const { ids } = rubric;
  return `${ids.length} dimension${ids.length === 1 ? "" : "s"} (${ids[0]}–${ids[ids.length - 1]})`;
}

/**
 * The judge's system instruction, built from the rubric block.
 *
 * The framing around the quote is the judge's JOB (what it receives, what it
 * may conclude, the reply shape); the rubric inside it is the LENS. Only the
 * framing lives here.
 */
export function judgeSystem(rubric) {
  return [
    `You are a strict evaluator for uno-bot, the PLUS design team's Slack agent. You receive one eval case (its expectation and failure condition) and the bot's actual transcript (prompts, narration, final result JSON). Judge ONLY what the transcript shows against the case's expectation, informed by the team's bot-answer rubric below — the case's expectation is the question, the rubric's dimensions are the lens.`,
    ``,
    `The rubric, verbatim from docs/evals/rubrics/bot-answer.md:`,
    rubric.block,
    ``,
    `A "proposal" result means the action was STAGED behind a human confirmation — it did not execute. Reply with STRICT JSON only: {"verdict":"pass"} or {"verdict":"fail","reason":"<one sentence>"}.`,
  ].join("\n");
}

// ── The credential ────────────────────────────────────────────────────────────

/**
 * The default judge model: the model the GRIND tier runs, because a judge should
 * be at least as strong as what it grades and the bot's own model shares its
 * blind spots.
 *
 * The MODEL, not the tier. This judge sends it `thinkingLevel: "low"` (see the
 * call below), and ADR-028 says a tier is a model and a thinking level moving
 * together — grind is this model at `high`. So the pair here is no tier, and
 * naming it "the grind tier" would be the claim ADR-028 exists to stop. Left as
 * the pair the suite has always scored on rather than changed under a
 * refactor's cover: #605 is where the judge names a tier and calls through the
 * ModelProvider seam, and the pair stops being the judge's to pick.
 */
export const DEFAULT_JUDGE_MODEL = "gemini-3.1-pro-preview";
export const DEFAULT_PROJECT_ID = "hcii-plus";

/**
 * How much of the transcript the judge reads.
 *
 * Was 8,000 chars, and a full prompt-spec is longer than that: on 2026-09-05
 * (run 33972756077) P2's Open Questions block began at char 8,190, so the judge
 * failed the reply for "documenting none of the open decisions" it had
 * documented — a verdict about the cut, not the reply. The judge runs grind's
 * model, whose context is long; 60,000 chars covers every transcript the
 * fixture produces today with room to grow, and the marker below tells the
 * judge when it still is not the whole thing.
 */
export const JUDGE_TRANSCRIPT_CHARS = 60_000;

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

/**
 * Exchange a Google service account for an access token (the same
 * signed-JWT-for-bearer pattern as the backfill script).
 *
 * Returns the token; never logs it, and never puts it in an error message —
 * every caller here logs what it failed at, not what it failed with.
 *
 * @param {{email: string, privateKey: string}} sa
 * @param {{fetchImpl?: typeof fetch}} [opts]
 * @returns {Promise<string>}
 */
export async function googleAccessToken({ email, privateKey }, { fetchImpl = fetch } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const input = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  // The GitHub secret carries the PEM's newlines escaped; the signer needs them real.
  const jwt = `${input}.${b64url(signer.sign(String(privateKey).replace(/\\n/g, "\n")))}`;
  const res = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  // The STATUS and nothing else: a 401 is an expired or revoked key, a 403 is
  // the API or the role, and a reason that says only "it failed" sends whoever
  // reads it on Monday to the wrong door. The body can carry the credential's
  // own details, so it stays out of the message.
  if (!res.ok || !data.access_token) throw new Error(`token exchange failed (HTTP ${res.status})`);
  return data.access_token;
}

// ── The verdicts ──────────────────────────────────────────────────────────────

/** What a skip with no reason is recorded as — a bug, named rather than blank. */
export const UNRECORDED_SKIP_REASON = "skipped for no recorded reason";

/**
 * A skipped verdict, which always carries why.
 *
 * The only constructor for one: a bare `{ verdict: "skipped" }` reaching the
 * results is a case nobody can tell from a judged pass a week later, and that
 * is the failure this module exists to prevent.
 *
 * @param {string} reason
 * @returns {{verdict: "skipped", reason: string}}
 */
export function judgeSkipped(reason) {
  return { verdict: "skipped", reason: String(reason ?? "").trim() || UNRECORDED_SKIP_REASON };
}

/**
 * What the judge did across a whole run: a count per verdict, and the distinct
 * reasons behind the skips with how many cases each accounts for.
 *
 * Pure, and over VERDICTS rather than over result rows, so the runner can keep
 * it and the results envelope (#617) can read it without either owning it.
 *
 * @param {Array<{verdict?: string, reason?: string}|null|undefined>} verdicts
 * @returns {{pass: number, fail: number, skipped: number, skipReasons: Record<string, number>}}
 */
export function judgeTally(verdicts) {
  const tally = { pass: 0, fail: 0, skipped: 0, skipReasons: {} };
  for (const v of verdicts) {
    if (v?.verdict === "pass" || v?.verdict === "fail") {
      tally[v.verdict]++;
      continue;
    }
    tally.skipped++;
    const { reason } = judgeSkipped(v?.reason);
    tally.skipReasons[reason] = (tally.skipReasons[reason] ?? 0) + 1;
  }
  return tally;
}

/** The tally as one line for the log: what was graded, what was not, and why. */
export function describeTally(tally) {
  const graded = tally.pass + tally.fail;
  const why = Object.entries(tally.skipReasons)
    .map(([reason, n]) => `${n}× ${reason}`)
    .join(", ");
  return (
    `${graded} judged (${tally.pass} pass, ${tally.fail} fail), ${tally.skipped} unjudged` +
    (why ? ` — ${why}` : "")
  );
}

// ── The judges ────────────────────────────────────────────────────────────────

/**
 * The judge that is not there: no credential, no rubric quarrel, no network.
 *
 * A null judge would make every caller ask whether there is one; an object that
 * skips makes "no judge" the same shape as a judge, and the runner's default.
 *
 * THE NAME CARRIES THE REASON, because the reasons are not interchangeable: a
 * checkout with no service account configured and a service account that has
 * expired both end up here, and only one of them is somebody's Monday morning.
 * A fixed name — which this used to have — printed "no credential" for an
 * expired key, so a broken cron read as a deliberately unjudged run.
 *
 * @param {string} [reason]
 */
export function noJudge(reason = "no credential") {
  const verdict = judgeSkipped(reason);
  return {
    name: `none — ${verdict.reason}; deterministic checks only`,
    async judgeCase() {
      return verdict;
    },
  };
}

/**
 * Gemini on Vertex as the judge: the rubric as the system instruction, the case
 * and its transcript as the turn, a strict-JSON verdict back.
 *
 * @param {object} deps
 * @param {string} deps.token - a cloud-platform bearer token
 * @param {{block: string, ids: string[]}} deps.rubric
 * @param {string} [deps.model]
 * @param {string} [deps.projectId]
 * @param {typeof fetch} [deps.fetchImpl]
 * @param {number} [deps.transcriptChars]
 */
export function vertexJudge({
  token,
  rubric,
  model = DEFAULT_JUDGE_MODEL,
  projectId = DEFAULT_PROJECT_ID,
  fetchImpl = fetch,
  transcriptChars = JUDGE_TRANSCRIPT_CHARS,
}) {
  const system = judgeSystem(rubric);
  const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${model}:generateContent`;
  return {
    name: `${model} against ${describeRubric(rubric)} from docs/evals/rubrics/bot-answer.md`,
    async judgeCase(c, transcript) {
      try {
        const prompt =
          `Case ${c.id} — ${c.name}\nExpectation: ${c.judgeNote}\n\nTranscript (JSON):\n` +
          truncateTranscript(transcript, transcriptChars);
        const res = await fetchImpl(url, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: system }] },
            generationConfig: {
              maxOutputTokens: 2000,
              // thinking_level is Gemini 3.x-only; 2.5-gen models 400 on it.
              ...(/^gemini-3/.test(model) ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
            },
          }),
        });
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts ?? [])
          .filter((p) => p.text && !p.thought)
          .map((p) => p.text)
          .join("");
        const m = text && text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
        const parsed = m ? JSON.parse(m) : null;
        if (parsed?.verdict === "pass" || parsed?.verdict === "fail") return parsed;
        // The status belongs in the reason: an HTTP 429 and a model that
        // answered in prose are both "unparseable" from here, and they are not
        // the same problem to go and fix.
        return judgeSkipped(`unparseable judge output (HTTP ${res.status})`);
      } catch (err) {
        return judgeSkipped(String(err?.message ?? err));
      }
    },
  };
}

/** The transcript as the judge sees it, cut at `max` with the cut declared. */
export function truncateTranscript(transcript, max = JUDGE_TRANSCRIPT_CHARS) {
  const full = JSON.stringify(transcript);
  return full.length > max
    ? `${full.slice(0, max)} …[transcript truncated at ${max} chars — judge only what is shown]`
    : full;
}

/**
 * The judge the environment affords: a Vertex judge when the service account is
 * present and exchanges, `noJudge` otherwise.
 *
 * A missing or unusable credential is not an error here. The suite's
 * deterministic checks do not need a judge, and a token exchange that failed at
 * 3am should leave a run with fewer VERDICTS, not no run — and a run that says
 * which: the judge it returns names the reason, every case it skips records
 * one, so the summary reads "0 judged, 34 unjudged — 34× credential could not
 * be exchanged for a token" rather than a clean sweep.
 *
 * @param {Record<string, string|undefined>} [env]
 * @param {{rubric?: object, fetchImpl?: typeof fetch}} [opts]
 */
export async function judgeFromEnv(env = process.env, { rubric = loadRubric(), fetchImpl = fetch } = {}) {
  const { GEMINI_SA_EMAIL, GEMINI_SA_PRIVATE_KEY, GEMINI_PROJECT_ID, JUDGE_MODEL } = env;
  if (!GEMINI_SA_EMAIL || !GEMINI_SA_PRIVATE_KEY) return noJudge("no credential");
  // WHY the exchange failed travels with the skip. Swallowing it — which this
  // line used to do — left an expired service account reporting the same
  // sentence as one that was never configured.
  const exchanged = await googleAccessToken(
    { email: GEMINI_SA_EMAIL, privateKey: GEMINI_SA_PRIVATE_KEY },
    { fetchImpl },
  ).then(
    (token) => ({ token }),
    (err) => ({ why: String(err?.message ?? err) }),
  );
  if (!exchanged.token) {
    return noJudge(
      `credential could not be exchanged for a token${exchanged.why ? `: ${exchanged.why}` : ""}`,
    );
  }
  const { token } = exchanged;
  return vertexJudge({
    token,
    rubric,
    model: JUDGE_MODEL || DEFAULT_JUDGE_MODEL,
    projectId: GEMINI_PROJECT_ID || DEFAULT_PROJECT_ID,
    fetchImpl,
  });
}
