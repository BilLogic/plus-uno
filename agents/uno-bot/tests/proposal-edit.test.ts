// Editing a proposal's fields in the Review pop-up, and approving the edit.
//
// Driven at the review door the interactive endpoint hands a Slack payload to,
// as `tests/proposal-review.test.ts` drives it: the in-memory ThreadState, the
// recording Delivery and a views client that refuses what Slack refuses. A
// decision carries the pop-up's state the way Slack's block_actions payload
// does (`view.state.values`), and every case asserts what was written, what
// Slack was handed, or what the card was left saying.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import {
  checkedEditsView,
  runReviewDecision,
  runReviewOpen,
  type ReviewDoorDeps,
  type ReviewViewState,
} from "../src/slack/review-door";
import { fieldsFromBlocks } from "../src/slack/review-fields";
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

/** A decision with the pop-up's state, as Slack sends it on a press. */
const approve = (state: ReviewViewState, userId = "U2") => ({
  viewId: "V1",
  channel: CHANNEL,
  messageTs: CARD_TS,
  userId,
  decision: "confirm" as const,
  state,
});

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
/** The draft's field inputs — not the note every confirmer's view also carries. */
const inputs = (view: unknown) =>
  blocksOf(view).filter((b) => b.type === "input" && (b.block_id ?? "").startsWith("uno_field:"));
const alerts = (view: unknown) => blocksOf(view).filter((b) => b.type === "alert");

describe("the pop-up offers the draft's fields", () => {
  it("gives a confirmer each field with the draft's value, and selects from the live options", async () => {
    const { deps, views, optionReads } = harness(await staged());
    await runReviewOpen(open(), deps);
    const view = views.calls[1]!.view;
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
    assert.deepEqual(inputs(views.calls[1]!.view), []);
  });

  it("leaves out a select whose options cannot be read, rather than offering a free guess", async () => {
    const { deps, views } = harness(await staged(), { pillars: null });
    await runReviewOpen(open(), deps);
    assert.deepEqual(inputs(views.calls[1]!.view).map((f) => f.label?.text), ["Title", "Summary"]);
  });
});

describe("Approve with edits", () => {
  it("writes the edited title, and the card says who edited what", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await runReviewDecision(
      approve({ "uno_field:0.title": text("Reflection, shorter form"), "uno_field:0.summary": text(String(PROPOSAL.input.summary)) }),
      deps,
    );
    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.execute?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.operations[0]?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.input.summary, PROPOSAL.input.summary);
    assert.deepEqual(cardUpdates.map((u) => u.note), [
      ":pencil2: <@U2> edited Title\n:white_check_mark: Approved by <@U2>",
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
        "uno_field:0.title": text("Reflection, shorter form"),
        "uno_field:0.summary": text("One question after each session."),
        "uno_field:0.properties.product_pillar": picked("Universal"),
      }),
      deps,
    );
    const [update] = cardUpdates;
    assert.match(update!.note, /^:pencil2: <@U2> edited Title, Summary, Product Pillar\n:white_check_mark: Approved by <@U2>$/);
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
    await runReviewDecision(approve({ "uno_field:0.properties.product_pillar": picked("Universal") }), deps);
    assert.deepEqual(ran[0]?.execute?.input.properties, { product_pillar: "Universal" });
    assert.match(cardUpdates[0]!.note, /edited Product Pillar/);
  });

  it("approves an untouched draft as staged, with no edit line", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await runReviewDecision(approve({ "uno_field:0.title": text("Reflection redesign") }), deps);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.deepEqual(cardUpdates.map((u) => u.note), [":white_check_mark: Approved by <@U2>"]);
  });

  it("lets a standing confirmer's edit run with nobody else asked", async () => {
    const threadState = await staged({ confirmers: ["U07CONFIRM"] });
    const { deps, ran, delivery, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "uno_field:0.title": text("Reflection v2") }, "U9"), {
      ...deps,
      standingConfirmers: ["U9"],
    });
    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.execute?.input.title, "Reflection v2");
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "confirm" }]);
    assert.match(cardUpdates[0]!.note, /^:pencil2: <@U9> edited Title\n/);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "none");
  });
});

describe("an edit the guards refuse", () => {
  it("refuses a placeholder title with an alert in the pop-up, and writes nothing", async () => {
    const threadState = await staged();
    const { deps, views, ran, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "uno_field:0.title": text("TBD") }), deps);
    assert.deepEqual(ran, []);
    assert.deepEqual(cardUpdates, []);
    const view = views.calls.at(-1)!.view;
    const [alert] = alerts(view);
    assert.equal(alert?.level, "error");
    assert.match(alert?.text?.text ?? "", /Title/);
    assert.match(alert?.text?.text ?? "", /TBD/);
    // The pop-up stays a draft, with the person's own edit still in it.
    assert.equal(inputs(view)[0]?.element?.initial_value, "TBD");
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
    assert.deepEqual(views.refused, []);
  });

  it("refuses an emptied title", async () => {
    const { deps, views, ran } = harness(await staged());
    await runReviewDecision(approve({ "uno_field:0.title": { value: { type: "plain_text_input", value: null } } }), deps);
    assert.deepEqual(ran, []);
    assert.match(alerts(views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Title/);
  });

  it("refuses an option the database no longer offers", async () => {
    // Offered when the pop-up opened; gone from the schema by the time of Approve.
    const { deps, views, ran } = harness(await staged(), { pillars: ["Tutor Experience", "Universal"] });
    await runReviewDecision(approve({ "uno_field:0.properties.product_pillar": picked("Student Experience") }), deps);
    assert.deepEqual(ran, []);
    const alert = alerts(views.calls.at(-1)!.view)[0];
    assert.match(alert?.text?.text ?? "", /Student Experience/);
    assert.match(alert?.text?.text ?? "", /Product Pillar/);
  });
});

describe("Check edits, the footer Slack requires beside the fields", () => {
  /** The view Slack hands back on a submit: what the Worker sent, plus state. */
  async function submitted(state: ReviewViewState) {
    const { deps, views } = harness(await staged());
    await runReviewOpen(open(), deps);
    const sent = views.calls[1]!.view as Record<string, unknown>;
    assert.equal((sent.submit as { text: string }).text, "Check edits");
    return { ...sent, id: "V1", hash: "h", team_id: "T1", state: { values: state } };
  }

  it("answers a clean edit in the pop-up and keeps the edit", async () => {
    const view = checkedEditsView(await submitted({ "uno_field:0.title": text("Reflection v2") }));
    assert.equal(alerts(view)[0]?.level, "success");
    assert.equal(inputs(view)[0]?.element?.initial_value, "Reflection v2");
    assert.equal((view as { id?: string }).id, undefined, "only what views.update takes");
  });

  it("answers a placeholder with an error alert", async () => {
    const view = checkedEditsView(await submitted({ "uno_field:0.title": text("[insert title]") }));
    const [alert] = alerts(view);
    assert.equal(alert?.level, "error");
    assert.match(alert?.text?.text ?? "", /Title/);
    assert.equal(alerts(view).length, 1, "one alert, replacing any before it");
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

  it("offers the title it sets and the text it writes, and never where it writes", async () => {
    const { deps, views } = harness(await staged(UPDATE));
    await runReviewOpen(open(), deps);
    const fields = inputs(views.calls[1]!.view);
    assert.deepEqual(
      fields.map((f) => [f.block_id, f.label?.text, f.element?.initial_value]),
      [
        ["uno_field:0.properties.Name", "Title", "Reflection redesign v2"],
        ["uno_field:0.append.text", "Text to append", "Progress: the form is down to three questions."],
        ["uno_field:0.append.sections.0.body", "Section to append: Open questions", "Does the mentor see the answers?"],
        ["uno_field:0.replace.0.content", "Replacement text", "Tutors answer three questions."],
      ],
    );
    // The page, the block and its stamp, and any other property stay locked.
    const offered = JSON.stringify(fields.map((f) => [f.block_id, f.label?.text]));
    for (const locked of ["page_url", ".block_id", "last_edited_time", "Design Status"]) {
      assert.ok(!offered.includes(locked), locked);
    }
    assert.deepEqual(views.refused, []);
  });

  it("offers no title when the update does not set one", async () => {
    const { deps, views } = harness(
      await staged({ ...UPDATE, input: { page_url: UPDATE.input!.page_url, append: { text: "A dated pulse." } } }),
    );
    await runReviewOpen(open(), deps);
    assert.deepEqual(inputs(views.calls[1]!.view).map((f) => f.label?.text), ["Text to append"]);
  });

  it("writes the edited text to the same page, and the card says who edited what", async () => {
    const { deps, ran, cardUpdates } = harness(await staged(UPDATE));
    await runReviewDecision(
      approve({
        "uno_field:0.append.text": text("Progress: the form is down to two questions."),
        "uno_field:0.replace.0.content": text("Tutors answer two questions."),
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
    assert.match(cardUpdates[0]!.note, /^:pencil2: <@U2> edited Text to append, Replacement text\n/);
  });

  it("writes an edited title under the property the update names", async () => {
    const { deps, ran } = harness(await staged(UPDATE));
    await runReviewDecision(approve({ "uno_field:0.properties.Name": text("Reflection, shorter form") }), deps);
    assert.deepEqual(ran[0]?.execute?.input.properties, { Name: "Reflection, shorter form", "Design Status": "In Review" });
  });

  it("refuses a placeholder or an emptied text with the same guards a create has", async () => {
    const placeholder = harness(await staged(UPDATE));
    await runReviewDecision(approve({ "uno_field:0.replace.0.content": text("TBD") }), placeholder.deps);
    assert.deepEqual(placeholder.ran, []);
    assert.match(alerts(placeholder.views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Replacement text is still a placeholder/);

    const emptied = harness(await staged(UPDATE));
    await runReviewDecision(approve({ "uno_field:0.append.text": text("  ") }), emptied.deps);
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
    await runReviewDecision(approve({ "uno_field:0.title": text("Retention") }), deps);
    const words = cardUpdates[0]!.text;
    assert.match(words, /• \*Title:\* Retention\n/);
    assert.match(words, /• \*Summary:\* Goal cycles reset per session\./);
  });

  it("never splices the old value into a longer one it only starts", async () => {
    // The card shows "Goal cycles"; the draft's title was "Goal".
    const threadState = await staged({ proposalText: goalText("Goal cycles"), input: { ...PROPOSAL.input, title: "Goal" } });
    const { deps, cardUpdates } = harness(threadState);
    await runReviewDecision(approve({ "uno_field:0.title": text("Retention") }), deps);
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
    await runReviewDecision(approve({ "uno_field:0.title": text("Reflection, shorter form") }), deps);
    const shown = JSON.stringify(updates[0]);
    assert.doesNotMatch(shown, /own_layout/);
    assert.doesNotMatch(shown, /Reflection redesign/);
    assert.match(shown, /Reflection, shorter form/);
  });

  it("keeps a card's own blocks when nothing was edited", async () => {
    const { deps } = harness(await staged({ proposalBlocks: ownLayout }));
    const updates: unknown[][] = [];
    deps.updateCard = async (_channel, _ts, message) => void updates.push(message.blocks);
    await runReviewDecision(approve({ "uno_field:0.title": text("Reflection redesign") }), deps);
    assert.match(JSON.stringify(updates[0]), /own_layout/);
  });
});

describe("Approve reads only what an edit needs", () => {
  /** The fields the pop-up was opened with, as its submitted blocks carry them. */
  async function openedFields(threadState: ThreadState) {
    const { deps, views } = harness(threadState);
    await runReviewOpen(open(), deps);
    return fieldsFromBlocks(blocksOf(views.calls[1]!.view));
  }

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

  const untouched = {
    "uno_field:0.title": text("Reflection redesign"),
    "uno_field:0.properties.product_pillar": picked("Tutor Experience"),
  };

  it("reads neither the card again nor the options when nothing was edited", async () => {
    const base = await staged();
    const fields = await openedFields(base);
    const { store, reads } = counted(base);
    const { deps, ran, optionReads } = harness(store);
    await runReviewDecision({ ...approve(untouched), fields }, deps);
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.deepEqual(optionReads, []);
    // The claim's own read, and nothing before it.
    assert.equal(reads(), 1);
  });

  it("reads no options when only a text was edited", async () => {
    const base = await staged();
    const fields = await openedFields(base);
    const { deps, ran, optionReads } = harness(base);
    await runReviewDecision({ ...approve({ ...untouched, "uno_field:0.title": text("Reflection v2") }), fields }, deps);
    assert.equal(ran[0]?.execute?.input.title, "Reflection v2");
    assert.deepEqual(optionReads, []);
  });

  it("still holds a changed option to the database's live options", async () => {
    const base = await staged();
    const fields = await openedFields(base);
    const { deps, ran, optionReads } = harness(base, { pillars: ["Tutor Experience", "Student Experience"] });
    await runReviewDecision({ ...approve({ ...untouched, "uno_field:0.properties.product_pillar": picked("Universal") }), fields }, deps);
    assert.deepEqual(ran, []);
    assert.deepEqual(optionReads, ["roadmap/Product Pillar"]);
  });
});
