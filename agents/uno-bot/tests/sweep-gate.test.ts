// A sweep report's fixes through Gate: who may decide one, what its Approve
// runs, and what becomes of each item.
//
// The report is staged by a real morning job into the in-memory ThreadState,
// one proposal per fix; each is decided by `resolveSignal` exactly as its
// Review pop-up's Submit would, and its operation run through
// `runOperations` against a fake Notion that refuses a replace whose stamp
// has moved — the integration's own rule (ADR-029). What became of each item
// is then recorded as the executor records it.
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

/** A report of `n` fixes on one page, owned alternately by Ade and Bea, in a
 *  thread Sam started — staged by a real night and morning. */
async function stagedReport(n: number, page: SweepSource = pageWith(n)) {
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
  assert.equal(h.staged.length, n, "one proposal per fix");
  return { h, fixes: [...h.staged] };
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

/** A Review decision on one fix, as its pop-up's Submit sends it. */
const review = (fix: PendingProposal, userId: string, decision: "confirm" | "cancel" = "confirm") => ({
  kind: "review" as const,
  messageTs: fix.proposalTs,
  decision,
  userId,
});

test("an Approve from someone neither an owner nor in the thread executes nothing", async () => {
  const { h, fixes } = await stagedReport(2);
  const verdict = await resolveSignal(review(fixes[0]!, "U0BYSTANDER"), { threadState: h.threadState });
  assert.equal(verdict.outcome, "none");
  assert.equal(verdict.execute, undefined);
  assert.deepEqual(verdict.post?.note, {
    kind: "not-a-confirmer",
    confirmers: ["U0ADE", "U0BEA", "U0SAM"],
    userId: "U0BYSTANDER",
  });
  assert.equal((await h.threadState.getProposalByTs(fixes[0]!.proposalTs)).state, "found", "still live for its confirmers");
});

test("a typed ✅ under a sweep report decides nothing: each fix is decided in its own Review", async () => {
  const { h, fixes } = await stagedReport(2);
  const verdict = await resolveSignal(
    { kind: "typed", channel: DESIGN, thread: ROOT, text: "✅", userId: "U0ADE" },
    { threadState: h.threadState },
  );
  assert.equal(verdict.execute, undefined);
  assert.deepEqual(verdict.post?.note, { kind: "review-only" });
  for (const fix of fixes) assert.equal((await h.threadState.getProposalByTs(fix.proposalTs)).state, "found");
});

// The Worker stages each fix, so the Worker puts it on the usage record: its
// Approve or Reject then pairs with a staged row, as any card's does.
for (const [decision, outcome] of [
  ["confirm", "confirmed"],
  ["cancel", "cancelled"],
] as const) {
  test(`a sweep fix has a staged row, and its ${decision === "confirm" ? "Approve" : "Reject"} pairs with it`, async () => {
    const { h, fixes } = await stagedReport(2);
    const fix = fixes[0]!;
    const [staged] = await h.proposalEvents.eventsOf(fix.proposalTs);
    assert.equal(staged?.event, "staged");
    assert.equal(staged?.via, "worker");
    const verdict = await resolveSignal(review(fix, "U0ADE", decision), { threadState: h.threadState });
    assert.equal(verdict.outcome, "won");
    await recordProposalEvents(h.proposalEvents, verdictEvents(verdict, h.clock.now + 60_000));
    assert.deepEqual(
      (await h.proposalEvents.eventsOf(fix.proposalTs)).map((e) => e.event),
      ["staged", outcome],
    );
  });
}

test("a thread participant's Approve runs that fix and no other", async () => {
  const { h, fixes } = await stagedReport(2);
  // Sam started the thread and owns neither fix.
  const verdict = await resolveSignal(review(fixes[1]!, "U0SAM"), { threadState: h.threadState });
  assert.equal(verdict.outcome, "won");
  assert.deepEqual(verdict.execute?.operations, fixes[1]!.operations);
  assert.equal((await h.threadState.getProposalByTs(fixes[0]!.proposalTs)).state, "found", "the other waits on its own decision");
});

test("an Approve records only its own item; the rest stay proposed", async () => {
  const page = pageWith(3);
  const { h, fixes } = await stagedReport(3, page);
  const notion = fakeNotion(page);

  const verdict: GateVerdict = await resolveSignal(review(fixes[1]!, "U0ADE"), { threadState: h.threadState });
  assert.equal(verdict.outcome, "won");
  const { outcomes, spent } = await runMetered(async () => {
    const outcomes = await runOperations(verdict.execute!.operations, notion.execute);
    return { outcomes, spent: subrequestsUsed() };
  });
  assert.equal(outcomes.length, 1);
  assert.ok(spent <= 50);
  assert.equal(await recordSweepResolution(h.store, fixes[1]!, outcomes, at(30, 15)), 1);
  const own = fixes[1]!.item!.id;
  assert.deepEqual(
    h.store.items().map((i) => [i.blockId, i.status]),
    h.store.items().map((i) => [i.blockId, i.blockId === own ? "confirmed" : "proposed"]),
  );
  assert.equal(h.store.items().filter((i) => i.status === "confirmed").length, 1);
});

test("a moved stamp writes nothing and is recorded as refused_stale", async () => {
  const page = pageWith(2);
  const { h, fixes } = await stagedReport(2, page);
  const notion = fakeNotion(page);
  // Someone edited the first block in Notion after the sweep read it.
  notion.blocks.set("blk-0", { stamp: "2026-09-30T09:00:00.000Z", text: "Line 0, edited by hand" });

  for (const fix of fixes) {
    const verdict = await resolveSignal(review(fix, "U0BEA"), { threadState: h.threadState });
    const outcomes = await runOperations(verdict.execute!.operations, notion.execute);
    await recordSweepResolution(h.store, fix, outcomes, at(30, 15));
  }

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
  const { h, fixes } = await stagedReport(2, page);
  const notion = fakeNotion(page);
  notion.formatted.add("blk-0");

  const verdict = await resolveSignal(review(fixes[0]!, "U0BEA"), { threadState: h.threadState });
  const outcomes = await runOperations(verdict.execute!.operations, notion.execute);
  await recordSweepResolution(h.store, fixes[0]!, outcomes, at(30, 15));

  assert.deepEqual(
    h.store.items().map((i) => [i.blockId, i.status]),
    [
      ["blk-0", "refused_unwritable"],
      ["blk-1", "proposed"],
    ],
  );
});

test("a Reject drops its own item and no other", async () => {
  const { h, fixes } = await stagedReport(2);
  await recordSweepResolution(h.store, fixes[0]!, undefined, at(30, 15));
  assert.deepEqual(
    h.store.items().map((i) => [i.blockId, i.status]),
    [
      ["blk-0", "dropped"],
      ["blk-1", "proposed"],
    ],
  );
});

test("a card staged beside a sweep fix, not in its place, moves and drops none of its items", async () => {
  const { h, fixes } = await stagedReport(2);
  const beside: PendingProposal = {
    ...fixes[0]!,
    proposalTs: "1790776900.000001",
    operations: [{ toolName: "github_issue_create", input: { title: "Card copy" } }],
    sweepRun: undefined,
  };
  assert.deepEqual(await recordSweepRevision(h.store, fixes[0]!, beside, at(30, 15)), { kept: 0, dropped: 0 });
  assert.ok(h.store.items().every((i) => i.status === "proposed" && i.proposalTs === fixes[0]!.item?.messageTs));
});

test("a cut-off sweep fix re-staged moves its item to the fresh card, and leaves the rest", async () => {
  const { h, fixes } = await stagedReport(3);
  const cut = fixes[1]!;
  const fresh: PendingProposal = { ...cut, proposalTs: "1790777000.000001", item: undefined };
  assert.equal(await recordSweepRestage(h.store, cut, fresh, at(30, 16)), 1);
  const report = cut.item!.messageTs;
  for (const item of h.store.items()) {
    assert.equal(item.status, "proposed");
    assert.equal(item.proposalTs, item.blockId === cut.item!.id ? fresh.proposalTs : report, item.blockId);
  }
});
