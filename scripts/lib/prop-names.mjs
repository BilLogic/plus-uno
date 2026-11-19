/**
 * The prop-name rules of the design system, in one place.
 *
 * `GLOSSARY.md` (and `docs/conventions/design-system-glossary.md`) states them
 * in words: a boolean state prop is an `is…` prop, a component's look is
 * `appearance` and a component's kind is `type`. `check:prop-names` enforces
 * them over the generated component facts and reads them from here, so the
 * rule has one home and a new bare name is a one-line change.
 */

/** Bare boolean state names; each is `is` plus the name with a capital, `isDisabled`. */
export const BARE_BOOLEANS = ['disabled', 'readOnly', 'required', 'loading', 'selected', 'open'];

/** The `is…` name a bare boolean becomes: `readOnly` is `isReadOnly`. */
export const isName = (bare) => `is${bare[0].toUpperCase()}${bare.slice(1)}`;

/** Names that stand for a look or a kind, with the one name to use. */
export const RENAMED = { variant: 'appearance', tone: 'appearance or type' };

/**
 * Bare names that stay, each for the reason it is still here. A name leaves
 * this list in the change that renames it, so the list only ever shrinks.
 */
export const ALLOWED = [
  { component: 'Dialog', prop: 'loading', why: 'renamed after the modal-width work lands' },
  { component: 'Modal', prop: 'loading', why: 'renamed after the modal-width work lands' },
];

/**
 * What the rule says about one prop, or null when it is fine.
 * @param {{name: string, type?: string|null}} prop
 * @returns {{use: string}|null}
 */
export function ruleFor(prop) {
  if (prop.name in RENAMED) return { use: RENAMED[prop.name] };
  if (BARE_BOOLEANS.includes(prop.name) && /^bool/.test(prop.type ?? '')) return { use: isName(prop.name) };
  return null;
}
