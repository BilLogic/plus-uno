// The "which one?" question and the pop-up its Choose… button opens (#1342).
//
// A decision that named no card, with several waiting, is answered with one
// short line and one Choose… button (`tests/which-card-turn.test.ts` drives
// the asking). The pop-up only cancels, whatever asked: the waiting cards as
// checkboxes, each card's draft under "Show a draft…", and Submit cancels the
// ticked cards through the same door as each card's own ⛔, leaving the
// others live. An approval is made from the card's own Review, which the
// question says when an approval asked it. The question lapses on the card
// rule, 24 weekday hours after it was asked.
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
  canceledLine,
  chooseValueOf,
  isLegacyWhichPress,
  runWhichOpen,
  runWhichRedraw,
  runWhichSubmit,
  whichCardMessage,
  type WhichDoorDeps,
  type WhichRedraw,
} from "../src/slack/which-card";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DRAFT_LEFT_OUT, REOPEN, TICK_ONE, WHICH_CALLBACK_ID, WHICH_LEAD, whichPopupOf, whichSubmitOf } from "../src/slack/which-card-view";
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
type Select = { type: string; placeholder: { text: string }; options: Array<{ value: string; text: { text: string } }>; initial_option?: { value: string } };
/** Every "Show a draft…" select in the view, and where each sits. */
const draftSelects = (view: View) =>
  view.blocks.flatMap((b, at) => (b.type === "input" && b.element?.action_id === "uno_which_draft" ? [{ at, select: b.element as unknown as Select }] : []));
/** Where Hide draft sits, or -1. */
const hideAt = (view: View) => view.blocks.findIndex((b) => b.type === "actions" && b.elements?.[0]?.action_id === "uno_which_hide");
const noteOf = (view: View) => view.blocks.find((x) => x.block_id === "uno_which_note");
const optionsOf = (view: View) => ((listOf(view).element!.options as Array<{ value: string; text: { text: string }; description: { text: string } }>));

/** A view state as Slack sends it: the list's ticks and the note. */
function stateOf(view: View, picked: string[], note = "") {
  const list = listOf(view);
  const element = list.element!;
  const value = { type: "checkboxes", selected_options: picked.map((value) => ({ value })) };
  const typed = noteOf(view) ? { uno_which_note: { uno_which_note_input: { value: note } } } : {};
  return { values: { [list.block_id!]: { [String(element.action_id)]: value }, ...typed } };
}

async function redraw(d: ReturnType<typeof doors>, view: View, press: WhichRedraw, state: unknown, hash?: string) {
  await runWhichRedraw({ viewId: "V1", popup: whichPopupOf(view.private_metadata)!, state, ...(hash ? { hash } : {}), press, userId: "U1" }, d.deps);
  return d.views.calls.at(-1)!.view as View;
}

async function submit(d: ReturnType<typeof doors>, view: View, state: unknown) {
  const popup = whichPopupOf(view.private_metadata)!;
  const sent = whichSubmitOf(state);
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
  assert.equal((buttons[0] as { style?: string }).style, undefined, "Choose… is not colored");
  assert.deepEqual(chooseValueOf(buttons[0]!.value), { cards: [b, a] });
  assert.match(buttons[0]!.value, /^cancel:/, "the button carries no approval");
  // Asked by a ✅, the line says where an approval is made: the pop-up only
  // cancels.
  assert.equal(sectionOf(question), "2 cards are waiting, nothing ran yet. Approve from a card's Review.");
  assert.doesNotMatch(JSON.stringify(question.blocks), /Session reflections|Backup tutor matching/);
  // The text copy, which a notification reads, still names them.
  assert.match(question.text, /^2 cards are waiting, nothing ran yet\. Approve from a card's Review\. Waiting: \*Session reflections\*, \*Backup tutor matching\*\.$/);
  assert.doesNotMatch(JSON.stringify(question.blocks), /Expires|<!date/, "no deadline shown");
});

test("a question posted while the pop-up also approved still opens, and its pop-up only cancels", () => {
  assert.deepEqual(chooseValueOf("confirm:1.1,1.2"), { cards: ["1.1", "1.2"] });
  assert.deepEqual(chooseValueOf("cancel:1.1"), { cards: ["1.1"] });
  assert.equal(chooseValueOf("1.1"), null);
});

test("Choose… from a ✅ opens a loading view, then the cards to cancel: checkboxes, no Approve anywhere", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);

  const view = (await choose(d, question))!;

  assert.deepEqual(d.views.refused, []);
  assert.deepEqual(d.views.calls.map((c) => c.kind), ["open", "update"], "opened first, filled after the read");
  assert.equal(view.callback_id, WHICH_CALLBACK_ID);
  assert.deepEqual(view.submit, { type: "plain_text", text: "Cancel cards" }, "the footer says what Submit does");
  assert.equal((view.blocks[0] as Block).text?.text, WHICH_LEAD);
  assert.equal(listOf(view).element!.type, "checkboxes");
  assert.doesNotMatch(words(view), /radio_buttons|uno_which_decision|Approve which/, "no switch and no Approve list");
  assert.doesNotMatch(view.private_metadata, /"d"|confirm/, "no decision in the metadata");
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

test("a ⛔ asks with the plain line, and opens the same pop-up", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { question } = await asked(h, "⛔");
  assert.equal(sectionOf(question), "2 cards are waiting, nothing ran yet.");
  clock.now = SOON;
  const view = (await choose(doors(h, clock), question))!;
  assert.equal(listOf(view).element!.type, "checkboxes");
  const note = noteOf(view)!;
  assert.equal((note as { hint?: unknown }).hint, undefined, "the note has no hint");
});

test("a press on the old Approve / Cancel switch redraws the view without it, keeping the ticks and the note", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;

  const again = await redraw(d, view, { kind: "redraw" }, stateOf(view, [a], "not this week"));

  assert.deepEqual(d.views.refused, []);
  assert.deepEqual(h.resolved, [], "a redraw decides nothing");
  assert.deepEqual((listOf(again).element!.initial_options as Array<{ value: string }>).map((o) => o.value), [a]);
  assert.equal(noteOf(again)!.element!.initial_value, "not this week");
});

test("choosing a card under Show a draft… opens its draft below, as its Review draws it; Hide draft closes it; the pick survives", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await choose(d, question))!;

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

test("a draft too long for the view is cut, and points at the card's own Review", async () => {
  const sections = Array.from({ length: 120 }, (_, i) => ({ heading: `Part ${i + 1}`, body: `Body ${i + 1}.` }));
  const { h, clock } = clocked([call("notion_create", { ...PRD_A, sections }), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await choose(d, question))!;

  const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, []));

  assert.deepEqual(d.views.refused, []);
  assert.equal(shown.blocks.length <= 100, true);
  assert.ok(words(shown).includes(DRAFT_LEFT_OUT));
  assert.ok(noteOf(shown), "the note is never pushed out");
});

test("the pop-up keeps its choices in input blocks: no radio buttons, checkboxes or select in an actions block", async () => {
  // Slack's mobile client drops a modal whose actions block holds a radio
  // group, so every choice sits in an input block that dispatches its press.
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const closed = (await choose(d, question))!;
  const shown = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [a]));
  const hidden = await redraw(d, shown, { kind: "hide" }, stateOf(shown, [a]));

  assert.deepEqual(d.views.refused, []);
  const choices = new Set(["radio_buttons", "checkboxes", "static_select"]);
  for (const view of [closed, shown, hidden]) {
    const misplaced = view.blocks.filter((b) => b.type === "actions" && (b.elements ?? []).some((e) => choices.has(String(e.type))));
    assert.deepEqual(misplaced, [], "no choice in an actions block");
    assert.doesNotMatch(words(view), /radio_buttons/, "no radio group anywhere");
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
  const closed = (await choose(d, question))!;
  const shownA = await redraw(d, closed, { kind: "draft", cardTs: a }, stateOf(closed, [a]));
  const shownB = await redraw(d, shownA, { kind: "draft", cardTs: b }, stateOf(shownA, [a]));
  const hidden = await redraw(d, shownB, { kind: "hide" }, stateOf(shownB, [a]));

  const blockOf = (view: View, actionId: string) => view.blocks.find((x) => x.type === "input" && x.element?.action_id === actionId)!.block_id;
  assert.equal(blockOf(closed, "uno_which_draft"), "uno_which_draft_none");
  assert.equal(blockOf(shownA, "uno_which_draft"), `uno_which_draft_${a}`);
  assert.equal(blockOf(shownB, "uno_which_draft"), `uno_which_draft_${b}`);
  assert.equal(blockOf(hidden, "uno_which_draft"), "uno_which_draft_none");
});

test("Submit reads the cancel list's ticks and the note, whatever the select holds in the state", () => {
  const state = {
    values: {
      uno_which_draft_none: { uno_which_draft: { type: "static_select", selected_option: { value: "1.2" } } },
      uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: [{ value: "1.1" }, { value: "1.3" }] } },
      uno_which_note: { uno_which_note_input: { type: "plain_text_input", value: "  later  " } },
    },
  };
  assert.deepEqual(whichSubmitOf(state), { ok: true, pick: { picked: ["1.1", "1.3"], note: "later" } });
});

test("Submit with nothing ticked, or no checkboxes in its state, is an error under the list", () => {
  for (const state of [undefined, { values: {} }, { values: { uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: [] } } } }]) {
    assert.deepEqual(whichSubmitOf(state), { ok: false, errors: { uno_which_cards_cancel: TICK_ONE } });
  }
  // A list that is not checkboxes is not ticks.
  const other = { values: { uno_which_cards_cancel: { uno_which_cards_input: { type: "multi_static_select", selected_options: [{ value: "1.1" }] } } } };
  assert.equal(whichSubmitOf(other).ok, false);
});

test("Submit refuses a state holding a radio pick, as a view drawn with the old Approve / Cancel switch sends", () => {
  const approveList = { values: { uno_which_cards_confirm: { uno_which_cards_input: { type: "radio_buttons", selected_option: { value: "1.1" } } } } };
  assert.deepEqual(whichSubmitOf(approveList), { ok: false, errors: { uno_which_cards_confirm: REOPEN } });
  const switchBeside = {
    values: {
      uno_which_decision_cancel: { uno_which_decision: { type: "radio_buttons", selected_option: { value: "cancel" } } },
      uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: [{ value: "1.1" }] } },
    },
  };
  assert.deepEqual(whichSubmitOf(switchBeside), { ok: false, errors: { uno_which_decision_cancel: REOPEN } });
});

test("no code path from the pop-up's Submit asks the Gate to approve", () => {
  // The Submit's two functions, as written: neither names an approval, and
  // the one decision they hand the Gate is the constant cancel.
  const source = readFileSync(resolve(process.cwd(), "src/slack/which-card.ts"), "utf8");
  const from = source.indexOf("export async function runWhichSubmit");
  const to = source.indexOf("async function markHere");
  assert.ok(from > 0 && to > from, "the Submit's functions are found");
  const submitPath = source.slice(from, to);
  assert.doesNotMatch(submitPath, /confirm|Approv/);
  assert.match(submitPath, /const decision = CANCEL;/);
  assert.match(source, /const CANCEL = "cancel" as const;/);
  // And the request it takes has no decision to carry.
  const request = source.slice(source.indexOf("export interface WhichSubmitRequest"));
  assert.doesNotMatch(request.slice(0, request.indexOf("\n}\n")), /decision/);
});

test("a Submit from a ✅'s question cancels the ticked card through its own door: nothing is approved, the other stays live", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, b, question } = await asked(h);
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;

  const answer = await submit(d, view, stateOf(view, [a]));

  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["cancel", false]]);
  assert.deepEqual(await live(h), [b], "card A was canceled, card B is still waiting");
  assert.deepEqual(d.cardEdits.map((e) => e.ts), [a], "the card decided is the one edited");
  assert.match(words(answer), /Backup tutor matching\*: Canceled\./);
  const redrawn = d.questionEdits.at(-1)!;
  assert.equal(messageBlocksRefusal(redrawn.blocks), null);
  assert.equal(sectionOf(redrawn), "1 card is still waiting. Approve from a card's Review.\n~Backup tutor matching~");
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

test("a redraw that lands after the view moved on is dropped: it carries the hash it was pressed on", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h);
  clock.now = SOON;
  // Slack holds the view at hash H2 by the time the press is handled: the
  // Submit's ack replaced it.
  const d = doors(h, clock, {}, () => "H2");
  const view = (await choose(d, question))!;

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
  const view = (await choose(d, question))!;
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
  const view = (await choose(d, question))!;
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [a, b]));

  assert.deepEqual(threadLines(h, from), ["Canceled *Backup tutor matching* and *Session reflections*."]);
});

test("a Cancel of one, with a note, says one line naming it; the reason stays on the card", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { b, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;
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
  const view = (await choose(d, question))!;
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
  const view = (await choose(d, question))!;
  const from = h.delivery.calls.length;

  await submit(d, view, stateOf(view, [b, a]));

  assert.deepEqual(threadLines(h, from), ["Canceled *Session reflections*."]);
});

test("a Cancel that canceled nothing says nothing in the thread", async () => {
  const { h, clock } = clocked([call("notion_create", PRD_A), call("notion_create", PRD_B)]);
  const { a, question } = await asked(h, "⛔");
  clock.now = SOON;
  const d = doors(h, clock);
  const view = (await choose(d, question))!;
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
  const view = (await choose(d, question))!;
  const popup = whichPopupOf(view.private_metadata)!;
  const blank = { ...popup, cards: popup.cards.map((card) => (card.ts === a ? { ...card, headline: "   " } : card)) };
  const from = h.delivery.calls.length;

  await runWhichSubmit({ viewId: "V1", popup: blank, pick: { picked: [a], note: "" }, userId: "U1" }, d.deps);

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
