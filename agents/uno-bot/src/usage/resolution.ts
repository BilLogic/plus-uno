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
  /** When the resolving signal arrived, epoch ms. */
  resolvedAt: number | null;
  /** Null until the pass has read the thread and the DMs, or when it could not. */
  escalatedToLead: boolean | null;
  /** When the end-of-day pass settled the ask's escalation, epoch ms. */
  resolutionCheckedAt: number | null;
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
}

/** What the pass decided for one ask. */
export interface PassOutcome {
  /** `no_escalation` or `none` for an unresolved ask it could settle; null leaves it as it was. */
  resolution: "no_escalation" | "none" | null;
  escalatedToLead: boolean | null;
}

/**
 * Where resolutions are written.
 *
 * FIRST SIGNAL WINS: a resolved ask keeps the signal that resolved it, except
 * `none`, which is the absence of an answer and gives way to a real one. Every
 * write names the row it changed (its turn id), or null when no row matched.
 * A caller treats a throw as a lost record, never as a lost action.
 */
export interface ResolutionLog {
  /**
   * The asker's ✅ / 👍 on an answer: resolves their latest ask in `channel`
   * made inside the window. Someone else's reaction matches no row.
   */
  recordReaction(q: {
    channel: string;
    requesterId: string;
    fromMs: number;
    toMs: number;
    at: number;
  }): Promise<string | null>;
  /** A ✅-approved batch completed: resolves the turn that staged the card. */
  recordTaskCompleted(proposalId: string, at: number): Promise<string | null>;
  /** Non-test asks the pass has not handled, asked inside the window, oldest first. */
  pendingPass(q: { askedAfter: number; askedBefore: number; limit: number }): Promise<PassCandidate[]>;
  /**
   * The pass's verdict on one ask. It leaves the queue only once its escalation
   * is known: a verdict with `escalatedToLead: null` (the DM half unread) is
   * written, and the ask is read again on the next pass, so a `none` becomes a
   * real answer once the lead's token is connected.
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
 * Which asks a reaction on an answer can be about: those made in its thread
 * before it — from the thread root to the reacted message. A message in no
 * thread (an unthreaded DM line) looks back one escalation window instead.
 */
export function reactionWindow(threadRoot: string, reactedTs: string): { fromMs: number; toMs: number } {
  const toMs = tsToMs(reactedTs);
  return { fromMs: threadRoot === reactedTs ? toMs - ESCALATION_WINDOW_MS : tsToMs(threadRoot), toMs };
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
