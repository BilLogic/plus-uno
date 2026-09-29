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
import { fakeProvider } from "../src/agent/providers/fake";
import { classifyAsks, type TurnRecord, type UsageLog } from "../src/usage/index";
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

  const outcome = await runTurn(request({ conversationType: "channel" }), h.deps);
  assert.equal(outcome.disposition, "answered");

  const row = only(h.usage.records());
  assert.deepEqual(row, {
    turnId: `${CHANNEL}:1700000000.000200`,
    build: BUILD,
    requesterId: "U1",
    surface: "channel",
    conversationType: "channel",
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
    // A channel ask keeps its text for the end-of-day classifier.
    requestText: "how does a call-off reach a fill-in?",
    subType: null,
    painCategory: null,
    classifiedAt: null,
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
  // Ticket kickoff, before any classifier has read it.
  assert.equal(row.painCategory, 7);
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

// ── corpus categories ────────────────────────────────────────────────────────

const DM = { channel: "D0DM", surface: "assistant" as const, threaded: false };

test("a DM ask is labelled in the turn, and its row never holds text", async () => {
  const asked: string[] = [];
  const h = harness({
    now: ticking(),
    classifyAsk: async (text) => {
      asked.push(text);
      return "Decision recall";
    },
  });
  await runTurn(request({ ...DM, text: "what did we decide on the footer?" }), h.deps);

  const row = only(h.usage.records());
  assert.deepEqual(asked, ["what did we decide on the footer?"]);
  assert.equal(row.requestText, null);
  assert.equal(row.subType, "Decision recall");
  assert.equal(row.painCategory, 2);
  assert.ok(row.classifiedAt !== null && row.classifiedAt > T);
});

test("a DM ask that staged a card is ticket kickoff, whatever it asked", async () => {
  const h = harness({
    replies: [{ text: "I'll file a card.", toolCalls: [{ name: "notion_create", args: { title: "Footer" } }] }],
    classifyAsk: async () => "Status recap",
  });
  await runTurn(request({ ...DM, text: "file a card for the footer" }), h.deps);
  const row = only(h.usage.records());
  assert.deepEqual([row.subType, row.painCategory, row.requestText], ["Status recap", 7, null]);
});

test("a DM classifier that fails or hangs leaves the row unlabelled and the turn answered", async () => {
  for (const classifyAsk of [
    async (): Promise<null> => {
      throw new Error("429");
    },
    () => new Promise<null>(() => {}),
  ]) {
    const h = harness({ classifyAsk });
    const outcome = await runTurn(request({ ...DM }), h.deps);
    assert.equal(outcome.disposition, "answered");
    const row = only(h.usage.records());
    assert.deepEqual([row.subType, row.classifiedAt, row.requestText], [null, null, null]);
  }
});

test("channel asks and test traffic are never classified in the turn", async () => {
  let calls = 0;
  const classifyAsk = async () => {
    calls += 1;
    return "Domain fact" as const;
  };
  // A channel ask waits for the end-of-day run.
  await runTurn(request({ conversationType: "channel" }), harness({ classifyAsk }).deps);
  // A DM greeting is test traffic.
  const greeting = harness({
    classifyAsk,
    replies: [{ text: "", toolCalls: [{ name: "slack_react", args: { emoji: "wave" } }] }, { text: "" }],
  });
  await runTurn(request({ ...DM, text: "morning uno!" }), greeting.deps);
  // An eval DM is test traffic.
  const evalDm = harness({ classifyAsk, origin: "debug" });
  await runTurn(request({ ...DM }), evalDm.deps);

  assert.equal(calls, 0);
  const g = only(greeting.usage.records());
  assert.deepEqual([g.testTraffic, g.requestText, g.painCategory], [true, null, null]);
});

test("a group-DM ask is labelled in the turn, and its text is never stored", async () => {
  const h = harness({ classifyAsk: async () => "Relay/routing" });
  await runTurn(request({ conversationType: "mpim", text: "who owns the tutor import?" }), h.deps);
  const row = only(h.usage.records());
  assert.equal(row.requestText, null);
  assert.equal(row.conversationType, "mpim");
  assert.equal(row.channelId, null);
  assert.deepEqual([row.subType, row.painCategory], ["Relay/routing", 4]);
  assert.ok(!JSON.stringify(h.usage.records()).includes("tutor import"), "no trace of the words");
});

test("an ask whose conversation type is unknown (an app_mention) is labelled in the turn, with no text", async () => {
  const h = harness({ classifyAsk: async () => "Artifact location" });
  await runTurn(request(), h.deps);
  const row = only(h.usage.records());
  assert.deepEqual([row.conversationType, row.requestText, row.subType], [null, null, "Artifact location"]);
});

test("the classifier's words never reach a log line", async () => {
  const errors: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(" "));
  try {
    const reply = "I would call this SECRET-PHRASE a recap";
    const h = harness({
      classifyAsk: async (text) => (await classifyAsks(fakeProvider({ generateReplies: [reply] }), [text]))[0] ?? null,
    });
    await runTurn(request({ ...DM, text: "PRIVATE-ASK about the footer" }), h.deps);
  } finally {
    console.error = original;
  }
  const line = errors.find((e) => e.includes("not classified"));
  assert.ok(line, "the failure is logged");
  assert.match(line!, /unreadable: \d+ chars/);
  assert.ok(!errors.some((e) => e.includes("SECRET-PHRASE") || e.includes("PRIVATE-ASK")));
});

test("a channel ask that is test traffic keeps no text", async () => {
  const h = harness({ testChannelIds: [CHANNEL] });
  await runTurn(request({ conversationType: "channel" }), h.deps);
  assert.equal(only(h.usage.records()).requestText, null);
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
