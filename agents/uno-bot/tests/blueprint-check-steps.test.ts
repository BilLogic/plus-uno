// The blueprint check's steps, shown live on the plan task card a turn uses
// (#1344): opened in the offer's thread as the check starts, each step ticked
// as the check moves, and closed as the check ended — done, stopped or
// failed — before anything else it posts.
//
// The seam is the button and the job, as in the Stop tests: a press on the
// offer a real PRD turn posted, and the job it queues, run with the Slack
// card (`checkPlanCard`) over a recording plan client. What is asserted is
// what the thread sees, in order: each plan call, the status message's
// states and the follow-ups.

import { test } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { draftProposal, runBlueprintCheck, stopRunningCheck, type BlueprintCheckJob, type PathToday } from "../src/blueprint-upkeep/index";
import type { ThreadState } from "../src/thread-state/index";
import { checkedMessage, checkPlanCard, runCheckItDoor, runStopCheckDoor, type CheckPlanClient } from "../src/slack/blueprint-check";
import type { TaskChunk } from "../src/slack/api";
import type { RunnerJobPayload } from "../src/slack/types";
import { cardExpiresAt } from "../src/card-expiry";
import { CHANNEL } from "./helpers/turn-harness";
import { DRAFT, NOW, offered, TODAY, until } from "./helpers/blueprint-check";

const PRESSER = "U2PRESSER";
const TEAM = "T0PLUS";

interface WorldOptions {
  draftGate?: Promise<unknown>;
  deadlineMs?: number;
  readPath?: () => Promise<PathToday | null>;
  /** The plan stream will not open. */
  streamRefused?: boolean;
  /** Every append to the plan throws. */
  appendThrows?: boolean;
}

/** One plan call as the thread sees it. */
type PlanCall =
  | { call: "open" }
  | { call: "append" | "close"; ts: string; tasks: TaskChunk[]; title?: string };

function world(threadState: ThreadState, clock: { t: number }, offerTs: string, opts: WorldOptions = {}) {
  const queued: Array<{ key: string; job: RunnerJobPayload }> = [];
  /** Everything the thread saw, in order. */
  const seen: Array<PlanCall | { call: "status"; text: string } | { call: "post"; text: string }> = [];
  let streams = 0;
  const plan: CheckPlanClient = {
    async open() {
      seen.push({ call: "open" });
      if (opts.streamRefused) return null;
      streams += 1;
      return `plan-${streams}`;
    },
    async append(ts, tasks, title) {
      if (opts.appendThrows) throw new Error("chat.appendStream: ratelimited");
      seen.push({ call: "append", ts, tasks: [...tasks], ...(title ? { title } : {}) });
    },
    async close(ts, tasks, title) {
      seen.push({ call: "close", ts, tasks: [...tasks], ...(title ? { title } : {}) });
    },
  };
  const draftModel = fakeProvider({ generateReplies: [DRAFT, DRAFT, DRAFT], ...(opts.draftGate ? { generateGate: opts.draftGate } : {}) });
  const press = (userId: string) =>
    runCheckItDoor(
      { channel: CHANNEL, offerTs, userId, team: TEAM },
      {
        store: threadState,
        enqueue: async (job, key) => {
          queued.push({ key, job });
          return true;
        },
        replaceOffer: async (message) => void seen.push({ call: "status", text: message.text }),
        replyEphemeral: async () => {},
        now: () => clock.t,
      },
    );
  const stop = (userId: string) =>
    runStopCheckDoor(
      { channel: CHANNEL, offerTs, userId },
      {
        store: threadState,
        cancel: async (_offer, run) => void stopRunningCheck(run),
        replaceOffer: async (message) => void seen.push({ call: "status", text: message.text }),
        replyEphemeral: async () => {},
      },
    );
  const runJob = (at: number) => {
    const { job } = queued[at]!;
    assert.equal(job.kind, "blueprint-check");
    return runBlueprintCheck(job as BlueprintCheckJob, {
      store: threadState,
      readPath: opts.readPath ?? (async () => TODAY),
      draft: draftProposal({ provider: draftModel, affordable: () => true }),
      createdPage: async () => null,
      postResults: async (_offer, results) => void seen.push({ call: "post", text: results.text }),
      postCard: async (_offer, card) => {
        seen.push({ call: "post", text: `card: ${card.lead ?? ""}` });
        return { ts: `draw-${seen.length}`, text: card.lead ?? "", ttlMs: cardExpiresAt(NOW) - NOW };
      },
      recordStaged: async () => {},
      settle: async (offer, outcome) => void seen.push({ call: "status", text: checkedMessage(offer, outcome).text }),
      progress: (offer) => checkPlanCard(offer, plan),
      ...(opts.deadlineMs !== undefined ? { deadlineMs: opts.deadlineMs } : {}),
    });
  };
  return { press, stop, runJob, queued, seen, draftModel };
}

const planCalls = (seen: ReturnType<typeof world>["seen"]) => seen.filter((s): s is PlanCall => s.call === "open" || s.call === "append" || s.call === "close");
/** Each task as `id status [output]`, for a compact read of the card. */
const steps = (tasks: TaskChunk[]) => tasks.map((t) => [t.id, t.status, ...(t.output ? [t.output] : [])].join(" "));

test("a check opens the plan card in the thread and ticks its steps as it moves, closing it before the results post", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.runJob(0);

  const calls = planCalls(w.seen);
  assert.deepEqual(calls.map((c) => c.call), ["open", "append", "append", "append", "close"]);
  const [, first, second, third, last] = calls as Array<Extract<PlanCall, { tasks: TaskChunk[] }>>;
  assert.equal(first!.title, "Checking Call-off against today's blueprint");
  assert.deepEqual(first!.tasks.map((t) => t.title), ["Reading today's Call-off"]);
  assert.deepEqual(steps(first!.tasks), ["read in_progress"]);
  assert.deepEqual(steps(second!.tasks), ["read complete", "draft in_progress"]);
  assert.equal(second!.tasks[1]!.title, "Drafting your idea against it");
  assert.deepEqual(steps(third!.tasks), ["draft complete", "compare in_progress"]);
  assert.equal(third!.tasks[1]!.title, "Comparing the paths");
  assert.deepEqual(steps(last!.tasks), ["compare complete"]);
  assert.equal(last!.title, "Checked Call-off against today's blueprint");
  assert.ok(calls.every((c) => c.call === "open" || c.ts === "plan-1"), "one card");

  const closed = w.seen.findIndex((s) => s.call === "close");
  const firstPost = w.seen.findIndex((s) => s.call === "post");
  assert.ok(firstPost > closed, "the results post beneath a closed card");
  assert.match((w.seen.at(-2) as { text: string }).text, /Free tutor claims the posted call-off/, "the results post as they did");
});

test("the card shows no pending step and no icon Slack would refuse", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.runJob(0);
  const tasks = planCalls(w.seen).flatMap((c) => ("tasks" in c ? c.tasks : []));
  assert.ok(tasks.every((t) => (["in_progress", "complete", "error"] as string[]).includes(t.status)));
  assert.ok(tasks.every((t) => t.icon === undefined || t.icon.type === "icon"));
  assert.ok(tasks.every((t) => !/[*_<>]/.test(t.title)), "plain text: a task's title takes no markup");
});

test("Stop mid-check closes the card as stopped, and nothing else posts", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { draftGate: new Promise(() => {}) });
  await w.press(PRESSER);
  const running = w.runJob(0);
  await until(() => w.draftModel.generated.length === 1);
  await w.stop(PRESSER);
  await running;

  const last = planCalls(w.seen).at(-1) as Extract<PlanCall, { tasks: TaskChunk[] }>;
  assert.equal(last.call, "close");
  assert.equal(last.title, "Stopped the blueprint check");
  assert.deepEqual(steps(last.tasks), ["draft error Stopped"]);
  assert.ok(!w.seen.some((s) => s.call === "post"), "no results");
  assert.equal((w.seen.filter((s) => s.call === "status").at(-1) as { text: string }).text, "Stopped the blueprint check. Your card isn't affected.");
});

test("a check that runs too long closes the card in error, and Try again opens a fresh one", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { draftGate: new Promise(() => {}), deadlineMs: 5 });
  await w.press(PRESSER);
  await w.runJob(0);

  const last = planCalls(w.seen).at(-1) as Extract<PlanCall, { tasks: TaskChunk[] }>;
  assert.equal(last.call, "close");
  assert.equal(last.title, "The blueprint check didn't finish");
  assert.deepEqual(steps(last.tasks), ["draft error Ran too long"]);

  await w.press(PRESSER);
  assert.equal(w.queued.length, 2, "Try again queues the check");
  const before = planCalls(w.seen).length;
  void w.runJob(1);
  await until(() => planCalls(w.seen).length > before + 1);
  const reopened = planCalls(w.seen).slice(before);
  assert.equal(reopened[0]!.call, "open");
  assert.equal((reopened[1] as { ts: string }).ts, "plan-2", "a card of its own");
});

test("a path that cannot be read closes the card in error on its first step", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { readPath: async () => null });
  await w.press(PRESSER);
  await w.runJob(0);
  const last = planCalls(w.seen).at(-1) as Extract<PlanCall, { tasks: TaskChunk[] }>;
  assert.equal(last.call, "close");
  assert.equal(last.title, "The blueprint check didn't finish");
  assert.deepEqual(steps(last.tasks), ["read error Couldn't be read"]);
});

test("a check that fails closes the card in error", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { readPath: async () => Promise.reject(new Error("PostgREST 503")) });
  await w.press(PRESSER);
  await w.runJob(0);
  const last = planCalls(w.seen).at(-1) as Extract<PlanCall, { tasks: TaskChunk[] }>;
  assert.equal(last.call, "close");
  assert.deepEqual(steps(last.tasks), ["read error"]);
});

test("a stream Slack will not open costs the check nothing: one try, and the results post", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { streamRefused: true });
  await w.press(PRESSER);
  await w.runJob(0);
  assert.deepEqual(planCalls(w.seen).map((c) => c.call), ["open"]);
  assert.ok(w.seen.some((s) => s.call === "post"));
});

test("a plan update that throws never fails the check", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { appendThrows: true });
  await w.press(PRESSER);
  await w.runJob(0);
  assert.match((w.seen.filter((s) => s.call === "status").at(-1) as { text: string }).text, /^Checked \*Call-off\*/);
  assert.ok(w.seen.some((s) => s.call === "post"));
});

test("the job carries the presser's workspace, which the plan stream is opened for", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  assert.deepEqual(w.queued[0]!.job, { kind: "blueprint-check", offerTs, by: PRESSER, team: TEAM, run: (w.queued[0]!.job as { run: string }).run });
});
