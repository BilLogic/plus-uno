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
  REVISING_MARK_MS,
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import {
  runReviewDecision,
  runReviewOpen,
  runReviewPush,
  startRevision,
  type ReviewDoorDeps,
  type RevisionDeps,
} from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import { runTurn, type ProposalCard, type TurnDeps } from "../src/turn/index";
import { harness as turnHarness, request as turnRequest, PENDING } from "./helpers/turn-harness";
import { verdictEvents } from "../src/usage/index";
import { recordingViews, type RecordingViews } from "./helpers/recording-slack";
import { cardWords } from "./helpers/card-message";

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
    updateCard: async (channel, ts, message) => void cardUpdates.push({ channel, ts, ...cardWords(message) }),
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

/** A confirmer's decision row in the body; Approve is the footer's submit. */
const DECISION_ROW = ["uno_review_changes", "uno_review_reject"];

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

  it("is short in the thread: a summary, the body's size, the LLM line and Review; the draft rides in the text", () => {
    const body = "Problem: tutors read goal cycles differently. ".repeat(14).trim();
    const card = renderProposalCard({
      kind: "confirm",
      verb: "create a Notion page",
      fields: [
        { label: "title", value: "Goal cycle resets per session" },
        { label: "database", value: "Roadmap" },
        { label: "properties", under: [{ field: { label: "product_pillar", value: "Toolkit" } }, { field: { label: "design_status", value: "Need PRD" } }] },
        { label: "body", value: body },
      ],
      caveats: [],
      operations: [],
    });
    const blocks = (card.blocks ?? proposalCardBlocks(card.text)) as CardBlock[];
    const words = blocks.map((b) => JSON.stringify(b));

    assert.equal(blocks[0]!.type, "section");
    assert.match(words[0]!, /:warning: Ready to \*create a Notion page\*: _Goal cycle resets per session_ · Roadmap · Toolkit · Need PRD/);
    assert.match(words[1]!, new RegExp(`Body ${body.length} characters · review before approving`));
    assert.match(words[2]!, /LLM-written · check before acting/);
    assert.deepEqual(cardButtons(blocks), ["Review"]);
    assert.equal(blocks.length, 4);
    assert.doesNotMatch(words.join(""), /Problem: tutors/, "the draft lives in the pop-up");
    // Notifications, history and the model reading it back get the whole draft.
    assert.ok(card.text.includes(body));
  });

  it("keeps a stated card whole", () => {
    const text = "The library published 3 changes.\n\n:white_check_mark: files the intake; :no_entry: files nothing.";
    const blocks = proposalCardBlocks(text) as CardBlock[];
    assert.match(JSON.stringify(blocks[0]), /The library published 3 changes/);
    assert.doesNotMatch(JSON.stringify(blocks), /Ready to|LLM-written/);
  });

  it("stays short once decided, with the outcome and View", () => {
    const card = renderProposalCard({
      kind: "confirm",
      verb: "file a GitHub issue",
      fields: [
        { label: "title", value: "Badge colour drift" },
        { label: "body", value: "The warning badge differs between code and Figma." },
      ],
      caveats: [],
      operations: [],
    });
    const blocks = proposalCardBlocks(card.text, ":white_check_mark: Approved by <@U2>") as CardBlock[];
    const words = JSON.stringify(blocks);
    assert.match(words, /Ready to \*file a GitHub issue\*: _Badge colour drift_/);
    assert.match(words, /Approved by <@U2>/);
    assert.doesNotMatch(words, /review before approving/);
    assert.deepEqual(cardButtons(blocks), ["View"]);
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

  it("puts Approve in the footer, Needs changes and Reject last in the body, and holds no input", async () => {
    const { deps, views } = harness(await staged());
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view as {
      blocks: Array<{ type: string; accessory?: { action_id: string; text: { text: string } }; elements?: Array<{ style?: string; text: { text: string } }> }>;
      submit?: { text: string };
      close?: { text: string };
    };
    assert.equal(draft.submit?.text, "Approve");
    assert.equal(draft.close?.text, "Close");
    assert.deepEqual(actionIds(draft), DECISION_ROW);
    assert.deepEqual(
      draft.blocks.at(-1)?.elements?.map((e) => [e.text.text, e.style ?? "default"]),
      [
        ["Needs changes", "default"],
        ["Reject", "danger"],
      ],
    );
    assert.deepEqual(draft.blocks.filter((b) => b.type === "input"), []);
    // Edit fields sits at the top, beside the draft.
    assert.equal(draft.blocks[0]?.accessory?.action_id, "uno_review_edit");
    assert.equal(draft.blocks[0]?.accessory?.text.text, "Edit fields");
    assert.doesNotMatch(viewText(draft), /Check edits|uno_review_approve/);
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
    const draft = views.calls[1]!.view as { submit?: unknown; close?: { text: string } };
    assert.match(viewText(draft), /Reflection redesign/);
    assert.deepEqual(actionIds(draft), []);
    assert.doesNotMatch(viewText(draft), /uno_review_edit/);
    assert.equal(draft.submit, undefined, "only Close");
    assert.equal(draft.close?.text, "Close");
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

  it("keeps the decision row on a draft too long for one view, and says some was left out", async () => {
    const sections = Array.from({ length: 140 }, (_, n) => ({ heading: `Part ${n}`, body: `Paragraph ${n}: ${"words ".repeat(80)}` }));
    const { deps, views } = harness(await staged({ input: { surface: "prd", title: "Reflection redesign", sections } }));
    await runReviewOpen(open(), deps);
    const view = views.calls[1]!.view as { blocks: Array<{ type: string; block_id?: string }> };
    assert.ok(view.blocks.length <= 100, `${view.blocks.length} blocks`);
    assert.deepEqual(actionIds(view), DECISION_ROW);
    assert.equal(view.blocks.at(-1)!.block_id, "uno_review_decision", "the decision row is last");
    assert.match(viewText(view), /left out/i);
    assert.match(viewText(view), /Paragraph 0:/, "the draft still opens the view");
    assert.deepEqual(views.refused, []);
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
    // The card says who asked for changes.
    assert.equal(cardUpdates.length, 1);
    assert.match(cardUpdates[0]!.note, /^:pencil2: .*<@U2>/);
    // The pop-up confirms it in one line, with nothing left to press.
    assert.equal(views.calls.length, 1);
    assert.deepEqual(actionIds(views.calls[0]!.view), []);
    assert.match(viewText(views.calls[0]!.view), /revis/i);
  });

  it("leaves the card live while it is revised: Review stays, and opens on 'being revised'", async () => {
    const threadState = await staged();
    const { deps, views } = harness(threadState);
    const edited: CardMessage[] = [];
    deps.updateCard = async (_channel, _ts, message) => void edited.push(message);
    await runReviewDecision(decide("revise", "Call it Reflection v2"), deps);

    assert.equal(edited.length, 1);
    assert.deepEqual(cardButtons(edited[0]!.blocks), ["Review"]);
    assert.match(cardWords(edited[0]!).note, /being revised/i);

    await runReviewOpen(open(), deps);
    const view = views.calls.at(-1)!.view;
    assert.match(viewText(view), /being revised/);
    assert.deepEqual(actionIds(view), []);
  });

  it("lapses on its own, so a Worker that died mid-revision cannot hold the card", async () => {
    let t = 1_700_000_000_000;
    const threadState = await staged({}, () => t);
    const { deps, ran } = harness(threadState);
    await runReviewDecision(decide("revise", "Call it Reflection v2"), deps);
    assert.equal((await resolveSignal({ kind: "button", messageTs: CARD_TS, decision: "confirm", userId: "U2" }, { threadState })).outcome, "stale");

    t += REVISING_MARK_MS + 1;
    await runReviewDecision(approve(), deps);
    assert.equal(ran.length, 1);
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

    // The card is back as it was posted: its words, Review, no note.
    const reopened = t.delivery.calls.filter((c) => c.kind === "reopen-card");
    assert.deepEqual(reopened, [{ kind: "reopen-card", card: { ts: PENDING.proposalTs, text: PENDING.proposalText } }]);

    const verdict = await resolveSignal(
      { kind: "button", messageTs: PENDING.proposalTs, decision: "confirm", userId: "U1" },
      { threadState: t.threadState },
    );
    assert.equal(verdict.outcome, "won");
  });

  it("reopens no card when the revision turn stages its revision", async () => {
    const t = turnHarness({
      replies: [{ text: "Revised.", toolCalls: [{ name: "notion_create", args: { title: "Reflection, shorter" } }] }],
    });
    await t.threadState.putProposal(PENDING);
    assert.equal(await t.threadState.markRevising(PENDING.proposalTs, "U1"), "marked");
    const [pending] = await t.threadState.getProposalsByChannel(PENDING.channel);
    const outcome = await runTurn(turnRequest({ text: "Needs changes on the proposal card above: shorter", pending: pending! }), t.deps);
    assert.equal(outcome.disposition, "staged");
    assert.deepEqual(t.delivery.calls.filter((c) => c.kind === "reopen-card"), []);
  });

  it("is refused without a note, and leaves the card as it was", async () => {
    const threadState = await staged();
    const { deps, views, ran, cardUpdates, revisions } = harness(threadState);
    await runReviewDecision(decide("revise", "   "), deps);

    assert.deepEqual(revisions, []);
    assert.deepEqual(ran, []);
    assert.deepEqual(cardUpdates, []);
    assert.match(viewText(views.calls.at(-1)!.view), /needs a note/i);
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

describe("starting the revision", () => {
  /** A card sent back with Needs changes, and the revision's dependencies on
   *  recordings: what was posted, queued and edited. */
  async function sentBack(opts: { notePosts?: boolean; queueFails?: boolean } = {}) {
    const threadState = await staged();
    assert.equal(await threadState.markRevising(CARD_TS, "U2"), "marked");
    const posted: string[] = [];
    const queued: string[] = [];
    const edited: CardMessage[] = [];
    const deps: RevisionDeps = {
      threadState,
      postInThread: async (text) => {
        posted.push(text);
        return opts.notePosts === false && posted.length === 1 ? null : `1700000000.00030${posted.length}`;
      },
      queueTurn: async (noteTs) => {
        if (opts.queueFails) throw new Error("queue unavailable");
        queued.push(noteTs);
      },
      updateCard: async (message) => void edited.push(message),
    };
    const request = { proposal: { ...PROPOSAL, revising: { userId: "U2" } }, note: "Call it Reflection v2", userId: "U2" };
    return { threadState, deps, request, posted, queued, edited };
  }

  /** The card is decidable again, and shows as it was posted: Review, no note. */
  async function assertReopened(threadState: ThreadState, edited: CardMessage[], posted: string[]) {
    assert.equal(edited.length, 1);
    assert.equal(edited[0]!.text, PROPOSAL.proposalText);
    assert.deepEqual(cardButtons(edited[0]!.blocks), ["Review"]);
    assert.doesNotMatch(JSON.stringify(edited[0]!.blocks), /pencil2|revis/i);
    assert.match(posted.at(-1)!, /couldn't start the revision\. Reply here with what to change/);
    const verdict = await resolveSignal({ kind: "button", messageTs: CARD_TS, decision: "confirm", userId: "U2" }, { threadState });
    assert.equal(verdict.outcome, "won");
  }

  it("posts the note in the thread and queues the revision turn on it", async () => {
    const { deps, request, posted, queued, edited } = await sentBack();
    await startRevision(request, deps);
    assert.equal(posted.length, 1);
    assert.match(posted[0]!, /^:pencil2: <@U2> asked for changes: Call it Reflection v2$/);
    assert.deepEqual(queued, ["1700000000.000301"]);
    assert.deepEqual(edited, []);
  });

  it("reopens the card and says so when the note does not post", async () => {
    const { threadState, deps, request, posted, queued, edited } = await sentBack({ notePosts: false });
    await startRevision(request, deps);
    assert.deepEqual(queued, []);
    await assertReopened(threadState, edited, posted);
  });

  it("reopens the card and says so when the revision turn cannot be queued", async () => {
    const { threadState, deps, request, posted, edited } = await sentBack({ queueFails: true });
    await startRevision(request, deps);
    await assertReopened(threadState, edited, posted);
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
