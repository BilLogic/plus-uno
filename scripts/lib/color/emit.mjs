/**
 * SCSS emission for one plan (port of the reference generator's `emit.py`):
 *
 *   _palette.scss          --palette-* primitives on :root
 *   _semantic.scss         --ds-* color tokens: light, dark, auto, and increased contrast as override-only blocks
 *   _elevation.scss        --ds-shadow-* and --ds-opacity-* per mode
 *   _bootstrap-bridge.scss --bs-* variables pointed at --ds-* so react-bootstrap follows the mode
 *
 * Mode selectors: `data-color-mode` is light, dark or auto (no attribute means light);
 * `data-contrast-mode` is more or auto. Alphas are written `rgb(r g b / a)`, which the
 * repo's token parser reads; 8-digit hex does not parse there.
 */

import { parseHex, pyRound } from './oklch.mjs';

/** Python's `str(float)`: a whole number keeps its `.0`. */
const pyFloat = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));

function rgb(hex) {
  const { r, g, b, a } = parseHex(hex);
  if (a !== null) return `rgb(${r} ${g} ${b} / ${pyFloat(pyRound(a / 255, 3))})`;
  return hex;
}

/** `red.500a8` -> `--palette-red-500-a8`; `darkNeutralAlpha.300` -> `--palette-dark-neutral-alpha-300`. */
export function paletteProp(ref) {
  const [fam, step] = ref.split('.');
  const kebab = fam.replace(/(?<!^)([A-Z])/g, '-$1').toLowerCase();
  return `--palette-${kebab}-${step.replace('a', '-a')}`;
}

/** The value a semantic token takes: `var(--palette-…)`, or `transparent`. */
export const paletteVar = (ref) => (ref === 'transparent' ? 'transparent' : `var(${paletteProp(ref)})`);

/** `color.background.brand.bold` -> `--ds-background-brand-bold`. */
export const dsName = (name) => `--ds-${name.replace(/^(color|elevation)[.]/, '').replaceAll('.', '-')}`;

const shadowCss = (v) => v.replace(/#[0-9a-fA-F]{6,8}/g, (m) => rgb(m));

const block = (sel, lines) => `${sel} {\n${lines.map((l) => `  ${l}\n`).join('')}}\n`;

const LIGHT = ':root,\n[data-color-mode="light"]';
const LIGHT_OR_UNSET = ':is([data-color-mode="light"], :not([data-color-mode]))';
const DARK = '[data-color-mode="dark"]';
const AUTO = '[data-color-mode="auto"]';

/**
 * Dark under `data-color-mode="auto"` when the OS prefers dark. `_semantic.scss` indents the
 * declarations inside the query and the other files do not, as the reference generator writes them.
 */
const autoDark = (lines, { indent = false } = {}) => {
  const inner = block(`  ${AUTO}`, lines);
  return `@media (prefers-color-scheme: dark) {\n${indent ? inner.replaceAll('\n  ', '\n    ').replaceAll('\n}', '\n  }') : inner}}\n`;
};

/**
 * Increased-contrast overrides for one scheme, in all four combinations: the explicit color mode
 * (light also covers no attribute) with contrast `more`, or with contrast `auto` under
 * `prefers-contrast: more`; color `auto` with `more` under `prefers-color-scheme`; both `auto`
 * under both queries.
 */
function contrastBlocks(lines, scheme) {
  if (!lines.length) return '';
  const explicit = scheme === 'light' ? LIGHT_OR_UNSET : DARK;
  return (
    `\n${block(`${explicit}[data-contrast-mode="more"]`, lines)}` +
    `@media (prefers-contrast: more) {\n${block(`  ${explicit}[data-contrast-mode="auto"]`, lines)}}\n` +
    `@media (prefers-color-scheme: ${scheme}) {\n${block(`  ${AUTO}[data-contrast-mode="more"]`, lines)}}\n` +
    `@media (prefers-color-scheme: ${scheme}) and (prefers-contrast: more) {\n${block(`  ${AUTO}[data-contrast-mode="auto"]`, lines)}}\n`
  );
}

/**
 * @param {{rows: object[], shadows: object[], opacity: object[], palette: object}} semantics
 * @param {string} header  first line of every file, ending in "\n"
 * @returns {Record<string, string>} file name -> contents
 */
export function emitScss({ rows, shadows, opacity, palette }, header) {
  const files = {};

  const prim = [];
  for (const [fam, steps] of Object.entries(palette)) {
    if (fam === 'shadow') continue;
    for (const [step, v] of Object.entries(steps)) prim.push(`${paletteProp(`${fam}.${step}`)}: ${rgb(v.hex)};`);
  }
  files['_palette.scss'] = header + block(':root', prim);

  const decl = (mode) => (r) => `${dsName(r.name)}: ${paletteVar(r[`${mode}_ref`])};`;
  const dark = rows.map(decl('dark'));
  const lic = rows.filter((r) => r.light_ic_ref !== r.light_ref).map(decl('light_ic'));
  const dic = rows.filter((r) => r.dark_ic_ref !== r.dark_ref).map(decl('dark_ic'));
  files['_semantic.scss'] =
    `${header}${block(LIGHT, rows.map(decl('light')))}\n${block(DARK, ['color-scheme: dark;', ...dark])}` +
    `\n${autoDark(['color-scheme: dark;', ...dark], { indent: true })}` +
    contrastBlocks(lic, 'light') +
    contrastBlocks(dic, 'dark');

  // Shadows and opacity follow the same switches as the semantic colors.
  const elevationLines = (k) => [
    ...shadows.map((s) => `${dsName(s.name)}: ${shadowCss(s[k])};`),
    ...opacity.map((o) => `--ds-${o.name.replaceAll('.', '-')}: ${o[k]};`),
  ];
  const changedShadows = (k, base) => shadows.filter((s) => s[k] !== s[base]).map((s) => `${dsName(s.name)}: ${shadowCss(s[k])};`);
  files['_elevation.scss'] =
    header +
    [block(LIGHT, elevationLines('light')), block(DARK, elevationLines('dark')), autoDark(elevationLines('dark'))].join('\n') +
    contrastBlocks(changedShadows('light_ic', 'light'), 'light') +
    contrastBlocks(changedShadows('dark_ic', 'dark'), 'dark');

  // Bootstrap is imported compiled, so bridge its CSS variables; the *-rgb triplets are literal per mode,
  // so color mode auto needs its own dark block.
  const by = Object.fromEntries(rows.map((r) => [r.name, r]));
  const roles = {
    primary: 'color.background.brand.bold', danger: 'color.background.danger.bold', success: 'color.background.success.bold',
    warning: 'color.background.warning.bold', info: 'color.background.information.bold',
    light: 'color.background.neutral', dark: 'color.background.neutral.bold',
  };
  const triplet = (hex) => {
    const { r, g, b } = parseHex(hex);
    return `${r} ${g} ${b}`;
  };
  const bridge = (m) => [
    '--bs-body-bg: var(--ds-surface);', '--bs-body-color: var(--ds-text);', '--bs-border-color: var(--ds-border);',
    '--bs-link-color: var(--ds-link);', '--bs-link-hover-color: var(--ds-link-pressed);',
    '--bs-focus-ring-color: var(--ds-border-focused);', '--bs-secondary-color: var(--ds-text-subtle);',
    ...Object.entries(roles).flatMap(([role, tok]) => [`--bs-${role}: var(${dsName(tok)});`, `--bs-${role}-rgb: ${triplet(by[tok][m])};`]),
    `--bs-body-color-rgb: ${triplet(by['color.text'][m])};`, `--bs-link-color-rgb: ${triplet(by['color.link'][m])};`,
  ];
  files['_bootstrap-bridge.scss'] =
    `${header}${block(LIGHT, bridge('light'))}\n${block(DARK, bridge('dark'))}\n${autoDark(bridge('dark'))}`;
  return files;
}
