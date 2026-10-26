/**
 * SCSS emission for one plan (port of the reference generator's `emit.py`):
 *
 *   _palette.scss          --palette-* primitives on :root
 *   _semantic.scss         --ds-* color tokens: light, dark, auto, and increased contrast as override-only blocks
 *   _elevation.scss        --ds-shadow-* and --ds-opacity-* per mode
 *   _bootstrap-bridge.scss --bs-* variables pointed at --ds-* so react-bootstrap follows the mode, in all four modes
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

  files['_bootstrap-bridge.scss'] = header + bootstrapBridge(rows);
  return files;
}

/**
 * Bootstrap is imported as compiled CSS, so it has no Sass variables to alias: the bridge points its
 * root CSS variables at `--ds-*`. Each `var()` follows the mode by itself; the `*-rgb` triplets are
 * literal numbers Bootstrap composes as `rgba(var(--bs-primary-rgb), .5)`, so they are comma-separated,
 * written per mode, and the increased-contrast blocks carry only the literals that change.
 */
const BRIDGE_VARS = {
  'body-bg': 'elevation.surface', 'body-color': 'color.text', 'emphasis-color': 'color.text',
  'secondary-color': 'color.text.subtle',
  // Both have triplets (`.bg-body-secondary`, `.bg-body-tertiary`), so both need opaque tokens, and both
  // paint at rest: secondary the disabled field and the progress track, tertiary `.input-group-text`.
  // Bootstrap keeps secondary the darker step, so secondary takes the hovered surface's gray and
  // tertiary the sunken surface.
  'secondary-bg': 'elevation.surface.hovered', 'tertiary-bg': 'elevation.surface.sunken',
  'border-color': 'color.border',
  // Bootstrap's translucent border exists to sit on any fill; `color.border` is already translucent
  // ink, so it serves. It also re-borders .card, .popover, .offcanvas, .modal, .dropdown-menu and .toast.
  'border-color-translucent': 'color.border',
  'link-color': 'color.link', 'link-hover-color': 'color.link.pressed', 'focus-ring-color': 'color.border.focused',
  'form-valid-color': 'color.text.success', 'form-valid-border-color': 'color.border.success',
  'form-invalid-color': 'color.text.danger', 'form-invalid-border-color': 'color.border.danger',
  primary: 'color.background.brand.bold', danger: 'color.background.danger.bold', success: 'color.background.success.bold',
  warning: 'color.background.warning.bold', info: 'color.background.information.bold',
  // Light and dark need opaque tokens: a triplet drops alpha, so an alpha token would turn `.bg-light` solid ink.
  light: 'elevation.surface.sunken', dark: 'color.background.neutral.bold',
};

/** The bridged variables Bootstrap 5.3 also reads as `*-rgb` triplets. */
const BOOTSTRAP_RGB = [
  'body-bg', 'body-color', 'emphasis-color', 'secondary-color', 'secondary-bg', 'tertiary-bg',
  'link-color', 'link-hover-color', 'primary', 'danger', 'success', 'warning', 'info', 'light', 'dark',
];

/** Each `--bs-*-rgb` triplet the bridge writes, and the `--ds-*` role it must equal in every mode. */
export const BRIDGE_TRIPLETS = Object.fromEntries(BOOTSTRAP_RGB.map((bs) => [`--bs-${bs}-rgb`, dsName(BRIDGE_VARS[bs])]));

/**
 * Bootstrap paints its form glyphs as SVG data URIs, which cannot read a CSS variable, so each mode
 * gets its own: the check, radio dot, indeterminate bar and switch knob in the inverse icon color
 * over the checked fill, and the focused switch knob in the focus color.
 */
const svg = (viewBox, body) => `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'%3e${body}%3c/svg%3e")`;
const stroke = (hex, d) => `%3cpath fill='none' stroke='${hex}' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='${d}'/%3e`;
const FORM_GLYPHS = {
  'form-check-checked-image': ['color.icon.inverse', (c) => svg('0 0 20 20', stroke(c, 'm6 10 3 3 6-6'))],
  'form-check-radio-image': ['color.icon.inverse', (c) => svg('-4 -4 8 8', `%3ccircle r='2' fill='${c}'/%3e`)],
  'form-check-indeterminate-image': ['color.icon.inverse', (c) => svg('0 0 20 20', stroke(c, 'M6 10h8'))],
  'form-switch-checked-image': ['color.icon.inverse', (c) => svg('-4 -4 8 8', `%3ccircle r='3' fill='${c}'/%3e`)],
  'form-switch-focus-image': ['color.border.focused', (c) => svg('-4 -4 8 8', `%3ccircle r='3' fill='${c}'/%3e`)],
};

/**
 * Bootstrap compiles its brand blue into form states and the dropdown's active item, out of reach of
 * any root variable, so the bridge restates those rules on the tokens. Checked controls take the
 * selected bold fill; focus is the focus color as a 2px ring 2px out, in place of the blue glow;
 * the dropdown's active item is the neutral selected fill.
 */
const BRIDGE_RULES = [
  ['.form-control:focus,\n.form-select:focus,\n.form-check-input:focus', [
    'border-color: var(--bs-border-color);', 'box-shadow: none;',
    'outline: 2px solid var(--ds-border-focused);', 'outline-offset: 2px;',
  ]],
  ['.form-check-input:checked,\n.form-check-input[type=checkbox]:indeterminate', [
    'background-color: var(--ds-background-selected-bold);', 'border-color: var(--ds-background-selected-bold);',
  ]],
  ['.form-check-input:checked[type=checkbox]', ['--bs-form-check-bg-image: var(--bs-form-check-checked-image);']],
  ['.form-check-input:checked[type=radio]', ['--bs-form-check-bg-image: var(--bs-form-check-radio-image);']],
  ['.form-check-input[type=checkbox]:indeterminate', ['--bs-form-check-bg-image: var(--bs-form-check-indeterminate-image);']],
  ['.form-switch .form-check-input:focus', ['--bs-form-switch-bg: var(--bs-form-switch-focus-image);']],
  ['.form-switch .form-check-input:checked', ['--bs-form-switch-bg: var(--bs-form-switch-checked-image);']],
  ['.dropdown-menu', [
    '--bs-dropdown-link-hover-bg: var(--ds-background-neutral-subtle-hovered);',
    '--bs-dropdown-link-active-bg: var(--ds-background-selected);',
    '--bs-dropdown-link-active-color: var(--ds-text-selected);',
  ]],
];

function bootstrapBridge(rows) {
  const by = Object.fromEntries(rows.map((r) => [r.name, r]));
  const triplet = (name, mode) => {
    const { r, g, b, a } = parseHex(by[name][mode]);
    if (a !== null) throw new Error(`Bootstrap bridge: ${name} is translucent in ${mode}; a *-rgb triplet needs an opaque token`);
    return `${r}, ${g}, ${b}`;
  };
  const vars = Object.entries(BRIDGE_VARS).map(([bs, tok]) => `--bs-${bs}: var(${dsName(tok)});`);
  const literals = (mode) => [
    ...BOOTSTRAP_RGB.map((bs) => `--bs-${bs}-rgb: ${triplet(BRIDGE_VARS[bs], mode)};`),
    ...Object.entries(FORM_GLYPHS).map(([bs, [tok, image]]) => `--bs-${bs}: ${image(by[tok][mode].replace('#', '%23'))};`),
  ];
  const changed = (mode, base) => {
    const [ic, std] = [literals(mode), literals(base)];
    return ic.filter((line, i) => line !== std[i]);
  };
  return (
    `${block(LIGHT, [...vars, ...literals('light')])}\n${block(DARK, [...vars, ...literals('dark')])}\n${autoDark([...vars, ...literals('dark')])}` +
    contrastBlocks(changed('light_ic', 'light'), 'light') +
    contrastBlocks(changed('dark_ic', 'dark'), 'dark') +
    `\n${BRIDGE_RULES.map(([sel, lines]) => block(sel, lines)).join('\n')}`
  );
}
