/**
 * The headless prompts' corpus, by where it lives: every `.md` under
 * `scripts/prompts/`.
 *
 * What is left there is the shared headless-intake contract
 * (`references/headless-intake.md`) that an automation filing GitHub issues
 * follows — the Worker's Figma snapshot refresh among them. The GitHub Actions
 * adapters that once lived beside it (the shipped watchdog, the integrity
 * sweep, the implement builds) are deleted, and with them the loader that
 * handed them to a model. The directory stays swept because the contract is
 * agent-facing text: `check:negation`'s `actions` scope and the harness name
 * sweep (`agents/uno-bot/tests/harness-blueprint-names.test.ts`) both read
 * this list. It carries no `embodiment:` and is never bundled, so the
 * bundler's walk cannot name it (#425).
 *
 * ONE WALK, TWO CALLERS. A second glob in the test would be the
 * one-rule-two-homes defect one level down (#159, #216); the test imports this
 * by file URL instead, since its compiled output lives under `.test-build/`
 * where a relative import cannot reach it.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** The headless prompts' root, absolute. */
export const PROMPTS_ROOT = path.join(REPO_ROOT, 'scripts', 'prompts');

/** The headless prompts' root, repo-relative — `scripts/prompts`. */
export const ACTIONS_PROMPTS_DIR = path.relative(REPO_ROOT, PROMPTS_ROOT).split(path.sep).join('/');

/**
 * Every `.md` under `root`, as paths relative to it, sorted.
 *
 * Takes the root as a parameter so a test can point it at a fixture directory
 * and watch a planted defect fail through the SAME walk the gate uses, rather
 * than through a re-implementation of it.
 *
 * @param {string} root absolute directory.
 * @returns {string[]} posix-style paths relative to `root`, sorted.
 */
export function walkPromptDocs(root) {
  return documents('.', { root });
}

/**
 * The headless prompts, as repo-relative paths in the shape `resolveBundled`
 * reads — the same shape the other two scopes hand it.
 *
 * @returns {string[]} sorted, e.g. `scripts/prompts/references/headless-intake.md`.
 */
export function actionsPromptFiles() {
  return walkPromptDocs(PROMPTS_ROOT).map((rel) => `${ACTIONS_PROMPTS_DIR}/${rel}`);
}
