// Editing a proposal's fields in the Review pop-up, and approving the edit.
//
// Driven at the review door the interactive endpoint hands a Slack payload to,
// as `tests/proposal-review.test.ts` drives it: the in-memory ThreadState, the
// recording Delivery and a views client that refuses what Slack refuses. Edit
// fields is a view pushed over the draft; Save edits keeps the values on the
// draft's `private_metadata`, and Approve carries them from there. Every case
// asserts what was written, what Slack was handed, or what the card was left
// saying.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import {
  runReviewDecision,
  runReviewOpen,
  runReviewPush,
  saveReviewEdits,
  type ReviewDoorDeps,
  type ReviewViewState,
} from "../src/slack/review-door";
import { reviewedCardOf } from "../src/slack/review-view";
import { recordingViews } from "./helpers/recording-slack";
import { CONFIRM_FOOTER, proposalCardBlocks } from "../src/slack/proposal-render";
import { cardWords } from "./helpers/card-message";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";

const PROPOSAL: PendingProposal = {
  toolName: "notion_create",
  input: {
    surface: "prd",
    title: "Reflection redesign",
    summary: "Tutors reflect after each session; the form is too long to finish.",
    properties: { product_pillar: "Tutor Experience" },
  },
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1700000000.000190",
  proposalTs: CARD_TS,
  proposalText: ":warning: About to *create a Notion page*:\n• *Title:* Reflection redesign",
  requesterUserId: "U1",
};

/** The Roadmap's Product Pillar options, as the live schema offers them. */
const PILLARS = ["Tutor Experience", "Student Experience", "Universal"];

async function staged(over: Partial<PendingProposal> = {}): Promise<ThreadState> {
  const store = createInMemoryThreadState();
  await store.putProposal({ ...PROPOSAL, ...over });
  return store;
}

function harness(threadState: ThreadState, opts: { pillars?: string[] | null } = {}) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const delivery = recordingDelivery();
  const ran: GateVerdict[] = [];
  const cardUpdates: Array<{ text: string; note: string }> = [];
  const optionReads: string[] = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => delivery,
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async (_channel, _ts, message) => void cardUpdates.push(cardWords(message)),
    restage: async () => {},
    revise: async () => {},
    fieldOptions: async (source) => {
      optionReads.push(`${source.database}/${source.property}`);
      return opts.pillars === undefined ? PILLARS : opts.pillars;
    },
  };
  return { deps, views, delivery, ran, cardUpdates, optionReads };
}

const open = (userId = "U2") => ({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId });

/** Approve, carrying the edits Save edits kept on the draft. */
const approve = (edits: Record<string, string>, userId = "U2") => ({
  viewId: "V1",
  channel: CHANNEL,
  messageTs: CARD_TS,
  userId,
  decision: "confirm" as const,
  edits,
});

/** Edit fields, pressed on the draft: the pushed view, filled. */
async function editFields(deps: ReviewDoorDeps, views: { calls: Array<{ kind: string; view: unknown }> }, edits?: Record<string, string>) {
  await runReviewPush({ triggerId: "T.edit", card: { channel: CHANNEL, ts: CARD_TS, ...(edits ? { edits } : {}) }, userId: "U2" }, deps);
  return views.calls.at(-1)!.view;
}

const text = (value: string) => ({ value: { type: "plain_text_input", value } });
const picked = (value: string) => ({ value: { type: "static_select", selected_option: { value } } });

type Block = {
  type: string;
  block_id?: string;
  label?: { text: string };
  element?: { type: string; initial_value?: string; initial_option?: { value: string }; options?: Array<{ value: string }> };
  text?: { text: string };
  level?: string;
};

const blocksOf = (view: unknown) => (view as { blocks: Block[] }).blocks;
/** The field inputs a view offers. */
const inputs = (view: unknown) =>
  blocksOf(view).filter((b) => b.type === "input" && (b.block_id ?? "").startsWith("uno_field:"));
const alerts = (view: unknown) => blocksOf(view).filter((b) => b.type === "alert");

describe("the pop-up offers the draft's fields", () => {
  it("gives a confirmer each field with the draft's value, and selects from the live options", async () => {
    const { deps, views, optionReads } = harness(await staged());
    await runReviewOpen(open(), deps);
    // The draft holds no input and reads no option: Edit fields does both.
    assert.deepEqual(inputs(views.calls[1]!.view), []);
    assert.deepEqual(optionReads, []);
    const view = await editFields(deps, views);
    assert.deepEqual(views.calls.map((c) => c.kind), ["open", "update", "push", "update"]);
    assert.equal((view as { submit: { text: string } }).submit.text, "Save edits");
    const fields = inputs(view);
    assert.deepEqual(
      fields.map((f) => [f.label?.text, f.element?.type]),
      [
        ["Title", "plain_text_input"],
        ["Summary", "plain_text_input"],
        ["Product Pillar", "static_select"],
      ],
    );
    assert.equal(fields[0]!.element?.initial_value, "Reflection redesign");
    const pillar = fields[2]!.element!;
    assert.deepEqual(pillar.options?.map((o) => o.value), PILLARS);
    assert.equal(pillar.initial_option?.value, "Tutor Experience");
    assert.deepEqual(optionReads, ["roadmap/Product Pillar"]);
    assert.deepEqual(views.refused, []);
  });

  it("shows a non-confirmer no fields to edit", async () => {
    const { deps, views } = harness(await staged({ confirmers: ["U07CONFIRM"] }));
    await runReviewOpen(open("U2"), deps);
    assert.doesNotMatch(JSON.stringify(views.calls[1]!.view), /uno_review_edit/);
    assert.deepEqual(inputs(await editFields(deps, views)), []);
  });

  it("leaves out a select whose options cannot be read, rather than offering a free guess", async () => {
    const { deps, views } = harness(await staged(), { pillars: null });
    assert.deepEqual(inputs(await editFields(deps, views)).map((f) => f.label?.text), ["Title", "Summary"]);
  });
});

describe("Approve with edits", () => {
  it("writes the edited title, and the card says who edited what", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await runReviewDecision(
      approve({ "0.title": ("Reflection, shorter form"), "0.summary": (String(PROPOSAL.input.summary)) }),
      deps,
    );
    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.execute?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.operations[0]?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.input.summary, PROPOSAL.input.summary);
    assert.deepEqual(cardUpdates.map((u) => u.note), [
      "<@U2> edited Title\n:white_check_mark: Approved by <@U2>",
    ]);
  });

  it("leaves the card and View showing the edited values, not the draft's", async () => {
    const proposalText = [
      ":warning: About to *create a Notion page*:",
      "• *Surface:* prd",
      "• *Title:* Reflection redesign",
      "• *Summary:* Tutors reflect after each session;\nthe form is too long to finish.",
      "• *Properties:*",
      "    • *Product pillar:* Tutor Experience",
      CONFIRM_FOOTER,
    ].join("\n");
    const threadState = await staged({ proposalText, input: { ...PROPOSAL.input, summary: "Tutors reflect after each session;\nthe form is too long to finish." } });
    const { deps, views, cardUpdates } = harness(threadState);
    await runReviewDecision(
      approve({
        "0.title": ("Reflection, shorter form"),
        "0.summary": ("One question after each session."),
        "0.properties.product_pillar": ("Universal"),
      }),
      deps,
    );
    const [update] = cardUpdates;
    assert.match(update!.note, /^<@U2> edited Title, Summary, Product Pillar\n:white_check_mark: Approved by <@U2>$/);
    for (const edited of ["Reflection, shorter form", "One question after each session.", "Universal"]) {
      assert.ok(update!.text.includes(edited), edited);
    }
    for (const stale of ["Reflection redesign", "too long to finish", "Tutor Experience"]) {
      assert.ok(!update!.text.includes(stale), stale);
    }
    // The card in the thread, re-rendered from that text, names the edit.
    assert.match(JSON.stringify(proposalCardBlocks(update!.text, update!.note)), /_Reflection, shorter form_/);

    // View, once decided, opens what the card now says.
    await runReviewOpen({ ...open(), cardText: `${update!.text}\n${update!.note}` }, deps);
    const view = JSON.stringify(views.calls.at(-1)!.view);
    assert.match(view, /Reflection, shorter form/);
    assert.doesNotMatch(view, /Reflection redesign/);
  });

  it("writes a picked option under the property the executor reads", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await runReviewDecision(approve({ "0.properties.product_pillar": ("Universal") }), deps);
    assert.deepEqual(ran[0]?.execute?.input.properties, { product_pillar: "Universal" });
    assert.match(cardUpdates[0]!.note, /edited Product Pillar/);
  });

  it("approves an untouched draft as staged, with no edit line", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await runReviewDecision(approve({ "0.title": ("Reflection redesign") }), deps);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.deepEqual(cardUpdates.map((u) => u.note), [":white_check_mark: Approved by <@U2>"]);
  });

  it("lets a standing confirmer's edit run with nobody else asked", async () => {
    const threadState = await staged({ confirmers: ["U07CONFIRM"] });
    const { deps, ran, delivery, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "0.title": ("Reflection v2") }, "U9"), {
      ...deps,
      standingConfirmers: ["U9"],
    });
    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.execute?.input.title, "Reflection v2");
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "confirm" }]);
    assert.match(cardUpdates[0]!.note, /^<@U9> edited Title\n/);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "none");
  });
});

describe("an edit the guards refuse", () => {
  it("refuses a placeholder title with an alert in the pop-up, and writes nothing", async () => {
    const threadState = await staged();
    const { deps, views, ran, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "0.title": ("TBD") }), deps);
    assert.deepEqual(ran, []);
    assert.deepEqual(cardUpdates, []);
    const view = views.calls.at(-1)!.view;
    const [alert] = alerts(view);
    assert.equal(alert?.level, "error");
    assert.match(alert?.text?.text ?? "", /Title/);
    assert.match(alert?.text?.text ?? "", /TBD/);
    // The pop-up stays a draft, with the person's own edit still on it and
    // still carried to the next Approve.
    assert.match(JSON.stringify(blocksOf(view)), /\*Title:\* TBD/);
    assert.deepEqual(reviewedCardOf((view as { private_metadata: string }).private_metadata)?.edits, { "0.title": "TBD" });
    assert.equal((view as { submit?: { text: string } }).submit?.text, "Submit");
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
    assert.deepEqual(views.refused, []);
  });

  it("refuses an emptied title", async () => {
    const { deps, views, ran } = harness(await staged());
    await runReviewDecision(approve({ "0.title": "" }), deps);
    assert.deepEqual(ran, []);
    assert.match(alerts(views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Title/);
  });

  it("refuses an option the database no longer offers", async () => {
    // Offered when the pop-up opened; gone from the schema by the time of Approve.
    const { deps, views, ran } = harness(await staged(), { pillars: ["Tutor Experience", "Universal"] });
    await runReviewDecision(approve({ "0.properties.product_pillar": ("Student Experience") }), deps);
    assert.deepEqual(ran, []);
    const alert = alerts(views.calls.at(-1)!.view)[0];
    assert.match(alert?.text?.text ?? "", /Student Experience/);
    assert.match(alert?.text?.text ?? "", /Product Pillar/);
  });
});

describe("Save edits, the Edit fields view's submit", () => {
  const text = (value: string) => ({ value: { type: "plain_text_input", value } });
  const picked = (value: string) => ({ value: { type: "static_select", selected_option: { value } } });

  /** Edit fields opened over the draft V1, and Save edits pressed with `state`. */
  async function save(state: ReviewViewState, opts: { edits?: Record<string, string> } = {}) {
    const h = harness(await staged());
    await runReviewOpen(open(), h.deps);
    const edit = await editFields(h.deps, h.views, opts.edits);
    const ack = await saveReviewEdits(
      { rootViewId: "V1", card: reviewedCardOf((edit as { private_metadata: string }).private_metadata)!, userId: "U2", blocks: blocksOf(edit), state },
      h.deps,
    );
    return { ...h, ack };
  }

  it("refuses a placeholder under the field, in Slack's own error, and leaves the draft as it was", async () => {
    const { ack, views } = await save({ "uno_field:0.title": text("[insert title]") });
    assert.equal(ack?.response_action, "errors");
    assert.match(ack!.errors["uno_field:0.title"]!, /Title is still a placeholder/);
    assert.deepEqual(views.calls.map((c) => c.kind), ["open", "update", "push", "update"], "the draft is not redrawn");
  });

  it("closes onto the draft, redrawn with the edit and carrying it to Approve", async () => {
    const { ack, views, deps, ran, cardUpdates } = await save({
      "uno_field:0.title": text("Reflection v2"),
      "uno_field:0.summary": text(String(PROPOSAL.input.summary)),
      "uno_field:0.properties.product_pillar": picked("Universal"),
    });
    assert.equal(ack, null, "an empty ack closes Edit fields onto the draft");
    const redrawn = views.calls.at(-1)!;
    assert.equal(redrawn.kind === "update" && redrawn.viewId, "V1");
    const words = JSON.stringify(blocksOf(redrawn.view));
    assert.match(words, /\*Title:\* Reflection v2/);
    assert.match(words, /\*Product Pillar:\* Universal/);
    assert.match(words, /Edited here: Title, Product Pillar/);
    // Only what differs from the draft rides along.
    const card = reviewedCardOf((redrawn.view as { private_metadata: string }).private_metadata)!;
    assert.deepEqual(card.edits, { "0.title": "Reflection v2", "0.properties.product_pillar": "Universal" });
    assert.deepEqual(views.refused, []);

    // Approve, from the redrawn draft, writes what was saved.
    await runReviewDecision({ ...approve(card.edits!), viewId: "V1" }, deps);
    assert.equal(ran[0]?.execute?.input.title, "Reflection v2");
    assert.deepEqual(ran[0]?.execute?.input.properties, { product_pillar: "Universal" });
    assert.match(cardUpdates[0]!.note, /^<@U2> edited Title, Product Pillar\n/);
  });

  it("opens Edit fields on the values already saved, and keeps them through a second save", async () => {
    const { views, ack } = await save({ "uno_field:0.summary": text("One question after each session.") }, { edits: { "0.title": "Reflection v2" } });
    const edit = views.calls.find((c) => c.kind === "update" && c.viewId === "V2")!.view;
    assert.equal(inputs(edit)[0]?.element?.initial_value, "Reflection v2");
    assert.equal(ack, null);
    const card = reviewedCardOf((views.calls.at(-1)!.view as { private_metadata: string }).private_metadata)!;
    assert.deepEqual(card.edits, { "0.title": "Reflection v2", "0.summary": "One question after each session." });
  });
});

describe("a notion_update draft", () => {
  const UPDATE: Partial<PendingProposal> = {
    toolName: "notion_update",
    input: {
      page_url: "https://www.notion.so/Reflection-redesign-0123456789abcdef0123456789abcdef",
      properties: { Name: "Reflection redesign v2", "Design Status": "In Review" },
      append: {
        text: "Progress: the form is down to three questions.",
        sections: [{ heading: "Open questions", body: "Does the mentor see the answers?" }],
      },
      replace: [
        { block_id: "b1", last_edited_time: "2026-10-01T09:00:00.000Z", content: "Tutors answer three questions." },
      ],
    },
    proposalText: ":warning: About to *update a Notion page*",
  };

  /** The Roadmap's Design Status options, as the live schema offers them. */
  const STATUSES = ["In Review", "Shipped", "Archived"];

  it("offers the title it sets, the Design Status it moves to and the text it writes, and never where it writes", async () => {
    const { deps, views, optionReads } = harness(await staged(UPDATE), { pillars: STATUSES });
    const edit = await editFields(deps, views);
    const fields = inputs(edit);
    assert.deepEqual(
      fields.map((f) => [f.block_id, f.label?.text, f.element?.initial_value ?? f.element?.initial_option?.value]),
      [
        ["uno_field:0.properties.Name", "Title", "Reflection redesign v2"],
        ["uno_field:0.properties.Design Status", "Design Status", "In Review"],
        ["uno_field:0.append.text", "Text to append", "Progress: the form is down to three questions."],
        ["uno_field:0.append.sections.0.body", "Section to append: Open questions", "Does the mentor see the answers?"],
        ["uno_field:0.replace.0.content", "Replacement text", "Tutors answer three questions."],
      ],
    );
    // The status is a select of the board's own options, read live.
    assert.deepEqual(fields[1]!.element?.options?.map((o) => o.value), STATUSES);
    assert.deepEqual(optionReads, ["roadmap/Design Status"]);
    // The page, the block and its stamp, and any other property stay locked.
    const offered = JSON.stringify(fields.map((f) => [f.block_id, f.label?.text]));
    for (const locked of ["page_url", ".block_id", "last_edited_time"]) {
      assert.ok(!offered.includes(locked), locked);
    }
    assert.deepEqual(views.refused, []);
  });

  it("writes a picked Design Status under the property the update names, and refuses one the board lacks", async () => {
    const { deps, ran } = harness(await staged(UPDATE), { pillars: STATUSES });
    await runReviewDecision(approve({ "0.properties.Design Status": "Archived" }), deps);
    assert.deepEqual(ran[0]?.execute?.input.properties, { Name: "Reflection redesign v2", "Design Status": "Archived" });

    const refused = harness(await staged(UPDATE), { pillars: STATUSES });
    await runReviewDecision(approve({ "0.properties.Design Status": "Ready for QA" }), refused.deps);
    assert.equal(refused.ran.length, 0);
  });

  it("offers no title when the update does not set one", async () => {
    const { deps, views } = harness(
      await staged({ ...UPDATE, input: { page_url: UPDATE.input!.page_url, append: { text: "A dated pulse." } } }),
    );
    const edit = await editFields(deps, views);
    assert.deepEqual(inputs(edit).map((f) => f.label?.text), ["Text to append"]);
  });

  it("writes the edited text to the same page, and the card says who edited what", async () => {
    const { deps, ran, cardUpdates } = harness(await staged(UPDATE));
    await runReviewDecision(
      approve({
        "0.append.text": ("Progress: the form is down to two questions."),
        "0.replace.0.content": ("Tutors answer two questions."),
      }),
      deps,
    );
    assert.equal(ran.length, 1);
    const input = ran[0]!.execute!.input as {
      page_url: string;
      append: { text: string; sections: unknown[] };
      replace: Array<{ block_id: string; last_edited_time: string; content: string }>;
      properties: Record<string, string>;
    };
    assert.equal(input.page_url, UPDATE.input!.page_url);
    assert.equal(input.append.text, "Progress: the form is down to two questions.");
    assert.deepEqual(input.append.sections, (UPDATE.input!.append as { sections: unknown[] }).sections);
    assert.deepEqual(input.replace, [
      { block_id: "b1", last_edited_time: "2026-10-01T09:00:00.000Z", content: "Tutors answer two questions." },
    ]);
    assert.deepEqual(input.properties, UPDATE.input!.properties);
    assert.match(cardUpdates[0]!.note, /^<@U2> edited Text to append, Replacement text\n/);
  });

  it("writes an edited title under the property the update names", async () => {
    const { deps, ran } = harness(await staged(UPDATE));
    await runReviewDecision(approve({ "0.properties.Name": ("Reflection, shorter form") }), deps);
    assert.deepEqual(ran[0]?.execute?.input.properties, { Name: "Reflection, shorter form", "Design Status": "In Review" });
  });

  it("refuses a placeholder or an emptied text with the same guards a create has", async () => {
    const placeholder = harness(await staged(UPDATE));
    await runReviewDecision(approve({ "0.replace.0.content": ("TBD") }), placeholder.deps);
    assert.deepEqual(placeholder.ran, []);
    assert.match(alerts(placeholder.views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Replacement text is still a placeholder/);

    const emptied = harness(await staged(UPDATE));
    await runReviewDecision(approve({ "0.append.text": ("  ") }), emptied.deps);
    assert.deepEqual(emptied.ran, []);
    assert.match(alerts(emptied.views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Text to append can't be empty/);
  });
});

describe("an approved edit, written onto the card", () => {
  const goalText = (title: string) =>
    [":warning: About to *create a Notion page*:", `• *Title:* ${title}`, "• *Summary:* Goal cycles reset per session.", CONFIRM_FOOTER].join(
      "\n",
    );

  it("replaces a field line only when its whole value is the old one", async () => {
    const threadState = await staged({ proposalText: goalText("Goal"), input: { ...PROPOSAL.input, title: "Goal" } });
    const { deps, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "0.title": ("Retention") }), deps);
    const words = cardUpdates[0]!.text;
    assert.match(words, /• \*Title:\* Retention\n/);
    assert.match(words, /• \*Summary:\* Goal cycles reset per session\./);
  });

  it("never splices the old value into a longer one it only starts", async () => {
    // The card shows "Goal cycles"; the draft's title was "Goal".
    const threadState = await staged({ proposalText: goalText("Goal cycles"), input: { ...PROPOSAL.input, title: "Goal" } });
    const { deps, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "0.title": ("Retention") }), deps);
    const words = cardUpdates[0]!.text;
    assert.doesNotMatch(words, /Retention cycles/);
    assert.match(words, /• \*Title:\* Goal cycles\n/);
    assert.match(cardUpdates[0]!.note, /edited Title/);
  });

  const ownLayout = [
    { type: "section", block_id: "own_layout", text: { type: "mrkdwn", text: "*Reflection redesign*" } },
    {
      type: "actions",
      block_id: "uno_proposal_actions",
      elements: [{ type: "button", action_id: "uno_proposal_review", text: { type: "plain_text", text: "Review" }, value: "review" }],
    },
  ];

  it("drops a card's own blocks for its text when an edit changed what they show", async () => {
    const { deps } = harness(await staged({ proposalBlocks: ownLayout }));
    const updates: unknown[][] = [];
    deps.updateCard = async (_channel, _ts, message) => void updates.push(message.blocks);
    await runReviewDecision(approve({ "0.title": ("Reflection, shorter form") }), deps);
    const shown = JSON.stringify(updates[0]);
    assert.doesNotMatch(shown, /own_layout/);
    assert.doesNotMatch(shown, /Reflection redesign/);
    assert.match(shown, /Reflection, shorter form/);
  });

  it("keeps a card's own blocks when nothing was edited", async () => {
    const { deps } = harness(await staged({ proposalBlocks: ownLayout }));
    const updates: unknown[][] = [];
    deps.updateCard = async (_channel, _ts, message) => void updates.push(message.blocks);
    await runReviewDecision(approve({ "0.title": ("Reflection redesign") }), deps);
    assert.match(JSON.stringify(updates[0]), /own_layout/);
  });
});

describe("Approve reads only what an edit needs", () => {
  /** The store, counting its reads of a card by ts. */
  function counted(threadState: ThreadState) {
    let reads = 0;
    const store: ThreadState = {
      ...threadState,
      getProposalByTs: (ts) => {
        reads++;
        return threadState.getProposalByTs(ts);
      },
    };
    return { store, reads: () => reads };
  }

  it("reads neither the card again nor the options when nothing was edited", async () => {
    const { store, reads } = counted(await staged());
    const { deps, ran, optionReads } = harness(store);
    await runReviewDecision(approve({}), deps);
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.deepEqual(optionReads, []);
    // The claim's own read, and nothing before it.
    assert.equal(reads(), 1);
  });

  it("reads no options when only a text was edited", async () => {
    const { deps, ran, optionReads } = harness(await staged());
    await runReviewDecision(approve({ "0.title": "Reflection v2" }), deps);
    assert.equal(ran[0]?.execute?.input.title, "Reflection v2");
    assert.deepEqual(optionReads, []);
  });

  it("still holds a saved option to the database's live options", async () => {
    const { deps, ran, optionReads } = harness(await staged(), { pillars: ["Tutor Experience", "Student Experience"] });
    await runReviewDecision(approve({ "0.properties.product_pillar": "Universal" }), deps);
    assert.deepEqual(ran, []);
    assert.deepEqual(optionReads, ["roadmap/Product Pillar"]);
  });

  it("ignores a saved key that names no field, so nothing outside the table is written", async () => {
    const { deps, ran } = harness(await staged());
    await runReviewDecision(approve({ "0.surface": "decision", "0.properties.roadmap_card": "x" }), deps);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
  });
});
