// The commitment detector and the completion judge: a thread in, typed
// promises out, on the `chill` tier through ModelProvider — and parses that
// keep only what the thread can stand behind.
//
// The eval cases (docs/evals/fixtures/commitment-cases.json) are replayed here
// through the real detector over the fake adapter: a real promise, a request
// answered yes, a hypothetical and a joke.
import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fakeProvider } from "../src/agent/providers/fake";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import {
  cleanWhat,
  COMMITMENT_TIER,
  detectCommitments,
  judgeEvidence,
  mayHoldPromise,
  parseCommitmentReply,
  parseJudgeReply,
} from "../src/commitments/index";
import type { SweepMessage, SweepThread } from "../src/sweep/index";

interface CommitmentCase {
  id: string;
  name: string;
  judgeNote: string;
  since: string;
  thread: SweepMessage[];
  recording: { source: "authored" | "captured"; reply: string };
  expect: { commitments: Array<Record<string, unknown>> };
}

/** A completion-judge case: a promise, what came after it, the morning it is
 *  judged, and the answer it must come to. */
interface JudgeCase {
  id: string;
  name: string;
  judgeNote: string;
  promise: { promiser: string; what: string; ts: string };
  after: SweepMessage[];
  now: number;
  recording: { source: "authored" | "captured"; reply: string };
  expect: { answer: string; reason?: string };
}

const FIXTURE = resolve(process.cwd(), "../..", "docs/evals/fixtures/commitment-cases.json");
const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: CommitmentCase[]; judgeCases: JudgeCase[] };
const cases = fixture.cases;

const threadOf = (messages: SweepMessage[]): SweepThread => ({
  channel: "C0DESIGN",
  channelKind: "public",
  rootTs: messages[0]!.ts,
  messages,
});

test("the fixture holds the four shapes, each with a rubric and a recorded reply", () => {
  assert.deepEqual(cases.map((c) => c.id), ["CM1", "CM2", "CM3", "CM4"]);
  assert.equal(isWithheldRepoPath("docs/evals/fixtures/commitment-cases.json"), true);
  for (const c of cases) {
    assert.ok(c.judgeNote.trim(), `${c.id} has a judgeNote`);
    assert.ok(["authored", "captured"].includes(c.recording.source), `${c.id} says where its reply came from`);
  }
});

for (const c of cases) {
  test(`eval ${c.id}: ${c.name}`, async () => {
    const provider = fakeProvider({ generateReplies: [c.recording.reply] });
    const result = await detectCommitments(provider, { thread: threadOf(c.thread), since: c.since });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const kept = result.commitments.map((f) => ({
      messageTs: f.messageTs,
      promiser: f.promiser,
      requester: f.requester,
      what: f.what,
      deadline: f.deadline,
    }));
    assert.deepEqual(kept, c.expect.commitments);
    assert.equal(provider.generated.length, 1);
    assert.equal(provider.generated[0]!.tier, COMMITMENT_TIER);
    for (const m of c.thread) assert.ok(provider.generated[0]!.prompt.includes(m.ts));
  });
}

const thread: SweepMessage[] = [
  { ts: "100.000001", user: "U0BEA", text: "Can you share the link?" },
  { ts: "200.000001", user: "U0MAYA", text: "Sure, I'll share it tomorrow" },
];
const entry = (over: Record<string, unknown> = {}) => ({
  message_ts: "200.000001",
  promiser: "U0MAYA",
  requester: "U0BEA",
  what: "share the link",
  deadline: "tomorrow",
  confidence: 0.9,
  ...over,
});
const parse = (...entries: Record<string, unknown>[]) =>
  parseCommitmentReply(JSON.stringify({ commitments: entries }), thread, "150.000000");

test("the parse refuses what the thread cannot stand behind", () => {
  assert.equal(parse(entry()).length, 1);
  // A message that is not new tonight: read the night it was made.
  assert.equal(parse(entry({ message_ts: "100.000001", promiser: "U0BEA" })).length, 0);
  // A message the model invented.
  assert.equal(parse(entry({ message_ts: "999.000001" })).length, 0);
  // A promiser who did not write the promising message.
  assert.equal(parse(entry({ promiser: "U0BEA" })).length, 0);
  // Under the floor, or off the scale.
  assert.equal(parse(entry({ confidence: 0.5 })).length, 0);
  assert.equal(parse(entry({ confidence: 1.5 })).length, 0);
  // A summary that is only markup.
  assert.equal(parse(entry({ what: "<@U0BEA>" })).length, 0);
  // Twice the same message: kept once.
  assert.equal(parse(entry(), entry()).length, 1);
  // A requester who never posted, or who is the promiser, is nobody.
  assert.equal(parse(entry({ requester: "U0GHOST" }))[0]!.requester, null);
  assert.equal(parse(entry({ requester: "U0MAYA" }))[0]!.requester, null);
  // Not JSON: none.
  assert.deepEqual(parseCommitmentReply("I think Maya promised", thread, "150.000000"), []);
});

test("a thread with no promise words tonight costs no model call", async () => {
  const provider = fakeProvider({ generateReplies: ["{}"] });
  const quiet = [
    { ts: "100.000001", user: "U0BEA", text: "I'll handle it" }, // old: before the cursor
    { ts: "200.000001", user: "U0MAYA", text: "Looks great, thanks!" },
  ];
  assert.equal(mayHoldPromise(quiet, "150.000000"), false);
  const result = await detectCommitments(provider, { thread: threadOf(quiet), since: "150.000000" });
  assert.deepEqual(result, { ok: true, commitments: [] });
  assert.equal(provider.generated.length, 0);
});

test("a summary is stored and repeated without markup, mentions or quotes", () => {
  assert.equal(cleanWhat('"Share the <https://figma.com/x|Figma link> with @maya."'), "share the Figma link with");
  assert.equal(cleanWhat("update <@U0BEA>'s PRD"), "update 's PRD");
  assert.equal(cleanWhat("   "), "");
  assert.ok(cleanWhat("x".repeat(400)).length <= 140);
});

for (const c of fixture.judgeCases) {
  test(`eval ${c.id}: ${c.name}`, async () => {
    assert.ok(c.judgeNote.trim());
    const provider = fakeProvider({ generateReplies: [c.recording.reply] });
    const verdict = await judgeEvidence(provider, { promiser: c.promise.promiser, what: c.promise.what, promiseTs: c.promise.ts, messages: c.after, sources: [], now: c.now });
    assert.equal(verdict.ok, true);
    if (!verdict.ok) return;
    assert.deepEqual({ answer: verdict.answer, ...(verdict.reason ? { reason: verdict.reason } : {}) }, c.expect);
    const prompt = provider.generated[0]!.prompt;
    assert.match(prompt, /MADE: Wed, Oct 14, /, "the judge knows when it was made");
    assert.match(prompt, /NOW: Mon, Oct 19, 9:00 AM ET/, "and when it is now");
    for (const m of c.after) assert.ok(prompt.includes(m.ts));
  });
}

test("the fixture's judge cases are the two Oct 14 false alarms, both no longer needed", () => {
  assert.deepEqual(fixture.judgeCases.map((c) => [c.id, c.expect.answer]), [["CJ1", "no-longer-needed"], ["CJ2", "no-longer-needed"]]);
});

describe("the judge's three answers", () => {
  const shown: SweepMessage[] = [{ ts: "300.000001", user: "U0MAYA", text: "Here it is: <https://figma.com/file/x|link>" }];
  const read = (reply: unknown) => parseJudgeReply(typeof reply === "string" ? reply : JSON.stringify(reply), shown);
  it("Done, with evidence it was shown", () => {
    assert.deepEqual(read({ answer: "done", reason: null, evidence_ts: ["300.000001"], confidence: 0.9 }), { answer: "done", evidenceTs: ["300.000001"] });
  });
  it("No longer needed because someone said so, with that message as evidence", () => {
    assert.deepEqual(read({ answer: "no_longer_needed", reason: "said", evidence_ts: ["300.000001"], confidence: 0.9 }), {
      answer: "no-longer-needed",
      reason: "said",
      evidenceTs: ["300.000001"],
    });
  });
  it("No longer needed because its moment passed, with no message needed", () => {
    assert.deepEqual(read({ answer: "no_longer_needed", reason: "time_passed", evidence_ts: [], confidence: 0.85 }), {
      answer: "no-longer-needed",
      reason: "time-passed",
      evidenceTs: [],
    });
  });
  it("Still open", () => {
    assert.deepEqual(read({ answer: "still_open", reason: null, evidence_ts: [], confidence: 0.9 }), { answer: "still-open", evidenceTs: [] });
  });
  it("refuses anything off-shape as Still open", () => {
    const open = { answer: "still-open", evidenceTs: [] };
    for (const reply of [
      { answer: "done", evidence_ts: ["999.1"], confidence: 0.9 }, // evidence it was never shown
      { answer: "done", evidence_ts: [], confidence: 0.9 }, // no evidence
      { answer: "done", evidence_ts: ["300.000001"], confidence: 0.4 }, // under the floor
      { answer: "done", evidence_ts: ["300.000001"], confidence: 1.4 }, // off the scale
      { answer: "done", evidence_ts: ["300.000001"] }, // no confidence
      { answer: "no_longer_needed", reason: "said", evidence_ts: [], confidence: 0.9 }, // said, but where?
      { answer: "no_longer_needed", reason: "felt like it", evidence_ts: ["300.000001"], confidence: 0.9 },
      { answer: "maybe", evidence_ts: [], confidence: 0.9 },
      { done: true, evidence_ts: ["300.000001"], confidence: 0.9 }, // the old shape
      "not json",
    ]) {
      assert.deepEqual(read(reply), open, JSON.stringify(reply));
    }
  });
});

test("the judge reads the messages after the promise oldest first, keeping the first when they don't all fit", async () => {
  const many: SweepMessage[] = Array.from({ length: 80 }, (_, i) => ({ ts: `${1000 + i}.000001`, user: "U0BEA", text: `${i === 0 ? "oh all good, he's aware" : "chatter"} ${"x".repeat(400)}` }));
  const provider = fakeProvider({ generateReplies: ['{"answer":"still_open","reason":null,"evidence_ts":[],"confidence":0.9}'] });
  await judgeEvidence(provider, { promiser: "U0MAYA", what: "text him", promiseTs: "999.000001", messages: [...many].reverse(), sources: [] });
  const prompt = provider.generated[0]!.prompt;
  assert.ok(prompt.includes("1000.000001"), "the first reply is read");
  assert.ok(!prompt.includes("1079.000001"), "the newest are the ones left out");
  assert.ok(prompt.indexOf("1000.000001") < prompt.indexOf("1001.000001"), "oldest first");
});

test("the judge says when it fails", async () => {
  const input = { promiser: "U0MAYA", what: "share the Figma link", promiseTs: "200.000001", messages: [], sources: [] };
  const failing = fakeProvider({ generateReplies: [] });
  (failing as { generate: unknown }).generate = async () => ({ ok: false, model: "m", message: "429 quota" });
  assert.deepEqual(await judgeEvidence(failing, input), { ok: false, error: "429 quota" });
});
