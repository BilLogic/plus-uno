import { TERMINATE_PHRASES } from './constants.mjs';

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function hasWritebackIntent(prompt) {
  const lower = prompt.toLowerCase();
  return (
    /write\s*back\s+(to\s+)?figma/i.test(prompt) ||
    /push\s+(this\s+)?(to\s+)?figma/i.test(lower) ||
    /sync\s+(this\s+)?(to\s+)?figma/i.test(lower) ||
    /roundtrip\s+(to\s+)?figma/i.test(lower) ||
    /写回\s*figma/i.test(prompt) ||
    /同步到\s*figma/i.test(prompt)
  );
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function isTerminateWriteback(prompt) {
  return TERMINATE_PHRASES.some((pattern) => pattern.test(prompt));
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function isAuditCompletePhrase(prompt) {
  return /writeback:audit-passed/i.test(prompt.trim());
}
