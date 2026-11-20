/**
 * Which browser chrome a story is drawn in. Browser chrome frames full pages
 * only: a story takes the toolbar's choice when it sets `parameters.fullPage`
 * (it renders a Frame, the whole app screen), and every other story renders
 * bare. A block (Section, Card, Table), an overlay shown alone
 * and a widget are not websites.
 *
 * `parameters.browserFrame` ('chrome' | 'safari' | 'edge' | 'none') forces one
 * choice for a story, whatever the toolbar says.
 */
export const browserFor = (parameters = {}, globals = {}) => {
    if (parameters.browserFrame) return parameters.browserFrame;
    return parameters.fullPage ? globals.plusBrowser || 'none' : 'none';
};

/**
 * Whether a rendered story draws its own in-story `BrowserWindow` (the static
 * window docs demos put around an app page): a `not-prose` box whose title bar
 * starts with the three window dots. A story that does must not also take the
 * toolbar's browser chrome, or it shows two windows.
 */
export const ownsBrowserWindow = (root) => !!root?.querySelector('div.not-prose > div:first-child > span[aria-hidden="true"] > span:nth-child(3):last-child');
