#!/usr/bin/env node
/**
 * `npm run regenerate` — one command instead of a list someone has to remember.
 *
 * WHY IT EXISTS. Every generator and every ratchet's `--update` used to be run
 * by hand, in whatever order a PR happened to try them, and a step skipped
 * left a stale artifact `check:harness` would only report a diff on, after the
 * fact. This runs the whole chain in the order each step's inputs demand —
 * generators that other generators or checks read from first, the ratchets
 * last, because a ratchet records what the generators just produced. A no-op
 * run (nothing in the repo actually changed) leaves no diff: every step here
 * is either a generator with a stable fixed point or a ratchet that only
 * writes a baseline forward, never sideways.
 *
 * WHAT IT DOES NOT DO. Decide whether a ratchet SHOULD move. `check:ads-language
 * -- --update` and its siblings all refuse to write a rise (or, for a floor
 * like `check:docs-tabs`, a fall) on their own terms — this script does not
 * duplicate that judgment, it just runs the command and stops on the first
 * one that exits non-zero, so a refused update is reported exactly where it
 * happened rather than swallowed by a later step.
 *
 * THE RATCHET COMMANDS ARE READ FROM `scripts/checks.registry.mjs`, each row's
 * `update`, not copied here by hand, so a new ratchet is one row there and this
 * script runs it without being told to separately.
 *
 * Usage:
 *   npm run regenerate
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALL } from './checks.registry.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Generators, in dependency order: a component's generated docs and the Figma
 * links spreadsheet both read the component registry, so it goes first; the
 * knowledge index and the skill surfaces read the docs and the registry, so
 * they come after; the token generators are independent of all of the above
 * and of each other, and `check:check-registry`'s generator goes last among
 * generators because it writes the package.json block this script was just
 * invoked from.
 */
const GENERATORS = [
  'npm run generate:component-registry',
  'npm run generate:component-docs',
  'npm run generate:component-barrel',
  'npm run generate:figma-links',
  'npm run generate:icon-lists',
  'npm run generate:knowledge-components',
  'npm run generate:index',
  'npm run generate:color-tokens',
  'npm run generate:design-tokens',
  'npm run generate:tokens',
  'npm run generate:token-registry',
  'npm run generate:skill-surfaces',
  'npm run generate:check-registry',
];

/** `agents/uno-bot`'s harness bundle, run from its own package so its own deps resolve. */
const BOT_DIR = path.join(REPO_ROOT, 'agents/uno-bot');
const BUNDLE_HARNESS = { cwd: BOT_DIR, command: 'npm run bundle:harness' };

/** Every ratchet this repo can regenerate on its own; a record kept by hand has no `update`. */
const RATCHET_UPDATES = [...new Set(ALL.map((row) => row.update).filter(Boolean))];

/** One step: a shell command, and where to run it from. */
function step(command, { cwd = REPO_ROOT } = {}) {
  console.log(`\n▶ ${command}${cwd === REPO_ROOT ? '' : ` (in ${path.relative(REPO_ROOT, cwd)})`}`);
  execFileSync(command, { cwd, stdio: 'inherit', shell: true });
}

function main() {
  const steps = [
    ...GENERATORS.map((command) => ({ command })),
    fs.existsSync(path.join(BOT_DIR, 'node_modules'))
      ? { command: BUNDLE_HARNESS.command, cwd: BOT_DIR }
      : null,
    ...RATCHET_UPDATES.map((command) => ({ command })),
  ].filter(Boolean);

  if (!fs.existsSync(path.join(BOT_DIR, 'node_modules'))) {
    console.log(`\n(skipping ${BUNDLE_HARNESS.command}: agents/uno-bot has no node_modules installed here)`);
  }

  for (const { command, cwd } of steps) {
    try {
      step(command, { cwd });
    } catch (err) {
      console.error(`\n✗ regenerate stopped at: ${command}`);
      console.error(err.message);
      process.exit(typeof err.status === 'number' ? err.status : 1);
    }
  }

  console.log('\n✓ regenerate complete.');
}

main();
