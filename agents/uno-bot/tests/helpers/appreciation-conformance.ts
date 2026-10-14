// The AppreciationLog conformance suite.
//
// The same cases run against the in-memory log under `node --test`
// (`tests/appreciation.test.ts`) and the D1 log under workerd with the real
// migrations applied (`tests/workerd/usage-log.conformance.test.ts`). A
// factory hands back the log and a way to make a message KNOWN — tied to a
// turn — which the D1 run does by writing the rows its statement reads.
import assert from "node:assert/strict";

import type { AppreciationLog, KnownMessage, ThanksReaction } from "../../src/usage/appreciation";
import type { ConformanceRunner } from "./usage-log-conformance";

const ANSWER = "1700000005.000200";

export function thanks(over: Partial<ThanksReaction> = {}): ThanksReaction {
  return { channel: "C1", itemTs: ANSWER, userId: "U1", emoji: "pray", at: 1_000, conversationType: null, ...over };
}

export function runAppreciationConformance(
  label: string,
  make: () => { log: AppreciationLog; know(channel: string, itemTs: string, known: KnownMessage): Promise<void> },
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] appreciation: ${name}`, fn);

  it("a thanks on a message the record does not know reads back with no turn", async () => {
    const { log } = make();
    await log.record(thanks());
    assert.deepEqual(await log.get("C1", ANSWER, "U1", "pray"), { ...thanks(), turnId: null });
    assert.equal(await log.get("C1", ANSWER, "U2", "pray"), null);
  });

  it("a thanks on a known answer joins its turn, and takes the turn's conversation type", async () => {
    const { log, know } = make();
    await know("C1", ANSWER, { turnId: "C1:1700000000.000100", conversationType: "group" });
    await log.record(thanks());
    assert.deepEqual(await log.get("C1", ANSWER, "U1", "pray"), {
      ...thanks(),
      turnId: "C1:1700000000.000100",
      conversationType: "group",
    });
  });

  it("the same ts in another channel is another message", async () => {
    const { log, know } = make();
    await know("C1", ANSWER, { turnId: "C1:1700000000.000100", conversationType: "channel" });
    await log.record(thanks({ channel: "D9", conversationType: "im" }));
    assert.deepEqual(await log.get("D9", ANSWER, "U1", "pray"), {
      ...thanks({ channel: "D9", conversationType: "im" }),
      turnId: null,
    });
  });

  it("one row per person per emoji per message: the first write is kept", async () => {
    const { log } = make();
    await log.record(thanks());
    await log.record(thanks({ at: 2_000 }));
    await log.record(thanks({ emoji: "goat", at: 3_000 }));
    await log.record(thanks({ userId: "U2", at: 4_000 }));
    assert.equal((await log.get("C1", ANSWER, "U1", "pray"))?.at, 1_000);
    assert.equal((await log.get("C1", ANSWER, "U1", "goat"))?.at, 3_000);
    assert.equal((await log.get("C1", ANSWER, "U2", "pray"))?.at, 4_000);
  });
}
