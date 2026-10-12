// A change to existing content, reviewed as Before and After, with the
// proposed text edited in the Review pop-up itself.
//
// Driven at the review door, as `tests/review-popup.test.ts` drives it: the
// in-memory ThreadState, a views client that refuses what Slack refuses, and
// a submit built the way Slack builds one — the draft's own blocks, and a
// `view.state` holding what the person typed into them.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, type ReviewDoorDeps } from "../src/slack/review-door";
import { reviewSubmitOf } from "../src/slack/review-view";
import type { GateVerdict } from "../src/gate/index";
import { recordingViews } from "./helpers/recording-slack";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";
const PAGE = "https://www.notion.so/Reflection-0123456789abcdef0123456789abcdef";

const NOW_SAYS = "Tutors answer five questions after each session.";
const WILL_SAY = "Tutors answer three questions after each session.";

/** A block rewrite as a turn stages it, with the block's text as the staging
 *  read it. */
const REWRITE: PendingProposal = {
  toolName: "notion_update",
  input: {
    page_url: PAGE,
    properties: { "Design Status": "In Review" },
    replace: [{ block_id: "b1", last_edited_time: "2026-10-01T09:00:00.000Z", content: WILL_SAY }],
  },
  before: { "0.properties.Design Status": "In Progress", "0.replace.0.content": NOW_SAYS },
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1700000000.000190",
  proposalTs: CARD_TS,
  proposalText: ":warning: About to *update this Notion page*",
  requesterUserId: "U1",
};

type Block = {
  type: string;
  block_id?: string;
  optional?: boolean;
  label?: { text: string };
  text?: { text: string };
  elements?: Array<{ text?: string }>;
  element?: { type: string; initial_value?: string; multiline?: boolean };
  accessory?: { action_id?: string };
};
type View = { blocks: Block[]; private_metadata: string; callback_id: string };

async function harness(over: Partial<PendingProposal> = {}) {
  const threadState = createInMemoryThreadState();
  await threadState.putProposal({ ...REWRITE, ...over });
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const revisions: string[] = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async () => {},
    restage: async () => {},
    revise: async ({ note }) => void revisions.push(note),
    fieldOptions: async () => [],
  };
  return { deps, views, ran, revisions };
}

/** The draft a person is shown on Review. */
async function draftFor(h: Awaited<ReturnType<typeof harness>>, userId = "U2"): Promise<View> {
  await runReviewOpen({ triggerId: "T.open", channel: CHANNEL, messageTs: CARD_TS, userId }, h.deps);
  assert.deepEqual(h.views.refused, []);
  return h.views.calls.at(-1)!.view as View;
}

/** Each block's words, in order. An input reads as its label and its value. */
function lines(view: View): string[] {
  return view.blocks.map((b) => {
    if (b.type === "input") return `input: ${b.label?.text} = ${b.element?.initial_value ?? ""}`;
    if (b.text?.text) return `${b.type}: ${b.text.text}`;
    return `${b.type}: ${(b.elements ?? []).map((e) => e.text ?? "").join(" ")}`;
  });
}

const REPLACEMENT_BLOCK = "uno_field:0.replace.0.content";

/** The submit Slack sends from this draft: its blocks, and a state holding the
 *  decision, the note and whatever was typed into the fields. */
function submitted(view: View, decision: string, typed: Record<string, string> = {}, note = "") {
  const values: Record<string, Record<string, unknown>> = {
    uno_review_choice: { uno_review_choice_input: { type: "radio_buttons", selected_option: { value: decision } } },
    uno_review_note: { uno_review_note_input: { type: "plain_text_input", value: note || null } },
  };
  for (const block of view.blocks) {
    if (block.type !== "input" || !block.block_id?.startsWith("uno_field:")) continue;
    values[block.block_id] = { value: { type: "plain_text_input", value: typed[block.block_id] ?? block.element?.initial_value ?? null } };
  }
  return { ...view, state: { values } };
}

describe("a change to existing content shows Before and After", () => {
  it("shows a rewritten block as it reads now, then the proposed text", async () => {
    const all = lines(await draftFor(await harness()));
    const words = all.join("\n");
    const before = all.findIndex((l) => l.includes(NOW_SAYS));
    const after = all.findIndex((l) => l.includes(WILL_SAY));
    assert.ok(before >= 0 && after > before, words);
    assert.match(words, /Before/);
    assert.match(all[after]!, /^input: After = /);
  });

  it("shows a property's value now beside the value it will have", async () => {
    const words = lines(await draftFor(await harness())).join("\n");
    assert.match(words, /\*Design Status:\* In Progress → In Review/);
  });

  it("says so when the block's current text was not captured at staging", async () => {
    const words = lines(await draftFor(await harness({ before: {} }))).join("\n");
    assert.match(words, /current text wasn't captured/);
    assert.match(words, new RegExp(`input: Text = ${WILL_SAY}`));
  });

  it("opens with nothing read from Notion: Before comes off the staged card", async () => {
    const h = await harness();
    await draftFor(h);
    // Open, then one update: no options read, nothing fetched in between.
    assert.deepEqual(h.views.calls.map((c) => c.kind), ["open", "update"]);
  });

  it("shows a non-confirmer Before and After as text, with nothing to edit", async () => {
    const view = await draftFor(await harness({ confirmers: ["U07CONFIRM"] }));
    const words = lines(view).join("\n");
    assert.match(words, new RegExp(NOW_SAYS));
    assert.match(words, new RegExp(WILL_SAY));
    assert.equal(view.blocks.filter((b) => b.type === "input").length, 0);
  });
});

describe("the proposed text is edited in the pop-up itself", () => {
  it("is a prefilled field in the draft, with no Edit fields to press", async () => {
    const view = await draftFor(await harness());
    const field = view.blocks.find((b) => b.block_id === REPLACEMENT_BLOCK)!;
    assert.equal(field.element?.type, "plain_text_input");
    assert.equal(field.element?.multiline, true);
    assert.equal(field.element?.initial_value, WILL_SAY);
    // Optional to Slack, so Reject and Needs changes are never blocked by it.
    assert.equal(field.optional, true);
    assert.doesNotMatch(JSON.stringify(view), /uno_review_edit"/);
  });

  it("writes the edited text on Approve, to the same block", async () => {
    const h = await harness();
    const view = await draftFor(h);
    const submit = reviewSubmitOf(submitted(view, "confirm", { [REPLACEMENT_BLOCK]: "Tutors answer two questions after each session." }));
    assert.ok(submit.ok);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...submit.request }, h.deps);
    assert.equal(h.ran.length, 1);
    assert.deepEqual((h.ran[0]!.execute!.input as { replace: unknown }).replace, [
      { block_id: "b1", last_edited_time: "2026-10-01T09:00:00.000Z", content: "Tutors answer two questions after each session." },
    ]);
  });

  it("writes the draft as staged when the field is left alone", async () => {
    const h = await harness();
    const submit = reviewSubmitOf(submitted(await draftFor(h), "confirm"));
    assert.ok(submit.ok);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...submit.request }, h.deps);
    assert.deepEqual(h.ran[0]!.execute!.input, REWRITE.input);
  });

  it("refuses an emptied text in the pop-up, and writes nothing", async () => {
    const h = await harness();
    const submit = reviewSubmitOf(submitted(await draftFor(h), "confirm", { [REPLACEMENT_BLOCK]: "  " }));
    assert.ok(submit.ok);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...submit.request }, h.deps);
    assert.deepEqual(h.ran, []);
    assert.match(JSON.stringify(h.views.calls.at(-1)!.view), /Replacement text can't be empty/);
  });

  it("leaves Reject as it was: nothing runs, whatever was typed, and the reason is kept", async () => {
    const h = await harness();
    const submit = reviewSubmitOf(submitted(await draftFor(h), "cancel", { [REPLACEMENT_BLOCK]: "" }, "Wrong page"));
    assert.ok(submit.ok);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...submit.request }, h.deps);
    assert.equal(h.ran[0]?.decision, "cancel");
    assert.equal(h.ran[0]?.execute, undefined);
  });

  it("leaves Needs changes as it was: the note goes to the revision", async () => {
    const h = await harness();
    const submit = reviewSubmitOf(submitted(await draftFor(h), "revise", { [REPLACEMENT_BLOCK]: "edited" }, "Say four, not three"));
    assert.ok(submit.ok);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...submit.request }, h.deps);
    assert.deepEqual(h.revisions, ["Say four, not three"]);
    assert.deepEqual(h.ran, []);
  });
});

describe("text too long for a pop-up field", () => {
  const LONG = `${"Tutors answer questions. ".repeat(130)}`.trim();

  it("shows the text, offers no field for it, and says why", async () => {
    const h = await harness({
      input: { page_url: PAGE, replace: [{ block_id: "b1", last_edited_time: "2026-10-01T09:00:00.000Z", content: LONG }] },
      before: { "0.replace.0.content": NOW_SAYS },
    });
    assert.ok(LONG.length > 3000);
    const view = await draftFor(h);
    assert.equal(view.blocks.find((b) => b.block_id === REPLACEMENT_BLOCK), undefined);
    assert.match(lines(view).join("\n"), /over the 3,000 characters/);
  });
});
