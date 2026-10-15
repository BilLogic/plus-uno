// An idea set beside today's blueprint, offered as a proposal the requester
// can draw on it.
//
// Under a milestone's comparison (`./milestone.ts`) the turn drafts the idea's
// rows on the matched path and posts a ✅ card: "Draft this on the blueprint
// as a proposal?". The card's one operation is a blueprint revision at
// `proposed` (`revisionCard`), and its only confirmer is the person who asked
// — the deployment's standing confirmers are not added. ✅ writes the rows
// through the gated writer; ⛔ or no answer writes nothing. Once the write is
// back, the thread → rows record is kept (`drawnProposalOf`,
// `./proposal-records.ts`) for linking the rows to the Roadmap card the PRD
// becomes and for offering their removal later.
//
// BESIDE, NEVER OVER. A blueprint slot (step × lane on a path) holds one cell,
// and today's cells are product truth (ADR-021). A proposal therefore only
// ADDS cells on empty slots: a drafted change to a cell that exists, or a
// deprecation, would rewrite today's journey for an idea nobody has shipped,
// so it is left out and named on the card. A draft with nothing to add is no
// offer.
//
// THE DEFAULT TIER. The draft is an idea's few rows on a path already read and
// matched, offered to the person who is waiting on the reply, and it lands as
// `proposed` — the status that says "not decided" — behind their own ✅. The
// grind tier is for revisions of shipped work, where the rows become today's
// truth; here its latency and its capacity fallback buy nothing a reviewer
// would see.
//
// PURE: the model and the budget arrive as ports.

import type { ModelProvider } from "../agent/model-provider";
import type { OperationOutcome } from "../gate/index";
import { readRevision, revisionCard, type BlueprintRevision } from "../blueprint-write/index";
import { escapeSlackText } from "../slack/mrkdwn";
import type { PendingProposal, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/delivery";
import { draftPrompt, readDraft, type DraftedChange } from "./draft";
import type { ServiceChangeInput } from "./gate";
import type { Comparison } from "./milestone";
import type { DrawnProposal } from "./proposal-records";

/** The status a proposal's rows are written at. */
export const PROPOSED = "proposed" as const;
/** The tier the draft runs on (see the header). */
export const PROPOSAL_DRAFT_TIER = "default" as const;
/** External subrequests an offer spends: the draft (1) and the card (1). */
export const PROPOSAL_OFFER_SUBREQUESTS = 2;
/** How long the card can be decided: a working day, and the night after it. */
export const PROPOSAL_CARD_TTL_MS = 24 * 60 * 60 * 1000;
/** The card's slot in its thread is `blueprint-proposal:<scenario>`. */
export const PROPOSAL_SLOT_PREFIX = "blueprint-proposal:";

export const PROPOSAL_CARD_WORDS: StatedCardWords = {
  cancelled: "Rejected, nothing drafted on the blueprint",
  expired: `That card closed after ${PROPOSAL_CARD_TTL_MS / 3_600_000} h with no decision, so nothing was drafted on the blueprint.`,
};

/** An idea's rows on one path, ready to offer. */
export interface ProposalDraft {
  comparison: Comparison;
  revision: BlueprintRevision;
  /** The rows as the card shows them, in the revision's order: all `added`. */
  changes: DraftedChange[];
  confidence: number;
  /** What the draft could not verify, and what it left out. */
  gaps: string[];
}

export interface ProposalDraftDeps {
  provider: ModelProvider;
  /** Whether the turn has `PROPOSAL_OFFER_SUBREQUESTS` left beside its delivery. */
  affordable(): boolean;
}

/** Drafts the idea a comparison carries; null when there is nothing to offer. */
export type ProposalDrafter = (comparison: Comparison, idea: ServiceChangeInput) => Promise<ProposalDraft | null>;

export const PROPOSAL_SYSTEM = [
  "You keep a service blueprint. Someone is exploring an idea that changes how one path works today. You are shown the idea, and the path as it is today: its steps, its lanes, and each cell (the square where a step meets a lane) with its text.",
  "Draft the cells this idea would ADD to this path, as a proposal shown beside today's cells.",
  "- Use only the step ids and lane ids you are shown. If the idea needs a step or a lane the path does not have, do not invent an id: name it in new_steps_or_lanes.",
  "- Add only where a step and a lane have no cell yet. Where the idea changes or removes a cell that exists, do not draft it: say so in gaps.",
  "- Write each cell's text the way the path's cells are written: one short sentence about what that actor does at that step.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"rows":[{"change":"added","step_id":"","lane_id":"","content":""}],"new_steps_or_lanes":[],"confidence":0.0,"gaps":[]}',
].join("\n");

const slotName = (c: Pick<DraftedChange, "step" | "lane">) => `${c.step} (${c.lane})`;

/**
 * Read a proposal draft against the path: the additions are kept, every change
 * to a cell that exists becomes a gap.
 *
 * @param reply - The model's text
 * @param comparison - The comparison it was drafted from
 * @param idea - The idea's title and text
 * @returns The draft, or null when it adds nothing
 */
export function readProposalDraft(reply: string, comparison: Comparison, idea: ServiceChangeInput): ProposalDraft | null {
  const read = readDraft(reply, { title: idea.title, text: idea.text, today: comparison.today, target: PROPOSED });
  if (!read) return null;
  const rows: BlueprintRevision["rows"] = [];
  const changes: DraftedChange[] = [];
  const gaps = [...read.gaps];
  read.revision.rows.forEach((row, i) => {
    const change = read.changes[i]!;
    if (row.from === null) {
      rows.push(row);
      changes.push(change);
    } else {
      gaps.push(`left out the ${change.kind === "deprecated" ? "removal" : "change"} at ${slotName(change)}: a proposal sits beside today's cells and never writes over one`);
    }
  });
  if (!rows.length) return null;
  const { path: _pathStatus, ...revision } = read.revision;
  return { comparison, revision: { ...revision, rows }, changes, confidence: read.confidence, gaps };
}

/**
 * The drafter, over its ports. Fails quiet: any error is no offer.
 *
 * @param deps - The model and the budget
 */
export function draftProposal(deps: ProposalDraftDeps): ProposalDrafter {
  return async (comparison, idea) => {
    try {
      if (!deps.affordable()) return null;
      const reply = await deps.provider.generate({
        tier: PROPOSAL_DRAFT_TIER,
        system: PROPOSAL_SYSTEM,
        prompt: draftPrompt({ title: idea.title, text: idea.text, today: comparison.today, target: PROPOSED }),
        maxTokens: 2_000,
      });
      if (!reply.ok) return null;
      const draft = readProposalDraft(reply.text, comparison, idea);
      if (!draft) console.log(`[proposal] ${comparison.scenario}: the draft adds nothing beside today's cells`);
      return draft;
    } catch (err) {
      console.warn(`[proposal] draft skipped: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };
}

const code = (word: string) => `\`${word.replace(/`/g, "'")}\``;
const esc = escapeSlackText;

/**
 * The offer as a card: blueprint words only, the rows it writes, and who may
 * approve.
 *
 * @param draft - The drafted proposal
 */
export function proposalOfferCard(draft: ProposalDraft): ProposalCard {
  const { today } = draft.comparison;
  const place = `${today.scenario} › ${today.path}`;
  const lead = [
    "*Draft this on the blueprint as a proposal?*",
    `*${esc(place)}* · rows → ${code(PROPOSED)}${today.link ? ` · <${today.link}|open the path>` : ""}`,
    "*Proposed*",
    ...draft.changes.map((c) => `• Added ${esc(c.step)} (${esc(c.lane)}): ${esc(c.content)}`),
    `*Confidence:* ${draft.confidence.toFixed(1)}`,
    ...(draft.gaps.length ? [`*Could not draft:* ${draft.gaps.map(esc).join("; ")}`] : []),
    `*The ask:* Approve writes these rows to the blueprint as ${code(PROPOSED)}, beside today's cells, as uno-bot, all or nothing. Only the person who asked can approve; Reject, or no answer in ${PROPOSAL_CARD_TTL_MS / 3_600_000} h, writes nothing.`,
  ].join("\n");
  const operation = revisionCard(draft.revision, []).operations![0]!;
  return { kind: "stated", verb: "draft this on the blueprint as a proposal", lead, footer: "", fields: [], caveats: [], operations: [operation] };
}

/** The card's slot in its thread: one per scenario, as the comparison is. */
export function proposalSlotKey(scenario: string): string {
  return `${PROPOSAL_SLOT_PREFIX}${scenario.trim().toLowerCase()}`;
}

/**
 * The offer as staged, once its card is posted: the revision as its one
 * operation, the requester as its only confirmer, its own slot in the thread.
 *
 * @param draft - The drafted proposal
 * @param at - The thread, the requester, and the posted card
 */
export function stagedProposalOffer(
  draft: ProposalDraft,
  at: {
    channel: string;
    threadTs: string;
    replyTs?: string;
    userMsgTs: string;
    requesterUserId: string;
    proposalTs: string;
    proposalText: string;
  },
): PendingProposal {
  return {
    ...revisionCard(draft.revision, [at.requesterUserId]),
    channel: at.channel,
    threadTs: at.threadTs,
    ...(at.replyTs ? { replyTs: at.replyTs } : {}),
    userMsgTs: at.userMsgTs,
    proposalTs: at.proposalTs,
    proposalText: at.proposalText,
    requesterUserId: at.requesterUserId,
    ttlMs: PROPOSAL_CARD_TTL_MS,
    supersedeKey: proposalSlotKey(draft.comparison.scenario),
    stated: PROPOSAL_CARD_WORDS,
  };
}

/**
 * What a decided offer drew on the blueprint, to keep: its thread and the
 * rows written. Null for any other card, a ⛔ (no outcomes), or a write that
 * did not land.
 *
 * @param proposal - The decided card
 * @param outcomes - What its batch ran; undefined for a ⛔
 * @param at - When, epoch ms
 */
export function drawnProposalOf(
  proposal: PendingProposal,
  outcomes: readonly OperationOutcome[] | undefined,
  at: number,
): DrawnProposal | null {
  if (!proposal.supersedeKey?.startsWith(PROPOSAL_SLOT_PREFIX) || !outcomes) return null;
  const written = outcomes.find((o) => o.toolName === "blueprint_revise" && o.ok);
  if (!written) return null;
  const revision = readRevision(written.input ?? proposal.input);
  if ("error" in revision) return null;
  return {
    proposalTs: proposal.proposalTs,
    channel: proposal.channel,
    threadTs: proposal.threadTs,
    replyTs: proposal.replyTs ?? proposal.userMsgTs,
    requesterId: proposal.requesterUserId,
    pathId: revision.pathId,
    rows: revision.rows.map((r) => ({ laneId: r.laneId, stepId: r.stepId })),
    writtenAt: at,
    cardId: null,
  };
}
