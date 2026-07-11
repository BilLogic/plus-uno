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
  /terminate (this )?(process|workflow|session)/i,
  /cancel (this )?(workflow|process)/i,
  /abort (workflow|process)/i,
  /stop (this )?(process|workflow)/i,
];

export const FIDELITY_OPTIONS = [
  'High-fidelity prototype',
  'Challenge / Ideation',
  'User Flow',
  'Data Flow',
  'Flow Variety',
];

export const HI_CONFIRM_FIELDS_WITH_FIGMA = [
  { key: 'projectName', question: 'What is the project name?' },
  { key: 'scope', question: 'What is the project scope?' },
  { key: 'fidelity', question: 'Confirm the fidelity level for this build.' },
  { key: 'designSystem', question: 'Which design system should be used?' },
  { key: 'otherSettings', question: 'Any other required project settings? (Reply "none" if not applicable.)' },
];

export const HI_CONFIRM_FIELDS_NO_FIGMA = [
  { key: 'projectName', question: 'What is the project name?' },
  { key: 'scope', question: 'What is the project scope?' },
  { key: 'fidelity', question: 'Confirm the fidelity level for this build.' },
  { key: 'designSystem', question: 'Which design system should be used?' },
  { key: 'requiredScreens', question: 'List the required screens.' },
];
