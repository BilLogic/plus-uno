/**
 * Drops the retired token names (`RETIRED_TOKENS`, scripts/lib/tokens/plan.mjs)
 * from a generated SCSS file. `scripts/generate-all-tokens.js` still reads the
 * Figma exports, which carry the old names; this is what keeps a regenerate
 * from writing them back.
 *
 * A declaration is one `--name: value;` line, optionally followed by a comment.
 * Once the lines go, a section comment left with nothing under it goes too,
 * and so does a `@media` block or `:root` block left empty.
 */

import { RETIRED_TOKENS } from './plan.mjs';

const DECLARATION = /^\s*(--[\w-]+)\s*:[^;]*;.*$/;
const COMMENT_ONLY = /^\s*\/\*.*\*\/\s*$/;

/** Is this line the end of the thing it sits in (a closing brace) or nothing after it? */
const closes = (line) => line === undefined || /^\s*\}/.test(line);

/**
 * @param {string} scss
 * @param {Set<string>} [retired]
 * @returns {string}
 */
export function dropRetired(scss, retired = RETIRED_TOKENS) {
  let lines = scss.split('\n').filter((line) => {
    const match = line.match(DECLARATION);
    return !(match && retired.has(match[1]));
  });
  for (let changed = true; changed; ) {
    changed = false;
    const next = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (COMMENT_ONLY.test(line) && line.startsWith('    ')) {
        // An indented section comment with no declaration before the next comment or brace.
        let j = i + 1;
        while (lines[j] !== undefined && lines[j].trim() === '') j += 1;
        if (closes(lines[j]) || (COMMENT_ONLY.test(lines[j]) && lines[j].startsWith('    '))) {
          changed = true;
          continue;
        }
      }
      next.push(line);
    }
    lines = next;
    const joined = lines.join('\n')
      .replace(/(@media[^{\n]*\{\s*\n)\s*:root \{\s*\n\s*\}\s*\n\}\n?/g, '')
      .replace(/:root \{\s*\n\s*\}\n?/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\{\n\n/g, '{\n');
    if (joined !== lines.join('\n')) {
      changed = true;
      lines = joined.split('\n');
    }
  }
  // A top-level comment that introduced a block now removed is left at the end of the file.
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length && COMMENT_ONLY.test(lines[lines.length - 1]) && !lines[lines.length - 1].startsWith(' ')) lines.pop();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return `${lines.join('\n')}\n`;
}

/**
 * The color names already retired from the old color collections, each with
 * the `--ds-*` token its uses moved to. The generator still reads those
 * archived Figma exports for the Specs replica, so it drops these from what it
 * writes; the rest of the old color set stays only until the Specs replica
 * carries its own copy.
 */
export const RETIRED_COLORS = new Map([
  ['--color-primary-border', '--ds-border-brand'],
  ['--color-scrim', '--ds-blanket'],
  ['--color-disabled-opacity', '--ds-opacity-disabled'],
  ['--color-inverse-surface', '--ds-background-neutral-bold'],
  ['--color-inverse-on-surface', '--ds-text-inverse'],
  ['--color-focus-ring', '--ds-border-focused'],
  ['--color-focus-ring-inverse', '--ds-border-focused-inverse'],
  ['--surface-raised-shadow', '--ds-shadow-raised'],
  ['--surface-overlay-shadow', '--ds-shadow-overlay'],
  ['--elevation-light-1', '--ds-shadow-raised'],
  ['--elevation-light-2', '--ds-shadow-raised'],
  ['--elevation-light-3', '--ds-shadow-overlay'],
]);

/** The `--ds-*` token a retired color name moved to, or undefined for a name still declared. */
export const retiredTo = (name) => RETIRED_COLORS.get(name);
