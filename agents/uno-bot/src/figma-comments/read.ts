// `sweep-figma-comments` — the night's read of Figma comment decisions, a
// sweep source (#900, Seam 2).
//
// SWITCH-ON. The first run reads nothing: it records the watermark, and only
// comments created or resolved after it are ever read (`./threads.ts`).
//
// THE WINDOW is (from, until]: from the last finished read's end to this run's
// start, kept with the watermark in the sweep's cursor table under
// `figma:comments` (`<watermark>|<from>|<until>|<files done>`, ISO times).
// `until` is set while a read is under way, so a budget stop resumes the same
// window and skips the files done; a finished read clears it. A window past
// the seven days the KV notes outlast is cut to the last seven, and the run
// says so.
//
// WHICH FILES. The notification route's notes (`../figma-notify/event.ts`):
// every file with a `commented:<ET date>:` note on a date the window touches,
// and every file whose `changed:` note falls in the window — a resolution
// sends no notification, but the edit that usually comes with it does, and
// the nightly backstop moves the note for one that was missed. MISC's files
// are left out (#891), listed through Figma at most weekly.
//
// PER FILE:
//   1. its comments (Tier 2); the threads with activity in the window that
//      were never carded;
//   2. its pages to depth 2 (Tier 1), and a read for the ids that sit deeper;
//      only threads pinned under 📐 Specs or 🔍 For Review stay (`./sections.ts`);
//   3. its cards, from `Card <n>` in its title (`./title.ts`): each card's page,
//      and its PRD subpage — else the card page — as the PRD; the owner is the
//      first card's first Contributor who is a Slack person, the confirmers
//      every card's Contributors. A file with no card names its creator (`/meta`) and can
//      route a decision only to an intake;
//   4. one model call (`./detector.ts`), and each decision drafted
//      (`./draft.ts`) and queued for the morning (`./queue.ts`).
// A file with no thread in its window costs one call.
//
// THE BUDGET. The cursor's files-done list moves after each file, so a budget
// stop keeps every file done: the run is recorded as deferred and the stop
// thrown, and the runner retries the job on a fresh budget. A file that fails
// is held, and skipped after `MAX_FAILED_NIGHTS`, as a sweep thread is.
//
// PURE: every dependency arrives through `SweepDeps.figmaComments`.

import { isSubrequestBudgetError, rethrowIfBudget } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import { CHANGED_PREFIX, COMMENTED_PREFIX, etDateOf } from "../figma-notify/event";
import { readUsable } from "../sweep/surfaces";
import type { SweepSource } from "../sweep/finding";
import type { SweepRunOutcome } from "../sweep/store";
import { contributorsOf, MAX_FAILED_NIGHTS, readMeter, recordRun, type SweepDeps, type SweepJobReport } from "../sweep/run";
import { candidateThreads, type CommentThread, type ReadWindow } from "./threads";
import { DECISION_SECTIONS, pageOf, pagesOf, type FilePage, type NodePlace } from "./sections";
import { cardNumbersOf } from "./title";
import type { ShownCard, ShownThread } from "./detector";
import { commentUrl, draftDecision } from "./draft";
import { mergeQueuedFile, type FileOwner, type QueuedDecision, type QueuedFile, type SweepFigmaComments } from "./queue";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Where the read keeps its watermark and window, in `sweep_cursors`. */
export const COMMENTS_CURSOR = "figma:comments";
/** The longest window one read covers: the commented notes outlast it by a day. */
export const MAX_WINDOW_MS = 7 * DAY_MS;
/** How long MISC's file list stands before it is listed again. */
export const MISC_REFRESH_MS = 7 * DAY_MS;
/** Cards read for one file: a title rarely names more. */
export const MAX_CARDS_PER_FILE = 3;
/** Characters of the root comment a card quotes. */
export const QUOTE_CHARS = 200;
/** Card fields never offered: a card's name and its number are not decided in a comment. */
const NOT_FIELDS = new Set(["name", "id"]);
/** A stop that is a quota's, not the file's: held, never counted. */
const QUOTA = /\b429\b|quota|rate.?limit|resource.?exhausted/i;

/** The read's place, as `sweep_cursors` keeps it. */
export interface CommentsCursor {
  watermark: number;
  from: number;
  /** Set while a read is under way; null between reads. */
  until: number | null;
  done: string[];
}

/** The cursor's stored value, read; null when the read was never switched on. */
export function readCommentsCursor(value: string | null): CommentsCursor | null {
  if (!value) return null;
  const [w, from, until, done] = value.split("|");
  const watermark = Date.parse(w ?? "");
  const start = Date.parse(from ?? "");
  if (!Number.isFinite(watermark) || !Number.isFinite(start)) return null;
  const end = until ? Date.parse(until) : Number.NaN;
  return { watermark, from: start, until: Number.isFinite(end) ? end : null, done: done ? done.split(",").filter(Boolean) : [] };
}

/** The cursor's stored value. */
export function writeCommentsCursor(c: CommentsCursor): string {
  const iso = (ms: number) => new Date(ms).toISOString();
  return `${iso(c.watermark)}|${iso(c.from)}|${c.until === null ? "" : iso(c.until)}|${c.done.join(",")}`;
}

/** The ET dates a window touches, oldest first. */
export function etDatesOf(from: number, until: number): string[] {
  const dates: string[] = [];
  for (let t = from; t < until + DAY_MS; t += DAY_MS) {
    const d = etDateOf(Math.min(t, until));
    if (!dates.includes(d)) dates.push(d);
  }
  return dates;
}

/**
 * One night's read of Figma comment decisions.
 *
 * @param job - The `sweep-figma-comments` job
 * @param deps - The sweep's dependencies, with `figmaComments` bound
 * @throws A budget stop, after saving the files done
 */
export async function sweepFigmaComments(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const queued: QueuedFile[] = [];
  let read = 0;
  const finish = async (outcome: SweepRunOutcome, note: string | null): Promise<SweepJobReport> => {
    const decisions = queued.reduce((n, f) => n + f.decisions.length, 0);
    await recordRun(deps, {
      runName: "end-of-day",
      jobKey: job.key,
      channels: [],
      threads: read,
      items: decisions,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const counted = `${read} Figma file(s) read, ${decisions} decision(s) kept for the morning`;
    const summary = outcome === "handled" && note ? `${counted} — ${note}` : (note ?? counted);
    return { kind: "sweep-figma-comments", key: job.key, outcome, note, threads: read, findings: [], cards: [], figmaFiles: queued, summary };
  };

  const fc = deps.figmaComments;
  if (!fc) return finish("skipped", "the Figma comment reads are not wired");

  const now = deps.now();
  const saved = readCommentsCursor(await deps.store.cursor(COMMENTS_CURSOR));
  const save = async (c: CommentsCursor) => {
    if (!deps.dryRun) await deps.store.saveCursor(COMMENTS_CURSOR, writeCommentsCursor(c), deps.now());
  };
  if (!saved) {
    await save({ watermark: now, from: now, until: null, done: [] });
    const from = new Date(now).toISOString();
    return finish(
      "handled",
      deps.dryRun
        ? `would switch on: comments created or resolved after ${from} would be read, none before`
        : `switched on: comments created or resolved after ${from} are read, none before`,
    );
  }

  const notes: string[] = [];
  const cursor: CommentsCursor = saved.until === null ? { ...saved, until: now, done: [] } : { ...saved, done: [...saved.done] };
  const until = cursor.until!;
  if (until - cursor.from > MAX_WINDOW_MS) {
    cursor.from = until - MAX_WINDOW_MS;
    notes.push("the window ran past the seven days the notes keep, so the last seven were read");
  }
  const window: ReadWindow = { watermark: cursor.watermark, from: cursor.from, until };
  const resolved = new Map<string, string | null>();

  try {
    await save(cursor);
    const files = (await candidateFiles(fc, window)).filter((f) => !cursor.done.includes(f));
    const misc = files.length ? await miscFiles(fc, now, deps.dryRun, notes) : new Set<string>();
    const failing = new Set(files.length && !deps.dryRun ? await deps.store.failingThreads(COMMENTS_CURSOR) : []);
    for (const fileKey of files) {
      if (!misc.has(fileKey)) {
        const got = await readFile(deps, fc, fileKey, window, resolved);
        if (!got.ok) {
          if (got.counts && !deps.dryRun) {
            const nights = await deps.store.recordThreadFailure(COMMENTS_CURSOR, fileKey, deps.runDate);
            if (nights < MAX_FAILED_NIGHTS) return finish("handled", `stopped at file ${fileKey}: ${got.error}`);
            await deps.store.clearThreadFailure(COMMENTS_CURSOR, fileKey);
            notes.push(`file ${fileKey} skipped after ${nights} failed nights (${got.error})`);
          } else {
            return finish("handled", `stopped at file ${fileKey}: ${got.error}`);
          }
        } else {
          read += 1;
          if (got.file) {
            queued.push(got.file);
            if (!deps.dryRun) await fc.queue.write(mergeQueuedFile(await fc.queue.read(fileKey), got.file));
          }
          if (failing.has(fileKey) && !deps.dryRun) await deps.store.clearThreadFailure(COMMENTS_CURSOR, fileKey);
        }
      }
      cursor.done.push(fileKey);
      await save(cursor);
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      await finish("deferred", `budget stopped it after ${cursor.done.length} file(s); retried under ${job.key}`).catch(() => undefined);
    }
    throw err;
  }

  await save({ watermark: cursor.watermark, from: until, until: null, done: [] });
  return finish("handled", notes.length ? notes.join("; ") : null);
}

/** The files the window's notes name, each once. */
async function candidateFiles(fc: SweepFigmaComments, window: ReadWindow): Promise<string[]> {
  const keys = new Set<string>();
  for (const date of etDatesOf(window.from, window.until)) {
    const prefix = `${COMMENTED_PREFIX}${date}:`;
    for (const note of await fc.notes.list(prefix)) keys.add(note.key.slice(prefix.length));
  }
  for (const note of await fc.notes.list(CHANGED_PREFIX)) {
    const at = note.at ? Date.parse(note.at) : Number.NaN;
    if (at > window.from && at <= window.until) keys.add(note.key.slice(CHANGED_PREFIX.length));
  }
  return [...keys].filter(Boolean).sort();
}

/** MISC's files: the week's list, or a fresh one. A list that cannot be read skips nothing, and says so. */
async function miscFiles(fc: SweepFigmaComments, now: number, dryRun: boolean | undefined, notes: string[]): Promise<Set<string>> {
  if (!fc.miscTeamId) return new Set();
  const saved = await fc.misc.read();
  if (saved && now - saved.at < MISC_REFRESH_MS) return new Set(saved.files);
  try {
    const files: string[] = [];
    for (const folder of (await fc.figma.teamFolders(fc.miscTeamId)).folders ?? []) {
      files.push(...((await fc.figma.folderFiles(folder.id)).files ?? []).map((f) => f.key));
    }
    if (!dryRun) await fc.misc.write({ files, at: now });
    return new Set(files);
  } catch (err) {
    rethrowIfBudget(err);
    notes.push(`MISC's files could not be listed (${err instanceof Error ? err.message : String(err)}), so none was left out`);
    return new Set(saved?.files ?? []);
  }
}

type FileRead = { ok: true; file: QueuedFile | null } | { ok: false; error: string; counts: boolean };

/** One file: its threads in the window, where they sit, its cards, and what the detector makes of them. */
async function readFile(
  deps: SweepDeps,
  fc: SweepFigmaComments,
  fileKey: string,
  window: ReadWindow,
  resolved: Map<string, string | null>,
): Promise<FileRead> {
  const none: FileRead = { ok: true, file: null };
  const failure = (what: string, err: unknown): FileRead => {
    rethrowIfBudget(err);
    const why = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `${what} (${why})`, counts: !QUOTA.test(why) };
  };

  let threads: CommentThread[];
  try {
    threads = candidateThreads((await fc.figma.comments(fileKey)).comments ?? [], window);
  } catch (err) {
    return failure("its comments could not be read", err);
  }
  const fresh: CommentThread[] = [];
  for (const t of threads) if (!(await fc.carded.has(t.root.id))) fresh.push(t);
  if (!fresh.length) return none;

  let title: string;
  let counted: Array<{ thread: CommentThread; page: FilePage; layer?: string }>;
  try {
    const tree = await fc.figma.file(fileKey, { depth: 2 });
    title = tree.name;
    const pages = pagesOf(tree.document);
    const placed = new Map<string, NodePlace>();
    const deeper: string[] = [];
    for (const t of fresh) {
      const place = pageOf(tree.document, t.nodeId);
      if (place) placed.set(t.nodeId, place);
      else if (!deeper.includes(t.nodeId)) deeper.push(t.nodeId);
    }
    if (deeper.length) {
      const paths = await fc.figma.file(fileKey, { ids: deeper });
      for (const id of deeper) {
        const place = pageOf(paths.document, id);
        if (place) placed.set(id, place);
      }
    }
    counted = fresh.flatMap((thread) => {
      const place = placed.get(thread.nodeId);
      const page = place ? pages.find((p) => p.id === place.pageId) : undefined;
      if (!page?.section || !DECISION_SECTIONS.has(page.section)) return [];
      return [{ thread, page, ...(place && !place.isPage && place.name ? { layer: place.name } : {}) }];
    });
  } catch (err) {
    return failure("its pages could not be read", err);
  }
  if (!counted.length) return none;

  // Its cards, their PRD, and who to ask.
  const cards: ShownCard[] = [];
  const cardPages: SweepSource[] = [];
  let prd: SweepSource | null = null;
  let owner: FileOwner | null = null;
  let confirmers: string[] = [];
  try {
    for (const number of cardNumbersOf(title).slice(0, MAX_CARDS_PER_FILE)) {
      const found = await fc.card(number);
      const page = found ? await readUsable(deps.sources, deps.config, found.url, "notion") : null;
      if (!found || !page) continue;
      cards.push({ number, title: found.title || page.title, url: page.url, fields: fieldsOf(page) });
      cardPages.push(page);
    }
    const first = cardPages[0];
    if (first) {
      const sub = first.subpages?.find((s) => /^prd\b/i.test(s.title));
      prd = (sub ? await readUsable(deps.sources, deps.config, `https://www.notion.so/${sub.id}`, "notion") : null) ?? first;
      // The first card's first Contributor who is a Slack person.
      const lead = await contributorsOf(deps, first.contributors, resolved);
      owner = lead[0] ? { slack: lead[0] } : null;
      confirmers = [...new Set(await contributorsOf(deps, cardPages.flatMap((p) => p.contributors), resolved))];
    } else {
      const handle = (await fc.figma.fileMeta(fileKey)).file.creator?.handle;
      owner = handle ? { figma: handle } : null;
    }
  } catch (err) {
    return failure("its card could not be read", err);
  }

  const shown: ShownThread[] = counted.map(({ thread, page, layer }) => ({
    id: thread.root.id,
    section: page.section!,
    page: page.name,
    ...(layer ? { layer } : {}),
    resolved: !!thread.root.resolved_at,
    comments: [thread.root, ...thread.replies].map((c) => ({ by: c.user.handle, at: c.created_at, text: c.message })),
  }));
  const fileUrl = `https://www.figma.com/design/${encodeURIComponent(fileKey)}`;
  const detected = await fc.detector.detect({ file: { title, url: fileUrl }, threads: shown, cards, prd });
  if (!detected.ok) return { ok: false, error: `the detector did not answer (${detected.error})`, counts: !QUOTA.test(detected.error) };

  const decisions: QueuedDecision[] = [];
  for (const d of detected.decisions) {
    const at = counted.find((c) => c.thread.root.id === d.threadId);
    if (!at) continue;
    const root = at.thread.root;
    const quote = quoteOf(root.message);
    const { operation, update } = draftDecision(d, {
      prd,
      file: { title },
      commentUrl: commentUrl(fileKey, at.thread.nodeId, root.id),
      quote,
      by: root.user.handle,
      where: `${at.page.section} › ${at.page.name}`,
    });
    decisions.push({
      commentId: root.id,
      nodeId: at.thread.nodeId,
      quote,
      by: root.user.handle,
      section: at.page.section!,
      page: at.page.name,
      createdAt: root.created_at,
      resolvedAt: root.resolved_at ?? null,
      decision: d.decision,
      route: d.route,
      operation,
      update,
      confidence: d.confidence,
    });
  }
  if (!decisions.length) return none;
  return { ok: true, file: { fileKey, title, url: fileUrl, owner, confirmers, decisions, runDate: deps.runDate, foundAt: deps.now() } };
}

/** A card's fields the detector may change: everything it reads but its name and number. */
function fieldsOf(page: SweepSource): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(page.properties ?? {})) {
    if (!NOT_FIELDS.has(name.trim().toLowerCase()) && value.trim()) fields[name] = value;
  }
  if (page.contributors.length && !Object.keys(fields).some((k) => k.toLowerCase() === "contributor")) {
    fields.Contributor = page.contributors.join(", ");
  }
  return fields;
}

/** The root comment as a card quotes it: one line, short. */
export function quoteOf(message: string): string {
  const line = message.replace(/\s+/g, " ").trim();
  return line.length > QUOTE_CHARS ? `${line.slice(0, QUOTE_CHARS - 1)}…` : line;
}
