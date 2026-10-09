// The shared decision card (interactive seam): Review on one item of a
// report opens that item's own proposal, its Submit decides it, and the
// report's message is drawn again from the store — driven at the review door
// on the in-memory ThreadState, the recording Delivery and a views client
// that refuses what Slack refuses.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, type GateVerdict } from "../src/gate/index";
import type { OperationOutcome } from "../src/gate/run-batch";
import { createInMemoryThreadState, type PendingProposal, type ReportItem, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, startRevision, type ReviewDoorDeps } from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { decisionReport, itemProposal, markNotStaged, replaceItem, reportRecord } from "../src/slack/decision-cards";
import { renderGateNote } from "../src/slack/gate-note";
import { recordingViews } from "./helpers/recording-slack";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

const CHANNEL = "C0DESIGN";
/** The report went up as a reply in a thread, not as its parent. */
const THREAD = "1790000000.000050";
const MSG = "1790000000.000100";
const TTL = 72 * 60 * 60 * 1000;
/** Ten minutes after the report posted. */
const NOW = Number(MSG) * 1000 + 10 * 60_000;

const items: ReportItem[] = [1, 2, 3].map((n) => ({
  id: `c${n}`,
  title: `Page ${n}`,
  subtitle: "Bill · card comment",
  body: `Page says ${n} · decision says ${n + 1}.`,
  open: { url: `https://www.notion.so/page${n}` },
}));
const REPORT = decisionReport(items, "Three pages still state the old way.");

/** One item's proposal, staged as the builder says. */
function itemStaged(id: string, n: number): PendingProposal {
  const op = { toolName: "notion_update", input: { page_url: `https://www.notion.so/page${n}`, replace: [{ block_id: `b${n}`, content: `New ${n}` }] } };
  return {
    operations: [op],
    toolName: op.toolName,
    input: op.input,
    channel: CHANNEL,
    threadTs: THREAD,
    replyTs: THREAD,
    ...itemProposal(MSG, id),
    proposalText: `Page ${n}: the line now reads New ${n}.`,
    requesterUserId: "",
    confirmers: ["U0BILL"],
    ttlMs: TTL,
  };
}

async function staged(clock: { now: number } = { now: NOW }): Promise<ThreadState> {
  const store = createInMemoryThreadState({ now: () => clock.now });
  await store.putReport(reportRecord(CHANNEL, MSG, REPORT, TTL));
  for (const [i, it] of items.entries()) await store.putProposal(itemStaged(it.id, i + 1));
  return store;
}

function harness(threadState: ThreadState, outcomes: OperationOutcome[] = [{ toolName: "notion_update", ok: true, result: "{}", message: "Updated." }]) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const updates: Array<{ channel: string; ts: string; message: CardMessage }> = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (v) => {
      ran.push(v);
      return outcomes;
    },
    updateCard: async (channel, ts, message) => void updates.push({ channel, ts, message }),
    restage: async () => {},
    revise: async () => {},
    now: () => NOW,
  };
  return { deps, views, ran, updates };
}

type Card = { title: { text: string }; subtitle?: { text: string }; body: { text: string }; actions: Array<{ text: { text: string }; action_id?: string }> };
const cards = (blocks: unknown[]) => (blocks[1] as { elements: Card[] }).elements;
const decide = (id: string, decision: "confirm" | "cancel", note?: string) => ({
  viewId: "V1",
  channel: CHANNEL,
  messageTs: itemProposal(MSG, id).proposalTs,
  userId: "U0BILL",
  decision,
  ...(note ? { note } : {}),
});

describe("Review on one item of a report", () => {
  it("opens the pop-up on that item's proposal and no other", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen({ triggerId: "T", channel: CHANNEL, messageTs: itemProposal(MSG, "c2").proposalTs, userId: "U0BILL", item: { messageTs: MSG, id: "c2" } }, deps);
    const draft = JSON.stringify(views.calls.at(-1)!.view);
    assert.match(draft, /New 2/);
    assert.doesNotMatch(draft, /New 1/);
  });

  it("says in the pop-up who can decide the item and when it closes, which its card does not", async () => {
    const store = await staged();
    await store.putProposal({ ...itemStaged("c2", 2), confirmers: ["U03FYQJRQHX", "U0BRYAN01"] });
    const { deps, views } = harness(store);
    await runReviewOpen({ triggerId: "T", channel: CHANNEL, messageTs: itemProposal(MSG, "c2").proposalTs, userId: "U03FYQJRQHX", item: { messageTs: MSG, id: "c2" } }, deps);
    // Posted 2026-09-21 10:13 ET; 72 h later.
    assert.match(JSON.stringify(views.calls.at(-1)!.view), /Open until Thu 10:13 ET · <@U03FYQJRQHX> or <@U0BRYAN01> can decide\./);
  });

  it("decides from Submit: runs only that item, and redraws its report message with who decided, Review to View", async () => {
    const store = await staged();
    const { deps, ran, updates } = harness(store);
    await runReviewDecision(decide("c1", "confirm"), deps);
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]!.execute?.operations, itemStaged("c1", 1).operations);
    assert.equal(updates.length, 1);
    assert.equal(updates[0]!.ts, MSG, "the edit goes to the report's message");
    const [one, two] = cards(updates[0]!.message.blocks);
    assert.match(one!.subtitle!.text, /^Approved by <@U0BILL> · written \d{1,2}:\d{2}$/);
    assert.equal(one!.body.text, "Written: Page says 1 · decision says 2.");
    assert.deepEqual(one!.actions.map((a) => a.text.text), ["View", "Open"]);
    assert.equal(two!.subtitle!.text, "Bill · card comment");
    assert.deepEqual(two!.actions.map((a) => a.text.text), ["Review", "Open"]);
    assert.equal(messageBlocksRefusal(updates[0]!.message.blocks), null);
    assert.equal((await store.getProposalByTs(itemProposal(MSG, "c2").proposalTs)).state, "found", "the others wait on their own decisions");
  });

  it("keeps each decision on a report posted as a reply when items are decided one after the other", async () => {
    const store = await staged();
    const { deps, updates } = harness(store);
    await runReviewDecision(decide("c1", "confirm"), deps);
    await runReviewDecision(decide("c3", "cancel", "deliberate"), deps);
    const last = cards(updates.at(-1)!.message.blocks);
    assert.match(last[0]!.subtitle!.text, /^Approved by <@U0BILL>/, "the first decision still shows");
    assert.equal(last[1]!.subtitle!.text, "Bill · card comment");
    assert.equal(last[2]!.subtitle!.text, "Rejected by <@U0BILL>");
    assert.equal(last[2]!.body.text, "Nothing written. Reason: deliberate");
  });

  it("says on the card when an approved write did not go through", async () => {
    const failed = [{ toolName: "notion_update", ok: false, result: "{}", message: ":x: The page changed since the read." }];
    const { deps, updates } = harness(await staged(), failed);
    await runReviewDecision(decide("c2", "confirm"), deps);
    const two = cards(updates[0]!.message.blocks)[1]!;
    assert.equal(two.subtitle!.text, "Approved by <@U0BILL> · not written: The page changed since the read");
    assert.equal(two.body.text, "Nothing written.");
  });

  it("shows a rejected item's reason in View once its proposal is gone", async () => {
    const store = await staged();
    const { deps, views } = harness(store);
    await runReviewDecision(decide("c2", "cancel", "the library is ahead on purpose"), deps);
    await runReviewOpen({ triggerId: "T", channel: CHANNEL, messageTs: itemProposal(MSG, "c2").proposalTs, userId: "U0BILL", item: { messageTs: MSG, id: "c2" } }, deps);
    assert.match(JSON.stringify(views.calls.at(-1)!.view), /Rejected by <@U0BILL>\\nNothing written\. Reason: the library is ahead on purpose/);
  });

  it("closes an item whose time ran out, on its card, when it is next pressed", async () => {
    const clock = { now: NOW };
    const store = await staged(clock);
    const { deps, updates, views } = harness(store);
    clock.now = NOW + TTL + 60_000;
    await runReviewOpen({ triggerId: "T", channel: CHANNEL, messageTs: itemProposal(MSG, "c1").proposalTs, userId: "U0BILL", item: { messageTs: MSG, id: "c1" } }, { ...deps, now: () => clock.now });
    const [one] = cards(updates.at(-1)!.message.blocks);
    assert.equal(one!.subtitle!.text, "Closed, no decision");
    assert.deepEqual(one!.actions.map((a) => a.text.text), ["View", "Open"]);
    assert.match(JSON.stringify(views.calls.at(-1)!.view), /Closed, no decision/);
  });

  it("marks Needs changes on the card, and a revision replaces it in place under a new proposal", async () => {
    const store = await staged();
    const { deps, updates } = harness(store);
    await runReviewDecision({ ...decide("c2", "confirm"), decision: "revise", note: "the cap is 600" }, deps);
    assert.equal(cards(updates.at(-1)!.message.blocks)[1]!.subtitle!.text, "Changes asked by <@U0BILL>");

    const revised = await replaceItem(store, MSG, "c2", { ...items[1]!, body: "Page says 2 · decision says 600." });
    assert.equal(revised!.id, "c2~1");
    const after = cards(revised!.message.blocks);
    assert.equal(after.length, 3, "same message, same place");
    assert.equal(after[1]!.title.text, "Page 2");
    assert.equal(after[1]!.body.text, "Page says 2 · decision says 600.");
    assert.equal(after[1]!.actions[0]!.action_id, "uno_decision_review:c2~1", "a new proposal behind it");
    assert.equal(after[1]!.subtitle!.text, "Bill · card comment");
  });

  it("puts a card sent back for changes back to open when its revision cannot start", async () => {
    const store = await staged();
    const proposal = itemStaged("c1", 1);
    await store.updateReport(MSG, { id: "c1", state: { kind: "changes-asked", by: "U0BILL" } });
    const edits: CardMessage[] = [];
    await startRevision(
      { proposal, note: "shorter", userId: "U0BILL" },
      { threadState: store, postInThread: async () => null, queueTurn: async () => {}, updateCard: async (m) => void edits.push(m) },
    );
    assert.equal(cards(edits[0]!.blocks)[0]!.subtitle!.text, "Bill · card comment");
  });

  it("offers nothing to review on a card that never staged", async () => {
    const store = await staged();
    const message = await markNotStaged(store, MSG, ["c3"], "Didn't go through.");
    const three = cards(message!.blocks)[2]!;
    assert.equal(three.subtitle!.text, "Didn't go through.");
    assert.deepEqual(three.actions.map((a) => a.text.text), ["Open"]);
  });

  it("is not decided by a typed ✅ or the model in its thread: only Review decides an item", async () => {
    const store = await staged();
    const typed = await resolveSignal({ kind: "typed", channel: CHANNEL, thread: THREAD, text: "✅", userId: "U0BILL" }, { threadState: store });
    assert.equal(typed.outcome, "none");
    assert.equal(typed.execute, undefined);
    assert.equal(renderGateNote(typed.post!.note), "Each card here is decided from its own Review button, so nothing ran.");
    const pending = itemStaged("c1", 1);
    const model = await resolveSignal({ kind: "model", pending, decision: "confirm", userId: "U0BILL" }, { threadState: store });
    assert.equal(model.outcome, "none");
    assert.equal((await store.getProposalByTs(pending.proposalTs)).state, "found");
  });
});
