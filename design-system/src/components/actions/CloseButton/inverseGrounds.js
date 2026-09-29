/**
 * The grounds `CloseButton tone="inverse"` is for — the same list as the
 * `@grounds` line on `.plus-close-btn--inverse` in `CloseButton.scss`.
 *
 * One source for the two readers that are not the contrast checks: the
 * InverseGrounds story renders the button on each, and a unit test
 * (`scripts/lib/declared-grounds.test.mjs`) and that story both fail when this
 * list and the SCSS line disagree.
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
