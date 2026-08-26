/**
 * Fails when a dependency crosses a major version that removes an API this repo
 * still uses.
 *
 * WHY. A deprecation is discovered twice: once when someone reads the warning,
 * and once when the upgrade breaks. Between those, the only record lives in a
 * ticket nobody opens until the second one. #202 is exactly that shape —
 * Storybook 11 removes addon tabs, and the three component tabs (#168) stop
 * working on upgrade, with the reasoning buried in an addon README.
 *
 * A note hopes someone reads it. This fires at the moment the note matters, and
 * names the ticket carrying the port.
 *
 * It deliberately reads the DECLARED range in package.json, not the installed
 * tree: the break arrives when someone widens the range, and it should be caught
 * in the PR that widens it, not after an install.
 *
 * Usage:
 *   node scripts/check-deprecated-apis.mjs
 *   node scripts/check-deprecated-apis.mjs --list
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Each entry is a bet that a named API survives below a named major. When the
 * declared range can resolve at or above `removedIn`, the bet is off and the
 * work in `ticket` is due.
 */
const TRIPWIRES = [
  {
    dep: 'storybook',
    removedIn: 11,
    api: 'addon tabs (`types.TAB`)',
    uses: '.storybook/addons/component-tabs/register.jsx',
    ticket: '#202',
    note: 'Storybook 10.5 already warns: "Addon tabs are deprecated and will be removed in Storybook 11."',
  },
];

/** The lowest major a range can resolve to — `^10.5.0` -> 10, `>=9` -> 9. */
export function floorMajor(range) {
  const m = String(range).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** The highest major a caret/tilde range can resolve to. `^10.5.0` pins to 10. */
export function ceilingMajor(range) {
  const r = String(range).trim();
  const floor = floorMajor(r);
  // No version in the range at all (`*`, `latest`, `x`) resolves to whatever is
  // newest — unbounded, not unknown. Returning null here would read as "safe".
  if (floor === null) return Infinity;
  // ^ and ~ and a bare pin all stay inside one major.
  if (/^[\^~]?\d/.test(r) || /^\d/.test(r)) return floor;
  // >=, *, x, ||, and anything else can reach anywhere.
  return Infinity;
}

export function check(pkg, tripwires = TRIPWIRES) {
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const due = [];
  for (const t of tripwires) {
    const range = deps[t.dep];
    if (!range) continue;
    if (ceilingMajor(range) >= t.removedIn) due.push({ ...t, range });
  }
  return due;
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

  if (process.argv.includes('--list')) {
    console.log(`check:deprecated-apis watches ${TRIPWIRES.length} API(s):\n`);
    for (const t of TRIPWIRES) {
      console.log(`  ${t.dep} < ${t.removedIn} — ${t.api}\n    used by ${t.uses}, ported by ${t.ticket}`);
    }
    return 0;
  }

  const due = check(pkg);

  if (due.length) {
    console.error(
      `\n[deprecated-apis] ${due.length} dependency range now reaches a major that removes an API in use:\n` +
        due
          .map(
            (t) =>
              `  ${t.dep} ${t.range} can resolve to ${t.removedIn}.x, which removes ${t.api}\n` +
              `    still used by ${t.uses}\n` +
              `    ${t.note}\n` +
              `    -> ${t.ticket} carries the port. Land it in this PR, or pin below ${t.removedIn}.`,
          )
          .join('\n\n'),
    );
    return 1;
  }

  console.log(
    `[deprecated-apis] ${TRIPWIRES.length} watched API(s), every dependency range still pinned below its removal.`,
  );
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
