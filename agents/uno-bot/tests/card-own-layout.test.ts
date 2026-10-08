// A note or a decision edited onto a card keeps the card's own layout.
//
// A sweep card is a carousel of fixes, a Figma library card leads with a
// release card and a table, and a Figma preview card carries its screenshot.
// Each is posted with blocks of its own, and the record keeps them
// (`PendingProposal.proposalBlocks`): a late reaction, a gate note or a
// decision edits the note line and the right button onto THOSE blocks rather
// than rebuilding the card from its text. A stated card — one the Worker
// posts on its own, decided by what its footer says — is edited without a
// Review or View button.
//
// Driven through the doors a gesture comes in by onto the real Slack Delivery
// adapter and a recording Slack client, so the assertion is what Slack was
// handed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runReactionDoor } from "../src/gate/index";
import { runButtonDoor } from "../src/slack/button-door";
import { deliveryAdapter } from "../src/slack/delivery-adapter";
import { renderProposalCard } from "../src/slack/proposal-render";
import { expiredPost, renderGateNote } from "../src/slack/gate-note";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { recordingDelivery, runTurn, type ProposalCard } from "../src/turn/index";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";
import { harness, request } from "./helpers/turn-harness";

const CHANNEL = "C0000001";
const ROOT = "1790000000.000100";
const CARD = "1790000000.000200";
const BEA = "U0000001";
const MAYA = "U0000002";
const BOT = "U0000009";
const HOUR = 3_600_000;

type Block = Record<string, any>;

/** A sweep card as the morning hands it over: two fixes. */
const SWEEP: ProposalCard = {
  kind: "confirm",
  verb: "apply 2 fixes",
  fields: [],
  caveats: [],
  operations: [],
  fixes: {
    head: "*End-of-day sweep* · 2 fixes",
    items: [
      { page: { title: "Goal cycles", url: "https://www.notion.so/goal-cycles" }, owner: BEA, change: "“weekly” → “per session”", detail: "page says weekly" },
      { page: { title: "Reflection", url: "https://www.notion.so/reflection" }, owner: BEA, change: "“tutors” → “tutors only”", detail: "page says tutors" },
    ],
    tail: "drop N to leave one out.",
  },
};

/** A real sweep card, rendered as it posts: a carousel of two fixes. */
function sweepCard(): { text: string; blocks: unknown[] } {
  const rendered = renderProposalCard(SWEEP);
  assert.ok(rendered.blocks, "a sweep card posts with blocks of its own");
  return { text: rendered.text, blocks: rendered.blocks };
}

function proposal(over: Partial<PendingProposal> = {}): PendingProposal {
  const card = sweepCard();
  return {
    toolName: "notion_update_block",
    input: {},
    channel: CHANNEL,
    threadTs: ROOT,
    replyTs: ROOT,
    userMsgTs: ROOT,
    proposalTs: CARD,
    proposalText: card.text,
    proposalBlocks: card.blocks,
    requesterUserId: "",
    ttlMs: 72 * HOUR,
    ...over,
  };
}

/** The one edit Slack was handed on the card. */
function edit(slack: RecordingSlack): Block[] {
  const updates = slack.of("update");
  assert.equal(updates.length, 1, "one edit");
  assert.equal(updates[0]!.ts, CARD);
  return updates[0]!.blocks as Block[];
}

function buttons(blocks: Block[]): string[] {
  return blocks.filter((b) => b.type === "actions").flatMap((b) => (b.elements as Block[]).map((e) => e.text.text));
}

function lastLine(blocks: Block[]): string {
  const context = blocks.filter((b) => b.type === "context");
  return context[context.length - 1]!.elements[0].text;
}

async function reactOn(
  setup: (state: ReturnType<typeof createInMemoryThreadState>, clock: { at: number }) => Promise<void>,
  userId = BEA,
) {
  const clock = { at: 1_790_000_000_000 };
  const threadState = createInMemoryThreadState({ now: () => clock.at });
  await setup(threadState, clock);
  const slack = recordingSlack();
  await runReactionDoor(
    { channel: CHANNEL, messageTs: CARD, glyph: "white_check_mark", userId, messageAuthorId: BOT },
    {
      threadState,
      delivery: (target) => deliveryAdapter(slack.deps(false), target),
      threadRootOf: async () => ROOT,
      botUserId: async () => BOT,
      applyVerdict: async () => {},
      restage: async () => {},
    },
  );
  return slack;
}

describe("a sweep card keeps its carousel", () => {
  it("under a late reaction", async () => {
    const slack = await reactOn(async (s, clock) => {
      await s.putProposal(proposal());
      clock.at += 72 * HOUR + 1;
    });
    const blocks = edit(slack);
    assert.equal(blocks.filter((b) => b.type === "carousel").length, 1, "the carousel stays");
    assert.equal(lastLine(blocks), expiredPost(72 * HOUR));
    assert.deepEqual(buttons(blocks), ["View"]);
  });

  it("under a gate note that leaves it live", async () => {
    const slack = await reactOn(async (s) => void (await s.putProposal(proposal({ confirmers: [BEA] }))), MAYA);
    const blocks = edit(slack);
    assert.equal(blocks.filter((b) => b.type === "carousel").length, 1, "the carousel stays");
    assert.match(lastLine(blocks), new RegExp(`Only <@${BEA}> can confirm`));
    assert.deepEqual(buttons(blocks), ["Review"], "still decidable by the confirmer");
  });

  it("once a press decides it", async () => {
    const threadState = createInMemoryThreadState();
    await threadState.putProposal(proposal());
    const replaced: Array<{ text: string; blocks: unknown[] }> = [];
    await runButtonDoor(
      { channel: CHANNEL, messageTs: CARD, decision: "confirm", userId: BEA },
      {
        threadState,
        delivery: (target) => deliveryAdapter(recordingSlack().deps(false), target),
        applyVerdict: async () => {},
        replyEphemeral: async () => {},
        replaceCard: async (message) => void replaced.push(message),
        restage: async () => {},
      },
    );
    assert.equal(replaced.length, 1);
    const blocks = replaced[0]!.blocks as Block[];
    assert.equal(blocks.filter((b) => b.type === "carousel").length, 1, "the carousel stays");
    assert.match(lastLine(blocks), new RegExp(`Approved by <@${BEA}>`));
    assert.deepEqual(buttons(blocks), ["View"]);
    assert.match(replaced[0]!.text, /Approved by/, "the fallback copy says the outcome too");
  });
});

describe("the record keeps a card's own blocks", () => {
  it("the Slack adapter reports the blocks a card went up with, and none for a text-only card", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), { channel: CHANNEL, replyTs: ROOT, userMsgTs: ROOT, userId: BEA });
    const carousel = await delivery.card(SWEEP);
    assert.ok(carousel.blocks?.some((b) => (b as Block).type === "carousel"), "a sweep card's carousel");

    const textOnly = await delivery.card({
      kind: "confirm",
      verb: "create a Notion page",
      fields: [{ label: "title", value: "Reflection redesign" }],
      caveats: [],
      operations: [],
    });
    assert.ok(textOnly.ok);
    assert.equal(textOnly.blocks, undefined, "re-rendered from its text, as always");
  });

  it("a turn stages its card with the blocks it went up with", async () => {
    const own = [{ type: "section", text: { type: "mrkdwn", text: "the card's own" } }];
    const h = harness({
      delivery: recordingDelivery({
        spelling: { card: (c) => ({ text: renderProposalCard(c).text, blocks: own }), gateNote: renderGateNote },
      }),
      replies: [{ text: "I'll file it.", toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }] }],
    });
    const outcome = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
    assert.equal(outcome.disposition, "staged");
    assert.deepEqual(outcome.staged?.proposal.proposalBlocks, own);
  });
});

describe("a stated card gains no Review or View", () => {
  const stated = (over: Partial<PendingProposal> = {}) => {
    const { proposalBlocks: _blocks, ...textOnly } = proposal({
      proposalText: "*DS precedence this week* · 2 mismatches\n\n:white_check_mark: files both; :no_entry: files nothing.",
      stated: { cancelled: "Filed nothing", expired: "That card expired, so nothing was filed." },
      ...over,
    });
    return textOnly;
  };

  it("under a late reaction", async () => {
    const slack = await reactOn(async (s, clock) => {
      await s.putProposal(stated());
      clock.at += 72 * HOUR + 1;
    });
    const blocks = edit(slack);
    assert.match(JSON.stringify(blocks), /DS precedence this week/, "its own words stay");
    assert.equal(lastLine(blocks), "That card expired, so nothing was filed.");
    assert.deepEqual(buttons(blocks), []);
  });

  it("under a gate note that leaves it live", async () => {
    const slack = await reactOn(async (s) => void (await s.putProposal(stated({ confirmers: [BEA] }))), MAYA);
    const blocks = edit(slack);
    assert.match(lastLine(blocks), new RegExp(`Only <@${BEA}> can confirm`));
    assert.deepEqual(buttons(blocks), []);
  });
});
