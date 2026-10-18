// The "which one?" question and the two pop-ups its buttons open (#1342).
//
// A decision that named no card, with several waiting, is answered with one
// short line and two buttons, Approve… and Cancel… (`tests/which-card-turn.test.ts`
// drives the asking). The button pressed fixes the pop-up's kind, and nothing
// in the pop-up switches it: Approve… lists the waiting cards to pick one,
// Cancel… lists them to tick, each card's draft sits under "Show a draft…",
// and Submit decides through the same door as each card's own button, leaving
// the others live. A Submit is read from its view's callback id and its state
// alone, and a state that does not hold the kind's own control is refused.
// The question lapses on the card rule, 24 weekday hours after it was asked.
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
  WHICH_APPROVE_ACTION_ID,
  WHICH_CANCEL_ACTION_ID,
  WHICH_CHOOSE_ACTION_ID,
  WHICH_EXPIRED_REPLY,
  canceledLine,
  chooseValueOf,
  isLegacyWhichPress,
  runWhichOpen,
  runWhichRedraw,
  runWhichSubmit,
  whichCardMessage,
  whichKindOfAction,
  type WhichDoorDeps,
  type WhichRedraw,
} from "../src/slack/which-card";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DRAFT_LEFT_OUT,
  PICK_ONE,
  REOPEN,
  TICK_ONE,
  WHICH_APPROVE_CALLBACK_ID,
  WHICH_APPROVE_LEAD,
  WHICH_CANCEL_CALLBACK_ID,
  WHICH_CANCEL_LEAD,
  WHICH_OLD_CALLBACK_ID,
  whichKindOf,
  whichPopupOf,
  whichSubmitOf,
  type WhichKind,
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

type Block = { type: string; block_id?: string; elements?: Array<Record<string, unknown>>; element?: Record<string, unknown>; text?: { text: string }; accessory?: { text: { text: string }; value: string } };
type View = { callback_id: string; title: { text: string }; private_metadata: string; submit?: unknown; blocks: Block[] };

const buttonsOf = (message: CardMessage) =>
  ((message.blocks as Block[]).find((b) => b.type === "actions")?.elements ?? []) as Array<{ action_id: string; value: string; text: { text: string }; style?: string }>;
const sectionOf = (message: CardMessage) => (message.blocks as Block[]).find((x) => x.type === "section")?.text?.text ?? "";

const ACTION_OF: Record<WhichKind, string> = { approve: WHICH_APPROVE_ACTION_ID, cancel: WHICH_CANCEL_ACTION_ID };

/** Press Approve… or Cancel… on the question, as `slack/interactive.ts` does. */
async function press(d: ReturnType<typeof doors>, question: CardMessage, kind: WhichKind) {
  const button = buttonsOf(question).find((b) => b.action_id === ACTION_OF[kind])!;
  await runWhichOpen({ triggerId: "T1", channel: CHANNEL, questionTs: QUESTION_TS, question, value: button.value, kind, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)?.view as View | undefined;
}

/** The input holding the card list, and its element. */
const listOf = (view: View) => view.blocks.find((b) => b.type === "input" && /^uno_which_(?:cards_cancel|approve_card)$/.test(b.block_id ?? ""))!;
type Select = { type: string; placeholder: { text: string }; options: Array<{ value: string; text: { text: string } }>; initial_option?: { value: string } };
/** Every "Show a draft…" select in the view, and where each sits. */
const draftSelects = (view: View) =>
  view.blocks.flatMap((b, at) => (b.type === "input" && b.element?.action_id === "uno_which_draft" ? [{ at, select: b.element as unknown as Select }] : []));
/** Where Hide draft sits, or -1. */
const hideAt = (view: View) => view.blocks.findIndex((b) => b.type === "actions" && b.elements?.[0]?.action_id === "uno_which_hide");
const noteOf = (view: View) => view.blocks.find((x) => x.block_id === "uno_which_note");
const optionsOf = (view: View) => ((listOf(view).element!.options as Array<{ value: string; text: { text: string }; description: { text: string } }>));

/** A view state as Slack sends it: the list's pick (ticks, or the one radio
 *  pick) and the note. */
function stateOf(view: View, picked: string[], note = "") {
  const list = listOf(view);
  const element = list.element!;
  const value =
    element.type === "radio_buttons"
      ? { type: "radio_buttons", selected_option: picked[0] ? { value: picked[0] } : null }
      : { type: "checkboxes", selected_options: picked.map((value) => ({ value })) };
  const typed = noteOf(view) ? { uno_which_note: { uno_which_note_input: { value: note } } } : {};
  return { values: { [list.block_id!]: { [String(element.action_id)]: value }, ...typed } };
}

async function redraw(d: ReturnType<typeof doors>, view: View, press: WhichRedraw, state: unknown, hash?: string) {
  const kind = whichKindOf(view.callback_id);
  await runWhichRedraw({ viewId: "V1", popup: whichPopupOf(view.private_metadata)!, kind, state, ...(hash ? { hash } : {}), press, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)!.view as View;
}

async function submit(d: ReturnType<typeof doors>, view: View, state: unknown) {
  const popup = whichPopupOf(view.private_metadata)!;
  const sent = whichSubmitOf(view.callback_id, state);
  assert.ok(sent.ok, "a pick is sent");
  await runWhichSubmit({ viewId: "V1", popup, submission: sent.submission, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)!.view as View;
}

async function live(h: Harness): Promise<string[]> {
  return (await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs).sort();
}

const words = (view: View) => JSON.stringify(view.blocks);

// ── The question ────────────────────────────────────────────────────────────

test("the question is one line and two unstyled buttons, Approve… and Cancel…: no numbered buttons, no headline list", async () => {
  for (const typed of ["✅", "⛔"]) {
    const { h } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    const { a, b, question } = await asked(h, typed);

    assert.equal(messageBlocksRefusal(question.blocks), null, "Slack takes it");
    const buttons = buttonsOf(question);
    assert.deepEqual(buttons.map((x) => [x.action_id, x.text.text]), [
      [WHICH_APPROVE_ACTION_ID, "Approve…"],
      [WHICH_CANCEL_ACTION_ID, "Cancel…"],
    ], `both buttons, whatever ${typed} asked`);
    for (const button of buttons) {
      assert.equal(button.style, undefined, `${button.text.text} is not colored`);
      assert.deepEqual(chooseValueOf(button.value), { cards: [b, a] });
      assert.doesNotMatch(button.value, /confirm|cancel|approve/, "a button's value carries no decision");
    }
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

test("the button pressed is the pop-up's kind; an old Choose… opens the Cancel pop-up", () => {
  assert.equal(whichKindOfAction(WHICH_APPROVE_ACTION_ID), "approve");
  assert.equal(whichKindOfAction(WHICH_CANCEL_ACTION_ID), "cancel");
  assert.equal(whichKindOfAction(WHICH_CHOOSE_ACTION_ID), "cancel");
  assert.equal(whichKindOfAction("uno_which_confirm_0"), null);
  assert.equal(whichKindOf(WHICH_APPROVE_CALLBACK_ID), "approve");
  assert.equal(whichKindOf(WHICH_CANCEL_CALLBACK_ID), "cancel");
  assert.equal(whichKindOf(WHICH_OLD_CALLBACK_ID), null, "a view opened before the two pop-ups has no kind");
  assert.equal(whichKindOf(undefined), null);
});

// ── Opening ─────────────────────────────────────────────────────────────────

test("Cancel… opens a loading view, then the cards to tick: checkboxes, the note, Submit Cancel cards", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);

  const view = (await press(d, question, "cancel"))!;

  assert.deepEqual(d.views.refused, []);
  assert.deepEqual(d.views.calls.map((c) => c.kind), ["open", "update"], "opened first, filled after the read");
  assert.equal((d.views.calls[0]!.view as View).callback_id, WHICH_CANCEL_CALLBACK_ID, "the loading view is already the kind's");
  assert.equal(view.callback_id, WHICH_CANCEL_CALLBACK_ID);
  assert.equal(view.title.text, "Cancel cards");
  assert.deepEqual(view.submit, { type: "plain_text", text: "Cancel cards" }, "the footer says what Submit does");
  assert.equal((view.blocks[0] as Block).text?.text, WHICH_CANCEL_LEAD);
  assert.equal(listOf(view).element!.type, "checkboxes");
  assert.doesNotMatch(words(view), /radio_buttons|uno_which_decision|uno_which_approve/, "no switch and no Approve list");
  assert.doesNotMatch(view.private_metadata, /"d"|confirm|cancel|approve/, "no decision in the metadata");
  assert.ok(noteOf(view), "the note is the cancel's reason");
  assert.deepEqual(optionsOf(view).map((o) => [o.value, o.text.text, o.description.text]), [
    [b, "Session reflections", "New PRD card on the Roadmap"],
    [a, "Backup tutor matching", "New PRD card on the Roadmap"],
  ]);
  // One select under the list names each card's draft by headline, in the
  // list's order, with none open.
  const selects = draftSelects(view);
  assert.equal(selects.length, 1);
  const { select } = selects[0]!;
  assert.equal(select.type, "static_select");
  assert.equal(select.placeholder.text, "Show a draft…");
  assert.deepEqual(select.options.map((o) => [o.value, o.text.text]), [[b, "Session reflections"], [a, "Backup tutor matching"]]);
  assert.equal(select.initial_option, undefined);
  assert.equal(hideAt(view), -1, "no Hide draft with no draft open");
});

test("Approve… opens the cards to pick one: a radio list, no checkboxes, no note, Submit Approve card", async () => {
  for (const typed of ["✅", "⛔"]) {
    const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    const { a, b, question } = await asked(h, typed);
    clock.now = SOON;
    const d = doors(h, clock);

    const view = (await press(d, question, "approve"))!;

    assert.deepEqual(d.views.refused, []);
    assert.equal((d.views.calls[0]!.view as View).callback_id, WHICH_APPROVE_CALLBACK_ID);
    assert.equal(view.callback_id, WHICH_APPROVE_CALLBACK_ID, `asked by ${typed}`);
    assert.equal(view.title.text, "Approve a card");
    assert.deepEqual(view.submit, { type: "plain_text", text: "Approve card" });
    assert.equal((view.blocks[0] as Block).text?.text, WHICH_APPROVE_LEAD);
    const list = listOf(view);
    assert.equal(list.block_id, "uno_which_approve_card");
    assert.equal(list.element!.type, "radio_buttons");
    assert.doesNotMatch(words(view), /checkboxes|uno_which_cards_cancel|uno_which_decision/, "nothing to tick, and no switch");
    assert.equal(noteOf(view), undefined, "an approval takes no note here");
    assert.doesNotMatch(view.private_metadata, /"d"|confirm|cancel|approve/, "no decision in the metadata");
    assert.deepEqual(optionsOf(view).map((o) => [o.value, o.text.text]), [[b, "Session reflections"], [a, "Backup tutor matching"]]);
    assert.equal(draftSelects(view).length, 1, "the drafts are under Show a draft…, as in Cancel");
  }
});

test("an old Choose… on a question posted before the two buttons opens the Cancel pop-up", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);

  await runWhichOpen(
    { triggerId: "T1", channel: CHANNEL, questionTs: QUESTION_TS, question, value: `confirm:${b},${a}`, kind: whichKindOfAction(WHICH_CHOOSE_ACTION_ID)!, userId: "U1" },
    d.deps,
  );

  const view = d.views.calls.at(-1)!.view as View;
  assert.equal(view.callback_id, WHICH_CANCEL_CALLBACK_ID, "its confirm: prefix is not read");
  assert.equal(listOf(view).element!.type, "checkboxes");
});

// ── Redraws ─────────────────────────────────────────────────────────────────

test("a press inside a view opened before the two pop-ups decides nothing and says to open the question again", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
  const old = { ...view, callback_id: WHICH_OLD_CALLBACK_ID };

  const again = await redraw(d, old, { kind: "draft", cardTs: a }, stateOf(view, [a], "not this week"));

  assert.deepEqual(d.views.refused, []);
  assert.deepEqual(h.resolved, [], "a redraw decides nothing");
  assert.ok(words(again).includes(REOPEN));
  assert.equal(again.submit, undefined, "and offers no Submit");
});

test("choosing a card under Show a draft… opens its draft below, as its Review draws it; Hide draft closes it; the pick survives", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question, "cancel"))!;

  const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [b], "hm"));

  assert.deepEqual(d.views.refused, []);
  const lookup = await h.threadState.getProposalByTs(a);
  assert.equal(lookup.state, "found");
  const draft = draftBlocks((lookup as Extract<typeof lookup, { state: "found" }>).proposal);
  const { at, select } = draftSelects(shown)[0]!;
  assert.equal(select.initial_option?.value, a, "the select shows the open card");
  assert.deepEqual(shown.blocks.slice(at + 1, at + 1 + draft.length), draft, "the draft, below the select");
  assert.equal(hideAt(shown), at + 1 + draft.length, "Hide draft after it");
  assert.deepEqual((listOf(shown).element!.initial_options as Array<{ value: string }>).map((o) => o.value), [b]);
  assert.equal(noteOf(shown)!.element!.initial_value, "hm");

  // Another card chosen replaces the open draft: one open at a time.
  const other = await redraw(d, shown, { kind: "draft", cardTs: b }, stateOf(shown, [b], "hm"));
  assert.equal(draftSelects(other)[0]!.select.initial_option?.value, b);
  assert.equal(draftSelects(other).length, 1);

  const hidden = await redraw(d, other, { kind: "hide" }, stateOf(other, [b], "hm"));
  assert.equal(hidden.blocks.length, closed.blocks.length, "the draft is gone again");
  assert.equal(hideAt(hidden), -1);
  assert.equal(noteOf(hidden)!.element!.initial_value, "hm");
  assert.deepEqual((listOf(hidden).element!.initial_options as Array<{ value: string }>).map((o) => o.value), [b]);
});

test("a draft opened in the Approve pop-up keeps its kind and the card picked", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question, "approve"))!;

  const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [b]));

  assert.deepEqual(d.views.refused, []);
  assert.equal(shown.callback_id, WHICH_APPROVE_CALLBACK_ID);
  assert.equal(listOf(shown).element!.type, "radio_buttons");
  assert.equal((listOf(shown).element!.initial_option as { value: string }).value, b, "the pick survives");
  assert.equal(draftSelects(shown)[0]!.select.initial_option?.value, a);
  const hidden = await redraw(d, shown, { kind: "hide" }, stateOf(shown, [b]));
  assert.equal(hidden.callback_id, WHICH_APPROVE_CALLBACK_ID);
  assert.equal(hideAt(hidden), -1);
});

test("a draft too long for the view is cut, and points at the card's own Review", async () => {
  const sections = Array.from({ length: 120 }, (_, i) => ({ heading: `Part ${i + 1}`, body: `Body ${i + 1}.` }));
  const { h, clock } = clocked([call("notion_create", { ...PRD_A, sections }), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  for (const kind of ["cancel", "approve"] as const) {
    const closed = (await press(d, question, kind))!;
    const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, []));
    assert.deepEqual(d.views.refused, []);
    assert.equal(shown.blocks.length <= 100, true);
    assert.ok(words(shown).includes(DRAFT_LEFT_OUT));
    if (kind === "cancel") assert.ok(noteOf(shown), "the note is never pushed out");
  }
});

test("both pop-ups keep their choices in input blocks: no radio buttons, checkboxes or select in an actions block", async () => {
  // Slack's mobile client drops a modal whose actions block holds a radio
  // group, so every choice sits in an input block that dispatches its press.
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const choices = new Set(["radio_buttons", "checkboxes", "static_select"]);
  for (const kind of ["cancel", "approve"] as const) {
    const closed = (await press(d, question, kind))!;
    const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [a]));
    const hidden = await redraw(d, shown, { kind: "hide" }, stateOf(shown, [a]));

    assert.deepEqual(d.views.refused, []);
    for (const view of [closed, shown, hidden]) {
      const misplaced = view.blocks.filter((b) => b.type === "actions" && (b.elements ?? []).some((e) => choices.has(String(e.type))));
      assert.deepEqual(misplaced, [], `no choice in an actions block (${kind})`);
      assert.equal(listOf(view).type, "input", "the list is an input");
      const draft = view.blocks.find((b) => b.type === "input" && b.element?.action_id === "uno_which_draft")! as Block & {
        dispatch_action?: unknown;
        optional?: unknown;
        label?: { text: string };
      };
      assert.equal(draft.dispatch_action, true, "a draft chosen redraws");
      assert.equal(draft.optional, true, "Submit needs no draft open");
      assert.equal(draft.label?.text, "Draft");
    }
    assert.ok(hideAt(shown) > 0, "Hide draft stays a button");
  }
});

test("the select's block id changes with the open draft, so a redraw resets it", async () => {
  // Slack keeps an input's own pick across a views.update while its block_id
  // is unchanged and ignores the new initial_option, so the block_id carries
  // what the redraw shows: after Hide draft the select reads empty again, and
  // the same card chosen twice still fires.
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await press(d, question, "cancel"))!;
  const shownA = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [a]));
  const shownB = await redraw(d, shownA, { kind: "draft", cardTs: b }, stateOf(shownA, [a]));
  const hidden = await redraw(d, shownB, { kind: "hide" }, stateOf(shownB, [a]));

  const blockOf = (view: View, actionId: string) => view.blocks.find((x) => x.type === "input" && x.element?.action_id === actionId)!.block_id;
  assert.equal(blockOf(closed, "uno_which_draft"), "uno_which_draft_none");
  assert.equal(blockOf(shownA, "uno_which_draft"), `uno_which_draft_${a}`);
  assert.equal(blockOf(shownB, "uno_which_draft"), `uno_which_draft_${b}`);
  assert.equal(blockOf(hidden, "uno_which_draft"), "uno_which_draft_none");
});

// ── What a Submit is read as ────────────────────────────────────────────────

const CANCEL_TICKS = (...ts: string[]) => ({ uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: ts.map((value) => ({ value })) } } });
const APPROVE_PICK = (ts: string | null) => ({ uno_which_approve_card: { uno_which_approve_input: { type: "radio_buttons", selected_option: ts ? { value: ts } : null } } });

test("a Cancel Submit reads the ticks and the note, whatever the select holds in the state", () => {
  const state = {
    values: {
      uno_which_draft_none: { uno_which_draft: { type: "static_select", selected_option: { value: "1.2" } } },
      ...CANCEL_TICKS("1.1", "1.3"),
      uno_which_note: { uno_which_note_input: { type: "plain_text_input", value: "  later  " } },
    },
  };
  assert.deepEqual(whichSubmitOf(WHICH_CANCEL_CALLBACK_ID, state), { ok: true, submission: { kind: "cancel", picked: ["1.1", "1.3"], note: "later" } });
});

test("an Approve Submit reads its one radio pick, whatever the select holds in the state", () => {
  const state = { values: { uno_which_draft_none: { uno_which_draft: { type: "static_select", selected_option: { value: "1.2" } } }, ...APPROVE_PICK("1.1") } };
  assert.deepEqual(whichSubmitOf(WHICH_APPROVE_CALLBACK_ID, state), { ok: true, submission: { kind: "approve", card: "1.1" } });
});

test("a Submit with nothing picked, or no state for its list, is an error under the list", () => {
  for (const state of [undefined, {}, { values: {} }, { values: CANCEL_TICKS() }, { values: { uno_which_cards_cancel: {} } }]) {
    assert.deepEqual(whichSubmitOf(WHICH_CANCEL_CALLBACK_ID, state), { ok: false, errors: { uno_which_cards_cancel: TICK_ONE } }, JSON.stringify(state));
  }
  for (const state of [undefined, {}, { values: {} }, { values: APPROVE_PICK(null) }, { values: { uno_which_approve_card: {} } }]) {
    assert.deepEqual(whichSubmitOf(WHICH_APPROVE_CALLBACK_ID, state), { ok: false, errors: { uno_which_approve_card: PICK_ONE } }, JSON.stringify(state));
  }
});

test("a Submit whose control does not match its pop-up's kind is refused", () => {
  const refused = (callbackId: string, values: Record<string, unknown>) => {
    const sent = whichSubmitOf(callbackId, { values });
    assert.equal(sent.ok, false, `${callbackId} ${JSON.stringify(values)}`);
    return sent.ok ? {} : sent.errors;
  };
  // An Approve pop-up's Submit carrying ticks, beside its pick or alone.
  refused(WHICH_APPROVE_CALLBACK_ID, CANCEL_TICKS("1.1"));
  refused(WHICH_APPROVE_CALLBACK_ID, { ...APPROVE_PICK("1.1"), ...CANCEL_TICKS("1.2") });
  // Its own block holding checkboxes, not a radio pick.
  refused(WHICH_APPROVE_CALLBACK_ID, { uno_which_approve_card: { uno_which_approve_input: { type: "checkboxes", selected_options: [{ value: "1.1" }] } } });
  // A Cancel pop-up's Submit carrying a radio pick, beside its ticks or alone.
  refused(WHICH_CANCEL_CALLBACK_ID, APPROVE_PICK("1.1"));
  refused(WHICH_CANCEL_CALLBACK_ID, { ...CANCEL_TICKS("1.1"), ...APPROVE_PICK("1.2") });
  // Its own block holding a radio pick, or a multi-select, not checkboxes.
  refused(WHICH_CANCEL_CALLBACK_ID, { uno_which_cards_cancel: { uno_which_cards_input: { type: "radio_buttons", selected_option: { value: "1.1" } } } });
  refused(WHICH_CANCEL_CALLBACK_ID, { uno_which_cards_cancel: { uno_which_cards_input: { type: "multi_static_select", selected_options: [{ value: "1.1" }] } } });
  // The old switch's radio pick beside the ticks.
  const errors = refused(WHICH_CANCEL_CALLBACK_ID, {
    uno_which_decision_cancel: { uno_which_decision: { type: "radio_buttons", selected_option: { value: "cancel" } } },
    ...CANCEL_TICKS("1.1"),
  });
  assert.deepEqual(errors, { uno_which_decision_cancel: REOPEN });
});

test("a Submit from a view opened before the two pop-ups is refused, whatever its state holds", () => {
  for (const values of [CANCEL_TICKS("1.1"), APPROVE_PICK("1.1"), { uno_which_cards_confirm: { uno_which_cards_input: { type: "radio_buttons", selected_option: { value: "1.1" } } } }]) {
    const sent = whichSubmitOf(WHICH_OLD_CALLBACK_ID, { values });
    assert.equal(sent.ok, false);
    assert.deepEqual(sent.ok ? null : Object.values(sent.errors), [REOPEN], "one error, under a block the view has");
    assert.ok(!sent.ok && Object.keys(values).includes(Object.keys(sent.errors)[0]!));
  }
  assert.deepEqual(whichSubmitOf(WHICH_OLD_CALLBACK_ID, undefined), { ok: false, errors: { uno_which_cards_cancel: REOPEN } });
  assert.equal(whichSubmitOf("uno_review_submit", { values: CANCEL_TICKS("1.1") }).ok, false);
  assert.match(REOPEN, /Open the question again/);
});

test("no Cancel path asks the Gate to approve, and no Approve path asks it to cancel", () => {
  // The Submit's paths, as written: each hands the Gate its own constant
  // decision and never names the other's.
  const source = readFileSync(resolve(process.cwd(), "src/slack/which-card.ts"), "utf8");
  const slice = (from: string, to: string) => {
    const at = source.indexOf(from);
    const end = source.indexOf(to, at + 1);
    assert.ok(at > 0 && end > at, `${from} is found`);
    return source.slice(at, end);
  };
  const cancelPath = slice("async function runWhichCancel", "\n}\n") + slice("async function cancelOne", "\n}\n");
  const approvePath = slice("async function runWhichApprove", "\n}\n") + slice("async function approveOne", "\n}\n");
  assert.doesNotMatch(cancelPath, /confirm|CONFIRM|Approv/);
  assert.match(cancelPath, /const decision = CANCEL;/);
  assert.doesNotMatch(approvePath, /\bcancel\b|CANCEL|Cancel/);
  assert.match(approvePath, /const decision = CONFIRM;/);
  assert.match(source, /const CANCEL = "cancel" as const;/);
  assert.match(source, /const CONFIRM = "confirm" as const;/);
  // The submission each path takes is its own kind's, by type.
  const dispatch = slice("export async function runWhichSubmit", "\n}\n");
  assert.match(dispatch, /submission\.kind === "approve"/);
});

// ── Approving ───────────────────────────────────────────────────────────────

test("an Approve Submit approves exactly the picked card through its own door: the other stays live", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "approve"))!;
  const from = h.delivery.calls.length;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved.map((r) => [r.toolName, r.decision, r.executed]), [["notion_create", "confirm", true]], "one approval, which runs");
  assert.deepEqual(await live(h), [b], "card A was approved, card B is still waiting");
  assert.deepEqual(d.cardEdits.map((e) => e.ts), [a], "the card approved is the one edited");
  assert.match(words(answer), /Backup tutor matching\*: Approved\./);
  // Its outcome is posted in the thread, as its own button's is.
  const notes = h.delivery.calls.slice(from).flatMap((c) => (c.kind === "gate-note" ? [c.note.kind] : []));
  assert.deepEqual(notes, ["resolved"]);
  const redrawn = d.questionEdits.at(-1)!;
  assert.equal(messageBlocksRefusal(redrawn.blocks), null);
  assert.equal(sectionOf(redrawn), "1 card is still waiting.\n~Backup tutor matching~");
  assert.deepEqual(buttonsOf(redrawn).map((x) => x.text.text), ["Approve…", "Cancel…"], "both stay for the card still waiting");
  assert.equal(d.questionEdits.length, 1, "one edit of the question");
});

test("an Approve Submit cannot cancel: every verdict it asks for is an approval", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "approve"))!;

  await submit(d, view, stateOf(view, [b]));

  assert.deepEqual(h.resolved.map((r) => r.decision), ["confirm"]);
  const lookup = await h.threadState.getProposalByTs(b);
  assert.notEqual(lookup.state, "found", "the picked card is decided");
});

test("a Cancel Submit cannot approve: every verdict it asks for is a cancel, nothing runs", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "✅");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;

  await submit(d, view, stateOf(view, [a, b]));

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["cancel", false], ["cancel", false]]);
});

test("an Approve Submit naming a card the question did not list runs nothing", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "approve"))!;
  const popup = whichPopupOf(view.private_metadata)!;
  const fewer = { ...popup, cards: popup.cards.filter((c) => c.ts !== a) };

  await runWhichSubmit({ viewId: "V1", popup: fewer, submission: { kind: "approve", card: a }, userId: "U1" }, d.deps);

  assert.deepEqual(h.resolved, []);
  assert.deepEqual(await live(h), [a, b].sort());
});

test("a card approved elsewhere while the Approve pop-up was open is refused at Submit, not decided twice", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "approve"))!;
  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "confirm", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const before = h.resolved.length;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.equal(h.resolved.length, before, "nothing ran a second time");
  assert.deepEqual(d.cardEdits, [], "the card is not edited again");
  assert.ok(words(answer).includes(renderGateNote({ kind: "already-resolved" }).slice(0, 40)));
});

test("an Approve Submit made after the question lapsed runs nothing", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "approve"))!;
  clock.now = cardExpiresAt(ASKED_AT_MS) + 1;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved, []);
  assert.ok(words(answer).includes("expired"));
});

// ── Canceling ───────────────────────────────────────────────────────────────

test("a Cancel Submit from a ✅'s question cancels the ticked card through its own door: nothing is approved, the other stays live", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["cancel", false]]);
  assert.deepEqual(await live(h), [b], "card A was canceled, card B is still waiting");
  assert.deepEqual(d.cardEdits.map((e) => e.ts), [a], "the card decided is the one edited");
  assert.match(words(answer), /Backup tutor matching\*: Canceled\./);
  const redrawn = d.questionEdits.at(-1)!;
  assert.equal(messageBlocksRefusal(redrawn.blocks), null);
  assert.equal(sectionOf(redrawn), "1 card is still waiting.\n~Backup tutor matching~");
  assert.deepEqual(buttonsOf(redrawn).map((x) => x.text.text), ["Approve…", "Cancel…"], "both stay for the card still waiting");
  assert.equal(d.questionEdits.length, 1, "one edit of the question");
  assert.deepEqual(h.delivery.calls.filter((c) => c.kind === "redraw-which"), [], "its own question is redrawn here, not by the door");
});

test("Cancel decides every card ticked, and the question says Decided.", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;

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
  const view = (await press(d, question, "cancel"))!;

  await submit(d, view, stateOf(view, [a], "  not this quarter  "));

  const note = h.resolved[0]?.note;
  assert.equal(note?.kind === "resolved" && note.rejected?.reason, "not this quarter");
});

test("a card decided elsewhere while the Cancel pop-up was open is refused at Submit, not decided twice", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
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

test("the question's buttons lapse 24 weekday hours after it was asked: nothing opens, the presser is told", async () => {
  for (const kind of ["approve", "cancel"] as const) {
    const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
    const { question } = await asked(h);
    clock.now = cardExpiresAt(ASKED_AT_MS) + 1;
    const d = doors(h, clock);

    await press(d, question, kind);

    assert.deepEqual(d.views.calls, [], "no pop-up");
    assert.deepEqual(d.ephemerals, [WHICH_EXPIRED_REPLY]);
    assert.deepEqual(buttonsOf(d.questionEdits.at(-1)!), [], "the lapsed question keeps no button");
    assert.match(JSON.stringify(d.questionEdits.at(-1)!.blocks), /Expired\./);
    assert.deepEqual(h.resolved, [], "nothing ran");
  }
});

test("a Cancel Submit made after the question lapsed runs nothing", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
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
  const view = (await press(d, question, "cancel"))!;

  const answer = await submit(d, view, stateOf(view, [b, a]));

  assert.deepEqual(await live(h), [a], "the first card is decided; the second was not reached");
  assert.match(words(answer), /Backup tutor matching\*: not reached this time/);
});

test("a numbered button on a question posted before the pop-up says so", () => {
  assert.equal(isLegacyWhichPress("uno_which_confirm_0"), true);
  assert.equal(isLegacyWhichPress(WHICH_CHOOSE_ACTION_ID), false);
  assert.equal(isLegacyWhichPress(WHICH_APPROVE_ACTION_ID), false);
  assert.equal(isLegacyWhichPress(WHICH_CANCEL_ACTION_ID), false);
  assert.match(LEGACY_WHICH_REPLY, /Approve… or Cancel…/);
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

test("a card that lapsed before the question, picked there, runs nothing and stays off the question", async () => {
  // Card A is staged the day before the question, so it lapses first:
  // Wednesday 12:00 ET, against a question asked Wednesday 11:00 ET.
  for (const kind of ["approve", "cancel"] as const) {
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
    const view = (await press(d, whichCardMessage(note), kind))!;
    assert.ok(optionsOf(view).some((o) => o.value === a), "A is offered while it is live");
    clock.now = Date.UTC(2026, 9, 14, 16, 30);

    await submit(d, view, stateOf(view, [a]));

    assert.deepEqual(h.resolved, [], `nothing ran (${kind})`);
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

test("a redraw that lands after the view moved on is dropped: it carries the hash it was pressed on", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  // Slack holds the view at hash H2 by the time the press is handled: the
  // Submit's ack replaced it.
  const d = doors(h, clock, {}, () => "H2");
  const view = (await press(d, question, "cancel"))!;

  await redraw(d, view, { kind: "draft", cardTs: a }, stateOf(view, []), "H1");

  const last = d.views.calls.at(-1)!;
  assert.equal(last.kind === "update" && last.hash, "H1", "the press's own hash rides the update");
  assert.equal(last.kind === "update" && last.conflict, true, "and Slack refuses it");
  assert.deepEqual(d.views.refused, [], "a conflict is dropped quietly");
});

test("each ticked card's mark on the question is spent inside its own budget step, before the next card's check", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const events: string[] = [];
  const d = doors(h, clock, { headroom: () => (events.push("check"), 100) });
  const view = (await press(d, question, "cancel"))!;
  // B is decided on its own card first, so here it loses and is only marked.
  await runButtonDoor(
    { channel: CHANNEL, messageTs: b, decision: "cancel", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const store = h.threadState;
  const mark = store.decideInWhichQuestion.bind(store);
  store.decideInWhichQuestion = async (ts, q) => (events.push(`mark:${ts === b ? "b" : "a"}`), mark(ts, q));

  await submit(d, view, stateOf(view, [b, a]));

  // Counted against B's own step: a budget stop before A cannot leave B's
  // mark unspent, and the question unstruck.
  assert.ok(events.indexOf("mark:b") >= 0 && events.indexOf("mark:b") < events.indexOf("check"), events.join(" "));
  assert.deepEqual(await live(h), []);
  assert.match(JSON.stringify(d.questionEdits.at(-1)!.blocks), /Decided\./);
});

/** What was said in the thread from the call `from` on: every post, a gate
 *  note or a plain one, and never a note edited onto its card. */
const threadLines = (h: Harness, from: number) =>
  h.delivery.calls.slice(from).flatMap((c) => (c.kind === "note" ? [c.text] : c.kind === "gate-note" && !c.card ? [renderGateNote(c.note)] : []));

test("a Cancel of several says one line in the thread, naming every card it canceled", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [a, b]));

  assert.deepEqual(threadLines(h, from), ["Canceled *Backup tutor matching* and *Session reflections*."]);
});

test("a Cancel of one, with a note, says one line naming it; the reason stays on the card", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [b], "not this quarter"));

  assert.deepEqual(threadLines(h, from), ["Canceled *Session reflections*."]);
  const note = h.resolved.at(-1)?.note;
  assert.equal(note?.kind === "resolved" && note.rejected?.reason, "not this quarter");
});

test("a Cancel names only the cards it canceled: one decided elsewhere is left out", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "cancel", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [a, b]));

  assert.deepEqual(threadLines(h, from), ["Canceled *Session reflections*."]);
});

test("a Cancel names only the cards it canceled: one past the budget is left out", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock, { headroom: () => 5 });
  const view = (await press(d, question, "cancel"))!;
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [b, a]));

  assert.deepEqual(threadLines(h, from), ["Canceled *Session reflections*."]);
});

test("a Cancel that canceled nothing says nothing in the thread", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
  await runButtonDoor(
    { channel: CHANNEL, messageTs: a, decision: "cancel", userId: "U2" },
    { ...d.deps, replaceCard: async () => {}, replyEphemeral: async () => {} },
  );
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(threadLines(h, from), []);
});

test("a blank headline is named as That card, never drawn as empty bold", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await press(d, question, "cancel"))!;
  const popup = whichPopupOf(view.private_metadata)!;
  const blank = { ...popup, cards: popup.cards.map((card) => (card.ts === a ? { ...card, headline: "   " } : card)) };
  const from = h.delivery.calls.length;

  await runWhichSubmit({ viewId: "V1", popup: blank, submission: { kind: "cancel", picked: [a], note: "" }, userId: "U1" }, d.deps);

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
