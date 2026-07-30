/**
 * Extract lightweight hints from PRD text (e.g. Figma links). Retained for the
 * PRD cache/context; never used to skip a step.
 */

/**
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function extractPrdHints(text) {
  if (!text || typeof text !== 'string') return {};

  const figmaLinks = [...text.matchAll(/https?:\/\/[^\s)\]>]*figma\.com[^\s)\]>]*/gi)].map((m) => m[0]);

  return {
    mentionsFigma: /figma\.com/i.test(text) || figmaLinks.length > 0,
    figmaLinks,
  };
}
