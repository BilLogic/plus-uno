// `runSweepJob(job, deps)` — the end-of-day sweep, one scheduled job at a time.
//
// FIVE JOB KINDS, one entry point:
//
//   `sweep-channel` (end of day, one per channel on `SWEEP_CHANNELS`) reads the
//   channel since its cursor with the bot token — `conversations.history` in
//   pages of 200, plus the replies of every thread active since then — follows
//   the links each thread carries through the existing source reads, asks the
//   detector, routes each finding to its owner, and queues it for the morning.
//   It posts nothing. A finding on a file uno-bot cannot write — Figma, the
//   design-system code, Storybook — is routed the same way and handed to the
//   morning's ask in its thread (`fileDrift`, `figma-drift/`).
//
//   `sweep-group-dms` (end of day, one job) does the same for every group DM
//   uno-bot is in, as the bot's own conversation list names them, one after
//   another on the job's budget; each keeps its own cursor and run record.
//
//   `sweep-dms` (end of day, one job) reads each 1:1 DM uno-bot answered in
//   since its last run (`SweepDeps.dms`, from the usage record) with the bot
//   token — a DM uno-bot is a party to needs no opt-in. Each DM thread, both
//   sides of it, goes to `onDmThread` (`../dm-sweep/`), which keeps what uno-bot
//   could not answer and what it saw disagree, and says whether the person
//   stated a decision (C7) or answered uno-bot's ask about a missed question
//   (F6). Only then does the thread go through the drift and placement reads
//   below, its links read from uno-bot's answers too; what they find is posted
//   back only in that DM. A DM finding never shadows a channel's copy of the
//   same fix: a DM is one person's, and the team's thread keeps its card.
//
//   A thread that names a page without linking it has that page searched for
//   (`./search.ts`), and one that asks a question someone answered is asked
//   where the answer belongs when no page holds it (`./capture-detector.ts`):
//   that finding adds the answer under its section rather than replacing a
//   block, and posts in the thread like any other.
//
//   `sweep-notes` and `sweep-cards` (end of day) read the running notes and
//   the Roadmap cards edited since their cursors for recorded decisions
//   (`./records.ts`), and queue what they find the same way.
//
//   `sweep-post` (the weekday morning run) takes the findings whose morning has
//   come (`postableAt`), groups them by destination (`pickDestination`), and
//   posts each place's report on the shared decision card
//   (`slack/decision-cards.ts`): a parent line, then a card per fix with
//   Review and Open page. Each fix is staged as its own proposal, without a
//   Turn, with its own TTL and the report's confirmers. One live report per
//   place: a place whose report is still live gets none, and what does not
//   fit waits in the queue. A quiet day posts nothing.
//
// THE AUDIENCE RULE (ADR-031). A run with no requester has no one whose
// visibility bounds it, so the evidence's own audience does: a finding only
// reaches people who could already see its evidence.
//   • A public channel's finding is posted in its own thread.
//   • A private channel is read only when it is on `SWEEP_CHANNELS` AND on the
//     team's private allowlist (`SLACK_SEARCH_PRIVATE_ALLOWLIST`); off the
//     allowlist it is never read, whatever the sweep list says. Its finding
//     stays in its thread, its owner is someone in the channel, and nothing of
//     it — text, link or name — reaches any other message.
//   • A group DM uno-bot is in is read the same way and its finding posted
//     back in it. Once a fix there is written, a share card offers a reworded
//     note in the team channel — the page's name, no quote, no names
//     (`./share.ts`).
//   • A fix found both in a public thread and in a private place is private:
//     it goes on the private report, and the public copy leaves the queue.
//   • A 1:1 DM with uno-bot is read only by `sweep-dms`, and everything it
//     finds is posted back only in that DM. Its one way out is the ✅ on the
//     DM sweep's offer to raise a disagreement (`../dm-sweep/`).
//   • Any other DM is never read, and #uno-bot is never swept and never
//     posted in.
//
// THE BUDGET. Each alarm runs one job on a fresh subrequest budget, under the
// lookup ceiling (ADR-022). A channel's threads are processed oldest activity
// first and the cursor is saved after each one, so a budget stop keeps every
// thread already done: the job records where it stopped and rethrows the stop,
// and the runner keeps the job under its key and runs it again on a fresh
// budget (`runner/queue.ts`). A retried job is idempotent — the cursor skips
// what is done and the queue replaces a finding by its id. A history read
// that stops at its page cap never moves the cursor past the oldest root it
// read, and a thread too long to read whole is left with a note.
//
// A POSTED REPORT IS ALWAYS STAGED, OR WITHDRAWN. A report starts only when
// the budget left covers all of it (`CARD_COST`). Its items are recorded
// first, in one statement and without a ts; then it is posted, tagged with
// its key in Slack's message metadata; then its record is kept and each fix
// staged; then its items take its ts (`markPosted`). A stop anywhere in that
// leaves items without a ts, and the next try finds the report by its tag and
// stages the fixes not yet staged — or, when it never went up, releases the
// items and cards the findings afresh. A fix whose staging fails outright
// says so on its card and stays queued; a report none of whose fixes staged
// is edited to say it did not go through, and its items are released.
//
// A FIX IS PROPOSED ONCE. A reply under a report is activity past the cursor, so
// the next night re-reads the thread and the detector may find the same drift
// again. The morning skips any fix the thread has already had carded —
// proposed, dropped or applied.
//
// Every dependency is injected — the Slack reads, the source reads, the people
// lookup, the detector, the store, the delivery and the clock — so the Node
// suite runs whole days against fakes (tests/sweep-run.test.ts). `Env` enters
// in `./env.ts`.

import { D1QueryBudgetError, isSubrequestBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import type { HistoryMessage } from "../slack/api";
import { proposalReplyThread, type PendingProposal, type ThreadState } from "../thread-state/index";
import { recordProposalEvents, stagedEvent, storesChannel, supersededEvents, type ProposalEventLog } from "../usage/index";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import {
  cardPlan,
  destinationKey,
  itemOperation,
  operationsDigest,
  planSweepCards,
  sweepItem,
  sweepItemText,
  sweepItemWords,
  sweepParent,
  sweepReportMetadata,
  sweepShareOf,
  SWEEP_CARD_TTL_MS,
  SWEEP_REVISE_INSTEAD,
  type SweepCardPlan,
} from "./cards";
import {
  decisionReport,
  itemProposal,
  itemProposalKey,
  markNotStaged,
  plainReportBlocks,
  reportRecord,
  type DecisionReport,
  type ReportStore,
} from "../slack/decision-cards";
import { MAX_MESSAGE_CHARS, type DriftDetector } from "./detector";
import type { CaptureDetector } from "./capture-detector";
import { sweepRecords, type SweepNotion } from "./records";
import { sweepFigmaComments } from "../figma-comments/read";
import { postFigmaDecisions } from "../figma-comments/post";
import type { QueuedFile, SweepFigmaComments } from "../figma-comments/queue";
import { readUsable, searchGate } from "./surfaces";
import { findBySearch, looksAnswered, namedThings, questionQuery, type SourceSearch } from "./search";
import {
  classifyLink,
  conversationTypeOf,
  linksIn,
  pickDestination,
  resolveDestination,
  routeOwner,
  type ChannelKind,
  type Destination,
  type SweepMessage,
  type SweepSource,
  type SweepThread,
  type TargetKind,
} from "./finding";
import { postableAt } from "./schedule";
import {
  fileDriftFinding,
  intakeLaneOf,
  triggersFileDrift,
  type FileDriftFinding,
  type FileDriftSink,
} from "../figma-drift/finding";
import type {
  CardSnapshot,
  PendingFinding,
  SweepItemRecord,
  SweepItemStatus,
  SweepRunOutcome,
  SweepRunRecord,
  SweepStore,
} from "./store";

/** A first sweep of a channel reads its last day. */
export const FIRST_SWEEP_WINDOW_MS = 24 * 60 * 60 * 1000;
/** How far back a thread's root may be and still count as active: a reply
 *  today in a thread started last week is today's evidence. */
export const ACTIVE_THREAD_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
/** `conversations.history` pages of 200, at most this many per job. */
export const MAX_HISTORY_PAGES = 5;
/** Characters of thread text the detector is shown; past it, the oldest
 *  replies are left out (the root always stays) and the run notes it. */
export const MAX_THREAD_CHARS = 24_000;
/** Consecutive failed nights after which a thread is skipped and the cursor
 *  moves past it. */
export const MAX_FAILED_NIGHTS = 2;
/** Sources followed per thread, Notion first. */
export const MAX_SOURCES_PER_THREAD = 3;
/** `conversations.replies` pages of 200 read per thread; a longer thread is
 *  left unread, with a note. */
export const MAX_REPLY_PAGES = 5;
/** Pages of a thread (or of a channel's top) read looking for a posted card
 *  by its tag; past them the answer is "unknown", and the card is held. */
export const FIND_POSTED_PAGES = 3;
/** Permalinks fetched per morning job — one per item, best-effort. */
export const MAX_PERMALINKS = 20;
/**
 * What one card may spend, past its permalinks and the messages it posts: a
 * Slack call held back for the edit that withdraws a card whose staging
 * failed, and the D1 statements — its items, their ts, a release, and the
 * run's own record.
 */
export const CARD_COST = { reserveSubrequests: 1, d1Queries: 4 };

/** A message as `conversations.history` / `.replies` return it. */
export type SweepSlackMessage = HistoryMessage;

/** The Slack reads, with the bot token. */
export interface SweepSlack {
  /** What kind of conversation this is, or null when Slack would not say. */
  channelKind(channel: string): Promise<ChannelKind | null>;
  /** One page of the channel's top-level messages since `oldest`, or null. */
  history(
    channel: string,
    oldest: string,
    cursor?: string,
  ): Promise<{ messages: SweepSlackMessage[]; nextCursor?: string } | null>;
  /** One page of a thread, root first, or null. */
  replies(
    channel: string,
    rootTs: string,
    cursor?: string,
  ): Promise<{ messages: SweepSlackMessage[]; nextCursor?: string } | null>;
  /** A private place's members, or null when Slack would not say. Absent, no
   *  Contributor counts as one. */
  members?(channel: string): Promise<string[] | null>;
  /** The group DMs uno-bot is in, or null when the list cannot be read. */
  groupDms?(): Promise<string[] | null>;
}

/** A 1:1 DM uno-bot answered in, and its person. */
export interface ActiveDm {
  channel: string;
  person: string;
}

/** One message of a person's DM with uno-bot, either side. */
export interface DmMessage {
  ts: string;
  /** The person's id, or uno-bot's for its own messages. */
  user: string;
  text: string;
  byBot: boolean;
  /** An app's tag on the message (Slack message metadata), when it has one. */
  tag?: { type: string; payload: Record<string, unknown> };
}

/** A thread of a person's DM with uno-bot, as `sweep-dms` reads it. */
export interface DmThread {
  channel: string;
  /** The person whose DM it is. */
  person: string;
  rootTs: string;
  /** Both sides, root first. */
  messages: DmMessage[];
}

/** What a DM thread asks of the sweep's own reads: drift, for a decision the
 *  person stated; placement, for an answer to uno-bot's ask. */
export interface DmThreadVerdict {
  decision: boolean;
  answered: boolean;
}

/** A report's message as Slack will post it (`decisionReport`). */
export interface SweepReportMessage {
  text: string;
  blocks: unknown[];
  /** Its tag, which an edit sends again. */
  metadata?: { event_type: string; event_payload: Record<string, unknown> };
}

/** Where a card lands: a thread, or the top of a channel. */
export interface CardPlace {
  channel: string;
  threadTs: string | null;
}

/** What a card's Slack tag carries (`SWEEP_CARD_EVENT`). */
export interface CardTag {
  cardKey: string;
  /** `operationsDigest` of what the card shows. */
  digest: string;
}

/** A search for a posted card by its tag: found, surely not there, or not
 *  known — a failed read, or more pages than the search reads. */
export type PostedCard =
  | { state: "found"; ts: string; text: string; digest: string; plain?: boolean }
  | { state: "absent" }
  | { state: "unknown"; why: string };

/** Posting and staging, and the reads the morning needs. */
export interface SweepDelivery {
  /** Post the report, tagged with its key and digest. `refusedBlocks` when
   *  Slack refused its blocks, so it may step down to plain sections. */
  post(to: CardPlace, message: SweepReportMessage, tag: CardTag): Promise<{ ok: boolean; ts?: string; refusedBlocks?: boolean }>;
  /** Edit a posted report in place (`chat.update`): a fix that did not stage
   *  says so on its card. */
  edit(channel: string, ts: string, message: SweepReportMessage): Promise<void>;
  /** Where each report's record is kept: each fix's decision lands on it, and
   *  its message is drawn again from it (`slack/decision-cards.ts`). */
  reports: ReportStore & Pick<ThreadState, "putReport">;
  /** The card's own message under this key, matched by its tag's key and
   *  role. `since` bounds a channel-top search. */
  findPosted(to: CardPlace, cardKey: string, since: string): Promise<PostedCard>;
  /** Stage one fix, as a turn's staging does, in a place of this kind. */
  stage(proposal: PendingProposal, channelKind: ChannelKind): Promise<void>;
  /** The sweep cards ThreadState holds live in a channel — a revision or a
   *  re-staged card among them, whether or not the records caught up. */
  liveCards(channel: string): Promise<PendingProposal[]>;
  /** Whether one posted fix was ever staged, and what became of it
   *  (`sweepCardState`), by its proposal's key. */
  cardState(proposalTs: string): Promise<SweepCardState>;
  /** Retire the report's fixes in ThreadState, by their proposals' keys, so
   *  none can be decided; replace its text, remove its cards, and retag it so
   *  a later search by its key passes it over. */
  withdraw(channel: string, ts: string, text: string, cardKey: string, proposalKeys: readonly string[]): Promise<void>;
  permalink(channel: string, ts: string): Promise<string | null>;
}

export interface SweepConfig {
  plusDesign?: string;
  plusUniversal?: string;
  /** #uno-bot: never swept, never posted in. */
  unoBot?: string;
  /** The DS library file key, so a link to it counts as the design system. */
  figmaLibraryKey?: string;
  /** The bot's own user id, whose messages are not evidence. */
  botUserId?: string | null;
  /** The private channels the team cleared (`SLACK_SEARCH_PRIVATE_ALLOWLIST`):
   *  the only ones the sweep reads. */
  privateAllowlist?: readonly string[];
  /** Design Running Notes (`NOTION_RUNNING_NOTES_DB_ID`): what `sweep-notes` reads. */
  runningNotesDb?: string;
  /** The Roadmap (`NOTION_ROADMAP_DB_ID`): what `sweep-cards` reads. */
  roadmapDb?: string;
  /** The databases a search hit may be a row of (`./surfaces.ts`). */
  teamSurfaceDbs?: readonly string[];
}

export interface SweepDeps extends Pick<JobContext, "runDate"> {
  slack: SweepSlack;
  sources: { read(url: string, kind: TargetKind): Promise<SweepSource | null> };
  /** A Contributor's name as a Slack id, when exactly one person has it. */
  people: { slackIdFor(name: string): Promise<string | null> };
  detector: DriftDetector;
  /** The Capture detectors beside drift — undocumented answers, and decisions
   *  in notes and cards (`./capture-detector.ts`). Absent, neither runs. */
  capture?: CaptureDetector;
  /** Searches for a page a message names without linking (`./search.ts`).
   *  Absent, nothing is searched. */
  search?: SourceSearch;
  /** The running-notes and Roadmap reads (`./records.ts`). Absent, those
   *  two jobs skip. */
  notion?: SweepNotion;
  /** Figma comment decisions: the night's reads and the morning's posts
   *  (`../figma-comments/`). Absent, those two jobs skip. */
  figmaComments?: SweepFigmaComments;
  store: SweepStore;
  delivery: SweepDelivery;
  config: SweepConfig;
  /** The invocation's meter: spend for the run record, and what is left
   *  before a card starts. Zeros and no limit without one. */
  meter?: {
    subrequests(): number;
    d1Queries(): number;
    headroom(): { subrequests: number; d1Queries: number };
  };
  now(): number;
  /** Reads and detects as a real run does, and writes, posts and stages nothing. */
  dryRun?: boolean;
  /**
   * Handed each thread the end-of-day job reads — its human messages, root
   * first — and the channel's cursor, so another job reads the same threads
   * without a second read (commitment reminders, `commitments/run.ts`). A
   * budget stop throws through; any other failure is the hook's to swallow.
   */
  onThread?(thread: SweepThread, since: string): Promise<void>;
  /**
   * The 1:1 DMs uno-bot answered in since `since` (epoch ms), each with its
   * person, or null when they cannot be read. Absent, `sweep-dms` skips.
   */
  dms?(since: number): Promise<ActiveDm[] | null>;
  /**
   * Handed each DM thread `sweep-dms` reads — both sides — and the DM's
   * cursor (`../dm-sweep/`). A budget stop throws through; any other failure
   * is the hook's to swallow. Absent, `sweep-dms` skips.
   */
  onDmThread?(thread: DmThread, since: string): Promise<DmThreadVerdict>;
  /**
   * Handed each team running note the notes job reads — past its team-note
   * guard — with its entries edited since the cursor and its Note Takers as
   * Slack ids, so another job reads the same notes without a second read
   * (card to-dos, `follow-through/run.ts`). A budget stop throws through; any
   * other failure is the hook's to swallow.
   */
  onNote?(note: {
    pageId: string;
    url: string;
    entries: Array<{ id: string; text: string; at: number }>;
    takers: string[];
  }): Promise<void>;
  /**
   * Where a finding on a file uno-bot cannot write goes — a Figma file, the
   * design-system code, Storybook — for the morning's ask in its thread
   * (`figma-drift/`). Absent, such a finding is counted and left, and a
   * thread with no Notion link is passed over.
   */
  fileDrift?: FileDriftSink;
}

/** One planned or posted card, as the report shows it. */
export interface SweepCardReport {
  key: string;
  destination: Destination;
  channel: string;
  threadTs: string | null;
  items: number;
  /** The report's fallback text, then each fix whole as its Review shows it. */
  text: string;
  proposalTs?: string;
}

/** What one job came to. */
export interface SweepJobReport {
  kind:
    | "sweep-channel"
    | "sweep-group-dms"
    | "sweep-dms"
    | "sweep-post"
    | "sweep-notes"
    | "sweep-cards"
    | "sweep-figma-comments"
    | "sweep-figma-post";
  key: string;
  outcome: SweepRunOutcome;
  note: string | null;
  channel?: string;
  threads: number;
  /** Kept tonight (end of day), or carded this morning. */
  findings: PendingFinding[];
  /** On a dry run, the findings from private places, as ids only
   *  (`withheldFromDryRun`). */
  withheld?: Array<{ id: string; channel: string; channelKind: ChannelKind }>;
  /** Posted this morning — or, on a dry run, what would be. */
  cards: SweepCardReport[];
  /** The Figma comment jobs: the files whose decisions were kept tonight, or
   *  posted this morning (`../figma-comments/`). */
  figmaFiles?: QueuedFile[];
  summary: string;
}

/**
 * Run one sweep job.
 *
 * @param job - A `sweep-channel` or `sweep-post` job
 * @param deps - Everything it touches, by name
 * @throws A budget stop, after saving what was done — so the runner defers
 */
export async function runSweepJob(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const report =
    job.kind === "sweep-post"
      ? await postFindings(job, deps)
      : job.kind === "sweep-group-dms"
        ? await sweepGroupDms(job, deps)
        : job.kind === "sweep-dms"
          ? await sweepDms(job, deps)
          : job.kind === "sweep-notes" || job.kind === "sweep-cards"
            ? await sweepRecords(job, deps)
            : job.kind === "sweep-figma-comments"
              ? await sweepFigmaComments(job, deps)
              : job.kind === "sweep-figma-post"
                ? await postFigmaDecisions(job, deps)
                : await sweepChannel(job, deps);
  return deps.dryRun ? withheldFromDryRun(report) : report;
}

/** What a dry run's report shows of a card from a private place. */
export const WITHHELD_TEXT = "(withheld: this card is for a private channel or a group DM)";

/**
 * A dry run's report with everything from a private channel, a group DM or a
 * DM reduced to counts and ids. `/debug/sweep` shows the report to whoever
 * calls it, who may be no one who could see that evidence (ADR-031): its
 * findings leave as their id, channel and kind — no text on either side, no
 * replacement, no owner — and its cards keep their place and count, not their
 * text. The summary's counts still include them.
 *
 * @param report - A dry run's report
 */
export function withheldFromDryRun(report: SweepJobReport): SweepJobReport {
  const hidden = report.findings.filter((f) => f.evidence.channelKind !== "public");
  if (!hidden.length && !report.cards.some((c) => c.destination.rung === "private")) return report;
  return {
    ...report,
    findings: report.findings.filter((f) => f.evidence.channelKind === "public"),
    withheld: hidden.map((f) => ({ id: f.id, channel: f.evidence.channel, channelKind: f.evidence.channelKind })),
    cards: report.cards.map((c) => (c.destination.rung === "private" ? { ...c, text: WITHHELD_TEXT } : c)),
  };
}

// ── End of day: read, detect, queue ──────────────────────────────────────────

/**
 * Every group DM uno-bot is in, one after another on this job's budget. Each
 * is swept as a channel is — its own cursor, its own run record under
 * `<job key>:<channel>`. A budget stop part-way keeps what is done and is
 * thrown, so the runner retries the job on a fresh budget; the retry passes
 * over every group DM whose run today is already handled, spending one record
 * read on each instead of its Slack reads. Any other failure in one group DM
 * is logged and counted, and the rest are still swept.
 */
async function sweepGroupDms(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const base = { kind: "sweep-group-dms" as const, key: job.key };
  const listed = deps.slack.groupDms ? await deps.slack.groupDms() : null;
  if (!listed) {
    const note = "the group DMs uno-bot is in could not be listed";
    return { ...base, outcome: "skipped", note, threads: 0, findings: [], cards: [], summary: note };
  }
  const runDate = deps.runDate;
  const reports: SweepJobReport[] = [];
  let done = 0;
  const failed: string[] = [];
  for (const channel of listed.filter((c) => c && c !== deps.config.unoBot)) {
    const key = `${job.key}:${channel}`;
    if (!deps.dryRun && (await deps.store.getRun(`${runDate}:${key}`))?.outcome === "handled") {
      done += 1;
      continue;
    }
    try {
      reports.push(await sweepChannel({ key, kind: "sweep-channel", channel }, deps, "group-dm"));
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[sweep] group DM ${channel} failed: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(channel);
    }
  }
  const threads = reports.reduce((n, r) => n + r.threads, 0);
  const findings = reports.flatMap((r) => r.findings);
  const cards = reports.flatMap((r) => r.cards);
  const notes = [
    ...(done ? [`${done} already swept this run`] : []),
    ...(failed.length ? [`${failed.length} failed: ${failed.join(", ")}`] : []),
    ...reports.filter((r) => r.note).map((r) => `${r.channel}: ${r.note}`),
  ];
  const note = notes.length ? notes.join("; ") : null;
  const counted = `${reports.length} group DM(s), ${threads} thread(s) read, ${findings.length} finding(s) kept for the morning`;
  return { ...base, outcome: "handled", note, threads, findings, cards, summary: note ? `${counted} — ${note}` : counted };
}

/** How far back `sweep-dms` looks for DMs uno-bot answered in: a weekend and
 *  a missed run. Two end-of-day runs are at most 96 h apart (Sat 00:00 to
 *  Wed 00:00 with Tuesday's missed), and 97 h on the weekend the clocks go
 *  back, so four days and two hours covers both with an hour to spare. Each
 *  DM's own cursor says what in it is new. */
export const DM_LOOKBACK_MS = (4 * 24 + 2) * 60 * 60 * 1000;

/**
 * Every 1:1 DM uno-bot answered in lately, one after another on this job's
 * budget, as the group-DM job goes: each its own cursor and run record under
 * `<job key>:<channel>`, a retry passing over the DMs already handled today,
 * and one DM's failure logged without stopping the rest. The list comes from
 * the usage record, not from Slack, so it needs no scope to list DMs and
 * costs one D1 read however many DMs uno-bot has.
 */
async function sweepDms(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const base = { kind: "sweep-dms" as const, key: job.key };
  const skipped = (note: string): SweepJobReport => ({ ...base, outcome: "skipped", note, threads: 0, findings: [], cards: [], summary: note });
  if (!deps.dms || !deps.onDmThread) return skipped("no DM reader is wired");
  const listed = await deps.dms(deps.now() - DM_LOOKBACK_MS);
  if (!listed) return skipped("the DMs uno-bot answered in could not be listed");
  const runDate = deps.runDate;
  const reports: SweepJobReport[] = [];
  const failed: string[] = [];
  const dms = listed.filter((dm, i) => dm.channel.startsWith("D") && listed.findIndex((d) => d.channel === dm.channel) === i);
  const runIdOf = (channel: string) => `${runDate}:${job.key}:${channel}`;
  // One read for every DM already swept this run, however many a retry passes over.
  const handled = new Set(deps.dryRun || !dms.length ? [] : await deps.store.handledRuns(dms.map((dm) => runIdOf(dm.channel))));
  let done = 0;
  for (const dm of dms) {
    const key = `${job.key}:${dm.channel}`;
    if (handled.has(runIdOf(dm.channel))) {
      done += 1;
      continue;
    }
    try {
      reports.push(await sweepChannel({ key, kind: "sweep-channel", channel: dm.channel }, deps, "dm", dm.person));
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[sweep] DM ${dm.channel} failed: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(dm.channel);
    }
  }
  const threads = reports.reduce((n, r) => n + r.threads, 0);
  const findings = reports.flatMap((r) => r.findings);
  const cards = reports.flatMap((r) => r.cards);
  const notes = [
    ...(done ? [`${done} already swept this run`] : []),
    ...(failed.length ? [`${failed.length} failed: ${failed.join(", ")}`] : []),
    ...reports.filter((r) => r.note).map((r) => `${r.channel}: ${r.note}`),
  ];
  const note = notes.length ? notes.join("; ") : null;
  const counted = `${reports.length} DM(s), ${threads} thread(s) read, ${findings.length} finding(s) kept for the morning`;
  return { ...base, outcome: "handled", note, threads, findings, cards, summary: note ? `${counted} — ${note}` : counted };
}

/**
 * One channel's end of day.
 *
 * @param only - Sweep it only when Slack says it is this kind — how the
 *   group-DM job holds itself to group DMs. `dm` is the DM job's: a `D…` id
 *   is a DM, and Slack is not asked.
 * @param person - The DM's person, for `dm`
 */
async function sweepChannel(
  job: ScheduledJob,
  deps: SweepDeps,
  only?: ChannelKind,
  person?: string,
): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const channel = job.channel ?? "";
  const base = { kind: "sweep-channel" as const, key: job.key, channel };
  const finish = async (
    outcome: SweepRunOutcome,
    note: string | null,
    threads: number,
    findings: PendingFinding[],
    cards: SweepCardReport[] = [],
  ): Promise<SweepJobReport> => {
    await recordRun(deps, {
      runName: "end-of-day",
      jobKey: job.key,
      channels: channel ? [channel] : [],
      threads,
      items: findings.length,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const counted = `${threads} thread(s) read, ${findings.length} finding(s) kept for the morning`;
    const summary = outcome === "handled" && note ? `${counted} — ${note}` : (note ?? counted);
    return { ...base, outcome, note, threads, findings, cards, summary };
  };

  if (!channel) return finish("skipped", "no channel on the job", 0, []);
  if (channel === deps.config.unoBot) return finish("skipped", "#uno-bot is never swept", 0, []);
  // A DM's kind is its id's: asking Slack would need a scope uno-bot has no
  // other use for.
  const kind = only === "dm" ? (channel.startsWith("D") && person ? "dm" : null) : await deps.slack.channelKind(channel);
  if (kind === null) return finish("skipped", "Slack would not describe the channel", 0, []);
  if (kind === "dm" && only !== "dm") return finish("skipped", "a DM is read only by the DM job", 0, []);
  if (only && kind !== only) return finish("skipped", `not a ${only}`, 0, []);
  if (kind === "private" && !(deps.config.privateAllowlist ?? []).includes(channel)) {
    return finish("skipped", "a private channel off the private allowlist is never read", 0, []);
  }

  const now = deps.now();
  const cursor = (await deps.store.cursor(channel)) ?? tsOf(now - FIRST_SWEEP_WINDOW_MS);
  const oldest = tsOf(msOf(cursor) - ACTIVE_THREAD_LOOKBACK_MS);
  const runDate = deps.runDate;
  const kept: PendingFinding[] = [];
  let threads = 0;
  let readOnly = 0;
  let fileDrifts = 0;
  let reached = cursor;
  const notes: string[] = [];
  const resolved = new Map<string, string | null>();
  // A private place's members, read once, the first time a Contributor is
  // about to be named owner there.
  let members: Promise<ReadonlySet<string>> | undefined;
  // A DM's one member beside uno-bot is its person, who is its owner anyway:
  // no Contributor elsewhere is named there.
  const membersOf = (): Promise<ReadonlySet<string>> =>
    (members ??= (kind === "dm" ? Promise.resolve(null) : deps.slack.members ? deps.slack.members(channel) : Promise.resolve(null)).then(
      (m) => new Set(m ?? []),
    ));

  try {
    const { units, readTo } = await activeThreads(deps, channel, oldest, cursor);
    if (readTo) notes.push(`history ran past ${MAX_HISTORY_PAGES} pages; the cursor stays at or before ${readTo}`);
    const failing = new Set(units.length && !deps.dryRun ? await deps.store.failingThreads(channel) : []);
    // A thread that failed: held — the cursor stays before it and the job
    // stops — unless it has now failed `MAX_FAILED_NIGHTS` nights running,
    // when it is skipped and the cursor moves past it. A budget stop throws
    // past this; a model quota stop holds without counting.
    const failed = async (rootTs: string, why: string, counts: boolean): Promise<"hold" | "skip"> => {
      if (!counts || deps.dryRun) return "hold";
      const nights = await deps.store.recordThreadFailure(channel, rootTs, runDate);
      if (nights < MAX_FAILED_NIGHTS) return "hold";
      await deps.store.clearThreadFailure(channel, rootTs);
      console.warn(`[sweep] ${channel} thread ${rootTs} skipped after ${nights} failed nights: ${why}`);
      notes.push(`thread ${rootTs} skipped after ${nights} failed nights (${why})`);
      return "skip";
    };
    for (const unit of units) {
      const messages = unit.replies ? await readThread(deps, channel, unit.root.ts) : [unit.root];
      if (!messages) {
        const why = "its replies could not be read";
        if ((await failed(unit.root.ts, why, true)) === "hold") {
          return finish("handled", `stopped at ${reached}: a thread's replies could not be read`, threads, kept);
        }
      } else if (messages !== "too-long") {
        const humans = messages.filter((m) => isHuman(m, deps.config.botUserId)).map(toSweepMessage);
        threads += 1;
        if (deps.onThread && kind !== "dm") await deps.onThread({ channel, channelKind: kind, rootTs: unit.root.ts, messages: humans }, cursor);
        // A DM thread goes to the DM hook first, which says what — if
        // anything — the drift and placement reads should look for.
        const dm =
          kind === "dm" && deps.onDmThread
            ? {
                ...(await deps.onDmThread({ channel, person: person!, rootTs: unit.root.ts, messages: dmMessages(messages, deps.config.botUserId) }, cursor)),
                botTexts: messages.filter((m) => !isHuman(m, deps.config.botUserId)).map((m) => m.text ?? ""),
              }
            : undefined;
        const found = await sweepThread(deps, {
          ...(dm ? { dm } : {}),
          channel,
          channelKind: kind,
          rootTs: unit.root.ts,
          humans,
          runDate,
          now,
          resolved,
          membersOf,
        });
        if (!found.ok) {
          if ((await failed(unit.root.ts, found.error, found.counts)) === "hold") {
            return finish("handled", `stopped at ${reached}: ${found.error}`, threads, kept);
          }
        } else {
          if (found.trimmed) notes.push(`thread ${unit.root.ts}: ${found.trimmed} oldest repl(ies) left out of the detector's view`);
          kept.push(...found.findings);
          readOnly += found.readOnly;
          fileDrifts += found.drifts.length;
          if (!deps.dryRun && found.findings.length) await deps.store.addFindings(found.findings);
          if (!deps.dryRun && found.drifts.length) await deps.fileDrift?.add(found.drifts);
          if (failing.has(unit.root.ts) && !deps.dryRun) await deps.store.clearThreadFailure(channel, unit.root.ts);
        }
      } else {
        notes.push(`thread ${unit.root.ts} has more than ${MAX_REPLY_PAGES * 200} replies and was left unread`);
      }
      // Never past the oldest root the history read reached, never backwards.
      const to = readTo && msOf(unit.activity) > msOf(readTo) ? readTo : unit.activity;
      if (msOf(to) > msOf(reached)) {
        if (!deps.dryRun) await deps.store.saveCursor(channel, to, deps.now());
        reached = to;
      }
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      // Everything up to `reached` is saved; say where it stopped, then let the
      // runner keep the job under its key for a fresh budget.
      await finish("deferred", `budget stopped it after ${reached}; retried under ${job.key}`, threads, kept).catch(
        () => undefined,
      );
    }
    throw err;
  }

  const cards = deps.dryRun ? plannedCards(deps, kept, dateOf(postableAt(now))) : [];
  if (readOnly) notes.push(`${readOnly} finding(s) on targets uno-bot cannot write were left alone`);
  if (fileDrifts) notes.push(`${fileDrifts} finding(s) on files uno-bot cannot write kept for the morning's ask`);
  return finish("handled", notes.length ? notes.join("; ") : null, threads, kept, cards);
}

/** A thread with activity since the cursor, and when it was last active. */
interface ActiveThread {
  root: SweepSlackMessage;
  replies: boolean;
  activity: string;
}

/**
 * The channel's threads active since the cursor, oldest activity first — and,
 * when the history ran past its page cap, the oldest root it read: a root
 * older than that was never seen, so the cursor may not pass it.
 */
async function activeThreads(
  deps: SweepDeps,
  channel: string,
  oldest: string,
  cursor: string,
): Promise<{ units: ActiveThread[]; readTo: string | null }> {
  const units: ActiveThread[] = [];
  let page: string | undefined;
  let oldestRead: string | null = null;
  for (let i = 0; i < MAX_HISTORY_PAGES; i++) {
    const res = await deps.slack.history(channel, oldest, page);
    if (!res) break;
    for (const m of res.messages) {
      if (!oldestRead || msOf(m.ts) < msOf(oldestRead)) oldestRead = m.ts;
      if (m.thread_ts && m.thread_ts !== m.ts) continue; // a broadcast reply: its root is the unit
      if (!isHuman(m, deps.config.botUserId)) continue;
      const replies = (m.reply_count ?? 0) > 0;
      const activity = replies && m.latest_reply && msOf(m.latest_reply) > msOf(m.ts) ? m.latest_reply : m.ts;
      if (msOf(activity) <= msOf(cursor)) continue;
      units.push({ root: m, replies, activity });
    }
    page = res.nextCursor;
    if (!page) break;
  }
  return { units: units.sort((a, b) => msOf(a.activity) - msOf(b.activity)), readTo: page ? oldestRead : null };
}

/** A whole thread, root first, a page at a time; null when a page could not
 *  be read, `too-long` past `MAX_REPLY_PAGES`. */
async function readThread(deps: SweepDeps, channel: string, rootTs: string): Promise<SweepSlackMessage[] | "too-long" | null> {
  const messages: SweepSlackMessage[] = [];
  let page: string | undefined;
  for (let i = 0; i < MAX_REPLY_PAGES; i++) {
    const res = await deps.slack.replies(channel, rootTs, page);
    if (!res) return null;
    messages.push(...res.messages);
    page = res.nextCursor;
    if (!page) return messages;
  }
  return "too-long";
}

/** One thread: its links read, its drift detected and routed. */
async function sweepThread(
  deps: SweepDeps,
  t: {
    channel: string;
    channelKind: ChannelKind;
    rootTs: string;
    humans: SweepMessage[];
    runDate: string;
    now: number;
    resolved: Map<string, string | null>;
    /** The place's members — read only for a place that is not public. */
    membersOf: () => Promise<ReadonlySet<string>>;
    /** A DM thread's verdict (`DmThreadVerdict`), and uno-bot's own messages
     *  there, whose links are followed but whose words are never evidence. */
    dm?: DmThreadVerdict & { botTexts: string[] };
  },
): Promise<
  | { ok: true; findings: PendingFinding[]; drifts: FileDriftFinding[]; readOnly: number; trimmed: number }
  | { ok: false; error: string; counts: boolean }
> {
  const none = { ok: true as const, findings: [], drifts: [], readOnly: 0, trimmed: 0 };
  // With somewhere to put it, a file uno-bot cannot write is worth a read too.
  const triggers = (kind: TargetKind): boolean => !!deps.fileDrift && triggersFileDrift(kind);
  const root = t.humans.find((m) => m.ts === t.rootTs) ?? t.humans[0];
  if (!root) return none;
  // In a DM, nothing is looked for unless the DM hook asked: a stated
  // decision for drift, an answer to uno-bot's ask for placement.
  if (t.dm && !t.dm.decision && !t.dm.answered) return none;
  const linkTexts = [...t.humans.map((m) => m.text), ...(t.dm?.botTexts ?? [])];
  const links = [...new Set(linkTexts.flatMap((text) => linksIn(text)))]
    .map((url) => ({ url, kind: classifyLink(url, deps.config.figmaLibraryKey) }))
    .filter((l): l is { url: string; kind: TargetKind } => l.kind !== null);
  const linksNotion = links.some((l) => l.kind === "notion");
  // A Figma or design-system link, when file drift is asked about.
  const linksFile = links.some((l) => triggers(l.kind));
  // A page a message names without linking, and a question someone answered
  // (`./search.ts`) — each looked for only when its detector is wired.
  const named = deps.search ? namedThings(t.humans.map((m) => m.text)) : [];
  // In a DM the person answers their own question, so the DM hook says when
  // they have — only ever in reply to uno-bot's ask.
  const answered = !!deps.capture && (t.dm ? t.dm.answered : looksAnswered(t.humans));
  const driftAsked = !t.dm || t.dm.decision;
  // Only Notion is written in place, so a thread with no Notion link, no file
  // link asked about, nothing named and no answered question has nothing this
  // sweep can propose — and costs no read and no model call.
  if (!linksNotion && !linksFile && !named.length && !answered) return none;
  const chosen = [
    ...links.filter((l) => l.kind === "notion"),
    ...links.filter((l) => triggers(l.kind)),
    ...links.filter((l) => l.kind !== "notion" && !triggers(l.kind)),
  ].slice(0, MAX_SOURCES_PER_THREAD);
  const sources: SweepSource[] = [];
  for (const link of chosen) {
    try {
      // A private note is never a source, linked or not (`./surfaces.ts`).
      const source = await readUsable(deps.sources, deps.config, link.url, link.kind);
      if (source) sources.push(source);
    } catch (err) {
      // A page that failed to read is not a page with nothing on it: the
      // thread is held, like a budget stop, and the failure is counted —
      // unless the service said to slow down, which is the quota's, as a
      // model 429 is.
      rethrowIfBudget(err);
      const why = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `a linked page could not be read (${why})`, counts: !QUOTA.test(why) };
    }
  }
  // What nobody linked, found by search and marked so: the page a message
  // names, and — for an answered question with no page to hold it — the page
  // its answer may belong on. Only the top hit above the floor, from one of
  // the team's surfaces, is kept (`./surfaces.ts`). A search that fails, or a
  // found page that will not read, is no hit: nobody pointed at that page, so
  // it never holds the thread.
  if (deps.search && sources.length < MAX_SOURCES_PER_THREAD) {
    const question = answered && !sources.some((s) => s.writable) ? questionQuery(t.humans) : null;
    const hits = await findBySearch(
      deps.search,
      [...named, ...(question ? [question] : [])],
      new Set(chosen.map((l) => l.url)),
      searchGate(deps.config),
    );
    for (const hit of hits) {
      if (sources.length >= MAX_SOURCES_PER_THREAD) break;
      const source = await readUsable(deps.sources, deps.config, hit.url, hit.kind, true).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      if (source && !sources.some((s) => s.url === source.url)) sources.push(source);
    }
  }
  if (!sources.some((s) => s.writable || triggers(s.kind))) return none;

  const shown = withinThreadBudget(t.humans, root.ts);
  const thread: SweepThread = { channel: t.channel, channelKind: t.channelKind, rootTs: t.rootTs, messages: shown.messages };
  // Drift needs a page or file the thread pointed at — linked or named. A page
  // found only from the question's words is for placing its answer.
  const detected =
    driftAsked && (linksNotion || linksFile || named.length)
      ? await deps.detector.detect({ thread, sources })
      : { ok: true as const, findings: [] };
  if (!detected.ok) {
    return { ok: false, error: `the detector did not answer (${detected.error})`, counts: !QUOTA.test(detected.error) };
  }

  const participants = [...new Set(t.humans.map((m) => m.user))];
  const findings: PendingFinding[] = [];
  const drifts: FileDriftFinding[] = [];
  let readOnly = 0;
  for (const d of detected.findings) {
    // A target uno-bot cannot write is not carded here. A file the morning
    // asks about is routed and handed on below; anything else is counted,
    // and the run's record says how many were left.
    const writable = d.source.writable && !!d.blockId && !!d.lastEditedTime;
    const asked = !d.source.writable && !!deps.fileDrift && intakeLaneOf(d.source.kind) !== null;
    if (!writable && !asked) {
      readOnly += 1;
      continue;
    }
    const claimed = d.claimedBy !== null && participants.includes(d.claimedBy);
    // The linked card's Contributors: the fixed page's own when it is a card,
    // otherwise those of any card the thread links beside it.
    const cardContributors = d.source.contributors.length
      ? d.source.contributors
      : sources.flatMap((s) => s.contributors);
    const named = claimed ? [] : await contributorsOf(deps, cardContributors, t.resolved);
    // In a private place the owner is someone in it: a Contributor outside it
    // could not see the card, and naming them there would reach past it.
    const contributorIds =
      t.channelKind === "public" || !named.length ? named : await inPlace(named, t.membersOf);
    const { owner } = routeOwner({ claimedBy: d.claimedBy, participants, contributorIds, starter: root.user });
    if (!writable) {
      const drift = fileDriftFinding({
        channel: t.channel,
        channelKind: t.channelKind,
        rootTs: t.rootTs,
        runDate: t.runDate,
        now: t.now,
        target: {
          url: d.source.url,
          kind: d.source.kind,
          writable: d.source.writable,
          title: d.source.title,
          pillars: d.source.pillars,
        },
        sourceSays: d.sourceSays,
        threadSays: d.threadSays,
        evidenceTs: d.evidenceTs,
        owner,
        participants,
        confidence: d.confidence,
        // The pillars of any Roadmap card the thread links: what the intake
        // may be filed under, exact-matched in the morning.
        pillars: sources.flatMap((s) => s.pillars),
      });
      // One per file per thread: the first the detector named stands.
      if (drift && !drifts.some((x) => x.id === drift.id)) drifts.push(drift);
      continue;
    }
    findings.push({
      id: `${t.channel}:${t.rootTs}:${d.blockId}`,
      runDate: t.runDate,
      detectedAt: t.now,
      driftAt: Math.min(...d.evidenceTs.map(msOf)),
      target: {
        url: d.source.url,
        kind: d.source.kind,
        writable: d.source.writable,
        title: d.source.title,
        pillars: d.source.pillars,
        ...(d.source.foundBy ? { foundBy: d.source.foundBy } : {}),
      },
      blockId: d.blockId,
      lastEditedTime: d.lastEditedTime,
      original: d.original,
      sourceSays: d.sourceSays,
      threadSays: d.threadSays,
      replacement: d.replacement,
      evidence: { channel: t.channel, channelKind: t.channelKind, threadTs: t.rootTs, messageTs: d.evidenceTs, permalinks: [] },
      owner,
      confidence: d.confidence,
      participants,
    });
  }

  // An answered question no page states (C3): a card in this thread that
  // adds the answer where it belongs, naming whoever answered.
  if (answered) {
    const placed = await deps.capture!.answers({ thread, sources });
    if (!placed.ok) {
      return { ok: false, error: `the answer detector did not answer (${placed.error})`, counts: !QUOTA.test(placed.error) };
    }
    for (const a of placed.answers) {
      const answers = shown.messages.filter((m) => a.evidenceTs.includes(m.ts) && m.ts !== a.questionTs);
      const answerer = a.answeredBy && participants.includes(a.answeredBy) ? a.answeredBy : (answers[0]?.user ?? null);
      const { owner } = routeOwner({ claimedBy: answerer, participants, contributorIds: [], starter: root.user });
      const said = answers.map((m) => m.text).join(" ");
      findings.push({
        id: `${t.channel}:${t.rootTs}:add:${a.anchorId}`,
        runDate: t.runDate,
        detectedAt: t.now,
        driftAt: Math.min(...a.evidenceTs.map(msOf)),
        target: {
          url: a.source.url,
          kind: a.source.kind,
          writable: a.source.writable,
          title: a.source.title,
          pillars: a.source.pillars,
          ...(a.source.foundBy ? { foundBy: a.source.foundBy } : {}),
        },
        blockId: a.anchorId,
        lastEditedTime: a.anchorEditedTime,
        original: "",
        sourceSays: "",
        threadSays: said.length > 300 ? `${said.slice(0, 299)}…` : said,
        replacement: a.text,
        evidence: { channel: t.channel, channelKind: t.channelKind, threadTs: t.rootTs, messageTs: a.evidenceTs, permalinks: [] },
        owner,
        confidence: a.confidence,
        participants,
        add: { section: a.section, newSection: a.newSection },
      });
    }
  }
  return { ok: true, findings, drifts, readOnly, trimmed: shown.trimmed };
}

/** A stop that is a quota's — the model's or a source's — not the thread's:
 *  held, never counted. */
const QUOTA = /\b429\b|quota|rate.?limit|resource.?exhausted/i;

/**
 * The thread as the detector sees it: the root, then the newest replies that
 * fit `MAX_THREAD_CHARS`, in order. Evidence can only cite what was shown.
 */
function withinThreadBudget(messages: SweepMessage[], rootTs: string): { messages: SweepMessage[]; trimmed: number } {
  const size = (m: SweepMessage) => Math.min(m.text.length, MAX_MESSAGE_CHARS) + 40;
  const root = messages.find((m) => m.ts === rootTs);
  let left = MAX_THREAD_CHARS - (root ? size(root) : 0);
  const kept: SweepMessage[] = [];
  for (const m of [...messages].reverse()) {
    if (m === root) continue;
    if (size(m) > left) break;
    left -= size(m);
    kept.unshift(m);
  }
  const shown = root ? [root, ...kept] : kept;
  return { messages: shown, trimmed: messages.length - shown.length };
}

/** The ids that are members of the place, in order. */
async function inPlace(ids: readonly string[], membersOf: () => Promise<ReadonlySet<string>>): Promise<string[]> {
  const members = await membersOf();
  return ids.filter((id) => members.has(id));
}

/** The card's Contributors as Slack ids, each name looked up once per job. */
export async function contributorsOf(
  deps: SweepDeps,
  names: readonly string[],
  resolved: Map<string, string | null>,
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    if (!resolved.has(name)) resolved.set(name, await deps.people.slackIdFor(name));
    const id = resolved.get(name);
    if (id) ids.push(id);
  }
  return ids;
}

// ── Morning: card and stage ──────────────────────────────────────────────────

async function postFindings(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const now = deps.now();
  const postDate = deps.runDate;
  const cards: SweepCardReport[] = [];
  const carded: PendingFinding[] = [];
  const notes: string[] = [];
  const record = (outcome: SweepRunOutcome) =>
    recordRun(deps, {
      runName: "morning",
      jobKey: job.key,
      channels: [...new Set(cards.map((c) => c.channel))],
      threads: cards.length,
      items: carded.length,
      outcome,
      note: notes.length ? notes.join("; ") : null,
      startedAt,
      meterStart,
    });
  const ctx: MorningCtx = { deps, now, cards, carded, notes, permalinks: 0 };

  let due: PendingFinding[] = [];
  try {
    const queued = await deps.store.pendingFindings();
    due = queued.filter((f) => postableAt(f.detectedAt) <= now);
    const open = deps.dryRun ? [] : await deps.store.openItems();

    // First, any card an earlier try recorded and never marked posted: find it
    // by its tag and finish staging it, or release it to be carded again.
    const live = new Set<string>();
    // A finding on a card held unfinished waits with it.
    const held = new Set<string>();
    for (const [cardKey, items] of groupBy(open.filter((i) => i.proposalTs === null), (i) => i.cardKey)) {
      const outcome = await finishUnposted(ctx, cardKey);
      // A card finished, or held for a later try, still occupies its place.
      if (outcome === "live" || outcome === "held") live.add(items[0]!.destination);
      if (outcome === "held") for (const i of items) held.add(i.findingId);
    }
    for (const i of open) {
      if (i.proposalTs !== null && (i.postedAt ?? 0) + SWEEP_CARD_TTL_MS > now) live.add(i.destination);
    }
    for (const place of await placesLiveInThreadState(deps, open, live)) live.add(place);

    const stillDue = due.filter((f) => !carded.some((c) => c.id === f.id) && !held.has(f.id));
    const shadowed = shadowedByPrivate(stillDue, queued);
    if (shadowed.length) {
      notes.push(`${shadowed.length} fix(es) also found in a private place go only on its card`);
      if (!deps.dryRun) await deps.store.removeFindings(shadowed.map((f) => f.id));
    }
    const { fresh, already } = await sortOutCarded(
      deps,
      stillDue.filter((f) => !shadowed.includes(f)),
    );
    if (already.length && !deps.dryRun) await deps.store.removeFindings(already.map((f) => f.id));

    const plans = planSweepCards(fresh, postDate, (where) => live.has(where));
    const waiting = fresh.length - plans.reduce((n, p) => n + p.items.length, 0);
    if (waiting > 0) notes.push(`${waiting} fix(es) wait in the queue for a live card to resolve or for room on a card`);
    for (const plan of plans) await postCard(ctx, plan, postDate);
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      notes.push(`budget stopped it; retried under ${job.key}`);
      await record("deferred").catch(() => undefined);
    }
    throw err;
  }

  await record("handled");
  const note = notes.length ? notes.join("; ") : null;
  const verb = deps.dryRun ? "would post" : "posted";
  const summary =
    due.length || cards.length
      ? `${verb} ${cards.length} card(s) holding ${carded.length} fix(es)${note ? ` — ${note}` : ""}`
      : "nothing due this morning";
  return { kind: "sweep-post", key: job.key, outcome: "handled", note, threads: cards.length, findings: carded, cards, summary };
}

/** One morning's running tally. */
interface MorningCtx {
  deps: SweepDeps;
  now: number;
  cards: SweepCardReport[];
  carded: PendingFinding[];
  notes: string[];
  permalinks: number;
}

/** Post one planned report, stage each of its fixes, and mark its items posted. */
async function postCard(ctx: MorningCtx, plan: SweepCardPlan, postDate: string): Promise<void> {
  const { deps, now, notes } = ctx;
  const to = resolveDestination(plan.destination, deps.config);
  if (!to) {
    notes.push(`${plan.key}: its channel is not configured`);
    return;
  }
  if (to.channel === deps.config.unoBot) {
    // Unreachable while #uno-bot is never swept; stated so it stays true.
    notes.push(`${plan.key}: not posted in #uno-bot`);
    if (!deps.dryRun) await deps.store.removeFindings(plan.items.map((f) => f.id));
    return;
  }

  // Everything the report will send, counted before any of it is: a report
  // that cannot finish does not start, and the job defers instead.
  const posts = 1;
  const links = plan.items.filter((f) => f.evidence.messageTs[0]).length;
  const affordable = Math.min(links, MAX_PERMALINKS - ctx.permalinks);
  if (!deps.dryRun) {
    ensureHeadroom(deps, { subrequests: affordable + posts + CARD_COST.reserveSubrequests, d1Queries: CARD_COST.d1Queries });
  }
  for (const item of plan.items) {
    const first = item.evidence.messageTs[0];
    if (!first || ctx.permalinks >= MAX_PERMALINKS) continue;
    ctx.permalinks += 1;
    const link = await deps.delivery.permalink(item.evidence.channel, first).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (link) item.evidence.permalinks = [link];
  }
  const report = sweepReport(plan);
  const card: SweepCardReport = {
    key: plan.key,
    destination: plan.destination,
    channel: to.channel,
    threadTs: to.threadTs,
    items: plan.items.length,
    text: reportText(plan, report),
  };
  if (deps.dryRun) {
    ctx.cards.push(card);
    ctx.carded.push(...plan.items);
    return;
  }

  const digest = operationsDigest(plan.operations);
  await deps.store.saveCard({ key: plan.key, destination: plan.destination, items: plan.items, digest });
  await deps.store.addItems(plan.items.map((f) => itemRecord(f, plan, now)));
  const tag = { cardKey: plan.key, digest };
  let sent = await deps.delivery.post(to, { text: report.text, blocks: report.blocks }, tag);
  // Cards Slack refuses step down to sections, each with its own Review, and
  // the report's record keeps every redraw plain from then on.
  const plain = !sent.ok && sent.refusedBlocks === true;
  if (plain) sent = await deps.delivery.post(to, { text: report.text, blocks: plainReportBlocks(report.blocks) }, tag);
  if (!sent.ok || !sent.ts) {
    await release(deps, plan.key);
    notes.push(`${plan.key}: the post failed — kept for tomorrow`);
    return;
  }
  const staged = await stageReport(ctx, plan, report, { channel: to.channel, root: to.threadTs ?? sent.ts, ts: sent.ts, postDate, ...(plain ? { plain: true } : {}) }, now);
  if (!staged.length) return;
  await deps.store.removeFindings(staged.map((f) => f.id));
  ctx.cards.push({ ...card, proposalTs: sent.ts });
  ctx.carded.push(...staged);
}

/**
 * A plan's report: a card per fix, and a parent line counting every finding
 * waiting for the place — the ones past the card's ten are held, and say so.
 */
export function sweepReport(plan: SweepCardPlan): DecisionReport {
  const all = [...plan.items, ...(plan.rest ?? [])];
  return decisionReport(
    all.map((f) => sweepItem(f, plan.destination)),
    sweepParent(all, plan.destination),
  );
}

/** A report as the job's own report shows it — a dry run's preview: what
 *  posts, then each fix whole. */
function reportText(plan: SweepCardPlan, report: DecisionReport): string {
  return [report.text, ...plan.items.map(sweepItemText)].join("\n\n");
}

/** What a fix that did not stage says on its card. */
export const NOT_STAGED = "Didn't go through, so it comes back in tomorrow's report.";

/**
 * Stage each fix of a posted report as its own proposal, after keeping the
 * report's record that their decisions land on. A fix that does not stage
 * says so on its card, and its finding stays queued for the next morning; a
 * report none of whose fixes staged is withdrawn and its findings released.
 * Then its items take the message's ts. A budget stop is rethrown: the next
 * try finds the report by its tag and stages what is left.
 *
 * @param skip - Fixes an earlier try already staged, by block id, which are
 *   not staged again
 * @returns The findings staged now
 */
async function stageReport(
  ctx: MorningCtx,
  plan: SweepCardPlan,
  report: DecisionReport,
  posted: { channel: string; root: string; ts: string; postDate: string; plain?: boolean },
  postedAt: number,
  skip: ReadonlySet<string> = new Set(),
): Promise<PendingFinding[]> {
  const { deps } = ctx;
  const keys = plan.items.map((f) => itemProposalKey(posted.ts, f.blockId!));
  const why = (err: unknown) => (err instanceof Error ? err.message : String(err));
  const withdraw = async (reason: string): Promise<PendingFinding[]> => {
    await deps.delivery.withdraw(posted.channel, posted.ts, WITHDRAWN_TEXT, plan.key, keys).catch(rethrowIfBudget);
    await release(deps, plan.key);
    ctx.notes.push(`${plan.key}: posted but not staged (${reason}) — withdrawn, kept for tomorrow`);
    return [];
  };
  try {
    // A retry keeps the record an earlier try made, and the decisions on it.
    if (!(await deps.delivery.reports.getReport(posted.ts))) {
      await deps.delivery.reports.putReport({
        ...reportRecord(posted.channel, posted.ts, report, SWEEP_CARD_TTL_MS),
        ...(posted.plain ? { plain: true } : {}),
        metadata: sweepReportMetadata({ cardKey: plan.key, digest: operationsDigest(plan.operations) }),
      });
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) throw err;
    return withdraw(`its record was not kept: ${why(err)}`);
  }
  const staged: PendingFinding[] = [];
  const failed: PendingFinding[] = [];
  let reason = "";
  for (const f of plan.items) {
    if (skip.has(f.blockId!)) continue;
    try {
      await deps.delivery.stage(sweepProposal(plan, f, posted), f.evidence.channelKind);
      staged.push(f);
    } catch (err) {
      if (isSubrequestBudgetError(err)) throw err;
      reason ||= why(err);
      failed.push(f);
    }
  }
  if (!staged.length && !skip.size) return withdraw(reason);
  await deps.store.markPosted(plan.key, posted.ts, postedAt);
  await deps.store.dropCard(plan.key);
  if (failed.length) {
    const ids = failed.map((f) => f.blockId!);
    const marked = await markNotStaged(deps.delivery.reports, posted.ts, ids, NOT_STAGED).catch(() => null);
    if (marked) await deps.delivery.edit(posted.channel, posted.ts, marked).catch(rethrowIfBudget);
    // Not carded, so the next morning cards them again from the queue.
    for (const f of failed) await deps.store.updateItem(`${plan.key}#${f.blockId}`, { status: "failed", resolvedAt: ctx.now });
    ctx.notes.push(`${plan.key}: ${failed.length} fix(es) posted but not staged (${reason}) — kept for tomorrow`);
  }
  return staged;
}

/** A report that did not go through: its unposted items and its snapshot go;
 *  its findings, still queued, are carded again. */
async function release(deps: SweepDeps, cardKey: string): Promise<void> {
  await deps.store.releaseCard(cardKey);
  await deps.store.dropCard(cardKey);
}

/** What a report that did not go through is edited to say. */
export const WITHDRAWN_TEXT = "This end-of-day report didn't go through, so nothing on it can be decided. Its fixes are kept and come back in a fresh report.";

/**
 * Finish a report an earlier try recorded but never marked posted — only ever
 * from its snapshot, the fixes it showed, and only when the report Slack
 * holds carries the same digest. Otherwise:
 *   • never posted → released, its findings carded afresh;
 *   • posted, but with no snapshot or a digest that differs → withdrawn and
 *     released: staging it would run text nobody was shown;
 *   • not known (a failed read, or too many pages) → held for the next try,
 *     and released once its 72 h would have run out anyway;
 *   • posted, with some fixes already staged — the earlier try got that far —
 *     → those are recorded as they stand and never staged again (a fix
 *     someone decided meanwhile, staged afresh, would run or offer what was
 *     already decided), and only the rest are staged.
 *
 * @returns `live` when any fix is live, `held` when it waits, `decided` when
 *   every fix was staged and has since been resolved, `released`
 */
async function finishUnposted(ctx: MorningCtx, cardKey: string): Promise<"live" | "held" | "decided" | "released"> {
  const { deps, notes, now } = ctx;
  const snapshot = await deps.store.cardSnapshot(cardKey);
  const destination = snapshot?.destination ?? null;
  const to = destination ? resolveDestination(destination, deps.config) : null;
  if (!snapshot || !to) {
    // Nothing to stage from, so nothing is staged; the fixes, still queued,
    // go out on a fresh report.
    await release(deps, cardKey);
    notes.push(`${cardKey}: recorded without a snapshot — released`);
    return "released";
  }
  const plan = cardPlan(cardKey, snapshot.destination, snapshot.items);
  if (operationsDigest(plan.operations) !== snapshot.digest) {
    await release(deps, cardKey);
    notes.push(`${cardKey}: its snapshot does not match its digest — released`);
    return "released";
  }
  ensureHeadroom(deps, { subrequests: FIND_POSTED_PAGES + CARD_COST.reserveSubrequests, d1Queries: CARD_COST.d1Queries });
  const postDate = cardKey.slice(0, 10);
  const posted = await deps.delivery.findPosted(to, cardKey, tsOf(Date.parse(`${postDate}T00:00:00Z`)));
  if (posted.state === "unknown") {
    if (now > Date.parse(`${postDate}T00:00:00Z`) + SWEEP_CARD_TTL_MS) {
      await release(deps, cardKey);
      notes.push(`${cardKey}: still not found after its 72 h (${posted.why}) — released`);
      return "released";
    }
    notes.push(`${cardKey}: could not tell whether it went up (${posted.why}) — held for the next try`);
    return "held";
  }
  if (posted.state === "absent") {
    await release(deps, cardKey);
    return "released";
  }
  const keys = plan.items.map((f) => itemProposalKey(posted.ts, f.blockId!));
  if (posted.digest !== snapshot.digest) {
    await deps.delivery.withdraw(to.channel, posted.ts, WITHDRAWN_TEXT, cardKey, keys).catch(rethrowIfBudget);
    await release(deps, cardKey);
    notes.push(`${cardKey}: the posted report shows other fixes than its snapshot — withdrawn`);
    return "released";
  }
  const states = new Map<string, SweepCardState>();
  try {
    for (const [i, f] of plan.items.entries()) states.set(f.blockId!, await deps.delivery.cardState(keys[i]!));
  } catch (err) {
    rethrowIfBudget(err);
    notes.push(`${cardKey}: could not tell which fixes were already staged (${err instanceof Error ? err.message : String(err)}) — held for the next try`);
    return "held";
  }
  const already = new Set([...states].filter(([, s]) => s.state !== "unstaged").map(([block]) => block));
  const postedAt = msOf(posted.ts);
  const staged = await stageReport(
    ctx,
    plan,
    sweepReport(plan),
    { channel: to.channel, root: to.threadTs ?? posted.ts, ts: posted.ts, postDate, ...(posted.plain ? { plain: true } : {}) },
    Number.isFinite(postedAt) ? postedAt : now,
    already,
  );
  if (!staged.length && !already.size) return "released";
  // A fix decided meanwhile, while its item had no ts to be found by, takes
  // what it came to now rather than sit at proposed.
  for (const item of await deps.store.itemsForProposal(posted.ts)) {
    const state = states.get(item.blockId);
    if (item.status === "proposed" && state?.state === "decided" && state.items) {
      await deps.store.updateItem(item.itemId, { status: state.items, resolvedAt: now });
    }
  }
  // A later night may have queued the same findings again, re-read; they are
  // carded now, as they were shown. A fix that failed to stage stays queued.
  const carded = plan.items.filter((f) => already.has(f.blockId!) || staged.includes(f));
  await deps.store.removeFindings(carded.map((f) => f.id));
  ctx.carded.push(...carded);
  const live = staged.length > 0 || [...states.values()].some((s) => s.state === "live");
  if (already.size) {
    notes.push(`${cardKey}: ${already.size} fix(es) already staged by an earlier try — recorded, not staged again`);
  }
  if (staged.length) {
    notes.push(`${cardKey}: finished staging a report an earlier try posted`);
    ctx.cards.push({
      key: cardKey,
      destination: plan.destination,
      channel: to.channel,
      threadTs: to.threadTs,
      items: plan.items.length,
      text: posted.text,
      proposalTs: posted.ts,
    });
  }
  return live ? "live" : "decided";
}

/** One fix, wherever it was found: the page and the block it rewrites. */
function fixKey(f: Pick<PendingFinding, "target" | "blockId">): string {
  return `${f.target.url}#${f.blockId ?? ""}`;
}

/**
 * The public findings whose fix the queue also holds from a private channel,
 * a group DM or a DM. Evidence that spans both is private (ADR-031): the fix
 * goes only on the private card, and the public copy is never carded — a
 * public card would show a change only the private place could see.
 *
 * @param due - This morning's findings
 * @param queued - Every finding in the queue, due or not
 */
export function shadowedByPrivate(due: readonly PendingFinding[], queued: readonly PendingFinding[]): PendingFinding[] {
  // A 1:1 DM shadows nothing: it is one person's, what it finds never steers
  // another place's job, and the public card shows only its own thread's words.
  const privateFixes = new Set(
    queued.filter((f) => f.evidence.channelKind !== "public" && f.evidence.channelKind !== "dm").map(fixKey),
  );
  return due.filter((f) => f.evidence.channelKind === "public" && privateFixes.has(fixKey(f)));
}

/** An item in one of these states means the thread has had this fix. */
const CARDED: readonly SweepItemStatus[] = ["proposed", "dropped", "confirmed", "refused_unwritable"];

/**
 * Split the due findings into those still to card and those already carded
 * — proposed, dropped or applied. One read for all of them.
 */
async function sortOutCarded(
  deps: SweepDeps,
  due: PendingFinding[],
): Promise<{ fresh: PendingFinding[]; already: PendingFinding[] }> {
  if (!due.length) return { fresh: [], already: [] };
  const had = new Set(
    (await deps.store.itemsForFindings(due.map((f) => f.id)))
      .filter((i) => CARDED.includes(i.status))
      .map((i) => i.findingId),
  );
  return { fresh: due.filter((f) => !had.has(f.id)), already: due.filter((f) => had.has(f.id)) };
}

/**
 * Stage a sweep card the Worker posted, and put it on the usage record like
 * any card: a staged row (via the Worker, in the channel it posted to), and a
 * superseded row for any card the staging retired. Its later ✅ or ⛔ pairs
 * with that staged row.
 *
 * The staged row names the channel only where a turn's would
 * (`storesChannel`): never a group DM or a DM.
 *
 * A thread the bot had no history in is marked as entered through the card
 * (`thread-mark.ts`), so what the bot posts there answering the card never
 * makes the team's later replies its conversation. Best-effort: an unmarked
 * thread reads by the ordinary rules.
 */
export async function stageSweepCard(
  proposal: PendingProposal,
  deps: {
    threadState: Pick<ThreadState, "putProposal" | "readHistory">;
    proposalEvents: ProposalEventLog;
    markThread?: (channel: string, thread: string) => Promise<void>;
  },
  now: number,
  channelKind: ChannelKind = "public",
): Promise<void> {
  if (deps.markThread) {
    const ref = { channel: proposal.channel, thread: proposal.threadTs };
    try {
      if (!(await deps.threadState.readHistory(ref)).length) await deps.markThread(ref.channel, ref.thread);
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[sweep] thread ${ref.channel}:${ref.thread} not marked: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const { retired } = await deps.threadState.putProposal(proposal);
  await recordProposalEvents(deps.proposalEvents, [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({
      proposal,
      at: now,
      via: "worker",
      channelStored: storesChannel("channel", conversationTypeOf(channelKind)),
    }),
  ]);
}

/**
 * The places whose card the records call lapsed but ThreadState still holds
 * live: a revision or a re-staged card whose record never landed. A card
 * lives in its place's reply thread — a thread place's own thread, or the
 * first card's thread for one posted at a channel's top — so any live sweep
 * card in that thread occupies the place. A failed read leaves the records'
 * answer standing.
 */
async function placesLiveInThreadState(
  deps: SweepDeps,
  open: readonly SweepItemRecord[],
  live: ReadonlySet<string>,
): Promise<string[]> {
  const lapsed = open.filter((i) => i.proposalTs !== null && !live.has(i.destination));
  if (!lapsed.length) return [];
  const byChannel = new Map<string, PendingProposal[]>();
  const cardsIn = async (channel: string): Promise<PendingProposal[]> => {
    if (!byChannel.has(channel)) {
      try {
        byChannel.set(channel, await deps.delivery.liveCards(channel));
      } catch (err) {
        rethrowIfBudget(err);
        console.warn(`[sweep] live cards in ${channel} unread: ${err instanceof Error ? err.message : String(err)}`);
        byChannel.set(channel, []);
      }
    }
    return byChannel.get(channel)!;
  };
  const places: string[] = [];
  for (const item of lapsed) {
    const place = placeOf(item.destination, deps.config);
    if (!place) continue;
    const threads = new Set([item.proposalTs!, ...(place.threadTs ? [place.threadTs] : [])]);
    const cards = await cardsIn(place.channel);
    if (cards.some((c) => threads.has(proposalReplyThread(c)) || threads.has(c.proposalTs))) places.push(item.destination);
  }
  return places;
}

/** A place's channel and thread, back from its key (`destinationKey`). */
function placeOf(key: string, config: SweepConfig): { channel: string; threadTs: string | null } | null {
  if (key === "plus-design") return config.plusDesign ? { channel: config.plusDesign, threadTs: null } : null;
  if (key === "plus-universal") return config.plusUniversal ? { channel: config.plusUniversal, threadTs: null } : null;
  const [channel, threadTs] = key.split(":");
  return channel ? { channel, threadTs: threadTs || null } : null;
}

/** What a posted card came to, for a retry that finds it already staged. */
export type SweepCardState =
  | { state: "live" }
  /** `items` is what its still-proposed items come to; null when the record
   *  says it was claimed but not whether it ran. */
  | { state: "decided"; items: SweepItemStatus | null }
  | { state: "unstaged" };

/**
 * Whether a posted card was ever staged, from what ThreadState and the usage
 * record hold (`SweepDelivery.cardState`): live while ThreadState holds it;
 * decided once it is revised or aged out, or gone from ThreadState with any
 * row on the record — its staged row, or the ✅ or ⛔ that claimed it. A ⛔,
 * a revision or an expiry drops its items; a ✅ confirms them, or records
 * them refused when a write found its block moved.
 */
export async function sweepCardState(
  proposalTs: string,
  deps: { threadState: Pick<ThreadState, "getProposalByTs">; proposalEvents: Pick<ProposalEventLog, "eventsOf"> },
): Promise<SweepCardState> {
  const lookup = await deps.threadState.getProposalByTs(proposalTs);
  if (lookup.state === "found") return { state: "live" };
  if (lookup.state !== "none") return { state: "decided", items: "dropped" };
  const events = new Set((await deps.proposalEvents.eventsOf(proposalTs)).map((e) => e.event));
  if (!events.size) return { state: "unstaged" };
  if (events.has("refused_stale")) return { state: "decided", items: "refused_stale" };
  if (events.has("confirmed")) return { state: "decided", items: "confirmed" };
  if (events.has("cancelled") || events.has("superseded") || events.has("expired")) return { state: "decided", items: "dropped" };
  return { state: "decided", items: null };
}

/**
 * One fix as ThreadState stages it: one item of its report, no Turn behind
 * it, its own terms — its one operation, the report's confirmers and 72 h.
 */
export function sweepProposal(
  plan: SweepCardPlan,
  f: PendingFinding,
  posted: { channel: string; root: string; ts: string; postDate: string },
): PendingProposal {
  const operation = itemOperation(f);
  const share = sweepShareOf([f]);
  return {
    operations: [operation],
    toolName: operation.toolName,
    input: operation.input,
    channel: posted.channel,
    threadTs: posted.root,
    replyTs: posted.root,
    ...itemProposal(posted.ts, f.blockId!),
    // The fix's whole change, which Review shows.
    proposalText: sweepItemText(f),
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: SWEEP_CARD_TTL_MS,
    confirmers: [...plan.confirmers],
    sweepRun: posted.postDate,
    stated: sweepItemWords(),
    refuseRevision: SWEEP_REVISE_INSTEAD,
    // A group DM's fix: what its write shares (`./share.ts`).
    ...(share ? { sweepShare: share } : {}),
  };
}

/** One item, recorded before its card posts: no ts, not yet posted. */
function itemRecord(f: PendingFinding, plan: SweepCardPlan, now: number): SweepItemRecord {
  return {
    itemId: `${plan.key}#${f.blockId}`,
    findingId: f.id,
    destination: destinationKey(plan.destination),
    runDate: f.runDate,
    channel: f.evidence.channel,
    threadTs: f.evidence.threadTs ?? "",
    // Carded findings always name a block (`planSweepCards`).
    blockId: f.blockId!,
    ownerId: f.owner,
    status: "proposed",
    cardKey: plan.key,
    proposalTs: null,
    driftAt: f.driftAt,
    detectedAt: f.detectedAt,
    postedAt: null,
    resolvedAt: null,
    // The record's surface flag: an item found in a person's DM with uno-bot.
    ...(f.evidence.channelKind === "dm" ? { surface: "dm" as const } : {}),
  };
}

function groupBy<T>(list: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of list) out.set(keyOf(item), [...(out.get(keyOf(item)) ?? []), item]);
  return out;
}

export function plannedCards(deps: SweepDeps, findings: PendingFinding[], postDate: string): SweepCardReport[] {
  return planSweepCards(findings, postDate).flatMap((plan) => {
    const to = resolveDestination(plan.destination, deps.config);
    if (!to) return [];
    return [
      {
        key: plan.key,
        destination: plan.destination,
        channel: to.channel,
        threadTs: to.threadTs,
        items: plan.items.length,
        text: reportText(plan, sweepReport(plan)),
      },
    ];
  });
}

// ── Shared ───────────────────────────────────────────────────────────────────

export async function recordRun(
  deps: SweepDeps,
  r: Omit<SweepRunRecord, "runId" | "runDate" | "subrequests" | "d1Queries" | "finishedAt"> & {
    meterStart: { subrequests: number; d1Queries: number };
  },
): Promise<void> {
  if (deps.dryRun) return;
  const runDate = deps.runDate;
  const spent = readMeter(deps);
  const { meterStart, ...rest } = r;
  await deps.store.recordRun({
    ...rest,
    runId: `${runDate}:${r.jobKey}`,
    runDate,
    subrequests: spent.subrequests - meterStart.subrequests,
    // The write itself is one more query.
    d1Queries: spent.d1Queries - meterStart.d1Queries + 1,
    finishedAt: deps.now(),
  });
}

export function readMeter(deps: SweepDeps): { subrequests: number; d1Queries: number } {
  return { subrequests: deps.meter?.subrequests() ?? 0, d1Queries: deps.meter?.d1Queries() ?? 0 };
}

/**
 * Stop, as the budget does, unless what is left covers a step that must not
 * start without finishing.
 */
function ensureHeadroom(deps: SweepDeps, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}

/** A DM thread's messages, both sides, uno-bot's own marked and their tags
 *  kept; anything neither the person's nor uno-bot's (a join, an edit notice)
 *  left out. */
function dmMessages(messages: readonly SweepSlackMessage[], botUserId: string | null | undefined): DmMessage[] {
  const out: DmMessage[] = [];
  for (const m of messages) {
    const human = isHuman(m, botUserId);
    const bot = !human && (!!m.bot_id || (!!botUserId && m.user === botUserId));
    if (!human && !bot) continue;
    out.push({
      ts: m.ts,
      user: m.user ?? botUserId ?? "",
      text: m.text ?? "",
      byBot: bot,
      ...(m.metadata ? { tag: { type: m.metadata.event_type, payload: m.metadata.event_payload ?? {} } } : {}),
    });
  }
  return out;
}

function isHuman(m: SweepSlackMessage, botUserId: string | null | undefined): boolean {
  if (m.bot_id || !m.user || m.user === botUserId) return false;
  return !m.subtype || m.subtype === "thread_broadcast";
}

function toSweepMessage(m: SweepSlackMessage): SweepMessage {
  return { ts: m.ts, user: m.user ?? "", text: m.text ?? "" };
}

/** A Slack ts as epoch ms. */
function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}

/** Epoch ms as a Slack-shaped ts. */
function tsOf(ms: number): string {
  return (ms / 1000).toFixed(6);
}

function dateOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
