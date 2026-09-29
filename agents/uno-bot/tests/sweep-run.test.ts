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
import { MAX_ITEMS_PER_CARD, MAX_REPLY_PAGES, runSweepJob, SWEEP_CARD_TTL_MS } from "../src/sweep/index";
import { recordSweepResolution } from "../src/sweep/outcomes";
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

/** A page of `n` one-line blocks, and a night that finds a fix in each. */
function manyEdits(id: string, n: number) {
  const blocks = Array.from({ length: n }, (_, i) => ({
    id: `blk-${String(i).padStart(2, "0")}`,
    lastEditedTime: "2026-09-01T10:00:00.000Z",
    text: `Line ${i}`,
  }));
  const page = notionPage(id.repeat(32).slice(0, 32), { blocks });
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [page.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const found = reply(...blocks.map((b) => drift({ source: page, block: b.id, evidence: [ts(29, 16)], replacement: `${b.text} (fixed)` })));
  return { page, t, found };
}

test("12 edits make one card of ten in the thread, and the other two wait for it to resolve", async () => {
  const { page, t, found } = manyEdits("c", 12);
  const h = sweepHarness({ channels: channelOf(t), sources: [page], detectorReplies: [found], now: at(29, 22) });

  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  const morning = await runSweepJob(MORNING, h.deps);

  assert.deepEqual(h.posted.map((p) => p.threadTs), [t.root.ts], "one live card per thread");
  assert.equal(h.staged[0]!.operations!.length, MAX_ITEMS_PER_CARD);
  assert.equal((await h.store.pendingFindings()).length, 2, "the overflow waits in the queue");
  assert.match(morning.note ?? "", /2 fix\(es\) wait/);

  // The next morning the card is still live: nothing more goes up.
  h.clock.now = at(31, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);

  // Once it is resolved, the two that waited go out on the next card.
  await recordSweepResolution(h.store, h.staged[0]!, undefined, at(31, 15));
  h.clock.now = at(32, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 2);
  assert.equal(h.staged[1]!.operations!.length, 2);
  assert.deepEqual(await h.store.pendingFindings(), []);
});

test("a card that lapsed unanswered frees its thread for the fixes that waited", async () => {
  const { page, t, found } = manyEdits("d", 12);
  const h = sweepHarness({ channels: channelOf(t), sources: [page], detectorReplies: [found], now: at(29, 22) });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  h.clock.now = at(30, 14) + SWEEP_CARD_TTL_MS + 60_000;
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 2);
  assert.equal(h.staged[1]!.operations!.length, 2);
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

test("a fix a thread already had carded is not proposed again, and a new day's fix waits for the live card", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const first = reply(drift({ source: PAGE_A, block: PAGE_A.blocks[0]!.id, evidence: [ts(29, 16)], claimedBy: "U0ADE" }));
  const h = sweepHarness({ channels: channelOf(t), sources: [PAGE_A], detectorReplies: [first], now: at(29, 22) });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  const dayOne = h.staged[0]!;

  // Wednesday: a reply is new activity, so the night re-reads the thread; the
  // detector finds the same drift again, and a new one.
  const reply2 = msg("U0ADE", ts(30, 16), "and the owner changed too", { thread_ts: t.root.ts });
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

  assert.equal(h.staged.length, 1, "day one's card is still live, so the new fix waits");
  assert.equal((await h.threadState.getProposalByTs(dayOne.proposalTs)).state, "found");
  assert.deepEqual(
    (await h.store.pendingFindings()).map((f) => f.blockId),
    [PAGE_A.blocks[1]!.id],
    "the repeat left the queue; the new fix stays in it",
  );

  // Day one's card is confirmed; the next morning the new fix goes out alone.
  await recordSweepResolution(h.store, dayOne, [{ ok: true, toolName: "notion_update", input: dayOne.operations![0]!.input, result: "{}" }] as never, at(31, 15));
  h.clock.now = at(32, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.staged.length, 2);
  assert.deepEqual(
    h.staged[1]!.operations!.map((op) => (op.input.replace as Array<{ block_id: string }>)[0]!.block_id),
    [PAGE_A.blocks[1]!.id],
  );
  assert.deepEqual(await h.store.pendingFindings(), []);
});

test("a stop while a card's items are recorded ends, on the retry, in exactly one stageable card", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);

  h.faults.addItems = new SubrequestBudgetError(40);
  h.clock.now = at(30, 14);
  await assert.rejects(runSweepJob(MORNING, h.deps), isSubrequestBudgetError);
  assert.equal(h.posted.length, 0, "nothing posts before its items are recorded");

  h.clock.now = at(30, 14, 2);
  await runSweepJob(MORNING, h.deps);
  await assertOneStagedCard(h);
});

test("a stop after the post, before it is staged, is finished by the retry — not posted again", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);

  h.faults.post = new SubrequestBudgetError(38);
  h.clock.now = at(30, 14);
  await assert.rejects(runSweepJob(MORNING, h.deps), isSubrequestBudgetError);
  assert.equal(h.posted.length, 1);
  assert.equal(h.staged.length, 0);

  h.clock.now = at(30, 14, 2);
  const retry = await runSweepJob(MORNING, h.deps);
  assert.match(retry.note ?? "", /finished staging/);
  await assertOneStagedCard(h);
});

test("a stop in stage is finished by the retry, and a stage that fails outright withdraws the card", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const found = reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" }));
  const h = sweepHarness({ channels: channelOf(t), sources: [PAGE_A], detectorReplies: [found], now: at(29, 22) });
  await runSweepJob(END_OF_DAY, h.deps);

  h.faults.stage = new SubrequestBudgetError(38);
  h.clock.now = at(30, 14);
  await assert.rejects(runSweepJob(MORNING, h.deps), isSubrequestBudgetError);
  h.clock.now = at(30, 14, 2);
  await runSweepJob(MORNING, h.deps);
  await assertOneStagedCard(h);

  // Another thread, whose staging fails for good: the card says so, and its
  // fix stays queued with no item stuck at `proposed`.
  const other = sweepHarness({ channels: channelOf(t), sources: [PAGE_A], detectorReplies: [found], now: at(29, 22) });
  await runSweepJob(END_OF_DAY, other.deps);
  other.faults.stage = new Error("ThreadState unavailable");
  other.clock.now = at(30, 14);
  const morning = await runSweepJob(MORNING, other.deps);
  assert.equal(other.posted.length, 1);
  assert.match(other.posted[0]!.withdrawn ?? "", /didn't go through/);
  assert.match(morning.note ?? "", /withdrawn/);
  assert.deepEqual(other.store.items(), [], "its items are released");
  assert.equal((await other.store.pendingFindings()).length, 1, "and its fix stays queued");

  // A later try that stops after recording its items is never finished onto
  // the withdrawn card: that card was retagged.
  other.faults.post = new SubrequestBudgetError(38);
  other.clock.now = at(30, 14, 5);
  await assert.rejects(runSweepJob(MORNING, other.deps), isSubrequestBudgetError);
  other.clock.now = at(30, 14, 7);
  await runSweepJob(MORNING, other.deps);
  assert.equal(other.staged.length, 1);
  assert.notEqual(other.staged[0]!.proposalTs, other.posted[0]!.ts, "the withdrawn card is not the one staged");
});

test("a card whose budget is not there is not started: the job defers before posting", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);

  h.headroom.subrequests = 2;
  h.clock.now = at(30, 14);
  await assert.rejects(runSweepJob(MORNING, h.deps), isSubrequestBudgetError);
  assert.equal(h.posted.length, 0);
  assert.deepEqual(h.store.items(), []);
  assert.equal(h.store.runs().at(-1)?.outcome, "deferred");

  h.headroom.subrequests = Infinity;
  h.clock.now = at(30, 14, 2);
  await runSweepJob(MORNING, h.deps);
  await assertOneStagedCard(h);
});

/** Exactly one card posted and staged, every item on it, none left without a ts. */
async function assertOneStagedCard(h: ReturnType<typeof sweepHarness>): Promise<void> {
  assert.equal(h.posted.length, 1, "posted once");
  assert.equal(h.posted[0]!.withdrawn, undefined);
  const card = h.posted[0]!;
  assert.equal((await h.threadState.getProposalByTs(card.ts)).state, "found", "and stageable");
  assert.ok(h.store.items().length > 0);
  assert.ok(
    h.store.items().every((i) => i.proposalTs === card.ts && i.postedAt !== null),
    "no item stuck without its card's ts",
  );
  assert.deepEqual(await h.store.pendingFindings(), []);
}

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

test("a history that runs past its page cap never moves the cursor past the oldest root it read", async () => {
  // Newest first, as Slack pages them: 12 roots, 2 a page, 5 pages read.
  const roots = Array.from({ length: 12 }, (_, i) => msg("U0STARTER", ts(29, 8, i), "morning")).reverse();
  const h = sweepHarness({ channels: { [DESIGN]: { kind: "public", history: roots } }, now: at(29, 22), pageSize: 2 });

  const night = await runSweepJob(END_OF_DAY, h.deps);
  const oldestRead = roots[9]!.ts;
  assert.equal(await h.store.cursor(DESIGN), oldestRead);
  assert.match(night.note ?? "", /cursor stays at or before/);
});

test("a long thread is read page by page, and one past the page cap is left with a note", async () => {
  const replies = Array.from({ length: 5 }, (_, i) => ({ user: "U0ADE", when: ts(29, 16, i) }));
  const long = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, replies);
  const h = sweepHarness({
    channels: channelOf(long),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16, 4)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
    pageSize: 2,
  });
  const night = await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(h.reads.filter((r) => r.startsWith("replies")).length, 3, "three pages of two");
  assert.equal(night.findings.length, 1, "evidence on the last page counts");

  const tooLong = thread(
    { user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] },
    Array.from({ length: MAX_REPLY_PAGES * 2 + 1 }, (_, i) => ({ user: "U0ADE", when: ts(29, 16, i) })),
  );
  const h2 = sweepHarness({ channels: channelOf(tooLong), sources: [PAGE_A], now: at(29, 22), pageSize: 2 });
  const skipped = await runSweepJob(END_OF_DAY, h2.deps);
  assert.equal(h2.provider.generated.length, 0, "never detected on half a thread");
  assert.match(skipped.note ?? "", /left unread/);
});

test("a thread whose page keeps failing holds the cursor one night, and is skipped the next", async () => {
  const bad = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_B.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const good = thread({ user: "U0STARTER", when: ts(29, 17), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 18) }]);
  const h = sweepHarness({
    channels: channelOf(bad, good),
    sources: [PAGE_A, PAGE_B],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 18)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });
  h.broken.add(PAGE_B.url);
  const swept = ts(29, 0);
  await h.store.saveCursor(DESIGN, swept, 0);

  const first = await runSweepJob(END_OF_DAY, h.deps);
  assert.match(first.note ?? "", /a linked page could not be read/);
  assert.equal(await h.store.cursor(DESIGN), swept, "held: nothing past the failing thread is swept");
  assert.equal(h.provider.generated.length, 0);

  // A retry the same night adds no night.
  h.clock.now = at(29, 22, 5);
  await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(await h.store.cursor(DESIGN), swept);

  h.clock.now = at(30, 22);
  const second = await runSweepJob(END_OF_DAY, h.deps);
  assert.match(second.note ?? "", /skipped after 2 failed nights/);
  assert.equal(await h.store.cursor(DESIGN), good.root.latest_reply, "the cursor moved past it");
  assert.equal(second.findings.length, 1, "the thread after it is swept");
});

test("a model quota stop holds the cursor every night without counting toward a skip", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: ["FAIL: 429 quota exceeded", "FAIL: 429 quota exceeded", "FAIL: 429 quota exceeded"],
    now: at(29, 22),
  });
  await h.store.saveCursor(DESIGN, ts(29, 0), 0);
  for (const day of [29, 30, 31]) {
    h.clock.now = at(day, 22);
    const report = await runSweepJob(END_OF_DAY, h.deps);
    assert.match(report.note ?? "", /429/);
    assert.doesNotMatch(report.note ?? "", /skipped/);
  }
  assert.equal(await h.store.cursor(DESIGN), ts(29, 0));
});

test("a thread too long for the detector's budget is shown root first and newest replies, with a note", async () => {
  const long = "We went back and forth on the launch date. ".repeat(28);
  const replies = Array.from({ length: 30 }, (_, i) => ({ user: "U0ADE", when: ts(29, 16, i), text: `${long} (${i})` }));
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, replies);
  const h = sweepHarness({
    channels: channelOf(t),
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16, 29)], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });
  const night = await runSweepJob(END_OF_DAY, h.deps);
  const prompt = h.provider.generated[0]!.prompt;
  assert.ok(prompt.includes(t.root.ts), "the root stays");
  assert.ok(prompt.includes(ts(29, 16, 29)), "the newest reply is shown");
  assert.ok(!prompt.includes(ts(29, 16, 0)), "the oldest reply is left out");
  assert.match(night.note ?? "", /oldest repl\(ies\) left out/);
  assert.equal(night.findings.length, 1);
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
