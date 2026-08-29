#!/usr/bin/env node
/**
 * `npm run check:figma-node-types` — the registry's claim about each Figma node,
 * held to a measurement.
 *
 * See `scripts/figma-node-types.mjs` for what the claim is and why the
 * measurement lives in a file. In short: `componentSetNodeId` asserts a
 * component set, 15 of 95 mapped nodes are not one, and `isComponentSet: false`
 * is how an entry says so. Nothing read that field until this check existed, so
 * seven entries that needed it did not have it.
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY = 'design-system/figma/component-registry.json';
const RECORDING = 'design-system/figma/node-types.json';

/**
 * The floor. 96 distinct ids across 98 mappings — two ids are mapped twice, by
 * two components that share a Figma set, and `Tag` added one on 2026-08-29. A comparison over an empty recording
 * agrees with everything, so the size is asserted rather than assumed. Lower it
 * only when a mapping is genuinely deleted, and say which one in the commit.
 */
const MIN_RECORDED = 96;

const registry = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, REGISTRY), 'utf8'));
const recording = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, RECORDING), 'utf8'));

const found = failures(registry, recording);
const recorded = Object.keys(recording.nodes ?? {}).length;

if (recorded < MIN_RECORDED) {
  found.push(
    `${recorded} recorded node type(s), fewer than the ${MIN_RECORDED} this was measured over. ` +
      `A comparison against an empty recording agrees with everything.`,
  );
}

if (found.length) {
  console.error(`\n[figma-node-types] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(`✗ check:figma-node-types — ${mappings(registry).length} mappings\n`);
  console.error(
    `  -> Re-measure with \`npm run audit:figma-registry\`, run the printed probe in\n` +
      `     Figma, and record what came back in ${RECORDING} with the date.\n` +
      `     A node id only means anything inside its own file.`,
  );
  process.exit(1);
}

const kinds = {};
for (const record of Object.values(recording.nodes)) {
  kinds[record.type] = (kinds[record.type] ?? 0) + 1;
}
const shape = Object.entries(kinds)
  .sort((a, b) => b[1] - a[1])
  .map(([type, n]) => `${n} ${type}`)
  .join(' · ');

console.log(
  `✓ check:figma-node-types — ${mappings(registry).length} mappings over ${recorded} nodes; ` +
    `every one claims what it is (measured ${recording.measuredAt})`,
);
console.log(`  ${shape}`);
