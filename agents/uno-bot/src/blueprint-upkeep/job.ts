// Blueprint upkeep from shipped work, end to end on named dependencies:
//
//   • the MATCH — the end-of-day `blueprint-shipped-N` jobs: the first reads
//     the Roadmap cards that reached `Design Status: Shipped` or `Dev Status:
//     Deployed` since the last run (one query from a cursor), leaving out
//     every card already weighed at that moment; each job then weighs the
//     next cards through the service-change gate (`./gate.ts`) on the card's
//     words and its PRD's (`./evidence.ts`). A card that passes queues one
//     path to draft for EVERY `scenario › path` the gate matched
//     confidently. A deploy whose design hand-off drafted rows promotes them
//     instead (`./stages.ts`), with no judgement or draft — and so does a
//     card linked to a drawn proposal (`./link.ts`), at either moment: the
//     proposal's own variant path moves on, today's path is offered for
//     retirement on its own card at the deploy, and nothing new is drafted.
//   • the DRAFT — the end-of-day `blueprint-draft-N` jobs: each reads the
//     next queued paths as they are today and drafts that path's revision on
//     the grind tier (`./draft.ts`) — `planned` rows for a design hand-off,
//     its deprecations held for the deploy; `live` for a deploy — kept in KV
//     for the morning with its place and its confirmers.
//   • BUDGET. Matching and drafting are cut into numbered jobs, each its own
//     alarm, and each job starts a card or a path only while the alarm's
//     headroom covers its worst cost (`./budget.ts`), so a busy ship week
//     spreads over them — and over the next night, the cursor and the queue
//     holding — and no alarm passes the lookup ceiling (ADR-022). The math is
//     in `./env.ts`.
//   • the HAND-OVER — every morning (`blueprint-revision-post`), before the
//     sweep's post: each waiting revision is handed to the sweep's message at
//     its card's place, the posting ladder card follow-ups take.
//   • the SECTION — on that place's one message, one card per revision, each
//     its own proposal: the `blueprint_revise` operation, confirmed by the
//     card's owner or the lead and nobody else. Cards the carousel has no room
//     for are said as "+N more in the thread" and go up there, in the
//     morning's `blueprint-revision-thread`, after the sweep's post. The
//     thread is told, tagging the person, what each draft could not verify.
//
// WEIGHED ONCE. A card is weighed once per moment, and a card weighed at a
// later moment counts as weighed at every earlier one. The marks are durable
// (one key a card and moment), so a card edited again after it shipped comes
// back from the query and is passed over. A redraft is only ever asked for in
// the card's thread (`./revise.ts`).
//
// `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import type { PendingProposal } from "../thread-state/index";
import { decisionReport, itemProposal, MAX_REPORT_ITEMS, type DecisionReport } from "../slack/decision-cards";
import { renderProposalCard } from "../slack/proposal-render";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import { revisionCard, type EntityStatus } from "../blueprint-write/index";
import type { ModelProvider } from "../agent/model-provider";
import type { ServiceChangeGate } from "./gate";
import { draftRevision, type Draft, type PathToday } from "./draft";
import {
  gapAskText,
  overflowParent,
  revisionItem,
  revisionItemId,
  revisionParent,
  revisionProposalCard,
  revisionTitle,
  type RevisionSource,
} from "./card";
import {
  holdDeprecations,
  promotionDraft,
  retirementDraft,
  STAGES,
  variantPromotionDraft,
  weighedAt,
  type PlannedRows,
  type ShipStage,
} from "./stages";
import { cardKey } from "./link";
import type { DrawnProposal, ProposalRecords } from "./proposal-records";
import { DRAFT_COST, DRAFT_JOBS, MATCH_COST, MATCH_JOBS } from "./budget";

export { DRAFT_COST, DRAFT_JOBS, MATCH_COST, MATCH_JOBS };
/** The section's name on the sweep's morning post. */
export const UPKEEP_SECTION = "blueprint-revisions";
/** How far back a first run looks: a weekend and a day. */
export const FIRST_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;
/** How long a revision card stays confirmable. */
export const REVISION_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** Design hand-offs remembered until their deploy. */
const PLANNED_KEPT = 200;
/** Path reads a linked card's proposals may spend: a variant each at a design
 *  hand-off, a variant and today's path each at a deploy. Proposals past it
 *  are named on the first card as not read. */
const LINKED_READS = 3;
/** Characters of a card's words kept for its draft: what the draft is shown. */
const MAX_KEPT_TEXT = 6_000;
/** The progress mark a place's gap ask is recorded under. */
const GAP_ASK_MARK = "gap-ask";
/** The moments, earliest first. */
const ORDER = Object.keys(STAGES) as ShipStage[];

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

/** Who a revision is for and where it goes, settled when its card is weighed. */
interface Routed {
  source: RevisionSource;
  /** The card's words and its PRD's, for the draft and any redraft. */
  text: string;
  channel: string;
  owner: string | null;
  confirmers: string[];
  /** The blueprint status the shipped work puts rows at. */
  target: EntityStatus;
}

/** A path a card's gate matched, waiting for its draft. */
export interface MatchedPath extends Routed {
  /** `<card>@<moment>|<scenario › path>`: never queued twice. */
  key: string;
  stage: ShipStage;
  /** A matched cell on the path, where its read starts. */
  cellId: string;
  label: string;
}

/** A drafted revision waiting for its morning. */
export interface WaitingRevision extends Partial<Pick<Routed, "text" | "target">> {
  source: RevisionSource;
  today: PathToday;
  draft: Draft;
  channel: string;
  owner: string | null;
  confirmers: string[];
  /** The matched path's key (`MatchedPath.key`); absent on older records. */
  key?: string;
  /** A matched cell, where a redraft's fresh read starts. */
  cellId?: string;
  /** Set when a morning's carousel had no room: the thread it goes up in
   *  that morning, and its number there. */
  overflow?: { channel: string; ts: string; date: string; n: number };
}

/** What the job keeps between runs (one KV record). */
export interface UpkeepState {
  /** ISO time the next read starts from; null before the first run. */
  cursor: string | null;
  /** The run whose read was last finished: its later match jobs read none. */
  readFor?: string | null;
  /** The run's read, while its cards are being weighed. */
  read?: { runId: string; startedAt: string; cards: ShippedCard[] } | null;
  /** Paths matched and not yet drafted, oldest first. */
  matched?: MatchedPath[];
  waiting: WaitingRevision[];
  /** What each design hand-off drafted, for its deploy to promote. */
  planned?: PlannedRows[];
  /** Cards weighed before the marks were durable, as `pageId@stage`. */
  seen?: string[];
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

/** The durable record of which cards were weighed, one key a card and moment. */
export interface WeighedMarks {
  has(key: string): Promise<boolean>;
  add(key: string): Promise<void>;
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
  /** A path by its own id; null when it cannot be read. Without it, a deploy
   *  offers no retirement of the path a proposal was drawn beside. */
  readPathById?(pathId: string): Promise<PathToday | null>;
  /** The drawn proposals linked to a Roadmap card (`./proposal-records.ts`);
   *  without them, every card drafts. */
  proposals?: Pick<ProposalRecords, "byCard">;
  provider: ModelProvider;
  /** The card owner's Slack id: its first Contributor, when one is found. */
  ownerOf(card: ShippedCard): Promise<string | null>;
  /** The card's place by the posting ladder; null when none is configured. */
  placeOf(card: ShippedCard): string | null;
  /** The lead's Slack id (`LEAD_USER_ID`), the other confirmer. */
  leadId: string | null;
  state: Store<UpkeepState>;
  weighed: WeighedMarks;
  /** What the alarm has left; unbounded when absent. */
  meter?: { headroom(): { subrequests: number } };
  now(): number;
}

export interface ShippedReport {
  /** Paths queued or promoted (a match job), or revisions drafted (a draft job). */
  drafted: number;
  /** Of a match job's, the promotions: revisions kept with no draft. */
  promoted?: number;
  summary: string;
}

/** Which run a job belongs to: its date, or one call's own id. */
export interface RunOpts {
  dryRun?: boolean;
  runDate?: string;
}

type Settled = Required<Omit<UpkeepState, "seen">> & Pick<UpkeepState, "seen">;

const EMPTY: UpkeepState = { cursor: null, read: null, matched: [], waiting: [] };

/** A state as kept, with the fields an older record lacks. */
function settled(state: UpkeepState | null): Settled {
  const s = state ?? EMPTY;
  return {
    cursor: s.cursor ?? null,
    readFor: s.readFor ?? null,
    read: s.read ?? null,
    matched: [...(s.matched ?? [])],
    waiting: [...(s.waiting ?? [])],
    planned: [...(s.planned ?? [])],
    ...(s.seen?.length ? { seen: s.seen } : {}),
  };
}

/** The durable mark of a card weighed at one moment: `pageId@stage`. */
export function weighedKey(pageId: string, stage: ShipStage): string {
  return `${pageId}@${stage}`;
}

/** Whether a card was weighed at its moment or a later one. */
async function isWeighed(deps: Pick<ShippedDeps, "weighed">, legacy: ReadonlySet<string>, card: ShippedCard): Promise<boolean> {
  if (weighedAt(legacy, card.pageId, card.stage)) return true;
  for (const stage of ORDER.slice(ORDER.indexOf(card.stage))) {
    if (await deps.weighed.has(weighedKey(card.pageId, stage))) return true;
  }
  return false;
}

/** The marks a card weighed at a moment takes: that one and every earlier. */
const marksFor = (card: ShippedCard) => ORDER.slice(0, ORDER.indexOf(card.stage) + 1).map((s) => weighedKey(card.pageId, s));

const headroom = (deps: Pick<ShippedDeps, "meter">) => deps.meter?.headroom().subrequests ?? Infinity;

/**
 * One match job: the run's Roadmap read when it has not happened, then the
 * next cards of it through the gate while the alarm's headroom covers one
 * more at its worst; each matched path queued for a draft, each deploy's
 * promotion kept for the morning.
 *
 * @param deps - The Roadmap, the gate, the store and the marks
 * @param opts - `dryRun` weighs and keeps nothing; `runDate` names the run
 */
export async function matchShipped(deps: ShippedDeps, opts: RunOpts = {}): Promise<ShippedReport> {
  const state = settled(await deps.state.read());
  const runId = opts.runDate ?? new Date(deps.now()).toISOString();
  const notes: string[] = [];
  if (!state.read) {
    if (state.readFor === runId) return { drafted: 0, summary: "this run's read is done" };
    const since = state.cursor ?? new Date(deps.now() - FIRST_LOOKBACK_MS).toISOString();
    const startedAt = new Date(deps.now()).toISOString();
    const legacy = new Set(state.seen ?? []);
    const fresh: ShippedCard[] = [];
    for (const card of await deps.roadmap.shippedSince(since)) if (!(await isWeighed(deps, legacy, card))) fresh.push(card);
    state.read = { runId, startedAt, cards: fresh };
    notes.push(`${fresh.length} shipped card(s) not yet weighed since ${since}`);
  }
  const read = state.read;

  const marks: string[] = [];
  let weighed = 0;
  let queued = 0;
  let promoted = 0;
  const silent: string[] = [];
  try {
    while (read.cards.length) {
      if (headroom(deps) < MATCH_COST) {
        notes.push("this job's budget is nearly spent — the next job carries on");
        break;
      }
      const card = read.cards[0]!;
      const outcome = await weigh(deps, card, state);
      read.cards.shift();
      weighed += 1;
      marks.push(...marksFor(card));
      if (typeof outcome === "string") {
        silent.push(`${card.title}: ${outcome}`);
        continue;
      }
      for (const path of outcome.paths) {
        if (state.matched.some((m) => m.key === path.key) || state.waiting.some((w) => w.key === path.key)) continue;
        state.matched.push(path);
        queued += 1;
      }
      state.waiting.push(...outcome.promoted);
      queued += outcome.promoted.length;
      promoted += outcome.promoted.length;
    }
    if (!read.cards.length) {
      // Past every card only once every card was weighed.
      state.cursor = read.startedAt;
      state.readFor = read.runId;
      state.read = null;
    }
  } finally {
    if (!opts.dryRun) {
      await deps.state.write(state);
      // After the state: a card is marked only once what it yielded is kept.
      for (const key of marks) await deps.weighed.add(key);
    }
  }
  const verb = opts.dryRun ? "would queue" : "queued";
  const left = state.read?.cards.length ?? 0;
  return {
    drafted: queued,
    promoted,
    summary:
      [...notes, `weighed ${weighed} card(s), ${verb} ${queued} revision(s) or path(s)`].join("; ") +
      (silent.length ? `; silent on ${silent.join(", ")}` : "") +
      (left ? `; ${left} card(s) wait for the next job` : ""),
  };
}

/** What weighing one card yields: paths to draft, or promotions ready now. */
interface Weighed {
  paths: MatchedPath[];
  promoted: WaitingRevision[];
}

/**
 * One card: a deploy's promotion of what its hand-off drafted, else the gate,
 * a path to draft for each match — or why nothing. A deploy retires its
 * hand-off's record and anything of it still queued or waiting, whatever it
 * yields.
 */
async function weigh(deps: ShippedDeps, card: ShippedCard, state: Settled): Promise<Weighed | string> {
  try {
    const { property, value, target } = STAGES[card.stage];
    const status = { property, value };
    const handedOff = card.stage === "deployed" ? state.planned.filter((p) => p.pageId === card.pageId) : [];
    if (card.stage === "deployed") {
      state.planned = state.planned.filter((p) => p.pageId !== card.pageId);
      state.matched = state.matched.filter((m) => m.source.pageId !== card.pageId);
      state.waiting = state.waiting.filter((w) => w.source.pageId !== card.pageId);
    }
    const route = async (quote: string): Promise<Omit<Routed, "text" | "target"> | string> => {
      const channel = deps.placeOf(card);
      if (!channel) return "no place to post";
      const owner = await deps.ownerOf(card);
      const confirmers = [...new Set([owner, deps.leadId].filter((id): id is string => !!id))];
      if (!confirmers.length) return "nobody to confirm";
      return { source: { pageId: card.pageId, url: card.url, title: card.title, number: card.number, status, quote }, channel, owner, confirmers };
    };

    // A card linked to a drawn proposal moves the proposal on, and drafts nothing.
    const linked = await linkedPromotions(deps, card);
    if (linked) {
      const promoted: WaitingRevision[] = [];
      for (const l of linked) {
        const routed = await route("");
        if (typeof routed === "string") return routed;
        promoted.push({ ...routed, today: l.today, draft: l.draft, key: `${weighedKey(card.pageId, card.stage)}|${l.key}`, cellId: l.cellId, target });
      }
      return promoted.length ? { paths: [], promoted } : "its linked proposal is already there";
    }

    const promoted: WaitingRevision[] = [];
    for (const p of handedOff) {
      const today = await deps.readPath(p.cellId);
      const draft = today ? promotionDraft(p, today) : null;
      if (!today || !draft) continue;
      const routed = await route(p.quote);
      if (typeof routed === "string") return routed;
      promoted.push({ ...routed, today, draft, key: `${weighedKey(card.pageId, card.stage)}|${revisionTitle(today)}`, cellId: p.cellId, target });
    }
    if (promoted.length) return { paths: [], promoted };

    const text = await deps.evidence(card);
    const gate = await deps.gate({ title: card.title, text });
    if (!gate.pass) return gate.reason;
    const routed = await route(gate.quote);
    if (typeof routed === "string") return routed;
    return {
      promoted: [],
      paths: gate.matches.map((m) => {
        const label = `${m.scenario} › ${m.path}`;
        return { ...routed, key: `${weighedKey(card.pageId, card.stage)}|${label}`, stage: card.stage, cellId: m.cellId, label, text: text.slice(0, MAX_KEPT_TEXT), target };
      }),
    };
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[blueprint-upkeep] ${card.title} not weighed: ${err instanceof Error ? err.message : String(err)}`);
    return "read failed";
  }
}

/** One card a linked proposal yields: its path read now and the draft on it. */
interface LinkedCard {
  today: PathToday;
  draft: Draft;
  /** A cell on the path: where a redraft's read starts. */
  cellId: string;
  /** Its key's tail, unique on the card. */
  key: string;
}

/**
 * The cards a card's linked proposals yield: each variant path promoted to
 * the card's target, and at a deploy each path it was drawn beside offered
 * for retirement. Null when the card has no linked proposal whose path can be
 * read — it is then weighed as any other card.
 */
async function linkedPromotions(deps: ShippedDeps, card: ShippedCard): Promise<LinkedCard[] | null> {
  if (!deps.proposals) return null;
  const { target } = STAGES[card.stage];
  const deploy = card.stage === "deployed";
  const proposals = await deps.proposals.byCard(cardKey(card.pageId), LINKED_READS);
  if (!proposals.length) return null;
  const cards: LinkedCard[] = [];
  let reads = 0;
  let read = 0;
  let unread = 0;
  const retiring = new Set<string>();
  for (const p of proposals) {
    const cost = deploy && deps.readPathById ? 2 : 1;
    if (reads + cost > LINKED_READS || !p.cellIds[0]) {
      unread += 1;
      continue;
    }
    reads += 1;
    const variant = await variantOf(deps, p);
    if (!variant) continue;
    read += 1;
    let beside: PathToday | null = null;
    if (deploy && deps.readPathById && !retiring.has(p.todayPathId)) {
      reads += 1;
      beside = await deps.readPathById(p.todayPathId);
    }
    const promoted = variantPromotionDraft(variant, target, beside ?? undefined);
    if (promoted) cards.push({ today: variant, draft: promoted, cellId: variant.cells[0]?.id ?? p.cellIds[0], key: revisionTitle(variant) });
    const retire = beside && beside.pathId !== variant.pathId ? retirementDraft(beside, variant) : null;
    if (beside && retire) {
      retiring.add(p.todayPathId);
      cards.push({ today: beside, draft: retire, cellId: beside.cells[0]?.id ?? p.cellIds[0], key: `retire|${revisionTitle(beside)}` });
    }
  }
  if (!read) return null;
  if (unread && cards[0]) {
    cards[0] = { ...cards[0], draft: { ...cards[0].draft, gaps: [...cards[0].draft.gaps, `${unread} more proposal(s) linked to this card were not read this run`] } };
  }
  return cards;
}

/** A drawn proposal's path as the blueprint holds it now; null once it is gone. */
async function variantOf(deps: ShippedDeps, p: DrawnProposal): Promise<PathToday | null> {
  const path = await deps.readPath(p.cellIds[0]!);
  return path && path.pathId === p.pathId ? path : null;
}

/**
 * One draft job: the next queued paths read as they are today, each drafted,
 * while the alarm's headroom covers one more.
 *
 * @param deps - The path read, the model and the store
 * @param opts - `dryRun` drafts and keeps nothing
 */
export async function draftMatched(deps: ShippedDeps, opts: RunOpts = {}): Promise<ShippedReport> {
  const state = settled(await deps.state.read());
  if (!state.matched.length) return { drafted: 0, summary: "no paths waiting for a draft" };
  const notes: string[] = [];
  const silent: string[] = [];
  let drafted = 0;
  try {
    while (state.matched.length) {
      if (headroom(deps) < DRAFT_COST) {
        notes.push("this job's budget is nearly spent — the next job carries on");
        break;
      }
      const path = state.matched[0]!;
      const outcome = await draftPath(deps, path);
      state.matched.shift();
      if (typeof outcome === "string") {
        silent.push(`${path.label}: ${outcome}`);
        continue;
      }
      if (state.waiting.some((w) => w.key === outcome.revision.key)) continue;
      state.waiting.push(outcome.revision);
      if (outcome.planned) state.planned = [...state.planned, outcome.planned].slice(-PLANNED_KEPT);
      drafted += 1;
    }
  } finally {
    if (!opts.dryRun) await deps.state.write(state);
  }
  const verb = opts.dryRun ? "would keep" : "kept";
  return {
    drafted,
    summary:
      [...notes, `${verb} ${drafted} revision(s)`].join("; ") +
      (silent.length ? `; silent on ${silent.join(", ")}` : "") +
      (state.matched.length ? `; ${state.matched.length} path(s) wait for the next job` : ""),
  };
}

/** One queued path drafted: its revision, and a hand-off's record for its deploy. */
async function draftPath(deps: ShippedDeps, m: MatchedPath): Promise<{ revision: WaitingRevision; planned?: PlannedRows } | string> {
  try {
    const today = await deps.readPath(m.cellId);
    if (!today) return "the matched path could not be read";
    const drafted = await draftRevision(deps.provider, { title: m.source.title, text: m.text, today, target: m.target });
    const held = drafted && m.stage === "designed" ? holdDeprecations(drafted) : { draft: drafted, deprecate: [] };
    if (!held.draft) return "no writable draft";
    const { stage: _stage, label: _label, ...routed } = m;
    const revision: WaitingRevision = { ...routed, today, draft: held.draft };
    if (m.stage !== "designed") return { revision };
    const rows = held.draft.revision.rows.map(({ stepId, laneId }) => ({ stepId, laneId }));
    return { revision, planned: { pageId: m.source.pageId, cellId: m.cellId, quote: m.source.quote, rows, deprecate: held.deprecate } };
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[blueprint-upkeep] ${m.label} not drafted: ${err instanceof Error ? err.message : String(err)}`);
    return "read failed";
  }
}

/**
 * A whole night in one call — every match job, then every draft job — for a
 * rehearsal and a caller with no runner. A dry run works on a copy.
 *
 * @param deps - As the jobs take them
 * @param opts - `dryRun` keeps nothing
 */
export async function runShippedRevisions(deps: ShippedDeps, opts: { dryRun?: boolean } = {}): Promise<ShippedReport> {
  let run = deps;
  if (opts.dryRun) {
    let copy = settled(await deps.state.read());
    const marked = new Set<string>();
    run = {
      ...deps,
      state: { read: async () => structuredClone(copy), write: async (v) => void (copy = structuredClone(settled(v))) },
      weighed: { has: async (k) => marked.has(k) || (await deps.weighed.has(k)), add: async (k) => void marked.add(k) },
    };
  }
  // One id for the night, so its later match jobs read nothing again.
  const runDate = `call:${crypto.randomUUID()}`;
  const summaries: string[] = [];
  let drafted = 0;
  for (let i = 0; i < MATCH_JOBS; i++) {
    const r = await matchShipped(run, { runDate });
    drafted += r.promoted ?? 0;
    summaries.push(r.summary);
  }
  for (let i = 0; i < DRAFT_JOBS; i++) {
    const r = await draftMatched(run, { runDate });
    drafted += r.drafted;
    summaries.push(r.summary);
  }
  const verb = opts.dryRun ? "would keep" : "kept";
  return { drafted, summary: `${verb} ${drafted} revision(s): ${summaries.join(" · ")}` };
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

/** A revision's identity in the state: its path key, or its card's page id on an older record. */
const keyOf = (r: WaitingRevision) => r.key ?? r.source.pageId;

/**
 * The morning's move: each waiting revision to the sweep's message at its
 * place. Posts nothing itself; the revisions wait until a message carries them.
 *
 * @param deps - The store and the hand-off
 * @param opts - `dryRun` hands nothing over
 */
export async function handOverRevisions(deps: HandOverDeps, opts: { dryRun?: boolean } = {}): Promise<{ summary: string }> {
  const state = settled(await deps.state.read());
  if (!state.waiting.length) return { summary: "no revisions waiting" };
  if (opts.dryRun || !deps.handOff) return { summary: `would hand ${state.waiting.length} revision card(s) to the morning post` };
  // An earlier morning's overflow that never went up starts again at the top.
  const waiting = state.waiting.map(({ overflow: _gone, ...r }) => r);
  if (state.waiting.some((w) => w.overflow)) await deps.state.write({ ...state, waiting });
  const byPlace = new Map<string, WaitingRevision[]>();
  for (const w of waiting) byPlace.set(w.channel, [...(byPlace.get(w.channel) ?? []), w]);
  for (const [channel, revisions] of byPlace) await deps.handOff.put(deps.date, { channel, threadTs: null }, { revisions });
  return { summary: `handed ${waiting.length} revision card(s) to the morning post` };
}

/** One revision card in a thread, as a reply there finds it. */
export interface RevisionThreadCard {
  /** Its number in the thread. */
  n: number;
  /** The proposal it is staged as now. */
  proposalKey: string;
  /** The report message it is a card of, and its entry there. */
  messageTs: string;
  itemId: string;
  revision: WaitingRevision;
}

/** A thread holding revision cards: what a reply in it may redraft. */
export interface RevisionThread {
  channel: string;
  ts: string;
  expiresAt: number;
  cards: RevisionThreadCard[];
}

/** Where revision threads are kept, by channel and thread. */
export interface RevisionThreads {
  read(channel: string, ts: string): Promise<RevisionThread | null>;
  write(thread: RevisionThread): Promise<void>;
}

/** Record cards staged in a thread, beside those it holds. */
async function recordCards(threads: RevisionThreads, channel: string, ts: string, cards: RevisionThreadCard[], expiresAt: number): Promise<void> {
  if (!cards.length) return;
  const before = await threads.read(channel, ts);
  const kept = (before?.cards ?? []).filter((c) => !cards.some((n) => n.n === c.n));
  await threads.write({ channel, ts, expiresAt: Math.max(before?.expiresAt ?? 0, expiresAt), cards: [...kept, ...cards].sort((a, b) => a.n - b.n) });
}

export interface SectionDeps {
  state: Store<UpkeepState>;
  stage(proposal: PendingProposal): Promise<void>;
  threads: RevisionThreads;
  /** Post one line in a thread. */
  post(channel: string, threadTs: string, text: string): Promise<void>;
  now(): number;
}

/**
 * The revisions as a section of a place's one morning message: one card each,
 * each staged as its own proposal once the message is up. The cards the
 * carousel had no room for are said as waiting in the thread, and marked to
 * go up there after the sweep's post (`postOverflow`).
 *
 * @param deps - The store, the staging, the thread record and the thread's line
 * @param handOff - The morning run's hand-off
 * @param date - The morning's date
 */
export function revisionSection(deps: SectionDeps, handOff: SectionHandOff<RevisionHanded>, date: string): SweepSection {
  const idOf = (r: WaitingRevision) => revisionItemId(r.source, r.today);
  return handedSection<RevisionHanded>({
    source: UPKEEP_SECTION,
    date,
    handOff,
    cardsOf(value) {
      return {
        cards: value.revisions.map((r, i) => ({ person: r.owner, item: revisionItem(r.source, r.today, r.draft, r, i + 1) })),
        ttlMs: REVISION_CARD_TTL_MS,
        overflowInThread: true,
        says: (ids) => revisionParent(ids.length),
        // The gap ask in the thread; each card's staging.
        cost: (shown) => ({ subrequests: 1, d1Queries: shown.length * STAGING_D1_QUERIES }),
      };
    },
    async posted(value, place, shown, report, progress) {
      const thread = place.threadTs ?? report.ts;
      const staged = new Map<string, RevisionThreadCard>();
      const numbered = value.revisions.map((r, i) => ({ r, n: i + 1 }));
      for (const { r, n } of numbered) {
        const id = idOf(r);
        if (!shown.includes(id)) continue;
        const card: RevisionThreadCard = { n, proposalKey: itemProposal(report.ts, id).proposalTs, messageTs: report.ts, itemId: id, revision: r };
        const before = progress.done.get(id);
        if (before !== undefined) {
          if (before) staged.set(keyOf(r), card);
          continue;
        }
        try {
          await deps.stage(stagedRevision(place.channel, report.ts, r, { threadTs: thread }));
          staged.set(keyOf(r), card);
          await progress.mark(id, true);
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[blueprint-upkeep] ${r.source.title} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
          await progress.mark(id, false);
        }
      }
      if (staged.size) {
        await recordCards(deps.threads, place.channel, thread, [...staged.values()], deps.now() + REVISION_CARD_TTL_MS);
        if (!progress.done.has(GAP_ASK_MARK)) {
          const ask = gapAskText([...staged.values()].map((c) => askOf(c)));
          if (ask) await deps.post(place.channel, thread, ask);
          await progress.mark(GAP_ASK_MARK, true);
        }
      }
      // What did not show waits in the thread, numbered as the opener counted it.
      const overflow = new Map(numbered.filter(({ r }) => !shown.includes(idOf(r))).map(({ r, n }) => [keyOf(r), n]));
      if (!staged.size && !overflow.size) return;
      const state = settled(await deps.state.read());
      await deps.state.write({
        ...state,
        waiting: state.waiting
          .filter((w) => !staged.has(keyOf(w)))
          .map((w) => (overflow.has(keyOf(w)) ? { ...w, overflow: { channel: place.channel, ts: thread, date, n: overflow.get(keyOf(w))! } } : w)),
      });
    },
    async notPosted(_value, _place, why) {
      console.error(`[blueprint-upkeep] the morning message did not carry the revisions (${why}) — kept for tomorrow`);
    },
  });
}

/** D1 queries one card's staging spends (the sweep's own figure for a section card). */
const STAGING_D1_QUERIES = 3;

/** What a staged card's gap ask says. */
function askOf(c: RevisionThreadCard): Parameters<typeof gapAskText>[0][number] {
  const r = c.revision;
  return { n: c.n, label: revisionTitle(r.today), gaps: r.draft.gaps, who: r.owner ?? r.confirmers[0] ?? null };
}

export interface OverflowDeps {
  state: Store<UpkeepState>;
  /** Post a report in a thread and keep its record; its message's ts. */
  postReport(channel: string, threadTs: string, report: DecisionReport, ttlMs: number): Promise<string>;
  stage(proposal: PendingProposal): Promise<void>;
  threads: RevisionThreads;
  post(channel: string, threadTs: string, text: string): Promise<void>;
  /** D1 queries the alarm has left; unbounded when absent. */
  meter?: { headroom(): { d1Queries: number } };
  date: string;
  now(): number;
}

/**
 * The morning's cards that had no room on their place's carousel, up in that
 * message's thread as one more report of at most ten — after the sweep's
 * post, on an alarm of its own. Past ten more, the rest wait for the next
 * morning, and the thread report says so.
 *
 * @param deps - The store, the thread's post and the staging
 * @param opts - `dryRun` posts nothing
 */
export async function postOverflow(deps: OverflowDeps, opts: { dryRun?: boolean } = {}): Promise<{ summary: string }> {
  const state = settled(await deps.state.read());
  const due = state.waiting.filter((w) => w.overflow?.date === deps.date);
  if (!due.length) return { summary: "no revisions waiting in a thread" };
  if (opts.dryRun) return { summary: `would put ${due.length} revision card(s) in their morning thread` };
  const byThread = new Map<string, WaitingRevision[]>();
  for (const w of due) byThread.set(`${w.overflow!.channel}:${w.overflow!.ts}`, [...(byThread.get(`${w.overflow!.channel}:${w.overflow!.ts}`) ?? []), w]);
  const posted = new Set<string>();
  const held = new Set<string>();
  let threads = 0;
  try {
    for (const group of byThread.values()) {
      const { channel, ts } = group[0]!.overflow!;
      const shown = group.slice(0, MAX_REPORT_ITEMS);
      if ((deps.meter?.headroom().d1Queries ?? Infinity) < shown.length * STAGING_D1_QUERIES + 2) break;
      const items = group.map((r) => revisionItem(r.source, r.today, r.draft, r, r.overflow!.n));
      const report = decisionReport(items, overflowParent(group.length), { channel });
      const messageTs = await deps.postReport(channel, ts, report, REVISION_CARD_TTL_MS);
      threads += 1;
      const cards: RevisionThreadCard[] = [];
      for (const r of shown) {
        const id = revisionItemId(r.source, r.today);
        try {
          await deps.stage(stagedRevision(channel, messageTs, r, { threadTs: ts }));
          posted.add(keyOf(r));
          cards.push({ n: r.overflow!.n, proposalKey: itemProposal(messageTs, id).proposalTs, messageTs, itemId: id, revision: r });
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[blueprint-upkeep] ${r.source.title} posted in the thread but not staged: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      for (const r of group.slice(MAX_REPORT_ITEMS)) held.add(keyOf(r));
      await recordCards(deps.threads, channel, ts, cards, deps.now() + REVISION_CARD_TTL_MS);
      const ask = gapAskText(cards.map(askOf));
      if (ask) await deps.post(channel, ts, ask);
    }
  } finally {
    if (posted.size || held.size) {
      await deps.state.write({
        ...state,
        waiting: state.waiting.filter((w) => !posted.has(keyOf(w))).map((w) => (held.has(keyOf(w)) ? (({ overflow: _o, ...r }) => r)(w) : w)),
      });
    }
  }
  return { summary: `put ${posted.size} revision card(s) in ${threads} morning thread(s)${held.size ? `; ${held.size} wait for the next morning` : ""}` };
}

/**
 * A design hand-off's rows kept anew after a redraft: the card and path's
 * earlier record (same page, same matched cell) gives way, so the deploy
 * promotes what an Approve on the redrafted card wrote.
 *
 * @param state - The job's store
 * @param record - The redraft's rows and held deprecations
 */
export async function replanRows(state: Store<UpkeepState>, record: PlannedRows): Promise<void> {
  const s = settled(await state.read());
  const others = s.planned.filter((p) => !(p.pageId === record.pageId && p.cellId === record.cellId));
  await state.write({ ...s, planned: [...others, record].slice(-PLANNED_KEPT) });
}

/** A revision card's line for a turn that would revise it: its thread revises it. */
export const REVISION_REDRAFT_POINTER =
  "To change this blueprint revision, someone who can approve it replies in this thread with what's wrong, starting with the revision's number when there are several — uno-bot redrafts it in its place.";

/**
 * One revision's card as ThreadState stages it: one item of its report, whose
 * one operation is `blueprint_revise`, confirmed by exactly the people named.
 *
 * @param channel - Where the report posted
 * @param messageTs - The report's message
 * @param r - The revision
 * @param opts - `threadTs`: the thread the report is in, when it is not its
 *   own root; `itemId`: the entry it takes (a redraft's); `ttlMs`: its window
 */
export function stagedRevision(
  channel: string,
  messageTs: string,
  r: WaitingRevision,
  opts: { threadTs?: string; itemId?: string; ttlMs?: number } = {},
): PendingProposal {
  const gate = revisionCard(r.draft.revision, r.confirmers);
  const card = revisionProposalCard(r.source, r.today, r.draft, r.confirmers, gate.operations![0]!);
  const thread = opts.threadTs ?? messageTs;
  return {
    ...gate,
    channel,
    threadTs: thread,
    replyTs: thread,
    ...itemProposal(messageTs, opts.itemId ?? revisionItemId(r.source, r.today)),
    proposalText: renderProposalCard(card).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: opts.ttlMs ?? REVISION_CARD_TTL_MS,
    // Its thread redrafts it (`./revise.ts`), never a turn.
    refuseRevision: REVISION_REDRAFT_POINTER,
    stated: {
      cancelled: "Rejected, nothing written to the blueprint",
      expired: "That card closed with no decision, so nothing was written to the blueprint.",
    },
  };
}
