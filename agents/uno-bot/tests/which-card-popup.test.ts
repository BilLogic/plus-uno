// The "which one?" question and the pop-up its Choose… button opens (#1342).
//
// A decision that named no card, with several waiting, is answered with one
// short line and one Choose… button (`tests/which-card-turn.test.ts` drives
// the asking). The pop-up presets Approve or Cancel from the decision that
// asked; Approve picks one card (radio buttons), Cancel ticks several
// (checkboxes); each card's draft opens under its row on Show draft; and
// Submit decides each picked card through the same door as its own button,
// leaving the others live. The question lapses on the card rule, 24 weekday
// hours after it was asked.
//
// Cards are staged by real turns on the in-memory store; the doors run on the
// recording Delivery and a views client that refuses what Slack refuses.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type GateNote, type TurnRequest } from "../src/turn/index";
import { runButtonDoor, type CardMessage } from "../src/slack/button-door";
import { renderGateNote } from "../src/slack/gate-note";
import {
  LEGACY_WHICH_REPLY,
  WHICH_CHOOSE_ACTION_ID,
  WHICH_EXPIRED_REPLY,
  chooseValueOf,
  isLegacyWhichPress,
  runWhichOpen,
  runWhichRedraw,
  runWhichSubmit,
  whichCardMessage,
  type WhichDoorDeps,
  type WhichRedraw,
} from "../src/slack/which-card";
import { DRAFT_LEFT_OUT, WHICH_CALLBACK_ID, whichPopupOf, whichSubmitOf } from "../src/slack/which-card-view";
import { draftBlocks } from "../src/slack/review-view";
import { cardExpiresAt } from "../src/card-expiry";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness, request, REF, CHANNEL, type Harness } from "./helpers/turn-harness";
import { createInMemoryThreadState } from "../src/thread-state/index";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { recordingViews } from "./helpers/recording-slack";

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
const SOON = ASKED_AT_MS + 60_000;

type WhichNote = Extract<GateNote, { kind: "which-card" }>;

/**
 * A thread on a clock the cases move, so the cards, the question's record
 * and the presses all read one time.
 */
function clocked(replies: ScriptedReply[]) {
  const clock = { now: ASKED_AT_MS - 60_000 };
  const threadState = createInMemoryThreadState({ now: () => clock.now });
  const h = harness({ replies, threadState, now: () => clock.now });
  return { h, clock };
}

/** Two cards in the thread, and the question a typed ✅ (or ⛔) asked, kept
 *  as the turn keeps it under the ts Slack gave its message. */
async function asked(h: Harness, typed = "✅"): Promise<{ a: string; b: string; note: WhichNote; question: CardMessage }> {
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  await turn(h, { text: typed, userMsgTs: "1700000000.000400" });
  const note = h.delivery.gateNotes.at(-1) as WhichNote;
  assert.equal(note?.kind, "which-card");
  await h.threadState.putWhichQuestion({ questionTs: QUESTION_TS, channel: CHANNEL, decision: note.decision, cards: note.cards, decided: [] });
  return { a: first.staged!.proposal.proposalTs, b: second.staged!.proposal.proposalTs, note, question: whichCardMessage(note) };
}

/** The doors' dependencies on the harness, recording what they edited. */
function doors(h: Harness, clock: { now: number }, over: Partial<WhichDoorDeps> = {}) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const cardEdits: Array<{ ts: string; message: CardMessage }> = [];
  const questionEdits: CardMessage[] = [];
  const ephemerals: string[] = [];
  const deps: WhichDoorDeps = {
    threadState: h.threadState,
    views: views.client,
    delivery: () => h.delivery,
    applyVerdict: (verdict) => h.deps.applyVerdict(verdict).then(() => {}),
    restage: async () => {},
    editCard: async (ts, message) => void cardEdits.push({ ts, message }),
    editQuestion: async (message) => void questionEdits.push(message),
    replyEphemeral: async (text) => void ephemerals.push(text),
    now: () => clock.now,
    ...over,
  };
  return { deps, views, cardEdits, questionEdits, ephemerals };
}

type Block = { type: string; block_id?: string; elements?: Array<Record<string, unknown>>; element?: Record<string, unknown>; text?: { text: string }; accessory?: { text: { text: string }; value: string } };
type View = { callback_id: string; private_metadata: string; submit?: unknown; blocks: Block[] };

const buttonsOf = (message: CardMessage) =>
  ((message.blocks as Block[]).find((b) => b.type === "actions")?.elements ?? []) as Array<{ action_id: string; value: string; text: { text: string } }>;
const sectionOf = (message: CardMessage) => (message.blocks as Block[]).find((x) => x.type === "section")?.text?.text ?? "";

/** Press Choose… on the question, as `slack/interactive.ts` does. */
async function choose(d: ReturnType<typeof doors>, question: CardMessage) {
  const button = buttonsOf(question)[0]!;
  await runWhichOpen({ triggerId: "T1", channel: CHANNEL, questionTs: QUESTION_TS, question, value: button.value, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)?.view as View | undefined;
}

/** The input holding the card list, and its element. */
const listOf = (view: View) => view.blocks.find((b) => b.type === "input" && b.block_id?.startsWith("uno_which_cards_"))!;
const optionsOf = (view: View) => ((listOf(view).element!.options as Array<{ value: string; text: { text: string }; description: { text: string } }>));

/** A view state as Slack sends it: the list's pick and the note. */
function stateOf(view: View, picked: string[], note = "") {
  const list = listOf(view);
  const element = list.element!;
  const value =
    element.type === "radio_buttons"
      ? { selected_option: picked[0] ? { value: picked[0] } : null }
      : { selected_options: picked.map((value) => ({ value })) };
  return { values: { [list.block_id!]: { [String(element.action_id)]: value }, uno_which_note: { uno_which_note_input: { value: note } } } };
}

async function redraw(d: ReturnType<typeof doors>, view: View, press: WhichRedraw, state: unknown) {
  await runWhichRedraw({ viewId: "V1", popup: whichPopupOf(view.private_metadata)!, state, press, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)!.view as View;
}

async function submit(d: ReturnType<typeof doors>, view: View, state: unknown) {
  const popup = whichPopupOf(view.private_metadata)!;
  const sent = whichSubmitOf(state, popup.decision);
  assert.ok(sent.ok, "a pick is sent");
  await runWhichSubmit({ viewId: "V1", popup, pick: sent.pick, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)!.view as View;
}

async function live(h: Harness): Promise<string[]> {
  return (await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs).sort();
}

const words = (view: View) => JSON.stringify(view.blocks);

test("the question is one line and one Choose… button: no numbered buttons, no headline list", async () => {
  const { h } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);

  assert.equal(messageBlocksRefusal(question.blocks), null, "Slack takes it");
  const buttons = buttonsOf(question);
  assert.deepEqual(buttons.map((x) => [x.action_id, x.text.text]), [[WHICH_CHOOSE_ACTION_ID, "Choose…"]]);
  assert.deepEqual(chooseValueOf(buttons[0]!.value), { decision: "confirm", cards: [b, a] });
  assert.equal(sectionOf(question), "2 cards are waiting, nothing ran yet.");
  assert.doesNotMatch(JSON.stringify(question.blocks), /Session reflections|Backup tutor matching/);
  // The text copy, which a notification reads, still names them.
  assert.match(question.text, /^2 cards are waiting, nothing ran yet\. Waiting: \*Session reflections\*, \*Backup tutor matching\*\.$/);
  assert.doesNotMatch(JSON.stringify(question.blocks), /Expires|<!date/, "no deadline shown");
});

test("Choose… opens a loading view, then the cards with Approve preset from a ✅: one radio pick, headline and what it does", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);

  const view = (await choose(d, question))!;

  assert.deepEqual(d.views.refused, []);
  assert.deepEqual(d.views.calls.map((c) => c.kind), ["open", "update"], "opened first, filled after the read");
  assert.equal(view.callback_id, WHICH_CALLBACK_ID);
  assert.ok(view.submit, "Submit is the footer");
  const decision = view.blocks.find((x) => x.type === "actions")!.elements![0] as { initial_option: { value: string } };
  assert.equal(decision.initial_option.value, "confirm");
  assert.equal(listOf(view).element!.type, "radio_buttons");
  assert.deepEqual(optionsOf(view).map((o) => [o.value, o.text.text, o.description.text]), [
    [b, "Session reflections", "New PRD card on the Roadmap"],
    [a, "Backup tutor matching", "New PRD card on the Roadmap"],
  ]);
  // Each row offers its draft, closed.
  const rows = view.blocks.filter((x) => x.accessory);
  assert.deepEqual(rows.map((r) => [r.accessory!.text.text, r.accessory!.value]), [["Show draft", b], ["Show draft", a]]);
});

test("a ⛔ presets Cancel: the cards as checkboxes", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { question } = await asked(h, "⛔");
  clock.now = SOON;
  const view = (await choose(doors(h, clock), question))!;
  assert.equal(listOf(view).element!.type, "checkboxes");
  assert.equal((view.blocks.find((x) => x.type === "actions")!.elements![0] as { initial_option: { value: string } }).initial_option.value, "cancel");
});

test("switching the decision swaps radio buttons for checkboxes, keeping the pick and the note", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const approve = (await choose(d, question))!;

  const cancel = await redraw(d, approve, { kind: "decision", decision: "cancel" }, stateOf(approve, [a], "not this week"));

  assert.deepEqual(d.views.refused, []);
  const list = listOf(cancel).element!;
  assert.equal(list.type, "checkboxes");
  assert.deepEqual((list.initial_options as Array<{ value: string }>).map((o) => o.value), [a], "the picked card is ticked");
  const note = cancel.blocks.find((x) => x.block_id === "uno_which_note")!.element!;
  assert.equal(note.initial_value, "not this week");

  // And back: Approve keeps one of the ticked cards.
  const back = await redraw(d, cancel, { kind: "decision", decision: "confirm" }, stateOf(cancel, [a], "not this week"));
  assert.equal((listOf(back).element!.initial_option as { value: string }).value, a);
});

test("Show draft opens that card's draft under its row, as its Review draws it; Hide draft closes it; the pick survives", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await choose(d, question))!;

  const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [b], "hm"));

  assert.deepEqual(d.views.refused, []);
  const lookup = await h.threadState.getProposalByTs(a);
  assert.equal(lookup.state, "found");
  const draft = draftBlocks((lookup as Extract<typeof lookup, { state: "found" }>).proposal);
  const rowAt = shown.blocks.findIndex((x) => x.accessory?.value === a);
  assert.equal(shown.blocks[rowAt]!.accessory!.text.text, "Hide draft");
  assert.deepEqual(shown.blocks.slice(rowAt + 1, rowAt + 1 + draft.length), draft, "the draft, under its own row");
  assert.equal(shown.blocks.find((x) => x.accessory?.value === b)!.accessory!.text.text, "Show draft");
  assert.equal((listOf(shown).element!.initial_option as { value: string }).value, b);
  assert.equal(shown.blocks.find((x) => x.block_id === "uno_which_note")!.element!.initial_value, "hm");

  const hidden = await redraw(d, shown, { kind: "draft", cardTs: a }, stateOf(shown, [b], "hm"));
  assert.equal(hidden.blocks.length, closed.blocks.length, "the draft is gone again");
  assert.equal((listOf(hidden).element!.initial_option as { value: string }).value, b);
});

test("a draft too long for the view is cut, and points at the card's own Review", async () => {
  const sections = Array.from({ length: 120 }, (_, i) => ({ heading: `Part ${i + 1}`, body: `Body ${i + 1}.` }));
  const { h, clock } = clocked([call("notion_create", { ...PRD_A, sections }), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await choose(d, question))!;

  const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, []));

  assert.deepEqual(d.views.refused, []);
  assert.equal(shown.blocks.length <= 100, true);
  assert.ok(words(shown).includes(DRAFT_LEFT_OUT));
  assert.ok(shown.blocks.some((x) => x.block_id === "uno_which_note"), "the note is never pushed out");
});

test("Submit with nothing picked is an error under the list", () => {
  const confirm = whichSubmitOf({ values: {} }, "confirm");
  assert.deepEqual(confirm, { ok: false, errors: { uno_which_cards_confirm: "Choose the card to approve." } });
  const cancel = whichSubmitOf({ values: {} }, "cancel");
  assert.equal(cancel.ok, false);
});

test("Approve decides the one card picked through its own door; the other stays live, and the question strikes it", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["confirm", true]]);
  assert.deepEqual(await live(h), [b], "card A was claimed, card B is still waiting");
  assert.deepEqual(d.cardEdits.map((e) => e.ts), [a], "the card decided is the one edited");
  assert.match(words(answer), /Backup tutor matching\*: Approved\./);
  const redrawn = d.questionEdits.at(-1)!;
  assert.equal(messageBlocksRefusal(redrawn.blocks), null);
  assert.equal(sectionOf(redrawn), "1 card is still waiting.\n~Backup tutor matching~");
  assert.deepEqual(buttonsOf(redrawn).map((x) => x.text.text), ["Choose…"], "Choose… stays for the card still waiting");
  assert.equal(d.questionEdits.length, 1, "one edit of the question");
  assert.deepEqual(h.delivery.calls.filter((c) => c.kind === "redraw-which"), [], "its own question is redrawn here, not by the door");
});

test("Cancel decides every card ticked, and the question says Decided.", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;

  await submit(d, view, stateOf(view, [a, b]));

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["cancel", false], ["cancel", false]]);
  assert.deepEqual(await live(h), []);
  const redrawn = d.questionEdits.at(-1)!;
  assert.deepEqual(buttonsOf(redrawn), []);
  assert.match(JSON.stringify(redrawn.blocks), /Decided\./);
  assert.match(sectionOf(redrawn), /^~Session reflections~\n~Backup tutor matching~$/);
});

test("a Cancel's note is the Reject reason each card closes with", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;

  await submit(d, view, stateOf(view, [a], "  not this quarter  "));

  const note = h.resolved[0]?.note;
  assert.equal(note?.kind === "resolved" && note.rejected?.reason, "not this quarter");
});

test("a card decided elsewhere while the pop-up was open is refused at Submit, not decided twice", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;
  // A ✅ pressed on card A itself, after the pop-up opened.
  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "confirm", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const before = h.resolved.length;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.equal(h.resolved.length, before, "nothing ran a second time");
  assert.deepEqual(d.cardEdits, [], "the card is not edited again");
  assert.ok(words(answer).includes(renderGateNote({ kind: "already-resolved" }).slice(0, 40)), "the pop-up says it was decided already");
});

test("Choose… lapses 24 weekday hours after the question was asked: nothing opens, the presser is told", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = cardExpiresAt(ASKED_AT_MS) + 1;
  const d = doors(h, clock);

  await choose(d, question);

  assert.deepEqual(d.views.calls, [], "no pop-up");
  assert.deepEqual(d.ephemerals, [WHICH_EXPIRED_REPLY]);
  assert.deepEqual(buttonsOf(d.questionEdits.at(-1)!), [], "the lapsed question keeps no button");
  assert.match(JSON.stringify(d.questionEdits.at(-1)!.blocks), /Expired\./);
  assert.deepEqual(h.resolved, [], "nothing ran");
});

test("a Submit made after the question lapsed runs nothing", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;
  clock.now = cardExpiresAt(ASKED_AT_MS) + 1;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved, []);
  assert.ok(words(answer).includes("expired"));
});

test("a Cancel of several stops before the budget does, leaving the rest waiting and named", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock, { headroom: () => 5 });
  const view = (await choose(d, question))!;

  const answer = await submit(d, view, stateOf(view, [b, a]));

  assert.deepEqual(await live(h), [a], "the first card is decided; the second was not reached");
  assert.match(words(answer), /Backup tutor matching\*: not reached this time/);
});

test("a numbered button on a question posted before the pop-up says so", () => {
  assert.equal(isLegacyWhichPress("uno_which_confirm_0"), true);
  assert.equal(isLegacyWhichPress(WHICH_CHOOSE_ACTION_ID), false);
  assert.match(LEGACY_WHICH_REPLY, /Review/);
});

test("a struck headline is trimmed, and a ~ in it cannot end the strike early", () => {
  const note: WhichNote = { kind: "which-card", decision: "cancel", cards: [{ ts: "1.0", headline: "  Approx ~2 tutors  " }, { ts: "2.0", headline: "Other" }] };
  assert.equal(sectionOf(whichCardMessage(note, ["1.0"])), "1 card is still waiting.\n~Approx ∼2 tutors~");
});

const redraws = (h: Harness) => h.delivery.calls.flatMap((c) => (c.kind === "redraw-which" ? [c.question] : []));

test("a card's own button, pressed while the question is open, drops that card from the question", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const press = () =>
    runButtonDoor({ channel: CHANNEL, messageTs: a, decision: "confirm", userId: "U1" }, { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} });

  await press();

  assert.deepEqual(redraws(h).map((q) => [q.questionTs, q.cards.map((c) => c.ts), q.decided]), [[QUESTION_TS, [b, a], [a]]]);
  // Pressed again, nothing more is redrawn: the record has it already.
  await press();
  assert.equal(redraws(h).length, 1);
});

test("a card that lapsed before the question, picked there, runs nothing and stays off the question", async () => {
  // Card A is staged the day before the question, so it lapses first:
  // Wednesday 12:00 ET, against a question asked Wednesday 11:00 ET.
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  clock.now = Date.UTC(2026, 9, 13, 16, 0);
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  clock.now = ASKED_AT_MS - 60_000;
  await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  await turn(h, { text: "✅", userMsgTs: "1700000000.000400" });
  const note = h.delivery.gateNotes.at(-1) as WhichNote;
  await h.threadState.putWhichQuestion({ questionTs: QUESTION_TS, channel: CHANNEL, decision: note.decision, cards: note.cards, decided: [] });
  const a = first.staged!.proposal.proposalTs;
  // Opened while A is still live; picked after it lapsed.
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, whichCardMessage(note)))!;
  assert.ok(optionsOf(view).some((o) => o.value === a), "A is offered while it is live");
  clock.now = Date.UTC(2026, 9, 14, 16, 30);

  await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved, [], "nothing ran");
  assert.deepEqual(d.questionEdits.at(-1), whichCardMessage(note, [a]), "marked on the question's record, and redrawn from it");
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
