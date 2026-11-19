/**
 * The prop-name rules of the design system, in one place.
 *
 * `GLOSSARY.md` (and `docs/conventions/design-system-glossary.md`) states them
 * in words: a boolean state prop is an `is…` prop, a component's look is
 * `appearance` and a component's kind is `type`. `check:prop-names` enforces
 * them over the generated component facts and reads them from here, so the
 * rule has one home and a new bare name is a one-line change.
 */

import { loadExceptions } from './exceptions.mjs';

/** Bare boolean state names; each is `is` plus the name with a capital, `isDisabled`. */
export const BARE_BOOLEANS = ['disabled', 'readOnly', 'required', 'loading', 'selected', 'open'];

/** The `is…` name a bare boolean becomes: `readOnly` is `isReadOnly`. */
export const isName = (bare) => `is${bare[0].toUpperCase()}${bare.slice(1)}`;

/** Names that stand for a look or a kind, with the one name to use. */
export const RENAMED = { variant: 'appearance', tone: 'appearance or type' };

/**
 * Bare names that stay, each for the reason it is still here: the `allowed` list of
 * `check:prop-names` in `scripts/exceptions.json`, an entry per `Component.prop`. A name
 * leaves the list in the change that renames it, so the list only ever shrinks.
 *
 * @returns {{component: string, prop: string, reason: string}[]}
 */
export function allowedProps() {
  return loadExceptions('check:prop-names', 'allowed').map(({ at, reason }) => {
    const [component, prop] = at.split('.');
    return { component, prop, reason };
  });
}

/**
 * What the rule says about one prop, or null when it is fine.
 * @param {{name: string, type?: string|null}} prop
 * @returns {{use: string}|null}
 */
export function ruleFor(prop) {
  if (prop.name in RENAMED) return { use: RENAMED[prop.name] };
  // A type the facts could not read is no excuse: it is judged as a boolean until it says otherwise.
  if (BARE_BOOLEANS.includes(prop.name) && (!prop.type || /^bool/.test(prop.type) || prop.type === 'unknown')) return { use: isName(prop.name) };
  return null;
}
