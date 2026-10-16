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

test("the question is one button per card, named by its headline, each carrying its card", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);
  const message = whichCardMessage(note);

  assert.equal(messageBlocksRefusal(message.blocks), null, "Slack takes it");
  const buttons = buttonsOf(message);
  assert.deepEqual(buttons.map((x) => [x.text.text, x.value]), [["Session reflections", b], ["Backup tutor matching", a]]);
  assert.equal(new Set(buttons.map((x) => x.action_id)).size, 2, "unique action ids");
  assert.match(message.text, /^Approve which one\?/);
});

test("pressing one card's button approves that card only; the other stays live", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);

  const { cardEdits, questionEdits } = await press(h, whichCardMessage(note, ASKED_AT_MS), a, ASKED_AT_MS + 60_000);

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["confirm", true]]);
  assert.deepEqual(await live(h), [b], "card A was claimed, card B is still waiting");
  assert.deepEqual(cardEdits.map((e) => e.ts), [a], "the card decided is the one edited");
  // The question keeps a button only for the card still waiting, and its deadline.
  assert.deepEqual(buttonsOf(questionEdits.at(-1)!).map((x) => x.value), [b]);
  assert.match(JSON.stringify(questionEdits.at(-1)!.blocks), /Expires <!date/);
});

test("the question's buttons lapse 24 weekday hours after it was asked", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b, note } = await asked(h);

  const late = cardExpiresAt(ASKED_AT_MS) + 1;
  const asking = whichCardMessage(note, ASKED_AT_MS);
  // It says when, in each reader's timezone, and in ET in its text copy:
  // Thursday 11:00 ET, 24 weekday hours after Wednesday's.
  const deadline = `Expires <!date^${cardExpiresAt(ASKED_AT_MS) / 1000}^{date_short_pretty}|Thu, Oct 15> at <!date^${cardExpiresAt(ASKED_AT_MS) / 1000}^{time}|11:00 AM ET>`;
  assert.ok(asking.text.endsWith(`\n${deadline}`));
  assert.match(JSON.stringify(asking.blocks), /Expires <!date/);
  const { ephemerals, questionEdits, cardEdits } = await press(h, asking, a, late);

  assert.deepEqual(h.resolved, [], "nothing ran");
  assert.deepEqual(await live(h), [a, b].sort());
  assert.deepEqual(cardEdits, []);
  assert.match(ephemerals[0] ?? "", /expired/i);
  assert.deepEqual(buttonsOf(questionEdits.at(-1)!), [], "the lapsed question keeps no buttons");
  assert.doesNotMatch(JSON.stringify(questionEdits.at(-1)!.blocks), /Expires/, "nor a deadline");
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
