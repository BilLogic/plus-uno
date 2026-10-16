// Editing a proposal's fields in the Review pop-up, and approving the edit.
//
// Driven at the review door the interactive endpoint hands a Slack payload to,
// as `tests/proposal-review.test.ts` drives it: the in-memory ThreadState, the
// recording Delivery and a views client that refuses what Slack refuses. Text
// fields sit in the draft itself and ride its Submit; a select sits under Edit
// fields, a view pushed over the draft, and each pick keeps itself on the
// draft's `private_metadata`, where Approve carries it from. Every case
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
  keepReviewPick,
  type ReviewDoorDeps,
  type ReviewViewState,
} from "../src/slack/review-door";
import { fitBody, reviewPickOf, reviewSubmitOf } from "../src/slack/review-view";
import { parseInteraction } from "../src/slack/interactive";
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

/** Approve, with these picks kept on the card first, as Edit fields keeps
 *  them. */
async function approveWith(deps: ReviewDoorDeps, kept: Record<string, string>, userId = "U2") {
  for (const [key, value] of Object.entries(kept)) await deps.threadState.keepPick(CARD_TS, userId, key, value);
  await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId, decision: "confirm" }, deps);
}

/** Edit fields, pressed on the draft: the pushed view, filled. */
async function editFields(deps: ReviewDoorDeps, views: { calls: Array<{ kind: string; view: unknown }> }) {
  await runReviewPush({ triggerId: "T.edit", card: { channel: CHANNEL, ts: CARD_TS }, userId: "U2" }, deps);
  return views.calls.at(-1)!.view;
}

/** The picks a person kept on the card's record. */
async function keptOn(threadState: ThreadState, userId = "U2") {
  const look = await threadState.getProposalByTs(CARD_TS);
  return look.state === "found" ? (look.kept?.[userId] ?? {}) : null;
}

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

/** The field selects Edit fields offers: each a section with its select. */
const selects = (view: unknown) =>
  blocksOf(view).filter(
    (b) => (b.block_id ?? "").startsWith("uno_field:") && (b as { accessory?: { type: string } }).accessory?.type === "static_select",
  );
const accessory = (block: Block) =>
  (block as unknown as { accessory: { initial_option?: { value: string }; options: Array<{ value: string }> } }).accessory;

/** The draft's Submit, pressed with Approve and these values in its fields. */
function submitDraft(draft: unknown, values: Record<string, string> = {}) {
  const state: ReviewViewState = { uno_review_choice: { uno_review_choice_input: { selected_option: { value: "confirm" } } } };
  for (const [blockId, value] of Object.entries(values)) state[blockId] = { value: { type: "plain_text_input", value } };
  const submit = reviewSubmitOf({ ...(draft as object), state: { values: state } });
  assert.ok(submit.ok);
  return submit.request;
}

describe("the pop-up offers the draft's fields", () => {
  it("holds a create's text fields in the draft, and leaves only its select for Edit fields", async () => {
    const { deps, views, optionReads } = harness(await staged());
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view;
    assert.deepEqual(
      inputs(draft).map((f) => [f.block_id, f.label?.text, f.element?.initial_value]),
      [
        ["uno_field:0.title", "Title", "Reflection redesign"],
        ["uno_field:0.summary", "Summary", PROPOSAL.input.summary],
      ],
    );
    // A select needs its options read, so the draft reads none and offers it
    // under Edit fields.
    assert.deepEqual(optionReads, []);
    assert.match(JSON.stringify(draft), /"uno_review_edit"/);

    const view = await editFields(deps, views);
    assert.deepEqual(views.calls.map((c) => c.kind), ["open", "update", "push", "update"]);
    // No Save edits: a pick keeps itself, and the close goes back to the draft.
    assert.equal((view as { submit?: unknown }).submit, undefined);
    assert.equal((view as { close: { text: string } }).close.text, "Done");
    assert.deepEqual(inputs(view), []);
    const [pillar] = selects(view);
    assert.equal(pillar?.block_id, "uno_field:0.properties.product_pillar");
    assert.match(pillar?.text?.text ?? "", /Product Pillar/);
    assert.deepEqual(accessory(pillar!).options.map((o) => o.value), PILLARS);
    assert.equal(accessory(pillar!).initial_option?.value, "Tutor Experience");
    assert.deepEqual(optionReads, ["roadmap/Product Pillar"]);
    assert.deepEqual(views.refused, []);
  });

  it("still holds a text field in place when the batch has a tool the draft cannot read", async () => {
    const { deps, views } = harness(
      await staged({
        operations: [
          { toolName: "figma_comment_reply", input: { text: "Thanks" } },
          { toolName: "github_issue_create", input: { title: "Badge drift", body: "The badge differs." } },
        ],
      }),
    );
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view;
    assert.deepEqual(
      inputs(draft).map((f) => [f.block_id, f.element?.initial_value]),
      [
        ["uno_field:1.title", "Badge drift"],
        ["uno_field:1.body", "The badge differs."],
      ],
    );
    // Nothing is left behind Edit fields.
    assert.doesNotMatch(JSON.stringify(draft), /"uno_review_edit"/);
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
    const view = await editFields(deps, views);
    assert.deepEqual(selects(view), []);
    assert.match(JSON.stringify(view), /Nothing in this draft can be edited here/);
  });
});

describe("Approve with a field edited in place", () => {
  it("writes the title typed into the draft, and counts the approval as edited", async () => {
    const { deps, views, ran, cardUpdates } = harness(await staged());
    await runReviewOpen(open(), deps);
    const request = submitDraft(views.calls[1]!.view, { "uno_field:0.title": "Reflection, shorter form" });
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...request }, deps);
    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.execute?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.input.summary, PROPOSAL.input.summary);
    // What the usage record reads as approved with edits.
    assert.equal(ran[0]?.edited, true);
    assert.match(cardUpdates[0]!.note, /^<@U2> edited Title\n/);
  });

  it("approves the fields left alone as staged, and does not count an edit", async () => {
    const { deps, views, ran, cardUpdates } = harness(await staged());
    await runReviewOpen(open(), deps);
    const request = submitDraft(views.calls[1]!.view, {
      "uno_field:0.title": "Reflection redesign",
      "uno_field:0.summary": String(PROPOSAL.input.summary),
    });
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...request }, deps);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.equal(ran[0]?.edited, undefined);
    assert.deepEqual(cardUpdates.map((u) => u.note), ["Approved by <@U2>"]);
  });

  it("holds a field typed in place to the guards, and keeps the typing on the redrawn draft", async () => {
    const { deps, views, ran } = harness(await staged());
    await runReviewOpen(open(), deps);
    const request = submitDraft(views.calls[1]!.view, { "uno_field:0.title": "TBD" });
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...request }, deps);
    assert.deepEqual(ran, []);
    const view = views.calls.at(-1)!.view;
    assert.match(alerts(view)[0]?.text?.text ?? "", /Title is still a placeholder/);
    assert.equal(inputs(view).find((f) => f.block_id === "uno_field:0.title")?.element?.initial_value, "TBD");
    assert.deepEqual(views.refused, []);

    // Approve again with the refused value still in the box: refused again,
    // since a typed value is measured against the staged one, not against
    // what the redrawn input opened with.
    const again = submitDraft(view, { "uno_field:0.title": "TBD" });
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...again }, deps);
    assert.deepEqual(ran, []);
    assert.match(alerts(views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Title is still a placeholder/);
  });

  it("never cuts a field in place when a long draft is trimmed to fit", () => {
    const section = (n: number) => ({ type: "section", text: { type: "mrkdwn", text: `Paragraph ${n}` } });
    const field = (key: string) => ({ type: "input", block_id: `uno_field:${key}` });
    const draft = [...Array.from({ length: 60 }, (_, n) => section(n)), field("1.title"), ...Array.from({ length: 60 }, (_, n) => section(60 + n)), field("1.body")];
    const fitted = fitBody(draft, 40) as Block[];
    assert.ok(fitted.length <= 40, String(fitted.length));
    assert.deepEqual(fitted.filter((b) => b.type === "input").map((b) => b.block_id), ["uno_field:1.title", "uno_field:1.body"]);
    assert.match(JSON.stringify(fitted), /too long for the pop-up/);
  });
});

describe("Approve with edits", () => {
  it("writes the edited title, and the card says who edited what", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await approveWith(deps, { "0.title": ("Reflection, shorter form"), "0.summary": (String(PROPOSAL.input.summary)) });
    assert.equal(ran.length, 1);
    assert.equal(ran[0]?.execute?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.operations[0]?.input.title, "Reflection, shorter form");
    assert.equal(ran[0]?.execute?.input.summary, PROPOSAL.input.summary);
    assert.deepEqual(cardUpdates.map((u) => u.note), [
      "<@U2> edited Title\nApproved by <@U2>",
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
    await approveWith(deps, {
        "0.title": ("Reflection, shorter form"),
        "0.summary": ("One question after each session."),
        "0.properties.product_pillar": ("Universal"),
      });
    const [update] = cardUpdates;
    assert.match(update!.note, /^<@U2> edited Title, Summary, Product Pillar\nApproved by <@U2>$/);
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
    await approveWith(deps, { "0.properties.product_pillar": ("Universal") });
    assert.deepEqual(ran[0]?.execute?.input.properties, { product_pillar: "Universal" });
    assert.match(cardUpdates[0]!.note, /edited Product Pillar/);
  });

  it("approves an untouched draft as staged, with no edit line", async () => {
    const { deps, ran, cardUpdates } = harness(await staged());
    await approveWith(deps, { "0.title": ("Reflection redesign") });
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.deepEqual(cardUpdates.map((u) => u.note), ["Approved by <@U2>"]);
  });

  it("lets a standing confirmer's edit run with nobody else asked", async () => {
    const threadState = await staged({ confirmers: ["U07CONFIRM"] });
    const { deps, ran, delivery, cardUpdates } = harness(threadState);
    await approveWith({
      ...deps,
      standingConfirmers: ["U9"],
    }, { "0.title": ("Reflection v2") }, "U9");
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
    await approveWith(deps, { "0.title": ("TBD") });
    assert.deepEqual(ran, []);
    assert.deepEqual(cardUpdates, []);
    const view = views.calls.at(-1)!.view;
    const [alert] = alerts(view);
    assert.equal(alert?.level, "error");
    assert.match(alert?.text?.text ?? "", /Title/);
    assert.match(alert?.text?.text ?? "", /TBD/);
    // The pop-up stays a draft, with the person's own edit still on it and
    // still carried to the next Approve.
    assert.equal(inputs(view).find((f) => f.block_id === "uno_field:0.title")?.element?.initial_value, "TBD");
    assert.deepEqual(await keptOn(threadState), { "0.title": "TBD" });
    assert.equal((view as { submit?: { text: string } }).submit?.text, "Submit");
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
    assert.deepEqual(views.refused, []);
  });

  it("refuses an emptied title", async () => {
    const { deps, views, ran } = harness(await staged());
    await approveWith(deps, { "0.title": "" });
    assert.deepEqual(ran, []);
    assert.match(alerts(views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Title/);
  });

  it("refuses an option the database no longer offers", async () => {
    // Offered when the pop-up opened; gone from the schema by the time of Approve.
    const { deps, views, ran } = harness(await staged(), { pillars: ["Tutor Experience", "Universal"] });
    await approveWith(deps, { "0.properties.product_pillar": ("Student Experience") });
    assert.deepEqual(ran, []);
    const alert = alerts(views.calls.at(-1)!.view)[0];
    assert.match(alert?.text?.text ?? "", /Student Experience/);
    assert.match(alert?.text?.text ?? "", /Product Pillar/);
  });
});

describe("a pick under Edit fields keeps itself", () => {
  const KEY = "0.properties.product_pillar";
  const STATUS = "0.properties.Design Status";
  /** A PRD card with a second select its stager names, so two fields can be
   *  picked under one Edit fields. */
  const TWO_SELECTS: Partial<PendingProposal> = {
    input: { ...PROPOSAL.input, properties: { product_pillar: "Tutor Experience", "Design Status": "In Review" } },
    selects: [{ path: "properties.Design Status", label: "Design Status", source: { database: "roadmap", property: "Design Status" } }],
  };

  /** Edit fields opened over the draft V1. */
  async function opened(over: Partial<PendingProposal> = {}, opts: { pillars?: string[] } = {}) {
    const h = harness(await staged(over), opts);
    await runReviewOpen(open(), h.deps);
    const edit = await editFields(h.deps, h.views);
    return { ...h, edit };
  }

  /** A pick made in an Edit fields view, as `reviewPickOf` reads it. */
  const pickIn = (view: unknown, key: string, value: string, userId = "U2") =>
    ({ viewId: "V2", rootViewId: "V1", card: { channel: CHANNEL, ts: CARD_TS }, userId, blocks: blocksOf(view), pick: { key, value } });

  async function pick(value: string, opts: { keptFirst?: string } = {}) {
    const h = await opened();
    if (opts.keptFirst) await h.deps.threadState.keepPick(CARD_TS, "U2", KEY, opts.keptFirst);
    await keepReviewPick(pickIn(h.edit, KEY, value), h.deps);
    return h;
  }

  it("keeps the pick on the card and redraws the draft, with no submit pressed", async () => {
    const { views, deps, ran, cardUpdates } = await pick("Universal");
    const redrawn = views.calls.at(-1)!;
    assert.equal(redrawn.kind === "update" && redrawn.viewId, "V1");
    const words = JSON.stringify(blocksOf(redrawn.view));
    // The pick reads in the facts, beside the Edit fields button that made it.
    const facts = blocksOf(redrawn.view).find((b) => (b as { fields?: unknown }).fields) as { accessory?: { action_id?: string } } | undefined;
    assert.match(JSON.stringify(facts), /\*Product Pillar\*\\nUniversal/);
    assert.equal(facts?.accessory?.action_id, "uno_review_edit");
    assert.match(words, /Edited here: Product Pillar/);
    // The draft keeps its fields in place, by the same block ids, so what was
    // typed there survives the redraw.
    assert.deepEqual(inputs(redrawn.view).map((f) => f.block_id), ["uno_field:0.title", "uno_field:0.summary"]);
    // Kept on the card's record, not in the view.
    assert.deepEqual(await keptOn(deps.threadState), { [KEY]: "Universal" });
    assert.deepEqual(JSON.parse((redrawn.view as { private_metadata: string }).private_metadata), { channel: CHANNEL, ts: CARD_TS });
    assert.deepEqual(views.refused, []);

    // Back from Edit fields, then Approve: the draft's own Submit, and the pick
    // read off the card.
    const request = submitDraft(redrawn.view);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...request }, deps);
    assert.deepEqual(ran[0]?.execute?.input.properties, { product_pillar: "Universal" });
    assert.equal(ran[0]?.edited, true);
    assert.match(cardUpdates[0]!.note, /^<@U2> edited Product Pillar\n/);
  });

  for (const order of [["pillar", "status"], ["status", "pillar"]] as const) {
    it(`keeps two quick picks on two fields when the ${order[0]} lands first`, async () => {
      const h = await opened(TWO_SELECTS, { pillars: [...PILLARS, "In Review", "Shipped"] });
      // Both made in the same view, before either redraw: neither knows the other.
      const picks = { pillar: pickIn(h.edit, KEY, "Universal"), status: pickIn(h.edit, STATUS, "Shipped") };
      for (const which of order) await keepReviewPick(picks[which], h.deps);
      assert.deepEqual(await keptOn(h.deps.threadState), { [KEY]: "Universal", [STATUS]: "Shipped" });
      const last = JSON.stringify(blocksOf(h.views.calls.at(-1)!.view));
      assert.match(last, /\*Product Pillar\*\\nUniversal/);

      await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", decision: "confirm" }, h.deps);
      assert.deepEqual(h.ran[0]?.execute?.input.properties, { product_pillar: "Universal", "Design Status": "Shipped" });
    });
  }

  it("keeps an earlier pick when a later pick carries only its own field", async () => {
    const h = await opened(TWO_SELECTS, { pillars: [...PILLARS, "In Review", "Shipped"] });
    await keepReviewPick(pickIn(h.edit, KEY, "Universal"), h.deps);
    // The second pick's view still shows the pillar as it opened.
    await keepReviewPick(pickIn(h.edit, STATUS, "Shipped"), h.deps);
    assert.deepEqual(await keptOn(h.deps.threadState), { [KEY]: "Universal", [STATUS]: "Shipped" });
  });

  it("keeps each person's picks apart", async () => {
    const h = await opened();
    await keepReviewPick(pickIn(h.edit, KEY, "Universal"), h.deps);
    await keepReviewPick(pickIn(h.edit, KEY, "Student Experience", "U3"), h.deps);
    assert.deepEqual(await keptOn(h.deps.threadState), { [KEY]: "Universal" });
    assert.deepEqual(await keptOn(h.deps.threadState, "U3"), { [KEY]: "Student Experience" });
  });

  it("drops a kept pick when the pick goes back to the draft's own value", async () => {
    const { deps } = await pick("Tutor Experience", { keptFirst: "Universal" });
    assert.deepEqual(await keptOn(deps.threadState), {});
  });

  it("opens Edit fields, and the draft, on the picks already kept", async () => {
    const h = harness(await staged());
    await h.deps.threadState.keepPick(CARD_TS, "U2", KEY, "Universal");
    await runReviewOpen(open(), h.deps);
    assert.match(JSON.stringify(blocksOf(h.views.calls[1]!.view)), /Edited here: Product Pillar/);
    const [pillar] = selects(await editFields(h.deps, h.views));
    assert.equal(accessory(pillar!).initial_option?.value, "Universal");
  });

  it("refuses an option the view did not offer in an alert that shows the kept value, and leaves the draft as it was", async () => {
    const { views, deps } = await pick("Made up", { keptFirst: "Universal" });
    const last = views.calls.at(-1)!;
    assert.equal(last.kind === "update" && last.viewId, "V2");
    assert.match(alerts(last.view)[0]?.text?.text ?? "", /Made up/);
    // The select shows what is kept, not the refused option.
    assert.equal(accessory(selects(last.view)[0]!).initial_option?.value, "Universal");
    assert.equal(views.calls.filter((c) => c.kind === "update" && c.viewId === "V1").length, 1, "the draft is not redrawn");
    assert.deepEqual(await keptOn(deps.threadState), { [KEY]: "Universal" });
    assert.deepEqual(views.refused, []);
  });

  it("clears the alert once a later pick passes", async () => {
    const h = await opened();
    await keepReviewPick(pickIn(h.edit, KEY, "Made up"), h.deps);
    const refused = h.views.calls.at(-1)!.view;
    assert.equal(alerts(refused).length, 1);
    await keepReviewPick(pickIn(refused, KEY, "Universal"), h.deps);
    const [draft, edit] = h.views.calls.slice(-2);
    assert.equal(draft!.kind === "update" && draft!.viewId, "V1");
    assert.equal(edit!.kind === "update" && edit!.viewId, "V2");
    assert.deepEqual(alerts(edit!.view), []);
    assert.equal(accessory(selects(edit!.view)[0]!).initial_option?.value, "Universal");
  });

  it("still holds a kept pick to the database's options on Approve", async () => {
    const { views, deps, ran } = await pick("Universal");
    const request = submitDraft(views.calls.at(-1)!.view);
    await runReviewDecision(
      { viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", ...request },
      { ...deps, fieldOptions: async () => ["Tutor Experience"] },
    );
    assert.deepEqual(ran, []);
    assert.match(alerts(views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Universal/);
  });

  it("is read off a Slack block_actions payload, as the endpoint routes it", async () => {
    const h = await opened();
    const body = new URLSearchParams({
      payload: JSON.stringify({
        type: "block_actions",
        user: { id: "U2" },
        actions: [{ type: "static_select", action_id: "value", block_id: `uno_field:${KEY}`, selected_option: { text: { type: "plain_text", text: "Universal" }, value: "Universal" } }],
        view: { id: "V2", root_view_id: "V1", previous_view_id: "V1", callback_id: "uno_review_edit_fields", private_metadata: (h.edit as { private_metadata: string }).private_metadata, blocks: blocksOf(h.edit), state: { values: {} } },
      }),
    }).toString();
    const payload = parseInteraction(body)!;
    const parsed = reviewPickOf(payload);
    assert.deepEqual(parsed && { ...parsed, blocks: parsed.blocks.length }, {
      viewId: "V2",
      rootViewId: "V1",
      card: { channel: CHANNEL, ts: CARD_TS },
      userId: "U2",
      blocks: blocksOf(h.edit).length,
      pick: { key: KEY, value: "Universal" },
    });
    await keepReviewPick(parsed!, h.deps);
    assert.deepEqual(await keptOn(h.deps.threadState), { [KEY]: "Universal" });

    // Not a pick: the draft's own button, or a select in another view.
    assert.equal(reviewPickOf({ ...payload, actions: [{ action_id: "uno_review_edit" }] }), null);
    assert.equal(reviewPickOf({ ...payload, view: { ...payload.view, callback_id: "uno_review_draft" } }), null);
    assert.equal(reviewPickOf({ ...payload, view: { ...payload.view, root_view_id: "V2" } }), null);
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

  it("offers the title it sets and the text it writes in the draft itself, and never where it writes", async () => {
    const { deps, views } = harness(await staged(UPDATE));
    await runReviewOpen(open(), deps);
    const draft = views.calls[1]!.view;
    // In place, so there is nothing left for Edit fields.
    assert.doesNotMatch(JSON.stringify(draft), /"uno_review_edit"/);
    const fields = inputs(draft);
    assert.deepEqual(
      fields.map((f) => [f.block_id, f.label?.text, f.element?.initial_value]),
      [
        // In the draft's order, each under its own heading: a change to what
        // the page says is its New content, an addition its Text.
        ["uno_field:0.properties.Name", "New content", "Reflection redesign v2"],
        ["uno_field:0.replace.0.content", "New content", "Tutors answer three questions."],
        ["uno_field:0.append.sections.0.body", "Text", "Does the mentor see the answers?"],
        ["uno_field:0.append.text", "Text", "Progress: the form is down to three questions."],
      ],
    );
    // The page, the block and its stamp, and any other property stay locked.
    const offered = JSON.stringify(fields.map((f) => [f.block_id, f.label?.text]));
    for (const locked of ["page_url", ".block_id", "last_edited_time", "Design Status"]) {
      assert.ok(!offered.includes(locked), locked);
    }
    assert.deepEqual(views.refused, []);
  });

  /** The Roadmap's Design Status options, as the live schema offers them. */
  const STATUSES = ["In Review", "Shipped", "Archived"];
  const WITH_SELECT: Partial<PendingProposal> = {
    ...UPDATE,
    selects: [{ path: "properties.Design Status", label: "Design Status", source: { database: "roadmap", property: "Design Status" } }],
  };

  it("offers a select its stager names, from the database's live options", async () => {
    const { deps, views, optionReads } = harness(await staged(WITH_SELECT), { pillars: STATUSES });
    const status = selects(await editFields(deps, views)).find((f) => f.block_id === "uno_field:0.properties.Design Status")!;
    assert.equal(status.text?.text, "*Design Status*");
    assert.deepEqual(accessory(status).options.map((o) => o.value), STATUSES);
    assert.equal(accessory(status).initial_option?.value, "In Review");
    assert.deepEqual(optionReads, ["roadmap/Design Status"]);
    assert.deepEqual(views.refused, []);
  });

  it("writes a picked value of a stager's select, and refuses one the database lacks", async () => {
    const { deps, ran } = harness(await staged(WITH_SELECT), { pillars: STATUSES });
    await approveWith(deps, { "0.properties.Design Status": "Archived" });
    assert.deepEqual(ran[0]?.execute?.input.properties, { Name: "Reflection redesign v2", "Design Status": "Archived" });

    const refused = harness(await staged(WITH_SELECT), { pillars: STATUSES });
    await approveWith(refused.deps, { "0.properties.Design Status": "Ready for QA" });
    assert.equal(refused.ran.length, 0);
  });

  it("offers no title when the update does not set one", async () => {
    const { deps, views } = harness(
      await staged({ ...UPDATE, input: { page_url: UPDATE.input!.page_url, append: { text: "A dated pulse." } } }),
    );
    await runReviewOpen(open(), deps);
    assert.deepEqual(inputs(views.calls[1]!.view).map((f) => f.label?.text), ["Text"]);
  });

  it("writes the edited text to the same page, and the card says who edited what", async () => {
    const { deps, ran, cardUpdates } = harness(await staged(UPDATE));
    await approveWith(deps, {
        "0.append.text": ("Progress: the form is down to two questions."),
        "0.replace.0.content": ("Tutors answer two questions."),
      });
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
    await approveWith(deps, { "0.properties.Name": ("Reflection, shorter form") });
    assert.deepEqual(ran[0]?.execute?.input.properties, { Name: "Reflection, shorter form", "Design Status": "In Review" });
  });

  it("refuses a placeholder or an emptied text with the same guards a create has", async () => {
    const placeholder = harness(await staged(UPDATE));
    await approveWith(placeholder.deps, { "0.replace.0.content": ("TBD") });
    assert.deepEqual(placeholder.ran, []);
    assert.match(alerts(placeholder.views.calls.at(-1)!.view)[0]?.text?.text ?? "", /Replacement text is still a placeholder/);

    const emptied = harness(await staged(UPDATE));
    await approveWith(emptied.deps, { "0.append.text": ("  ") });
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
    await approveWith(deps, { "0.title": ("Retention") });
    const words = cardUpdates[0]!.text;
    assert.match(words, /• \*Title:\* Retention\n/);
    assert.match(words, /• \*Summary:\* Goal cycles reset per session\./);
  });

  it("never splices the old value into a longer one it only starts", async () => {
    // The card shows "Goal cycles"; the draft's title was "Goal".
    const threadState = await staged({ proposalText: goalText("Goal cycles"), input: { ...PROPOSAL.input, title: "Goal" } });
    const { deps, cardUpdates } = harness(threadState);
    await approveWith(deps, { "0.title": ("Retention") });
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
    await approveWith(deps, { "0.title": ("Reflection, shorter form") });
    const shown = JSON.stringify(updates[0]);
    assert.doesNotMatch(shown, /own_layout/);
    assert.doesNotMatch(shown, /Reflection redesign/);
    assert.match(shown, /Reflection, shorter form/);
  });

  it("keeps a card's own blocks when nothing was edited", async () => {
    const { deps } = harness(await staged({ proposalBlocks: ownLayout }));
    const updates: unknown[][] = [];
    deps.updateCard = async (_channel, _ts, message) => void updates.push(message.blocks);
    await approveWith(deps, { "0.title": ("Reflection redesign") });
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

  it("reads no options or live page when nothing was edited", async () => {
    const { store, reads } = counted(await staged());
    const { deps, ran, optionReads } = harness(store);
    await approveWith(deps, {});
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
    assert.deepEqual(optionReads, []);
    // The answer authorization shares its read with the gate.
    assert.equal(reads(), 1);
  });

  it("reads no options when only a text was edited", async () => {
    const { deps, ran, optionReads } = harness(await staged());
    await approveWith(deps, { "0.title": "Reflection v2" });
    assert.equal(ran[0]?.execute?.input.title, "Reflection v2");
    assert.deepEqual(optionReads, []);
  });

  it("still holds a saved option to the database's live options", async () => {
    const { deps, ran, optionReads } = harness(await staged(), { pillars: ["Tutor Experience", "Student Experience"] });
    await approveWith(deps, { "0.properties.product_pillar": "Universal" });
    assert.deepEqual(ran, []);
    assert.deepEqual(optionReads, ["roadmap/Product Pillar"]);
  });

  it("ignores a saved key that names no field, so nothing outside the table is written", async () => {
    const { deps, ran } = harness(await staged());
    await approveWith(deps, { "0.surface": "decision", "0.properties.roadmap_card": "x" });
    assert.deepEqual(ran[0]?.execute?.input, PROPOSAL.input);
  });
});
