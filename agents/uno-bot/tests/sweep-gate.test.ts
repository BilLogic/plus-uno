// A sweep card through Gate: who may confirm it, what one ✅ runs, and what
// becomes of each item.
//
// The card is staged by a real morning job into the in-memory ThreadState,
// resolved by `resolveSignal` exactly as a reaction on it would be, and its
// batch run through `runOperations` against a fake Notion that refuses a
// replace whose stamp has moved — the integration's own rule (ADR-029). What
// became of each item is then recorded as the executor records it.
import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveSignal, runOperations, type GateVerdict } from "../src/gate/index";
import { recordProposalEvents, verdictEvents } from "../src/usage/index";
import { countedFetch, runMetered, subrequestsUsed } from "../src/net";
import type { ScheduledJob } from "../src/scheduled/runs";
import {
  recordSweepResolution,
  recordSweepRestage,
  recordSweepRevision,
  runSweepJob,
  type SweepSource,
} from "../src/sweep/index";
import type { PendingProposal, ProposalOperation } from "../src/thread-state/index";
import { at, DESIGN, drift, msg, notionPage, reply, sweepHarness, ts } from "./helpers/sweep-harness";

const END_OF_DAY: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const MORNING: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };
const ROOT = ts(29, 15);

/** A card with `n` fixes on one page, owned alternately by Ade and Bea, in a
 *  thread Sam started — staged by a real night and morning. */
async function stagedCard(n: number, page: SweepSource = pageWith(n)) {
  const history = [msg("U0SAM", ROOT, `PRD: <${page.url}>`, { reply_count: 2, latest_reply: ts(29, 17) })];
  const replies = [msg("U0ADE", ts(29, 16), "I'll take the date."), msg("U0BEA", ts(29, 17), "Owner is me now.")];
  const h = sweepHarness({
    channels: { [DESIGN]: { kind: "public", history, threads: { [ROOT]: [history[0]!, ...replies] } } },
    sources: [page],
    detectorReplies: [
      reply(
        ...page.blocks.slice(0, n).map((b, i) =>
          drift({
            source: page,
            block: b.id,
            evidence: [i % 2 ? ts(29, 17) : ts(29, 16)],
            claimedBy: i % 2 ? "U0BEA" : "U0ADE",
            replacement: `${b.text} (fixed)`,
          }),
        ),
      ),
    ],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.staged.length, 1);
  return { h, card: h.staged[0]! };
}

function pageWith(n: number): SweepSource {
  return notionPage("dddddddddddddddddddddddddddddddd", {
    blocks: Array.from({ length: n }, (_, i) => ({
      id: `blk-${i}`,
      lastEditedTime: "2026-09-01T10:00:00.000Z",
      text: `Line ${i}`,
    })),
  });
}

const react = (card: PendingProposal, userId: string, glyph = "white_check_mark") => ({
  kind: "reaction" as const,
  messageTs: card.proposalTs,
  channel: card.channel,
  thread: ROOT,
  glyph,
  userId,
});

/** A fake Notion page: a replace lands only on the stamp it read, and only on
 *  a block of plain words — the integration's own two refusals. */
function fakeNotion(page: SweepSource) {
  const blocks = new Map(page.blocks.map((b) => [b.id, { stamp: b.lastEditedTime, text: b.text }]));
  const formatted = new Set<string>();
  const execute = async (op: ProposalOperation): Promise<string> => {
    // A stamp read and a write: what a real replace spends.
    await countedFetch("data:text/plain,retrieve");
    const [replace] = op.input.replace as Array<{ block_id: string; last_edited_time: string; content: string }>;
    const block = blocks.get(replace!.block_id)!;
    if (block.stamp !== replace!.last_edited_time) {
      return JSON.stringify({
        ok: false,
        status: "no_changes",
        replaced: 0,
        refused: [`${replace!.block_id} moved since it was read`],
        staleStamps: 1,
      });
    }
    if (formatted.has(replace!.block_id)) {
      return JSON.stringify({
        ok: false,
        status: "no_changes",
        replaced: 0,
        refused: [`${replace!.block_id} (this block has links, mentions or formatting that a text replace would drop)`],
        staleStamps: 0,
      });
    }
    await countedFetch("data:text/plain,update");
    blocks.set(replace!.block_id, { stamp: "2026-09-30T14:05:00.000Z", text: replace!.content });
    return JSON.stringify({ ok: true, status: "updated", replaced: 1, refused: [] });
  };
  return { blocks, formatted, execute };
}

test("a ✅ from someone neither an owner nor in the thread executes nothing", async () => {
  const { h, card } = await stagedCard(2);
  const verdict = await resolveSignal(react(card, "U0BYSTANDER"), { threadState: h.threadState });
  assert.equal(verdict.outcome, "none");
  assert.equal(verdict.execute, undefined);
  assert.deepEqual(verdict.post?.note, {
    kind: "not-a-confirmer",
    confirmers: ["U0ADE", "U0BEA", "U0SAM"],
    userId: "U0BYSTANDER",
  });
  assert.equal((await h.threadState.getProposalByTs(card.proposalTs)).state, "found", "still live for its confirmers");
});

// The Worker stages a sweep card, so the Worker puts it on the usage record:
// its ✅ or ⛔ then pairs with a staged row, as any card's does.
for (const [glyph, outcome] of [
  ["white_check_mark", "confirmed"],
  ["no_entry", "cancelled"],
] as const) {
  test(`a sweep card has a staged row, and its ${outcome === "confirmed" ? "✅" : "⛔"} pairs with it`, async () => {
    const { h, card } = await stagedCard(2);
    const [staged] = await h.proposalEvents.eventsOf(card.proposalTs);
    assert.equal(staged?.event, "staged");
    assert.equal(staged?.via, "worker");
    const verdict = await resolveSignal(react(card, "U0ADE", glyph), { threadState: h.threadState });
    assert.equal(verdict.outcome, "won");
    await recordProposalEvents(h.proposalEvents, verdictEvents(verdict, h.clock.now + 60_000));
    assert.deepEqual(
      (await h.proposalEvents.eventsOf(card.proposalTs)).map((e) => e.event),
      ["staged", outcome],
    );
  });
}

test("a thread participant's ✅ executes", async () => {
  const { h, card } = await stagedCard(2);
  // Sam started the thread and owns neither fix.
  const verdict = await resolveSignal(react(card, "U0SAM"), { threadState: h.threadState });
  assert.equal(verdict.outcome, "won");
  assert.equal(verdict.execute?.operations.length, 2);
});

test("an owner's ✅ runs the card's whole batch inside one invocation's budget", async () => {
  const page = pageWith(10);
  const { h, card } = await stagedCard(10, page);
  const notion = fakeNotion(page);

  const verdict: GateVerdict = await resolveSignal(react(card, "U0ADE"), { threadState: h.threadState });
  assert.equal(verdict.outcome, "won");
  const { outcomes, spent } = await runMetered(async () => {
    const outcomes = await runOperations(verdict.execute!.operations, notion.execute);
    return { outcomes, spent: subrequestsUsed() };
  });

  assert.equal(outcomes.length, 10);
  assert.ok(outcomes.every((o) => o.ok));
  assert.ok(spent <= 50, `ten fixes spent ${spent} of an invocation's 50`);
  assert.equal(await recordSweepResolution(h.store, card, outcomes, at(30, 15)), 10);
  assert.ok(h.store.items().every((i) => i.status === "confirmed" && i.resolvedAt === at(30, 15)));
});

test("a moved stamp writes nothing and is recorded as refused_stale", async () => {
  const page = pageWith(2);
  const { h, card } = await stagedCard(2, page);
  const notion = fakeNotion(page);
  // Someone edited the first block in Notion after the sweep read it.
  notion.blocks.set("blk-0", { stamp: "2026-09-30T09:00:00.000Z", text: "Line 0, edited by hand" });

  const verdict = await resolveSignal(react(card, "U0BEA"), { threadState: h.threadState });
  const outcomes = await runOperations(verdict.execute!.operations, notion.execute);
  await recordSweepResolution(h.store, card, outcomes, at(30, 15));

  assert.equal(notion.blocks.get("blk-0")!.text, "Line 0, edited by hand", "the hand edit survives");
  assert.equal(notion.blocks.get("blk-1")!.text, "Line 1 (fixed)");
  assert.deepEqual(
    h.store.items().map((i) => [i.blockId, i.status]),
    [
      ["blk-0", "refused_stale"],
      ["blk-1", "confirmed"],
    ],
  );
});

// A block that gained a link or bold since the read is refused unwritten —
// its own outcome, not a moved block and not a failure.
test("a block refused for its formatting is recorded as refused_unwritable", async () => {
  const page = pageWith(2);
  const { h, card } = await stagedCard(2, page);
  const notion = fakeNotion(page);
  notion.formatted.add("blk-0");

  const verdict = await resolveSignal(react(card, "U0BEA"), { threadState: h.threadState });
  const outcomes = await runOperations(verdict.execute!.operations, notion.execute);
  await recordSweepResolution(h.store, card, outcomes, at(30, 15));

  assert.deepEqual(
    h.store.items().map((i) => [i.blockId, i.status]),
    [
      ["blk-0", "refused_unwritable"],
      ["blk-1", "confirmed"],
    ],
  );
});

test("a ⛔ drops every item; a revision keeps what it kept and drops the rest", async () => {
  const cancelled = await stagedCard(2);
  await recordSweepResolution(cancelled.h.store, cancelled.card, undefined, at(30, 15));
  assert.deepEqual(cancelled.h.store.items().map((i) => i.status), ["dropped", "dropped"]);

  const revised = await stagedCard(3);
  // "drop 2": the same batch without its second operation, on a new card.
  const [first, second, third] = revised.card.operations!;
  const dropped = (second!.input.replace as Array<{ block_id: string }>)[0]!.block_id;
  const revision: PendingProposal = { ...revised.card, proposalTs: "1790776000.000001", operations: [first!, third!] };
  assert.deepEqual(await recordSweepRevision(revised.h.store, revised.card, revision, at(30, 15)), { kept: 2, dropped: 1 });
  for (const item of revised.h.store.items()) {
    if (item.blockId === dropped) {
      assert.deepEqual([item.status, item.proposalTs], ["dropped", revised.card.proposalTs]);
    } else {
      assert.deepEqual([item.status, item.proposalTs], ["proposed", revision.proposalTs], item.blockId);
      assert.equal(item.postedAt, at(30, 14), "the revision keeps the card's deadline, so its posted time stands");
    }
  }
});

test("a card staged beside a sweep card, not in its place, moves and drops none of its items", async () => {
  const { h, card } = await stagedCard(2);
  const beside: PendingProposal = {
    ...card,
    proposalTs: "1790776900.000001",
    operations: [{ toolName: "github_issue_create", input: { title: "Card copy" } }],
    sweepRun: undefined,
  };
  assert.deepEqual(await recordSweepRevision(h.store, card, beside, at(30, 15)), { kept: 0, dropped: 0 });
  assert.ok(h.store.items().every((i) => i.status === "proposed" && i.proposalTs === card.proposalTs));
});

test("a cut-off sweep card re-staged moves the items still to run to the fresh card, and leaves the rest", async () => {
  const { h, card } = await stagedCard(3);
  const [done, ...toRun] = card.operations!;
  const fresh: PendingProposal = { ...card, proposalTs: "1790777000.000001", operations: toRun };
  assert.equal(await recordSweepRestage(h.store, card, fresh, at(30, 16)), 2);
  const doneBlock = (done!.input.replace as Array<{ block_id: string }>)[0]!.block_id;
  for (const item of h.store.items()) {
    assert.equal(item.status, "proposed");
    assert.equal(item.proposalTs, item.blockId === doneBlock ? card.proposalTs : fresh.proposalTs, item.blockId);
    if (item.blockId !== doneBlock) assert.equal(item.postedAt, at(30, 16), "the fresh card's 72 h start now");
  }
});
