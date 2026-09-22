// A DM card belongs to its thread, not the whole DM.
//
// Every unthreaded line of a DM resolves to ONE conversation, `"dm"` — that is
// how the bot remembers the chat — but each ask gets a reply thread of its own,
// and the card it stages is posted there. The pending card used to be read on
// the conversation, so the second ask picked up the first ask's card as its
// own, retired it as a revision, and a ✅ on the first card answered "replaced"
// on every press: the action could never run (live on r388, a
// `github_issue_update` card retired 15 s later by a `github_workflow_run` card
// staged from another thread).
//
// Every case here drives the real Turn and Gate on one in-memory store, and
// reads the pending card the way the Slack door does: on `cardThreadOf`.
import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, type GateSignal } from "../src/gate/index";
import { renderGateNote } from "../src/slack/gate-note";
import { cardThreadOf, runTurn, type TurnOutcome, type TurnRequest } from "../src/turn/index";
import { harness, request, type Harness } from "./helpers/turn-harness";

const DM = "D1";
const DM_CONVERSATION = "dm";
const ASK_A = "1700000000.000500";
const ASK_B = "1700000000.000600";

/** An unthreaded DM line: the whole DM's conversation, a thread of its own. */
const dmLine = (ts: string, text: string): TurnRequest =>
  request({
    channel: DM,
    surface: "assistant",
    threaded: false,
    conversationTs: DM_CONVERSATION,
    replyTs: ts,
    userMsgTs: ts,
    text,
  });

/** A reply typed inside an ask's thread: Slack names the thread, and in a DM
 *  that thread is the conversation too. */
const inThread = (threadTs: string, ts: string, text: string): TurnRequest =>
  request({
    channel: DM,
    surface: "assistant",
    threaded: true,
    conversationTs: threadTs,
    replyTs: threadTs,
    userMsgTs: ts,
    text,
  });

/** Run a turn with the pending card the Slack door would have read for it. */
async function turn(h: Harness, req: TurnRequest): Promise<TurnOutcome> {
  const pending = await h.threadState.getProposalByThread({
    channel: req.channel,
    thread: cardThreadOf(req),
  });
  return runTurn({ ...req, pending }, h.deps);
}

const CARD_A = {
  text: "Commenting on the issue and closing it.",
  toolCalls: [{ name: "notion_create", args: { title: "Card A" } }],
};
const CARD_B = {
  text: "Running the workflow.",
  toolCalls: [{ name: "notion_create", args: { title: "Card B" } }],
};

/** Two unthreaded asks, each staging its own card in its own thread. */
async function twoThreadsTwoCards(
  extra: Array<{ text?: string; toolCalls?: Array<{ name: string; args: Record<string, unknown> }> }> = [],
): Promise<{ h: Harness; cardA: string; cardB: string }> {
  const h = harness({ replies: [CARD_A, CARD_B, ...extra] });
  const a = await turn(h, dmLine(ASK_A, "comment on the issue and close it"));
  assert.equal(a.disposition, "staged");
  const b = await turn(h, dmLine(ASK_B, "run the render walk"));
  assert.equal(b.disposition, "staged");
  return { h, cardA: a.staged!.proposal.proposalTs, cardB: b.staged!.proposal.proposalTs };
}

test("a second DM ask stages its card without touching the first ask's card", async () => {
  const { h, cardA, cardB } = await twoThreadsTwoCards();
  assert.equal((await h.threadState.getProposalByTs(cardA)).state, "found");
  assert.equal((await h.threadState.getProposalByTs(cardB)).state, "found");
  // Each thread holds its own card.
  assert.equal((await h.threadState.getProposalByThread({ channel: DM, thread: ASK_A }))?.proposalTs, cardA);
  assert.equal((await h.threadState.getProposalByThread({ channel: DM, thread: ASK_B }))?.proposalTs, cardB);
});

test("a ✅ on the earlier DM card runs it, through both doors, and leaves the later card alone", async () => {
  for (const door of ["reaction", "button"] as const) {
    const { h, cardA, cardB } = await twoThreadsTwoCards();
    const signal: GateSignal =
      door === "reaction"
        ? { kind: "reaction", messageTs: cardA, channel: DM, thread: ASK_A, glyph: "white_check_mark", userId: "U1" }
        : { kind: "button", messageTs: cardA, decision: "confirm", userId: "U1" };

    const verdict = await resolveSignal(signal, { threadState: h.threadState });

    assert.equal(verdict.outcome, "won", door);
    assert.deepEqual(verdict.execute?.input, { title: "Card A" }, door);
    assert.equal((await h.threadState.getProposalByTs(cardB)).state, "found", door);
  }
});

test("a ✅ typed inside the earlier card's thread runs that card, and only that card", async () => {
  const { h, cardB } = await twoThreadsTwoCards();
  const outcome = await turn(h, inThread(ASK_A, "1700000000.000700", "✅"));

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(
    h.resolved.map((r) => [r.decision, r.executed]),
    [["confirm", true]],
  );
  assert.equal(h.provider.sends.length, 2, "the ✅ itself reached no model");
  assert.equal((await h.threadState.getProposalByTs(cardB)).state, "found");
});

test("a revision inside the same DM thread still supersedes that thread's card", async () => {
  const { h, cardA, cardB } = await twoThreadsTwoCards([
    { text: "Revised.", toolCalls: [{ name: "notion_create", args: { title: "Card A, revised" } }] },
  ]);
  const revised = await turn(h, inThread(ASK_A, "1700000000.000700", "make it close as not planned"));

  assert.equal(revised.disposition, "staged");
  assert.equal((await h.threadState.getProposalByTs(cardA)).state, "superseded");
  assert.equal(
    (await h.threadState.getProposalByThread({ channel: DM, thread: ASK_A }))?.proposalTs,
    revised.staged!.proposal.proposalTs,
  );
  // The other thread's card is nobody's to retire.
  assert.equal((await h.threadState.getProposalByTs(cardB)).state, "found");
});

// ── a gate emoji typed as a new, unthreaded DM line ─────────────────────────
//
// It sits in no card's thread. Today's behaviour is kept where it is safe —
// with one live card in the DM, that is the card it means — and where it is
// not, the turn asks rather than guesses: two cards, two different writes.

test("an unthreaded ✅ with one live card in the DM resolves that card", async () => {
  const h = harness({ replies: [CARD_A] });
  const a = await turn(h, dmLine(ASK_A, "comment on the issue and close it"));
  const cardA = a.staged!.proposal.proposalTs;

  const outcome = await turn(h, dmLine("1700000000.000800", "✅"));

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(
    h.resolved.map((r) => [r.toolName, r.decision, r.executed]),
    [["notion_create", "confirm", true]],
  );
  assert.equal((await h.threadState.getProposalByTs(cardA)).state, "none", "claimed");
});

test("an unthreaded ✅ with several live cards in the DM asks which, and runs nothing", async () => {
  const { h, cardA, cardB } = await twoThreadsTwoCards();
  const outcome = await turn(h, dmLine("1700000000.000800", "✅"));

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved, []);
  assert.deepEqual(h.delivery.gateNotes, [{ kind: "which-card", count: 2 }]);
  // And what the person reads says so, and points them at the card.
  const line = renderGateNote({ kind: "which-card", count: 2 });
  assert.match(line, /2 proposals are waiting/);
  assert.match(line, /nothing was executed/);
  assert.equal((await h.threadState.getProposalByTs(cardA)).state, "found");
  assert.equal((await h.threadState.getProposalByTs(cardB)).state, "found");
});

test("an unthreaded ✅ with no card anywhere in the DM goes to the model", async () => {
  const h = harness({ replies: [{ text: "Nothing is waiting on you." }] });
  const outcome = await turn(h, dmLine("1700000000.000800", "✅"));

  assert.equal(outcome.disposition, "answered");
  assert.equal(h.provider.sends.length, 1);
  assert.deepEqual(h.delivery.gateNotes, []);
});
