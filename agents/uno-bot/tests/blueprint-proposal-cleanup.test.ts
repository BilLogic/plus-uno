// Offering a drawn proposal's removal: the morning check's job seam
// (`offerAgedRemovals`) and the in-thread ask (`offerRequestedRemoval`), over
// the in-memory records with Slack and the Gate's staging as recording fakes.
// What happens on the card's ✅ is `blueprint-proposal-withdraw.test.ts`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createInMemoryProposalRecords,
  type DrawnProposal,
  type ProposalRecords,
} from "../src/blueprint-upkeep/index";
import {
  isRemoveRequest,
  OFFER_AFTER_MS,
  offerAgedRemovals,
  offerRequestedRemoval,
  WITHDRAW_TOOL,
  type OfferDeps,
} from "../src/blueprint-upkeep/proposal-cleanup";
import type { PendingProposal } from "../src/thread-state/index";
import type { ProposalCard } from "../src/turn/delivery";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

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

describe("the morning check", () => {
  it("offers an unlinked proposal past 30 days to the person who drew it, in its own thread, on a card only they decide", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const { deps, posts, staged } = world(records);
    const report = await offerAgedRemovals(deps);
    assert.equal(report.offered, 1);
    assert.equal(posts.length, 1);
    assert.equal(posts[0]!.p.replyTs, "t1");
    assert.match(posts[0]!.card.lead ?? "", /no Roadmap card has been linked to it in 30 days/);
    const [card] = staged;
    assert.ok(card);
    assert.equal(card.toolName, WITHDRAW_TOOL);
    assert.deepEqual(card.input, { proposalTs: "1.1", pathId: "path-new", cellIds: ["cell-a"], reason: "aged" });
    assert.deepEqual(card.confirmers, ["U0MAYA"]);
    assert.equal(card.exclusiveConfirmers, true);
    assert.equal(card.channel, "C0TEAM");
    assert.equal(card.threadTs, "t1");
  });

  it("offers it once: the next morning finds nothing to offer", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const first = world(records);
    await offerAgedRemovals(first.deps);
    const second = world(records);
    const report = await offerAgedRemovals(second.deps);
    assert.equal(report.offered, 0);
    assert.deepEqual(second.posts, []);
  });

  it("never offers a linked proposal, however old", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn({ writtenAt: NOW - 200 * DAY }));
    await records.linkCard("C0TEAM", "t1", "page-a");
    const { deps, posts } = world(records);
    await offerAgedRemovals(deps);
    assert.deepEqual(posts, []);
  });

  it("waits for a proposal under 30 days, and never offers one already withdrawn", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(
      records,
      drawn({ proposalTs: "1.1", writtenAt: NOW - OFFER_AFTER_MS + DAY }),
      drawn({ proposalTs: "1.2", threadTs: "t2", writtenAt: NOW - 60 * DAY }),
    );
    await records.withdraw("1.2", NOW - DAY);
    const { deps, posts } = world(records);
    await offerAgedRemovals(deps);
    assert.deepEqual(posts, []);
  });

  it("an offer Slack refused is not counted as made, so the next morning offers it", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const refused = world(records, { refuse: new Set(["1.1"]) });
    await offerAgedRemovals(refused.deps);
    assert.deepEqual(refused.staged, []);
    const next = world(records);
    assert.equal((await offerAgedRemovals(next.deps)).offered, 1);
  });

  it("a rehearsal posts, stages and marks nothing", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn());
    const dry = world(records);
    const report = await offerAgedRemovals(dry.deps, { dryRun: true });
    assert.match(report.summary, /would offer the removal of 1/);
    assert.deepEqual(dry.posts, []);
    assert.equal((await records.dueForOffer(NOW, 10)).length, 1);
  });

  it("stops before the alarm's budget runs out, and the rest wait for the next morning", async () => {
    const records = createInMemoryProposalRecords();
    await recordAll(records, drawn({ proposalTs: "1.1" }), drawn({ proposalTs: "1.2", threadTs: "t2" }));
    const { deps, posts } = world(records);
    // Room for one offer: its post and its staging.
    let left = 2;
    const report = await offerAgedRemovals({
      ...deps,
      postCard: async (p, card) => {
        left -= 2;
        return deps.postCard(p, card);
      },
      meter: { headroom: () => ({ subrequests: left, d1Queries: 100 }) },
    });
    assert.equal(posts.length, 1);
    assert.match(report.summary, /1 wait for the next morning/);
    assert.equal((await records.dueForOffer(NOW, 10)).length, 1);
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
