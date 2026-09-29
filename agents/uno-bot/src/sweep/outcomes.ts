// What became of a sweep card's items: the `sweep_items` side of a ✅, a ⛔ and
// a revision.
//
// A card is resolved by Gate like any other — the sweep adds nothing to the
// four doors. What it adds is the record, written after the fact by the two
// places that know the fact: the executor, once a batch has run
// (`agent/resolve-proposal.ts`), and the Slack turn envelope, once a turn has
// staged a revision of a sweep card (`slack/turn-adapter.ts`). Each item is
// found by its card's ts and its block id, since one item is one operation
// with one replace.
//
//   ✅ ran it      → `confirmed` when the write landed, `refused_stale` when the
//                    integration refused it because the block moved since the
//                    sweep read it, `failed` for any other error.
//   ⛔             → every item `dropped`.
//   a revision    → each item still on the new card moves to it, its 72 h
//                    restarted with the card's; each one left off is `dropped`
//                    (a reply dropping an item is how a person says "not this
//                    one").
//   no answer     → nothing: an item still `proposed` 72 h after it posted
//                    expired, and the queries read it that way.
//
// Best-effort by contract: a failed record is logged by the caller and never
// costs the person their result.
//
// PURE: the store is a parameter.

import type { OperationOutcome } from "../gate/index";
import { proposalOperations, type PendingProposal, type ProposalOperation } from "../thread-state/index";
import type { SweepItemStatus, SweepRecords } from "./store";

/** The block id an item's operation replaces, or null for any other op. */
export function replacedBlockOf(operation: Pick<ProposalOperation, "toolName" | "input">): string | null {
  if (operation.toolName !== "notion_update") return null;
  const replace = operation.input.replace;
  if (!Array.isArray(replace) || replace.length !== 1) return null;
  const entry = replace[0] as Record<string, unknown> | undefined;
  const id = entry?.block_id ?? entry?.blockId;
  return typeof id === "string" && id ? id : null;
}

/**
 * The item status one executed operation comes to. A refusal is the
 * integration saying the block moved since the read (ADR-029): nothing was
 * written, and that is `refused_stale`, not a failure.
 */
export function statusOfOutcome(outcome: Pick<OperationOutcome, "ok" | "result">): SweepItemStatus {
  if (outcome.ok) return "confirmed";
  try {
    const r = JSON.parse(outcome.result) as { refused?: unknown };
    if (Array.isArray(r.refused) && r.refused.length > 0) return "refused_stale";
  } catch {
    // not JSON — a plain failure
  }
  return "failed";
}

/**
 * Record a resolved sweep card: the batch it ran, or its ⛔.
 *
 * @param store - The records
 * @param proposal - The card that was resolved
 * @param outcomes - What its batch ran, one per operation; undefined for a ⛔
 * @param now - Epoch ms
 * @returns How many items were updated
 */
export async function recordSweepResolution(
  store: Pick<SweepRecords, "itemsForProposal" | "updateItem">,
  proposal: PendingProposal,
  outcomes: readonly OperationOutcome[] | undefined,
  now: number,
): Promise<number> {
  if (!proposal.sweepRun) return 0;
  const items = await store.itemsForProposal(proposal.proposalTs);
  let updated = 0;
  if (!outcomes) {
    for (const item of items.filter((i) => i.status === "proposed")) {
      await store.updateItem(item.itemId, { status: "dropped", resolvedAt: now });
      updated += 1;
    }
    return updated;
  }
  for (const outcome of outcomes) {
    const block = outcome.input ? replacedBlockOf({ toolName: outcome.toolName, input: outcome.input }) : null;
    const item = block ? items.find((i) => i.blockId === block && i.status === "proposed") : undefined;
    if (!item) continue;
    await store.updateItem(item.itemId, { status: statusOfOutcome(outcome), resolvedAt: now });
    updated += 1;
  }
  return updated;
}

/**
 * Record a revision of a sweep card: kept items move to the new card, the rest
 * are dropped.
 *
 * @param store - The records
 * @param replaced - The card the revision replaced
 * @param revision - The card staged in its place
 * @param now - Epoch ms
 */
export async function recordSweepRevision(
  store: Pick<SweepRecords, "itemsForProposal" | "updateItem">,
  replaced: PendingProposal,
  revision: PendingProposal,
  now: number,
): Promise<{ kept: number; dropped: number }> {
  // A card staged beside the sweep card, not in its place, carries no
  // `sweepRun` (`turn.ts`): it revised nothing.
  if (!replaced.sweepRun || !revision.sweepRun || replaced.proposalTs === revision.proposalTs) {
    return { kept: 0, dropped: 0 };
  }
  const stillThere = new Set(proposalOperations(revision).map(replacedBlockOf).filter((b): b is string => !!b));
  let kept = 0;
  let dropped = 0;
  for (const item of await store.itemsForProposal(replaced.proposalTs)) {
    if (item.status !== "proposed") continue;
    if (stillThere.has(item.blockId)) {
      // The revision lives its own 72 h from now, and the morning's liveness
      // check reads it from here.
      await store.updateItem(item.itemId, { proposalTs: revision.proposalTs, postedAt: now });
      kept += 1;
    } else {
      await store.updateItem(item.itemId, { status: "dropped", resolvedAt: now });
      dropped += 1;
    }
  }
  return { kept, dropped };
}

/**
 * Record a cut-off sweep card re-staged as a fresh one: each item whose fix
 * is still to run moves to the new card. The rest stay where they were — the
 * run that was cut off may have written them, and nothing here knows.
 *
 * @param store - The records
 * @param from - The card whose run was cut off
 * @param to - The card staged with what it never finished
 * @param now - Epoch ms: the fresh card's 72 h start here
 */
export async function recordSweepRestage(
  store: Pick<SweepRecords, "itemsForProposal" | "updateItem">,
  from: PendingProposal,
  to: PendingProposal,
  now: number,
): Promise<number> {
  if (!from.sweepRun || from.proposalTs === to.proposalTs) return 0;
  const toRun = new Set(proposalOperations(to).map(replacedBlockOf).filter((b): b is string => !!b));
  let moved = 0;
  for (const item of await store.itemsForProposal(from.proposalTs)) {
    if (item.status !== "proposed" || !toRun.has(item.blockId)) continue;
    await store.updateItem(item.itemId, { proposalTs: to.proposalTs, postedAt: now });
    moved += 1;
  }
  return moved;
}
