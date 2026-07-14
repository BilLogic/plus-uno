import React, { useRef, useCallback, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button/Button';

/**
 * ResponsiveFrame — the display well for spec Pages & Sections in Storybook docs.
 *
 * Behaviour:
 *  1. **Chrome-less.** The well has no background, border, radius or padding of its own — the page
 *     (PageLayout) provides its own surface, so there is exactly ONE frame, not a page-on-a-panel.
 *  2. **Breakpoint sizing**
 *     - `native` / unset: fill the available width (`width: 100%`) and reflow with the viewport.
 *     - `md` / `lg` / `xl`: keep a **minimum** width of that breakpoint. If the docs column is
 *       narrower, the well scrolls horizontally. If the column is wider, the preview **fills**
 *       the available space (`width: 100%`, `minWidth: <bp>`).
 *  3. **Fixed desktop height** in docs; **full viewport** when already opened as a standalone
 *     `iframe.html?viewMode=story` tab.
 *  4. **Fullscreen → new tab.** Opens the current story standalone in a new browser tab. Hidden
 *     when already in that standalone tab (no nested Fullscreen control).
 *
 * Nesting-safe: a ResponsiveFrame rendered inside another collapses to a transparent, height-forwarding
 * pass-through so there is exactly one well.
 */

const RFContext = createContext(false);
const MAXW = { md: 768, lg: 1024, xl: 1440 };
/** Stable docs preview height (~16:9 desktop content pane). */
const PAGE_PREVIEW_HEIGHT_PX = 720;

/**
 * Resolve Storybook story id from the nearest `#story--…` ancestor.
 * @param {HTMLElement | null} node
 * @returns {string}
 */
function resolveStoryId(node) {
    const storyEl = node && node.closest('[id^="story--"]');
    if (!storyEl) return '';
    return storyEl.id.replace(/^story--/, '').replace(/-inner$/, '');
}

/**
 * True when this frame is the top-level standalone story tab
 * (`iframe.html?viewMode=story`), not an embed inside the Storybook manager.
 * @returns {boolean}
 */
function isStandaloneStoryTab() {
    if (typeof window === 'undefined') return false;
    try {
        if (window.parent !== window) return false;
        return /iframe\.html$/i.test(window.location.pathname);
    } catch {
        return false;
    }
}

/**
 * @param {{ breakpoint?: 'native' | 'md' | 'lg' | 'xl', children: React.ReactNode }} props
 */
const ResponsiveFrame = ({ breakpoint = 'native', children }) => {
    const nested = useContext(RFContext);
    const rootRef = useRef(null);
    const standalone = isStandaloneStoryTab();

    /**
     * Open the current story standalone in a new browser tab.
     * @returns {void}
     */
    const openInNewTab = useCallback(() => {
        const id = resolveStoryId(rootRef.current);
        try {
            const base = window.location.pathname.replace(/[^/]*$/, 'iframe.html');
            const url = id ? `${base}?viewMode=story&id=${id}` : window.location.href;
            window.open(url, '_blank', 'noopener');
        } catch { /* noop */ }
    }, []);

    // Nested inside another ResponsiveFrame → transparent pass-through that still forwards the full
    // height (flex column) so the inner page can resolve height:100%.
    if (nested) {
        return (
            <div style={{ width: '100%', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        );
    }

    const isNative = !breakpoint || breakpoint === 'native' || !MAXW[breakpoint];
    const minWidth = isNative ? undefined : MAXW[breakpoint];
    const heightStyle = standalone
        ? { height: '100vh', minHeight: '100vh', maxHeight: 'none' }
        : {
            height: `${PAGE_PREVIEW_HEIGHT_PX}px`,
            minHeight: `${PAGE_PREVIEW_HEIGHT_PX}px`,
            maxHeight: `${PAGE_PREVIEW_HEIGHT_PX}px`,
        };

    return (
        <RFContext.Provider value={true}>
            <div
                ref={rootRef}
                className={`responsive-frame-root${isNative ? ' responsive-frame-root--native' : ''}${standalone ? ' responsive-frame-root--standalone' : ''}`}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    ...heightStyle,
                }}
            >
                <div
                    className="responsive-frame-wrapper"
                    style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        width: '100%',
                        boxSizing: 'border-box',
                        minHeight: 0,
                        containerType: 'inline-size',
                    }}
                >
                    {!standalone ? (
                        <div
                            className="responsive-frame-open-btn"
                            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20 }}
                        >
                            <Button
                                text="Fullscreen"
                                style="secondary"
                                fill="outline"
                                size="small"
                                leadingVisual="up-right-from-square"
                                onClick={openInNewTab}
                                aria-label="Open preview full-window in a new tab"
                            />
                        </div>
                    ) : null}

                    <div
                        className="responsive-frame-inner"
                        data-plus-breakpoint={isNative ? undefined : breakpoint}
                        style={{
                            width: '100%',
                            minWidth: minWidth ? `${minWidth}px` : undefined,
                            margin: '0 auto',
                            position: 'relative',
                            transition: 'min-width 0.25s cubic-bezier(0.2,0,0.2,1)',
                            flex: '1 1 auto',
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            boxSizing: 'border-box',
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </RFContext.Provider>
    );
};

ResponsiveFrame.propTypes = {
    /**
     * Display width mode — driven by the global `plusBreakpoint` toolbar.
     * `native` fills available space; md/lg/xl enforce that breakpoint as a minimum width.
     */
    breakpoint: PropTypes.oneOf(['native', 'md', 'lg', 'xl']),
    children: PropTypes.node.isRequired,
};

export default ResponsiveFrame;
