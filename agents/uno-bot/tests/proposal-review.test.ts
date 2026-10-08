// Review on a proposal card: the pop-up, and the Gate's fifth signal.
//
// Driven at the review door the interactive endpoint hands a Slack payload to,
// on the in-memory ThreadState, the recording Delivery and a views client that
// refuses what Slack refuses (`tests/helpers/recording-slack.ts`). Every case
// asserts what Slack was handed or what the Gate decided — never a helper.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, runReactionDoor, type GateSignal, type GateVerdict } from "../src/gate/index";
import {
  PROPOSAL_TTL_MS,
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { checkedEditsView, runReviewDecision, runReviewOpen, type ReviewDoorDeps } from "../src/slack/review-door";
import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import { runTurn, type ProposalCard, type TurnDeps } from "../src/turn/index";
import { harness as turnHarness, request as turnRequest, PENDING } from "./helpers/turn-harness";
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
  const revisions: Array<{ proposal: PendingProposal; note: string; userId: string }> = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => delivery,
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async (channel, ts, text, note) => void cardUpdates.push({ channel, ts, text, note }),
    restage: async () => {},
    revise: async (request) => void revisions.push(request),
  };
  return { deps, views, delivery, ran, cardUpdates, revisions };
}

const open = (userId = "U2") => ({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId });
const approve = (userId = "U2", viewId = "V1") => ({
  viewId,
  channel: CHANNEL,
  messageTs: CARD_TS,
  userId,
  decision: "confirm" as const,
});

/** A confirmer's decision row, in Bill's order. */
const DECISION_ROW = ["uno_review_approve", "uno_review_changes", "uno_review_reject"];

/** Every action element a view offers. */
function actionIds(view: unknown): string[] {
  const blocks = (view as { blocks: Array<{ type: string; elements?: Array<{ action_id?: string }> }> }).blocks;
  return blocks.filter((b) => b.type === "actions").flatMap((b) => (b.elements ?? []).map((e) => e.action_id ?? ""));
}

/** The words a view shows, joined. */
function viewText(view: unknown): string {
  return JSON.stringify((view as { blocks: unknown[] }).blocks);
}

type CardBlock = { type: string; elements?: Array<{ action_id?: string; text?: { text: string } | string }> };

/** The buttons a card's blocks offer, by label. */
function cardButtons(blocks: unknown[]): string[] {
  return (blocks as CardBlock[])
    .filter((b) => b.type === "actions")
    .flatMap((b) => (b.elements ?? []).map((e) => (typeof e.text === "object" ? e.text.text : "")));
}

describe("the card offers Review", () => {
  it("offers Review and nothing else: the decision is made in the pop-up", () => {
    const blocks = proposalCardBlocks("(card)") as CardBlock[];
    const row = blocks.find((b) => b.type === "actions");
    assert.deepEqual(row?.elements?.map((e) => e.action_id), ["uno_proposal_review"]);
    assert.deepEqual(cardButtons(blocks), ["Review"]);
  });

  it("does not advertise the reactions it still takes", () => {
    const card = renderProposalCard({
      kind: "confirm",
      verb: "create a Notion page",
      fields: [{ label: "title", value: "Reflection redesign" }],
      caveats: [],
      operations: [],
    } as unknown as ProposalCard);
    assert.doesNotMatch(card.text, /white_check_mark|no_entry|✅|⛔/);
  });

  it("keeps a decided card's draft one press away, as View", () => {
    const blocks = proposalCardBlocks("(card)", ":white_check_mark: Approved by <@U2>") as CardBlock[];
    assert.deepEqual(cardButtons(blocks), ["View"]);
    const row = blocks.find((b) => b.type === "actions");
    assert.deepEqual(row?.elements?.map((e) => e.action_id), ["uno_proposal_review"]);
    assert.match(JSON.stringify(blocks), /Approved by <@U2>/);
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

  it("gives a confirmer Approve, Needs changes and Reject, as the last row of the body", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view as {
      blocks: Array<{ type: string; elements?: Array<{ style?: string; text: { text: string } }> }>;
      submit?: { text: string };
    };
    assert.deepEqual(actionIds(draft), DECISION_ROW);
    assert.deepEqual(
      draft.blocks.at(-1)?.elements?.map((e) => [e.text.text, e.style ?? "default"]),
      [
        ["Approve", "primary"],
        ["Needs changes", "default"],
        ["Reject", "danger"],
      ],
    );
    // The note Needs changes needs and Reject may carry sits just above it.
    assert.equal(draft.blocks.at(-2)?.type, "input");
    // Slack requires a submit beside an input; it checks, never decides.
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
    assert.deepEqual(actionIds(views.calls[1]!.view), DECISION_ROW);
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

  it("keeps the note and the decision row on a draft too long for one view, and says some was left out", async () => {
    const paragraphs = Array.from({ length: 140 }, (_, n) => `Paragraph ${n}: ${"words ".repeat(480)}`);
    const { deps, views } = harness(await staged({ proposalText: paragraphs.join("\n\n") }));
    await runReviewOpen(open(), deps);
    const view = views.calls[1]!.view as { blocks: Array<{ type: string; block_id?: string }> };
    assert.ok(view.blocks.length <= 100, `${view.blocks.length} blocks`);
    assert.deepEqual(actionIds(view), DECISION_ROW);
    assert.equal(view.blocks.at(-1)!.block_id, "uno_review_decision", "the decision row is last");
    assert.ok(view.blocks.some((b) => b.block_id === "uno_review_note"), "the note input is kept");
    assert.match(viewText(view), /left out/i);
    assert.match(viewText(view), /Paragraph 0:/, "the draft still opens the view");
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

const decide = (decision: "confirm" | "cancel" | "revise", note?: string, userId = "U2") => ({
  viewId: "V1",
  channel: CHANNEL,
  messageTs: CARD_TS,
  userId,
  decision,
  ...(note !== undefined ? { note } : {}),
});

/** A reaction on the card, through the reaction door. */
async function react(threadState: ThreadState, glyph: string, userId = "U2"): Promise<GateVerdict[]> {
  const verdicts: GateVerdict[] = [];
  await runReactionDoor(
    { channel: CHANNEL, messageTs: CARD_TS, glyph, userId },
    {
      threadState,
      delivery: () => recordingDelivery(),
      threadRootOf: async () => THREAD,
      botUserId: async () => "UBOT",
      applyVerdict: async (verdict) => void verdicts.push(verdict),
      restage: async () => {},
    },
  );
  return verdicts;
}

describe("Needs changes in the pop-up", () => {
  it("hands the note and the live card to a revision, and runs nothing", async () => {
    const threadState = await staged();
    const { deps, views, ran, cardUpdates, revisions } = harness(threadState);
    await runReviewDecision(decide("revise", "  Call it Reflection v2  "), deps);

    assert.deepEqual(ran, []);
    assert.equal(revisions.length, 1);
    assert.equal(revisions[0]?.note, "Call it Reflection v2");
    assert.equal(revisions[0]?.userId, "U2");
    assert.equal(revisions[0]?.proposal.proposalTs, CARD_TS);
    // The card says who asked for changes, and loses its decision.
    assert.equal(cardUpdates.length, 1);
    assert.match(cardUpdates[0]!.note, /^:pencil2: .*<@U2>/);
    // The pop-up confirms it in one line, with nothing left to press.
    assert.equal(views.calls.length, 1);
    assert.deepEqual(actionIds(views.calls[0]!.view), []);
    assert.match(viewText(views.calls[0]!.view), /revis/i);
  });

  it("is superseded by the revised card, so a late ✅ on it runs nothing", async () => {
    const threadState = await staged();
    const { deps } = harness(threadState);
    // The revision is a turn in the card's thread: it finds the card still
    // pending, and stages its replacement in the same reply thread.
    deps.revise = async ({ proposal }) => {
      const pending = await threadState.getProposalByThread({ channel: CHANNEL, thread: THREAD });
      assert.equal(pending?.proposalTs, CARD_TS);
      await threadState.putProposal({ ...proposal, proposalTs: "1700000000.000295", input: { title: "Reflection v2" } });
    };
    await runReviewDecision(decide("revise", "Call it Reflection v2"), deps);

    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "superseded");
    assert.deepEqual((await react(threadState, "white_check_mark")).filter((v) => v.execute), []);
  });

  it("locks the card while it is revised: no door approves, rejects or revises it again", async () => {
    const threadState = await staged();
    const { deps, revisions } = harness(threadState);
    await runReviewDecision(decide("revise", "Call it Reflection v2"), deps);
    assert.equal(revisions.length, 1);

    const signals: GateSignal[] = [
      { kind: "review", messageTs: CARD_TS, decision: "confirm", userId: "U2" },
      { kind: "review", messageTs: CARD_TS, decision: "cancel", userId: "U2" },
      { kind: "review", messageTs: CARD_TS, decision: "revise", note: "and shorter", userId: "U2" },
      { kind: "button", messageTs: CARD_TS, decision: "confirm", userId: "U2" },
      { kind: "reaction", messageTs: CARD_TS, channel: CHANNEL, thread: THREAD, glyph: "white_check_mark", userId: "U2" },
      { kind: "typed", channel: CHANNEL, thread: THREAD, text: "✅", userId: "U2" },
      { kind: "model", pending: PROPOSAL, decision: "confirm", userId: "U2" },
    ];
    for (const signal of signals) {
      const verdict = await resolveSignal(signal, { threadState });
      assert.notEqual(verdict.outcome, "won", signal.kind);
      assert.equal(verdict.execute, undefined, signal.kind);
      assert.equal(verdict.revise, undefined, signal.kind);
      assert.equal(verdict.post?.note.kind, "being-revised", signal.kind);
    }
    // Still the card the revision turn finds and replaces.
    assert.equal((await threadState.getProposalByThread({ channel: CHANNEL, thread: THREAD }))?.proposalTs, CARD_TS);
  });

  it("is idempotent: a second Needs changes starts no second revision", async () => {
    const threadState = await staged();
    const { deps, views, revisions, cardUpdates } = harness(threadState);
    await runReviewDecision(decide("revise", "Call it Reflection v2"), deps);
    await runReviewDecision(decide("revise", "Call it Reflection v2", "U3"), deps);
    assert.equal(revisions.length, 1);
    assert.equal(cardUpdates.length, 1);
    assert.match(viewText(views.calls.at(-1)!.view), /being revised/);
  });

  it("unlocks when the revision turn fails, so the card can be decided again", async () => {
    const t = turnHarness();
    await t.threadState.putProposal(PENDING);
    assert.equal(await t.threadState.markRevising(PENDING.proposalTs, "U1"), "marked");
    const [pending] = await t.threadState.getProposalsByChannel(PENDING.channel);
    const broken: TurnDeps = {
      ...t.deps,
      async runAgent() {
        throw new Error("the run stopped");
      },
    };
    await runTurn(turnRequest({ text: "Needs changes on the proposal card above: shorter", pending: pending! }), broken);

    const verdict = await resolveSignal(
      { kind: "button", messageTs: PENDING.proposalTs, decision: "confirm", userId: "U1" },
      { threadState: t.threadState },
    );
    assert.equal(verdict.outcome, "won");
  });

  it("keeps the note and the decisions through Check edits, the submit the note's input needs", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view as Record<string, unknown>;
    const checked = checkedEditsView({
      ...draft,
      state: { values: { uno_review_note: { uno_review_note_input: { type: "plain_text_input", value: "shorter" } } } },
    });
    assert.deepEqual(actionIds(checked), DECISION_ROW);
    assert.ok((checked.blocks as Array<{ block_id?: string }>).some((b) => b.block_id === "uno_review_note"));
    assert.equal((checked.submit as { text: string }).text, "Check edits");
  });

  it("is refused in the view without a note, and leaves the card as it was", async () => {
    const threadState = await staged();
    const { deps, views, ran, cardUpdates, revisions } = harness(threadState);
    await runReviewDecision(decide("revise", "   "), deps);

    assert.deepEqual(revisions, []);
    assert.deepEqual(ran, []);
    assert.deepEqual(cardUpdates, []);
    // The draft stays open with its decisions, and says what is missing.
    const view = views.calls.at(-1)!.view;
    assert.deepEqual(actionIds(view), DECISION_ROW);
    assert.match(viewText(view), /note/i);
    assert.match(viewText(view), /Reflection redesign/);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
  });

  it("refuses someone outside the confirmer set", async () => {
    const threadState = await staged({ confirmers: ["U07CONFIRM"] });
    const { deps, views, revisions, cardUpdates } = harness(threadState);
    await runReviewDecision(decide("revise", "shorter please"), deps);
    assert.deepEqual(revisions, []);
    assert.deepEqual(cardUpdates, []);
    assert.match(viewText(views.calls[0]!.view), /<@U07CONFIRM>/);
  });

  it("asks for nothing on a card that was already decided", async () => {
    const threadState = await staged();
    await threadState.claimProposal(CARD_TS);
    const { deps, views, revisions } = harness(threadState);
    await runReviewDecision(decide("revise", "shorter please"), deps);
    assert.deepEqual(revisions, []);
    assert.match(viewText(views.calls[0]!.view), /already resolved/);
  });
});

describe("Reject in the pop-up", () => {
  it("closes the proposal, runs nothing, and records the reason on the card and in the thread", async () => {
    const threadState = await staged();
    const { deps, views, delivery, ran, cardUpdates } = harness(threadState);
    await runReviewDecision(decide("cancel", "Wrong database"), deps);

    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.outcome, "won");
    assert.equal(ran[0]?.decision, "cancel");
    assert.equal(ran[0]?.execute, undefined);
    assert.deepEqual(delivery.gateNotes, [
      { kind: "resolved", decision: "cancel", rejected: { reason: "Wrong database" } },
    ]);
    assert.deepEqual(
      cardUpdates.map((u) => u.note),
      [":no_entry: Rejected by <@U2>: Wrong database"],
    );
    assert.match(viewText(views.calls[0]!.view), /Rejected/);
    assert.deepEqual(actionIds(views.calls[0]!.view), []);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "none");
    assert.deepEqual(
      verdictEvents(ran[0]!, 1_000).map((e) => [e.event, e.via, e.actorId]),
      [["cancelled", "review", "U2"]],
    );
  });

  it("takes no reason at all", async () => {
    const { deps, cardUpdates, delivery } = harness(await staged());
    await runReviewDecision(decide("cancel", ""), deps);
    assert.deepEqual(cardUpdates.map((u) => u.note), [":no_entry: Rejected by <@U2>"]);
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "cancel", rejected: {} }]);
  });
});

describe("a decided card", () => {
  it("opens read-only from View, from the card's own words", async () => {
    const { deps, views } = harness(createInMemoryThreadState());
    await runReviewOpen({ ...open(), cardText: `${PROPOSAL.proposalText}\n:white_check_mark: Approved by <@U1>` }, deps);
    const view = views.calls[1]!.view;
    assert.match(viewText(view), /Reflection redesign/);
    assert.match(viewText(view), /already been decided/);
    assert.deepEqual(actionIds(view), []);
  });

  it("still resolves from a ✅ or ⛔ reaction, which the card no longer advertises", async () => {
    for (const [glyph, decision] of [
      ["white_check_mark", "confirm"],
      ["no_entry", "cancel"],
    ] as const) {
      const verdicts = await react(await staged(), glyph);
      assert.deepEqual(verdicts.map((v) => [v.outcome, v.decision]), [["won", decision]]);
    }
  });
});
