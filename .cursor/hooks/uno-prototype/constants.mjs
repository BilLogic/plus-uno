/** @typedef {'choice' | 'text' | 'upload' | 'link' | 'terminal'} StateType */

/** Where to send the designer when no PRD exists yet (awaiting_prd_synthesize). */
export const TOOL_LINKS = {
  unoSynthesize: 'skills/uno-synthesize',
  unoBot: '@uno-bot in Slack',
};

export const GLOBAL_COMMANDS = {
  back: /^(back|previous|go back)$/i,
  restart: /^(restart|start over)$/i,
};

/** User phrases that exit the workflow without invoking uno-prototype. */
export const BYPASS_PATTERNS = [
  /#skip-prd-gate/i,
  /skip-prd-gate/i,
  /skip prd upload/i,
  /skip prd/i,
  /^quit$/i,
  /terminate (this )?(prototyping )?(process|workflow|session)/i,
  /cancel (this )?(workflow|process)/i,
  /abort (workflow|process)/i,
  /stop (this )?(process|workflow)/i,
];

/** First intake step — AskQuestion choice when prototype intent is detected. */
export const PRD_CHECK_QUESTION = 'Do you have a PRD?';

/** Second step after Yes — paste link, body, or attach a file. */
export const PRD_PASTE_MESSAGE =
  'Paste a PRD link or text, or attach a PRD file.';

/**
 * One-line map of the whole intake, shown by the agent WITH the first question
 * so the designer knows the shape of the road before walking it (cold-start
 * expectation setting). Rendered once at prd_check, not repeated every turn.
 */
export const FLOW_MAP =
  'PRD → what you want to achieve → the artifact (your words first, then a suggestion) → fidelity → what to leave out → confirm the brief → build';

/**
 * Step 2 (Prototype Reflection) — now enforced as FSM gate states, not just a
 * prose handoff hint. The FSM guarantees the four questions are asked in order,
 * ONE per turn; the agent still composes the PRD-specific options and
 * recommendations. `guidance` is passed through to the agent via
 * active-intake-question.json so the SKILL.md presentation rules are preserved.
 *
 * Q2 (artifact) is asked in TWO beats over two turns: an OPEN-ENDED beat
 * (`reflect_artifact_open`, openEnded) where the designer describes what they
 * picture in their own words BEFORE any recommendation, then the recommendation
 * beat (`reflect_artifact`) that reflects their framing back. Both carry
 * stepIndex 2 — it is one question in two moves, so the count stays four. This
 * removes the anchoring risk of leading with "(Recommended)" on the one choice
 * most vulnerable to it.
 *
 * After Q4 a `reflect_confirm` gate assembles the four answers into ONE brief
 * card (goal · artifact · fidelity · exclusions) and asks for a single
 * confirmation — the contract. Decisions were previously scattered across four
 * turns with no unifying anchor; the card is also the objective the Step 4
 * validation loop checks the artifact against.
 *
 * Anti-rubber-stamp rule (all steps): every recommendation must cite concrete
 * PRD evidence, and confirm-option labels must RESTATE the content being
 * confirmed (never a bare "All look right") — a designer should never be able
 * to approve something without reading what it says.
 *
 * The whole step is framed as reflecting *with* the designer, never deciding
 * *for* them; the designer can say "back" at any beat to revise an earlier
 * answer.
 */
export const REFLECTION_STEP_TOTAL = 4;

/** @type {Record<string, { stepIndex?: number; multiSelect: boolean; question: string; guidance: string; openEnded?: boolean; confirm?: boolean; progressLabel: string }>} */
export const REFLECTION_STEPS = {
  reflect_learn: {
    stepIndex: 1,
    multiSelect: true,
    progressLabel: 'Reflection · Q1 of 4',
    question: 'Step 2 · Q1 — What are you trying to achieve?',
    guidance:
      'Recommend the most likely goal(s) for THIS PRD (multi-select), each anchored to concrete PRD evidence (quote or name the section that suggests it). Vocabulary to pick from — do not dump it all: validate usability · explore concepts · compare alternatives · evaluate visual direction · communicate product vision · align stakeholders · reduce engineering ambiguity. Lead with the recommended goal(s), one line of why each. Frame this as reflecting *with* the designer on what this prototype is for — not deciding it for them.',
  },
  // Q2, beat 1 — open-ended, no recommendation yet (anti-anchoring).
  reflect_artifact_open: {
    stepIndex: 2,
    multiSelect: false,
    openEnded: true,
    progressLabel: 'Reflection · Q2 of 4 (your words first)',
    question: 'Step 2 · Q2 — In your own words, what do you picture making?',
    guidance:
      'OPEN-ENDED FIRST — ask the designer to describe, in their own words, what artifact they imagine (a rough sketch, a clickable flow, a polished screen, a map, …). Do NOT offer a recommendation or an options list this beat — the point is to hear their framing before you anchor it. Next turn you will reflect it back and recommend. Accept any non-empty description to advance.',
  },
  // Q2, beat 2 — the recommendation, reacting to what they just said.
  reflect_artifact: {
    stepIndex: 2,
    multiSelect: false,
    progressLabel: 'Reflection · Q2 of 4 (suggestion)',
    question: 'Step 2 · Q2 — Here is the artifact I would suggest — does it fit?',
    guidance:
      'Building on what the designer just described in their own words, acknowledge their framing first, THEN offer ONE recommended artifact + ONE alternative + Other (not the full list), each tied to their description and the PRD. Vocabulary: user flow · journey map · wireframe (incl. quick ASCII sketch in-chat) · static mockup · concept image · storyboard · interactive prototype · functional prototype. One line of tradeoff each; never imply only one correct answer — this is prototyping *with* them.',
  },
  reflect_fidelity: {
    stepIndex: 3,
    multiSelect: false,
    progressLabel: 'Reflection · Q3 of 4',
    question: 'Step 2 · Q3 — What fidelity is actually needed?',
    guidance:
      'FIRST render each dimension as a labeled low↔high scale line so the designer sees the dials at a glance, e.g. `Visual      low ──●───── high — wireframe-clean is enough`, for Visual, Interaction, Scope, Complexity — each placement justified by concrete PRD evidence, not generic reasoning. THEN this AskQuestion confirms or adjusts; the confirm option label must RESTATE the settings (e.g. "Yes: mid visual, real interactions, 3 screens"), never a bare "All look right".',
  },
  reflect_exclude: {
    stepIndex: 4,
    multiSelect: false,
    progressLabel: 'Reflection · Q4 of 4',
    question: 'Step 2 · Q4 — What should the prototype intentionally NOT include?',
    guidance:
      'State the "won\'t include" list in prose (screens skipped · interactions left fake · flows that need not exist · details that won\'t move the goal), each item traceable to the PRD or the stated goal. THEN confirm with one confirm option that RESTATES the key exclusions + two alternatives + Other.',
  },
  // The contract gate — one card, one confirmation, then build.
  reflect_confirm: {
    multiSelect: false,
    confirm: true,
    progressLabel: 'Reflection · confirm the brief',
    question: 'Step 2 · Brief — Here is the prototype brief we built together. Ship it to the build?',
    guidance:
      'Assemble the four answers (in the `reflection` field of the intake JSON) into ONE compact brief card — a markdown table with rows: Goal · Artifact · Fidelity · Won\'t include. This card is the contract the build will be checked against, so wording matters more than brevity. Ask ONE AskQuestion: a confirm option whose label restates the brief in a phrase, plus "adjust one of the four" (they can also just say "back"), plus Other.',
  },
};

/**
 * Intake steps that must complete before the agent proceeds: the PRD gate
 * (prd_check → prd_paste) and the Step 2 reflection (the reflect_* states).
 * Every one is strict — an empty/invalid reply re-prompts the same step instead
 * of falling through — which is why the engine has no non-strict branch. Once
 * the last reflection answer lands the hook releases and the agent runs Step 3
 * (Plan) → Step 4 (Generate).
 */
