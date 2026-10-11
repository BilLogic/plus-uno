// The checklist's bounds, seen from Slack: no more than eight task cards a
// turn, the rest folded into one "…and N more" card that tracks them, and one
// heading drawn from the ask.
//
// Driven on the recording Slack client, like `tests/checklist-slack.test.ts`,
// whose event shapes and grouping this file follows.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { finishedProgress, type ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";

const TARGET: SlackDeliveryTarget = {
  channel: "C123",
  replyTs: "100.1",
  userMsgTs: "100.1",
  userId: "U1",
  team: "T1",
};

// Two tools in turn, so no lookup follows one of its own kind: consecutive
// lookups of one kind share a card (`tests/checklist-steps.test.ts`), and the
// cap is about cards.
const nameOf = (seq: number): string => (seq % 2 ? "notion_search" : "slack_search");

const announced = (seq: number): ToolProgressEvent => ({ seq, name: nameOf(seq), args: {}, phase: "announced" });
const started = (seq: number): ToolProgressEvent => ({ seq, name: nameOf(seq), args: {}, phase: "started" });
const finished = (seq: number, error?: string): ToolProgressEvent =>
  finishedProgress(
    { seq, name: nameOf(seq), args: {} },
    error ? JSON.stringify({ ok: false, error }) : JSON.stringify({ ok: true, rows: [] }),
    error,
  );

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Every card as Slack last saw it, by id. */
function lastSeen(slack: RecordingSlack): Map<string, { title: string; status: string; output?: string }> {
  const out = new Map<string, { title: string; status: string; output?: string }>();
  for (const call of slack.checklist()) for (const t of call.tasks) out.set(t.id, t);
  return out;
}

/** Every heading the checklist was given: each rides an append. */
const headings = (slack: RecordingSlack): string[] => slack.checklist().flatMap((c) => (c.title ? [c.title] : []));

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
    await delivery.postAnswer("Here it is.");

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
    for (const call of slack.checklist()) {
      for (const t of call.tasks) assert.ok(t.id === "understand" || toolCards.includes(t.id), t.id);
    }
  });

  it("ends the overflow card complete, saying how many folded calls failed", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await lookups(delivery, 11, new Set([10]));
    await delivery.postAnswer("Here it is.");

    const more = lastSeen(slack).get("tool-more");
    assert.equal(more?.status, "complete");
    assert.equal(more?.output, "1 failed");
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
  it("keeps DM prompts out of the progress message, with or without a Figma link", async () => {
    for (const ask of ["What is in progress?", "https://figma.com/design/AbC123/Sessions?node-id=1-2 what does this comment say?"]) {
      for (const threaded of [true, false]) {
        const slack = recordingSlack();
        const target = { ...TARGET, channel: "D0BILL", ...(threaded ? {} : { replyTs: undefined }) };
        const delivery = deliveryAdapter(slack.deps(true), target);
        await delivery.beginProgress("Working on it", ask);
        await lookups(delivery, 1);
        await delivery.postAnswer("Here is the answer.");
        assert.equal(headings(slack).length, 0, "a DM checklist does not repeat the ask as a heading");
        for (const call of slack.calls) assert.ok(!JSON.stringify(call).includes(ask), JSON.stringify(call));
        assert.equal(slack.of("answer").length, 1);
      }
    }
  });

  it("retitles the checklist once, from the ask, in the stream's first append", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "Did the session-notes redesign ship?\nAsking for the Q3 recap.");
    await lookups(delivery, 3);
    await delivery.postAnswer("Here it is.");

    assert.deepEqual(headings(slack), ["Did the session-notes redesign ship? Asking for the Q3 recap."]);
    assert.equal(slack.checklist()[0]!.title, headings(slack)[0], "the heading costs no call of its own");
  });

  it("keeps the heading within Slack's 256-character cap", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "word ".repeat(200));
    await lookups(delivery, 1);
    await delivery.endProgress("complete");

    const [heading] = headings(slack);
    assert.ok(heading);
    assert.ok(heading.length <= 256, `${heading.length}`);
    assert.ok(heading.endsWith("…"));
  });

  it("titles a top-level DM's static plan from the ask when it settles, at no extra call", async () => {
    const slack = recordingSlack();
    const { replyTs: _thread, ...topLevel } = TARGET;
    const delivery = deliveryAdapter(slack.deps(true), topLevel);

    await delivery.beginProgress("Working on it", "Did it ship?");
    await delivery.endProgress("complete");

    assert.equal(headings(slack).length, 0);
    const [settled] = slack.of("update");
    assert.equal(settled?.text, "Did it ship?");
    assert.match(JSON.stringify(settled?.blocks), /Did it ship\?/);
  });

  it("sends no heading without an ask, and none without a stream", async () => {
    const noAsk = recordingSlack();
    const a = deliveryAdapter(noAsk.deps(true), TARGET);
    await a.beginProgress("Working on it");
    await a.endProgress("complete");
    assert.equal(headings(noAsk).length, 0);

    const off = recordingSlack();
    const b = deliveryAdapter(off.deps(false), TARGET);
    await b.beginProgress("Working on it", "Did it ship?");
    await b.endProgress("complete");
    assert.equal(headings(off).length, 0);
  });
});

describe("the checklist's Slack spend", () => {
  it("is the stream's start, one append per group of lookups and the stop that settles it, however many calls", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "Pull everything on the tutor import table");
    await lookups(delivery, 20);
    await delivery.endProgress("complete");

    assert.deepEqual(
      slack.calls.map((c) => c.kind),
      ["startStream", "tasks", "stopStream"],
    );
    assert.equal(headings(slack).length, 1);
  });

  it("spends nothing on a turn that looks nothing up", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it", "Thanks!");
    await delivery.postAnswer("Any time.");

    assert.deepEqual(slack.calls.map((c) => c.kind), ["answer"]);
  });
});
