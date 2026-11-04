// The preview's background picker. Every ground is a `--ds-surface-*` elevation
// token, so it follows the Color mode and Contrast toolbar globals with the rest of the
// page: the tokens are defined once per mode (data-color-mode on <html>), and a
// `var()` resolves against whichever block is live. No literal colors.
// Kept in its own module so the token check can read it without a JSX toolchain.

export const BACKGROUND_OPTIONS = {
  surface: { name: 'surface', value: 'var(--ds-surface)' },
  'surface-sunken': { name: 'surface-sunken', value: 'var(--ds-surface-sunken)' },
  'surface-raised': { name: 'surface-raised', value: 'var(--ds-surface-raised)' },
  'surface-overlay': { name: 'surface-overlay', value: 'var(--ds-surface-overlay)' },
  'surface-container': { name: 'surface-container', value: 'var(--ds-surface-container)' },
};

export const DEFAULT_BACKGROUND = 'surface';
