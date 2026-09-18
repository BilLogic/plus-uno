// The draft judge, on the fake adapter (#605).
//
// The judge's own behaviour — which tier it asks on, how it reads a verdict,
// when it takes a revision, the extra gate on a correction turn, and the two
// ways it declines to grade — was reachable only by running the Worker against
// a live credential until it stopped reading `MODEL_PROVIDER` and started
// taking a `ModelProvider`. The module names no `Env` now, so this suite drives
// it in-process on the scripted fake, with no network and no credential.
import { test } from "node:test";
import assert from "node:assert/strict";

import { reviewDraft, JUDGE_TIER } from "../src/agent/draft-judge";
import { fakeProvider } from "../src/agent/providers/fake";

/**
 * A draft long enough to clear MIN_DRAFT_CHARS (1000) and varied enough to
 * clear the stall guard's 25-distinct-word floor, so "is this a restatement"
 * is a real measurement here rather than a threshold artefact.
 */
const words = Array.from({ length: 140 }, (_, i) => `clause${i}`).join(" ");
const LONG_DRAFT = `The blueprint's call-off path is the one that changed. ${words}`;
const REVISION = `The blueprint's call-off path is the one that changed, and here is what it now says. ${words} and one more finding`;

const verdictJson = (v: Record<string, unknown>) => JSON.stringify(v);

// ── the tier, and nothing else about the model ────────────────────────────────

test("the judge names the grind tier and sets no dial of its own", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  await reviewDraft(fake, { userText: "what changed?", draft: LONG_DRAFT });

  assert.equal(fake.generated.length, 1);
  const asked = fake.generated[0]!;
  assert.equal(asked.tier, "grind");
  assert.equal(JUDGE_TIER, "grind");
  // The WHOLE of what the judge says about the model: a tier, its prompt, its
  // system block and an output ceiling. No model id and no dial crosses the
  // seam — the pair is the adapter's (ADR-028), and this module sending `low`
  // beside grind's model is exactly what #605 removed. (`asked.system` is the
  // rubric, which legitimately tells the judge to fail a draft that leaks a
  // model or tier name, so it is not part of that scan.)
  assert.deepEqual(Object.keys(asked).sort(), ["maxTokens", "prompt", "system", "tier"]);
  const { system: _rubric, ...dialsSide } = asked;
  assert.doesNotMatch(JSON.stringify(dialsSide), /thinking|gemini|claude|flash|-pro/i);
});

// ── verdict parsing ──────────────────────────────────────────────────────────

test("a pass ships the original draft", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  assert.deepEqual(out, { text: LONG_DRAFT, verdict: "pass" });
});

test("a fail with a usable revision ships the revision", async () => {
  const fake = fakeProvider({
    generateReplies: [
      verdictJson({ verdict: "fail", failed: ["D9"], revised: REVISION }),
    ],
  });

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  assert.equal(out.verdict, "fail");
  assert.equal(out.text, REVISION);
});

test("a fail whose revision is truncated ships the original — the judge may not lower quality", async () => {
  const fake = fakeProvider({
    generateReplies: [verdictJson({ verdict: "fail", failed: ["D3"], revised: "See above." })],
  });

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  assert.equal(out.verdict, "fail");
  assert.equal(out.text, LONG_DRAFT);
});

test("prose around the JSON is tolerated; prose instead of it is an error", async () => {
  const fenced = fakeProvider({
    generateReplies: ["```json\n" + verdictJson({ verdict: "pass" }) + "\n```"],
  });
  assert.equal((await reviewDraft(fenced, { userText: "q", draft: LONG_DRAFT })).verdict, "pass");

  const prose = fakeProvider({ generateReplies: ["Looks good to me!"] });
  const out = await reviewDraft(prose, { userText: "q", draft: LONG_DRAFT });
  assert.equal(out.verdict, "error");
  assert.equal(out.text, LONG_DRAFT);
  assert.equal(out.reason, "unparseable judge output");
});

// ── the correction gate ──────────────────────────────────────────────────────

test("a correction turn carries the extra gate, the previous reply and the tools that ran", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  await reviewDraft(fake, {
    userText: "no, that is wrong",
    draft: LONG_DRAFT,
    correction: true,
    priorAssistantText: "The call-off path is unchanged.",
    toolsUsedThisTurn: ["search_blueprint"],
  });

  const asked = fake.generated[0]!;
  assert.match(String(asked.system), /CORRECTION TURN\./);
  assert.match(String(asked.system), /gate:correction/);
  assert.match(asked.prompt, /Previous reply/);
  assert.match(asked.prompt, /Tools that ran this turn: search_blueprint/);
});

test("the gate is absent on an ordinary turn, and the length floor applies there", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });
  await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });
  assert.doesNotMatch(String(fake.generated[0]!.system), /CORRECTION TURN/);

  // A SHORT draft is not judged at all — and a correction bypasses that floor,
  // because the 2026-08-17 denial the gate exists for was short.
  const short = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });
  const skipped = await reviewDraft(short, { userText: "q", draft: "No." });
  assert.equal(skipped.verdict, "skip");
  assert.equal(skipped.reason, "draft shorter than the judged floor");
  assert.deepEqual(short.generated, []);

  const forced = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });
  await reviewDraft(forced, {
    userText: "no, that is wrong",
    draft: "No.",
    correction: true,
    priorAssistantText: "No.",
  });
  assert.equal(forced.generated.length, 1);
});

test("a measured restatement is declared to the judge before it grades", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  await reviewDraft(fake, {
    userText: "no, that is wrong",
    draft: LONG_DRAFT,
    correction: true,
    priorAssistantText: LONG_DRAFT,
  });

  assert.match(fake.generated[0]!.prompt, /MEASURED: this draft retains almost all/);
});

// ── the two ways the judge declines to grade ─────────────────────────────────

test("fail-open: a judge that was asked and failed is an error, and the draft ships", async () => {
  const fake = fakeProvider({ generateFailMessage: "generateContent failed (HTTP 429)" });

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  assert.equal(out.verdict, "error");
  assert.equal(out.text, LONG_DRAFT);
  assert.equal(out.reason, "generateContent failed (HTTP 429)");
});

test("an unavailable adapter is a SKIP carrying the adapter's reason, not an error", async () => {
  const fake = fakeProvider({ generateUnavailableMessage: "no Gemini credential configured" });

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  // The distinction the seam's third disposition exists for: nothing was asked,
  // so nothing was graded — which is a different fact about the run from a
  // judge that errored, and reads differently in the telemetry.
  assert.deepEqual(out, {
    text: LONG_DRAFT,
    verdict: "skip",
    reason: "no Gemini credential configured",
  });
});

test("a skip always carries a reason, even from an adapter that gives none", async () => {
  const fake = fakeProvider({ generateUnavailableMessage: "   " });

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  assert.equal(out.verdict, "skip");
  assert.equal(out.reason, "skipped for no recorded reason");
});

test("a throwing adapter fails open too — the judge never blocks a reply", async () => {
  const fake = fakeProvider({});
  fake.generate = async () => {
    throw new Error("socket hang up");
  };

  const out = await reviewDraft(fake, { userText: "q", draft: LONG_DRAFT });

  assert.equal(out.verdict, "error");
  assert.equal(out.text, LONG_DRAFT);
  assert.equal(out.reason, "socket hang up");
});
