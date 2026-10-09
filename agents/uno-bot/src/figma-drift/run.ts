// `runDriftAsks` — the morning's `figma-drift-post` job — and
// `recheckLiveAsks`, the `figma-drift-recheck` job that withdraws a file's
// card once the file catches up.
//
// THE MORNING. The end-of-day sweep queued each file drift it found
// (`sweep/run.ts` → `FileDriftSink`). At the next weekday morning run
// (`postableAt`):
//   • THE FILE FIRST (#897). Each Figma file is looked at before its thread
//     is asked (`./check.ts`): a file that changed after the decision and
//     whose linked frame now shows it is not asked about, and leaves the
//     queue. Every other card says what the file did since the decision.
//   • ONE INTAKE PER FILE. A file's intake is drafted in the first thread that
//     discussed it (`askGroupOf` keeps audiences apart). While that card is
//     live, the file gets no second intake.
//   • ONE REPORT PER THREAD PER MORNING, on the shared decision card
//     (`slack/decision-cards.ts`): a parent line counting every file the
//     thread discussed, then one card per file whose intake it drafts, each
//     its own proposal (`itemProposal`), decided in its own Review pop-up —
//     Approve files that intake, Reject files nothing. A file whose intake is
//     drafted in another thread is no card here: the parent gains a one-line
//     pointer to it, and a thread with only such files gets the pointers
//     alone. The pointers are a notification, not a write, so they are not
//     gated; filing an intake is. Nothing typed in the thread decides a card.
//   • A thread whose drift card is still live is not asked again until it is
//     decided or lapses: its findings wait, so no card ever retires another.
//   • Each card lives 72 h, with no re-ping; its confirmers are its file's
//     owner plus everyone who posted in the threads that discussed it that
//     morning. A revision is refused (`DRIFT_NO_REVISION`): the intake is
//     drafted from the thread as it stands.
// Each report is posted where `pickDestination` puts it — its own thread, or
// the private place its evidence is in — and never in #uno-bot.
//
// WHILE IT IS LIVE. Each report posted is kept as a live record for its 72 h.
// Both scheduled runs look at each record's Figma files again. A card whose
// file now shows its decision is retired, so no Approve can file it, and
// redrawn in place to say "Updated Sep 30. Nothing to do."; a pointer-only
// message is edited the same way once every file it names shows its
// decision. Nothing is ever posted. Past 72 h a report is left as it is: no
// re-ping, no edit.
//
// A POSTED CARD IS STAGED OR SAYS SO. A file's intake mark is written before
// the post, so a retried morning never posts a second card for it; a post that
// fails clears the marks and keeps the findings, and a card that fails to
// stage says so on itself, clears its mark and keeps its finding.
//
// Named dependencies; `Env` enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError, isSubrequestBudgetError } from "../net";
import type { PendingProposal, ProposalOperation, ThreadState } from "../thread-state/index";
import type { ChannelKind, TargetKind } from "../sweep/finding";
import { pickDestination, resolveDestination, type TeamChannels } from "../sweep/finding";
import { postableAt } from "../sweep/schedule";
import type { FigmaClient, FigmaVersionsResponse } from "../figma/client";
import { versionsFrom } from "../figma-poll";
import { renderProposalCard } from "../slack/proposal-render";
import { textSections } from "../slack/render";
import {
  decisionReport,
  itemProposal,
  itemProposalKey,
  markNotStaged,
  reportRecord,
  settleItem,
  type ReportMessage,
  type ReportStore,
} from "../slack/decision-cards";
import {
  caughtUpNote,
  caughtUpText,
  driftCardWords,
  driftItem,
  driftParent,
  driftReview,
  DRIFT_CARD_TTL_MS,
  DRIFT_NO_REVISION,
  DRIFT_NOT_POSTED_TEXT,
  DRIFT_NOT_STAGED,
  legacyCaughtUpText,
  elsewhereLine,
  pillarNote,
  type DriftFileWords,
  type FileChange,
} from "./copy";
import { cachedReads, checkDecision, isFigmaKind, type FileReads } from "./check";
import type { FrameJudge } from "./judge";
import { draftIntake, matchPillar, pillarCandidates } from "./draft";
import { askGroupOf, type FileDriftFinding } from "./finding";

/** Reports with cards per morning; files whose card would be past it wait. */
export const MAX_REPORTS_PER_MORNING = 4;
/** Cards one report holds; a thread's files past it wait. Under the
 *  carousel's ten, so a report never holds any back. */
export const MAX_CARDS_PER_REPORT = 5;
/** Threads given the pointers alone per morning; the rest wait. */
export const MAX_QUESTIONS_PER_MORNING = 4;
/** Figma decisions the morning looks at before asking; a thread whose look
 *  would pass it waits whole for tomorrow. */
export const MAX_LOOKS_PER_MORNING = 6;
/** Decisions one re-check looks at; the rest wait for the next run. */
export const MAX_RECHECKS_PER_RUN = 6;
/** How long a mark with no card holds its file for a try still posting. */
const POSTING_HOLD_MS = 60 * 60 * 1000;
/** What one decision's look at its file may spend: a `versions` read, a
 *  `nodes` read and the judgement. */
const CHECK_SUBREQUESTS = 3;
/** What withdrawing a caught-up file spends after its look: for a card, the
 *  retire, the report's update, the edit, the usage record's row and the live
 *  record's save; for pointers alone, its edit, the delete and a read of its
 *  card's record. Reserved with the look, so a budget stop never falls
 *  between the retire and the edit and leaves a card out of reach with its
 *  Review still up. */
const WITHDRAWAL_COST = { subrequests: 5, d1Queries: 1 };

/**
 * Who last published a file: the author of its newest named version, or null
 * when Figma names nobody. Autosaves are not publishes (`versionsFrom`).
 *
 * @param result - The file's `/versions` body
 */
export function publisherOf(result: FigmaVersionsResponse): { handle: string; at: string } | null {
  const [newest] = versionsFrom(result);
  return newest && newest.user !== "Unknown" ? { handle: newest.user, at: newest.createdAt } : null;
}

/** Where one file's intake is drafted, while its card may be live. */
export interface IntakeMark {
  channel: string;
  /** The report's thread root; null only for a mark written before its post
   *  at a place's top. */
  threadTs: string | null;
  /** The report's ts; null between the mark and the post. */
  cardTs: string | null;
  /** The file's card in that report. Absent on a mark from before the shared
   *  card, whose card was the whole message. */
  itemId?: string;
  markedAt: number;
}

/** One asked file, as a thread's ask record holds it. */
export interface AskedFile {
  /** Where the report drafting the file's intake lives. */
  cardChannel: string;
  cardThread: string | null;
  kind: TargetKind;
  askedAt: number;
}

/** Everything a thread has been asked, by file key. */
export type AskRecord = Record<string, AskedFile>;

/** One file a live report names, with what the re-check has seen of it. */
export interface LiveAskFile {
  /** The drift file key (`figma:<key>`, or a repo URL's). */
  fileKey: string;
  kind: TargetKind;
  /** The link the thread used — its node id names the frame. */
  url: string;
  /** When the thread settled it, epoch ms. */
  decidedAt: number;
  threadSays: string;
  sourceSays: string;
  /** The newest change already judged not to show the decision; the
   *  decision time until one has been. */
  checkedThrough: number;
  /** The change found to show the decision, epoch ms. */
  caughtUpAt?: number;
  /** On a report's card: the card's id in its report. */
  itemId?: string;
  /** On pointers alone: the proposal of the card drafting the file's intake,
   *  so a re-check can tell a card whose Approve filed it. */
  intakeKey?: string;
  /** The same, on a question from before the shared card: its card's ts,
   *  which was its proposal's. */
  cardTs?: string;
}

/** A report posted and still within its 72 h: the message to edit, and the
 *  files whose catching up withdraws it. */
export interface LiveAsk {
  channel: string;
  /** The message: the report with its cards, or the pointers alone. */
  ts: string;
  /** The thread it is in. */
  threadTs: string;
  role: "card" | "question";
  askedAt: number;
  files: LiveAskFile[];
  /** On a card from before the shared card — one whose files carry no
   *  `itemId` — its question, struck through once its files catch up. */
  headline?: string;
}

/** The queue, the marks and the live asks, behind one port. */
export interface DriftStore {
  pending(): Promise<FileDriftFinding[]>;
  remove(ids: string[]): Promise<void>;
  intakeMark(group: string): Promise<IntakeMark | null>;
  /** Kept for the card's lifetime. */
  setIntakeMark(group: string, mark: IntakeMark): Promise<void>;
  clearIntakeMark(group: string): Promise<void>;
  asked(channel: string, threadTs: string): Promise<AskRecord>;
  saveAsked(channel: string, threadTs: string, record: AskRecord): Promise<void>;
  /** Every live ask, oldest first. Kept for the card's 72 h. */
  liveAsks(): Promise<LiveAsk[]>;
  /** The live asks posted in one thread. */
  liveAsksIn(channel: string, threadTs: string): Promise<LiveAsk[]>;
  saveLiveAsk(ask: LiveAsk): Promise<void>;
  dropLiveAsk(ask: Pick<LiveAsk, "channel" | "threadTs" | "ts">): Promise<void>;
  /** Note that a live report names this Figma file until `until` — the one
   *  read a file-change notification makes before it looks any further. */
  markLiveFile(fileKey: string, until: number): Promise<void>;
  /** Until when a live report names this file, or null. */
  liveFileUntil(fileKey: string): Promise<number | null>;
}

/** A place a message goes: a thread, or a place's top. */
export interface AskPlace {
  channel: string;
  threadTs: string | null;
}

export interface DriftPostDeps {
  store: DriftStore;
  slack: {
    /** Post a report or the pointers alone, tagged as the sweep's so a reply
     *  under it is read by the sweep thread's rule. */
    post(to: AskPlace, message: { text: string; blocks?: unknown[]; card: boolean }): Promise<{ ok: boolean; ts?: string }>;
    permalink(channel: string, ts: string): Promise<string | null>;
    /** Edit a posted report in place (`chat.update`). */
    edit(channel: string, ts: string, message: ReportMessage): Promise<void>;
    /** Mark the thread as entered through a proactive post, when the bot had
     *  no history there (`sweep/thread-mark.ts`). */
    markThread(channel: string, threadTs: string): Promise<void>;
  };
  /** Where each report's record is kept, and its cards' states land. */
  reports: ReportStore & Pick<ThreadState, "putReport">;
  /** Stage one card and record it on the usage record (`stageSweepCard`). */
  stage(proposal: PendingProposal, channelKind: ChannelKind): Promise<void>;
  /** Whether a card's proposal is still live in ThreadState. */
  cardLive(proposalTs: string): Promise<boolean>;
  /** The Figma client: a file's last change and publisher (`versions`), and
   *  the linked frame (`nodes`). Without one, no file is looked at and no
   *  intake names a publisher. */
  figma?: Pick<FigmaClient, "versions" | "nodes">;
  /** Whether a frame now shows a decision (`./judge.ts`). Without one, no
   *  decision is ever found shown, and every drift is asked about. */
  judge?: FrameJudge;
  /** The Roadmap's Product Pillar options, or null when unread. */
  pillarOptions(): Promise<string[] | null>;
  config: TeamChannels & { unoBot?: string };
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  dryRun?: boolean;
}

/** One report posted — or, on a dry run, planned. */
export interface DriftAskReport {
  channel: string;
  threadTs: string | null;
  role: "card" | "question";
  /** The files it names, by file key. */
  files: string[];
  /** The message text; withheld for a private place on a dry run. */
  text: string;
  ts?: string;
}

export interface DriftPostReport {
  kind: "figma-drift-post";
  key: string;
  outcome: "handled";
  note: string | null;
  asks: DriftAskReport[];
  /** Decisions whose file already shows them, so nobody was asked. */
  settled: Array<{ channel: string; threadTs: string | null; fileKey: string }>;
  summary: string;
}

/** What a dry run's report shows of an ask in a private place. */
export const WITHHELD_ASK_TEXT = "(withheld: this ask is for a private channel or a group DM)";

/** One thread's plan for the morning. */
interface ThreadPlan {
  key: string;
  /** Its findings, one per file, oldest drift first. */
  findings: FileDriftFinding[];
  /** The groups whose intake this thread's report drafts. */
  drafts: string[];
}

/** Where a file's card went up: its report's thread and ts, and its id. */
interface CardPlace {
  channel: string;
  thread: string | null;
  ts: string;
  itemId?: string;
}

/** Where a file's intake is drafted this morning. */
type Home = { kind: "live"; mark: IntakeMark } | { kind: "new"; thread: string };

/** What the morning read of the files, shared by every report it posts. */
interface FileLook {
  reads: FileReads | null;
  /** Each asked finding's file, by finding id. */
  changes: Map<string, FileChange>;
  /** Each finding whose change was judged and not shown: the change. */
  judgedThrough: Map<string, number>;
}

/** The proposal of a mark's card: its item's, or the whole message's for a
 *  mark from before the shared card. */
function markProposalKey(mark: IntakeMark & { cardTs: string }): string {
  return mark.itemId ? itemProposalKey(mark.cardTs, mark.itemId) : mark.cardTs;
}

/**
 * One morning's reports.
 *
 * @param job - The `figma-drift-post` job
 * @param deps - Everything it touches, by name
 * @throws A budget stop before a report that could not finish — the runner
 *   retries the job on a fresh budget, and the marks keep it from asking twice
 */
export async function runDriftAsks(job: { key: string }, deps: DriftPostDeps): Promise<DriftPostReport> {
  const now = deps.now();
  const notes: string[] = [];
  const asks: DriftAskReport[] = [];
  const queued = await deps.store.pending();
  const due = queued.filter((f) => postableAt(f.detectedAt) <= now);

  // A thread already asked about a file is not asked again; one whose drift
  // card is still live waits for it.
  const fresh: FileDriftFinding[] = [];
  const already: string[] = [];
  const busy = new Set<string>();
  for (const [key, list] of groupBy(due, threadKey)) {
    const { channel, threadTs } = list[0]!.evidence;
    if (channel === deps.config.unoBot) {
      already.push(...list.map((f) => f.id));
      continue;
    }
    const record = await deps.store.asked(channel, threadTs ?? "");
    const open = list.filter((f) => {
      if (!record[f.fileKey]) return true;
      already.push(f.id);
      return false;
    });
    if (open.length && !deps.dryRun && threadTs && (await threadBusy(deps, channel, threadTs, now))) busy.add(key);
    else fresh.push(...open);
  }
  if (already.length && !deps.dryRun) await deps.store.remove(already);
  if (busy.size) notes.push(`${busy.size} thread(s) wait for their live drift card`);

  // The file first: a decision its file already shows is not asked about.
  // Oldest thread first, and a thread at a time up to the morning's cap: the
  // look is not kept between tries, so a budget stop repeats it, and a
  // thread past the cap waits whole for tomorrow rather than be asked in part.
  const look: FileLook = { reads: deps.figma ? cachedReads(deps.figma) : null, changes: new Map(), judgedThrough: new Map() };
  const settled: DriftPostReport["settled"] = [];
  const settledIds: string[] = [];
  const toAsk: FileDriftFinding[] = [];
  let looked = 0;
  let held = 0;
  for (const [, list] of [...groupBy(fresh, threadKey)].sort((a, b) => earliest(a[1]) - earliest(b[1]))) {
    const figmaFiles = look.reads ? list.filter((f) => isFigmaKind(f.target.kind)).length : 0;
    if (looked > 0 && looked + figmaFiles > MAX_LOOKS_PER_MORNING) {
      held += 1;
      continue;
    }
    looked += figmaFiles;
    for (const f of list) {
      if (!look.reads || !isFigmaKind(f.target.kind)) {
        toAsk.push(f);
        continue;
      }
      if (!deps.dryRun) ensureHeadroom(deps, { subrequests: CHECK_SUBREQUESTS, d1Queries: 0 });
      const check = await checkDecision(look.reads, deps.judge, {
        fileKey: f.fileKey,
        url: f.target.url,
        decidedAt: f.driftAt,
        threadSays: f.threadSays,
        sourceSays: f.sourceSays,
      });
      if (check.shows) {
        settledIds.push(f.id);
        settled.push({ channel: f.evidence.channel, threadTs: f.evidence.threadTs, fileKey: f.fileKey });
        continue;
      }
      look.changes.set(f.id, check.change);
      if (check.judged && check.change.kind === "changed") look.judgedThrough.set(f.id, check.change.at);
      toAsk.push(f);
    }
  }
  if (settledIds.length) {
    if (!deps.dryRun) await deps.store.remove(settledIds);
    notes.push(`${settledIds.length} file(s) already show their decision, so ${deps.dryRun ? "would not be" : "not"} asked`);
  }
  if (held) notes.push(`${held} thread(s) wait for tomorrow's look at their files`);

  // One finding per file per thread.
  const threads = new Map<string, ThreadPlan>();
  for (const [key, list] of groupBy(toAsk, threadKey)) {
    const findings = [...groupBy(list, (f) => f.fileKey).values()]
      .map((same) => same.sort((a, b) => a.driftAt - b.driftAt)[0]!)
      .sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
    threads.set(key, { key, findings, drafts: [] });
  }

  // Where each file's intake is drafted: its live card, or its first thread.
  const homes = new Map<string, Home>();
  const waiting = new Set<string>();
  const byGroup = groupBy([...threads.values()].flatMap((t) => t.findings), askGroupOf);
  for (const [group, list] of [...byGroup].sort((a, b) => earliest(a[1]) - earliest(b[1]))) {
    const mark = deps.dryRun ? null : await deps.store.intakeMark(group);
    if (mark?.cardTs && mark.markedAt + DRIFT_CARD_TTL_MS > now && (await deps.cardLive(markProposalKey({ ...mark, cardTs: mark.cardTs })))) {
      homes.set(group, { kind: "live", mark });
      continue;
    }
    if (mark && !mark.cardTs && mark.markedAt + POSTING_HOLD_MS > now) {
      notes.push(`${group}: a card is still being posted — held`);
      waiting.add(group);
      continue;
    }
    // Lapsed, decided, withdrawn — or a try that stopped before its post
    // an hour ago: the file may be asked afresh.
    if (mark) await deps.store.clearIntakeMark(group);
    homes.set(group, { kind: "new", thread: threadKey(list.sort((a, b) => a.driftAt - b.driftAt)[0]!) });
  }

  // Cards first: each thread that drafts an intake, oldest drift first, up to
  // the caps. A file whose card does not fit waits, everywhere it was asked.
  const drafting = [...threads.values()]
    .map((t) => ({
      t,
      mine: t.findings.map(askGroupOf).filter((g) => homes.get(g)?.kind === "new" && (homes.get(g) as { thread: string }).thread === t.key),
    }))
    .filter((x) => x.mine.length)
    .sort((a, b) => earliest(a.t.findings) - earliest(b.t.findings));
  drafting.forEach(({ t, mine }, i) => {
    const kept = i < MAX_REPORTS_PER_MORNING ? mine.slice(0, MAX_CARDS_PER_REPORT) : [];
    for (const g of mine) if (!kept.includes(g)) waiting.add(g);
    t.drafts = kept;
  });
  if (waiting.size) notes.push(`${waiting.size} file(s) wait for tomorrow's asks`);
  for (const t of threads.values()) t.findings = t.findings.filter((f) => !waiting.has(askGroupOf(f)));

  const cardLinks = new Map<string, string | null>();
  const cardPlaces = new Map<string, CardPlace>();
  const asked: string[] = [];
  const cardThreads = [...threads.values()].filter((t) => t.drafts.length).sort((a, b) => earliest(a.findings) - earliest(b.findings));
  const carded: ThreadPlan[] = [];
  for (const t of cardThreads) {
    if (await askWithCards(deps, t, byGroup, homes, look, cardLinks, cardPlaces, asks, notes)) carded.push(t);
  }
  // Recorded once every report is up, so a file drafted in a later report is
  // on this thread's record too. A file whose card did not go up stays queued.
  for (const t of carded) {
    const placed = t.findings.filter((f) => deps.dryRun || placeFor(askGroupOf(f), homes, cardPlaces));
    if (!deps.dryRun) await recordAsked(deps, placed, (f) => placeFor(askGroupOf(f), homes, cardPlaces));
    asked.push(...placed.map((f) => f.id));
  }
  let questions = 0;
  const questionThreads = [...threads.values()]
    .filter((t) => !t.drafts.length && t.findings.length)
    .sort((a, b) => earliest(a.findings) - earliest(b.findings));
  for (const t of questionThreads) {
    if (questions >= MAX_QUESTIONS_PER_MORNING) {
      notes.push(`${questionThreads.length - questions} thread(s) wait for tomorrow's pointers`);
      break;
    }
    questions += 1;
    asked.push(...(await askWithPointers(deps, t, homes, look, cardLinks, cardPlaces, asks)));
  }
  if (asked.length && !deps.dryRun) await deps.store.remove(asked);

  const note = notes.length ? notes.join("; ") : null;
  const cards = asks.filter((a) => a.role === "card").length;
  const verb = deps.dryRun ? "would ask" : "asked";
  const summary = asks.length
    ? `${verb} ${asks.length} thread(s), ${cards} with drafted intakes${note ? ` — ${note}` : ""}`
    : `no file drift due this morning${note ? ` — ${note}` : ""}`;
  return { kind: "figma-drift-post", key: job.key, outcome: "handled", note, asks, settled, summary };
}

/**
 * Whether a thread holds a drift report with a card still live: one whose
 * live record is within its 72 h and names a file whose card's proposal
 * ThreadState still holds.
 */
async function threadBusy(deps: Pick<DriftPostDeps, "store" | "cardLive">, channel: string, threadTs: string, now: number): Promise<boolean> {
  for (const ask of await deps.store.liveAsksIn(channel, threadTs)) {
    if (ask.role !== "card" || ask.askedAt + DRIFT_CARD_TTL_MS <= now) continue;
    // A record from before the shared card names no card per file: its
    // message was the one proposal.
    const keys = ask.files.some((f) => f.itemId) ? ask.files.flatMap((f) => (f.itemId ? [itemProposalKey(ask.ts, f.itemId)] : [])) : [ask.ts];
    for (const key of keys) if (await deps.cardLive(key)) return true;
  }
  return false;
}

/** One file drafted in a thread's report. */
interface Drafted {
  group: string;
  /** This thread's finding about it. */
  here: FileDriftFinding;
  /** Every thread's finding about it this morning, oldest first. */
  all: FileDriftFinding[];
  /** Its card's id in the report. */
  id: string;
  operation: ProposalOperation;
  lane: FileDriftFinding["lane"];
  /** Why its Product Pillar was left off, or null. */
  note: string | null;
}

/**
 * One thread's report: a card per file it drafts, each its own proposal, and
 * a pointer for each file it discussed whose intake is drafted elsewhere.
 *
 * @returns Whether the report went up with at least one card staged
 */
async function askWithCards(
  deps: DriftPostDeps,
  t: ThreadPlan,
  byGroup: Map<string, FileDriftFinding[]>,
  homes: Map<string, Home>,
  look: FileLook,
  cardLinks: Map<string, string | null>,
  cardPlaces: Map<string, CardPlace>,
  asks: DriftAskReport[],
  notes: string[],
): Promise<boolean> {
  const first = t.findings[0]!;
  const to = placeOf(first, deps.config);
  if (!to) {
    notes.push(`${t.key}: its place is not configured`);
    return false;
  }
  const groups = t.drafts.map((g) => ({
    group: g,
    here: t.findings.find((f) => askGroupOf(f) === g)!,
    all: (byGroup.get(g) ?? []).sort((a, b) => a.driftAt - b.driftAt),
  }));
  const publicEvidence = groups.flatMap((d) => d.all).filter((f) => f.evidence.channelKind === "public");
  if (!deps.dryRun) {
    // Everything the report will send, counted before any of it is: the
    // permalinks, a publisher and the pillar options per file, the post, its
    // record, each card's staging and usage row, the report's own permalink,
    // its live record and an edit held back.
    ensureHeadroom(deps, { subrequests: publicEvidence.length + 4 * groups.length + 5, d1Queries: 2 });
  }
  const now = deps.now();
  if (!deps.dryRun) {
    for (const d of groups) await deps.store.setIntakeMark(d.group, { channel: to.channel, threadTs: to.threadTs, cardTs: null, markedAt: now });
  }

  const permalinks: Record<string, string> = {};
  for (const f of publicEvidence) {
    const ts = f.evidence.messageTs[0];
    if (!ts || permalinks[f.id]) continue;
    const link = await deps.slack.permalink(f.evidence.channel, ts).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (link) permalinks[f.id] = link;
  }
  let options: Promise<string[] | null> | undefined;
  const drafted: Drafted[] = [];
  for (const [i, d] of groups.entries()) {
    const f = d.here;
    const figmaKey = f.fileKey.startsWith("figma:") ? f.fileKey.slice("figma:".length) : null;
    // The morning's look at the file read its versions already; the
    // publisher comes from the same read.
    const versions = figmaKey && look.reads ? await look.reads.versions(figmaKey) : null;
    const publisher = versions ? publisherOf(versions) : null;
    const candidates = pillarCandidates(d.all);
    const choice =
      f.lane === "roadmap" && candidates.length
        ? matchPillar(
            candidates,
            await (options ??= deps.pillarOptions()).catch((err: unknown) => {
              rethrowIfBudget(err);
              return null;
            }),
          )
        : { pillar: null, note: null };
    const intake = draftIntake({ findings: d.all, pillar: choice.pillar, publisher, permalinks });
    drafted.push({ ...d, id: String(i + 1), operation: intake.operation, lane: intake.lane, note: choice.note ? pillarNote(choice.note) : null });
  }
  // Files this thread discussed whose intake is drafted elsewhere: a pointer each.
  const elsewhere = t.findings.filter((f) => !t.drafts.includes(askGroupOf(f)));
  const parent = [
    driftParent([...drafted.map((d) => d.here), ...elsewhere].map((f) => f.target.kind)),
    ...elsewhere.map((f) => elsewhereLine(f.target, linkFor(askGroupOf(f), cardLinks))),
  ].join("\n");
  const report = decisionReport(
    drafted.map((d) => driftItem({ id: d.id, ...wordsOf(d.here, look), owner: d.here.owner || null, lane: d.lane })),
    parent,
  );
  const ask: DriftAskReport = {
    channel: to.channel,
    threadTs: to.threadTs,
    role: "card",
    files: t.findings.map((f) => f.fileKey),
    text: deps.dryRun && first.evidence.channelKind !== "public" ? WITHHELD_ASK_TEXT : report.text,
  };
  if (deps.dryRun) {
    asks.push(ask);
    for (const d of drafted) cardLinks.set(d.group, null);
    return true;
  }

  const clearMarks = async (list: readonly Drafted[]) => {
    for (const d of list) await deps.store.clearIntakeMark(d.group);
  };
  const sent = await deps.slack.post(to, { text: report.text, blocks: report.blocks, card: true });
  if (!sent.ok || !sent.ts) {
    await clearMarks(drafted);
    notes.push(`${t.key}: the report's post failed — kept for tomorrow`);
    return false;
  }
  const root = to.threadTs ?? sent.ts;
  const notPosted = async (why: string) => {
    await deps.slack.edit(to.channel, sent.ts!, { text: DRIFT_NOT_POSTED_TEXT, blocks: textSections(DRIFT_NOT_POSTED_TEXT) }).catch(rethrowIfBudget);
    await clearMarks(drafted);
    notes.push(`${t.key}: posted but ${why} — edited to say so, kept for tomorrow`);
    return false;
  };
  try {
    await deps.reports.putReport(reportRecord(to.channel, sent.ts, report, DRIFT_CARD_TTL_MS));
  } catch (err) {
    rethrowIfBudget(err);
    return notPosted(`its record was not kept (${err instanceof Error ? err.message : String(err)})`);
  }

  // Each card its own proposal: Review opens it, and only it.
  const staged: Drafted[] = [];
  const failed: Drafted[] = [];
  for (const d of drafted) {
    const operation = d.operation;
    const proposal: PendingProposal = {
      operations: [operation],
      toolName: operation.toolName,
      input: operation.input,
      channel: to.channel,
      threadTs: root,
      replyTs: root,
      ...itemProposal(sent.ts, d.id),
      // What Review shows: the file, what was settled, and the intake.
      proposalText: renderProposalCard(driftReview({ ...wordsOf(d.here, look), lane: d.lane, note: d.note }, operation)).text,
      // Nobody asked: the Worker staged it.
      requesterUserId: "",
      ttlMs: DRIFT_CARD_TTL_MS,
      confirmers: [...new Set(d.all.flatMap((f) => [f.owner, ...f.participants]).filter(Boolean))],
      // Nobody asked, so the gate's "ask me again" lines would be wrong.
      stated: driftCardWords(DRIFT_CARD_TTL_MS / 3_600_000),
      refuseRevision: DRIFT_NO_REVISION,
    };
    try {
      await deps.stage(proposal, first.evidence.channelKind);
      staged.push(d);
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[figma-drift] ${t.key} card ${d.id} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(d);
    }
  }
  if (!staged.length) return notPosted("no card staged");
  if (failed.length) {
    await clearMarks(failed);
    const marked = await markNotStaged(
      deps.reports,
      sent.ts,
      failed.map((d) => d.id),
      DRIFT_NOT_STAGED,
    ).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (marked) await deps.slack.edit(to.channel, sent.ts, marked).catch(rethrowIfBudget);
    notes.push(`${t.key}: ${failed.length} card(s) did not stage — kept for tomorrow`);
  }
  for (const d of staged) {
    await deps.store.setIntakeMark(d.group, { channel: to.channel, threadTs: root, cardTs: sent.ts, itemId: d.id, markedAt: now });
  }
  asks.push({ ...ask, ts: sent.ts });
  const idOf = new Map(staged.map((d) => [d.here.id, d.id] as const));
  await keepLive(
    deps,
    { channel: to.channel, ts: sent.ts, threadTs: root, role: "card" },
    staged.map((d) => d.here),
    look,
    now,
    (f) => ({ itemId: idOf.get(f.id)! }),
  );
  const link = await deps.slack.permalink(to.channel, sent.ts).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  for (const d of staged) {
    cardLinks.set(d.group, link);
    cardPlaces.set(d.group, { channel: to.channel, thread: root, ts: sent.ts, itemId: d.id });
  }
  return true;
}

/**
 * The pointers alone, in a thread whose files' intakes are drafted elsewhere.
 *
 * @returns The ids of the findings asked
 */
async function askWithPointers(
  deps: DriftPostDeps,
  t: ThreadPlan,
  homes: Map<string, Home>,
  look: FileLook,
  cardLinks: Map<string, string | null>,
  cardPlaces: Map<string, CardPlace>,
  asks: DriftAskReport[],
): Promise<string[]> {
  // A file whose card did not go up this morning is not pointed at.
  const findings = t.findings.filter((f) => placeFor(askGroupOf(f), homes, cardPlaces) || deps.dryRun);
  if (!findings.length) return [];
  const first = findings[0]!;
  const to = placeOf(first, deps.config);
  if (!to) return [];
  if (!deps.dryRun) ensureHeadroom(deps, { subrequests: 2 + findings.length, d1Queries: 0 });
  const lines: string[] = [];
  for (const f of findings) {
    const group = askGroupOf(f);
    let link = linkFor(group, cardLinks);
    const home = homes.get(group);
    if (link === null && home?.kind === "live" && home.mark.cardTs && !deps.dryRun) {
      link = await deps.slack.permalink(home.mark.channel, home.mark.cardTs).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      cardLinks.set(group, link);
    }
    lines.push(elsewhereLine(f.target, link));
  }
  const text = [driftParent(findings.map((f) => f.target.kind)), ...lines].join("\n");
  const ask: DriftAskReport = {
    channel: to.channel,
    threadTs: to.threadTs,
    role: "question",
    files: findings.map((f) => f.fileKey),
    text: deps.dryRun && first.evidence.channelKind !== "public" ? WITHHELD_ASK_TEXT : text,
  };
  if (deps.dryRun) {
    asks.push(ask);
    return findings.map((f) => f.id);
  }
  const sent = await deps.slack.post(to, { text, card: false });
  if (!sent.ok || !sent.ts) return [];
  if (to.threadTs) await deps.slack.markThread(to.channel, to.threadTs).catch(rethrowIfBudget);
  asks.push({ ...ask, ts: sent.ts });
  await keepLive(deps, { channel: to.channel, ts: sent.ts, threadTs: to.threadTs ?? sent.ts, role: "question" }, findings, look, deps.now(), (f) => {
    const place = placeFor(askGroupOf(f), homes, cardPlaces);
    return place?.ts ? { intakeKey: place.itemId ? itemProposalKey(place.ts, place.itemId) : place.ts } : {};
  });
  await recordAsked(deps, findings, (f) => placeFor(askGroupOf(f), homes, cardPlaces));
  return findings.map((f) => f.id);
}

/** A finding as its card and Review name it, with what the morning saw of
 *  its file. */
function wordsOf(f: FileDriftFinding, look: FileLook): DriftFileWords {
  return { file: f.target, threadSays: f.threadSays, decidedAt: f.driftAt, change: look.changes.get(f.id) ?? { kind: "unknown" } };
}

/**
 * Keep a posted report as live, so the re-check can withdraw it. Best-effort:
 * the report is up whether or not its record lands, and without one it simply
 * lives out its 72 h.
 */
async function keepLive(
  deps: Pick<DriftPostDeps, "store">,
  message: Pick<LiveAsk, "channel" | "ts" | "threadTs" | "role">,
  findings: readonly FileDriftFinding[],
  look: FileLook,
  now: number,
  extra: (f: FileDriftFinding) => Pick<LiveAskFile, "itemId" | "intakeKey">,
): Promise<void> {
  const ask: LiveAsk = {
    ...message,
    askedAt: now,
    files: findings.map((f) => ({
      fileKey: f.fileKey,
      kind: f.target.kind,
      url: f.target.url,
      decidedAt: f.driftAt,
      threadSays: f.threadSays,
      sourceSays: f.sourceSays,
      checkedThrough: look.judgedThrough.get(f.id) ?? f.driftAt,
      ...extra(f),
    })),
  };
  try {
    await deps.store.saveLiveAsk(ask);
    // A file-change notification reads this, and looks no further for a file
    // no live report names (`recheckOnUpdate`).
    for (const key of new Set(ask.files.filter((f) => isFigmaKind(f.kind)).map((f) => f.fileKey))) {
      await deps.store.markLiveFile(key, now + DRIFT_CARD_TTL_MS);
    }
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[figma-drift] live record for ${message.channel}:${message.ts} not kept: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** A file's report link, once fetched this morning; null until then. */
function linkFor(group: string, cardLinks: Map<string, string | null>): string | null {
  return cardLinks.get(group) ?? null;
}

function placeFor(group: string, homes: Map<string, Home>, cardPlaces: Map<string, CardPlace>): CardPlace | { channel: string; thread: string | null; ts?: string; itemId?: string } | null {
  const home = homes.get(group);
  if (home?.kind === "live") {
    const { mark } = home;
    return {
      channel: mark.channel,
      thread: mark.threadTs ?? mark.cardTs,
      ...(mark.cardTs ? { ts: mark.cardTs } : {}),
      ...(mark.itemId ? { itemId: mark.itemId } : {}),
    };
  }
  return cardPlaces.get(group) ?? null;
}

/** The thread's ask record gains these files. */
async function recordAsked(
  deps: DriftPostDeps,
  findings: readonly FileDriftFinding[],
  cardOf: (f: FileDriftFinding) => { channel: string; thread: string | null } | null,
): Promise<void> {
  const first = findings[0];
  if (!first) return;
  const threadTs = first.evidence.threadTs ?? "";
  const record = await deps.store.asked(first.evidence.channel, threadTs);
  for (const f of findings) {
    const card = cardOf(f);
    if (!card) continue;
    record[f.fileKey] = { cardChannel: card.channel, cardThread: card.thread, kind: f.target.kind, askedAt: deps.now() };
  }
  await deps.store.saveAsked(first.evidence.channel, threadTs, record);
}

/** Where a finding's report goes (`pickDestination`), never #uno-bot. */
function placeOf(f: FileDriftFinding, config: DriftPostDeps["config"]): AskPlace | null {
  const to = resolveDestination(pickDestination(f), config);
  if (!to || to.channel === config.unoBot) return null;
  return to;
}

// ── While it is live ─────────────────────────────────────────────────────────

export interface DriftRecheckDeps {
  store: Pick<DriftStore, "liveAsks" | "saveLiveAsk" | "dropLiveAsk">;
  /** The Figma client; without one, nothing is looked at. */
  figma?: Pick<FigmaClient, "versions" | "nodes">;
  /** Without one, no decision is ever found shown. */
  judge?: FrameJudge;
  /** Take a card's proposal out of reach; false when it was no longer live. */
  retire(proposalTs: string): Promise<boolean>;
  /** Edit a message in place: a report redrawn, or the pointers' new text. */
  edit(channel: string, ts: string, message: ReportMessage): Promise<void>;
  /** Where each report's record is kept, and its cards' states land. */
  reports: ReportStore;
  /** The card's cancelled row on the usage record, by the Worker. */
  recordWithdrawn(proposalTs: string): Promise<void>;
  /** Whether a card's Approve filed it, off the usage record. Without one,
   *  every caught-up pointer message is edited. */
  cardFiled?(proposalTs: string): Promise<boolean>;
  /** The live card from before the shared card in a thread
   *  (`LEGACY_DRIFT_KEY`), a `drop N` revision of it included. */
  legacyCard(channel: string, thread: string): Promise<PendingProposal | null>;
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  dryRun?: boolean;
}

/** Whether a live record's cards are withdrawn one by one: a report's on the
 *  shared card. A card from before it, and pointers, go whole. */
function perCard(ask: LiveAsk): boolean {
  return ask.role === "card" && ask.files.some((f) => f.itemId);
}

/** One card or pointer message withdrawn — or, on a dry run, that would be. */
export interface DriftWithdrawal {
  channel: string;
  ts: string;
  role: "card" | "question";
  files: string[];
  text: string;
}

export interface DriftRecheckReport {
  kind: "figma-drift-recheck";
  key: string;
  outcome: "handled";
  /** Decisions looked at. */
  checked: number;
  withdrawn: DriftWithdrawal[];
  note: string | null;
  summary: string;
}

/**
 * Look again at each live report's Figma files. A card whose file now shows
 * its decision is retired and redrawn to say so; a pointer-only message is
 * edited once every file it names does. Never a post. A report past its 72 h
 * is left as it is.
 *
 * @param job - The `figma-drift-recheck` job
 * @param deps - Everything it touches, by name
 * @param opts.fileKey - Only the reports naming this file — the seam a
 *   file-change notification calls (#896)
 * @throws A budget stop — the runner retries on a fresh budget, and what was
 *   already judged is kept on each record, so nothing is judged twice
 */
export async function recheckLiveAsks(
  job: { key: string },
  deps: DriftRecheckDeps,
  opts: { fileKey?: string } = {},
): Promise<DriftRecheckReport> {
  const now = deps.now();
  const notes: string[] = [];
  const withdrawn: DriftWithdrawal[] = [];
  const done = (checked: number): DriftRecheckReport => {
    const note = notes.length ? notes.join("; ") : null;
    const verb = deps.dryRun ? "would withdraw" : "withdrew";
    const summary = `looked at ${checked} decision(s), ${verb} ${withdrawn.length} question(s)${note ? ` — ${note}` : ""}`;
    return { kind: "figma-drift-recheck", key: job.key, outcome: "handled", checked, withdrawn, note, summary };
  };
  if (!deps.figma) {
    notes.push("no Figma client");
    return done(0);
  }
  const reads = cachedReads(deps.figma);
  const live: LiveAsk[] = [];
  for (const ask of await deps.store.liveAsks()) {
    // Past its 72 h: no re-ping, and no edit either.
    if (ask.askedAt + DRIFT_CARD_TTL_MS <= now) {
      if (!deps.dryRun) await deps.store.dropLiveAsk(ask);
      continue;
    }
    if (opts.fileKey && !ask.files.some((f) => f.fileKey === opts.fileKey)) continue;
    // Code and Storybook can't be looked at: a card's file of theirs stays,
    // and so does a message withdrawn whole that names one.
    if (perCard(ask) ? !ask.files.some((f) => isFigmaKind(f.kind)) : !ask.files.every((f) => isFigmaKind(f.kind))) continue;
    live.push(ask);
  }

  let checked = 0;
  let waiting = 0;
  let partly = 0;
  for (const ask of live.sort((a, b) => a.askedAt - b.askedAt)) {
    // Read before any card goes: a withdrawal takes its file off the record.
    const eachCard = perCard(ask);
    const open = ask.files.filter((f) => f.caughtUpAt === undefined && isFigmaKind(f.kind));
    // One report naming more files than the cap is still looked at, alone.
    if (checked > 0 && checked + open.length > MAX_RECHECKS_PER_RUN) {
      waiting += 1;
      continue;
    }
    let changed = false;
    for (const [i, f] of open.entries()) {
      // This look, the looks left on this report, and the withdrawal they may
      // lead to, so a stop comes before a look rather than mid-withdrawal.
      if (!deps.dryRun) {
        ensureHeadroom(deps, {
          subrequests: CHECK_SUBREQUESTS * (open.length - i) + WITHDRAWAL_COST.subrequests,
          d1Queries: WITHDRAWAL_COST.d1Queries,
        });
      }
      checked += 1;
      const check = await checkDecision(reads, deps.judge, f);
      if (check.change.kind !== "changed") continue;
      if (check.shows) {
        f.caughtUpAt = check.change.at;
        changed = true;
        // A card goes at once, its own file's catching up enough.
        if (eachCard) await withdrawCard(ask, f, deps, withdrawn, notes, now);
      } else if (check.judged) {
        f.checkedThrough = check.change.at;
        changed = true;
      }
    }
    if (eachCard) {
      if (deps.dryRun) continue;
      if (!ask.files.length) await deps.store.dropLiveAsk(ask);
      else if (changed) await deps.store.saveLiveAsk(ask);
    } else if (ask.files.every((f) => f.caughtUpAt !== undefined)) {
      if (ask.role === "card") await withdrawLegacyCard(ask, deps, withdrawn, notes);
      else await withdrawPointers(ask, deps, withdrawn, notes);
    } else {
      if (ask.files.some((f) => f.caughtUpAt !== undefined)) partly += 1;
      if (changed && !deps.dryRun) await deps.store.saveLiveAsk(ask);
    }
  }
  if (partly) notes.push(`${partly} question(s) wait for their other files`);
  if (waiting) notes.push(`${waiting} question(s) wait for the next run`);
  return done(checked);
}

/**
 * A file-change notification's look at one file (#896): nothing at all — no
 * list, no Figma read — unless a live report names it, and then the re-check
 * for the reports that do. The same withdrawal as the scheduled runs', about
 * 30 minutes after the edit rather than at the next run.
 *
 * @param figmaKey - The file's Figma key, as the notification names it
 * @param deps - The re-check's, and the one read that guards it
 * @returns The re-check's report, or null when no live report names the file
 */
export async function recheckOnUpdate(
  figmaKey: string,
  deps: DriftRecheckDeps & { store: DriftRecheckDeps["store"] & Pick<DriftStore, "liveFileUntil"> },
): Promise<DriftRecheckReport | null> {
  const fileKey = `figma:${figmaKey}`;
  const until = await deps.store.liveFileUntil(fileKey);
  if (until === null || until <= deps.now()) return null;
  return recheckLiveAsks({ key: `figma-update:${figmaKey}` }, deps, { fileKey });
}

/**
 * A card whose file caught up: retired first, so no Approve can file it, then
 * redrawn in place to say so, and recorded as cancelled by the Worker. A card
 * already decided or closed is left as it says. Either way the file leaves
 * the live record; a failed retire keeps it for the next run.
 */
async function withdrawCard(
  ask: LiveAsk,
  file: LiveAskFile,
  deps: DriftRecheckDeps,
  withdrawn: DriftWithdrawal[],
  notes: string[],
  now: number,
): Promise<void> {
  const note = caughtUpNote(file.caughtUpAt!);
  const entry: DriftWithdrawal = { channel: ask.channel, ts: ask.ts, role: "card", files: [file.fileKey], text: note };
  if (deps.dryRun) {
    withdrawn.push(entry);
    return;
  }
  const item = { messageTs: ask.ts, id: file.itemId! };
  const key = itemProposalKey(item.messageTs, item.id);
  let retired = false;
  try {
    retired = await deps.retire(key);
  } catch (err) {
    swallowed(err, "retire");
    // Looked at again next run, rather than kept as caught up with its card
    // still open.
    delete file.caughtUpAt;
    return;
  }
  ask.files = ask.files.filter((f) => f !== file);
  if (!retired) {
    // Approved, rejected or lapsed: the card already says what happened.
    notes.push(`${ask.channel}:${ask.ts} card ${item.id}: its card is no longer live`);
    return;
  }
  // Nothing to decide any more: the card says why where its owner was.
  const message = await settleItem(deps.reports, item, { kind: "not-staged", note }, now).catch((err: unknown) => {
    swallowed(err, "report update");
    return null;
  });
  if (message) await step(() => deps.edit(ask.channel, ask.ts, message), "edit");
  await step(() => deps.recordWithdrawn(key), "record");
  withdrawn.push(entry);
}

/**
 * A card from before the shared card, once every file it names shows its
 * decision: retired first, so no ✅ can file it, then edited to strike its
 * question through, and recorded as cancelled by the Worker — the way such a
 * card was always withdrawn. One already decided or lapsed is left as it says.
 */
async function withdrawLegacyCard(ask: LiveAsk, deps: DriftRecheckDeps, withdrawn: DriftWithdrawal[], notes: string[]): Promise<void> {
  const text = legacyCaughtUpText(ask.headline ?? LEGACY_HEADLINE, Math.max(...ask.files.map((f) => f.caughtUpAt!)));
  const files = ask.files.map((f) => f.fileKey);
  if (deps.dryRun) {
    withdrawn.push({ channel: ask.channel, ts: ask.ts, role: ask.role, files, text });
    return;
  }
  ensureHeadroom(deps, WITHDRAWAL_COST);
  let card: PendingProposal | null = null;
  let retired = false;
  try {
    card = await deps.legacyCard(ask.channel, ask.threadTs);
    if (card) retired = await deps.retire(card.proposalTs);
  } catch (err) {
    swallowed(err, "legacy card");
    return;
  }
  if (!card || !retired) {
    await deps.store.dropLiveAsk(ask);
    notes.push(`${ask.channel}:${ask.ts}: its card is no longer live`);
    return;
  }
  const live = card;
  await step(() => deps.edit(live.channel, live.proposalTs, { text, blocks: textSections(text) }), "edit");
  await step(() => deps.recordWithdrawn(live.proposalTs), "record");
  await deps.store.dropLiveAsk(ask);
  withdrawn.push({ channel: live.channel, ts: live.proposalTs, role: ask.role, files, text });
}

/** The question a card from before the shared card asked about one Figma file. */
const LEGACY_HEADLINE = "Is the Figma file still current?";

/** Edit caught-up pointers in place. */
async function withdrawPointers(ask: LiveAsk, deps: DriftRecheckDeps, withdrawn: DriftWithdrawal[], notes: string[]): Promise<void> {
  const text = caughtUpText(ask.files.length, Math.max(...ask.files.map((f) => f.caughtUpAt!)));
  const files = ask.files.map((f) => f.fileKey);
  if (!deps.dryRun) ensureHeadroom(deps, WITHDRAWAL_COST);
  // Pointers whose card's Approve filed the intake are not told there is
  // nothing to do: their record goes, and the message stays as it is.
  const filed = await cardFiled(ask, deps);
  if (filed !== "open") {
    if (deps.dryRun) return;
    if (filed === "filed") await deps.store.dropLiveAsk(ask);
    else await deps.store.saveLiveAsk(ask);
    notes.push(`${ask.channel}:${ask.ts}: ${filed === "filed" ? "its card filed the intake" : "its card's record could not be read"}`);
    return;
  }
  if (deps.dryRun) {
    withdrawn.push({ channel: ask.channel, ts: ask.ts, role: ask.role, files, text });
    return;
  }
  await step(() => deps.edit(ask.channel, ask.ts, { text, blocks: textSections(text) }), "edit");
  await deps.store.dropLiveAsk(ask);
  withdrawn.push({ channel: ask.channel, ts: ask.ts, role: ask.role, files, text });
}

/** Whether a pointer's card was filed by its Approve; `unknown` when a read
 *  failed, so the message waits for the next run rather than be edited. */
async function cardFiled(ask: LiveAsk, deps: DriftRecheckDeps): Promise<"filed" | "open" | "unknown"> {
  if (!deps.cardFiled) return "open";
  // A question from before the shared card names its card by `cardTs`.
  const keys = ask.files.flatMap((f) => {
    const key = f.intakeKey ?? f.cardTs;
    return key ? [key] : [];
  });
  for (const key of new Set(keys)) {
    try {
      if (await deps.cardFiled(key)) return "filed";
    } catch (err) {
      swallowed(err, "filed read");
      return "unknown";
    }
  }
  return "open";
}

/** One best-effort step of a withdrawal: logged, never thrown, but a budget stop. */
async function step(fn: () => Promise<void>, what: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    swallowed(err, what);
  }
}

function swallowed(err: unknown, what: string): false {
  if (isSubrequestBudgetError(err)) throw err;
  console.error(`[figma-drift] ${what} failed: ${err instanceof Error ? err.message : String(err)}`);
  return false;
}

// ── Shared ───────────────────────────────────────────────────────────────────

function threadKey(f: FileDriftFinding): string {
  return `${f.evidence.channel}:${f.evidence.threadTs ?? ""}`;
}

function earliest(findings: readonly FileDriftFinding[]): number {
  return Math.min(...findings.map((f) => f.driftAt));
}

function groupBy<T>(list: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of list) out.set(keyOf(item), [...(out.get(keyOf(item)) ?? []), item]);
  return out;
}

/** Stop, as the budget does, unless what is left covers the step. */
function ensureHeadroom(deps: Pick<DriftPostDeps, "meter">, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}
