// Review on a proposal card: the pop-up, and the Gate's fifth signal.
//
// Driven at the review door the interactive endpoint hands a Slack payload to,
// on the in-memory ThreadState, the recording Delivery and a views client that
// refuses what Slack refuses (`tests/helpers/recording-slack.ts`). Every case
// asserts what Slack was handed or what the Gate decided — never a helper.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runReactionDoor, type GateVerdict } from "../src/gate/index";
import {
  PROPOSAL_TTL_MS,
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, type ReviewDoorDeps } from "../src/slack/review-door";
import { proposalCardBlocks } from "../src/slack/proposal-render";
import { verdictEvents } from "../src/usage/index";
import { recordingViews, type RecordingViews } from "./helpers/recording-slack";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";

const PROPOSAL: PendingProposal = {
  toolName: "notion_create",
  input: { title: "Reflection redesign" },
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1700000000.000190",
  proposalTs: CARD_TS,
  proposalText: ":warning: About to *create a Notion page*:\n• *Title:* Reflection redesign",
  requesterUserId: "U1",
};

async function staged(over: Partial<PendingProposal> = {}, now?: () => number): Promise<ThreadState> {
  const store = createInMemoryThreadState(now ? { now } : {});
  await store.putProposal({ ...PROPOSAL, ...over });
  return store;
}

/** The door's dependencies on recordings, and what each one was asked. */
function harness(threadState: ThreadState, opts: { views?: RecordingViews } = {}) {
  const views = opts.views ?? recordingViews({ alreadyOpen: ["V1"] });
  const delivery = recordingDelivery();
  const ran: GateVerdict[] = [];
  const cardUpdates: Array<{ channel: string; ts: string; text: string; note: string }> = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => delivery,
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async (channel, ts, text, note) => void cardUpdates.push({ channel, ts, text, note }),
    restage: async () => {},
  };
  return { deps, views, delivery, ran, cardUpdates };
}

const open = (userId = "U2") => ({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId });
const approve = (userId = "U2", viewId = "V1") => ({
  viewId,
  channel: CHANNEL,
  messageTs: CARD_TS,
  userId,
  decision: "confirm" as const,
});

/** Every action element a view offers. */
function actionIds(view: unknown): string[] {
  const blocks = (view as { blocks: Array<{ type: string; elements?: Array<{ action_id?: string }> }> }).blocks;
  return blocks.filter((b) => b.type === "actions").flatMap((b) => (b.elements ?? []).map((e) => e.action_id ?? ""));
}

/** The words a view shows, joined. */
function viewText(view: unknown): string {
  return JSON.stringify((view as { blocks: unknown[] }).blocks);
}

describe("the card offers Review", () => {
  it("puts Review beside Approve and Cancel", () => {
    const blocks = proposalCardBlocks("(card)") as Array<{ type: string; elements?: Array<{ action_id: string }> }>;
    const row = blocks.find((b) => b.type === "actions");
    assert.deepEqual(
      row?.elements?.map((e) => e.action_id),
      ["uno_proposal_confirm", "uno_proposal_cancel", "uno_proposal_review"],
    );
  });
});

describe("Review opens the draft", () => {
  it("opens a loading view before reading anything, then fills it with the draft", async () => {
    const reads: string[] = [];
    const store = await staged();
    const watched: ThreadState = {
      ...store,
      getProposalByTs: async (ts) => {
        reads.push(`read after ${views.calls.length} view call(s)`);
        return store.getProposalByTs(ts);
      },
    };
    const { deps, views } = harness(watched);
    await runReviewOpen(open(), deps);

    // Slack's trigger lives three seconds; the open goes before any read.
    assert.deepEqual(reads, ["read after 1 view call(s)"]);
    assert.deepEqual(views.calls.map((c) => c.kind), ["open", "update"]);
    assert.equal(views.calls[0]?.kind === "open" && views.calls[0].triggerId, "T.trigger");
    assert.match(viewText(views.calls[0]!.view), /Loading/);
    assert.equal(views.calls[1]?.kind === "update" && views.calls[1].viewId, "V1");
    assert.match(viewText(views.calls[1]!.view), /Reflection redesign/);
  });

  it("gives a confirmer one Approve, as the last row of the body", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view as { blocks: Array<{ type: string }>; submit?: { text: string } };
    assert.deepEqual(actionIds(draft), ["uno_review_approve"]);
    assert.equal(draft.blocks.at(-1)?.type, "actions");
    // Slack requires a submit beside the editable fields; it checks, never decides.
    assert.equal(draft.submit?.text, "Check edits", "the footer carries no decision");
  });

  it("carries the card it is about, so the decision finds it", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen(open(), deps);
    const meta = JSON.parse((views.calls[1]!.view as { private_metadata: string }).private_metadata);
    assert.deepEqual(meta, { channel: CHANNEL, ts: CARD_TS });
  });

  it("shows a non-confirmer the same draft read-only, naming who can decide", async () => {
    const { deps, views } = harness(await staged({ confirmers: ["U07CONFIRM"] }));
    await runReviewOpen(open("U2"), deps);
    const draft = views.calls[1]!.view;
    assert.match(viewText(draft), /Reflection redesign/);
    assert.deepEqual(actionIds(draft), []);
    assert.match(viewText(draft), /<@U07CONFIRM>/);
  });

  it("lets a standing confirmer decide a card whose own set leaves them out", async () => {
    const threadState = await staged({ confirmers: ["U07CONFIRM"] });
    const { deps, views } = harness(threadState);
    await runReviewOpen(open("U9"), { ...deps, standingConfirmers: ["U9"] });
    assert.deepEqual(actionIds(views.calls[1]!.view), ["uno_review_approve"]);
  });

  it("says an expired proposal expired, and offers no decision", async () => {
    let clock = 1_000_000;
    const threadState = await staged({}, () => clock);
    clock += PROPOSAL_TTL_MS + 1;
    const { deps, views } = harness(threadState);
    await runReviewOpen(open(), deps);
    const view = views.calls[1]!.view;
    assert.match(viewText(view), /expired/);
    assert.doesNotMatch(viewText(view), /Reflection redesign/);
    assert.deepEqual(actionIds(view), []);
  });

  it("says a replaced proposal was replaced, and offers no decision", async () => {
    const threadState = await staged();
    await threadState.putProposal({ ...PROPOSAL, proposalTs: "1700000000.000295", proposalText: "(revised)" });
    const { deps, views } = harness(threadState);
    await runReviewOpen(open(), deps);
    const view = views.calls[1]!.view;
    assert.match(viewText(view), /replaced/);
    assert.deepEqual(actionIds(view), []);
  });

  it("says a decided proposal is decided", async () => {
    const { deps, views } = harness(createInMemoryThreadState());
    await runReviewOpen(open(), deps);
    const view = views.calls[1]!.view;
    assert.match(viewText(view), /already been decided/);
    assert.deepEqual(actionIds(view), []);
  });

  it("stops when Slack will not open the view", async () => {
    const views = recordingViews({ openFails: true });
    const reads: string[] = [];
    const store = await staged();
    const { deps } = harness({ ...store, getProposalByTs: async (ts) => (reads.push(ts), store.getProposalByTs(ts)) }, { views });
    await runReviewOpen(open(), deps);
    assert.deepEqual(views.calls.map((c) => c.kind), ["open"]);
    assert.deepEqual(reads, []);
  });
});

describe("Approve in the pop-up", () => {
  it("executes exactly as the card's Approve would, once", async () => {
    const threadState = await staged();
    const { deps, views, delivery, ran, cardUpdates } = harness(threadState);
    await runReviewDecision(approve(), deps);

    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.outcome, "won");
    assert.deepEqual(ran[0]?.execute?.input, { title: "Reflection redesign" });
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "confirm" }]);
    // The card is edited in place, as the button leaves it.
    assert.deepEqual(cardUpdates, [
      { channel: CHANNEL, ts: CARD_TS, text: PROPOSAL.proposalText, note: ":white_check_mark: Approved by <@U2>" },
    ]);
    // And the pop-up confirms the decision in one line, with nothing left to press.
    assert.deepEqual(views.calls.map((c) => c.kind), ["update"]);
    assert.match(viewText(views.calls[0]!.view), /Approved/);
    assert.deepEqual(actionIds(views.calls[0]!.view), []);

    // A second press finds nothing to run.
    const again = harness(threadState);
    await runReviewDecision(approve(), again.deps);
    assert.deepEqual(again.ran, []);
    assert.deepEqual(again.cardUpdates, []);
  });

  it("is recorded as the review door's, naming who approved", async () => {
    const { deps, ran } = harness(await staged());
    await runReviewDecision(approve("U1"), deps);
    assert.deepEqual(
      verdictEvents(ran[0]!, 1_000).map((e) => [e.event, e.via, e.actorId]),
      [["confirmed", "review", "U1"]],
    );
  });

  it("runs once between itself and a racing ✅ reaction", async () => {
    const threadState = await staged();
    const review = harness(threadState);
    const reacted: GateVerdict[] = [];
    await Promise.all([
      runReviewDecision(approve(), review.deps),
      runReactionDoor(
        { channel: CHANNEL, messageTs: CARD_TS, glyph: "white_check_mark", userId: "U3" },
        {
          threadState,
          delivery: () => recordingDelivery(),
          threadRootOf: async () => THREAD,
          botUserId: async () => "UBOT",
          applyVerdict: async (verdict) => void reacted.push(verdict),
          restage: async () => {},
        },
      ),
    ]);
    const won = [...review.ran, ...reacted].filter((v) => v.outcome === "won" && v.execute);
    assert.equal(won.length, 1);
    if (!review.ran.length) {
      // Lost: the pop-up says so, and the card is not touched by this door.
      assert.match(viewText(review.views.calls.at(-1)!.view), /already resolved/);
      assert.deepEqual(review.cardUpdates, []);
    }
  });

  it("refuses someone outside the confirmer set and keeps the card", async () => {
    const threadState = await staged({ confirmers: ["U07CONFIRM"] });
    const { deps, views, ran, cardUpdates } = harness(threadState);
    await runReviewDecision(approve("U2"), deps);
    assert.deepEqual(ran, []);
    assert.deepEqual(cardUpdates, []);
    assert.match(viewText(views.calls[0]!.view), /<@U07CONFIRM>/);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
  });

  it("runs nothing on a proposal that expired while the pop-up was open", async () => {
    let clock = 1_000_000;
    const threadState = await staged({}, () => clock);
    clock += PROPOSAL_TTL_MS + 1;
    const { deps, views, ran } = harness(threadState);
    await runReviewDecision(approve(), deps);
    assert.deepEqual(ran, []);
    assert.match(viewText(views.calls[0]!.view), /expired/);
    assert.deepEqual(actionIds(views.calls[0]!.view), []);
  });
});
