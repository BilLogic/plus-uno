import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expiryEdits, expiryFetchResponse } from "./helpers/report-expiry-fetch";
import { createInMemoryThreadState, itemProposalKey, type DecisionReportRecord } from "../src/thread-state/index";
import { redrawExpiredReport } from "../src/slack/report-expiry";
import { handOffExpiredReportsFor, onRunnerJob } from "../src/slack/events";
import type { Env } from "../src/types";

const report = (): DecisionReportRecord => ({
  channel: "C1", messageTs: "1700.9", parent: "Two pages.", held: 0, ttlMs: 1000,
  metadata: { event_type: "uno_report", event_payload: { fixture: "expiry" } },
  entries: ["a", "b"].map((id) => ({ id, item: { id, title: id, body: id, open: { url: "https://notion.so" } }, state: { kind: "open" } })),
});

describe("the report expiry job", () => {
  it("redraws an overdue open item without a press, preserving another item's decision and metadata", async () => {
    let now = 0;
    const store = createInMemoryThreadState({ now: () => now });
    await store.putReport(report());
    await store.updateReport("1700.9", { id: "a", state: { kind: "approved", by: "U1", at: 1 } });
    const edits: Array<{ text: string; blocks: unknown[]; metadata?: unknown }> = [];
    now = 1001;
    await redrawExpiredReport("1700.9", { store, edit: async (_channel, _ts, message) => void edits.push(message) });
    assert.equal(edits.length, 1);
    assert.match(edits[0]!.text, /Closed, no decision/);
    assert.match(JSON.stringify(edits[0]!.blocks), /Approved by/);
    assert.deepEqual(edits[0]!.metadata, report().metadata);
    assert.deepEqual((await store.getReport("1700.9"))!.entries.map((e) => e.state.kind), ["approved", "expired"]);
    await redrawExpiredReport("1700.9", { store, edit: async () => assert.fail("already delivered") });
  });

  it("retries a failed Slack edit and sends a concurrent decision before acknowledging it", async () => {
    let now = 0;
    const store = createInMemoryThreadState({ now: () => now });
    await store.putReport(report());
    now = 1001;
    await assert.rejects(redrawExpiredReport("1700.9", { store, edit: async () => { throw new Error("Slack 503"); } }), /Slack 503/);
    await redrawExpiredReport("1700.9", { store, edit: async () => {
      await store.updateReport("1700.9", { id: "a", state: { kind: "approved", by: "U1", at: now } });
    } });
    let final = "";
    await redrawExpiredReport("1700.9", { store, edit: async (_c, _ts, message) => { final = JSON.stringify(message); } });
    assert.match(final, /Approved by/);
    assert.deepEqual((await store.getReport("1700.9"))!.entries.map((e) => e.state.kind), ["approved", "expired"]);
    await redrawExpiredReport("1700.9", { store, edit: async () => assert.fail("acknowledged") });
  });

  it("keeps a revised proposal's own window and an executing approval", async () => {
    let now = 0;
    const store = createInMemoryThreadState({ now: () => now });
    await store.putReport(report());
    const proposal = { toolName: "notion_create", input: {}, channel: "C1", threadTs: "1700.1", userMsgTs: "1700.9", proposalText: "Draft", requesterUserId: "U1", ttlMs: 2000 };
    now = 500;
    await store.putProposal({ ...proposal, proposalTs: itemProposalKey("1700.9", "a"), item: { messageTs: "1700.9", id: "a" } });
    await store.beginExecution({ ...proposal, proposalTs: itemProposalKey("1700.9", "b"), item: { messageTs: "1700.9", id: "b" } });
    now = 1001;
    await redrawExpiredReport("1700.9", { store, edit: async () => assert.fail("both items still live") });
    assert.equal((await store.getProposalByTs(itemProposalKey("1700.9", "a"))).state, "found", "expiry never claims the write");
    now = 2501;
    await redrawExpiredReport("1700.9", { store, edit: async () => {} });
    assert.deepEqual((await store.getReport("1700.9"))!.entries.map((e) => e.state.kind), ["expired", "open"]);
  });

  it("leaves a report alone before its window and uses the plain fallback after expiry", async () => {
    let now = 0;
    const store = createInMemoryThreadState({ now: () => now });
    await store.putReport({ ...report(), plain: true });
    now = 1000;
    await redrawExpiredReport("1700.9", { store, edit: async () => assert.fail("not expired") });
    now++;
    await redrawExpiredReport("1700.9", { store, edit: async (_c, _ts, message) => {
      assert.match(message.text, /Closed, no decision/);
      const actions = message.blocks.map((block) => (block as { accessory?: { text: { text: string } } }).accessory).filter(Boolean);
      assert.deepEqual(actions.map((action) => action!.text.text), ["View", "View"]);
      assert.deepEqual(message.metadata, report().metadata);
    } });
  });

  it("routes the alarm to a runner and retries a Slack refusal without acknowledging the edit", async () => {
    let now = 0;
    const store = createInMemoryThreadState({ now: () => now });
    await store.putReport(report());
    now = 1001;
    const queued: unknown[] = [];
    const env = {
      SLACK_BOT_TOKEN: "test-only",
      AGENT_RUNNER: { idFromName: (name: string) => name, get: (key: string) => ({ fetch: async (_url: string, init: { body: string }) => {
        queued.push({ key, job: JSON.parse(init.body).job });
        return new Response(null, { status: 202 });
      } }) },
      THREAD_STATE: { idFromName: (name: string) => name, get: () => ({ prepareReportExpiry: store.prepareReportExpiry, acknowledgeReportExpiry: store.acknowledgeReportExpiry }) },
    } as unknown as Env;
    await handOffExpiredReportsFor(env)([report()]);
    assert.deepEqual(queued, [{ key: "C1:report-expiry:1700.9", job: { kind: "report-expiry", messageTs: "1700.9" } }]);
    expiryEdits.length = 0;
    expiryFetchResponse({ ok: false, error: "ratelimited" });
    await assert.rejects(onRunnerJob(env, { kind: "report-expiry", messageTs: "1700.9" }), /ratelimited/);
    expiryFetchResponse({ ok: true });
    assert.equal(await onRunnerJob(env, { kind: "report-expiry", messageTs: "1700.9" }), "handled");
    assert.deepEqual(expiryEdits.map((e) => e.metadata), [report().metadata, report().metadata]);
    await onRunnerJob(env, { kind: "report-expiry", messageTs: "1700.9" });
    assert.equal(expiryEdits.length, 2);
  });
});
