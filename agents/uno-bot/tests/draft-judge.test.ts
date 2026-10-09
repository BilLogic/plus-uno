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

test("the judge names the default tier and sets no dial of its own", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  await reviewDraft(fake, { userText: "what changed?", draft: LONG_DRAFT });

  assert.equal(fake.generated.length, 1);
  const asked = fake.generated[0]!;
  // `default`, not `grind`: the judge has a 25s wall clock and grind's pro
  // model at `high` never once finished inside it (2026-10-07, six of six
  // judged drafts timed out, the shortest 2,729 chars), so every draft shipped
  // unread. A tier the judge cannot finish on is no judge at all.
  assert.equal(asked.tier, "default");
  assert.equal(JUDGE_TIER, "default");
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

// ── long drafts: a verdict, never a revision ─────────────────────────────────

/** Every `[uno-bot] draft-judge` line logged while `run` runs. */
async function judgeLines(run: () => Promise<unknown>): Promise<string[]> {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    const line = args.map(String).join(" ");
    if (line.includes("draft-judge")) lines.push(line);
  };
  try {
    await run();
  } finally {
    console.log = original;
  }
  return lines;
}

/** A 17,600-character walkthrough — the size live answers reached on
 *  2026-10-07 — whose last sentence only a whole read can see. */
const TAIL = "The last phase is the one nobody has signed off yet.";
const WALKTHROUGH = `${LONG_DRAFT} ${"more of the walkthrough, phase by phase. ".repeat(400)}${TAIL}`;

test("a draft past the revision window gets a real verdict on the whole of it", async () => {
  assert.ok(WALKTHROUGH.length > 17_000 && WALKTHROUGH.length < 18_000);
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  let out: Awaited<ReturnType<typeof reviewDraft>> | undefined;
  const lines = await judgeLines(async () => {
    out = await reviewDraft(fake, { userText: "walk me through it", draft: WALKTHROUGH });
  });

  assert.deepEqual(out, { text: WALKTHROUGH, verdict: "pass" });
  assert.equal(fake.generated.length, 1);
  const asked = fake.generated[0]!;
  // Read whole, to the last sentence, not the first 8,000 characters.
  assert.ok(asked.prompt.includes(TAIL));
  assert.equal(asked.tier, "default");
  // Asked for a verdict and told not to rewrite.
  assert.match(asked.system ?? "", /VERDICT ONLY/);
  // The verdict line says which mode ran, and no line reads `reason=long`.
  assert.equal(lines.length, 1);
  assert.match(lines[0]!, /verdict=pass .*mode=verdict/);
  assert.doesNotMatch(lines[0]!, /reason=long/);
});

test("no path swaps a long answer for a revision, however whole the revision looks", async () => {
  // Past the revision window a rewrite has to come back inside the judge's
  // output ceiling and its timer, and a model that runs out of either returns
  // a faithful prefix — the half-an-answer this mode exists to rule out. So a
  // revision is ignored there even when it is the draft's own length, on every
  // kind of turn, and the fail ships the draft with what the judge found logged.
  const wholeLooking = WALKTHROUGH.replace("call-off path", "call-off route");
  for (const args of [{}, { correction: true, priorAssistantText: "No." }, { forceReason: "absent" }]) {
    const fake = fakeProvider({
      generateReplies: [verdictJson({ verdict: "fail", failed: ["D9"], revised: wholeLooking })],
    });

    let out: Awaited<ReturnType<typeof reviewDraft>> | undefined;
    const lines = await judgeLines(async () => {
      out = await reviewDraft(fake, { userText: "walk me through it", draft: WALKTHROUGH, ...args });
    });

    assert.deepEqual(out, { text: WALKTHROUGH, verdict: "fail" });
    assert.match(lines.at(-1)!, /verdict=fail .*failed=\[D9\] revised=false .*mode=verdict/);
  }
});

test("a draft inside the revision window is judged in revise mode, and says so", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const lines = await judgeLines(() => reviewDraft(fake, { userText: "q", draft: LONG_DRAFT }));

  assert.doesNotMatch(fake.generated[0]!.system ?? "", /VERDICT ONLY/);
  assert.match(lines[0]!, /verdict=pass .*mode=revise/);
});

test("a draft past even the verdict window is skipped on purpose, with no model call", async () => {
  // The bound that keeps a verdict inside the timer: about twice the longest
  // answer seen live. Past it the draft ships unread and the skip says why.
  const huge = `${LONG_DRAFT} ${"more of the walkthrough. ".repeat(1400)}`;
  assert.ok(huge.length > 32_000);

  for (const args of [{}, { correction: true, priorAssistantText: "No." }, { forceReason: "absent" }]) {
    const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });
    const out = await reviewDraft(fake, { userText: "walk me through it", draft: huge, ...args });

    assert.deepEqual(out, { text: huge, verdict: "skip", reason: "draft longer than the judge reads" });
    assert.deepEqual(fake.generated, []);
  }
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

// ── a result table beneath the draft ─────────────────────────────────────────
//
// The reader gets the prose and a table of rows beneath it, so the judge is
// told the table is there and reads its plain list. The list is not the draft:
// code built it from the lookup's rows, the judge never rewrites it, and its
// length moves none of the draft's windows.

const LIST = ["Card 1 — #401 — WIP", "Card 2 — #402 — WIP", "Card 3 — #403 — WIP"].join("\n");
const LONG_LIST = Array.from({ length: 30 }, (_, i) => `Card ${i} with a long title — #${400 + i} — WIP`).join("\n");

test("with a table attached, the judge is told so and reads the plain list after the draft", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const out = await reviewDraft(fake, { userText: "which cards are in WIP?", draft: LONG_DRAFT, tableList: LIST });

  assert.deepEqual(out, { text: LONG_DRAFT, verdict: "pass" });
  const { prompt } = fake.generated[0]!;
  assert.match(prompt, /table attached/i);
  assert.ok(prompt.includes(LIST), "the plain list reaches the judge whole");
  assert.ok(prompt.indexOf(LIST) > prompt.indexOf(LONG_DRAFT), "the list sits beneath the draft, as the reader sees it");
});

test("with no table, the judge's prompt says nothing about one", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  await reviewDraft(fake, { userText: "which cards are in WIP?", draft: LONG_DRAFT });

  assert.doesNotMatch(fake.generated[0]!.prompt, /table attached/i);
});

test("the list does not count toward the draft's length: a short summary over a long list is still skipped", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const out = await reviewDraft(fake, { userText: "q", draft: "Thirty cards are in WIP.", tableList: LONG_LIST });

  assert.equal(out.verdict, "skip");
  assert.equal(fake.generated.length, 0);
});

test("the list does not count toward the revision window either", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });
  const draft = `${LONG_DRAFT} ${"x".repeat(7_900 - LONG_DRAFT.length)}`;

  await reviewDraft(fake, { userText: "q", draft, tableList: LONG_LIST });

  assert.doesNotMatch(fake.generated[0]!.system ?? "", /VERDICT ONLY/);
});

// ── the emoji budget ─────────────────────────────────────────────────────────
//
// A reply carries no emoji, or one 🎉 opening its first line on a shipped,
// merged or published outcome (AGENT.md § Emoji budget). The count is code's,
// so a breach is judged whatever the draft's length, and fails whatever the
// judge says; whether a lone 🎉 sits on a real outcome is the judge's reading.

test("a short draft carrying two emoji is judged, and fails on the emoji gate even when the judge passes it", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const out = await reviewDraft(fake, { userText: "status?", draft: "🚀 Card 2482 is in WIP ✨" });

  assert.equal(fake.generated.length, 1, "the floor is lifted for a breach");
  assert.match(fake.generated[0]!.prompt, /emoji/i, "the judge is told what to repair");
  assert.equal(out.verdict, "fail");
});

test("an emoji anywhere but the start of the first line fails, even alone", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const out = await reviewDraft(fake, { userText: "status?", draft: "Card 2482 is in WIP 👀" });

  assert.equal(out.verdict, "fail");
});

test("a breach ships the judge's revision when it keeps to the budget", async () => {
  const fixed = "Card 2482 is in WIP, and Bill owns it — I checked the Roadmap board just now.";
  const fake = fakeProvider({
    generateReplies: [verdictJson({ verdict: "fail", failed: ["gate:emoji"], revised: fixed })],
  });

  const out = await reviewDraft(fake, {
    userText: "status?",
    draft: "🚀 Card 2482 is in WIP, and Bill owns it — I checked the Roadmap board just now ✨",
  });

  assert.deepEqual(out, { text: fixed, verdict: "fail" });
});

test("a revision that still breaks the budget does not ship", async () => {
  const draft = "🚀 Card 2482 is in WIP, and Bill owns it — I checked the Roadmap board just now ✨";
  const fake = fakeProvider({
    generateReplies: [
      verdictJson({ verdict: "fail", failed: ["gate:emoji"], revised: `${draft.replace(" ✨", "")} 🎉` }),
    ],
  });

  const out = await reviewDraft(fake, { userText: "status?", draft });

  assert.equal(out.verdict, "fail");
  assert.equal(out.text, draft);
});

test("a lone 🎉 opening a short draft is read by the judge, which decides whether it is earned", async () => {
  const plain = "The Roadmap board has 13 cards in WIP.";
  const fake = fakeProvider({
    generateReplies: [verdictJson({ verdict: "fail", failed: ["gate:emoji"], revised: plain })],
  });

  const out = await reviewDraft(fake, { userText: "how many in WIP?", draft: `🎉 ${plain}` });

  assert.equal(fake.generated.length, 1, "a short draft with an emoji is still judged");
  assert.equal(out.verdict, "fail");
  assert.equal(out.text, plain);
});

test("a short draft with no emoji still skips the judge", async () => {
  const fake = fakeProvider({ generateReplies: [] });

  const out = await reviewDraft(fake, {
    userText: "status?",
    draft: "Card 2482 is in WIP at 10:30 — see [the card](https://x.test).",
  });

  assert.equal(out.verdict, "skip");
  assert.equal(fake.generated.length, 0);
});

test("a Slack shortcode counts as an emoji", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "pass" })] });

  const out = await reviewDraft(fake, { userText: "status?", draft: "Shipped :rocket: at 10:30:00 today." });

  assert.equal(out.verdict, "fail");
});

// ── shorten: a forced rewrite to the short answer ────────────────────────────
//
// Live on r525 a 10,198-character walk shipped as written: its length put it
// past the revision window, so the judge could only grade it. A turn whose
// answer is over the prose budget asks for a rewrite to the short answer, and
// that rewrite is short by construction, so it comes back well inside the
// output ceiling and the faithful-prefix risk the window guards against does
// not arise.

/** The walkthrough cut to its point, in its own words. */
const SHORT = `The blueprint's call-off path is the one that changed. ${TAIL}`;

test("a draft forced to shorten is rewritten past the revision window, and the short rewrite ships", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "fail", failed: ["gate:length"], revised: SHORT })] });

  let out: Awaited<ReturnType<typeof reviewDraft>> | undefined;
  const lines = await judgeLines(async () => {
    out = await reviewDraft(fake, {
      userText: "walk me through it",
      draft: WALKTHROUGH,
      forceReason: "table-walk",
      shorten: true,
    });
  });

  assert.deepEqual(out, { text: SHORT, verdict: "fail" });
  const asked = fake.generated[0]!;
  assert.ok(asked.prompt.includes(TAIL), "read whole");
  assert.match(asked.system ?? "", /SHORTEN/);
  assert.doesNotMatch(asked.system ?? "", /VERDICT ONLY/);
  assert.match(lines.at(-1)!, /revised=true .*forced=table-walk mode=shorten/);
});

test("a shorten rewrite that is no shorter, or says what the draft never did, is refused", async () => {
  const sameLength = WALKTHROUGH.replace("call-off path", "call-off route");
  const invented = "Every tutor loves the onboarding flow and nothing needs changing anywhere in the service today.";
  for (const revised of [sameLength, invented]) {
    const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "fail", failed: ["gate:length"], revised })] });
    const out = await reviewDraft(fake, { userText: "q", draft: WALKTHROUGH, forceReason: "table-walk", shorten: true });
    assert.equal(out.text, WALKTHROUGH);
  }
});

test("shorten takes a rewrite of a draft inside the revision window too, however much shorter", async () => {
  const fake = fakeProvider({ generateReplies: [verdictJson({ verdict: "fail", failed: ["gate:length"], revised: SHORT })] });
  const draft = `${LONG_DRAFT} ${TAIL}`;
  const out = await reviewDraft(fake, { userText: "q", draft, forceReason: "table-walk", shorten: true });
  assert.equal(out.text, SHORT, "a rewrite under a quarter of the draft is the point here, not a malfunction");
});
