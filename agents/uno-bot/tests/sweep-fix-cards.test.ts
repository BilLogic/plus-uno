// The end-of-day sweep card as Slack shows it: one card per fix in a
// carousel, the page and thread words folded into a closed box, and the text
// copy still the whole card, opening with the sweep's mark.
//
// The card is posted by a real night and morning (`sweep-harness.ts`), and
// every message's blocks are held to what Slack refuses
// (`slack-block-rules.ts`). "drop 2" is then sent through a real turn, so the
// number a person reads on a card is the one the turn drops.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import type { ScheduledJob } from "../src/scheduled/runs";
import { isSweepCardPost, runSweepJob, type SweepSource } from "../src/sweep/index";
import { renderProposalCard } from "../src/slack/proposal-render";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { at, DESIGN, drift, msg, notionPage, reply, sweepHarness, ts } from "./helpers/sweep-harness";
import { CHANNEL, CONVERSATION, harness, request } from "./helpers/turn-harness";

const END_OF_DAY: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const MORNING: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };
const ROOT = ts(29, 15);

type Block = Record<string, any>;

const PAGE: SweepSource = notionPage("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", {
  title: "Reflection PRD",
  blocks: [
    { id: "blk-0", lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Launch: October" },
    { id: "blk-1", lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Owner: Ade" },
    { id: "blk-2", lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Scope: tutors only" },
  ],
});

const FIXES = ["Launch: November", "Owner: Bea", "Scope: tutors and students"];

/** Three fixes on one page, from a thread Sam started, posted by a real
 *  night and morning. */
async function postedCard() {
  const history = [msg("U0SAM", ROOT, `PRD: <${PAGE.url}>`, { reply_count: 3, latest_reply: ts(29, 16, 2) })];
  const replies = [
    msg("U0ADE", ts(29, 16, 0), "Launch slips to November."),
    msg("U0BEA", ts(29, 16, 1), "I own it now."),
    msg("U0ADE", ts(29, 16, 2), "Students are in scope too."),
  ];
  const h = sweepHarness({
    channels: { [DESIGN]: { kind: "public", history, threads: { [ROOT]: [history[0]!, ...replies] } } },
    sources: [PAGE],
    detectorReplies: [
      reply(
        ...PAGE.blocks.map((b, i) =>
          drift({
            source: PAGE,
            block: b.id,
            evidence: [ts(29, 16, i)],
            claimedBy: i % 2 ? "U0BEA" : "U0ADE",
            replacement: FIXES[i]!,
          }),
        ),
      ),
    ],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);
  assert.equal(h.staged.length, 1);
  return { h, post: h.posted[0]!, staged: h.staged[0]! };
}

const plainOf = (text: unknown): string => String((text as Block | undefined)?.text ?? "");

test("three fixes post as three cards in a carousel, numbered as `drop N` names them", async () => {
  const { post } = await postedCard();
  const blocks = post.blocks as Block[];
  assert.equal(messageBlocksRefusal(blocks), null);

  const carousel = blocks.find((b) => b.type === "carousel");
  assert.ok(carousel, "the fixes ride in a carousel");
  const cards = carousel.elements as Block[];
  assert.equal(cards.length, 3);
  cards.forEach((card, i) => {
    assert.match(plainOf(card.title), new RegExp(`^${i + 1}\\. Reflection PRD$`), "the number leads each card");
    assert.match(plainOf(card.body), new RegExp(`→ “${FIXES[i]}”`), "before → after");
    assert.equal(card.actions[0].text.text, "Open");
    assert.equal(card.actions[0].url, PAGE.url, "Open goes to the page");
    assert.match(card.icon.image_url, /notion/, "the Notion logo");
  });
  assert.match(plainOf(cards[0]!.subtitle), /<@U0ADE>/, "the owner is named on the card");
  assert.match(plainOf(cards[1]!.subtitle), /<@U0BEA>/);

  // The page and thread words are folded into one closed box.
  const box = blocks.find((b) => b.type === "container");
  assert.ok(box, "a folded box");
  assert.equal(box.title.text, "Page says / thread says");
  assert.equal(box.default_collapsed, true);
  const folded = JSON.stringify(box.child_blocks);
  assert.match(folded, /page says/);
  assert.match(folded, /thread says/);
  assert.match(folded, /Launch: October/);

  // The way to drop one is still said, and the Review button comes last.
  assert.match(JSON.stringify(blocks), /drop 2/);
  assert.equal(blocks.at(-1)!.type, "actions");
});

test("the staged card keeps the carousel it went up with, for a note or a decision to edit onto", async () => {
  const { post, staged } = await postedCard();
  assert.deepEqual(staged.proposalBlocks, post.blocks);
  assert.ok((staged.proposalBlocks as Block[]).some((b) => b.type === "carousel"));
});

test("\"drop 2\" leaves out the fix on the second card", async () => {
  const { post, staged } = await postedCard();
  const second = ((post.blocks as Block[]).find((b) => b.type === "carousel")!.elements as Block[])[1]!;
  assert.match(plainOf(second.body), /Owner: Bea/);

  const t = harness();
  const pending = { ...staged, channel: CHANNEL, threadTs: CONVERSATION, replyTs: CONVERSATION };
  await t.threadState.putProposal(pending);
  const outcome = await runTurn(request({ text: "drop 2", pending, userId: "U0ADE" }), t.deps);

  assert.equal(outcome.disposition, "staged");
  const left = outcome.staged!.proposal.operations!.map((op) => (op.input.replace as Array<{ content: string }>)[0]!.content);
  assert.deepEqual(left, ["Launch: November", "Scope: tutors and students"]);
});

test("the card \"drop 2\" revises to is a carousel of the fixes left, renumbered", async () => {
  const { staged } = await postedCard();
  const t = harness();
  const pending = { ...staged, channel: CHANNEL, threadTs: CONVERSATION, replyTs: CONVERSATION };
  await t.threadState.putProposal(pending);
  const outcome = await runTurn(request({ text: "drop 2", pending, userId: "U0ADE" }), t.deps);

  assert.equal(outcome.disposition, "staged");
  const rendered = renderProposalCard(outcome.staged!.card);
  const blocks = rendered.blocks as Block[];
  assert.equal(messageBlocksRefusal(blocks), null);
  const carousel = blocks.find((b) => b.type === "carousel");
  assert.ok(carousel, "the revision is a carousel again");
  const cards = carousel.elements as Block[];
  assert.deepEqual(
    cards.map((c) => plainOf(c.title)),
    ["1. Reflection PRD", "2. Reflection PRD"],
  );
  assert.match(plainOf(cards[0]!.body), /→ “Launch: November”/);
  assert.match(plainOf(cards[1]!.body), /→ “Scope: tutors and students”/, "the third fix is now the second");
  assert.match(plainOf(cards[1]!.subtitle), /<@U0ADE>/, "its owner rides with it");

  // The folded words are renumbered too, so `drop 2` on the revision names
  // the card that reads 2.
  const folded = (blocks.find((b) => b.type === "container")!.child_blocks as Block[]).map((b) => String(b.text?.text ?? ""));
  assert.equal(folded.length, 2);
  assert.match(folded[0]!, /^1\. /);
  assert.match(folded[1]!, /^2\. .*\n[\s\S]*Scope: tutors only/);
  assert.doesNotMatch(JSON.stringify(blocks), /Owner: Bea/, "the dropped fix is gone");
  assert.doesNotMatch(JSON.stringify(blocks), /all 3/, "no count from the card it revises");
  assert.match(rendered.text, /End-of-day sweep/, "the text copy still opens with the sweep's mark");

  // A second drop on the revision still shows what is left as a card: one
  // fix stands alone, as on any one-fix sweep card.
  const revised = outcome.staged!.proposal;
  await t.threadState.putProposal(revised);
  const again = await runTurn(request({ text: "drop 1", pending: revised, userId: "U0ADE" }), t.deps);
  const left = (renderProposalCard(again.staged!.card).blocks as Block[]).filter((b) => b.type === "card");
  assert.equal(left.length, 1);
  assert.match(plainOf(left[0]!.title), /^1\. Reflection PRD$/);
  assert.match(plainOf(left[0]!.body), /Scope: tutors and students/);
});

test("the text copy opens with the sweep's mark, so an untagged post is still a sweep card", async () => {
  const { post } = await postedCard();
  assert.match(post.text, /End-of-day sweep/);
  assert.equal(isSweepCardPost({ text: post.text }), true, "read without its metadata");
  // The text copy is still the whole card: every fix, beside its owner.
  for (const fix of FIXES) assert.match(post.text, new RegExp(fix));
});
