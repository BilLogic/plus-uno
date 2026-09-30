// Drift in a file uno-bot cannot write — Figma first, then code — as the
// end-of-day sweep finds it and the morning ask reads it.
//
// A FILE DRIFT is a point a Slack thread settled that a linked file may not
// show yet: a Figma file, the design-system code, Storybook, a GitHub file.
// uno-bot cannot write any of them, so it never tries. It asks the thread
// whether the file is up to date, and drafts the hand-off a ✅ files:
//
//   • a Figma file → a Roadmap card from the PRD template (the project lane);
//   • code, Storybook or a repo file → a `harness-intake` GitHub issue (the
//     maintain lane).
//
// The sweep's own detector finds it, in the same call that finds Notion drift
// (`sweep/detector.ts`); the sweep's owner routing names its owner
// (`routeOwner`); `pickDestination` keeps it in its source thread. What is new
// here is what a read-only finding becomes instead of being counted and left.
//
// PURE: no `Env`, no Slack module, no Workers global.

import type { ChannelKind, FindingEvidence, FindingTarget, TargetKind } from "../sweep/finding";

/** The drift card's own slot in its thread, beside a sweep card and a turn's
 *  card (`proposalSlot`). */
export const DRIFT_KEY = "figma-drift";

/** Which hand-off a ✅ files. */
export type IntakeLane = "roadmap" | "maintain";

/**
 * The lane a read-only target's intake takes, or null for a target this job
 * does not ask about (a canvas, or anything writable).
 *
 * @param kind - The target's kind (`classifyLink`)
 */
export function intakeLaneOf(kind: TargetKind): IntakeLane | null {
  if (kind === "figma" || kind === "figma-library") return "roadmap";
  if (kind === "design-system-code" || kind === "storybook" || kind === "github") return "maintain";
  return null;
}

/**
 * Whether a link alone makes a thread worth the detector's call for file
 * drift. A plain GitHub link is not one — a thread that links a pull request
 * is not a thread about a file — though a GitHub source read beside a trigger
 * can still carry a finding.
 *
 * @param kind - The link's kind
 */
export function triggersFileDrift(kind: TargetKind): boolean {
  return kind === "figma" || kind === "figma-library" || kind === "design-system-code" || kind === "storybook";
}

/** One file drift, queued for its morning. */
export interface FileDriftFinding {
  /** `<channel>:<thread ts>:<file key>` — one per file per thread. */
  id: string;
  /** The end-of-day run date that found it, `YYYY-MM-DD`. */
  runDate: string;
  detectedAt: number;
  /** The earliest evidence message's time, epoch ms. */
  driftAt: number;
  target: FindingTarget;
  /** The file, whatever node or line the link pointed at (`fileKeyOf`). */
  fileKey: string;
  lane: IntakeLane;
  /** What the file shows, as the detector read it. */
  sourceSays: string;
  /** What the thread settled. */
  threadSays: string;
  evidence: FindingEvidence;
  /** The Slack user id `routeOwner` named. */
  owner: string;
  /** Everyone who posted in the thread. */
  participants: string[];
  confidence: number;
  /** The Product Pillar values of any Roadmap card the thread links — the
   *  candidates the morning exact-matches against the Roadmap's options. */
  pillars: string[];
}

/**
 * One key per file, whatever node, frame or line the link named: a Figma
 * file's key, or a repo URL without its query, fragment or line anchor.
 *
 * @param url - The target's URL
 * @param kind - Its kind
 */
export function fileKeyOf(url: string, kind: TargetKind): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return `url:${url}`;
  }
  if (kind === "figma" || kind === "figma-library") {
    const m = u.pathname.match(/^\/(?:design|file|proto|board)\/([A-Za-z0-9]+)/);
    if (m) return `figma:${m[1]}`;
  }
  return `url:${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
}

/**
 * Which ask a finding joins: one intake per file per day, and never across
 * audiences. Public threads share a file's intake; a finding from a private
 * channel or a group DM only ever shares one with its own place, so nothing of
 * it reaches another (ADR-031).
 *
 * @param f - The finding
 */
export function askGroupOf(f: Pick<FileDriftFinding, "fileKey" | "evidence">): string {
  return f.evidence.channelKind === "public" ? f.fileKey : `${f.fileKey}@${f.evidence.channel}`;
}

/** What `sweepThread` hands over for one read-only finding. */
export interface FileDriftInput {
  channel: string;
  channelKind: ChannelKind;
  rootTs: string;
  runDate: string;
  now: number;
  target: FindingTarget;
  sourceSays: string;
  threadSays: string;
  evidenceTs: string[];
  permalinks?: string[];
  owner: string;
  participants: string[];
  confidence: number;
  pillars: string[];
}

/**
 * A read-only finding as the queue keeps it, or null for a target this job
 * does not ask about.
 *
 * @param input - The finding, routed
 */
export function fileDriftFinding(input: FileDriftInput): FileDriftFinding | null {
  const lane = intakeLaneOf(input.target.kind);
  if (!lane || input.target.writable) return null;
  const fileKey = fileKeyOf(input.target.url, input.target.kind);
  return {
    id: `${input.channel}:${input.rootTs}:${fileKey}`,
    runDate: input.runDate,
    detectedAt: input.now,
    driftAt: Math.min(...input.evidenceTs.map((ts) => Math.round(Number(ts) * 1000))),
    target: input.target,
    fileKey,
    lane,
    sourceSays: input.sourceSays,
    threadSays: input.threadSays,
    evidence: {
      channel: input.channel,
      channelKind: input.channelKind,
      threadTs: input.rootTs,
      messageTs: [...input.evidenceTs],
      permalinks: input.permalinks ?? [],
    },
    owner: input.owner,
    participants: [...input.participants],
    confidence: input.confidence,
    pillars: [...new Set(input.pillars)],
  };
}

/** Where the end-of-day sweep hands its file drift. */
export interface FileDriftSink {
  /** Adds, replacing a finding with the same id by the newer read. */
  add(findings: FileDriftFinding[]): Promise<void>;
}
