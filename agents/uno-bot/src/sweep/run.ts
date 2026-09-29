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
//   and confirmer set. One live card per place: a place whose card is still
//   live gets none, and what does not fit waits in the queue. A quiet day
//   posts nothing.
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
import type { PendingProposal } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { ScheduledJob } from "../scheduled/runs";
import { cardPlan, destinationKey, planSweepCards, sweepCard, SWEEP_CARD_TTL_MS, type SweepCardPlan } from "./cards";
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
/** `conversations.replies` pages of 200 read per thread; a longer thread is
 *  left unread, with a note. */
export const MAX_REPLY_PAGES = 5;
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

/** Posting and staging, and the reads the morning needs. */
export interface SweepDelivery {
  render(card: ProposalCard): RenderedSweepCard;
  /** Post the card — and any follow-up before it — tagged with its key
   *  (`SWEEP_CARD_EVENT`). */
  post(to: CardPlace, card: RenderedSweepCard, cardKey: string): Promise<{ ok: boolean; ts?: string }>;
  /** The card already posted under this key, by its tag, or null. `since`
   *  bounds a channel-top search. */
  findPosted(to: CardPlace, cardKey: string, since: string): Promise<{ ts: string; text: string } | null>;
  /** Stage the card, as a turn's staging does. */
  stage(proposal: PendingProposal): Promise<void>;
  /** Replace a posted card's text, remove its buttons, and retag it so a
   *  later search by its key passes it over. */
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
  const notes: string[] = [];
  const resolved = new Map<string, string | null>();

  try {
    const { units, readTo } = await activeThreads(deps, channel, oldest, cursor);
    if (readTo) notes.push(`history ran past ${MAX_HISTORY_PAGES} pages; the cursor stays at or before ${readTo}`);
    for (const unit of units) {
      const messages = unit.replies ? await readThread(deps, channel, unit.root.ts) : [unit.root];
      if (!messages) {
        return finish("handled", `stopped at ${reached}: a thread's replies could not be read`, threads, kept);
      }
      if (messages !== "too-long") {
        const humans = messages.filter((m) => isHuman(m, deps.config.botUserId)).map(toSweepMessage);
        threads += 1;
        const found = await sweepThread(deps, { channel, rootTs: unit.root.ts, humans, runDate, now, resolved });
        if (!found.ok) {
          return finish("handled", `stopped at ${reached}: the detector did not answer (${found.error})`, threads, kept);
        }
        kept.push(...found.findings);
        readOnly += found.readOnly;
        if (!deps.dryRun && found.findings.length) await deps.store.addFindings(found.findings);
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
      original: d.original,
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
  const ctx: MorningCtx = { deps, now, cards, carded, notes, permalinks: 0 };

  let due: PendingFinding[] = [];
  try {
    const queued = await deps.store.pendingFindings();
    due = queued.filter((f) => postableAt(f.detectedAt) <= now);
    const open = deps.dryRun ? [] : await deps.store.openItems();

    // First, any card an earlier try recorded and never marked posted: find it
    // by its tag and finish staging it, or release it to be carded again.
    const live = new Set<string>();
    for (const [cardKey, items] of groupBy(open.filter((i) => i.proposalTs === null), (i) => i.cardKey)) {
      if (await finishUnposted(ctx, cardKey, items, queued)) live.add(items[0]!.destination);
    }
    for (const i of open) {
      if (i.proposalTs !== null && (i.postedAt ?? 0) + SWEEP_CARD_TTL_MS > now) live.add(i.destination);
    }

    const stillDue = due.filter((f) => !carded.some((c) => c.id === f.id));
    const { fresh, already } = await sortOutCarded(deps, stillDue);
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
async function postCard(ctx: MorningCtx, plan: SweepCardPlan, postDate: string): Promise<void> {
  const { deps, now, notes } = ctx;
  const to = resolveDestination(plan.destination, deps.config);
  const ids = plan.items.map((f) => f.id);
  if (!to) {
    notes.push(`${plan.key}: its channel is not configured`);
    return;
  }
  if (to.channel === deps.config.unoBot) {
    // Unreachable while #uno-bot is never swept; stated so it stays true.
    notes.push(`${plan.key}: not posted in #uno-bot`);
    if (!deps.dryRun) await deps.store.removeFindings(ids);
    return;
  }

  // Everything the card will send, counted before any of it is: a card that
  // cannot finish does not start, and the job defers instead.
  const posts = (deps.delivery.render(sweepCard(plan)).followUp?.length ?? 0) + 1;
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

  await deps.store.addItems(plan.items.map((f) => itemRecord(f, plan, now)));
  const sent = await deps.delivery.post(to, rendered, plan.key);
  if (!sent.ok || !sent.ts) {
    await deps.store.releaseCard(plan.key);
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
    await deps.store.releaseCard(plan.key);
    ctx.notes.push(`${plan.key}: posted but not staged (${why}) — withdrawn, kept for tomorrow`);
    return false;
  }
  await deps.store.markPosted(plan.key, posted.ts, ctx.now);
  return true;
}

/** What a card that did not go through is edited to say. */
export const WITHDRAWN_TEXT =
  ":warning: This end-of-day sweep card didn't go through, so it can't be confirmed. Its fixes are kept, and come back on a fresh card.";

/**
 * Finish a card an earlier try recorded but never marked posted. Rebuilt from
 * its queued findings and found in Slack by its tag, it is staged; never
 * posted, it is released and its findings are carded as if new.
 *
 * @returns Whether the card is now live
 */
async function finishUnposted(
  ctx: MorningCtx,
  cardKey: string,
  items: SweepItemRecord[],
  queued: PendingFinding[],
): Promise<boolean> {
  const { deps, notes } = ctx;
  const byId = new Map(queued.map((f) => [f.id, f] as const));
  const findings = items.map((i) => byId.get(i.findingId)).filter((f): f is PendingFinding => !!f);
  const whole = findings.length === items.length && findings.length > 0;
  const destination = whole ? pickDestination(findings[0]!) : null;
  const to = destination ? resolveDestination(destination, deps.config) : null;
  if (!whole || !destination || !to) {
    await deps.store.releaseCard(cardKey);
    notes.push(`${cardKey}: recorded but its findings are gone — released`);
    return false;
  }
  ensureHeadroom(deps, { subrequests: 1 + CARD_COST.reserveSubrequests, d1Queries: CARD_COST.d1Queries });
  const postDate = cardKey.slice(0, 10);
  const found = await deps.delivery.findPosted(to, cardKey, tsOf(Date.parse(`${postDate}T00:00:00Z`)));
  if (!found) {
    await deps.store.releaseCard(cardKey);
    return false;
  }
  const ordered = [...findings].sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
  const plan = cardPlan(cardKey, destination, ordered);
  const staged = await stageOrWithdraw(ctx, plan, {
    channel: to.channel,
    root: to.threadTs ?? found.ts,
    ts: found.ts,
    text: found.text,
    postDate,
  });
  if (!staged) return false;
  await deps.store.removeFindings(ordered.map((f) => f.id));
  notes.push(`${cardKey}: finished staging a card an earlier try posted`);
  ctx.cards.push({
    key: cardKey,
    destination,
    channel: to.channel,
    threadTs: to.threadTs,
    items: ordered.length,
    text: found.text,
    proposalTs: found.ts,
  });
  ctx.carded.push(...ordered);
  return true;
}

/** An item in one of these states means the thread has had this fix. */
const CARDED: readonly SweepItemStatus[] = ["proposed", "dropped", "confirmed"];

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
    sweepRun: posted.postDate,
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
    targetUrl: f.target.url,
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
