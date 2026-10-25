/**
 * The color and contrast modes, as attributes on <html>.
 *
 * The generated color tokens key every mode off `data-color-mode` (light,
 * dark, auto) and `data-contrast-mode` (more, no-preference, auto); no
 * attribute is light at standard contrast. Bootstrap keys its own light and
 * dark off `data-bs-theme`, which has no `auto`, so under auto it follows the
 * OS's `prefers-color-scheme` as read when this runs.
 *
 * The Storybook decorator in `.storybook/preview.jsx` calls this with the
 * toolbar's globals, and the Foundations/Color modes story tests it.
 */

export const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * The Bootstrap theme a color mode resolves to now.
 * @param {string} colorMode light | dark | auto
 * @returns {'light' | 'dark'}
 */
export const resolveBsTheme = (colorMode) => {
    if (colorMode !== 'auto') return colorMode === 'dark' ? 'dark' : 'light';
    const osDark = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(COLOR_SCHEME_QUERY).matches
        : false;
    return osDark ? 'dark' : 'light';
};

/**
 * Sets the mode attributes on <html>.
 * @param {string} colorMode light | dark | auto
 * @param {string} contrastMode no-preference | more | auto
 */
export const applyColorModes = (colorMode, contrastMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-color-mode', colorMode);
    root.setAttribute('data-contrast-mode', contrastMode);
    root.setAttribute('data-bs-theme', resolveBsTheme(colorMode));
};

/**
 * Light, dark, and each at more contrast: the four modes a story's play
 * function holds a component in, as `[colorMode, contrastMode]`.
 */
export const COLOR_MODES = [
    ['light', 'no-preference'],
    ['dark', 'no-preference'],
    ['light', 'more'],
    ['dark', 'more'],
];

/**
 * Runs `check` once in each of `COLOR_MODES`, with the mode set on <html>
 * through `applyColorModes`, then puts <html> back as the toolbar left it, so
 * the a11y check and later story files see the page unchanged.
 *
 * @param {(mode: string) => (void | Promise<void>)} check  called with a label
 *   such as "dark, more contrast", for assertion messages
 */
export const inEveryColorMode = async (check) => {
    const root = document.documentElement;
    const saved = ['data-color-mode', 'data-contrast-mode', 'data-bs-theme'].map((name) => [name, root.getAttribute(name)]);
    try {
        for (const [colorMode, contrastMode] of COLOR_MODES) {
            applyColorModes(colorMode, contrastMode);
            await check(`${colorMode}, ${contrastMode} contrast`);
        }
    } finally {
        saved.forEach(([name, value]) => (value === null ? root.removeAttribute(name) : root.setAttribute(name, value)));
    }
};
