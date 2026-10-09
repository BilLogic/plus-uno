// The shared decision card (interactive seam): Review on one item of a
// report opens that item's own proposal, its Submit decides it, and the card
// is edited in place to who decided — driven at the review door on the
// in-memory ThreadState, the recording Delivery and a views client that
// refuses what Slack refuses.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, type GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, type ReviewDoorDeps } from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { decisionReportBlocks, itemProposalKey, reviewKeyOf, type DecisionItem } from "../src/slack/decision-cards";
import { renderGateNote } from "../src/slack/gate-note";
import { recordingViews } from "./helpers/recording-slack";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

const CHANNEL = "C0DESIGN";
const MSG = "1790000000.000100";

const items: DecisionItem[] = [1, 2].map((n) => ({
  id: `c${n}`,
  title: `Page ${n}`,
  subtitle: "Bill · card comment",
  body: `Page says ${n} · decision says ${n + 1}.`,
  open: { url: `https://www.notion.so/page${n}` },
}));
const BLOCKS = decisionReportBlocks({ parent: "Two pages still state the old way.", items });

/** One item's proposal, staged under its own key. */
function itemProposal(id: string, n: number): PendingProposal {
  const op = { toolName: "notion_update", input: { page_url: `https://www.notion.so/page${n}`, replace: [{ block_id: `b${n}`, content: `New ${n}` }] } };
  return {
    operations: [op],
    toolName: op.toolName,
    input: op.input,
    channel: CHANNEL,
    threadTs: MSG,
    replyTs: MSG,
    userMsgTs: MSG,
    proposalTs: itemProposalKey(MSG, id),
    proposalText: `Page ${n}: the line now reads New ${n}.`,
    proposalBlocks: BLOCKS,
    requesterUserId: "",
    confirmers: ["U0BILL"],
    supersedeKey: `report:${id}`,
  };
}

async function staged(): Promise<ThreadState> {
  const store = createInMemoryThreadState();
  await store.putProposal(itemProposal("c1", 1));
  await store.putProposal(itemProposal("c2", 2));
  return store;
}

function harness(threadState: ThreadState) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const updates: Array<{ channel: string; ts: string; message: CardMessage }> = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (v) => void ran.push(v),
    updateCard: async (channel, ts, message) => void updates.push({ channel, ts, message }),
    restage: async () => {},
    revise: async () => {},
  };
  return { deps, views, ran, updates };
}

type Card = { subtitle?: { text: string }; actions: Array<{ text: { text: string } }> };
const cards = (blocks: unknown[]) => (blocks[1] as { elements: Card[] }).elements;

describe("Review on one item of a report", () => {
  it("turns a press on an item's Review into that item's own proposal", () => {
    assert.equal(reviewKeyOf("uno_decision_review:c2", MSG), itemProposalKey(MSG, "c2"));
    assert.equal(reviewKeyOf("uno_proposal_review", MSG), null, "a turn's card keeps its own Review");
  });

  it("opens the pop-up on that item's proposal and no other", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen({ triggerId: "T", channel: CHANNEL, messageTs: itemProposalKey(MSG, "c2"), userId: "U0BILL" }, deps);
    const draft = JSON.stringify(views.calls.at(-1)!.view);
    assert.match(draft, /New 2/);
    assert.doesNotMatch(draft, /New 1/);
  });

  it("decides from Submit: runs only that item, and edits only its card to who decided, Review to View", async () => {
    const store = await staged();
    const { deps, ran, updates } = harness(store);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: itemProposalKey(MSG, "c1"), userId: "U0BILL", decision: "confirm" }, deps);
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]!.execute?.operations, itemProposal("c1", 1).operations);
    assert.equal(updates.length, 1);
    assert.equal(updates[0]!.ts, itemProposalKey(MSG, "c1"), "the edit names the item, so it lands on its card");
    const [one, two] = cards(updates[0]!.message.blocks);
    assert.equal(one!.subtitle!.text, "Approved by <@U0BILL>");
    assert.deepEqual(one!.actions.map((a) => a.text.text), ["View", "Open"]);
    assert.equal(two!.subtitle!.text, "Bill · card comment");
    assert.deepEqual(two!.actions.map((a) => a.text.text), ["Review", "Open"]);
    assert.equal(messageBlocksRefusal(updates[0]!.message.blocks), null);
    // The other item is still waiting on its own decision.
    assert.equal((await store.getProposalByTs(itemProposalKey(MSG, "c2"))).state, "found");
  });

  it("says Rejected by on a rejected card", async () => {
    const { deps, ran, updates } = harness(await staged());
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: itemProposalKey(MSG, "c2"), userId: "U0BILL", decision: "cancel", note: "deliberate" }, deps);
    assert.equal(ran[0]!.execute, undefined, "a reject runs nothing");
    assert.equal(cards(updates[0]!.message.blocks)[1]!.subtitle!.text, "Rejected by <@U0BILL>");
  });

  it("is not decided by a typed ✅ or the model in its thread: only Review decides an item", async () => {
    const store = await staged();
    const typed = await resolveSignal({ kind: "typed", channel: CHANNEL, thread: MSG, text: "✅", userId: "U0BILL" }, { threadState: store });
    assert.equal(typed.outcome, "none");
    assert.equal(typed.execute, undefined);
    assert.equal(renderGateNote(typed.post!.note), "Each card here is decided from its own Review button, so nothing ran.");
    const pending = itemProposal("c1", 1);
    const model = await resolveSignal({ kind: "model", pending, decision: "confirm", userId: "U0BILL" }, { threadState: store });
    assert.equal(model.outcome, "none");
    assert.equal((await store.getProposalByTs(pending.proposalTs)).state, "found");
  });
});
