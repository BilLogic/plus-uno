// DM Capture: a person who turned on "Catch decisions from my DMs" has their
// own DMs read, with their own token, for Capture's two questions — a decision
// a Notion page still states the old way (drift), and an answer no page has
// written down — and the edit offered to them, and only them, in their DM with
// uno-bot.
//
// TWO ENTRY POINTS, one module:
//
//   `runDmCaptureRead` — the end-of-day `dm-capture-read` job, one per person
//   with the switch on. Switch off, or no token of their own: no DM is read.
//   It lists and reads the person's DMs as the promise read does (`./run.ts`:
//   the scope check, the DM list, forward reading, `detectorWindows`), under
//   its OWN read positions (`positionScope`), so turning it on never skips a
//   message the promise jobs already read, and the reverse. A window with a
//   Notion link, a page named without one, or an answered question goes to
//   the sweep's drift and answer detectors, with the pages read as the sweep
//   reads them (`sweep/surfaces.ts`). A named page is searched for in Notion
//   only: a DM's words never go to GitHub. A linked page that fails to read
//   for a reason that may pass (a 429, a 5xx) holds the DM at that window, to
//   be read again another night, for `MAX_FAILED_NIGHTS` nights at most
//   (`DmHolds`); a page the integration cannot open (a 400, 403, 404) is set
//   aside at once (`pageReadFailure`), and so is a search hit that fails.
//   What they find is queued for the morning. It posts nothing.
//
//   `runDmCapturePost` — the weekday morning `dm-capture-post` job, one per
//   person. The findings whose morning has come go up as ONE report on the
//   shared decision card (`slack/decision-cards.ts`) in the person's DM with
//   uno-bot: a parent line, then a card per fix with Review, Open page and
//   Open DM. Each fix is its own proposal with `confirmers: [owner]`: only
//   they can decide it, in Review. Never #uno-bot, a thread, a channel card,
//   or anyone else's job. At most ten cards; the rest stay queued. One report
//   at a time: while any of its fixes is live, the rest wait. A quiet day
//   posts nothing.
//
//   `dropDmCapture` — the switch turned off: every fix still live on a card it
//   posted is withdrawn, and its queue dropped. Both jobs check the switch
//   again right before each write, so a switch turned off mid-run keeps
//   nothing.
//
// WHAT IS KEPT (ADR-030, ADR-032). Nothing in D1 but the switch and the read
// positions. A finding waits in KV (`DmCaptureQueue`), with an expiry: its
// permalink, its target (the page and the block), its state, and the edit the
// card shows. No quote of the DM, no id of the other person, and no message
// text: the card links the message (Open DM) instead of quoting it, and an edit that
// repeats `DM_QUOTE_RUN` of the DM's words in a row, not already on the page,
// is dropped (`quotesDm`).
//
// THE BUDGET. One job per person, each on its own alarm and fresh budget. A
// window starts only when what is left covers it (`DM_CAPTURE_COST`). A stop
// saves the findings, then the positions of the DMs finished, and rethrows;
// the runner runs the job again on a fresh budget, which keeps the night's
// stopping point and skips the DMs already read.
//
// Every dependency is injected (tests/dm-capture.test.ts). `Env` enters in
// `./capture-env.ts`.

import { isSubrequestBudgetError, rethrowIfBudget } from "../net";
import {
  proposalReplyThread,

  type PendingProposal,
  type ProposalOperation,
  type ReportItem,
  type StatedCardWords,
  type ThreadState,
} from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import { escapeSlackText } from "../slack/mrkdwn";
import { renderProposalCard } from "../slack/proposal-render";
import { decisionReport, itemProposal, itemProposalKey, markNotStaged, reportRecord, type ReportMessage } from "../slack/decision-cards";
import { isMorningRunTime } from "../commitments/due";
import { changedSpan, itemOperation, operationsDigest, SWEEP_CARD_EVENT, SWEEP_CARD_TTL_MS } from "../sweep/cards";
import type { CaptureDetector } from "../sweep/capture-detector";
import type { DriftDetector } from "../sweep/detector";
import { classifyLink, linksIn, type FindingAddition, type FindingTarget, type SweepMessage, type SweepSource, type TargetKind } from "../sweep/finding";
import { MAX_FAILED_NIGHTS, MAX_SOURCES_PER_THREAD, type SweepCardState } from "../sweep/run";
import { postableAt } from "../sweep/schedule";
import { findBySearch, looksAnswered, namedThings, questionQuery, type SourceSearch } from "../sweep/search";
import { readUsable, searchGate, type SurfaceConfig } from "../sweep/surfaces";
import {
  detectorWindows,
  ensureHeadroom,
  listIms,
  MAX_DMS_PER_NIGHT,
  MAX_IM_PAGES,
  permalinkOf,
  readForward,
  ready,
  type OwnerSlack,
  type ReadProgress,
} from "./run";
import { CAPTURE_FEATURE, positionScope, type DmReadPosition, type DmWatchRecords } from "./store";

/** What one window may spend: two model calls, the pages it reads and
 *  searches for, and what a stop saves. */
export const DM_CAPTURE_COST = { subrequests: 12, d1Queries: 2 };
/** What the morning report may spend before its fixes: the bot DM, the look
 *  for an earlier try, the post, its record, an edit, and a withdraw held
 *  back. */
export const DM_CAPTURE_POST_COST = { subrequests: 8, d1Queries: 3 };
/** What each fix on it adds: its staging, its usage row, and the queue. */
export const DM_CAPTURE_ITEM_COST = { subrequests: 3, d1Queries: 1 };
/** Words in a row that make a quote (#864's rule for what leaves a DM): an
 *  edit repeating this many of the DM's words, not already on the page, is
 *  dropped. */
export const DM_QUOTE_RUN = 5;
/** What a card says, with nothing to review, when its fix did not stage or
 *  was taken back. */
export const DM_CARD_NOT_STAGED = "Didn't go through, so it comes back on a later card.";
export const DM_CARD_SWITCHED_OFF = 'Withdrawn: you turned off "Catch decisions from my DMs".';

/** One finding from a person's DMs, as the queue keeps it until its card. */
export interface DmCaptureFinding {
  /** `<DM>:<block id>`, or `<DM>:add:<block id>` for an added answer. */
  id: string;
  ownerId: string;
  /** The first new message that says it — linked on the card, never quoted. */
  permalink: string;
  target: FindingTarget;
  /** The block it replaces, or the block an added answer goes in after, and
   *  the stamp the read saw on it (ADR-029). */
  blockId: string;
  lastEditedTime: string;
  /** The block's text as read, and what the page says, in brief — the page's
   *  words, not the DM's. Empty for an added answer. */
  original: string;
  sourceSays: string;
  /** What the edit writes. */
  replacement: string;
  add?: FindingAddition;
  /** `queued` until its card posts; `proposed` once it has, so the same fix
   *  is not offered again while the queue remembers it. */
  state: "queued" | "proposed";
  detectedAt: number;
  driftAt: number;
  /** The card it went out on — the owner's DM with uno-bot and its ts, the
   *  card's reply thread — and when. */
  cardChannel?: string;
  proposalTs?: string;
  postedAt?: number;
}

/** How many nights running a DM has been held on a page that would not read,
 *  by DM id — past `MAX_FAILED_NIGHTS` the page is set aside and the DM read
 *  on. */
export type DmHolds = Record<string, { nights: number; runDate: string }>;

/**
 * What a failed page read means. A page the integration cannot open — not
 * shared, restricted, deleted, or a database link (Notion's 400, 403, 404) —
 * will not open tomorrow either: it is `unusable`, set aside like a page
 * with nothing on it. Anything else — a 429, a 5xx, a network failure, the
 * sweep's quota stops — may pass: `transient`, and the DM is held.
 *
 * @param err - What the read threw
 */
export function pageReadFailure(err: unknown): "unusable" | "transient" {
  const message = err instanceof Error ? err.message : String(err);
  const status = /\bNotion (\d{3})\b/.exec(message)?.[1];
  return status === "400" || status === "403" || status === "404" ? "unusable" : "transient";
}

/** The KV queue, one list per person. */
export interface DmCaptureQueue {
  load(ownerId: string): Promise<DmCaptureFinding[]>;
  save(ownerId: string, findings: DmCaptureFinding[]): Promise<void>;
  clear(ownerId: string): Promise<void>;
}

interface Common extends Pick<JobContext, "runDate"> {
  records: DmWatchRecords;
  queue: DmCaptureQueue;
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  /** Reads and detects as a real run does, and writes and posts nothing. */
  dryRun?: boolean;
  log?(line: string): void;
}

export type DmCaptureReadDeps = Common & {
  ownerSlack(userId: string): Promise<OwnerSlack | null>;
  botUserId: string | null;
  progress: ReadProgress;
  /** The nights each DM has been held on a page, one record per person. */
  holds: { load(ownerId: string): Promise<DmHolds>; save(ownerId: string, holds: DmHolds): Promise<void> };
  sources: { read(url: string, kind: TargetKind): Promise<SweepSource | null> };
  surfaces: SurfaceConfig;
  detector: DriftDetector;
  capture: Pick<CaptureDetector, "answers">;
  /** Notion only: a DM's words never go to GitHub code search. Absent,
   *  nothing is searched. */
  search?: Pick<SourceSearch, "notion">;
};

export type DmCapturePostDeps = Common & {
  bot: {
    /** The owner's DM with uno-bot. */
    dmChannel(userId: string): Promise<string | null>;
    post(
      channel: string,
      message: { text: string; blocks: unknown[]; metadata: { event_type: string; event_payload: Record<string, string> } },
    ): Promise<{ ok: boolean; ts?: string }>;
    /** Edit the report's message in place (`chat.update`). */
    edit(channel: string, ts: string, message: ReportMessage): Promise<void>;
    /** Take a report's fixes back: each retired, and the cards it took out of
     *  reach say `note`. No ids: a card from before the shared card, retired
     *  whole and edited to `note`. */
    withdraw(channel: string, ts: string, ids: readonly string[], note: string): Promise<void>;
    /** Take a report back entirely: its fixes retired, then the message
     *  deleted (`chat.delete`). */
    remove(channel: string, ts: string, ids: readonly string[]): Promise<void>;
    /** This job's message under `cardKey`, posted since `since`, by its tag;
     *  null when surely not there, "unknown" when Slack would not say. */
    findPosted(channel: string, cardKey: string, since: string): Promise<{ ts: string; digest: string } | null | "unknown">;
  };
  /** Where the report's record is kept, and each card's decision lands. */
  reports: Pick<ThreadState, "putReport" | "getReport" | "updateReport" | "getProposalByTs">;
  /** Stage one fix, as a sweep card is staged (`stageSweepCard`). */
  stage(proposal: PendingProposal): Promise<void>;
  /** The live proposals ThreadState holds in a channel. */
  liveCards(channel: string): Promise<PendingProposal[]>;
  /** Whether a fix's proposal was ever staged, and whether it is still live
   *  or was since decided (`sweepCardState`). */
  cardState(proposalTs: string): Promise<SweepCardState>;
};

export interface DmCaptureReport {
  kind: "dm-capture-read" | "dm-capture-post";
  key: string;
  outcome: "handled" | "skipped";
  note: string | null;
  summary: string;
  /** A dry run's card, for the rehearsal. */
  text?: string;
}

// ── End of day ───────────────────────────────────────────────────────────────

/**
 * The end-of-day `dm-capture-read` job for `job.user`.
 *
 * @throws A budget stop, after saving what was found and the DMs finished
 */
export async function runDmCaptureRead(job: ScheduledJob, deps: DmCaptureReadDeps): Promise<DmCaptureReport> {
  const report = reporter("dm-capture-read", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const on = (await deps.records.switches(user)).find((s) => s.feature === CAPTURE_FEATURE);
  if (!on) return report("skipped", "no switch on");
  const slack = await ready(user, deps);
  if (!slack.ok) return report("skipped", slack.note);

  const now = deps.now();
  const scope = positionScope(user, CAPTURE_FEATURE);
  const key = `dm-watch:capture-read:${user}:${deps.runDate}`;
  const saved = await deps.progress.get(key);
  const latest = saved?.latest ?? tsOf(now);
  if (!saved && !deps.dryRun) await deps.progress.set(key, { latest });

  const listed = await listIms(slack.api);
  if (!listed) return report("skipped", "the DM list could not be read");
  const people = listed.channels.filter((c) => c.user !== user && c.user !== deps.botUserId && c.user !== "USLACKBOT");
  const positions = await deps.records.positions(scope);
  const from = (id: string) => {
    const p = positions[id]?.through;
    return p && Number(p) > Number(on.readThrough) ? p : on.readThrough;
  };
  const doneTonight = people.filter((c) => Number(from(c.id)) >= Number(latest)).length;
  const waiting = people
    .filter((c) => Number(from(c.id)) < Number(latest))
    .sort((a, b) => Number(from(a.id)) - Number(from(b.id)) || a.id.localeCompare(b.id));
  const tonight = waiting.slice(0, Math.max(0, MAX_DMS_PER_NIGHT - doneTonight));
  const found: DmCaptureFinding[] = [];
  const finished: Record<string, DmReadPosition> = {};
  const holds = await deps.holds.load(user);
  let holdsChanged = false;
  let read = 0;
  let unreadable = 0;
  // The findings first, then the positions past them — so a position never
  // moves past a finding that was not kept — and only while the switch is on.
  const stillOn = async () => (await deps.records.switches(user)).some((s) => s.feature === CAPTURE_FEATURE);
  const save = async () => {
    if (deps.dryRun) return;
    // Checked again right before each write: a switch turned off mid-run
    // keeps nothing of it.
    if (found.length && (await stillOn())) await deps.queue.save(user, mergeQueued(await deps.queue.load(user), found));
    if (Object.keys(finished).length && (await stillOn())) await deps.records.savePositions(scope, finished);
    if (holdsChanged && (await stillOn())) await deps.holds.save(user, holds);
  };
  try {
    for (const im of tonight) {
      const since = from(im.id);
      const got = await readForward(slack.api, im.id, { since, upTo: positions[im.id]?.upTo ?? null, latest }, deps);
      if (!got) {
        unreadable += 1;
        continue;
      }
      let stopped = false;
      // Tonight's hold on a page that would not read, counted once a night;
      // at the cap, the page is set aside and the DM read on.
      const held = holds[im.id];
      const nights = held ? (held.runDate === deps.runDate ? held.nights : held.nights + 1) : 1;
      const release = nights >= MAX_FAILED_NIGHTS;
      for (const window of detectorWindows(got.messages, since)) {
        ensureHeadroom(deps, DM_CAPTURE_COST);
        const result = await findingsIn(window, { user, channel: im.id, url: slack.url, now, release }, deps);
        if (!result.ok) {
          if (result.held === "page") {
            holds[im.id] = { nights, runDate: deps.runDate };
            holdsChanged = true;
          }
          stopped = true;
          break;
        }
        found.push(...result.findings);
        finished[im.id] = { through: window.through, upTo: got.upTo };
      }
      if (stopped) {
        unreadable += 1;
        continue;
      }
      if (Number(got.through) > Number(since) || got.upTo !== (positions[im.id]?.upTo ?? null)) finished[im.id] = { through: got.through, upTo: got.upTo };
      if (holds[im.id]) {
        delete holds[im.id];
        holdsChanged = true;
      }
      read += 1;
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) await save().catch(() => undefined);
    throw err;
  }
  await save();
  if (!deps.dryRun) await deps.progress.clear(key);
  const notes = [
    waiting.length > tonight.length ? `${waiting.length - tonight.length} DM(s) wait for another night` : "",
    listed.complete ? "" : `the DM list ran past ${MAX_IM_PAGES} pages, so later DMs were not listed`,
  ].filter(Boolean);
  return report(
    "handled",
    notes.length ? notes.join("; ") : null,
    `${read} DM(s) read, ${unreadable} unreadable or held; ${found.length} finding(s) ${deps.dryRun ? "would be queued" : "queued"}`,
  );
}

/**
 * One window's findings: the pages it links (Notion first) and, with search,
 * the page it names or the page its answer belongs on; then drift and
 * undocumented answers, each resting on at least one message new tonight.
 * Only a model that did not answer holds the DM; a page that will not read is
 * no page.
 */
async function findingsIn(
  window: { messages: SweepMessage[]; since: string },
  at: { user: string; channel: string; url: string; now: number; release: boolean },
  deps: DmCaptureReadDeps,
): Promise<{ ok: true; findings: DmCaptureFinding[] } | { ok: false; held: "page" | "model" }> {
  const none = { ok: true as const, findings: [] };
  const { messages } = window;
  const links = [...new Set(messages.flatMap((m) => linksIn(m.text)))].filter((url) => classifyLink(url) === "notion");
  const named = deps.search ? namedThings(messages.map((m) => m.text)) : [];
  const answered = looksAnswered(messages);
  if (!links.length && !named.length && !answered) return none;

  const sources: SweepSource[] = [];
  const keep = (source: SweepSource | null) => {
    if (source && !sources.some((s) => s.url === source.url)) sources.push(source);
  };
  for (const url of links.slice(0, MAX_SOURCES_PER_THREAD)) {
    try {
      keep(await readUsable(deps.sources, deps.surfaces, url, "notion"));
    } catch (err) {
      // A page that may open tomorrow (a 429, a 5xx) is not a page with
      // nothing on it: the DM is held here and read again another night, as
      // the sweep holds a thread — until `MAX_FAILED_NIGHTS`, when it is let
      // go. A page the integration cannot open is set aside at once.
      rethrowIfBudget(err);
      if (pageReadFailure(err) === "transient" && !at.release) return { ok: false, held: "page" };
      (deps.log ?? console.log)(`[dm-capture] ${at.user}: a linked page was set aside (${err instanceof Error ? err.message : String(err)})`);
    }
  }
  if (deps.search && sources.length < MAX_SOURCES_PER_THREAD) {
    const question = answered && !sources.some((s) => s.writable) ? questionQuery(messages) : null;
    // Notion only, whatever the port offers: a DM's words never reach GitHub.
    const search = deps.search;
    const notionOnly: SourceSearch = { notion: (q) => search.notion(q) };
    const hits = await findBySearch(notionOnly, [...named, ...(question ? [question] : [])], new Set(links), searchGate(deps.surfaces));
    for (const hit of hits.filter((h) => h.kind === "notion")) {
      if (sources.length >= MAX_SOURCES_PER_THREAD) break;
      // A search hit is best-effort: nobody pointed at it, so it never holds the DM.
      keep(
        await readUsable(deps.sources, deps.surfaces, hit.url, "notion", true).catch((err: unknown) => {
          rethrowIfBudget(err);
          return null;
        }),
      );
    }
  }
  if (!sources.some((s) => s.writable)) return none;

  const thread = { channel: at.channel, channelKind: "dm" as const, rootTs: messages[0]!.ts, messages };
  const said = messages.map((m) => m.text);
  const fresh = (evidence: readonly string[]) => evidence.filter((t) => Number(t) > Number(window.since)).sort((a, b) => Number(a) - Number(b));
  const findings: DmCaptureFinding[] = [];
  const base = (source: SweepSource, evidence: string[], allTs: string[]) => ({
    ownerId: at.user,
    permalink: permalinkOf(at.url, at.channel, evidence[0]!),
    target: {
      url: source.url,
      kind: source.kind,
      writable: source.writable,
      title: source.title,
      pillars: source.pillars,
      ...(source.foundBy ? { foundBy: source.foundBy } : {}),
    },
    state: "queued" as const,
    detectedAt: at.now,
    driftAt: Math.min(...allTs.map(msOf)),
  });

  if (links.length || named.length) {
    const detected = await deps.detector.detect({ thread, sources });
    if (!detected.ok) return { ok: false, held: "model" };
    for (const d of detected.findings) {
      const evidence = fresh(d.evidenceTs);
      if (!d.source.writable || !d.blockId || !d.lastEditedTime || !evidence.length) continue;
      if (quotesDm(d.replacement, d.original, said) || quotesDm(d.sourceSays, d.original, said)) continue;
      findings.push({
        ...base(d.source, evidence, d.evidenceTs),
        id: `${at.channel}:${d.blockId}`,
        blockId: d.blockId,
        lastEditedTime: d.lastEditedTime,
        original: d.original,
        sourceSays: d.sourceSays,
        replacement: d.replacement,
      });
    }
  }
  if (answered) {
    const placed = await deps.capture.answers({ thread, sources });
    if (!placed.ok) return { ok: false, held: "model" };
    for (const a of placed.answers) {
      const evidence = fresh(a.evidenceTs);
      if (!evidence.length) continue;
      if (quotesDm(a.text, "", said) || quotesDm(a.newSection ?? "", "", said)) continue;
      findings.push({
        ...base(a.source, evidence, a.evidenceTs),
        id: `${at.channel}:add:${a.anchorId}`,
        blockId: a.anchorId,
        lastEditedTime: a.anchorEditedTime,
        original: "",
        sourceSays: "",
        replacement: a.text,
        add: { section: a.section, newSection: a.newSection },
      });
    }
  }
  return { ok: true, findings };
}

/** Tonight's findings into the queue: a newer read of a queued one replaces
 *  it; a fix already carded — the same page and block — is not queued again. */
export function mergeQueued(queue: readonly DmCaptureFinding[], added: readonly DmCaptureFinding[]): DmCaptureFinding[] {
  const carded = new Set(queue.filter((f) => f.state === "proposed").map(fixKey));
  const byId = new Map(queue.map((f) => [f.id, f] as const));
  for (const f of added) {
    const had = byId.get(f.id);
    if (carded.has(fixKey(f)) || had?.state === "proposed") continue;
    byId.set(f.id, f);
  }
  return [...byId.values()];
}

/**
 * Whether `text` repeats `DM_QUOTE_RUN` or more of the DM's words in a row
 * that the page did not already hold — a quote of the DM, which the card and
 * the queue may not carry (ADR-032). A run the page already says is the
 * page's own words.
 *
 * @param text - What would be kept and shown
 * @param page - The page's text it rewrites ("" for an added line)
 * @param dm - The DM's messages
 */
export function quotesDm(text: string, page: string, dm: readonly string[]): boolean {
  const words = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const mine = words(text);
  if (mine.length < DM_QUOTE_RUN) return false;
  const theirs = dm.map((t) => ` ${words(t).join(" ")} `);
  const own = ` ${words(page).join(" ")} `;
  for (let i = 0; i + DM_QUOTE_RUN <= mine.length; i++) {
    const run = ` ${mine.slice(i, i + DM_QUOTE_RUN).join(" ")} `;
    if (!own.includes(run) && theirs.some((t) => t.includes(run))) return true;
  }
  return false;
}

function fixKey(f: Pick<DmCaptureFinding, "target" | "blockId" | "add">): string {
  return `${f.target.url}#${f.add ? "add:" : ""}${f.blockId}`;
}

// ── Morning ──────────────────────────────────────────────────────────────────

/**
 * The weekday morning `dm-capture-post` job for `job.user`: one report, in
 * their DM with uno-bot, on the shared decision card — a card per fix, each
 * its own proposal, that only they can decide.
 *
 * A POSTED REPORT IS STAGED, OR TAKEN BACK. The message is tagged with its key
 * and the digest of what it shows. A fix is marked carded as soon as it is
 * staged, so a retry never cards it twice. A retry first looks for an earlier
 * try's message by that tag: one with a fix already staged is the morning's
 * report, and its other cards say they didn't go through; one with none
 * staged and the same digest is staged as it is; any other is deleted. A
 * budget stop before any fix is staged deletes the message before rethrowing,
 * so no card is left up that Review cannot decide.
 *
 * @throws A budget stop — the runner defers
 */
export async function runDmCapturePost(job: ScheduledJob, deps: DmCapturePostDeps): Promise<DmCaptureReport> {
  const report = reporter("dm-capture-post", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const now = deps.now();
  if (!deps.dryRun && !isMorningRunTime(now)) return report("skipped", "outside the weekday morning run");
  const stillOn = async () => (await deps.records.switches(user)).some((s) => s.feature === CAPTURE_FEATURE);
  if (!(await stillOn())) {
    // Turned off since the night read: nothing it found is offered.
    if (!deps.dryRun) await deps.queue.clear(user);
    return report("skipped", "no switch on");
  }
  let queue = await deps.queue.load(user);
  if (await liveCard(queue, now, deps)) return report("handled", null, "a card is still live — the rest waits");
  const due = queue
    .filter((f) => f.state === "queued" && f.ownerId === user && postableAt(f.detectedAt) <= now)
    .sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
  if (!due.length) return report("handled", null, "nothing due");

  // The first ten are shown; the parent line counts every fix due, and the
  // rest stay queued for the next card.
  const built = decisionReport(due.map(dmCaptureItem), dmCaptureParent(due));
  const shown = due.slice(0, built.shown.length);
  const fixes = `${shown.length} fix(es)`;
  if (deps.dryRun) return { ...report("handled", null, `would post 1 card holding ${fixes}`), text: built.text };
  ensureHeadroom(deps, {
    subrequests: DM_CAPTURE_POST_COST.subrequests + shown.length * DM_CAPTURE_ITEM_COST.subrequests,
    d1Queries: DM_CAPTURE_POST_COST.d1Queries + shown.length * DM_CAPTURE_ITEM_COST.d1Queries,
  });
  // The owner's DM with uno-bot, top level: never a thread, a channel or
  // anyone else.
  const dm = await deps.bot.dmChannel(user);
  if (!dm) return report("handled", "the owner's DM with uno-bot could not be opened — kept for tomorrow");
  const cardKey = `${deps.runDate}:dm-capture:${user}`;
  const digest = operationsDigest(shown.map(fixOperation));

  // An earlier try's message, found by its tag.
  let ts: string | null = null;
  const prior = await deps.bot.findPosted(dm, cardKey, tsOf(Date.parse(`${deps.runDate}T00:00:00Z`)));
  if (prior === "unknown") return report("handled", "could not tell whether an earlier try posted — held for the next try");
  if (prior) {
    // A fix it staged — live, or since decided — makes it the morning's
    // report: left up, with its unstaged cards saying so. Only a message with
    // nothing staged is staged now, or taken back.
    const record = await deps.reports.getReport(prior.ts);
    const staged: string[] = [];
    for (const entry of record?.entries ?? []) {
      if ((await deps.cardState(itemProposalKey(prior.ts, entry.id))).state !== "unstaged") staged.push(entry.id);
    }
    if (staged.length) {
      const unstaged = (record?.entries ?? []).filter((e) => !staged.includes(e.id)).map((e) => e.id);
      queue = queue.map((f) => (staged.includes(f.id) ? carded(f, dm, prior.ts, now) : f));
      await deps.queue.save(user, queue);
      await notStaged(deps, dm, prior.ts, unstaged);
      return report("handled", null, `recorded an earlier try's card holding ${staged.length} fix(es)`);
    }
    if (prior.digest === digest && record) ts = prior.ts;
    else await deps.bot.remove(dm, prior.ts, (record?.entries ?? []).map((e) => e.id));
  }
  if (!ts) {
    // Tagged as a sweep card, so the DM's own reads take it as uno-bot's post
    // — context, never something the person said.
    const posted = await deps.bot.post(dm, {
      text: built.text,
      blocks: built.blocks,
      metadata: { event_type: SWEEP_CARD_EVENT, event_payload: { role: "card", card_key: cardKey, digest } },
    });
    if (!posted.ok || !posted.ts) return report("handled", "Slack refused the post — kept for tomorrow");
    ts = posted.ts;
    try {
      // Where each card's decision lands: without it, no card can be staged.
      await deps.reports.putReport(reportRecord(dm, ts, built, SWEEP_CARD_TTL_MS));
    } catch (err) {
      await deps.bot.remove(dm, ts, []).catch(rethrowIfBudget);
      rethrowIfBudget(err);
      return report("handled", `posted but its record was not kept (${err instanceof Error ? err.message : String(err)}) — taken back, kept for tomorrow`);
    }
  }

  const staged: string[] = [];
  const failed: string[] = [];
  for (const f of shown) {
    try {
      await deps.stage(dmCaptureProposal(f, { owner: user, channel: dm, ts }));
    } catch (err) {
      if (isSubrequestBudgetError(err)) {
        // No card left up that Review cannot decide: with nothing staged, the
        // retry posts afresh; with some, it finds this message by its tag.
        if (!staged.length) await deps.bot.remove(dm, ts, []).catch(() => undefined);
        throw err;
      }
      console.error(`[dm-capture] ${user}: fix ${f.id} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(f.id);
      continue;
    }
    staged.push(f.id);
    // At once, so a stop after this never cards it again.
    queue = queue.map((q) => (q.id === f.id ? carded(q, dm, ts, now) : q));
    await deps.queue.save(user, queue);
  }
  if (failed.length) await notStaged(deps, dm, ts, failed);
  if (!(await stillOn())) {
    // Turned off while the report went up: it is taken back, and nothing kept.
    try {
      await deps.bot.withdraw(dm, ts, staged, DM_CARD_SWITCHED_OFF);
    } finally {
      await deps.queue.clear(user);
    }
    return report("skipped", "the switch went off while the card posted — withdrawn");
  }
  const note = failed.length ? `${failed.length} fix(es) posted but not staged — kept for tomorrow` : null;
  return report("handled", note, `posted 1 card holding ${staged.length} fix(es)`);
}

/** A fix as its card went up: carded, on that message. */
function carded(f: DmCaptureFinding, channel: string, messageTs: string, now: number): DmCaptureFinding {
  return { ...f, state: "proposed", cardChannel: channel, proposalTs: messageTs, postedAt: now };
}

/** Cards that showed and never staged say so, with nothing to review. */
async function notStaged(deps: Pick<DmCapturePostDeps, "reports" | "bot">, channel: string, ts: string, ids: readonly string[]): Promise<void> {
  if (!ids.length) return;
  const message = await markNotStaged(deps.reports, ts, ids, DM_CARD_NOT_STAGED).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  if (message) await deps.bot.edit(channel, ts, message).catch(rethrowIfBudget);
}

/** Whether a proposal belongs to one of these messages: an item of the
 *  report, or a card from before the shared card — the card itself, or a
 *  revision in its reply thread. */
function onMessage(card: PendingProposal, messages: ReadonlySet<string>): boolean {
  if (card.item) return messages.has(card.item.messageTs);
  return !!card.sweepRun && (messages.has(card.proposalTs) || messages.has(proposalReplyThread(card)));
}

/** Whether a card this job posted still has a fix to decide. */
async function liveCard(queue: readonly DmCaptureFinding[], now: number, deps: Pick<DmCapturePostDeps, "liveCards">): Promise<boolean> {
  const posted = new Map<string, Set<string>>();
  for (const f of queue) {
    if (f.state !== "proposed" || !f.cardChannel || !f.proposalTs || (f.postedAt ?? 0) + SWEEP_CARD_TTL_MS <= now) continue;
    posted.set(f.cardChannel, (posted.get(f.cardChannel) ?? new Set()).add(f.proposalTs));
  }
  for (const [channel, messages] of posted) {
    if ((await deps.liveCards(channel)).some((c) => onMessage(c, messages))) return true;
  }
  return false;
}

/**
 * DM Capture went off: every fix still live on a card it posted is taken
 * back, so Review can no longer decide it, and what it found is dropped.
 */
export async function dropDmCapture(
  userId: string,
  deps: {
    queue: DmCaptureQueue;
    liveCards(channel: string): Promise<PendingProposal[]>;
    withdraw(channel: string, ts: string, ids: readonly string[], note: string): Promise<void>;
  },
): Promise<void> {
  const queue = await deps.queue.load(userId);
  const posted = new Map<string, Set<string>>();
  for (const f of queue) {
    if (f.state === "proposed" && f.cardChannel && f.proposalTs) posted.set(f.cardChannel, (posted.get(f.cardChannel) ?? new Set()).add(f.proposalTs));
  }
  try {
    for (const [channel, messages] of posted) {
      // Each message once, with the ids of its fixes still live; a card from
      // before the shared card is withdrawn whole, by its own ts.
      const live = new Map<string, string[]>();
      for (const card of await deps.liveCards(channel)) {
        if (!onMessage(card, messages)) continue;
        if (card.item) live.set(card.item.messageTs, [...(live.get(card.item.messageTs) ?? []), card.item.id]);
        else live.set(card.proposalTs, []);
      }
      for (const [ts, ids] of live) {
        // One card that will not withdraw does not keep the others, or the
        // queue, around.
        await deps.withdraw(channel, ts, ids, DM_CARD_SWITCHED_OFF).catch((err: unknown) => {
          rethrowIfBudget(err);
          console.warn(`[dm-capture] ${userId}: card ${ts} not withdrawn: ${err instanceof Error ? err.message : String(err)}`);
        });
      }
    }
  } finally {
    await deps.queue.clear(userId);
  }
}

/** The day a DM said it, as ET's calendar has it: "Sep 29". */
function dayOf(ms: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(new Date(ms));
}

/** A page title for a card: plain text, with nothing Slack could read as a
 *  mention in the message's fallback text. */
function cardTitle(title: string): string {
  return flat(title).replace(/[<>]/g, "") || "untitled";
}

/** The page, linked, its title escaped. */
function pageLink(f: Pick<DmCaptureFinding, "target">): string {
  return `<${f.target.url}|${escapeSlackText(flat(f.target.title) || "untitled")}>`;
}

/**
 * The report's parent line: what the DMs settled that a page doesn't say, in
 * one plain sentence. Counts every fix due, the held-back ones too.
 *
 * @param due - Every fix due this morning
 */
export function dmCaptureParent(due: readonly DmCaptureFinding[]): string {
  if (due.length > 1) return `Your DMs settled ${due.length} things your pages don't say yet.`;
  const f = due[0]!;
  return f.add ? `Your DMs settled something that ${pageLink(f)} doesn't say yet.` : `Your DMs settled something that ${pageLink(f)} still states the old way.`;
}

/**
 * One fix as its card: the page, when and where it was said, and the change.
 * Open goes to the page, and Open DM links the message — linked, never
 * quoted, and the other person never named.
 *
 * @param f - A fix due this morning
 */
export function dmCaptureItem(f: DmCaptureFinding): ReportItem {
  const added = flat(f.replacement);
  const change = f.add
    ? { body: f.add.section ? `Adds under ${flat(f.add.section)}: “${added}”` : `Adds a new section, ${flat(f.add.newSection ?? "")}: “${added}”`, done: `“${added}”` }
    : (() => {
        const { before, after } = changedSpan(f.original, f.replacement);
        return { body: `Page says “${before}” · decision says “${after}”`, done: `“${added}”` };
      })();
  return {
    id: f.id,
    title: cardTitle(f.target.title),
    subtitle: `Your DM · ${dayOf(f.driftAt)}`,
    body: change.body,
    done: change.done,
    open: { label: "Open page", url: f.target.url },
    also: { label: "Open DM", url: f.permalink },
  };
}

/**
 * One fix as Review shows and decides it: the page, what it says, the edit,
 * and a link to where it was said. No footer: Review is the gate.
 *
 * @param f - The fix
 */
export function dmCaptureCard(f: DmCaptureFinding): ProposalCard {
  const lines = [`*${pageLink(f)}*`];
  if (f.add) {
    lines.push(
      f.add.section ? `Add under *${escapeSlackText(flat(f.add.section))}*:` : `Add a new section, *${escapeSlackText(flat(f.add.newSection ?? ""))}*:`,
      `“${escapeSlackText(flat(f.replacement))}”`,
    );
  } else {
    const { before, after } = changedSpan(f.original, f.replacement);
    lines.push(`Page says: “${escapeSlackText(flat(f.sourceSays))}”`, `Change: “${escapeSlackText(before)}” → “${escapeSlackText(after)}”`);
  }
  lines.push(`From <${f.permalink}|your DM> on ${dayOf(f.driftAt)}. Only you can decide it, and nothing from your DMs goes anywhere else.`);
  return {
    kind: "stated",
    verb: "apply this Notion fix",
    lead: lines.join("\n"),
    footer: "",
    fields: [],
    caveats: [],
    operations: [fixOperation(f)],
  };
}

/** What a DM Capture card says at the gate (`PendingProposal.stated`). */
export const DM_CAPTURE_WORDS: StatedCardWords = {
  cancelled: "Rejected, nothing written",
  expired: `That card closed after ${SWEEP_CARD_TTL_MS / 3_600_000} h with no decision, so nothing was written.`,
};

/** A fix's one write. */
function fixOperation(f: DmCaptureFinding): ProposalOperation {
  return itemOperation({ target: f.target, blockId: f.blockId, lastEditedTime: f.lastEditedTime, replacement: f.replacement, add: f.add });
}

/** One fix as ThreadState stages it: an item of the report in the owner's DM
 *  with uno-bot, that only the owner can decide. */
export function dmCaptureProposal(f: DmCaptureFinding, posted: { owner: string; channel: string; ts: string }): PendingProposal {
  const operation = fixOperation(f);
  return {
    operations: [operation],
    toolName: operation.toolName,
    input: operation.input,
    channel: posted.channel,
    threadTs: posted.ts,
    replyTs: posted.ts,
    ...itemProposal(posted.ts, f.id),
    // The fix's whole text, which Review shows.
    proposalText: renderProposalCard(dmCaptureCard(f)).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: SWEEP_CARD_TTL_MS,
    confirmers: [posted.owner],
    stated: DM_CAPTURE_WORDS,
  };
}

// ── Shared ───────────────────────────────────────────────────────────────────

function reporter(kind: DmCaptureReport["kind"], job: ScheduledJob) {
  return (outcome: DmCaptureReport["outcome"], note: string | null, done?: string): DmCaptureReport => ({
    kind,
    key: job.key,
    outcome,
    note,
    summary: [done, note].filter(Boolean).join(" — ") || outcome,
  });
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function tsOf(ms: number): string {
  return (ms / 1000).toFixed(6);
}

function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}
