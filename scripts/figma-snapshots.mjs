/**
 * The two Figma snapshots, and whether they still describe the library.
 *
 * WHAT THEY ARE. Two files in `scripts/` hold a copy of the Figma library, and
 * both are read by things that decide something:
 *
 *   figma-variables-snapshot.json   → `generate:token-registry`, which validates
 *                                     the Figma-variable → CSS-token mapping
 *   figma-component-snapshot.json   → `poll-figma-library.js`, which reports
 *                                     what changed in the library since it ran
 *
 * THE DEFECT (#339). "Nothing detects that they have gone stale." Measured
 * 2026-08-29: the variables snapshot was captured 2026-07-26 and the library had
 * moved on — seven variables added that it had never seen, and
 * `check:token-registry` was green over all of them, because it validates the
 * snapshot against the SCSS and nothing validates the snapshot against Figma.
 * A snapshot that has stopped tracking its subject does not fail; it agrees.
 *
 * WHAT THIS CAN AND CANNOT DO. It cannot ask Figma anything — no CI job has
 * access, which is the same constraint `audit:figma-registry` prints work for
 * rather than pretending to gate. What it can do is read the date each file
 * carries and say when that date has stopped meaning anything, plus the
 * structural facts a hand-edit breaks: a file key that is not this library's, a
 * declared total that disagrees with the contents, a date in the future.
 *
 * WHY A CEILING AND NOT A WARNING. A warning printed on a green run is read
 * once. The number is deliberately generous — half a year — so it fires as a
 * chore roughly never, and the age is printed on every single run so nobody
 * meets it for the first time on the day it goes red.
 */

/** Days between a `YYYY-MM-DD` or ISO timestamp and `now`. `null` if unparseable. */
export function ageInDays(stamp, now) {
  if (typeof stamp !== 'string' || !stamp) return null;
  const then = Date.parse(stamp);
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / 86400000);
}

/**
 * Every problem with the two snapshots.
 *
 * @param {{variables: object, components: object}} files The parsed snapshots.
 * @param {{now: Date, fileKey: string, maxAgeDays: number, minVariables: number,
 *   minComponents: number}} opts
 * @returns {string[]} One line per problem; empty when both are sound.
 */
export function failures(files, opts) {
  const { now, fileKey, maxAgeDays, minVariables, minComponents } = opts;
  const found = [];
  const { variables, components } = files;

  /* ---------------------------------------------------------- variables */

  const varAge = ageInDays(variables?.capturedAt, now);
  if (varAge === null) {
    found.push(
      'figma-variables-snapshot.json: no readable `capturedAt`. A snapshot with no ' +
        'date is a snapshot of nothing in particular.',
    );
  } else if (varAge < 0) {
    found.push(`figma-variables-snapshot.json: capturedAt is ${-varAge} day(s) in the future.`);
  } else if (varAge > maxAgeDays) {
    found.push(
      `figma-variables-snapshot.json: captured ${variables.capturedAt}, ${varAge} days ago ` +
        `(ceiling ${maxAgeDays}). Re-capture with \`npm run audit:figma-variables\`.`,
    );
  }

  if (variables?.figmaFileKey && variables.figmaFileKey !== fileKey) {
    found.push(
      `figma-variables-snapshot.json: figmaFileKey is ${variables.figmaFileKey}, not this ` +
        `library's ${fileKey}. A variable name only means anything inside its own file.`,
    );
  }

  // The declared total against the contents. Two numbers that must agree and
  // are written at different times — the count is what a reader quotes, and the
  // lists are what `generate:token-registry` walks.
  const counted = Object.values(variables?.collections ?? {}).reduce(
    (n, c) => n + (c.variables?.length ?? 0),
    0,
  );
  if (variables?.totalVariables !== undefined && variables.totalVariables !== counted) {
    found.push(
      `figma-variables-snapshot.json: says ${variables.totalVariables} variables, contains ` +
        `${counted}. One of the two was edited without the other.`,
    );
  }
  if (counted < minVariables) {
    found.push(
      `figma-variables-snapshot.json: ${counted} variables, fewer than the ${minVariables} ` +
        `this was last measured over. A snapshot that shrank silently is the failure mode.`,
    );
  }

  /* --------------------------------------------------------- components */

  const compAge = ageInDays(components?.lastChecked, now);
  if (compAge === null) {
    found.push('figma-component-snapshot.json: no readable `lastChecked`.');
  } else if (compAge < 0) {
    found.push(`figma-component-snapshot.json: lastChecked is ${-compAge} day(s) in the future.`);
  } else if (compAge > maxAgeDays) {
    found.push(
      `figma-component-snapshot.json: last checked ${components.lastChecked}, ${compAge} days ` +
        `ago (ceiling ${maxAgeDays}). This file is rewritten by every poller run, so an old ` +
        `date means the poller has not run — \`node scripts/poll-figma-library.js\`.`,
    );
  }

  const componentCount = components?.components?.length ?? 0;
  if (componentCount < minComponents) {
    found.push(
      `figma-component-snapshot.json: ${componentCount} components, fewer than the ` +
        `${minComponents} this was last measured over.`,
    );
  }

  return found;
}

/** `{name, age}` for the report line, so a green run still shows the clock. */
export function ages(files, now) {
  return [
    { name: 'variables', stamp: files.variables?.capturedAt, age: ageInDays(files.variables?.capturedAt, now) },
    { name: 'components', stamp: files.components?.lastChecked, age: ageInDays(files.components?.lastChecked, now) },
  ];
}
