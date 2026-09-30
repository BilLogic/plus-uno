// Capture from the records the team keeps: running notes and Roadmap cards
// (C4). A running note, or a card's comments and body edits, records a
// decision a page still states the old way; the sweep drafts the in-place fix
// and queues it for the morning, like a thread's drift.
//
// TWO END-OF-DAY JOBS, one per source, each with its own cursor in
// `sweep_cursors` (the key names the source, the value is Notion's
// `last_edited_time`, ISO-8601):
//
//   `sweep-notes` reads the Design Running Notes rows edited since its cursor,
//   oldest edit first. The record is each note's blocks edited since then.
//   `sweep-cards` reads the Roadmap cards edited since its cursor. The record
//   is each card's comments made since then and its body blocks edited since
//   then; the card itself is among the pages its fix may rewrite, never at the
//   blocks that record the decision.
//
// PRIVACY. Only team-visible consensus notes are read (`isTeamNote`): a row
// whose own parent is the running-notes database, whose title and properties
// do not mark it a 1:1. A page found anywhere else — a search hit, a page in
// someone's private space — is never read as a note. The note's text reaches
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
// THE BUDGET. One edited-since read per job, then per record: the page read,
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
  /** Rows of a database edited after `since`, oldest edit first; one read. */
  edited(databaseId: string, since: string): Promise<{ rows: EditedRecordRow[]; more: boolean }>;
  /** A page's open comments. */
  comments(pageId: string): Promise<RecordComment[]>;
}

/** Which source a job reads, and what it keeps its place and queue under. */
const SOURCES = {
  note: { cursor: "notion:running-notes", queue: "notes", people: "Note Takers" },
  card: { cursor: "notion:roadmap-cards", queue: "cards", people: "Contributor" },
} as const;

/** What marks a running note as a 1:1 rather than a team note. */
const ONE_ON_ONE = /\b1\s*[:/–-]\s*1\b|\b1[\s-]*on[\s-]*1\b|\bone[\s-]*on[\s-]*one\b/i;

/**
 * Whether a running-notes row is a team-visible consensus note — the only kind
 * the sweep reads: its own parent is the running-notes database, and neither
 * its title nor any of its select values marks it a 1:1.
 *
 * @param row - The row as the edited-since read returned it
 * @param notesDb - `NOTION_RUNNING_NOTES_DB_ID`
 */
export function isTeamNote(row: Pick<EditedRecordRow, "parentDatabaseId" | "title" | "properties">, notesDb: string): boolean {
  if (!row.parentDatabaseId || row.parentDatabaseId !== bare(notesDb)) return false;
  return !ONE_ON_ONE.test(row.title) && !Object.values(row.properties).some((v) => ONE_ON_ONE.test(v));
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
  const cursor = (await deps.store.cursor(source.cursor)) ?? new Date(now - FIRST_SWEEP_WINDOW_MS).toISOString();
  const kept: PendingFinding[] = [];
  const notes: string[] = [];
  const resolved = new Map<string, string | null>();
  let read = 0;
  let reached = cursor;

  try {
    const { rows, more } = await deps.notion.edited(db, cursor);
    if (more) notes.push(`more rows were edited than one read holds; the rest wait for the next run`);
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
      if (row.lastEditedTime > reached) {
        if (!deps.dryRun) await deps.store.saveCursor(source.cursor, row.lastEditedTime, deps.now());
        reached = row.lastEditedTime;
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
    page = await deps.sources.read(row.url, "notion");
    if (page && kind === "card") comments = await deps.notion!.comments(row.id);
  } catch (err) {
    return failure(`the ${kind} could not be read`, err);
  }
  if (!page) return none;

  // What the record says since the cursor — never uno-bot's own edits.
  const blocks = page.blocks.filter((b) => b.lastEditedTime > since && !b.byBot && b.text.trim());
  const said = comments.filter((c) => c.createdTime > since && !c.byBot && c.text.trim());
  const entries: RecordEntry[] = [
    ...said.map((c) => ({ id: `comment:${c.id}`, text: c.text })),
    ...blocks.map((b) => ({ id: b.id, text: b.text })),
  ];
  if (!entries.length) return none;
  const when = new Map<string, number>([
    ...said.map((c) => [`comment:${c.id}`, Date.parse(c.createdTime)] as const),
    ...blocks.map((b) => [b.id, Date.parse(b.lastEditedTime)] as const),
  ]);

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
      const read = await deps.sources.read(link.url, link.kind);
      if (read) sources.push(read);
    }
    if (deps.search && sources.length < MAX_SOURCES_PER_THREAD) {
      const known = new Set([row.url, ...linked.map((l) => l.url)]);
      for (const hit of await findBySearch(deps.search, namedThings(entries.map((e) => e.text)), known)) {
        if (sources.length >= MAX_SOURCES_PER_THREAD || pageIdOf(hit.url) === own) continue;
        const read = await deps.sources.read(hit.url, hit.kind);
        if (read) sources.push({ ...read, foundBy: "search" });
      }
    }
  } catch (err) {
    return failure("a page it names could not be read", err);
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
    findings.push({
      id: `${source.queue}:${row.id}:${d.blockId}`,
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
