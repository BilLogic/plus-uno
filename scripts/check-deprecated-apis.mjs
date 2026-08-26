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
    ticket: '#202 (closed — the port could not be written while Storybook 11 did not exist)',
    // Everything the port needs, here rather than behind a link. A ticket can be
    // closed, renumbered, or migrated to another tracker; this file is what the
    // failure prints, so this is where the knowledge has to live.
    note: [
      'Storybook 10.5 already warns: "Addon tabs are deprecated and will be removed in Storybook 11."',
      'What breaks: the Code / Usage / Changelog tabs on every component page.',
      'What to do: re-register the three panels on 11\'s replacement mechanism.',
      '  - Confirm that mechanism against CURRENT upstream docs. Do not trust this',
      '    note or the addon README, both written against a 10.5 source file.',
      '  - contract.js is pure and framework-free (tab ids, titles, order,',
      '    componentIdentity, normaliseChangelog). The port is a re-registration,',
      '    not a rewrite of what the panels contain.',
      '  - .storybook/manager.js is the single place titles and order are declared,',
      '    including the renamed built-in canvas tab ("Examples"). Keep it that way.',
      '  - design-system/tests/component-tabs-contract.test.js (11 tests) must still',
      '    pass, or be updated with its reasoning intact.',
      '  - Verify in a running Storybook that all four tabs render and selection',
      '    follows the URL. That bar was met once; meet it again.',
    ].join('\n    '),
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
              `    -> Land the port in this PR, or pin below ${t.removedIn}. History: ${t.ticket}.`,
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
