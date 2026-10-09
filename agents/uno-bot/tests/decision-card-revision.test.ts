// Needs changes on one item of a decision report, driven end to end: Review's
// Submit sends the item back, the revision turn redrafts it, and the redraft
// takes that item's card in the report's message — the same number, a new
// proposal behind it — rather than posting a card of its own. The report here
// has no revise step of its own, which is the point: any report on the shared
// decision card gets this from the general path.
//
// The review door, the real Turn on the turn harness, and the in-memory
// store between them; the revision is wired as `turn/env-deps.ts` wires it,
// with the report message's edit recorded instead of sent.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { recordingDelivery, runTurn } from "../src/turn/index";
import { createInMemoryThreadState, type PendingProposal, type ReportItem, type ThreadState } from "../src/thread-state/index";
import { NEEDS_CHANGES_LEAD, runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import { decisionReport, itemProposal, itemReviser, reportRecord, type ReportMessage } from "../src/slack/decision-cards";
import { CHANNEL, CONVERSATION, REF, harness as turnHarness, request } from "./helpers/turn-harness";
import { recordingViews } from "./helpers/recording-slack";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

const MSG = "1700000000.000300";
const TTL = 72 * 60 * 60 * 1000;
const NOW = Number(MSG) * 1000 + 10 * 60_000;
const BILL = "U1";

const items: ReportItem[] = [1, 2, 3].map((n) => ({
  id: `c${n}`,
  title: `Page ${n}`,
  subtitle: "Bill · card comment",
  body: `Page says ${n} · decision says ${n + 1}.`,
  open: { url: `https://www.notion.so/page${n}` },
  done: `Line ${n} now reads ${n + 1}.`,
}));

function itemStaged(id: string, n: number): PendingProposal {
  const op = { toolName: "notion_update", input: { page_url: `https://www.notion.so/page${n}`, replace: [{ block_id: `b${n}`, content: `New ${n}` }] } };
  return {
    operations: [op],
    toolName: op.toolName,
    input: op.input,
    channel: CHANNEL,
    threadTs: CONVERSATION,
    replyTs: CONVERSATION,
    ...itemProposal(MSG, id),
    proposalText: `Page ${n}: the line now reads New ${n}.`,
    requesterUserId: "",
    confirmers: [BILL],
    ttlMs: TTL,
  };
}

/** A report of three items in the thread, each staged — the last one newest. */
async function staged(): Promise<ThreadState> {
  const store = createInMemoryThreadState({ now: () => NOW });
  await store.putReport(reportRecord(CHANNEL, MSG, decisionReport(items, "Three pages still state the old way."), TTL));
  for (const [i, it] of items.entries()) await store.putProposal(itemStaged(it.id, i + 1));
  return store;
}

type Card = { title: { text: string }; subtitle?: { text: string }; body: { text: string }; actions: Array<{ text: { text: string }; action_id?: string }> };
const cards = (blocks: unknown[]) => (blocks[1] as { elements: Card[] }).elements;

/** Needs changes on one item from its Review, and the revision turn it queues
 *  — handed the thread's card as the Slack door reads it. */
async function sendBack(store: ThreadState, id: string, redraft: { text: string; content: string }) {
  const edits: Array<{ ts: string; message: ReportMessage }> = [];
  const h = turnHarness({
    threadState: store,
    now: () => NOW,
    replies: [{ text: redraft.text, toolCalls: [{ name: "notion_update", args: { page_url: "https://www.notion.so/page2", replace: [{ block_id: "b2", content: redraft.content }] } }] }],
  });
  h.deps.reviseItem = itemReviser(store, async (ts, message) => void edits.push({ ts, message }));
  const turns: Array<Awaited<ReturnType<typeof runTurn>>> = [];
  const deps: ReviewDoorDeps = {
    threadState: store,
    views: recordingViews({ alreadyOpen: ["V1"] }).client,
    delivery: () => recordingDelivery(),
    applyVerdict: async () => [],
    updateCard: async (_channel, ts, message) => void edits.push({ ts, message }),
    restage: async () => {},
    revise: async ({ note, userId }) => {
      const pending = await store.getProposalByThread(REF);
      turns.push(await runTurn(request({ userId, text: `${NEEDS_CHANGES_LEAD}${note}`, pending }), h.deps));
    },
    now: () => NOW,
  };
  await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: itemProposal(MSG, id).proposalTs, userId: BILL, decision: "revise", note: "the cap is 600" }, deps);
  return { edits, turns, delivery: h.delivery };
}

describe("Needs changes on one item of a report", () => {
  it("swaps the redraft into that item's card in the report message, same number, new proposal", async () => {
    const store = await staged();
    const { edits, turns, delivery } = await sendBack(store, "c2", { text: "Page 2 now says the cap is 600.", content: "The cap is 600" });

    assert.equal(turns[0]!.disposition, "staged");
    assert.equal(
      delivery.calls.filter((c) => c.kind === "proposal").length,
      0,
      "no card of its own: the redraft is in the report",
    );

    const last = edits.at(-1)!;
    assert.equal(last.ts, MSG, "the edit goes to the report's message");
    assert.equal(messageBlocksRefusal(last.message.blocks), null);
    const shown = cards(last.message.blocks);
    assert.equal(shown.length, 3, "same message, same place");
    assert.equal(shown[1]!.title.text, "Page 2");
    assert.equal(shown[1]!.subtitle!.text, "Bill · card comment", "open again, not Changes asked");
    assert.equal(shown[1]!.body.text, "Page 2 now says the cap is 600.");
    assert.equal(shown[1]!.actions[0]!.action_id, "uno_decision_review:c2~1");
    assert.equal(shown[0]!.body.text, "Page says 1 · decision says 2.", "the other items are untouched");

    const revised = await store.getProposalByTs(itemProposal(MSG, "c2~1").proposalTs);
    assert.equal(revised.state, "found", "the redraft is the item's new proposal");
    if (revised.state === "found") {
      assert.deepEqual(revised.proposal.item, { messageTs: MSG, id: "c2~1" });
      assert.deepEqual(revised.proposal.operations![0]!.input, { page_url: "https://www.notion.so/page2", replace: [{ block_id: "b2", content: "The cap is 600" }] });
      assert.deepEqual(revised.proposal.confirmers, [BILL], "held to the item's terms");
    }
    assert.notEqual((await store.getProposalByTs(itemProposal(MSG, "c2").proposalTs)).state, "found", "the old draft no longer runs");
    assert.equal((await store.getProposalByTs(itemProposal(MSG, "c3").proposalTs)).state, "found", "the newest item was not the one revised");
  });
});
