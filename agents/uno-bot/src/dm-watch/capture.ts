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
//   person. The findings whose morning has come go on ONE proposal card in the
//   person's DM with uno-bot, staged as a sweep card with `confirmers:
//   [owner]`: only they can ✅ it. Never #uno-bot, a thread, a channel card,
//   or anyone else's job. One live card at a time — a revision a `drop N`
//   made of it counts, found through its reply thread — and it is shown whole
//   in one message or not at all. A quiet day posts nothing.
//
//   `dropDmCapture` — the switch turned off: every live card it posted is
//   withdrawn, and its queue dropped. Both jobs check the switch again right
//   before each write, so a switch turned off mid-run keeps nothing.
//
// WHAT IS KEPT (ADR-030, ADR-032). Nothing in D1 but the switch and the read
// positions. A finding waits in KV (`DmCaptureQueue`), with an expiry: its
// permalink, its target (the page and the block), its state, and the edit the
// card shows. No quote of the DM, no id of the other person, and no message
// text: the card links the message instead of quoting it, and an edit that
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
import { ownBlocks, proposalReplyThread, SWEEP_KEY, type PendingProposal } from "../thread-state/index";
import type { CardFix, ProposalCard } from "../turn/index";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import { escapeSlackText } from "../slack/mrkdwn";
import { isMorningRunTime } from "../commitments/due";
import { changedSpan, itemOperation, MAX_ITEMS_PER_CARD, operationsDigest, SWEEP_CARD_EVENT, SWEEP_CARD_MARK, SWEEP_CARD_TTL_MS } from "../sweep/cards";
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
/** What the morning card may spend: the bot DM, the post, the staging and its
 *  record, a withdraw held back, and the queue. */
export const DM_CAPTURE_POST_COST = { subrequests: 8, d1Queries: 3 };
/** Words in a row that make a quote (#864's rule for what leaves a DM): an
 *  edit repeating this many of the DM's words, not already on the page, is
 *  dropped. */
export const DM_QUOTE_RUN = 5;
/** Slack's limits on one message: the card is shown whole or not at all. */
const ONE_MESSAGE = { chars: 40_000, blocks: 50 };
/** What a card is edited to when it is taken back. */
export const DM_CARD_NOT_STAGED =
  ":warning: This card didn't go through, so it can't be confirmed. Its fixes come back on a fresh card.";
export const DM_CARD_SWITCHED_OFF = ':no_entry: Withdrawn: you turned off "Catch decisions from my DMs".';

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
    /** `blocks` on the answer: the card's own blocks, when it went up with
     *  them rather than stepping down to its text. */
    post(
      channel: string,
      message: { text: string; blocks: unknown[]; metadata: { event_type: string; event_payload: Record<string, string> } },
    ): Promise<{ ok: boolean; ts?: string; blocks?: unknown[] }>;
    /** Take a posted card back: retired in ThreadState, then edited to say why. */
    withdraw(channel: string, ts: string, text: string): Promise<void>;
    /** Take a posted card back entirely: retired, then deleted (`chat.delete`). */
    remove(channel: string, ts: string): Promise<void>;
    /** This job's card under `cardKey`, posted since `since`, by its tag;
     *  null when surely not there, "unknown" when Slack would not say. */
    findPosted(channel: string, cardKey: string, since: string): Promise<{ ts: string; digest: string } | null | "unknown">;
  };
  render(card: ProposalCard): { text: string; blocks: unknown[]; followUp?: string[] };
  /** Stage the card, as a sweep card is staged (`stageSweepCard`). */
  stage(proposal: PendingProposal): Promise<void>;
  /** The live cards ThreadState holds in a channel — a card and any revision
   *  of it share its reply thread. */
  liveCards(channel: string): Promise<PendingProposal[]>;
  /** Whether a posted card was ever staged, and whether it is still live or
   *  was since confirmed, dropped or taken (`sweepCardState`). */
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
 * The weekday morning `dm-capture-post` job for `job.user`: one card, in their
 * DM with uno-bot, only they can confirm.
 *
 * A POSTED CARD IS STAGED, OR TAKEN BACK. The card is tagged with its key and
 * the digest of what it shows. A retry first looks for an earlier try's card
 * by that tag: one already staged is recorded, one with the same digest is
 * staged as it is, any other is deleted. A budget stop after the post deletes
 * the card before rethrowing, so no card is left up that a ✅ cannot run.
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
  const queue = await deps.queue.load(user);
  if (await liveCard(queue, now, deps)) return report("handled", null, "a card is still live — the rest waits");
  const due = queue
    .filter((f) => f.state === "queued" && f.ownerId === user && postableAt(f.detectedAt) <= now)
    .sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id))
    .slice(0, MAX_ITEMS_PER_CARD);
  if (!due.length) return report("handled", null, "nothing due");

  // Shown whole, in one message, or not offered: the owner confirms exactly
  // what they read. What does not fit waits; a fix too long to show even
  // alone leaves the queue.
  const fits = (items: DmCaptureFinding[]) => {
    const r = deps.render(dmCaptureCard(items));
    return !r.followUp?.length && r.text.length <= ONE_MESSAGE.chars && r.blocks.length <= ONE_MESSAGE.blocks;
  };
  let n = due.length;
  while (n > 0 && !fits(due.slice(0, n))) n -= 1;
  if (n === 0) {
    if (!deps.dryRun) await deps.queue.save(user, queue.filter((f) => f.id !== due[0]!.id));
    return report("handled", "a fix too long to show whole on a card — not offered");
  }
  const items = due.slice(0, n);
  const card = dmCaptureCard(items);
  const rendered = deps.render(card);
  if (deps.dryRun) return { ...report("handled", null, `would post 1 card holding ${items.length} fix(es)`), text: rendered.text };
  ensureHeadroom(deps, DM_CAPTURE_POST_COST);
  // The owner's DM with uno-bot, top level: never a thread, a channel or
  // anyone else.
  const dm = await deps.bot.dmChannel(user);
  if (!dm) return report("handled", "the owner's DM with uno-bot could not be opened — kept for tomorrow");
  const cardKey = `${deps.runDate}:dm-capture:${user}`;
  const digest = operationsDigest(card.operations ?? []);
  const record = async (ts: string) => {
    const ids = new Set(items.map((f) => f.id));
    if (!(await stillOn())) {
      // Turned off while the card went up: it is taken back, and nothing kept.
      try {
        await deps.bot.withdraw(dm, ts, DM_CARD_SWITCHED_OFF);
      } finally {
        await deps.queue.clear(user);
      }
      return report("skipped", "the switch went off while the card posted — withdrawn");
    }
    await deps.queue.save(
      user,
      queue.map((f) => (ids.has(f.id) ? { ...f, state: "proposed" as const, cardChannel: dm, proposalTs: ts, postedAt: now } : f)),
    );
    return report("handled", null, `posted 1 card holding ${items.length} fix(es)`);
  };

  // An earlier try's card, found by its tag.
  let ts: string | null = null;
  // The carousel it went up with, when this try posted it; a card an earlier
  // try left up is staged on its text.
  let blocks: unknown[] | undefined;
  const prior = await deps.bot.findPosted(dm, cardKey, tsOf(Date.parse(`${deps.runDate}T00:00:00Z`)));
  if (prior === "unknown") return report("handled", "could not tell whether an earlier try posted — held for the next try");
  if (prior) {
    // Staged by the earlier try — live, or since confirmed, dropped or
    // running: recorded as posted and left alone. Only a card never staged is
    // staged now, or taken back.
    const state = await deps.cardState(prior.ts);
    if (state.state !== "unstaged") return record(prior.ts);
    if (prior.digest === digest) ts = prior.ts;
    else await deps.bot.remove(dm, prior.ts);
  }
  if (!ts) {
    // Tagged as a sweep card, so the DM's own reads take it as uno-bot's post
    // — context, never something the person said.
    const posted = await deps.bot.post(dm, {
      ...rendered,
      metadata: { event_type: SWEEP_CARD_EVENT, event_payload: { role: "card", card_key: cardKey, digest } },
    });
    if (!posted.ok || !posted.ts) return report("handled", "Slack refused the post — kept for tomorrow");
    ts = posted.ts;
    blocks = posted.blocks;
  }
  const proposal = dmCaptureProposal(card, {
    owner: user,
    channel: dm,
    ts,
    text: rendered.text,
    ...(blocks ? { blocks } : {}),
    runDate: deps.runDate,
  });
  try {
    await deps.stage(proposal);
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      // No card left up that a ✅ cannot run: the retry posts afresh.
      await deps.bot.remove(dm, ts).catch(() => undefined);
      throw err;
    }
    await deps.bot.withdraw(dm, ts, DM_CARD_NOT_STAGED).catch(rethrowIfBudget);
    return report("handled", `posted but not staged (${err instanceof Error ? err.message : String(err)}) — withdrawn, kept for tomorrow`);
  }
  return record(ts);
}

/** Whether a card went out on a thread: the card itself, or a revision of it,
 *  which lives in the card's reply thread. */
function inThread(card: PendingProposal, threadTs: string): boolean {
  return !!card.sweepRun && (card.proposalTs === threadTs || proposalReplyThread(card) === threadTs);
}

/** Whether a card this job posted — or a revision a `drop N` made of it — is
 *  still live. */
async function liveCard(queue: readonly DmCaptureFinding[], now: number, deps: Pick<DmCapturePostDeps, "liveCards">): Promise<boolean> {
  const posted = new Map<string, Set<string>>();
  for (const f of queue) {
    if (f.state !== "proposed" || !f.cardChannel || !f.proposalTs || (f.postedAt ?? 0) + SWEEP_CARD_TTL_MS <= now) continue;
    posted.set(f.cardChannel, (posted.get(f.cardChannel) ?? new Set()).add(f.proposalTs));
  }
  for (const [channel, threads] of posted) {
    const cards = await deps.liveCards(channel);
    if (cards.some((c) => [...threads].some((t) => inThread(c, t)))) return true;
  }
  return false;
}

/**
 * DM Capture went off: every live card it posted — or a revision of one — is
 * taken back, so it can no longer be ✅'d, and what it found is dropped.
 */
export async function dropDmCapture(
  userId: string,
  deps: {
    queue: DmCaptureQueue;
    liveCards(channel: string): Promise<PendingProposal[]>;
    withdraw(channel: string, ts: string, text: string): Promise<void>;
  },
): Promise<void> {
  const queue = await deps.queue.load(userId);
  const threads = new Map<string, Set<string>>();
  for (const f of queue) {
    if (f.state === "proposed" && f.cardChannel && f.proposalTs) threads.set(f.cardChannel, (threads.get(f.cardChannel) ?? new Set()).add(f.proposalTs));
  }
  try {
    for (const [channel, ts] of threads) {
      for (const card of await deps.liveCards(channel)) {
        if (![...ts].some((t) => inThread(card, t))) continue;
        // One card that will not withdraw does not keep the others, or the
        // queue, around.
        await deps.withdraw(channel, card.proposalTs, DM_CARD_SWITCHED_OFF).catch((err: unknown) => {
          rethrowIfBudget(err);
          console.warn(`[dm-capture] ${userId}: card ${card.proposalTs} not withdrawn: ${err instanceof Error ? err.message : String(err)}`);
        });
      }
    }
  } finally {
    await deps.queue.clear(userId);
  }
}

/** The card, as data. Page words are escaped; the DM is linked, never quoted. */
export function dmCaptureCard(items: readonly DmCaptureFinding[]): ProposalCard {
  const n = items.length;
  const head = `**${SWEEP_CARD_MARK}** — from your DMs: you settled ${n === 1 ? "something" : `${n} things`} that a page doesn't say yet.`;
  // Only the owner confirms, so no card names anyone; the DM is a button.
  const fixes: CardFix[] = items.map((item, i) => {
    const page = `<${item.target.url}|${escapeSlackText(flat(item.target.title) || "untitled")}>`;
    const where = `   - <${item.permalink}|where you said it>`;
    const fix = {
      page: { title: flat(item.target.title), url: item.target.url },
      where: { label: "Your DM", url: item.permalink },
    };
    if (item.add) {
      const place = item.add.section
        ? `add under ${page} › *${escapeSlackText(flat(item.add.section))}*`
        : `add a new section *${escapeSlackText(flat(item.add.newSection ?? ""))}* to ${page}`;
      return {
        ...fix,
        change: `Adds: “${flat(item.replacement)}”`,
        detail: [`${i + 1}. ${place}`, `   - adds: “${escapeSlackText(flat(item.replacement))}”`, where].join("\n"),
      };
    }
    const { before, after } = changedSpan(item.original, item.replacement);
    return {
      ...fix,
      change: `“${before}” → “${after}”`,
      detail: [
        `${i + 1}. ${page}`,
        `   - page says: “${escapeSlackText(flat(item.sourceSays))}”`,
        `   - change: “${escapeSlackText(before)}” → “${escapeSlackText(after)}”`,
        where,
      ].join("\n"),
    };
  });
  const tail =
    `Only you can confirm. One ✅ applies ${n === 1 ? "it" : `all ${n}`}; reply \`drop 2\` to leave one out. ` +
    `Nothing from your DMs goes anywhere else. Expires in ${SWEEP_CARD_TTL_MS / 3_600_000} h, with no reminder.`;
  const lines = [head, "", ...fixes.map((f) => f.detail), "", tail];
  const operations = items.map((item) =>
    itemOperation({ target: item.target, blockId: item.blockId, lastEditedTime: item.lastEditedTime, replacement: item.replacement, add: item.add }),
  );
  return {
    kind: "confirm",
    verb: n === 1 ? "apply this Notion fix" : `apply these ${n} Notion fixes`,
    lead: lines.join("\n"),
    fields: [],
    caveats: [],
    operations,
    fixes: { head, items: fixes, tail },
  };
}

/** The card as ThreadState stages it: a sweep card in the owner's DM with
 *  uno-bot, its own thread, that only the owner can resolve. */
export function dmCaptureProposal(
  card: ProposalCard,
  posted: { owner: string; channel: string; ts: string; text: string; blocks?: unknown[]; runDate: string },
): PendingProposal {
  const operations = card.operations ?? [];
  const first = operations[0]!;
  return {
    operations,
    toolName: first.toolName,
    input: first.input,
    channel: posted.channel,
    threadTs: posted.ts,
    replyTs: posted.ts,
    userMsgTs: posted.ts,
    proposalTs: posted.ts,
    proposalText: posted.text,
    ...ownBlocks(posted),
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: SWEEP_CARD_TTL_MS,
    confirmers: [posted.owner],
    sweepRun: posted.runDate,
    supersedeKey: SWEEP_KEY,
    // What its carousel showed, so a `drop N` revision is a carousel too.
    ...(card.fixes ? { fixes: card.fixes } : {}),
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
