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
// `docs/connectors/figma.md`).
//
// PURE: types and one merge.

import type { FigmaClient } from "../figma/client";
import type { PendingProposal, ProposalOperation } from "../thread-state/index";
import type { DecisionDetector, DecisionRoute } from "./detector";
import type { DecisionUpdate } from "./draft";
import type { Section } from "./sections";

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
  /** What its ✅ runs. */
  operation: ProposalOperation;
  /** What its card says the ✅ does. */
  update: DecisionUpdate;
  confidence: number;
}

/** Who a file's thread asks. */
export type FileOwner =
  /** A card's first Contributor, as a Slack id. */
  | { slack: string }
  /** A file with no card: its creator, by Figma handle until #902 maps Figma people to Slack. */
  | { figma: string };

/** One file's decisions, waiting for the morning. */
export interface QueuedFile {
  fileKey: string;
  /** The file's name, as Figma has it. */
  title: string;
  url: string;
  owner: FileOwner | null;
  /** Who may decide: the cards' Contributors as Slack ids. Empty for a file
   *  with no card, or none whose Contributors are Slack people: then
   *  #plus-design's members decide its cards. */
  confirmers: string[];
  decisions: QueuedDecision[];
  runDate: string;
  foundAt: number;
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

/** A decision thread posted in #plus-design, as the reply handler finds it. */
export interface DecisionThread {
  channel: string;
  /** The parent message's ts: the thread. */
  ts: string;
  fileKey: string;
  title: string;
  /** Who may decide, as the cards were staged. */
  confirmers: string[];
  /** When its cards lapse, epoch ms. */
  expiresAt: number;
  decisions: Array<{ n: number; commentId: string; cardTs: string; decision: QueuedDecision }>;
}

/** The night's reads and the morning's posts, as the sweep hands them over. */
export interface SweepFigmaComments extends FigmaCommentStores {
  figma: Pick<FigmaClient, "comments" | "file" | "fileMeta" | "teamFolders" | "folderFiles">;
  /** Keys under a prefix of the notification route's KV notes, each with the
   *  time it records (null when it cannot be read). */
  notes: { list(prefix: string): Promise<Array<{ key: string; at: string | null }>> };
  /** A Roadmap card by its number, or null when the Roadmap has none. */
  card(number: number): Promise<{ url: string; title: string } | null>;
  detector: DecisionDetector;
  /** MISC's team id, from `FIGMA_TEAM_IDS`; absent, nothing is skipped as MISC. */
  miscTeamId?: string;
  /** The morning's Slack side. Absent, the post skips. */
  slack?: {
    post(message: { text: string; blocks?: unknown[]; thread_ts?: string }): Promise<{ ok: boolean; ts?: string }>;
    edit(ts: string, message: { text: string; blocks?: unknown[] }): Promise<void>;
    /** #plus-design's members, or null when they cannot be read. */
    members(): Promise<string[] | null>;
    /** Stage a card the Worker posted, and put it on the usage record. */
    stage(proposal: PendingProposal): Promise<void>;
    channel: string;
  };
  threads?: {
    read(ts: string): Promise<DecisionThread | null>;
    write(thread: DecisionThread): Promise<void>;
  };
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
