// Offering a drawn proposal's removal: the morning check, handed to the
// sweep's post as a section in the proposal's own thread
// (`handOverAgedRemovals`, `removalOfferSection`, run through the real sweep
// on its harness), and the in-thread ask (`offerRequestedRemoval`), over the
// in-memory records with Slack and the Gate's staging as recording fakes.
// What happens on the card's ✅ is `blueprint-proposal-withdraw.test.ts`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createInMemoryProposalRecords,
  type DrawnProposal,
  type ProposalRecords,
} from "../src/blueprint-upkeep/index";
import {
  handOverAgedRemovals,
  isRemoveRequest,
  OFFER_AFTER_MS,
  offerRequestedRemoval,
  REMOVAL_OFFER_SECTION,
  removalOfferSection,
  WITHDRAW_TOOL,
  type OfferDeps,
  type RemovalHanded,
} from "../src/blueprint-upkeep/proposal-cleanup";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { sectionHandOffIn } from "../src/sweep/sections";
import { runSweepJob } from "../src/sweep/index";
import { memoryRunStorage, sweepHarness } from "./helpers/sweep-harness";
import type { ProposalCard } from "../src/turn/delivery";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const DATE = new Date(NOW).toISOString().slice(0, 10);

function drawn(over: Partial<DrawnProposal> = {}): DrawnProposal {
  return {
    proposalTs: "1.1",
    channel: "C0TEAM",
    threadTs: "t1",
    replyTs: "t1",
    requesterId: "U0MAYA",
    pathId: "path-new",
    todayPathId: "path-1",
    cellIds: ["cell-a"],
    writtenAt: NOW - 31 * DAY,
    cardId: null,
    ...over,
  };
}

function world(records: ProposalRecords, opts: { refuse?: Set<string> } = {}) {
  const posts: Array<{ p: DrawnProposal; card: ProposalCard }> = [];
  const staged: PendingProposal[] = [];
  let n = 0;
  const deps: OfferDeps & { now(): number } = {
    records,
    async postCard(p, card) {
      if (opts.refuse?.has(p.proposalTs)) return null;
      posts.push({ p, card });
      n += 1;
      return { ts: `9.${n}`, text: card.lead ?? "" };
    },
    async stage(proposal) {
      staged.push(proposal);
    },
    now: () => NOW,
  };
  return { deps, posts, staged };
}

async function recordAll(records: ProposalRecords, ...ps: DrawnProposal[]) {
  for (const p of ps) await records.record(p);
}

/** The morning: the check hands its offers over, then the sweep's post puts
 *  each on the proposal's own thread as a section of one message. */
function morning(records: ProposalRecords, opts: { stageFails?: Set<string>; notInChannel?: string[] } = {}) {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const handOff = sectionHandOffIn<RemovalHanded>(memoryRunStorage(), REMOVAL_OFFER_SECTION);
  const staged: PendingProposal[] = [];
  const section = removalOfferSection(
    {
      records,
      async stage(proposal) {
        const input = proposal.input as { proposalTs: string };
        if (opts.stageFails?.has(input.proposalTs)) throw new Error("thread state unavailable");
        staged.push(proposal);
        await threadState.putProposal(proposal);
      },
      linkOf: (p) => `https://blueprint.example/?cell=${p.cellIds[0] ?? ""}`,
      now: () => NOW,
    },
    handOff,
    DATE,
  );
  const h = sweepHarness({ channels: {}, now: NOW, runDate: DATE, threadState });
  for (const c of opts.notInChannel ?? []) h.notInChannel.add(c);
  h.deps.sections = [section];
  return {
    posts: h.posted,
    staged,
    async run(run: { dryRun?: boolean } = {}) {
      const handed = await handOverAgedRemovals({ records, now: () => NOW, handOff, date: DATE }, run);
      if (!run.dryRun) await runSweepJob({ key: "sweep-post", kind: "sweep-post" }, h.deps);
      return handed;
    },
  };
}

describe("the morning check", () => {
  it("offers an unlinked proposal past 30 days on the morning message, in the proposal's own thread, on a card only its requester decides", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const m = morning(records);
    const report = await m.run();
    assert.equal(report.handed, 1);
    assert.equal(m.posts.length, 1, "one message: the sweep's, not a post of its own");
    assert.equal(m.posts[0]!.channel, "C0TEAM");
    assert.equal(m.posts[0]!.threadTs, "t1", "in the proposal's own thread");
    assert.match(m.posts[0]!.text, /U0MAYA/, "the opener tags the person who drew it");
    const [card] = m.staged;
    assert.ok(card);
    assert.equal(card.toolName, WITHDRAW_TOOL);
    assert.deepEqual(card.input, { proposalTs: "1.1", pathId: "path-new", cellIds: ["cell-a"], reason: "aged" });
    assert.deepEqual(card.confirmers, ["U0MAYA"]);
    assert.equal(card.exclusiveConfirmers, true);
    assert.equal(card.channel, "C0TEAM");
    assert.equal(card.threadTs, "t1");
    assert.match(card.proposalText, /no Roadmap card has been linked to it in 30 days/);
  });

  it("offers it once: the next morning finds nothing to offer", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    await morning(records).run();
    const second = morning(records);
    const report = await second.run();
    assert.equal(report.handed, 0);
    assert.deepEqual(second.posts, []);
  });

  it("never offers a linked proposal, however old", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn({ writtenAt: NOW - 200 * DAY }));
    await records.linkCard("C0TEAM", "t1", "page-a");
    const m = morning(records);
    await m.run();
    assert.deepEqual(m.posts, []);
  });

  it("waits for a proposal under 30 days, and never offers one already withdrawn", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(
      records,
      drawn({ proposalTs: "1.1", writtenAt: NOW - OFFER_AFTER_MS + DAY }),
      drawn({ proposalTs: "1.2", threadTs: "t2", replyTs: "t2", writtenAt: NOW - 60 * DAY }),
    );
    await records.withdraw("1.2", NOW - DAY);
    const m = morning(records);
    await m.run();
    assert.deepEqual(m.posts, []);
  });

  it("a morning message that did not go up uses nothing: the next morning offers it", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const refused = morning(records, { notInChannel: ["C0TEAM"] });
    await refused.run();
    assert.deepEqual(refused.staged, []);
    const next = morning(records);
    await next.run();
    assert.equal(next.staged.length, 1);
  });

  it("an offer shown but not staged is not counted as made, so the next morning offers it again", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const failed = morning(records, { stageFails: new Set(["1.1"]) });
    await failed.run();
    assert.deepEqual(failed.staged, []);
    assert.equal((await records.dueForOffer(NOW, 10)).length, 1, "the claim is not taken");
    const next = morning(records);
    await next.run();
    assert.equal(next.staged.length, 1);
  });

  it("a rehearsal posts, stages and marks nothing", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const dry = morning(records);
    const report = await dry.run({ dryRun: true });
    assert.match(report.summary, /would offer the removal of 1/);
    assert.deepEqual(dry.posts, []);
    assert.equal((await records.dueForOffer(NOW, 10)).length, 1);
  });

  it("each proposal's offer goes in its own thread", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn({ proposalTs: "1.1" }), drawn({ proposalTs: "1.2", threadTs: "t2", replyTs: "t2" }));
    const m = morning(records);
    await m.run();
    assert.deepEqual(m.posts.map((p) => p.threadTs).sort(), ["t1", "t2"]);
    assert.equal(m.staged.length, 2);
  });
});

describe("asking in the proposal's thread", () => {
  const ask = (text: string, user = "U0MAYA", threadTs = "t1") => ({ channel: "C0TEAM", threadTs, user, text });

  it("'remove it' from the person who drew it puts a removal card in the thread, which only they decide", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn({ writtenAt: NOW - DAY }));
    const { deps, staged } = world(records);
    assert.equal(await offerRequestedRemoval(deps, ask("remove it")), true);
    assert.equal(staged.length, 1);
    assert.deepEqual(staged[0]!.confirmers, ["U0MAYA"]);
    assert.equal((staged[0]!.input as { reason: string }).reason, "asked");
  });

  it("from anyone else, it is the turn's", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const { deps, staged } = world(records);
    assert.equal(await offerRequestedRemoval(deps, ask("remove it", "U0SOMEONE")), false);
    assert.deepEqual(staged, []);
  });

  it("in a thread with no standing proposal, it is the turn's", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    await records.withdraw("1.1", NOW);
    const { deps } = world(records);
    assert.equal(await offerRequestedRemoval(deps, ask("remove it")), false);
    assert.equal(await offerRequestedRemoval(deps, ask("remove it", "U0MAYA", "t9")), false);
  });

  it("reads only a short, explicit removal ask", () => {
    for (const yes of ["remove it", "Remove it.", "please delete the proposal", "withdraw this from the blueprint", "take it down", "can you remove the proposed path?"]) {
      assert.equal(isRemoveRequest(yes), true, yes);
    }
    for (const no of ["remove the second bullet from the PRD", "don't remove it", "should we remove it later?", "remove", "removed it already, thanks"]) {
      assert.equal(isRemoveRequest(no), false, no);
    }
  });
});
