// The share-out's Review pop-up, drawn in the shared anatomy and decided.
//
// Driven at the review door, as `tests/proposal-edit.test.ts` drives it: the
// in-memory ThreadState, the recording Delivery and a views client that
// refuses what Slack refuses. The card is the one Bill opened on 2026-10-15
// (`docs/plans/2026-10-15-review-modal-redesign.md` § 1): a hi-fi prototype
// shared in a named channel, three questions, one reviewer, a deadline and the
// bundle caveat. Each case asserts what Slack was handed, or what Approve ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, type ReviewDoorDeps, type ReviewViewState } from "../src/slack/review-door";
import { reviewSubmitOf } from "../src/slack/review-view";
import { CONFIRM_FOOTER, shortCardOf } from "../src/slack/proposal-render";
import { fieldsFromInput, renderShareout } from "../src/tools/share-out-render";
import { recordingViews } from "./helpers/recording-slack";
import { cardWords } from "./helpers/card-message";

const CHANNEL = "D0ASKER01";
const THREAD = "1760540000.000050";
const CARD_TS = "1760540000.000100";

const INPUT = {
  project: "Session Sign Up",
  artifact: "hi-fi prototype",
  fidelity: "high",
  round: 1,
  summary: "Hi-fi prototype of the new session sign-up flow, with the waitlist state.",
  feedback_wanted: [
    "Is the waitlist state clear before a tutor commits?",
    "Does the confirmation step need the calendar add?",
    "Anything in the copy that reads as a promise we can't keep?",
  ],
  not_looking_for: "Visual polish; colors are placeholders.",
  link: "https://plus-uno.netlify.app/prototypes/session-sign-up",
  reviewers: ["U0BRYAN001"],
  deadline: "EOD Friday",
  place: "channel",
  channel: "C0SANDBOX1",
};

/** The card's text, as `renderProposalCard` writes a share-out's. */
const TEXT = [
  ":warning: About to *share this for feedback in <#C0SANDBOX1|uno-bot-sandbox>*:",
  `• *Summary:* ${INPUT.summary}`,
  "• *Place:* channel",
  "• *Deadline:* EOD Friday",
  "• *Round:* 1",
  "• *Project:* Session Sign Up",
  "• *Artifact:* hi-fi prototype",
  "• *Channel:* C0SANDBOX1",
  "• *Feedback wanted:*",
  ...INPUT.feedback_wanted.map((q) => `    ◦ ${q}`),
  "• *Fidelity:* high",
  `• *Not looking for:* ${INPUT.not_looking_for}`,
  `• *Link:* ${INPUT.link}`,
  "• *Reviewers:*",
  "    ◦ U0BRYAN001",
  ":warning: *Bundle incomplete — missing: Loom walkthrough · Decisions DB link.*",
  "Approving posts it *without* them — or drop the links in this thread first and I'll fold them in.",
  CONFIRM_FOOTER,
].join("\n");

const PROPOSAL: PendingProposal = {
  toolName: "shareout_post",
  input: INPUT,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1760540000.000040",
  proposalTs: CARD_TS,
  proposalText: TEXT,
  requesterUserId: "U0ASKER001",
};

async function staged(over: Partial<PendingProposal> = {}): Promise<ThreadState> {
  const store = createInMemoryThreadState();
  await store.putProposal({ ...PROPOSAL, ...over });
  return store;
}

function harness(threadState: ThreadState) {
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
  };
  return { deps, views, ran, cardUpdates };
}

type Block = {
  type: string;
  block_id?: string;
  optional?: boolean;
  label?: { text: string };
  hint?: { text: string };
  element?: { type: string; initial_value?: string; multiline?: boolean; options?: Array<{ value: string; text: { text: string }; description?: { text: string } }> };
  text?: { text: string };
  level?: string;
  title?: { text: string };
  subtitle?: { text: string };
  actions?: Array<{ url?: string; text: { text: string } }>;
  elements?: unknown[];
};

const blocksOf = (view: unknown) => (view as { blocks: Block[] }).blocks;
const fieldInputs = (view: unknown) => blocksOf(view).filter((b) => b.type === "input" && (b.block_id ?? "").startsWith("uno_field:"));
const inputById = (view: unknown, key: string) => blocksOf(view).find((b) => b.block_id === `uno_field:${key}`);

async function openDraft(userId = "U0BILL0001", over: Partial<PendingProposal> = {}) {
  const h = harness(await staged({ ...over, confirmers: ["U0BILL0001"] }));
  await runReviewOpen({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId }, h.deps);
  const draft = h.views.calls.at(-1)!.view;
  return { ...h, draft };
}

/** Approve, pressed with these values in the fields in place. */
function approve(draft: unknown, values: Record<string, string> = {}) {
  const state: ReviewViewState = { uno_review_choice: { uno_review_choice_input: { selected_option: { value: "confirm" } } } };
  for (const [key, value] of Object.entries(values)) state[`uno_field:${key}`] = { value: { type: "plain_text_input", value } };
  const submit = reviewSubmitOf({ ...(draft as object), state: { values: state } });
  assert.ok(submit.ok);
  return submit.request;
}

async function approveWith(values: Record<string, string>) {
  const h = await openDraft();
  const request = approve(h.draft, values);
  await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U0BILL0001", ...request }, h.deps);
  assert.equal(h.ran.length, 1, "Approve ran");
  return { ...h, executed: h.ran[0]!.execute!.input as Record<string, unknown> };
}

describe("the share-out draft is drawn in the shared anatomy", () => {
  it("titles the pop-up for the tool, and opens on what Approve does", async () => {
    const { draft } = await openDraft();
    assert.equal((draft as { title: { text: string } }).title.text, "Review share-out");
    const [first] = blocksOf(draft);
    assert.equal(first!.type, "header");
    assert.equal(first!.text!.text, "Share for feedback");
  });

  it("orders the zones: header, where, alert, card, inputs, locked note, decision", async () => {
    const { draft } = await openDraft();
    const types = blocksOf(draft).map((b) => (b.block_id?.startsWith("uno_field:") ? "field" : b.type));
    assert.deepEqual(types, [
      "header",
      "rich_text",
      "alert",
      "card",
      "field",
      "field",
      "field",
      "field",
      "field",
      "field",
      "context",
      "divider",
      "input",
      "input",
    ]);
  });

  it("names where it posts and who it pings once, as native channel and user elements", async () => {
    const { draft } = await openDraft();
    const where = blocksOf(draft)[1]!;
    const elements = (where.elements as Array<{ elements: Array<Record<string, string>> }>)[0]!.elements;
    assert.deepEqual(
      elements.filter((e) => e.type !== "text"),
      [
        { type: "channel", channel_id: "C0SANDBOX1" },
        { type: "user", user_id: "U0BRYAN001" },
      ],
    );
    const json = JSON.stringify(draft);
    assert.equal(json.split("C0SANDBOX1").length - 1, 1, "the channel id appears once, in the where line");
    assert.equal(json.split("U0BRYAN001").length - 1, 1, "the reviewer appears once, as a user element");
  });

  it("puts the bundle caveat in a warning alert above the fold, in under 200 characters", async () => {
    const { draft } = await openDraft();
    const alert = blocksOf(draft)[2]!;
    assert.equal(alert.level, "warning");
    assert.match(alert.text!.text, /Bundle incomplete: no Loom walkthrough or Decisions DB link/);
    assert.ok(alert.text!.text.length <= 200);
  });

  it("shows the project as a card with Round 1, the fidelity in words, and an Open button", async () => {
    const { draft } = await openDraft();
    const card = blocksOf(draft).find((b) => b.type === "card")!;
    assert.equal(card.title!.text, "Session Sign Up");
    assert.equal(card.subtitle!.text, "Hi-fi prototype · Round 1 · High fidelity");
    assert.equal(card.actions![0]!.url, INPUT.link);
    assert.equal(card.actions![0]!.text.text, "Open prototype");
  });

  it("prefills every editable input from the staged input, each with a label and a hint", async () => {
    const { draft } = await openDraft();
    const want: Array<[string, string, string, boolean]> = [
      ["0.summary", "What this is", INPUT.summary, false],
      ["0.feedback_wanted.0", "Feedback question 1", INPUT.feedback_wanted[0]!, false],
      ["0.feedback_wanted.1", "Feedback question 2", INPUT.feedback_wanted[1]!, true],
      ["0.feedback_wanted.2", "Feedback question 3", INPUT.feedback_wanted[2]!, true],
      ["0.not_looking_for", "Not looking for", INPUT.not_looking_for, true],
      ["0.deadline", "Deadline", INPUT.deadline, true],
    ];
    assert.deepEqual(
      fieldInputs(draft).map((b) => b.block_id),
      want.map(([key]) => `uno_field:${key}`),
    );
    for (const [key, label, value, optional] of want) {
      const block = inputById(draft, key)!;
      assert.equal(block.label!.text, label);
      assert.equal(block.element!.initial_value, value, key);
      assert.equal(block.optional, optional, `${key} optional`);
      assert.ok(block.hint?.text, `${key} has a hint`);
    }
    assert.equal(inputById(draft, "0.deadline")!.element!.multiline, false);
  });

  it("locks where, who, fidelity and round: no input for them, and a line saying Needs changes changes them", async () => {
    const { draft } = await openDraft();
    for (const key of ["place", "channel", "reviewers", "reviewers.0", "fidelity", "round", "link", "project"]) {
      assert.equal(inputById(draft, `0.${key}`), undefined, `${key} is not editable`);
    }
    const note = blocksOf(draft).find((b) => b.type === "context")!;
    assert.match(JSON.stringify(note), /choose Needs changes/);
  });

  it("never shows an internal input: no place, no raw channel, no Round or Fidelity label", async () => {
    const { draft } = await openDraft();
    const json = JSON.stringify(draft);
    assert.doesNotMatch(json, /\*Place:\*|Place: channel|\*Channel:\*|\*Round:\*|\*Fidelity:\*/);
    assert.doesNotMatch(json, /"channel"\s*:\s*"C0SANDBOX1"/, "the input's own key is never a label");
  });

  it("says what each decision does, Approve counting the reviewers", async () => {
    const { draft } = await openDraft();
    const choice = blocksOf(draft).find((b) => b.block_id === "uno_review_choice")!;
    const words = choice.element!.options!.map((o) => [o.value, o.description?.text]);
    assert.deepEqual(words, [
      ["confirm", "Posts it now and pings 1 reviewer."],
      ["revise", "I redraft it from your note and post a new card."],
      ["cancel", "Nothing posts."],
    ]);
    const note = blocksOf(draft).find((b) => b.block_id === "uno_review_note")!;
    assert.equal(note.hint!.text, "Needs changes: what should change. Reject: an optional reason.");
  });

  it("fits Slack's limits: 100 blocks, a 24-character title, 3,000 characters of text", async () => {
    const long = { ...INPUT, summary: "x".repeat(2900), not_looking_for: "y".repeat(2999) };
    const { draft, views } = await openDraft("U0BILL0001", { input: long });
    assert.equal(views.refused.length, 0);
    assert.ok(blocksOf(draft).length <= 100);
    assert.ok((draft as { title: { text: string } }).title.text.length <= 24);
    const texts: string[] = [];
    JSON.stringify(draft, (key, value) => {
      if ((key === "text" || key === "initial_value") && typeof value === "string") texts.push(value);
      return value;
    });
    assert.ok(texts.every((t) => t.length <= 3000));
  });

  it("is read-only for someone who can't decide: the words shown, no input, no Submit", async () => {
    const { draft } = await openDraft("U0OTHER001");
    assert.equal(fieldInputs(draft).length, 0);
    assert.equal((draft as { submit?: unknown }).submit, undefined);
    const json = JSON.stringify(draft);
    for (const q of INPUT.feedback_wanted) assert.ok(json.includes(q), q);
    assert.ok(json.includes(INPUT.summary));
  });
});

describe("Submit carries the share-out's edits into what posts", () => {
  it("posts the reworded summary and question", async () => {
    const { executed } = await approveWith({
      "0.summary": "The sign-up flow with its waitlist state.",
      "0.feedback_wanted.0": "Is the waitlist clear?",
    });
    assert.equal(executed.summary, "The sign-up flow with its waitlist state.");
    assert.deepEqual(executed.feedback_wanted, ["Is the waitlist clear?", INPUT.feedback_wanted[1], INPUT.feedback_wanted[2]]);
  });

  it("drops a cleared question, so the post asks two", async () => {
    const { executed } = await approveWith({ "0.feedback_wanted.1": "" });
    assert.deepEqual(executed.feedback_wanted, [INPUT.feedback_wanted[0], INPUT.feedback_wanted[2]]);
    const post = renderShareout(fieldsFromInput(executed), "<@U0ASKER001>");
    assert.ok(!post.includes(INPUT.feedback_wanted[1]!));
    assert.match(post, /2\. Anything in the copy/);
  });

  it("drops a cleared deadline, so the post has none", async () => {
    const { executed } = await approveWith({ "0.deadline": "" });
    assert.equal("deadline" in executed, false);
    const post = renderShareout(fieldsFromInput(executed), "<@U0ASKER001>");
    assert.match(post, /Comments in-thread\.$/);
  });

  it("drops a cleared Not looking for", async () => {
    const { executed } = await approveWith({ "0.not_looking_for": "  " });
    assert.equal("not_looking_for" in executed, false);
  });

  it("refuses an emptied summary or first question, and runs nothing", async () => {
    for (const key of ["0.summary", "0.feedback_wanted.0"]) {
      const h = await openDraft();
      const request = approve(h.draft, { [key]: "" });
      await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U0BILL0001", ...request }, h.deps);
      assert.equal(h.ran.length, 0, `${key} emptied runs nothing`);
      const redrawn = h.views.calls.at(-1)!.view;
      assert.equal(blocksOf(redrawn)[0]!.type, "alert", "the refusal is the first block");
      assert.equal(blocksOf(redrawn)[0]!.level, "error");
    }
  });

  it("ignores a forged value for a locked field: where and who post as staged", async () => {
    const h = await openDraft();
    const request = approve(h.draft, { "0.summary": "Reworded." });
    const forged = { ...request, state: { ...request.state!, "uno_field:0.channel": { value: { type: "plain_text_input", value: "C0ELSEWHERE" } }, "uno_field:0.reviewers.0": { value: { type: "plain_text_input", value: "U0SOMEONE1" } } } };
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U0BILL0001", ...forged }, h.deps);
    const executed = h.ran[0]!.execute!.input as Record<string, unknown>;
    assert.equal(executed.channel, "C0SANDBOX1");
    assert.deepEqual(executed.reviewers, ["U0BRYAN001"]);
    assert.equal(executed.summary, "Reworded.");
  });

  it("re-renders the decided card with the edited question and without the cleared deadline", async () => {
    const { cardUpdates } = await approveWith({ "0.feedback_wanted.0": "Is the waitlist clear?", "0.deadline": "" });
    const text = cardUpdates.at(-1)!.text;
    assert.ok(text.includes("◦ Is the waitlist clear?"), text);
    assert.ok(!text.includes(INPUT.feedback_wanted[0]!));
    assert.ok(!text.includes("EOD Friday"));
  });
});

describe("the posted share-out card's summary line", () => {
  it("reads Round 1, never a bare 1, and hides the place and the raw channel", () => {
    const short = shortCardOf(TEXT)!;
    assert.match(short.summary, /Round 1/);
    assert.doesNotMatch(short.summary, /· 1( ·|$)/);
    assert.doesNotMatch(short.summary, /channel ·|C0SANDBOX1 ·|· C0SANDBOX1/);
  });
});
