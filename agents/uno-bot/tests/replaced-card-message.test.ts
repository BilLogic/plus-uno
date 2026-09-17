// The sentence a person reads after their ✅ lands on a replaced card.
//
// WHY THIS FILE EXISTS (#583). The supersede work (#573/#579) was covered at
// two seams and both were right: the store's conformance suite proved
// `putProposal` marks the predecessor superseded, and `confirmation-paths`
// proved Gate answers a superseded card with `SUPERSEDED_POST`. Five reviews,
// 692 tests and two ratchets passed — and in `#uno-bot-sandbox` a person who
// revised a card and then ✅'d the old one still got the vaguer pointer text.
//
// Nothing between the two seams was ever driven. The staging path RETIRED the
// pending card by claiming it — which deletes the record — before staging the
// replacement, so by the time the person reacted there was nothing left to
// report as replaced. Both seam tests set their state up directly and neither
// of them could see it.
//
// So every case here drives the whole flow through the real Turn — stage,
// feedback, revised stage — and then asks Gate what the person is told, on
// both the reaction door and the button door. The assertion is the WORDING,
// not only the absence of an execution: "nothing ran" was already true while
// the message was wrong.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SUPERSEDED_POST,
  resolveSignal,
  type GateSignal,
  type GateVerdict,
} from "../src/gate/index";
import { runTurn, type TurnOutcome } from "../src/turn/index";
import type { PendingProposal } from "../src/thread-state/index";
import { CHANNEL, CONVERSATION, REF, harness, request } from "./helpers/turn-harness";

const USER = "U1";

/** The two model replies the flow needs: a card, then its revision. */
const REPLIES = [
  {
    text: "I'll file a Roadmap card for the reflection redesign.",
    toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
  },
  {
    text: "Narrowing it to tutors — here is the revised card.",
    toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign, tutors only" } }],
  },
];

interface Flow {
  h: ReturnType<typeof harness>;
  /** The card the person pushed back on. */
  originalTs: string;
  /** The card the revision put up in its place. */
  revisedTs: string;
}

/**
 * Stage a card, answer it with feedback rather than a click, and let the model
 * stage a revision — the live reproduction from #583, turn for turn.
 *
 * The second turn carries `pending`, which is the whole point: the door that
 * feeds Turn in production reads the thread's card and hands it over, and it
 * is that argument the staging path used to consume.
 */
async function stagedThenRevised(): Promise<Flow> {
  const h = harness({ replies: REPLIES });

  const first: TurnOutcome = await runTurn(
    request({ text: "file a card for the reflection redesign" }),
    h.deps,
  );
  assert.equal(first.disposition, "staged", "the first turn staged a card");
  const originalTs = first.staged!.proposal.proposalTs;

  // What the Slack door would read and pass in on the next message.
  const pending = await h.threadState.getProposalByThread(REF);
  assert.equal(pending?.proposalTs, originalTs, "the thread is holding the first card");

  const second: TurnOutcome = await runTurn(
    request({
      text: "not quite — make it about tutors only",
      userMsgTs: "1700000000.000300",
      pending: pending as PendingProposal,
    }),
    h.deps,
  );
  assert.equal(second.disposition, "staged", "the feedback turn staged a revision");
  const revisedTs = second.staged!.proposal.proposalTs;
  assert.notEqual(revisedTs, originalTs);

  return { h, originalTs, revisedTs };
}

/** A reaction placed on a given message — ✅ unless the case says otherwise. */
const reactionOn = (messageTs: string, glyph = "white_check_mark"): GateSignal => ({
  kind: "reaction",
  messageTs,
  channel: CHANNEL,
  thread: CONVERSATION,
  glyph,
  userId: USER,
});

/** The card's own ✅ button, pressed. */
const buttonOn = (messageTs: string): GateSignal => ({
  kind: "button",
  messageTs,
  decision: "confirm",
  userId: USER,
});

test("a ✅ on the card a revision replaced is told it was replaced, through both doors", async () => {
  for (const door of ["reaction", "button"] as const) {
    const { h, originalTs } = await stagedThenRevised();
    const signal = door === "reaction" ? reactionOn(originalTs) : buttonOn(originalTs);

    const verdict: GateVerdict = await resolveSignal(signal, { threadState: h.threadState });

    // The sentence, which is what the ticket is about. The pointer text — "it
    // is not on the proposal I am holding" — is a true thing to say about a
    // reaction that missed, and the wrong thing to say to someone whose card
    // was replaced out from under them.
    assert.equal(verdict.post?.text, SUPERSEDED_POST, door);
    assert.equal(verdict.outcome, "stale", door);
    // And still the guarantee #573 bought: the input they pushed back on does
    // not run.
    assert.equal(verdict.execute, undefined, door);
  }
});

test("a ⛔ on the replaced card is told the same, and leaves the revision live", async () => {
  const { h, originalTs, revisedTs } = await stagedThenRevised();

  const verdict = await resolveSignal(reactionOn(originalTs, "no_entry"), {
    threadState: h.threadState,
  });

  assert.equal(verdict.post?.text, SUPERSEDED_POST);
  assert.equal(verdict.execute, undefined);
  // A decision about a retired card is not a decision about the live one: the
  // person still has something to confirm.
  assert.equal((await h.threadState.getProposalByTs(revisedTs)).state, "found");
  assert.equal((await h.threadState.getProposalByThread(REF))?.proposalTs, revisedTs);
  assert.notEqual(originalTs, revisedTs);
});

test("the revised card still resolves normally, through both doors", async () => {
  // The other half of the guarantee: approving a LIVE card is untouched by any
  // of this. A retirement mechanism that also quietened the newest card would
  // leave the thread with nothing anyone can click.
  for (const door of ["reaction", "button"] as const) {
    const { h, revisedTs } = await stagedThenRevised();
    const signal = door === "reaction" ? reactionOn(revisedTs) : buttonOn(revisedTs);

    const verdict = await resolveSignal(signal, { threadState: h.threadState });

    assert.equal(verdict.outcome, "won", door);
    assert.equal(verdict.decision, "confirm", door);
    assert.equal(verdict.post?.text, "Got it — kicking that off.", door);
    assert.deepEqual(verdict.execute?.input, { title: "Reflection redesign, tutors only" }, door);
  }
});

test("a card nobody revised is consumed by its ✅, exactly as before", async () => {
  // Staging is what retires a card. A turn that only answers a question leaves
  // the thread's card alone, and the ✅ that follows executes it — the path the
  // gate exists to serve, and the one a retirement bug would take away.
  const h = harness({ replies: REPLIES });
  const first = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
  const cardTs = first.staged!.proposal.proposalTs;

  const verdict = await resolveSignal(reactionOn(cardTs), { threadState: h.threadState });

  assert.equal(verdict.outcome, "won");
  assert.deepEqual(verdict.execute?.input, { title: "Reflection redesign" });
  // Consumed: the claim took the record, so a second ✅ finds nothing to run.
  assert.equal((await h.threadState.getProposalByTs(cardTs)).state, "none");
});

test("a ✅ that misses every card still gets the pointer, and executes nothing", async () => {
  // The pointer branch is the INDEPENDENT guarantee that a by-thread hit never
  // executes — a signal whose `messageTs` is not the found card's resolves
  // nothing, whatever the by-ts lookup said. It has to keep its own coverage
  // here, because the superseded early return now answers the case it was
  // most often seen on and could otherwise look dead.
  const h = harness({ replies: REPLIES });
  const first = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
  const cardTs = first.staged!.proposal.proposalTs;

  // A reaction on an ordinary message in the thread — never a card, so the
  // by-ts lookup has nothing and the by-thread lookup finds the live one.
  const verdict = await resolveSignal(reactionOn("1700000000.000777"), {
    threadState: h.threadState,
  });

  assert.equal(verdict.outcome, "none");
  assert.equal(verdict.execute, undefined);
  assert.match(verdict.post?.text ?? "", /not on the proposal I am holding/);
  assert.match(verdict.post?.text ?? "", /notion_create/);
  // And the card it pointed at is still there to be clicked.
  assert.equal((await h.threadState.getProposalByTs(cardTs)).state, "found");
});
