// The DM detector: a thread of a person's DM with uno-bot in, what uno-bot
// could not answer, what it saw disagree and what the person told it was
// decided out — on the `chill` tier through ModelProvider, with a parse that
// keeps only what the thread can stand behind.
//
// The eval cases (docs/evals/fixtures/dm-cases.json) are replayed here through
// the real detector over the fake adapter: an uncertain answer against a
// sourced one, a stated decision against an opinion, and a disagreement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fakeProvider } from "../src/agent/providers/fake";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import { detectDmItems, DM_TIER, mayHoldDmItem, parseDmReply, repeatsPerson } from "../src/dm-sweep/index";
import type { DmMessage } from "../src/sweep/index";

interface DmCase {
  id: string;
  name: string;
  judgeNote: string;
  since: string;
  thread: DmMessage[];
  recording: { source: "authored" | "captured"; reply: string };
  expect: {
    unanswered: Array<Record<string, unknown>>;
    disagreements: Array<Record<string, unknown>>;
    decisions: Array<Record<string, unknown>>;
  };
}

const FIXTURE = resolve(process.cwd(), "../..", "docs/evals/fixtures/dm-cases.json");
const cases = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: DmCase[] }).cases;

test("the fixture holds the five shapes, each with a rubric and a recorded reply", () => {
  assert.deepEqual(cases.map((c) => c.id), ["DM1", "DM2", "DM3", "DM4", "DM5"]);
  assert.equal(isWithheldRepoPath("docs/evals/fixtures/dm-cases.json"), true);
  for (const c of cases) {
    assert.ok(c.judgeNote.trim(), `${c.id} has a judgeNote`);
    assert.ok(["authored", "captured"].includes(c.recording.source), `${c.id} says where its reply came from`);
  }
});

for (const c of cases) {
  test(`eval ${c.id}: ${c.name}`, async () => {
    const provider = fakeProvider({ generateReplies: [c.recording.reply] });
    const result = await detectDmItems(provider, { rootTs: c.thread[0]!.ts, messages: c.thread, since: c.since });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(
      result.unanswered.map((u) => ({ answerTs: u.answerTs, what: u.what })),
      c.expect.unanswered,
    );
    assert.deepEqual(
      result.disagreements.map((d) => ({ answerTs: d.answerTs, topic: d.topic, sources: d.sources, designSystem: d.designSystem })),
      c.expect.disagreements,
    );
    assert.deepEqual(result.decisions.map((d) => ({ messageTs: d.messageTs })), c.expect.decisions);
    assert.equal(provider.generated.length, 1);
    assert.equal(provider.generated[0]!.tier, DM_TIER);
    const prompt = provider.generated[0]!.prompt;
    for (const m of c.thread) assert.ok(prompt.includes(`] ${m.byBot ? "uno-bot" : "person"}: `) && prompt.includes(m.ts));
  });
}

const thread: DmMessage[] = [
  { ts: "100.000001", user: "U0MAYA", byBot: false, text: "What's the tutor ratio? I need it for the staffing plan draft." },
  { ts: "200.000001", user: "U0BOT", byBot: true, text: "I couldn't find it." },
];

test("the parse keeps only new messages of the right side, over the floor, with a name left once cleaned", () => {
  const reply = (o: Record<string, unknown>) => JSON.stringify({ unanswered: [], disagreements: [], decisions: [], ...o });
  // An unanswered item on the person's message, or on an old one, is none.
  assert.equal(parseDmReply(reply({ unanswered: [{ answer_ts: "100.000001", what: "x", confidence: 0.9 }] }), thread, "0").unanswered.length, 0);
  assert.equal(parseDmReply(reply({ unanswered: [{ answer_ts: "200.000001", what: "x", confidence: 0.9 }] }), thread, "300").unanswered.length, 0);
  assert.equal(parseDmReply(reply({ unanswered: [{ answer_ts: "200.000001", what: "x", confidence: 0.5 }] }), thread, "0").unanswered.length, 0);
  assert.equal(parseDmReply(reply({ unanswered: [{ answer_ts: "200.000001", what: "<@U0X>", confidence: 0.9 }] }), thread, "0").unanswered.length, 0);
  // A decision on uno-bot's message is none.
  assert.equal(parseDmReply(reply({ decisions: [{ message_ts: "200.000001", confidence: 0.9 }] }), thread, "0").decisions.length, 0);
  // A disagreement needs two different sources, and a topic in uno-bot's words.
  const d = (topic: string, sources: string[]) =>
    parseDmReply(reply({ disagreements: [{ answer_ts: "200.000001", topic, sources, design_system: false, confidence: 0.9 }] }), thread, "0")
      .disagreements;
  assert.equal(d("the ratio", ["Figma", "Figma"]).length, 0);
  assert.equal(d("the ratio", ["Figma"]).length, 0);
  assert.equal(d("it for the staffing plan draft", ["the PRD", "the card"]).length, 0);
  assert.deepEqual(d("the ratio", ["the PRD", "the Roadmap card"])[0]!.sources, ["the PRD", "the Roadmap card"]);
  // Not JSON: nothing.
  assert.deepEqual(parseDmReply("sorry", thread, "0"), { unanswered: [], disagreements: [], decisions: [] });
});

test("a quote is five of the person's words in a row", () => {
  assert.equal(repeatsPerson("the staffing plan draft now", ["for the staffing plan draft now please"]), true);
  assert.equal(repeatsPerson("the staffing plan", ["for the staffing plan draft"]), false);
  assert.equal(repeatsPerson("the warning colour", ["what's our warning colour?"]), false);
});

test("a thread with nothing new costs no model call", async () => {
  assert.equal(mayHoldDmItem(thread, "300"), false);
  const provider = fakeProvider({ generateReplies: ["{}"] });
  const result = await detectDmItems(provider, { rootTs: "100.000001", messages: thread, since: "300" });
  assert.equal(result.ok, true);
  assert.equal(provider.generated.length, 0);
});
