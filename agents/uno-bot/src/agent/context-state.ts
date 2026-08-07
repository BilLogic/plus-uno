// Phase 5: structured conversation state, progressive summarisation, and drift
// detection. FLAGGED OFF by default (env.CONTEXT_STATE === "on").
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS BEHIND A FLAG AND WHY THE FLAG MATTERS MORE THAN THE FEATURE
// ─────────────────────────────────────────────────────────────────────────────
// This changes what the model sees on EVERY turn. The failure mode is not a
// crash — it is subtly worse answers, spread across every question, invisible
// in aggregate. r48 is the precedent: it fixed two eval cases and broke a third
// while the total stayed 19/19. So this ships off, gets enabled in one DM, and
// gets compared CASE BY CASE before it goes anywhere near the default path.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY IT DERIVES STATE INSTEAD OF ASKING THE MODEL FOR IT
// ─────────────────────────────────────────────────────────────────────────────
// The obvious build is a second model call that reads the thread and emits
// {goal, constraints, decisions, artifacts}. Rejected, for three reasons that
// are all the same reason:
//
//   • It costs a round-trip on every turn, on a path that already fights a
//     50-subrequest cap — to save tokens. The arithmetic does not obviously
//     work, and nothing here would measure whether it did.
//   • A summariser hallucinating a constraint is strictly worse than no state
//     at all. The whole point of the block is that the model can TRUST it; a
//     block that is itself a generation is just more prompt.
//   • It cannot be tested. A derived state is a pure function of the history,
//     so its failures are reproducible in a unit test rather than discovered
//     three weeks later in a bad answer.
//
// Everything below is derived from what the relay ALREADY recorded. It can be
// wrong about emphasis. It cannot invent.
//
// ─────────────────────────────────────────────────────────────────────────────
// AND THE HONEST LIMIT
// ─────────────────────────────────────────────────────────────────────────────
// Deriving constraints from imperative phrasing is a heuristic. It will miss a
// constraint stated as a preference ("I'd rather you didn't") and it will
// occasionally promote an aside. That is why the rendered block says these are
// things the person SAID, with their own words quoted, rather than presenting
// them as rules — a quoted sentence the model can re-read is recoverable; a
// paraphrase asserted as a rule is not.

// Structurally identical to HistoryTurn in thread-state.ts, declared locally
// rather than imported: importing it drags in Env, which drags in the Workers
// type graph, which cannot compile under the node-only test config. This module
// is the one in the backlog most in need of tests, so it stays import-free.
export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationState {
  /** The first thing the person asked. Verbatim, capped. The single most
   *  useful line in the block: it is what everything after it is about, and it
   *  is the first thing to fall out of a truncated window. */
  goal: string;
  /** Things the person asked FOR or ruled OUT, in their own words. */
  constraints: string[];
  /** Proposals actually confirmed or cancelled, from the relay's own outcome
   *  notes — not from anything the model said. */
  decisions: string[];
  /** URLs produced during the conversation: cards filed, PRs opened, pages
   *  read. What "the card" refers to three turns later. */
  artifacts: string[];
}

const MAX_GOAL_CHARS = 240;
const MAX_CONSTRAINT_CHARS = 160;
const MAX_CONSTRAINTS = 5;
const MAX_DECISIONS = 5;
const MAX_ARTIFACTS = 6;

// Phrasings that mark a sentence as a standing instruction rather than a
// passing remark. Anchored to sentence start so "I don't think that's right"
// (an opinion) does not read as "don't do that" (a constraint).
const CONSTRAINT_RE =
  /^(?:please\s+)?(?:don'?t|do not|never|avoid|no\s+\w|only\s|always|make sure|keep it|stick to|use\s+the\s|prefer|skip\s|ignore\s|without\s)/i;

// The relay's own outcome notes, written by resolveProposal / recordExchange.
// Matching on OUR strings, never on model prose, is what makes this trustworthy.
const CONFIRMED_RE = /\(confirmed\b[^)]*\)/i;
const CANCELLED_RE = /\(Cancelled the proposed ([a-z_]+)/i;

const URL_RE = /https?:\/\/[^\s<>|)\]]+/g;

/** Derive the state block from recorded history. Pure. */
export function deriveState(history: HistoryTurn[], currentUserText: string): ConversationState {
  const userTurns = history.filter((t) => t.role === "user");
  const goal = truncate((userTurns[0]?.content ?? currentUserText).trim(), MAX_GOAL_CHARS);

  const constraints: string[] = [];
  for (const turn of userTurns) {
    for (const sentence of splitSentences(turn.content)) {
      if (!CONSTRAINT_RE.test(sentence)) continue;
      const s = truncate(sentence, MAX_CONSTRAINT_CHARS);
      if (!constraints.includes(s)) constraints.push(s);
    }
  }

  const decisions: string[] = [];
  const artifacts: string[] = [];
  for (const turn of history) {
    if (turn.role !== "assistant") continue;
    const confirmed = CONFIRMED_RE.exec(turn.content);
    if (confirmed) push(decisions, truncate(confirmed[0].replace(/^\(|\)$/g, ""), MAX_CONSTRAINT_CHARS));
    const cancelled = CANCELLED_RE.exec(turn.content);
    if (cancelled) push(decisions, `cancelled: ${cancelled[1]}`);
    for (const url of turn.content.match(URL_RE) ?? []) push(artifacts, url);
  }

  return {
    goal,
    constraints: constraints.slice(-MAX_CONSTRAINTS),
    decisions: decisions.slice(-MAX_DECISIONS),
    artifacts: artifacts.slice(-MAX_ARTIFACTS),
  };
}

/** The prompt block, or "" when there is nothing worth spending tokens on. */
export function renderState(state: ConversationState): string {
  const lines: string[] = [];
  if (state.goal) lines.push(`• Originally asked: "${state.goal}"`);
  for (const c of state.constraints) lines.push(`• They said: "${c}"`);
  for (const d of state.decisions) lines.push(`• Already settled: ${d}`);
  for (const a of state.artifacts) lines.push(`• Produced or read: ${a}`);
  // A goal alone is not worth a header — the first user turn is already in the
  // history right above it.
  if (lines.length < 2) return "";
  return [
    "(system: WHERE THIS CONVERSATION STANDS — assembled by the relay from what was actually said and " +
      "done, not by a model, so it contains no guesses. Quoted lines are the person's own words. " +
      "Use it so they do not have to repeat themselves; do not recite it back to them, and do not treat " +
      "a settled decision as open again unless they reopen it.)",
    ...lines,
  ].join("\n");
}

// ── Progressive summarisation ────────────────────────────────────────────────
//
// Same shape as thread-transcript's window, one difference that is the whole
// point: what gets dropped is REPLACED by a count, not deleted silently. A
// model told "18 messages were dropped here" can say the record is partial. A
// model handed a gap cannot know there was one, and will reason across it.

export interface CompactedHistory {
  turns: HistoryTurn[];
  dropped: number;
}

export function compactHistory(
  history: HistoryTurn[],
  opts: { keepRecent: number; maxChars: number },
): CompactedHistory {
  const { keepRecent, maxChars } = opts;
  const size = history.reduce((n, t) => n + t.content.length, 0);
  if (history.length <= keepRecent + 1 || size <= maxChars) return { turns: history, dropped: 0 };

  const head = history[0]!; // the opening ask — the goal, in full
  const tail = history.slice(-keepRecent);
  const dropped = history.length - tail.length - 1;
  const marker: HistoryTurn = {
    role: "user",
    content: `(system: ${dropped} earlier message(s) in this conversation are not shown — the record here is PARTIAL. If the answer depends on something from that gap, say so and ask rather than assuming.)`,
  };
  return { turns: [head, marker, ...tail], dropped };
}

// ── Drift detection ──────────────────────────────────────────────────────────
//
// A long DM is one conversation to the relay and several to the person. When
// they change subject, every constraint and artifact above becomes actively
// misleading: "file that as a card" now means a different card.
//
// Detected by vocabulary overlap against the goal, which is crude and known to
// be crude. So the OUTPUT is calibrated to the confidence: it does not switch
// anything off, it tells the model the earlier context may no longer apply and
// to ask if a reference is ambiguous. A wrong drift call costs one clarifying
// question. Silently carrying a stale constraint costs a wrong answer.

const STOPWORDS = new Set(
  ("a an the and or but if of to in on at for with from by is are was were be been do does did " +
    "i you we they it this that what which who how why when can could would should will me my our " +
    "your their please just not no yes about into over under any some all more most").split(" "),
);

function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

export interface DriftVerdict {
  drifted: boolean;
  /** 0–1 overlap with the goal's vocabulary. Logged, not shown. */
  overlap: number;
}

export function detectDrift(state: ConversationState, currentUserText: string): DriftVerdict {
  const goalWords = contentWords(state.goal);
  const nowWords = contentWords(currentUserText);
  // Too little to judge on. A three-word follow-up shares nothing with anything
  // and is almost never a subject change — calling drift there would fire on
  // every "and the owner?".
  if (goalWords.size < 3 || nowWords.size < 3) return { drifted: false, overlap: 1 };

  let shared = 0;
  for (const w of nowWords) if (goalWords.has(w)) shared++;
  const overlap = shared / nowWords.size;

  // Artifacts count as continuity: a message naming a URL already in the state
  // is about the same work whatever words it uses.
  if (state.artifacts.some((a) => currentUserText.includes(a))) return { drifted: false, overlap: 1 };

  return { drifted: overlap === 0, overlap };
}

export const DRIFT_NOTE =
  "(system: this message may have CHANGED THE SUBJECT — it shares no vocabulary with what this " +
  "conversation was originally about. Treat the earlier goal, constraints and artifacts above as " +
  "probably no longer applying. If anything in the new message refers back (\"the card\", \"that PR\"), " +
  "ask which one rather than reusing the old one.)";

/** Everything Phase 5 contributes to one turn's prompt, or "" when off/empty. */
export function buildContextBlock(history: HistoryTurn[], currentUserText: string): string {
  const state = deriveState(history, currentUserText);
  const rendered = renderState(state);
  if (!rendered) return "";
  const drift = detectDrift(state, currentUserText);
  return drift.drifted ? `${rendered}\n\n${DRIFT_NOTE}` : rendered;
}

// ── small helpers ────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6 && s.length < 400);
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

function push(list: string[], value: string): void {
  if (value && !list.includes(value)) list.push(value);
}
