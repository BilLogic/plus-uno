/**
 * Force a media query to match for a story `play:` function, and let the
 * browser's own cascade decide what that looks like.
 *
 * WHY THIS EXISTS. A play function runs inside the page, and the page cannot
 * set the browser's media features: `prefers-reduced-motion` is the person's
 * setting, and Playwright's emulation is reachable from the runner, not from
 * the story. So, as `force-pseudo.js` does for `:hover`, this copies every
 * same-origin stylesheet that mentions the query, rewrites each matching
 * `@media` rule to `@media all`, places the copy exactly where the original
 * sat, and disables the original. What `getComputedStyle` returns is then the
 * cascade's answer with the query matching, specificity and order included.
 *
 * Only same-origin sheets can be read; a cross-origin sheet is left alone.
 */

/**
 * Runs `read` while `query` matches, then restores the page.
 *
 * @param {string} query   the condition exactly as the stylesheet writes it,
 *   such as `(prefers-reduced-motion: reduce)`
 * @param {() => T} read   measures the page while the query holds
 * @returns {T}
 * @template T
 */
export const withForcedMedia = (query, read) => {
    const swapped = [];
    for (const sheet of [...document.styleSheets]) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch {
            continue; // Cross-origin: not ours to read.
        }
        const owner = sheet.ownerNode;
        if (!owner || sheet.disabled) continue;
        const matching = [...rules].some((rule) => rule instanceof CSSMediaRule && rule.conditionText === query);
        if (!matching) continue;

        const text = [...rules].map((rule) => (
            rule instanceof CSSMediaRule && rule.conditionText === query
                ? `@media all { ${[...rule.cssRules].map((inner) => inner.cssText).join('\n')} }`
                : rule.cssText
        )).join('\n');

        const copy = document.createElement('style');
        copy.textContent = text;
        owner.after(copy);
        sheet.disabled = true;
        swapped.push({ sheet, copy });
    }

    try {
        return read();
    } finally {
        for (const { sheet, copy } of swapped) {
            copy.remove();
            sheet.disabled = false;
        }
    }
};

export default withForcedMedia;
