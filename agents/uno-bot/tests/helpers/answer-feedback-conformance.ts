// The AnswerFeedbackLog conformance suite.
//
// The same cases run against the in-memory log under `node --test`
// (`tests/usage-log-in-memory.test.ts`) and the D1 log under workerd with the
// real migrations applied (`tests/workerd/usage-log.conformance.test.ts`).
import assert from "node:assert/strict";

import type { AnswerFeedbackLog, AnswerFeedbackRecord } from "../../src/usage/feedback";
import type { ConformanceRunner } from "./usage-log-conformance";

const ANSWER = "1700000005.000200";
const TURN = "C1:1700000000.000100";

function tap(over: Partial<AnswerFeedbackRecord> = {}): AnswerFeedbackRecord {
  return { answerTs: ANSWER, userId: "U1", turnId: TURN, rating: "down", reason: null, hasNote: false, at: 1_000, ...over };
}

export function runAnswerFeedbackConformance(
  label: string,
  make: () => AnswerFeedbackLog,
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] answer feedback: ${name}`, fn);

  it("a press reads back against the answer and the person", async () => {
    const log = make();
    await log.record(tap({ rating: "up" }));
    assert.deepEqual(await log.get(ANSWER, "U1"), tap({ rating: "up" }));
    assert.equal(await log.get(ANSWER, "U2"), null);
  });

  it("the pop-up's reason lands on the bad answer's row", async () => {
    const log = make();
    await log.record(tap());
    await log.record(tap({ reason: "too_long", hasNote: true, at: 2_000 }));
    assert.deepEqual(await log.get(ANSWER, "U1"), tap({ reason: "too_long", hasNote: true, at: 2_000 }));
  });

  it("pressing bad twice keeps the reason already given", async () => {
    const log = make();
    await log.record(tap({ reason: "wrong_facts", hasNote: true }));
    await log.record(tap({ at: 3_000 }));
    assert.deepEqual(await log.get(ANSWER, "U1"), tap({ reason: "wrong_facts", hasNote: true, at: 3_000 }));
  });

  it("a change of mind replaces the rating and clears the reason", async () => {
    const log = make();
    await log.record(tap({ reason: "other" }));
    await log.record(tap({ rating: "up", at: 4_000 }));
    assert.deepEqual(await log.get(ANSWER, "U1"), tap({ rating: "up", at: 4_000 }));
    await log.record(tap({ at: 5_000 }));
    assert.deepEqual(await log.get(ANSWER, "U1"), tap({ at: 5_000 }));
  });

  it("a write with no turn keeps the turn the row has", async () => {
    const log = make();
    await log.record(tap());
    await log.record(tap({ turnId: null, reason: "missing_source", at: 6_000 }));
    assert.equal((await log.get(ANSWER, "U1"))?.turnId, TURN);
  });

  it("two people on one answer are two rows", async () => {
    const log = make();
    await log.record(tap({ rating: "up" }));
    await log.record(tap({ userId: "U2" }));
    assert.equal((await log.get(ANSWER, "U1"))?.rating, "up");
    assert.equal((await log.get(ANSWER, "U2"))?.rating, "down");
  });
}
