/**
 * `--dry-run` on `scripts/poll-figma-library.js` must not publish anything.
 *
 * WHY THIS IS A SOURCE TEST AND NOT A BEHAVIOUR TEST, said first because it is
 * the weakness. Running the script needs a real `FIGMA_ACCESS_TOKEN`, a real
 * Figma file and a real Slack webhook; the only way to observe the bug was to
 * let it post to a channel. So this reads the source and asserts a structural
 * property instead. It cannot tell you the script works. It can tell you that a
 * side effect was added outside the guard, which is exactly how the bug got
 * there in the first place.
 *
 * THE BUG. `--dry-run` is documented as "check without updating snapshot", and
 * that is precisely what it did: the snapshot write was guarded by
 * `if (!args.dryRun)` and the two OUTWARD-FACING effects were not. A dry run
 * created a Notion PRD and posted to Slack — the two things a person cannot
 * undo — while carefully leaving the local file alone. Found while deciding
 * whether to run it to answer #339's staleness question; the answer was no.
 *
 * WHAT COUNTS AS AN EFFECT is listed below by name rather than detected, and
 * that is a real limit: a sixth effect added under a name not in this list is
 * invisible here. The list is short and the file is one script, so the trade is
 * a test that is easy to read against one that would need to parse JavaScript.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'poll-figma-library.js',
);

/** Call sites that reach outside this process, or write to disk. */
const EFFECTS = [
  { name: 'Notion PRD', call: 'createNotionPRD(' },
  { name: 'Slack post', call: 'postToSlack(' },
  { name: 'snapshot write', call: 'saveSnapshot(' },
  { name: 'issue-body write', call: "'issue-body.md'" },
];

const source = fs.readFileSync(SCRIPT, 'utf8');

/**
 * `--init` is a different command, and it writes on purpose: it exists to
 * create the first snapshot. Only the change-reporting run is checked, so the
 * scan starts where that run's decisions begin. Stated rather than silently
 * skipped, because "the test does not look here" is the kind of hole that ends
 * up holding the next bug.
 */
const REPORTING_STARTS_AT = source.indexOf('const hasComponentChanges =');
assert.notEqual(REPORTING_STARTS_AT, -1, 'the reporting section marker moved — update this test');

/**
 * The nearest enclosing `if` for an offset, as source text.
 *
 * Deliberately crude: it walks back to the previous `if (` and returns the
 * condition. A call nested two blocks deep inside a guard would be missed, so
 * every effect below is asserted to sit DIRECTLY under one — which is also the
 * shape that is easiest to read in review.
 */
function guardBefore(offset) {
  const before = source.slice(0, offset);
  const lastIf = before.lastIndexOf('if (');
  if (lastIf === -1) return null;
  return before.slice(lastIf, before.indexOf('\n', lastIf) === -1 ? undefined : before.indexOf('\n', lastIf));
}

for (const effect of EFFECTS) {
  test(`${effect.name} is gated on --dry-run`, () => {
    // Every occurrence, not the first: the bug was one guarded call and one
    // unguarded call to different things in the same function.
    assert.notEqual(source.indexOf(effect.call), -1, `${effect.call} is no longer in the script — update EFFECTS`);
    let index = source.indexOf(effect.call, REPORTING_STARTS_AT);

    let checked = 0;
    while (index !== -1) {
      // The declaration and the import are not call sites.
      const line = source.slice(source.lastIndexOf('\n', index) + 1, source.indexOf('\n', index));
      const isDefinition = /^\s*(import|async function|function|const \w+ = )/.test(line);
      if (!isDefinition) {
        const guard = guardBefore(index);
        assert.ok(
          guard && /args\.dryRun/.test(guard),
          `${effect.name} at offset ${index} is not under a --dry-run guard.\n` +
            `  nearest condition: ${guard ?? '(none)'}\n` +
            '  A dry run must read and print, and write nothing — local or remote.',
        );
        checked += 1;
      }
      index = source.indexOf(effect.call, index + 1);
    }
    assert.ok(checked > 0, `no call site found for ${effect.call}`);
  });
}

test('the usage banner does not promise less than the flag delivers', () => {
  // The banner said "Check without updating snapshot", which is what made the
  // behaviour defensible to whoever wrote it. It has to describe the stronger
  // rule, or the next person narrows the guard back to the snapshot.
  const banner = source.slice(0, source.indexOf('*/'));
  assert.match(banner, /--dry-run/);
  assert.match(banner, /write nothing/i);
});
