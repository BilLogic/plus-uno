// A `notion_create`'s Review pop-up, drawn in the shared anatomy and decided:
// a Roadmap card, a decision and a Marketplace row.
//
// Driven at the review door, as `tests/review-shareout.test.ts` drives the
// share-out: the in-memory ThreadState, the recording Delivery and a views
// client that refuses what Slack refuses. The drafts are the doc's samples
// (`docs/plans/2026-10-15-review-modal-redesign.md` § 6 and § 7). Each case
// asserts what Slack was handed, or what Approve ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import {
  keepReviewPick,
  runReviewDecision,
  runReviewOpen,
  runReviewPush,
  type ReviewDoorDeps,
  type ReviewViewState,
} from "../src/slack/review-door";
import { reviewSubmitOf } from "../src/slack/review-view";
import { CONFIRM_FOOTER } from "../src/slack/proposal-render";
import { NO_OPEN_QUESTIONS, proseElements } from "../src/slack/review-notion-create";
import { recordingViews } from "./helpers/recording-slack";
import { cardWords } from "./helpers/card-message";

const CHANNEL = "C0SANDBOX1";
const THREAD = "1760540000.000050";
const CARD_TS = "1760540000.000100";
const BILL = "U0BILL0001";

const SOURCE = "https://plus.slack.com/archives/C0SANDBOX1/p1760540000000100";
const CARD_URL = "https://www.notion.so/Session-sign-up-waitlist-0123456789abcdef0123456789abcdef";

const DATABASES = {
  roadmap: "https://www.notion.so/2fc012411bb54770af51d5a050bddb75",
  decisions: "https://www.notion.so/6279ea4acd844d5190e1e6b6af53bb19",
  marketplace: "https://www.notion.so/397b7cca49828002826cc45e2baa8e4f",
};

const CAVEAT =
  ":warning: *No open questions were named for this brief.* If it leaves anything ambiguous (states, interactions, semantics), cancel and ask — confirming builds it as-is.";

const PRD = {
  surface: "prd",
  title: "Session sign-up waitlist",
  summary: "Tutors can join a waitlist when a session is full.",
  properties: { product_pillar: "Tutor Experience" },
  source_url: SOURCE,
  sections: [
    { heading: "Problem", body: "Full sessions turn tutors away with no next step." },
    { heading: "Goals", body: "- Keep tutors who hit a full session\n- Fill dropped seats within an hour" },
  ],
  acceptance_criteria: ["A full session offers Join waitlist", "A freed seat notifies the first tutor"],
};

const DECISION = {
  surface: "decision",
  title: "Waitlist ships behind a flag",
  summary: "The October cohort gets the waitlist behind a feature flag; Bryan owns the copy.",
  properties: { status: "Accepted", roadmap_card: CARD_URL },
};

const MARKETPLACE = {
  surface: "marketplace",
  title: "Session sign-up",
  summary: "The waitlist prototype.",
  properties: {
    stage: "High-fi",
    deployment_url: "https://plus-uno.netlify.app/prototypes/session-sign-up",
    contributors: ["Bill Guo", "Bryan"],
  },
};

const textOf = (input: Record<string, unknown>, caveat?: string) =>
  [":warning: About to *create this card in Notion*:", `• *Title:* ${String(input.title)}`, ...(caveat ? [caveat] : []), CONFIRM_FOOTER].join("\n");

const PROPOSAL: PendingProposal = {
  toolName: "notion_create",
  input: PRD,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1760540000.000040",
  proposalTs: CARD_TS,
  proposalText: textOf(PRD, CAVEAT),
  requesterUserId: "U0ASKER001",
  confirmers: [BILL],
};

const OPTIONS: Record<string, string[]> = {
  "roadmap/Product Pillar": ["Tutor Experience", "Toolkit", "Universal"],
  "decisions/Status": ["Proposed", "Accepted", "Rejected", "Superseded"],
};

async function staged(over: Partial<PendingProposal> = {}): Promise<ThreadState> {
  const store = createInMemoryThreadState();
  await store.putProposal({ ...PROPOSAL, ...over });
  return store;
}

function harness(threadState: ThreadState, opts: { databases?: boolean } = {}) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const cardUpdates: Array<{ text: string; note: string }> = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async (_channel, _ts, message) => void cardUpdates.push(cardWords(message)),
    restage: async () => {},
    revise: async () => {},
    fieldOptions: async (source) => OPTIONS[`${source.database}/${source.property}`] ?? null,
    ...(opts.databases === false ? {} : { notionDatabases: DATABASES }),
  };
  return { deps, views, ran, cardUpdates };
}

type Block = {
  type: string;
  block_id?: string;
  optional?: boolean;
  label?: { text: string };
  element?: { type: string; initial_value?: string; options?: Array<{ value: string; description?: { text: string } }> };
  text?: { type?: string; text: string };
  level?: string;
  fields?: Array<{ text: string }>;
  accessory?: { type: string; action_id?: string; initial_option?: { value: string } };
  elements?: Array<Record<string, unknown>>;
};
type View = { title: { text: string }; submit?: unknown; blocks: Block[] };

const blocksOf = (view: unknown) => (view as View).blocks;
const fieldInputs = (view: unknown) => blocksOf(view).filter((b) => b.type === "input" && (b.block_id ?? "").startsWith("uno_field:"));
const factsOf = (view: unknown) => blocksOf(view).find((b) => b.fields);
/** The where line's elements. */
const whereOf = (view: unknown) => (blocksOf(view)[1]!.elements as Array<{ elements: Array<Record<string, unknown>> }>)[0]!.elements;
/** The zone order, a field in place read as "field". */
const zones = (view: unknown) => blocksOf(view).map((b) => (b.block_id?.startsWith("uno_field:") ? "field" : b.type));

async function openDraft(over: Partial<PendingProposal> = {}, opts: { userId?: string; databases?: boolean } = {}) {
  const h = harness(await staged(over), opts);
  await runReviewOpen({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId: opts.userId ?? BILL }, h.deps);
  assert.deepEqual(h.views.refused, []);
  return { ...h, draft: h.views.calls.at(-1)!.view };
}

const decision = (over: Partial<PendingProposal> = {}) => openDraft({ input: DECISION, proposalText: textOf(DECISION), ...over });
const marketplace = (over: Partial<PendingProposal> = {}) => openDraft({ input: MARKETPLACE, proposalText: textOf(MARKETPLACE), ...over });

/** Approve, pressed with these values in the fields in place. */
function approve(draft: unknown, values: Record<string, string> = {}) {
  const state: ReviewViewState = { uno_review_choice: { uno_review_choice_input: { selected_option: { value: "confirm" } } } };
  for (const [key, value] of Object.entries(values)) state[`uno_field:${key}`] = { value: { type: "plain_text_input", value } };
  const submit = reviewSubmitOf({ ...(draft as object), state: { values: state } });
  assert.ok(submit.ok);
  return submit.request;
}

/** Every limit Slack holds a modal to, checked on what it was handed. */
function assertFits(view: unknown) {
  const v = view as View;
  assert.ok(v.blocks.length <= 100, `${v.blocks.length} blocks`);
  assert.ok(v.title.text.length <= 24, v.title.text);
  for (const b of v.blocks) {
    assert.ok(!["table", "markdown", "container"].includes(b.type), `${b.type} is not a modal block`);
    if (b.type === "alert") assert.ok(b.text!.text.length <= 200, b.text!.text);
    if (b.type === "header") assert.ok(b.text!.text.length <= 150);
    if (b.fields) assert.ok(b.fields.length <= 10 && b.fields.every((f) => f.text.length <= 2000));
    for (const o of b.element?.options ?? []) assert.ok((o.description?.text.length ?? 0) <= 75, o.description?.text ?? "");
  }
  const texts: string[] = [];
  JSON.stringify(view, (key, value) => {
    if ((key === "text" || key === "initial_value") && typeof value === "string") texts.push(value);
    return value;
  });
  assert.ok(texts.every((t) => t.length <= 3000));
}

describe("a Roadmap card's draft is drawn in the shared anatomy", () => {
  it("orders the zones: header, where, alert, Title, the facts, Summary, the body, the decision", async () => {
    const { draft } = await openDraft();
    assert.equal((draft as View).title.text, "Review Roadmap card");
    assert.deepEqual(zones(draft), [
      "header",
      "rich_text",
      "alert",
      "field",
      "section",
      "field",
      "divider",
      "rich_text",
      "rich_text",
      "rich_text",
      "divider",
      "input",
      "input",
    ]);
    assert.equal(blocksOf(draft)[0]!.text!.text, "New PRD card");
    assert.deepEqual(fieldInputs(draft).map((b) => [b.block_id ?? "", b.element!.initial_value ?? ""]), [
      ["uno_field:0.title", PRD.title],
      ["uno_field:0.summary", PRD.summary],
    ]);
  });

  it("puts the no-open-questions warning in an alert at the top, once, in under 200 characters", async () => {
    const { draft } = await openDraft();
    const alert = blocksOf(draft)[2]!;
    assert.equal(alert.level, "warning");
    assert.equal(alert.text!.text, NO_OPEN_QUESTIONS);
    assert.ok(NO_OPEN_QUESTIONS.length <= 200);
    // Not at the bottom any more, and not said twice.
    const json = JSON.stringify(draft);
    assert.equal(json.split("No open questions").length - 1, 1);
    assert.equal(blocksOf(draft).filter((b) => b.type === "context").length, 0);
  });

  it("has no alert when the brief names its open questions", async () => {
    const { draft } = await openDraft({ proposalText: textOf(PRD) });
    assert.equal(blocksOf(draft).filter((b) => b.type === "alert").length, 0);
    assert.deepEqual(zones(draft).slice(0, 3), ["header", "rich_text", "field"]);
  });

  it("names the Roadmap as a link in the where line, and as words when its address is unknown", async () => {
    const linked = await openDraft();
    assert.deepEqual(whereOf(linked.draft), [
      { type: "text", text: "Creates a card on the " },
      { type: "link", url: DATABASES.roadmap, text: "Roadmap" },
      { type: "text", text: " board." },
    ]);
    const named = await openDraft({}, { databases: false });
    assert.deepEqual(whereOf(named.draft)[1], { type: "text", text: "Roadmap", style: { bold: true } });
  });

  it("sets pillar, Design Status and source as fields, with Edit fields beside them", async () => {
    const { draft } = await openDraft();
    const facts = factsOf(draft)!;
    assert.deepEqual(facts.fields!.map((f) => f.text), [
      "*Product Pillar*\nTutor Experience",
      "*Design Status*\nNeed PRD / Under Playground",
      `*Source*\n<${SOURCE}|Slack thread>`,
    ]);
    assert.equal(facts.accessory?.action_id, "uno_review_edit");
    // The button is said once, there, not in a line of its own.
    assert.equal(JSON.stringify(draft).split("uno_review_edit").length - 1, 1);
    assert.doesNotMatch(JSON.stringify(draft), /\*Fields\*|\*Product Pillar:\*/);
  });

  it("draws the body's headings as bold lines, its list lines as lists, and no header past the first", async () => {
    const { draft } = await openDraft();
    const body = blocksOf(draft).filter((b) => b.type === "rich_text").slice(1);
    const [problem, goals, criteria] = body.map((b) => b.elements!);
    assert.deepEqual(problem, [
      { type: "rich_text_section", elements: [{ type: "text", text: "Problem", style: { bold: true } }] },
      { type: "rich_text_section", elements: [{ type: "text", text: "Full sessions turn tutors away with no next step." }] },
    ]);
    assert.deepEqual(goals![1], {
      type: "rich_text_list",
      style: "bullet",
      elements: [
        { type: "rich_text_section", elements: [{ type: "text", text: "Keep tutors who hit a full session" }] },
        { type: "rich_text_section", elements: [{ type: "text", text: "Fill dropped seats within an hour" }] },
      ],
    });
    assert.equal((criteria![0]!.elements as Array<{ text: string }>)[0]!.text, "Acceptance criteria");
    assert.equal((criteria![1] as { type: string; elements: unknown[] }).elements.length, 2);
    assert.equal(blocksOf(draft).filter((b) => b.type === "header").length, 1);
  });

  it("reads an intake card the same way, with no Edit fields when it has no select", async () => {
    const intake = { surface: "intake", title: "Fix the badge", summary: "The badge drifts." };
    const { draft } = await openDraft({ input: intake, proposalText: textOf(intake, CAVEAT) });
    assert.equal(blocksOf(draft)[0]!.text!.text, "New intake card");
    assert.deepEqual(zones(draft).slice(0, 6), ["header", "rich_text", "alert", "field", "section", "field"]);
    assert.deepEqual(factsOf(draft)!.fields!.map((f) => f.text), ["*Design Status*\nnot set"]);
    assert.equal(factsOf(draft)!.accessory, undefined);
  });

  it("says what each decision does on a Roadmap card", async () => {
    const { draft } = await openDraft();
    const choice = blocksOf(draft).find((b) => b.block_id === "uno_review_choice")!;
    assert.deepEqual(choice.element!.options!.map((o) => o.description?.text), [
      "Creates the card now and links it in the thread.",
      "I redraft it from your note and post a new card.",
      "Nothing happens.",
    ]);
  });

  it("fits Slack's limits, a long PRD included: the decision stays in the view", async () => {
    const long = {
      ...PRD,
      summary: "s".repeat(2999),
      sections: Array.from({ length: 120 }, (_, i) => ({ heading: `Section ${i + 1}`, body: `- ${"x".repeat(2990)}\n- two` })),
    };
    for (const over of [{}, { input: long }]) {
      const { draft } = await openDraft(over);
      assertFits(draft);
      assert.equal(blocksOf(draft).at(-1)!.block_id, "uno_review_note");
      assert.equal(fieldInputs(draft).length, 2, "the fields in place are never cut");
    }
  });

  it("is read-only for someone who can't decide: the title and summary shown, no input, no Edit fields", async () => {
    const { draft } = await openDraft({}, { userId: "U0OTHER001" });
    assert.equal(fieldInputs(draft).length, 0);
    assert.equal((draft as View).submit, undefined);
    assert.equal(factsOf(draft)!.accessory, undefined);
    const json = JSON.stringify(draft);
    assert.ok(json.includes(PRD.title) && json.includes(PRD.summary));
    assertFits(draft);
  });
});

describe("a decision's draft is drawn in the shared anatomy", () => {
  it("orders the zones: header, where, Title, the facts, Summary, the decision", async () => {
    const { draft } = await decision();
    assert.equal((draft as View).title.text, "Review decision");
    assert.equal(blocksOf(draft)[0]!.text!.text, "Log a decision");
    assert.deepEqual(zones(draft), ["header", "rich_text", "field", "section", "field", "divider", "input", "input"]);
    assertFits(draft);
  });

  it("names the Decisions database and the Roadmap card it links to in the where line", async () => {
    const { draft } = await decision();
    assert.deepEqual(whereOf(draft), [
      { type: "text", text: "Creates a row in the " },
      { type: "link", url: DATABASES.decisions, text: "Decisions" },
      { type: "text", text: " database" },
      { type: "text", text: ", linked to " },
      { type: "link", url: CARD_URL, text: "its Roadmap card" },
      { type: "text", text: "." },
    ]);
  });

  it("links a card given by its id alone, and names one given by words", async () => {
    const id = await decision({ input: { ...DECISION, properties: { ...DECISION.properties, roadmap_card: "0123456789abcdef0123456789abcdef" } } });
    assert.deepEqual(whereOf(id.draft)[4], { type: "link", url: "https://www.notion.so/0123456789abcdef0123456789abcdef", text: "its Roadmap card" });
    const named = await decision({ input: { ...DECISION, properties: { ...DECISION.properties, roadmap_card: "Session sign-up waitlist" } } });
    assert.deepEqual(whereOf(named.draft)[4], { type: "text", text: "Session sign-up waitlist", style: { bold: true } });
  });

  it("sets status and card as fields, with Edit fields beside them", async () => {
    const { draft } = await decision();
    const facts = factsOf(draft)!;
    assert.deepEqual(facts.fields!.map((f) => f.text), ["*Status*\nAccepted", `*Roadmap Card*\n<${CARD_URL}|Open card>`]);
    assert.equal(facts.accessory?.action_id, "uno_review_edit");
  });

  it("says Approve logs the decision", async () => {
    const { draft } = await decision();
    const choice = blocksOf(draft).find((b) => b.block_id === "uno_review_choice")!;
    assert.equal(choice.element!.options![0]!.description?.text, "Logs the decision now and links it in the thread.");
  });
});

describe("a Marketplace row's draft mirrors the decision's", () => {
  it("orders the zones: header, where, Title, the facts, Summary, the decision", async () => {
    const { draft } = await marketplace();
    assert.equal((draft as View).title.text, "Review Marketplace row");
    assert.equal(blocksOf(draft)[0]!.text!.text, "Publish a Marketplace row");
    assert.deepEqual(zones(draft), ["header", "rich_text", "field", "section", "field", "divider", "input", "input"]);
    assertFits(draft);
  });

  it("names the Prototype Marketplace database, which the row is created in or updated on", async () => {
    const { draft } = await marketplace();
    assert.deepEqual(whereOf(draft), [
      { type: "text", text: "Creates or updates a row in the " },
      { type: "link", url: DATABASES.marketplace, text: "Prototype Marketplace" },
      { type: "text", text: " database." },
    ]);
  });

  it("sets its properties as fields by the names a person reads, a link as its place, and no Edit fields with no select", async () => {
    const { draft } = await marketplace();
    const facts = factsOf(draft)!;
    assert.deepEqual(facts.fields!.map((f) => f.text), [
      "*Stage*\nHigh-fi",
      `*Deployment link*\n<${MARKETPLACE.properties.deployment_url}|plus-uno.netlify.app>`,
      "*Contributors*\nBill Guo, Bryan",
    ]);
    assert.equal(facts.accessory, undefined);
    assert.doesNotMatch(JSON.stringify(draft), /deployment_url|uno_review_edit/);
  });

  it("says Approve creates or updates the row", async () => {
    const { draft } = await marketplace();
    const choice = blocksOf(draft).find((b) => b.block_id === "uno_review_choice")!;
    assert.equal(choice.element!.options![0]!.description?.text, "Creates or updates the row now and links it in the thread.");
  });
});

describe("Submit and Edit fields still reach the created page", () => {
  it("creates the page with the edited title and summary", async () => {
    for (const open of [() => openDraft(), () => decision(), () => marketplace()]) {
      const h = await open();
      const request = approve(h.draft, { "0.title": "Waitlist, reworded", "0.summary": "A shorter summary." });
      await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: BILL, ...request }, h.deps);
      const input = h.ran[0]!.execute!.input as Record<string, unknown>;
      assert.equal(input.title, "Waitlist, reworded");
      assert.equal(input.summary, "A shorter summary.");
      assert.equal(h.ran[0]!.edited, true);
    }
  });

  it("refuses an emptied title, and redraws the draft with the refusal first", async () => {
    const h = await openDraft();
    const request = approve(h.draft, { "0.title": "" });
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: BILL, ...request }, h.deps);
    assert.equal(h.ran.length, 0);
    const redrawn = h.views.calls.at(-1)!.view;
    assert.equal(blocksOf(redrawn)[0]!.level, "error");
    assert.equal(blocksOf(redrawn)[1]!.type, "header");
  });

  for (const [name, over, key, value, read] of [
    ["a Roadmap card's pillar", {}, "0.properties.product_pillar", "Toolkit", (i: Record<string, unknown>) => (i.properties as Record<string, unknown>).product_pillar],
    ["a decision's status", { input: DECISION, proposalText: textOf(DECISION) }, "0.properties.status", "Proposed", (i: Record<string, unknown>) => (i.properties as Record<string, unknown>).status],
  ] as const) {
    it(`offers ${name} under Edit fields, shows the pick beside the button, and writes it on Approve`, async () => {
      const h = await openDraft(over);
      await runReviewPush({ triggerId: "T.edit", card: { channel: CHANNEL, ts: CARD_TS }, userId: BILL }, h.deps);
      const edit = h.views.calls.at(-1)!.view;
      const select = blocksOf(edit).find((b) => b.block_id === `uno_field:${key}`)!;
      assert.equal(select.accessory?.type, "static_select");

      await keepReviewPick(
        { viewId: "V2", rootViewId: "V1", card: { channel: CHANNEL, ts: CARD_TS }, userId: BILL, blocks: blocksOf(edit), pick: { key, value } },
        h.deps,
      );
      const redrawn = h.views.calls.at(-1)!;
      assert.equal(redrawn.kind === "update" && redrawn.viewId, "V1");
      const facts = factsOf(redrawn.view)!;
      assert.ok(facts.fields!.some((f) => f.text.endsWith(`\n${value}`)), JSON.stringify(facts.fields));
      assert.equal(facts.accessory?.action_id, "uno_review_edit");
      assert.match(JSON.stringify(redrawn.view), /Edited here: /);
      assert.deepEqual(h.views.refused, []);

      const request = approve(redrawn.view);
      await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: BILL, ...request }, h.deps);
      assert.equal(read(h.ran[0]!.execute!.input as Record<string, unknown>), value);
    });
  }
});

describe("a body's Markdown as rich text", () => {
  it("reads bullets, numbers, headings, bold, code and links, and keeps paragraphs", () => {
    assert.deepEqual(proseElements("## Plan\n1. **First** step\n2. Run `npm test`\n\nSee [the doc](https://example.com/doc)."), [
      { type: "rich_text_section", elements: [{ type: "text", text: "Plan", style: { bold: true } }] },
      {
        type: "rich_text_list",
        style: "ordered",
        elements: [
          { type: "rich_text_section", elements: [{ type: "text", text: "First", style: { bold: true } }, { type: "text", text: " step" }] },
          { type: "rich_text_section", elements: [{ type: "text", text: "Run " }, { type: "text", text: "npm test", style: { code: true } }] },
        ],
      },
      {
        type: "rich_text_section",
        elements: [{ type: "text", text: "See " }, { type: "link", url: "https://example.com/doc", text: "the doc" }, { type: "text", text: "." }],
      },
    ]);
  });

  it("leaves a snake_case word and a lone asterisk as written", () => {
    assert.deepEqual(proseElements("Set product_pillar to 5 * 2"), [
      { type: "rich_text_section", elements: [{ type: "text", text: "Set product_pillar to 5 * 2" }] },
    ]);
  });
});
