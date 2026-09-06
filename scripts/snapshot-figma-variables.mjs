#!/usr/bin/env node
/**
 * `npm run snapshot:figma-variables` — refresh
 * `scripts/figma-variables-snapshot.json` from the live Figma library.
 *
 * THE TASK THAT WAS NEVER WRITTEN. The snapshot's own note used to say the
 * `snapshot:figma-variables` script "was never created", and #339 made that the
 * first task under it: nothing could refresh the file and nothing noticed it had
 * gone stale. `check:figma-snapshots` is the second half; this is the first.
 * It shipped under the name `audit:figma-variables` in #359 and carries the
 * name the ticket asked for from #339's refresh pass onward — one name, and the
 * one the snapshot's note has always promised.
 *
 * WHY IT PRINTS RATHER THAN FETCHES. Reading Figma variables needs an
 * authenticated Figma session, which no CI job and no plain `node` process here
 * has: the REST route to variables is `GET /v1/files/:key/variables/local`, and
 * that endpoint answers `403 — This endpoint requires the file_variables:read
 * scope`, a scope this account is not offered at all (docs/connectors/figma.md).
 * The Plugin API can read them, so the capture is a script somebody runs in
 * Figma. The same reasoning as `audit:figma-registry`: a task that cannot do the
 * thing should hand you the thing to run, not pretend to have run it.
 *
 * BUT IT DOES WRITE THE FILE. Printing alone left the second half of the
 * refresh — 361 variable names typed into JSON by hand — which is how a
 * "refresh" becomes a transcription with a stale `capturedAt` on top. `--write`
 * takes what the probe returned and writes the snapshot: sorted, counted,
 * dated, with the hand-authored prose carried across. Running it twice with the
 * same probe output on the same day produces no diff.
 *
 * Usage:
 *   npm run snapshot:figma-variables                  print the probe to paste
 *   npm run snapshot:figma-variables -- --write P     write the snapshot from
 *                                                     the probe's JSON result P
 *   npm run snapshot:figma-variables -- --write P --date 2026-09-06
 *                                                     stamp a capture date other
 *                                                     than today
 *
 * After a write: `npm run generate:token-registry`, then
 * `npm run check:figma-snapshots`.
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

/** Variables in a snapshot or probe result, counted from the lists themselves. */
export function count(doc) {
  return Object.values(doc?.collections ?? {}).reduce((n, c) => n + (c.variables?.length ?? 0), 0);
}

/**
 * The refreshed snapshot.
 *
 * Three kinds of field, and only one of them comes from Figma:
 *
 *   from the probe   totalVariables, byType, collections[*].modes/variables
 *   hand-authored    note, collections[*].note — carried across, because they
 *                    say WHY a collection is shaped as it is and the probe has
 *                    no opinion about that
 *   this run         capturedAt
 *
 * @param {object} previous The snapshot being replaced.
 * @param {object} probe The probe's returned object.
 * @param {string} capturedAt `YYYY-MM-DD`.
 */
export function refreshed(previous, probe, capturedAt) {
  if (!probe || typeof probe !== 'object' || !probe.collections) {
    throw new Error('probe result has no `collections` — is this the object the probe returned?');
  }

  const collections = {};
  for (const [name, live] of Object.entries(probe.collections)) {
    const carried = previous?.collections?.[name] ?? {};
    collections[name] = {
      ...(carried.note ? { note: carried.note } : {}),
      modes: live.modes ?? [],
      variables: [...(live.variables ?? [])].sort(),
    };
  }

  const out = {
    note: previous?.note,
    figmaFileKey: previous?.figmaFileKey,
    figmaFileName: previous?.figmaFileName,
    capturedAt,
    totalVariables: count({ collections }),
    byType: probe.byType ?? {},
    collections,
  };

  // A collection that vanished from the probe is a real possibility and a loud
  // one: it is named here rather than silently dropped, because the floor in
  // check:figma-snapshots only sees the total.
  const gone = Object.keys(previous?.collections ?? {}).filter((n) => !(n in collections));
  return { snapshot: out, droppedCollections: gone };
}

/** `--write P --date D` out of argv. */
export function parseArgs(argv) {
  const args = { write: null, date: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--write') args.write = argv[++i] ?? null;
    else if (argv[i] === '--date') args.date = argv[++i] ?? null;
  }
  return args;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function printProbe(snapshot) {
  console.log(
    `[snapshot:figma-variables] current snapshot: ${count(snapshot)} variables in ` +
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
    `\nSave what it returns to a file, then write the snapshot with it:\n` +
      `   npm run snapshot:figma-variables -- --write /tmp/probe.json\n\n` +
      `That sets capturedAt to today — check:figma-snapshots reads it, and a\n` +
      `refreshed file with a stale date is worse than no refresh at all.\n\n` +
      `Finally: npm run generate:token-registry`,
  );
}

function write(snapshotPath, args) {
  const previous = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const probe = JSON.parse(fs.readFileSync(args.write, 'utf8'));
  const capturedAt = args.date ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedAt)) {
    console.error(`[snapshot:figma-variables] --date must be YYYY-MM-DD, got ${capturedAt}`);
    process.exit(1);
  }

  const { snapshot, droppedCollections } = refreshed(previous, probe, capturedAt);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');

  const before = count(previous);
  const after = count(snapshot);
  const delta = after - before;
  console.log(
    `[snapshot:figma-variables] wrote ${SNAPSHOT}: ${after} variables in ` +
      `${Object.keys(snapshot.collections).length} collections, captured ${capturedAt} ` +
      `(was ${before} at ${previous.capturedAt}${delta === 0 ? '' : `, ${delta > 0 ? '+' : ''}${delta}`}).`,
  );
  for (const name of droppedCollections) {
    console.log(`  ! collection \`${name}\` is in the old snapshot and not in the probe.`);
  }
  console.log('\nNext: npm run generate:token-registry && npm run check:figma-snapshots');
}

function main() {
  const snapshotPath = path.join(REPO_ROOT, SNAPSHOT);
  const args = parseArgs(process.argv.slice(2));
  if (args.write) write(snapshotPath, args);
  else printProbe(JSON.parse(fs.readFileSync(snapshotPath, 'utf8')));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
