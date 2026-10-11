// The checklist inside the turn's fifty calls, on a replay of the turn that
// showed it starving lookups (Bill's DM, 2026-10-11, "recent app release →
// blueprint documentation?"):
//
//   tools=[notion_search,roadmap_query,notion_search,roadmap_query,source_read,
//          search_blueprint ×4]
//   [budget] 41/50 … slack.com:21 api.notion.com:9 aiplatform:8 supabase:3
//
// Twenty-one of those calls were Slack's, most of them the checklist and the
// working status, so the fourth blueprint search met the lookup ceiling and
// was refused; the refused card ended in error, and Slack titled the plan
// "Something went wrong" above the answer.
//
// The meter here counts what that turn counted: every Slack call the adapter
// makes, a round-trip per model reply, and each lookup's own reads at the
// rates the log shows. Driven through the real turn and loop, on the
// recording Slack client.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { LOOKUP_CEILING } from "../src/agent/loop-policy";
import type { LoopBudget } from "../src/agent/loop";
import { runTurn } from "../src/turn/index";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";
import { CHANNEL, CONVERSATION, harness, request } from "./helpers/turn-harness";

const TARGET: SlackDeliveryTarget = {
  channel: CHANNEL,
  replyTs: CONVERSATION,
  userMsgTs: CONVERSATION,
  userId: "U1",
  team: "T1",
};

/** What each lookup read, by the log's hosts: a Notion search or board query
 *  two Notion pages, a link one, a blueprint search one Supabase call and one
 *  embedding. */
const READS: Record<string, number> = { notion_search: 2, roadmap_query: 2, source_read: 1, search_blueprint: 2 };

/** Slack calls the turn makes outside the adapter before its checklist: the
 *  thread's history and the like. */
const BEFORE_CHECKLIST = 4;

/** The reference turn's replies: its tools, in its order, grouped as the
 *  model asked for them. */
const REPLIES = [
  {
    text: "Checking the release notes and the board.",
    toolCalls: [
      { name: "notion_search", args: { query: "release 12.0" } },
      { name: "roadmap_query", args: { status: "Deployed" } },
    ],
  },
  {
    text: "Narrowing to what shipped.",
    toolCalls: [
      { name: "notion_search", args: { query: "session controls" } },
      { name: "roadmap_query", args: { title: "Session" } },
    ],
  },
  { text: "Reading the release card.", toolCalls: [{ name: "source_read", args: { url: "https://www.notion.so/abc" } }] },
  {
    text: "Checking the blueprint.",
    toolCalls: [
      { name: "search_blueprint", args: { query: "fill-in request" } },
      { name: "search_blueprint", args: { query: "Manage Session" } },
      { name: "search_blueprint", args: { query: "tutors@tutors.plus" } },
      { name: "search_blueprint", args: { query: "reflection notes" } },
    ],
  },
  { text: "Four places in the blueprint need the release: fill-in requests, session controls, notes and escalations." },
];

/** Each reply's first call: where that reply's model round-trip was spent. */
const FIRSTS = new Set(REPLIES.flatMap((r) => (r.toolCalls?.[0] ? [JSON.stringify(r.toolCalls[0].args)] : [])));

/** The reference turn, replayed. `head` is spend the turn starts with, to
 *  bring the ceiling nearer. */
async function replay(head = 0): Promise<{ slack: RecordingSlack; ran: string[]; usedAt: number[] }> {
  const slack = recordingSlack();
  const ran: string[] = [];
  /** What the meter read as each lookup began. */
  const usedAt: number[] = [];
  let spent = head + BEFORE_CHECKLIST;
  const budget: LoopBudget = {
    used: () => spent + slack.calls.length,
    trips: () => 0,
    withLookupLimit: (_limit, fn) => fn(),
    isBudgetError: () => false,
    breakdown: () => "test",
  };
  const h = harness({
    replies: REPLIES,
    toolDelayMs: 1,
    budget,
    toolResultFor: (name, args) => {
      usedAt.push(budget.used());
      ran.push(name);
      spent += (READS[name] ?? 1) + (FIRSTS.has(JSON.stringify(args)) ? 1 : 0);
      return JSON.stringify({ ok: true, rows: [] });
    },
  });
  await runTurn(request({ text: "would the recent release change the blueprint documentation?" }), {
    ...h.deps,
    delivery: deliveryAdapter(slack.deps(true), TARGET),
  });
  return { slack, ran, usedAt };
}

const checklistCalls = (calls: RecordingSlack["calls"]) =>
  calls.filter((c) => c.kind === "startStream" || c.kind === "tasks" || c.kind === "stopStream");

describe("the checklist on the reference turn", () => {
  it("spends at most six Slack calls while the lookups run", async () => {
    const { slack } = await replay();
    // Everything up to the settle: the stream's start and one append per
    // group of lookups. The settle's append and the stop are delivery's,
    // spent from the reserve as the answer goes out.
    const settleAt = slack.calls.findIndex((c) => c.kind === "stopStream") - 1;
    const whileLooking = checklistCalls(slack.calls.slice(0, settleAt));
    assert.ok(whileLooking.length <= 6, `${whileLooking.length} checklist calls while the lookups ran`);
    assert.equal(whileLooking.length, 5, "the start and one append for each of the four groups");
    assert.equal(checklistCalls(slack.calls).length, 7, "and the settle and stop");
    const kinds = slack.calls.map((c) => c.kind);
    assert.ok(kinds.indexOf("stopStream") < kinds.indexOf("answer"), "the stream stops before the answer posts");
  });

  it("runs all four blueprint searches under the lookup ceiling", async () => {
    const { ran } = await replay();
    assert.equal(ran.filter((n) => n === "search_blueprint").length, 4);
  });

  it("ends complete above the answer, every card of it, with nothing ever in error", async () => {
    const { slack } = await replay();
    const sent = slack.of("tasks").flatMap((c) => c.tasks);
    assert.ok(sent.every((t) => t.status !== "error"), "Slack titles a plan with an error card 'Something went wrong'");
    const final = new Map(sent.map((t) => [t.id, t.status]));
    assert.ok([...final.values()].every((s) => s === "complete"), JSON.stringify([...final]));
  });

  it("shows a lookup the ceiling refused as skipped, and still ends complete", async () => {
    // A turn that starts nearer the ceiling, so the meter reads the ceiling
    // just as the fourth search would begin: it is refused.
    const fourth = (await replay()).usedAt.at(-1)!;
    const { slack, ran } = await replay(LOOKUP_CEILING - fourth);
    assert.equal(ran.filter((n) => n === "search_blueprint").length, 3, "the case reaches the ceiling at the fourth search");
    const sent = slack.of("tasks").flatMap((c) => c.tasks);
    assert.ok(sent.every((t) => t.status !== "error"));
    const blueprint = sent.filter((t) => t.title === "Searching the blueprint" && t.output).at(-1);
    assert.match(blueprint?.output ?? "", /1 skipped/);
  });
});
