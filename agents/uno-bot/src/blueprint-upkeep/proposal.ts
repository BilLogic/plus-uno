// An idea set beside today's blueprint, offered as a proposal the requester
// can draw on it.
//
// Under a milestone's comparison (`./milestone.ts`) the turn drafts the idea's
// rows against the matched path and posts a ✅ card: "Draft this on the
// blueprint as a proposal?". The card's one operation is a blueprint revision
// with a `variant` (`revisionCard`), and its only confirmer is the person who
// asked — the deployment's standing confirmers are not added. ✅ draws the
// idea through the gated writer; ⛔ or no answer writes nothing. Once the write
// is back, the thread → rows record is kept (`drawnProposalOf`,
// `./proposal-records.ts`) for linking the rows to the Roadmap card the PRD
// becomes and for offering their removal later.
//
// A NEW PATH BESIDE TODAY'S, NEVER OVER IT. Today's cells are product truth
// (ADR-021), so a proposal is drawn as a new `proposed` `variant` path in the
// same scenario, with today's lanes and step order, and the idea's cells are
// written there at `proposed`: a cell it adds and a cell it changes alike. A
// moment the idea removes is named on the card and left empty on the new path;
// nothing of today's path is written. An idea that only removes is no offer —
// a path with no cells shows nothing.
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
import { readRevision, revisionCard, VARIANT_KIND, type BlueprintRevision } from "../blueprint-write/index";
import { escapeSlackText } from "../slack/mrkdwn";
import type { BlueprintProposalFacts, PendingProposal, StatedCardWords } from "../thread-state/index";
import { proposalFacts } from "./facts";
import type { ProposalCard } from "../turn/delivery";
import { draftPrompt, readDraft, type DraftedChange, type PathToday } from "./draft";
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
  /** The rows as the card shows them, in the revision's order: added or changed. */
  changes: DraftedChange[];
  /** Today's cells the idea removes: named, and left empty on the new path. */
  removed: DraftedChange[];
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
  "Draft the row changes this idea makes to THIS path. They are drawn as a proposal on a new path beside today's, so today's cells stay as they are.",
  "- Use only the step ids and lane ids you are shown. If the idea needs a step or a lane the path does not have, do not invent an id: name it in new_steps_or_lanes.",
  "- added: a cell where a step and a lane have none today. changed: a cell whose text the idea changes. deprecated: a cell for a moment that no longer happens under the idea.",
  "- Write each cell's text the way the path's cells are written: one short sentence about what that actor does at that step.",
  "- Change only what the idea changes. Say in gaps what you could not verify from its text.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"rows":[{"change":"added|changed|deprecated","step_id":"","lane_id":"","content":""}],"new_steps_or_lanes":[],"confidence":0.0,"gaps":[]}',
].join("\n");

/** The longest name a drawn path takes. */
const MAX_PATH_NAME = 80;

/** The new path's name, from the idea: its title, else today's path's. */
export function proposalPathName(idea: ServiceChangeInput, today: Pick<PathToday, "path">): string {
  const title = idea.title.replace(/\s+/g, " ").trim();
  const name = title || `${today.path} (proposed)`;
  return name.length > MAX_PATH_NAME ? `${name.slice(0, MAX_PATH_NAME - 1).trimEnd()}…` : name;
}

/**
 * Read a proposal draft against the path: each added or changed cell becomes a
 * row of the new path, and each removal is named.
 *
 * @param reply - The model's text
 * @param comparison - The comparison it was drafted from
 * @param idea - The idea's title and text
 * @returns The draft, or null when it draws no cell
 */
export function readProposalDraft(reply: string, comparison: Comparison, idea: ServiceChangeInput): ProposalDraft | null {
  const { today } = comparison;
  if (!today.scenarioId) return null;
  const read = readDraft(reply, { title: idea.title, text: idea.text, today, target: PROPOSED });
  if (!read) return null;
  const rows: BlueprintRevision["rows"] = [];
  const changes: DraftedChange[] = [];
  const removed: DraftedChange[] = [];
  read.revision.rows.forEach((row, i) => {
    const change = read.changes[i]!;
    if (row.to === "deprecated") removed.push(change);
    // The new path starts empty: every cell is new there.
    else {
      rows.push({ ...row, from: null, to: PROPOSED });
      changes.push(change);
    }
  });
  if (!rows.length) return null;
  const revision: BlueprintRevision = {
    pathId: today.pathId,
    label: `${today.scenario} › ${today.path}`,
    rows,
    variant: {
      scenarioId: today.scenarioId,
      name: proposalPathName(idea, today),
      status: PROPOSED,
      lanes: Object.fromEntries(today.lanes.map((l) => [l.id, l.name])),
    },
  };
  return { comparison, revision, changes, removed, confidence: read.confidence, gaps: read.gaps };
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
      if (!draft) console.log(`[proposal] ${comparison.scenario}: the draft draws no cell`);
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
  const name = draft.revision.variant!.name;
  const at = (c: DraftedChange) => `${esc(c.step)} (${esc(c.lane)})`;
  const n = draft.revision.rows.length;
  // Short in the thread (§ B2); its Review draws the rest from its facts.
  const short = {
    summary: `*Draft as a blueprint proposal?* _${esc(today.scenario)} › ${esc(name)}_ · ${n} ${code(PROPOSED)} ${n === 1 ? "row" : "rows"}`,
    size: `New ${code("path")} beside today's _${esc(today.path)}_ · only you can decide`,
  };
  const lead = [
    "*Draft as a blueprint proposal?*",
    `*${esc(place)}* · a new ${code(PROPOSED)} ${code(VARIANT_KIND)} path beside it, “${esc(name)}”${today.link ? ` · <${today.link}|open today's path>` : ""}`,
    "*Proposed*",
    ...draft.changes.map((c) =>
      c.kind === "changed" ? `• Changes ${at(c)}: ${esc(c.before ?? "")} → ${esc(c.content)}` : `• Adds ${at(c)}: ${esc(c.content)}`,
    ),
    ...draft.removed.map((c) => `• No longer happens at ${at(c)}: ${esc(c.content)} (left empty on the new path)`),
    `*Confidence:* ${draft.confidence.toFixed(1)}`,
    ...(draft.gaps.length ? [`*Could not verify:* ${draft.gaps.map(esc).join("; ")}`] : []),
    `*The ask:* Approve creates the path at ${code(PROPOSED)} and writes these cells on it, as uno-bot, all or nothing; today's path is not touched. Only the person who asked can approve; Reject, or no answer in ${PROPOSAL_CARD_TTL_MS / 3_600_000} h, writes nothing.`,
  ].join("\n");
  const operation = revisionCard(draft.revision, []).operations![0]!;
  return { kind: "stated", verb: "draft this on the blueprint as a proposal", lead, footer: "", fields: [], caveats: [], operations: [operation], short };
}

/** The proposal as its Review pop-up draws it (`PendingProposal.facts`):
 *  today's steps beside the idea's, and what the draft could not verify,
 *  each moment it removes among them. */
export function offerFacts(draft: ProposalDraft): BlueprintProposalFacts {
  const removed = draft.removed.map((c) => `${c.step} (${c.lane}) no longer happens under the idea, so the new path leaves it empty.`);
  return proposalFacts({
    today: draft.comparison.today,
    name: draft.revision.variant!.name,
    changes: draft.changes,
    rows: draft.revision.rows.length,
    gaps: [...draft.gaps, ...removed],
  });
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
    facts: offerFacts(draft),
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
  // What the writer reported: the path it created and the cells on it.
  let result: { created_path?: unknown; cells?: unknown };
  try {
    result = JSON.parse(written.result) as typeof result;
  } catch {
    return null;
  }
  if (typeof result.created_path !== "string" || !Array.isArray(result.cells)) return null;
  return {
    proposalTs: proposal.proposalTs,
    channel: proposal.channel,
    threadTs: proposal.threadTs,
    replyTs: proposal.replyTs ?? proposal.userMsgTs,
    requesterId: proposal.requesterUserId,
    pathId: result.created_path,
    todayPathId: revision.pathId,
    cellIds: result.cells.map(String),
    writtenAt: at,
    cardId: null,
  };
}
