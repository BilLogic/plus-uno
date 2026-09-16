#!/usr/bin/env node
/**
 * `npm run check:figma-node-types` — the registry's claim about each Figma node,
 * held to a measurement.
 *
 * See `scripts/figma-node-types.mjs` for what the claim is and why the
 * measurement lives in a file. In short: `componentSetNodeId` asserts a
 * component set, 16 of the 100 mapped nodes are not one, and
 * `isComponentSet: false` is how an entry says so. Nothing read that field
 * until this check existed, so seven entries that needed it did not have it.
 *
 * WHAT MAKES IT SAFE TO RUN IN CI. It reads two files and compares them. The
 * Figma half already happened, by hand, on the date `node-types.json` carries;
 * `npm run audit:figma-registry` prints the probe that produces it. A check
 * that needed Figma could not run here at all — see that script's header for
 * why it prints work rather than pretending to gate.
 *
 * Run: `npm run check:figma-node-types`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { failures, mappings } from './figma-node-types.mjs';
import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY = 'design-system/figma/component-registry.json';
const RECORDING = 'design-system/figma/node-types.json';

/**
 * The floor. 100 distinct ids across 102 mappings — two ids carry two mappings
 * each: `13574:1150` is shared by `DatePicker` and `DateAndTimePicker`, and
 * `13543:5904` is listed twice by `Textarea`, once as its MDX link. A
 * comparison over an empty recording agrees with everything, so the size is
 * asserted rather than assumed. Lower it only when a mapping is genuinely
 * deleted, and say which one in the commit.
 */
const MIN_RECORDED = 100;

export const REMEDY =
  `  -> Re-measure with \`npm run audit:figma-registry\`, run the printed probe in\n` +
  `     Figma, and record what came back in ${RECORDING} with the date.\n` +
  `     A node id only means anything inside its own file.`;

// The registry and the recording are the two files both questions compare, so
// they are read once per root.
const inputs = byRoot((repoRoot) => {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));
  return { registry: read(REGISTRY), recording: read(RECORDING) };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { registry, recording } = inputs(repoRoot);

  const found = failures(registry, recording).map((message) => ({ message }));
  const recorded = Object.keys(recording.nodes ?? {}).length;

  if (recorded < MIN_RECORDED) {
    found.push({
      message:
        `${recorded} recorded node type(s), fewer than the ${MIN_RECORDED} this was measured over. ` +
        `A comparison against an empty recording agrees with everything.`,
    });
  }

  return found;
}

/** The green line, and under it the shape of what was recorded. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { registry, recording } = inputs(repoRoot);
  const recorded = Object.keys(recording.nodes ?? {}).length;

  const kinds = {};
  for (const record of Object.values(recording.nodes)) {
    kinds[record.type] = (kinds[record.type] ?? 0) + 1;
  }
  const shape = Object.entries(kinds)
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => `${n} ${type}`)
    .join(' · ');

  return (
    `${mappings(registry).length} mappings over ${recorded} nodes; ` +
    `every one claims what it is (measured ${recording.measuredAt})\n` +
    `  ${shape}`
  );
}

main(import.meta.url, 'check:figma-node-types', { run, summary, remedy: REMEDY });
