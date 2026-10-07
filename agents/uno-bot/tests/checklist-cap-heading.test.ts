// The checklist's bounds, seen from Slack: no more than eight task cards a
// turn, the rest folded into one "…and N more" card that tracks them, and one
// heading drawn from the ask.
//
// Driven on the recording Slack client, like `tests/checklist-slack.test.ts`,
// whose event shapes and grouping this file follows.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";

const TARGET: SlackDeliveryTarget = {
  channel: "C123",
  replyTs: "100.1",
  userMsgTs: "100.1",
  userId: "U1",
  team: "T1",
};

const NAME = "notion_search";

const announced = (seq: number): ToolProgressEvent => ({ seq, name: NAME, args: {}, phase: "announced" });
const started = (seq: number): ToolProgressEvent => ({ seq, name: NAME, args: {}, phase: "started" });
const finished = (seq: number, error?: string): ToolProgressEvent => ({
  seq,
  name: NAME,
  args: {},
  phase: "finished",
  result: error ? JSON.stringify({ ok: false, error }) : JSON.stringify({ ok: true, rows: [] }),
  ...(error ? { error } : {}),
});

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Every card as Slack last saw it, by id. */
function lastSeen(slack: RecordingSlack): Map<string, { title: string; status: string; output?: string }> {
  const out = new Map<string, { title: string; status: string; output?: string }>();
  for (const call of slack.of("tasks")) for (const t of call.tasks) out.set(t.id, t);
  return out;
}

/** Run `n` lookups the way the loop reports a reply that asks for all of them. */
async function lookups(
  delivery: ReturnType<typeof deliveryAdapter>,
  n: number,
  erred: ReadonlySet<number> = new Set(),
): Promise<void> {
  for (let seq = 1; seq <= n; seq++) delivery.toolProgress(announced(seq));
  delivery.toolProgress(started(1));
  await tick();
  for (let seq = 1; seq <= n; seq++) {
    delivery.toolProgress(finished(seq, erred.has(seq) ? "upstream said no" : undefined));
    if (seq < n) delivery.toolProgress(started(seq + 1));
    await tick();
  }
}

describe("the checklist's card cap", () => {
  it("shows eight cards and folds the rest into one '…and N more' card that ends complete", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await lookups(delivery, 11);

    const cards = lastSeen(slack);
    const toolCards = [...cards.keys()].filter((id) => id !== "understand");
    assert.equal(toolCards.length, 9);
    assert.deepEqual(
      toolCards.filter((id) => /^tool-\d+$/.test(id)),
      ["tool-1", "tool-2", "tool-3", "tool-4", "tool-5", "tool-6", "tool-7", "tool-8"],
    );
    const more = cards.get("tool-more");
    assert.ok(more, "an overflow card");
    assert.equal(more.title, "…and 3 more");
    assert.equal(more.status, "complete");
    // Never a card past the ninth, at any point.
    for (const call of slack.of("tasks")) {
      for (const t of call.tasks) assert.ok(t.id === "understand" || toolCards.includes(t.id), t.id);
    }

    await delivery.postAnswer("Here it is.");
  });

  it("ends the overflow card in error when any call folded into it erred", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await lookups(delivery, 11, new Set([10]));

    const more = lastSeen(slack).get("tool-more");
    assert.equal(more?.status, "error");
    assert.equal(lastSeen(slack).get("tool-8")?.status, "complete");
  });

  it("keeps the overflow card in progress while a folded call runs, and counts calls announced later", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await lookups(delivery, 9);
    assert.equal(lastSeen(slack).get("tool-more")?.title, "…and 1 more");
    // A second reply asks for two more.
    delivery.toolProgress(announced(10));
    delivery.toolProgress(announced(11));
    delivery.toolProgress(started(10));
    await tick();
    const more = lastSeen(slack).get("tool-more");
    assert.equal(more?.title, "…and 3 more");
    assert.equal(more?.status, "in_progress");
  });
});

describe("the checklist's heading", () => {
  it("retitles the checklist once, from the ask, after the stream opens", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "Did the session-notes redesign ship?\nAsking for the Q3 recap.");
    await lookups(delivery, 3);
    await delivery.postAnswer("Here it is.");

    const headings = slack.of("heading");
    assert.equal(headings.length, 1);
    assert.equal(headings[0]!.title, "Did the session-notes redesign ship? Asking for the Q3 recap.");
    const order = slack.calls.map((c) => c.kind);
    assert.ok(order.indexOf("startStream") < order.indexOf("heading"));
    assert.ok(order.indexOf("heading") < order.indexOf("answer"));
  });

  it("keeps the heading within Slack's 256-character cap", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "word ".repeat(200));
    await delivery.endProgress("complete");

    const [heading] = slack.of("heading");
    assert.ok(heading);
    assert.ok(heading.title.length <= 256, `${heading.title.length}`);
    assert.ok(heading.title.endsWith("…"));
  });

  it("sends no heading without an ask, and none without a stream", async () => {
    const noAsk = recordingSlack();
    const a = deliveryAdapter(noAsk.deps(true), TARGET);
    await a.beginProgress("Working on it");
    await a.endProgress("complete");
    assert.equal(noAsk.of("heading").length, 0);

    const off = recordingSlack();
    const b = deliveryAdapter(off.deps(false), TARGET);
    await b.beginProgress("Working on it", "Did it ship?");
    await b.endProgress("complete");
    assert.equal(off.of("heading").length, 0);
  });
});

describe("the checklist's Slack spend", () => {
  it("never exceeds start + one per transition + one heading + stop, however many calls", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "Pull everything on the tutor import table");
    await lookups(delivery, 20);
    await delivery.endProgress("complete");

    const spend = slack.calls.filter((c) => ["startStream", "tasks", "heading", "stopStream"].includes(c.kind));
    // Transitions: the opening card, the batch announced with the first start,
    // then one per lookup finishing (with the next starting beside it).
    const transitions = 1 + 1 + 20;
    assert.ok(spend.length <= 1 + transitions + 1 + 1, `${spend.length}`);
    assert.equal(slack.of("heading").length, 1);
    assert.equal(slack.of("startStream").length, 1);
    assert.equal(slack.of("stopStream").length, 1);
  });
});
