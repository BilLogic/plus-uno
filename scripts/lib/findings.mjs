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
 * THE MIGRATION IS DONE (#509). #508 built this path and moved one check onto
 * it (`check:node-floor`, whose findings were already a pure function); #509
 * moved the rest. Every row in `scripts/checks.registry.mjs` now declares
 * either a `module` on this interface or `kind: 'spawn'` with the reason it
 * cannot be one — a browser, a type-checker, a test runner. "Legacy" is no
 * longer a category: a row that declares neither is a registry bug, and the
 * runner says so instead of guessing.
 *
 * @typedef {object} Finding
 * @property {string}  message           what is wrong, in one sentence.
 * @property {string} [file]             repo-relative path, where it has one.
 * @property {number} [line]             1-based line, where it has one.
 * @property {'error'|'warning'} [severity]  defaults to 'error'. A warning is
 *           printed and does NOT fail the check — for the class of finding that
 *           is worth saying and not worth blocking a merge over.
 */

import { pathToFileURL } from 'node:url';

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

/**
 * The CLI half, as one call. `#509` moved every check onto `run(ctx)`, and the
 * entry point each one needs is identical: when this module is the process
 * entry, render its findings and exit on them; when the harness runner imported
 * it, do nothing at all. Written out by hand in 40 files it is 40 chances to
 * get the `import.meta.url` comparison subtly wrong, and one of those mistakes
 * (a check that runs itself on import) is a check that runs inside the runner's
 * own process.
 *
 * `summary` is a THUNK and is called only when there is nothing to report. A
 * green line usually carries a number the check had to compute — the tightest
 * contrast ratio, the worst-case age — and several of those expressions are
 * only meaningful on the passing path; calling it eagerly would crash the
 * failing one.
 *
 * `flags` is the slot for the side doors a check offers its reader: `--list`,
 * `--report`, `--update`, `--stats`. Every one of them prints or writes INSTEAD
 * of gating, and that is the whole rule — the CLI is one branch or the other,
 * so a dispatched flag returns and the gate below never runs. Without a slot
 * for them a check had to hand-roll the entry comparison this function exists
 * to own, which is how the same three lines came to be written out in six
 * spellings. Declaration order decides which of two typed flags wins, so the
 * precedence a check wants is the order it lists them in; the flags are read
 * from `argv[2]` on, so the script's own path can never be mistaken for one.
 *
 * @param {string} moduleUrl  the caller's `import.meta.url`.
 * @param {string} name       the check's npm script name.
 * @param {{run: Function, summary?: Function, remedy?: string,
 *          flags?: Record<string, () => void>}} check
 * @returns {void}  or never, when this module is the entry point.
 */
export function main(moduleUrl, name, { run, summary, remedy, flags }) {
  if (!process.argv[1] || pathToFileURL(process.argv[1]).href !== moduleUrl) return;
  const typed = process.argv.slice(2);
  for (const [flag, handle] of Object.entries(flags ?? {})) {
    if (typed.includes(flag)) {
      handle();
      return;
    }
  }
  const findings = run() ?? [];
  report(name, findings, { remedy, summary: findings.length ? undefined : summary?.() });
}

/**
 * Memoize a check's read of the repo, so `run` and `summary` share one parse.
 *
 * A migrated check answers two questions about the same tree — what is wrong,
 * and what the green line should say — and before the migration both were
 * answered once, at module scope, because the script was the process. Keeping
 * that single parse without going back to module-scope work is what this is
 * for: `const inputs = byRoot((root) => …)` reads once per repo root, whichever
 * question asks first.
 *
 * @template T
 * @param {(repoRoot: string) => T} read
 * @returns {(repoRoot: string) => T}
 */
export function byRoot(read) {
  const cache = new Map();
  return (repoRoot) => {
    if (!cache.has(repoRoot)) cache.set(repoRoot, read(repoRoot));
    return cache.get(repoRoot);
  };
}
