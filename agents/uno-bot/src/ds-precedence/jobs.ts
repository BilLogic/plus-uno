// The weekly DS precedence check's two moves, on named dependencies:
//
//   • the CHECK — Friday's end-of-day run (`ds-precedence-check`,
//     src/scheduled/runs.ts): read, compare, and keep the report in KV for the
//     morning. It posts nothing. A clean week keeps nothing, and clears a
//     report no morning ever posted, so a stale list never goes out. A
//     library that has fewer than `MIN_LIBRARY_RATIO` of the indexed
//     components is a Figma or token fault, not a library that emptied
//     overnight, and reporting every component missing would file a wrong
//     intake — that week is skipped, logged once, and changes nothing kept.
//   • the POST — every morning run (`ds-precedence-post`): when a report is
//     waiting, post it in #plus-universal (`precedenceChannel`) on the shared
//     decision card (`slack/decision-cards.ts`): the parent line, then one
//     card per component, each its own proposal (`itemProposal`), decided by
//     the channel's members — read now — for six days. A card's Approve runs
//     `ds_precedence_intake` (`./intake.ts`), which files the week's intake or
//     comments on it; its Needs changes writes a dispute there
//     (`./dispute.ts`); its Reject leaves the difference as deliberate. Nothing
//     is typed, and a turn that would change a card is told to use its Review
//     (`refuseRevision`).
//     At most ten cards a morning, the carousel's limit: the rest, and any
//     card that did not stage, stay in the report for the next morning, under
//     the same week. Every morning rather than only Monday's: a morning whose
//     reads fail keeps the report, and the next one posts it.
//     Every posted message is recorded under its own ts (`env.ts`), so the
//     engagement gate knows its thread whichever week it is.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   check: the index + the registry from GitHub + the library's /components
//          from Figma = 3 external; the in-flight read and the report are KV,
//          the internal bucket.
//   post:  members (at most 3 pages) + the message (1) + an edit when a card
//          did not stage (1) = 5; the report's record and each card's staging
//          are Durable Object hops.
//
// `Env` enters in `ds-precedence/env.ts`.

import type { PendingProposal, ThreadState } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import { decisionReport, itemProposal, markNotStaged, reportRecord, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import { textSections } from "../slack/render";
import { pickDestination, resolveDestination, type TeamChannels } from "../sweep/finding";
import type { FigmaClient } from "../figma/client";
import type { JobContext } from "../scheduled/runs";
import {
  findDisagreements,
  indexedInLibrary,
  liveLibraryFrom,
  parseComponentIndex,
  type Disagreement,
  type PrecedenceRegistry,
} from "./compare";
import {
  byComponent,
  precedenceCard,
  precedenceCardWords,
  precedenceItem,
  precedenceParent,
  PRECEDENCE_NOTE_TAKEN,
  PRECEDENCE_REVISION_REFUSAL,
  type ComponentFinding,
} from "./report";

/**
 * The channel the weekly report posts in, by the rule every proactive job
 * shares (`pickDestination`): the check reads no conversation, so there is no
 * private place or thread to answer in, and its target is the Figma library —
 * a design-system target. Null when that role's channel is not configured.
 *
 * @param channels - The Worker's team channel ids
 */
export function precedenceChannel(channels: TeamChannels): string | null {
  const destination = pickDestination({
    evidence: { channel: "", channelKind: "public", threadTs: null, messageTs: [], permalinks: [] },
    target: { url: "", kind: "figma-library", writable: false, title: "", pillars: [] },
  });
  return resolveDestination(destination, channels)?.channel ?? null;
}

/** How long a weekly card stays confirmable: gone before next week's. */
export const PRECEDENCE_CARD_TTL_MS = 6 * 24 * 60 * 60 * 1000;
/** The share of indexed components the library must have for the check to
 *  believe it (`indexedInLibrary`). */
const MIN_LIBRARY_RATIO = 0.5;
/** A card that showed and did not stage says this in its place. */
export const NOT_STAGED = "Didn't go through, so it posts again tomorrow morning.";

/** What the check keeps for the morning. */
export interface PrecedenceReport {
  checkedAt: string;
  /** The check run's date, `YYYY-MM-DD` — the week the intake is labelled
   *  with. Absent from a report kept before it was recorded; `checkedAt`'s
   *  date stands in. */
  weekOf?: string;
  items: Disagreement[];
}

/** A posted report's message, as the engagement gate finds its thread. */
export interface PostedThread {
  channel: string;
  /** The report's message ts — the thread. */
  ts: string;
  weekOf: string;
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

export interface CheckDeps extends Pick<JobContext, "runDate"> {
  github: {
    /** design-system/agent-views/components/index.md */
    indexMarkdown(): Promise<string>;
    /** design-system/figma/component-registry.json */
    registry(): Promise<PrecedenceRegistry>;
  };
  /** The Figma client: the library file's components. */
  figma: Pick<FigmaClient, "components">;
  report: Store<PrecedenceReport | null>;
  /** Components a library publish is still carrying. */
  inFlight(registry: PrecedenceRegistry): Promise<Set<string>>;
  fileKey: string;
  repo: string;
  now(): number;
}

export interface CheckResult {
  found: number;
  summary: string;
}

/**
 * The end-of-day check.
 *
 * @param deps - The reads and the report store
 * @param opts - `dryRun` compares and writes nothing
 */
export async function runPrecedenceCheck(deps: CheckDeps, opts: { dryRun?: boolean } = {}): Promise<CheckResult> {
  const [markdown, registry, components] = await Promise.all([
    deps.github.indexMarkdown(),
    deps.github.registry(),
    deps.figma.components(deps.fileKey),
  ]);
  const index = parseComponentIndex(markdown);
  if (!index.length) throw new Error("the component index listed no components — refusing to report every one missing");
  const library = liveLibraryFrom(components);
  const present = indexedInLibrary(index, registry, library);
  if (present < index.length * MIN_LIBRARY_RATIO) {
    // An empty or near-empty answer is a Figma or permissions fault, not a
    // library that lost most of its components overnight: reporting every
    // component missing would file a wrong intake. The week is skipped, and
    // a report still waiting for its morning is left as it is.
    console.error(
      `[ds-precedence] the library has ${present} of ${index.length} indexed components — week skipped`,
    );
    return { found: 0, summary: `library near-empty (${present} of ${index.length} indexed) — week skipped` };
  }
  const items = findDisagreements({
    index,
    registry,
    library,
    fileKey: deps.fileKey,
    repo: deps.repo,
    inFlight: await deps.inFlight(registry),
  });
  if (!opts.dryRun) {
    await deps.report.write(items.length ? { checkedAt: new Date(deps.now()).toISOString(), weekOf: deps.runDate, items } : null);
  }
  return {
    found: items.length,
    summary: items.length ? `${items.length} disagreement(s) kept for the morning` : "code and the library agree",
  };
}

export interface PostDeps {
  report: Store<PrecedenceReport | null>;
  /** Record a posted report's thread under its own ts, for as long as its
   *  replies matter (`env.ts`). */
  recordThread(thread: PostedThread): Promise<void>;
  /** The channel's member ids, or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** Post in the channel, top level. */
  post(message: ReportMessage): Promise<{ ok: boolean; ts?: string }>;
  /** Edit a posted message in place (`chat.update`). */
  edit(ts: string, message: ReportMessage): Promise<void>;
  /** Where each report's record is kept, and its cards' decisions land. */
  reports: ReportStore & Pick<ThreadState, "putReport">;
  stage(proposal: PendingProposal): Promise<void>;
  channel: string;
  /** Where the precedence rule is written, as the parent line links it. */
  ruleUrl: string;
  now(): number;
}

export interface PostResult {
  posted: boolean;
  summary: string;
}

/**
 * One component's card as ThreadState stages it: one item of its report.
 *
 * @param channel - Where the report posted
 * @param messageTs - The report's message
 * @param finding - The component
 * @param weekOf - The check's date
 * @param confirmers - Who may decide it
 */
export function stagedComponent(
  channel: string,
  messageTs: string,
  finding: ComponentFinding,
  weekOf: string,
  confirmers: readonly string[],
): PendingProposal {
  const card = precedenceCard(finding, weekOf);
  const operations = card.operations;
  return {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel,
    threadTs: messageTs,
    replyTs: messageTs,
    ...itemProposal(messageTs, precedenceItem(finding).id),
    // The component's whole text, which Review shows.
    proposalText: renderProposalCard(card).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: PRECEDENCE_CARD_TTL_MS,
    confirmers: [...confirmers],
    stated: precedenceCardWords(PRECEDENCE_CARD_TTL_MS / 3_600_000),
    refuseRevision: PRECEDENCE_REVISION_REFUSAL,
    // Needs changes writes the note on the intake (`./dispute.ts`): no redraft.
    afterNeedsChanges: PRECEDENCE_NOTE_TAKEN,
  };
}

/**
 * The morning post: the waiting report, if any, as one message of cards.
 *
 * @param deps - Reads, the post, the report's record and the staging
 * @param opts - `dryRun` reads and drafts, and posts, stages and writes nothing
 */
export async function postPrecedenceReport(deps: PostDeps, opts: { dryRun?: boolean } = {}): Promise<PostResult> {
  const report = await deps.report.read();
  if (!report?.items.length) return { posted: false, summary: "no disagreements waiting" };

  const members = await deps.members();
  if (!members) {
    // A card nobody could confirm is worse than a day's wait.
    console.error("[ds-precedence] could not read the channel's members — report kept for tomorrow");
    return { posted: false, summary: "kept: the channel's members unread" };
  }

  const weekOf = report.weekOf ?? report.checkedAt.slice(0, 10);
  const findings = byComponent(report.items);
  const built = decisionReport(findings.map(precedenceItem), precedenceParent(findings.length, deps.ruleUrl));
  const shown = findings.slice(0, built.shown.length);
  const held = findings.slice(built.shown.length);
  if (opts.dryRun) return { posted: false, summary: `would post ${shown.length} component card(s)` };

  const sent = await deps.post({ text: built.text, blocks: built.blocks });
  if (!sent.ok || !sent.ts) {
    console.error("[ds-precedence] the report did not post — kept for tomorrow");
    return { posted: false, summary: "post failed; kept" };
  }
  const ts = sent.ts;
  // The report is up: posting it again tomorrow would show its cards twice,
  // so only what it held back is kept.
  const keep = (rest: readonly ComponentFinding[]) =>
    deps.report.write(rest.length ? { ...report, weekOf, items: rest.flatMap((f) => f.items) } : null);
  await keep(held);
  await deps.recordThread({ channel: deps.channel, ts, weekOf });

  const kept = await deps.reports.putReport(reportRecord(deps.channel, ts, built, PRECEDENCE_CARD_TTL_MS)).then(
    () => true,
    (err: unknown) => {
      console.error(`[ds-precedence] the report posted but its record was not kept: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    },
  );
  const failed: ComponentFinding[] = [];
  for (const finding of shown) {
    try {
      if (!kept) throw new Error("no report record");
      await deps.stage(stagedComponent(deps.channel, ts, finding, weekOf, members));
    } catch (err) {
      console.error(`[ds-precedence] ${finding.component} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(finding);
    }
  }
  if (!failed.length) return { posted: true, summary: `posted ${shown.length} component card(s)` };

  // Cards with nothing to review say so, and post again tomorrow.
  await keep([...failed, ...held]);
  const ids = failed.map((f) => precedenceItem(f).id);
  const marked = kept ? await markNotStaged(deps.reports, ts, ids, NOT_STAGED).catch(() => null) : null;
  // No record to mark them on: the message is cut back to a line saying so,
  // since its Review buttons would open nothing.
  const waiting = "The DS precedence cards didn't go through this morning, so they post again tomorrow.";
  await deps.edit(ts, marked ?? { text: waiting, blocks: textSections(waiting) }).catch(() => {});
  return { posted: true, summary: `posted ${shown.length} component card(s); ${failed.length} did not stage and wait for tomorrow` };
}
