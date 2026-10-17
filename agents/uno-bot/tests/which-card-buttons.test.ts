// The "which one?" buttons (#1319), pressed.
//
// A decision that named no card, with several waiting, is answered with
// "Approve which one?" and one button per card (`tests/which-card-turn.test.ts`
// drives the asking). Each button is that card's own ✅ or ⛔, pressed from the
// question: it goes through the button door against that card alone, so the
// other cards stay live. The question's buttons lapse on the card rule, 24
// weekday hours after it was asked. And a press on a card a revision
// replaced names the card that replaced it — with several live cards, "the
// newest card" may be the wrong one (story 18).
//
// Cards are staged by real turns on the in-memory store; the presses run the
// real doors on the recording Delivery.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type GateNote, type TurnRequest } from "../src/turn/index";
import { runButtonDoor, type CardMessage } from "../src/slack/button-door";
import { renderGateNote } from "../src/slack/gate-note";
import { runWhichCardDoor, whichCardMessage, whichPressOf } from "../src/slack/which-card";
import { cardExpiresAt } from "../src/card-expiry";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness, request, REF, CHANNEL, type Harness } from "./helpers/turn-harness";
import { createInMemoryThreadState } from "../src/thread-state/index";
import { runReactionDoor } from "../src/gate/index";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

async function turn(h: Harness, over: Partial<TurnRequest>) {
  const liveCards = await h.threadState.getProposalsByThread(REF);
  return runTurn(request({ pending: liveCards[0] ?? null, liveCards, ...over }), h.deps);
}

function call(name: string, args: Record<string, unknown>): ScriptedReply {
  return { text: "Here's the card.", toolCalls: [{ name, args: { ...args } }] };
}

const PRD_A = { surface: "prd", title: "Backup tutor matching", summary: "Match a backup tutor when one calls off." };
const PRD_B = { surface: "prd", title: "Session reflections", summary: "A shorter reflection form." };

/** The question's own message ts: when it was asked. */
const ASKED_AT_MS = Date.UTC(2026, 9, 14, 15, 0); // a Wednesday, 11:00 ET
const QUESTION_TS = `${ASKED_AT_MS / 1000}.000100`;

/** Two cards in the thread, and the "Approve which one?" a typed ✅ asked. */
async function asked(h: Harness): Promise<{ a: string; b: string; note: Extract<GateNote, { kind: "which-card" }> }> {
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  await turn(h, { text: "✅", userMsgTs: "1700000000.000400" });
  const note = h.delivery.gateNotes.at(-1);
  assert.equal(note?.kind, "which-card");
  return { a: first.staged!.proposal.proposalTs, b: second.staged!.proposal.proposalTs, note: note as Extract<GateNote, { kind: "which-card" }> };
}

type Button = { type: string; action_id: string; value: string; text: { text: string } };
const buttonsOf = (message: CardMessage): Button[] =>
  ((message.blocks as Array<{ type: string; elements?: Button[] }>).find((b) => b.type === "actions")?.elements ?? []);

/** Press one of the question's buttons, as `slack/interactive.ts` does. */
async function press(h: Harness, question: CardMessage, cardTs: string, at: number) {
  const button = buttonsOf(question).find((b) => b.value === cardTs)!;
  const parsed = whichPressOf(button.action_id, button.value)!;
  const cardEdits: Array<{ ts: string; message: CardMessage }> = [];
  const questionEdits: CardMessage[] = [];
  const ephemerals: string[] = [];
  await runWhichCardDoor(
    { channel: CHANNEL, questionTs: QUESTION_TS, question, cardTs: parsed.cardTs, decision: parsed.decision, userId: "U1" },
    {
      threadState: h.threadState,
      delivery: () => h.delivery,
      applyVerdict: (verdict) => h.deps.applyVerdict(verdict).then(() => {}),
      replyEphemeral: async (text) => void ephemerals.push(text),
      restage: async () => {},
      now: () => at,
      editCard: async (ts, message) => void cardEdits.push({ ts, message }),
      replaceQuestion: async (message) => void questionEdits.push(message),
    },
  );
  return { cardEdits, questionEdits, ephemerals };
}

async function live(h: Harness): Promise<string[]> {
  return (await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs).sort();
}

test("the question lists each card by headline and gives it a short numbered button carrying its card", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);
  const message = whichCardMessage(note);

  assert.equal(messageBlocksRefusal(message.blocks), null, "Slack takes it");
  const buttons = buttonsOf(message);
  // A headline is too long for a button Slack draws at its own width: the
  // headlines go in the question, numbered, and each button names its number.
  assert.deepEqual(buttons.map((x) => [x.text.text, x.value]), [["Approve 1", b], ["Approve 2", a]]);
  const section = (message.blocks as Array<{ type: string; text?: { text: string } }>).find((x) => x.type === "section");
  assert.match(section?.text?.text ?? "", /\n1\. \*Session reflections\*\n2\. \*Backup tutor matching\*$/);
  assert.equal(new Set(buttons.map((x) => x.action_id)).size, 2, "unique action ids");
  assert.match(message.text, /^Approve which one\?/);
});

test("pressing one card's button approves that card only; the other stays live", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);

  const { cardEdits, questionEdits } = await press(h, whichCardMessage(note), a, ASKED_AT_MS + 60_000);

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["confirm", true]]);
  assert.deepEqual(await live(h), [b], "card A was claimed, card B is still waiting");
  assert.deepEqual(cardEdits.map((e) => e.ts), [a], "the card decided is the one edited");
  // The question keeps a button only for the card still waiting, still named
  // by that card's number in the list, and says no deadline.
  assert.deepEqual(buttonsOf(questionEdits.at(-1)!).map((x) => [x.text.text, x.value]), [["Approve 1", b]]);
  assert.doesNotMatch(JSON.stringify(questionEdits.at(-1)!.blocks), /Expires/);
});

test("a press whose card cannot be read afterwards keeps that card's button: a failed read is no answer", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, note } = await asked(h);
  // The store answers the door, then fails the read that follows the press.
  const store = h.threadState;
  let claimed = false;
  const claim = store.claimProposal.bind(store);
  const read = store.getProposalByTs.bind(store);
  store.claimProposal = async (...args) => {
    claimed = true;
    return claim(...args);
  };
  store.getProposalByTs = async (ts) => (claimed ? Promise.reject(new Error("store unavailable")) : read(ts));

  const { questionEdits } = await press(h, whichCardMessage(note), a, ASKED_AT_MS + 60_000);

  assert.deepEqual(questionEdits, [], "the question is left with every button");
});

test("the question's buttons lapse 24 weekday hours after it was asked, without saying when", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);

  const late = cardExpiresAt(ASKED_AT_MS) + 1;
  const asking = whichCardMessage(note);
  // The deadline is enforced (Thursday 11:00 ET, 24 weekday hours after
  // Wednesday's) but not shown: neither the text copy nor the blocks say it.
  assert.doesNotMatch(asking.text, /Expires/);
  assert.doesNotMatch(JSON.stringify(asking.blocks), /Expires|<!date/);
  const { ephemerals, questionEdits, cardEdits } = await press(h, asking, a, late);

  assert.deepEqual(h.resolved, [], "nothing ran");
  assert.deepEqual(await live(h), [a, b].sort());
  assert.deepEqual(cardEdits, []);
  assert.match(ephemerals[0] ?? "", /expired/i);
  assert.deepEqual(buttonsOf(questionEdits.at(-1)!), [], "the lapsed question keeps no buttons");
  assert.doesNotMatch(JSON.stringify(questionEdits.at(-1)!.blocks), /Expires/, "nor a deadline");
});

/** The card's own ✅ / ⛔, pressed on the card rather than the question. */
async function pressCard(h: Harness, cardTs: string, decision: "confirm" | "cancel") {
  await runButtonDoor(
    { channel: CHANNEL, messageTs: cardTs, decision, userId: "U1" },
    {
      threadState: h.threadState,
      delivery: () => h.delivery,
      applyVerdict: (verdict) => h.deps.applyVerdict(verdict).then(() => {}),
      replyEphemeral: async () => {},
      replaceCard: async () => {},
      restage: async () => {},
    },
  );
}

const redraws = (h: Harness) => h.delivery.calls.flatMap((c) => (c.kind === "redraw-which" ? [c.question] : []));
const sectionOf = (message: CardMessage) =>
  (message.blocks as Array<{ type: string; text?: { text: string } }>).find((x) => x.type === "section")?.text?.text ?? "";

test("the question redrawn with a card decided strikes that card's line and drops its button, keeping every number", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);

  const one = whichCardMessage(note, [b]);
  assert.equal(messageBlocksRefusal(one.blocks), null, "Slack takes it");
  assert.deepEqual(buttonsOf(one).map((x) => [x.text.text, x.value]), [["Approve 2", a]], "card 2 is still card 2");
  assert.match(sectionOf(one), /\n~1\. Session reflections~\n2\. \*Backup tutor matching\*$/);

  const all = whichCardMessage(note, [a, b]);
  assert.deepEqual(buttonsOf(all), []);
  assert.match(JSON.stringify(all.blocks), /Decided\./);
});

/**
 * A thread on a clock the cases move, so the cards, the question's record
 * and the presses all read one time: the question is asked at `QUESTION_TS`.
 */
function clocked(replies: ScriptedReply[]) {
  const clock = { now: ASKED_AT_MS - 60_000 };
  const threadState = createInMemoryThreadState({ now: () => clock.now });
  const h = harness({ replies, threadState, now: () => clock.now });
  return { h, clock };
}

/** Asked as the turn asks it, and kept as the turn keeps it, under the ts
 *  Slack gave the question's message. */
async function askedAndKept(h: Harness) {
  const got = await asked(h);
  await h.threadState.putWhichQuestion({ questionTs: QUESTION_TS, channel: CHANNEL, decision: got.note.decision, cards: got.note.cards, decided: [] });
  return got;
}

test("a card's own button, pressed while the question is open, drops that card from the question", async () => {
  const { h } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b } = await askedAndKept(h);

  await pressCard(h, a, "confirm");

  assert.deepEqual(redraws(h).map((q) => [q.questionTs, q.cards.map((c) => c.ts), q.decided]), [[QUESTION_TS, [b, a], [a]]]);
  // Pressed again, nothing more is redrawn: the record has it already.
  await pressCard(h, a, "confirm");
  assert.equal(redraws(h).length, 1);
});

test("a press on the question redraws it once, from its record, and a later decision elsewhere finishes it", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, note } = await askedAndKept(h);
  clock.now = ASKED_AT_MS + 60_000;

  const { questionEdits } = await press(h, whichCardMessage(note), a, clock.now);

  assert.equal(questionEdits.length, 1, "one edit of the question, not one per door");
  assert.deepEqual(questionEdits[0], whichCardMessage(note, [a]));
  assert.deepEqual(redraws(h), [], "its own question is redrawn where it was pressed");

  await pressCard(h, b, "confirm");
  assert.deepEqual(redraws(h).map((q) => [q.questionTs, q.decided]), [[QUESTION_TS, [a, b]]]);
});

test("a card that lapsed before the question, pressed there, stays off it when another door later decides a card", async () => {
  // Card A is staged a day before the question, so it lapses first: Tuesday
  // 11:00 ET against a question asked Wednesday 10:00 ET.
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const asked = Date.UTC(2026, 9, 14, 14, 0);
  const questionTs = `${asked / 1000}.000100`;
  clock.now = Date.UTC(2026, 9, 13, 15, 0);
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  clock.now = asked;
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  await turn(h, { text: "✅", userMsgTs: "1700000000.000400" });
  const note = h.delivery.gateNotes.at(-1) as Extract<GateNote, { kind: "which-card" }>;
  await h.threadState.putWhichQuestion({ questionTs, channel: CHANNEL, decision: note.decision, cards: note.cards, decided: [] });
  const a = first.staged!.proposal.proposalTs;
  const b = second.staged!.proposal.proposalTs;

  // Wednesday 12:00 ET: A has lapsed, the question has not.
  clock.now = Date.UTC(2026, 9, 14, 16, 0);
  const questionEdits: CardMessage[] = [];
  await runWhichCardDoor(
    { channel: CHANNEL, questionTs, question: whichCardMessage(note), cardTs: a, decision: "confirm", userId: "U1" },
    {
      threadState: h.threadState,
      delivery: () => h.delivery,
      applyVerdict: (verdict) => h.deps.applyVerdict(verdict).then(() => {}),
      replyEphemeral: async () => {},
      restage: async () => {},
      now: () => clock.now,
      editCard: async () => {},
      replaceQuestion: async (message) => void questionEdits.push(message),
    },
  );
  assert.deepEqual(h.resolved, [], "nothing ran");
  assert.deepEqual(questionEdits, [whichCardMessage(note, [a])], "marked on the question's record, and redrawn from it");

  // B, decided by a reaction on its card, redraws the question from the record.
  await runReactionDoor(
    { channel: CHANNEL, messageTs: b, glyph: "white_check_mark", userId: "U1" },
    {
      threadState: h.threadState,
      delivery: () => h.delivery,
      threadRootOf: async () => REF.thread,
      botUserId: async () => "UBOT",
      applyVerdict: (verdict) => h.deps.applyVerdict(verdict).then(() => {}),
      restage: async () => {},
    },
  );
  assert.deepEqual(redraws(h).map((q) => q.decided), [[a, b]], "A's button does not come back");
});

test("a struck headline is trimmed, and a ~ in it cannot end the strike early", async () => {
  const note: Extract<GateNote, { kind: "which-card" }> = {
    kind: "which-card",
    decision: "cancel",
    cards: [{ ts: "1.0", headline: "  Approx ~2 tutors  " }, { ts: "2.0", headline: "Other" }],
  };
  assert.match(sectionOf(whichCardMessage(note, ["1.0"])), /\n~1\. Approx \u223C2 tutors~\n2\. \*Other\*$/);
});

test("a press on a card a revision replaced names the card that replaced it", async () => {
  const revise = call("notion_create", { ...PRD_A, title: "Backup tutors" });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), revise] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  const a = first.staged!.proposal.proposalTs;
  revise.toolCalls![0]!.args!.revises_card = a;
  await turn(h, { text: "shorter title on the backup one", userMsgTs: "1700000000.000400" });

  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "confirm", userId: "U1" },
    {
      threadState: h.threadState,
      delivery: () => h.delivery,
      applyVerdict: async () => {},
      replyEphemeral: async () => {},
      replaceCard: async () => {},
      restage: async () => {},
    },
  );

  const note = h.delivery.gateNotes.at(-1)!;
  assert.deepEqual(note, { kind: "superseded", by: "Backup tutors" });
  assert.match(renderGateNote(note), /replaced by \*Backup tutors\*/);
  assert.doesNotMatch(renderGateNote(note), /newest card/);
});
