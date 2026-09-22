// An eval case and a Slack message, taking the SAME turn (#499, #603).
//
// The acceptance criterion is a parity one: an eval case and a Slack message
// with the same text must build the same request, read the same dependencies
// and produce the same `TurnOutcome`. BOTH SIDES ARE THE REAL BUILDERS here —
// `evalTurnRequest` and `slackTurnRequest` for the request, and the one shared
// `buildTurnDeps` with each adapter's own wiring for the dependencies.
//
// WHICH IS THE POINT. This file used to hand-write a request it called "field
// for field what the Slack turn builds" and compare the eval builder to that
// copy — so it kept passing while production set three fields the copy omitted
// (`attachmentsText`, `currentCanvasIds`, `sharedCanvasIds`). A parity test
// that drives a copy measures the copy.
//
// The rest of the file pins the RESPONSE SHAPE, which is a contract:
// `scripts/run-evals.mjs`, `scripts/eval-history.mjs` and
// `docs/evals/README.md` all name fields on it.
//
// Runs on Node, like the rest of `npm test`: the two request builders are pure,
// and the dependency builder only READS `Env` inside the closures it hands the
// turn — so `{} as Env` builds the same shape production builds without a
// Workers runtime, and nothing here makes a call.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runLoop, type AgentResult, type LoopBudget } from "../src/agent/loop";
import { fakeProvider, type FakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import { buildProviderConversation } from "../src/agent/provider-conversation";
import {
  CONDITIONAL_RESPONSE_FIELDS,
  EVAL_CHANNEL,
  EVAL_RESPONSE_FIELDS,
  EVAL_USER,
  evalTurnRequest,
  evalTurnResponse,
  type EvalTurnReport,
} from "../src/eval/turn-case";
import { evalTurnWiring } from "../src/eval/turn-adapter";
import { slackTurnRequest, type TurnEnvelope } from "../src/slack/turn-request";
import { slackTurnWiring } from "../src/slack/turn-adapter";
import { buildTurnDeps } from "../src/turn/env-deps";
import type { SlackMessageEvent } from "../src/slack/types";
import type { Env } from "../src/types";
import {
  recordingDelivery,
  runTurn,
  type RecordingDelivery,
  type TurnDeps,
  type TurnOutcome,
  type TurnRequest,
} from "../src/turn/index";
import {
  createInMemoryThreadState,
  type HistoryTurn,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";

// ── harness ──────────────────────────────────────────────────────────────────

const TEXT = "how does a call-off reach a fill-in?";

const IDLE_BUDGET: LoopBudget = {
  used: () => 0,
  trips: () => 0,
  withLookupLimit: (_limit, fn) => fn(),
  isBudgetError: () => false,
  breakdown: () => "test",
};

interface Harness {
  deps: TurnDeps;
  delivery: RecordingDelivery;
  threadState: ThreadState;
  provider: FakeProvider;
  resolutions: Array<{ toolName: string; decision: "confirm" | "cancel"; narrative?: string }>;
  gate: { ask: string | null };
  /** What the loop returned, captured the way the adapter captures it. */
  agent: { result?: AgentResult };
}

function harness(
  opts: {
    replies?: ScriptedReply[];
    judge?: (draft: string) => { text: string; verdict: string };
    preflightAsk?: string;
    threadState?: ThreadState;
  } = {},
): Harness {
  const delivery = recordingDelivery();
  const threadState = opts.threadState ?? createInMemoryThreadState();
  const provider = fakeProvider({ replies: opts.replies ?? [{ text: "Here is the answer." }] });
  const resolutions: Harness["resolutions"] = [];
  const gate: { ask: string | null } = { ask: null };
  const agent: { result?: AgentResult } = {};
  const executed: string[] = [];

  const deps: TurnDeps = {
    threadState,
    delivery,

    async runAgent(req) {
      const result = await runLoop({
        provider,
        deps: {
          async executeUngatedTool(name) {
            executed.push(name);
            return JSON.stringify({ ok: true, rows: [] });
          },
          threadState: { async consumeCancel() { return false; } },
          budget: IDLE_BUDGET,
        },
        tier: req.tier,
        routeReason: req.routeReason,
        conversation: buildProviderConversation(
          req.history,
          req.userText,
          req.images ?? [],
          req.historicalImages,
        ),
        system: [{ text: "(harness)", stable: true }],
        tools: [],
        pending: req.pending,
        currentSenderId: req.currentSender.userId,
        cancelKey: null,
        ...(req.onInterim ? { onInterim: req.onInterim } : {}),
      });
      agent.result = result;
      return { result, tools: executed.slice(), references: [] };
    },

    async reviewDraft({ draft }) {
      return opts.judge ? opts.judge(draft) : { text: draft, verdict: "pass" };
    },

    // The eval adapter reports what the gate asked; this mirrors that capture.
    async preflight() {
      gate.ask = opts.preflightAsk ?? null;
      return opts.preflightAsk ? { ask: opts.preflightAsk } : null;
    },

    // The eval adapter's resolver RECORDS rather than executing; so does this.
    async applyVerdict(verdict) {
      if (!verdict.execute) return;
      resolutions.push({
        toolName: verdict.execute.toolName,
        decision: verdict.decision ?? "confirm",
      });
    },

    // Structures, not words — the reads a card needs, as the port takes them
    // since #623.
    cards: {
      async notionRevision() {
        return {
          page: { url: "https://notion.so/a-card", title: "A card", parent: "Roadmap" },
          properties: [{ label: "Design Status", from: "WIP", to: "Ready for QA" }],
        };
      },
      async notionTarget() {
        return { title: "A card", parent: "Roadmap" };
      },
      async designPreviewImage() {
        return null;
      },
      issueRepo: () => "BilLogic/plus-uno",
      async workflowTarget() {
        return null;
      },
    },

    async readAntecedent() {
      return [];
    },

    describeAssistantContext: () => null,

    deliveredBody: (text) => text,
  };

  return { deps, delivery, threadState, provider, resolutions, gate, agent };
}

/** The eval case body, through the real builder. */
function evalRequest(body: Parameters<typeof evalTurnRequest>[0]): TurnRequest {
  const built = evalTurnRequest(body);
  assert.equal(built.ok, true);
  return (built as { ok: true; request: TurnRequest }).request;
}

/**
 * The same message, through the REAL Slack request builder.
 *
 * The event and the envelope are the INPUTS a plain threaded message arrives
 * with — no files, no scope keyword, no PRD, and the eval conversation's ts
 * values so the two requests are comparable at all. Everything the request then
 * says is the builder's, not this file's: the surface from the channel id,
 * `threaded` from `thread_ts`, the attachment body, the canvas ids, and
 * `images: []` because the vision pass never runs when nothing visual arrived.
 */
function slackEvent(text = TEXT): SlackMessageEvent {
  return { type: "message", channel: EVAL_CHANNEL, user: EVAL_USER, ts: "0", thread_ts: "0", text };
}

function slackEnvelope(text = TEXT, over: Partial<TurnEnvelope> = {}): TurnEnvelope {
  return { conversationTs: "0", text, history: [], pending: null, prd: null, ...over };
}

function slackRequest(text = TEXT, over: Partial<TurnEnvelope> = {}): TurnRequest {
  return slackTurnRequest(slackEvent(text), slackEnvelope(text, over));
}

/** The report fields the adapter collects, with the harness's captures in them. */
function report(
  outcome: TurnOutcome,
  h: Harness,
  over: Partial<EvalTurnReport> = {},
): EvalTurnReport {
  return {
    outcome,
    ...(h.agent.result ? { agentResult: h.agent.result } : {}),
    resolutions: h.resolutions,
    gateAsk: h.gate.ask,
    tools: [],
    calls: h.delivery.calls,
    dials: { tier: outcome.telemetry.tier, model: "fake" },
    meter: { subrequests: 3, hosts: "fake:3", internal: 1, trips: 0 },
    build: "r-test",
    ms: 12,
    ...over,
  };
}

// ── (a) parity: the same text, the same turn ─────────────────────────────────

test("an eval case and a Slack message with the same text build the same request", () => {
  // Both sides are the real builders, so a field one of them starts setting —
  // and the other does not — fails here rather than in production.
  assert.deepEqual(evalRequest({ prompt: TEXT }), slackRequest());
});

test("every dependency a turn reads is wired the same way from both adapters", () => {
  // ONE builder, two wirings. A dependency added to `turn/env-deps.ts` reaches
  // both callers or neither, and each adapter's file may name only its own
  // differences — which is what these two assertions pin.
  const env = {} as Env;

  const forSlack = slackRequest();
  const slackWiring = slackTurnWiring(env, slackEvent(), forSlack);

  const forEval = evalRequest({ prompt: TEXT });
  const delivery = recordingDelivery();
  const evalWiring = evalTurnWiring(forEval, {
    delivery,
    threadState: createInMemoryThreadState(),
    report: { resolutions: [], gateAsk: null, tools: [], calls: delivery.calls, dials: null },
    filled: new Set<number>(),
    onResult: () => {},
  });

  // The differences each adapter supplies — and nothing else. The eval side's
  // extra entry is the reporters, which production reads its log lines for.
  assert.deepEqual(Object.keys(slackWiring).sort(), [
    "applyVerdict",
    "delivery",
    "threadState",
    "toolThreadTs",
  ]);
  assert.deepEqual(Object.keys(evalWiring).sort(), [
    "applyVerdict",
    "delivery",
    "reporters",
    "threadState",
    "toolThreadTs",
  ]);

  // And the dependencies the turn actually reads are the same list, entry for
  // entry, on both sides.
  // The two ports are the differences themselves, so what is compared is that
  // each is THERE; `cards` is shared wiring, so its three entries are compared
  // by name.
  const shapeOf = (deps: TurnDeps) =>
    Object.fromEntries(
      Object.entries(deps)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [
          key,
          key === "cards" ? Object.keys(value as object).sort() : typeof value,
        ]),
    );

  const slackDeps = shapeOf(buildTurnDeps(env, forSlack, slackWiring));
  const evalDeps = shapeOf(buildTurnDeps(env, forEval, evalWiring));
  assert.deepEqual(slackDeps, evalDeps);
  // …and every one of them is populated, so a hole reads as a failure here
  // rather than as a `TypeError` mid-turn.
  for (const [name, shape] of Object.entries(slackDeps)) {
    assert.notEqual(shape, "undefined", `dependency '${name}' is not wired`);
  }
  assert.ok("runAgent" in slackDeps && "delivery" in slackDeps && "threadState" in slackDeps);
});

test("an eval case and a Slack message with the same text produce the same outcome", async () => {
  const replies: ScriptedReply[] = [{ text: "A call-off opens the slot a fill-in claims." }];

  const fromEval = harness({ replies: [...replies] });
  const evalOutcome = await runTurn(evalRequest({ prompt: TEXT }), fromEval.deps);

  const fromSlack = harness({ replies: [...replies] });
  const slackOutcome = await runTurn(slackRequest(), fromSlack.deps);

  // The outcome — the disposition, what was posted, what was staged, what the
  // conversation now remembers, and the turn's telemetry.
  assert.deepEqual(evalOutcome, slackOutcome);
  // …and everything the two turns asked Delivery to do, in the same order.
  assert.deepEqual(fromEval.delivery.calls, fromSlack.delivery.calls);
  // …and the history both stores now hold.
  const ref = { channel: EVAL_CHANNEL, thread: "0" };
  assert.deepEqual(
    await fromEval.threadState.readHistory(ref),
    await fromSlack.threadState.readHistory(ref),
  );
  assert.equal(evalOutcome.disposition, "answered");
});

test("history and a pending proposal reach the turn the same way from both sides", async () => {
  const history: HistoryTurn[] = [
    { role: "user", content: "file an intake for the Card slot gap" },
    { role: "assistant", content: "(staged a notion_create proposal awaiting confirmation)" },
  ];
  const pending = { toolName: "notion_create", input: { title: "Card slot gap" } };

  const built = evalRequest({ prompt: "yes please", history, pending });
  assert.deepEqual(built.history, history);
  assert.deepEqual(built.pending, {
    ...pending,
    channel: EVAL_CHANNEL,
    threadTs: "0",
    userMsgTs: "0",
    proposalTs: "0",
    proposalText: "(eval)",
    requesterUserId: EVAL_USER,
  } satisfies PendingProposal);

  // And the turn reads it: a typed ✅ resolves that card rather than answering.
  // The Gate claims the record in the store, so the card is staged there first —
  // exactly what the eval adapter does with the pending the runner sent.
  const h = harness();
  const request = evalRequest({ prompt: "✅", history, pending });
  await h.threadState.putProposal(request.pending!);
  const outcome = await runTurn(request, h.deps);
  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolutions, [{ toolName: "notion_create", decision: "confirm" }]);
  assert.equal(h.provider.sends.length, 0);
});

// ── (b) the request builder's own rules ─────────────────────────────────────

test("the case body's surface is validated, never interpolated", () => {
  assert.equal(evalRequest({ prompt: TEXT }).channel, EVAL_CHANNEL);
  assert.equal(evalRequest({ prompt: TEXT }).surface, "channel");
  // A case that means to exercise the own-DM visibility gate names a D channel.
  const dm = evalRequest({ prompt: TEXT, channel: "D0ABC123", requestedBy: "U0ABC123" });
  assert.equal(dm.surface, "assistant");
  assert.equal(dm.userId, "U0ABC123");
  // Anything malformed falls back to the synthetic defaults.
  const junk = evalRequest({ prompt: TEXT, channel: "../../etc", requestedBy: "<@nope>" });
  assert.equal(junk.channel, EVAL_CHANNEL);
  assert.equal(junk.userId, EVAL_USER);
});

test("an empty prompt is a 400, not a turn", () => {
  assert.deepEqual(evalTurnRequest({ prompt: "   " }), { ok: false, error: "missing prompt" });
  assert.deepEqual(evalTurnRequest({}), { ok: false, error: "missing prompt" });
});

// ── (c) the response shape the runner reads ─────────────────────────────────

test("the response keeps every field the eval runner names", async () => {
  const h = harness();
  const outcome = await runTurn(evalRequest({ prompt: TEXT }), h.deps);
  const body = evalTurnResponse(report(outcome, h));

  // The field names are READ, not restated (`EVAL_RESPONSE_FIELDS`, #617). A
  // list copied into this file is a list that agrees with the envelope only
  // until someone adds a field, which is the drift this test exists to catch.
  const conditional: readonly string[] = CONDITIONAL_RESPONSE_FIELDS;
  for (const field of EVAL_RESPONSE_FIELDS) {
    if (conditional.includes(field)) continue;
    assert.ok(field in body, `response is missing '${field}'`);
  }
  // A successful turn carries `result` and no `error` — the two conditional
  // ones, in the state this turn is in.
  assert.ok("result" in body);
  assert.ok(!("error" in body));
  // And the envelope carries NOTHING the list does not name: a field added to
  // `evalTurnResponse` and to no reader's vocabulary is a field nothing knows
  // it can read.
  assert.deepEqual(
    Object.keys(body).filter((k) => !(EVAL_RESPONSE_FIELDS as readonly string[]).includes(k)),
    [],
    "every field of the envelope must be named in EVAL_RESPONSE_FIELDS",
  );
  assert.equal(body.ok, true);
  assert.equal(body.subrequests, 3);
  assert.equal(body.subrequest_hosts, "fake:3");
  assert.equal(body.internal_subrequests, 1);
  assert.equal(body.budget_trips, 0);
  assert.deepEqual(body.result, { kind: "text", text: "Here is the answer." });
});

test("the reported text is the DELIVERED body, after the judge", async () => {
  // The old driver reported the model's raw draft, so a textRegex assertion
  // scored a body no designer would ever have read. This is the whole reason
  // the route became an adapter.
  const h = harness({
    replies: [{ text: "Probably about three sessions." }],
    judge: () => ({ text: "Three sessions — per `sessions.count` on the blueprint.", verdict: "revised" }),
  });
  const outcome = await runTurn(evalRequest({ prompt: TEXT }), h.deps);
  const body = evalTurnResponse(report(outcome, h)) as {
    result: { kind: string; text: string };
    turn: { judge?: string };
  };

  assert.deepEqual(body.result, {
    kind: "text",
    text: "Three sessions — per `sessions.count` on the blueprint.",
  });
  assert.equal(body.turn.judge, "revised");
});

test("a gated proposal reports the proposal AND the gate's ask", async () => {
  // The pair the fixtures' `allowProposalIfGateAsk` escape hatch reads (R8,
  // R12): the model proposed, preflight asked instead of staging.
  const h = harness({
    replies: [{ toolCalls: [{ name: "component_implement", args: { component: "SpacingToken" } }] }],
    preflightAsk: "Which component? SpacingToken isn't in the design system.",
  });
  const outcome = await runTurn(evalRequest({ prompt: "Implement SpacingToken" }), h.deps);
  const body = evalTurnResponse(report(outcome, h)) as {
    result: { kind: string; toolName?: string };
    gateAsk: string | null;
  };

  assert.equal(outcome.disposition, "asked");
  assert.equal(body.result.kind, "proposal");
  assert.equal(body.result.toolName, "component_implement");
  assert.match(body.gateAsk ?? "", /Which component/);
  // Nothing was staged: the gate asked, and the card never reached a human.
  assert.equal(h.delivery.calls.some((c) => c.kind === "proposal"), false);
});

test("the deterministic cancel bounce reports as the text it is", async () => {
  // R5's turn 3: the person repeats an ask they just cancelled. Turn reads the
  // outcome marker from the store and answers instead of re-carding — nothing
  // is staged and nothing is gated, so the honest `result` is the note that was
  // posted, which is what the fixture's `expectKind: ["text"]` asserts.
  const threadState = createInMemoryThreadState();
  const ref = { channel: EVAL_CHANNEL, thread: "0" };
  const history: HistoryTurn[] = [
    { role: "user", content: "share this for feedback" },
    { role: "assistant", content: "(Cancelled the proposed shareout_post — nothing was done.)" },
  ];
  for (const turn of history) await threadState.appendHistory(ref, turn);

  const h = harness({
    replies: [{ toolCalls: [{ name: "shareout_post", args: { url: "https://example.test" } }] }],
    threadState,
  });
  const outcome = await runTurn(
    evalRequest({ prompt: "share this for feedback", history }),
    h.deps,
  );
  const body = evalTurnResponse(report(outcome, h)) as { result: { kind: string; text: string } };

  assert.equal(outcome.disposition, "asked");
  assert.equal(body.result.kind, "text");
  assert.match(body.result.text, /cancelled that/i);
  assert.equal(h.delivery.calls.some((c) => c.kind === "proposal"), false);
});

test("a staged card reports the proposal, and a failure reports ok:false", async () => {
  const staged = harness({
    replies: [{ toolCalls: [{ name: "notion_create", args: { title: "Card slot gap" } }] }],
  });
  const stagedOutcome = await runTurn(
    evalRequest({ prompt: "file an intake for the Card slot gap" }),
    staged.deps,
  );
  const stagedBody = evalTurnResponse(report(stagedOutcome, staged)) as {
    ok: boolean;
    result: { kind: string; toolName?: string };
    turn: { staged: boolean };
  };
  assert.equal(stagedOutcome.disposition, "staged");
  assert.equal(stagedBody.ok, true);
  assert.equal(stagedBody.result.kind, "proposal");
  assert.equal(stagedBody.result.toolName, "notion_create");
  assert.equal(stagedBody.turn.staged, true);

  // A failed turn: `ok:false` with the stage and the message the turn made
  // visible, so a transient model error still reads as one to the runner's
  // retry (it matches on the error string).
  const failed = harness();
  const failedBody = evalTurnResponse(
    report(
      {
        disposition: "failed",
        failure: { stage: "agent" },
        wrote: { turns: [], compacted: 0 },
        telemetry: {
          tier: "grind",
          route: "default",
          trivial: false,
          correction: false,
          tools: [],
          references: [],
          interim: 0,
        },
      },
      failed,
      { calls: [{ kind: "failure", stage: "agent", message: "429 quota exhausted" }] },
    ),
  ) as { ok: boolean; error: string };
  assert.equal(failedBody.ok, false);
  assert.match(failedBody.error, /429 quota exhausted/);
});
