// The drift detector: a thread and its sources in, typed findings out, on the
// `chill` tier through ModelProvider — and a parse that keeps only what the
// read can stand behind.
//
// The eval cases (docs/evals/fixtures/sweep-drift-cases.json) are replayed
// here through the real detector over the fake adapter: true drift, agreement
// and a near-miss, each against the reply recorded for it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fakeProvider } from "../src/agent/providers/fake";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import {
  CONFIDENCE_FLOOR,
  DETECTOR_TIER,
  detectDrift,
  parseDetectorReply,
  type SweepMessage,
  type SweepSource,
  type SweepThread,
} from "../src/sweep/index";

interface DriftCase {
  id: string;
  name: string;
  judgeNote: string;
  thread: SweepMessage[];
  sources: SweepSource[];
  recording: { source: "authored" | "captured"; reply: string };
  expect: { findings: Array<Record<string, unknown>> };
}

// Resolved from the working directory, as tests/repo-read-guard.test.ts does:
// `npm test` runs at agents/uno-bot, two levels under the repository root.
const FIXTURE = resolve(process.cwd(), "../..", "docs/evals/fixtures/sweep-drift-cases.json");
const cases = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: DriftCase[] }).cases;

const threadOf = (c: DriftCase): SweepThread => ({
  channel: "C0DESIGN",
  channelKind: "public",
  rootTs: c.thread[0]!.ts,
  messages: c.thread,
});

test("the fixture holds the three shapes, each with a rubric and a recorded reply", () => {
  assert.deepEqual(cases.map((c) => c.id), ["SW1", "SW2", "SW3"]);
  // Its answers are plain text; the read guard is what keeps them from the bot.
  assert.equal(isWithheldRepoPath("docs/evals/fixtures/sweep-drift-cases.json"), true);
  for (const c of cases) {
    assert.ok(c.judgeNote.trim(), `${c.id} has a judgeNote`);
    assert.ok(["authored", "captured"].includes(c.recording.source), `${c.id} says where its reply came from`);
  }
});

for (const c of cases) {
  test(`eval ${c.id}: ${c.name}`, async () => {
    const provider = fakeProvider({ generateReplies: [c.recording.reply] });
    const result = await detectDrift(provider, { thread: threadOf(c), sources: c.sources });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const kept = result.findings.map((f) => ({
      blockId: f.blockId,
      lastEditedTime: f.lastEditedTime,
      replacement: f.replacement,
      claimedBy: f.claimedBy,
      evidenceTs: f.evidenceTs,
    }));
    assert.deepEqual(kept, c.expect.findings);
    // One call, on the detector's tier, carrying the thread and every block id.
    assert.equal(provider.generated.length, 1);
    assert.equal(provider.generated[0]!.tier, DETECTOR_TIER);
    for (const m of c.thread) assert.ok(provider.generated[0]!.prompt.includes(m.ts));
    for (const b of c.sources[0]!.blocks) assert.ok(provider.generated[0]!.prompt.includes(b.id));
  });
}

const [trueDrift] = cases;
const reply = (f: Record<string, unknown>) =>
  JSON.stringify({
    findings: [
      {
        source_url: trueDrift!.sources[0]!.url,
        block_id: "blk-launch",
        source_says: "Launch is October 15.",
        thread_says: "Launch moved to November 1.",
        replacement: "Launch date: November 1",
        evidence_ts: [trueDrift!.thread[1]!.ts],
        claimed_by: null,
        confidence: 0.9,
        ...f,
      },
    ],
  });
const parse = (f: Record<string, unknown>) =>
  parseDetectorReply(reply(f), threadOf(trueDrift!), trueDrift!.sources);

test("the parse refuses what the read cannot stand behind", () => {
  assert.equal(parse({}).length, 1, "the control case is kept");
  assert.equal(parse({ source_url: "https://www.notion.so/never-linked" }).length, 0, "a source nobody linked");
  assert.equal(parse({ block_id: "blk-invented" }).length, 0, "a block the read did not return");
  assert.equal(parse({ evidence_ts: ["1111.000000"] }).length, 0, "evidence outside the thread");
  assert.equal(parse({ replacement: "" }).length, 0, "an empty replacement");
  assert.equal(parse({ confidence: CONFIDENCE_FLOOR - 0.01 }).length, 0, "under the confidence floor");
  assert.equal(parseDetectorReply("I think the date changed.", threadOf(trueDrift!), trueDrift!.sources).length, 0);
});

test("the stamp kept is the read's, never the model's", () => {
  const [kept] = parse({ last_edited_time: "2030-01-01T00:00:00.000Z" });
  assert.equal(kept?.lastEditedTime, "2026-09-01T10:00:00.000Z");
});

test("a detector that could not answer says so, and finds nothing", async () => {
  const provider = fakeProvider({ generateFailMessage: "429 quota" });
  const result = await detectDrift(provider, { thread: threadOf(trueDrift!), sources: trueDrift!.sources });
  assert.deepEqual(result, { ok: false, error: "429 quota" });
});
