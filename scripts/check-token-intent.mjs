#!/usr/bin/env node
/**
 * `npm run check:token-intent` — every token a plan defines says what it is for.
 *
 * Reads the generated `tokens.json` and holds it to the plans
 * (`scripts/lib/token-intent.mjs`): a ladder row or `--ds-*` color token with
 * no intent fails, and so does a primitive carrying an `intent` field at all.
 * Tokens no plan defines pass bare; the green line counts them by group as
 * "not planned", so the gap stays visible without failing anyone.
 *
 * Fix a failure at the plan: add the row's `use` in `scripts/lib/tokens/plan.mjs`
 * (or the color plan's semantic layer), then `npm run generate:agent`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { auditIntent, plannedIntents } from './lib/token-intent.mjs';

export const MANIFEST = 'design-system/agent-views/tokens.json';

const audit = byRoot((root) => {
  const file = join(root, MANIFEST);
  if (!existsSync(file)) return null;
  return auditIntent(JSON.parse(readFileSync(file, 'utf8')), plannedIntents());
});

export function run({ repoRoot = REPO_ROOT } = {}) {
  const result = audit(repoRoot);
  if (!result) return [{ file: MANIFEST, message: 'is missing — run: npm run generate:agent' }];
  return [
    ...result.missing.map((name) => ({ file: MANIFEST, message: `${name} is planned and has no intent` })),
    ...result.primitivesWithIntent.map((name) => ({ file: MANIFEST, message: `${name} is a primitive and carries an intent field` })),
  ];
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { withIntent, notPlanned } = audit(repoRoot);
  const groups = Object.entries(notPlanned).map(([group, n]) => `${group} ${n}`).join(', ');
  const total = Object.values(notPlanned).reduce((a, b) => a + b, 0);
  return `${withIntent} planned tokens carry intent; ${total} not planned (${groups})`;
}

const REMEDY = '  -> add the `use` line in scripts/lib/tokens/plan.mjs (or the color semantic layer), then run: npm run generate:agent';

main(import.meta.url, 'check:token-intent', { run, summary, remedy: REMEDY });
