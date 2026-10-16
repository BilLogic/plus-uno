// The weekly DS precedence check's two moves, on named dependencies:
//
//   • the CHECK — Monday's end-of-day run (`ds-precedence-check`,
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
//     by the channel's members within 24 weekday hours (`cardExpiresAt`). Approve runs
//     `ds_precedence_intake` (`./intake.ts`), which files the week's intake or
//     comments on it; its Needs changes writes a dispute there
//     (`./dispute.ts`); its Reject leaves the difference as deliberate.
//     Nothing is typed, and a turn that would change a card is told to use
//     its Review (`refuseRevision`).
//     The section shows whole, never over two messages: past the carousel's
//     ten its line says how many show, and the rest come back with the next
//     week's check. A morning whose message does not go up keeps the report,
//     and the next one hands it over again — in practice once a week, on
//     Monday morning, three hours after Monday's 06:00 check.
//     Every message that carried it is recorded under its own ts (`env.ts`),
//     so the engagement gate knows its thread whichever week it is.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   check:     the index + the registry from GitHub + the library's
//              /components and its meta (the creator the report names) from
//              Figma = 4 external; the report is KV, the internal bucket.
//   hand-over: members (at most 3 pages); the report and the hand-off are
//              internal.
//   section:   an edit when a card did not stage (1), on the sweep's post's
//              budget; the thread record, each card's staging and its usage
//              rows are internal.
//
// `Env` enters in `ds-precedence/env.ts`.

import type { PendingProposal } from "../thread-state/index";
import { rethrowIfBudget } from "../net";
import { renderProposalCard } from "../slack/proposal-render";
import { itemProposal, markNotStaged, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import { pickRoute, resolveDestination, type ChannelIds } from "../sweep/finding";
import type { Addressee } from "../destination/index";
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
  componentId,
  precedenceCard,
  precedenceCardWords,
  precedenceFacts,
  precedenceItem,
  precedenceParent,
  PRECEDENCE_NOTE_TAKEN,
  PRECEDENCE_REVISION_REFUSAL,
  type ComponentFinding,
} from "./report";

/**
 * The channel the weekly report posts in, by the rule every proactive job
 * shares (`pickDestination`): the check reads no conversation, so there is no
 * private place or thread to answer in, and its target is the Figma library,
 * the Universal team's file. Null when that channel is not configured.
 *
 * @param channels - The Worker's team channel ids
 */
export function precedenceChannel(channels: ChannelIds): string | null {
  return resolveDestination(precedenceRoute(null).destination, channels)?.channel ?? null;
}

/** Whom the weekly report names: the ladder's addressee for the library file. */
export function precedenceAddressee(report: Pick<PrecedenceReport, "creatorHandle">): Addressee | null {
  return precedenceRoute(report.creatorHandle ?? null).addressee;
}

function precedenceRoute(creatorHandle: string | null): ReturnType<typeof pickRoute> {
  return pickRoute({
    evidence: { channel: "", channelKind: "public", threadTs: null, messageTs: [], permalinks: [] },
    target: { url: "", kind: "figma-library", writable: false, title: "", pillars: [], creatorHandle },
  });
}

/** The library file's creator by handle; null when its meta cannot be read, which never stops the check. */
async function creatorOf(deps: Pick<CheckDeps, "figma" | "fileKey">): Promise<string | null> {
  try {
    return (await deps.figma.fileMeta(deps.fileKey)).file.creator?.handle ?? null;
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[ds-precedence] the library's creator was not read: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** The share of indexed components the library must have for the check to
 *  believe it (`indexedInLibrary`). */
const MIN_LIBRARY_RATIO = 0.5;
/** A card that showed and did not stage says this in its place. */
export const NOT_STAGED = "Didn't go through, so it comes back in tomorrow's report.";

/** What the check keeps for the morning. */
export interface PrecedenceReport {
  checkedAt: string;
  /** The check run's date, `YYYY-MM-DD` — the week the intake is labeled
   *  with. Absent from a report kept before it was recorded; `checkedAt`'s
   *  date stands in. */
  weekOf?: string;
  /** The library file's creator by Figma handle: whom the report names, as
   *  the ladder names a file with no card. Absent when the meta was unread. */
  creatorHandle?: string | null;
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
  /** The Figma client: the library file's components, and its creator. */
  figma: Pick<FigmaClient, "components" | "fileMeta">;
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
  const [markdown, registry, components, creatorHandle] = await Promise.all([
    deps.github.indexMarkdown(),
    deps.github.registry(),
    deps.figma.components(deps.fileKey),
    creatorOf(deps),
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
    await deps.report.write(
      items.length ? { checkedAt: new Date(deps.now()).toISOString(), weekOf: deps.runDate, creatorHandle, items } : null,
    );
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
  /** The library file's creator by Figma handle, whom the line names. */
  creatorHandle?: string | null;
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
    creatorHandle: report.creatorHandle ?? null,
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
 * each its own proposal (`stagedComponent`). It goes first on the message:
 * past the carousel's ten its line says how many show. Once the message is
 * up, each card it showed stages; what did not show, or did not stage, stays
 * in the report for the next morning's message, which hands it over again
 * until a newer week's check replaces it. A card that did not stage says so
 * on the message.
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
        // The cards that show, each a staging, and the edit when one did not stage.
        cost: (shown) => ({ subrequests: 1, d1Queries: shown.length * 3 }),
        says: () => precedenceParent(findings.length, deps.ruleUrl, precedenceAddressee(value)),
      };
    },
    async posted(value, place, shown, report, progress) {
      await deps.recordThread({ channel: place.channel, ts: report.ts, weekOf: value.weekOf });
      const staged = new Set<string>();
      const failed: string[] = [];
      for (const finding of byComponent(value.items)) {
        const id = precedenceItem(finding).id;
        if (!shown.includes(id)) continue;
        const before = progress.done.get(id);
        if (before !== undefined) {
          if (before) staged.add(id);
          else failed.push(id);
          continue;
        }
        try {
          await deps.stage(stagedComponent(place.channel, report.ts, finding, value.weekOf, value.confirmers));
          staged.add(id);
          await progress.mark(id, true);
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[ds-precedence] ${finding.component} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
          failed.push(id);
          await progress.mark(id, false);
        }
      }
      // What staged is not handed over again; the rest wait in the report for
      // the next morning, unless a newer week's check has replaced it.
      const waiting = await deps.report.read();
      if (waiting && (waiting.weekOf ?? waiting.checkedAt.slice(0, 10)) === value.weekOf) {
        const rest = waiting.items.filter((item) => !staged.has(componentId(item.component)));
        if (rest.length !== waiting.items.length) await deps.report.write(rest.length ? { ...waiting, items: rest } : null);
      }
      if (!failed.length) return;
      const marked = await markNotStaged(deps.reports, report.ts, failed, NOT_STAGED).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      if (marked) await deps.edit(report.ts, marked).catch(rethrowIfBudget);
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
    confirmers: [...confirmers],
    stated: precedenceCardWords(),
    refuseRevision: PRECEDENCE_REVISION_REFUSAL,
    // Needs changes writes the note on the intake (`./dispute.ts`): no redraft.
    afterNeedsChanges: PRECEDENCE_NOTE_TAKEN,
    facts: precedenceFacts(finding, weekOf),
  };
}
