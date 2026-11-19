#!/usr/bin/env node
/**
 * `npm run check:prop-names` — one naming rule for props.
 *
 * A boolean state prop is `is…` (`isDisabled`, `isReadOnly`, `isRequired`,
 * `isLoading`, `isSelected`, `isOpen`), and a component's look or kind is
 * `appearance` or `type`, never `variant` or `tone` (`GLOSSARY.md`, the
 * `is… prop` entry). The rules and the few names still waiting to move live in
 * `scripts/lib/prop-names.mjs`.
 *
 * WHAT IT READS. `design-system/agent-views/components.json`, the generated
 * component facts: every component's and template's props with their types. A
 * prop that is not a boolean (a `selected` date, say) is not a state flag and is
 * not counted. Nothing in this file is hand-kept.
 *
 * Run: `npm run check:prop-names`.
 */
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { ALLOWED, ruleFor } from './lib/prop-names.mjs';

export { REPO_ROOT };
const FACTS = 'design-system/agent-views/components.json';

/**
 * @param {{components: {name: string, source?: string, props?: {name: string, type?: string|null}[]}[]}} facts
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function findingsOf(facts) {
  return facts.components.flatMap((component) =>
    (component.props ?? []).flatMap((prop) => {
      const rule = ruleFor(prop);
      if (!rule || ALLOWED.some((a) => a.component === component.name && a.prop === prop.name)) return [];
      return [{ file: component.source, message: `${component.name} \`${prop.name}\`: name it \`${rule.use}\`` }];
    }),
  );
}

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, facts } = {}) {
  return findingsOf(facts ?? JSON.parse(fs.readFileSync(path.join(repoRoot, FACTS), 'utf8')));
}

export const REMEDY = '  -> a boolean state prop is is…; a look is `appearance` and a kind is `type` (GLOSSARY.md, "is… prop").';

export function summary({ repoRoot = REPO_ROOT, facts } = {}) {
  const found = run({ repoRoot, facts }).length;
  return `${found} bare boolean or variant/tone props (${ALLOWED.length} allowed)`;
}

main(import.meta.url, 'check:prop-names', { run, summary, remedy: REMEDY });
