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
//   • the HAND-OVER — every morning run (`ds-precedence-post`), before the
//     sweep's post: when a report is waiting, read #plus-universal's members
//     (`precedenceChannel`) and hand the report to the sweep's morning
//     message there, as one section of it (`precedenceSection`,
//     `../sweep/sections.ts`). It posts nothing of its own: the channel gets
//     one message a morning. The section is a line with the rule linked, then
//     one card per component, each its own proposal (`itemProposal`), decided
//     by the channel's members for six days. A card's Approve runs
//     `ds_precedence_intake` (`./intake.ts`), which files the week's intake or
//     comments on it; its Needs changes writes a dispute there
//     (`./dispute.ts`); its Reject leaves the difference as deliberate.
//     Nothing is typed, and a turn that would change a card is told to use
//     its Review (`refuseRevision`).
//     The section shows whole, never over two messages: past the carousel's
//     ten its line says how many show, and the rest come back with the next
//     week's check. A morning whose message does not go up keeps the report,
//     and the next one hands it over again — in practice once a week, the
//     Monday after Friday's check.
//     Every message that carried it is recorded under its own ts (`env.ts`),
//     so the engagement gate knows its thread whichever week it is.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   check:     the index + the registry from GitHub + the library's
//              /components from Figma = 3 external; the report is KV, the
//              internal bucket.
//   hand-over: members (at most 3 pages); the report and the hand-off are
//              internal.
//   section:   an edit when a card did not stage (1), on the sweep's post's
//              budget; the thread record, each card's staging and its usage
//              rows are internal.
//
// `Env` enters in `ds-precedence/env.ts`.

import type { PendingProposal } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import { itemProposal, markNotStaged, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
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
export const NOT_STAGED = "Didn't go through, so it comes back with next week's check.";

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
  });
  if (!opts.dryRun) {
    await deps.report.write(items.length ? { checkedAt: new Date(deps.now()).toISOString(), weekOf: deps.runDate, items } : null);
  }
  return {
    found: items.length,
    summary: items.length ? `${items.length} disagreement(s) kept for the morning` : "code and the library agree",
  };
}

/** The section's name on the sweep's morning post (`../sweep/sections.ts`). */
export const PRECEDENCE_SECTION = "ds-precedence";

/** What the morning hands the sweep's post: the week's report and who may
 *  decide its cards, read this morning. */
export interface PrecedenceHanded {
  weekOf: string;
  items: Disagreement[];
  confirmers: string[];
}

export interface HandOverDeps {
  report: Store<PrecedenceReport | null>;
  /** The channel's member ids, or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** The morning run's hand-off; absent on a rehearsal. */
  handOff?: SectionHandOff<PrecedenceHanded>;
  channel: string;
  /** The morning's date. */
  date: string;
}

export interface PostResult {
  posted: boolean;
  summary: string;
}

/**
 * The morning's move: the waiting report, if any, handed to the sweep's post
 * for #plus-universal's one message. It posts nothing itself, and keeps the
 * report until that message is up.
 *
 * @param deps - The report, the channel's members and the hand-off
 * @param opts - `dryRun` reads and hands nothing over
 */
export async function handOverPrecedenceReport(deps: HandOverDeps, opts: { dryRun?: boolean } = {}): Promise<PostResult> {
  const report = await deps.report.read();
  if (!report?.items.length) return { posted: false, summary: "no disagreements waiting" };

  const members = await deps.members();
  if (!members) {
    // A card nobody could confirm is worse than a day's wait.
    console.error("[ds-precedence] could not read the channel's members — report kept for tomorrow");
    return { posted: false, summary: "kept: the channel's members unread" };
  }
  const components = byComponent(report.items).length;
  if (opts.dryRun || !deps.handOff) return { posted: false, summary: `would hand ${components} component card(s) to the morning post` };
  await deps.handOff.put(deps.date, { channel: deps.channel, threadTs: null }, {
    weekOf: report.weekOf ?? report.checkedAt.slice(0, 10),
    items: report.items,
    confirmers: members,
  });
  return { posted: false, summary: `handed ${components} component card(s) to the morning post` };
}

export interface SectionDeps {
  report: Store<PrecedenceReport | null>;
  /** Record a posted report's thread under its own ts, for as long as its
   *  replies matter (`env.ts`). */
  recordThread(thread: PostedThread): Promise<void>;
  /** Edit the morning's message in place (`chat.update`). */
  edit(ts: string, message: ReportMessage): Promise<void>;
  /** Where the morning message's record is kept, and its cards' decisions land. */
  reports: ReportStore;
  stage(proposal: PendingProposal): Promise<void>;
  channel: string;
  /** Where the precedence rule is written, as the section's line links it. */
  ruleUrl: string;
}

/**
 * The weekly report as a section of the sweep's morning message in
 * #plus-universal: one line, with the rule linked, then a card per component,
 * each its own proposal (`stagedComponent`). It shows whole, never split over
 * two messages: past the carousel's ten its line says how many show, and the
 * rest come back with the next week's check, which finds them again. Once the
 * message is up the report is cleared before any card stages, so a stop
 * there never shows a card twice; a card that did not stage says so on the
 * message.
 *
 * @param deps - The report, the thread record, the edit and the staging
 * @param handOff - The morning run's hand-off
 * @param date - The morning's date
 */
export function precedenceSection(deps: SectionDeps, handOff: SectionHandOff<PrecedenceHanded>, date: string): SweepSection {
  return handedSection<PrecedenceHanded>({
    source: PRECEDENCE_SECTION,
    date,
    handOff,
    cardsOf(value) {
      const findings = byComponent(value.items);
      return {
        cards: findings.map((f) => ({ person: null, item: precedenceItem(f) })),
        whole: true,
        ttlMs: PRECEDENCE_CARD_TTL_MS,
        // The edit, when a card did not stage.
        cost: { subrequests: 1, d1Queries: findings.length * 3 },
        says: () => precedenceParent(findings.length, deps.ruleUrl),
      };
    },
    async posted(value, place, shown, report) {
      // Shown: not handed over again, whatever stages.
      const waiting = await deps.report.read();
      if (waiting && (waiting.weekOf ?? waiting.checkedAt.slice(0, 10)) === value.weekOf) await deps.report.write(null);
      await deps.recordThread({ channel: place.channel, ts: report.ts, weekOf: value.weekOf });
      const failed: string[] = [];
      for (const finding of byComponent(value.items)) {
        const id = precedenceItem(finding).id;
        if (!shown.includes(id)) continue;
        try {
          await deps.stage(stagedComponent(place.channel, report.ts, finding, value.weekOf, value.confirmers));
        } catch (err) {
          console.error(`[ds-precedence] ${finding.component} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
          failed.push(id);
        }
      }
      if (!failed.length) return;
      const marked = await markNotStaged(deps.reports, report.ts, failed, NOT_STAGED).catch(() => null);
      if (marked) await deps.edit(report.ts, marked).catch(() => {});
    },
    async notPosted(_value, _place, why) {
      // The report stays waiting: the next morning hands it over again.
      console.error(`[ds-precedence] the morning message did not carry the report (${why}) — kept for tomorrow`);
    },
  });
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
