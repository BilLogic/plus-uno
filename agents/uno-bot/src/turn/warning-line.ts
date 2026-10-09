// The ⚠️ line — what the reader must not miss, one sentence under the answer,
// beside the footer (CONTEXT.md § presentation; spec #982).
//
// CODE WRITES IT FROM WHAT THE TURN ALREADY KNOWS. Eight triggers, each read off
// a fact the turn holds rather than off the prose:
//
//   • partial   a lookup reported `truncated` or `partial`
//   • at least  a chart across lookups drew a value its lookup read only part
//               of (`atLeast`), named with the count read — which says more
//               than `partial` does for that lookup, so it takes that line's
//               place
//   • failed    a lookup's source errored, timed out or refused access — and
//               no later call of the same lookup came back whole
//   • budget    a lookup was refused or cut short for the turn's lookup
//               budget, or the loop ran out of round-trips and synthesised
//   • stale     a lookup's newest dated row is older than its cutoff
//   • absence   the absence pre-check fired (`agent/absence.ts`)
//   • degraded  a shape the presentation step asked for posted plainer, the
//               reason worded by the step that fell back (`degraded`)
//   • uncounted a chart across lookups left out values its source offers
//               (`uncounted`), named
//
// Each trigger is ONE line however often it fires: three partial lookups are
// one sentence naming their three sources. The turn has no wall-clock budget
// (a Durable Object alarm has no cut-off), so "budget" is the call budget.
//
// THE MODEL MAY ADD ONE, for an estate conflict it found — the blueprint says
// one thing, a Roadmap card or PRD another — through `present` with shape
// `conflict`. It never types the sign: ⚠️ is a status sign code places
// (AGENT.md § Emoji budget), so the sentence is checked here and the sign is
// added on the posting side.
//
// AT MOST TWO LINES. Lines keep the order their triggers were first met, and a
// third is dropped — warnings keep their weight by being rare.
//
// PURE: no Env, no Slack shape. The line's block is the Slack side's.

import { absenceScope, type AbsenceContext } from "../agent/absence";
import { BUDGET_REFUSAL_ERROR, wasCutShort } from "../agent/loop-policy";
import { rowFor, type Estate } from "../agent/tool-table";

/** At most this many ⚠️ lines ride under one answer. */
export const MAX_WARNING_LINES = 2;

/** The sign every ⚠️ line opens with. Code's alone: the model never types it. */
export const WARNING_SIGN = "⚠️";

/** A line as the reader sees it, sign first. */
export const signed = (line: string): string => `${WARNING_SIGN} ${line}`;

/** The longest conflict sentence the model may ask for. */
export const MAX_CONFLICT_CHARS = 240;

/**
 * Freshness cutoffs, by lookup, in days: a result whose newest dated row is
 * older than this is past it. Only lookups whose rows carry a last-changed date
 * are here; the blueprint's `updatedAt` is the one today.
 */
export const FRESHNESS_CUTOFF_DAYS: Readonly<Record<string, number>> = { search_blueprint: 180 };

const DAY_MS = 86_400_000;

/** How a source is named: bare as a modifier, and as a sentence's subject. */
interface SourceName {
  label: string;
  subject: string;
}

const ESTATE_NAMES: Record<Estate | "link", SourceName> = {
  notion: { label: "Notion", subject: "Notion" },
  figma: { label: "Figma", subject: "Figma" },
  github: { label: "GitHub", subject: "GitHub" },
  blueprint: { label: "blueprint", subject: "the blueprint" },
  slack: { label: "Slack", subject: "Slack" },
  storybook: { label: "Storybook", subject: "Storybook" },
  link: { label: "linked page", subject: "the linked page" },
};

/** The Roadmap is a Notion board, but a reader knows it as the Roadmap. */
const TOOL_NAMES: Record<string, SourceName> = {
  roadmap_query: { label: "Roadmap", subject: "the Roadmap board" },
};

function sourceOf(tool: string): SourceName | null {
  const named = TOOL_NAMES[tool];
  if (named) return named;
  const estate = rowFor(tool)?.taskCard?.estate;
  return estate ? ESTATE_NAMES[estate] : null;
}

/**
 * Did the lookup's SOURCE fail — down, slow, refusing access — rather than the
 * model asking badly? Read off what the tools report: a `reason` or `status`
 * naming a failure, or an error naming an HTTP failure, a timeout, a network
 * fault or missing access. An argument the tool refused ("missing 'query'", a
 * status that is not on the board, a path that is not there) is the model's to
 * fix and is no warning.
 */
const SOURCE_FAILURE =
  /\b(5\d\d|401|403|408|429)\b|timed? ?out|timeout|unreachable|fetch failed|network|ECONN|rate.?limit|not configured|not accessible|returned no rows|unavailable|forbidden|unauthori[sz]ed|not_in_channel|missing_scope|invalid_auth|not_authed/i;

function sourceFailed(result: Record<string, unknown>): boolean {
  if (typeof result.reason === "string" && /unreachable|not_configured|timeout/.test(result.reason)) return true;
  if (typeof result.status === "string" && /failed/.test(result.status)) return true;
  return typeof result.error === "string" && SOURCE_FAILURE.test(result.error);
}

/** The newest `updatedAt` among a result's rows, in ms, or null. */
function newestRow(result: Record<string, unknown>): number | null {
  const rows = Array.isArray(result.rows) ? result.rows : [];
  let newest: number | null = null;
  for (const row of rows) {
    const at = typeof row === "object" && row !== null ? (row as Record<string, unknown>).updatedAt : undefined;
    const ms = typeof at === "string" ? Date.parse(at) : NaN;
    if (!Number.isNaN(ms) && (newest === null || ms > newest)) newest = ms;
  }
  return newest;
}

/** "A", "A and B", "A, B and C". */
function joined(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

const capitalised = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Emoji and Slack shortcodes — the sign is code's, and no other belongs in the line. */
const EMOJI = /[☀-➿⬀-⯿]|️|[\uD83C-\uD83E][\uDC00-\uDFFF]|:[a-z][a-z0-9_+-]*:/;

/** The conflict sentence as it will post, or why it will not. */
function conflictLine(raw: unknown): { line: string } | { refusal: string } {
  if (typeof raw !== "string" || !raw.trim()) return { refusal: "Give the conflict as one sentence in `line`." };
  // A leading sign the model typed anyway is dropped rather than refused: the
  // sentence is what it was asked for, and code places the sign.
  const line = raw
    .replace(/^\s*(?:⚠️|⚠|:warning:)\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!line) return { refusal: "Give the conflict as one sentence in `line`." };
  if (EMOJI.test(line)) return { refusal: "No emoji in the line: code places the ⚠️ itself." };
  if (line.length > MAX_CONFLICT_CHARS) return { refusal: `One short sentence: at most ${MAX_CONFLICT_CHARS} characters.` };
  // One sentence: no sentence end followed by another sentence. Link targets
  // are read past, since a URL's dots end nothing.
  const prose = line.replace(/\]\([^)]*\)|<[^>|]*\|/g, " ");
  if (/[.!?]\s+[A-Z]/.test(prose)) return { refusal: "One sentence only: name both sides in it." };
  return { line };
}

type Entry =
  | { kind: "partial"; sources: SourceName[] }
  | { kind: "failed" }
  | { kind: "budget" }
  | { kind: "stale"; sources: SourceName[]; days: number }
  | { kind: "absence"; scope: string }
  | { kind: "conflict"; line: string }
  | { kind: "degraded"; line: string | undefined }
  | { kind: "uncounted"; values: string[] }
  | { kind: "atLeast"; bounds: Array<{ name: string; value: number }>; whole: string };

/** One turn's ⚠️ lines, collected as its triggers are met. */
export interface WarningLog {
  /** A lookup that ran, with the text it returned. */
  lookup(name: string, text: string): void;
  /** A lookup refused before it ran, with the refusal's error. */
  refused(name: string, error: string): void;
  /** The loop ran out of round-trips and answered from what it had. */
  budgetSpent(): void;
  /** The absence pre-check fired on the draft. */
  absenceFired(ctx: AbsenceContext): void;
  /** The model's conflict line: accepted, or the refusal it reads. */
  conflict(raw: unknown): { ok: true } | { ok: false; refusal: string };
  /**
   * A shape the presentation step asked for and had to post plainer — a
   * chart that could not be grounded, posted as a table — with the reason as
   * one code-written sentence; undefined withdraws it, when a later request
   * replaced the shape that fell back. One line, the latest reason, kept in
   * the place it was first met.
   */
  degraded(line: string | undefined): void;
  /** Values a chart across lookups did not count, though its source offers
   *  them — each named once. */
  uncounted(values: readonly string[]): void;
  /** Values a chart across lookups drew at the count their lookup read, which
   *  read only part of its source: at least that many. Replaces the lookup's
   *  `partial` line. */
  atLeast(lookup: string, bounds: ReadonlyArray<{ name: string; value: number }>): void;
  /** The lines as they post, sign-less, at most `MAX_WARNING_LINES`. */
  lines(): string[];
}

/**
 * A fresh log, for one turn.
 *
 * @param now - The turn's clock, read for the freshness cutoff
 */
export function warningLog(now: () => number = Date.now): WarningLog {
  const entries: Entry[] = [];
  /** Lookups whose source failed and has not since answered, with its name. */
  const failed = new Map<string, SourceName>();
  /** Sources that answered this turn: a conflict needs two of them. */
  const read = new Set<string>();
  let conflicted = false;

  const entry = <K extends Entry["kind"]>(kind: K, make: () => Extract<Entry, { kind: K }>): Extract<Entry, { kind: K }> => {
    const found = entries.find((e): e is Extract<Entry, { kind: K }> => e.kind === kind);
    if (found) return found;
    const made = make();
    entries.push(made);
    return made;
  };
  const addSource = (list: SourceName[], source: SourceName): void => {
    if (!list.some((s) => s.label === source.label)) list.push(source);
  };

  const sentence = (e: Entry): string | null => {
    switch (e.kind) {
      case "partial":
        return `Only part of the ${joined(e.sources.map((s) => s.label))} results came back, so something may be missing.`;
      case "failed": {
        const names = [...new Map([...failed.values()].map((s) => [s.label, s])).values()];
        if (!names.length) return null;
        return `${capitalised(joined(names.map((s) => s.subject)))} could not be read just now, so this answer goes without ${names.length > 1 ? "them" : "it"}.`;
      }
      case "budget":
        return "This answer stopped before every lookup finished, so some sources went unchecked.";
      case "stale":
        return `The ${joined(e.sources.map((s) => s.label))} rows behind this answer were last updated over ${Math.round(
          e.days / 30,
        )} months ago, so they may be out of date.`;
      case "absence":
        return `I searched only ${e.scope}, so finding nothing there does not mean it was never said.`;
      case "conflict":
        return e.line;
      case "degraded":
        return e.line ?? null;
      case "atLeast": {
        const [first, ...rest] = e.bounds.map((b, i) => `${b.name}${i === 0 ? " shows" : ""} at least ${b.value}`);
        return `${joined([first!, ...rest])}; ${e.whole} has more than could be read.`;
      }
      case "uncounted":
        return `Not counted: ${joined(e.values)} ${e.values.length > 1 ? "were" : "was"} not looked up, so the chart leaves ${
          e.values.length > 1 ? "them" : "it"
        } out.`;
    }
  };

  // Each sentence once: two triggers that word the same thing are one line.
  const all = (): string[] => [...new Set(entries.map(sentence).filter((s): s is string => s !== null))];

  return {
    lookup(name, text) {
      const source = sourceOf(name);
      if (!source || rowFor(name)?.retrieval !== true) return;
      if (wasCutShort(text)) {
        entry("budget", () => ({ kind: "budget" }));
        return;
      }
      let result: Record<string, unknown>;
      try {
        const parsed = JSON.parse(text) as unknown;
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return;
        result = parsed as Record<string, unknown>;
      } catch {
        return;
      }
      if (result.ok === false) {
        if (result.error === BUDGET_REFUSAL_ERROR || result.reason === "subrequest_budget") {
          entry("budget", () => ({ kind: "budget" }));
        } else if (sourceFailed(result)) {
          failed.set(name, source);
          entry("failed", () => ({ kind: "failed" }));
        }
        return;
      }
      // The same lookup answering whole clears its earlier failure: a retry
      // that worked left nothing missing.
      failed.delete(name);
      read.add(source.label);
      if (result.truncated === true || result.partial === true) {
        addSource(entry("partial", () => ({ kind: "partial", sources: [] })).sources, source);
      }
      const cutoff = FRESHNESS_CUTOFF_DAYS[name];
      const newest = cutoff === undefined ? null : newestRow(result);
      if (cutoff !== undefined && newest !== null && now() - newest > cutoff * DAY_MS) {
        const stale = entry("stale", () => ({ kind: "stale", sources: [], days: cutoff }));
        addSource(stale.sources, source);
        stale.days = Math.min(stale.days, cutoff);
      }
    },
    refused(_name, error) {
      if (error === BUDGET_REFUSAL_ERROR) entry("budget", () => ({ kind: "budget" }));
    },
    budgetSpent() {
      entry("budget", () => ({ kind: "budget" }));
    },
    absenceFired(ctx) {
      entry("absence", () => ({ kind: "absence", scope: absenceScope(ctx) }));
    },
    degraded(line) {
      const found = entries.find((e): e is Extract<Entry, { kind: "degraded" }> => e.kind === "degraded");
      if (found) found.line = line;
      else if (line) entries.push({ kind: "degraded", line });
    },
    atLeast(lookup, bounds) {
      if (!bounds.length) return;
      const source = sourceOf(lookup);
      // The partial line said "something may be missing" of this source; this
      // one says which value and how much was read, so it takes that place.
      const at = entries.findIndex((e) => e.kind === "partial");
      const partial = entries[at] as Extract<Entry, { kind: "partial" }> | undefined;
      if (partial && source) partial.sources = partial.sources.filter((s) => s.label !== source.label);
      const whole = lookup === "roadmap_query" ? "the board" : source ? source.subject : "the source";
      const line: Entry = { kind: "atLeast", bounds: [], whole };
      if (partial && !partial.sources.length) entries.splice(at, 1, line);
      const found = entry("atLeast", () => line as Extract<Entry, { kind: "atLeast" }>);
      for (const b of bounds) if (!found.bounds.some((x) => x.name === b.name)) found.bounds.push({ ...b });
    },
    uncounted(values) {
      if (!values.length) return;
      const found = entry("uncounted", () => ({ kind: "uncounted", values: [] }));
      for (const value of values) if (!found.values.includes(value)) found.values.push(value);
    },
    conflict(raw) {
      if (conflicted) return { ok: false, refusal: "One conflict line per answer, and this answer has it." };
      if (all().length >= MAX_WARNING_LINES) {
        return { ok: false, refusal: `This answer already carries ${MAX_WARNING_LINES} ⚠️ lines, the most it takes.` };
      }
      if (read.size < 2) {
        return { ok: false, refusal: "A conflict is between two sources read this turn, and fewer than two answered." };
      }
      const checked = conflictLine(raw);
      if ("refusal" in checked) return { ok: false, refusal: checked.refusal };
      conflicted = true;
      entries.push({ kind: "conflict", line: checked.line });
      return { ok: true };
    },
    lines() {
      return all().slice(0, MAX_WARNING_LINES);
    },
  };
}
