// A drawn proposal linked to the Roadmap card its thread's PRD becomes.
//
// THE SIGNAL. draft-a-prd's exit is `notion_create` on the `prd` surface, and
// that surface creates the Roadmap card itself — a Roadmap row whose body is
// the PRD. So the card a thread's PRD becomes is exactly the page its ✅'d
// `notion_create` wrote, read off the result's own URL. No search, no guess,
// no Notion read: the link costs one record write, and it holds whichever
// lands first in the thread —
//   • the PRD after the proposal: its outcome links the thread's proposals;
//   • the proposal after the PRD: the thread's card is remembered when the PRD
//     is written, and the proposal is linked as it is kept.
// A PRD written anywhere else — in the IDE, by hand — leaves the proposal
// unlinked, and a shipped card with no linked proposal drafts as before.
//
// A card id is kept as Notion's bare id: no dashes, lower case (`cardKey`),
// the shape the Roadmap query's dashed ids are compared in.
//
// PURE: the records and the thread's remembered card arrive as ports.

import type { OperationOutcome } from "../gate/index";
import { parseNotionPageId } from "../integrations/notion";
import type { PendingProposal } from "../thread-state/index";
import { drawnProposalOf } from "./proposal";
import type { ProposalRecords } from "./proposal-records";

/** The Roadmap card a thread's PRD created, kept by thread. */
export interface ThreadCards {
  cardOf(channel: string, threadTs: string): Promise<string | null>;
  remember(channel: string, threadTs: string, cardId: string): Promise<void>;
}

/** A Notion page id as the link keeps it: bare, lower case. */
export function cardKey(pageId: string): string {
  return pageId.replace(/-/g, "").toLowerCase();
}

/**
 * The Roadmap card a batch's PRD created; null when it wrote none.
 *
 * @param outcomes - What a decided card's batch ran
 */
export function prdCardOf(outcomes: readonly OperationOutcome[] | undefined): string | null {
  return prdPageOf(outcomes)?.id ?? null;
}

/** The Roadmap page a batch's PRD created, as its result named it: the page's
 *  bare id and its URL; null when it wrote none. */
function prdPageOf(outcomes: readonly OperationOutcome[] | undefined): { id: string; url: string } | null {
  for (const o of outcomes ?? []) {
    if (o.toolName !== "notion_create" || !o.ok) continue;
    let result: { ok?: unknown; surface?: unknown; url?: unknown };
    try {
      result = JSON.parse(o.result) as typeof result;
    } catch {
      continue;
    }
    const surface = typeof result.surface === "string" ? result.surface : String(o.input?.surface ?? "");
    if (result.ok !== true || surface.toLowerCase() !== "prd" || typeof result.url !== "string") continue;
    const id = parseNotionPageId(result.url);
    if (id) return { id: cardKey(id), url: result.url };
  }
  return null;
}

/**
 * The Roadmap page each PRD matter's ✅ created, kept by the card's matter
 * (`PendingProposal.supersedeKey`) rather than its thread (#1323): a thread
 * can hold several PRDs now, each its own matter, and a check's results
 * offer to update the page of the PRD they were checked against.
 */
export interface MatterPages {
  pageOf(channel: string, matter: string): Promise<string | null>;
  remember(channel: string, matter: string, pageUrl: string): Promise<void>;
}

/**
 * Keep the page a decided PRD card created under the card's matter. Nothing
 * for a ⛔, a write that did not land, or a card with no matter (one staged
 * before turn cards had keys). Best-effort: a failure is logged, and the page
 * stands.
 *
 * @param pages - Where the matter's page is kept
 * @param proposal - The decided card
 * @param outcomes - What its batch ran; undefined for a ⛔
 */
export async function rememberCreatedPage(
  pages: MatterPages,
  proposal: Pick<PendingProposal, "channel" | "supersedeKey" | "proposalTs">,
  outcomes: readonly OperationOutcome[] | undefined,
): Promise<void> {
  const page = prdPageOf(outcomes);
  if (!page || !proposal.supersedeKey) return;
  try {
    await pages.remember(proposal.channel, proposal.supersedeKey, page.url);
  } catch (err) {
    warn(`the page ${proposal.proposalTs} created not kept`, err);
  }
}

export interface LinkDeps {
  records: ProposalRecords;
  /** Null where nothing can remember a thread's card: a PRD first then links nothing later. */
  threadCards: ThreadCards | null;
  now(): number;
}

const warn = (what: string, err: unknown) => console.error(`[proposal] ${what}: ${err instanceof Error ? err.message : String(err)}`);

/**
 * What a decided card means for the thread's proposals: a drawn proposal is
 * kept (and linked, when the thread's PRD already became a card); a written
 * PRD links the thread's proposals to its card. Best-effort, each step on its
 * own: a failure is logged, and what was written stands.
 *
 * @param deps - The records, the thread's remembered card and the clock
 * @param proposal - The decided card
 * @param outcomes - What its batch ran; undefined for a ⛔
 */
export async function keepProposalLinks(
  deps: LinkDeps,
  proposal: PendingProposal,
  outcomes: readonly OperationOutcome[] | undefined,
): Promise<void> {
  const { channel, threadTs } = proposal;
  const drawn = drawnProposalOf(proposal, outcomes, deps.now());
  if (drawn) {
    try {
      await deps.records.record(drawn);
      const card = deps.threadCards ? await deps.threadCards.cardOf(channel, threadTs) : null;
      if (card) await deps.records.linkCard(channel, threadTs, card);
    } catch (err) {
      warn(`rows of ${proposal.proposalTs} not recorded`, err);
    }
  }
  const card = prdCardOf(outcomes);
  if (!card) return;
  try {
    await deps.threadCards?.remember(channel, threadTs, card);
    await deps.records.linkCard(channel, threadTs, card);
  } catch (err) {
    warn(`the thread's proposals not linked to ${card}`, err);
  }
}
