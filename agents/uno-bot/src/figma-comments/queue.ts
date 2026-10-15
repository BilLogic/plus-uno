// What the night's comment read hands the morning's post (#900), and the
// ports both reach Figma, Notion and their own records through.
//
// THE QUEUE holds words — a short quote, the commenter's Figma handle, the
// drafted update — so it lives in HARNESS_KV with an expiry, never D1 (ADR-030),
// one key per file: a job retried a minute later never overwrites another
// file's entry through KV's eventual consistency, the way the sweep keeps one
// key per channel. A file queued again before its morning — a new reply, a
// resolution — replaces its decisions by thread, the newer read winning.
//
// THE CARDED MARKS are ids only: a thread whose decision was carded is never
// carded again, whatever later replies say (a known limit, stated in
// `docs/connectors/figma/overview.md`).
//
// PURE: types and one merge.

import type { Addressee, ChannelIds } from "../destination/index";
import type { FigmaClient } from "../figma/client";
import type { PendingProposal, ProposalOperation, ThreadState } from "../thread-state/index";
import type { ReportMessage, ReportStore } from "../slack/decision-cards";
import type { SectionHandOff } from "../sweep/sections";
import type { FigmaDecisionsHanded } from "./post";
import type { DecisionDetector, DecisionRoute } from "./detector";
import type { DecisionUpdate } from "./draft";
import type { Section } from "./sections";
import type { QuestionsHanded, TriagePorts } from "./triage";
import type { FigmaPeople, NotionPeople, TeamRoles } from "../usage/roles";
import type { DecisionRow, RowUpdate } from "../decisions-db/row";

/** One decision waiting for its morning. */
export interface QueuedDecision {
  /** The thread's root comment: its identity. */
  commentId: string;
  /** The node the root is pinned to. */
  nodeId: string;
  /** The root comment, short, on one line. */
  quote: string;
  /** Who wrote the root: their Figma handle. */
  by: string;
  section: Section;
  page: string;
  createdAt: string;
  resolvedAt: string | null;
  /** The decision, restated in one sentence. */
  decision: string;
  route: DecisionRoute;
  /** What its ✅ runs; null for a PRD decision with no PRD, which is said in the thread and carded nowhere. */
  operation: ProposalOperation | null;
  /** What its card says the ✅ does. */
  update: DecisionUpdate;
  /** What the write replaces, as the night read it (`PendingProposal.before`). */
  before?: Record<string, string>;
  confidence: number;
  /** A key decision's Decisions DB row, run by the same ✅ after the update (`../decisions-db/row.ts`). */
  row?: { operations: ProposalOperation[]; update: RowUpdate };
}

/** Who a file's thread asks: the posting ladder's addressee — the card's
 *  design owner as a Slack id, else the file's creator by Figma handle. */
export type FileOwner = Addressee;

/** One file's decisions, waiting for the morning. */
export interface QueuedFile {
  fileKey: string;
  /** The file's name, as Figma has it. */
  title: string;
  url: string;
  owner: FileOwner | null;
  /** The Product Pillar values of the cards its title names: which team's
   *  channel the posting ladder sends its decisions to. Absent on a file
   *  queued before it was kept: then its Figma team, or #plus-design. */
  pillars?: string[];
  /** Who may decide: the cards' Contributors as Slack ids. Empty for a file
   *  with no card, or none whose Contributors are Slack people: then its
   *  place's members decide its cards. */
  confirmers: string[];
  decisions: QueuedDecision[];
  runDate: string;
  foundAt: number;
}

/** A file as its cards are staged: who may decide them. */
export interface DecisionFile {
  fileKey: string;
  /** The file's name, as Figma has it. */
  title: string;
  confirmers: string[];
}

/** The KV records both jobs keep. */
export interface FigmaCommentStores {
  queue: {
    list(): Promise<QueuedFile[]>;
    read(fileKey: string): Promise<QueuedFile | null>;
    write(file: QueuedFile): Promise<void>;
    remove(fileKey: string): Promise<void>;
  };
  carded: {
    has(commentId: string): Promise<boolean>;
    add(commentIds: readonly string[]): Promise<void>;
  };
  /** MISC's files, listed at most weekly: out of scope (#891). */
  misc: {
    read(): Promise<{ files: string[]; at: number } | null>;
    write(value: { files: string[]; at: number }): Promise<void>;
  };
}

/** The thread of a morning message in #plus-design that carried decision
 *  cards, as the reply handler finds it. */
export interface DecisionThread extends DecisionFile {
  channel: string;
  /** The message's ts: the thread. */
  ts: string;
  /** When its cards lapse, epoch ms. */
  expiresAt: number;
  /** Each staged decision: its number, `proposalKey`, the key its proposal is
   *  staged under — its message and its comment id (`itemProposalKey`) — and
   *  its file. A thread from before a message carried several files names
   *  none: its one file is the thread's own. */
  decisions: Array<{ n: number; commentId: string; proposalKey: string; decision: QueuedDecision; file?: DecisionFile }>;
  /** Cards shown in the thread so far, staged or not: the next card's number
   *  follows it, so a card that showed and failed is never renumbered onto. */
  numbered?: number;
}

/** The night's reads and the morning's posts, as the sweep hands them over. */
export interface SweepFigmaComments extends FigmaCommentStores {
  figma: Pick<FigmaClient, "comments" | "file" | "fileMeta" | "teamFolders" | "folderFiles">;
  /** Keys under a prefix of the notification route's KV notes, each with the
   *  time it records (null when it cannot be read). */
  notes: { list(prefix: string): Promise<Array<{ key: string; at: string | null }>> };
  /** A Roadmap card by its number, with its Product Pillar values, or null
   *  when the Roadmap has none. */
  card(number: number): Promise<{ url: string; title: string; pillars?: string[] } | null>;
  /** The team's roles by Slack id (`usage/roles.ts`): how a card's design
   *  owner is told from its other Contributors. Empty when unread. */
  roles(): Promise<TeamRoles>;
  /** A card's Decisions DB rows, by its page URL. Absent, no key decision gets a row. */
  decisionRows?(cardUrl: string): Promise<DecisionRow[]>;
  /** The Figma and Notion people maps, each to Slack ids (`usage/roles.ts`):
   *  how a commenter becomes a row's Owner or Sign-off. */
  people?(): Promise<{ figma: FigmaPeople; notion: NotionPeople }>;
  detector: DecisionDetector;
  /** MISC's team id, from `FIGMA_TEAM_IDS`; absent, nothing is skipped as MISC. */
  miscTeamId?: string;
  /** The morning run's hand-off to the sweep's post (`./post.ts`); absent on
   *  a rehearsal, which hands nothing over. */
  handOff?: SectionHandOff<FigmaDecisionsHanded>;
  /** The unanswered questions' hand-off to the sweep's post (`./triage.ts`);
   *  absent on a rehearsal. */
  questionsHandOff?: SectionHandOff<QuestionsHanded>;
  /** The morning's Slack side. Absent, the post skips. */
  slack?: {
    /** Post in `channel`, or #plus-design. */
    post(message: { channel?: string; text: string; blocks?: unknown[]; thread_ts?: string }): Promise<{ ok: boolean; ts?: string }>;
    /** Edit a message in `channel`, or #plus-design. */
    edit(ts: string, message: { text: string; blocks?: unknown[]; metadata?: ReportMessage["metadata"] }, channel?: string): Promise<void>;
    /** A channel's members — #plus-design's when none is named — or null
     *  when they cannot be read. */
    members(channel?: string): Promise<string[] | null>;
    /** The posting ladder's channel ids; absent, #plus-design alone. */
    channels?: ChannelIds;
    /** Stage a card the Worker posted, and put it on the usage record. */
    stage(proposal: PendingProposal): Promise<void>;
    /** Where each morning's report and its items' states are kept
     *  (`slack/decision-cards.ts`). */
    reports: ReportStore & Pick<ThreadState, "putReport">;
    channel: string;
  };
  threads?: {
    read(ts: string): Promise<DecisionThread | null>;
    write(thread: DecisionThread): Promise<void>;
  };
  /** The unanswered-question triage (`./triage.ts`). Absent, no question is kept or raised. */
  triage?: TriagePorts;
}

/** Everything a decision's ✅ runs: its update, then its row. Empty for a decision said only in the thread. */
export function operationsOf(d: Pick<QueuedDecision, "operation" | "row">): ProposalOperation[] {
  return [...(d.operation ? [d.operation] : []), ...(d.row?.operations ?? [])];
}

/** A staged decision's file: its own, or — on a thread from before a message
 *  carried several files — the thread's. */
export function fileOf(thread: DecisionThread, entry: DecisionThread["decisions"][number]): DecisionFile {
  return entry.file ?? { fileKey: thread.fileKey, title: thread.title, confirmers: thread.confirmers };
}

/**
 * A file queued again before its morning: the newer read's decisions replace
 * the older's thread by thread, and the rest stay.
 *
 * @param older - What was queued
 * @param newer - Tonight's read
 */
export function mergeQueuedFile(older: QueuedFile | null, newer: QueuedFile): QueuedFile {
  if (!older) return newer;
  const fresh = new Set(newer.decisions.map((d) => d.commentId));
  return { ...newer, decisions: [...older.decisions.filter((d) => !fresh.has(d.commentId)), ...newer.decisions] };
}
