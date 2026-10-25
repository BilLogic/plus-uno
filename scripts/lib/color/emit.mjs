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

import { pyRound } from './oklch.mjs';

/** Python's `str(float)`: a whole number keeps its `.0`. */
const pyFloat = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));

function rgb(hex) {
  const h = hex.replace(/^#/, '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  if (h.length === 8) return `rgb(${r} ${g} ${b} / ${pyFloat(pyRound(parseInt(h.slice(6, 8), 16) / 255, 3))})`;
  return `#${h}`;
}

/** `red.500a8` -> `var(--palette-red-500-a8)`; `darkNeutralAlpha.300` -> `var(--palette-dark-neutral-alpha-300)`. */
export function paletteVar(ref) {
  if (ref === 'transparent') return 'transparent';
  const [fam, step] = ref.split('.');
  const kebab = fam.replace(/(?<!^)([A-Z])/g, '-$1').toLowerCase();
  return `var(--palette-${kebab}-${step.replace('a', '-a')})`;
}

/** `color.background.brand.bold` -> `--ds-background-brand-bold`. */
export const dsName = (name) => `--ds-${name.replace(/^(color|elevation)[.]/, '').replaceAll('.', '-')}`;

const shadowCss = (v) => v.replace(/#[0-9a-fA-F]{6,8}/g, (m) => rgb(m));

const block = (sel, lines) => `${sel} {\n${lines.map((l) => `  ${l}\n`).join('')}}\n`;

const LIGHT = ':root,\n[data-color-mode="light"]';
const LIGHT_OR_UNSET = ':is([data-color-mode="light"], :not([data-color-mode]))';
const DARK = '[data-color-mode="dark"]';
const AUTO = '[data-color-mode="auto"]';

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
    for (const [step, v] of Object.entries(steps)) prim.push(`${paletteVar(`${fam}.${step}`).slice(4, -1)}: ${rgb(v.hex)};`);
  }
  files['_palette.scss'] = header + block(':root', prim);

  const decl = (mode) => (r) => `${dsName(r.name)}: ${paletteVar(r[`${mode}_ref`])};`;
  const light = rows.map(decl('light'));
  const dark = rows.map(decl('dark'));
  const lic = rows.filter((r) => r.light_ic_ref !== r.light_ref).map(decl('light_ic'));
  const dic = rows.filter((r) => r.dark_ic_ref !== r.dark_ref).map(decl('dark_ic'));
  const nested = (sel, lines) => block(`  ${sel}`, lines).replaceAll('\n  ', '\n    ').replaceAll('\n}', '\n  }');
  let sem = `${header}${block(LIGHT, light)}\n${block(DARK, ['color-scheme: dark;', ...dark])}`;
  sem += `\n@media (prefers-color-scheme: dark) {\n${nested(AUTO, ['color-scheme: dark;', ...dark])}}\n`;
  // Increased contrast is override-only: color mode light (or unset) / dark / auto, crossed with contrast more / auto.
  for (const [ic, explicit, scheme] of [[lic, LIGHT_OR_UNSET, 'light'], [dic, DARK, 'dark']]) {
    sem += `\n${block(`${explicit}[data-contrast-mode="more"]`, ic)}`;
    sem += `@media (prefers-contrast: more) {\n${block(`  ${explicit}[data-contrast-mode="auto"]`, ic)}}\n`;
    sem += `@media (prefers-color-scheme: ${scheme}) {\n${block(`  ${AUTO}[data-contrast-mode="more"]`, ic)}}\n`;
    sem += `@media (prefers-color-scheme: ${scheme}) and (prefers-contrast: more) {\n${block(`  ${AUTO}[data-contrast-mode="auto"]`, ic)}}\n`;
  }
  files['_semantic.scss'] = sem;

  const elevationLines = (k) => [
    ...shadows.map((s) => `${dsName(s.name)}: ${shadowCss(s[k])};`),
    ...opacity.map((o) => `--ds-${o.name.replaceAll('.', '-')}: ${o[k]};`),
  ];
  const elev = [block(LIGHT, elevationLines('light')), block(DARK, elevationLines('dark'))];
  elev.push(`@media (prefers-color-scheme: dark) {\n${block(`  ${AUTO}`, elevationLines('dark'))}}\n`);
  for (const [k, base] of [['light_ic', LIGHT_OR_UNSET], ['dark_ic', DARK]]) {
    const sk = k.split('_')[0];
    const diff = shadows.filter((s) => (s[k] ?? s[sk]) !== s[sk]).map((s) => `${dsName(s.name)}: ${shadowCss(s[k])};`);
    if (diff.length) elev.push(block(`${base}[data-contrast-mode="more"]`, diff));
  }
  files['_elevation.scss'] = header + elev.join('\n');

  // Bootstrap is imported compiled, so bridge its CSS variables; the *-rgb triplets are literal per mode.
  const by = Object.fromEntries(rows.map((r) => [r.name, r]));
  const roles = {
    primary: 'color.background.brand.bold', danger: 'color.background.danger.bold', success: 'color.background.success.bold',
    warning: 'color.background.warning.bold', info: 'color.background.information.bold',
    light: 'color.background.neutral', dark: 'color.background.neutral.bold',
  };
  const triplet = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
  const bridge = (m) => [
    '--bs-body-bg: var(--ds-surface);', '--bs-body-color: var(--ds-text);', '--bs-border-color: var(--ds-border);',
    '--bs-link-color: var(--ds-link);', '--bs-link-hover-color: var(--ds-link-pressed);',
    '--bs-focus-ring-color: var(--ds-border-focused);', '--bs-secondary-color: var(--ds-text-subtle);',
    ...Object.entries(roles).flatMap(([role, tok]) => [`--bs-${role}: var(${dsName(tok)});`, `--bs-${role}-rgb: ${triplet(by[tok][m])};`]),
    `--bs-body-color-rgb: ${triplet(by['color.text'][m])};`, `--bs-link-color-rgb: ${triplet(by['color.link'][m])};`,
  ];
  files['_bootstrap-bridge.scss'] = `${header}${block(LIGHT, bridge('light'))}\n${block(DARK, bridge('dark'))}`;
  return files;
}
