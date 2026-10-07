// Every update to an open plan stream travels one serialized chain, and every
// one of them is caught.
//
// Until this, `postInterim` sent its two task updates — close the card in
// progress, open the next — as two bare `void slack.appendTask(...)` calls. Two
// things followed. A refused or thrown append had nobody to catch it, so it was
// an unhandled rejection in the Worker. And nothing ordered them: a slow
// "complete" for one card could land after the "in progress" for the next, and
// the checklist read as two steps both still happening — or, worse, as a step
// that finished before it started.
//
// Driven on the recording Slack client, so what is asserted is what Slack was
// handed and in which order it LANDED, not which function ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { recordingSlack, type SlackCall } from "./helpers/recording-slack";

const TARGET: SlackDeliveryTarget = {
  channel: "C123",
  replyTs: "100.1",
  userMsgTs: "100.1",
  userId: "U1",
  team: "T1",
};

/** Early updates slow, later ones fast: a client that resolves out of order. */
const outOfOrder = (index: number): number => Math.max(0, 40 - index * 10);

/** A task call as `card:status`, so an order reads as one line. */
const step = (call: SlackCall): string =>
  call.kind === "task" ? `${call.task.id}:${call.task.status}` : call.kind;

/** Collect any rejection nobody handled while `run` executes. */
async function unhandledDuring(run: () => Promise<void>): Promise<unknown[]> {
  const escaped: unknown[] = [];
  const onRejection = (reason: unknown): void => {
    escaped.push(reason);
  };
  process.on("unhandledRejection", onRejection);
  try {
    await run();
    // Let any stray rejection reach the process before looking.
    await new Promise((resolve) => setTimeout(resolve, 60));
  } finally {
    process.off("unhandledRejection", onRejection);
  }
  return escaped;
}

describe("plan-stream updates", () => {
  it("land in the order the adapter issued them, even on a client that resolves out of order", async () => {
    const slack = recordingSlack({ taskDelayMs: outOfOrder });
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("checking Notion");
    delivery.postInterim("checking Figma");
    await delivery.postAnswer("Here it is.");

    assert.deepEqual(slack.landed.map(step), [
      "startStream",
      "understand:in_progress",
      "understand:complete",
      "step-1:in_progress",
      "step-1:complete",
      "step-2:in_progress",
      "step-2:complete",
      "answer",
    ]);
  });

  it("never let a refused update escape, and the turn still answers and closes the stream", async () => {
    const slack = recordingSlack({ taskRejects: new Error("invalid_arguments"), taskDelayMs: outOfOrder });
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    const escaped = await unhandledDuring(async () => {
      await delivery.beginProgress("Working on it");
      delivery.postInterim("checking Notion");
      delivery.postInterim("checking Figma");
      const posted = await delivery.postAnswer("Here it is.");
      assert.equal(posted.ok, true);
    });

    assert.deepEqual(escaped, [], "no task update surfaced as an unhandled rejection");
    // Every update was still offered to Slack, in order, after the one before it failed.
    assert.equal(slack.of("task").length, 6);
    // The answer closes the stream it was handed, so nothing is left spinning.
    assert.deepEqual(
      slack.of("answer").map((a) => a.openStreamTs),
      ["stream-1"],
    );
  });

  it("drain before endProgress stops the stream", async () => {
    const slack = recordingSlack({ taskDelayMs: outOfOrder });
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("checking Notion");
    delivery.postInterim("checking Figma");
    await delivery.endProgress("error");

    assert.deepEqual(slack.landed.map(step), [
      "startStream",
      "understand:in_progress",
      "understand:complete",
      "step-1:in_progress",
      "step-1:complete",
      "step-2:in_progress",
      "step-2:error",
      "stopStream",
    ]);
  });

  it("with the plan switch off, post exactly today's narration messages", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("checking Notion");
    delivery.postInterim("checking Figma");
    await delivery.endProgress("complete");

    assert.deepEqual(slack.calls, [
      { kind: "message", channel: "C123", threadTs: "100.1", text: ":hourglass_flowing_sand: checking Notion", blocks: false },
      { kind: "message", channel: "C123", threadTs: "100.1", text: ":hourglass_flowing_sand: checking Figma", blocks: false },
    ]);
  });
});
