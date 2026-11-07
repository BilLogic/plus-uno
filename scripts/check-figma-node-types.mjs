#!/usr/bin/env node
/**
 * `npm run check:figma-node-types` — the registry's claim about each Figma node,
 * held to a measurement.
 *
 * See `scripts/figma-node-types.mjs` for what the claim is and why the
 * measurement lives in a file. In short: `componentSetNodeId` asserts a
 * component set, some mapped nodes are not one (plain COMPONENTs, a few PAGEs), and
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
import { openRatchet } from './lib/ratchet.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY = 'design-system/figma/component-registry.json';
const RECORDING = 'design-system/figma/node-types.json';

/**
 * The floor, as a recorded baseline rather than a literal in this file. A
 * comparison over an empty recording agrees with everything, so the size is
 * asserted rather than assumed. The floor only falls by a hand edit of
 * `scripts/baselines/figma-node-types.json` that explains the deletion in its
 * `why`, in the same commit; that file holds the history. `--update` refuses a
 * fall automatically — raising the floor is the only thing it writes.
 */
export const BASELINE = 'scripts/baselines/figma-node-types.json';

export const REMEDY =
  `  -> Re-measure with \`npm run audit:figma-registry\`, run the printed probe in\n` +
  `     Figma, and record what came back in ${RECORDING} with the date.\n` +
  `     A node id only means anything inside its own file. If the count rose, run\n` +
  `     \`npm run check:figma-node-types -- --update\` to raise the floor.`;

// The registry and the recording are the two files both questions compare, so
// they are read once per root.
const inputs = byRoot((repoRoot) => {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));
  return { registry: read(REGISTRY), recording: read(RECORDING) };
});

/** Opened fresh on every call: `--update` writes the record and the gate then reads it back. */
const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { registry, recording } = inputs(repoRoot);

  const found = failures(registry, recording).map((message) => ({ message }));
  const recorded = Object.keys(recording.nodes ?? {}).length;
  const ratchet = ratchetFor(repoRoot);

  for (const failure of ratchet.failures({ minRecorded: recorded })) {
    if (failure.kind === 'absent') {
      found.push({ message: failure.message });
      continue;
    }
    found.push({
      message:
        `${recorded} recorded node type(s), fewer than the ${failure.recorded} the baseline holds. ` +
        `A comparison against an emptier recording agrees with more. If a mapping was genuinely ` +
        `deleted, record it by hand in ${BASELINE} and say which one in the commit.`,
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

/**
 * `--update` raises the floor to what was just measured. It refuses a fall —
 * which is the whole difference between regenerating the baseline and editing
 * it: a genuine deletion is recorded by hand in `scripts/baselines/figma-node-types.json`,
 * never by this flag.
 */
function record(repoRoot = REPO_ROOT) {
  const { recording } = inputs(repoRoot);
  const recorded = Object.keys(recording.nodes ?? {}).length;
  const ratchet = ratchetFor(repoRoot);
  const refused = !ratchet.absent && ratchet.failures({ minRecorded: recorded }).length > 0;
  if (refused) {
    console.error(
      `[check-figma-node-types] not recorded: ${recorded} is fewer than the current floor. ` +
        `If mappings were genuinely removed, edit ${BASELINE} by hand and say which one in the commit.`,
    );
    return;
  }
  ratchet.update(
    { minRecorded: recorded },
    {
      seed: {
        why:
          'The floor under design-system/figma/node-types.json\'s recorded node count. It may rise ' +
          'as `npm run audit:figma-registry` records more mappings, and never falls except by a ' +
          'hand edit that explains the deletion. Re-measure and raise it with ' +
          '`npm run check:figma-node-types -- --update`.',
        'sets.main.direction': 'grow-only',
      },
    },
  );
  console.log(`[check-figma-node-types] floor recorded: ${recorded}`);
}

main(import.meta.url, 'check:figma-node-types', {
  run,
  summary,
  remedy: REMEDY,
  fallThrough: { '--update': record },
});
