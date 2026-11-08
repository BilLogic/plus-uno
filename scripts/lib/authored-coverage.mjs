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

import { readDocsPage } from './docs-page.mjs';

/** Each authored section, by the section or subsection title that carries it. */
export const AUTHORED_SECTIONS = [
  { key: 'whenToUse', label: 'When to use', match: /^(when (to use|not to use)|usage$)/i },
  { key: 'correctIncorrect', label: 'Correct/incorrect', match: /^(correct|do(s)? and don|usage (do|guidance))/i },
  { key: 'accessibility', label: 'Accessibility', match: /^accessibility/i },
];

/*
 * The labels a pair is written with: a code comment (`// Incorrect —`, also
 * inside JSX as `{/* Correct *\/}`), a ✓ / ✗ glyph, a bold Do / Don't, or the
 * `Do:` / `Don't:` lines the page model writes for a do/don't pair. Plain
 * prose that happens to open with "Do not" is a sentence, not a label.
 */
const LEAD = String.raw`^(?:\/\/|\{\/\*|<!--)?\s*`;
const DONT = new RegExp(`${LEAD}(?:incorrect\\b|✗|\\*\\*don['’]t\\*\\*|don['’]t:)`, 'i');
const DO = new RegExp(`${LEAD}(?:correct\\b|✓|\\*\\*do\\*\\*|do:)`, 'i');

/** True when a rule's text holds both a do and a don't. */
function holdsPair(text) {
  let sawDo = false;
  let sawDont = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (/^#{1,6}\s/.test(line)) break;
    if (DONT.test(line)) sawDont = true;
    else if (DO.test(line)) sawDo = true;
  }
  return sawDo && sawDont;
}

/** `{ whenToUse, correctIncorrect, accessibility }`, each true when the page carries it, read through the page model. */
export function authoredCoverage(mdxSource) {
  const { sections } = readDocsPage(mdxSource ?? '');
  const titled = sections.flatMap((s) => [s, ...s.subsections]);
  const found = {};
  for (const s of AUTHORED_SECTIONS) found[s.key] = titled.some((t) => s.match.test(t.title.trim()));
  // A rule is a `###` block: a subsection under a `##` section, or a section on a page with no `##`.
  const rules = titled.filter((t) => t.level === 3);
  if (!found.correctIncorrect) found.correctIncorrect = rules.some((r) => holdsPair(r.text));
  return found;
}
