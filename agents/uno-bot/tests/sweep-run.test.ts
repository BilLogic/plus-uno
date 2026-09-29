// `runSweepJob` — whole sweep days, in memory.
//
// In-memory Slack reads, recorded detector replies through the real detector,
// the in-memory sweep store, and the real card renderer. Each case asserts
// what a person would see — the cards posted, where, and whom they mention —
// and the rows the store keeps.
import { test } from "node:test";
import assert from "node:assert/strict";

import { isSubrequestBudgetError, SubrequestBudgetError } from "../src/net";
import type { ScheduledJob } from "../src/scheduled/runs";
import { MAX_ITEMS_PER_CARD, runSweepJob, SWEEP_CARD_TTL_MS } from "../src/sweep/index";
import {
  at,
  DESIGN,
  drift,
  msg,
  notionPage,
  reply,
  sweepHarness,
  ts,
  UNO_BOT,
  type FakeChannel,
} from "./helpers/sweep-harness";

const END_OF_DAY: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const MORNING: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };

const PAGE_A = notionPage("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", { contributors: ["Cy Contributor"] });
const PAGE_B = notionPage("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");

/** A thread: a root that links `pages`, then replies. */
function thread(root: { user: string; when: string; pages: string[] }, replies: Array<{ user: string; when: string; text?: string }>) {
  const rootMsg = msg(root.user, root.when, `Update on this: ${root.pages.map((u) => `<${u}|page>`).join(" ")}`, {
    ...(replies.length ? { reply_count: replies.length, latest_reply: replies[replies.length - 1]!.when } : {}),
  });
  const all = [rootMsg, ...replies.map((r) => msg(r.user, r.when, r.text ?? "Agreed — Nov 1.", { thread_ts: root.when }))];
  return { root: rootMsg, messages: all };
}

function channelOf(...threads: ReturnType<typeof thread>[]): Record<string, FakeChannel> {
  return {
    [DESIGN]: {
      kind: "public",
      history: threads.map((t) => t.root),
      threads: Object.fromEntries(threads.map((t) => [t.root.ts, t.messages])),
    },
  };
}

test("a quiet day stages nothing", async () => {
  const quiet = thread({ user: "U0STARTER", when: ts(29, 15), pages: [] }, [{ user: "U0ADE", when: ts(29, 16), text: "lunch?" }]);
  const h = sweepHarness({ channels: channelOf(quiet), now: at(29, 22) });

  const night = await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  const morning = await runSweepJob(MORNING, h.deps);

  assert.equal(night.findings.length, 0);
  assert.equal(h.provider.generated.length, 0, "a thread with no Notion link costs no model call");
  assert.equal(morning.summary, "nothing due this morning");
  assert.deepEqual(h.posted, []);
  assert.deepEqual(h.staged, []);
  assert.deepEqual(
    h.store.runs().map((r) => [r.runName, r.jobKey, r.items, r.outcome]),
    [
      ["end-of-day", END_OF_DAY.key, 0, "handled"],
      ["morning", "sweep-post", 0, "handled"],
    ],
  );
});

test("two drifts from two owners in one thread make one card, in that thread, with two mentions", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [
    { user: "U0ADE", when: ts(29, 16) },
    { user: "U0BEA", when: ts(29, 17) },
  ]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [
      reply(
        drift({ source: PAGE_A, block: PAGE_A.blocks[0]!.id, evidence: [ts(29, 16)], claimedBy: "U0ADE" }),
        drift({ source: PAGE_A, block: PAGE_A.blocks[1]!.id, evidence: [ts(29, 17)], claimedBy: "U0BEA", replacement: "Owner: Bea" }),
      ),
    ],
    now: at(29, 22),
  });

  await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(h.posted.length, 0, "the end of day posts nothing");
  h.clock.now = at(30, 14);
  const morning = await runSweepJob(MORNING, h.deps);

  assert.equal(h.posted.length, 1);
  const [card] = h.posted;
  assert.equal(card!.channel, DESIGN);
  assert.equal(card!.threadTs, t.root.ts, "in the thread the evidence is in");
  assert.match(card!.text, /<@U0ADE>/);
  assert.match(card!.text, /<@U0BEA>/);
  assert.doesNotMatch(card!.text, /<@U0STARTER>/, "only owners are mentioned");

  const [staged] = h.staged;
  assert.equal(staged!.operations!.length, 2);
  assert.ok(staged!.operations!.every((op) => op.toolName === "notion_update"));
  assert.deepEqual((staged!.operations![0]!.input.replace as unknown[])[0], {
    block_id: PAGE_A.blocks[0]!.id,
    last_edited_time: PAGE_A.blocks[0]!.lastEditedTime,
    content: "Launch date: November 1",
  });
  assert.deepEqual(staged!.confirmers, ["U0ADE", "U0BEA", "U0STARTER"], "owners plus everyone who posted");
  assert.equal(staged!.ttlMs, SWEEP_CARD_TTL_MS);
  assert.equal(staged!.sweepRun, "2026-09-30");
  assert.equal(staged!.replyTs, t.root.ts);
  assert.deepEqual(
    h.store.items().map((i) => [i.blockId, i.ownerId, i.status, i.proposalTs]),
    [
      [PAGE_A.blocks[0]!.id, "U0ADE", "proposed", staged!.proposalTs],
      [PAGE_A.blocks[1]!.id, "U0BEA", "proposed", staged!.proposalTs],
    ],
  );
  assert.equal(morning.cards.length, 1);
  assert.deepEqual(await h.store.pendingFindings(), [], "a posted finding leaves the queue");
});

test("drifts in two threads make two cards, one per thread, and nothing goes to #uno-bot", async () => {
  const one = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const two = thread({ user: "U0BEA", when: ts(29, 17), pages: [PAGE_B.url] }, [{ user: "U0CY", when: ts(29, 18) }]);
  const h = sweepHarness({
    channels: channelOf(one, two),
    sources: [PAGE_A, PAGE_B],
    detectorReplies: [
      reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" })),
      reply(drift({ source: PAGE_B, evidence: [ts(29, 18)], claimedBy: "U0CY" })),
    ],
    now: at(29, 22),
  });

  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.deepEqual(
    h.posted.map((p) => [p.channel, p.threadTs]),
    [
      [DESIGN, one.root.ts],
      [DESIGN, two.root.ts],
    ],
  );
  assert.ok(h.posted.every((p) => p.channel !== UNO_BOT));
  assert.equal(h.staged.length, 2);
});

test("findings detected at 22:00 are posted at the next weekday 14:00 run, not before", async () => {
  // Friday 2026-10-02.
  const t = thread({ user: "U0STARTER", when: ts(32, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(32, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(32, 16)], claimedBy: "U0ADE" }))],
    now: at(32, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);

  for (const when of [at(32, 22, 30), at(33, 14), at(34, 14), at(35, 13, 59)]) {
    h.clock.now = when;
    await runSweepJob(MORNING, h.deps);
    assert.deepEqual(h.posted, [], new Date(when).toISOString());
  }
  h.clock.now = at(35, 14); // Monday
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);
});

test("12 edits make two cards in one thread, both live", async () => {
  const blocks = Array.from({ length: 12 }, (_, i) => ({
    id: `blk-${String(i).padStart(2, "0")}`,
    lastEditedTime: "2026-09-01T10:00:00.000Z",
    text: `Line ${i}`,
  }));
  const page = notionPage("cccccccccccccccccccccccccccccccc", { blocks });
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [page.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [page],
    detectorReplies: [
      reply(...blocks.map((b) => drift({ source: page, block: b.id, evidence: [ts(29, 16)], replacement: `${b.text} (fixed)` }))),
    ],
    now: at(29, 22),
  });

  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.deepEqual(h.posted.map((p) => p.threadTs), [t.root.ts, t.root.ts]);
  assert.deepEqual(h.staged.map((s) => s.operations!.length), [MAX_ITEMS_PER_CARD, 2]);
  assert.deepEqual(h.staged.map((s) => s.slot), [0, 1]);
  for (const s of h.staged) assert.equal((await h.threadState.getProposalByTs(s.proposalTs)).state, "found");
});

test("owner routing falls through all three rungs", async () => {
  // Thread one links a doc and the Roadmap card beside it; thread two links a
  // doc alone.
  const doc = notionPage("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  const one = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url, doc.url] }, [
    { user: "U0ADE", when: ts(29, 16) },
  ]);
  const two = thread({ user: "U0SAM", when: ts(29, 17), pages: [PAGE_B.url] }, [{ user: "U0ADE", when: ts(29, 18) }]);
  const h = sweepHarness({
    channels: channelOf(one, two),
    sources: [PAGE_A, PAGE_B, doc],
    people: { "Cy Contributor": "U0CY" },
    detectorReplies: [
      reply(
        // claimed in the thread
        drift({ source: PAGE_A, block: PAGE_A.blocks[0]!.id, evidence: [ts(29, 16)], claimedBy: "U0ADE" }),
        // claimed by someone who never posted → the card's Contributor
        drift({ source: PAGE_A, block: PAGE_A.blocks[1]!.id, evidence: [ts(29, 16)], claimedBy: "U0STRANGER" }),
        // on the doc, unclaimed → the Contributor of the card linked beside it
        drift({ source: doc, block: doc.blocks[0]!.id, evidence: [ts(29, 16)] }),
      ),
      // no claim, no card anywhere in the thread → the thread starter
      reply(drift({ source: PAGE_B, block: PAGE_B.blocks[0]!.id, evidence: [ts(29, 18)] })),
    ],
    now: at(29, 22),
  });

  const night = await runSweepJob(END_OF_DAY, h.deps);
  assert.deepEqual(
    night.findings.map((f) => [f.blockId, f.owner]),
    [
      [PAGE_A.blocks[0]!.id, "U0ADE"],
      [PAGE_A.blocks[1]!.id, "U0CY"],
      [doc.blocks[0]!.id, "U0CY"],
      [PAGE_B.blocks[0]!.id, "U0SAM"],
    ],
  );
});

test("a fix a thread already had carded is not proposed again, and a new day's card takes the next slot", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const first = reply(drift({ source: PAGE_A, block: PAGE_A.blocks[0]!.id, evidence: [ts(29, 16)], claimedBy: "U0ADE" }));
  const h = sweepHarness({ channels: channelOf(t), sources: [PAGE_A], detectorReplies: [first], now: at(29, 22) });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  const dayOne = h.staged[0]!;

  // Wednesday: a reply ("drop 1") is new activity, so the night re-reads the
  // thread; the detector finds the same drift again, and a new one.
  const reply2 = msg("U0ADE", ts(30, 16), "drop 1", { thread_ts: t.root.ts });
  t.messages.push(reply2);
  t.root.reply_count = 2;
  t.root.latest_reply = reply2.ts;
  h.replies.push(
    reply(
      drift({ source: PAGE_A, block: PAGE_A.blocks[0]!.id, evidence: [ts(29, 16)], claimedBy: "U0ADE" }),
      drift({ source: PAGE_A, block: PAGE_A.blocks[1]!.id, evidence: [ts(30, 16)], claimedBy: "U0ADE", replacement: "Owner: Ade" }),
    ),
  );
  h.clock.now = at(30, 22);
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(31, 14);
  await runSweepJob(MORNING, h.deps);

  assert.equal(h.staged.length, 2);
  const dayTwo = h.staged[1]!;
  assert.deepEqual(
    dayTwo.operations!.map((op) => (op.input.replace as Array<{ block_id: string }>)[0]!.block_id),
    [PAGE_A.blocks[1]!.id],
    "only the new fix",
  );
  assert.equal(dayTwo.slot, 1);
  assert.equal((await h.threadState.getProposalByTs(dayOne.proposalTs)).state, "found", "day one's card is still live");
  assert.deepEqual(await h.store.pendingFindings(), []);
});

test("a morning stopped mid-thread posts the rest on its retry, and nothing twice", async () => {
  const blocks = Array.from({ length: 12 }, (_, i) => ({
    id: `blk-${String(i).padStart(2, "0")}`,
    lastEditedTime: "2026-09-01T10:00:00.000Z",
    text: `Line ${i}`,
  }));
  const page = notionPage("ffffffffffffffffffffffffffffffff", { blocks });
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [page.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [page],
    detectorReplies: [reply(...blocks.map((b) => drift({ source: page, block: b.id, evidence: [ts(29, 16)], replacement: `${b.text}!` })))],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);

  // The budget stops the job as the second card goes out.
  const post = h.deps.delivery.post;
  let posts = 0;
  h.deps.delivery.post = async (to, card) => {
    posts += 1;
    if (posts === 2) throw new SubrequestBudgetError(38);
    return post(to, card);
  };
  h.clock.now = at(30, 14);
  await assert.rejects(runSweepJob(MORNING, h.deps), isSubrequestBudgetError);
  assert.equal(h.store.runs().at(-1)?.outcome, "deferred");

  h.clock.now = at(30, 14, 2);
  await runSweepJob(MORNING, h.deps);
  assert.deepEqual(h.staged.map((s) => s.operations!.length), [MAX_ITEMS_PER_CARD, 2]);
  assert.deepEqual(h.staged.map((s) => s.slot), [0, 1]);
  assert.equal(h.store.items().length, 12);
  assert.deepEqual(await h.store.pendingFindings(), []);
});

test("a retried job is idempotent", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });

  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(29, 22, 2);
  const again = await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(again.threads, 0, "the cursor skips what is done");
  assert.equal(h.provider.generated.length, 1);
  assert.equal((await h.store.pendingFindings()).length, 1);

  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  h.clock.now = at(30, 14, 2);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);
  assert.equal(h.store.items().length, 1);
  assert.equal(h.store.runs().filter((r) => r.jobKey === END_OF_DAY.key).length, 1, "one row per run date and key");
});

test("on budget exhaustion the job saves its cursor at the last fully processed thread and defers with its key", async () => {
  const threads = [15, 16, 17].map((hh) =>
    thread({ user: "U0STARTER", when: ts(29, hh), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, hh, 30) }]),
  );
  const h = sweepHarness({
    channels: channelOf(...threads),
    sources: [PAGE_A],
    detectorReplies: [0, 1, 2].map((i) =>
      reply(drift({ source: PAGE_A, block: PAGE_A.blocks[i % 2]!.id, evidence: [ts(29, 15 + i, 30)] })),
    ),
    now: at(29, 22),
  });
  h.budget.replies = 2;

  await assert.rejects(runSweepJob(END_OF_DAY, h.deps), isSubrequestBudgetError);
  assert.equal(await h.store.cursor(DESIGN), ts(29, 16, 30), "saved at the second thread's last reply");
  const [run] = h.store.runs();
  assert.equal(run!.outcome, "deferred");
  assert.match(run!.note ?? "", new RegExp(END_OF_DAY.key));
  assert.equal((await h.store.pendingFindings()).length, 2);

  // The runner runs it again on a fresh budget: only the third thread is read.
  h.budget.replies = Infinity;
  h.reads.length = 0;
  h.clock.now = at(29, 22, 2);
  const retried = await runSweepJob(END_OF_DAY, h.deps);
  assert.deepEqual(h.reads.filter((r) => r.startsWith("replies")), [`replies ${DESIGN} ${threads[2]!.root.ts}`]);
  assert.equal(retried.outcome, "handled");
  assert.equal(h.store.runs().length, 1, "the retry rewrote its own row");
});

test("a private channel is skipped, a DM is never read, and #uno-bot is never swept", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, []);
  const h = sweepHarness({
    channels: {
      G0PRIVATE: { kind: "private", history: [t.root] },
      D0DM: { kind: "dm", history: [t.root] },
      G0MPIM: { kind: "group-dm", history: [t.root] },
      [UNO_BOT]: { kind: "public", history: [t.root] },
    },
    sources: [PAGE_A],
    now: at(29, 22),
  });
  for (const channel of ["G0PRIVATE", "D0DM", "G0MPIM", UNO_BOT]) {
    const report = await runSweepJob({ key: `sweep:${channel}`, kind: "sweep-channel", channel }, h.deps);
    assert.equal(report.outcome, "skipped", channel);
  }
  assert.ok(h.reads.every((r) => r.startsWith("info")), `only the kind was asked: ${h.reads.join(", ")}`);
  assert.ok(!h.reads.includes(`info ${UNO_BOT}`), "#uno-bot is refused before any read");
});

test("a dry run returns the findings and the card text, and writes and posts nothing", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const found = reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" }));
  const h = sweepHarness({ channels: channelOf(t), sources: [PAGE_A], detectorReplies: [found, found], now: at(29, 22), dryRun: true });

  const night = await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(night.findings.length, 1);
  assert.equal(night.cards.length, 1);
  assert.match(night.cards[0]!.text, /<@U0ADE>/);
  assert.match(night.cards[0]!.text, /Launch date: November 1/);
  assert.equal(await h.store.cursor(DESIGN), null);
  assert.deepEqual(await h.store.pendingFindings(), []);
  assert.deepEqual(h.store.runs(), []);

  // The morning rehearsed over a real night's queue: text, and no post.
  const real = sweepHarness({ channels: channelOf(t), sources: [PAGE_A], detectorReplies: [found], now: at(29, 22) });
  await runSweepJob(END_OF_DAY, real.deps);
  real.clock.now = at(30, 14);
  const morning = await runSweepJob(MORNING, { ...real.deps, dryRun: true });
  assert.equal(morning.cards.length, 1);
  assert.match(morning.cards[0]!.text, /End-of-day sweep/);
  assert.deepEqual(real.posted, []);
  assert.deepEqual(real.staged, []);
  assert.equal((await real.store.pendingFindings()).length, 1, "the queue is untouched");
});
