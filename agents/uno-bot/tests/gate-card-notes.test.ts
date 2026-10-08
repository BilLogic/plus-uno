// A note about a card's own state — it aged out, a revision replaced it, it is
// waiting on someone else — is one line edited onto the card, not a new
// message in the thread.
//
// Driven through the doors a gesture comes in by (the reaction door and the
// card's button door) onto the real Slack Delivery adapter and a recording
// Slack client, so the assertion is what Slack was handed: one `chat.update`
// on the card, and no post. The replaced-card wording is #583's — the person
// whose ✅ landed on a replaced card is told so, now on the card they reacted
// on, which is where they are looking.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, runReactionDoor } from "../src/gate/index";
import { runButtonDoor } from "../src/slack/button-door";
import { deliveryAdapter } from "../src/slack/delivery-adapter";
import { EXPIRED_POST, SUPERSEDED_POST } from "../src/slack/gate-note";
import { createInMemoryThreadState, PROPOSAL_TTL_MS, type PendingProposal } from "../src/thread-state/index";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";

const CHANNEL = "C0000001";
const ROOT = "1790000000.000100";
const OLD_CARD = "1790000000.000200";
const NEW_CARD = "1790000000.000300";
const BEA = "U0000001";
const MAYA = "U0000002";
const BOT = "U0000009";

function card(over: Partial<PendingProposal> = {}): PendingProposal {
  return {
    toolName: "notion_create",
    input: { title: "Reflection redesign" },
    channel: CHANNEL,
    threadTs: ROOT,
    replyTs: ROOT,
    userMsgTs: ROOT,
    proposalTs: OLD_CARD,
    proposalText: "Ready to create a Roadmap card: Reflection redesign",
    requesterUserId: BEA,
    ...over,
  };
}

type Block = Record<string, any>;

/** The card's last line and its button, off the one update Slack was handed. */
function edited(slack: RecordingSlack, ts: string): { text: string; line: string; button: string } {
  const updates = slack.of("update");
  assert.equal(updates.length, 1, "one edit");
  const update = updates[0]!;
  assert.equal(update.ts, ts, "on the card itself");
  const blocks = update.blocks as Block[];
  const context = blocks.filter((b) => b.type === "context");
  assert.equal(context.length, 1, "one line");
  const actions = blocks.filter((b) => b.type === "actions").flatMap((b) => b.elements as Block[]);
  assert.equal(actions.length, 1, "one button");
  return { text: update.text, line: context[0]!.elements[0].text, button: actions[0]!.text.text };
}

async function reactOn(
  messageTs: string,
  setup: (state: ReturnType<typeof createInMemoryThreadState>, clock: { at: number }) => Promise<void>,
  opts: { userId?: string } = {},
) {
  const clock = { at: 1_790_000_000_000 };
  const threadState = createInMemoryThreadState({ now: () => clock.at });
  await setup(threadState, clock);
  const slack = recordingSlack();
  const ran: unknown[] = [];
  await runReactionDoor(
    { channel: CHANNEL, messageTs, glyph: "white_check_mark", userId: opts.userId ?? BEA, messageAuthorId: BOT },
    {
      threadState,
      delivery: (target) => deliveryAdapter(slack.deps(false), target),
      threadRootOf: async () => ROOT,
      botUserId: async () => BOT,
      applyVerdict: async (v) => void (v.execute && ran.push(v)),
      restage: async () => {},
    },
  );
  return { slack, ran, threadState };
}

describe("on the reaction door", () => {
  it("a ✅ on a replaced card puts the replaced line on that card, and posts nothing", async () => {
    const { slack, ran } = await reactOn(OLD_CARD, async (s) => {
      await s.putProposal(card());
      await s.putProposal(card({ proposalTs: NEW_CARD, proposalText: "Ready to create a Roadmap card: Reflection, tutors only" }));
    });
    const { text, line, button } = edited(slack, OLD_CARD);
    assert.equal(line, SUPERSEDED_POST);
    assert.equal(text, card().proposalText, "re-rendered from the card's own words");
    assert.equal(button, "View", "nothing left to decide on it");
    assert.deepEqual(slack.of("message"), []);
    assert.deepEqual(ran, []);
  });

  it("a ✅ on an aged-out card says so on the card, and posts nothing", async () => {
    const { slack } = await reactOn(OLD_CARD, async (s, clock) => {
      await s.putProposal(card());
      clock.at += PROPOSAL_TTL_MS + 1;
    });
    const { line, button } = edited(slack, OLD_CARD);
    assert.equal(line, EXPIRED_POST);
    assert.equal(button, "View");
    assert.deepEqual(slack.of("message"), []);
  });

  it("a ✅ from someone who cannot confirm says who it is waiting on, on the card, and leaves it live", async () => {
    const { slack, ran, threadState } = await reactOn(
      OLD_CARD,
      async (s) => void (await s.putProposal(card({ confirmers: [BEA] }))),
      { userId: MAYA },
    );
    const { line, button } = edited(slack, OLD_CARD);
    assert.match(line, new RegExp(`Only <@${BEA}> can confirm`));
    assert.doesNotMatch(line, new RegExp(MAYA), "a line on the card names no one gesture");
    assert.equal(button, "Review", "still decidable by the confirmer");
    assert.deepEqual(slack.of("message"), []);
    assert.deepEqual(ran, []);
    assert.equal((await threadState.getProposalByTs(OLD_CARD)).state, "found");
  });
});

describe("on the card's button", () => {
  it("a press on an aged-out card edits the card instead of answering aside", async () => {
    const clock = { at: 1_790_000_000_000 };
    const threadState = createInMemoryThreadState({ now: () => clock.at });
    await threadState.putProposal(card());
    clock.at += PROPOSAL_TTL_MS + 1;
    const slack = recordingSlack();
    const aside: string[] = [];
    await runButtonDoor(
      { channel: CHANNEL, messageTs: OLD_CARD, decision: "confirm", userId: BEA },
      {
        threadState,
        delivery: (target) => deliveryAdapter(slack.deps(false), target),
        applyVerdict: async () => {},
        replyEphemeral: async (text) => void aside.push(text),
        replaceCard: async () => {},
        restage: async () => {},
      },
    );
    assert.equal(edited(slack, OLD_CARD).line, EXPIRED_POST);
    assert.deepEqual(slack.of("message"), []);
    assert.deepEqual(aside, []);
  });
});

describe("the Gate names the card", () => {
  it("when the model's resolve loses to a revision", async () => {
    const threadState = createInMemoryThreadState();
    const old = card();
    await threadState.putProposal(old);
    await threadState.putProposal(card({ proposalTs: NEW_CARD }));
    const verdict = await resolveSignal({ kind: "model", pending: old, decision: "confirm", userId: BEA }, { threadState });
    assert.equal(verdict.post?.note.kind, "superseded");
    assert.deepEqual(verdict.post?.card, { ts: OLD_CARD, text: old.proposalText });
  });

  it("for a non-confirmer only when the gesture was made on the card", async () => {
    const threadState = createInMemoryThreadState();
    const live = card({ confirmers: [BEA] });
    await threadState.putProposal(live);
    const deps = { threadState };

    for (const signal of [
      { kind: "reaction" as const, messageTs: OLD_CARD, channel: CHANNEL, thread: ROOT, glyph: "white_check_mark", userId: MAYA },
      { kind: "button" as const, messageTs: OLD_CARD, decision: "confirm" as const, userId: MAYA },
      { kind: "review" as const, messageTs: OLD_CARD, decision: "confirm" as const, userId: MAYA },
    ]) {
      const verdict = await resolveSignal(signal, deps);
      assert.equal(verdict.post?.note.kind, "not-a-confirmer", signal.kind);
      assert.deepEqual(verdict.post?.card, { ts: OLD_CARD, text: live.proposalText }, signal.kind);
    }

    // A typed ✅ or the model's resolve is answered near the message, as
    // before: the card is not where that person was looking.
    for (const signal of [
      { kind: "typed" as const, channel: CHANNEL, thread: ROOT, text: "✅", userId: MAYA },
      { kind: "model" as const, pending: live, decision: "confirm" as const, userId: MAYA },
    ]) {
      const verdict = await resolveSignal(signal, deps);
      assert.equal(verdict.post?.note.kind, "not-a-confirmer", signal.kind);
      assert.equal(verdict.post?.card, undefined, signal.kind);
    }
    assert.equal((await threadState.getProposalByTs(OLD_CARD)).state, "found");
  });

  it("and not for a lost race, which is about the signal rather than the card", async () => {
    const threadState = createInMemoryThreadState();
    const live = card();
    await threadState.putProposal(live);
    assert.ok(await threadState.claimProposal(OLD_CARD));
    const verdict = await resolveSignal({ kind: "model", pending: live, decision: "confirm", userId: BEA }, { threadState });
    assert.equal(verdict.post?.note.kind, "already-resolved");
    assert.equal(verdict.post?.card, undefined);
  });
});
