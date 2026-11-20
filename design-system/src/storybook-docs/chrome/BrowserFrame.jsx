import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { PageViewBar, PageViewProvider, PageViewWell, layerProps, usePageView, usePageViewIds } from './PageView';
import './BrowserFrame.scss';

/**
 * BrowserFrame: docs-only window chrome (Chrome, Safari or Edge) drawn around
 * a story, so a page template reads as an app in a browser window.
 *
 * The chrome sits above the story and the outline is drawn outside the
 * content box, so the page inside keeps the width and left edge it has with
 * no frame. Nesting-safe: a frame inside another renders its children bare.
 * A view control above the window sets the page to Fit, 50%, 75%, 100% or
 * Full screen (see PageView). Not part of the component library; it is not exported from `@/components`.
 */

export const BROWSER_OPTIONS = ['none', 'chrome', 'safari', 'edge'];
const DRAWN = new Set(['chrome', 'safari', 'edge']);

const BrowserContext = createContext(false);

const URL_PATH = '/app/sessions';

const Glyph = ({ name, regular = false }) => (
    <i className={`${regular ? 'fa-regular' : 'fa-solid'} fa-${name}`} aria-hidden="true" />
);
Glyph.propTypes = { name: PropTypes.string.isRequired, regular: PropTypes.bool };

const Lights = () => (
    <span className="plus-browser-frame__lights" aria-hidden="true"><b /><b /><b /></span>
);

const ChromeBar = ({ edge = false }) => (
    <>
        <div className="plus-browser-frame__tabs">
            <Lights />
            {edge && <Glyph name="table-columns" />}
            <div className="plus-browser-frame__tab">
                <span className="plus-browser-frame__favicon" />
                <span className="plus-browser-frame__tab-title">Sessions · PLUS</span>
                <Glyph name="xmark" />
            </div>
            <Glyph name="plus" />
        </div>
        <div className="plus-browser-frame__toolbar">
            <Glyph name="arrow-left" />
            <Glyph name="arrow-right" />
            <Glyph name="rotate-right" />
            <div className="plus-browser-frame__omnibox">
                <Glyph name="lock" />
                <span>plus-uno.netlify.app<em>{URL_PATH}</em></span>
            </div>
            <Glyph name="star" regular />
            {edge ? (
                <>
                    <Glyph name="clone" regular />
                    <Glyph name="circle-user" regular />
                    <Glyph name="ellipsis" />
                </>
            ) : <Glyph name="ellipsis-vertical" />}
        </div>
    </>
);
ChromeBar.propTypes = { edge: PropTypes.bool };

const SafariBar = () => (
    <div className="plus-browser-frame__toolbar plus-browser-frame__toolbar--safari">
        <Lights />
        <Glyph name="table-columns" />
        <Glyph name="chevron-left" />
        <Glyph name="chevron-right" />
        <div className="plus-browser-frame__field">
            <Glyph name="lock" />
            <span>plus-uno.netlify.app</span>
            <Glyph name="rotate-right" />
        </div>
        <span className="plus-browser-frame__tools">
            <Glyph name="arrow-up-from-bracket" />
            <Glyph name="plus" />
            <Glyph name="clone" regular />
        </span>
    </div>
);

/**
 * @param {object} props
 * @param {'none' | 'chrome' | 'safari' | 'edge'} [props.browser]  the window chrome; none renders the children bare
 * @param {'auto' | 'always'} [props.view]  when the view control shows: only for a page wider than its column, or always
 * @param {React.ReactNode} props.children
 */
const BrowserFrame = ({ browser = 'none', view = 'auto', children }) => {
    const nested = useContext(BrowserContext);
    if (nested || !DRAWN.has(browser)) return <>{children}</>;
    return <DrawnFrame browser={browser} viewMode={view}>{children}</DrawnFrame>;
};

const DrawnFrame = ({ browser, viewMode, children }) => {
    const view = usePageView(viewMode);
    const ids = usePageViewIds();
    return (
        <BrowserContext.Provider value>
            <PageViewProvider value>
                <div {...layerProps(view, ids, 'plus-browser-view')}>
                    {view.showBar && <PageViewBar view={view} ids={ids} />}
                    <div className={`plus-browser-frame plus-browser-frame--${browser}`} data-browser={browser}>
                        <div className="plus-browser-frame__chrome" aria-hidden="true">
                            {browser === 'safari' ? <SafariBar /> : <ChromeBar edge={browser === 'edge'} />}
                        </div>
                        <div className="plus-browser-frame__page">
                            <PageViewWell view={view}>{children}</PageViewWell>
                        </div>
                    </div>
                </div>
            </PageViewProvider>
        </BrowserContext.Provider>
    );
};
DrawnFrame.propTypes = { browser: PropTypes.oneOf(BROWSER_OPTIONS).isRequired, viewMode: PropTypes.oneOf(['always', 'auto']).isRequired, children: PropTypes.node.isRequired };

BrowserFrame.propTypes = {
    browser: PropTypes.oneOf(BROWSER_OPTIONS),
    /** `auto` draws the view control only when the page is wider than its column; `always` draws it on every page. */
    view: PropTypes.oneOf(['always', 'auto']),
    children: PropTypes.node.isRequired,
};

export default BrowserFrame;
