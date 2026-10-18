// The "which one?" question and the one pop-up its Review button opens.
//
// A decision that named no card, with several waiting, is answered with one
// short line and one unstyled button, Review (`tests/which-card-turn.test.ts`
// drives the asking). Review opens "Review cards": one row per waiting card —
// its headline and what it does, a Show draft button, and an Approve / Cancel
// / Leave choice that starts on Leave — and an optional note for the cards
// canceled. Done decides each card by its own row's choice alone, read from
// the submitted state under that card's own block, through the same door as
// the card's own ✅ or ⛔, and leaves every card left on Leave live. The
// question lapses on the card rule, 24 weekday hours after it was asked.
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
  WHICH_EXPIRED_REPLY,
  WHICH_REVIEW_ACTION_ID,
  canceledLine,
  chooseValueOf,
  isLegacyWhichPress,
  isWhichOpenAction,
  runWhichOpen,
  runWhichRedraw,
  runWhichSubmit,
  whichCardMessage,
  type WhichDoorDeps,
  type WhichRedraw,
} from "../src/slack/which-card";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DRAFT_LEFT_OUT,
  FAILED_PARTWAY,
  NOTHING_CHOSEN,
  REOPEN,
  WHICH_REVIEW_CALLBACK_ID,
  isWhichCallback,
  whichPopupOf,
  whichSubmitOf,
} from "../src/slack/which-card-view";
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
const PRD_C = { surface: "prd", title: "Tutor onboarding", summary: "A shorter first week." };

/** The question's own message ts: when it was asked. */
const ASKED_AT_MS = Date.UTC(2026, 9, 14, 15, 0); // a Wednesday, 11:00 ET
const QUESTION_TS = `${ASKED_AT_MS / 1000}.000100`;
const SOON = ASKED_AT_MS + 60_000;

type WhichNote = Extract<GateNote, { kind: "which-card" }>;
type Choice = "approve" | "cancel" | "leave";

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

/** Two cards in the thread (three with `third`), and the question a typed ✅
 *  (or ⛔) asked, kept as the turn keeps it under the ts Slack gave its
 *  message. */
async function asked(h: Harness, typed = "✅", third = false): Promise<{ a: string; b: string; c: string; note: WhichNote; question: CardMessage }> {
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  const last = third ? await turn(h, { text: "and one for tutor onboarding", userMsgTs: "1700000000.000350" }) : null;
  await turn(h, { text: typed, userMsgTs: "1700000000.000400" });
  const note = h.delivery.gateNotes.at(-1) as WhichNote;
  assert.equal(note?.kind, "which-card");
  await h.threadState.putWhichQuestion({ questionTs: QUESTION_TS, channel: CHANNEL, decision: note.decision, cards: note.cards, decided: [] });
  return {
    a: first.staged!.proposal.proposalTs,
    b: second.staged!.proposal.proposalTs,
    c: last?.staged!.proposal.proposalTs ?? "",
    note,
    question: whichCardMessage(note),
  };
}

/** The doors' dependencies on the harness, recording what they edited. */
function doors(h: Harness, clock: { now: number }, over: Partial<WhichDoorDeps> = {}, hash?: () => string) {
  const views = recordingViews({ alreadyOpen: ["V1"], ...(hash ? { hash } : {}) });
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

type Element = { type: string; action_id?: string; value?: string; style?: string; text?: { text: string }; options?: Array<{ value: string; text: { text: string } }>; initial_option?: { value: string }; initial_value?: string };
type Block = { type: string; block_id?: string; elements?: Element[]; element?: Element; text?: { text: string }; accessory?: Element; label?: { text: string }; optional?: boolean; dispatch_action?: boolean };
type View = { callback_id: string; title: { text: string }; private_metadata: string; submit?: { text: string }; blocks: Block[] };

const buttonsOf = (message: CardMessage) => ((message.blocks as Block[]).find((b) => b.type === "actions")?.elements ?? []) as Element[];
const sectionOf = (message: CardMessage) => (message.blocks as Block[]).find((x) => x.type === "section")?.text?.text ?? "";

/** Press Review on the question, as `slack/interactive.ts` does. */
async function press(d: ReturnType<typeof doors>, question: CardMessage) {
  const button = buttonsOf(question).find((b) => b.action_id === WHICH_REVIEW_ACTION_ID)!;
  await runWhichOpen({ triggerId: "T1", channel: CHANNEL, questionTs: QUESTION_TS, question, value: button.value, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)?.view as View | undefined;
}

/** Each row's section, in order: the card it is by its accessory's value. */
const rowsOf = (view: View) => view.blocks.filter((b) => b.type === "section" && b.accessory?.type === "button");
const choiceOf = (view: View, ts: string) => view.blocks.find((b) => b.type === "input" && b.block_id === `uno_which_choice_${ts}`);
const noteOf = (view: View) => view.blocks.find((x) => x.block_id === "uno_which_note");
const rowAt = (view: View, ts: string) => view.blocks.findIndex((b) => b.type === "section" && b.accessory?.value === ts);

/** A view state as Slack sends it: each row's radio pick, by card, and the
 *  note. A card not named has no value in the state at all. */
function stateOf(choices: Record<string, Choice>, note = "") {
  const rows = Object.fromEntries(
    Object.entries(choices).map(([ts, value]) => [`uno_which_choice_${ts}`, { uno_which_choice: { type: "radio_buttons", selected_option: { value } } }]),
  );
  return { values: { ...rows, uno_which_note: { uno_which_note_input: { type: "plain_text_input", value: note } } } };
}

async function redraw(d: ReturnType<typeof doors>, view: View, press: WhichRedraw, state: unknown, hash?: string) {
  await runWhichRedraw(
    { viewId: "V1", popup: whichPopupOf(view.private_metadata)!, callbackId: view.callback_id, state, ...(hash ? { hash } : {}), press, userId: "U1" },
    d.deps,
  );
  return d.views.calls.at(-1)!.view as View;
}

/** Done, as the ack reads it and the door decides it. */
async function done(d: ReturnType<typeof doors>, view: View, state: unknown) {
  const popup = whichPopupOf(view.private_metadata)!;
  const sent = whichSubmitOf(view.callback_id, state, view.blocks, popup.cards);
  assert.ok(sent.ok, "Done is read");
  await runWhichSubmit({ viewId: "V1", popup, submission: sent.submission, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)!.view as View;
}

async function live(h: Harness): Promise<string[]> {
  return (await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs).sort();
}

const words = (view: View) => JSON.stringify(view.blocks);

// ── The question ────────────────────────────────────────────────────────────

test("the question is one line and one unstyled Review button: no numbered buttons, no headline list", async () => {
  for (const typed of ["✅", "⛔"]) {
    const { h } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    const { a, b, question } = await asked(h, typed);

    assert.equal(messageBlocksRefusal(question.blocks), null, "Slack takes it");
    const buttons = buttonsOf(question);
    assert.deepEqual(buttons.map((x) => [x.action_id, x.text?.text]), [[WHICH_REVIEW_ACTION_ID, "Review"]], `one button, whatever ${typed} asked`);
    assert.equal(buttons[0]!.style, undefined, "not colored");
    assert.deepEqual(chooseValueOf(buttons[0]!.value), { cards: [b, a] });
    assert.doesNotMatch(buttons[0]!.value!, /confirm|cancel|approve/, "its value carries no decision");
    assert.equal(sectionOf(question), "2 cards are waiting, nothing ran yet.");
    assert.doesNotMatch(JSON.stringify(question.blocks), /Session reflections|Backup tutor matching/);
    // The text copy, which a notification reads, still names them.
    assert.match(question.text, /^2 cards are waiting, nothing ran yet\. Waiting: \*Session reflections\*, \*Backup tutor matching\*\.$/);
    assert.doesNotMatch(JSON.stringify(question.blocks), /Expires|<!date/, "no deadline shown");
  }
});

test("a button's value is the cards alone; a value a question posted earlier carries opens the same, its prefix never read", () => {
  assert.deepEqual(chooseValueOf("cards:1.1,1.2"), { cards: ["1.1", "1.2"] });
  assert.deepEqual(chooseValueOf("confirm:1.1,1.2"), { cards: ["1.1", "1.2"] });
  assert.deepEqual(chooseValueOf("cancel:1.1"), { cards: ["1.1"] });
  assert.equal(chooseValueOf("1.1"), null);
  assert.equal(chooseValueOf(undefined), null);
});

test("Review opens the pop-up, and so does every button an earlier question carries: Choose…, Approve…, Cancel…", () => {
  for (const actionId of [WHICH_REVIEW_ACTION_ID, "uno_which_choose", "uno_which_approve", "uno_which_cancel"]) {
    assert.equal(isWhichOpenAction(actionId), true, actionId);
  }
  assert.equal(isWhichOpenAction("uno_which_confirm_0"), false);
  assert.equal(isWhichOpenAction("uno_review_open"), false);
  for (const callbackId of [WHICH_REVIEW_CALLBACK_ID, "uno_which_pick", "uno_which_approve_pick", "uno_which_cancel_pick"]) {
    assert.equal(isWhichCallback(callbackId), true, callbackId);
  }
  assert.equal(isWhichCallback("uno_review_submit"), false);
});

// ── Opening ─────────────────────────────────────────────────────────────────

test("Review opens a loading view, then one row per waiting card: headline, what it does, Show draft, and a choice starting on Leave", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);

  const view = (await press(d, question))!;

  assert.deepEqual(d.views.refused, []);
  assert.deepEqual(d.views.calls.map((c) => c.kind), ["open", "update"], "opened first, filled after the read");
  assert.equal(view.callback_id, WHICH_REVIEW_CALLBACK_ID);
  assert.equal(view.title.text, "Review cards");
  assert.deepEqual(view.submit, { type: "plain_text", text: "Done" });
  assert.doesNotMatch(view.private_metadata, /"d"|confirm|cancel|approve|leave/, "no decision in the metadata");

  const rows = rowsOf(view);
  assert.deepEqual(rows.map((r) => r.accessory!.value), [b, a], "the question's order");
  // The row says what the card does; its choice is labeled by its headline,
  // so the headline is said once.
  assert.equal(rows[0]!.text!.text, "New PRD card on the Roadmap");
  assert.equal(rows[1]!.text!.text, "New PRD card on the Roadmap");
  assert.deepEqual([b, a].map((ts) => choiceOf(view, ts)!.label!.text), ["Session reflections", "Backup tutor matching"]);
  assert.doesNotMatch(words(view), /"Decision"/, "no repeated label");
  for (const [i, ts] of [b, a].entries()) {
    const row = rows[i]!;
    assert.equal(row.block_id, `uno_which_row_${ts}`, "block ids are the card's");
    assert.deepEqual([row.accessory!.action_id, row.accessory!.text!.text, row.accessory!.style], ["uno_which_show", "Show draft", undefined]);
    const choice = choiceOf(view, ts)!;
    assert.equal(view.blocks[view.blocks.indexOf(row) + 1], choice, "the choice sits right under its row");
    assert.equal(choice.element!.type, "radio_buttons");
    assert.equal(choice.element!.action_id, "uno_which_choice");
    assert.deepEqual(choice.element!.options!.map((o) => [o.value, o.text.text]), [["approve", "Approve"], ["cancel", "Cancel"], ["leave", "Leave"]]);
    assert.equal(choice.element!.initial_option?.value, "leave", "every row starts on Leave");
  }
  const note = noteOf(view)!;
  assert.equal(note.type, "input");
  assert.equal(note.optional, true);
  assert.equal(note.label!.text, "Note");
  assert.doesNotMatch(words(view), /"context"/, "no caption lines");
});

test("the pop-up keeps every choice in an input block: no radio buttons, checkboxes or select in an actions block, and no styled button", async () => {
  // Slack's mobile client cannot draw a radio group or a select in an
  // actions block, so every choice sits in an input block.
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question))!;
  const shown = await redraw(d, closed, { kind: "show", cardTs: a }, stateOf({}));
  const hidden = await redraw(d, shown, { kind: "hide" }, stateOf({}));

  assert.deepEqual(d.views.refused, []);
  const choices = new Set(["radio_buttons", "checkboxes", "static_select", "multi_static_select", "overflow"]);
  for (const view of [closed, shown, hidden]) {
    const misplaced = view.blocks.filter((b) => b.type === "actions" && (b.elements ?? []).some((e) => choices.has(String(e.type))));
    assert.deepEqual(misplaced, [], "no choice in an actions block");
    const buttons = view.blocks.flatMap((b) => [...(b.accessory ? [b.accessory] : []), ...(b.elements ?? [])]).filter((e) => e.type === "button");
    assert.ok(buttons.length > 0);
    assert.deepEqual(buttons.filter((e) => e.style !== undefined), [], "no colored button");
    for (const b of view.blocks.filter((x) => x.type === "input")) assert.notEqual(b.dispatch_action, true, "a choice redraws nothing");
  }
});

// ── Redraws ─────────────────────────────────────────────────────────────────

test("Show draft opens that card's draft under its row, as its Review draws it; Hide draft closes it; choices and note survive", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question))!;
  const picked = stateOf({ [b]: "cancel", [a]: "approve" }, "hm");

  const shown = await redraw(d, closed, { kind: "show", cardTs: a }, picked);

  assert.deepEqual(d.views.refused, []);
  const lookup = await h.threadState.getProposalByTs(a);
  assert.equal(lookup.state, "found");
  const draft = draftBlocks((lookup as Extract<typeof lookup, { state: "found" }>).proposal);
  const at = rowAt(shown, a);
  assert.deepEqual(shown.blocks.slice(at + 1, at + 1 + draft.length), draft, "the draft, under its row");
  assert.equal(shown.blocks[at + 1 + draft.length], choiceOf(shown, a), "then the row's choice");
  assert.deepEqual([shown.blocks[at]!.accessory!.action_id, shown.blocks[at]!.accessory!.text!.text], ["uno_which_hide", "Hide draft"]);
  assert.equal(shown.blocks[rowAt(shown, b)]!.accessory!.text!.text, "Show draft");
  assert.equal(choiceOf(shown, a)!.element!.initial_option?.value, "approve", "the choice survives");
  assert.equal(choiceOf(shown, b)!.element!.initial_option?.value, "cancel");
  assert.equal(noteOf(shown)!.element!.initial_value, "hm", "the note survives");
  assert.deepEqual(
    shown.blocks.filter((x) => x.block_id).map((x) => x.block_id).filter((id) => /^uno_which_(?:row|choice)_|^uno_which_note$/.test(id!)),
    closed.blocks.filter((x) => x.block_id).map((x) => x.block_id).filter((id) => /^uno_which_(?:row|choice)_|^uno_which_note$/.test(id!)),
    "block ids stay the same across a redraw",
  );

  // Another card's draft replaces the open one: one open at a time.
  const other = await redraw(d, shown, { kind: "show", cardTs: b }, picked);
  assert.equal(other.blocks[rowAt(other, a)]!.accessory!.text!.text, "Show draft");
  assert.equal(other.blocks[rowAt(other, b)]!.accessory!.text!.text, "Hide draft");

  const hidden = await redraw(d, other, { kind: "hide" }, picked);
  assert.equal(hidden.blocks.length, closed.blocks.length, "the draft is gone again");
  assert.equal(noteOf(hidden)!.element!.initial_value, "hm");
  assert.equal(choiceOf(hidden, a)!.element!.initial_option?.value, "approve");
  assert.equal(choiceOf(hidden, b)!.element!.initial_option?.value, "cancel");
});

test("a row with no readable choice in the state redraws on Leave", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question))!;
  const odd = { values: { [`uno_which_choice_${a}`]: { uno_which_choice: { type: "radio_buttons", selected_option: { value: "confirm" } } } } };

  const shown = await redraw(d, closed, { kind: "show", cardTs: a }, odd);

  assert.equal(choiceOf(shown, a)!.element!.initial_option?.value, "leave");
  assert.equal(choiceOf(shown, b)!.element!.initial_option?.value, "leave");
});

test("a draft too long for the view is cut, and points at the card's own Review", async () => {
  const sections = Array.from({ length: 120 }, (_, i) => ({ heading: `Part ${i + 1}`, body: `Body ${i + 1}.` }));
  const { h, clock } = clocked([call("notion_create", { ...PRD_A, sections }), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question))!;
  const shown = await redraw(d, closed, { kind: "show", cardTs: a }, stateOf({}));
  assert.deepEqual(d.views.refused, []);
  assert.equal(shown.blocks.length <= 100, true);
  assert.ok(words(shown).includes(DRAFT_LEFT_OUT));
  assert.ok(noteOf(shown), "the note is never pushed out");
  assert.ok(choiceOf(shown, a) && choiceOf(shown, b), "nor any row's choice");
});

test("a press inside a view opened before this pop-up decides nothing and says to open the question again", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  for (const old of ["uno_which_pick", "uno_which_approve_pick", "uno_which_cancel_pick"]) {
    const again = await redraw(d, { ...view, callback_id: old }, { kind: "show", cardTs: a }, stateOf({ [a]: "approve" }));
    assert.deepEqual(d.views.refused, []);
    assert.ok(words(again).includes(REOPEN), old);
    assert.equal(again.submit, undefined, "and offers no Done");
  }
  assert.deepEqual(h.resolved, [], "a redraw decides nothing");
});

test("a redraw that lands after the view moved on is dropped: it carries the hash it was pressed on", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  // Slack holds the view at hash H2 by the time the press is handled: Done's
  // ack replaced it.
  const d = doors(h, clock, {}, () => "H2");
  const view = (await press(d, question))!;

  await redraw(d, view, { kind: "show", cardTs: a }, stateOf({}), "H1");

  const last = d.views.calls.at(-1)!;
  assert.equal(last.kind === "update" && last.hash, "H1", "the press's own hash rides the update");
  assert.equal(last.kind === "update" && last.conflict, true, "and Slack refuses it");
  assert.deepEqual(d.views.refused, [], "a conflict is dropped quietly");
});

// ── What Done is read as ────────────────────────────────────────────────────

const CARDS = [{ ts: "1.1", headline: "A" }, { ts: "1.2", headline: "B" }, { ts: "1.3", headline: "C" }];
const row = (ts: string, value: unknown, extra: Record<string, unknown> = {}) => ({ [`uno_which_choice_${ts}`]: { uno_which_choice: { type: "radio_buttons", selected_option: { value } }, ...extra } });

test("Done with every row on Leave decides nothing", () => {
  const state = { values: { ...row("1.1", "leave"), ...row("1.2", "leave"), ...row("1.3", "leave") } };
  assert.deepEqual(whichSubmitOf(WHICH_REVIEW_CALLBACK_ID, state, [], CARDS), { ok: true, submission: { decide: [], note: "" } });
});

test("Done reads each row's choice from its own block, in the list's order, and the note", () => {
  const state = {
    values: {
      ...row("1.3", "approve"),
      ...row("1.1", "cancel"),
      ...row("1.2", "leave"),
      uno_which_note: { uno_which_note_input: { type: "plain_text_input", value: "  later  " } },
    },
  };
  assert.deepEqual(whichSubmitOf(WHICH_REVIEW_CALLBACK_ID, state, [], CARDS), {
    ok: true,
    submission: { decide: [{ card: "1.1", choice: "cancel" }, { card: "1.3", choice: "approve" }], note: "later" },
  });
});

test("a row with no readable choice is Leave: missing state, an unknown value, the wrong control or action id", () => {
  for (const state of [
    undefined,
    {},
    { values: {} },
    { values: { "uno_which_choice_1.1": {} } },
    { values: row("1.1", "confirm") },
    { values: row("1.1", null) },
    { values: { "uno_which_choice_1.1": { uno_which_choice: { type: "checkboxes", selected_options: [{ value: "approve" }] } } } },
    { values: { "uno_which_choice_1.1": { uno_which_choice: { type: "static_select", selected_option: { value: "approve" } } } } },
    { values: { "uno_which_choice_1.1": { uno_which_other: { type: "radio_buttons", selected_option: { value: "approve" } } } } },
    // A second control under the row's own block makes the whole row unreadable.
    { values: row("1.1", "approve", { uno_which_other: { type: "radio_buttons", selected_option: { value: "cancel" } } }) },
  ]) {
    assert.deepEqual(whichSubmitOf(WHICH_REVIEW_CALLBACK_ID, state, [], CARDS), { ok: true, submission: { decide: [], note: "" } }, JSON.stringify(state));
  }
});

test("a row's choice cannot decide another card: only the block keyed by a listed card's ts counts", () => {
  // Card 1.2's block holds Approve; 1.1's block holds nothing; a block for a
  // card the question never listed holds Cancel.
  const state = { values: { ...row("1.2", "approve"), ...row("9.9", "cancel"), uno_which_choice: { uno_which_choice: { type: "radio_buttons", selected_option: { value: "cancel" } } } } };
  assert.deepEqual(whichSubmitOf(WHICH_REVIEW_CALLBACK_ID, state, [], CARDS), { ok: true, submission: { decide: [{ card: "1.2", choice: "approve" }], note: "" } });
});

test("Done from a view opened before this pop-up is refused under its first input block, whatever its state holds", () => {
  const blocks = [
    { type: "section", block_id: "lead", text: { type: "mrkdwn", text: "Pick" } },
    { type: "actions", block_id: "uno_which_decision_cancel", elements: [{ type: "radio_buttons", action_id: "uno_which_decision" }] },
    { type: "input", block_id: "uno_which_cards_cancel", element: { type: "checkboxes", action_id: "uno_which_cards_input" } },
  ];
  const ticks = { uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: [{ value: "1.1" }] } } };
  const pick = { uno_which_approve_card: { uno_which_approve_input: { type: "radio_buttons", selected_option: { value: "1.1" } } } };
  for (const callbackId of ["uno_which_pick", "uno_which_approve_pick", "uno_which_cancel_pick"]) {
    for (const values of [ticks, pick, row("1.1", "approve")]) {
      const sent = whichSubmitOf(callbackId, { values }, blocks, CARDS);
      assert.deepEqual(sent, { ok: false, errors: { uno_which_cards_cancel: REOPEN } }, "never keyed to the actions block");
    }
  }
  assert.equal(REOPEN, "Open the question again.");
});

test("Done from a view opened before this pop-up with no input block is answered with a notice, not an error", () => {
  const blocks = [{ type: "actions", block_id: "uno_which_decision_confirm", elements: [{ type: "radio_buttons", action_id: "uno_which_decision" }] }];
  for (const [state, drawn] of [[{ values: row("1.1", "approve") }, blocks], [undefined, blocks], [{ values: {} }, undefined]] as const) {
    assert.deepEqual(whichSubmitOf("uno_which_approve_pick", state, drawn as unknown[] | undefined, CARDS), { ok: false, notice: REOPEN });
  }
});

test("each card's path hands the Gate its own constant decision: the Approve path never cancels, the Cancel path never approves", () => {
  const source = readFileSync(resolve(process.cwd(), "src/slack/which-card.ts"), "utf8");
  const slice = (from: string, to: string) => {
    const at = source.indexOf(from);
    const end = source.indexOf(to, at + 1);
    assert.ok(at > 0 && end > at, `${from} is found`);
    return source.slice(at, end);
  };
  const cancelPath = slice("async function cancelOne", "\n}\n");
  const approvePath = slice("async function approveOne", "\n}\n");
  assert.doesNotMatch(cancelPath, /confirm|CONFIRM|Approv/);
  assert.match(cancelPath, /const decision = CANCEL;/);
  assert.doesNotMatch(approvePath, /\bcancel\b|CANCEL|Cancel/);
  assert.match(approvePath, /const decision = CONFIRM;/);
  assert.match(source, /const CANCEL = "cancel" as const;/);
  assert.match(source, /const CONFIRM = "confirm" as const;/);
});

// ── Deciding ────────────────────────────────────────────────────────────────

test("Done with every row on Leave runs nothing, edits nothing and leaves every card live", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  const from = h.delivery.calls.length;

  const answer = await done(d, view, stateOf({ [a]: "leave", [b]: "leave" }, "never said"));

  assert.deepEqual(h.resolved, []);
  assert.deepEqual(await live(h), [a, b].sort());
  assert.deepEqual(d.cardEdits, []);
  assert.deepEqual(d.questionEdits, [], "the question is untouched");
  assert.deepEqual(h.delivery.calls.slice(from), [], "nothing said in the thread");
  assert.ok(words(answer).includes(NOTHING_CHOSEN));
});

test("mixed choices: the approved card runs, the canceled one cancels with one line, the one left stays live", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B), call("notion_create", PRD_C)]);
  const { a, b, c, question } = await asked(h, "✅", true);
  clock.now = SOON;
  const seen: string[] = [];
  const d = doors(h, clock, { editQuestion: async (message) => void (seen.push(`question@${d.views.calls.length}`), d.questionEdits.push(message)) });
  const view = (await press(d, question))!;
  assert.deepEqual(rowsOf(view).map((r) => r.accessory!.value), [c, b, a]);
  const from = h.delivery.calls.length;

  const answer = await done(d, view, stateOf({ [a]: "approve", [b]: "cancel", [c]: "leave" }));

  assert.deepEqual(
    h.resolved.map((r) => [r.toolName, r.decision, r.executed]).sort(),
    [["notion_create", "cancel", false], ["notion_create", "confirm", true]],
    "one approval, which runs, and one cancel",
  );
  assert.deepEqual(await live(h), [c], "the card left on Leave is still waiting");
  assert.deepEqual(d.cardEdits.map((e) => e.ts).sort(), [a, b].sort(), "only the decided cards are edited");
  // The approval posts its outcome as its own ✅ does; the cancel is one line.
  const said = h.delivery.calls.slice(from).flatMap((x) => (x.kind === "note" ? [x.text] : x.kind === "gate-note" && !x.card ? [x.note.kind] : []));
  assert.deepEqual(said.sort(), ["Canceled *Session reflections*.", "resolved"].sort());
  // The pop-up answers one line per decided card, before the question.
  assert.match(words(answer), /Session reflections\*: Canceled\./);
  assert.match(words(answer), /Backup tutor matching\*: Approved\./);
  assert.doesNotMatch(words(answer), /Tutor onboarding/, "a card left is not a result line");
  assert.equal(seen.length, 1, "one edit of the question");
  assert.equal(seen[0], `question@${d.views.calls.length}`, "after the pop-up's answer");
  const redrawn = d.questionEdits.at(-1)!;
  assert.equal(messageBlocksRefusal(redrawn.blocks), null);
  assert.equal(sectionOf(redrawn), "1 card is still waiting.\n~Session reflections~\n~Backup tutor matching~");
  assert.deepEqual(buttonsOf(redrawn).map((x) => x.text?.text), ["Review"], "Review stays for the card still waiting");
});

test("no card is decided except by its own row: one Approve decides that card and nothing else", async () => {
  for (const pick of ["a", "b"] as const) {
    const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    const { a, b, question } = await asked(h, "⛔");
    clock.now = SOON;
    const d = doors(h, clock);
    const view = (await press(d, question))!;
    const chosen = pick === "a" ? a : b;
    const other = pick === "a" ? b : a;

    await done(d, view, stateOf({ [chosen]: "approve" }));

    assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["confirm", true]]);
    assert.deepEqual(await live(h), [other]);
    assert.deepEqual(d.cardEdits.map((e) => e.ts), [chosen]);
  }
});

test("a non-confirmer's Approve is refused for that card only: the other row's Cancel still runs", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  const lookup = await h.threadState.getProposalByTs(a);
  assert.equal(lookup.state, "found");
  const card = (lookup as Extract<typeof lookup, { state: "found" }>).proposal;
  await h.threadState.putProposal({ ...card, confirmers: ["U9"], exclusiveConfirmers: true });
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;

  const answer = await done(d, view, stateOf({ [a]: "approve", [b]: "cancel" }));

  assert.deepEqual(h.resolved.map((r) => r.decision), ["cancel"], "only B's cancel");
  assert.deepEqual(await live(h), [a], "A stays live");
  assert.deepEqual(d.cardEdits.map((e) => e.ts), [b], "A is not edited");
  assert.doesNotMatch(words(answer), /Backup tutor matching\*: Approved\./);
  assert.ok(words(answer).includes(renderGateNote({ kind: "not-a-confirmer", confirmers: ["U9"] } as GateNote).slice(0, 30)), words(answer));
  assert.match(words(answer), /Session reflections\*: Canceled\./);
});

test("a card decided elsewhere while the pop-up was open is refused at Done, not decided twice", async () => {
  for (const choice of ["approve", "cancel"] as const) {
    const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    const { a, question } = await asked(h);
    clock.now = SOON;
    const d = doors(h, clock);
    const view = (await press(d, question))!;
    await runButtonDoor(
      { channel: CHANNEL, messageTs: a, decision: "confirm", userId: "U2" },
      { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
    );
    const before = h.resolved.length;

    const answer = await done(d, view, stateOf({ [a]: choice }));

    assert.equal(h.resolved.length, before, `nothing ran a second time (${choice})`);
    assert.deepEqual(d.cardEdits, [], "the card is not edited again");
    assert.ok(words(answer).includes(renderGateNote({ kind: "already-resolved" }).slice(0, 40)));
  }
});

test("Done made after the question lapsed runs nothing", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  clock.now = cardExpiresAt(ASKED_AT_MS) + 1;

  const answer = await done(d, view, stateOf({ [a]: "approve", [b]: "cancel" }));

  assert.deepEqual(h.resolved, []);
  assert.ok(words(answer).includes("expired"));
});

test("Done naming a card the question did not list runs nothing for it", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  const popup = whichPopupOf(view.private_metadata)!;
  const fewer = { ...popup, cards: popup.cards.filter((c) => c.ts !== a) };

  await runWhichSubmit({ viewId: "V1", popup: fewer, submission: { decide: [{ card: a, choice: "approve" }], note: "" }, userId: "U1" }, d.deps);

  assert.deepEqual(h.resolved, []);
  assert.deepEqual(await live(h), [a, b].sort());
});

test("the pop-up's metadata lists each card once, whatever it was handed", () => {
  const metadata = JSON.stringify({ c: "C1", q: "1.0", k: [["1.1", "A"], ["1.2", "B"], ["1.1", "A again"]] });
  assert.deepEqual(whichPopupOf(metadata)?.cards, [{ ts: "1.1", headline: "A" }, { ts: "1.2", headline: "B" }]);
});

test("a throw on the second card still posts the first card's cancel line, redraws the question and says it failed", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock, {
    applyVerdict: async (verdict) => {
      if (verdict.decision === "confirm") throw new Error("Notion is down");
      await h.deps.applyVerdict(verdict);
    },
  });
  const view = (await press(d, question))!;
  const from = h.delivery.calls.length;

  // In the list's order: B canceled first, then A approved, whose run throws.
  await assert.rejects(done(d, view, stateOf({ [b]: "cancel", [a]: "approve" })), /Notion is down/);

  const answer = d.views.calls.at(-1)!.view as View;
  assert.ok(words(answer).includes(FAILED_PARTWAY), words(answer));
  assert.match(words(answer), /Session reflections\*: Canceled\./, "the card decided before the throw is named");
  assert.deepEqual(
    h.delivery.calls.slice(from).flatMap((x) => (x.kind === "note" ? [x.text] : [])),
    ["Canceled *Session reflections*."],
    "the first card's cancel line is posted",
  );
  const redrawn = d.questionEdits.at(-1);
  assert.ok(redrawn, "the question is redrawn");
  assert.match(sectionOf(redrawn!), /~Session reflections~/);
});

test("the budget is checked before each Approve: a card not reached stays waiting, as do the ones after it, and each is named", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B), call("notion_create", PRD_C)]);
  const { a, b, c, question } = await asked(h, "✅", true);
  clock.now = SOON;
  // Room for a cancel, never for a write.
  const d = doors(h, clock, { headroom: () => 15 });
  const view = (await press(d, question))!;

  // In the list's order: C canceled, B approved, A canceled.
  const answer = await done(d, view, stateOf({ [c]: "cancel", [b]: "approve", [a]: "cancel" }));

  assert.deepEqual(h.resolved.map((r) => r.decision), ["cancel"], "only C was decided");
  assert.deepEqual(await live(h), [a, b].sort(), "B and the card after it stay waiting");
  assert.match(words(answer), /Tutor onboarding\*: Canceled\./);
  assert.match(words(answer), /Session reflections\*: not reached/);
  assert.match(words(answer), /Backup tutor matching\*: not reached/);
  assert.doesNotMatch(words(answer), /Approving|Deciding/, "never left on a spinner");
});

test("a cancel of several stops before the budget does, leaving the rest waiting and named", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock, { headroom: () => 5 });
  const view = (await press(d, question))!;
  const from = h.delivery.calls.length;

  const answer = await done(d, view, stateOf({ [b]: "cancel", [a]: "cancel" }));

  assert.deepEqual(await live(h), [a], "the first card is decided; the second was not reached");
  assert.match(words(answer), /Backup tutor matching\*: not reached/);
  const lines = h.delivery.calls.slice(from).flatMap((x) => (x.kind === "note" ? [x.text] : []));
  assert.deepEqual(lines, ["Canceled *Session reflections*."], "the line names only the card it canceled");
});

test("each decided card's mark on the question is spent inside its own budget step, before the next card's check", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const events: string[] = [];
  const d = doors(h, clock, { headroom: () => (events.push("check"), 100) });
  const view = (await press(d, question))!;
  // B is decided on its own card first, so here it loses and is only marked.
  await runButtonDoor(
    { channel: CHANNEL, messageTs: b, decision: "cancel", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const store = h.threadState;
  const mark = store.decideInWhichQuestion.bind(store);
  store.decideInWhichQuestion = async (ts, q) => (events.push(`mark:${ts === b ? "b" : "a"}`), mark(ts, q));

  await done(d, view, stateOf({ [b]: "cancel", [a]: "approve" }));

  assert.ok(events.indexOf("mark:b") >= 0 && events.indexOf("mark:b") < events.lastIndexOf("check"), events.join(" "));
  assert.deepEqual(await live(h), []);
  assert.match(JSON.stringify(d.questionEdits.at(-1)!.blocks), /Decided\./);
});

// ── Canceling ───────────────────────────────────────────────────────────────

/** What was said in the thread from the call `from` on: every post, a gate
 *  note or a plain one, and never a note edited onto its card. */
const threadLines = (h: Harness, from: number) =>
  h.delivery.calls.slice(from).flatMap((c) => (c.kind === "note" ? [c.text] : c.kind === "gate-note" && !c.card ? [renderGateNote(c.note)] : []));

test("canceling every card says one line naming them, and the question says Decided.", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  const from = h.delivery.calls.length;

  await done(d, view, stateOf({ [a]: "cancel", [b]: "cancel" }));

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["cancel", false], ["cancel", false]]);
  assert.deepEqual(await live(h), []);
  assert.deepEqual(threadLines(h, from), ["Canceled *Session reflections* and *Backup tutor matching*."]);
  const redrawn = d.questionEdits.at(-1)!;
  assert.deepEqual(buttonsOf(redrawn), []);
  assert.match(JSON.stringify(redrawn.blocks), /Decided\./);
  assert.match(sectionOf(redrawn), /^~Session reflections~\n~Backup tutor matching~$/);
});

test("the note is the Reject reason each canceled card closes with, and never touches an approval", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;

  await done(d, view, stateOf({ [a]: "cancel", [b]: "approve" }, "  not this quarter  "));

  const canceled = h.resolved.find((r) => r.decision === "cancel")?.note;
  assert.equal(canceled?.kind === "resolved" && canceled.rejected?.reason, "not this quarter");
  const approved = h.resolved.find((r) => r.decision === "confirm")?.note;
  assert.equal(approved?.kind === "resolved" && approved.rejected, undefined);
});

test("a cancel that canceled nothing says nothing in the thread", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "cancel", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const from = h.delivery.calls.length;

  await done(d, view, stateOf({ [a]: "cancel" }));

  assert.deepEqual(threadLines(h, from), []);
});

test("a blank headline is named as That card, never drawn as empty bold", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;
  const popup = whichPopupOf(view.private_metadata)!;
  const blank = { ...popup, cards: popup.cards.map((card) => (card.ts === a ? { ...card, headline: "   " } : card)) };
  const from = h.delivery.calls.length;

  await runWhichSubmit({ viewId: "V1", popup: blank, submission: { decide: [{ card: a, choice: "cancel" }], note: "" }, userId: "U1" }, d.deps);

  assert.deepEqual(threadLines(h, from), ["Canceled *That card*."]);
  assert.doesNotMatch(words(d.views.calls.at(-1)!.view as View), /\*\*/);
});

test("three or more canceled are joined with commas and \"and\"", () => {
  assert.equal(canceledLine(["A", "B", "C"]), "Canceled *A*, *B* and *C*.");
  assert.equal(canceledLine(["A"]), "Canceled *A*.");
  assert.equal(canceledLine(["A", "B"]), "Canceled *A* and *B*.");
  assert.equal(canceledLine(["<A> & B"]), "Canceled *&lt;A&gt; &amp; B*.", "headlines escaped");
});

test("a card's own Cancel still posts its own outcome line", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const from = h.delivery.calls.length;

  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "cancel", userId: "U1" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );

  assert.deepEqual(h.delivery.calls.slice(from).flatMap((c) => (c.kind === "gate-note" ? [c.note.kind] : [])), ["resolved"]);
});

// ── The question's life ─────────────────────────────────────────────────────

test("the question's button lapses 24 weekday hours after it was asked: nothing opens, the presser is told", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { question } = await asked(h);
  clock.now = cardExpiresAt(ASKED_AT_MS) + 1;
  const d = doors(h, clock);

  await press(d, question);

  assert.deepEqual(d.views.calls, [], "no pop-up");
  assert.deepEqual(d.ephemerals, [WHICH_EXPIRED_REPLY]);
  assert.deepEqual(buttonsOf(d.questionEdits.at(-1)!), [], "the lapsed question keeps no button");
  assert.match(JSON.stringify(d.questionEdits.at(-1)!.blocks), /Expired\./);
  assert.deepEqual(h.resolved, [], "nothing ran");
});

test("a numbered button on a question posted before the pop-up says so", () => {
  assert.equal(isLegacyWhichPress("uno_which_confirm_0"), true);
  assert.equal(isLegacyWhichPress(WHICH_REVIEW_ACTION_ID), false);
  assert.equal(isLegacyWhichPress("uno_which_approve"), false);
  assert.match(LEGACY_WHICH_REPLY, /^[^.]+\.$/, "one sentence");
  assert.ok(LEGACY_WHICH_REPLY.length <= 60, "short");
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
  const pressCard = () =>
    runButtonDoor({ channel: CHANNEL, messageTs: a, decision: "confirm", userId: "U1" }, { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} });

  await pressCard();

  assert.deepEqual(redraws(h).map((q) => [q.questionTs, q.cards.map((c) => c.ts), q.decided]), [[QUESTION_TS, [b, a], [a]]]);
  // Pressed again, nothing more is redrawn: the record has it already.
  await pressCard();
  assert.equal(redraws(h).length, 1);
});

test("its own question is redrawn by Done, not by each card's door", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question))!;

  await done(d, view, stateOf({ [a]: "cancel" }));

  assert.deepEqual(redraws(h), []);
  assert.equal(d.questionEdits.length, 1);
});

test("a card that lapsed before the question, chosen there, runs nothing and stays off the question", async () => {
  // Card A is staged the day before the question, so it lapses first:
  // Wednesday 12:00 ET, against a question asked Wednesday 11:00 ET.
  for (const choice of ["approve", "cancel"] as const) {
    const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    clock.now = Date.UTC(2026, 9, 13, 16, 0);
    const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
    clock.now = ASKED_AT_MS - 60_000;
    await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
    await turn(h, { text: "✅", userMsgTs: "1700000000.000400" });
    const note = h.delivery.gateNotes.at(-1) as WhichNote;
    await h.threadState.putWhichQuestion({ questionTs: QUESTION_TS, channel: CHANNEL, decision: note.decision, cards: note.cards, decided: [] });
    const a = first.staged!.proposal.proposalTs;
    // Opened while A is still live; chosen after it lapsed.
    clock.now = SOON;
    const d = doors(h, clock);
    const view = (await press(d, whichCardMessage(note)))!;
    assert.ok(rowAt(view, a) >= 0, "A is offered while it is live");
    clock.now = Date.UTC(2026, 9, 14, 16, 30);

    await done(d, view, stateOf({ [a]: choice }));

    assert.deepEqual(h.resolved, [], `nothing ran (${choice})`);
    assert.deepEqual(d.questionEdits.at(-1), whichCardMessage(note, [a]), "marked on the question's record, and redrawn from it");
  }
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
