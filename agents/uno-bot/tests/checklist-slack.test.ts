// The checklist, seen from Slack: which task cards the adapter hands Slack, in
// which calls, with which status.
//
// Driven on the recording Slack client, so what is asserted is what Slack was
// handed — never which function ran. The events fed in are the ones the loop
// emits, in the order and grouping it emits them: a reply's lookups are all
// announced and the first started in one go, and one lookup finishing is
// followed at once by the next starting, with a tool run (a tick) between.
// `tests/checklist-turn.test.ts` pins that the turn really emits them so.
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

const NAMES: Record<number, string> = { 1: "roadmap_query", 2: "notion_search", 3: "search_blueprint" };

const announced = (seq: number): ToolProgressEvent => ({ seq, name: NAMES[seq]!, args: {}, phase: "announced" });
const started = (seq: number): ToolProgressEvent => ({ seq, name: NAMES[seq]!, args: {}, phase: "started" });
const finished = (seq: number, error?: string): ToolProgressEvent =>
  finishedProgress(
    { seq, name: NAMES[seq]!, args: {} },
    error ? JSON.stringify({ ok: false, error }) : JSON.stringify({ ok: true, rows: [] }),
    error,
  );
const refused = (seq: number, reason: string): ToolProgressEvent => ({
  seq,
  name: NAMES[seq]!,
  args: {},
  phase: "refused",
  reason,
});

/** Let a tool "run": everything queued so far reaches Slack. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Each append Slack was handed, as `id:status` per card. */
function appends(slack: RecordingSlack): string[][] {
  return slack.of("tasks").map((call) => call.tasks.map((t) => `${t.id}:${t.status}`));
}

/** Run three lookups the way the loop reports them. */
async function threeLookups(delivery: ReturnType<typeof deliveryAdapter>): Promise<void> {
  for (const e of [announced(1), announced(2), announced(3), started(1)]) delivery.toolProgress(e);
  await tick();
  for (const e of [finished(1), started(2)]) delivery.toolProgress(e);
  await tick();
  for (const e of [finished(2), started(3)]) delivery.toolProgress(e);
  await tick();
  delivery.toolProgress(finished(3));
  await tick();
}

describe("the checklist", () => {
  it("opens each card in progress when its call starts, runs one at a time, and spends one append per transition", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await threeLookups(delivery);
    await delivery.postAnswer("Here it is.");

    assert.deepEqual(appends(slack), [
      ["understand:in_progress"],
      // The batch arrives as one call: the opening card closed and the first
      // card running. The two calls announced beside it have no card yet —
      // Slack refuses a `pending` one — and each appears when it starts.
      ["understand:complete", "tool-1:in_progress"],
      ["tool-1:complete", "tool-2:in_progress"],
      ["tool-2:complete", "tool-3:in_progress"],
      ["tool-3:complete"],
    ]);
    // No status Slack refuses ever leaves.
    for (const call of slack.of("tasks")) {
      assert.ok(call.tasks.every((t) => ["in_progress", "complete", "error"].includes(t.status)));
    }
    // Never two cards in progress in the same append.
    for (const call of slack.of("tasks")) {
      assert.ok(call.tasks.filter((t) => t.status === "in_progress").length <= 1);
    }
    // Titled from the tool table, in uno's words.
    const titles = new Map(slack.of("tasks").flatMap((c) => c.tasks.map((t) => [t.id, t.title] as const)));
    assert.equal(titles.get("tool-2"), "Searching Notion");
    assert.equal(titles.get("tool-3"), "Searching the blueprint");
    // The checklist's stream stops once, and the answer posts beneath it.
    assert.deepEqual(
      slack.calls.filter((c) => c.kind === "stopStream" || c.kind === "answer").map((c) => c.kind),
      ["stopStream", "answer"],
    );
  });

  it("settles a failed lookup as an error card with a short reason, and a refused one too", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    for (const e of [announced(1), announced(2), started(1)]) delivery.toolProgress(e);
    await tick();
    delivery.toolProgress(finished(1, `404 not found\n${"stack ".repeat(80)}`));
    delivery.toolProgress(refused(2, "no more lookups available this turn"));
    await tick();

    const last = slack.of("tasks").at(-1)!.tasks;
    const failed = last.find((t) => t.id === "tool-1")!;
    assert.equal(failed.status, "error");
    assert.equal(failed.output, "404 not found", "one line, not the whole error");
    const budget = last.find((t) => t.id === "tool-2")!;
    assert.equal(budget.status, "error");
    assert.equal(budget.output, "no more lookups available this turn");
  });

  it("settles every open card as an error when the turn dies", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    for (const e of [announced(1), announced(2), announced(3), started(1)]) delivery.toolProgress(e);
    await tick();
    await delivery.endProgress("error");

    // The running card settles with the turn; the two that never started
    // appear for the first time as not run.
    assert.deepEqual(appends(slack).at(-1), ["tool-1:error", "tool-2:error", "tool-3:error"]);
    assert.deepEqual(
      slack.of("tasks").at(-1)!.tasks.map((t) => t.output),
      [undefined, "Not run", "Not run"],
    );
    assert.equal(slack.calls.at(-1)!.kind, "stopStream");
  });

  it("settles a card whose lookup never ran as an error, never as complete", async () => {
    // A stopped turn answers with lookups still queued: the running card
    // settles with the turn, and a queued one says it was not run.
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    for (const e of [announced(1), announced(2), started(1)]) delivery.toolProgress(e);
    await tick();
    await delivery.postAnswer("Stopped.");

    const last = slack.of("tasks").at(-1)!.tasks;
    assert.deepEqual(last.map((t) => `${t.id}:${t.status}`), ["tool-1:complete", "tool-2:error"]);
    assert.equal(last.find((t) => t.id === "tool-2")!.output, "Not run");
    assert.equal(last.find((t) => t.id === "tool-1")!.output, undefined);
  });

  it("lands narration as the details of the card it precedes, never as a card of its own", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("Checking whether this shipped");
    await tick();
    assert.equal(slack.of("message").length, 0, "no ⏳ message beside the checklist");
    assert.equal(slack.of("tasks").length, 1, "and no card for the narration itself");

    await threeLookups(delivery);

    const cards = slack.of("tasks").flatMap((c) => c.tasks);
    assert.deepEqual(
      [...new Set(cards.filter((t) => t.details).map((t) => `${t.id}: ${t.details}`))],
      ["tool-1: Checking whether this shipped"],
    );
    // Sent once: Slack appends a re-sent `details` rather than replacing it, so
    // the card's closing update carries its status alone.
    assert.equal(cards.filter((t) => t.id === "tool-1" && t.details).length, 1);
    assert.equal("details" in cards.filter((t) => t.id === "tool-1").at(-1)!, false);
  });

  it("drops the backstop line while the checklist is live, and never glues it into a card", async () => {
    // The running card and the working signal already say the turn is alive;
    // "Still on it" under the next card would read as what that lookup is for.
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("Still on it — this one needs a longer dig.", "backstop");
    await threeLookups(delivery);
    await delivery.postAnswer("Here it is.");

    assert.equal(slack.of("message").length, 0, "no ⏳ message beside the checklist");
    const cards = slack.of("tasks").flatMap((c) => c.tasks);
    assert.ok(cards.every((t) => !t.details?.includes("Still on it")), "never a card's details");
  });

  it("with the plan switch off, posts the backstop line exactly as before", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("Still on it — this one needs a longer dig.", "backstop");
    await tick();

    assert.deepEqual(slack.calls, [
      {
        kind: "message",
        channel: "C123",
        threadTs: "100.1",
        text: ":hourglass_flowing_sand: Still on it — this one needs a longer dig.",
        blocks: false,
      },
    ]);
  });

  it("with the plan switch off, shows no cards and posts exactly today's narration", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.postInterim("Checking the board");
    await threeLookups(delivery);
    await delivery.endProgress("complete");

    assert.deepEqual(slack.calls, [
      { kind: "message", channel: "C123", threadTs: "100.1", text: ":hourglass_flowing_sand: Checking the board", blocks: false },
    ]);
  });

  it("shows nothing for a call the tool table gives no card", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    delivery.toolProgress({ seq: 1, name: "slack_react", args: {}, phase: "announced" });
    delivery.toolProgress({ seq: 2, name: "notion_create", args: {}, phase: "announced" });
    await tick();

    assert.deepEqual(appends(slack), [["understand:in_progress"]]);
  });

  it("sends a card's icon on every update of it, and the opening card none", async () => {
    // An icon is not text: Slack replaces it on an update rather than
    // appending to it, so it rides each update the way the status does.
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);

    await delivery.beginProgress("Working on it");
    await threeLookups(delivery);
    await delivery.endProgress("complete");

    const sent = slack.of("tasks").flatMap((call) => call.tasks);
    for (const t of sent.filter((t) => t.id === "tool-2")) assert.deepEqual(t.icon, { type: "icon", name: "book" });
    assert.equal(sent.filter((t) => t.id === "tool-2").length, 2, "opened, then settled");
    assert.ok(sent.filter((t) => t.id === "understand").every((t) => !("icon" in t)));
  });
});

describe("a card's text", () => {
  it("goes to Slack once — later updates of the card carry its status, not its details again", async () => {
    // Slack appends a re-sent `details` to the card's existing details rather
    // than replacing it: live, a card read "onboardingonboarding".
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);
    const args = { title: "onboarding" };

    await delivery.beginProgress("Working on it");
    delivery.toolProgress({ seq: 1, name: "roadmap_query", args, phase: "announced" });
    delivery.toolProgress({ seq: 1, name: "roadmap_query", args, phase: "started" });
    await tick();
    delivery.toolProgress(
      finishedProgress({ seq: 1, name: "roadmap_query", args }, JSON.stringify({ ok: true, rows: [] })),
    );
    await tick();
    await delivery.postAnswer("Here it is.");

    const updates = slack.of("tasks").flatMap((call) => call.tasks.filter((t) => t.id === "tool-1"));
    assert.ok(updates.length >= 2, "the card opens and closes");
    const withDetails = updates.filter((t) => t.details);
    assert.equal(withDetails.length, 1, `details sent ${withDetails.length} times`);
    assert.equal(updates.at(-1)!.status, "complete");
    assert.equal("details" in updates.at(-1)!, false, "the closing update carries no details");
  });
});
