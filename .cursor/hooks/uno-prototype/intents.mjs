import { hasInlinePrdSections } from './validators.mjs';
import { BYPASS_PATTERNS } from './constants.mjs';

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function hasPrototypeIntent(prompt) {
  const lower = prompt.toLowerCase();

  if (/uno-review|review (this |the )?prototype|critique.{0,20}prototype/.test(lower)) {
    return false;
  }

  if (/uno-prototype|\/uno:prototype|\/uno-prototype|@skills\/uno-prototype/.test(lower)) {
    return true;
  }

  return /prototype this|scaffold (a )?playground|implement (this )?(figma|design)|build .{0,40}playground|build this prd|sketch the flow|flow sketch|map the data flow|generate a draft to validate/.test(
    lower,
  );
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function isBypassRequest(prompt) {
  return BYPASS_PATTERNS.some((pattern) => pattern.test(prompt));
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function isExecuteRequest(prompt) {
  return /uno-prototype:execute/i.test(prompt.trim());
}

/**
 * @param {string} prompt
 * @param {Array<{ type?: string; file_path?: string }>} [attachments]
 * @returns {boolean}
 */
export function hasPrdSignal(prompt, attachments = []) {
  if (/https?:\/\/\S*notion\.(so|site)\S*/i.test(prompt)) return true;
  if (/https?:\/\/\S*docs\.google\.com\S*/i.test(prompt)) return true;
  if (/[a-zA-Z0-9_./-]+\.(md|pdf)/i.test(prompt)) return true;
  if (attachments.some((a) => a?.type === 'file')) return true;
  return hasInlinePrdSections(prompt);
}
