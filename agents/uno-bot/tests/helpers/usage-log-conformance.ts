// The UsageLog conformance suite.
//
// Written only against the `UsageLog` port, and handed its runner, so the same
// cases run against the in-memory adapter under `node --test`
// (`tests/usage-log-in-memory.test.ts`) and against the D1 adapter under
// workerd with the real migrations applied to a local D1
// (`tests/workerd/usage-log.conformance.test.ts`). The pattern is ThreadState's
// (`tests/helpers/thread-state-conformance.ts`).
import assert from "node:assert/strict";

import { fakeProvider } from "../../src/agent/providers/fake";
import type { AskCategoryStore } from "../../src/usage/category-store";
import { TEXT_RETENTION_MS, runClassifyBatch, runTextPurge } from "../../src/usage/classify-run";
import type { TurnRecord, UsageLog } from "../../src/usage/store";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

/** A fully populated channel turn — every nullable column set. */
export function turnRecord(over: Partial<TurnRecord> = {}): TurnRecord {
  return {
    turnId: "C1:1700000000.000200",
    build: "r1-test",
    requesterId: "U1",
    surface: "channel",
    inThread: true,
    channelId: "C1",
    askTs: "1700000000.000200",
    askedAt: 1_700_000_000_200,
    firstAnswerAt: 1_700_000_004_700,
    latencyMs: 4_500,
    tier: "default",
    routeReason: "default",
    provider: "gemini",
    model: "gemini-3.8-flash",
    fallbackUsed: false,
    tokensIn: 41_000,
    tokensOut: 350,
    tokensThinking: 1_200,
    tokensCached: 30_000,
    costUsd: 0.014_137_5,
    toolsCalled: ["search_blueprint", "read_reference"],
    sourcesCited: ["blueprint", "notion"],
    disposition: "answered",
    proposalId: "1700000000.000300",
    stopUsed: false,
    selfFiledTicketUrl: "https://github.com/BilLogic/plus-uno/issues/900",
    testTraffic: false,
    requestText: "where is the onboarding PRD?",
    subType: null,
    painCategory: 7,
    classifiedAt: null,
    ...over,
  };
}

export function runUsageLogConformance(
  label: string,
  make: () => UsageLog,
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a recorded turn reads back field for field", async () => {
    const log = make();
    const turn = turnRecord();
    await log.record(turn);
    assert.deepEqual(await log.get(turn.turnId), turn);
  });

  it("a turn nobody recorded reads as null", async () => {
    const log = make();
    assert.equal(await log.get("C1:0"), null);
  });

  it("empty columns read back as null, false and empty — never as undefined or zero", async () => {
    const log = make();
    const turn = turnRecord({
      turnId: "D1:1700000000.000500",
      surface: "assistant",
      inThread: false,
      channelId: null,
      firstAnswerAt: null,
      latencyMs: null,
      provider: null,
      model: null,
      tokensIn: 0,
      tokensOut: 0,
      tokensThinking: 0,
      tokensCached: 0,
      costUsd: null,
      toolsCalled: [],
      sourcesCited: [],
      disposition: "stopped",
      proposalId: null,
      stopUsed: true,
      selfFiledTicketUrl: null,
      testTraffic: true,
      requestText: null,
      subType: null,
      painCategory: null,
      classifiedAt: null,
    });
    await log.record(turn);
    assert.deepEqual(await log.get(turn.turnId), turn);
  });

  it("recording the same turn twice keeps one row, holding the later values", async () => {
    // A runner alarm is at-least-once: a turn that runs again must rewrite its
    // row, not count twice.
    const log = make();
    await log.record(turnRecord({ disposition: "failed", latencyMs: null, firstAnswerAt: null }));
    const retried = turnRecord({ disposition: "answered" });
    await log.record(retried);
    assert.deepEqual(await log.get(retried.turnId), retried);
  });

  it("two turns are two rows", async () => {
    const log = make();
    const a = turnRecord({ turnId: "C1:1.1" });
    const b = turnRecord({ turnId: "C1:1.2", requesterId: "U2" });
    await log.record(a);
    await log.record(b);
    assert.deepEqual(await log.get(a.turnId), a);
    assert.deepEqual(await log.get(b.turnId), b);
  });

  it("a record changed after it was written changes nothing stored", async () => {
    const log = make();
    const turn = turnRecord();
    await log.record(turn);
    turn.toolsCalled.push("slack_search");
    turn.disposition = "failed";
    assert.deepEqual(await log.get(turn.turnId), turnRecord());
  });
}

/** A usage log and the category store over the same rows. */
export interface CategoryPair {
  log: UsageLog;
  store: AskCategoryStore;
}

const DAY = 24 * 60 * 60 * 1000;
/** The end-of-day run's clock in these cases. */
const NOW = 1_800_000_000_000;

/**
 * The corpus-category cases: the classifier's queue, its one write, the purge
 * and the retry rule, over the category store and the usage log together.
 */
export function runCategoryConformance(
  label: string,
  make: () => Promise<CategoryPair> | CategoryPair,
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);
  const channelAsk = (id: string, over: Partial<TurnRecord> = {}) =>
    turnRecord({ turnId: id, proposalId: null, painCategory: null, askedAt: NOW - DAY, ...over });

  it("the queue is real channel asks still holding text, oldest first", async () => {
    const { log, store } = await make();
    await log.record(channelAsk("C1:2", { askedAt: NOW - 1_000 }));
    await log.record(channelAsk("C1:1", { askedAt: NOW - 2_000, proposalId: "1.1", painCategory: 7 }));
    await log.record(channelAsk("C1:test", { testTraffic: true }));
    await log.record(channelAsk("D1:dm", { surface: "assistant", channelId: null, requestText: null }));
    await log.record(channelAsk("C1:done", { requestText: null, classifiedAt: NOW - DAY, subType: "Status recap", painCategory: 2 }));
    assert.deepEqual(await store.pendingAsks(10), [
      { turnId: "C1:1", text: "where is the onboarding PRD?", staged: true },
      { turnId: "C1:2", text: "where is the onboarding PRD?", staged: false },
    ]);
    assert.equal((await store.pendingAsks(1)).length, 1);
  });

  it("classification labels the row and nulls its text in the same write", async () => {
    const { log, store } = await make();
    await log.record(channelAsk("C1:1"));
    await log.record(channelAsk("C1:2", { proposalId: "1.2", painCategory: 7 }));
    await log.record(channelAsk("C1:3"));
    const provider = fakeProvider({
      generateReplies: [JSON.stringify({ "1": "Artifact location", "2": "Status recap", "3": "Made up" })],
    });
    const result = await runClassifyBatch({ store, provider, now: () => NOW, dryRun: false });
    assert.deepEqual(result, { labelled: 3, blank: 1 });

    const one = await log.get("C1:1");
    assert.deepEqual(
      { text: one?.requestText, subType: one?.subType, pain: one?.painCategory, at: one?.classifiedAt },
      { text: null, subType: "Artifact location", pain: 1, at: NOW },
    );
    // A staged turn is ticket kickoff, whatever its Sub-type.
    const two = await log.get("C1:2");
    assert.deepEqual([two?.subType, two?.painCategory, two?.requestText], ["Status recap", 7, null]);
    // An out-of-set answer is stored as blank — and the text still goes.
    const three = await log.get("C1:3");
    assert.deepEqual(
      [three?.subType, three?.painCategory, three?.requestText, three?.classifiedAt],
      [null, null, null, NOW],
    );
    assert.deepEqual(await store.pendingAsks(10), []);
  });

  it("a failed classification writes nothing, and a dry run writes nothing", async () => {
    const { log, store } = await make();
    await log.record(channelAsk("C1:1"));
    await assert.rejects(
      runClassifyBatch({ store, provider: fakeProvider({ generateFailMessage: "429" }), now: () => NOW, dryRun: false }),
    );
    const dry = fakeProvider({ generateReplies: [JSON.stringify({ "1": "Status recap" })] });
    await runClassifyBatch({ store, provider: dry, now: () => NOW, dryRun: true });
    assert.deepEqual(await log.get("C1:1"), channelAsk("C1:1"));
  });

  it("14-day-old text is gone after the end-of-day run, even when classification failed", async () => {
    const { log, store } = await make();
    const old = channelAsk("C1:old", { askedAt: NOW - TEXT_RETENTION_MS - 1 });
    const edge = channelAsk("C1:edge", { askedAt: NOW - TEXT_RETENTION_MS });
    await log.record(old);
    await log.record(edge);
    await log.record(channelAsk("C1:new", { askedAt: NOW - DAY }));
    // The run: the classifier fails, then the purge.
    const failing = fakeProvider({ generateFailMessage: "503" });
    await assert.rejects(runClassifyBatch({ store, provider: failing, now: () => NOW, dryRun: false }));
    assert.equal(await runTextPurge({ store, now: () => NOW, dryRun: false }), 1);

    assert.deepEqual(await log.get("C1:old"), { ...old, requestText: null });
    assert.equal((await log.get("C1:edge"))?.requestText, edge.requestText);
    assert.equal((await log.get("C1:new"))?.requestText, "where is the onboarding PRD?");
  });

  it("a purge in a dry run clears nothing", async () => {
    const { log, store } = await make();
    await log.record(channelAsk("C1:old", { askedAt: NOW - TEXT_RETENTION_MS - 1 }));
    assert.equal(await runTextPurge({ store, now: () => NOW, dryRun: true }), 0);
    assert.notEqual((await log.get("C1:old"))?.requestText, null);
  });

  it("a turn retried after classification keeps its label and does not get its text back", async () => {
    const { log, store } = await make();
    await log.record(channelAsk("C1:1"));
    await store.label([{ turnId: "C1:1", subType: "Domain fact", painCategory: 5 }], NOW);
    await log.record(channelAsk("C1:1", { disposition: "failed" }));
    const row = await log.get("C1:1");
    assert.deepEqual(
      [row?.disposition, row?.requestText, row?.subType, row?.painCategory, row?.classifiedAt],
      ["failed", null, "Domain fact", 5, NOW],
    );
  });

  it("a label written twice keeps the first", async () => {
    const { log, store } = await make();
    await log.record(channelAsk("C1:1"));
    await store.label([{ turnId: "C1:1", subType: "Domain fact", painCategory: 5 }], NOW);
    await store.label([{ turnId: "C1:1", subType: "Status recap", painCategory: 2 }], NOW + 1);
    const row = await log.get("C1:1");
    assert.deepEqual([row?.subType, row?.classifiedAt], ["Domain fact", NOW]);
  });

  it("a DM turn's in-turn label reads back, with no text at any point", async () => {
    const { log } = await make();
    const dm = turnRecord({
      turnId: "D1:1",
      surface: "assistant",
      channelId: null,
      requestText: null,
      subType: "Decision recall",
      painCategory: 2,
      classifiedAt: NOW,
      proposalId: null,
    });
    await log.record(dm);
    assert.deepEqual(await log.get("D1:1"), dm);
  });
}
