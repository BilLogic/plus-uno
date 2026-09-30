#!/usr/bin/env node
/**
 * `node scripts/figma-snapshot-verdict.mjs <main.json> <refreshed.json>` —
 * what a component-snapshot refresh found, for `figma-snapshot-refresh.yml`.
 *
 * Prints `verdict=changed|date-only|unchanged` and `age_days=<n>` (main's
 * `lastChecked` age, blank when unreadable), one per line, in the shape
 * `$GITHUB_OUTPUT` takes. The rules are `refreshVerdict()`'s; the age ceiling
 * is `check:figma-snapshots`' own, read rather than restated.
 *
 * A file that is missing or is not JSON throws, so the step fails instead of
 * reading as a change and pushing a malformed snapshot.
 */
import fs from 'node:fs';

import { MAX_AGE_DAYS } from './check-figma-snapshots.mjs';
import { isEntry } from './lib/findings.mjs';
import { refreshVerdict } from './snapshot-figma-components.mjs';

if (isEntry(import.meta.url)) {
  const [mainPath, refreshedPath] = process.argv.slice(2);
  if (!mainPath || !refreshedPath) {
    console.error('usage: figma-snapshot-verdict.mjs <main.json> <refreshed.json>');
    process.exit(2);
  }
  const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
  const { verdict, ageDays } = refreshVerdict(read(mainPath), read(refreshedPath), {
    now: new Date(),
    maxAgeDays: MAX_AGE_DAYS,
  });
  console.log(`verdict=${verdict}`);
  console.log(`age_days=${ageDays ?? ''}`);
}
