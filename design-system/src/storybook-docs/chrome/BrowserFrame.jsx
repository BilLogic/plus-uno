import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import './BrowserFrame.scss';

/**
 * BrowserFrame: docs-only window chrome (Chrome or Safari) drawn around a
 * story, so a Frame or page template reads as an app in a browser window.
 *
 * The chrome sits above the story and the outline is drawn outside the
 * content box, so the page inside keeps the width and left edge it has with
 * no frame. Nesting-safe: a frame inside another renders its children bare.
 * Not part of the component library; it is not exported from `@/components`.
 */

export const BROWSER_OPTIONS = ['none', 'chrome', 'safari'];

const BrowserContext = createContext(false);

const URL_PATH = '/app/sessions';

const Glyph = ({ name, regular = false }) => (
    <i className={`${regular ? 'fa-regular' : 'fa-solid'} fa-${name}`} aria-hidden="true" />
);
Glyph.propTypes = { name: PropTypes.string.isRequired, regular: PropTypes.bool };

const Lights = () => (
    <span className="plus-browser-frame__lights" aria-hidden="true"><b /><b /><b /></span>
);

const ChromeBar = () => (
    <>
        <div className="plus-browser-frame__tabs">
            <Lights />
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
            <Glyph name="ellipsis-vertical" />
        </div>
    </>
);

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
 * @param {'none' | 'chrome' | 'safari'} [props.browser]  the window chrome; none renders the children bare
 * @param {React.ReactNode} props.children
 */
const BrowserFrame = ({ browser = 'none', children }) => {
    const nested = useContext(BrowserContext);
    if (nested || (browser !== 'chrome' && browser !== 'safari')) return <>{children}</>;
    return (
        <BrowserContext.Provider value>
            <div className={`plus-browser-frame plus-browser-frame--${browser}`} data-browser={browser}>
                <div className="plus-browser-frame__chrome" aria-hidden="true">
                    {browser === 'chrome' ? <ChromeBar /> : <SafariBar />}
                </div>
                <div className="plus-browser-frame__page">{children}</div>
            </div>
        </BrowserContext.Provider>
    );
};

BrowserFrame.propTypes = {
    browser: PropTypes.oneOf(BROWSER_OPTIONS),
    children: PropTypes.node.isRequired,
};

export default BrowserFrame;
