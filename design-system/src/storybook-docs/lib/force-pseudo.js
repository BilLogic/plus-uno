/**
 * Force `:hover` or `:active` on an element for a story `play:` function, and
 * let the browser's own cascade decide what that looks like.
 *
 * WHY THIS EXISTS. `userEvent` in a play function dispatches synthetic events,
 * and a synthetic `mouseover` or `mousedown` never sets `:hover` or `:active`:
 * only a real pointer does. Reading the rules by hand and guessing which one
 * wins can pass while the real hover is wrong, because the guess is not the
 * cascade. So this rewrites the pseudo-class into a class of the same
 * specificity, in a copy of each stylesheet placed exactly where the original
 * sat, disables the original, and adds the class. What `getComputedStyle`
 * returns is then the cascade's answer, specificity and order included.
 *
 * Only same-origin sheets can be read; a cross-origin sheet is left alone.
 */

const CLASSES = {
    ':hover': '__force-hover',
    ':active': '__force-active',
};

/**
 * Runs `read` while `target` is forced into `pseudo`, then restores the page.
 *
 * @param {Element} target  the element the pseudo-class applies to (for a
 *   `:has(> .link:hover)` rule, the link, not its parent)
 * @param {':hover'|':active'} pseudo
 * @param {() => T} read    measures the page while the state holds
 * @returns {T}
 * @template T
 */
export const withForcedPseudo = (target, pseudo, read) => {
    const forced = CLASSES[pseudo];
    if (!forced) throw new Error(`withForcedPseudo: ${pseudo} is not supported`);

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
        const text = [...rules].map((rule) => rule.cssText).join('\n');
        if (!text.includes(pseudo)) continue;

        const copy = document.createElement('style');
        copy.textContent = text.split(pseudo).join(`.${forced}`);
        owner.after(copy);
        sheet.disabled = true;
        swapped.push({ sheet, copy });
    }

    // A real pointer hovers and presses every ancestor along with the target,
    // so the forced state does too.
    const marked = [];
    for (let el = target; el && el.nodeType === 1; el = el.parentElement) marked.push(el);
    marked.forEach((el) => el.classList.add(forced));

    try {
        return read();
    } finally {
        marked.forEach((el) => el.classList.remove(forced));
        for (const { sheet, copy } of swapped) {
            copy.remove();
            sheet.disabled = false;
        }
    }
};

export default withForcedPseudo;
