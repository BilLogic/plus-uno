// The blueprint check while it runs: Stop, Check again, a second press, and
// a check that fails or runs too long (#1322).
//
// The seam is the button: presses on the offer a real PRD turn posted (the
// turn harness, its in-memory thread store) through the Check it and Stop
// doors, and the job those presses queue, run on a scripted drafter that can
// be held mid-call. What is asserted is what the thread sees — the status
// message as each press and the job leave it, the follow-ups, each presser's
// private replies — and what is queued.

import { test } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { draftProposal, runBlueprintCheck, stopRunningCheck, type BlueprintCheckJob, type PathToday } from "../src/blueprint-upkeep/index";
import type { ThreadState } from "../src/thread-state/index";
import { CHECK_IT_ACTION_ID, checkedMessage, runCheckItDoor, runStopCheckDoor, STOP_CHECK_ACTION_ID } from "../src/slack/blueprint-check";
import type { CardMessage } from "../src/slack/button-door";
import type { RunnerJobPayload } from "../src/slack/types";
import { cardExpiresAt } from "../src/card-expiry";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { CHANNEL } from "./helpers/turn-harness";
import { DRAFT, NOW, offered, REQUESTER, TODAY, until } from "./helpers/blueprint-check";

const PRESSER = "U2PRESSER";
const BYSTANDER = "U3OTHER1";

interface WorldOptions {
  /** Hold the drafter's model call until this settles (or the call is aborted). */
  draftGate?: Promise<unknown>;
  /** The check's deadline. */
  deadlineMs?: number;
  /** The runner refuses the job. */
  enqueueFails?: boolean;
  /** Today's path, as the read returns it. */
  readPath?: () => Promise<PathToday | null>;
  /** Posting the Draw on blueprint card throws. */
  postCardThrows?: boolean;
}

/** The thread around one offer: both doors, the job, and what each person
 *  saw — the status message's every state, the follow-ups, and the private
 *  replies by who got them. */
function world(threadState: ThreadState, clock: { t: number }, offerTs: string, opts: WorldOptions = {}) {
  const queued: Array<{ key: string; job: RunnerJobPayload }> = [];
  const status: CardMessage[] = [];
  const posts: string[] = [];
  const told: Array<{ to: string; text: string }> = [];
  const draftModel = fakeProvider({ generateReplies: [DRAFT, DRAFT, DRAFT], ...(opts.draftGate ? { generateGate: opts.draftGate } : {}) });
  const doorDeps = (userId: string) => ({
    replaceOffer: async (message: CardMessage) => void status.push(message),
    replyEphemeral: async (text: string) => void told.push({ to: userId, text }),
  });
  const press = (userId: string) =>
    runCheckItDoor(
      { channel: CHANNEL, offerTs, userId },
      {
        store: threadState,
        enqueue: async (job, key) => {
          if (opts.enqueueFails) return false;
          queued.push({ key, job });
          return true;
        },
        ...doorDeps(userId),
        now: () => clock.t,
      },
    );
  const stop = (userId: string) =>
    runStopCheckDoor(
      { channel: CHANNEL, offerTs, userId },
      { store: threadState, cancel: async (_offer, run) => void stopRunningCheck(run), ...doorDeps(userId) },
    );
  const runJob = (at: number) => {
    const { job } = queued[at]!;
    assert.equal(job.kind, "blueprint-check");
    return runBlueprintCheck(job as BlueprintCheckJob, {
      store: threadState,
      readPath: opts.readPath ?? (async () => TODAY),
      draft: draftProposal({ provider: draftModel, affordable: () => true }),
      createdPage: async () => null,
      postResults: async (_offer, results) => void posts.push(results.text),
      postCard: async (_offer, card) => {
        if (opts.postCardThrows) throw new Error("chat.postMessage: ratelimited");
        posts.push(`card: ${card.lead ?? ""}`);
        return { ts: `draw-${posts.length}`, text: card.lead ?? "", ttlMs: cardExpiresAt(NOW) - NOW };
      },
      recordStaged: async () => {},
      settle: async (offer, outcome) => void status.push(checkedMessage(offer, outcome)),
      ...(opts.deadlineMs !== undefined ? { deadlineMs: opts.deadlineMs } : {}),
    });
  };
  return { press, stop, runJob, queued, status, posts, told, draftModel };
}

const buttonsOf = (message: CardMessage | undefined) =>
  JSON.stringify(message?.blocks ?? [])
    .match(/"action_id":"[^"]+","text":\{"type":"plain_text","text":"[^"]+"/g)
    ?.map((b) => b.replace(/"action_id":"([^"]+)".*"text":"([^"]+)"$/, "$1 $2")) ?? [];

// ── Stop ─────────────────────────────────────────────────────────────────────

test("the checking message carries Stop", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  assert.deepEqual(buttonsOf(w.status[0]), [`${STOP_CHECK_ACTION_ID} Stop`]);
  assert.equal(messageBlocksRefusal(w.status[0]!.blocks), null, "Slack takes it");
});

test("the presser stops a running check: its model call is aborted, nothing is posted, and the message offers Check again", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { draftGate: new Promise(() => {}) });
  await w.press(PRESSER);
  const running = w.runJob(0);
  await until(() => w.draftModel.generated.length === 1);

  await w.stop(PRESSER);
  await running;

  assert.equal(w.draftModel.generated[0]!.signal?.aborted, true, "the in-flight model call was aborted");
  assert.deepEqual(w.posts, [], "no partial results");
  assert.equal(w.status.length, 2, "the job did not redraw the stopped message");
  assert.equal(w.status[1]!.text, "Stopped the blueprint check. Your card isn't affected.");
  assert.deepEqual(buttonsOf(w.status[1]), [`${CHECK_IT_ACTION_ID} Check again`]);
  assert.equal(messageBlocksRefusal(w.status[1]!.blocks), null);
  assert.deepEqual(w.told, []);
});

test("the card's requester may stop someone else's check", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.stop(REQUESTER);
  assert.equal(w.status.at(-1)!.text, "Stopped the blueprint check. Your card isn't affected.");
  await w.runJob(0);
  assert.deepEqual(w.posts, [], "a job that starts after Stop posts nothing");
  assert.equal(w.draftModel.generated.length, 0, "and asks the model nothing");
});

test("anyone else pressing Stop is told who can, privately, and the check carries on", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.stop(BYSTANDER);

  assert.deepEqual(w.told, [{ to: BYSTANDER, text: `Only <@${PRESSER}> or <@${REQUESTER}> can stop this check.` }]);
  assert.equal(w.status.length, 1, "the checking message stands");
  await w.runJob(0);
  assert.match(w.posts[0]!, /Your idea changes how/);
});

test("when the presser is the requester, Stop's refusal names them once", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(REQUESTER);
  await w.stop(BYSTANDER);
  assert.deepEqual(w.told, [{ to: BYSTANDER, text: `Only <@${REQUESTER}> can stop this check.` }]);
});

test("Check again after Stop starts a fresh check, which posts its results", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.stop(PRESSER);
  await w.press(BYSTANDER);

  assert.equal(w.queued.length, 2, "a second check is queued");
  assert.notDeepEqual(w.queued[1]!.job, w.queued[0]!.job, "as a run of its own");
  assert.match(w.status.at(-1)!.text, new RegExp(`Checking \\*Call-off\\*.*<@${BYSTANDER}> asked`));

  await w.runJob(0);
  assert.deepEqual(w.posts, [], "the stopped run's job still posts nothing");
  await w.runJob(1);
  assert.match(w.posts[0]!, /Your idea changes how/);
  assert.deepEqual(w.told, []);
});

test("once the results post, Stop is gone, and a late Stop is told the check finished", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.runJob(0);

  const done = w.status.at(-1)!;
  assert.match(done.text, /^Checked \*Call-off\* against today's blueprint/);
  assert.deepEqual(buttonsOf(done), [], "no Stop once the results are up");
  assert.ok(w.posts.length > 0);

  await w.stop(PRESSER);
  assert.deepEqual(w.told, [{ to: PRESSER, text: "That check already finished — the results are in the thread." }]);
  assert.equal(w.status.at(-1), done, "the message is left as it is");
});

// ── A second press ───────────────────────────────────────────────────────────

test("two Check it presses run one check; the second hears it is already running", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await Promise.all([w.press(PRESSER), w.press(BYSTANDER)]);

  assert.equal(w.queued.length, 1, "one check");
  assert.equal(w.told.length, 1);
  assert.equal(w.told[0]!.text, "*Call-off* is already being checked in this thread — the results post here.");
});

test("a press after the check finished checks the scenario again: only a running check is refused", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs);
  await w.press(PRESSER);
  await w.runJob(0);
  await w.press(BYSTANDER);
  assert.equal(w.queued.length, 2, "a second check is queued");
  assert.notEqual((w.queued[1]!.job as BlueprintCheckJob).run, (w.queued[0]!.job as BlueprintCheckJob).run, "as a run of its own");
  assert.deepEqual(w.told, []);

  await w.press(PRESSER);
  assert.equal(w.queued.length, 2, "while it runs, a third press queues nothing");
  assert.deepEqual(w.told, [{ to: PRESSER, text: "*Call-off* is already being checked in this thread — the results post here." }]);
});

// ── Failures ─────────────────────────────────────────────────────────────────

test("a Draw on blueprint card that throws after the results post leaves the check done: no Try again, no second results", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { postCardThrows: true });
  await w.press(PRESSER);
  await w.runJob(0);

  assert.equal(w.posts.length, 1, "the results posted, once");
  const done = w.status.at(-1)!;
  assert.match(done.text, /^Checked \*Call-off\* against today's blueprint/, "the message still says the check finished");
  assert.deepEqual(buttonsOf(done), []);
  await w.stop(PRESSER);
  assert.deepEqual(w.told, [{ to: PRESSER, text: "That check already finished — the results are in the thread." }]);
});

test("a check that runs too long is stopped at its deadline and says so, with Try again", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { draftGate: new Promise(() => {}), deadlineMs: 5 });
  await w.press(PRESSER);
  await w.runJob(0);

  assert.equal(w.draftModel.generated[0]!.signal?.aborted, true);
  assert.deepEqual(w.posts, []);
  const failed = w.status.at(-1)!;
  assert.equal(failed.text, "The blueprint check didn't finish — it ran too long. Your card isn't affected.");
  assert.deepEqual(buttonsOf(failed), [`${CHECK_IT_ACTION_ID} Try again`]);
  assert.equal(messageBlocksRefusal(failed.blocks), null);

  await w.press(BYSTANDER);
  assert.equal(w.queued.length, 2, "Try again runs the check again");
});

test("a check that fails says the card is unaffected and offers Try again", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { readPath: async () => Promise.reject(new Error("PostgREST 503")) });
  await w.press(PRESSER);
  await w.runJob(0);

  assert.deepEqual(w.posts, []);
  const failed = w.status.at(-1)!;
  assert.equal(failed.text, "The blueprint check didn't finish. Your card isn't affected.");
  assert.deepEqual(buttonsOf(failed), [`${CHECK_IT_ACTION_ID} Try again`]);
  await w.press(PRESSER);
  assert.equal(w.queued.length, 2, "Try again runs the check again");
});

test("a path that cannot be read fails the same way, with Try again", async () => {
  const { threadState, clock, offerTs } = await offered();
  const w = world(threadState, clock, offerTs, { readPath: async () => null });
  await w.press(PRESSER);
  await w.runJob(0);
  assert.match(w.status.at(-1)!.text, /didn't finish\. Today's \*Call-off\* path couldn't be read\. Your card isn't affected\.$/);
  assert.deepEqual(buttonsOf(w.status.at(-1)), [`${CHECK_IT_ACTION_ID} Try again`]);
});

test("a press whose job cannot be queued tells the presser, and Try again can start it", async () => {
  const { threadState, clock, offerTs } = await offered();
  const opts = { enqueueFails: true };
  const w = world(threadState, clock, offerTs, opts);
  await w.press(PRESSER);

  assert.deepEqual(w.told, [{ to: PRESSER, text: "I couldn't start the blueprint check — try again in a moment. Your card isn't affected." }]);
  const failed = w.status.at(-1)!;
  assert.match(failed.text, /didn't finish/);
  assert.deepEqual(buttonsOf(failed), [`${CHECK_IT_ACTION_ID} Try again`]);
  opts.enqueueFails = false;
  await w.press(PRESSER);
  assert.equal(w.queued.length, 1, "Try again queues the check");
});
