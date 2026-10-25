/**
 * Runs a story's color assertions once in each of the four color modes.
 *
 * The generated color tokens resolve differently in light, dark, and each at
 * more contrast (`data-color-mode`, `data-contrast-mode` on <html>; see
 * `color-modes.js`). A play function that checks a computed color against its
 * token proves the mapping in the mode the toolbar left; this proves it in
 * all four. The attributes are restored when it is done, so the a11y check
 * and later stories see the page as the toolbar left it.
 */

export const COLOR_MODES = [
    { colorMode: 'light', contrastMode: 'no-preference' },
    { colorMode: 'dark', contrastMode: 'no-preference' },
    { colorMode: 'light', contrastMode: 'more' },
    { colorMode: 'dark', contrastMode: 'more' },
];

const ATTRIBUTES = ['data-color-mode', 'data-contrast-mode', 'data-bs-theme'];

/**
 * @param {(mode: {colorMode: string, contrastMode: string, label: string}) => Promise<void> | void} assert
 */
export const eachColorMode = async (assert) => {
    const root = document.documentElement;
    const saved = ATTRIBUTES.map((name) => root.getAttribute(name));
    try {
        for (const { colorMode, contrastMode } of COLOR_MODES) {
            root.setAttribute('data-color-mode', colorMode);
            root.setAttribute('data-contrast-mode', contrastMode);
            root.setAttribute('data-bs-theme', colorMode);
            await assert({ colorMode, contrastMode, label: `${colorMode}, ${contrastMode} contrast` });
        }
    } finally {
        ATTRIBUTES.forEach((name, i) => {
            if (saved[i] === null) root.removeAttribute(name);
            else root.setAttribute(name, saved[i]);
        });
    }
};
