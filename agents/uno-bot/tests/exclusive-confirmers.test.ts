// A card that names exactly who may confirm it: its own set, with the
// deployment's standing confirmers left out. Every other card keeps today's
// rule — its own set plus the standing confirmers — so the prefactor changes
// nothing for a card that does not ask for it.
//
// Driven through `resolveSignal` against the in-memory ThreadState, as the
// confirmation-paths suite drives every door.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, type GateSignal } from "../src/gate/index";
import { createInMemoryThreadState, inheritedTerms, type PendingProposal } from "../src/thread-state/index";

const CHANNEL = "C0TEAM";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";
const OWNER = "U0OWNER001";
const BILL = "U0BILL0001";
const STANDING = ["U0STAND001"];

function card(over: Partial<PendingProposal> = {}): PendingProposal {
  return {
    toolName: "notion_create",
    input: { title: "x" },
    channel: CHANNEL,
    threadTs: THREAD,
    replyTs: THREAD,
    userMsgTs: "1700000000.000190",
    proposalTs: CARD_TS,
    proposalText: "(the card)",
    requesterUserId: OWNER,
    confirmers: [OWNER, BILL],
    ...over,
  };
}

const tick = (userId: string): GateSignal => ({
  kind: "reaction",
  messageTs: CARD_TS,
  channel: CHANNEL,
  thread: THREAD,
  glyph: "white_check_mark",
  userId,
});

async function verdictFor(proposal: PendingProposal, userId: string) {
  const threadState = createInMemoryThreadState();
  await threadState.putProposal(proposal);
  return resolveSignal(tick(userId), { threadState, standingConfirmers: STANDING });
}

describe("an exclusive confirmer set", () => {
  it("refuses a standing confirmer's ✅ and names only the card's own people", async () => {
    const verdict = await verdictFor(card({ exclusiveConfirmers: true }), STANDING[0]!);
    assert.equal(verdict.outcome, "none");
    assert.deepEqual(verdict.post?.note, { kind: "not-a-confirmer", confirmers: [OWNER, BILL], userId: STANDING[0] });
  });

  it("admits a person the card names", async () => {
    const verdict = await verdictFor(card({ exclusiveConfirmers: true }), BILL);
    assert.equal(verdict.outcome, "won");
  });

  it("is inherited by the revision that replaces the card", () => {
    assert.deepEqual(inheritedTerms(card({ exclusiveConfirmers: true })), {
      confirmers: [OWNER, BILL],
      exclusiveConfirmers: true,
    });
  });
});

describe("a card without one keeps today's rule", () => {
  it("admits a standing confirmer beside the card's own people", async () => {
    const verdict = await verdictFor(card(), STANDING[0]!);
    assert.equal(verdict.outcome, "won");
  });

  it("inherits no exclusive flag", () => {
    assert.deepEqual(inheritedTerms(card()), { confirmers: [OWNER, BILL] });
  });
});
