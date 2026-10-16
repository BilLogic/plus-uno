// What a drawn proposal wrote on the blueprint, kept by its thread.
//
// One record per approved offer (`./proposal.ts`): the thread it was offered
// in, who asked, the `proposed` path it created beside today's, and the cells
// written on it. It is how a later turn finds a thread's proposal — to link it
// to the Roadmap card the PRD becomes, so shipping that card promotes it rather
// than drafting a duplicate — and how a daily check finds proposals that never
// got a card, to offer their removal to the person who drew them. The new path
// is the whole proposal, so it is what a removal deletes and a promotion
// moves on. Ids and times only — no text, no titles (ADR-030): the cells'
// words are on the blueprint, and the thread is in Slack.
//
// Two adapters keep the same contract: `createInMemoryProposalRecords` below,
// and the D1 one beside it (`./proposal-records-d1.ts`,
// migrations/usage/0016_blueprint_proposals.sql).

export interface DrawnProposal {
  /** The approved card's ts: the record's identity. */
  proposalTs: string;
  channel: string;
  /** The conversation key (`ThreadRef.thread`). */
  threadTs: string;
  /** A real message ts to reply under. */
  replyTs: string;
  requesterId: string;
  /** The `proposed` path the approval created. */
  pathId: string;
  /** Today's path it was drawn beside. */
  todayPathId: string;
  /** The cells written on the new path. */
  cellIds: string[];
  /** When the rows were written, epoch ms. */
  writtenAt: number;
  /** The Roadmap card's Notion page id, once the PRD became one. */
  cardId: string | null;
}

export interface ProposalRecords {
  /** Keep a drawn proposal. A second record of the same card changes nothing. */
  record(proposal: DrawnProposal): Promise<void>;
  /** Every proposal drawn in a thread, oldest first. */
  inThread(channel: string, threadTs: string): Promise<DrawnProposal[]>;
  /** Link a thread's unlinked, standing proposals to a Roadmap card; how many were. */
  linkCard(channel: string, threadTs: string, cardId: string): Promise<number>;
  /** Proposals still without a card, written at or before `before`, oldest first. */
  unlinkedBefore(before: number, limit: number): Promise<DrawnProposal[]>;
  /** A Roadmap card's linked proposals not withdrawn, oldest first: what its shipping promotes. */
  byCard(cardId: string, limit: number): Promise<DrawnProposal[]>;

  // Withdrawal and the 30-day offer (`./proposal-cleanup.ts`). A withdrawn
  // record stays, marked, so the thread and the check never see it again.

  /** A proposal and where its clean-up stands; null for no such record. */
  standing(proposalTs: string): Promise<ProposalStanding | null>;
  /** A thread's proposals not withdrawn, oldest first. */
  standingInThread(channel: string, threadTs: string): Promise<DrawnProposal[]>;
  /** Mark a proposal withdrawn; false when it already was, or is no record. */
  withdraw(proposalTs: string, at: number): Promise<boolean>;
  /** Unlinked, standing proposals never offered for removal, written at or
   *  before `before`, oldest first. */
  dueForOffer(before: number, limit: number): Promise<DrawnProposal[]>;
  /** Take the one removal offer a proposal gets; false when it was taken. */
  claimOffer(proposalTs: string, at: number): Promise<boolean>;
  /** Give back a claim whose offer never went up, for the next check. */
  releaseOffer(proposalTs: string): Promise<void>;
}

/** A proposal with its clean-up marks: when it was offered for removal, and
 *  when it was withdrawn. */
export interface ProposalStanding {
  proposal: DrawnProposal;
  offeredAt: number | null;
  withdrawnAt: number | null;
}

/** The in-memory adapter: the Node suite's, and the contract's reference. */
export function createInMemoryProposalRecords(): ProposalRecords {
  const kept = new Map<string, DrawnProposal>();
  const marks = new Map<string, { offeredAt: number | null; withdrawnAt: number | null }>();
  const markOf = (ts: string) => marks.get(ts) ?? { offeredAt: null, withdrawnAt: null };
  const isStanding = (p: DrawnProposal) => markOf(p.proposalTs).withdrawnAt === null;
  const copy = (p: DrawnProposal): DrawnProposal => ({ ...p, cellIds: [...p.cellIds] });
  const oldestFirst = (a: DrawnProposal, b: DrawnProposal) => a.writtenAt - b.writtenAt || a.proposalTs.localeCompare(b.proposalTs);
  return {
    async record(proposal) {
      if (!kept.has(proposal.proposalTs)) kept.set(proposal.proposalTs, copy(proposal));
    },
    async inThread(channel, threadTs) {
      return [...kept.values()].filter((p) => p.channel === channel && p.threadTs === threadTs).sort(oldestFirst).map(copy);
    },
    async linkCard(channel, threadTs, cardId) {
      let linked = 0;
      for (const p of kept.values()) {
        if (p.channel === channel && p.threadTs === threadTs && p.cardId === null && isStanding(p)) {
          p.cardId = cardId;
          linked += 1;
        }
      }
      return linked;
    },
    async unlinkedBefore(before, limit) {
      return [...kept.values()]
        .filter((p) => p.cardId === null && p.writtenAt <= before)
        .sort(oldestFirst)
        .slice(0, limit)
        .map(copy);
    },
    async standing(proposalTs) {
      const p = kept.get(proposalTs);
      return p ? { proposal: copy(p), ...markOf(proposalTs) } : null;
    },
    async standingInThread(channel, threadTs) {
      return [...kept.values()].filter((p) => p.channel === channel && p.threadTs === threadTs && isStanding(p)).sort(oldestFirst).map(copy);
    },
    async withdraw(proposalTs, at) {
      if (!kept.has(proposalTs) || markOf(proposalTs).withdrawnAt !== null) return false;
      marks.set(proposalTs, { ...markOf(proposalTs), withdrawnAt: at });
      return true;
    },
    async dueForOffer(before, limit) {
      return [...kept.values()]
        .filter((p) => p.cardId === null && p.writtenAt <= before && isStanding(p) && markOf(p.proposalTs).offeredAt === null)
        .sort(oldestFirst)
        .slice(0, limit)
        .map(copy);
    },
    async claimOffer(proposalTs, at) {
      if (!kept.has(proposalTs) || markOf(proposalTs).offeredAt !== null) return false;
      marks.set(proposalTs, { ...markOf(proposalTs), offeredAt: at });
      return true;
    },
    async releaseOffer(proposalTs) {
      if (marks.has(proposalTs)) marks.set(proposalTs, { ...markOf(proposalTs), offeredAt: null });
    },
    async byCard(cardId, limit) {
      return [...kept.values()].filter((p) => p.cardId === cardId && isStanding(p)).sort(oldestFirst).slice(0, limit).map(copy);
    },
  };
}
