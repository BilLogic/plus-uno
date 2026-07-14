/**
 * @param {string} value
 * @returns {boolean}
 */
export function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * True when the user says they have no PRD yet (guided exit to uno-synthesize).
 * Anchored to the whole message so a pasted PRD is never misread as "no".
 * @param {string} value
 * @returns {boolean}
 */
export function isNoPrdAnswer(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase().replace(/[.!]+$/, '');
  return /^(no|nope|no prd|no,? i don'?t|i don'?t have (a |the )?prd|don'?t have (a |the )?prd|not yet)$/.test(
    trimmed,
  );
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isHttpLink(value) {
  return /^https?:\/\/\S+/i.test(value.trim());
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isFigJamLink(value) {
  const v = value.trim();
  return isHttpLink(v) && /figma\.com\/(board|figjam)/i.test(v);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isFigmaDesignLink(value) {
  const v = value.trim();
  return isHttpLink(v) && /figma\.com\/(design|file)/i.test(v);
}

/**
 * @param {string} input
 * @param {string[]} options
 * @returns {string | null}
 */
export function parseChoice(input, options) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const index = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(index) && index >= 1 && index <= options.length) {
    return options[index - 1];
  }

  const lower = trimmed.toLowerCase();
  for (const option of options) {
    const optLower = option.toLowerCase();
    if (optLower === lower) return option;
    // Substring match only for distinctive multi-word options (avoids "other" ⊂ "another").
    if (optLower.length >= 8 && lower.includes(optLower)) return option;
  }

  return null;
}
