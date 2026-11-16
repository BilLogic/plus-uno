/**
 * Accessible name for a field's clear button: `"Clear start date"`, `"Clear school"`.
 *
 * @param {unknown} noun
 * @param {string} [fallback='selection']
 * @returns {string}
 */
export default function clearLabel(noun, fallback = 'selection') {
    const text = typeof noun === 'string' && noun.trim() ? noun.trim() : fallback;
    return `Clear ${text.toLowerCase()}`;
}
