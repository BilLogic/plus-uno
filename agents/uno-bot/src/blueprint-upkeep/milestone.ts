// An idea at a milestone, set beside today's blueprint.
//
// While someone explores an idea with the bot, two moments mean the idea has a
// concrete flow: a PRD staged on its card (draft-a-prd's exit), and a build
// handed to the IDE with `uno-prototype`. At either, the turn runs the
// service-change gate on the idea. When the gate passes — the idea changes who
// does what on a path it matched with confidence — the reply carries a short
// comparison: that path's steps today as `step (lane)`, the idea's own words
// beside them, and a link into the blueprint app.
//
// AT MOST ONCE PER THREAD PER SCENARIO, claimed in the thread's store once the
// path is read and the comparison is ready to show, so a read that fails
// leaves the offer for the next milestone. A repeat costs the judgement, the
// search and the read, and shows nothing. Nothing is written anywhere: the
// comparison is words in a reply.
//
// WHAT IS NOT A MILESTONE. An answer, a critique (a turn that read
// `critique-a-design`), and a reply that names `uno-prototype` without the
// hand-off's own line — "a build needs a PRD before uno-prototype" is the
// moment BEFORE a concrete flow exists.
//
// VOCABULARY. The comparison speaks the blueprint's words — scenario, path,
// step, lane — and quotes the idea as written; it never names a Roadmap
// status (GLOSSARY.md § Two vocabularies).
//
// THE SEAM AFTER IT. A `Comparison` carries the match and today's path, which
// is everything an offer to draft the idea on the blueprint needs; the turn
// hands it back on its outcome (`TurnOutcome.comparison`).
//
// PURE: the gate, the path read, the claim and the budget arrive as ports.

import { rethrowIfBudget } from "../net";
import type { ThreadRef } from "../thread-state/index";
import { GATE_SUBREQUESTS, PATH_READ_COST } from "./budget";
import type { DraftedChange, PathToday } from "./draft";
import type { ServiceChangeGate, ServiceChangeInput } from "./gate";

/** External subrequests one comparison may spend: the gate's judgement and
 *  search, then the path read. */
export const COMPARISON_SUBREQUESTS = GATE_SUBREQUESTS + PATH_READ_COST;
/** Steps shown before the rest are counted. */
const MAX_STEPS = 8;
/** The bot skill whose turns are critique, never a milestone. */
const CRITIQUE_SKILL = "critique-a-design";
/** The hand-off's own line, as file-a-ticket's shape writes it. */
const PROTOTYPE_HAND_OFF = /Run in the IDE:\s*[`*_]*uno-prototype\b/i;

export type MilestoneKind = "prd" | "prototype-hand-off";

/** A moment in the conversation where the idea has a concrete flow. */
export interface Milestone {
  kind: MilestoneKind;
  idea: ServiceChangeInput;
}

/** The comparison a reply carries. */
export interface Comparison {
  milestone: MilestoneKind;
  scenario: string;
  path: string;
  /** The cell the gate matched: the handle a path read starts from. */
  cellId: string;
  /** The idea's sentence that shows the change, in its own words. */
  quote: string;
  today: PathToday;
  /** The comparison as the reply reads it, in Markdown. */
  text: string;
}

export interface ComparisonDeps {
  gate: ServiceChangeGate;
  /** Today's path holding a cell, or null when it cannot be read. */
  readPath(cellId: string): Promise<PathToday | null>;
  /** True the first time a thread is shown a scenario's comparison; records it. */
  firstInThread(ref: ThreadRef, scenario: string): Promise<boolean>;
  /** Whether the turn has `COMPARISON_SUBREQUESTS` left beside its delivery. */
  affordable(): boolean;
}

export type MilestoneComparison = (ref: ThreadRef, milestone: Milestone) => Promise<Comparison | null>;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * The PRD a staged batch files, as an idea; null when it files none.
 *
 * @param operations - The staged batch
 */
export function prdMilestone(
  operations: ReadonlyArray<{ toolName: string; input: Record<string, unknown> }>,
): Milestone | null {
  const prd = operations.find((op) => op.toolName === "notion_create" && str(op.input.surface).toLowerCase() === "prd");
  if (!prd) return null;
  const { input } = prd;
  const sections = Array.isArray(input.sections)
    ? input.sections.map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        return [str(o.heading), str(o.body)].filter(Boolean).join("\n");
      })
    : [];
  const criteria = Array.isArray(input.acceptance_criteria) ? input.acceptance_criteria.map(str).filter(Boolean) : [];
  const text = [str(input.summary), ...sections, ...criteria.map((c) => `- ${c}`)].filter(Boolean).join("\n\n");
  return { kind: "prd", idea: { title: str(input.title), text } };
}

/**
 * The `uno-prototype` hand-off a reply carries, as an idea; null when it
 * carries none, or when the turn was a critique.
 *
 * @param reply - The words the turn is about to send
 * @param ask - What the person asked
 * @param references - The bot skills the turn read
 */
export function handOffMilestone(reply: string, ask: string, references: readonly string[]): Milestone | null {
  if (references.includes(CRITIQUE_SKILL)) return null;
  if (!PROTOTYPE_HAND_OFF.test(reply)) return null;
  return { kind: "prototype-hand-off", idea: { title: ask.trim().slice(0, 200), text: reply } };
}

/** Today's steps as `step (lane)`: each step with the first lane holding a cell there. */
function stepsToday(today: PathToday): string {
  const laneName = new Map(today.lanes.map((l) => [l.id, l.name]));
  const laneOrder = new Map(today.lanes.map((l, i) => [l.id, i]));
  const named = today.steps.map((step) => {
    const lanes = today.cells
      .filter((c) => c.stepId === step.id)
      .sort((a, b) => (laneOrder.get(a.laneId) ?? 0) - (laneOrder.get(b.laneId) ?? 0));
    const lane = lanes[0] ? laneName.get(lanes[0].laneId) : undefined;
    return lane ? `${step.name} (${lane})` : step.name;
  });
  const shown = named.slice(0, MAX_STEPS).join(" → ");
  return named.length > MAX_STEPS ? `${shown} → …and ${named.length - MAX_STEPS} more` : shown;
}

/**
 * The comparison as a reply reads it. With the idea's drafted rows, one
 * short block per step either side has (§ B1): the step in bold, a "Today:"
 * line and a "Your idea:" line, each row's lane in code, "no such step" where
 * a side has none; touchpoint lanes are left out, and past `MAX_COMPARED_STEPS`
 * the rest are counted. Without them, today's steps and the idea's own words.
 *
 * @param today - The matched path
 * @param quote - The idea's sentence that shows the change
 * @param idea - The idea's drafted rows, when the offer drafted them
 */
export function comparisonText(today: PathToday, quote: string, idea?: ReadonlyArray<Pick<DraftedChange, "step" | "lane" | "content">>): string {
  if (idea?.length) return stepComparison(today, idea);
  const place = `${today.scenario} › ${today.path}`;
  const named = today.link ? `[${place}](${today.link})` : place;
  return [
    `**Beside today's blueprint** — this changes how ${named} works.`,
    `- Today: ${stepsToday(today)}`,
    `- This idea: "${quote}"`,
  ].join("\n");
}

/** Steps the inline comparison shows before it counts the rest. */
const MAX_COMPARED_STEPS = 6;
/** A lane whose rows the inline comparison leaves to the pop-up. */
const TOUCHPOINT_LANE = /touchpoint/i;

function stepComparison(today: PathToday, idea: ReadonlyArray<Pick<DraftedChange, "step" | "lane" | "content">>): string {
  const laneName = new Map(today.lanes.map((l) => [l.id, l.name]));
  const said = (rows: ReadonlyArray<{ lane: string; content: string }>) =>
    rows.filter((r) => !TOUCHPOINT_LANE.test(r.lane)).map((r) => `${r.content.replace(/\.$/, "")} (\`${r.lane.replace(/`/g, "'")}\`)`);
  const steps = today.steps
    .map((step) => {
      const now = said(today.cells.filter((c) => c.stepId === step.id).map((c) => ({ lane: laneName.get(c.laneId) ?? "", content: c.content })));
      const yours = said(idea.filter((r) => r.step === step.name));
      return { name: step.name, now, yours };
    })
    .filter((s) => s.now.length || s.yours.length);
  const scenario = today.link ? `[*${today.scenario}*](${today.link})` : `*${today.scenario}*`;
  const lines = [`**Your idea changes how ${scenario} works today.** Today's path is *${today.path}*:`];
  for (const s of steps.slice(0, MAX_COMPARED_STEPS)) {
    lines.push("", `**${s.name}**`, `- Today: ${s.now.join("; ") || "no such step"}`, `- Your idea: ${s.yours.join("; ") || "no such step"}`);
  }
  const more = steps.length - MAX_COMPARED_STEPS;
  if (more > 0) lines.push("", `…and ${more} more ${more === 1 ? "step" : "steps"} on the blueprint.`);
  return lines.join("\n");
}

/**
 * The comparison at a milestone, over its ports. Fails quiet past a budget
 * stop: any other error is no comparison, and the reply goes out as it was.
 *
 * @param deps - The gate, the path read, the thread's claim and the budget
 */
export function milestoneComparison(deps: ComparisonDeps): MilestoneComparison {
  return async (ref, milestone) => {
    try {
      if (!deps.affordable()) return null;
      const gated = await deps.gate(milestone.idea);
      if (!gated.pass) {
        console.log(`[milestone] ${milestone.kind}: no comparison (${gated.reason})`);
        return null;
      }
      const { scenario, path, cellId } = gated.match;
      const today = await deps.readPath(cellId);
      if (!today) return null;
      // Claimed only now: a failed read leaves the offer for the next milestone.
      if (!(await deps.firstInThread(ref, scenario))) {
        console.log(`[milestone] ${milestone.kind}: ${scenario} already compared in this thread`);
        return null;
      }
      return {
        milestone: milestone.kind,
        scenario,
        path,
        cellId,
        quote: gated.quote,
        today,
        text: comparisonText(today, gated.quote),
      };
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[milestone] comparison skipped: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };
}
