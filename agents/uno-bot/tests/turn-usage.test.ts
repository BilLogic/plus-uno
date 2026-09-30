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
import { recordingDelivery, restageExecution, runTurn } from "../src/turn/index";
import type { Env } from "../src/types";
import { buildTurnDeps } from "../src/turn/env-deps";
import { NO_PROPOSAL_EVENT_LOG } from "../src/usage/production";
import { fakeProvider } from "../src/agent/providers/fake";
import {
  classifyAsks,
  createInMemoryProposalEventLog,
  createInMemoryUsageLog,
  runProposalExpiry,
  stagedEvent,
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

test("the debug routes' turns write no proposal events to the production table at all", () => {
  // The database is bound: a write would reach it. The eval wiring never does.
  const env = { USAGE_DB: {} } as unknown as Env;
  const delivery = recordingDelivery();
  const evalWiring = evalTurnWiring(request(), {
    delivery,
    threadState: createInMemoryThreadState(),
    report: { resolutions: [], gateAsk: null, tools: [], calls: delivery.calls, dials: null },
    filled: new Set<number>(),
    onResult: () => {},
  });
  assert.equal(buildTurnDeps(env, request(), evalWiring).usage.proposalEvents, NO_PROPOSAL_EVENT_LOG);
  const slackWiring = slackTurnWiring(env, { type: "message", channel: CHANNEL, user: "U1", ts: "1.2", text: "hi" }, request());
  assert.notEqual(buildTurnDeps(env, request(), slackWiring).usage.proposalEvents, NO_PROPOSAL_EVENT_LOG);
});

test("a card staged in the sandbox channel is test traffic on its own row", async () => {
  const h = harness({ replies: [REVISION], testChannelIds: [CHANNEL] });
  await runTurn(request({ text: "file it" }), h.deps);
  assert.deepEqual(h.proposalEvents.events().map((e) => [e.event, e.testTraffic]), [["staged", true]]);
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

test("a card claimed while its revision was being written is never recorded superseded", async () => {
  // A ✅ won the card meanwhile: it has its own outcome, and the retire took
  // nothing out of reach.
  const h = harness({ replies: [REVISION] });
  await h.threadState.putProposal(PENDING);
  assert.equal(await h.threadState.claimProposal(PENDING.proposalTs), true);
  await runTurn(request({ text: "change the title to v2", pending: PENDING }), h.deps);
  assert.deepEqual(
    h.proposalEvents.events().filter((e) => e.proposalId === PENDING.proposalTs),
    [],
  );
});

test("a card the staging itself retired is recorded superseded, and the expiry pass leaves it alone", async () => {
  // No pending card handed in, but one is live in the thread: the store's
  // backstop retires it as the new card goes up.
  const h = harness({ replies: [REVISION] });
  await h.proposalEvents.record(stagedEvent({ proposal: PENDING, at: 0, via: "turn", channelStored: true }));
  await h.threadState.putProposal(PENDING);
  await runTurn(request({ text: "file the v2 card" }), h.deps);
  await runProposalExpiry(h.proposalEvents, 1_800_000_000_000, { dryRun: false });
  assert.deepEqual(
    (await h.proposalEvents.eventsOf(PENDING.proposalTs)).map((e) => e.event),
    ["staged", "superseded"],
  );
});

test("the staged event is on the record before the turn's own row is written", async () => {
  // So a reaction ✅ in that window still finds the staged row and its turn.
  let seenAtTurnWrite: string[] = [];
  const h = harness({ replies: [REVISION] });
  const events = h.proposalEvents;
  const usageLog: UsageLog = {
    async record(turn) {
      seenAtTurnWrite = events.events().map((e) => e.event);
      await h.usage.record(turn);
    },
    get: (id) => h.usage.get(id),
  };
  const h2 = harness({ replies: [REVISION], usageLog, proposalEventLog: events });
  await runTurn(request({ text: "file it" }), h2.deps);
  assert.deepEqual(seenAtTurnWrite, ["staged"]);
});

test("a ticket a reaction ✅ files before the staging turn's row exists still lands on that row", async () => {
  // The ✅ lands the moment the staged event is written — before this turn has
  // written its own row, so the ticket can only wait on the card.
  const url = "https://github.com/BilLogic/plus-uno/issues/904";
  const usage = createInMemoryUsageLog();
  const inner = createInMemoryProposalEventLog({ turns: usage });
  const racing: ProposalEventLog = {
    ...inner,
    async record(event) {
      await inner.record(event);
      if (event.event === "staged") await inner.noteSelfFiledTicket(event.proposalId, url);
    },
  };
  const h = harness({ replies: [REVISION], usageLog: usage, proposalEventLog: racing });
  await runTurn(request({ text: "file it" }), h.deps);
  assert.equal(only(usage.records()).selfFiledTicketUrl, url);
});

test("a card staged in a DM or a group DM names no channel and records no one its ask named", async () => {
  for (const over of [
    { surface: "assistant" as const, channel: "D0ASKER01" },
    { surface: "channel" as const, channel: "C0GROUPDM", conversationType: "mpim" as const },
  ]) {
    const h = harness({ replies: [REVISION] });
    await runTurn(request({ ...over, text: "<@U2> asked me to file it" }), h.deps);
    const [staged] = h.proposalEvents.events();
    assert.deepEqual([staged?.event, staged?.channelId, staged?.aimedAtRole], ["staged", null, null], over.channel);
  }
});

test("a staged card's roles come from the stored role map; no map, or a failed read, means unknown", async () => {
  const roles = async () => ({ U1: "pm" as const, U2: "dev" as const });
  const cases = [
    { teamRoles: roles, want: ["pm", "dev"] },
    { teamRoles: undefined, want: [null, null] },
    { teamRoles: async (): Promise<never> => { throw new Error("kv down"); }, want: [null, null] },
  ];
  for (const { teamRoles, want } of cases) {
    const h = harness({ replies: [REVISION], ...(teamRoles ? { teamRoles } : {}) });
    await runTurn(request({ text: "<@U2> asked me to file it" }), h.deps);
    const [staged] = h.proposalEvents.events();
    assert.deepEqual([staged?.requesterRole, staged?.aimedAtRole], want);
  }
});

test("a re-staged card carries its original's turn, so its ticket still finds a turn row", async () => {
  const h = harness();
  const original = { ...PENDING, proposalTs: "1700000000.000300" };
  await h.proposalEvents.record(
    stagedEvent({ proposal: original, at: 0, via: "turn", channelStored: true, turnId: "C1:1700000000.000200", testTraffic: true }),
  );
  const staged = await restageExecution(
    { proposal: original, operations: [{ toolName: "notion_create", input: { title: "again" } }] },
    { threadState: h.threadState, delivery: h.delivery, cards: h.deps.cards, proposalEvents: h.proposalEvents },
  );
  const [row] = await h.proposalEvents.eventsOf(staged!.proposal.proposalTs);
  assert.deepEqual(
    [row?.via, row?.originProposalId, row?.turnId, row?.channelId, row?.testTraffic],
    ["restage", original.proposalTs, "C1:1700000000.000200", CHANNEL, true],
  );
});

test("a card re-staged twice takes the ask's card's turn even when the middle staged row was lost", async () => {
  // Root card → first re-stage (its staged write dropped) → second re-stage.
  // Keyed to the root, not the parent, so the missing middle row costs nothing.
  const h = harness();
  const root = { ...PENDING, proposalTs: "1700000000.000300" };
  await h.proposalEvents.record(
    stagedEvent({ proposal: root, at: 0, via: "turn", channelStored: true, turnId: "C1:1700000000.000200", testTraffic: true }),
  );
  const dropping: ProposalEventLog = { ...h.proposalEvents, record: async () => {} };
  const middle = await restageExecution(
    { proposal: root, operations: [{ toolName: "notion_create", input: { title: "again" } }] },
    { threadState: h.threadState, delivery: h.delivery, cards: h.deps.cards, proposalEvents: dropping },
  );
  assert.deepEqual(await h.proposalEvents.eventsOf(middle!.proposal.proposalTs), []);
  const last = await restageExecution(
    { proposal: middle!.proposal, operations: [{ toolName: "notion_create", input: { title: "once more" } }] },
    { threadState: h.threadState, delivery: h.delivery, cards: h.deps.cards, proposalEvents: h.proposalEvents },
  );
  const [row] = await h.proposalEvents.eventsOf(last!.proposal.proposalTs);
  assert.deepEqual(
    [row?.originProposalId, row?.turnId, row?.channelId, row?.testTraffic],
    [root.proposalTs, "C1:1700000000.000200", CHANNEL, true],
  );
});

test("a card a re-stage retires is recorded superseded by the re-stage, not by a revision", async () => {
  const h = harness();
  const live = { ...PENDING, proposalTs: "1700000000.000400" };
  await h.threadState.putProposal(live);
  await restageExecution(
    { proposal: PENDING, operations: [{ toolName: "notion_create", input: { title: "again" } }] },
    { threadState: h.threadState, delivery: h.delivery, cards: h.deps.cards, proposalEvents: h.proposalEvents },
  );
  assert.deepEqual(
    (await h.proposalEvents.eventsOf(live.proposalTs)).map((e) => [e.event, e.via]),
    [["superseded", "restage"]],
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
