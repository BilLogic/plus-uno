// The checklist in a top-level Messages-tab DM, where there is no thread.
//
// Slack refuses `chat.startStream` without a `thread_ts` outside Slack Code
// session channels (`invalid_thread_ts`), so the live checklist cannot open
// there. What a person gets instead is the same checklist, not live: a static
// `plan` block of `task_card`s posted when the work starts, and rewritten once
// with every card's final state when it ends. No update per lookup.
//
// Driven on the recording Slack client with no reply ts, so what is asserted is
// the blocks Slack was handed, not which function ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
import { planBlock } from "../src/slack/plan-block";
import { recordingSlack } from "./helpers/recording-slack";

/** A top-level DM: no thread to reply under. */
const DM: SlackDeliveryTarget = { channel: "D123", userMsgTs: "100.1", userId: "U1", team: "T1" };

const NAMES: Record<number, string> = { 1: "notion_search", 2: "slack_search" };
const at = (seq: number, phase: "announced" | "started"): ToolProgressEvent => ({
  seq,
  name: NAMES[seq] ?? "notion_search",
  args: {},
  phase,
});
const done = (seq: number, error?: string): ToolProgressEvent => ({
  seq,
  name: NAMES[seq] ?? "notion_search",
  args: {},
  phase: "finished",
  result: "{}",
  ...(error ? { error } : {}),
});

interface Card {
  type: string;
  task_id: string;
  title: string;
  status: string;
  output?: unknown;
}
interface Plan {
  type: string;
  title: string;
  tasks: Card[];
}

/** The one plan block a set of blocks carries. */
function planOf(blocks: unknown[] | undefined): Plan {
  const plans = (blocks ?? []).filter((b): b is Plan => (b as Plan).type === "plan");
  assert.equal(plans.length, 1, "exactly one plan block");
  return plans[0]!;
}

const statuses = (plan: Plan): string[] => plan.tasks.map((t) => `${t.task_id}:${t.status}`);

describe("static checklist in a top-level DM", () => {
  it("posts a plan block at begin, rewrites it once at settle, and answers beneath it — no stream", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), DM);

    await delivery.beginProgress("Working on it");
    for (const e of [at(1, "announced"), at(2, "announced"), at(1, "started")]) delivery.toolProgress(e);
    for (const e of [done(1), at(2, "started"), done(2, "Notion said no\nstack")]) delivery.toolProgress(e);
    await delivery.postAnswer("Here it is.");

    assert.deepEqual(
      slack.calls.map((c) => c.kind),
      ["message", "update", "answer"],
      "one post, one update, then the answer — and nothing else",
    );
    assert.equal(slack.of("startStream").length + slack.of("tasks").length + slack.of("stopStream").length, 0);

    const [post] = slack.of("message");
    assert.equal(post!.threadTs, undefined, "posted at channel level, where the DM is");
    const opened = planOf(post!.blockList);
    assert.equal(opened.title, "Working on it");
    assert.deepEqual(statuses(opened), ["understand:in_progress"]);
    assert.equal(opened.tasks[0]!.type, "task_card");

    const [update] = slack.of("update");
    assert.equal(update!.ts, "posted-1", "the update rewrites the message the plan was posted as");
    const settled = planOf(update!.blocks);
    assert.deepEqual(statuses(settled), ["understand:complete", "tool-1:complete", "tool-2:error"]);
    // The block form's `output` is rich text, not a string.
    assert.deepEqual(settled.tasks[2]!.output, {
      type: "rich_text",
      elements: [{ type: "rich_text_section", elements: [{ type: "text", text: "Notion said no" }] }],
    });

    const [answer] = slack.of("answer");
    assert.equal(answer!.openStreamTs, undefined, "the answer is its own message, not a stream close");
  });

  it("settles every open card to error when the turn ends on error", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), DM);

    await delivery.beginProgress("Working on it");
    for (const e of [at(1, "announced"), at(2, "announced"), at(1, "started")]) delivery.toolProgress(e);
    await delivery.endProgress("error");

    assert.deepEqual(slack.calls.map((c) => c.kind), ["message", "update"]);
    assert.deepEqual(statuses(planOf(slack.of("update")[0]!.blocks)), [
      "understand:complete",
      "tool-1:error",
      "tool-2:error",
    ]);
  });

  it("never hands Slack more than its 50-task limit", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), DM);

    await delivery.beginProgress("Working on it");
    for (let seq = 1; seq <= 60; seq++) {
      delivery.toolProgress(at(seq, "announced"));
      delivery.toolProgress(at(seq, "started"));
      delivery.toolProgress(done(seq));
    }
    await delivery.endProgress("complete");

    assert.ok(planOf(slack.of("update")[0]!.blocks).tasks.length <= 50);
  });

  it("with the plan switch off, posts nothing for progress", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), DM);

    await delivery.beginProgress("Working on it");
    for (const e of [at(1, "announced"), at(1, "started"), done(1)]) delivery.toolProgress(e);
    await delivery.endProgress("complete");

    assert.deepEqual(slack.calls, []);
  });
});

describe("planBlock", () => {
  it("spells a card's icon as Slack's icon object, never a bare URL", () => {
    const block = planBlock("Checklist", [
      { id: "tool-1", title: "Searching GitHub", status: "complete", icon: "https://example.test/github.png" },
      { id: "tool-2", title: "Searching the blueprint", status: "complete" },
    ]) as { tasks: Array<Record<string, unknown>> };
    assert.deepEqual(block.tasks[0]!.icon, { type: "icon", name: "https://example.test/github.png" });
    assert.equal("icon" in block.tasks[1]!, false);
  });
});
