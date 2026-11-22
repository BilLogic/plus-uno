#!/usr/bin/env node
/**
 * `npm run check:motion-registry` — every interactive component has a motion
 * row, and every row names tokens that exist (spec #2200).
 *
 * WHY. The registry (`scripts/lib/tokens/motion-registry.mjs`) is where a
 * component names its enter, exit and change motion once. A component missing
 * from it moves by whatever its CSS says; a row naming a token that is not in
 * the plan reads a custom property nothing declares.
 *
 * WHAT IT HOLDS.
 *   - Interactive components: the `## UI components` list of
 *     `design-system/agent-views/components/index.md`, less `STATIC`, the
 *     components that show and never respond or move (text, glyphs, images).
 *   - Each is a registry row or on the allow-list. A component in neither
 *     fails, so a new component cannot arrive without a row.
 *   - Each event's `spatial` and `appearance` (each optional, at least one
 *     required) is a semantic token from `MOTION_SEMANTICS` in the plan, or
 *     `linear`, and its `transition` is one of the 14 locked names in
 *     `MOTION_TRANSITIONS`. `note` and `sound` are not read here.
 *   - Every Patterns page (a Storybook title under `Patterns/`, the Overview
 *     excluded) has a `tier: 'pattern'` row named by its page. No allow-list:
 *     a new Patterns page arrives with its row.
 *   - Every `tier: 'pattern'` row is shown: its page renders a
 *     `<MotionSection component="<row name>" tier="pattern" />`, so the rows in
 *     the library sit in the page's Motion section too.
 *   - A `tier: 'component'` row for a component the index does not list fails;
 *     `pattern` and `template` rows skip that rule; an unknown tier fails.
 *
 * THE ALLOW-LIST. `scripts/baselines/motion-registry.json`, through
 * `scripts/lib/ratchet.mjs`: the components not yet in the registry. It may
 * only shrink. A component that gains a row is reported stale until the record
 * is regenerated:
 *
 *     npm run check:motion-registry -- --update
 *
 * `--update` refuses a component the record does not hold. Never edit by hand.
 */

import { REPO_ROOT, text } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';
import { MOTION_TRANSITIONS } from './lib/tokens/motion-docs.mjs';
import { MOTION_REGISTRY } from './lib/tokens/motion-registry.mjs';
import { MOTION_SEMANTICS } from './lib/tokens/plan.mjs';

export { REPO_ROOT };
export const BASELINE = 'scripts/baselines/motion-registry.json';
export const INDEX = 'design-system/agent-views/components/index.md';

/** Components in the index that neither respond nor move. */
export const STATIC = new Set([
  'AiIcon', 'Code', 'CodeBlock', 'DateTag', 'Fieldset', 'Heading', 'Icon', 'Illustration', 'Image',
  'Logo', 'Object', 'VisuallyHidden', 'Facts',
  // The motion docs' "No motion" list (05-components.md): they never move.
  'Avatar', 'AvatarGroup', 'ButtonGroup', 'Comment', 'CompetencyTag', 'CountTag', 'Dialog', 'EmptyState', 'FooterActions',
  'RichTextEditor', 'ScrollBar', 'StaticTable', 'StatusTag', 'Tag', 'TagGroup', 'Tile',
]);

const TIERS = ['component', 'pattern', 'template'];
const EVENT_TOKENS = ['spatial', 'appearance'];

/** Semantic token names a row may use. */
export const validTokens = () => new Set([...MOTION_SEMANTICS.map((s) => s.name), 'linear']);

/** Interactive component names in the index's UI components list, in order. */
export function interactiveComponents(index) {
  const section = index.split(/^## UI components.*$/m)[1]?.split(/^## /m)[0] ?? '';
  return [...section.matchAll(/^- \[([A-Za-z0-9]+)\]\(/gm)].map((m) => m[1]).filter((n) => !STATIC.has(n));
}

const PATTERNS_DIR = 'design-system/src/storybook-docs/patterns';
const NOT_PAGES = new Set(['Overview']);

/** The page a `Patterns/...` title belongs to: `<Page>[/...]`, or `States/<Page>[/...]` for the States group. */
const pageOfTitle = (title) => {
  const parts = title.split('/');
  return parts[0] === 'States' && parts.length > 1 ? parts[1] : parts[0];
};

/** Patterns pages by Storybook title (`Patterns/<Page>[/...]`, or `Patterns/States/<Page>[/...]` for the States group), the Overview excluded. */
export function patternPages(repoRoot = REPO_ROOT) {
  const names = new Set();
  for (const { text } of trackedSources(repoRoot, [PATTERNS_DIR], /\.(mdx|stories\.jsx?)$/)) {
    for (const m of text.matchAll(/title[:=]\s*['"]Patterns\/([^'"]+)['"]/g)) {
      const parts = m[1].split('/');
      const page = pageOfTitle(m[1]);
      // The Overview and its test harnesses (`Patterns/Overview/...`) are not a pattern page.
      if (!NOT_PAGES.has(parts[0]) && !NOT_PAGES.has(page)) names.add(page);
    }
  }
  return [...names].sort();
}

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });
const asRecord = (names) => Object.fromEntries([...names].sort().map((n) => [n, 1]));
const unregistered = (components, registry) => {
  const rows = new Set(registry.filter((r) => r.tier === 'component').map((r) => r.name));
  return components.filter((c) => !rows.has(c));
};

/** Names of the pattern pages that render their own registry rows: `<MotionSection component="<Name>" tier="pattern" />` in the MDX titled for that page. */
export function motionSectionPages(repoRoot = REPO_ROOT) {
  const names = new Set();
  for (const { text } of trackedSources(repoRoot, [PATTERNS_DIR], /\.mdx$/)) {
    const title = text.match(/<Meta\s+title=["']Patterns\/([^"']+)["']/)?.[1];
    if (!title) continue;
    const page = pageOfTitle(title);
    for (const m of text.matchAll(/<MotionSection\s+component=["']([^"']+)["']\s+tier=["']pattern["']/g)) {
      if (m[1] === page) names.add(page);
    }
  }
  return names;
}

const readIndex = (repoRoot) => text(INDEX, { root: repoRoot });

export const REMEDY =
  '  -> add the component\'s (or Patterns page\'s, tier: \'pattern\') row to scripts/lib/tokens/motion-registry.mjs, naming semantic tokens from plan.mjs.\n' +
  '     The allow-list only shrinks: `npm run check:motion-registry -- --update` after a row lands; never edit it by hand.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, index, registry = MOTION_REGISTRY, patterns = patternPages(repoRoot), motionSections = motionSectionPages(repoRoot) } = {}) {
  const components = interactiveComponents(index ?? readIndex(repoRoot));
  const findings = [];
  const valid = validTokens();
  const transitions = new Set(MOTION_TRANSITIONS);
  for (const row of registry) {
    if (!TIERS.includes(row.tier)) {
      findings.push({ message: `motion registry row "${row.name}" has tier "${row.tier}", which is not one of ${TIERS.join(', ')}` });
    } else if (row.tier === 'component' && !components.includes(row.name)) {
      findings.push({ message: `motion registry row "${row.name}" is not an interactive component in ${INDEX}` });
    }
    // `sound` and `note` are not read here; check:sound-registry owns `sound`.
    for (const [event, spec] of Object.entries(row.events ?? {})) {
      if (!transitions.has(spec?.transition)) {
        findings.push({
          message: `motion registry row "${row.name}" (${row.tier}) event "${event}" names transition ${JSON.stringify(spec?.transition)}, which is not one of the 14 transitions (${MOTION_TRANSITIONS.join(', ')})`,
        });
      }
      if (!EVENT_TOKENS.some((k) => spec?.[k] !== undefined)) {
        findings.push({ message: `motion registry row "${row.name}" event "${event}" names neither spatial nor appearance` });
      }
      for (const key of EVENT_TOKENS) {
        if (spec?.[key] !== undefined && !valid.has(spec[key])) {
          findings.push({ message: `motion registry row "${row.name}" event "${event}" ${key} names "${spec[key]}", which is not a motion token (${[...valid].join(', ')})` });
        }
      }
    }
  }
  const patternRows = new Set(registry.filter((r) => r.tier === 'pattern').map((r) => r.name));
  for (const page of patterns) {
    if (!patternRows.has(page)) {
      findings.push({ message: `Patterns page "${page}" has no tier: 'pattern' row in the motion registry` });
    }
  }
  for (const name of patternRows) {
    if (!motionSections.has(name)) {
      findings.push({ message: `Patterns page "${name}" has motion registry rows but no <MotionSection component="${name}" tier="pattern" /> under ## Motion` });
    }
  }
  const missing = unregistered(components, registry);
  const ratchet = ratchetFor(repoRoot);
  for (const failure of ratchet.failures(asRecord(missing))) {
    findings.push({
      message:
        failure.kind === 'absent'
          ? failure.message
          : `motion registry: ${failure.key} is not in the registry and not on the allow-list (the allow-list cannot grow)`,
    });
  }
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(missing))) {
      findings.push({ message: `motion registry: ${entry.key} has a row now; regenerate the allow-list with \`npm run check:motion-registry -- --update\`` });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, index, registry = MOTION_REGISTRY } = {}) {
  const components = interactiveComponents(index ?? readIndex(repoRoot));
  return `${components.length - unregistered(components, registry).length} of ${components.length} interactive components in the registry; ${unregistered(components, registry).length} on the allow-list`;
}

/** `--update` re-records the allow-list downward; it refuses growth, then falls through to the gate. */
function record() {
  const missing = asRecord(unregistered(interactiveComponents(readIndex(REPO_ROOT)), MOTION_REGISTRY));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(missing).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-motion-registry] not recorded: ${rising.length} component(s) are not in the allow-list. Add a registry row instead.`);
    return;
  }
  ratchet.update(missing, {
    seed: {
      why:
        'Interactive components with no motion row in scripts/lib/tokens/motion-registry.mjs yet (spec #2200). ' +
        'The list may only shrink. Regenerate with `npm run check:motion-registry -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-motion-registry] allow-list recorded: ${Object.keys(missing).length} component(s)`);
}

main(import.meta.url, 'check:motion-registry', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
