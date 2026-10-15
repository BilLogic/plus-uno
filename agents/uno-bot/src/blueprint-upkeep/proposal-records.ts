// What a drawn proposal wrote on the blueprint, kept by its thread.
//
// One record per approved offer (`./proposal.ts`): the thread it was offered
// in, who asked, the path, and the slots its `proposed` rows were written to.
// It is how a later turn finds a thread's rows — to link them to the Roadmap
// card the PRD becomes, so shipping that card promotes them rather than
// drafting duplicates — and how a daily check finds rows that never got a card,
// to offer their removal to the person who drew them.
//
// A slot (path, step, lane) is how the rows are named: it is the key every
// authoring write takes, so a promotion or a removal goes through the same
// RPCs by it, and it never goes stale the way a cell's text would. Ids and
// times only — no text, no titles (ADR-030): the rows' words are on the
// blueprint, and the thread is in Slack.
//
// Two adapters keep the same contract: `createInMemoryProposalRecords` below,
// and the D1 one beside it (`./proposal-records-d1.ts`,
// migrations/usage/0016_blueprint_proposals.sql).

/** A slot a proposal's row was written to. */
export interface ProposalRow {
  laneId: string;
  stepId: string;
}

export interface DrawnProposal {
  /** The approved card's ts: the record's identity. */
  proposalTs: string;
  channel: string;
  /** The conversation key (`ThreadRef.thread`). */
  threadTs: string;
  /** A real message ts to reply under. */
  replyTs: string;
  requesterId: string;
  pathId: string;
  rows: ProposalRow[];
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
  /** Link a thread's unlinked proposals to a Roadmap card; how many were. */
  linkCard(channel: string, threadTs: string, cardId: string): Promise<number>;
  /** Proposals still without a card, written at or before `before`, oldest first. */
  unlinkedBefore(before: number, limit: number): Promise<DrawnProposal[]>;
}

/** The in-memory adapter: the Node suite's, and the contract's reference. */
export function createInMemoryProposalRecords(): ProposalRecords {
  const kept = new Map<string, DrawnProposal>();
  const copy = (p: DrawnProposal): DrawnProposal => ({ ...p, rows: p.rows.map((r) => ({ ...r })) });
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
        if (p.channel === channel && p.threadTs === threadTs && p.cardId === null) {
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
  };
}
