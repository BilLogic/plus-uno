/**
 * Renders `scripts/lib/tokens/plan.mjs` into the files
 * `scripts/generate-design-tokens.mjs` writes — SCSS and a Figma variables
 * payload, the same split `scripts/lib/color/build.mjs` writes for ADR-035.
 * Pure: takes the plan, returns `{file: content}`; writing and checking live
 * in the generator script.
 */

import { CONTAINER_PAD_ROLES, ELEMENT_ROLES, LEGACY_ALIASES, MOTION_DURATIONS, MOTION_EASINGS, TOKEN_LADDER } from './plan.mjs';

const DENSITIES = ['default', 'compact', 'spacious'];

/** `{container:'section', axis:'x'}` -> `section-pad-x`; axis `null` -> `card-pad`. */
function roleName(container, axis) {
  return axis ? `${container}-pad-${axis}` : `${container}-pad`;
}

/** @returns {string} `_roles.scss` */
export function rolesScss() {
  let scss = `/**
 * Role Tokens (ADR-038)
 * Generated from scripts/lib/tokens/plan.mjs — never hand-edit.
 * Container roles keyed to density (default / compact / spacious); element
 * roles keyed to density (default / compact). Every value is a reference to
 * the --space-* and --radius-* primitive ladder in _scales.scss.
 */

:root {
    /* Container roles */
`;
  for (const { container, axis, steps } of CONTAINER_PAD_ROLES) {
    const name = roleName(container, axis);
    for (const density of DENSITIES) {
      scss += `    --${name}-${density}: var(${steps[density]});\n`;
    }
  }
  scss += `
    /* Element roles */
`;
  for (const { kind, steps } of ELEMENT_ROLES) {
    scss += `    --element-${kind}-default: var(${steps.default});\n`;
    scss += `    --element-${kind}-compact: var(${steps.compact});\n`;
  }
  scss += `}\n`;
  return scss;
}

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
 * Motion Tokens (ADR-038)
 * Generated from scripts/lib/tokens/plan.mjs — never hand-edit.
 * Duration and easing roles for Base UI's data-starting-style/data-ending-
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

/** @returns {string} `_legacy-size-aliases.scss` */
export function legacyAliasesScss() {
  const lines = LEGACY_ALIASES.map(({ old, role }) => `    ${old}: var(${role}); /* ADR-038, one cycle */\n`).join('');
  return `/**
 * Legacy Size Aliases (ADR-038)
 * Generated from scripts/lib/tokens/plan.mjs — never hand-edit.
 * Old names this generator's role tokens make redundant, pointed at their
 * replacement for one cycle so an unmigrated caller still resolves. Loads
 * after _spacing_semantics.scss and _frame_layers.scss, so it wins; every
 * value here is identical to what those files already declare for the same
 * name (see plan.mjs's LEGACY_ALIASES comment), so this changes no pixel.
 * A family PR deletes both the original declaration and its row here in the
 * same PR, once its callers read the role token instead.
 */

:root {
${lines}}
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
  { from: 'opacity', to: 'color / opacity', note: "Element/opacity-disabled moves here; code's --color-disabled-opacity is unaffected" },
];

/** @returns {string} one tier's SCSS file, generated from `TOKEN_LADDER`. */
function tierScss({ tier, heading }) {
  const rows = movedRows().filter((r) => r.tier === tier);
  const byGroup = new Map();
  for (const row of rows) {
    if (!byGroup.has(row.group)) byGroup.set(row.group, []);
    byGroup.get(row.group).push(row);
  }
  let scss = `/**
 * ${heading}
 * Generated from scripts/lib/tokens/plan.mjs's TOKEN_LADDER — never hand-edit.
 * Every row here is additive: the old name it names (where one exists) keeps
 * its own declaration elsewhere, untouched, so this file only adds a second
 * way to read the same value. A family PR moving a caller onto one of these
 * deletes the old declaration and this comment stops applying to that row.
 */

:root {
`;
  for (const [group, groupRows] of byGroup) {
    scss += `\n    /* ${group} */\n`;
    for (const row of groupRows) {
      const ref = row.old ? `var(${row.old})` : `var(${row.value})`;
      const note = row.note ? ` /* ${row.note} */` : '';
      scss += `    ${row.new}: ${ref};${note}\n`;
    }
  }
  scss += `}\n`;
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
    .filter((r) => r.tier === tier)
    .map((row) => toVariable(row.new));
}

/** @returns {object} the combined Figma variables payload for every tier plus the existing roles/motion collection. */
export function variablesPayload() {
  const collections = LADDER_TIERS.map(({ tier, collection }) => ({ name: collection, variables: tierFigmaVariables(tier) }));
  collections.push({ name: 'Deep foundations / roles and motion', variables: figmaSpec().collections[0].variables });
  return {
    note:
      'Generated by scripts/generate-design-tokens.mjs (ADR-038, #1756) from scripts/lib/tokens/plan.mjs. ' +
      'This is the export step only — nothing here has been pushed to Figma. Direction is code -> Figma. ' +
      'See architecture/token-tiers-name-map.md for the full old-to-new name list this payload implements.',
    collectionRenames: COLLECTION_RENAMES,
    collections,
  };
}

/** @returns {object} the Figma variables payload (write-only; no push in this run) */
export function figmaSpec() {
  const variables = [];
  for (const { container, axis, steps } of CONTAINER_PAD_ROLES) {
    const name = roleName(container, axis);
    for (const density of DENSITIES) variables.push(toVariable(`--${name}-${density}`));
  }
  for (const { kind } of ELEMENT_ROLES) {
    for (const density of ['default', 'compact']) variables.push(toVariable(`--element-${kind}-${density}`));
  }
  for (const name of Object.keys(MOTION_DURATIONS)) variables.push(toVariable(`--motion-duration-${name}`));
  for (const name of Object.keys(MOTION_EASINGS)) variables.push(toVariable(`--motion-easing-${name}`, 'STRING'));
  return {
    note:
      'Generated by scripts/generate-design-tokens.mjs (ADR-038) from scripts/lib/tokens/plan.mjs. ' +
      'This is the export step only — nothing here has been pushed to Figma. Direction is code -> ' +
      'Figma, the reverse of the size/type/layout collections generate-all-tokens.js still reads FROM Figma.',
    collections: [
      { name: 'Deep foundations / roles and motion', variables },
    ],
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

This ladder's first PR (#1756 PR1) is additive only: every \`New\` name below is a generated alias (\`var(--old-name)\`, or a literal primitive reference where \`Old\` reads *(new)*) living in \`design-system/src/tokens/deep/_semantics.scss\`, \`_patterns.scss\`, \`_components.scss\`, \`_layers.scss\`. The \`Old\` declaration is untouched and still resolves exactly as it does today. A row where \`Old\` and \`New\` are identical is not a rename — it is a token already correctly named for its tier (listed here so this is every token, not just the ones that moved); those rows are excluded from the generated SCSS and Figma payload (an alias to itself is a no-op).

Caller migration, by area, is PR2+; deleting the \`Old\` declarations and zeroing the ratchets is the final PR in this sequence.

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
  return body;
}

/**
 * @returns {{[file: string]: string}} every file this generator writes. Most
 * keys are repo-relative under TOKEN_DIR; the payload and the name-map doc
 * key out of it with a `path.join`-normalized `../..` — both live outside
 * `design-system/src/tokens`, at `design-system/figma/` and `architecture/`.
 */
export function artifacts() {
  const tierFiles = Object.fromEntries(LADDER_TIERS.map(({ file, ...tier }) => [`deep/${file}`, tierScss(tier)]));
  return {
    'deep/_roles.scss': rolesScss(),
    'deep/_motion.scss': motionScss(),
    'deep/_legacy-size-aliases.scss': legacyAliasesScss(),
    ...tierFiles,
    '../../figma/variables-payload.json': `${JSON.stringify(variablesPayload(), null, 2)}\n`,
    '../../../architecture/token-tiers-name-map.md': nameMapMarkdown(),
  };
}
