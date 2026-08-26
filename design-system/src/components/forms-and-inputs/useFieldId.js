import { useId } from 'react';

/**
 * One id for a field, used by both its label and its control.
 *
 * WHY (#206). Eight form components rendered `htmlFor={id || name}` while
 * passing only `id` to the control. The `|| name` reads like tolerance for a
 * missing `id` and is the opposite: it produces a `for` that resolves to
 * nothing, which is harder to spot than no label at all. `name` is not an id —
 * it is not unique on the page and no element carries it as one.
 *
 * The fallback belongs on the *id*, not on the `for`: derive one value, hand it
 * to the label and the control, and generate it when the caller gave none.
 * `useId` produces a value that is stable across renders and unique per
 * instance, which is what two instances of the same field on one page need.
 *
 * A caller who passes `id` gets exactly that id back, on exactly the elements
 * it was on before — this is additive to shipped call sites, never a rename.
 *
 * @param {string} [id] the caller's `id`, if any
 * @returns {string} the id to use for both the label's `htmlFor` and the control
 */
export default function useFieldId(id) {
    // Unconditional: hooks cannot be skipped when `id` happens to be present.
    const generated = useId();
    return id || generated;
}
