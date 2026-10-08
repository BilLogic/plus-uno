// The checklist's steps, seen from Slack: the working status names the step
// in progress, consecutive lookups of one kind share a step, and a routing
// choice the code made (which repo, which Notion database) is a step of its
// own.
//
// Driven on the recording Slack client, like `tests/checklist-cap-heading.test.ts`,
// whose event shapes this file follows.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type PlanTask, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { finishedProgress, type ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";
import { CHANNEL, CONVERSATION, harness, request } from "./helpers/turn-harness";
import { runTurn } from "../src/turn/index";

const TARGET: SlackDeliveryTarget = {
  channel: "C123",
  replyTs: "100.1",
  userMsgTs: "100.1",
  userId: "U1",
  team: "T1",
};

interface Call {
  seq: number;
  name: string;
  args?: Record<string, unknown>;
  /** The raw result the tool returns. Default: an empty success. */
  result?: string;
  error?: string;
}

const base = (c: Call) => ({ seq: c.seq, name: c.name, args: c.args ?? {} });
const announced = (c: Call): ToolProgressEvent => ({ ...base(c), phase: "announced" });
const started = (c: Call): ToolProgressEvent => ({ ...base(c), phase: "started" });
const finished = (c: Call): ToolProgressEvent =>
  finishedProgress(
    base(c),
    c.result ?? (c.error ? JSON.stringify({ ok: false, error: c.error }) : JSON.stringify({ ok: true })),
    c.error,
  );

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** One reply's batch, the way the loop reports it: every call announced, then
 *  each run in turn, the next starting as the last finishes, a tool run apart. */
async function batch(delivery: ReturnType<typeof deliveryAdapter>, calls: readonly Call[]): Promise<void> {
  for (const c of calls) delivery.toolProgress(announced(c));
  delivery.toolProgress(started(calls[0]!));
  await tick();
  for (const [i, c] of calls.entries()) {
    delivery.toolProgress(finished(c));
    if (calls[i + 1]) delivery.toolProgress(started(calls[i + 1]!));
    await tick();
  }
}

/** Every card as Slack last saw it, in the order Slack first saw it, with the
 *  text fields as Slack shows them (each sent once). */
function board(slack: RecordingSlack): PlanTask[] {
  const out = new Map<string, PlanTask>();
  for (const call of slack.of("tasks")) {
    for (const t of call.tasks) out.set(t.id, { ...out.get(t.id), ...t } as PlanTask);
  }
  return [...out.values()].filter((t) => t.id !== "understand");
}

/** Run a turn's progress through to the answer and the settle. */
async function settle(delivery: ReturnType<typeof deliveryAdapter>): Promise<void> {
  await delivery.postAnswer("Here it is.");
  await delivery.clearWorking("idle");
}

describe("the working status", () => {
  it("names the step in progress, in order, and every line lands before the settle", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.setWorking({ status: "is working on that…" });
    await delivery.beginProgress("Working on it");
    await batch(delivery, [
      { seq: 1, name: "roadmap_query", args: { person: "Meryem" } },
      { seq: 2, name: "search_blueprint", args: { query: "call-off" } },
    ]);
    await settle(delivery);

    assert.deepEqual(
      slack.of("statusLine").map((c) => c.text),
      ["is checking the Roadmap board…", "is searching the blueprint…"],
    );
    for (const line of slack.of("statusLine")) assert.equal(line.threadTs, "100.1");
    const order = slack.calls.map((c) => c.kind);
    const settleAt = order.lastIndexOf("status");
    assert.ok(order.lastIndexOf("statusLine") < settleAt, "no status line after the settle");
  });

  it("goes out after the card it names is in progress", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await batch(delivery, [{ seq: 1, name: "notion_search", args: { query: "a" } }]);

    const firstLine = slack.calls.findIndex((c) => c.kind === "statusLine");
    const running = slack.calls.findIndex(
      (c) => c.kind === "tasks" && c.tasks.some((t) => t.id === "tool-1" && t.status === "in_progress"),
    );
    assert.ok(running >= 0 && running < firstLine);
    await settle(delivery);
  });

  it("stops naming steps once the turn settles, even with a checklist still open", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.setWorking({ status: "is working on that…" });
    await delivery.beginProgress("Working on it");
    delivery.toolProgress(announced({ seq: 1, name: "notion_search" }));
    delivery.toolProgress(started({ seq: 1, name: "notion_search" }));
    // The turn died before its answer: the settle comes straight away.
    await delivery.clearWorking("idle");
    await tick();

    const order = slack.calls.map((c) => c.kind);
    assert.ok(order.lastIndexOf("statusLine") < order.lastIndexOf("status"));
    await delivery.endProgress("error");
  });

  it("sends nothing without a thread, and nothing without a checklist", async () => {
    const top = recordingSlack();
    const { replyTs: _thread, ...topLevel } = TARGET;
    const a = deliveryAdapter(top.deps(true), topLevel);
    await a.beginProgress("Working on it");
    await batch(a, [{ seq: 1, name: "notion_search" }]);
    await a.endProgress("complete");
    assert.equal(top.of("statusLine").length, 0);

    const off = recordingSlack();
    const b = deliveryAdapter(off.deps(false), TARGET);
    await b.beginProgress("Working on it");
    await batch(b, [{ seq: 1, name: "notion_search" }]);
    await settle(b);
    assert.equal(off.of("statusLine").length, 0);
  });
});

describe("consecutive lookups", () => {
  it("share one step, which says what each searched and what came of them all", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);
    const rows = (n: number) =>
      JSON.stringify({
        ok: true,
        rows: Array.from({ length: n }, (_, i) => ({ name: `Row ${n}-${i}`, url: `https://plus-uno.netlify.app/blueprint/${n}-${i}` })),
      });

    await delivery.beginProgress("Working on it");
    await batch(delivery, [
      { seq: 1, name: "search_blueprint", args: { query: "call-off" }, result: rows(2) },
      { seq: 2, name: "search_blueprint", args: { query: "fill-in" }, result: rows(0) },
      { seq: 3, name: "search_blueprint", args: { query: "reconfirm" }, result: rows(1) },
    ]);

    const cards = board(slack);
    assert.equal(cards.length, 1);
    const [step] = cards;
    assert.equal(step!.title, "Searching the blueprint");
    assert.equal(step!.status, "complete");
    assert.equal(step!.details, "call-off · fill-in · reconfirm");
    assert.equal(step!.output, "3 lookups: 2 matches · no matches · 1 match");
    assert.deepEqual(
      step!.sources?.map((s) => s.text),
      ["Row 2-0", "Row 2-1", "Row 1-0"],
    );
    // One step, so the status names it once.
    assert.deepEqual(slack.of("statusLine").map((c) => c.text), ["is searching the blueprint…"]);
    await settle(delivery);
  });

  it("stays in progress until the last of them lands, and ends in error when one failed", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    const calls: Call[] = [
      { seq: 1, name: "notion_search", args: { query: "a" } },
      { seq: 2, name: "notion_search", args: { query: "b" }, error: "Notion said no" },
    ];
    for (const c of calls) delivery.toolProgress(announced(c));
    delivery.toolProgress(started(calls[0]!));
    delivery.toolProgress(finished(calls[0]!));
    delivery.toolProgress(started(calls[1]!));
    await tick();
    assert.equal(board(slack)[0]!.status, "in_progress");
    delivery.toolProgress(finished(calls[1]!));
    await tick();

    const [step] = board(slack);
    assert.equal(step!.status, "error");
    assert.match(step!.output ?? "", /1 failed/);
    await settle(delivery);
  });

  it("do not group across a different lookup, or across replies", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await batch(delivery, [
      { seq: 1, name: "notion_search", args: { query: "a" } },
      { seq: 2, name: "search_blueprint", args: { query: "b" } },
      { seq: 3, name: "notion_search", args: { query: "c" } },
    ]);
    // The next reply searches Notion again: a new step, not the old one reopened.
    await batch(delivery, [{ seq: 4, name: "notion_search", args: { query: "d" } }]);

    assert.deepEqual(
      board(slack).map((c) => `${c.title}: ${c.details}`),
      ["Searching Notion: a", "Searching the blueprint: b", "Searching Notion: c", "Searching Notion: d"],
    );
    await settle(delivery);
  });
});

describe("routing decisions", () => {
  it("show which repo a GitHub read went to, once, before the reads it routed", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await batch(delivery, [
      { seq: 1, name: "github_read", args: { path: "README.md", repo: "BilLogic/plus-uno-blueprint" } },
      { seq: 2, name: "github_read", args: { path: "schema.sql", repo: "BilLogic/plus-uno-blueprint" } },
    ]);
    // A later reply reads the same repo: no second decision.
    await batch(delivery, [{ seq: 3, name: "github_read", args: { path: "a.md", repo: "BilLogic/plus-uno-blueprint" } }]);
    // And then the default repo: a new decision.
    await batch(delivery, [{ seq: 4, name: "github_intake_search", args: { keywords: "stuck status" } }]);

    assert.deepEqual(
      board(slack).map((c) => `${c.status} ${c.title}`),
      [
        "complete Chose the plus-uno-blueprint repo",
        "complete Reading GitHub",
        "complete Reading GitHub",
        "complete Chose the default repo",
        "complete Checking open intakes on GitHub",
      ],
    );
    // A decision is a step, never the working status.
    assert.ok(slack.of("statusLine").every((c) => !/Chose/.test(c.text)));
    await settle(delivery);
  });

  it("show which Notion database a search went to, and none for a workspace-wide search", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await batch(delivery, [{ seq: 1, name: "notion_search", args: { query: "tutor matching", scope: "decisions" } }]);
    await batch(delivery, [{ seq: 2, name: "notion_search", args: { query: "anything", scope: "any" } }]);

    assert.deepEqual(
      board(slack).map((c) => c.title),
      ["Chose the Decisions database", "Searching Notion", "Searching Notion"],
    );
    await settle(delivery);
  });

  it("count against the card cap and are dropped, not folded, when it is full", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);
    const names = ["notion_search", "search_blueprint", "slack_search", "roadmap_query"];

    await delivery.beginProgress("Working on it");
    // Eight different lookups in a row fill the cap; none of them groups.
    await batch(
      delivery,
      Array.from({ length: 8 }, (_, i) => ({ seq: i + 1, name: names[i % names.length]!, args: { query: `q${i}` } })),
    );
    await batch(delivery, [{ seq: 9, name: "github_read", args: { path: "a.md", repo: "BilLogic/plus-uno" } }]);

    const cards = board(slack);
    assert.equal(cards.length, 9);
    assert.ok(!cards.some((c) => /Chose/.test(c.title)));
    assert.equal(cards.at(-1)!.title, "…and 1 more");
    await settle(delivery);
  });
});

describe("a turn's steps, end to end", () => {
  it("names each step on the indicator as the turn reaches it, groups its repeats, and settles last", async () => {
    const h = harness({
      replies: [
        {
          text: "Checking the board, then the blueprint…",
          toolCalls: [
            { name: "roadmap_query", args: { person: "Meryem" } },
            { name: "search_blueprint", args: { query: "call-off" } },
            { name: "search_blueprint", args: { query: "fill-in" } },
          ],
        },
        { text: "A call-off opens the slot a fill-in claims." },
      ],
      toolDelayMs: 5,
    });
    const slack = recordingSlack();
    const target: SlackDeliveryTarget = {
      channel: CHANNEL,
      replyTs: CONVERSATION,
      userMsgTs: CONVERSATION,
      userId: "U1",
      team: "T1",
    };
    await runTurn(request(), { ...h.deps, delivery: deliveryAdapter(slack.deps(true), target) });

    assert.deepEqual(
      board(slack).map((c) => `${c.status} ${c.title}`),
      ["complete Checking the Roadmap board", "complete Searching the blueprint"],
    );
    assert.deepEqual(
      slack.of("statusLine").map((c) => c.text),
      ["is checking the Roadmap board…", "is searching the blueprint…"],
    );
    assert.equal(slack.calls.at(-1)?.kind, "status", "the settle is the last thing Slack is told");
    assert.equal(slack.of("status").at(-1)?.status, "active");
  });
});
