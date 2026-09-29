// `runSweepJob(job, deps)` — the end-of-day sweep, one scheduled job at a time.
//
// TWO JOB KINDS, one module:
//
//   `sweep-channel` (end of day, one per channel on `SWEEP_CHANNELS`) reads the
//   channel since its cursor with the bot token — `conversations.history` in
//   pages of 200, plus the replies of every thread active since then — follows
//   the links each thread carries through the existing source reads, asks the
//   detector, routes each finding to its owner, and queues it for the morning.
//   It posts nothing.
//
//   `sweep-post` (the weekday morning run) takes the findings whose morning has
//   come (`postableAt`), groups them by destination (`pickDestination`), and
//   stages the proposal cards (`planSweepCards`) the way the Figma library post
//   stages without a Turn: post the card, then `putProposal` with its own TTL
//   and confirmer set. A quiet day posts nothing.
//
// THE AUDIENCE RULE. A finding only reaches people who could already see its
// evidence. In this job every finding comes from a public channel and is
// posted in its own thread; a private channel on the list is skipped, a DM or
// group DM is never read, and #uno-bot is never swept and never posted in.
//
// THE BUDGET. Each alarm runs one job on a fresh subrequest budget, under the
// lookup ceiling (ADR-022). A channel's threads are processed oldest activity
// first and the cursor is saved after each one, so a budget stop keeps every
// thread already done: the job records where it stopped and rethrows the stop,
// and the runner keeps the job under its key and runs it again on a fresh
// budget (`runner/queue.ts`). A retried job is idempotent — the cursor skips
// what is done, the queue replaces a finding by its id, and a card whose items
// are already recorded is not posted twice. One window stays open: a stop
// between a card's post and the record of its items (a D1 cap, since the post
// is the last external call) posts that card again on the retry.
//
// A FIX IS PROPOSED ONCE. A reply under a card is activity past the cursor, so
// the next night re-reads the thread and the detector may find the same drift
// again. The morning skips any fix the thread has already had carded —
// proposed, dropped or applied — and numbers a new card's slot after the
// thread's existing cards, so it never retires a card still live.
//
// Every dependency is injected — the Slack reads, the source reads, the people
// lookup, the detector, the store, the delivery and the clock — so the Node
// suite runs whole days against fakes (tests/sweep-run.test.ts). `Env` enters
// in `./env.ts`.

import { isSubrequestBudgetError } from "../net";
import type { HistoryMessage } from "../slack/api";
import type { PendingProposal } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { ScheduledJob } from "../scheduled/runs";
import { destinationKey, planSweepCards, sweepCard, SWEEP_CARD_TTL_MS, type SweepCardPlan } from "./cards";
import type { DriftDetector } from "./detector";
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
/** Sources followed per thread, Notion first. */
export const MAX_SOURCES_PER_THREAD = 3;
/** Permalinks fetched per morning job — one per item, best-effort. */
export const MAX_PERMALINKS = 20;

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
  /** A thread, root first, or null. */
  replies(channel: string, rootTs: string): Promise<SweepSlackMessage[] | null>;
}

/** A card as Slack will post it. */
export interface RenderedSweepCard {
  text: string;
  blocks: unknown[];
  /** Posted before the card, so its buttons stay last in the thread. */
  followUp?: string[];
}

/** Posting and staging, and the one read the morning needs. */
export interface SweepDelivery {
  render(card: ProposalCard): RenderedSweepCard;
  post(to: { channel: string; threadTs: string | null }, card: RenderedSweepCard): Promise<{ ok: boolean; ts?: string }>;
  /** Stage the card, as a turn's staging does. */
  stage(proposal: PendingProposal): Promise<void>;
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
  /** The invocation's meter, for the run record. Zeros without one. */
  meter?: { subrequests(): number; d1Queries(): number };
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
  kind: "sweep-channel" | "sweep-post";
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
  return sweepChannel(job, deps);
}

// ── End of day: read, detect, queue ──────────────────────────────────────────

async function sweepChannel(job: ScheduledJob, deps: SweepDeps): Promise<SweepJobReport> {
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
  if (kind === "dm" || kind === "group-dm") return finish("skipped", "DMs and group DMs are never read", 0, []);
  if (kind === "private") return finish("skipped", "private channels are not swept yet", 0, []);

  const now = deps.now();
  const cursor = (await deps.store.cursor(channel)) ?? tsOf(now - FIRST_SWEEP_WINDOW_MS);
  const oldest = tsOf(msOf(cursor) - ACTIVE_THREAD_LOOKBACK_MS);
  const runDate = dateOf(now);
  const kept: PendingFinding[] = [];
  let threads = 0;
  let readOnly = 0;
  let reached = cursor;
  const resolved = new Map<string, string | null>();

  try {
    const units = await activeThreads(deps, channel, oldest, cursor);
    for (const unit of units) {
      const messages = unit.replies ? await deps.slack.replies(channel, unit.root.ts) : [unit.root];
      if (!messages) {
        return finish("handled", `stopped at ${reached}: a thread's replies could not be read`, threads, kept);
      }
      const humans = messages.filter((m) => isHuman(m, deps.config.botUserId)).map(toSweepMessage);
      threads += 1;
      const found = await sweepThread(deps, { channel, rootTs: unit.root.ts, humans, runDate, now, resolved });
      if (!found.ok) {
        return finish("handled", `stopped at ${reached}: the detector did not answer (${found.error})`, threads, kept);
      }
      kept.push(...found.findings);
      readOnly += found.readOnly;
      if (!deps.dryRun) {
        if (found.findings.length) await deps.store.addFindings(found.findings);
        await deps.store.saveCursor(channel, unit.activity, deps.now());
      }
      reached = unit.activity;
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
  const note = readOnly ? `${readOnly} finding(s) on targets uno-bot cannot write were left alone` : null;
  return finish("handled", note, threads, kept, cards);
}

/** A thread with activity since the cursor, and when it was last active. */
interface ActiveThread {
  root: SweepSlackMessage;
  replies: boolean;
  activity: string;
}

/** The channel's threads active since the cursor, oldest activity first. */
async function activeThreads(deps: SweepDeps, channel: string, oldest: string, cursor: string): Promise<ActiveThread[]> {
  const units: ActiveThread[] = [];
  let page: string | undefined;
  for (let i = 0; i < MAX_HISTORY_PAGES; i++) {
    const res = await deps.slack.history(channel, oldest, page);
    if (!res) break;
    for (const m of res.messages) {
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
  return units.sort((a, b) => msOf(a.activity) - msOf(b.activity));
}

/** One thread: its links read, its drift detected and routed. */
async function sweepThread(
  deps: SweepDeps,
  t: {
    channel: string;
    rootTs: string;
    humans: SweepMessage[];
    runDate: string;
    now: number;
    resolved: Map<string, string | null>;
  },
): Promise<{ ok: true; findings: PendingFinding[]; readOnly: number } | { ok: false; error: string }> {
  const none = { ok: true as const, findings: [], readOnly: 0 };
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
    const source = await deps.sources.read(link.url, link.kind);
    if (source) sources.push(source);
  }
  if (!sources.some((s) => s.writable)) return none;

  const detected = await deps.detector.detect({
    thread: { channel: t.channel, channelKind: "public", rootTs: t.rootTs, messages: t.humans },
    sources,
  });
  if (!detected.ok) return detected;

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
    const contributorIds = claimed ? [] : await contributorsOf(deps, cardContributors, t.resolved);
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
      sourceSays: d.sourceSays,
      threadSays: d.threadSays,
      replacement: d.replacement,
      evidence: { channel: t.channel, channelKind: "public", threadTs: t.rootTs, messageTs: d.evidenceTs, permalinks: [] },
      owner,
      confidence: d.confidence,
      participants,
    });
  }
  return { ok: true, findings, readOnly };
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

  let due: PendingFinding[] = [];
  try {
    due = (await deps.store.pendingFindings()).filter((f) => postableAt(f.detectedAt) <= now);
    const { fresh, already, slotsTaken } = await sortOutCarded(deps, due);
    if (already.length && !deps.dryRun) await deps.store.removeFindings(already.map((f) => f.id));
    let permalinks = 0;

    for (const plan of planSweepCards(fresh, postDate, slotsTaken)) {
      const to = resolveDestination(plan.destination, deps.config);
      const ids = plan.items.map((f) => f.id);
      if (!to) {
        notes.push(`${plan.key}: its channel is not configured`);
        continue;
      }
      if (to.channel === deps.config.unoBot) {
        // Unreachable while #uno-bot is never swept; stated so it stays true.
        notes.push(`${plan.key}: not posted in #uno-bot`);
        if (!deps.dryRun) await deps.store.removeFindings(ids);
        continue;
      }
      if (!deps.dryRun && (await deps.store.itemsOnCard(plan.key)).length) {
        // Posted by an earlier try of this job: finish its bookkeeping only.
        await deps.store.removeFindings(ids);
        continue;
      }
      for (const item of plan.items) {
        const first = item.evidence.messageTs[0];
        if (!first || permalinks >= MAX_PERMALINKS) continue;
        permalinks += 1;
        const link = await deps.delivery.permalink(item.evidence.channel, first).catch(() => null);
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
        cards.push(report);
        carded.push(...plan.items);
        continue;
      }
      const sent = await deps.delivery.post(to, rendered);
      if (!sent.ok || !sent.ts) {
        notes.push(`${plan.key}: the post failed — kept for tomorrow`);
        continue;
      }
      const root = to.threadTs ?? sent.ts;
      // Recorded first, straight after the post, so a stop anywhere later
      // cannot make the retry post this card again.
      await deps.store.addItems(plan.items.map((f) => itemRecord(f, plan, { root, proposalTs: sent.ts!, now })));
      try {
        await deps.delivery.stage(sweepProposal(plan, { channel: to.channel, root, ts: sent.ts, text: rendered.text, postDate }));
      } catch (err) {
        if (isSubrequestBudgetError(err)) throw err;
        // The card is up; posting it again tomorrow would make two. A ✅ on it
        // says it was already resolved, which is where a person asks.
        notes.push(`${plan.key}: posted but not staged (${err instanceof Error ? err.message : String(err)})`);
      }
      await deps.store.removeFindings(ids);
      cards.push({ ...report, proposalTs: sent.ts });
      carded.push(...plan.items);
    }
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
  const summary = due.length
    ? `${verb} ${cards.length} card(s) holding ${carded.length} fix(es)${note ? ` — ${note}` : ""}`
    : "nothing due this morning";
  return { kind: "sweep-post", key: job.key, outcome: "handled", note, threads: cards.length, findings: carded, cards, summary };
}

/** An item in one of these states means the thread has had this fix. */
const CARDED: readonly SweepItemStatus[] = ["proposed", "dropped", "confirmed"];

/**
 * Split the due findings into those still to card and those a thread has
 * already had carded, and count each thread's existing cards so a new one
 * takes the next slot. One read per thread.
 */
async function sortOutCarded(
  deps: SweepDeps,
  due: PendingFinding[],
): Promise<{ fresh: PendingFinding[]; already: PendingFinding[]; slotsTaken: (where: string) => number }> {
  const byThread = new Map<string, SweepItemRecord[]>();
  const fresh: PendingFinding[] = [];
  const already: PendingFinding[] = [];
  for (const f of due) {
    const threadTs = f.evidence.threadTs;
    if (!threadTs) {
      fresh.push(f);
      continue;
    }
    const where = destinationKey(pickDestination(f));
    if (!byThread.has(where)) byThread.set(where, await deps.store.itemsInThread(f.evidence.channel, threadTs));
    const had = byThread.get(where)!.some((i) => i.blockId === f.blockId && CARDED.includes(i.status));
    (had ? already : fresh).push(f);
  }
  return {
    fresh,
    already,
    slotsTaken: (where) => new Set((byThread.get(where) ?? []).map((i) => i.cardKey)).size,
  };
}

/** The card as ThreadState stages it: no Turn behind it, its own terms. */
export function sweepProposal(
  plan: SweepCardPlan,
  posted: { channel: string; root: string; ts: string; text: string; postDate: string },
): PendingProposal {
  const first = plan.operations[0]!;
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
    slot: plan.slot,
    sweepRun: posted.postDate,
  };
}

function itemRecord(
  f: PendingFinding,
  plan: SweepCardPlan,
  posted: { root: string; proposalTs: string; now: number },
): SweepItemRecord {
  return {
    itemId: `${plan.key}#${f.blockId}`,
    runDate: f.runDate,
    channel: f.evidence.channel,
    threadTs: f.evidence.threadTs ?? posted.root,
    targetUrl: f.target.url,
    // Carded findings always name a block (`planSweepCards`).
    blockId: f.blockId!,
    ownerId: f.owner,
    status: "proposed",
    cardKey: plan.key,
    proposalTs: posted.proposalTs,
    driftAt: f.driftAt,
    detectedAt: f.detectedAt,
    postedAt: posted.now,
    resolvedAt: null,
  };
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
