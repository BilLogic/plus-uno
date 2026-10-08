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
// The cards are driven by lookups now rather than by narration, and the chain
// is what every one of their updates still travels.
//
// Driven on the recording Slack client, so what is asserted is what Slack was
// handed and in which order it LANDED, not which function ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
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

/** An append as its cards' `id:status`, so an order reads as one line. */
const step = (call: SlackCall): string =>
  call.kind === "tasks" ? call.tasks.map((t) => `${t.id}:${t.status}`).join(" ") : call.kind;

const NAMES: Record<number, string> = { 1: "notion_search", 2: "slack_search" };
const event = (seq: number, phase: "announced" | "started"): ToolProgressEvent => ({
  seq,
  name: NAMES[seq]!,
  args: {},
  phase,
});
const finished = (seq: number): ToolProgressEvent => ({
  seq,
  name: NAMES[seq]!,
  args: {},
  phase: "finished",
});

/** Two lookups, reported the way the loop reports them, a tool run apart. */
async function twoLookups(delivery: ReturnType<typeof deliveryAdapter>): Promise<void> {
  for (const e of [event(1, "announced"), event(2, "announced"), event(1, "started")]) delivery.toolProgress(e);
  await new Promise((resolve) => setTimeout(resolve, 0));
  for (const e of [finished(1), event(2, "started")]) delivery.toolProgress(e);
  await new Promise((resolve) => setTimeout(resolve, 0));
  delivery.toolProgress(finished(2));
}

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
    await twoLookups(delivery);
    await delivery.postAnswer("Here it is.");

    // Updates issued while an earlier append is still in flight wait for it,
    // and travel together once it lands — so a card's later state can never
    // reach Slack ahead of an earlier one.
    assert.deepEqual(slack.landed.map(step), [
      "startStream",
      "understand:in_progress",
      "understand:complete tool-1:in_progress",
      // Updates issued while the append before them was still in flight
      // travel together, the later state of one card winning.
      "tool-1:complete tool-2:complete",
      "stopStream",
      "answer",
    ]);
  });

  it("never let a refused update escape, and the turn still answers and closes the stream", async () => {
    const slack = recordingSlack({ taskRejects: new Error("invalid_arguments"), taskDelayMs: outOfOrder });
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    const escaped = await unhandledDuring(async () => {
      await delivery.beginProgress("Working on it");
      await twoLookups(delivery);
      const posted = await delivery.postAnswer("Here it is.");
      assert.equal(posted.ok, true);
    });

    assert.deepEqual(escaped, [], "no task update surfaced as an unhandled rejection");
    // Every update was still offered to Slack, in order, after the one before it failed.
    assert.deepEqual(slack.of("tasks").map(step), [
      "understand:in_progress",
      "understand:complete tool-1:in_progress",
      "tool-1:complete tool-2:complete",
    ]);
    // The stream is still stopped, so nothing is left spinning, and the answer
    // posts beneath it.
    assert.deepEqual(
      slack.calls.filter((c) => c.kind === "stopStream" || c.kind === "answer").map((c) => c.kind),
      ["stopStream", "answer"],
    );
  });

  it("drain before endProgress stops the stream", async () => {
    const slack = recordingSlack({ taskDelayMs: outOfOrder });
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    for (const e of [event(1, "announced"), event(2, "announced"), event(1, "started")]) delivery.toolProgress(e);
    await delivery.endProgress("error");

    assert.deepEqual(slack.landed.map(step), [
      "startStream",
      "understand:in_progress",
      "understand:complete tool-1:error tool-2:error",
      "stopStream",
    ]);
  });

  it("with the plan switch off, post exactly today's narration messages", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("checking Notion");
    delivery.postInterim("checking Figma");
    await twoLookups(delivery);
    await delivery.endProgress("complete");

    assert.deepEqual(slack.calls, [
      { kind: "message", channel: "C123", threadTs: "100.1", text: "checking Notion", blocks: false },
      { kind: "message", channel: "C123", threadTs: "100.1", text: "checking Figma", blocks: false },
    ]);
  });
});
