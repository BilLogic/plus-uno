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
//   • the POST — `figma-tidy-post`, after the reads: the cards the titles name,
//     read from the Roadmap in one query; the checks (`./checks.ts`); then the
//     week's report on the shared decision card (`slack/decision-cards.ts`):
//     a parent line in the channel, and in its thread one combined reply: a
//     bullet per owner, mentioning them once, with their count and how many
//     wait for next week, the files with no owner the Roadmap names last;
//     then one carousel of at most ten cards (Slack's limit), grouped by
//     owner in bullet order. Past ten, the cards are filled round-robin, so
//     every owner has one before anyone has a second. Each card is its own
//     proposal, answered in its Review pop-up with "Moved it" or "Leave as
//     is"; neither writes to Figma (`./copy.ts`).
//
// WHAT THE WEEKS REMEMBER. Every card shown is remembered by its fingerprint
// (file, check and card) for five weeks. A later week shows only what is new,
// and counts what is still open; an item held back past the ten is not
// remembered, so it is new the next week. A week with nothing new posts
// nothing; the first week with nothing open at all, after a week that had
// some, posts one all-clear and then goes quiet.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   read: one call a listing, three with retries; ~30 for five teams. Then
//         one or two page reads a file (`PAGES_COST` with retries) until
//         the job's budget is nearly spent.
//   post: the Roadmap (one query per 100 cards) + a likely card for each
//         unknown one shown (at most `LIKELY_LOOKUPS`) + members (at most 3
//         pages) + the parent and its one reply. The report record and
//         stagings are Durable Object hops; the listing and memory are KV.
//
// PURE: `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import { FigmaRequestError, type FigmaClient } from "../figma/client";
import type { FigmaTeam } from "../figma-notify/teams";
import type { PendingProposal, ThreadState } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import {
  decisionReport,
  itemProposal,
  markNotStaged,
  MAX_REPORT_ITEMS,
  reportRecord,
  type ReportMessage,
  type ReportStore,
} from "../slack/decision-cards";
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
  tidyItem,
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
  /** Post top level, or in a thread. */
  post(message: ReportMessage, threadTs?: string): Promise<{ ok: boolean; ts?: string }>;
  /** Edit a posted message in place. */
  edit(ts: string, message: ReportMessage): Promise<void>;
  reports: ReportStore & Pick<ThreadState, "putReport">;
  stage(proposal: PendingProposal): Promise<void>;
  /** Mark the parent's thread, so the team's replies there are not all turns. */
  markThread(ts: string): Promise<void>;
  channel: string;
  /** The Monday, `YYYY-MM-DD`. */
  runDate: string;
  now(): number;
}

export interface TidyPostResult {
  posted: boolean;
  summary: string;
}

/** A finding as the week's reply carries it. */
interface Shown {
  finding: TidyFinding;
  likely: TidyCard | null;
}

/**
 * The week's post.
 *
 * @param deps - The listing, the memory, the Roadmap, the channel and the store
 * @param opts - `dryRun` reads and drafts, and posts, stages and writes nothing
 */
export async function runTidyPost(deps: TidyPostDeps, opts: { dryRun?: boolean } = {}): Promise<TidyPostResult> {
  const listing = await deps.listing.read();
  if (!listing || listing.runDate !== deps.runDate) return { posted: false, summary: "no listing for this week" };
  if (listing.tasks.length) return { posted: false, summary: `the listing stopped short (${listing.tasks.length} left) — no report this week` };

  const refs = Object.fromEntries(Object.entries((await deps.refs.read()) ?? {}).map(([key, r]) => [key, r.cards]));
  const numbers = cardsNamed(listing.files, listing.folders, refs);
  const cards = numbers.length ? await deps.roadmap.cards(numbers) : [];
  const { findings, skips } = withoutSkipped(tidyFindings(listing.files, listing.folders, cards, refs), listing.files, await deps.skips.read());
  if (skips && !opts.dryRun) await deps.skips.write(skips);

  const memory = remembered(await deps.memory.read(), deps.runDate);
  const fresh = findings.filter((f) => !memory.shown[f.fingerprint]);
  const stillOpen = findings.length - fresh.length;
  const keep = async (m: TidyMemory) => {
    if (!opts.dryRun) await deps.memory.write(m);
  };

  if (!fresh.length) {
    if (!findings.length && memory.open > 0) {
      if (opts.dryRun) return { posted: false, summary: "would post the all-clear" };
      const text = allClearText(memory.open);
      const sent = await deps.post({ text, blocks: [{ type: "section", text: { type: "mrkdwn", text } }] });
      if (!sent.ok) return { posted: false, summary: "the all-clear did not post" };
      await keep({ ...memory, open: 0 });
      return { posted: true, summary: "all clear" };
    }
    await keep({ ...memory, open: findings.length });
    return { posted: false, summary: findings.length ? `nothing new; ${findings.length} still open` : "nothing to tidy" };
  }

  const members = await deps.members();
  if (!members) return { posted: false, summary: "the channel's members unread — no report this week" };

  const groups = byOwner(fresh);
  const picked = roundRobin(groups, MAX_REPORT_ITEMS);
  let lookups = 0;
  const shown: Shown[] = [];
  for (const finding of [...picked.values()].flat()) {
    let likely: TidyCard | null = null;
    if (finding.check === "unknown-card" && lookups < LIKELY_LOOKUPS) {
      lookups += 1;
      likely = await deps.roadmap.likely(projectOf(finding.file.name)).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
    }
    shown.push({ finding, likely });
  }
  if (opts.dryRun) return { posted: false, summary: `would post ${shown.length} card(s) for ${groups.size} owner(s), ${fresh.length} new, ${stillOpen} still open` };

  const parentText = tidyParent(deps.runDate, fresh.length, stillOpen);
  const parent = await deps.post({ text: parentText, blocks: [{ type: "section", text: { type: "mrkdwn", text: parentText } }] });
  if (!parent.ok || !parent.ts) return { posted: false, summary: "the parent line did not post" };
  const parentTs = parent.ts;
  await deps.markThread(parentTs).catch((err: unknown) => rethrowIfBudget(err));

  const next: TidyMemory = { shown: { ...memory.shown }, open: findings.length };
  // Each owner's name, from the Roadmap cards read above: what a DM says in place of a tag.
  const names = new Map(cards.flatMap((c) => (c.owner && c.ownerName ? [[c.owner, c.ownerName] as const] : [])));
  const report = decisionReport(
    shown.map((s) => tidyItem(s.finding, s.likely, s.finding.owner ? names.get(s.finding.owner) : undefined)),
    "",
    {
      channel: deps.channel,
      ownerLines: [...groups].map(([owner, items]) => ({
        owner: owner ? { slack: owner, ...(names.has(owner) ? { name: names.get(owner)! } : {}) } : null,
        says: ownerLine(owner, items.length, picked.get(owner)!.length),
      })),
    },
  );
  const sent = await deps.post({ text: report.text, blocks: report.blocks }, parentTs);
  if (!sent.ok || !sent.ts) {
    await keep(next);
    return { posted: true, summary: `the parent posted and its reply did not; ${fresh.length} new come back next week` };
  }
  const ts = sent.ts;
  const recorded = await deps.reports.putReport(reportRecord(deps.channel, ts, report, TIDY_CARD_TTL_MS)).then(
    () => true,
    () => false,
  );
  let staged = 0;
  const failed: string[] = [];
  for (const s of shown) {
    try {
      if (!recorded) throw new Error("no report record");
      await deps.stage(stagedFinding(deps.channel, parentTs, ts, s, members));
      next.shown[s.finding.fingerprint] = deps.runDate;
      staged += 1;
    } catch (err) {
      rethrowIfBudget(err);
      failed.push(tidyItem(s.finding, s.likely).id);
    }
  }
  if (failed.length) {
    const marked = recorded ? await markNotStaged(deps.reports, ts, failed, TIDY_NOT_STAGED).catch(() => null) : null;
    if (marked) await deps.edit(ts, marked).catch(() => {});
  }
  await keep(next);
  return { posted: true, summary: `posted ${staged} card(s) for ${groups.size} owner(s); ${fresh.length} new, ${stillOpen} still open` };
}

/**
 * One finding's card as ThreadState stages it: one item of the week's reply.
 *
 * @param channel - Where the report posted
 * @param parentTs - The parent line: the thread
 * @param replyTs - The week's reply
 * @param shown - The finding, and the likely card it names
 * @param confirmers - Who may answer it
 */
export function stagedFinding(channel: string, parentTs: string, replyTs: string, shown: Shown, confirmers: readonly string[]): PendingProposal {
  const card = tidyCard(shown.finding, shown.likely);
  const operations = card.operations;
  return {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel,
    threadTs: parentTs,
    replyTs: parentTs,
    ...itemProposal(replyTs, tidyItem(shown.finding, shown.likely).id),
    proposalText: renderProposalCard(card).text,
    requesterUserId: "",
    ttlMs: TIDY_CARD_TTL_MS,
    confirmers: [...confirmers],
    stated: tidyCardWords(TIDY_CARD_TTL_MS / 3_600_000),
    refuseRevision: TIDY_REVISION_REFUSAL,
    choices: tidyChoices(),
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

/**
 * At most `max` of the groups' items, a round at a time in the groups' order,
 * so every owner has a card before anyone has a second; kept by group.
 */
function roundRobin<K, T>(groups: ReadonlyMap<K, readonly T[]>, max: number): Map<K, T[]> {
  const picked = new Map<K, T[]>([...groups.keys()].map((k) => [k, []]));
  let left = max;
  for (let round = 0; left > 0; round += 1) {
    let any = false;
    for (const [key, items] of groups) {
      if (left === 0 || round >= items.length) continue;
      picked.get(key)!.push(items[round]!);
      left -= 1;
      any = true;
    }
    if (!any) break;
  }
  return picked;
}
