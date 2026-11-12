/**
 * The illustration kit's whole palette. Every drawing paints with these and
 * with nothing else, so a drawing follows the toolbar's Color mode and Contrast
 * switches. `npm run check:docs-token-literals` fails a raw color, stroke width
 * or corner anywhere in this folder.
 */
const ds = (name) => `var(--ds-${name})`;

export const PAINT = {
  surface: ds('surface'),
  raised: ds('surface-raised'),
  sunken: ds('surface-sunken'),
  overlay: ds('surface-overlay'),
  line: ds('border'),
  ink: ds('border-bold'),
  skeleton: ds('skeleton'),
  neutral: ds('background-neutral'),
  blanket: ds('blanket'),
  accent: ds('background-brand-bold'),
  accentTint: ds('background-brand-subtlest'),
};

/** Corners, from the radius tokens (SVG reads them as user units). */
export const CORNER = {
  none: undefined,
  full: 'var(--radius-full)',
  xs: 'var(--radius-0125)',
  sm: 'var(--radius-025)',
  md: 'var(--radius-0375)',
};

/** The hairline every outline and divider draws with. */
export const HAIRLINE = { strokeWidth: 'var(--stroke-1)' };
