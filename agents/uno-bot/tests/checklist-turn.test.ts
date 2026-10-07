// The checklist, seen from Turn: which tool-progress events a turn hands
// Delivery, and in what order.
//
// Driven on the shared Turn harness — the recording Delivery, the in-memory
// ThreadState and a fake ModelProvider behind the REAL agent loop — so what is
// asserted is what the turn asked Delivery to show, not which hook ran. How
// Slack renders those events is the adapter's business and is asserted on the
// recording Slack client (`tests/checklist-slack.test.ts`).
import { test } from "node:test";
import assert from "node:assert/strict";

import type { DeliveryCall, RecordingDelivery } from "../src/turn/index";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
import { MAX_PROGRESS_RESULT_CHARS } from "../src/agent/tool-progress";
import { LOOKUP_CEILING } from "../src/agent/loop-policy";
import { harness, request } from "./helpers/turn-harness";
import { runTurn } from "../src/turn/index";

/** Every tool-progress event the turn emitted, in order. */
function progressOf(delivery: RecordingDelivery): ToolProgressEvent[] {
  return delivery.calls
    .filter((c): c is Extract<DeliveryCall, { kind: "toolProgress" }> => c.kind === "toolProgress")
    .map((c) => c.event);
}

/** An event as `seq:name:phase`, so an order reads as one line. */
const step = (e: ToolProgressEvent): string => `${e.seq}:${e.name}:${e.phase}`;

test("a reply announcing three lookups shows three cards, then runs them one at a time", async () => {
  const h = harness({
    replies: [
      {
        text: "Checking the Roadmap board and the blueprint…",
        toolCalls: [
          { name: "roadmap_query", args: { person: "Meryem" } },
          { name: "notion_search", args: { query: "call-off" } },
          { name: "search_blueprint", args: { query: "fill-in" } },
        ],
      },
      { text: "A call-off opens the slot a fill-in claims." },
    ],
  });

  await runTurn(request(), h.deps);

  const events = progressOf(h.delivery);
  assert.deepEqual(events.map(step), [
    "1:roadmap_query:announced",
    "2:notion_search:announced",
    "3:search_blueprint:announced",
    "1:roadmap_query:started",
    "1:roadmap_query:finished",
    "2:notion_search:started",
    "2:notion_search:finished",
    "3:search_blueprint:started",
    "3:search_blueprint:finished",
  ]);
  // The arguments travel with every phase, so a card can say what it searched.
  assert.deepEqual(events[1]!.args, { query: "call-off" });
  // The narration lands BEFORE the cards it introduces, so it can become the
  // first card's details rather than trailing behind it.
  const kinds = h.delivery.calls.map((c) => c.kind);
  assert.ok(kinds.indexOf("interim") < kinds.indexOf("toolProgress"));
});

test("a later reply's calls continue the numbering, so no two cards share an id", async () => {
  const h = harness({
    replies: [
      { toolCalls: [{ name: "notion_search", args: { query: "a" } }] },
      { toolCalls: [{ name: "github_read", args: { path: "AGENTS.md" } }] },
      { text: "Done." },
    ],
  });

  await runTurn(request(), h.deps);

  assert.deepEqual(
    progressOf(h.delivery).map(step),
    [
      "1:notion_search:announced",
      "1:notion_search:started",
      "1:notion_search:finished",
      "2:github_read:announced",
      "2:github_read:started",
      "2:github_read:finished",
    ],
  );
});

test("a finished lookup carries its raw result, capped, and the tool's own error", async () => {
  const big = JSON.stringify({ ok: true, rows: ["x".repeat(MAX_PROGRESS_RESULT_CHARS * 2)] });
  const h = harness({
    replies: [
      {
        toolCalls: [
          { name: "notion_search", args: { query: "a" } },
          { name: "github_read", args: { path: "missing.md" } },
        ],
      },
      { text: "Done." },
    ],
    toolResultFor: (name) =>
      name === "github_read" ? JSON.stringify({ ok: false, error: "404 not found" }) : big,
  });

  await runTurn(request(), h.deps);

  const finished = progressOf(h.delivery).filter((e) => e.phase === "finished");
  assert.equal(finished.length, 2);
  const [search, read] = finished as Array<Extract<ToolProgressEvent, { phase: "finished" }>>;
  assert.ok(search!.result.length <= MAX_PROGRESS_RESULT_CHARS);
  assert.ok(search!.result.startsWith('{"ok":true'));
  assert.equal(search!.error, undefined);
  assert.equal(read!.error, "404 not found");
});

test("a lookup the budget refuses is reported refused, never left announced", async () => {
  // Room for the first model call and nothing after it: the reply's lookup
  // then meets a spent ceiling, the shape of a turn that read too much.
  let reads = 0;
  const h = harness({
    replies: [
      { toolCalls: [{ name: "notion_search", args: { query: "a" } }] },
      { text: "I could not check Notion this time." },
    ],
    budget: {
      used: () => (reads++ === 0 ? 0 : LOOKUP_CEILING),
      trips: () => 0,
      withLookupLimit: (_limit, fn) => fn(),
      isBudgetError: () => false,
      breakdown: () => "test",
    },
  });

  await runTurn(request(), h.deps);

  const events = progressOf(h.delivery);
  assert.deepEqual(events.map(step), ["1:notion_search:announced", "1:notion_search:refused"]);
  assert.equal(h.executed.length, 0, "the refused call never ran");
  const refused = events[1] as Extract<ToolProgressEvent, { phase: "refused" }>;
  assert.match(refused.reason, /no more lookups/);
});

test("gated writes and slack_react never become cards; the reads beside them do", async () => {
  const h = harness({
    replies: [
      {
        text: "Filing that now.",
        toolCalls: [
          { name: "slack_react", args: { name: "eyes" } },
          { name: "notion_search", args: { query: "intake" } },
          { name: "notion_create", args: { title: "Reflection redesign" } },
        ],
      },
    ],
  });

  await runTurn(request(), h.deps);

  assert.deepEqual(progressOf(h.delivery).map(step), [
    "2:notion_search:announced",
    "2:notion_search:started",
    "2:notion_search:finished",
  ]);
});
