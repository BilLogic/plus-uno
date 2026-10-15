// Blueprint upkeep from shipped work, end to end on named dependencies:
//
//   • the MATCH — the end-of-day `blueprint-shipped-N` jobs: the first reads
//     the Roadmap cards that reached `Dev Status: Deployed` since the last
//     run (one query from a cursor), leaving out every card already weighed
//     for that status; each job then weighs the next few through the
//     service-change gate (`./gate.ts`). A card that passes queues one path
//     to draft for EVERY `scenario › path` the gate matched confidently.
//   • the DRAFT — the end-of-day `blueprint-draft-N` jobs: each reads the
//     next few queued paths as they are today and drafts that path's
//     revision on the grind tier (`./draft.ts`), kept in KV for the morning
//     with its place and its confirmers. Matching and drafting are cut into
//     numbered jobs, each its own alarm, so a busy ship week spreads over
//     them — and over the next night, the cursor holding — and no alarm
//     passes the lookup ceiling (ADR-022). The budget math is in `./env.ts`.
//   • the HAND-OVER — every morning (`blueprint-revision-post`), before the
//     sweep's post: each waiting revision is handed to the sweep's message at
//     its card's place, the posting ladder card follow-ups take.
//   • the SECTION — on that place's one message, one card per revision, each
//     its own proposal: the `blueprint_revise` operation, confirmed by the
//     card's owner or Bill and nobody else. Cards the carousel has no room
//     for are said as "+N more in the thread" and go up there, in the
//     morning's `blueprint-revision-thread`, after the sweep's post. The
//     thread is told, tagging the person, what each draft could not verify.
//
// WEIGHED ONCE. A card is weighed once per Roadmap status: its weighed mark
// is durable (one key a card and status), so a card edited again after it
// shipped comes back from the query and is passed over. A redraft is only
// ever asked for in the card's thread (`./revise.ts`).
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

/** The section's name on the sweep's morning post. */
export const UPKEEP_SECTION = "blueprint-revisions";
import { CARDS_PER_MATCH_JOB, DRAFT_COST, DRAFT_JOBS, MATCH_COST, MATCH_JOBS, PATHS_PER_DRAFT_JOB } from "./budget";
export { CARDS_PER_MATCH_JOB, DRAFT_COST, DRAFT_JOBS, MATCH_COST, MATCH_JOBS, PATHS_PER_DRAFT_JOB };
/** A read this recent means tonight's is done: a later match job reads none. */
const READ_GAP_MS = 6 * 60 * 60 * 1000;
/** How far back a first run looks: a weekend and a day. */
export const FIRST_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;
/** How long a revision card stays confirmable. */
export const REVISION_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** The Roadmap status this job watches, and the blueprint status it writes. */
export const DEPLOYED = { property: "Dev Status", value: "Deployed" } as const;
const DEPLOYED_TARGET: EntityStatus = "live";
/** The progress mark a place's gap ask is recorded under. */
const GAP_ASK_MARK = "gap-ask";

/** A Roadmap card that shipped, as the job reads it. */
export interface ShippedCard {
  pageId: string;
  url: string;
  title: string;
  number: number | null;
  pillars: string[];
  contributors: Array<{ id: string; name: string }>;
  /** `last_edited_time`, epoch ms. */
  lastEditedAt: number;
}

/** Who a revision is for and where it goes, settled when its card is weighed. */
interface Routed {
  source: RevisionSource;
  /** The card's own words, for the draft and any redraft. */
  text: string;
  channel: string;
  owner: string | null;
  confirmers: string[];
  /** The blueprint status the shipped work puts rows at. */
  target: EntityStatus;
}

/** A path a card's gate matched, waiting for its draft. */
export interface MatchedPath extends Routed {
  /** `<card and status>|<scenario › path>`: never queued twice. */
  key: string;
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
  /** Tonight's read, while its cards are being weighed. */
  read?: { startedAt: string; cards: ShippedCard[] } | null;
  /** Paths matched and not yet drafted, oldest first. */
  matched?: MatchedPath[];
  waiting: WaitingRevision[];
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

/** The durable record of which cards were weighed, one key a card and status. */
export interface WeighedMarks {
  has(key: string): Promise<boolean>;
  add(key: string): Promise<void>;
}

export interface ShippedDeps {
  roadmap: {
    /** Cards in `Dev Status: Deployed` edited at or after `since` (ISO). */
    deployedSince(since: string): Promise<ShippedCard[]>;
  };
  /** The card's own words: its page text. The one input boundary, so a PRD
   *  or a code reader can be added behind it. */
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
  weighed: WeighedMarks;
  /** What the alarm has left; unbounded when absent. */
  meter?: { headroom(): { subrequests: number } };
  now(): number;
}

export interface ShippedReport {
  /** Paths queued to draft (a match job) or revisions drafted (a draft job). */
  drafted: number;
  summary: string;
}

const EMPTY: UpkeepState = { cursor: null, read: null, matched: [], waiting: [] };

/** A state as kept, with the fields an older record lacks. */
function settled(state: UpkeepState | null): Required<UpkeepState> {
  const s = state ?? EMPTY;
  return { cursor: s.cursor ?? null, read: s.read ?? null, matched: [...(s.matched ?? [])], waiting: [...(s.waiting ?? [])] };
}

/** The durable mark of a card weighed for one Roadmap status. */
export function weighedKey(card: Pick<ShippedCard, "pageId">, status: { property: string; value: string }): string {
  return `${card.pageId}|${status.property}: ${status.value}`;
}

const headroom = (deps: Pick<ShippedDeps, "meter">) => deps.meter?.headroom().subrequests ?? Infinity;

/**
 * One match job: the Roadmap read when tonight's has not happened, then the
 * next cards of it through the gate, each matched path queued for a draft.
 *
 * @param deps - The Roadmap, the gate, the store and the marks
 * @param opts - `dryRun` weighs and keeps nothing
 */
export async function matchShipped(deps: ShippedDeps, opts: { dryRun?: boolean } = {}): Promise<ShippedReport> {
  const state = settled(await deps.state.read());
  const notes: string[] = [];
  if (!state.read) {
    if (state.cursor && deps.now() - Date.parse(state.cursor) < READ_GAP_MS) {
      return { drafted: 0, summary: "tonight's read is done" };
    }
    const since = state.cursor ?? new Date(deps.now() - FIRST_LOOKBACK_MS).toISOString();
    const startedAt = new Date(deps.now()).toISOString();
    const fresh: ShippedCard[] = [];
    for (const card of await deps.roadmap.deployedSince(since)) {
      if (!(await deps.weighed.has(weighedKey(card, DEPLOYED)))) fresh.push(card);
    }
    state.read = { startedAt, cards: fresh };
    notes.push(`${fresh.length} deployed card(s) not yet weighed since ${since}`);
  }

  const marks: string[] = [];
  let queued = 0;
  const silent: string[] = [];
  try {
    while (state.read.cards.length && marks.length < CARDS_PER_MATCH_JOB) {
      if (headroom(deps) < MATCH_COST) {
        notes.push("this job's budget is nearly spent — the next job carries on");
        break;
      }
      const card = state.read.cards[0]!;
      const outcome = await weigh(deps, card);
      state.read.cards.shift();
      marks.push(weighedKey(card, DEPLOYED));
      if (typeof outcome === "string") {
        silent.push(`${card.title}: ${outcome}`);
        continue;
      }
      for (const path of outcome) {
        if (state.matched.some((m) => m.key === path.key) || state.waiting.some((w) => w.key === path.key)) continue;
        state.matched.push(path);
        queued += 1;
      }
    }
    if (!state.read.cards.length) {
      // Past every card only once every card was weighed.
      state.cursor = state.read.startedAt;
      state.read = null;
    }
  } finally {
    if (!opts.dryRun) {
      await deps.state.write(state);
      // After the state: a card is marked only once its paths are kept.
      for (const key of marks) await deps.weighed.add(key);
    }
  }
  const verb = opts.dryRun ? "would queue" : "queued";
  const left = state.read?.cards.length ?? 0;
  return {
    drafted: queued,
    summary:
      [...notes, `weighed ${marks.length} card(s), ${verb} ${queued} path(s) to draft`].join("; ") +
      (silent.length ? `; silent on ${silent.join(", ")}` : "") +
      (left ? `; ${left} card(s) wait for the next job` : ""),
  };
}

/** One card through the gate: a path to draft for each match, or why not. */
async function weigh(deps: ShippedDeps, card: ShippedCard): Promise<MatchedPath[] | string> {
  try {
    const text = await deps.evidence(card);
    const gate = await deps.gate({ title: card.title, text });
    if (!gate.pass) return gate.reason;
    const channel = deps.placeOf(card);
    if (!channel) return "no place to post";
    const owner = await deps.ownerOf(card);
    const confirmers = [...new Set([owner, deps.billId].filter((id): id is string => !!id))];
    if (!confirmers.length) return "nobody to confirm";
    const source: RevisionSource = { pageId: card.pageId, url: card.url, title: card.title, number: card.number, status: { ...DEPLOYED }, quote: gate.quote };
    return gate.matches.map((m) => {
      const label = `${m.scenario} › ${m.path}`;
      return {
        key: `${weighedKey(card, DEPLOYED)}|${label}`,
        cellId: m.cellId,
        label,
        source,
        text: text.slice(0, MAX_KEPT_TEXT),
        channel,
        owner,
        confirmers,
        target: DEPLOYED_TARGET,
      };
    });
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[blueprint-upkeep] ${card.title} not weighed: ${err instanceof Error ? err.message : String(err)}`);
    return "read failed";
  }
}

/** Characters of a card's text kept for its draft: what the draft is shown. */
const MAX_KEPT_TEXT = 6_000;

/**
 * One draft job: the next queued paths read as they are today, each drafted.
 *
 * @param deps - The path read, the model and the store
 * @param opts - `dryRun` drafts and keeps nothing
 */
export async function draftMatched(deps: ShippedDeps, opts: { dryRun?: boolean } = {}): Promise<ShippedReport> {
  const state = settled(await deps.state.read());
  if (!state.matched.length) return { drafted: 0, summary: "no paths waiting for a draft" };
  const notes: string[] = [];
  const silent: string[] = [];
  let tried = 0;
  let drafted = 0;
  try {
    while (state.matched.length && tried < PATHS_PER_DRAFT_JOB) {
      if (headroom(deps) < DRAFT_COST) {
        notes.push("this job's budget is nearly spent — the next job carries on");
        break;
      }
      const path = state.matched[0]!;
      const outcome = await draftPath(deps, path);
      state.matched.shift();
      tried += 1;
      if (typeof outcome === "string") silent.push(`${path.label}: ${outcome}`);
      else if (!state.waiting.some((w) => w.key === outcome.key)) {
        state.waiting.push(outcome);
        drafted += 1;
      }
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

async function draftPath(deps: ShippedDeps, m: MatchedPath): Promise<WaitingRevision | string> {
  try {
    const today = await deps.readPath(m.cellId);
    if (!today) return "the matched path could not be read";
    const draft = await draftRevision(deps.provider, { title: m.source.title, text: m.text, today, target: m.target });
    if (!draft) return "no writable draft";
    return {
      source: m.source,
      today,
      draft,
      channel: m.channel,
      owner: m.owner,
      confirmers: m.confirmers,
      key: m.key,
      cellId: m.cellId,
      text: m.text,
      target: m.target,
    };
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
  const summaries: string[] = [];
  for (let i = 0; i < MATCH_JOBS; i++) summaries.push((await matchShipped(run)).summary);
  let drafted = 0;
  for (let i = 0; i < DRAFT_JOBS; i++) {
    const r = await draftMatched(run);
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
        cards: value.revisions.map((r, i) => ({ person: r.owner, item: revisionItem(r.source, r.today, r.draft, r.owner, i + 1) })),
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
      const items = group.map((r) => revisionItem(r.source, r.today, r.draft, r.owner, r.overflow!.n));
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

/** A revision card's line for a turn that would revise it: its thread revises it. */
export const REVISION_REDRAFT_POINTER =
  "To change this blueprint revision, its owner or Bill replies in this thread with what's wrong, starting with the card's number when there are several — uno-bot redrafts it on the same card.";

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
  const card = revisionProposalCard(r.source, r.today, r.draft, gate.operations![0]!);
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
