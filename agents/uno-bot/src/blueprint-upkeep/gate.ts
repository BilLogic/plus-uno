// The service-change gate: does this work change the service, and where on
// the blueprint? Shared by every caller that drafts a blueprint revision — the
// shipped-work job here, and any turn that weighs an idea against today's
// journey.
//
// TWO SIGNALS, BOTH REQUIRED. A default-tier judgement that the text changes
// who does what, or when, for an actor in the service; AND a confident
// `search_blueprint` match on one `scenario › path`. Either failing is
// silence: one weak signal never produces a card, and a change that matches no
// scenario is never given a guessed lane.
//
// WHAT "CONFIDENT" MEANS. Cosine similarity alone cannot tell a question with
// an answer from one without (`BlueprintRow.matchedBy`, measured 2026-08-19),
// so a cell counts when two retrievers agree on it, or when its similarity
// clears `MATCH_SCORE_FLOOR`. The path with the most such cells wins.
//
// PURE: the model and the search arrive as ports.

import type { ModelProvider } from "../agent/model-provider";
import type { BlueprintRow } from "../integrations/blueprint";
import { CONFIDENCE_FLOOR, jsonObjectIn } from "../sweep/detector";

/** A lone retriever's similarity that still counts as a match. */
export const MATCH_SCORE_FLOOR = 0.75;
/** The judgement's tier: a one-line classification. */
export const GATE_TIER = "default" as const;
/** Characters of the work's text the judgement is shown. */
const MAX_TEXT_CHARS = 6_000;

export const SERVICE_CHANGE_SYSTEM = [
  "You are shown a piece of product work: its title and its text.",
  "Decide whether it changes the SERVICE — who does what, or when, for an actor in the tutoring service (a tutor, a student, a supervisor, staff, a system acting for them).",
  "- A design-system, tooling, styling, copy-only or internal-engineering change does not change the service.",
  "- A change to what an actor does, the order they do it in, or who is responsible for a moment, does.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"changes_service":true|false,"confidence":0.0,"query":"","quote":""}',
  "- confidence: 0 to 1 that your answer is right.",
  "- query: when it changes the service, a short search for the moment on the service blueprint, in plain words (the actor and the action).",
  "- quote: one sentence copied exactly from the text that shows the change.",
].join("\n");

/** The work weighed: a Roadmap card, or an idea in a thread. */
export interface ServiceChangeInput {
  title: string;
  text: string;
}

/** Where the change lands: one path, and the cells that matched on it. */
export interface ScenarioMatch {
  scenario: string;
  path: string;
  /** A matched cell's id — the handle a path read starts from. */
  cellId: string;
  rows: BlueprintRow[];
}

export type GateResult =
  | { pass: true; match: ScenarioMatch; quote: string; query: string }
  | { pass: false; reason: "not-a-service-change" | "no-confident-match" | "judgement-failed" };

export interface GateDeps {
  provider: ModelProvider;
  /** `search_blueprint`'s rows for a query. */
  search(query: string): Promise<BlueprintRow[]>;
}

export type ServiceChangeGate = (input: ServiceChangeInput) => Promise<GateResult>;

/** Whether a row is a cell the search found with confidence. */
export function isConfidentRow(row: BlueprintRow): boolean {
  if (row.kind !== "cell" || !row.id || !row.scenario || !row.path) return false;
  return (row.matchedBy ?? "").includes("+") || (row.score ?? 0) >= MATCH_SCORE_FLOOR;
}

/**
 * The confident match the rows hold, or null: the `scenario › path` with the
 * most confident cells, the first found on a tie.
 *
 * @param rows - `search_blueprint`'s rows
 */
export function confidentMatch(rows: readonly BlueprintRow[]): ScenarioMatch | null {
  const byPath = new Map<string, BlueprintRow[]>();
  for (const row of rows.filter(isConfidentRow)) {
    const key = `${row.scenario} › ${row.path}`;
    byPath.set(key, [...(byPath.get(key) ?? []), row]);
  }
  let best: BlueprintRow[] | null = null;
  for (const group of byPath.values()) if (!best || group.length > best.length) best = group;
  if (!best) return null;
  return { scenario: best[0]!.scenario!, path: best[0]!.path!, cellId: best[0]!.id, rows: best };
}

/** The quote, only when it is the text's own words; else the text's first sentence. */
function quoteFrom(quote: unknown, text: string): string {
  const q = typeof quote === "string" ? quote.trim() : "";
  if (q && text.includes(q)) return q;
  return (/[^.!?]+[.!?]/.exec(text)?.[0] ?? text.slice(0, 200)).trim();
}

/**
 * The gate over a model and a search.
 *
 * @param deps - The model (judged on the default tier) and the search
 */
export function serviceChangeGate(deps: GateDeps): ServiceChangeGate {
  return async (input) => {
    const reply = await deps.provider.generate({
      tier: GATE_TIER,
      system: SERVICE_CHANGE_SYSTEM,
      prompt: `TITLE: ${input.title}\n\nTEXT:\n${input.text.slice(0, MAX_TEXT_CHARS) || "(no text)"}`,
      maxTokens: 400,
    });
    if (!reply.ok) return { pass: false, reason: "judgement-failed" };
    const judged = jsonObjectIn(reply.text) as Record<string, unknown> | null;
    const confidence = Number(judged?.confidence);
    const query = typeof judged?.query === "string" ? judged.query.trim() : "";
    if (judged?.changes_service !== true || !(confidence >= CONFIDENCE_FLOOR) || confidence > 1 || !query) {
      return { pass: false, reason: "not-a-service-change" };
    }
    const match = confidentMatch(await deps.search(query));
    if (!match) return { pass: false, reason: "no-confident-match" };
    return { pass: true, match, query, quote: quoteFrom(judged.quote, input.text) };
  };
}
