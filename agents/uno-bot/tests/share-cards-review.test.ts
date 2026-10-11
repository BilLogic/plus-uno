// The two share cards — the DM sweep's raise note and a group DM's share of
// what its fix settled — are decided from Review, like every other card a
// sweep posts. Neither says ✅ or ⛔; the sweep's insert refusal points at
// Review too. A card posted before they moved still closes from its own
// reaction or its Review, in the gate's shared words.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { raiseCard } from "../src/dm-sweep/copy";
import { sweepShareCard, SWEEP_SHARE_KEY, SWEEP_SHARE_TOOL } from "../src/sweep/share";
import { INSERT_CARD_REFUSAL, SHARE_CARD_WORDS, SWEEP_CARD_TTL_MS } from "../src/sweep/cards";
import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import { renderGateNote } from "../src/slack/gate-note";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import { runReactionDoor, type GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { recordingViews } from "./helpers/recording-slack";
import { cardWords } from "./helpers/card-message";

/** Words that ask for a decision anywhere but Review: a reaction, or a typed reply. */
const GATE_WORDS = /✅|⛔|:white_check_mark:|:no_entry:|\breact\b|\bdrop N\b|\bdrop \d|`drop/i;

const CHANNEL = "D0MAYA";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";
const NOTE = "A group conversation brought *Tutor guide* up to date.";
const OPERATIONS = [{ toolName: SWEEP_SHARE_TOOL, input: { channel: "C0DESIGN", channel_name: "#plus-design", text: NOTE } }];

const cards = {
  "the DM sweep's raise card": raiseCard({
    when: "Yesterday",
    topic: "the warning colour",
    sources: ["Figma", "the code"],
    channel: "C0UNIVERSAL",
    to: "plus-universal",
  }).card,
  "a group DM's share card": sweepShareCard(OPERATIONS),
};

/** The labels on a card's buttons. */
function buttons(blocks: unknown[]): string[] {
  return (blocks as Array<{ type: string; elements?: Array<{ text?: { text: string } }> }>)
    .filter((b) => b.type === "actions")
    .flatMap((b) => (b.elements ?? []).map((e) => e.text?.text ?? ""));
}

describe("the share cards", () => {
  for (const [name, card] of Object.entries(cards)) {
    it(`${name} names no gate word, has no footer, and offers Review`, () => {
      const { text, blocks } = renderProposalCard(card);
      assert.equal(blocks, undefined, "a text card");
      assert.doesNotMatch(text, GATE_WORDS);
      assert.equal(card.footer, "", "Review is its only instruction");
      assert.doesNotMatch(text, /Press Review to approve/, "no shared footer either");
      const shown = proposalCardBlocks(text);
      assert.deepEqual(buttons(shown), ["Review"]);
      assert.doesNotMatch(JSON.stringify(shown), GATE_WORDS);
    });

    it(`${name} still shows the note it posts, whole`, () => {
      const { text } = renderProposalCard(card);
      const posts = String(card.operations[0]!.input.text);
      for (const line of posts.split("\n")) assert.ok(text.includes(line), `the card shows: ${line}`);
    });
  }

  it("the sweep's insert refusal names Review, and neither drop N nor ⛔", () => {
    assert.match(INSERT_CARD_REFUSAL, /Review/);
    assert.doesNotMatch(INSERT_CARD_REFUSAL, GATE_WORDS);
  });

  it("the insert refusal asks for the right wording in the thread, since Reject keeps no reason", () => {
    // Reject's reason is not kept on the card, so the refusal asks for the
    // right wording as a reply in the thread.
    assert.match(INSERT_CARD_REFUSAL, /Reject it in Review, then reply here with what it should say\./);
  });
});

// ── Closing a share card ─────────────────────────────────────────────────────

/** A share card as staged before this change: its text says ✅ and ⛔, and it
 *  carries no words of its own. */
const LEGACY: PendingProposal = {
  operations: OPERATIONS,
  toolName: SWEEP_SHARE_TOOL,
  input: OPERATIONS[0]!.input,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: THREAD,
  proposalTs: CARD_TS,
  proposalText:
    "**Sweep** — share what this conversation settled?\n\n" +
    "Nothing from here has left this group DM. ✅ posts exactly this note in #plus-design; ⛔ drops it.\n\n" +
    `In #plus-design:\n> ${NOTE}\n\n:warning: About to *post this note in #plus-design*:\nPress Review to approve it, ask for changes or reject it.`,
  requesterUserId: "",
  ttlMs: SWEEP_CARD_TTL_MS,
  confirmers: ["U2"],
  supersedeKey: SWEEP_SHARE_KEY,
};

const CURRENT: PendingProposal = { ...LEGACY, proposalText: renderProposalCard(cards["a group DM's share card"]).text, stated: SHARE_CARD_WORDS };

async function staged(proposal: PendingProposal): Promise<ThreadState> {
  const store = createInMemoryThreadState();
  await store.putProposal(proposal);
  return store;
}

function reviewDeps(threadState: ThreadState) {
  const delivery = recordingDelivery();
  const ran: GateVerdict[] = [];
  const notes: string[] = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: recordingViews({ alreadyOpen: ["V1"] }).client,
    delivery: () => delivery,
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async (_channel, _ts, message) => void notes.push(cardWords(message).note),
    restage: async () => {},
    revise: async () => {},
  };
  return { deps, delivery, ran, notes };
}

const decide = (decision: "confirm" | "cancel") => ({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", decision, note: "" });

async function react(threadState: ThreadState, glyph: string): Promise<GateVerdict[]> {
  const verdicts: GateVerdict[] = [];
  await runReactionDoor(
    { channel: CHANNEL, messageTs: CARD_TS, glyph, userId: "U2" },
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

describe("closing a share card", () => {
  it("Approve in Review posts exactly its note", async () => {
    const { deps, ran } = reviewDeps(await staged(CURRENT));
    await runReviewDecision(decide("confirm"), deps);
    assert.deepEqual(ran.map((v) => [v.outcome, v.decision]), [["won", "confirm"]]);
    assert.deepEqual(ran[0]!.execute?.operations, OPERATIONS);
  });

  it("Reject in Review posts nothing, and says so in the card's own words", async () => {
    const { deps, delivery, ran } = reviewDeps(await staged(CURRENT));
    await runReviewDecision(decide("cancel"), deps);
    assert.equal(ran[0]!.execute, undefined);
    assert.deepEqual(delivery.gateNotes.map(renderGateNote), ["Rejected, nothing posted."]);
  });

  it("a card posted before the move still closes from its ✅ or ⛔", async () => {
    const yes = await react(await staged(LEGACY), "white_check_mark");
    assert.deepEqual(yes.map((v) => [v.outcome, v.decision]), [["won", "confirm"]]);
    assert.deepEqual(yes[0]!.execute?.operations, OPERATIONS, "exactly the note it showed");

    const no = await react(await staged(LEGACY), "no_entry");
    assert.deepEqual(no.map((v) => [v.outcome, v.decision]), [["won", "cancel"]]);
    assert.equal(no[0]!.execute, undefined);
  });

  it("a card posted before the move closes from Review in the gate's shared words", async () => {
    const { deps, delivery, ran, notes } = reviewDeps(await staged(LEGACY));
    await runReviewDecision(decide("cancel"), deps);
    assert.deepEqual(ran.map((v) => [v.outcome, v.decision]), [["won", "cancel"]]);
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "cancel", rejected: {} }]);
    assert.deepEqual(notes, [":no_entry: Rejected by <@U2>"]);
  });
});
