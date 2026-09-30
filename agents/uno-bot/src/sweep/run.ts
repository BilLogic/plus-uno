// `runSweepJob(job, deps)` — the end-of-day sweep, one scheduled job at a time.
//
// THREE JOB KINDS, one module:
//
//   `sweep-channel` (end of day, one per channel on `SWEEP_CHANNELS`) reads the
//   channel since its cursor with the bot token — `conversations.history` in
//   pages of 200, plus the replies of every thread active since then — follows
//   the links each thread carries through the existing source reads, asks the
//   detector, routes each finding to its owner, and queues it for the morning.
//   It posts nothing.
//
//   `sweep-group-dms` (end of day, one job) does the same for every group DM
//   uno-bot is in, as the bot's own conversation list names them, one after
//   another on the job's budget; each keeps its own cursor and run record.
//
//   `sweep-post` (the weekday morning run) takes the findings whose morning has
//   come (`postableAt`), groups them by destination (`pickDestination`), and
//   stages the proposal cards (`planSweepCards`) the way the Figma library post
//   stages without a Turn: post the card, then `putProposal` with its own TTL
//   and confirmer set. One live card per place: a place whose card is still
//   live gets none, and what does not fit waits in the queue. A quiet day
//   posts nothing.
//
// THE AUDIENCE RULE (ADR-031). A run with no requester has no one whose
// visibility bounds it, so the evidence's own audience does: a finding only
// reaches people who could already see its evidence.
//   • A public channel's finding is posted in its own thread.
//   • A private channel is read only when it is on `SWEEP_CHANNELS` AND on the
//     team's private allowlist (`SLACK_SEARCH_PRIVATE_ALLOWLIST`); off the
//     allowlist it is never read, whatever the sweep list says. Its finding
//     stays in its thread, its owner is someone in the channel, and nothing of
//     it — text, link or name — reaches any other message.
//   • A group DM uno-bot is in is read the same way and its finding posted
//     back in it. Its card says that a ✅ also posts a reworded note in the
//     team channel — the page's name, no quote, no names (`./share.ts`).
//   • A fix found both in a public thread and in a private place is private:
//     it goes on the private card, and the public copy leaves the queue.
//   • A DM is never read, and #uno-bot is never swept and never posted in.
//
// THE BUDGET. Each alarm runs one job on a fresh subrequest budget, under the
// lookup ceiling (ADR-022). A channel's threads are processed oldest activity
// first and the cursor is saved after each one, so a budget stop keeps every
// thread already done: the job records where it stopped and rethrows the stop,
// and the runner keeps the job under its key and runs it again on a fresh
// budget (`runner/queue.ts`). A retried job is idempotent — the cursor skips
// what is done and the queue replaces a finding by its id. A history read
// that stops at its page cap never moves the cursor past the oldest root it
// read, and a thread too long to read whole is left with a note.
//
// A POSTED CARD IS ALWAYS STAGED, OR WITHDRAWN. A card starts only when the
// budget left covers all of it (`CARD_COST`). Its items are recorded first,
// in one statement and without a ts; then it is posted, tagged with its key
// in Slack's message metadata; then staged; then its items take its ts
// (`markPosted`). A stop anywhere in that leaves items without a ts, and the
// next try finds the card by its tag and finishes staging it — or, when it
// never went up, releases the items and cards the findings afresh. A staging
// that fails outright edits the card to say it did not go through and
// releases its items, which stay queued.
//
// A FIX IS PROPOSED ONCE. A reply under a card is activity past the cursor, so
// the next night re-reads the thread and the detector may find the same drift
// again. The morning skips any fix the thread has already had carded —
// proposed, dropped or applied.
//
// Every dependency is injected — the Slack reads, the source reads, the people
// lookup, the detector, the store, the delivery and the clock — so the Node
// suite runs whole days against fakes (tests/sweep-run.test.ts). `Env` enters
// in `./env.ts`.

import { D1QueryBudgetError, isSubrequestBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import type { HistoryMessage } from "../slack/api";
import { proposalReplyThread, SWEEP_KEY, type PendingProposal, type ThreadState } from "../thread-state/index";
import { recordProposalEvents, stagedEvent, supersededEvents, type ProposalEventLog } from "../usage/index";
import type { ProposalCard } from "../turn/index";
import type { ScheduledJob } from "../scheduled/runs";
import {
  cardPlan,
  destinationKey,
  operationsDigest,
  planSweepCards,
  sweepCard,
  sweepShareOf,
  SWEEP_CARD_TTL_MS,
  type SweepCardPlan,
} from "./cards";
import { MAX_MESSAGE_CHARS, type DriftDetector } from "./detector";
import {
  classifyLink,
  linksIn,
  pickDestination,
  resolveDestination,
  routeOwner,
  type ChannelKind,
  type Destination,
  type SweepMessage,
  type SweepSource,
  type TargetKind,
} from "./finding";
import { postableAt } from "./schedule";
import type {
  CardSnapshot,
  PendingFinding,
  SweepItemRecord,
  SweepItemStatus,
  SweepRunOutcome,
  SweepRunRecord,
  SweepStore,
} from "./store";

/** A first sweep of a channel reads its last day. */
export const FIRST_SWEEP_WINDOW_MS = 24 * 60 * 60 * 1000;
/** How far back a thread's root may be and still count as active: a reply
 *  today in a thread started last week is today's evidence. */
export const ACTIVE_THREAD_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
/** `conversations.history` pages of 200, at most this many per job. */
export const MAX_HISTORY_PAGES = 5;
/** Characters of thread text the detector is shown; past it, the oldest
 *  replies are left out (the root always stays) and the run notes it. */
export const MAX_THREAD_CHARS = 24_000;
/** Consecutive failed nights after which a thread is skipped and the cursor
 *  moves past it. */
export const MAX_FAILED_NIGHTS = 2;
/** Sources followed per thread, Notion first. */
export const MAX_SOURCES_PER_THREAD = 3;
/** `conversations.replies` pages of 200 read per thread; a longer thread is
 *  left unread, with a note. */
export const MAX_REPLY_PAGES = 5;
/** Pages of a thread (or of a channel's top) read looking for a posted card
 *  by its tag; past them the answer is "unknown", and the card is held. */
export const FIND_POSTED_PAGES = 3;
/** Permalinks fetched per morning job — one per item, best-effort. */
export const MAX_PERMALINKS = 20;
/**
 * What one card may spend, past its permalinks and the messages it posts: a
 * Slack call held back for the edit that withdraws a card whose staging
 * failed, and the D1 statements — its items, their ts, a release, and the
 * run's own record.
 */
export const CARD_COST = { reserveSubrequests: 1, d1Queries: 4 };

/** A message as `conversations.history` / `.replies` return it. */
export type SweepSlackMessage = HistoryMessage;

/** The Slack reads, with the bot token. */
export interface SweepSlack {
  /** What kind of conversation this is, or null when Slack would not say. */
  channelKind(channel: string): Promise<ChannelKind | null>;
  /** One page of the channel's top-level messages since `oldest`, or null. */
  history(
    channel: string,
    oldest: string,
    cursor?: string,
  ): Promise<{ messages: SweepSlackMessage[]; nextCursor?: string } | null>;
  /** One page of a thread, root first, or null. */
  replies(
    channel: string,
    rootTs: string,
    cursor?: string,
  ): Promise<{ messages: SweepSlackMessage[]; nextCursor?: string } | null>;
  /** A private place's members, or null when Slack would not say. Absent, no
   *  Contributor counts as one. */
  members?(channel: string): Promise<string[] | null>;
  /** The group DMs uno-bot is in, or null when the list cannot be read. */
  groupDms?(): Promise<string[] | null>;
}

/** A card as Slack will post it. */
export interface RenderedSweepCard {
  text: string;
  blocks: unknown[];
  /** Posted before the card, so its buttons stay last in the thread. */
  followUp?: string[];
}

/** Where a card lands: a thread, or the top of a channel. */
export interface CardPlace {
  channel: string;
  threadTs: string | null;
}

/** What a card's Slack tag carries (`SWEEP_CARD_EVENT`). */
export interface CardTag {
  cardKey: string;
  /** `operationsDigest` of what the card shows. */
  digest: string;
}

/** A search for a posted card by its tag: found, surely not there, or not
 *  known — a failed read, or more pages than the search reads. */
export type PostedCard =
  | { state: "found"; ts: string; text: string; digest: string }
  | { state: "absent" }
  | { state: "unknown"; why: string };

/** Posting and staging, and the reads the morning needs. */
export interface SweepDelivery {
  render(card: ProposalCard): RenderedSweepCard;
  /** Post the card — and any follow-up before it — tagged with its key and
   *  digest; the card's own message as the card, a follow-up as its plan. */
  post(to: CardPlace, card: RenderedSweepCard, tag: CardTag): Promise<{ ok: boolean; ts?: string }>;
  /** The card's own message under this key, matched by its tag's key and
   *  role. `since` bounds a channel-top search. */
  findPosted(to: CardPlace, cardKey: string, since: string): Promise<PostedCard>;
  /** Stage the card, as a turn's staging does. */
  stage(proposal: PendingProposal): Promise<void>;
  /** The sweep cards ThreadState holds live in a channel — a revision or a
   *  re-staged card among them, whether or not the records caught up. */
  liveCards(channel: string): Promise<PendingProposal[]>;
  /** Whether a posted card was ever staged, and what became of it
   *  (`sweepCardState`). */
  cardState(proposalTs: string): Promise<SweepCardState>;
  /** Retire the card in ThreadState so it can't be ✅'d, replace its text,
   *  remove its buttons, and retag it so a later search by its key passes it
   *  over. */
  withdraw(channel: string, ts: string, text: string, cardKey: string): Promise<void>;
  permalink(channel: string, ts: string): Promise<string | null>;
}

export interface SweepConfig {
  plusDesign?: string;
  plusUniversal?: string;
  /** #uno-bot: never swept, never posted in. */
  unoBot?: string;
  /** The DS library file key, so a link to it counts as the design system. */
  figmaLibraryKey?: string;
  /** The bot's own user id, whose messages are not evidence. */
  botUserId?: string | null;
  /** The private channels the team cleared (`SLACK_SEARCH_PRIVATE_ALLOWLIST`):
   *  the only ones the sweep reads. */
  privateAllowlist?: readonly string[];
}

export interface SweepDeps {
  slack: SweepSlack;
  sources: { read(url: string, kind: TargetKind): Promise<SweepSource | null> };
  /** A Contributor's name as a Slack id, when exactly one person has it. */
  people: { slackIdFor(name: string): Promise<string | null> };
  detector: DriftDetector;
  store: SweepStore;
  delivery: SweepDelivery;
  config: SweepConfig;
  /** The invocation's meter: spend for the run record, and what is left
   *  before a card starts. Zeros and no limit without one. */
  meter?: {
    subrequests(): number;
    d1Queries(): number;
    headroom(): { subrequests: number; d1Queries: number };
  };
  now(): number;
  /** Reads and detects as a real run does, and writes, posts and stages nothing. */
  dryRun?: boolean;
}

/** One planned or posted card, as the report shows it. */
export interface SweepCardReport {
  key: string;
  destination: Destination;
  channel: string;
  threadTs: string | null;
  items: number;
  text: string;
  proposalTs?: string;
}

/** What one job came to. */
export interface SweepJobReport {
  kind: "sweep-channel" | "sweep-group-dms" | "sweep-post";
  key: string;
  outcome: SweepRunOutcome;
  note: string | null;
  channel?: string;
  threads: number;
  /** Kept tonight (end of day), or carded this morning. */
  findings: PendingFinding[];
  /** Posted this morning — or, on a dry run, what would be. */
  cards: SweepCardReport[];
  summary: string;
}

/**
 * Run one sweep job.
 *
 * @param job - A `sweep-channel` or `sweep-post` job
 * @param deps - Everything it touches, by name
 * @throws A budget stop, after saving what was done — so the runner defers
 */
export function runSweepJob(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  if (job.kind === "sweep-post") return postFindings(job, deps);
  if (job.kind === "sweep-group-dms") return sweepGroupDms(job, deps);
  return sweepChannel(job, deps);
}

// ── End of day: read, detect, queue ──────────────────────────────────────────

/**
 * Every group DM uno-bot is in, one after another on this job's budget. Each
 * is swept as a channel is — its own cursor, its own run record under
 * `<job key>:<channel>` — so a budget stop part-way keeps what is done, and
 * the retried job skips it.
 */
async function sweepGroupDms(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const base = { kind: "sweep-group-dms" as const, key: job.key };
  const listed = deps.slack.groupDms ? await deps.slack.groupDms() : null;
  if (!listed) {
    const note = "the group DMs uno-bot is in could not be listed";
    return { ...base, outcome: "skipped", note, threads: 0, findings: [], cards: [], summary: note };
  }
  const reports: SweepJobReport[] = [];
  for (const channel of listed.filter((c) => c && c !== deps.config.unoBot)) {
    reports.push(await sweepChannel({ key: `${job.key}:${channel}`, kind: "sweep-channel", channel }, deps, "group-dm"));
  }
  const threads = reports.reduce((n, r) => n + r.threads, 0);
  const findings = reports.flatMap((r) => r.findings);
  const cards = reports.flatMap((r) => r.cards);
  const notes = reports.filter((r) => r.note).map((r) => `${r.channel}: ${r.note}`);
  const note = notes.length ? notes.join("; ") : null;
  const counted = `${reports.length} group DM(s), ${threads} thread(s) read, ${findings.length} finding(s) kept for the morning`;
  return { ...base, outcome: "handled", note, threads, findings, cards, summary: note ? `${counted} — ${note}` : counted };
}

/**
 * One channel's end of day.
 *
 * @param only - Sweep it only when Slack says it is this kind — how the
 *   group-DM job holds itself to group DMs
 */
async function sweepChannel(job: ScheduledJob, deps: SweepDeps, only?: ChannelKind): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const channel = job.channel ?? "";
  const base = { kind: "sweep-channel" as const, key: job.key, channel };
  const finish = async (
    outcome: SweepRunOutcome,
    note: string | null,
    threads: number,
    findings: PendingFinding[],
    cards: SweepCardReport[] = [],
  ): Promise<SweepJobReport> => {
    await recordRun(deps, {
      runName: "end-of-day",
      jobKey: job.key,
      channels: channel ? [channel] : [],
      threads,
      items: findings.length,
      outcome,
      note,
      startedAt,
      meterStart,
    });
    const counted = `${threads} thread(s) read, ${findings.length} finding(s) kept for the morning`;
    const summary = outcome === "handled" && note ? `${counted} — ${note}` : (note ?? counted);
    return { ...base, outcome, note, threads, findings, cards, summary };
  };

  if (!channel) return finish("skipped", "no channel on the job", 0, []);
  if (channel === deps.config.unoBot) return finish("skipped", "#uno-bot is never swept", 0, []);
  const kind = await deps.slack.channelKind(channel);
  if (kind === null) return finish("skipped", "Slack would not describe the channel", 0, []);
  if (kind === "dm") return finish("skipped", "DMs are never read", 0, []);
  if (only && kind !== only) return finish("skipped", `not a ${only}`, 0, []);
  if (kind === "private" && !(deps.config.privateAllowlist ?? []).includes(channel)) {
    return finish("skipped", "a private channel off the private allowlist is never read", 0, []);
  }

  const now = deps.now();
  const cursor = (await deps.store.cursor(channel)) ?? tsOf(now - FIRST_SWEEP_WINDOW_MS);
  const oldest = tsOf(msOf(cursor) - ACTIVE_THREAD_LOOKBACK_MS);
  const runDate = dateOf(now);
  const kept: PendingFinding[] = [];
  let threads = 0;
  let readOnly = 0;
  let reached = cursor;
  const notes: string[] = [];
  const resolved = new Map<string, string | null>();
  // A private place's members, read once, the first time a Contributor is
  // about to be named owner there.
  let members: Promise<ReadonlySet<string>> | undefined;
  const membersOf = (): Promise<ReadonlySet<string>> =>
    (members ??= (deps.slack.members ? deps.slack.members(channel) : Promise.resolve(null)).then(
      (m) => new Set(m ?? []),
    ));

  try {
    const { units, readTo } = await activeThreads(deps, channel, oldest, cursor);
    if (readTo) notes.push(`history ran past ${MAX_HISTORY_PAGES} pages; the cursor stays at or before ${readTo}`);
    const failing = new Set(units.length && !deps.dryRun ? await deps.store.failingThreads(channel) : []);
    // A thread that failed: held — the cursor stays before it and the job
    // stops — unless it has now failed `MAX_FAILED_NIGHTS` nights running,
    // when it is skipped and the cursor moves past it. A budget stop throws
    // past this; a model quota stop holds without counting.
    const failed = async (rootTs: string, why: string, counts: boolean): Promise<"hold" | "skip"> => {
      if (!counts || deps.dryRun) return "hold";
      const nights = await deps.store.recordThreadFailure(channel, rootTs, runDate);
      if (nights < MAX_FAILED_NIGHTS) return "hold";
      await deps.store.clearThreadFailure(channel, rootTs);
      console.warn(`[sweep] ${channel} thread ${rootTs} skipped after ${nights} failed nights: ${why}`);
      notes.push(`thread ${rootTs} skipped after ${nights} failed nights (${why})`);
      return "skip";
    };
    for (const unit of units) {
      const messages = unit.replies ? await readThread(deps, channel, unit.root.ts) : [unit.root];
      if (!messages) {
        const why = "its replies could not be read";
        if ((await failed(unit.root.ts, why, true)) === "hold") {
          return finish("handled", `stopped at ${reached}: a thread's replies could not be read`, threads, kept);
        }
      } else if (messages !== "too-long") {
        const humans = messages.filter((m) => isHuman(m, deps.config.botUserId)).map(toSweepMessage);
        threads += 1;
        const found = await sweepThread(deps, {
          channel,
          channelKind: kind,
          rootTs: unit.root.ts,
          humans,
          runDate,
          now,
          resolved,
          membersOf,
        });
        if (!found.ok) {
          if ((await failed(unit.root.ts, found.error, found.counts)) === "hold") {
            return finish("handled", `stopped at ${reached}: ${found.error}`, threads, kept);
          }
        } else {
          if (found.trimmed) notes.push(`thread ${unit.root.ts}: ${found.trimmed} oldest repl(ies) left out of the detector's view`);
          kept.push(...found.findings);
          readOnly += found.readOnly;
          if (!deps.dryRun && found.findings.length) await deps.store.addFindings(found.findings);
          if (failing.has(unit.root.ts) && !deps.dryRun) await deps.store.clearThreadFailure(channel, unit.root.ts);
        }
      } else {
        notes.push(`thread ${unit.root.ts} has more than ${MAX_REPLY_PAGES * 200} replies and was left unread`);
      }
      // Never past the oldest root the history read reached, never backwards.
      const to = readTo && msOf(unit.activity) > msOf(readTo) ? readTo : unit.activity;
      if (msOf(to) > msOf(reached)) {
        if (!deps.dryRun) await deps.store.saveCursor(channel, to, deps.now());
        reached = to;
      }
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      // Everything up to `reached` is saved; say where it stopped, then let the
      // runner keep the job under its key for a fresh budget.
      await finish("deferred", `budget stopped it after ${reached}; retried under ${job.key}`, threads, kept).catch(
        () => undefined,
      );
    }
    throw err;
  }

  const cards = deps.dryRun ? plannedCards(deps, kept, dateOf(postableAt(now))) : [];
  if (readOnly) notes.push(`${readOnly} finding(s) on targets uno-bot cannot write were left alone`);
  return finish("handled", notes.length ? notes.join("; ") : null, threads, kept, cards);
}

/** A thread with activity since the cursor, and when it was last active. */
interface ActiveThread {
  root: SweepSlackMessage;
  replies: boolean;
  activity: string;
}

/**
 * The channel's threads active since the cursor, oldest activity first — and,
 * when the history ran past its page cap, the oldest root it read: a root
 * older than that was never seen, so the cursor may not pass it.
 */
async function activeThreads(
  deps: SweepDeps,
  channel: string,
  oldest: string,
  cursor: string,
): Promise<{ units: ActiveThread[]; readTo: string | null }> {
  const units: ActiveThread[] = [];
  let page: string | undefined;
  let oldestRead: string | null = null;
  for (let i = 0; i < MAX_HISTORY_PAGES; i++) {
    const res = await deps.slack.history(channel, oldest, page);
    if (!res) break;
    for (const m of res.messages) {
      if (!oldestRead || msOf(m.ts) < msOf(oldestRead)) oldestRead = m.ts;
      if (m.thread_ts && m.thread_ts !== m.ts) continue; // a broadcast reply: its root is the unit
      if (!isHuman(m, deps.config.botUserId)) continue;
      const replies = (m.reply_count ?? 0) > 0;
      const activity = replies && m.latest_reply && msOf(m.latest_reply) > msOf(m.ts) ? m.latest_reply : m.ts;
      if (msOf(activity) <= msOf(cursor)) continue;
      units.push({ root: m, replies, activity });
    }
    page = res.nextCursor;
    if (!page) break;
  }
  return { units: units.sort((a, b) => msOf(a.activity) - msOf(b.activity)), readTo: page ? oldestRead : null };
}

/** A whole thread, root first, a page at a time; null when a page could not
 *  be read, `too-long` past `MAX_REPLY_PAGES`. */
async function readThread(deps: SweepDeps, channel: string, rootTs: string): Promise<SweepSlackMessage[] | "too-long" | null> {
  const messages: SweepSlackMessage[] = [];
  let page: string | undefined;
  for (let i = 0; i < MAX_REPLY_PAGES; i++) {
    const res = await deps.slack.replies(channel, rootTs, page);
    if (!res) return null;
    messages.push(...res.messages);
    page = res.nextCursor;
    if (!page) return messages;
  }
  return "too-long";
}

/** One thread: its links read, its drift detected and routed. */
async function sweepThread(
  deps: SweepDeps,
  t: {
    channel: string;
    channelKind: ChannelKind;
    rootTs: string;
    humans: SweepMessage[];
    runDate: string;
    now: number;
    resolved: Map<string, string | null>;
    /** The place's members — read only for a place that is not public. */
    membersOf: () => Promise<ReadonlySet<string>>;
  },
): Promise<
  | { ok: true; findings: PendingFinding[]; readOnly: number; trimmed: number }
  | { ok: false; error: string; counts: boolean }
> {
  const none = { ok: true as const, findings: [], readOnly: 0, trimmed: 0 };
  const root = t.humans.find((m) => m.ts === t.rootTs) ?? t.humans[0];
  if (!root) return none;
  const links = [...new Set(t.humans.flatMap((m) => linksIn(m.text)))]
    .map((url) => ({ url, kind: classifyLink(url, deps.config.figmaLibraryKey) }))
    .filter((l): l is { url: string; kind: TargetKind } => l.kind !== null);
  // Only Notion is written in place, so a thread with no Notion link has
  // nothing this sweep can propose — and costs no read and no model call.
  if (!links.some((l) => l.kind === "notion")) return none;
  const chosen = [...links.filter((l) => l.kind === "notion"), ...links.filter((l) => l.kind !== "notion")].slice(
    0,
    MAX_SOURCES_PER_THREAD,
  );
  const sources: SweepSource[] = [];
  for (const link of chosen) {
    try {
      const source = await deps.sources.read(link.url, link.kind);
      if (source) sources.push(source);
    } catch (err) {
      // A page that failed to read is not a page with nothing on it: the
      // thread is held, like a budget stop, and the failure is counted —
      // unless the service said to slow down, which is the quota's, as a
      // model 429 is.
      rethrowIfBudget(err);
      const why = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `a linked page could not be read (${why})`, counts: !QUOTA.test(why) };
    }
  }
  if (!sources.some((s) => s.writable)) return none;

  const shown = withinThreadBudget(t.humans, root.ts);
  const detected = await deps.detector.detect({
    thread: { channel: t.channel, channelKind: t.channelKind, rootTs: t.rootTs, messages: shown.messages },
    sources,
  });
  if (!detected.ok) {
    return { ok: false, error: `the detector did not answer (${detected.error})`, counts: !QUOTA.test(detected.error) };
  }

  const participants = [...new Set(t.humans.map((m) => m.user))];
  const findings: PendingFinding[] = [];
  let readOnly = 0;
  for (const d of detected.findings) {
    // A target uno-bot cannot write is not carded here; it is counted, and
    // the run's record says how many were left.
    if (!d.source.writable || !d.blockId || !d.lastEditedTime) {
      readOnly += 1;
      continue;
    }
    const claimed = d.claimedBy !== null && participants.includes(d.claimedBy);
    // The linked card's Contributors: the fixed page's own when it is a card,
    // otherwise those of any card the thread links beside it.
    const cardContributors = d.source.contributors.length
      ? d.source.contributors
      : sources.flatMap((s) => s.contributors);
    const named = claimed ? [] : await contributorsOf(deps, cardContributors, t.resolved);
    // In a private place the owner is someone in it: a Contributor outside it
    // could not see the card, and naming them there would reach past it.
    const contributorIds =
      t.channelKind === "public" || !named.length ? named : await inPlace(named, t.membersOf);
    const { owner } = routeOwner({ claimedBy: d.claimedBy, participants, contributorIds, starter: root.user });
    findings.push({
      id: `${t.channel}:${t.rootTs}:${d.blockId}`,
      runDate: t.runDate,
      detectedAt: t.now,
      driftAt: Math.min(...d.evidenceTs.map(msOf)),
      target: {
        url: d.source.url,
        kind: d.source.kind,
        writable: d.source.writable,
        title: d.source.title,
        pillars: d.source.pillars,
      },
      blockId: d.blockId,
      lastEditedTime: d.lastEditedTime,
      original: d.original,
      sourceSays: d.sourceSays,
      threadSays: d.threadSays,
      replacement: d.replacement,
      evidence: { channel: t.channel, channelKind: t.channelKind, threadTs: t.rootTs, messageTs: d.evidenceTs, permalinks: [] },
      owner,
      confidence: d.confidence,
      participants,
    });
  }
  return { ok: true, findings, readOnly, trimmed: shown.trimmed };
}

/** A stop that is a quota's — the model's or a source's — not the thread's:
 *  held, never counted. */
const QUOTA = /\b429\b|quota|rate.?limit|resource.?exhausted/i;

/**
 * The thread as the detector sees it: the root, then the newest replies that
 * fit `MAX_THREAD_CHARS`, in order. Evidence can only cite what was shown.
 */
function withinThreadBudget(messages: SweepMessage[], rootTs: string): { messages: SweepMessage[]; trimmed: number } {
  const size = (m: SweepMessage) => Math.min(m.text.length, MAX_MESSAGE_CHARS) + 40;
  const root = messages.find((m) => m.ts === rootTs);
  let left = MAX_THREAD_CHARS - (root ? size(root) : 0);
  const kept: SweepMessage[] = [];
  for (const m of [...messages].reverse()) {
    if (m === root) continue;
    if (size(m) > left) break;
    left -= size(m);
    kept.unshift(m);
  }
  const shown = root ? [root, ...kept] : kept;
  return { messages: shown, trimmed: messages.length - shown.length };
}

/** The ids that are members of the place, in order. */
async function inPlace(ids: readonly string[], membersOf: () => Promise<ReadonlySet<string>>): Promise<string[]> {
  const members = await membersOf();
  return ids.filter((id) => members.has(id));
}

/** The card's Contributors as Slack ids, each name looked up once per job. */
async function contributorsOf(
  deps: SweepDeps,
  names: readonly string[],
  resolved: Map<string, string | null>,
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    if (!resolved.has(name)) resolved.set(name, await deps.people.slackIdFor(name));
    const id = resolved.get(name);
    if (id) ids.push(id);
  }
  return ids;
}

// ── Morning: card and stage ──────────────────────────────────────────────────

async function postFindings(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
  const startedAt = deps.now();
  const meterStart = readMeter(deps);
  const now = deps.now();
  const postDate = dateOf(now);
  const cards: SweepCardReport[] = [];
  const carded: PendingFinding[] = [];
  const notes: string[] = [];
  const record = (outcome: SweepRunOutcome) =>
    recordRun(deps, {
      runName: "morning",
      jobKey: job.key,
      channels: [...new Set(cards.map((c) => c.channel))],
      threads: cards.length,
      items: carded.length,
      outcome,
      note: notes.length ? notes.join("; ") : null,
      startedAt,
      meterStart,
    });
  const ctx: MorningCtx = { deps, now, cards, carded, notes, permalinks: 0 };

  let due: PendingFinding[] = [];
  try {
    const queued = await deps.store.pendingFindings();
    due = queued.filter((f) => postableAt(f.detectedAt) <= now);
    const open = deps.dryRun ? [] : await deps.store.openItems();

    // First, any card an earlier try recorded and never marked posted: find it
    // by its tag and finish staging it, or release it to be carded again.
    const live = new Set<string>();
    // A finding on a card held unfinished waits with it.
    const held = new Set<string>();
    for (const [cardKey, items] of groupBy(open.filter((i) => i.proposalTs === null), (i) => i.cardKey)) {
      const outcome = await finishUnposted(ctx, cardKey);
      // A card finished, or held for a later try, still occupies its place.
      if (outcome === "live" || outcome === "held") live.add(items[0]!.destination);
      if (outcome === "held") for (const i of items) held.add(i.findingId);
    }
    for (const i of open) {
      if (i.proposalTs !== null && (i.postedAt ?? 0) + SWEEP_CARD_TTL_MS > now) live.add(i.destination);
    }
    for (const place of await placesLiveInThreadState(deps, open, live)) live.add(place);

    const stillDue = due.filter((f) => !carded.some((c) => c.id === f.id) && !held.has(f.id));
    const shadowed = shadowedByPrivate(stillDue, queued);
    if (shadowed.length) {
      notes.push(`${shadowed.length} fix(es) also found in a private place go only on its card`);
      if (!deps.dryRun) await deps.store.removeFindings(shadowed.map((f) => f.id));
    }
    const { fresh, already } = await sortOutCarded(
      deps,
      stillDue.filter((f) => !shadowed.includes(f)),
    );
    if (already.length && !deps.dryRun) await deps.store.removeFindings(already.map((f) => f.id));

    const plans = planSweepCards(fresh, postDate, (where) => live.has(where));
    const waiting = fresh.length - plans.reduce((n, p) => n + p.items.length, 0);
    if (waiting > 0) notes.push(`${waiting} fix(es) wait in the queue for a live card to resolve or for room on a card`);
    for (const plan of plans) await postCard(ctx, plan, postDate);
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      notes.push(`budget stopped it; retried under ${job.key}`);
      await record("deferred").catch(() => undefined);
    }
    throw err;
  }

  await record("handled");
  const note = notes.length ? notes.join("; ") : null;
  const verb = deps.dryRun ? "would post" : "posted";
  const summary =
    due.length || cards.length
      ? `${verb} ${cards.length} card(s) holding ${carded.length} fix(es)${note ? ` — ${note}` : ""}`
      : "nothing due this morning";
  return { kind: "sweep-post", key: job.key, outcome: "handled", note, threads: cards.length, findings: carded, cards, summary };
}

/** One morning's running tally. */
interface MorningCtx {
  deps: SweepDeps;
  now: number;
  cards: SweepCardReport[];
  carded: PendingFinding[];
  notes: string[];
  permalinks: number;
}

/** Post one planned card, stage it, and mark its items posted. */
async function postCard(ctx: MorningCtx, planned: SweepCardPlan, postDate: string): Promise<void> {
  const { deps, now, notes } = ctx;
  const to = resolveDestination(planned.destination, deps.config);
  if (!to) {
    notes.push(`${planned.key}: its channel is not configured`);
    return;
  }
  if (to.channel === deps.config.unoBot) {
    // Unreachable while #uno-bot is never swept; stated so it stays true.
    notes.push(`${planned.key}: not posted in #uno-bot`);
    if (!deps.dryRun) await deps.store.removeFindings(planned.items.map((f) => f.id));
    return;
  }

  // Every fix is shown whole, so a card holds only as many as one Slack
  // message shows in full; the rest wait in the queue. A fix too long to show
  // even alone is not offered.
  const plan = await fitToOneMessage(ctx, planned);
  if (!plan) return;
  const ids = plan.items.map((f) => f.id);

  // Everything the card will send, counted before any of it is: a card that
  // cannot finish does not start, and the job defers instead.
  const posts = 1;
  const links = plan.items.filter((f) => f.evidence.messageTs[0]).length;
  const affordable = Math.min(links, MAX_PERMALINKS - ctx.permalinks);
  if (!deps.dryRun) {
    ensureHeadroom(deps, { subrequests: affordable + posts + CARD_COST.reserveSubrequests, d1Queries: CARD_COST.d1Queries });
  }
  for (const item of plan.items) {
    const first = item.evidence.messageTs[0];
    if (!first || ctx.permalinks >= MAX_PERMALINKS) continue;
    ctx.permalinks += 1;
    const link = await deps.delivery.permalink(item.evidence.channel, first).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (link) item.evidence.permalinks = [link];
  }
  const rendered = deps.delivery.render(sweepCard(plan));
  const report: SweepCardReport = {
    key: plan.key,
    destination: plan.destination,
    channel: to.channel,
    threadTs: to.threadTs,
    items: plan.items.length,
    text: rendered.text,
  };
  if (deps.dryRun) {
    ctx.cards.push(report);
    ctx.carded.push(...plan.items);
    return;
  }

  const digest = operationsDigest(plan.operations);
  await deps.store.saveCard({ key: plan.key, destination: plan.destination, items: plan.items, digest });
  await deps.store.addItems(plan.items.map((f) => itemRecord(f, plan, now)));
  const sent = await deps.delivery.post(to, rendered, { cardKey: plan.key, digest });
  if (!sent.ok || !sent.ts) {
    await release(deps, plan.key);
    notes.push(`${plan.key}: the post failed — kept for tomorrow`);
    return;
  }
  const root = to.threadTs ?? sent.ts;
  const staged = await stageOrWithdraw(ctx, plan, { channel: to.channel, root, ts: sent.ts, text: rendered.text, postDate });
  if (!staged) return;
  await deps.store.removeFindings(ids);
  ctx.cards.push({ ...report, proposalTs: sent.ts });
  ctx.carded.push(...plan.items);
}

/** Slack's limits on one message: its text, and its blocks. */
const ONE_MESSAGE = { chars: 40_000, blocks: 50 };
/** A permalink as long as Slack's, for measuring a card before it has them. */
const PERMALINK_SIZED = "https://plus.slack.com/archives/C0000000000/p0000000000000000";

/**
 * The longest head of the plan whose card Slack shows in one message, whole —
 * no follow-up, no collapsed plan. The fixes cut stay queued; a first fix too
 * long to show alone leaves the queue with a note, since it can never be
 * shown whole.
 */
async function fitToOneMessage(ctx: MorningCtx, plan: SweepCardPlan): Promise<SweepCardPlan | null> {
  const { deps, notes } = ctx;
  const fits = (items: PendingFinding[]): boolean => {
    const measured = items.map((f) => ({ ...f, evidence: { ...f.evidence, permalinks: [PERMALINK_SIZED] } }));
    const card = deps.delivery.render(sweepCard(cardPlan(plan.key, plan.destination, measured)));
    return !card.followUp?.length && card.text.length <= ONE_MESSAGE.chars && card.blocks.length <= ONE_MESSAGE.blocks;
  };
  let n = plan.items.length;
  while (n > 0 && !fits(plan.items.slice(0, n))) n -= 1;
  if (n === 0) {
    const [first] = plan.items;
    notes.push(`${first!.id}: too long to show whole on a card — not offered`);
    if (!deps.dryRun) await deps.store.removeFindings([first!.id]);
    return null;
  }
  if (n < plan.items.length) notes.push(`${plan.key}: ${plan.items.length - n} fix(es) wait for room on a card`);
  return n === plan.items.length ? plan : cardPlan(plan.key, plan.destination, plan.items.slice(0, n));
}

/**
 * Stage a posted card and mark its items posted; when the staging fails
 * outright, edit the card to say so and release its items, which stay queued.
 * A budget stop is rethrown: the next try finds the card by its tag.
 */
async function stageOrWithdraw(
  ctx: MorningCtx,
  plan: SweepCardPlan,
  posted: { channel: string; root: string; ts: string; text: string; postDate: string },
): Promise<boolean> {
  const { deps } = ctx;
  try {
    await deps.delivery.stage(sweepProposal(plan, posted));
  } catch (err) {
    if (isSubrequestBudgetError(err)) throw err;
    const why = err instanceof Error ? err.message : String(err);
    await deps.delivery.withdraw(posted.channel, posted.ts, WITHDRAWN_TEXT, plan.key).catch(rethrowIfBudget);
    await release(deps, plan.key);
    ctx.notes.push(`${plan.key}: posted but not staged (${why}) — withdrawn, kept for tomorrow`);
    return false;
  }
  await deps.store.markPosted(plan.key, posted.ts, ctx.now);
  await deps.store.dropCard(plan.key);
  return true;
}

/** A card that did not go through: its unposted items and its snapshot go;
 *  its findings, still queued, are carded again. */
async function release(deps: SweepDeps, cardKey: string): Promise<void> {
  await deps.store.releaseCard(cardKey);
  await deps.store.dropCard(cardKey);
}

/** What a card that did not go through is edited to say. */
export const WITHDRAWN_TEXT =
  ":warning: This end-of-day sweep card didn't go through, so it can't be confirmed. Its fixes are kept, and come back on a fresh card.";

/**
 * Finish a card an earlier try recorded but never marked posted — only ever
 * from its snapshot, the fixes it showed, and only when the card Slack holds
 * carries the same digest. Otherwise:
 *   • never posted → released, its findings carded afresh;
 *   • posted, but with no snapshot or a digest that differs → withdrawn and
 *     released: staging it would run text nobody was shown;
 *   • not known (a failed read, or too many pages) → held for the next try,
 *     and released once its 72 h would have run out anyway;
 *   • posted and already staged — the earlier try got that far — → recorded
 *     as posted and never staged again: a card someone ✅'d or ⛔'d meanwhile
 *     staged afresh would run, or offer, what was already decided.
 *
 * @returns `live` when it is staged, `held` when it waits, `decided` when it
 *   was staged and has since been resolved, `released`
 */
async function finishUnposted(ctx: MorningCtx, cardKey: string): Promise<"live" | "held" | "decided" | "released"> {
  const { deps, notes, now } = ctx;
  const snapshot = await deps.store.cardSnapshot(cardKey);
  const destination = snapshot?.destination ?? null;
  const to = destination ? resolveDestination(destination, deps.config) : null;
  if (!snapshot || !to) {
    // Nothing to stage from, so nothing is staged; the fixes, still queued,
    // go out on a fresh card.
    await release(deps, cardKey);
    notes.push(`${cardKey}: recorded without a snapshot — released`);
    return "released";
  }
  const plan = cardPlan(cardKey, snapshot.destination, snapshot.items);
  if (operationsDigest(plan.operations) !== snapshot.digest) {
    await release(deps, cardKey);
    notes.push(`${cardKey}: its snapshot does not match its digest — released`);
    return "released";
  }
  ensureHeadroom(deps, { subrequests: FIND_POSTED_PAGES + CARD_COST.reserveSubrequests, d1Queries: CARD_COST.d1Queries });
  const postDate = cardKey.slice(0, 10);
  const posted = await deps.delivery.findPosted(to, cardKey, tsOf(Date.parse(`${postDate}T00:00:00Z`)));
  if (posted.state === "unknown") {
    if (now > Date.parse(`${postDate}T00:00:00Z`) + SWEEP_CARD_TTL_MS) {
      await release(deps, cardKey);
      notes.push(`${cardKey}: still not found after its 72 h (${posted.why}) — released`);
      return "released";
    }
    notes.push(`${cardKey}: could not tell whether it went up (${posted.why}) — held for the next try`);
    return "held";
  }
  if (posted.state === "absent") {
    await release(deps, cardKey);
    return "released";
  }
  if (posted.digest !== snapshot.digest) {
    await deps.delivery.withdraw(to.channel, posted.ts, WITHDRAWN_TEXT, cardKey).catch(rethrowIfBudget);
    await release(deps, cardKey);
    notes.push(`${cardKey}: the posted card shows other fixes than its snapshot — withdrawn`);
    return "released";
  }
  let state: SweepCardState;
  try {
    state = await deps.delivery.cardState(posted.ts);
  } catch (err) {
    rethrowIfBudget(err);
    notes.push(`${cardKey}: could not tell whether it was already staged (${err instanceof Error ? err.message : String(err)}) — held for the next try`);
    return "held";
  }
  if (state.state !== "unstaged") {
    // Staged by the earlier try: record it as posted when it went up, so its
    // deadline is the card's own, and stage nothing.
    const postedAt = msOf(posted.ts);
    await deps.store.markPosted(cardKey, posted.ts, Number.isFinite(postedAt) ? postedAt : now);
    await deps.store.dropCard(cardKey);
    await deps.store.removeFindings(plan.items.map((f) => f.id));
    if (state.state === "live") {
      notes.push(`${cardKey}: already staged by an earlier try — recorded, not staged again`);
      ctx.carded.push(...plan.items);
      return "live";
    }
    // Resolved meanwhile, while its items had no card ts to be found by: they
    // take what the card came to now, rather than sit at proposed.
    if (state.items) {
      for (const item of await deps.store.itemsForProposal(posted.ts)) {
        if (item.status === "proposed") await deps.store.updateItem(item.itemId, { status: state.items, resolvedAt: now });
      }
    }
    notes.push(`${cardKey}: already staged by an earlier try, and resolved since — recorded, not staged again`);
    return "decided";
  }
  const staged = await stageOrWithdraw(ctx, plan, {
    channel: to.channel,
    root: to.threadTs ?? posted.ts,
    ts: posted.ts,
    text: posted.text,
    postDate,
  });
  if (!staged) return "released";
  // A later night may have queued the same finding again, re-read; it is
  // carded now, as it was shown.
  await deps.store.removeFindings(plan.items.map((f) => f.id));
  notes.push(`${cardKey}: finished staging a card an earlier try posted`);
  ctx.cards.push({
    key: cardKey,
    destination: plan.destination,
    channel: to.channel,
    threadTs: to.threadTs,
    items: plan.items.length,
    text: posted.text,
    proposalTs: posted.ts,
  });
  ctx.carded.push(...plan.items);
  return "live";
}

/** One fix, wherever it was found: the page and the block it rewrites. */
function fixKey(f: Pick<PendingFinding, "target" | "blockId">): string {
  return `${f.target.url}#${f.blockId ?? ""}`;
}

/**
 * The public findings whose fix the queue also holds from a private channel,
 * a group DM or a DM. Evidence that spans both is private (ADR-031): the fix
 * goes only on the private card, and the public copy is never carded — a
 * public card would show a change only the private place could see.
 *
 * @param due - This morning's findings
 * @param queued - Every finding in the queue, due or not
 */
export function shadowedByPrivate(due: readonly PendingFinding[], queued: readonly PendingFinding[]): PendingFinding[] {
  const privateFixes = new Set(queued.filter((f) => f.evidence.channelKind !== "public").map(fixKey));
  return due.filter((f) => f.evidence.channelKind === "public" && privateFixes.has(fixKey(f)));
}

/** An item in one of these states means the thread has had this fix. */
const CARDED: readonly SweepItemStatus[] = ["proposed", "dropped", "confirmed", "refused_unwritable"];

/**
 * Split the due findings into those still to card and those already carded
 * — proposed, dropped or applied. One read for all of them.
 */
async function sortOutCarded(
  deps: SweepDeps,
  due: PendingFinding[],
): Promise<{ fresh: PendingFinding[]; already: PendingFinding[] }> {
  if (!due.length) return { fresh: [], already: [] };
  const had = new Set(
    (await deps.store.itemsForFindings(due.map((f) => f.id)))
      .filter((i) => CARDED.includes(i.status))
      .map((i) => i.findingId),
  );
  return { fresh: due.filter((f) => !had.has(f.id)), already: due.filter((f) => had.has(f.id)) };
}

/**
 * Stage a sweep card the Worker posted, and put it on the usage record like
 * any card: a staged row (via the Worker, in the channel it posted to), and a
 * superseded row for any card the staging retired. Its later ✅ or ⛔ pairs
 * with that staged row.
 *
 * A thread the bot had no history in is marked as entered through the card
 * (`thread-mark.ts`), so what the bot posts there answering the card never
 * makes the team's later replies its conversation. Best-effort: an unmarked
 * thread reads by the ordinary rules.
 */
export async function stageSweepCard(
  proposal: PendingProposal,
  deps: {
    threadState: Pick<ThreadState, "putProposal" | "readHistory">;
    proposalEvents: ProposalEventLog;
    markThread?: (channel: string, thread: string) => Promise<void>;
  },
  now: number,
): Promise<void> {
  if (deps.markThread) {
    const ref = { channel: proposal.channel, thread: proposal.threadTs };
    try {
      if (!(await deps.threadState.readHistory(ref)).length) await deps.markThread(ref.channel, ref.thread);
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[sweep] thread ${ref.channel}:${ref.thread} not marked: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const { retired } = await deps.threadState.putProposal(proposal);
  await recordProposalEvents(deps.proposalEvents, [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
  ]);
}

/**
 * The places whose card the records call lapsed but ThreadState still holds
 * live: a revision or a re-staged card whose record never landed. A card
 * lives in its place's reply thread — a thread place's own thread, or the
 * first card's thread for one posted at a channel's top — so any live sweep
 * card in that thread occupies the place. A failed read leaves the records'
 * answer standing.
 */
async function placesLiveInThreadState(
  deps: SweepDeps,
  open: readonly SweepItemRecord[],
  live: ReadonlySet<string>,
): Promise<string[]> {
  const lapsed = open.filter((i) => i.proposalTs !== null && !live.has(i.destination));
  if (!lapsed.length) return [];
  const byChannel = new Map<string, PendingProposal[]>();
  const cardsIn = async (channel: string): Promise<PendingProposal[]> => {
    if (!byChannel.has(channel)) {
      try {
        byChannel.set(channel, await deps.delivery.liveCards(channel));
      } catch (err) {
        rethrowIfBudget(err);
        console.warn(`[sweep] live cards in ${channel} unread: ${err instanceof Error ? err.message : String(err)}`);
        byChannel.set(channel, []);
      }
    }
    return byChannel.get(channel)!;
  };
  const places: string[] = [];
  for (const item of lapsed) {
    const place = placeOf(item.destination, deps.config);
    if (!place) continue;
    const threads = new Set([item.proposalTs!, ...(place.threadTs ? [place.threadTs] : [])]);
    const cards = await cardsIn(place.channel);
    if (cards.some((c) => threads.has(proposalReplyThread(c)) || threads.has(c.proposalTs))) places.push(item.destination);
  }
  return places;
}

/** A place's channel and thread, back from its key (`destinationKey`). */
function placeOf(key: string, config: SweepConfig): { channel: string; threadTs: string | null } | null {
  if (key === "plus-design") return config.plusDesign ? { channel: config.plusDesign, threadTs: null } : null;
  if (key === "plus-universal") return config.plusUniversal ? { channel: config.plusUniversal, threadTs: null } : null;
  const [channel, threadTs] = key.split(":");
  return channel ? { channel, threadTs: threadTs || null } : null;
}

/** What a posted card came to, for a retry that finds it already staged. */
export type SweepCardState =
  | { state: "live" }
  /** `items` is what its still-proposed items come to; null when the record
   *  says it was claimed but not whether it ran. */
  | { state: "decided"; items: SweepItemStatus | null }
  | { state: "unstaged" };

/**
 * Whether a posted card was ever staged, from what ThreadState and the usage
 * record hold (`SweepDelivery.cardState`): live while ThreadState holds it;
 * decided once it is revised or aged out, or gone from ThreadState with any
 * row on the record — its staged row, or the ✅ or ⛔ that claimed it. A ⛔,
 * a revision or an expiry drops its items; a ✅ confirms them, or records
 * them refused when a write found its block moved.
 */
export async function sweepCardState(
  proposalTs: string,
  deps: { threadState: Pick<ThreadState, "getProposalByTs">; proposalEvents: Pick<ProposalEventLog, "eventsOf"> },
): Promise<SweepCardState> {
  const lookup = await deps.threadState.getProposalByTs(proposalTs);
  if (lookup.state === "found") return { state: "live" };
  if (lookup.state !== "none") return { state: "decided", items: "dropped" };
  const events = new Set((await deps.proposalEvents.eventsOf(proposalTs)).map((e) => e.event));
  if (!events.size) return { state: "unstaged" };
  if (events.has("refused_stale")) return { state: "decided", items: "refused_stale" };
  if (events.has("confirmed")) return { state: "decided", items: "confirmed" };
  if (events.has("cancelled") || events.has("superseded") || events.has("expired")) return { state: "decided", items: "dropped" };
  return { state: "decided", items: null };
}

/** The card as ThreadState stages it: no Turn behind it, its own terms. */
export function sweepProposal(
  plan: SweepCardPlan,
  posted: { channel: string; root: string; ts: string; text: string; postDate: string },
): PendingProposal {
  const first = plan.operations[0]!;
  const share = sweepShareOf(plan.items);
  return {
    operations: plan.operations,
    toolName: first.toolName,
    input: first.input,
    channel: posted.channel,
    threadTs: posted.root,
    replyTs: posted.root,
    userMsgTs: posted.root,
    proposalTs: posted.ts,
    proposalText: posted.text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: SWEEP_CARD_TTL_MS,
    confirmers: [...plan.confirmers],
    sweepRun: posted.postDate,
    // Its own slot in the thread, beside any turn's card (`proposalSlot`).
    supersedeKey: SWEEP_KEY,
    // A group DM's card: what its ✅ shares, as the card said (`./share.ts`).
    ...(share ? { sweepShare: share } : {}),
  };
}

/** One item, recorded before its card posts: no ts, not yet posted. */
function itemRecord(f: PendingFinding, plan: SweepCardPlan, now: number): SweepItemRecord {
  return {
    itemId: `${plan.key}#${f.blockId}`,
    findingId: f.id,
    destination: destinationKey(plan.destination),
    runDate: f.runDate,
    channel: f.evidence.channel,
    threadTs: f.evidence.threadTs ?? "",
    // Carded findings always name a block (`planSweepCards`).
    blockId: f.blockId!,
    ownerId: f.owner,
    status: "proposed",
    cardKey: plan.key,
    proposalTs: null,
    driftAt: f.driftAt,
    detectedAt: f.detectedAt,
    postedAt: null,
    resolvedAt: null,
  };
}

function groupBy<T>(list: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of list) out.set(keyOf(item), [...(out.get(keyOf(item)) ?? []), item]);
  return out;
}

function plannedCards(deps: SweepDeps, findings: PendingFinding[], postDate: string): SweepCardReport[] {
  return planSweepCards(findings, postDate).flatMap((plan) => {
    const to = resolveDestination(plan.destination, deps.config);
    if (!to) return [];
    return [
      {
        key: plan.key,
        destination: plan.destination,
        channel: to.channel,
        threadTs: to.threadTs,
        items: plan.items.length,
        text: deps.delivery.render(sweepCard(plan)).text,
      },
    ];
  });
}

// ── Shared ───────────────────────────────────────────────────────────────────

async function recordRun(
  deps: SweepDeps,
  r: Omit<SweepRunRecord, "runId" | "runDate" | "subrequests" | "d1Queries" | "finishedAt"> & {
    meterStart: { subrequests: number; d1Queries: number };
  },
): Promise<void> {
  if (deps.dryRun) return;
  const runDate = dateOf(r.startedAt);
  const spent = readMeter(deps);
  const { meterStart, ...rest } = r;
  await deps.store.recordRun({
    ...rest,
    runId: `${runDate}:${r.jobKey}`,
    runDate,
    subrequests: spent.subrequests - meterStart.subrequests,
    // The write itself is one more query.
    d1Queries: spent.d1Queries - meterStart.d1Queries + 1,
    finishedAt: deps.now(),
  });
}

function readMeter(deps: SweepDeps): { subrequests: number; d1Queries: number } {
  return { subrequests: deps.meter?.subrequests() ?? 0, d1Queries: deps.meter?.d1Queries() ?? 0 };
}

/**
 * Stop, as the budget does, unless what is left covers a step that must not
 * start without finishing.
 */
function ensureHeadroom(deps: SweepDeps, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}

function isHuman(m: SweepSlackMessage, botUserId: string | null | undefined): boolean {
  if (m.bot_id || !m.user || m.user === botUserId) return false;
  return !m.subtype || m.subtype === "thread_broadcast";
}

function toSweepMessage(m: SweepSlackMessage): SweepMessage {
  return { ts: m.ts, user: m.user ?? "", text: m.text ?? "" };
}

/** A Slack ts as epoch ms. */
function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}

/** Epoch ms as a Slack-shaped ts. */
function tsOf(ms: number): string {
  return (ms / 1000).toFixed(6);
}

function dateOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
