#!/usr/bin/env node
/**
 * Template roster check.
 *
 * The templates are the `@/templates` barrel's exports that have a folder, and
 * six other layers list them: the glossary's Template entry, the Templates
 * overview, the agent-view list, the components index, the guidelines' first
 * two stages and the `Templates/*` Storybook titles. This holds every layer to the barrel's eight, and fails
 * when a template's page has a visible child title in Storybook.
 * Each agent-view row and hand-typed overview tile also reads as its page's
 * `purpose`. `ListPage` is a CLI registry starter, not a template.
 * `scripts/lib/template-roster.mjs` holds the rule.
 *
 * Run: npm run check:template-roster
 */
import { REPO_ROOT } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { checkRoster, readRoster } from './lib/template-roster.mjs';

const REMEDY = '  -> change the barrel first, then the layer that disagrees; the components index is generated (npm run generate:agent).';

const read = byRoot((repoRoot) => readRoster(repoRoot));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  return checkRoster(read(repoRoot)).map((message) => ({ message }));
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { roster, layers } = read(repoRoot);
  return `${roster.length} templates (${roster.join(', ')}) agree across the barrel and ${Object.keys(layers).length} layers`;
}

main(import.meta.url, 'check:template-roster', { run, summary, remedy: REMEDY });
