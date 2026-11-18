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
 * When `--pr-body <path>` is passed, writes the PR body naming every changed
 * component (instead of a hash count).
 *
 * A file that is missing or is not JSON throws, so the step fails instead of
 * reading as a change and pushing a malformed snapshot.
 */
import fs from 'node:fs';

import { MAX_AGE_DAYS } from './check-figma-snapshots.mjs';
import { isEntry } from './lib/findings.mjs';
import { buildRefreshPrBody, refreshVerdict } from './snapshot-figma-components.mjs';

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = argv[i + 1] ?? '';
      i += 1;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

if (isEntry(import.meta.url)) {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [mainPath, refreshedPath] = positional;
  if (!mainPath || !refreshedPath) {
    console.error('usage: figma-snapshot-verdict.mjs <main.json> <refreshed.json> [--pr-body <path>]');
    process.exit(2);
  }
  const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
  const before = read(mainPath);
  const after = read(refreshedPath);
  const { verdict, ageDays } = refreshVerdict(before, after, {
    now: new Date(),
    maxAgeDays: MAX_AGE_DAYS,
  });
  console.log(`verdict=${verdict}`);
  console.log(`age_days=${ageDays ?? ''}`);

  if (flags['pr-body'] && verdict !== 'unchanged') {
    const deltaLog = flags['delta-file'] && fs.existsSync(flags['delta-file'])
      ? fs.readFileSync(flags['delta-file'], 'utf8')
      : '';
    const body = buildRefreshPrBody({
      before,
      after,
      verdict,
      ageDays,
      deltaLog,
      base: flags.base || 'main',
      branch: flags.branch || 'chore/figma-snapshot-refresh',
      snapshotPath: flags.snapshot || 'scripts/figma-component-snapshot.json',
      runUrl: flags['run-url'] || '',
    });
    fs.writeFileSync(flags['pr-body'], body);
  }
}
