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
 * The card a new one corrects (#1320): the card the thread's PREVIOUS TURN
 * staged, still live, when the new card undoes the call it was staged under.
 * Two ways, as the ids show them (Bill, 2026-10-16, the second "require
 * overlap"):
 *
 *   • it was staged as a separate proposal, and the new card revises a
 *     different card it was staged beside ("that was meant to update the
 *     first one") — and when the ask says so in words (`undoesStaging`), the turn
 *     withdraws it, as the revision's (story 9);
 *   • it was staged as a revision, and the new card is a separate proposal
 *     aimed at the same Notion page or GitHub issue (`sameWriteTarget`).
 *     While the same-target rule makes such a card a revision of it
 *     (`cardMatter`), this one never fires; it is kept so the record stays
 *     right if that rule changes.
 *
 * "The previous turn" is by adjacency, not the clock: the card whose ask
 * (`userMsgTs`) is the last ask the thread's memory holds before this one.
 * An answer in between — a question, a look at what is waiting — and the
 * card is no longer just staged.
 *
 * A revision the Worker decided by a fact of its own — a card sent back with
 * Needs changes, a card the Worker staged — corrects nothing: nobody's call
 * is being undone. Neither does revising the just-staged card itself, which
 * is an edit of it. A card no turn made the call on (no `stagedAs`) is never
 * corrected. Ids only.
 *
 * @param facts.matter - What the new card is (`cardMatter`)
 * @param facts.live - Every live card in the reply thread, newest first,
 *   before the new card is staged
 * @param facts.operations - The new card's batch
 * @param facts.previousAsk - The ts of the thread's previous ask, as its
 *   memory holds it; absent, nothing is corrected
 */
export function correctedCard(facts: {
  matter: CardMatter;
  live: readonly PendingProposal[];
  operations: readonly ProposalOperation[];
  previousAsk: string | undefined;
}): PendingProposal | undefined {
  const { matter, previousAsk } = facts;
  if (!previousAsk) return undefined;
  const previous = facts.live.find((card) => card.userMsgTs === previousAsk && card.stagedAs);
  if (!previous) return undefined;
  if (matter.kind === "separate") {
    const overlaps = facts.operations.some((op) => proposalOperations(previous).some((own) => sameWriteTarget(op, own)));
    return previous.stagedAs === "revision" && overlaps ? previous : undefined;
  }
  if (matter.why === "sent-back" || matter.why === "touched") return undefined;
  return previous.stagedAs === "separate" && matter.of.proposalTs !== previous.proposalTs ? previous : undefined;
}

/** How a person says the card just staged went to the wrong place: "that was
 *  meant to update the first one", "it should have gone on the first card",
 *  "not a new card". Narrow on purpose — see `undoesStaging`. */
const UNDOES_STAGING: RegExp[] = [
  /\bmeant\s+(to|for)\b/i,
  /\bsupposed\s+to\b/i,
  /\b(i|we)\s+meant\b/i,
  /\bshould\s+(have\s+)?(been|gone|go|update|updated|change|changed|revise|revised)\b/i,
  /\bnot\s+(a\s+)?(new|separate|another)\s+(card|one|proposal)\b/i,
  /\binstead\s+of\s+(a\s+)?(new|separate)\b/i,
  /\bwrong\s+card\b/i,
];

/**
 * Whether the ask says, in plain words, that the card the previous turn
 * staged was the wrong call (story 9). A revision that corrects a separate
 * card withdraws it only then: the ids alone cannot tell "that was meant to
 * update the first one" from "now change the first one's title", and the
 * second must leave the other card waiting, decided on its own (#1318).
 *
 * @param text - The person's ask
 */
export function undoesStaging(text: string): boolean {
  return UNDOES_STAGING.some((re) => re.test(text));
}

/**
 * What the person is told the staging did, said just above the card: the
 * card a revision replaced — and the separate card it withdraws, when that
 * card was the mistake it corrects — or the cards a separate proposal posts
 * beside. Null when a separate proposal posts alone.
 */
export function stagingNote(
  matter: CardMatter,
  live: readonly PendingProposal[],
  withdrawn?: PendingProposal,
): { kind: "revised"; replaced: string; withdrawn?: string } | { kind: "staged-beside"; waiting: string[] } | null {
  if (matter.kind === "revision") {
    return { kind: "revised", replaced: cardHeadline(matter.of), ...(withdrawn ? { withdrawn: cardHeadline(withdrawn) } : {}) };
  }
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
 * card is touched: an issue update on the same issue, read as the same-target
 * rule reads it (`sameWriteTarget`: "#12", " 12" and 12 are one issue, in one
 * repo), an issue create under the same title. Any other tool is matched by
 * the tool alone.
 */
function sameTool(a: ProposalOperation, b: ProposalOperation): boolean {
  if (a.toolName !== b.toolName) return false;
  if (a.toolName === "github_issue_update") return sameWriteTarget(a, b);
  if (a.toolName === "github_issue_create") {
    const title = (op: ProposalOperation) => String(op.input.title ?? "").trim().toLowerCase();
    return title(a) === title(b);
  }
  return true;
}
