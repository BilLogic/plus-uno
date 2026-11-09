/**
 * What the design-system docs checks (`check:ds-writing`, `check:ds-vocabulary`)
 * share: reading a file that may not be there, blanking code so it never reads
 * as prose, and pointing a finding at its line. The page listing they share is
 * the page model's (`pagesUnder`, `scripts/lib/docs-page.mjs`).
 */

import fs from 'node:fs';
import path from 'node:path';

/** A repo-relative file's text, or null when there is no such file (or no path). */
export const readText = (root, rel) => (rel && fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : null);

/** A repo-relative JSON file, parsed; `fallback` when there is no such file or it holds `null`. */
export const readJson = (root, rel, fallback = null) => JSON.parse(readText(root, rel) ?? 'null') ?? fallback;

/** Text with fenced code blocks blanked. */
export const withoutFences = (text) => text.replace(/^[ \t]*(`{3,}|~{3,})[\s\S]*?^[ \t]*\1[^\n]*$/gm, '');

/** Text with fenced code blocks and code spans blanked, so code never reads as prose. */
export const withoutCode = (text) => withoutFences(text).replace(/`+[^`\n]*`+/g, ' ');

/** The 1-based line of the first source line containing `anchor` (or its first words), else 1. */
export function lineOf(source, anchor) {
  const lines = source.split('\n');
  const probes = [anchor, anchor?.replace(/`/g, '').slice(0, 40), anchor?.slice(0, 24)].filter((p) => p && p.length > 3);
  for (const probe of probes) {
    const k = lines.findIndex((l) => l.includes(probe));
    if (k !== -1) return k + 1;
  }
  return 1;
}
