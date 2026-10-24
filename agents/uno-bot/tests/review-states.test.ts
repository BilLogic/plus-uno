import { cardTtlMs } from "../src/card-expiry";
// The Review pop-up around the draft: a batch, the read-only view, a decided
// card opened from View, and the states after a decision or once a card has
// closed (`docs/plans/2026-10-15-review-modal-redesign.md` § 2, § 9, § 14 and
// Decision 5).
//
// Driven at the review door on the in-memory ThreadState and a views client
// that refuses what Slack refuses (`tests/helpers/recording-slack.ts`). Each
// case asserts what Slack was handed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, DECIDED_TTL_MS, type PendingProposal, type ProposalOperation, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, runReviewPush, type ReviewDoorDeps } from "../src/slack/review-door";
import { batchHeader } from "../src/slack/review-batch";
import { CONFIRM_FOOTER } from "../src/slack/proposal-render";
import { recordingViews } from "./helpers/recording-slack";

const CHANNEL = "D0ASKER01";
const THREAD = "1760540000.000050";
const CARD_TS = "1760540000.000100";
const BILL = "U0BILL0001";
const BRYAN = "U0BRYAN001";
const COCO = "U0COCO0001";

const SHAREOUT = {
  project: "Session Sign Up",
  artifact: "hi-fi prototype",
  fidelity: "high",
  round: 1,
  summary: "Hi-fi prototype of the new session sign-up flow, with the waitlist state.",
  feedback_wanted: ["Is the waitlist state clear before a tutor commits?", "Does the confirmation step need the calendar add?"],
  not_looking_for: "Visual polish; colors are placeholders.",
  link: "https://plus-uno.netlify.app/prototypes/session-sign-up",
  reviewers: [BRYAN],
  deadline: "EOD Friday",
  place: "channel",
  channel: "C0SANDBOX1",
};

const SHAREOUT_TEXT = [
  ":warning: About to *share this for feedback in <#C0SANDBOX1|uno-bot-sandbox>*:",
  `• *Summary:* ${SHAREOUT.summary}`,
  ":warning: *Bundle incomplete — missing: Loom walkthrough · Decisions DB link.*",
  "Approving posts it *without* them — or drop the links in this thread first and I'll fold them in.",
  CONFIRM_FOOTER,
].join("\n");

const dm = (recipient: string, text = "Crit moved to 3pm Friday."): ProposalOperation => ({ toolName: "dm_relay", input: { recipient, text } });

const CARD: PendingProposal = {
  toolName: "shareout_post",
  input: SHAREOUT,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1760540000.000040",
  proposalTs: CARD_TS,
  proposalText: SHAREOUT_TEXT,
  requesterUserId: "U0ASKER001",
  confirmers: [BILL],
};

/** Two DMs behind one card. */
const TWO_DMS: Partial<PendingProposal> = {
  operations: [dm(BRYAN), dm(COCO)],
  toolName: "dm_relay",
  input: dm(BRYAN).input,
  proposalText: `:warning: About to *send 2 DMs*\n${CONFIRM_FOOTER}`,
};

type Block = {
  type: string;
  block_id?: string;
  level?: string;
  label?: { text: string };
  element?: { initial_value?: string; options?: Array<{ value: string; description?: { text: string } }> };
  text?: { type?: string; text: string };
  title?: { text: string };
  body?: { text: string };
  elements?: unknown[];
};
type View = { title: { text: string }; submit?: unknown; blocks: Block[] };

function harness(threadState: ThreadState, now?: () => number) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async () => {},
    restage: async () => {},
    revise: async () => {},
    ...(now ? { now } : {}),
  };
  return { deps, views, ran };
}

async function store(over: Partial<PendingProposal> = {}, now?: () => number): Promise<ThreadState> {
  const threadState = createInMemoryThreadState(now ? { now } : {});
  await threadState.putProposal({ ...CARD, ...over });
  return threadState;
}

const open = (userId: string, extra: Record<string, unknown> = {}) => ({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId, ...extra });
const decide = (decision: "confirm" | "cancel" | "revise", note?: string) => ({
  viewId: "V1",
  channel: CHANNEL,
  messageTs: CARD_TS,
  userId: BILL,
  decision,
  ...(note ? { note } : {}),
});

/** The view Slack was last handed. */
function lastView(h: ReturnType<typeof harness>): View {
  assert.deepEqual(h.views.refused, []);
  return h.views.calls.at(-1)!.view as View;
}

/** A rich text block's words, its pills as mentions. */
function richText(e: unknown): string {
  const el = e as { text?: unknown; user_id?: string; channel_id?: string; elements?: unknown[] };
  if (typeof el.text === "string") return el.text;
  if (el.user_id) return `<@${el.user_id}>`;
  if (el.channel_id) return `<#${el.channel_id}>`;
  return (el.elements ?? []).map(richText).join("");
}

const inputs = (view: View) => view.blocks.filter((b) => b.type === "input");

/** Every text a view carries, for the limits. */
function texts(view: unknown): string[] {
  const out: string[] = [];
  JSON.stringify(view, (key, value) => {
    if ((key === "text" || key === "initial_value") && typeof value === "string") out.push(value);
    return value;
  });
  return out;
}

describe("a batch of DMs", () => {
  async function draft() {
    const h = harness(await store(TWO_DMS));
    await runReviewOpen(open(BILL), h.deps);
    return { h, view: lastView(h) };
  }

  it("opens on what it does, both recipients as pills, in run order", async () => {
    const { view } = await draft();
    assert.equal(view.title.text, "Review 2 DMs");
    assert.deepEqual([view.blocks[0]!.type, view.blocks[0]!.text!.text], ["header", "Send 2 DMs"]);
    assert.equal(view.blocks[1]!.type, "rich_text");
    assert.equal(richText(view.blocks[1]), `Sends as uno, naming who asked, to <@${BRYAN}> and <@${COCO}>, in this order.`);
  });

  it("gives each recipient a numbered label over its own Message input", async () => {
    const { view } = await draft();
    const shape = view.blocks.map((b) => (b.type === "rich_text" ? `rich_text: ${richText(b)}` : b.type === "input" ? `input: ${b.block_id}` : b.type));
    assert.deepEqual(shape, [
      "header",
      `rich_text: Sends as uno, naming who asked, to <@${BRYAN}> and <@${COCO}>, in this order.`,
      `rich_text: 1 · To <@${BRYAN}>`,
      "input: uno_field:0.text",
      `rich_text: 2 · To <@${COCO}>`,
      "input: uno_field:1.text",
      "divider",
      "input: uno_review_choice",
      "input: uno_review_note",
    ]);
    for (const key of ["0.text", "1.text"]) {
      const input = view.blocks.find((b) => b.block_id === `uno_field:${key}`)!;
      assert.equal(input.label!.text, "Message");
      assert.equal(input.element!.initial_value, "Crit moved to 3pm Friday.");
    }
    assert.doesNotMatch(JSON.stringify(view), /\*To:\*|Direct message|operations, run in order/);
  });

  it("says what each decision does for the whole batch", async () => {
    const { view } = await draft();
    const choice = view.blocks.find((b) => b.block_id === "uno_review_choice")!;
    assert.deepEqual(
      choice.element!.options!.map((o) => o.description?.text),
      ["Sends both DMs now.", "I redraft it from your note and post a new card.", "Nothing is sent."],
    );
  });

  it("fits Slack's limits with ten long DMs", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => dm(`U0PERSON${String(i).padStart(2, "0")}`, "x".repeat(2999)));
    const h = harness(await store({ ...TWO_DMS, operations: ten }));
    await runReviewOpen(open(BILL), h.deps);
    const view = lastView(h);
    assert.equal(view.title.text, "Review 10 DMs");
    assert.equal(view.blocks[0]!.text!.text, "Send 10 DMs");
    assert.ok(view.blocks.length <= 100);
    assert.ok(view.title.text.length <= 24);
    assert.ok(texts(view).every((t) => t.length <= 3000));
    assert.equal(inputs(view).filter((b) => b.block_id?.startsWith("uno_field:")).length, 10);
  });

  it("falls back to the card's text whole when one of its tools has no reading", async () => {
    const h = harness(await store({ ...TWO_DMS, operations: [dm(BRYAN), { toolName: "github_workflow_run", input: { workflow: "deploy.yml" } }], proposalText: "• *Workflow:* deploy.yml" }));
    await runReviewOpen(open(BILL), h.deps);
    assert.match(JSON.stringify(lastView(h).blocks), /Workflow:\* deploy\.yml/);
  });
});

describe("a batch's header", () => {
  const issue = { toolName: "github_issue_create", input: { title: "Badge drift" } };
  const prd = { toolName: "notion_create", input: { surface: "prd", title: "Goal cycle" } };

  it("counts a batch of one tool in a person's words", () => {
    assert.equal(batchHeader([dm(BRYAN), dm(COCO)]), "Send 2 DMs");
    assert.equal(batchHeader([issue, issue]), "File 2 issues");
    assert.equal(batchHeader([prd, prd, prd]), "Add 3 Roadmap cards");
  });

  it("names each kind of a mixed batch, counted, in the order it first runs", () => {
    assert.equal(batchHeader([dm(BRYAN), issue, dm(COCO)]), "Send 2 DMs and file an issue");
    assert.equal(batchHeader([prd, issue, dm(BRYAN)]), "Add a Roadmap card, file an issue and send a DM");
  });

  it("says its size, in order, when a tool has no words of its own", () => {
    assert.equal(batchHeader([dm(BRYAN), { toolName: "github_workflow_run", input: {} }]), "Run 2 operations, in order");
  });
});

describe("the read-only view, for someone who can't decide", () => {
  it("opens on a plain-text info alert, who can decide as pills under it, then the draft with no input and no Submit", async () => {
    const h = harness(await store());
    await runReviewOpen(open("U0OTHER001"), h.deps);
    const view = lastView(h);
    assert.deepEqual([view.blocks[0]!.type, view.blocks[0]!.level], ["alert", "info"]);
    assert.deepEqual(view.blocks[0]!.text, { type: "plain_text", text: "Read-only." });
    assert.equal(view.blocks[1]!.type, "rich_text");
    assert.equal(richText(view.blocks[1]), `Only <@${BILL}> can decide this proposal.`);
    assert.equal(view.blocks[2]!.type, "header");
    assert.equal(inputs(view).length, 0, "no inputs at all, the decision's included");
    assert.equal(view.submit, undefined);
    assert.equal(view.blocks.filter((b) => b.type === "context" && /Read-only/.test(JSON.stringify(b))).length, 0, "no footnote at the bottom");
  });

  it("puts the summary in the card's body, and the questions in a list", async () => {
    const h = harness(await store());
    await runReviewOpen(open("U0OTHER001"), h.deps);
    const view = lastView(h);
    const card = view.blocks.find((b) => b.type === "card")!;
    assert.equal(card.body!.text, SHAREOUT.summary);
    assert.doesNotMatch(JSON.stringify(view), /What this is/);
    for (const q of SHAREOUT.feedback_wanted) assert.ok(JSON.stringify(view).includes(q), q);
  });

  it("shows a batch's messages as text, not inputs", async () => {
    const h = harness(await store(TWO_DMS));
    await runReviewOpen(open("U0OTHER001"), h.deps);
    const view = lastView(h);
    assert.equal(inputs(view).length, 0);
    assert.equal(view.blocks[0]!.level, "info");
    assert.match(JSON.stringify(view), /Crit moved to 3pm Friday\./);
  });
});


/** When a card closed, as View's line says it (`closedWhen`): "Oct 19 at 9:13 AM ET". */
const WHEN = String.raw`[A-Z][a-z]{2} \d{1,2} at \d{1,2}:\d{2} [AP]M ET`;

describe("a decided card, opened from View", () => {
  async function decided(decision: "confirm" | "cancel", over: Partial<PendingProposal> = {}, note?: string) {
    const h = harness(await store(over));
    await runReviewDecision(decide(decision, note), h.deps);
    await runReviewOpen(open("U0OTHER001", { cardText: "(the decided card)" }), h.deps);
    return { h, view: lastView(h) };
  }

  it("draws the same content read-only, under a success alert, then who approved and where it posts as pills", async () => {
    const { view } = await decided("confirm");
    assert.equal(view.title.text, "Review share-out");
    assert.deepEqual(view.blocks.map((b) => b.type).slice(0, 4), ["alert", "rich_text", "header", "card"]);
    assert.equal(view.blocks[0]!.level, "success");
    assert.deepEqual(view.blocks[0]!.text, { type: "plain_text", text: "Approved." });
    assert.match(richText(view.blocks[1]), new RegExp(String.raw`^Approved by <@${BILL}> on ${WHEN} to post in <#C0SANDBOX1>\.$`));
    assert.equal(view.blocks.find((b) => b.type === "card")!.body!.text, SHAREOUT.summary);
    assert.equal(inputs(view).length, 0);
    assert.equal(view.submit, undefined);
  });

  it("puts no mention inside any alert", async () => {
    for (const [decision, over] of [["confirm", {}], ["cancel", {}], ["confirm", TWO_DMS]] as const) {
      const { view } = await decided(decision, over, decision === "cancel" ? "Wrong channel" : undefined);
      for (const alert of view.blocks.filter((b) => b.type === "alert")) {
        assert.equal(alert.text!.type, "plain_text");
        assert.doesNotMatch(alert.text!.text, /<[@#]/);
      }
    }
  });

  it("leaves out the where line and the caveats, which were about the decision", async () => {
    const { view } = await decided("confirm");
    assert.equal(view.blocks.filter((b) => b.type === "alert").length, 1, "only the decided alert");
    assert.doesNotMatch(JSON.stringify(view), /Posts in|Bundle incomplete/);
  });

  it("says a Reject the same way, under an info alert, then who and the reason", async () => {
    const { view } = await decided("cancel", {}, "Wrong channel");
    assert.deepEqual([view.blocks[0]!.type, view.blocks[0]!.level], ["alert", "info"]);
    assert.equal(view.blocks[0]!.text!.text, "Rejected.");
    assert.match(richText(view.blocks[1]), new RegExp(String.raw`^Rejected by <@${BILL}> on ${WHEN}: Wrong channel\.$`));
    assert.equal(view.blocks[2]!.type, "header");
  });

  it("keeps a long reason whole and as typed, since rich text needs no escaping", async () => {
    const reason = "R&D <maybe> ".repeat(30).trim();
    const { view } = await decided("cancel", {}, reason);
    assert.ok(richText(view.blocks[1]).endsWith(`: ${reason}.`), "the reason whole, as typed");
    assert.match(richText(view.blocks[1]), new RegExp(String.raw`^Rejected by <@${BILL}> on ${WHEN}: `));
    assert.ok(texts(view).every((t) => t.length <= 3000));
  });

  it("says who a batch of DMs went to", async () => {
    const { view } = await decided("confirm", TWO_DMS);
    assert.match(richText(view.blocks[1]), new RegExp(String.raw`^Approved by <@${BILL}> on ${WHEN} to send to <@${BRYAN}> and <@${COCO}>\.$`));
    assert.equal(view.blocks[2]!.text!.text, "Send 2 DMs");
    assert.equal(inputs(view).length, 0);
  });

  it("still draws the draft long after the card's own hour, counted from the decision", async () => {
    let t = 1_760_540_000_000;
    const now = () => t;
    const h = harness(await store({}, now), now);
    await runReviewDecision(decide("confirm"), h.deps);
    t += DECIDED_TTL_MS - 1;
    await runReviewOpen(open(BILL, { cardText: "(the decided card)" }), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => b.type).slice(0, 4), ["alert", "rich_text", "header", "card"]);
    assert.doesNotMatch(JSON.stringify(view), /no longer kept/);
  });

  it("falls back to the outcome alone once the decided card's lifetime is over", async () => {
    let t = 1_760_540_000_000;
    const now = () => t;
    const threadState = await store({}, now);
    const h = harness(threadState, now);
    await runReviewDecision(decide("confirm"), h.deps);
    t += DECIDED_TTL_MS + 1;
    await runReviewOpen(open(BILL, { cardText: `${SHAREOUT_TEXT}\nApproved by <@${BILL}>` }), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]), [["alert", "success"], ["rich_text", undefined], ["section", undefined]]);
    assert.deepEqual(view.blocks[0]!.text, { type: "plain_text", text: "This proposal has already been decided." });
    assert.equal(richText(view.blocks[1]), `Approved by <@${BILL}>`);
    assert.match(view.blocks[2]!.text!.text, /no longer kept/);
    assert.deepEqual(await threadState.getProposalByTs(CARD_TS), { state: "none" }, "and the record is gone");
  });
});

describe("after a decision, and closed", () => {
  it("answers Approve with a success alert, then what happens next", async () => {
    const h = harness(await store());
    await runReviewDecision(decide("confirm"), h.deps);
    const view = lastView(h);
    assert.equal(view.title.text, "Review share-out");
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]), [["alert", "success"], ["section", undefined]]);
    assert.equal(view.blocks[0]!.text!.text, "Approved.");
    assert.equal(view.blocks[1]!.text!.text, "I'm running it now. The outcome posts in the thread.");
  });

  it("answers Reject with an info alert, then that nothing runs", async () => {
    const h = harness(await store());
    await runReviewDecision(decide("cancel"), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]), [["alert", "info"], ["section", undefined]]);
    assert.deepEqual(view.blocks.map((b) => b.text!.text), ["Rejected.", "Nothing will run."]);
  });

  it("answers Needs changes with an info alert, then where the revision goes", async () => {
    const h = harness(await store());
    await runReviewDecision(decide("revise", "Ask about the calendar first"), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]), [["alert", "info"], ["section", undefined]]);
    assert.equal(view.blocks[0]!.text!.text, "Sent back with your note.");
    assert.match(view.blocks[1]!.text!.text, /new card posts in the thread/);
  });

  it("answers Needs changes with no note with a warning alert, then how to send one", async () => {
    const h = harness(await store());
    await runReviewDecision(decide("revise", "   "), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]), [["alert", "warning"], ["section", undefined]]);
    assert.deepEqual(view.blocks.map((b) => b.text!.text), [
      "Needs changes needs a note.",
      "Press Review again, choose Needs changes and write what to change.",
    ]);
  });

  it("says a card being revised is, then where to decide", async () => {
    const threadState = await store();
    assert.equal(await threadState.markRevising(CARD_TS, BILL), "marked");
    const h = harness(threadState);
    await runReviewOpen(open(BILL), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]), [["alert", "info"], ["section", undefined]]);
    assert.equal(view.blocks[0]!.text!.text, "This proposal is being revised.");
    assert.equal(view.title.text, "Review share-out");
  });

  it("answers an expired card with a warning, when it closed and what to do, over the draft it closed on", async () => {
    let t = 1_760_540_000_000;
    const now = () => t;
    const h = harness(await store({}, now), now);
    t += cardTtlMs(t) + 1;
    await runReviewOpen(open(BILL), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]).slice(0, 2), [["alert", "warning"], ["rich_text", undefined]]);
    assert.equal(view.blocks[0]!.text!.text, "Expired.");
    assert.match(richText(view.blocks[1]), new RegExp(String.raw`^Closed on ${WHEN}\. Ask again for a fresh card\.$`));
    assert.equal(view.blocks.find((b) => b.type === "card")!.body!.text, SHAREOUT.summary, "the draft, kept for View (#1362)");
    assert.equal(inputs(view).length, 0);
    assert.equal(view.submit, undefined);
    assert.equal(view.title.text, "Review share-out", "titled for its tool, read in the same lookup");
  });

  it("answers a replaced card with a warning, when, and where the newer one is, over the draft it replaced", async () => {
    const threadState = await store();
    await threadState.putProposal({ ...CARD, proposalTs: "1760540000.000200" });
    const h = harness(threadState);
    await runReviewOpen(open(BILL), h.deps);
    const view = lastView(h);
    assert.deepEqual(view.blocks.map((b) => [b.type, b.level]).slice(0, 2), [["alert", "warning"], ["rich_text", undefined]]);
    assert.equal(view.blocks[0]!.text!.text, "This proposal was replaced by a newer one.");
    assert.match(richText(view.blocks[1]), new RegExp(String.raw`^Replaced on ${WHEN}\. Review the newest card in the thread instead\.$`));
    assert.equal(view.blocks.find((b) => b.type === "card")!.body!.text, SHAREOUT.summary, "the draft, kept for View (#1362)");
    assert.equal(inputs(view).length, 0);
    assert.equal(view.title.text, "Review share-out");
  });

  it("titles the answer to a decision that lands on an expired card for its tool", async () => {
    let t = 1_760_540_000_000;
    const now = () => t;
    const h = harness(await store({}, now), now);
    t += cardTtlMs(t) + 1;
    await runReviewDecision(decide("confirm"), h.deps);
    assert.equal(h.ran.length, 0);
    assert.equal(lastView(h).title.text, "Review share-out");
  });

  it("titles the answer to a second decision on a card already decided for its tool", async () => {
    const h = harness(await store());
    await runReviewDecision(decide("confirm"), h.deps);
    await runReviewDecision(decide("cancel"), h.deps);
    assert.equal(h.ran.length, 1);
    assert.equal(lastView(h).title.text, "Review share-out");
  });

  it("titles Edit fields on an expired card for its tool", async () => {
    let t = 1_760_540_000_000;
    const now = () => t;
    const h = harness(await store({}, now), now);
    t += cardTtlMs(t) + 1;
    await runReviewPush({ triggerId: "T.trigger", card: { channel: CHANNEL, ts: CARD_TS }, userId: BILL }, h.deps);
    assert.equal(lastView(h).title.text, "Review share-out");
  });
});
