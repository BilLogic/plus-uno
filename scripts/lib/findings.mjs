/**
 * The findings interface — what a check returns instead of exiting.
 *
 * WHY IT EXISTS. 52 scripts in this repo each decide privately how a finding
 * looks and when the process dies: `console.error` with a bespoke prefix, a
 * hand-drawn rule of box characters, `process.exit(1)` at whatever depth the
 * decision was made. The banners are nearly the same and never quite, so a
 * reader learns each one, and a check cannot be called by anything except a
 * shell — a function that exits the process is not a function anyone composes
 * or tests.
 *
 * So a check may instead export `run(ctx) => Finding[]`. It decides what is
 * wrong; the caller decides how to say so and what to exit with. The runner
 * (`scripts/harness-runner.mjs`) calls such a check in-process and renders one
 * banner for it; the check's own CLI wrapper uses `report()` below, so the
 * message a human reads by hand and the message CI prints are the same string.
 *
 * MIGRATION IS PARTIAL ON PURPOSE. #508 builds this path and moves one check
 * onto it (`check:node-floor`, whose findings were already a pure function).
 * The other 45 keep their exit codes and the runner keeps spawning them —
 * #509 is the migration. A row in `scripts/checks.registry.mjs` declares which
 * kind it is by carrying a `module` or not.
 *
 * @typedef {object} Finding
 * @property {string}  message           what is wrong, in one sentence.
 * @property {string} [file]             repo-relative path, where it has one.
 * @property {number} [line]             1-based line, where it has one.
 * @property {'error'|'warning'} [severity]  defaults to 'error'. A warning is
 *           printed and does NOT fail the check — for the class of finding that
 *           is worth saying and not worth blocking a merge over.
 */

/** @param {Finding} finding */
export const isError = (finding) => (finding.severity ?? 'error') === 'error';

/**
 * The exit code a set of findings earns. Errors fail; warnings do not.
 *
 * @param {Finding[]} findings
 * @returns {0 | 1}
 */
export const exitCodeFor = (findings) => (findings.some(isError) ? 1 : 0);

/** `path:line  ` prefix, or nothing when the finding has no location. */
function locate(finding) {
  if (!finding.file) return '';
  return `${finding.file}${finding.line ? `:${finding.line}` : ''}  `;
}

/**
 * One banner for one check. Pure: returns the text, prints nothing, exits
 * nothing — which is what lets the runner put it under a composite's own
 * summary and lets a test assert on it.
 *
 * @param {string} name       the check's npm script name.
 * @param {Finding[]} findings
 * @param {{remedy?: string, summary?: string}} [opts]
 *        `remedy` is the paragraph a reader needs to act — printed only on
 *        failure. `summary` replaces the green line, for a check with a number
 *        worth printing when it passes.
 * @returns {string}
 */
export function renderFindings(name, findings, { remedy, summary } = {}) {
  const errors = findings.filter(isError);
  const warnings = findings.filter((f) => !isError(f));

  if (!findings.length) return `✓ ${name} — ${summary ?? 'no findings'}`;

  const lines = [];
  const counted = [
    errors.length ? `${errors.length} finding(s)` : null,
    warnings.length ? `${warnings.length} warning(s)` : null,
  ].filter(Boolean);
  lines.push(`${errors.length ? '✗' : '✓'} ${name} — ${counted.join(', ')}`);
  for (const finding of findings) {
    lines.push(`  ${isError(finding) ? '' : '(warning) '}${locate(finding)}${finding.message}`);
  }
  if (errors.length && remedy) lines.push('', `${'─'.repeat(72)}`, '', remedy);
  return lines.join('\n');
}

/**
 * The CLI half: render, print to the right stream, exit with the right code.
 * A check's own entry point is then three lines and holds no policy.
 *
 * @param {string} name
 * @param {Finding[]} findings
 * @param {{remedy?: string, summary?: string}} [opts]
 * @returns {never}
 */
export function report(name, findings, opts = {}) {
  const text = renderFindings(name, findings, opts);
  const code = exitCodeFor(findings);
  if (code === 0) console.log(text);
  else console.error(text);
  process.exit(code);
}
