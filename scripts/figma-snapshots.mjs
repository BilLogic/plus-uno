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
 *
 * AND WHY THE REMEDY IS CHECKED TOO (#339, refresh pass, 2026-09-06). A ceiling
 * is only half a guard: the other half is that the run which goes red can be
 * made green. Until this pass the component finding said "run
 * `poll-figma-library.js`", and that instruction had quietly rotted — the
 * poller moved into the Worker on 2026-07-16 (`agents/uno-bot/src/
 * figma-poll.ts`, snapshot in KV), the repo file's writer left with it, and the
 * legacy script that remained opens a Notion PRD and posts to Slack before it
 * writes. So the one honest way to refresh the file was a command nobody would
 * reasonably run. `REFRESHERS` below names the npm script that rewrites each
 * snapshot, and the sweep asserts that script still EXISTS — a remedy naming a
 * task nobody has is the same defect as a ratchet entry asserting something
 * untrue, and it fails the same way rather than being discovered by the next
 * person who follows it.
 *
 * WHAT THE 2026-09-06 REFRESH MEASURED. Variables: 361 live against the
 * snapshot's 360 — one genuinely new (`Focus/Focus Ring`), none removed, and
 * 153 of the 155 accent variables renamed out of their `_`-hidden groups.
 * Components: not refreshable from here. The file records the components
 * PUBLISHED to the library, which only `GET /v1/files/:key/components` reports,
 * and no `FIGMA_ACCESS_TOKEN` exists in this checkout. The canvas, which the
 * Figma MCP can read, held 1,977 COMPONENT nodes in 171 sets against the
 * snapshot's 1,311 published variants in 97 — a different population, not a
 * delta, which is why the floor below stays where the last real capture put it.
 */

/**
 * What rewrites each snapshot. Data rather than prose so the sweep can check
 * that the remedy it prints is a task that exists.
 */
export const REFRESHERS = {
  variables: {
    file: 'scripts/figma-variables-snapshot.json',
    script: 'snapshot:figma-variables',
    needs: 'a Figma session (the probe runs in the file; the REST variables scope is Enterprise-only)',
  },
  components: {
    file: 'scripts/figma-component-snapshot.json',
    script: 'snapshot:figma-components',
    needs: 'FIGMA_ACCESS_TOKEN (the published-component list is REST-only)',
  },
};

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
 *   minComponents: number, scripts?: Record<string, string>}} opts `scripts` is
 *   package.json's script map; omit it to skip the remedy check.
 * @returns {string[]} One line per problem; empty when both are sound.
 */
export function failures(files, opts) {
  const { now, fileKey, maxAgeDays, minVariables, minComponents, scripts } = opts;
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
        `(ceiling ${maxAgeDays}). Re-capture with \`npm run ${REFRESHERS.variables.script}\`.`,
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
        `ago (ceiling ${maxAgeDays}). Re-capture with \`npm run ${REFRESHERS.components.script}\`, ` +
        `which needs ${REFRESHERS.components.needs}.`,
    );
  }

  // Same rule as the variables half, and absent from the file the legacy poller
  // wrote — so it is checked only when present rather than demanded, which is
  // how a snapshot written by the older writer stays green.
  if (components?.figmaFileKey && components.figmaFileKey !== fileKey) {
    found.push(
      `figma-component-snapshot.json: figmaFileKey is ${components.figmaFileKey}, not this ` +
        `library's ${fileKey}.`,
    );
  }

  const componentCount = components?.components?.length ?? 0;
  if (componentCount < minComponents) {
    found.push(
      `figma-component-snapshot.json: ${componentCount} components, fewer than the ` +
        `${minComponents} this was last measured over.`,
    );
  }

  /* ------------------------------------------------------------ remedies */

  if (scripts) {
    for (const { file, script } of Object.values(REFRESHERS)) {
      if (!(script in scripts)) {
        found.push(
          `${file}: its refresher \`npm run ${script}\` is not in package.json. The ceiling ` +
            `above is only a guard if the run it fails can be made green again.`,
        );
      }
    }
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
