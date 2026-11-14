/**
 * One shape for every option across select, menu, tree, and cascader controls,
 * whether the caller passed a primitive (`string | number`) or an object.
 *
 * Uses nullish coalescing (`??`) so falsy values (`0`, `''`) never fall through.
 *
 * @param {string|number|object} option
 * @param {number} [index] Its place in the caller's array, keeping its id stable while filtering.
 * @returns {{
 *   value: *,
 *   label: *,
 *   text: string,
 *   description?: *,
 *   disabled: boolean,
 *   children: Array,
 *   group?: string,
 *   elemBefore?: *,
 *   elemAfter?: *,
 *   dragging?: boolean,
 *   dropIndicator?: *,
 *   index?: number,
 *   source: *
 * }}
 */
export function normalizeOption(option, index) {
    if (typeof option === 'string' || typeof option === 'number') {
        return {
            value: option,
            label: option,
            text: String(option),
            disabled: false,
            children: [],
            index,
            source: option,
        };
    }
    const value = option.value ?? option.label ?? option.text;
    const label = option.label ?? option.text ?? String(option.value ?? '');
    const text = typeof label === 'string' ? label : (option.text ?? String(value ?? ''));
    return {
        value,
        label,
        text,
        description: option.description,
        disabled: Boolean(option.disabled),
        children: Array.isArray(option.children) ? option.children : [],
        group: option.group,
        elemBefore: option.elemBefore,
        elemAfter: option.elemAfter,
        dragging: Boolean(option.dragging),
        dropIndicator: option.dropIndicator,
        index,
        source: option,
    };
}

/** The option's value (`value ?? label ?? text`), preserving `0` and `''`. */
export const getOptionValue = (option) => normalizeOption(option).value;

/** The option's display node or string (`label ?? text ?? String(value)`). */
export const getOptionLabel = (option) => normalizeOption(option).label;

/** The option's plain string text for filtering and text inputs. */
export const getOptionText = (option) => normalizeOption(option).text;

/** Child options array for tree and cascader nodes, or `[]` for leaves. */
export const getOptionChildren = (option) => normalizeOption(option).children;

/** Whether the option is disabled. */
export const isOptionDisabled = (option) => normalizeOption(option).disabled;

export default normalizeOption;
