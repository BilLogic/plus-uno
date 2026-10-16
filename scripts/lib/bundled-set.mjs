/**
 * What is in the bot's prompt, asked of the bundler itself.
 *
 * Membership is a property of a document — each one declares
 * `embodiment: all | ide | uno-bot` and `agents/uno-bot/scripts/bundle-harness.mjs`
 * globs for it (#159). Delivery is too (`disclosure: reference`, #423). A guard
 * that wants either answer asks the bundler, through this adapter, and keeps no
 * folder list, naming rule or member parse of its own.
 *
 * IN-PROCESS. The adapter calls the bundler's `assemble()` and reads the
 * manifest it returns: the members in load order with their section and
 * delivery, the census, the char budgets and the section rows. The answer is
 * computed from the tree as it stands, so there is no log line, generated
 * prompt or build file to read back, and nothing to cross-check against a copy.
 * A stale committed bundle is `check:harness-bundle`'s finding; the sets here
 * describe the docs, which is what the guards over them measure.
 *
 * A TREE THE BUNDLER REFUSES STOPS THE CALLER. `assemble()` refuses a doc with
 * no `embodiment`, a `disclosure` it cannot honor or a blown hard budget, and
 * none of those is a finding of the calling guard (#204) — so the failure path
 * is a report that says whose problem it is and relays the bundler's own words.
 * `tryHarnessManifest` returns it, for a check the harness runner calls
 * in-process; `harnessManifest` prints it and exits, for a guard run from a
 * shell.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assemble } from '../../agents/uno-bot/scripts/bundle-harness.mjs';
import { byRoot } from './findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

const REBUNDLE = 'npm --prefix agents/uno-bot run bundle:harness';

/** One assembly per repo root: the runner's checks share a single read of the tree. */
const assembly = byRoot((repoRoot) => assemble({ repoRoot }));

/**
 * What the reader is owed when the bundler refuses the tree.
 *
 * Pure, so the message can be asserted without arranging a broken tree.
 *
 * @param {{messages: string[]}} refusal the bundler's error findings, verbatim.
 * @param {{tag?: string, notThis?: string}} [caller] how the calling guard names
 *   itself in the log, and the name of ITS measurement — so the reassurance
 *   below ("nothing is wrong with X") points at the right number.
 * @returns {string} the whole report, ready for stderr.
 */
export function bundlerFailureReport({ messages }, caller = {}) {
  const { tag = 'negation', notThis = 'the prohibition-token count' } = caller;
  const said = messages.map((m) => `  ${m.replace(/\n/g, '\n  ')}`).join('\n');
  return (
    `[${tag}] the harness bundler refused the tree, so this check could not read the bundled set.\n` +
    `  Its own diagnostic:\n\n` +
    (said || '  (the bundler gave no reason)') +
    `\n\n  -> Nothing is wrong with ${notThis}: the bundler stopped, so the list of\n` +
    '     bundled docs was never available and not one doc was counted. Fix what it\n' +
    `     names, then regenerate and re-run this check:\n` +
    `       ${REBUNDLE}`
  );
}

/**
 * The bundler's manifest, REPORTING a refusal instead of exiting on it — for a
 * check the harness runner calls in-process, where a `process.exit` would take
 * the whole composite down.
 *
 * @param {{tag?: string, notThis?: string, repoRoot?: string}} [caller]
 * @returns {{manifest: object|null, error: string|null}}
 */
export function tryHarnessManifest({ repoRoot = REPO_ROOT, ...caller } = {}) {
  const built = assembly(repoRoot);
  const refused = built.findings.filter((f) => (f.severity ?? 'error') === 'error');
  if (refused.length || !built.manifest) {
    return { manifest: null, error: bundlerFailureReport({ messages: refused.map((f) => f.message) }, caller) };
  }
  return { manifest: built.manifest, error: null };
}

/**
 * The bundler's manifest, exiting with the report on a refusal — for a guard
 * reached from a shell.
 *
 * @param {{tag?: string, notThis?: string, repoRoot?: string}} [caller]
 * @returns {{census: {underRoots: number, bundled: number, disclosed: number, ideOnly: number},
 *            budgets: Record<string, number>, floor: object, assembled: object,
 *            sections: {name: string, roots: string[]}[], members: object[]}}
 */
export function harnessManifest(caller = {}) {
  const { manifest, error } = tryHarnessManifest(caller);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  return manifest;
}

/** The paths of the manifest rows with one delivery, in manifest order. */
const pathsDelivered = (manifest, delivery) =>
  manifest.members.filter((m) => m.delivery === delivery).map((m) => m.path);

/**
 * The three answers the walk gives, from one assembly: `bundled` is the prompt
 * in load order, `disclosed` the reference map behind `read_reference`, and
 * `ide` the docs under the same roots that declare `embodiment: ide`.
 *
 * @param {{tag?: string, notThis?: string, repoRoot?: string}} [caller]
 * @returns {{bundled: string[], disclosed: string[], ide: string[]}}
 */
export function harnessSets(caller = {}) {
  const manifest = harnessManifest(caller);
  return {
    bundled: pathsDelivered(manifest, 'bundled'),
    disclosed: pathsDelivered(manifest, 'disclosed'),
    ide: pathsDelivered(manifest, 'ide-only').sort(),
  };
}

/**
 * Every doc the WORKER reads — the prompt plus the reference map. The corpus a
 * guard over "what the bot can be told" walks; `bundled` alone would let a doc
 * escape the guard by leaving the prompt for the map.
 *
 * @param {{tag?: string, notThis?: string, repoRoot?: string}} [caller]
 * @returns {string[]}
 */
export function workerFiles(caller = {}) {
  const { bundled, disclosed } = harnessSets(caller);
  return [...bundled, ...disclosed];
}

/**
 * Read the listed docs off disk, KEEPING the ones that did not resolve.
 *
 * A doc whose path stopped resolving used to leave the corpus with no error
 * (#234). Pure — it RETURNS the shortfall rather than exiting on it, so each
 * caller can fold it into its own report.
 *
 * @param {string[]} files repo-relative paths, in load order.
 * @returns {{declared: number, docs: {label: string, text: string}[], missing: string[]}}
 */
export function resolveBundled(files) {
  const docs = [];
  const missing = [];
  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    if (fs.existsSync(abs)) docs.push({ label: rel, text: fs.readFileSync(abs, 'utf8') });
    else missing.push(rel);
  }
  return { declared: files.length, docs, missing };
}

/**
 * What the reader is owed when a declared doc does not resolve.
 *
 * @param {{missing: string[], declared: number, tag?: string}} shortfall
 * @returns {string}
 */
export function unresolvedReport({ missing, declared, tag = 'negation' }) {
  return (
    `[${tag}] ${missing.length} of the ${declared} doc(s) the bundler declares did not resolve\n` +
    `  on disk, so this check would have measured ${declared - missing.length}:\n` +
    missing.map((f) => `    ${f}`).join('\n') +
    '\n  -> A doc in the bundle with no file behind it is a broken bundle or a broken path,\n' +
    '     and either way the corpus is short. Measuring the remainder and reporting it as\n' +
    '     the whole is what #234 removed. Fix the path, or re-run the bundler:\n' +
    `       ${REBUNDLE}`
  );
}
