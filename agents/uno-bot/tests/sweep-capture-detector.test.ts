// The two Capture detectors beside drift (`src/sweep/capture-detector.ts`):
// an undocumented answer and where it goes, and a decision in a note or a card.
//
// The eval cases (docs/evals/fixtures/sweep-capture-cases.json) are replayed
// here through the real detector over the fake adapter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fakeProvider } from "../src/agent/providers/fake";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import {
  modelCaptureDetector,
  parseAnswerReply,
  parseRecordReply,
  type SweepRecord,
} from "../src/sweep/capture-detector";
import type { SweepMessage, SweepSource, SweepThread } from "../src/sweep/index";

interface CaptureCase {
  id: string;
  detector: "answers" | "record";
  name: string;
  judgeNote: string;
  thread?: SweepMessage[];
  record?: SweepRecord;
  sources: SweepSource[];
  recording: { source: "authored" | "captured"; reply: string };
  expect: { answers?: Array<Record<string, unknown>>; findings?: Array<Record<string, unknown>> };
}

const FIXTURE = resolve(process.cwd(), "../..", "docs/evals/fixtures/sweep-capture-cases.json");
const cases = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: CaptureCase[] }).cases;

const threadOf = (messages: SweepMessage[]): SweepThread => ({
  channel: "C0DESIGN",
  channelKind: "public",
  rootTs: messages[0]!.ts,
  messages,
});

test("the fixture holds each shape the ticket names, each with a rubric and a recorded reply", () => {
  assert.deepEqual(cases.map((c) => c.id), ["SC1", "SC2", "SC3", "SC4", "SC5", "SR1", "SR2"]);
  assert.equal(isWithheldRepoPath("docs/evals/fixtures/sweep-capture-cases.json"), true);
  for (const c of cases) {
    assert.ok(c.judgeNote.trim(), `${c.id} has a judgeNote`);
    assert.ok(["authored", "captured"].includes(c.recording.source), `${c.id} says where its reply came from`);
  }
});

for (const c of cases) {
  test(`eval ${c.id}: ${c.name}`, async () => {
    const provider = fakeProvider({ generateReplies: [c.recording.reply] });
    const detector = modelCaptureDetector(provider);
    if (c.detector === "answers") {
      const result = await detector.answers({ thread: threadOf(c.thread!), sources: c.sources });
      assert.equal(result.ok, true);
      if (!result.ok) return;
      const kept = result.answers.map((a) => ({
        anchorId: a.anchorId,
        section: a.section,
        newSection: a.newSection,
        text: a.text,
        answeredBy: a.answeredBy,
        evidenceTs: a.evidenceTs,
      }));
      assert.deepEqual(kept, c.expect.answers);
    } else {
      const result = await detector.record({ record: c.record!, sources: c.sources });
      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.deepEqual(
        result.findings.map((f) => ({ blockId: f.blockId, replacement: f.replacement, evidenceIds: f.evidenceIds })),
        c.expect.findings,
      );
    }
  });
}

const training = cases.find((c) => c.id === "SC1")!;

test("an answer the thread never gave, a heading that is not one, or both places at once is dropped", () => {
  const thread = threadOf(training.thread!);
  const base = {
    question_ts: training.thread![0]!.ts,
    answer_ts: [training.thread![1]!.ts],
    answered_by: "U0ANS",
    documented: false,
    source_url: training.sources[0]!.url,
    text: "Ratio is 1 tutor to 4–5 students.",
    confidence: 0.9,
  };
  const parse = (over: Record<string, unknown>) =>
    parseAnswerReply(JSON.stringify({ answers: [{ ...base, section_block_id: "h-setup", new_section: null, ...over }] }), thread, training.sources);
  assert.equal(parse({}).length, 1);
  assert.equal(parse({ answer_ts: ["1.0"] }).length, 0, "an answer that is not in the thread");
  assert.equal(parse({ answer_ts: [base.question_ts] }).length, 0, "the question is not its own answer");
  assert.equal(parse({ section_block_id: "b-setup-1" }).length, 0, "a paragraph is not a section");
  assert.equal(parse({ new_section: "Ratios" }).length, 0, "both a section and a new one");
  assert.equal(parse({ section_block_id: null }).length, 0, "neither");
  assert.equal(parse({ text: "Line one\nline two" }).length, 0, "two lines");
  assert.equal(parse({ text: "Ratio is 1 tutor to…" }).length, 0, "a truncation mark");
  assert.equal(parse({ confidence: 0.5 }).length, 0, "under the floor");
  assert.equal(parse({ source_url: "https://www.notion.so/elsewhere" }).length, 0, "a page nobody read");
  const named = parse({ section_block_id: null, new_section: "Session setup" });
  assert.equal(named[0]?.section, "Session setup", "a new section named like a heading goes under that heading");
});

test("a card's own entries are never the blocks its fix rewrites", () => {
  const card: SweepSource = {
    url: "https://www.notion.so/card",
    kind: "notion",
    writable: true,
    title: "Universal card",
    blocks: [
      { id: "b-spec", lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Buttons use the primary style." },
      { id: "b-edit", lastEditedTime: "2026-09-29T10:00:00.000Z", text: "Decided: buttons use secondary." },
    ],
    text: "",
    pillars: ["Universal"],
    contributors: [],
  };
  const record: SweepRecord = {
    kind: "card",
    url: card.url,
    title: card.title,
    entries: [{ id: "b-edit", text: "Decided: buttons use secondary." }],
  };
  const reply = (block: string) =>
    JSON.stringify({
      findings: [
        {
          source_url: card.url,
          block_id: block,
          source_says: "Primary.",
          record_says: "Secondary.",
          replacement: "Buttons use the secondary style.",
          evidence_ids: ["b-edit"],
          confidence: 0.9,
        },
      ],
    });
  assert.equal(parseRecordReply(reply("b-spec"), record, [card]).length, 1);
  assert.equal(parseRecordReply(reply("b-edit"), record, [card]).length, 0, "the decision itself is not rewritten");
});
