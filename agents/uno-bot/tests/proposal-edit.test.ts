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
import { recordingViews } from "./helpers/recording-slack";

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
    updateCard: async (_channel, _ts, text, note) => void cardUpdates.push({ text, note }),
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
