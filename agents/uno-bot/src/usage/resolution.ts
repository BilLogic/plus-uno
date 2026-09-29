// How each ask was resolved, on the usage record — the self-serve signal.
//
// A turn's row says what the bot did. These columns say what came of it, and
// they arrive later, from three places:
//
//   - `reaction`: the asker put ✅ or 👍 on a bot answer (the reaction door);
//   - `task_completed`: a ✅-approved batch the ask staged ran, every operation
//     ok (`agent/resolve-proposal.ts`);
//   - `no_escalation`: the end-of-day pass found, 24 h on, that no person
//     replied in the ask's thread and the asker did not DM the lead about it
//     (`./resolution-pass.ts`).
//
// `none` is the pass saying it could not tell: without the lead's own token
// there is no reading the DM half, and a guess would be a false self-serve.
// The pass's answers are provisional — a later read, or a person's own signal,
// replaces them — while a person's signal is final.
//
// A reaction is mapped to its ask by THREAD (`answeredAskOf`), never by channel
// and time, so a 👍 on the answer to someone else's question never resolves the
// reactor's own ask.
//
// The same pass writes `escalated_to_lead`: true when the lead replied in the
// thread, or the asker DMed the lead on the same topic, within 24 h. Self-serve
// rate is the share of non-test asks that were resolved and not escalated.
//
// A PORT OF ITS OWN beside `UsageLog`, not more fields on `TurnRecord`: Turn
// writes the row once, as the turn ends; everything here is written by someone
// else, later, into columns Turn's upsert leaves alone (`./d1.ts`).
//
// Nothing here stores text. The pass reads the ask and the DMs in memory to
// compare topics, and keeps a boolean (ADR-030, and ADR-020 for the lead's
// token).
//
// PURE: no `Env`, no Workers global. `Env` stops in `./resolution-env.ts`.

import { CONFIRM_REACTIONS } from "../gate/reactions";

/** Where a resolution came from. */
export type ResolutionSignal = "reaction" | "task_completed" | "no_escalation" | "none";

/** One ask's resolution columns. */
export interface AskResolution {
  /** Null while nothing has resolved the ask. */
  resolution: ResolutionSignal | null;
  /** When the current resolution was first recorded, epoch ms. */
  resolvedAt: number | null;
  /** Null until the pass has read the thread and the DMs, or when it could not. */
  escalatedToLead: boolean | null;
  /** When the end-of-day pass settled the ask, epoch ms. Null is its queue. */
  resolutionCheckedAt: number | null;
  /** How many times the pass has read the ask. */
  resolutionAttempts: number;
  /** When the pass last read it, epoch ms. */
  resolutionAttemptedAt: number | null;
}

/** A message in a Slack thread, as the bot token reads it. */
export interface ThreadMessage {
  ts: string;
  /** The thread's root, on a message in one. */
  thread_ts?: string;
  user?: string;
  bot_id?: string;
  text?: string;
}

/**
 * A thread read, WHOLE or not at all: null when Slack refused it, when it is
 * empty, or when it runs past the one page read (`has_more`). Judging a reply
 * or an ask on part of a thread would be a guess, so a longer thread is
 * unknown. The pass and the reaction path both read through this.
 */
export function wholeThread(res: { ok: boolean; messages?: ThreadMessage[]; has_more?: boolean }): ThreadMessage[] | null {
  if (!res.ok || !Array.isArray(res.messages) || res.messages.length === 0 || res.has_more === true) return null;
  return res.messages;
}

/** The asker's ✅ / 👍 on a bot answer, as the reaction door hands it over. */
export interface AnswerReaction {
  channel: string;
  /** The thread the answer sits in; the answer's own ts when it is in none. */
  threadRoot: string;
  reactedTs: string;
  /** Who reacted; matched against the ask's requester. */
  userId: string;
}

/** An ask the end-of-day pass has still to read. */
export interface PassCandidate {
  turnId: string;
  requesterId: string;
  /** The conversation the ask was made in, from the turn id. */
  channel: string;
  askTs: string;
  askedAt: number;
  /** True when a reaction or a completed task already resolved it. */
  resolved: boolean;
  /** How many times the pass has read it before. */
  attempts: number;
}

/** What the pass decided for one ask. */
export interface PassOutcome {
  /**
   * `no_escalation`, or `none` when it could not tell; null when the ask was
   * not self-served (a person replied, or the asker went to the lead).
   */
  resolution: "no_escalation" | "none" | null;
  escalatedToLead: boolean | null;
  /** Leave the queue: the escalation is known, or the pass has given up. */
  settled: boolean;
}

/**
 * Where resolutions are written.
 *
 * FIRST SIGNAL WINS for the signals a person gives (a reaction, a completed
 * task): a resolved ask keeps the one that resolved it. The pass's own answers
 * (`no_escalation`, `none`, or none at all) are provisional until a person's
 * signal arrives, so a later pass may replace them. Every write names the row it
 * changed (its turn id), or null when no row matched. A caller treats a throw as
 * a lost record, never as a lost action.
 */
export interface ResolutionLog {
  /**
   * The asker's ✅ / 👍 on an answer. `turnId` is the ask the answer answers
   * (`answeredAskOf`); it is resolved only when `requesterId` asked it.
   */
  recordReaction(q: { turnId: string; requesterId: string; at: number }): Promise<string | null>;
  /** A ✅-approved batch completed: resolves the turn that staged the card. */
  recordTaskCompleted(proposalId: string, at: number): Promise<string | null>;
  /**
   * Non-test asks the pass has not settled, asked inside the window and not
   * read since `attemptedBefore`: never-read asks first, then oldest first.
   */
  pendingPass(q: {
    askedAfter: number;
    askedBefore: number;
    attemptedBefore: number;
    limit: number;
  }): Promise<PassCandidate[]>;
  /**
   * One read of one ask: counts the attempt, writes the verdict, and takes the
   * ask off the queue when `settled`. Re-reading to the same verdict changes
   * nothing but the attempt: `resolvedAt` is when the current resolution was
   * first recorded.
   */
  recordPass(turnId: string, outcome: PassOutcome, at: number): Promise<void>;
  /** One ask's resolution columns, or null when there is no such turn. */
  getResolution(turnId: string): Promise<AskResolution | null>;
}

// ── the rules ────────────────────────────────────────────────────────────────

/** 24 hours: how long a person has to escalate before the pass decides. */
export const ESCALATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The glyphs that mark an answer resolved: the gate's own confirm set (✅, ✔️,
 * 👍). One vocabulary, so a gesture that confirms a card and a gesture that
 * says "that answered it" can never drift apart.
 */
export function isResolvingReaction(glyph: string): boolean {
  return CONFIRM_REACTIONS.has(glyph);
}

/** A Slack ts as epoch ms. */
export function tsToMs(ts: string): number {
  return Math.round(Number(ts) * 1000);
}

/**
 * The ask a reacted bot answer answers, as a turn id — or null when there is
 * no safe mapping.
 *
 * By THREAD, never by channel and time: the answer is in a reply thread, and
 * the ask it answers is the last person's message in that thread before it
 * (the bot's own messages between them are its interim lines). A 👍 on the
 * answer to someone else's question therefore points at THEIR ask, and the
 * requester check in `recordReaction` records nothing. A top-level bot post
 * (the answer is its own thread root) has no thread to read, so no mapping.
 *
 * @param channel - Where the answer is
 * @param thread - The answer's whole thread, oldest first, root included
 * @param reactedTs - The reacted answer
 */
export function answeredAskOf(channel: string, thread: readonly ThreadMessage[], reactedTs: string): string | null {
  const root = thread[0]?.ts;
  if (!root || root === reactedTs) return null;
  const reacted = thread.find((m) => m.ts === reactedTs);
  if (!reacted?.bot_id) return null;
  const before = thread.filter((m) => tsToMs(m.ts) < tsToMs(reactedTs) && m.user && !m.bot_id);
  const ask = before[before.length - 1];
  return ask ? `${channel}:${ask.ts}` : null;
}

/**
 * Record a reaction on an answer: read its thread, find the ask, and resolve it
 * when the reactor asked it. Records nothing for a top-level post or a thread
 * it cannot read.
 *
 * @param r - The reaction
 * @param deps - The log, the thread read (null when unreadable) and the clock
 */
export async function recordAnswerReaction(
  r: AnswerReaction,
  deps: {
    log: Pick<ResolutionLog, "recordReaction">;
    threadOf(channel: string, rootTs: string): Promise<ThreadMessage[] | null>;
    now(): number;
  },
): Promise<string | null> {
  if (r.threadRoot === r.reactedTs) return null;
  const thread = await deps.threadOf(r.channel, r.threadRoot);
  if (!thread) return null;
  const turnId = answeredAskOf(r.channel, thread, r.reactedTs);
  return turnId ? deps.log.recordReaction({ turnId, requesterId: r.userId, at: deps.now() }) : null;
}

/**
 * Whether a ✅ batch counts as a completed task: every approved operation ran
 * and came back ok. A partial run, or one the fence stopped, did not complete.
 */
export function batchCompleted(approved: number, outcomes: readonly { ok: boolean }[]): boolean {
  return approved > 0 && outcomes.length === approved && outcomes.every((o) => o.ok);
}

/** The conversation id a turn id starts with (`<channel>:<ask ts>`). */
export function channelOfTurnId(turnId: string): string {
  const at = turnId.indexOf(":");
  return at < 0 ? turnId : turnId.slice(0, at);
}

const STOPWORDS = new Set(
  (
    "about above after again also another because been before being between both could does doing down during each " +
    "from further have having here hers into just like more most much must only other over same should some such than " +
    "that their them then these they this those through under until very want were what when where which while " +
    "will with would your yours thanks thank please hey hello know think need make there's it's i'm can't don't"
  ).split(" "),
);

function contentWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .split(/[^a-z0-9'-]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Whether a DM is about the same thing as the ask. Read in memory, never kept.
 *
 * Two ways to match: the DM links the ask's thread (a Slack permalink carries
 * the ts as `p` and its digits), or the two share at least two content words.
 * Deliberately lexical — no model call per DM — and deliberately loose: a false
 * "same topic" marks an ask escalated, which only ever lowers self-serve rate.
 */
export function sameTopic(askText: string, dmText: string, threadTss: readonly string[] = []): boolean {
  for (const ts of threadTss) {
    if (dmText.includes(`p${ts.replace(".", "")}`)) return true;
  }
  const ask = contentWords(askText);
  let shared = 0;
  for (const word of contentWords(dmText)) {
    if (ask.has(word) && ++shared >= 2) return true;
  }
  return false;
}
