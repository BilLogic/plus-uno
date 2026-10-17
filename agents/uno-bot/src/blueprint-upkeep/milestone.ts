// An idea at a milestone, and the words that set it beside today's blueprint.
//
// While someone explores an idea with the bot, two moments mean the idea has a
// concrete flow: a PRD staged on its card (draft-a-prd's exit), and a build
// handed to the IDE with `uno-prototype`. Each is followed by the same Check
// it offer when the quick judgement finds the idea touches today's blueprint
// — under the card (#1321), or under the hand-off reply (#1324) — and the
// comparison is the blueprint check's, run as a job on a press (`./check.ts`).
// This file reads both milestones and writes the comparison text the check
// posts: that path's steps today as `step (lane)`, the idea's own words or
// its drafted rows beside them, and a link into the blueprint app.
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
// PURE: no ports, no I/O.

import type { DraftedChange, PathToday } from "./draft";
import type { ServiceChangeInput } from "./gate";

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

/** The comparison a blueprint check posts (`./check.ts`). */
export interface Comparison {
  milestone: MilestoneKind;
  scenario: string;
  path: string;
  /** The cell the gate matched: the handle a path read starts from. */
  cellId: string;
  /** The idea's sentence that shows the change, in its own words. */
  quote: string;
  today: PathToday;
  /** The comparison as the thread reads it, in Markdown. */
  text: string;
}

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

/** A drafted row as the comparison reads it: a removal when `kind` is
 *  `deprecated`, else a cell the idea adds or changes. */
type ComparedRow = Pick<DraftedChange, "step" | "lane" | "content"> & Partial<Pick<DraftedChange, "kind" | "inferred">>;

/**
 * The comparison as a reply reads it. With the idea's drafted rows, one
 * short block per step those rows touch (§ B1): the step in bold, a "Today:"
 * line and a "Your idea:" line, each row's lane in code. Only the touched
 * steps, and in them only the touched lanes, because a step or lane listed
 * with nothing beside it reads as one the idea removes; one closing line says
 * the rest is unchanged. A removal is said only where the draft drew one, and
 * never an inferred one, which the card asks about instead. Touchpoint rows
 * are the card's: the closing line says so, and an idea whose rows are all
 * touchpoints falls back to the reply without rows. Past `MAX_COMPARED_STEPS`
 * the rest are counted. Without rows, today's steps and the idea's own words.
 *
 * @param today - The matched path
 * @param quote - The idea's sentence that shows the change
 * @param idea - The idea's drafted rows, its removals among them, when the offer drafted them
 */
export function comparisonText(today: PathToday, quote: string, idea?: readonly ComparedRow[]): string {
  const compared = idea?.length ? stepComparison(today, idea) : null;
  if (compared) return compared;
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
/** A lane whose rows the inline comparison leaves to the card. */
const TOUCHPOINT_LANE = /touchpoint/i;

/** The step-by-step comparison; null when no step has a row it shows. */
function stepComparison(today: PathToday, idea: readonly ComparedRow[]): string | null {
  const laneName = new Map(today.lanes.map((l) => [l.id, l.name]));
  const inline = (lane: string) => !TOUCHPOINT_LANE.test(lane);
  const code = (lane: string) => `\`${lane.replace(/`/g, "'")}\``;
  const said = (r: { lane: string; content: string }) => `${r.content.replace(/\.$/, "")} (${code(r.lane)})`;
  let leftAlone = false;
  let touchpoints = false;
  const steps = today.steps.flatMap((step) => {
    const cells = today.cells
      .filter((c) => c.stepId === step.id)
      .map((c) => ({ lane: laneName.get(c.laneId) ?? "", content: c.content }));
    const rows = idea.filter((r) => r.step === step.name && !r.inferred);
    if (rows.some((r) => !inline(r.lane))) touchpoints = true;
    const shown = rows.filter((r) => inline(r.lane));
    const touched = new Set(shown.map((r) => r.lane));
    const now = cells.filter((c) => inline(c.lane) && touched.has(c.lane));
    if (cells.some((c) => inline(c.lane) && !touched.has(c.lane))) leftAlone = true;
    if (!shown.length) return [];
    const drops = shown.filter((r) => r.kind === "deprecated");
    const yours = shown.filter((r) => r.kind !== "deprecated");
    const gone = new Set(rows.filter((r) => r.kind === "deprecated").map((r) => r.lane));
    const stepGoes = rows.every((r) => r.kind === "deprecated") && cells.every((c) => gone.has(c.lane));
    const todaySays = now.length ? now.map(said).join("; ") : `nothing in ${[...touched].map(code).join(", ")}`;
    const ideaSays = stepGoes ? "this step no longer happens" : [...yours.map(said), ...drops.map((r) => `no longer happens (${code(r.lane)})`)].join("; ");
    return [[`**${step.name}**`, `- Today: ${todaySays}`, `- Your idea: ${ideaSays}`]];
  });
  if (!steps.length) return null;
  const scenario = today.link ? `[*${today.scenario}*](${today.link})` : `*${today.scenario}*`;
  const lines = [`**Your idea changes how ${scenario} works today.** On *${today.path}*:`];
  for (const block of steps.slice(0, MAX_COMPARED_STEPS)) lines.push("", ...block);
  const more = steps.length - MAX_COMPARED_STEPS;
  if (more > 0) lines.push("", `…and ${more} more ${more === 1 ? "step" : "steps"}.`);
  if (leftAlone && touchpoints) lines.push("", "Nothing else on the path changes; the touchpoint changes are on the card.");
  else if (leftAlone) lines.push("", "Nothing else on the path changes.");
  else if (touchpoints) lines.push("", "The touchpoint changes are on the card.");
  return lines.join("\n");
}
