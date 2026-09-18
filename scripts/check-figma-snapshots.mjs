#!/usr/bin/env node
/**
 * `npm run check:figma-snapshots` — the two Figma snapshots still describe the
 * library, or say plainly that they do not.
 *
 * See `scripts/figma-snapshots.mjs` for what they are and what #339 measured.
 * In short: both are read by something that decides, neither had anything
 * watching its date, and on 2026-08-29 the variables snapshot was five weeks
 * behind a library that had gained seven variables it had never seen.
 *
 * Run: `npm run check:figma-snapshots`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REFRESHERS, ages, failures } from './figma-snapshots.mjs';
import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const VARIABLES = 'scripts/figma-variables-snapshot.json';
const COMPONENTS = 'scripts/figma-component-snapshot.json';

/**
 * Half a year. Generous on purpose: a gate that fires as a chore is a gate
 * somebody switches off, and the age is printed on every run so the number is
 * visible long before it is reached. Raise it only with a reason, and never to
 * get past a run that has already gone red.
 */
export const MAX_AGE_DAYS = 180;

/**
 * Floors — the count each snapshot held at its last real capture (variables
 * 2026-09-06, components 2026-09-15). A snapshot that shrank without anyone
 * deciding to shrink it is the failure this pairs with the date: an old
 * snapshot agrees with everything, and so does an empty one. Each floor moves
 * up only when a refresh has been run and its delta written down.
 */
export const MIN_VARIABLES = 361;
export const MIN_COMPONENTS = 1347;

/** The library both snapshots are of. */
const FILE_KEY = 'zAecJNRdvJzAUOcjV32tRX';

export const REMEDY = [
  '  -> Neither file can be refreshed from CI; both need Figma:',
  ...Object.values(REFRESHERS).map(
    ({ file, script, needs }) => `       ${file}\n         npm run ${script} — needs ${needs}`,
  ),
].join('\n');

/*
 * Both snapshots, the package manifest and the clock, read once per root. The
 * age is a function of `now`, and run() and summary() have to agree about it,
 * so the clock is captured here with the reads rather than at each call.
 */
const inputs = byRoot((repoRoot) => {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));
  return {
    files: { variables: read(VARIABLES), components: read(COMPONENTS) },
    scripts: read('package.json').scripts,
    now: new Date(),
  };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, scripts, now } = inputs(repoRoot);
  return failures(files, {
    now,
    fileKey: FILE_KEY,
    maxAgeDays: MAX_AGE_DAYS,
    minVariables: MIN_VARIABLES,
    minComponents: MIN_COMPONENTS,
    scripts,
  }).map((message) => ({ message }));
}

/** The green line, which carries each snapshot's date and how old it is. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { files, now } = inputs(repoRoot);
  const clock = ages(files, now)
    .map((a) => `${a.name} ${a.stamp ?? '(no date)'} (${a.age === null ? '?' : `${a.age}d`})`)
    .join(' · ');
  return `${clock}, both under the ${MAX_AGE_DAYS}-day ceiling`;
}

main(import.meta.url, 'check:figma-snapshots', { run, summary, remedy: REMEDY });
