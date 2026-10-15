/**
 * Which authored sections a component's MDX carries — the half of a component
 * doc that `generate:component-docs` detects and counts rather than writes.
 *
 * Two of the three are found by heading. Correct/incorrect is not a heading any
 * more: `check:docs-tabs` retired the `Correct and incorrect` block, and each
 * do/don't pair now sits under the `###` rule it illustrates. So a page counts
 * when some `###` rule holds both halves of a pair before the next heading. The
 * old headings still count, for pages that have not moved.
 */

export const AUTHORED_SECTIONS = [
  { key: 'whenToUse', label: 'When to use', match: /^#{2,4}\s*when (to use|not to use)/i },
  { key: 'correctIncorrect', label: 'Correct/incorrect', match: /^#{2,4}\s*(correct|do(s)? and don|usage (do|guidance))/i },
  { key: 'accessibility', label: 'Accessibility', match: /^#{2,4}\s*accessibility/i },
];

/*
 * The labels a pair is written with: a code comment (`// Incorrect —`, also
 * inside JSX as `{/* Correct *\/}`), a ✓ / ✗ glyph, or a bold Do / Don't. Plain
 * prose that happens to open with "Do not" is a sentence, not a label.
 */
const LEAD = String.raw`^(?:\/\/|\{\/\*|<!--)?\s*`;
const DONT = new RegExp(`${LEAD}(?:incorrect\\b|✗|\\*\\*don['’]t\\*\\*)`, 'i');
const DO = new RegExp(`${LEAD}(?:correct\\b|✓|\\*\\*do\\*\\*)`, 'i');

const RULE = /^###\s/;
const ANY_HEADING = /^#{1,6}\s/;

/** True when some `###` rule holds both a do and a don't before the next heading. */
function hasPairUnderRule(lines) {
  let inRule = false;
  let sawDo = false;
  let sawDont = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (ANY_HEADING.test(line)) {
      inRule = RULE.test(line);
      sawDo = false;
      sawDont = false;
      continue;
    }
    if (!inRule) continue;
    if (DONT.test(line)) sawDont = true;
    else if (DO.test(line)) sawDo = true;
    if (sawDo && sawDont) return true;
  }
  return false;
}

/** `{ whenToUse, correctIncorrect, accessibility }`, each true when the MDX carries it. */
export function authoredCoverage(mdxSource) {
  const lines = mdxSource ? mdxSource.split('\n') : [];
  const found = {};
  for (const s of AUTHORED_SECTIONS) found[s.key] = lines.some((l) => s.match.test(l.trim()));
  if (!found.correctIncorrect) found.correctIncorrect = hasPairUnderRule(lines);
  return found;
}
