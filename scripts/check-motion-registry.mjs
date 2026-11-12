#!/usr/bin/env node
/**
 * `npm run check:motion-registry` — every interactive component has a motion
 * row, and every row names tokens that exist (spec #2200).
 *
 * WHY. The registry (`scripts/lib/tokens/motion-registry.mjs`) is where a
 * component names its enter, exit and change motion once. A component missing
 * from it moves by whatever its CSS says; a row naming a token that is not in
 * the plan reads a custom property nothing declares.
 *
 * WHAT IT HOLDS.
 *   - Interactive components: the `## UI components` list of
 *     `design-system/agent-views/components/index.md`, less `STATIC`, the
 *     components that show and never respond or move (text, glyphs, images).
 *   - Each is a registry row or on the allow-list. A component in neither
 *     fails, so a new component cannot arrive without a row.
 *   - Each row's `enter` / `exit` / `change` is a semantic token from
 *     `MOTION_SEMANTICS` in the plan, or `linear`.
 *   - A row for a component the index does not list fails.
 *
 * THE ALLOW-LIST. `scripts/baselines/motion-registry.json`, through
 * `scripts/lib/ratchet.mjs`: the components not yet in the registry. It may
 * only shrink. A component that gains a row is reported stale until the record
 * is regenerated:
 *
 *     npm run check:motion-registry -- --update
 *
 * `--update` refuses a component the record does not hold. Never edit by hand.
 */

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { MOTION_REGISTRY } from './lib/tokens/motion-registry.mjs';
import { MOTION_SEMANTICS } from './lib/tokens/plan.mjs';

export { REPO_ROOT };
export const BASELINE = 'scripts/baselines/motion-registry.json';
export const INDEX = 'design-system/agent-views/components/index.md';

/** Components in the index that neither respond nor move. */
export const STATIC = new Set([
  'AiIcon', 'Code', 'CodeBlock', 'DateTag', 'Fieldset', 'Heading', 'Icon', 'Illustration', 'Image',
  'Logo', 'Object', 'VisuallyHidden',
]);

const ROW_TOKENS = ['enter', 'exit', 'change'];

/** Semantic token names a row may use. */
export const validTokens = () => new Set([...MOTION_SEMANTICS.map((s) => s.name), 'linear']);

/** Interactive component names in the index's UI components list, in order. */
export function interactiveComponents(index) {
  const section = index.split(/^## UI components.*$/m)[1]?.split(/^## /m)[0] ?? '';
  return [...section.matchAll(/^- \[([A-Za-z0-9]+)\]\(/gm)].map((m) => m[1]).filter((n) => !STATIC.has(n));
}

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });
const asRecord = (names) => Object.fromEntries([...names].sort().map((n) => [n, 1]));
const unregistered = (components, registry) => {
  const rows = new Set(registry.map((r) => r.component));
  return components.filter((c) => !rows.has(c));
};

const readIndex = (repoRoot) => fs.readFileSync(path.join(repoRoot, INDEX), 'utf8');

export const REMEDY =
  '  -> add the component\'s row to scripts/lib/tokens/motion-registry.mjs, naming semantic tokens from plan.mjs.\n' +
  '     The allow-list only shrinks: `npm run check:motion-registry -- --update` after a row lands; never edit it by hand.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, index, registry = MOTION_REGISTRY } = {}) {
  const components = interactiveComponents(index ?? readIndex(repoRoot));
  const findings = [];
  const valid = validTokens();
  for (const row of registry) {
    if (!components.includes(row.component)) {
      findings.push({ message: `motion registry row "${row.component}" is not an interactive component in ${INDEX}` });
    }
    for (const key of ROW_TOKENS) {
      if (row[key] !== undefined && !valid.has(row[key])) {
        findings.push({ message: `motion registry row "${row.component}" ${key} names "${row[key]}", which is not a motion token (${[...valid].join(', ')})` });
      }
    }
  }
  const missing = unregistered(components, registry);
  const ratchet = ratchetFor(repoRoot);
  for (const failure of ratchet.failures(asRecord(missing))) {
    findings.push({
      message:
        failure.kind === 'absent'
          ? failure.message
          : `motion registry: ${failure.key} is not in the registry and not on the allow-list (the allow-list cannot grow)`,
    });
  }
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(missing))) {
      findings.push({ message: `motion registry: ${entry.key} has a row now; regenerate the allow-list with \`npm run check:motion-registry -- --update\`` });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, index, registry = MOTION_REGISTRY } = {}) {
  const components = interactiveComponents(index ?? readIndex(repoRoot));
  return `${components.length - unregistered(components, registry).length} of ${components.length} interactive components in the registry; ${unregistered(components, registry).length} on the allow-list`;
}

/** `--update` re-records the allow-list downward; it refuses growth, then falls through to the gate. */
function record() {
  const missing = asRecord(unregistered(interactiveComponents(readIndex(REPO_ROOT)), MOTION_REGISTRY));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(missing).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-motion-registry] not recorded: ${rising.length} component(s) are not in the allow-list. Add a registry row instead.`);
    return;
  }
  ratchet.update(missing, {
    seed: {
      why:
        'Interactive components with no motion row in scripts/lib/tokens/motion-registry.mjs yet (spec #2200). ' +
        'The list may only shrink. Regenerate with `npm run check:motion-registry -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-motion-registry] allow-list recorded: ${Object.keys(missing).length} component(s)`);
}

main(import.meta.url, 'check:motion-registry', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
