/**
 * @param {string} value
 * @returns {boolean}
 */
export function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
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
 * @param {Array<{ type?: string; file_path?: string }>} [attachments]
 * @returns {boolean}
 */
export function isUploadOrLink(value, attachments = []) {
  if (isHttpLink(value)) return true;
  if (/\.(pdf|md|docx?)$/i.test(value.trim())) return true;
  return attachments.some((a) => a?.type === 'file' && a?.file_path);
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
 * @param {string} value
 * @param {Array<{ type?: string; file_path?: string }>} [attachments]
 * @returns {boolean}
 */
export function isPrdDocument(value, attachments = []) {
  const v = value.trim();
  if (isUploadOrLink(v, attachments)) {
    if (/notion\.(so|site)/i.test(v)) return true;
    if (/docs\.google\.com/i.test(v)) return true;
    if (/\.(pdf|md)$/i.test(v)) return true;
    if (attachments.length > 0) return true;
  }
  return hasInlinePrdSections(v);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function hasInlinePrdSections(text) {
  const lower = text.toLowerCase();
  const patterns = [
    /acceptance criteria/,
    /user flows?/,
    /out of scope/,
    /#+ prd/,
    /## (scope|requirements)/,
    /success metrics/,
    /open questions/,
  ];
  let markers = 0;
  for (const pattern of patterns) {
    if (pattern.test(lower)) markers += 1;
  }
  return markers >= 2;
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
    if (option.toLowerCase() === lower) return option;
    if (lower.includes(option.toLowerCase())) return option;
  }

  return null;
}
