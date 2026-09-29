// Every turn leaves exactly one usage record, written as it finishes.
//
// Driven through Turn on the shared harness — the recording Delivery, the
// in-memory ThreadState, the real loop behind a fake provider — with the
// in-memory UsageLog, and asserting the row a person querying the database
// would read. The rules that fill single columns are pinned one by one in
// tests/usage-record.test.ts; this file asserts what a whole turn leaves.
import assert from "node:assert/strict";
import test from "node:test";

import { evalTurnRequest } from "../src/eval/turn-case";
import { evalTurnWiring } from "../src/eval/turn-adapter";
import { slackTurnWiring } from "../src/slack/turn-adapter";
import { createInMemoryThreadState } from "../src/thread-state/index";
import { recordingDelivery, runTurn } from "../src/turn/index";
import type { Env } from "../src/types";
import {
  createInMemoryProposalEventLog,
  type ProposalEventLog,
  type TurnRecord,
  type UsageLog,
} from "../src/usage/index";
import { BUILD } from "../src/version";
import { CHANNEL, PENDING, REF, harness, request } from "./helpers/turn-harness";

/** The clock the harness's turn reads: the turn begins at T and every later
 *  read is one second on. */
const T = 1_700_000_010_000;
const ticking = () => {
  let t = T;
  return () => {
    const now = t;
    t += 1_000;
    return now;
  };
};

const USAGE = { inputTokens: 1_200, outputTokens: 80, thinkingTokens: 40, cachedInputTokens: 1_000 };

function only(records: TurnRecord[]): TurnRecord {
  assert.equal(records.length, 1, "exactly one record per turn");
  return records[0]!;
}

// ── the four turns ───────────────────────────────────────────────────────────

test("an answered turn records who, where, when, what ran and what it cost", async () => {
  const h = harness({
    now: ticking(),
    providerModel: "gemini-3.8-flash",
    providerUsage: USAGE,
    replies: [
      { text: "", toolCalls: [{ name: "search_blueprint", args: { query: "call-off" } }] },
      { text: "A call-off opens the slot: <https://plus-uno.netlify.app/blueprint/?cell=7|the cell>." },
    ],
  });

  const outcome = await runTurn(request(), h.deps);
  assert.equal(outcome.disposition, "answered");

  const row = only(h.usage.records());
  assert.deepEqual(row, {
    turnId: `${CHANNEL}:1700000000.000200`,
    build: BUILD,
    requesterId: "U1",
    surface: "channel",
    inThread: true,
    channelId: CHANNEL,
    askTs: "1700000000.000200",
    askedAt: 1_700_000_000_000,
    // The first clock read after the turn's own start is the answer landing.
    firstAnswerAt: row.firstAnswerAt,
    latencyMs: row.firstAnswerAt! - 1_700_000_000_000,
    tier: outcome.telemetry.tier,
    routeReason: outcome.telemetry.route,
    provider: "fake",
    model: "gemini-3.8-flash",
    fallbackUsed: false,
    tokensIn: 1_200,
    tokensOut: 80,
    tokensThinking: 40,
    tokensCached: 1_000,
    // The fake is not Gemini, so its prompt count is read as excluding the cache.
    costUsd: (1_200 * 0.75 + 1_000 * 0.075 + 120 * 3.75) / 1_000_000,
    toolsCalled: ["search_blueprint"],
    sourcesCited: ["blueprint"],
    disposition: "answered",
    proposalId: null,
    stopUsed: false,
    selfFiledTicketUrl: null,
    testTraffic: false,
  });
  assert.ok(row.firstAnswerAt! > T, "the answer time is read after the turn began");
});

test("a staged turn records the card's ts as its proposal id", async () => {
  const h = harness({
    replies: [
      {
        text: "I'll file a Roadmap card.",
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
  assert.equal(outcome.disposition, "staged");

  const row = only(h.usage.records());
  assert.equal(row.disposition, "staged");
  assert.equal(row.proposalId, outcome.staged!.proposal.proposalTs);
  assert.ok(row.firstAnswerAt !== null, "the card is what the person was answered with");
  assert.equal(row.stopUsed, false);
});

test("a stopped turn records the stop, and no answer time", async () => {
  const h = harness({ cancelKey: REF, replies: [{ text: "Here is the answer." }] });
  await h.threadState.requestCancel(REF);

  const outcome = await runTurn(request(), h.deps);
  assert.equal(outcome.disposition, "stopped");

  const row = only(h.usage.records());
  assert.equal(row.stopUsed, true);
  assert.equal(row.disposition, "stopped");
  assert.equal(row.firstAnswerAt, null);
  assert.equal(row.latencyMs, null);
  assert.equal(row.testTraffic, false);
});

test("an eval turn is recorded, as test traffic", async () => {
  const built = evalTurnRequest({ prompt: "how does a call-off reach a fill-in?" });
  assert.ok(built.ok);
  const h = harness({ origin: "debug", now: ticking() });

  await runTurn(built.request, h.deps);

  const row = only(h.usage.records());
  assert.equal(row.testTraffic, true);
  assert.equal(row.disposition, "answered");
  // The eval conversation's ts is synthetic, so the row is keyed by the run.
  assert.equal(row.turnId, `${built.request.channel}:${built.request.userMsgTs}@${T}`);
  assert.equal(row.askedAt, T);
});

// ── test traffic ─────────────────────────────────────────────────────────────

test("an ask in the sandbox channel is test traffic", async () => {
  const h = harness({ testChannelIds: [CHANNEL] });
  await runTurn(request(), h.deps);
  assert.equal(only(h.usage.records()).testTraffic, true);
});

test("the debug routes' wiring marks its turns as test traffic, and Slack's does not", () => {
  const env = {} as Env;
  const delivery = recordingDelivery();
  const evalWiring = evalTurnWiring(request(), {
    delivery,
    threadState: createInMemoryThreadState(),
    report: { resolutions: [], gateAsk: null, tools: [], calls: delivery.calls, dials: null },
    filled: new Set<number>(),
    onResult: () => {},
  });
  const slackWiring = slackTurnWiring(env, { type: "message", channel: CHANNEL, user: "U1", ts: "1.2", text: "hi" }, request());
  assert.equal(evalWiring.origin, "debug");
  assert.equal(slackWiring.origin, "slack");
});

test("a greeting with no ask — a reaction and nothing asked — is test traffic", async () => {
  const h = harness({
    replies: [{ text: "", toolCalls: [{ name: "slack_react", args: { emoji: "wave" } }] }, { text: "" }],
  });
  const outcome = await runTurn(request({ text: "morning uno!" }), h.deps);
  assert.equal(outcome.disposition, "reacted");

  const row = only(h.usage.records());
  assert.equal(row.disposition, "reacted");
  assert.equal(row.testTraffic, true);
});

// ── the ticket the bot filed on itself ───────────────────────────────────────

test("a typed ✅ that files an issue on the bot's own repo records the ticket", async () => {
  const url = "https://github.com/BilLogic/plus-uno/issues/901";
  const h = harness({
    // The filing tool's result shape (`tools/github-issue.ts`).
    executeOperation: async () =>
      JSON.stringify({ ok: true, status: "filed", issue_number: 901, issue_url: url, message: "Filed" }),
  });
  const pending = { ...PENDING, toolName: "github_issue_create", input: { title: "Footer overlaps", body: "…" } };
  await h.threadState.putProposal(pending);

  const outcome = await runTurn(request({ text: "✅", pending }), h.deps);
  assert.equal(outcome.disposition, "resolved");

  const row = only(h.usage.records());
  assert.equal(row.selfFiledTicketUrl, url);
  assert.equal(row.provider, null, "a typed ✅ runs no model");
  assert.equal(row.costUsd, 0);
});

// ── proposal events ──────────────────────────────────────────────────────────

const REVISION = {
  text: "Revised — the title you asked for.",
  toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign, v2" } }],
};

test("a staged card is recorded staged, joined to the turn, with when its thread began", async () => {
  const h = harness({
    now: ticking(),
    replies: [
      {
        text: "I'll file a Roadmap card.",
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "<@U2> asked me to file a card for the reflection redesign" }), h.deps);
  const card = outcome.staged!.proposal;

  const [staged, ...rest] = h.proposalEvents.events();
  assert.deepEqual(rest, []);
  assert.equal(staged!.proposalId, card.proposalTs);
  assert.equal(staged!.event, "staged");
  assert.equal(staged!.via, "turn");
  assert.equal(staged!.turnId, only(h.usage.records()).turnId);
  assert.equal(staged!.requesterId, "U1");
  assert.deepEqual(staged!.tools, ["notion_create"]);
  // The thread's root message: the conversation this ask was a reply in.
  assert.equal(staged!.threadStartedAt, 1_700_000_000_000);
  assert.ok(staged!.at > T, "dated when the card went up, after the turn began");
});

test("a superseding revision records the card it replaced, then the one it staged", async () => {
  const h = harness({ replies: [REVISION] });
  await h.threadState.putProposal(PENDING);
  const outcome = await runTurn(request({ text: "change the title to v2", pending: PENDING }), h.deps);
  assert.equal(outcome.disposition, "staged");

  assert.deepEqual(
    h.proposalEvents.events().map((e) => [e.proposalId, e.event, e.via]),
    [
      [PENDING.proposalTs, "superseded", "revision"],
      [outcome.staged!.proposal.proposalTs, "staged", "turn"],
    ],
  );
});

test("a revision Slack refused still records the card it retired as superseded", async () => {
  // The old card is out of reach either way (`ThreadState.retireProposal`),
  // so the expiry pass must not later read it as one that aged out untouched.
  const h = harness({ replies: [REVISION], delivery: recordingDelivery({ stagingFails: true }) });
  await h.threadState.putProposal(PENDING);
  const outcome = await runTurn(request({ text: "change the title to v2", pending: PENDING }), h.deps);
  assert.equal(outcome.disposition, "failed");
  assert.deepEqual(
    h.proposalEvents.events().map((e) => [e.proposalId, e.event]),
    [[PENDING.proposalTs, "superseded"]],
  );
});

test("a turn that stages nothing records no proposal event", async () => {
  const h = harness();
  await runTurn(request(), h.deps);
  assert.deepEqual(h.proposalEvents.events(), []);
});

test("a proposal-event log that throws does not fail the turn or unstage its card", async () => {
  const throwing: ProposalEventLog = {
    ...createInMemoryProposalEventLog(),
    async record() {
      throw new Error("D1_ERROR: database unavailable");
    },
  };
  const h = harness({ replies: [REVISION], proposalEventLog: throwing });
  await h.threadState.putProposal(PENDING);
  const outcome = await runTurn(request({ text: "change the title to v2", pending: PENDING }), h.deps);
  assert.equal(outcome.disposition, "staged");
  assert.ok(await h.threadState.getProposalByThread(REF), "the revision is live");
  assert.equal(only(h.usage.records()).disposition, "staged");
});

// ── a failing log ────────────────────────────────────────────────────────────

test("a UsageLog that throws does not fail the turn", async () => {
  const throwing: UsageLog = {
    async record() {
      throw new Error("D1_ERROR: database unavailable");
    },
    async get() {
      return null;
    },
  };
  const h = harness({ usageLog: throwing });

  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(h.delivery.calls.filter((c) => c.kind === "answer").length, 1);
});

test("a UsageLog that never answers does not hold the turn open", async () => {
  const hanging: UsageLog = {
    record: () => new Promise(() => {}),
    async get() {
      return null;
    },
  };
  const h = harness({ usageLog: hanging });

  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
});
