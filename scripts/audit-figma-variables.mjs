#!/usr/bin/env node
/**
 * `npm run audit:figma-variables` — print the script that refreshes
 * `scripts/figma-variables-snapshot.json`.
 *
 * THE TASK THAT WAS NEVER WRITTEN. The snapshot's own note used to say the
 * `snapshot:figma-variables` script "was never created", and #339 made that the
 * first task under it: nothing could refresh the file and nothing noticed it had
 * gone stale. `check:figma-snapshots` is the second half; this is the first.
 *
 * WHY IT PRINTS RATHER THAN RUNS. Reading Figma variables needs an
 * authenticated Figma session, which no CI job and no plain `node` process here
 * has. The same reasoning as `audit:figma-registry`: a task that cannot do the
 * thing should hand you the thing to run, not pretend to have run it.
 *
 * Paste the script into `use_figma` against the library's file key, then write
 * what comes back into the snapshot — the shape is documented below and the
 * file's `capturedAt` is what `check:figma-snapshots` reads.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = 'scripts/figma-variables-snapshot.json';

/**
 * The probe.
 *
 * Names are SORTED, which the pre-2026-08-29 snapshot was not. Figma's
 * `variableIds` order is neither stable nor meaningful, so an unsorted capture
 * makes every refresh a reordering diff and hides the two or three lines that
 * actually changed.
 */
export const PROBE = `const collections = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const byId = new Map(all.map((v) => [v.id, v]));
const byType = {};
for (const v of all) byType[v.resolvedType] = (byType[v.resolvedType] ?? 0) + 1;
const collectionsOut = {};
for (const c of collections) {
  collectionsOut[c.name] = {
    modes: c.modes.map((m) => m.name),
    variables: c.variableIds.map((id) => byId.get(id)?.name).filter(Boolean).sort(),
  };
}
return { totalVariables: all.length, byType, collections: collectionsOut };`;

function main() {
  const snapshot = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, SNAPSHOT), 'utf8'));
  const counted = Object.values(snapshot.collections ?? {}).reduce(
    (n, c) => n + (c.variables?.length ?? 0),
    0,
  );

  console.log(
    `[audit:figma-variables] current snapshot: ${counted} variables in ` +
      `${Object.keys(snapshot.collections ?? {}).length} collections, captured ` +
      `${snapshot.capturedAt}.\n`,
  );
  console.log(`Paste into use_figma with fileKey ${snapshot.figmaFileKey}:\n`);
  console.log(
    PROBE.split('\n')
      .map((line) => `   ${line}`)
      .join('\n'),
  );
  console.log(
    `\nThen write the result into ${SNAPSHOT}, keeping the existing shape:\n` +
      `   note · figmaFileKey · figmaFileName · capturedAt · totalVariables · byType · collections\n` +
      `Set capturedAt to the date you ran it — check:figma-snapshots reads it, and a\n` +
      `refreshed file with a stale date is worse than no refresh at all.\n` +
      `Per-collection \`note\` fields are hand-written; carry them across.\n\n` +
      `Finally: npm run generate:token-registry`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
