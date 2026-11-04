/**
 * Renders `scripts/lib/tokens/plan.mjs` into the files
 * `scripts/generate-design-tokens.mjs` writes — SCSS and a Figma variables
 * payload, the same split `scripts/lib/color/build.mjs` writes for ADR-035.
 * Pure: takes the plan, returns `{file: content}`; writing and checking live
 * in the generator script.
 */

import { MOTION_DURATIONS, MOTION_EASINGS, RETIRED_RENAMES, TOKEN_LADDER } from './plan.mjs';

/** @returns {string} `_motion.scss` */
export function motionScss() {
  const durations = Object.entries(MOTION_DURATIONS)
    .map(([name, value]) => `    --motion-duration-${name}: ${value};\n`)
    .join('');
  const easings = Object.entries(MOTION_EASINGS)
    .map(([name, value]) => `    --motion-easing-${name}: ${value};\n`)
    .join('');
  const zeroed = Object.keys(MOTION_DURATIONS)
    .map((name) => `        --motion-duration-${name}: 0ms;\n`)
    .join('');
  return `/**
 * Motion (ADR-038)
 * Generated from scripts/lib/tokens/plan.mjs — never hand-edit.
 * Duration and easing tokens for Base UI's data-starting-style/data-ending-
 * style transitions. Reduced motion is handled once, here: every duration
 * collapses to 0ms under prefers-reduced-motion, so a component that reads
 * --motion-duration-* needs no reduced-motion branch of its own.
 */

:root {
${durations}${easings}}

@media (prefers-reduced-motion: reduce) {
    :root {
${zeroed}    }
}
`;
}

/** The four tiers, in the order they are written, and the SCSS heading each gets. */
const LADDER_TIERS = [
  { tier: 'semantics', file: '_semantics.scss', collection: 'spacing / semantics', heading: 'Semantics (ADR-038 ladder)' },
  { tier: 'patterns', file: '_patterns.scss', collection: 'spacing / patterns', heading: 'Patterns (ADR-038 ladder)' },
  { tier: 'components', file: '_components.scss', collection: 'spacing / components', heading: 'Components (ADR-038 ladder)' },
  { tier: 'layers', file: '_layers.scss', collection: 'layers', heading: 'Layers (ADR-038 ladder; not a spacing family)' },
];

/** Ladder rows that actually move a value: excludes `old === new` (reclassified, not renamed). */
const movedRows = () => TOKEN_LADDER.filter((row) => row.old !== row.new);

/** Figma collection renames, code-side names unchanged (payload documentation only). */
export const COLLECTION_RENAMES = [
  { from: 'color / foundations', to: 'color / semantics' },
  { from: 'opacity', to: 'color / opacity', note: "the disabled-opacity variable moves here; code's --color-disabled-opacity is unaffected" },
];

/** The value one ladder row declares: its `ref`, or a `var()` of the primitive `value` names. */
const rowValue = (row) => row.ref ?? `var(${row.value})`;

/** @returns {string} one tier's SCSS file, generated from `TOKEN_LADDER`. */
function tierScss({ tier, heading }) {
  const rows = movedRows().filter((r) => r.tier === tier && !r.primitive);
  const byGroup = new Map();
  for (const row of rows) {
    if (!byGroup.has(row.group)) byGroup.set(row.group, []);
    byGroup.get(row.group).push(row);
  }
  let scss = `/**
 * ${heading}
 * Generated from scripts/lib/tokens/plan.mjs's TOKEN_LADDER — never hand-edit.
 * Each row declares its own value; a responsive row repeats under the media
 * query the plan names for it, below the :root block.
 */

:root {
`;
  for (const [group, groupRows] of byGroup) {
    scss += `\n    /* ${group} */\n`;
    for (const row of groupRows) {
      const note = row.note ? ` /* ${row.note} */` : '';
      scss += `    ${row.new}: ${rowValue(row)};${note}\n`;
    }
  }
  scss += `}\n`;
  const queries = new Map();
  for (const row of rows) {
    for (const [query, value] of Object.entries(row.at ?? {})) {
      if (!queries.has(query)) queries.set(query, []);
      queries.get(query).push({ name: row.new, value });
    }
  }
  for (const [query, overrides] of queries) {
    scss += `\n@media ${query} {\n    :root {\n${overrides.map(({ name, value }) => `        ${name}: ${value};\n`).join('')}    }\n}\n`;
  }
  return scss;
}

/** `--card-pad-default` -> `Card/pad-default` (Figma variable name, folder/leaf). */
function figmaName(token) {
  return token
    .replace(/^--/, '')
    .split('-')
    .map((part, i) => (i === 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join('-')
    .replace(/^([A-Za-z]+)-/, '$1/');
}

/** One Figma variable, shared by every collection builder below. */
function toVariable(token, resolvedType = 'FLOAT') {
  return { name: figmaName(token), resolvedType, codeSyntax: { WEB: `var(${token})` } };
}

/** @returns {object} one tier's Figma variables, from `TOKEN_LADDER`. */
function tierFigmaVariables(tier) {
  return movedRows()
    .filter((r) => r.tier === tier && !r.codeOnly)
    .map((row) => toVariable(row.new, row.type));
}

/** The motion tokens as their own Figma collection, like `typography` and `layers`. */
function motionFigmaVariables() {
  return [
    ...Object.keys(MOTION_DURATIONS).map((name) => toVariable(`--motion-duration-${name}`)),
    ...Object.keys(MOTION_EASINGS).map((name) => toVariable(`--motion-easing-${name}`, 'STRING')),
  ];
}

/** @returns {object} the combined Figma variables payload: every ladder tier, then motion. */
export function variablesPayload() {
  const collections = LADDER_TIERS.map(({ tier, collection }) => ({ name: collection, variables: tierFigmaVariables(tier) }));
  collections.push({ name: 'motion', variables: motionFigmaVariables() });
  return {
    note:
      'Generated by scripts/generate-design-tokens.mjs (ADR-038, #1756) from scripts/lib/tokens/plan.mjs. ' +
      'This is the export step only — nothing here has been pushed to Figma. Direction is code -> Figma. ' +
      'See architecture/token-tiers-name-map.md for the full old-to-new name list this payload implements.',
    collectionRenames: COLLECTION_RENAMES,
    collections,
  };
}

/** @returns {string} `architecture/token-tiers-name-map.md`, the full old-to-new list, one row per `TOKEN_LADDER` entry. */
export function nameMapMarkdown() {
  const tiers = ['semantics', 'patterns', 'components', 'layers'];
  const title = (t) => t[0].toUpperCase() + t.slice(1);
  let body = `---
summary: Token ladder (#1756) — old name to new name, every token across all four tiers
---

<!-- Tier: 2 -->
# Token tiers name map (#1756)

Generated from \`scripts/lib/tokens/plan.mjs\`'s \`TOKEN_LADDER\` by \`npm run generate:design-tokens\` — never hand-edit.

One plan, four tiers, most general to most specific: **primitives** (\`--space-*\` / \`--radius-*\` / \`--stroke-*\` / \`--size-*\`, unchanged — still Figma-sourced, \`generate-all-tokens.js\`) -> **semantics** -> **patterns** -> **components**, plus **layers** as its own non-spacing z-index family. Figma collection names: \`spacing / primitives\`, \`spacing / semantics\`, \`spacing / patterns\`, \`spacing / components\`, \`layers\`.

Every \`New\` name below is declared by the generator in \`design-system/src/tokens/ladder/_semantics.scss\`, \`_patterns.scss\`, \`_components.scss\` or \`_layers.scss\`, with its own value. The \`Old\` name is retired: its declaration is gone and nothing reads it. A row where \`Old\` and \`New\` are identical is not a rename — it is a token already correctly named for its tier (listed so this is every token, not just the ones that moved); those rows are excluded from the generated SCSS and Figma payload.

Scope calls recorded in \`plan.mjs\`'s own header comment, repeated here:
- \`--focus-ring-radius\` has no existing source; seeded at \`--radius-sm\` as a first pass.
- The Icon/Indicator/Row/Media size-role vocabulary in \`generate-all-tokens.js\`'s \`SIZE_ROLES\` is not folded into Semantics' Size group yet — only \`Control\` was missing, so only \`--control-*\` was added.
- The legacy spec-page grid (\`--breakpoint-*\`, \`--col-*\`, \`--layout-grid-gap\`) is out of this ladder; \`_layout.scss\` already calls it legacy.
- \`color / foundations\` -> \`color / semantics\` and \`opacity\` -> \`color / opacity\` are Figma-collection renames only; no code name changes.

`;
  for (const tier of tiers) {
    const rows = TOKEN_LADDER.filter((r) => r.tier === tier);
    if (!rows.length) continue;
    body += `## ${title(tier)}\n\n| Group | Old | New | Note |\n|---|---|---|---|\n`;
    for (const row of rows) {
      const old = row.old ? `\`${row.old}\`` : '*(new)*';
      const reclassified = row.old === row.new ? ' (reclassified, unchanged)' : '';
      body += `| ${row.group} | ${old} | \`${row.new}\`${reclassified} | ${row.note ?? ''} |\n`;
    }
    body += '\n';
  }
  body += `## Retired with no ladder row\n\n| Old | Now reads |\n|---|---|\n`;
  for (const [old, now] of Object.entries(RETIRED_RENAMES)) body += `| \`${old}\` | \`${now}\` |\n`;
  body += '\n';
  return body;
}

/**
 * @returns {{[file: string]: string}} every file this generator writes. Most
 * keys are repo-relative under TOKEN_DIR; the payload and the name-map doc
 * key out of it with a `path.join`-normalized `../..` — both live outside
 * `design-system/src/tokens`, at `design-system/figma/` and `architecture/`.
 */
export function artifacts() {
  const tierFiles = Object.fromEntries(LADDER_TIERS.map(({ file, ...tier }) => [`ladder/${file}`, tierScss(tier)]));
  return {
    'ladder/_motion.scss': motionScss(),
    ...tierFiles,
    '../../figma/variables-payload.json': `${JSON.stringify(variablesPayload(), null, 2)}\n`,
    '../../../architecture/token-tiers-name-map.md': nameMapMarkdown(),
  };
}
