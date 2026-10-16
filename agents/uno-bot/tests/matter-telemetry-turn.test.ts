// Revision or separate proposal, on the usage record (#1320), through the turn.
//
// Every card a turn stages says on its staged row which it was — a revision
// of a waiting card or a separate proposal — and, when it undid the call the
// card the thread's PREVIOUS TURN staged was made under, names that card as
// the one it corrected (Bill: "require overlap"):
//
//   • separate → revision: that card was staged separate, and this one
//     revises a different card — it was meant as this change, so it is
//     withdrawn in the same turn, superseded by the revision, and the note
//     above the new card says so (story 9);
//   • revision → separate: that card was a revision, and this separate one
//     is aimed at the same Notion page or GitHub issue.
//
// Ids only: no text of the ask or the card. The lead reads from it how often
// the bot tells matters apart.
//
// Real turns on one in-memory store (one thread) and the harness's in-memory
// proposal event log, handed the thread's live cards as `slack/events.ts`
// hands them.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type TurnRequest } from "../src/turn/index";
import { resolveSignal } from "../src/gate/index";
import { renderGateNote } from "../src/slack/gate-note";
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

test("fixing a wrong separate call takes one message: the mistaken card is withdrawn, superseded by the revision, and the note says so", async () => {
  const fold = call("notion_create", { ...PRD_A, summary: "Match a backup tutor; shorter reflections too." });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), fold] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and fold in shorter reflections", userMsgTs: "1700000000.000300" });
  const a = first.staged!.proposal.proposalTs;
  const b = second.staged!.proposal.proposalTs;
  naming(fold, a);
  const third = await turn(h, { text: "that was meant to update the first one", userMsgTs: "1700000000.000400" });
  const revised = third.staged!.proposal.proposalTs;

  assert.deepEqual((await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs), [revised], "one card waits");
  assert.equal((await h.threadState.getProposalByTs(b)).state, "superseded");
  assert.ok(h.proposalEvents.events().some((e) => e.proposalId === b && e.event === "superseded"), "on the record as superseded");
  assert.deepEqual(h.delivery.gateNotes.at(-1), { kind: "revised", replaced: "Backup tutor matching", withdrawn: "Session reflections" });
  assert.match(renderGateNote(h.delivery.gateNotes.at(-1)!), /\*Session reflections\*/, "the reply names the card withdrawn");

  // Its buttons say what replaced it, and run nothing.
  const pressed = await resolveSignal({ kind: "button", messageTs: b, decision: "confirm", userId: "U1" }, { threadState: h.threadState });
  assert.equal(pressed.outcome, "stale");
  assert.deepEqual(pressed.post?.note, { kind: "superseded", by: "Backup tutor matching" });
});

test("an edit of the first card right after a separate one is recorded as a correction, but leaves that card waiting unless the ask says it was the wrong call", async () => {
  const edit = call("notion_create", { ...PRD_A, title: "Backup tutors" });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), edit] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  naming(edit, first.staged!.proposal.proposalTs);
  const third = await turn(h, { text: "change the title of the backup tutor one", userMsgTs: "1700000000.000400" });

  const b = second.staged!.proposal.proposalTs;
  assert.equal(stagedRow(h, third.staged!.proposal.proposalTs).correctsProposalId, b, "counted, as the ids show it");
  assert.equal((await h.threadState.getProposalByTs(b)).state, "found", "the reflections card still waits");
  assert.deepEqual(h.delivery.gateNotes.at(-1), { kind: "revised", replaced: "Backup tutor matching" });
});

test("a revision of another card is no correction when the separate card was not staged by the turn just before", async () => {
  const fold = call("notion_create", { ...PRD_A, summary: "Shorter." });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), { text: "Both are waiting." }, fold] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  await turn(h, { text: "what's waiting?", userMsgTs: "1700000000.000400" });
  naming(fold, first.staged!.proposal.proposalTs);
  const fourth = await turn(h, { text: "shorten the first one", userMsgTs: "1700000000.000500" });

  assert.equal(stagedRow(h, fourth.staged!.proposal.proposalTs).correctsProposalId, null);
  assert.equal((await h.threadState.getProposalByTs(second.staged!.proposal.proposalTs)).state, "found", "the other card still waits");
});

test("a separate proposal right after a revision corrects nothing when it shares no page or issue with it", async () => {
  // Without overlap, a new idea after a revision is just a new idea.
  const edit = call("notion_create", PRD_B);
  const h = harness({
    replies: [call("notion_create", PRD_A), edit, call("notion_create", { ...PRD_B, title: "Reflections" })],
  });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  naming(edit, first.staged!.proposal.proposalTs);
  await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  const third = await turn(h, { text: "no — that should be its own card", userMsgTs: "1700000000.000400" });

  const row = stagedRow(h, third.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "separate");
  assert.equal(row.correctsProposalId, null);
});

test("a card on the page a just-staged revision updates is a revision of it, whatever the model called it, so it corrects nothing", async () => {
  // The overlap a revision → separate correction needs is the one the
  // same-target rule already turns into a revision.
  const page = "https://www.notion.so/plus/Backup-tutors-0123456789abcdef0123456789abcdef";
  const edit = call("notion_update", { page_url: page, title: "Backup tutors" });
  const h = harness({
    replies: [call("notion_update", { page_url: page, title: "Backup tutor matching" }), edit, call("notion_update", { page_url: page, title: "Tutor backups" })],
  });
  const first = await turn(h, { text: "retitle the backup tutors page" });
  naming(edit, first.staged!.proposal.proposalTs);
  const second = await turn(h, { text: "shorter", userMsgTs: "1700000000.000300" });
  const third = await turn(h, { text: "no — make that its own card", userMsgTs: "1700000000.000400" });

  const row = stagedRow(h, third.staged!.proposal.proposalTs);
  assert.equal(row.stagedAs, "revision");
  assert.equal(row.revisesProposalId, second.staged!.proposal.proposalTs);
  assert.equal(row.correctsProposalId, null);
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
