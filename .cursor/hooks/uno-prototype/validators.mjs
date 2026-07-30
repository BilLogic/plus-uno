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
 * True when a message is the PRD itself rather than a Yes/No answer.
 *
 * The designer very often answers "Do you have a PRD?" by simply pasting the
 * PRD. Without this, `parseChoice` rejects it as an invalid choice and the gate
 * re-asks the same question forever — the input that should satisfy the gate is
 * the input that fails it. Deliberately conservative: a real answer ("yes",
 * "no", "sure") is short and single-line, so it can never reach here.
 * @param {string} value
 * @returns {boolean}
 */
export function looksLikePrdContent(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (text.length < 40) return false;
  if (isNoPrdAnswer(text)) return false;

  const hasPrdMarker =
    /\b(prd|user flows?|acceptance criteria|requirements?|deliverables?|user stor(y|ies)|success metrics?)\b/i.test(
      text,
    );
  const hasDocReference = /https?:\/\/\S+/.test(text) || /\.(md|txt|docx?)\b/i.test(text);
  const isMultiLine = text.split('\n').filter((line) => line.trim()).length >= 2;

  return hasPrdMarker || hasDocReference || isMultiLine;
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
