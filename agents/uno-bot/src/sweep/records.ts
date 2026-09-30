// Capture from the records the team keeps: running notes and Roadmap cards
// (C4). A running note, or a card's comments and body edits, records a
// decision a page still states the old way; the sweep drafts the in-place fix
// and queues it for the morning, like a thread's drift.
//
// TWO END-OF-DAY JOBS, one per source, each with its own cursor in
// `sweep_cursors` (the key names the source; the value is Notion's
// `last_edited_time`, ISO-8601, then `|` the ids of the rows already handled
// at that time, then `|` the Notion query cursor of the page being worked
// through at that time — `readCursor`):
//
//   `sweep-notes` reads the Design Running Notes rows edited since its cursor,
//   oldest edit first. The record is each note's blocks edited since then.
//   `sweep-cards` reads the Roadmap cards edited since its cursor. The record
//   is each card's comments made since then and its body blocks edited since
//   then; the card itself is among the pages its fix may rewrite, never at the
//   blocks that record the decision.
//
// THE CURSOR'S EDGE. Notion rounds `last_edited_time` to the minute, so rows
// edited in the cursor's own minute are read again (`on_or_after`) and the
// ones already handled are passed over by id. When a whole query page is rows
// already handled, the next page is read, up to `QUERY_PAGES` a job, and the
// page reached is kept in the cursor, so the next night starts there rather
// than at the minute's first page: however many rows share one minute, each
// night moves on.
//
// PRIVACY. Only team-visible consensus notes are read (`isTeamNote`,
// `./surfaces.ts`): a row whose own parent is the running-notes database, whose
// `Note Type`, title and other select values do not mark it a 1:1. Every page
// a record leads to is read through the same guard (`readUsable`), so a 1:1 it
// links or a search finds is never a source either. The note's text reaches
// the card only as the detector's one-sentence summary and a link to the
// block, in a team channel whose members could read the note already.
//
// WHERE IT GOES. A record has no Slack thread, so `pickDestination` sends its
// finding by its target: #plus-universal for a design-system target (a
// Universal-pillar card), #plus-design for anything else. The owner is the
// target card's Contributor, then the record's own people (a note's Note
// Takers, a card's Contributors); a finding with nobody to name is left.
// Everything after the queue — the morning post, one card per destination per
// day, confirmers, the 72 h expiry — is the sweep's own (`./run.ts`).
//
// Discussion, an option, a question or a to-do records no decision, and the
// detector passes it over (`./capture-detector.ts`); there is no "note with no
// decision" check.
//
// ONE ITEM PER DECISION AND PAGE. A finding's id is the earliest record entry
// it cites (a note block, or `comment:<id>`) and the page it fixes, never the
// block the model picked: a job retried after a stop between queueing and
// saving the cursor queues the same decision once, and a later decision on the
// same card about the same page — a new comment — is an item of its own.
//
// THE BUDGET. One edited-since read per job (up to `QUERY_PAGES` when the
// cursor's minute is crowded), then per record: the page read,
// its comments (cards), up to `MAX_SOURCES_PER_THREAD` target reads and
// `MAX_SEARCHES_PER_UNIT` searches, one model call. The cursor is saved after
// each record, so a budget stop keeps what is done and the runner retries the
// job on a fresh budget. A record that fails is held, and skipped after
// `MAX_FAILED_NIGHTS`, as a thread is.
//
// PURE: every dependency is injected (`SweepDeps`); `./env.ts` binds them.

import { isSubrequestBudgetError, rethrowIfBudget } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import type { RecordEntry, SweepRecord } from "./capture-detector";
import { classifyLink, type SweepSource, type TargetKind } from "./finding";
import { postableAt } from "./schedule";
import { findBySearch, namedThings } from "./search";
import { isTeamNote, readUsable, searchGate } from "./surfaces";
import type { PendingFinding, SweepRunOutcome } from "./store";
import {
  contributorsOf,
  FIRST_SWEEP_WINDOW_MS,
  MAX_FAILED_NIGHTS,
  MAX_SOURCES_PER_THREAD,
  plannedCards,
  readMeter,
  recordRun,
  type SweepCardReport,
  type SweepDeps,
  type SweepJobReport,
} from "./run";

/** A database row edited since the cursor, as the edited-since read returns it. */
export interface EditedRecordRow {
  /** Dashes removed. */
  id: string;
  url: string;
  title: string;
  lastEditedTime: string;
  /** The database Notion says the row belongs to, dashes removed. */
  parentDatabaseId: string | null;
  /** Select, multi-select and status values by property name. */
  properties: Record<string, string>;
  /** People-typed properties → names. */
  people: Record<string, string[]>;
}

/** One comment on a card. */
export interface RecordComment {
  id: string;
  createdTime: string;
  text: string;
  links: string[];
  byBot: boolean;
}

/** The Notion reads the two jobs need, with the bot's integration. */
export interface SweepNotion {
  /** Rows of a database edited at or after `since`, oldest edit first; one
   *  read of one query page, continued from `after` when given. */
  edited(
    databaseId: string,
    since: string,
    after?: string,
  ): Promise<{ rows: EditedRecordRow[]; more: boolean; next: string | null }>;
  /** A page's open comments. */
  comments(pageId: string): Promise<RecordComment[]>;
}

/** Which source a job reads, and what it keeps its place and queue under. */
const SOURCES = {
  note: { cursor: "notion:running-notes", queue: "notes", people: "Note Takers" },
  card: { cursor: "notion:roadmap-cards", queue: "cards", people: "Contributor" },
} as const;

export { isTeamNote } from "./surfaces";

/** Query pages read per job, the further ones only while every row on the
 *  page before was already handled at the cursor's minute. */
export const QUERY_PAGES = 3;

/** Row ids kept at the cursor's minute; past this the oldest drop off. */
const EDGE_IDS = 200;

/** Where a job left off: the last edit time it reached, the rows it handled
 *  at that time, and the query page it was working through there. A bare
 *  time (no `|`) reads as none handled, from the first page. */
export function readCursor(value: string): { time: string; handled: string[]; page?: string } {
  const [time, ids, page] = value.split("|");
  return { time: time!, handled: ids ? ids.split(",").filter(Boolean) : [], ...(page ? { page } : {}) };
}

/** The cursor's stored value. */
export function writeCursor(time: string, handled: readonly string[], page?: string): string {
  if (!handled.length && !page) return time;
  return `${time}|${handled.slice(-EDGE_IDS).join(",")}${page ? `|${page}` : ""}`;
}

/**
 * One notes or cards job's end of day.
 *
 * @param job - A `sweep-notes` or `sweep-cards` job
 * @param deps - The sweep's dependencies, with `notion` and `capture` bound
 * @throws A budget stop, after saving what was done
 */
export async function sweepRecords(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const kind = job.kind === "sweep-notes" ? "note" : "card";
  const source = SOURCES[kind];
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const base = { kind: job.kind as "sweep-notes" | "sweep-cards", key: job.key };
  const finish = async (
    outcome: SweepRunOutcome,
    note: string | null,
    records: number,
    findings: PendingFinding[],
    cards: SweepCardReport[] = [],
  ): Promise<SweepJobReport> => {
    await recordRun(deps, {
      runName: "end-of-day",
      jobKey: job.key,
      channels: [],
      threads: records,
      items: findings.length,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const counted = `${records} ${kind === "note" ? "note(s)" : "card(s)"} read, ${findings.length} finding(s) kept for the morning`;
    const summary = outcome === "handled" && note ? `${counted} — ${note}` : (note ?? counted);
    return { ...base, outcome, note, threads: records, findings, cards, summary };
  };

  const db = kind === "note" ? deps.config.runningNotesDb : deps.config.roadmapDb;
  if (!deps.notion || !deps.capture) return finish("skipped", "the Notion reads or the detector are not wired", 0, []);
  if (!db) return finish("skipped", `no ${kind === "note" ? "running-notes" : "Roadmap"} database is configured`, 0, []);

  const now = deps.now();
  const runDate = new Date(now).toISOString().slice(0, 10);
  const start = readCursor(
    (await deps.store.cursor(source.cursor)) ?? new Date(now - FIRST_SWEEP_WINDOW_MS).toISOString(),
  );
  const cursor = start.time;
  const kept: PendingFinding[] = [];
  const notes: string[] = [];
  const resolved = new Map<string, string | null>();
  let read = 0;
  let reached = cursor;
  let handled = [...start.handled];
  const seen = new Set(start.handled);
  // The query page being worked through at the cursor's minute: where a later
  // night picks up. It belongs to this cursor's query alone.
  let after = start.page;
  const save = async (page?: string) => {
    if (!deps.dryRun) await deps.store.saveCursor(source.cursor, writeCursor(reached, handled, page), deps.now());
  };

  try {
    let rows: EditedRecordRow[] = [];
    // The cursor's own minute is read again; a page holding only rows already
    // handled there is passed over for the next, and the page reached is kept.
    for (let page = 0; page < QUERY_PAGES; page++) {
      let got: Awaited<ReturnType<SweepNotion["edited"]>>;
      try {
        got = await deps.notion.edited(db, cursor, after);
      } catch (err) {
        // A kept page Notion no longer honours starts the minute over; the
        // handled ids still keep anything from being read twice.
        rethrowIfBudget(err);
        if (!after || page > 0) throw err;
        after = undefined;
        got = await deps.notion.edited(db, cursor);
      }
      rows = got.rows.filter((row) => !(row.lastEditedTime === cursor && seen.has(row.id)));
      if (rows.length || !got.more || !got.next) {
        if (got.more) notes.push(`more rows were edited than one read holds; the rest wait for the next run`);
        break;
      }
      after = got.next;
      await save(after);
    }
    const failing = new Set(rows.length && !deps.dryRun ? await deps.store.failingThreads(source.cursor) : []);
    for (const row of rows) {
      const allowed = kind === "note" ? isTeamNote(row, db) : row.parentDatabaseId === bare(db);
      if (allowed) {
        const found = await sweepRecord(deps, { kind, row, since: cursor, runDate, now, resolved });
        if (!found.ok) {
          if (found.counts && !deps.dryRun) {
            const nights = await deps.store.recordThreadFailure(source.cursor, row.id, runDate);
            if (nights >= MAX_FAILED_NIGHTS) {
              await deps.store.clearThreadFailure(source.cursor, row.id);
              notes.push(`${kind} ${row.id} skipped after ${nights} failed nights (${found.error})`);
            } else {
              return finish("handled", `stopped at ${reached}: ${found.error}`, read, kept);
            }
          } else {
            return finish("handled", `stopped at ${reached}: ${found.error}`, read, kept);
          }
        } else {
          read += 1;
          kept.push(...found.findings);
          if (found.unowned) notes.push(`${found.unowned} finding(s) in ${kind} ${row.id} had nobody to name as owner`);
          if (!deps.dryRun && found.findings.length) await deps.store.addFindings(found.findings);
          if (failing.has(row.id) && !deps.dryRun) await deps.store.clearThreadFailure(source.cursor, row.id);
        }
      }
      if (row.lastEditedTime >= reached) {
        // A new minute is a new query: the page kept for the old one goes.
        if (row.lastEditedTime > reached) after = undefined;
        handled = row.lastEditedTime > reached ? [row.id] : [...handled, row.id];
        reached = row.lastEditedTime;
        await save(after);
      }
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      await finish("deferred", `budget stopped it after ${reached}; retried under ${job.key}`, read, kept).catch(() => undefined);
    }
    throw err;
  }

  const cards = deps.dryRun ? plannedCards(deps, kept, new Date(postableAt(now)).toISOString().slice(0, 10)) : [];
  return finish("handled", notes.length ? notes.join("; ") : null, read, kept, cards);
}

/** One note or card: its record, the pages it is about, the decisions it records. */
async function sweepRecord(
  deps: SweepDeps,
  r: {
    kind: "note" | "card";
    row: EditedRecordRow;
    since: string;
    runDate: string;
    now: number;
    resolved: Map<string, string | null>;
  },
): Promise<{ ok: true; findings: PendingFinding[]; unowned: number } | { ok: false; error: string; counts: boolean }> {
  const none = { ok: true as const, findings: [], unowned: 0 };
  const { kind, row, since } = r;
  const source = SOURCES[kind];
  const failure = (what: string, err: unknown) => {
    rethrowIfBudget(err);
    const why = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: `${what} (${why})`, counts: !QUOTA.test(why) };
  };

  let page: SweepSource | null;
  let comments: RecordComment[] = [];
  try {
    page = await readUsable(deps.sources, deps.config, row.url, "notion");
    if (page && kind === "card") comments = await deps.notion!.comments(row.id);
  } catch (err) {
    return failure(`the ${kind} could not be read`, err);
  }
  if (!page) return none;

  // What the record says since the cursor — its own minute included, since
  // Notion rounds to it — never uno-bot's own edits.
  const blocks = page.blocks.filter((b) => b.lastEditedTime >= since && !b.byBot && b.text.trim());
  const said = comments.filter((c) => c.createdTime >= since && !c.byBot && c.text.trim());
  const entries: RecordEntry[] = [
    ...said.map((c) => ({ id: `comment:${c.id}`, text: c.text })),
    ...blocks.map((b) => ({ id: b.id, text: b.text })),
  ];
  if (!entries.length) return none;
  const when = new Map<string, number>([
    ...said.map((c) => [`comment:${c.id}`, Date.parse(c.createdTime)] as const),
    ...blocks.map((b) => [b.id, Date.parse(b.lastEditedTime)] as const),
  ]);
  // A team note's new entries also go to card to-dos, which ask its takers.
  if (kind === "note" && deps.onNote) {
    const takers = await contributorsOf(deps, row.people[source.people] ?? [], r.resolved);
    await deps.onNote({
      pageId: pageIdOf(row.url),
      url: row.url,
      entries: entries.map((e) => ({ id: e.id, text: e.text, at: when.get(e.id) ?? r.now })),
      takers,
    });
  }

  // The pages it is about: the card itself, then what it links, then what it
  // names without linking.
  const own = pageIdOf(row.url);
  const linked = [...new Set([...said.flatMap((c) => c.links), ...blocks.flatMap((b) => b.links ?? [])])]
    .map((url) => ({ url, kind: classifyLink(url, deps.config.figmaLibraryKey) }))
    .filter((l): l is { url: string; kind: TargetKind } => l.kind !== null && pageIdOf(l.url) !== own);
  const sources: SweepSource[] = kind === "card" ? [page] : [];
  try {
    for (const link of [...linked.filter((l) => l.kind === "notion"), ...linked.filter((l) => l.kind !== "notion")]) {
      if (sources.length >= MAX_SOURCES_PER_THREAD) break;
      const read = await readUsable(deps.sources, deps.config, link.url, link.kind);
      if (read) sources.push(read);
    }
  } catch (err) {
    return failure("a page it links could not be read", err);
  }
  // A page it names without a link: from the team's surfaces only, and a
  // search or read that fails is no hit (`./search.ts`).
  if (deps.search && sources.length < MAX_SOURCES_PER_THREAD) {
    const known = new Set([row.url, ...linked.map((l) => l.url)]);
    const hits = await findBySearch(deps.search, namedThings(entries.map((e) => e.text)), known, searchGate(deps.config));
    for (const hit of hits) {
      if (sources.length >= MAX_SOURCES_PER_THREAD || pageIdOf(hit.url) === own) continue;
      const read = await readUsable(deps.sources, deps.config, hit.url, hit.kind, true).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      if (read) sources.push(read);
    }
  }
  if (!sources.some((s) => s.writable)) return none;

  const record: SweepRecord = { kind, url: row.url, title: row.title, entries };
  const detected = await deps.capture!.record({ record, sources });
  if (!detected.ok) return { ok: false, error: `the detector did not answer (${detected.error})`, counts: !QUOTA.test(detected.error) };

  // The record's own people, as Slack ids: confirmers, and the owner when the
  // target names no Contributor.
  const people = await contributorsOf(deps, row.people[source.people] ?? (kind === "card" ? page.contributors : []), r.resolved);
  const findings: PendingFinding[] = [];
  let unowned = 0;
  for (const d of detected.findings) {
    const contributors = await contributorsOf(deps, d.source.contributors, r.resolved);
    const owner = contributors[0] ?? people[0];
    if (!owner) {
      unowned += 1;
      continue;
    }
    // Keyed by the decision — its earliest cited entry — and the page it
    // fixes, not the block the model chose: a retry queues it once, and a
    // later decision about the same page is its own item.
    const [first] = [...d.evidenceIds].sort((a, b) => (when.get(a) ?? 0) - (when.get(b) ?? 0) || a.localeCompare(b));
    findings.push({
      id: `${source.queue}:${first ?? d.blockId}:${pageIdOf(d.source.url)}`,
      runDate: r.runDate,
      detectedAt: r.now,
      driftAt: Math.min(...d.evidenceIds.map((id) => when.get(id) ?? r.now)),
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
      threadSays: d.recordSays,
      replacement: d.replacement,
      evidence: {
        channel: source.queue,
        channelKind: "public",
        threadTs: null,
        messageTs: [],
        permalinks: [],
        record: { kind, url: row.url, title: row.title, entryIds: d.evidenceIds },
      },
      owner,
      confidence: d.confidence,
      participants: [...new Set([owner, ...contributors, ...people])],
    });
  }
  return { ok: true, findings, unowned };
}

/** A stop that is a quota's, not the record's: held, never counted. */
const QUOTA = /\b429\b|quota|rate.?limit|resource.?exhausted/i;

/** A Notion page's 32-hex id from its URL, or the URL when it has none. */
function pageIdOf(url: string): string {
  const m = /([0-9a-f]{32})(?:[?#].*)?$/i.exec(url.replace(/-/g, ""));
  return m ? m[1]!.toLowerCase() : url;
}

function bare(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}
