/**
 * The grounds `CloseButton tone="inverse"` is for — the same list as the
 * `@grounds` line on `.plus-close-btn--inverse` in `CloseButton.scss`.
 *
 * The InverseGrounds story renders the button on each. A unit test
 * (`scripts/lib/declared-grounds.test.mjs`) parses the SCSS with the same
 * library the contrast checks use and fails when this list and the `@grounds`
 * annotation disagree.
 */
export const INVERSE_GROUNDS = [
    '--color-inverse-surface',
    '--color-primary',
    '--color-secondary',
    '--color-success',
    '--color-danger',
    '--color-tertiary',
    '--color-info',
    '--color-warning',
];
