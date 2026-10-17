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
//     turns a revision the model named into a separate proposal — and never
//     moves it to another card either. A batch that names one live card and
//     writes another's target is refused (`aimed-elsewhere`), both cards left
//     waiting: revising the named card would leave two cards on one target,
//     and revising the other would retire a card the model did not name.
//   • A card the Worker staged under a key of its own (a sweep card, an item
//     of a decision report, a follow-through draft) is revised by a batch
//     that touches it, as before: the model never staged it and may not know
//     to name it.
//
// `cardMatter` is the one place the call is made, so it is where the usage
// record's revision-or-separate telemetry hooks in (#1320): its `why` says
// who decided.

import { cardHeadline, sameWriteTarget, type IssueRepoOf } from "../agent/card-identity";
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
  /** The model named `named` as the card it revises, but the batch writes
   *  the page or issue `other` writes. Staged as neither: refused. */
  | { kind: "aimed-elsewhere"; named: PendingProposal; other: PendingProposal }
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
 * @param facts.repoOf - The repo an issue change's `repo` input resolves to,
 *   so an issue named without one is read as the default repo's.
 * @param threadState - The two reads a decision report's fixes need.
 */
export async function cardMatter(
  facts: {
    live: readonly PendingProposal[];
    pending: PendingProposal | null;
    operations: readonly ProposalOperation[];
    named?: string;
    userId: string;
    repoOf: IssueRepoOf;
  },
  threadState: Pick<ThreadState, "getReport" | "getProposalByTs">,
): Promise<CardMatter> {
  const { live, pending, operations, repoOf } = facts;
  if (pending && isTurnCard(pending) && pending.revising?.userId === facts.userId) {
    return { kind: "revision", of: pending, why: "sent-back" };
  }
  const sameTarget = live.find((card) =>
    operations.some((op) => proposalOperations(card).some((own) => sameWriteTarget(op, own, repoOf))),
  );
  const named = facts.named ? live.find((card) => card.proposalTs === facts.named) : undefined;
  if (sameTarget && named && sameTarget.proposalTs !== named.proposalTs) {
    return { kind: "aimed-elsewhere", named, other: sameTarget };
  }
  if (sameTarget) return { kind: "revision", of: sameTarget, why: "same-target" };
  if (named) return { kind: "revision", of: named, why: "named" };
  const touched = await workerCardTouched(live, operations, repoOf, threadState);
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
 *     first one"). The card stays waiting, decided on its own: the turn never
 *     withdraws a card for the person (Bill, 2026-10-17), and the line above
 *     the revision says which card it replaced, so they can cancel the other;
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
 * @param facts.repoOf - The repo an issue change's `repo` input resolves to
 */
export function correctedCard(facts: {
  matter: CardMatter;
  live: readonly PendingProposal[];
  operations: readonly ProposalOperation[];
  previousAsk: string | undefined;
  repoOf: IssueRepoOf;
}): PendingProposal | undefined {
  const { matter, previousAsk } = facts;
  if (!previousAsk || matter.kind === "aimed-elsewhere") return undefined;
  const previous = facts.live.find((card) => card.userMsgTs === previousAsk && card.stagedAs);
  if (!previous) return undefined;
  if (matter.kind === "separate") {
    const overlaps = facts.operations.some((op) => proposalOperations(previous).some((own) => sameWriteTarget(op, own, facts.repoOf)));
    return previous.stagedAs === "revision" && overlaps ? previous : undefined;
  }
  if (matter.why === "sent-back" || matter.why === "touched") return undefined;
  return previous.stagedAs === "separate" && matter.of.proposalTs !== previous.proposalTs ? previous : undefined;
}

/**
 * What the person is told the staging did, said just above the card: the
 * card a revision replaced, or the cards a separate proposal posts beside.
 * Null when a separate proposal posts alone.
 */
export function stagingNote(
  matter: Extract<CardMatter, { kind: "revision" | "separate" }>,
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
  repoOf: IssueRepoOf,
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
        if (look?.state === "found" && touchesCard(operations, look.proposal, repoOf)) return look.proposal;
      }
      continue;
    }
    if (touchesCard(operations, card, repoOf)) return card;
  }
  return null;
}

/**
 * Whether a batch touches a keyed card: for a sweep card, replaces one of its
 * blocks; for any other, aims one of its tools at the same target.
 */
function touchesCard(operations: readonly ProposalOperation[], card: PendingProposal, repoOf: IssueRepoOf): boolean {
  if (card.sweepRun) {
    const theirs = replacedBlocks(proposalOperations(card));
    return [...replacedBlocks(operations)].some((b) => theirs.has(b));
  }
  const theirs = proposalOperations(card);
  return operations.some((op) => theirs.some((own) => sameTool(op, own, repoOf)));
}

/**
 * Whether two operations use the same tool on the same target, as a keyed
 * card is touched: a Notion update or archive of the same page, or an issue
 * update on the same issue, read as the same-target rule reads them
 * (`sameWriteTarget`: one page id, however linked; "#12", " 12" and 12 are
 * one issue, in one repo); an issue create under the same title. Any other
 * tool — a Notion create among them, so a keyed draft is revised by the turn
 * that rewrites it unnamed — is matched by the tool alone.
 */
function sameTool(a: ProposalOperation, b: ProposalOperation, repoOf: IssueRepoOf): boolean {
  if (a.toolName !== b.toolName) return false;
  switch (a.toolName) {
    case "notion_update":
    case "notion_archive":
    case "github_issue_update":
      return sameWriteTarget(a, b, repoOf);
    case "github_issue_create": {
      const title = (op: ProposalOperation) => String(op.input.title ?? "").trim().toLowerCase();
      return title(a) === title(b);
    }
    default:
      return true;
  }
}
