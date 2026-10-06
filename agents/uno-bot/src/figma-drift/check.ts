// The file, looked at before uno-bot asks about it and while the question is
// live (#897): when did it last change, and — when that was after the
// decision — does the frame the thread linked now show it?
//
// TWO READS, CHEAPEST FIRST. The last change comes from `versions` (Tier 2,
// newest first, autosaves included), which the morning reads anyway for the
// intake's publisher. Only a file that changed after the decision costs a
// `nodes` read of the linked frame (Tier 1, the scarce tier on Bill's token)
// and one judgement (`./judge.ts`). Each read is made once per file, or per
// frame, per run, however many threads discussed it.
//
// A FAILED READ IS "UNKNOWN", NEVER "UNCHANGED": the question then goes out
// saying the file may not show the decision yet, which is what the morning
// said before it looked. A budget stop is thrown through, as every drift read
// does, so the runner retries on a fresh budget.
//
// PURE: the client and the judge are parameters.

import { rethrowIfBudget } from "../net";
import type { FigmaClient, FigmaVersionsResponse } from "../figma/client";
import { fetchFigmaNode, parseFigmaUrl, type FigmaNodeContent } from "../integrations/figma";
import type { TargetKind } from "../sweep/finding";
import type { FileChange } from "./copy";
import type { FrameJudge } from "./judge";

/** Whether the morning can look at a file of this kind: Figma's only. */
export function isFigmaKind(kind: TargetKind): boolean {
  return kind === "figma" || kind === "figma-library";
}

/** A drift file key's Figma key (`figma:<key>`), or null for any other file. */
export function figmaKeyOf(fileKey: string): string | null {
  return fileKey.startsWith("figma:") ? fileKey.slice("figma:".length) || null : null;
}

/**
 * When a file last changed: its newest version, named or autosaved, or null
 * when Figma lists none.
 *
 * @param result - The file's `/versions` body
 */
export function lastChangeOf(result: FigmaVersionsResponse): number | null {
  const times = (result.versions ?? []).map((v) => Date.parse(v.created_at)).filter(Number.isFinite);
  return times.length ? Math.max(...times) : null;
}

/** One run's reads, each made once. A failure is null; a budget stop throws. */
export interface FileReads {
  versions(figmaKey: string): Promise<FigmaVersionsResponse | null>;
  frame(figmaKey: string, nodeId: string): Promise<FigmaNodeContent | null>;
}

/**
 * Reads over the Figma client, cached for one run.
 *
 * @param figma - The client
 * @param log - Where a failed read is said; console by default
 */
export function cachedReads(figma: Pick<FigmaClient, "versions" | "nodes">, log: (line: string) => void = console.warn): FileReads {
  const versions = new Map<string, Promise<FigmaVersionsResponse | null>>();
  const frames = new Map<string, Promise<FigmaNodeContent | null>>();
  const failed = (what: string) => (err: unknown) => {
    rethrowIfBudget(err);
    log(`[figma-drift] ${what} could not be read: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  };
  return {
    versions(key) {
      if (!versions.has(key)) versions.set(key, figma.versions(key).catch(failed(`${key} versions`)));
      return versions.get(key)!;
    },
    frame(key, nodeId) {
      const id = `${key}:${nodeId}`;
      if (!frames.has(id)) frames.set(id, fetchFigmaNode(figma, key, nodeId).catch(failed(`${key} frame ${nodeId}`)));
      return frames.get(id)!;
    },
  };
}

/** One decision, as the check reads it. */
export interface DecisionToCheck {
  /** The drift file key (`figma:<key>`). */
  fileKey: string;
  /** The link the thread used — its node id names the frame. */
  url: string;
  /** When the thread settled it, epoch ms. */
  decidedAt: number;
  threadSays: string;
  sourceSays: string;
  /** The newest change already judged; a change at or before it is not
   *  judged again. The decision time when nothing has been. */
  checkedThrough?: number;
}

/** What the check found. */
export interface DecisionCheck {
  change: FileChange;
  /** The frame now shows the decision — no question, or a withdrawn one. */
  shows: boolean;
  /** A judgement was asked for (a frame read and a model call spent). */
  judged: boolean;
}

/**
 * Look at the file for one decision.
 *
 * @param reads - This run's reads (`cachedReads`)
 * @param judge - The frame judge; without one, nothing is ever "shows"
 * @param d - The decision
 */
export async function checkDecision(reads: FileReads, judge: FrameJudge | undefined, d: DecisionToCheck): Promise<DecisionCheck> {
  const unknown: DecisionCheck = { change: { kind: "unknown" }, shows: false, judged: false };
  const key = figmaKeyOf(d.fileKey);
  if (!key) return unknown;
  const versions = await reads.versions(key);
  const last = versions ? lastChangeOf(versions) : null;
  if (last === null) return unknown;
  if (last <= d.decidedAt) return { change: { kind: "unchanged", at: last }, shows: false, judged: false };
  const change: FileChange = { kind: "changed", at: last };
  const nodeId = parseFigmaUrl(d.url)?.nodeId;
  if (!judge || !nodeId || last <= (d.checkedThrough ?? d.decidedAt)) return { change, shows: false, judged: false };
  const frame = await reads.frame(key, nodeId);
  if (!frame) return { change, shows: false, judged: false };
  let verdict: Awaited<ReturnType<FrameJudge>>;
  try {
    verdict = await judge({ threadSays: d.threadSays, sourceSays: d.sourceSays, frame });
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[figma-drift] the frame judge failed: ${err instanceof Error ? err.message : String(err)}`);
    verdict = "unsure";
  }
  return { change, shows: verdict === "shows", judged: true };
}
