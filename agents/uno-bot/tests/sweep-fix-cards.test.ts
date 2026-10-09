// The end-of-day sweep report as Slack shows it: a plain parent line, then
// one card per fix — a carousel when there are several — each with Review on
// its own proposal and Open page. No folded box, no ✅/`drop N` copy. A DM
// capture card, which still renders through the sweep's old carousel, is
// pinned at the end.
//
// The report is posted by a real night and morning (`sweep-harness.ts`), and
// every message's blocks are held to what Slack refuses
// (`slack-block-rules.ts`).
import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob, type SweepSource } from "../src/sweep/index";
import type { PendingProposal } from "../src/thread-state/index";
import { dmCaptureCard } from "../src/dm-watch/capture";
import { renderProposalCard } from "../src/slack/proposal-render";
import type { GateVerdict } from "../src/gate/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { recordingViews } from "./helpers/recording-slack";
import { at, DESIGN, drift, msg, notionPage, reply, sweepHarness, ts } from "./helpers/sweep-harness";

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
async function postedCard(opts: { cardsRefused?: boolean } = {}) {
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
  h.cardsRefused.on = opts.cardsRefused === true;
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);
  return { h, post: h.posted[0]! };
}

const plainOf = (text: unknown): string => String((text as Block | undefined)?.text ?? "");
const GATE_WORDS = /✅|⛔|:white_check_mark:|:no_entry:|\bdrop \d|\bskip\b|End-of-day sweep/;

test("three fixes post as a parent line and three cards in a carousel, each with Review and Open page", async () => {
  const { post } = await postedCard();
  const blocks = post.blocks as Block[];
  assert.equal(messageBlocksRefusal(blocks), null);
  assert.equal(blocks.length, 2, "the parent line, then the carousel: nothing else");
  assert.equal(blocks[0]!.type, "section");
  assert.match(String(blocks[0]!.text.text), /^\*Reflection PRD\* still states 3 things its thread changed\.$/);

  const carousel = blocks[1]!;
  assert.equal(carousel.type, "carousel");
  const cards = carousel.elements as Block[];
  assert.equal(cards.length, 3);
  cards.forEach((card, i) => {
    assert.equal(plainOf(card.title), "Reflection PRD", "the page names the card, with no number");
    assert.match(plainOf(card.body), /^Page says “.*” · decision says “.*”$/);
    assert.deepEqual(card.actions.map((a: Block) => a.text.text), ["Review", "Open page"]);
    assert.equal(card.actions[0].action_id, `uno_decision_review:${PAGE.blocks[i]!.id}`);
    assert.equal(card.actions[1].url, PAGE.url, "Open goes to the page");
    assert.match(card.icon.image_url, /notion/, "the Notion logo");
  });
  assert.equal(plainOf(cards[0]!.subtitle), "<@U0ADE> · from this thread", "who and where");
  assert.equal(plainOf(cards[1]!.subtitle), "<@U0BEA> · from this thread");

  assert.equal(blocks.some((b) => b.type === "container" || b.type === "actions"), false, "no folded box, no card-wide button");
  assert.doesNotMatch(JSON.stringify(blocks), GATE_WORDS);
  assert.doesNotMatch(post.text, GATE_WORDS);
  assert.doesNotMatch(JSON.stringify(blocks), /Page says \/ thread says/);
});

test("one fix posts as a parent line naming its page, and one card", async () => {
  const history = [msg("U0SAM", ROOT, `PRD: <${PAGE.url}>`, { reply_count: 1, latest_reply: ts(29, 16, 0) })];
  const h = sweepHarness({
    channels: { [DESIGN]: { kind: "public", history, threads: { [ROOT]: [history[0]!, msg("U0ADE", ts(29, 16, 0), "Launch slips to November.")] } } },
    sources: [PAGE],
    detectorReplies: [reply(drift({ source: PAGE, block: "blk-0", evidence: [ts(29, 16, 0)], claimedBy: "U0ADE", replacement: "Launch: November" }))],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  const blocks = h.posted[0]!.blocks as Block[];
  assert.equal(messageBlocksRefusal(blocks), null);
  assert.equal(String(blocks[0]!.text.text), "This thread settled something that *Reflection PRD* still states the old way.");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[1]!.type, "card", "one card stands alone, no carousel");
  assert.equal(plainOf(blocks[1]!.title), "Reflection PRD");
  assert.deepEqual(blocks[1]!.actions.map((a: Block) => a.text.text), ["Review", "Open page"]);
  assert.doesNotMatch(JSON.stringify(blocks), GATE_WORDS);
});

test("each fix is its own proposal: one operation, keyed by the message and its block", async () => {
  const { h, post } = await postedCard();
  assert.equal(h.staged.length, 3);
  h.staged.forEach((p, i) => {
    assert.equal(p.operations!.length, 1);
    assert.equal((p.operations![0]!.input.replace as Array<{ content: string }>)[0]!.content, FIXES[i]);
    assert.deepEqual(p.item, { messageTs: post.ts, id: PAGE.blocks[i]!.id });
    assert.equal(p.proposalTs, `${post.ts}#${PAGE.blocks[i]!.id}`);
    assert.equal(p.ttlMs, 72 * 60 * 60 * 1000);
    // The whole change, which the pop-up shows: the page's words now and what they become.
    assert.match(p.proposalText, new RegExp(`Page says now: ${PAGE.blocks[i]!.text}`));
    assert.match(p.proposalText, new RegExp(`Will say: ${FIXES[i]}`));
    assert.doesNotMatch(p.proposalText, GATE_WORDS);
  });
  for (const p of h.staged) assert.equal((await h.threadState.getProposalByTs(p.proposalTs)).state, "found", "every fix is live at once");
  const record = await h.threadState.getReport(post.ts);
  assert.deepEqual(record?.entries.map((e) => e.id), PAGE.blocks.map((b) => b.id));
});

/** The review door over a harness's store: what ran, and every redraw of a
 *  report's message — its blocks and the metadata sent with them. */
function reviewDoor(h: Awaited<ReturnType<typeof postedCard>>["h"]) {
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const updates: Array<{ ts: string; blocks: unknown[]; metadata?: unknown }> = [];
  const deps: ReviewDoorDeps = {
    threadState: h.threadState,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (v) => {
      ran.push(v);
      return [{ toolName: "notion_update", ok: true, result: "{}", message: "Updated." }];
    },
    updateCard: async (_channel, ts, message) => void updates.push({ ts, blocks: message.blocks, metadata: message.metadata }),
    restage: async () => {},
    revise: async () => {},
    now: () => h.clock.now,
  };
  const decide = (fix: PendingProposal, userId: string, decision: "confirm" | "cancel", note?: string) =>
    runReviewDecision({ viewId: "V1", channel: DESIGN, messageTs: fix.proposalTs, userId, decision, ...(note ? { note } : {}) }, deps);
  return { ran, updates, decide, views };
}

test("where Slack refuses cards, the report posts as sections that each keep their own Review", async () => {
  const { post } = await postedCard({ cardsRefused: true });
  const blocks = post.blocks as Block[];
  assert.equal(messageBlocksRefusal(blocks), null);
  assert.equal(blocks.some((b) => b.type === "card" || b.type === "carousel"), false);
  assert.match(String(blocks[0]!.text.text), /^\*Reflection PRD\* still states 3 things/, "the parent line stays");
  const fixes = blocks.slice(1);
  assert.equal(fixes.length, 3);
  fixes.forEach((b, i) => {
    assert.equal(b.type, "section");
    assert.equal(b.accessory.action_id, `uno_decision_review:${PAGE.blocks[i]!.id}`);
    assert.match(b.text.text, new RegExp(`^\\*<${PAGE.url}\\|Reflection PRD>\\*\\n<@U0`));
  });
});

test("a decision on a report that posted plain redraws it plain", async () => {
  const { h, post } = await postedCard({ cardsRefused: true });
  const door = reviewDoor(h);
  await door.decide(h.staged[1]!, "U0BEA", "confirm");

  const redrawn = door.updates.at(-1)!;
  assert.equal(redrawn.ts, post.ts);
  const blocks = redrawn.blocks as Block[];
  assert.equal(blocks.some((b) => b.type === "card" || b.type === "carousel"), false, "still plain");
  assert.match(blocks[2]!.text.text, /Approved by <@U0BEA> · written /);
  assert.equal(blocks[2]!.accessory.text.text, "View");
  assert.equal(blocks[1]!.accessory.text.text, "Review");
  assert.equal(messageBlocksRefusal(blocks), null);
});

test("every redraw of a report sends its tag again, so a search by its key still finds it", async () => {
  const { h, post } = await postedCard();
  const door = reviewDoor(h);
  await door.decide(h.staged[0]!, "U0ADE", "cancel", "not yet");
  assert.deepEqual(door.updates.at(-1)!.metadata, {
    event_type: "uno_sweep_card",
    event_payload: { card_key: post.cardKey, digest: post.digest, role: "card" },
  });
});

test("Review decides one fix: Approve runs only it, and its card redraws as approved while the others stay open", async () => {
  const { h, post } = await postedCard();
  const door = reviewDoor(h);
  const second = h.staged[1]!;
  await door.decide(second, "U0BEA", "confirm");

  assert.equal(door.ran.length, 1);
  assert.deepEqual(door.ran[0]!.execute?.operations, second.operations, "only that fix runs");
  assert.equal(door.updates.at(-1)!.ts, post.ts, "the report's own message is edited");
  const cards = (door.updates.at(-1)!.blocks as Block[])[1]!.elements as Block[];
  assert.match(cards[1]!.subtitle.text, /^Approved by <@U0BEA> · written /);
  assert.equal(plainOf(cards[1]!.body), `Written: ${FIXES[1]}`);
  assert.deepEqual(cards[0]!.actions.map((a: Block) => a.text.text), ["Review", "Open page"], "the others wait on their own decisions");
  assert.equal(messageBlocksRefusal(door.updates.at(-1)!.blocks as Block[]), null);
});

test("a DM capture card is a carousel of its fixes too, with no owner to name", () => {
  const card = dmCaptureCard([
    {
      target: { url: PAGE.url, title: "Reflection PRD", writable: true, kind: "notion" },
      blockId: "blk-0",
      lastEditedTime: "2026-09-01T10:00:00.000Z",
      original: "Launch: October",
      replacement: "Launch: November",
      sourceSays: "Launch: October",
      permalink: "https://plus.slack.com/archives/D0ME/p1790000000000100",
    },
  ] as unknown as Parameters<typeof dmCaptureCard>[0]);
  const rendered = renderProposalCard(card);
  const blocks = rendered.blocks as Block[];
  assert.equal(messageBlocksRefusal(blocks), null);
  const fix = blocks.find((b) => b.type === "card");
  assert.ok(fix, "one fix stands alone as a card");
  assert.match(plainOf(fix.title), /^1\. Reflection PRD$/);
  assert.equal(fix.subtitle, undefined, "only the owner can confirm, so nobody is named");
  assert.match(rendered.text, /End-of-day sweep/);
});

test("a fix too long for a section posts as the card's text, with no carousel", () => {
  const long = `Launch: ${"November, after the tutor pilot closes and the survey is in. ".repeat(60)}`;
  const card = dmCaptureCard([
    {
      target: { url: PAGE.url, title: "Reflection PRD", writable: true, kind: "notion" },
      blockId: "blk-0",
      lastEditedTime: "2026-09-01T10:00:00.000Z",
      original: "Launch: October",
      replacement: long,
      sourceSays: "Launch: October",
      permalink: "https://plus.slack.com/archives/D0ME/p1790000000000100",
    },
  ] as unknown as Parameters<typeof dmCaptureCard>[0]);
  const rendered = renderProposalCard(card);
  const blocks = (rendered.blocks ?? []) as Block[];
  assert.equal(blocks.some((b) => b.type === "card" || b.type === "carousel"), false);
  assert.match(rendered.text, /after the tutor pilot closes/, "the change is still shown whole");
});
