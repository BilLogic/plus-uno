// Check it, pressed: the blueprint check runs as a job on a runner of its own,
// and its results post as follow-ups in the thread (#1321).
//
// The seam is the button: a press on the offer a real PRD turn posted (the
// turn harness, its in-memory thread store), the Check it door over that
// store, and the runner queue the press hands the check to; then the job,
// which reads today's path, drafts the idea's rows on the real drafter and
// posts. What is asserted is what the thread sees — the offer's message, the
// follow-ups, the presser's private replies — what is queued where, and what
// a ✅ on the Draw on blueprint card would run, as the store holds it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { fakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import {
  blueprintCheckRunnerKey,
  draftProposal,
  runBlueprintCheck,
  serviceChangeGate,
  serviceChangeJudgement,
  type CheckOutcome,
  type PathToday,
} from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import { createInMemoryThreadState, proposalOperations, type BlueprintCheckOffer, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import {
  CHECK_EXPIRED_REPLY,
  CHECK_IT_ACTION_ID,
  checkedMessage,
  checkOfferMessage,
  runCheckItDoor,
} from "../src/slack/blueprint-check";
import type { CardMessage } from "../src/slack/button-door";
import { conversationKey, enqueueAgentJob } from "../src/slack/events";
import { createInMemoryRunnerStorage, type InMemoryRunnerStorage } from "../src/runner/storage";
import { enqueueThreadJob, runOneJob, type RunnerJob } from "../src/runner/queue";
import type { RunnerJobPayload, SlackMessageEvent } from "../src/slack/types";
import type { Env } from "../src/types";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { CHANNEL, CONVERSATION, harness, request } from "./helpers/turn-harness";
import { cardExpiresAt } from "../src/card-expiry";

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "Supervisor finds a fill-in", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Find a fill-in", matchedBy: "vector+keyword" },
];

const TODAY: PathToday = {
  pathId: "path-1",
  scenarioId: "scenario-1",
  scenario: "Call-off",
  path: "Standard",
  status: "live",
  lanes: [
    { id: "l-tutor", name: "Tutor" },
    { id: "l-sup", name: "Supervisor" },
  ],
  steps: [
    { id: "s-1", name: "Call off a session" },
    { id: "s-2", name: "Find a fill-in" },
    { id: "s-3", name: "Confirm the fill-in" },
  ],
  cells: [
    { id: "cell-1", laneId: "l-tutor", stepId: "s-1", content: "Tutor messages the supervisor", status: "live" },
    { id: "cell-2", laneId: "l-sup", stepId: "s-2", content: "Supervisor asks around in Slack", status: "live" },
    { id: "cell-3", laneId: "l-sup", stepId: "s-3", content: "Supervisor confirms by DM", status: "live" },
  ],
  link: "https://blueprint.example/?cell=cell-1",
};

const SERVICE_CHANGE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor finds a fill-in after a call-off",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
});

/** Two additions on empty slots, one change to a live cell, one deprecation. */
const DRAFT = JSON.stringify({
  rows: [
    { change: "added", step_id: "s-2", lane_id: "l-tutor", content: "Free tutor claims the posted call-off" },
    { change: "added", step_id: "s-3", lane_id: "l-tutor", content: "Claiming tutor confirms on the board" },
    { change: "changed", step_id: "s-2", lane_id: "l-sup", content: "Supervisor sees who claimed it" },
    { change: "deprecated", step_id: "s-3", lane_id: "l-sup", content: "" },
  ],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});
const ONLY_REMOVES = JSON.stringify({
  rows: [{ change: "deprecated", step_id: "s-3", lane_id: "l-sup", content: "" }],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});

const REQUESTER = "U1";
const BYSTANDER = "U2OTHER1";
/** Wednesday 2026-10-14, 10:00 ET. */
const NOW = Date.parse("2026-10-14T14:00:00Z");

const stagePrd: ScriptedReply = {
  text: "I've drafted the PRD on a card.",
  toolCalls: [
    {
      name: "notion_create",
      args: {
        surface: "prd",
        title: "Self-serve call-offs",
        summary: "Tutors post their own call-off and the first free tutor claims it. The supervisor only sees the result.",
        sections: [{ heading: "Open Questions", body: "Who sees a call-off nobody claims?" }],
      },
    },
  ],
};

/** A thread where a PRD turn posted its card and the Check it offer. */
async function offered(clock = { t: NOW }) {
  const threadState = createInMemoryThreadState({ now: () => clock.t });
  const h = harness({ replies: [stagePrd], threadState, now: () => clock.t });
  h.deps.serviceChangeJudgement = serviceChangeJudgement({
    gate: serviceChangeGate({ provider: fakeProvider({ generateReplies: [SERVICE_CHANGE] }), search: async () => MATCH }),
    affordable: () => true,
  });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), h.deps);
  const at = h.delivery.calls.findIndex((c) => c.kind === "check-offer");
  assert.ok(at >= 0, "the turn offered the check");
  const offerTs = `offer-${at + 1}`;
  return { threadState, clock, offerTs, cardTs: outcome.staged!.proposal.proposalTs };
}

/** The door's world: what it queued where, how it redrew the offer, and
 *  what it told the presser alone. */
function door(threadState: ThreadState, clock: { t: number }) {
  const queued: Array<{ key: string; job: RunnerJobPayload }> = [];
  const redrawn: CardMessage[] = [];
  const told: string[] = [];
  const press = (userId: string, offerTs: string) =>
    runCheckItDoor(
      { channel: CHANNEL, offerTs, userId },
      {
        store: threadState,
        enqueue: async (job, key) => void queued.push({ key, job }),
        replaceOffer: async (message) => void redrawn.push(message),
        replyEphemeral: async (text) => void told.push(text),
        now: () => clock.t,
      },
    );
  return { press, queued, redrawn, told };
}

/** The check's world: the store, a scripted path read and draft, and every
 *  post, card and status edit in the order the thread would see them. */
function job(threadState: ThreadState, opts: { drafts?: string[]; unreadable?: boolean; postFails?: boolean } = {}) {
  const seen: Array<{ kind: "post"; text: string } | { kind: "card"; ts: string } | { kind: "settle"; outcome: CheckOutcome; ts: string }> = [];
  const draftModel = fakeProvider({ generateReplies: opts.drafts ?? [DRAFT] });
  const pathReads: string[] = [];
  let cards = 0;
  const run = (offerTs: string) =>
    runBlueprintCheck(offerTs, {
      store: threadState,
      readPath: async (cellId) => {
        pathReads.push(cellId);
        return opts.unreadable ? null : TODAY;
      },
      draft: draftProposal({ provider: draftModel, affordable: () => true }),
      createdPage: async () => null,
      postResults: async (_offer, { text }) => {
        if (opts.postFails) throw new Error("channel_not_found");
        seen.push({ kind: "post", text });
      },
      postCard: async (_offer, card) => {
        const ts = `draw-${++cards}`;
        seen.push({ kind: "card", ts });
        return { ts, text: card.lead ?? "", ttlMs: cardExpiresAt(NOW) - NOW };
      },
      recordStaged: async () => {},
      settle: async (offer, outcome) => void seen.push({ kind: "settle", outcome, ts: offer.offerTs }),
    });
  return { run, seen, pathReads, draftModel };
}

async function liveCard(threadState: ThreadState, ts: string): Promise<PendingProposal> {
  const found = await threadState.getProposalByTs(ts);
  assert.equal(found.state, "found", `the card ${ts} is live`);
  return (found as Extract<typeof found, { state: "found" }>).proposal;
}

// ── The offer's message ──────────────────────────────────────────────────────

test("the offer names the scenario, says it takes a few minutes, shows its deadline and carries Check it", () => {
  const expiresAt = cardExpiresAt(NOW);
  const message = checkOfferMessage({ scenario: "Call-off", expiresAt });
  assert.equal(messageBlocksRefusal(message.blocks), null, "Slack takes it");
  assert.match(message.text, /This changes how \*Call-off\* works today — check it against the blueprint\? Takes a few minutes; review the card meanwhile\./);
  assert.match(message.text, new RegExp(`Expires <!date\\^${Math.floor(expiresAt / 1000)}\\^`), "its deadline is the shared rule's");
  const buttons = JSON.stringify(message.blocks);
  assert.match(buttons, new RegExp(`"action_id":"${CHECK_IT_ACTION_ID}"`));
  assert.match(buttons, /"text":"Check it"/);
  assert.doesNotMatch(buttons, /first free tutor/, "no idea text rides on the button");
});

// ── The press ────────────────────────────────────────────────────────────────

test("anyone in the thread may press Check it: the check is queued on a runner of its own, never the thread's", async () => {
  const { threadState, clock, offerTs } = await offered();
  const d = door(threadState, clock);
  await d.press(BYSTANDER, offerTs);

  assert.deepEqual(d.queued, [{ key: `${CHANNEL}:blueprint-check:${offerTs}`, job: { kind: "blueprint-check", offerTs, by: BYSTANDER } }]);
  assert.notEqual(d.queued[0]!.key, `${CHANNEL}:${CONVERSATION}`, "not the thread's runner");
  assert.deepEqual(d.told, []);
  assert.equal(d.redrawn.length, 1);
  assert.match(d.redrawn[0]!.text, /Checking \*Call-off\* against today's blueprint…/);
  assert.match(d.redrawn[0]!.text, new RegExp(`<@${BYSTANDER}> asked`));
  assert.doesNotMatch(JSON.stringify(d.redrawn[0]!.blocks), /"type":"actions"/, "Check it is gone once pressed");
  assert.equal(messageBlocksRefusal(d.redrawn[0]!.blocks), null);
});

test("a message typed in the thread while the check waits is answered without waiting for it", async () => {
  const { threadState, clock, offerTs } = await offered();
  // The Worker's runners, one storage per name, as the AgentRunner namespace holds them.
  const runners = new Map<string, InMemoryRunnerStorage>();
  const runner = (name: string) => runners.get(name) ?? (runners.set(name, createInMemoryRunnerStorage()), runners.get(name)!);
  const env = {
    AGENT_RUNNER: {
      idFromName: (name: string) => name,
      get: (name: string) => ({
        fetch: async (_url: string, init: { body: string }) => {
          await enqueueThreadJob(runner(name), JSON.parse(init.body) as RunnerJob, clock.t);
          return new Response(null, { status: 202 });
        },
      }),
    },
  } as unknown as Env;

  await runCheckItDoor(
    { channel: CHANNEL, offerTs, userId: REQUESTER },
    { store: threadState, enqueue: (j, key) => enqueueAgentJob(env, j, key), replaceOffer: async () => {}, replyEphemeral: async () => {}, now: () => clock.t },
  );
  const message: SlackMessageEvent = { type: "message", channel: CHANNEL, user: REQUESTER, text: "what about no-shows?", ts: "1700000000.000400", thread_ts: CONVERSATION };
  await enqueueAgentJob(env, { kind: "message", event: message }, conversationKey(message));

  // The thread's runner holds the message alone, so its next alarm answers it.
  const ran: string[] = [];
  await runOneJob(runner(conversationKey(message)), {
    now: () => clock.t,
    runThreadJob: async (j) => (ran.push(j.kind), "handled"),
    runScheduledJob: async () => {},
  });
  assert.deepEqual(ran, ["message"], "the turn ran with the check still queued");
  assert.equal((await runner(blueprintCheckRunnerKey(CHANNEL, offerTs)).list({ prefix: "job:" })).size, 1, "the check waits on its own runner");
});

test("a second press while the check is claimed runs nothing more, and is told so privately", async () => {
  const { threadState, clock, offerTs } = await offered();
  const d = door(threadState, clock);
  await d.press(REQUESTER, offerTs);
  await d.press(BYSTANDER, offerTs);

  assert.equal(d.queued.length, 1, "the check runs once");
  assert.deepEqual(d.told, ["*Call-off* is already being checked in this thread — the results post here."]);
  assert.equal(d.redrawn.length, 1, "the first press keeps the message");
});

test("a press past the offer's deadline checks nothing: the presser is told, and the offer loses its button", async () => {
  const { threadState, clock, offerTs } = await offered();
  clock.t = cardExpiresAt(NOW) + 1;
  const d = door(threadState, clock);
  await d.press(REQUESTER, offerTs);

  assert.deepEqual(d.queued, []);
  assert.deepEqual(d.told, [CHECK_EXPIRED_REPLY]);
  assert.match(d.redrawn[0]!.text, /Expired\.$/);
  assert.doesNotMatch(JSON.stringify(d.redrawn[0]!.blocks), /"type":"actions"/);
});

test("a press at the deadline itself still checks", async () => {
  const { threadState, clock, offerTs } = await offered();
  clock.t = cardExpiresAt(NOW);
  const d = door(threadState, clock);
  await d.press(REQUESTER, offerTs);
  assert.equal(d.queued.length, 1);
});

// ── The check ────────────────────────────────────────────────────────────────

test("the check posts today's steps beside the idea's as a follow-up, then the Draw on blueprint card, then says it is done", async () => {
  const { threadState, clock, offerTs, cardTs } = await offered();
  await door(threadState, clock).press(REQUESTER, offerTs);
  const j = job(threadState);
  await j.run(offerTs);

  assert.deepEqual(j.seen.map((s) => s.kind), ["post", "card", "settle"]);
  const results = (j.seen[0] as { text: string }).text;
  assert.match(results, /\*\*Your idea changes how \[\*Call-off\*\]\(https:\/\/blueprint\.example\/\?cell=cell-1\) works today\.\*\* Today's path is \*Standard\*:/);
  assert.match(results, /\*\*Find a fill-in\*\*\n- Today: Supervisor asks around in Slack \(`Supervisor`\)\n- Your idea: Free tutor claims the posted call-off \(`Tutor`\); Supervisor sees who claimed it \(`Supervisor`\)/);
  assert.match(results, /\*\*Call off a session\*\*\n- Today: Tutor messages the supervisor \(`Tutor`\)\n- Your idea: no such step/);
  assert.deepEqual(j.seen[2], { kind: "settle", outcome: { kind: "done" }, ts: offerTs }, "the offer's own message says it is done");
  // The idea it drafted is the PRD's, read back from the offer.
  assert.match(j.draftModel.generated[0]!.prompt, /Self-serve call-offs/);
  assert.equal(j.draftModel.generated[0]!.tier, "default");

  // The Draw on blueprint card: the requester's alone, a new proposed path.
  const draw = await liveCard(threadState, "draw-1");
  assert.deepEqual(draw.confirmers, [REQUESTER]);
  assert.equal(draw.exclusiveConfirmers, true);
  const [op] = proposalOperations(draw);
  assert.equal(op!.toolName, "blueprint_revise");
  assert.deepEqual((op!.input as { rows: unknown[] }).rows, [
    { stepId: "s-2", laneId: "l-tutor", content: "Free tutor claims the posted call-off", from: null, to: "proposed" },
    { stepId: "s-3", laneId: "l-tutor", content: "Claiming tutor confirms on the board", from: null, to: "proposed" },
    { stepId: "s-2", laneId: "l-sup", content: "Supervisor sees who claimed it", from: null, to: "proposed" },
  ]);
  assert.equal(draw.ttlMs, cardExpiresAt(NOW) - NOW, "staged with the deadline it shows");
  // The PRD's card still waits beside it.
  assert.equal((await liveCard(threadState, cardTs)).toolName, "notion_create");
});

test("an idea whose draft draws nothing still gets today's steps and its own words, and no card", async () => {
  const { threadState, clock, offerTs } = await offered();
  await door(threadState, clock).press(REQUESTER, offerTs);
  const j = job(threadState, { drafts: [ONLY_REMOVES] });
  await j.run(offerTs);

  assert.deepEqual(j.seen.map((s) => s.kind), ["post", "settle"]);
  const results = (j.seen[0] as { text: string }).text;
  assert.match(results, /Call off a session \(Tutor\) → Find a fill-in \(Supervisor\) → Confirm the fill-in \(Supervisor\)/);
  assert.match(results, /This idea: "Tutors post their own call-off and the first free tutor claims it\."/);
});

test("a path that cannot be read posts no results, and the status says the card is unaffected", async () => {
  const { threadState, clock, offerTs } = await offered();
  await door(threadState, clock).press(REQUESTER, offerTs);
  const j = job(threadState, { unreadable: true });
  await j.run(offerTs);

  assert.deepEqual(j.seen, [{ kind: "settle", outcome: { kind: "failed", reason: "unreadable" }, ts: offerTs }]);
  assert.equal(j.draftModel.generated.length, 0, "nothing drafted without today's path");
  assert.match(checkedMessage("Call-off", { kind: "failed", reason: "unreadable" }).text, /didn't finish\. Today's \*Call-off\* path couldn't be read\. Your card isn't affected\./);
});

test("a check that throws settles as failed rather than going silent", async () => {
  const { threadState, clock, offerTs } = await offered();
  await door(threadState, clock).press(REQUESTER, offerTs);
  const j = job(threadState, { postFails: true });
  await j.run(offerTs);
  assert.deepEqual(j.seen, [{ kind: "settle", outcome: { kind: "failed", reason: "error" }, ts: offerTs }]);
});

test("a job for an offer the store no longer holds does nothing", async () => {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const j = job(threadState);
  await j.run("offer-gone");
  assert.deepEqual(j.seen, []);
  assert.deepEqual(j.pathReads, []);
});

test("the offer the job reads is the one the turn kept, whatever became of the card since", async () => {
  const { threadState, clock, offerTs, cardTs } = await offered();
  // The card is decided before the check runs: its record is no longer live.
  await threadState.claimProposal(cardTs);
  await door(threadState, clock).press(REQUESTER, offerTs);
  const kept = (await threadState.getCheckOffer(offerTs)) as BlueprintCheckOffer;
  assert.equal(kept.cardTs, cardTs);
  const j = job(threadState);
  await j.run(offerTs);
  assert.deepEqual(j.seen.map((s) => s.kind), ["post", "card", "settle"]);
});
