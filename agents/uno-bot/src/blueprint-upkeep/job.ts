// Blueprint upkeep from shipped work, end to end on named dependencies:
//
//   • the READ — the end-of-day `blueprint-shipped` job: the Roadmap cards
//     that reached `Design Status: Shipped` or `Dev Status: Deployed` since
//     the last run (one query from a cursor), each through the service-change
//     gate (`./gate.ts`) on its own words and its PRD's (`./evidence.ts`); a
//     card that passes has today's matched path read and ONE path's revision
//     drafted on the grind tier (`./draft.ts`) — `planned` rows for a design
//     hand-off, `live` for a deploy, which promotes the hand-off's rows when
//     it drafted any (`./stages.ts`) — kept in KV for the morning with its
//     place and its confirmers. A card is weighed once per status: it is
//     remembered whichever way the gate went. It posts nothing.
//   • the HAND-OVER — every morning (`blueprint-revision-post`), before the
//     sweep's post: each waiting revision is handed to the sweep's message at
//     its card's place, the posting ladder card follow-ups take (the pillar's
//     team channel, else #plus-design).
//   • the SECTION — on that place's one message, one card per revision, each
//     its own proposal: the `blueprint_revise` operation, confirmed by the
//     card's owner or Bill and nobody else (`revisionCard`). A ✅ writes the
//     rows through the gated writer (ADR-034). What staged stops waiting;
//     what did not show waits for the next morning.
//
// SEAMS LEFT FOR LATER WORK. One path per card (`ScenarioMatch` names one);
// a revision is staged as drafted, with no redraft on a reply; at most
// `MAX_CARDS_PER_RUN` cards are weighed a night, the rest waiting on the
// cursor; and the weighed set is a plain list in the same KV record.
//
// `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import type { PendingProposal } from "../thread-state/index";
import { itemProposal } from "../slack/decision-cards";
import { renderProposalCard } from "../slack/proposal-render";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import { revisionCard } from "../blueprint-write/index";
import type { ModelProvider } from "../agent/model-provider";
import type { ServiceChangeGate } from "./gate";
import { draftRevision, type Draft, type PathToday } from "./draft";
import { revisionItem, revisionItemId, revisionParent, revisionProposalCard, type RevisionSource } from "./card";
import { holdDeprecations, markWeighed, promotionDraft, STAGES, weighedAt, type PlannedRows, type ShipStage } from "./stages";

/** The section's name on the sweep's morning post. */
export const UPKEEP_SECTION = "blueprint-revisions";
/** Cards one end of day weighs; the rest wait on the cursor for the next. */
export const MAX_CARDS_PER_RUN = 2;
/** How far back a first run looks: a weekend and a day. */
export const FIRST_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;
/** How long a revision card stays confirmable. */
export const REVISION_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** Page ids remembered as weighed. */
const SEEN_KEPT = 500;
/** Design hand-offs remembered until their deploy. */
const PLANNED_KEPT = 200;

/** A Roadmap card that shipped, as the job reads it. */
export interface ShippedCard {
  pageId: string;
  url: string;
  title: string;
  number: number | null;
  /** The latest shipping moment its status holds (`./stages.ts`). */
  stage: ShipStage;
  pillars: string[];
  contributors: Array<{ id: string; name: string }>;
  /** `last_edited_time`, epoch ms. */
  lastEditedAt: number;
}

/** A drafted revision waiting for its morning. */
export interface WaitingRevision {
  source: RevisionSource;
  today: PathToday;
  draft: Draft;
  channel: string;
  owner: string | null;
  confirmers: string[];
}

/** What the job keeps between runs (one KV record). */
export interface UpkeepState {
  /** ISO time the next read starts from; null before the first run. */
  cursor: string | null;
  /** Cards already weighed, as `pageId@stage`, newest last. */
  seen: string[];
  waiting: WaitingRevision[];
  /** What each design hand-off drafted, for its deploy to promote. */
  planned?: PlannedRows[];
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

export interface ShippedDeps {
  roadmap: {
    /** Cards in `Design Status: Shipped` or `Dev Status: Deployed` edited at
     *  or after `since` (ISO). */
    shippedSince(since: string): Promise<ShippedCard[]>;
  };
  /** The card's words: its page text and its PRD's (`./evidence.ts`). The
   *  one input boundary, so a code reader can be added behind it. */
  evidence(card: ShippedCard): Promise<string>;
  gate: ServiceChangeGate;
  /** Today's path holding this cell; null when it cannot be read. */
  readPath(cellId: string): Promise<PathToday | null>;
  provider: ModelProvider;
  /** The card owner's Slack id: its first Contributor, when one is found. */
  ownerOf(card: ShippedCard): Promise<string | null>;
  /** The card's place by the posting ladder; null when none is configured. */
  placeOf(card: ShippedCard): string | null;
  /** Bill's Slack id (`LEAD_USER_ID`), the other confirmer. */
  billId: string | null;
  state: Store<UpkeepState>;
  now(): number;
}

export interface ShippedReport {
  drafted: number;
  summary: string;
}

const EMPTY: UpkeepState = { cursor: null, seen: [], waiting: [] };

/**
 * The end-of-day read.
 *
 * @param deps - The Roadmap, the gate, the path read, the model and the store
 * @param opts - `dryRun` weighs and drafts and keeps nothing
 */
export async function runShippedRevisions(deps: ShippedDeps, opts: { dryRun?: boolean } = {}): Promise<ShippedReport> {
  const state = (await deps.state.read()) ?? EMPTY;
  const startedAt = new Date(deps.now()).toISOString();
  const since = state.cursor ?? new Date(deps.now() - FIRST_LOOKBACK_MS).toISOString();
  const seen = new Set(state.seen);
  const fresh = (await deps.roadmap.shippedSince(since)).filter((c) => !weighedAt(seen, c.pageId, c.stage));
  const batch = fresh.slice(0, MAX_CARDS_PER_RUN);

  const drafted: WaitingRevision[] = [];
  const skipped: string[] = [];
  let planned = state.planned ?? [];
  let waiting = state.waiting;
  for (const card of batch) {
    const outcome = await weigh(deps, card, planned.find((p) => p.pageId === card.pageId) ?? null);
    markWeighed(seen, card.pageId, card.stage);
    if (card.stage === "deployed") {
      // The hand-off's rows are promoted or drafted afresh now, either way.
      planned = planned.filter((p) => p.pageId !== card.pageId);
      waiting = waiting.filter((w) => w.source.pageId !== card.pageId);
    }
    if (typeof outcome === "string") skipped.push(`${card.title}: ${outcome}`);
    else {
      drafted.push(outcome.revision);
      if (outcome.planned) planned = [...planned, outcome.planned];
    }
  }

  if (!opts.dryRun) {
    await deps.state.write({
      // Past every card only once every card was weighed.
      cursor: fresh.length > batch.length ? state.cursor ?? since : startedAt,
      seen: [...seen].slice(-SEEN_KEPT),
      waiting: [...waiting, ...drafted],
      planned: planned.slice(-PLANNED_KEPT),
    });
  }
  const verb = opts.dryRun ? "would keep" : "kept";
  return {
    drafted: drafted.length,
    summary:
      `${fresh.length} shipped card(s) since ${since}; ${verb} ${drafted.length} revision(s)` +
      (skipped.length ? `; silent on ${skipped.join(", ")}` : "") +
      (fresh.length > batch.length ? `; ${fresh.length - batch.length} wait for the next run` : ""),
  };
}

/** A weighed card's revision, and what a design hand-off keeps for its deploy. */
interface Weighed {
  revision: WaitingRevision;
  planned?: PlannedRows;
}

/**
 * One card through the gate and the draft: its revision, or why not. A deploy
 * whose design hand-off drafted rows promotes them instead (`./stages.ts`).
 */
async function weigh(deps: ShippedDeps, card: ShippedCard, handedOff: PlannedRows | null): Promise<Weighed | string> {
  try {
    const { property, value, target } = STAGES[card.stage];
    const status = { property, value };
    if (card.stage === "deployed" && handedOff) {
      const today = await deps.readPath(handedOff.cellId);
      const draft = today ? promotionDraft(handedOff, today) : null;
      if (today && draft) return await revisionFor(deps, card, { status, quote: handedOff.quote, today, draft });
    }
    const text = await deps.evidence(card);
    const gate = await deps.gate({ title: card.title, text });
    if (!gate.pass) return gate.reason;
    const today = await deps.readPath(gate.match.cellId);
    if (!today) return "the matched path could not be read";
    const drafted = await draftRevision(deps.provider, { title: card.title, text, today, target });
    const held = drafted && card.stage === "designed" ? holdDeprecations(drafted) : { draft: drafted, deprecate: [] };
    if (!held.draft) return "no writable draft";
    const weighed = await revisionFor(deps, card, { status, quote: gate.quote, today, draft: held.draft });
    if (typeof weighed === "string" || card.stage !== "designed") return weighed;
    const rows = held.draft.revision.rows.map(({ stepId, laneId }) => ({ stepId, laneId }));
    return { ...weighed, planned: { pageId: card.pageId, cellId: gate.match.cellId, quote: gate.quote, rows, deprecate: held.deprecate } };
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[blueprint-upkeep] ${card.title} not weighed: ${err instanceof Error ? err.message : String(err)}`);
    return "read failed";
  }
}

/** A drafted revision at its card's place, with who may confirm it. */
async function revisionFor(
  deps: ShippedDeps,
  card: ShippedCard,
  d: { status: RevisionSource["status"]; quote: string; today: PathToday; draft: Draft },
): Promise<Weighed | string> {
  const channel = deps.placeOf(card);
  if (!channel) return "no place to post";
  const owner = await deps.ownerOf(card);
  const confirmers = [owner, deps.billId].filter((id): id is string => !!id);
  if (!confirmers.length) return "nobody to confirm";
  return {
    revision: {
      source: { pageId: card.pageId, url: card.url, title: card.title, number: card.number, status: d.status, quote: d.quote },
      today: d.today,
      draft: d.draft,
      channel,
      owner,
      confirmers: [...new Set(confirmers)],
    },
  };
}

/** What a morning hands the sweep's post for one place. */
export interface RevisionHanded {
  revisions: WaitingRevision[];
}

export interface HandOverDeps {
  state: Store<UpkeepState>;
  /** The morning run's hand-off; absent on a rehearsal. */
  handOff?: SectionHandOff<RevisionHanded>;
  date: string;
}

/**
 * The morning's move: each waiting revision to the sweep's message at its
 * place. Posts nothing itself; the revisions wait until a message carries them.
 *
 * @param deps - The store and the hand-off
 * @param opts - `dryRun` hands nothing over
 */
export async function handOverRevisions(deps: HandOverDeps, opts: { dryRun?: boolean } = {}): Promise<{ summary: string }> {
  const state = (await deps.state.read()) ?? EMPTY;
  if (!state.waiting.length) return { summary: "no revisions waiting" };
  if (opts.dryRun || !deps.handOff) return { summary: `would hand ${state.waiting.length} revision card(s) to the morning post` };
  const byPlace = new Map<string, WaitingRevision[]>();
  for (const w of state.waiting) byPlace.set(w.channel, [...(byPlace.get(w.channel) ?? []), w]);
  for (const [channel, revisions] of byPlace) await deps.handOff.put(deps.date, { channel, threadTs: null }, { revisions });
  return { summary: `handed ${state.waiting.length} revision card(s) to the morning post` };
}

export interface SectionDeps {
  state: Store<UpkeepState>;
  stage(proposal: PendingProposal): Promise<void>;
}

/**
 * The revisions as a section of a place's one morning message: one card each,
 * each staged as its own proposal once the message is up.
 *
 * @param deps - The store and the staging
 * @param handOff - The morning run's hand-off
 * @param date - The morning's date
 */
export function revisionSection(deps: SectionDeps, handOff: SectionHandOff<RevisionHanded>, date: string): SweepSection {
  return handedSection<RevisionHanded>({
    source: UPKEEP_SECTION,
    date,
    handOff,
    cardsOf(value) {
      return {
        cards: value.revisions.map((r) => ({ person: r.owner, item: revisionItem(r.source, r.today, r.draft, r.owner) })),
        ttlMs: REVISION_CARD_TTL_MS,
        says: (ids) => revisionParent(ids.length),
      };
    },
    async posted(value, place, shown, report, progress) {
      const staged = new Set<string>();
      for (const r of value.revisions) {
        const id = revisionItemId(r.source);
        if (!shown.includes(id)) continue;
        const before = progress.done.get(id);
        if (before !== undefined) {
          if (before) staged.add(r.source.pageId);
          continue;
        }
        try {
          await deps.stage(stagedRevision(place.channel, report.ts, r));
          staged.add(r.source.pageId);
          await progress.mark(id, true);
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[blueprint-upkeep] ${r.source.title} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
          await progress.mark(id, false);
        }
      }
      if (!staged.size) return;
      const state = (await deps.state.read()) ?? EMPTY;
      await deps.state.write({ ...state, waiting: state.waiting.filter((w) => !staged.has(w.source.pageId)) });
    },
    async notPosted(_value, _place, why) {
      console.error(`[blueprint-upkeep] the morning message did not carry the revisions (${why}) — kept for tomorrow`);
    },
  });
}

/**
 * One revision's card as ThreadState stages it: one item of its report, whose
 * one operation is `blueprint_revise`, confirmed by exactly the people named.
 *
 * @param channel - Where the report posted
 * @param messageTs - The report's message
 * @param r - The revision
 */
export function stagedRevision(channel: string, messageTs: string, r: WaitingRevision): PendingProposal {
  const gate = revisionCard(r.draft.revision, r.confirmers);
  const card = revisionProposalCard(r.source, r.today, r.draft, gate.operations![0]!);
  return {
    ...gate,
    channel,
    threadTs: messageTs,
    replyTs: messageTs,
    ...itemProposal(messageTs, revisionItemId(r.source)),
    proposalText: renderProposalCard(card).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: REVISION_CARD_TTL_MS,
    stated: {
      cancelled: "Rejected, nothing written to the blueprint",
      expired: "That card closed with no decision, so nothing was written to the blueprint.",
    },
  };
}
