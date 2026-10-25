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
