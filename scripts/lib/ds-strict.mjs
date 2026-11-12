/**
 * The strict list the design-system docs checks share: `check:ds-writing` and
 * `check:ds-vocabulary` hold the pages named here to every rule, and the switch
 * decides whether a finding on one fails `check:harness`.
 *
 * A page joins the list when it passes both checks' `-- --strict` run; the list
 * grows from there.
 */

/** The pages held to every rule, by component name. */
export const STRICT_PAGES = ['Modal', 'PatternSection', 'Frame'];

/** The switch: true makes a strict page's finding fail `check:harness`. */
export const ENFORCE_STRICT = true;
