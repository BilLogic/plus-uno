/** @typedef {'choice' | 'text' | 'upload' | 'link' | 'terminal'} StateType */

export const EXECUTE_PHRASE = 'uno-prototype:execute';

export const TOOL_LINKS = {
  claudeDesign: 'https://claude.ai/design',
  figjamMake: 'https://www.figma.com/figjam/',
  stitch: 'https://stitch.withgoogle.com/',
  figjam: 'https://www.figma.com/figjam/',
  v0: 'https://v0.dev/',
  googleAiStudio: 'https://aistudio.google.com/',
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

/** Shown after PRD paste (no hint) or after rejecting a PRD fidelity recommendation. */
export const FIDELITY_LEVEL_OPTIONS = ['Hi-fi', 'Mid-fi', 'Low-fi'];

/** Mid-fi branch — maps to external prompt-spec tools. */
export const CHALLENGE_OPTIONS = [
  'Validate layout & interaction',
  'Functional / working UI',
  'Other',
];

/** Low-fi branch — FigJam or Stitch prompt-spec. */
export const LOW_FI_OPTIONS = ['User flow & system', 'Data flow', 'Flow variety'];

/** Always applied for hi-fi builds — never asked or shown in the verification table. */
export const DEFAULT_DESIGN_SYSTEM = 'Plus Design System';

/** Rows shown in the hi-fi confirmation table (design system is implicit). */
export const HI_CONFIRM_TABLE_ROWS = [
  { key: 'projectName', label: 'Project name' },
  { key: 'scope', label: 'Scope' },
  { key: 'fidelity', label: 'Fidelity' },
  { key: 'requiredScreens', label: 'Required screens' },
];

/**
 * Intake steps that must complete before the agent proceeds.
 * All other FSM states are optional — invalid or off-topic replies pass through
 * to normal conversation without blocking the user prompt.
 */
export const STRICT_GATE_STATE_IDS = new Set([
  'prd_check',
  'prd_paste',
  'fidelity_select',
  'fidelity_level_pick',
  'hi_figma_check',
  'hi_figma_link',
  'hi_confirm_table',
  'hi_settings_edit',
]);
