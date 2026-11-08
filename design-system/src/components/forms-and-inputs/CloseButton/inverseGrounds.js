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
    '--ds-background-neutral-bold',
    '--ds-background-brand-bold',
    '--ds-background-success-bold',
    '--ds-background-danger-bold',
    '--ds-background-accent-teal-bolder',
    '--ds-background-information-bold',
];
