// `runDriftAsks` — the morning's `figma-drift-post` job — and
// `answerDriftAsk`, the "yes, it's up to date" reply that withdraws a card.
//
// THE MORNING. The end-of-day sweep queued each file drift it found
// (`sweep/run.ts` → `FileDriftSink`). At the next weekday morning run
// (`postableAt`), the findings are grouped by file (`askGroupOf`): ONE INTAKE
// PER FILE, ONE ASK PER THREAD THAT DISCUSSED IT.
//   • The thread whose drift came first gets the card: the question — "you
//     talked about <file> — is the Figma up to date?" — and the drafted intake
//     behind it, staged in its own slot (`DRIFT_KEY`) so a sweep card or a
//     turn's card in the same thread stays live beside it. Its confirmers are
//     the owners plus everyone who posted in the threads it asks; it lives 72 h,
//     with no re-ping.
//   • Every other thread that discussed the file gets the question alone,
//     pointing at the card. The question is a notification, not a write, so it
//     is not gated; filing the intake is.
//   • While a file's card is live, a later thread about it gets the question
//     alone too, so a file is never filed twice.
// Each ask is posted where `pickDestination` puts it — its own thread, or the
// private place its evidence is in — and never in #uno-bot.
//
// THE YES. A reply in an asked thread that says the file is current
// (`isUpToDateReply`), from someone who may decide the card, withdraws it:
// retired in ThreadState so no ✅ can file it, edited to say why, and recorded
// on the usage record as cancelled by that person. It does not wait out its
// 72 h.
//
// A POSTED CARD IS STAGED OR WITHDRAWN. The file's intake mark is written
// before the post, so a retried morning never posts a second card for it; a
// post that fails clears the mark and keeps the findings, and a staging that
// fails edits the card to say so, clears the mark and keeps them too.
//
// Named dependencies; `Env` enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import { proposalReplyThread, mayConfirm, type PendingProposal } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { ChannelKind } from "../sweep/finding";
import { pickDestination, resolveDestination, type TeamChannels } from "../sweep/finding";
import { postableAt } from "../sweep/schedule";
import {
  askLine,
  cardTerms,
  DRIFT_CARD_TTL_MS,
  DRIFT_NOT_STAGED_TEXT,
  isUpToDateReply,
  mentionsOf,
  pillarNote,
  pingText,
  publisherLine,
  saidLines,
  withdrawnElsewhereText,
  withdrawnText,
} from "./copy";
import { draftIntake, matchPillar, pillarCandidates } from "./draft";
import { askGroupOf, DRIFT_KEY, type FileDriftFinding } from "./finding";

/** Files asked about per morning; the rest wait for the next. */
export const MAX_ASKS_PER_MORNING = 4;
/** Threads one file's ask reaches in a morning; the rest wait, and are asked
 *  alone the next morning while the card is live. */
export const MAX_THREADS_PER_ASK = 3;
/** How long a mark with no card holds its file for a try still posting. */
const POSTING_HOLD_MS = 60 * 60 * 1000;

/** Where one file's card lives, while it may be live. */
export interface IntakeMark {
  channel: string;
  threadTs: string | null;
  /** The card's ts; null between the mark and the post. */
  cardTs: string | null;
  markedAt: number;
}

/** One asked file, as a thread's ask record holds it. */
export interface AskedFile {
  /** Where the file's card lives. */
  cardChannel: string;
  cardThread: string | null;
  /** Who in this thread may answer: its owner and everyone who posted. */
  people: string[];
  kind: FileDriftFinding["target"]["kind"];
  askedAt: number;
}

/** Everything a thread has been asked, by file key. */
export type AskRecord = Record<string, AskedFile>;

/** The queue and the marks, behind one port. */
export interface DriftStore {
  pending(): Promise<FileDriftFinding[]>;
  remove(ids: string[]): Promise<void>;
  intakeMark(group: string): Promise<IntakeMark | null>;
  /** Kept for the card's lifetime. */
  setIntakeMark(group: string, mark: IntakeMark): Promise<void>;
  clearIntakeMark(group: string): Promise<void>;
  asked(channel: string, threadTs: string): Promise<AskRecord>;
  saveAsked(channel: string, threadTs: string, record: AskRecord): Promise<void>;
}

/** A place a message goes: a thread, or a place's top. */
export interface AskPlace {
  channel: string;
  threadTs: string | null;
}

export interface DriftPostDeps {
  store: DriftStore;
  slack: {
    /** Post a card or a question, tagged as the sweep's so a reply under it
     *  is read by the sweep thread's rule. */
    post(to: AskPlace, message: { text: string; blocks?: unknown[]; card: boolean }): Promise<{ ok: boolean; ts?: string }>;
    permalink(channel: string, ts: string): Promise<string | null>;
    /** Retire a posted card and edit it to `text`, with its buttons gone. */
    withdraw(channel: string, ts: string, text: string): Promise<void>;
    /** Mark the thread as entered through a proactive post, when the bot had
     *  no history there (`sweep/thread-mark.ts`). */
    markThread(channel: string, threadTs: string): Promise<void>;
  };
  render(card: ProposalCard): { text: string; blocks: unknown[] };
  /** Stage the card and record it on the usage record (`stageSweepCard`). */
  stage(proposal: PendingProposal, channelKind: ChannelKind): Promise<void>;
  /** Whether a posted card is still live in ThreadState — not confirmed,
   *  cancelled, withdrawn or lapsed. */
  cardLive(proposalTs: string): Promise<boolean>;
  /** Who last published a Figma file, or null when unread. */
  publisher(fileKey: string): Promise<{ handle: string; at: string } | null>;
  /** The Roadmap's Product Pillar options, or null when unread. */
  pillarOptions(): Promise<string[] | null>;
  config: TeamChannels & { unoBot?: string };
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  dryRun?: boolean;
}

/** One ask posted — or, on a dry run, planned. */
export interface DriftAskReport {
  group: string;
  channel: string;
  threadTs: string | null;
  role: "card" | "question";
  /** The message text; withheld for a private place on a dry run. */
  text: string;
  ts?: string;
}

export interface DriftPostReport {
  kind: "figma-drift-post";
  key: string;
  outcome: "handled";
  note: string | null;
  asks: DriftAskReport[];
  summary: string;
}

/** What a dry run's report shows of an ask in a private place. */
export const WITHHELD_ASK_TEXT = "(withheld: this ask is for a private channel or a group DM)";

/**
 * One morning's asks.
 *
 * @param job - The `figma-drift-post` job
 * @param deps - Everything it touches, by name
 * @throws A budget stop before a card that could not finish — the runner
 *   retries the job on a fresh budget, and the marks keep it from asking twice
 */
export async function runDriftAsks(job: { key: string }, deps: DriftPostDeps): Promise<DriftPostReport> {
  const now = deps.now();
  const notes: string[] = [];
  const asks: DriftAskReport[] = [];
  const queued = await deps.store.pending();
  const due = queued.filter((f) => postableAt(f.detectedAt) <= now);

  // A thread already asked about this file is not asked again.
  const fresh: FileDriftFinding[] = [];
  const already: string[] = [];
  const records = new Map<string, AskRecord>();
  const recordOf = async (f: FileDriftFinding): Promise<AskRecord> => {
    const key = threadKey(f);
    if (!records.has(key)) records.set(key, await deps.store.asked(f.evidence.channel, f.evidence.threadTs ?? ""));
    return records.get(key)!;
  };
  for (const f of due) {
    if (f.evidence.channel === deps.config.unoBot) already.push(f.id);
    else if ((await recordOf(f))[f.fileKey]) already.push(f.id);
    else fresh.push(f);
  }
  if (already.length && !deps.dryRun) await deps.store.remove(already);

  const groups = groupBy(fresh, askGroupOf);
  let pillarOptions: Promise<string[] | null> | undefined;
  let done = 0;
  for (const [group, found] of [...groups].sort((a, b) => earliest(a[1]) - earliest(b[1]))) {
    if (done >= MAX_ASKS_PER_MORNING) {
      notes.push(`${groups.size - done} file(s) wait for tomorrow's asks`);
      break;
    }
    done += 1;
    // One finding per thread, oldest drift first; threads past the cap wait.
    const byThread = [...groupBy(found, threadKey).values()]
      .map((list) => list.sort((a, b) => a.driftAt - b.driftAt)[0]!)
      .sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
    const threads = byThread.slice(0, MAX_THREADS_PER_ASK);
    if (byThread.length > threads.length) notes.push(`${group}: ${byThread.length - threads.length} thread(s) wait`);
    const mark = deps.dryRun ? null : await deps.store.intakeMark(group);
    let live: IntakeMark | null = null;
    if (mark?.cardTs && mark.markedAt + DRIFT_CARD_TTL_MS > now && (await deps.cardLive(mark.cardTs))) {
      live = mark;
    } else if (mark && !mark.cardTs && mark.markedAt + POSTING_HOLD_MS > now) {
      // Another try is between this file's mark and its post.
      notes.push(`${group}: a card is still being posted — held`);
      continue;
    } else if (mark) {
      // Lapsed, answered, withdrawn — or a try that stopped before its post
      // an hour ago: the file may be asked afresh.
      await deps.store.clearIntakeMark(group);
    }
    const posted = live
      ? await askAlongside(deps, group, live, threads, asks)
      : await askWithCard(deps, group, threads, asks, notes, () => (pillarOptions ??= deps.pillarOptions()));
    if (posted.length && !deps.dryRun) await deps.store.remove(posted.map((f) => f.id));
  }

  const note = notes.length ? notes.join("; ") : null;
  const cards = asks.filter((a) => a.role === "card").length;
  const verb = deps.dryRun ? "would ask" : "asked";
  const summary = asks.length
    ? `${verb} ${asks.length} thread(s), ${cards} with a drafted intake${note ? ` — ${note}` : ""}`
    : `no file drift due this morning${note ? ` — ${note}` : ""}`;
  return { kind: "figma-drift-post", key: job.key, outcome: "handled", note, asks, summary };
}

/**
 * A file with no live card: the card in its first thread, and the question in
 * each other one.
 *
 * @returns The findings asked about
 */
async function askWithCard(
  deps: DriftPostDeps,
  group: string,
  threads: FileDriftFinding[],
  asks: DriftAskReport[],
  notes: string[],
  options: () => Promise<string[] | null>,
): Promise<FileDriftFinding[]> {
  const first = threads[0]!;
  const to = placeOf(first, deps.config);
  if (!to) {
    notes.push(`${group}: its place is not configured`);
    return [];
  }
  const publicThreads = threads.filter((f) => f.evidence.channelKind === "public");
  // Everything the card will send, counted before any of it is.
  if (!deps.dryRun) {
    ensureHeadroom(deps, {
      subrequests: 1 + 1 + publicThreads.length + 1 + 1 + 2 * (threads.length - 1) + 1,
      d1Queries: 2,
    });
  }
  const now = deps.now();
  if (!deps.dryRun) await deps.store.setIntakeMark(group, { channel: to.channel, threadTs: to.threadTs, cardTs: null, markedAt: now });

  const permalinks: Record<string, string> = {};
  for (const f of publicThreads) {
    const ts = f.evidence.messageTs[0];
    if (!ts) continue;
    const link = await deps.slack.permalink(f.evidence.channel, ts).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (link) permalinks[f.id] = link;
  }
  const figmaKey = first.fileKey.startsWith("figma:") ? first.fileKey.slice("figma:".length) : null;
  const publisher = figmaKey
    ? await deps.publisher(figmaKey).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      })
    : null;
  const choice =
    first.lane === "roadmap" && pillarCandidates(threads).length
      ? matchPillar(pillarCandidates(threads), await options().catch((err: unknown) => {
          rethrowIfBudget(err);
          return null;
        }))
      : { pillar: null, note: null };
  const intake = draftIntake({ findings: threads, pillar: choice.pillar, publisher, permalinks });

  const lead = [
    `:art: ${askLine({ mentions: mentionsOf(first.owner, first.participants), title: first.target.title, url: first.target.url, kind: first.target.kind })}`,
    ...(publisherLine(publisher) ? [publisherLine(publisher)!] : []),
    ...saidLines(first.threadSays, first.sourceSays),
    ...(choice.note ? [pillarNote(choice.note)] : []),
    "",
    cardTerms(intake.lane, first.target.kind),
  ].join("\n");
  const card: ProposalCard = {
    kind: "confirm",
    verb: intake.lane === "roadmap" ? "file this Roadmap card" : "file this intake",
    lead,
    fields: [],
    caveats: [],
    operations: [intake.operation],
  };
  const rendered = deps.render(card);
  const report: DriftAskReport = {
    group,
    channel: to.channel,
    threadTs: to.threadTs,
    role: "card",
    text: first.evidence.channelKind === "public" || !deps.dryRun ? rendered.text : WITHHELD_ASK_TEXT,
  };
  if (deps.dryRun) {
    asks.push(report);
    for (const f of threads.slice(1)) asks.push(questionReport(deps, group, f, null));
    return threads;
  }

  const sent = await deps.slack.post(to, { text: rendered.text, blocks: rendered.blocks, card: true });
  if (!sent.ok || !sent.ts) {
    await deps.store.clearIntakeMark(group);
    notes.push(`${group}: the card's post failed — kept for tomorrow`);
    return [];
  }
  const root = to.threadTs ?? sent.ts;
  const confirmers = [...new Set(threads.flatMap((f) => [f.owner, ...f.participants]).filter(Boolean))];
  const proposal: PendingProposal = {
    operations: [intake.operation],
    toolName: intake.operation.toolName,
    input: intake.operation.input,
    channel: to.channel,
    threadTs: root,
    replyTs: root,
    userMsgTs: root,
    proposalTs: sent.ts,
    proposalText: rendered.text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: DRIFT_CARD_TTL_MS,
    confirmers,
    // Its own slot, beside a sweep card and a turn's card (`proposalSlot`).
    supersedeKey: DRIFT_KEY,
  };
  try {
    await deps.stage(proposal, first.evidence.channelKind);
  } catch (err) {
    rethrowIfBudget(err);
    const why = err instanceof Error ? err.message : String(err);
    await deps.slack.withdraw(to.channel, sent.ts, DRIFT_NOT_STAGED_TEXT).catch(rethrowIfBudget);
    await deps.store.clearIntakeMark(group);
    notes.push(`${group}: posted but not staged (${why}) — withdrawn, kept for tomorrow`);
    return [];
  }
  await deps.store.setIntakeMark(group, { channel: to.channel, threadTs: to.threadTs, cardTs: sent.ts, markedAt: now });
  asks.push({ ...report, ts: sent.ts });
  const cardPlace = { channel: to.channel, thread: root };
  await recordAsked(deps, first, cardPlace);

  const cardLink = threads.length > 1 ? await deps.slack.permalink(to.channel, sent.ts).catch(() => null) : null;
  const asked = [first];
  for (const f of threads.slice(1)) {
    if (await askQuestion(deps, group, f, cardLink, cardPlace, asks)) asked.push(f);
  }
  return asked;
}

/**
 * A file whose card is still live: the question alone in each thread.
 *
 * @returns The findings asked about
 */
async function askAlongside(
  deps: DriftPostDeps,
  group: string,
  mark: IntakeMark,
  threads: FileDriftFinding[],
  asks: DriftAskReport[],
): Promise<FileDriftFinding[]> {
  ensureHeadroom(deps, { subrequests: 1 + 2 * threads.length, d1Queries: 0 });
  const cardLink = mark.cardTs ? await deps.slack.permalink(mark.channel, mark.cardTs).catch(() => null) : null;
  const asked: FileDriftFinding[] = [];
  for (const f of threads) {
    if (await askQuestion(deps, group, f, cardLink, { channel: mark.channel, thread: mark.threadTs ?? mark.cardTs }, asks)) {
      asked.push(f);
    }
  }
  return asked;
}

/** The question alone, in one thread. */
async function askQuestion(
  deps: DriftPostDeps,
  group: string,
  f: FileDriftFinding,
  cardLink: string | null,
  card: { channel: string; thread: string | null },
  asks: DriftAskReport[],
): Promise<boolean> {
  const report = questionReport(deps, group, f, cardLink);
  if (deps.dryRun) {
    asks.push(report);
    return true;
  }
  const to = placeOf(f, deps.config);
  if (!to) return false;
  const sent = await deps.slack.post(to, { text: report.text, card: false });
  if (!sent.ok || !sent.ts) return false;
  if (to.threadTs) await deps.slack.markThread(to.channel, to.threadTs).catch(rethrowIfBudget);
  asks.push({ ...report, ts: sent.ts });
  await recordAsked(deps, f, card);
  return true;
}

function questionReport(deps: DriftPostDeps, group: string, f: FileDriftFinding, cardLink: string | null): DriftAskReport {
  const to = placeOf(f, deps.config);
  const line = askLine({ mentions: mentionsOf(f.owner, f.participants), title: f.target.title, url: f.target.url, kind: f.target.kind });
  const text = pingText(`:art: ${line}`, cardLink);
  return {
    group,
    channel: to?.channel ?? f.evidence.channel,
    threadTs: to?.threadTs ?? f.evidence.threadTs,
    role: "question",
    text: deps.dryRun && f.evidence.channelKind !== "public" ? WITHHELD_ASK_TEXT : text,
  };
}

/** The thread's ask record gains this file. */
async function recordAsked(deps: DriftPostDeps, f: FileDriftFinding, card: { channel: string; thread: string | null }): Promise<void> {
  const threadTs = f.evidence.threadTs ?? "";
  const record = await deps.store.asked(f.evidence.channel, threadTs);
  record[f.fileKey] = {
    cardChannel: card.channel,
    cardThread: card.thread,
    people: [...new Set([f.owner, ...f.participants].filter(Boolean))],
    kind: f.target.kind,
    askedAt: deps.now(),
  };
  await deps.store.saveAsked(f.evidence.channel, threadTs, record);
}

/** Where a finding's ask goes (`pickDestination`), never #uno-bot. */
function placeOf(f: FileDriftFinding, config: DriftPostDeps["config"]): AskPlace | null {
  const to = resolveDestination(pickDestination(f), config);
  if (!to || to.channel === config.unoBot) return null;
  return to;
}

// ── The yes ──────────────────────────────────────────────────────────────────

/** A thread reply, as the answer reads it. */
export interface DriftReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
}

export interface DriftAnswerDeps {
  asked(channel: string, threadTs: string): Promise<AskRecord>;
  /** The live drift card in a thread — a revision of it included. */
  liveCard(channel: string, thread: string): Promise<PendingProposal | null>;
  /** Take the card out of reach; false when it was no longer live. */
  retire(proposalTs: string): Promise<boolean>;
  /** Edit the card to `text`, its buttons gone. */
  edit(channel: string, ts: string, text: string): Promise<void>;
  /** Say so in the thread the yes came from, when the card is elsewhere. */
  post(channel: string, threadTs: string, text: string): Promise<void>;
  /** The card's cancelled row on the usage record, by this person. */
  recordWithdrawn(proposal: PendingProposal, user: string): Promise<void>;
}

/**
 * Whether a message could be a yes to a drift ask — no reads, so the message
 * job can ask it of every thread reply.
 *
 * @param event - The message
 */
export function isDriftAnswerCandidate(event: {
  thread_ts?: string;
  bot_id?: string;
  user?: string;
  subtype?: string;
  text?: string;
}): boolean {
  if (!event.thread_ts || event.bot_id || !event.user || event.subtype) return false;
  return isUpToDateReply(event.text ?? "");
}

/**
 * A yes in an asked thread: withdraw each live card it answers.
 *
 * @param reply - The reply
 * @param deps - The reads and the withdrawal
 * @returns Whether a card was withdrawn — the reply then runs no turn
 */
export async function answerDriftAsk(reply: DriftReply, deps: DriftAnswerDeps): Promise<boolean> {
  if (!isUpToDateReply(reply.text)) return false;
  const record = await deps.asked(reply.channel, reply.threadTs);
  let withdrew = false;
  for (const file of Object.values(record)) {
    const thread = file.cardThread;
    if (!thread) continue;
    const card = await deps.liveCard(file.cardChannel, thread);
    if (!card) continue;
    // Whoever may decide the card, or anyone this thread's question asked.
    if (!file.people.includes(reply.user) && !(card.confirmers && mayConfirm(card, reply.user))) continue;
    if (!(await deps.retire(card.proposalTs))) continue;
    await deps.edit(card.channel, card.proposalTs, withdrawnText(reply.user, file.kind));
    await deps.recordWithdrawn(card, reply.user);
    if (card.channel !== reply.channel || proposalReplyThread(card) !== reply.threadTs) {
      await deps.post(reply.channel, reply.threadTs, withdrawnElsewhereText(file.kind));
    }
    withdrew = true;
  }
  return withdrew;
}

// ── Shared ───────────────────────────────────────────────────────────────────

function threadKey(f: FileDriftFinding): string {
  return `${f.evidence.channel}:${f.evidence.threadTs ?? ""}`;
}

function earliest(findings: readonly FileDriftFinding[]): number {
  return Math.min(...findings.map((f) => f.driftAt));
}

function groupBy<T>(list: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of list) out.set(keyOf(item), [...(out.get(keyOf(item)) ?? []), item]);
  return out;
}

/** Stop, as the budget does, unless what is left covers the step. */
function ensureHeadroom(deps: DriftPostDeps, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}
