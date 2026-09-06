// What the eval transcript records about a tool call — the ARGUMENTS the model
// sent, and the small honesty fields the tool sent back.
//
// WHY THIS EXISTS. /debug/eval used to record tool calls and nothing about
// their results, so a search-shaped failure was undiagnosable from the
// artifact. S3 (the connect-link case) read 0/3 across three samples with all
// three replies saying workspace search "isn't available on this turn" — and
// the transcript could not say WHICH of three legs produced that: own-DM
// detection on a synthetic channel, a missing SLACK_OAUTH_REDIRECT_URI so the
// connect URL is null, or no viable credential so the tool returned before the
// nudge was ever built. Three different fixes, one indistinguishable log.
//
// WHAT IS RECORDED, and what is NOT. `note`, `visibility` and `error` — the
// fields a tool writes ABOUT its own answer. Never `results`, never `rows`,
// never a snippet. An eval artifact is written to a file, attached to a run and
// read weeks later by whoever is on the failure; putting message content or
// blueprint prose in it would turn a diagnostic into a disclosure, which is the
// same mistake S2 exists to catch one layer down. The size cap is the second
// half of that promise: a tool that decides to explain itself at length cannot
// smuggle a corpus through a field called `note`.
//
// A PURE module: no Env, no fetch, no Workers types, so tsconfig.test.json
// compiles it and the shape the artifact promises is pinned by unit tests
// rather than by reading a live run.

/** One tool call as the model issued it, plus what came back about it. */
export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  /** The tool's own note about its answer — the connect nudge, the budget
   *  note, the completeness line. Present only when the tool wrote one. */
  note?: string;
  /** What the answer could see (slack_search: "public-only (no user
   *  credential…)"). The field that says which firewall a reply was written
   *  behind. */
  visibility?: string;
  /** The tool's error string, when it failed. A failed lookup and an empty one
   *  read identically in a reply and must not read identically here. */
  error?: string;
}

/** What an entry says when a call never ran, because the turn ENDED on it — the
 *  side-effect tool that was staged for a ✅ instead of executed, and the
 *  `proposal_resolve` that closed the turn. Not a defect: there is no result
 *  because there was no execution, and nothing can follow it in the same turn. */
export const NOT_RUN_TURN_ENDED = "not run — the turn ended here";

/** What an entry says when a call went unanswered and the turn CARRIED ON. This
 *  one is a defect: a lane announced a call and answered it without reporting,
 *  which leaves a slot the next same-named call fills by mistake. Both known
 *  paths report today, so this string appearing in an artifact means a new one
 *  has grown. */
export const NO_RESULT_RECORDED = "no result was recorded for this call";

/** The digest of one tool RESULT: never rows, never content. */
export interface ToolResultNote {
  name: string;
  note?: string;
  visibility?: string;
  error?: string;
}

/** How much of any one field the transcript keeps. Long enough for every note
 *  the tools actually write (the longest, the absence-scope instruction, is
 *  ~450 characters), short enough that no field can carry a payload. */
export const MAX_TRANSCRIPT_FIELD_CHARS = 600;

function field(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.length > MAX_TRANSCRIPT_FIELD_CHARS
    ? `${s.slice(0, MAX_TRANSCRIPT_FIELD_CHARS)}…[truncated]`
    : s;
}

/**
 * Read the reportable fields off a tool result.
 *
 * Tool results are JSON strings by convention, not by type — a tool that
 * returned prose, or nothing, is a tool with no digest, never a thrown turn.
 * The keys are read at the TOP LEVEL only: a nested `note` deep inside a row is
 * that row's content, which is exactly what this must not carry.
 */
export function toolResultDigest(name: string, resultText: string): ToolResultNote {
  let parsed: unknown;
  try {
    parsed = JSON.parse(resultText);
  } catch {
    return { name };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { name };
  const p = parsed as Record<string, unknown>;
  const note = field(p.note);
  const visibility = field(p.visibility);
  const error = field(p.error);
  return {
    name,
    ...(note ? { note } : {}),
    ...(visibility ? { visibility } : {}),
    ...(error ? { error } : {}),
  };
}

/**
 * Attach a result digest to the call it answers.
 *
 * FIFO by tool name: results come back in the order the calls were issued, and
 * a turn can call the same tool twice. `filled` is the caller's memory of which
 * entries already have a result, so a second `slack_search` cannot overwrite
 * the first one's note — a transcript that silently collapsed two searches into
 * one would be a worse instrument than no transcript.
 *
 * Calls with no result — a staged proposal, a lookup the budget refused before
 * dispatch — simply keep their bare `{name, args}`, which is the honest record:
 * they were issued and nothing came back.
 *
 * @returns the index it filled, or -1 when no call is waiting for this result.
 */
export function attachToolResult(
  tools: ToolCall[],
  result: ToolResultNote,
  filled: Set<number>,
): number {
  const i = tools.findIndex((t, idx) => t.name === result.name && !filled.has(idx));
  const call = i < 0 ? undefined : tools[i];
  if (!call) return -1;
  filled.add(i);
  if (result.note !== undefined) call.note = result.note;
  if (result.visibility !== undefined) call.visibility = result.visibility;
  if (result.error !== undefined) call.error = result.error;
  return i;
}

/**
 * Stamp every call still waiting for a result, once the turn is over.
 *
 * The pairing in {@link attachToolResult} is FIFO by name, which is exact only
 * while every announced call also reports a result. A lane that announces a
 * call and answers it without reporting — a deferral behind a pending proposal
 * used to do exactly this in both lanes — leaves a slot that the NEXT turn's
 * call of the same name fills instead, recording that turn's outcome against
 * this one and leaving the call that really ran blank. Both lanes now report on
 * that path, so the case is closed at the source; this is the tell-tale, so the
 * next lane to grow an unreported path shows up in the artifact as a call with
 * no result rather than as a plausible wrong answer.
 */
export function markUnanswered(
  tools: ToolCall[],
  filled: Set<number>,
  /** How the turn ended. `proposal` and `resolved` are terminal: the model's
   *  call was staged or the proposal was closed, the turn returned, and no tool
   *  ran — so an unfilled entry is expected rather than a symptom. Any other
   *  outcome means the loop continued past the call, and an unfilled entry
   *  there is the defect this exists to surface. */
  outcome?: string,
): number {
  const terminal = outcome === "proposal" || outcome === "resolved";
  let marked = 0;
  tools.forEach((call, i) => {
    if (filled.has(i)) return;
    if (call.note === undefined && call.visibility === undefined && call.error === undefined) {
      call.error = terminal ? NOT_RUN_TURN_ENDED : NO_RESULT_RECORDED;
      marked++;
    }
  });
  return marked;
}
