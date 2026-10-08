// The Review pop-up reads as a draft, and its decisions sit at its foot.
//
// Driven at the review door, as `tests/proposal-review.test.ts` drives it: the
// in-memory ThreadState, the recording Delivery and a views client that
// refuses what Slack refuses — including a view whose footer holds more than
// submit and close, an input with no submit, and a fourth view in a stack.
// The drafts are shaped like the live ones: a PRD create whose sections the
// model wrote body-first, a Product Pillar, and a caveat.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, runReviewPush, type ReviewDoorDeps } from "../src/slack/review-door";
import { CONFIRM_FOOTER, proposalCardBlocks } from "../src/slack/proposal-render";
import type { GateVerdict } from "../src/gate/index";
import { recordingViews } from "./helpers/recording-slack";
import { createdDesignStatus } from "../src/integrations/notion";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";

const CAVEAT =
  ":warning: *No open questions were named for this brief.* If it leaves anything ambiguous (states, interactions, semantics), cancel and ask — confirming builds it as-is.";

/** A PRD create as the live card staged it: Product Pillar, and sections the
 *  model wrote Body/Heading, then Heading/Body. */
const PRD_INPUT = {
  surface: "prd",
  title: "Goal cycle resets per session",
  summary: "Tutors read goal cycles differently, so resets drift.",
  properties: { product_pillar: "Toolkit" },
  sections: [
    { body: "Tutors lose track of which cycle a student is in.", heading: "Context" },
    { heading: "Goals", body: "One reset per session, visible to the tutor." },
  ],
};

/** The card's text, as Delivery rendered the live one: the parameter list. */
const PRD_TEXT = [
  ":warning: About to *create this card in Notion*:",
  "• *Surface:* prd",
  "• *Title:* Goal cycle resets per session",
  "• *Summary:* Tutors read goal cycles differently, so resets drift.",
  "• *Properties:*",
  "    • *Product pillar:* Toolkit",
  "• *Sections:*",
  "    • *Body:* Tutors lose track of which cycle a student is in.",
  "    • *Heading:* Context",
  "    • *Heading:* Goals",
  "    • *Body:* One reset per session, visible to the tutor.",
  CAVEAT,
  CONFIRM_FOOTER,
].join("\n");

const BASE: PendingProposal = {
  toolName: "notion_create",
  input: PRD_INPUT,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1700000000.000190",
  proposalTs: CARD_TS,
  proposalText: PRD_TEXT,
  requesterUserId: "U1",
};

async function staged(over: Partial<PendingProposal> = {}): Promise<ThreadState> {
  const store = createInMemoryThreadState();
  await store.putProposal({ ...BASE, ...over });
  return store;
}

function harness(threadState: ThreadState) {
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
    fieldOptions: async () => ["Toolkit", "Universal"],
  };
  return { deps, views, ran, revisions };
}

/** The draft a confirmer is shown. */
async function draftOf(over: Partial<PendingProposal> = {}) {
  const { deps, views } = harness(await staged(over));
  await runReviewOpen({ triggerId: "T.open", channel: CHANNEL, messageTs: CARD_TS, userId: "U2" }, deps);
  assert.deepEqual(views.refused, []);
  return views.calls[1]!.view as { blocks: Array<Record<string, unknown>> };
}

/** Each block's words, in order: a header's text, a section's, a context's. */
function lines(view: { blocks: Array<Record<string, unknown>> }): string[] {
  return view.blocks.map((b) => {
    const text = (b.text as { text?: string } | undefined)?.text;
    if (text) return `${b.type}: ${text}`;
    const elements = (b.elements as Array<{ text?: string | { text: string } }> | undefined) ?? [];
    return `${b.type}: ${elements.map((e) => (typeof e.text === "string" ? e.text : (e.text?.text ?? ""))).join(" ")}`;
  });
}

const indexOf = (all: string[], pattern: RegExp) => all.findIndex((l) => pattern.test(l));

describe("the draft reads as a draft", () => {
  it("leads with the key properties, by the database's names, and the Design Status the create writes", async () => {
    const all = lines(await draftOf());
    const words = all.join("\n");
    assert.match(all[0]!, /New PRD card on the Roadmap/);
    const order = [/\*Title:\* Goal cycle resets per session/, /\*Product Pillar:\* Toolkit/, /\*Design Status:\* Need PRD \/ Under Playground/, /\*Summary:\* Tutors read/];
    const at = order.map((p) => words.search(p));
    assert.ok(at.every((i) => i >= 0), JSON.stringify(at));
    assert.deepEqual([...at].sort((a, b) => a - b), at, "Title, Product Pillar, Design Status, Summary");
    // No parameter name leaks.
    assert.doesNotMatch(words, /Surface|Properties:|Sections:|\bprd\b|Product pillar|Heading:|Body:/);
  });

  it("shows the Design Status the write sets, from the code that sets it, whatever the draft says", async () => {
    // The create writes this value; a drafted one is not the property.
    assert.equal(createdDesignStatus("prd"), "Need PRD / Under Playground");
    const words = lines(await draftOf({ input: { ...PRD_INPUT, properties: { product_pillar: "Toolkit", design_status: "Shipped" } } })).join("\n");
    assert.ok(words.includes(`*Design Status:* ${createdDesignStatus("prd")}`), words);
    assert.doesNotMatch(words, /not set|Shipped|Design status/);
  });

  it("says not set only where the write sets none: an intake card", async () => {
    assert.equal(createdDesignStatus("intake"), null);
    const words = lines(await draftOf({ input: { surface: "intake", title: "Fix the badge" } })).join("\n");
    assert.match(words, /\*Design Status:\* not set/);
  });

  it("writes the body as headings and paragraphs, in the draft's section order, whatever order the keys came in", async () => {
    const all = lines(await draftOf());
    const context = indexOf(all, /^header: Context$/);
    const contextBody = indexOf(all, /^section: Tutors lose track/);
    const goals = indexOf(all, /^header: Goals$/);
    const goalsBody = indexOf(all, /^section: One reset per session/);
    assert.ok(context >= 0 && context < contextBody && contextBody < goals && goals < goalsBody, JSON.stringify(all));
  });

  it("keeps the card's caveats at the end of the draft, above the decisions", async () => {
    const all = lines(await draftOf());
    const caveat = indexOf(all, /No open questions were named/);
    assert.equal(caveat, all.length - 3, JSON.stringify(all.slice(-3)));
    assert.match(all.at(-1)!, /Needs changes Reject/);
  });

  it("reads a notion_update as the page, the properties it sets and the text it writes", async () => {
    const all = lines(
      await draftOf({
        toolName: "notion_update",
        input: {
          page_url: "https://www.notion.so/Reflection-0123456789abcdef0123456789abcdef",
          properties: { "Design Status": "In Review" },
          append: { sections: [{ body: "Does the mentor see the answers?", heading: "Open questions" }] },
          replace: [{ block_id: "b1", last_edited_time: "2026-10-01T09:00:00.000Z", content: "Tutors answer three questions." }],
        },
        proposalText: ":warning: About to *update this Notion page*",
      }),
    );
    const words = all.join("\n");
    assert.match(words, /\*Page:\* <https:\/\/www\.notion\.so\/Reflection-/);
    assert.match(words, /\*Design Status:\* In Review/);
    assert.ok(indexOf(all, /^header: Open questions$/) < indexOf(all, /Does the mentor/));
    assert.match(words, /header: Rewritten block\nsection: Tutors answer three questions\./);
    assert.doesNotMatch(words, /block_id|last_edited_time|page_url|append|replace/);
  });

  it("reads a GitHub issue, an email and a DM by what a person checks", async () => {
    const issue = lines(await draftOf({ toolName: "github_issue_create", input: { title: "Badge drift", body: "The badge differs." }, proposalText: "x" })).join("\n");
    assert.match(issue, /New GitHub issue on BilLogic\/plus-uno/);
    assert.match(issue, /\*Title:\* Badge drift\n\*Repository:\* BilLogic\/plus-uno/);
    assert.match(issue, /section: The badge differs\./);

    const mail = lines(await draftOf({ toolName: "email_send", input: { to: ["a@b.org"], subject: "Hello", body: "Hi there." }, proposalText: "x" })).join("\n");
    assert.match(mail, /\*To:\* a@b\.org\n\*Subject:\* Hello/);
    assert.match(mail, /section: Hi there\./);

    const dm = lines(await draftOf({ toolName: "dm_relay", input: { recipient: "U07ABC", text: "Card is ready." }, proposalText: "x" })).join("\n");
    assert.match(dm, /\*To:\* <@U07ABC>/);
    assert.match(dm, /section: Card is ready\./);
    assert.doesNotMatch(dm, /recipient/);
  });

  it("groups a batch by operation, in run order", async () => {
    const all = lines(
      await draftOf({
        operations: [
          { toolName: "notion_create", input: PRD_INPUT },
          { toolName: "dm_relay", input: { recipient: "U07ABC", text: "Card is ready." } },
        ],
      }),
    );
    assert.match(all[0]!, /2 operations, run in order/);
    const first = indexOf(all, /1\. New PRD card on the Roadmap/);
    const second = indexOf(all, /2\. Direct message/);
    assert.ok(first > 0 && first < indexOf(all, /Goal cycle resets/) && indexOf(all, /One reset per session/) < second, JSON.stringify(all));
  });

  it("shows the card's text for a tool it has no reading for", async () => {
    const words = lines(await draftOf({ toolName: "shareout_post", input: { channel: "#x" }, proposalText: "• *Channel:* #x" })).join("\n");
    assert.match(words, /Channel:\* #x/);
  });
});

describe("the thread card's summary", () => {
  const summaryOf = (text: string) => JSON.stringify((proposalCardBlocks(text) as unknown[])[0]);

  it("names the key properties and the Design Status the write sets, not how the call is shaped", () => {
    const text = PRD_TEXT.replace("    • *Product pillar:* Toolkit", "    • *Product pillar:* Toolkit\n    • *Design status:* Shipped");
    for (const card of [PRD_TEXT, text]) {
      const summary = summaryOf(card);
      assert.match(summary, /_Goal cycle resets per session_ · Toolkit · Need PRD \/ Under Playground/);
      assert.doesNotMatch(summary, /· prd|Context|Shipped|not set/);
    }
  });
});

describe("Needs changes, Reject and Edit fields push a view of their own", () => {
  const card = { channel: CHANNEL, ts: CARD_TS };

  it("Needs changes pushes a required note, sent with Send changes, and the stack closes on one line", async () => {
    const { deps, views, revisions } = harness(await staged());
    await runReviewPush({ triggerId: "T.changes", card, userId: "U2", step: "changes" }, deps);
    const pushed = views.calls[0]!;
    assert.equal(pushed.kind, "push");
    const view = pushed.view as { submit: { text: string }; blocks: Array<{ type: string; optional?: boolean }> };
    assert.equal(view.submit.text, "Send changes");
    assert.deepEqual(view.blocks.filter((b) => b.type === "input").map((b) => b.optional), [false]);

    await runReviewDecision(
      { viewId: "V2", rootViewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", decision: "revise", note: "Shorter goals" },
      deps,
    );
    assert.deepEqual(revisions, ["Shorter goals"]);
    const answered = views.calls.slice(1).map((c) => (c.kind === "update" ? c.viewId : c.kind));
    assert.deepEqual(answered, ["V2", "V1"], "the pushed view and the draft under it say the same line");
    assert.match(JSON.stringify(views.calls.at(-1)!.view), /Sent back with your note/);
    assert.deepEqual(views.refused, []);
  });

  it("Reject pushes an optional reason, submitted with Reject, and runs nothing", async () => {
    const { deps, views, ran } = harness(await staged());
    await runReviewPush({ triggerId: "T.reject", card, userId: "U2", step: "reject" }, deps);
    const view = views.calls[0]!.view as { submit: { text: string }; blocks: Array<{ type: string; optional?: boolean }> };
    assert.equal(view.submit.text, "Reject");
    assert.deepEqual(view.blocks.filter((b) => b.type === "input").map((b) => b.optional), [true]);

    await runReviewDecision({ viewId: "V2", rootViewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U2", decision: "cancel" }, deps);
    assert.equal(ran[0]?.decision, "cancel");
    assert.equal(ran[0]?.execute, undefined);
    assert.match(JSON.stringify(views.calls.at(-1)!.view), /Rejected/);
  });

  it("Edit fields offers a non-confirmer nothing", async () => {
    const { deps, views } = harness(await staged({ confirmers: ["U07CONFIRM"] }));
    await runReviewPush({ triggerId: "T.edit", card, userId: "U2", step: "edit" }, deps);
    const shown = views.calls.at(-1)!.view as { submit?: unknown; blocks: Array<{ type: string }> };
    assert.equal(shown.submit, undefined);
    assert.deepEqual(shown.blocks.filter((b) => b.type === "input"), []);
  });
});
