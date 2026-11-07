/**
 * Description coverage of the generated component docs (`check:component-docs`).
 *
 * A prop description is what an agent reads to choose a value, so a prop row
 * with none is a gap, and so is a component with no summary. Gaps are recorded
 * BY NAME in `scripts/baselines/component-docs.json` and held by
 * `scripts/lib/ratchet.mjs` (`keys` form): a gap the record does not hold
 * fails, and a filled gap leaves the record through `--update`. Names rather
 * than counts, so describing one prop cannot pay for adding another
 * undescribed.
 *
 * Input, per component: `rows` (prop rows on its page, sub-components
 * included), `summary` (true when the JSDoc above the component is missing)
 * and `props` (the undescribed rows by name, `Sub.prop` for a sub-component).
 */

/** The record's key for a component's missing summary. */
export const SUMMARY = '(summary)';

/** Every gap as a ratchet key: `<Component> <prop>` or `<Component> (summary)`, sorted. */
export function gapKeys(gaps) {
  const keys = [];
  for (const [component, g] of Object.entries(gaps)) {
    if (g.summary) keys.push(`${component} ${SUMMARY}`);
    for (const prop of g.props) keys.push(`${component} ${prop}`);
  }
  return keys.sort();
}

/** What a gap key asks for, in the words a finding uses. */
export function describeGap(key) {
  const [component, what] = key.split(' ');
  return what === SUMMARY
    ? `${component} has no summary — add a JSDoc comment above the component`
    : `${component} prop \`${what}\` has no description — add a JSDoc comment above its propTypes entry`;
}

/** Totals across every component. */
export function coverage(gaps) {
  let rows = 0;
  let missing = 0;
  let summaries = 0;
  for (const g of Object.values(gaps)) {
    rows += g.rows;
    missing += g.props.length;
    if (g.summary) summaries += 1;
  }
  const described = rows - missing;
  return { rows, described, percent: rows ? Math.round((100 * described) / rows) : 100, summaries };
}
