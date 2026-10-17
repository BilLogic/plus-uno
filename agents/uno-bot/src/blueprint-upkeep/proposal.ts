// An idea set beside today's blueprint, offered as a proposal the requester
// can draw on it.
//
// Under a comparison — the blueprint check's results (`./check.ts`), or an IDE
// hand-off's reply (`./milestone.ts`) — the idea's rows are drafted against
// the matched path and a ✅ card is posted: "Draft this on the
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
// a path with no cells shows nothing. A moment the path has no step for is
// drawn in the cell of the nearest step it belongs to, and the missing step is
// named on the card as a gap: the Worker cannot add a step (ADR-034), and an
// idea that only adds new moments would otherwise draw no cell at all.
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
import { draftPrompt, noDraftReason, noDraftWords, readDraft, thinkingSpent, type DraftedChange, type NoDraftReason, type PathToday } from "./draft";
import { MAX_TOKENS } from "../agent/loop-policy";
import type { ServiceChangeInput } from "./gate";
import type { Comparison } from "./milestone";
import type { DrawnProposal } from "./proposal-records";
import { CARD_WINDOW_WORDS } from "../card-expiry";

/** The status a proposal's rows are written at. */
export const PROPOSED = "proposed" as const;
/** The tier the draft runs on (see the header). */
export const PROPOSAL_DRAFT_TIER = "default" as const;
/**
 * The proposal draft's output ceiling: a turn's own (`MAX_TOKENS`). Thinking
 * spends the same ceiling as the JSON, and a one-shot cannot bound its
 * thinking (a tier is model and level together, ADR-028), so the draft gets
 * the room a turn has for the same all-thinking risk; at 8,000 a medium-level
 * draft was cut off before its JSON. Only the check runs it, off the thread's
 * turns on a runner of its own, so the longer think costs no one a wait.
 * Shipped-work drafts keep their own (`DRAFT_MAX_TOKENS`).
 */
export const PROPOSAL_MAX_TOKENS = MAX_TOKENS;
/** External subrequests an offer spends: the draft (1) and the card (1). */
export const PROPOSAL_OFFER_SUBREQUESTS = 2;
/** The card's slot in its thread is `blueprint-proposal:<scenario>`. */
export const PROPOSAL_SLOT_PREFIX = "blueprint-proposal:";

export const PROPOSAL_CARD_WORDS: StatedCardWords = {
  cancelled: "Rejected, nothing drafted on the blueprint",
  expired: `That card closed after ${CARD_WINDOW_WORDS} with no decision, so nothing was drafted on the blueprint.`,
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

/**
 * Why a draft makes no offer, in the three kinds its check tells apart:
 *   `nothing-to-draw` — the model answered and the idea draws no cell: no
 *     rows at all, rows that only remove moments, or only steps or lanes the
 *     path lacks (`NoDraftReason` `empty`, `removes-only`, `needs-steps`).
 *     The results say all there is.
 *   `unfinished` — no usable answer: the model failed or was aborted, the
 *     reply was cut off at the ceiling or could not be read, its rows were
 *     off the path's grid or none could be written, or the budget had no
 *     room for the call. The results still post, and the check says no
 *     proposal was drafted, with Check again: a second try can answer.
 *   `no-scenario` — today's path came without its scenario, which the new
 *     path is created in. Asked before the model is, and no second try can
 *     mend it, so the check fails as a path it could not read.
 */
export type NoProposal = "nothing-to-draw" | "unfinished" | "no-scenario";

/** Which reasons are the idea's own answer: it draws nothing. */
const DRAWS_NOTHING: ReadonlySet<NoDraftReason["kind"]> = new Set(["empty", "removes-only", "needs-steps"]);

/** Drafts the idea a comparison carries, or says why there is nothing to
 *  offer (`NoProposal`). `signal` aborts the model call in flight (a stopped
 *  check, or one past its deadline), which is `unfinished`; the check reads
 *  its own signal to say which. */
export type ProposalDrafter = (comparison: Comparison, idea: ServiceChangeInput, signal?: AbortSignal) => Promise<ProposalDraft | NoProposal>;

export const PROPOSAL_SYSTEM = [
  "You keep a service blueprint. Someone is exploring an idea that changes how one path works today. You are shown the idea, and the path as it is today: its steps, its lanes, and each cell (the square where a step meets a lane) with its text.",
  "Draft the row changes this idea makes to THIS path. They are drawn as a proposal on a new path beside today's, so today's cells stay as they are.",
  "- Use only the step ids and lane ids you are shown; never invent an id. If the idea adds a moment the path has no step for, draw it in the cell of the nearest step it belongs to, and name the missing step in new_steps_or_lanes. Name a missing lane there too.",
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
 * Why a reply `readProposalDraft` read as nothing makes no offer.
 *
 * @param reply - The model's text
 * @param comparison - The comparison it was drafted from
 * @param idea - The idea's title and text
 * @param cutOff - Whether the reply stopped at the output ceiling
 */
export function noProposalReason(reply: string, comparison: Comparison, idea: ServiceChangeInput, cutOff?: boolean): NoDraftReason {
  const { today } = comparison;
  if (!today.scenarioId) return { kind: "no-scenario" };
  const input = { title: idea.title, text: idea.text, today, target: PROPOSED };
  if (!cutOff && readDraft(reply, input)) return { kind: "removes-only" };
  return noDraftReason(reply, input, cutOff);
}

/**
 * Why a reply `readProposalDraft` read as nothing makes no offer, in a log
 * line's words.
 *
 * @param reply - The model's text
 * @param comparison - The comparison it was drafted from
 * @param idea - The idea's title and text
 * @param cutOff - Whether the reply stopped at the output ceiling
 */
export function whyNoProposal(reply: string, comparison: Comparison, idea: ServiceChangeInput, cutOff?: boolean): string {
  return noDraftWords(noProposalReason(reply, comparison, idea, cutOff));
}

/**
 * The reason a check aborts with at its deadline (`CHECK_DEADLINE_MS`), named
 * so an aborted draft can tell it from Stop's, whose reason is the bare
 * AbortError.
 */
export class CheckPastDeadline extends Error {
  constructor() {
    super("the blueprint check ran past its deadline");
    this.name = "CheckPastDeadline";
  }
}

/** Why an aborted draft was aborted, in a log line's words. */
function abortedBecause(signal: AbortSignal): string {
  const reason: unknown = signal.reason;
  return reason instanceof Error && reason.name === "CheckPastDeadline" ? reason.message : "the check was stopped";
}

/**
 * The drafter, over its ports. Fails quiet: any error is no offer, and is
 * `unfinished` (`NoProposal`). Each answer logs its thinking spend against
 * the ceiling, so the ceiling is sized from what drafts cost.
 *
 * @param deps - The model and the budget
 */
export function draftProposal(deps: ProposalDraftDeps): ProposalDrafter {
  return async (comparison, idea, signal) => {
    const say = (why: string) => console.log(`[proposal] ${comparison.scenario}: no offer — ${why}`);
    // Asked before the model is: nothing it answers can be drawn.
    if (!comparison.today.scenarioId) {
      say(noDraftWords({ kind: "no-scenario" }));
      return "no-scenario";
    }
    const input = { title: idea.title, text: idea.text, today: comparison.today, target: PROPOSED };
    try {
      if (!deps.affordable()) {
        console.warn(`[proposal] ${comparison.scenario}: no offer — the budget had no room for the draft`);
        return "unfinished";
      }
      const reply = await deps.provider.generate({
        tier: PROPOSAL_DRAFT_TIER,
        system: PROPOSAL_SYSTEM,
        prompt: draftPrompt(input),
        maxTokens: PROPOSAL_MAX_TOKENS,
        ...(signal ? { signal } : {}),
      });
      // An abort comes back as a failed call: Stop pressed, or the deadline,
      // is not the model failing, and a log that said so points at a fault
      // that is not there.
      if (signal?.aborted) {
        say(abortedBecause(signal));
        return "unfinished";
      }
      if (!reply.ok) {
        console.warn(`[proposal] ${comparison.scenario}: no offer — the model failed: ${reply.message}`);
        return "unfinished";
      }
      const spent = thinkingSpent(reply, PROPOSAL_MAX_TOKENS);
      const draft = readProposalDraft(reply.text, comparison, idea);
      if (draft) {
        if (spent) console.log(`[proposal] ${comparison.scenario}: drafted${spent}`);
        return draft;
      }
      const reason = noProposalReason(reply.text, comparison, idea, reply.cutOff);
      say(`${noDraftWords(reason)}${spent}`);
      return DRAWS_NOTHING.has(reason.kind) ? "nothing-to-draw" : "unfinished";
    } catch (err) {
      if (signal?.aborted) say(abortedBecause(signal));
      else console.warn(`[proposal] draft skipped: ${err instanceof Error ? err.message : String(err)}`);
      return "unfinished";
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
    `*The ask:* Approve creates the path at ${code(PROPOSED)} and writes these cells on it, as uno-bot, all or nothing; today's path is not touched. Only the person who asked can approve; Reject, or no answer before it expires, writes nothing.`,
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
