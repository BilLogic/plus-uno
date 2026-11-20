/**
 * Which browser chrome a story is drawn in. Browser chrome frames full pages
 * only: a story takes the toolbar's choice when it sets `parameters.fullPage`
 * (it renders a Frame, the whole app screen), and every other story renders
 * bare. A block (Section, Card, Table, PatternCard), an overlay shown alone
 * and a widget are not websites.
 *
 * `parameters.browserFrame` ('chrome' | 'safari' | 'edge' | 'none') forces one
 * choice for a story, whatever the toolbar says.
 */
export const browserFor = (parameters = {}, globals = {}) => {
    if (parameters.browserFrame) return parameters.browserFrame;
    return parameters.fullPage ? globals.plusBrowser || 'none' : 'none';
};
