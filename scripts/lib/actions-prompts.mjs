/**
 * Who is in the Actions embodiment, asked of the loader's own root.
 *
 * uno has three embodiments — the IDE, the uno-bot Worker, and headless GitHub
 * Actions (`AGENTS.md` § The loading contract names all three). The first two are swept by
 * `check:negation` and by the harness name sweep because the bundler can name
 * their members: a doc under a section root declares `embodiment:` and the
 * bundler walks for it (`bundled-set.mjs`). The Actions prompts declare
 * nothing, on purpose (#417 § Embodiment stays a document property): they are
 * loaded by `scripts/lib/skill-loader.js` and by the sweep workflows'
 * `prompt-file:`, never bundled, so a frontmatter value would be a claim
 * nothing reads. What they need is to be swept — and until #425 they were not,
 * because every sweep took its corpus from the bundler and the bundler has
 * never heard of them.
 *
 * THIS IS THE THIRD SUBJECT SET, LISTED BY WHERE IT LIVES. Membership is the
 * loader's own root, `scripts/prompts/`, walked for every `.md`: the five
 * adapters' `SKILL.md`, their `references/`, and the shared headless-intake
 * contract every sweep adapter points at. Faking `embodiment:` onto them to
 * ride the bundler's walk was the option not taken — it would have put the
 * Actions prompts under a bundler that must then be taught to skip them, which
 * is a second membership rule dressed as the first.
 *
 * ONE WALK, TWO CALLERS. `check:negation`'s `actions` scope and
 * `agents/uno-bot/tests/harness-blueprint-names.test.ts` both read this list.
 * A second glob in the test would be the one-rule-two-homes defect one level
 * down (#159, #216); the test imports this by file URL instead, since its
 * compiled output lives under `.test-build/` where a relative import cannot
 * reach it.
 *
 * The root itself is IMPORTED from the loader, not restated: the corpus is
 * "whatever the loader can reach", and a loader moved to a new directory moves
 * this walk with it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROMPTS_ROOT } from './skill-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** The Actions prompts' root, repo-relative — `scripts/prompts`. */
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
  if (!fs.existsSync(root)) return [];
  const out = [];
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), next);
      else if (entry.isFile() && entry.name.endsWith('.md')) out.push(next);
    }
  };
  walk(root, '');
  return out.sort();
}

/**
 * The Actions prompts, as repo-relative paths in the shape `resolveBundled`
 * reads — the same shape the other two scopes hand it.
 *
 * @returns {string[]} sorted, e.g. `scripts/prompts/uno-implement/SKILL.md`.
 */
export function actionsPromptFiles() {
  return walkPromptDocs(PROMPTS_ROOT).map((rel) => `${ACTIONS_PROMPTS_DIR}/${rel}`);
}
