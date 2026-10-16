// Revision or separate proposal, on the usage record (#1320), through the turn.
//
// Every card a turn stages says on its staged row which it was — a revision
// of a waiting card or a separate proposal — and, when it undid the call the
// thread's previous card was staged under, names that card as the one it
// corrected. Ids only: no text of the ask or the card. The lead reads from it
// how often the bot tells matters apart.
//
// Real turns on one in-memory store (one thread) and the harness's in-memory
// proposal event log, handed the thread's live cards as `slack/events.ts`
// hands them.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type TurnRequest } from "../src/turn/index";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness, request, REF, type Harness } from "./helpers/turn-harness";

async function turn(h: Harness, over: Partial<TurnRequest>) {
  const liveCards = await h.threadState.getProposalsByThread(REF);
  return runTurn(request({ pending: liveCards[0] ?? null, liveCards, ...over }), h.deps);
}

function call(name: string, args: Record<string, unknown>): ScriptedReply {
  return { text: "Here's the card.", toolCalls: [{ name, args: { ...args } }] };
}

/** Name the card a scripted call revises once its ts is known (the fake
 *  replays replies by reference). */
function naming(reply: ScriptedReply, cardTs: string): void {
  reply.toolCalls![0]!.args!.revises_card = cardTs;
}

/** A card's staged row. */
function stagedRow(h: Harness, proposalTs: string) {
  const row = h.proposalEvents.events().find((e) => e.proposalId === proposalTs && e.event === "staged");
  assert.ok(row, `card ${proposalTs} has a staged row`);
  return row;
}

const PRD_A = { surface: "prd", title: "Backup tutor matching", summary: "Match a backup tutor when one calls off." };
const PRD_B = { surface: "prd", title: "Session reflections", summary: "A shorter reflection form." };

test("a separate proposal's staged row says it was staged as one, correcting nothing", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "different idea — new PRD for session reflections", userMsgTs: "1700000000.000300" });

  for (const staged of [first, second]) {
    const row = stagedRow(h, staged.staged!.proposal.proposalTs);
    assert.equal(row.stagedAs, "separate");
    assert.equal(row.revisesProposalId, null);
    assert.equal(row.correctsProposalId, null);
  }
});

test("a revision's staged row says it was staged as one, naming the card it superseded", async () => {
  const edit = call("notion_create", { ...PRD_A, title: "Backup tutors" });
  const h = harness({ replies: [call("notion_create", PRD_A), edit] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const a = first.staged!.proposal.proposalTs;
  naming(edit, a);
  const second = await turn(h, { text: "make the title shorter", userMsgTs: "1700000000.000300" });

  const row = stagedRow(h, second.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "revision");
  assert.equal(row.revisesProposalId, a);
  assert.equal(row.correctsProposalId, null, "revising the only card corrects nothing");
});

test("a separate proposal moved into the card beside it is a correction, recorded against the separate card", async () => {
  // "that was meant to update the first one": the next card revises the card
  // the separate one was staged beside.
  const fold = call("notion_create", { ...PRD_A, summary: "Match a backup tutor; shorter reflections too." });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), fold] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and fold in shorter reflections", userMsgTs: "1700000000.000300" });
  const a = first.staged!.proposal.proposalTs;
  const b = second.staged!.proposal.proposalTs;
  naming(fold, a);
  const third = await turn(h, { text: "that was meant to update the first one", userMsgTs: "1700000000.000400" });

  const row = stagedRow(h, third.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "revision");
  assert.equal(row.revisesProposalId, a);
  assert.equal(row.correctsProposalId, b);
});

test("a separate proposal right after a revision is a correction, recorded against the revision", async () => {
  const edit = call("notion_create", PRD_B);
  const h = harness({
    replies: [call("notion_create", PRD_A), edit, call("notion_create", { ...PRD_B, title: "Reflections" })],
  });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  naming(edit, first.staged!.proposal.proposalTs);
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  const third = await turn(h, { text: "no — that should be its own card", userMsgTs: "1700000000.000400" });

  const row = stagedRow(h, third.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "separate");
  assert.equal(row.correctsProposalId, second.staged!.proposal.proposalTs);
});

test("revising the separate card just staged is an edit of it, not a correction", async () => {
  const edit = call("notion_create", { ...PRD_B, title: "Reflections" });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), edit] });
  await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  naming(edit, second.staged!.proposal.proposalTs);
  const third = await turn(h, { text: "shorter title on that one", userMsgTs: "1700000000.000400" });

  const row = stagedRow(h, third.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "revision");
  assert.equal(row.correctsProposalId, null);
});

test("a card sent back with Needs changes is revised by the Review's call, not corrected", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), call("notion_create", { ...PRD_A, summary: "Shorter." })] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  const a = first.staged!.proposal;
  await h.threadState.putProposal({ ...a, revising: { userId: "U1", at: Date.now() } });
  const liveCards = await h.threadState.getProposalsByThread(REF);
  const third = await runTurn(
    request({
      text: "<@U1> asked for changes: shorter summary",
      userMsgTs: "1700000000.000400",
      pending: liveCards.find((p) => p.proposalTs === a.proposalTs)!,
      liveCards,
    }),
    h.deps,
  );

  const row = stagedRow(h, third.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "revision");
  assert.equal(row.revisesProposalId, a.proposalTs);
  assert.equal(row.correctsProposalId, null);
});

test("no text of the ask or the card is on the record", async () => {
  const fold = call("notion_create", PRD_A);
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), fold] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  await turn(h, { text: "and fold in shorter reflections", userMsgTs: "1700000000.000300" });
  naming(fold, first.staged!.proposal.proposalTs);
  await turn(h, { text: "that was meant to update the first one", userMsgTs: "1700000000.000400" });

  const recorded = JSON.stringify(h.proposalEvents.events());
  for (const words of ["backup tutor", "reflections", "meant to update", PRD_A.title, PRD_B.summary]) {
    assert.ok(!recorded.toLowerCase().includes(words.toLowerCase()), `"${words}" is not stored`);
  }
});
