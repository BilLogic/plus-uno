// Revision or separate proposal: which waiting card, if any, a turn's new
// card replaces (#1318).
//
// A thread can hold several live proposal cards. A new card for the same
// matter as a waiting one is a REVISION: it supersedes that card, is staged
// into its slot and carries what it held. A card for a different matter is a
// SEPARATE PROPOSAL: it gets a slot of its own and posts beside the others,
// each decided on its own, in any order. Terms: GLOSSARY.md § uno-bot.
//
// THE MODEL DECIDES, by naming the card it revises on the gated call
// (`revises_card`, `agent/tool-table.ts`). The Worker decides in three places
// of its own, each a fact the model cannot get wrong:
//
//   • A card sent back with Needs changes is revised by its asker's turn —
//     the Review door queued that turn for exactly that.
//   • A card aimed at the same Notion page or GitHub issue as a live one is
//     a revision of it, even when the model called it separate. Two such
//     cards both live could both be approved, and the second would
//     overwrite the first. The override runs one way only: the Worker never
//     turns a revision the model named into a separate proposal.
//   • A card the Worker staged under a key of its own (a sweep card, an item
//     of a decision report, a follow-through draft) is revised by a batch
//     that touches it, as before: the model never staged it and may not know
//     to name it.
//
// `cardMatter` is the one place the call is made, so it is where the usage
// record's revision-or-separate telemetry hooks in (#1320): its `why` says
// who decided.

import { cardHeadline, sameWriteTarget } from "../agent/card-identity";
import { replacedBlocks } from "../sweep/cards";
import {
  isTurnCard,
  itemProposalKey,
  proposalOperations,
  type PendingProposal,
  type ProposalOperation,
  type ThreadState,
} from "../thread-state/index";

/** What a turn's new card is, against the cards waiting in its thread. */
export type CardMatter =
  | { kind: "separate" }
  | {
      kind: "revision";
      /** The waiting card it supersedes. */
      of: PendingProposal;
      /**
       * Who decided: `named` — the model named the card; `sent-back` — the
       * card's Needs changes queued this turn; `same-target` — the Worker,
       * because both write one Notion page or GitHub issue; `touched` — a
       * card the Worker staged, which the batch changes.
       */
      why: "named" | "sent-back" | "same-target" | "touched";
    };

/**
 * Decide what a turn's batch is: a revision of one waiting card, or a separate
 * proposal.
 *
 * @param facts.live - Every live card in the reply thread, newest first.
 * @param facts.pending - The card the turn was handed (`TurnRequest.pending`):
 *   the thread's newest, or the card a Needs changes sent back.
 * @param facts.operations - The batch the model staged.
 * @param facts.named - The card the model said it revises (`revises_card`).
 * @param facts.userId - Whose turn this is.
 * @param threadState - The two reads a decision report's fixes need.
 */
export async function cardMatter(
  facts: {
    live: readonly PendingProposal[];
    pending: PendingProposal | null;
    operations: readonly ProposalOperation[];
    named?: string;
    userId: string;
  },
  threadState: Pick<ThreadState, "getReport" | "getProposalByTs">,
): Promise<CardMatter> {
  const { live, pending, operations } = facts;
  if (pending && isTurnCard(pending) && pending.revising?.userId === facts.userId) {
    return { kind: "revision", of: pending, why: "sent-back" };
  }
  const sameTarget = live.find((card) =>
    operations.some((op) => proposalOperations(card).some((own) => sameWriteTarget(op, own))),
  );
  if (sameTarget) return { kind: "revision", of: sameTarget, why: "same-target" };
  const named = facts.named ? live.find((card) => card.proposalTs === facts.named) : undefined;
  if (named) return { kind: "revision", of: named, why: "named" };
  const touched = await workerCardTouched(live, operations, threadState);
  return touched ? { kind: "revision", of: touched, why: "touched" } : { kind: "separate" };
}

/**
 * What the person is told the staging did, said just above the card: the
 * card a revision replaced, or the cards a separate proposal posts beside.
 * Null when a separate proposal posts alone.
 */
export function stagingNote(
  matter: CardMatter,
  live: readonly PendingProposal[],
): { kind: "revised"; replaced: string } | { kind: "staged-beside"; waiting: string[] } | null {
  if (matter.kind === "revision") return { kind: "revised", replaced: cardHeadline(matter.of) };
  return live.length ? { kind: "staged-beside", waiting: live.map(cardHeadline) } : null;
}

/**
 * The first card the Worker staged under a key of its own that the batch
 * touches. A fix of a sweep report is one of several live fixes in its
 * thread, so every live fix of that report is checked, and the one whose
 * block the batch touches is the card revised.
 */
async function workerCardTouched(
  live: readonly PendingProposal[],
  operations: readonly ProposalOperation[],
  threadState: Pick<ThreadState, "getReport" | "getProposalByTs">,
): Promise<PendingProposal | null> {
  const reportsRead = new Set<string>();
  for (const card of live) {
    if (isTurnCard(card)) continue;
    if (card.item && card.sweepRun) {
      const { messageTs } = card.item;
      if (reportsRead.has(messageTs)) continue;
      reportsRead.add(messageTs);
      const record = await threadState.getReport(messageTs).catch(() => null);
      for (const entry of record?.entries ?? [card.item]) {
        if ("state" in entry && entry.state.kind !== "open" && entry.state.kind !== "changes-asked") continue;
        const look = await threadState.getProposalByTs(itemProposalKey(messageTs, entry.id)).catch(() => null);
        if (look?.state === "found" && touchesCard(operations, look.proposal)) return look.proposal;
      }
      continue;
    }
    if (touchesCard(operations, card)) return card;
  }
  return null;
}

/**
 * Whether a batch touches a keyed card: for a sweep card, replaces one of its
 * blocks; for any other, aims one of its tools at the same target.
 */
function touchesCard(operations: readonly ProposalOperation[], card: PendingProposal): boolean {
  if (card.sweepRun) {
    const theirs = replacedBlocks(proposalOperations(card));
    return [...replacedBlocks(operations)].some((b) => theirs.has(b));
  }
  const theirs = proposalOperations(card);
  return operations.some((op) => theirs.some((own) => sameTool(op, own)));
}

/**
 * Whether two operations use the same tool on the same target, as a keyed
 * card is touched: an issue update on the same `issue_number`, an issue
 * create under the same title. Any other tool is matched by the tool alone.
 */
function sameTool(a: ProposalOperation, b: ProposalOperation): boolean {
  if (a.toolName !== b.toolName) return false;
  if (a.toolName === "github_issue_update") return String(a.input.issue_number) === String(b.input.issue_number);
  if (a.toolName === "github_issue_create") {
    const title = (op: ProposalOperation) => String(op.input.title ?? "").trim().toLowerCase();
    return title(a) === title(b);
  }
  return true;
}
