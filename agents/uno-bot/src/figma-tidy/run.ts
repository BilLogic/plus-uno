// The weekly Figma tidy-up (#905): Monday's morning run, on named dependencies.
//
//   • the READ — `figma-tidy-read` jobs list every team's stage folders and
//     their files, MISC left out. A listing is one Tier 2 call, a team of five
//     folders six, and a job stops while it still has room for one more, so
//     the listing is cut across `TIDY_JOBS` jobs and kept in one KV key
//     between them, dated to its Monday. Names, keys and last changes only.
//     Once it is done, the same jobs read the pages of each file changed
//     since its last read, for the title check (`readPages`): two Tier 1
//     calls a file, so a week reads what its budget allows and the next
//     week goes on; an unchanged file is never read again.
//   • SKIP — "Leave as is" keeps a file and check quiet until the file's
//     title cards change (`leaveAsIs`), so an item stays left as is however
//     long the file stays as it is.
//   • the HAND-OVER — `figma-tidy-post`, after the reads and before the
//     sweep's post: the cards the titles name, read from the Roadmap in one
//     query; the checks (`./checks.ts`); then what is new handed to the
//     sweep's morning message in the Figma Review channel, as a section of it
//     (`tidySection`, `../sweep/sections.ts`). It posts nothing of its own.
//     The section is a line for the week, a bullet per owner, mentioning them
//     once, with their count, the files with no owner the Roadmap names last;
//     then its cards in the message's one carousel of at most ten (Slack's
//     limit), shared with the other sections, filled round-robin, so every
//     owner has one before anyone has a second. Each card is its own
//     proposal, answered in its Review pop-up with "Moved it" or "Leave as
//     is"; neither writes to Figma (`./copy.ts`).
//
// WHAT THE WEEKS REMEMBER. Every card shown is remembered by its fingerprint
// (file, check and card) for five weeks. A later week shows only what is new,
// and counts what is still open; an item that did not show is not
// remembered, so it is new the next week. A week with nothing new hands
// nothing over; the first week with nothing open at all, after a week that
// had some, hands over one all-clear line and then goes quiet.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   read: one call a listing, three with retries; ~30 for five teams. Then
//         one or two page reads a file (`PAGES_COST` with retries) until
//         the job's budget is nearly spent.
//   hand-over: the Roadmap (one query per 100 cards) + a likely card for the
//         first unknown ones (at most `LIKELY_LOOKUPS`) + members (at most 3
//         pages). The listing, the memory and the hand-off are internal.
//   section: an edit when a card did not stage (1), on the sweep's post's
//         budget; the stagings are Durable Object hops.
//
// PURE: `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import { FigmaRequestError, type FigmaClient } from "../figma/client";
import type { FigmaTeam } from "../figma-notify/teams";
import type { PendingProposal } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import { itemProposal, markNotStaged, roundRobin, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import { pagesOf } from "../figma-comments/sections";
import { collectTextLayers } from "../integrations/figma-reading";
import {
  cardKey,
  cardRefsIn,
  cardsNamed,
  isExempt,
  pageReadFiles,
  projectOf,
  skipKeyOf,
  tidyFindings,
  type TidyCard,
  type TidyCheck,
  type TidyFile,
  type TidyFinding,
  type TidyFolder,
} from "./checks";
import {
  allClearText,
  ownerLine,
  tidyCard,
  tidyCardWords,
  tidyChoices,
  tidyFacts,
  tidyItem,
  tidyCarriedParent,
  tidyParent,
  TIDY_NOT_STAGED,
  TIDY_REVISION_REFUSAL,
} from "./copy";

export type { TidyCard, TidyFile, TidyFolder } from "./checks";

const DAY_MS = 24 * 60 * 60 * 1000;
/** How long a shown card's fingerprint is remembered. */
export const MEMORY_MS = 35 * DAY_MS;
/** How long a card stays answerable: gone before next Monday's. */
export const TIDY_CARD_TTL_MS = 6 * DAY_MS;
/** Likely-card lookups one post makes, one Roadmap query each. */
export const LIKELY_LOOKUPS = 5;
/** External subrequests one listing may take: the client tries a call up to three times. */
export const LISTING_COST = 3;
/** External subrequests one file's page and Cover reads may take. */
export const PAGES_COST = 2 * LISTING_COST;

/** One listing still to make. */
export type TidyTask = { kind: "team"; team: string; teamId: string } | { kind: "folder"; team: string; folderId: string };

/** The week's listing, kept between the read jobs and the post. Finished when no task is left. */
export interface TidyListing {
  /** The Monday it was listed for. */
  runDate: string;
  tasks: TidyTask[];
  folders: TidyFolder[];
  files: TidyFile[];
}

/** What the weeks remember. */
export interface TidyMemory {
  /** Fingerprint → the Monday its card was shown, `YYYY-MM-DD`. */
  shown: Record<string, string>;
  /** Items open at the last post: what an all-clear says were fixed. */
  open: number;
}

/**
 * The cards each file's page names and Cover text name, by file key, with the
 * `last_modified` they were read at: a file is read again only once it changes.
 */
export type TidyRefs = Record<string, { modified: string; cards: number[] }>;

/**
 * Items left as is, by `<file key>|<check>`: the file's title cards when it
 * was, as `cardKey` writes them. A change to them opens the item again.
 */
export type TidySkips = Record<string, string>;

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

export interface TidyReadDeps {
  figma: Pick<FigmaClient, "teamFolders" | "folderFiles" | "file">;
  teams: readonly FigmaTeam[];
  listing: Store<TidyListing | null>;
  /** What each file's pages and Cover named, kept across weeks. */
  refs: Store<TidyRefs | null>;
  meter?: { headroom(): { subrequests: number } };
  runDate: string;
}

export interface TidyReadResult {
  listed: number;
  left: number;
  summary: string;
}

/**
 * One read job: start the week's listing, or resume it, and list until it is
 * done or this job's budget is nearly spent; then read the pages of each file
 * changed since its last read (`readPages`) while the budget lasts.
 *
 * @param deps - The Figma client, the teams and the listing's store
 * @param opts - `dryRun` lists and keeps nothing
 */
export async function runTidyRead(deps: TidyReadDeps, opts: { dryRun?: boolean } = {}): Promise<TidyReadResult> {
  const kept = await deps.listing.read();
  const listing: TidyListing =
    kept && kept.runDate === deps.runDate
      ? structuredClone(kept)
      : {
          runDate: deps.runDate,
          tasks: deps.teams.filter((t) => !isExempt({ team: t.name, name: "" })).map((t): TidyTask => ({ kind: "team", team: t.name, teamId: t.id })),
          folders: [],
          files: [],
        };
  let listed = 0;
  const notes: string[] = [];
  if (listing.tasks.length) await listMore(deps, listing, notes, opts).then((n) => (listed = n));
  const pages = listing.tasks.length ? null : await readPages(deps, listing, notes, opts);
  const end = listing.tasks.length
    ? `${listing.tasks.length} listing(s) left`
    : `done: ${listing.files.length} file(s)${pages ? `; pages read for ${pages.read}, ${pages.left} left` : ""}`;
  return { listed, left: listing.tasks.length, summary: `listed ${listed}; ${end}${notes.length ? ` — ${notes.join("; ")}` : ""}` };
}

/** List until the week's listing is done or the budget is nearly spent, and keep it. */
async function listMore(deps: TidyReadDeps, listing: TidyListing, notes: string[], opts: { dryRun?: boolean }): Promise<number> {
  let listed = 0;
  try {
    while (listing.tasks.length) {
      if ((deps.meter?.headroom().subrequests ?? Infinity) < LISTING_COST) {
        notes.push("this job's budget is nearly spent — the next job resumes");
        break;
      }
      const task = listing.tasks[0]!;
      try {
        if (task.kind === "team") {
          const { folders } = await deps.figma.teamFolders(task.teamId);
          listing.folders.push(...folders.map((f) => ({ team: task.team, id: f.id, name: f.name })));
          listing.tasks.shift();
          listing.tasks.unshift(...folders.map((f): TidyTask => ({ kind: "folder", team: task.team, folderId: f.id })));
        } else {
          const { files } = await deps.figma.folderFiles(task.folderId);
          listing.files.push(...files.map((f) => ({ team: task.team, folderId: task.folderId, key: f.key, name: f.name, modified: f.last_modified })));
          listing.tasks.shift();
        }
        listed += 1;
      } catch (err) {
        rethrowIfBudget(err);
        if (err instanceof FigmaRequestError && err.status === 404) {
          notes.push(`${task.kind} ${task.kind === "team" ? task.team : task.folderId}: Figma says 404, so skipped`);
          listing.tasks.shift();
          continue;
        }
        notes.push(`a listing failed (${err instanceof Error ? err.message : String(err)}) — kept for the next job`);
        break;
      }
    }
  } finally {
    if (!opts.dryRun) await deps.listing.write(listing);
  }
  return listed;
}

/**
 * The title check's reads: each file the checks look at, outside Archive and
 * not a kit, whose `last_modified` differs from its last read — its page
 * names (one depth-1 read), and the text under its Cover section's pages
 * (one more, only when it has a Cover). Both are Tier 1, so a job reads only
 * while it has room for a file's two, and the next job or next week goes on.
 * What they named is kept by file; a file the listing no longer has is
 * forgotten.
 */
async function readPages(
  deps: TidyReadDeps,
  listing: TidyListing,
  notes: string[],
  opts: { dryRun?: boolean },
): Promise<{ read: number; left: number }> {
  const kept = (await deps.refs.read()) ?? {};
  const listed = new Set(listing.files.map((f) => f.key));
  const refs: TidyRefs = Object.fromEntries(Object.entries(kept).filter(([key]) => listed.has(key)));
  let changed = Object.keys(refs).length !== Object.keys(kept).length;
  const due = pageReadFiles(listing.files, listing.folders).filter((f) => refs[f.key]?.modified !== (f.modified ?? ""));
  let read = 0;
  for (const file of due) {
    if ((deps.meter?.headroom().subrequests ?? Infinity) < PAGES_COST) {
      notes.push("this job's budget is nearly spent — the next job reads the rest of the pages");
      break;
    }
    try {
      refs[file.key] = { modified: file.modified ?? "", cards: await cardsOnPages(deps.figma, file.key) };
    } catch (err) {
      rethrowIfBudget(err);
      if (!(err instanceof FigmaRequestError && err.status === 404)) {
        notes.push(`a page read failed (${err instanceof Error ? err.message : String(err)}) — the next job tries again`);
        break;
      }
      refs[file.key] = { modified: file.modified ?? "", cards: [] };
    }
    read += 1;
    changed = true;
  }
  if (changed && !opts.dryRun) await deps.refs.write(refs);
  return { read, left: due.length - read };
}

/** The cards a file's page names and Cover text name, page names first, each once. */
async function cardsOnPages(figma: Pick<FigmaClient, "file">, key: string): Promise<number[]> {
  const pages = pagesOf((await figma.file(key, { depth: 1 })).document);
  const found = pages.flatMap((p) => cardRefsIn(p.name));
  const cover = new Set(pages.filter((p) => p.section === "Cover").map((p) => p.id));
  if (cover.size) {
    const { document } = await figma.file(key, { ids: [...cover] });
    for (const page of document.children ?? []) {
      if (page.id && cover.has(page.id)) found.push(...collectTextLayers(page).texts.flatMap(cardRefsIn));
    }
  }
  return [...new Set(found)];
}

export interface TidyPostDeps {
  listing: Store<TidyListing | null>;
  memory: Store<TidyMemory | null>;
  /** What the read found on each file's pages and Cover. */
  refs: Store<TidyRefs | null>;
  skips: Store<TidySkips | null>;
  roadmap: {
    /** The Roadmap's cards among these numbers, each with its design owner. */
    cards(numbers: readonly number[]): Promise<TidyCard[]>;
    /** The card a project's name most likely means, or null. */
    likely(project: string): Promise<TidyCard | null>;
  };
  /** The channel's member ids — who may answer a card — or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** The week's cards that did not show on an earlier morning's message. */
  waiting: Store<TidyHanded | null>;
  /** The morning run's hand-off; absent on a rehearsal. */
  handOff?: SectionHandOff<TidyHanded>;
  channel: string;
  /** The morning's date: the Monday, on the week's own run. */
  runDate: string;
  now(): number;
}

export interface TidyPostResult {
  posted: boolean;
  summary: string;
}

/** A finding as the week's section carries it. */
interface Shown {
  finding: TidyFinding;
  likely: TidyCard | null;
  /** Its owner's name, where a DM tags nobody. */
  ownerName?: string;
}

/** What the week's hand-over leaves for the morning's message. */
export interface TidyHanded {
  /** Every new finding, round-robin by owner, each with the likely card it names. */
  shown: Shown[];
  /** New this week, and still open from earlier weeks. */
  fresh: number;
  stillOpen: number;
  /** Every open item, new or not: what an all-clear says were fixed. */
  open: number;
  /** Who may answer a card. */
  confirmers: string[];
  /** Items fixed since last week, when this week is the all-clear. */
  allClear?: number;
  /** The Monday whose week these are, on a later morning carrying the cards
   *  an earlier message had no room for. */
  carriedFrom?: string;
}

/** The section's name on the sweep's morning post. */
export const TIDY_SECTION = "figma-tidy";

/**
 * The week's hand-over: the checks, then what is new handed to the sweep's
 * morning message in the Figma Review channel, as a section of it. It posts
 * nothing of its own. On a morning with no listing of its own, the week's
 * cards an earlier message had no room for are handed over instead.
 *
 * @param deps - The listing, the memory, the Roadmap, the members and the hand-off
 * @param opts - `dryRun` reads and drafts, and hands over and keeps nothing
 */
export async function runTidyPost(deps: TidyPostDeps, opts: { dryRun?: boolean } = {}): Promise<TidyPostResult> {
  const listing = await deps.listing.read();
  if (!listing || listing.runDate !== deps.runDate) return handOverWaiting(deps, opts);
  if (listing.tasks.length) return { posted: false, summary: `the listing stopped short (${listing.tasks.length} left) — no report this week` };
  // A new week: what an earlier week left waiting is replaced by its own.
  if (!opts.dryRun) await deps.waiting.write(null);

  const refs = Object.fromEntries(Object.entries((await deps.refs.read()) ?? {}).map(([key, r]) => [key, r.cards]));
  const numbers = cardsNamed(listing.files, listing.folders, refs);
  const cards = numbers.length ? await deps.roadmap.cards(numbers) : [];
  const { findings, skips } = withoutSkipped(tidyFindings(listing.files, listing.folders, cards, refs), listing.files, await deps.skips.read());
  if (skips && !opts.dryRun) await deps.skips.write(skips);

  const memory = remembered(await deps.memory.read(), deps.runDate);
  const fresh = findings.filter((f) => !memory.shown[f.fingerprint]);
  const stillOpen = findings.length - fresh.length;
  const handOver = async (value: TidyHanded) => {
    if (!opts.dryRun && deps.handOff) await deps.handOff.put(deps.runDate, { channel: deps.channel, threadTs: null }, value);
  };

  if (!fresh.length) {
    if (!findings.length && memory.open > 0) {
      if (opts.dryRun || !deps.handOff) return { posted: false, summary: "would hand the all-clear to the morning post" };
      await handOver({ shown: [], fresh: 0, stillOpen: 0, open: 0, confirmers: [], allClear: memory.open });
      return { posted: false, summary: "handed the all-clear to the morning post" };
    }
    if (!opts.dryRun) await deps.memory.write({ ...memory, open: findings.length });
    return { posted: false, summary: findings.length ? `nothing new; ${findings.length} still open` : "nothing to tidy" };
  }

  const members = await deps.members();
  if (!members) return { posted: false, summary: "the channel's members unread — no report this week" };

  const groups = byOwner(fresh);
  // Every owner's first before anyone's second, as the carousel fills.
  const ordered = [...roundRobin(groups, fresh.length).values()].flat();
  // Each owner's name, from the Roadmap cards read above: what a DM says in place of a tag.
  const names = new Map(cards.flatMap((c) => (c.owner && c.ownerName ? [[c.owner, c.ownerName] as const] : [])));
  let lookups = 0;
  const shown: Shown[] = [];
  for (const finding of ordered) {
    let likely: TidyCard | null = null;
    if (finding.check === "unknown-card" && lookups < LIKELY_LOOKUPS) {
      lookups += 1;
      likely = await deps.roadmap.likely(projectOf(finding.file.name)).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
    }
    const ownerName = finding.owner ? names.get(finding.owner) : undefined;
    shown.push({ finding, likely, ...(ownerName ? { ownerName } : {}) });
  }
  const counted = `${shown.length} card(s) for ${groups.size} owner(s), ${fresh.length} new, ${stillOpen} still open`;
  if (opts.dryRun || !deps.handOff) return { posted: false, summary: `would hand ${counted} to the morning post` };
  await handOver({ shown, fresh: fresh.length, stillOpen, open: findings.length, confirmers: members });
  return { posted: false, summary: `handed ${counted} to the morning post` };
}

/** A later morning's hand-over: the week's cards that did not show yet. */
async function handOverWaiting(deps: TidyPostDeps, opts: { dryRun?: boolean }): Promise<TidyPostResult> {
  const waiting = await deps.waiting.read();
  if (!waiting?.shown.length) return { posted: false, summary: "no listing for this week" };
  const counted = `${waiting.shown.length} card(s) still waiting from the week`;
  if (opts.dryRun || !deps.handOff) return { posted: false, summary: `would hand ${counted} to the morning post` };
  await deps.handOff.put(deps.runDate, { channel: deps.channel, threadTs: null }, waiting);
  return { posted: false, summary: `handed ${counted} to the morning post` };
}

export interface TidySectionDeps {
  memory: Store<TidyMemory | null>;
  /** Where the week's cards that did not show wait for the next morning. */
  waiting: Store<TidyHanded | null>;
  /** Edit the morning's message in place. */
  edit(ts: string, message: ReportMessage): Promise<void>;
  reports: ReportStore;
  stage(proposal: PendingProposal): Promise<void>;
  /** Mark the message's thread, so the team's replies there are not all turns. */
  markThread(ts: string): Promise<void>;
}

/**
 * The week's tidy-up as a section of the sweep's morning message: a line for
 * the week, a bullet per owner (the files with no owner the Roadmap names
 * last), then a card per finding, sharing the carousel's ten. Each card shown
 * is its own proposal, answered in its Review pop-up with "Moved it" or
 * "Leave as is", and remembered; one that did not show, or did not stage,
 * waits for the next morning's message, until the next Monday's week
 * replaces it. The all-clear is a section of one line and no card.
 *
 * @param deps - The memory, the edit and the staging
 * @param handOff - The morning run's hand-off
 * @param date - The Monday
 */
export function tidySection(deps: TidySectionDeps, handOff: SectionHandOff<TidyHanded>, date: string): SweepSection {
  return handedSection<TidyHanded>({
    source: TIDY_SECTION,
    date,
    handOff,
    cardsOf(value) {
      if (value.allClear !== undefined) return { cards: [], lines: [allClearText(value.allClear)], cost: () => ({ subrequests: 2, d1Queries: 0 }), says: () => "" };
      return {
        cards: value.shown.map((s) => ({ person: s.finding.owner, item: tidyItem(s.finding, s.likely, s.ownerName) })),
        ttlMs: TIDY_CARD_TTL_MS,
        lines: [value.carriedFrom ? tidyCarriedParent(value.carriedFrom, value.shown.length) : tidyParent(date, value.fresh, value.stillOpen)],
        // The memory and the waiting cards, an edit when a card did not
        // stage, and each card that shows, a staging.
        cost: (shown) => ({ subrequests: 5, d1Queries: shown.length * 3 + 1 }),
        says: (ids, person) => ownerLine(person, ids.length, ids.length),
      };
    },
    async posted(value, place, shown, report, progress) {
      const memory = remembered(await deps.memory.read(), date);
      if (value.allClear !== undefined) {
        await deps.memory.write({ ...memory, open: 0 });
        return;
      }
      await deps.markThread(report.ts).catch((err: unknown) => rethrowIfBudget(err));
      const next: TidyMemory = { shown: { ...memory.shown }, open: value.carriedFrom ? memory.open : value.open };
      const failed: string[] = [];
      const rest: Shown[] = [];
      for (const s of value.shown) {
        const id = tidyItem(s.finding, s.likely).id;
        if (!shown.includes(id)) {
          rest.push(s);
          continue;
        }
        let staged = progress.done.get(id);
        if (staged === undefined) {
          try {
            await deps.stage(stagedFinding(place.channel, report.ts, s, value.confirmers));
            staged = true;
          } catch (err) {
            rethrowIfBudget(err);
            staged = false;
          }
          await progress.mark(id, staged);
        }
        if (staged) next.shown[s.finding.fingerprint] = date;
        else {
          failed.push(id);
          rest.push(s);
        }
      }
      await deps.memory.write(next);
      // What did not show, or did not stage, comes on the next morning's message.
      await deps.waiting.write(rest.length ? { ...value, shown: rest, carriedFrom: value.carriedFrom ?? date } : null);
      if (!failed.length) return;
      const marked = await markNotStaged(deps.reports, report.ts, failed, TIDY_NOT_STAGED).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      if (marked) await deps.edit(report.ts, marked).catch(rethrowIfBudget);
    },
    async notPosted(_value, _place, why) {
      // Nothing shown is remembered: next week's finds it new again.
      console.error(`[figma-tidy] the morning message did not carry the week (${why}) — it comes back next week`);
    },
  });
}

/**
 * One finding's card as ThreadState stages it: one item of the morning's
 * message.
 *
 * @param channel - Where the message posted
 * @param messageTs - The message: the thread
 * @param shown - The finding, and the likely card it names
 * @param confirmers - Who may answer it
 */
export function stagedFinding(channel: string, messageTs: string, shown: Shown, confirmers: readonly string[]): PendingProposal {
  const card = tidyCard(shown.finding, shown.likely);
  const operations = card.operations;
  return {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel,
    threadTs: messageTs,
    replyTs: messageTs,
    ...itemProposal(messageTs, tidyItem(shown.finding, shown.likely).id),
    proposalText: renderProposalCard(card).text,
    requesterUserId: "",
    ttlMs: TIDY_CARD_TTL_MS,
    confirmers: [...confirmers],
    stated: tidyCardWords(TIDY_CARD_TTL_MS / 3_600_000),
    refuseRevision: TIDY_REVISION_REFUSAL,
    choices: tidyChoices(),
    facts: tidyFacts(shown.finding, shown.likely),
  };
}

/**
 * "Leave as is" on a card: its file and check stay quiet until the file's
 * title cards change. The body of the card's one operation (`TIDY_TOOL`).
 *
 * @param skips - Where items left as is are kept
 * @param input - The operation's input: `file_key`, `check` and `cards`
 * @returns The executor's JSON result
 */
export async function leaveAsIs(skips: Store<TidySkips | null>, input: Record<string, unknown>): Promise<string> {
  const { file_key: fileKey, check, cards } = input;
  if (typeof fileKey !== "string" || typeof check !== "string" || typeof cards !== "string") {
    return JSON.stringify({ ok: false, error: "a tidy-up item needs file_key, check and cards" });
  }
  const kept = (await skips.read()) ?? {};
  await skips.write({ ...kept, [skipKeyOf(fileKey, check as TidyCheck)]: cards });
  return JSON.stringify({ ok: true });
}

/**
 * The findings not left as is, and the skips to keep when any were dropped:
 * a skip whose file's title cards have changed since is forgotten, and its
 * item is open again.
 */
function withoutSkipped(
  findings: TidyFinding[],
  files: readonly TidyFile[],
  kept: TidySkips | null,
): { findings: TidyFinding[]; skips: TidySkips | null } {
  if (!kept) return { findings, skips: null };
  const skips = { ...kept };
  let dropped = false;
  for (const file of files) {
    for (const [key, cards] of Object.entries(skips)) {
      if (key.startsWith(`${file.key}|`) && cards !== cardKey(file.name)) {
        delete skips[key];
        dropped = true;
      }
    }
  }
  return {
    findings: findings.filter((f) => skips[skipKeyOf(f.file.key, f.check)] === undefined),
    skips: dropped ? skips : null,
  };
}

/** The memory, with fingerprints past five weeks forgotten. */
function remembered(memory: TidyMemory | null, runDate: string): TidyMemory {
  const today = Date.parse(`${runDate}T00:00:00Z`);
  const shown: Record<string, string> = {};
  for (const [fp, on] of Object.entries(memory?.shown ?? {})) {
    if (today - Date.parse(`${on}T00:00:00Z`) < MEMORY_MS) shown[fp] = on;
  }
  return { shown, open: memory?.open ?? 0 };
}

/** Findings by owner, in the order owners first appear; the unassigned last. */
function byOwner(findings: readonly TidyFinding[]): Map<string | null, TidyFinding[]> {
  const groups = new Map<string | null, TidyFinding[]>();
  for (const f of findings) {
    if (f.owner === null) continue;
    groups.set(f.owner, [...(groups.get(f.owner) ?? []), f]);
  }
  const none = findings.filter((f) => f.owner === null);
  if (none.length) groups.set(null, none);
  return groups;
}
