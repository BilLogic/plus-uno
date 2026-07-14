import React, { useRef, useCallback, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button/Button';

/**
 * ResponsiveFrame — the display well for spec Pages & Sections in Storybook docs.
 *
 * Behaviour:
 *  1. **Chrome-less.** The well has no background, border, radius or padding of its own — the page
 *     (PageLayout) provides its own surface, so there is exactly ONE frame, not a page-on-a-panel.
 *  2. **Breakpoint = a fixed display width.** The `breakpoint` prop (md/lg/xl, driven by the global
 *     Breakpoint toolbar) sets a definite inner width. When that width exceeds the space available,
 *     the well scrolls HORIZONTALLY (the docs page never does) — so MD/LG/XL actually simulate that
 *     viewport instead of the page just filling whatever space it's given.
 *  3. **Fills height.** The root/well/inner form a definite-height flex column so a page with
 *     `height: 100%` (PageLayout) resolves against a real height and fills the preview.
 *  4. **Fullscreen → new tab.** The affordance opens the current story standalone (viewMode=story)
 *     in a new browser tab — a real full-window preview — instead of an in-place overlay.
 *
 * Nesting-safe: a ResponsiveFrame rendered inside another collapses to a transparent, height-forwarding
 * pass-through so there is exactly one well.
 */

const RFContext = createContext(false);
const MAXW = { md: 768, lg: 1024, xl: 1440 };

const ResponsiveFrame = ({ breakpoint = 'xl', children }) => {
    const nested = useContext(RFContext);
    const rootRef = useRef(null);

    // Open the current story standalone in a new tab. The story id is read from the enclosing
    // Storybook story root (`#story--<id>` / `#story--<id>-inner`), so this works for the hidden
    // (`!dev`) spec stories too.
    const openInNewTab = useCallback(() => {
        const node = rootRef.current;
        let id = '';
        const storyEl = node && node.closest('[id^="story--"]');
        if (storyEl) id = storyEl.id.replace(/^story--/, '').replace(/-inner$/, '');
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

    const maxWidth = MAXW[breakpoint] || MAXW.xl;

    return (
        <RFContext.Provider value={true}>
            <div
                ref={rootRef}
                className="responsive-frame-root"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    // Definite height so the flex chain hands pages a resolvable height.
                    height: '100vh',
                    minHeight: '100vh',
                }}
            >
                <div
                    className="responsive-frame-wrapper"
                    style={{
                        flex: 1,
                        position: 'relative',
                        // No background / border / radius / padding: the page is the only frame.
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
                    {/* Open the page full-window in a new tab. */}
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

                    <div
                        className="responsive-frame-inner"
                        style={{
                            width: `${maxWidth}px`,
                            margin: '0 auto',
                            position: 'relative',
                            transition: 'width 0.25s cubic-bezier(0.2,0,0.2,1)',
                            // Fill the column height AND be a flex column so the page inside fills too.
                            flex: '1 1 auto',
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
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
    /** Max width to cap at — driven by the global `plusBreakpoint` toolbar. */
    breakpoint: PropTypes.oneOf(['md', 'lg', 'xl']),
    children: PropTypes.node.isRequired,
};

export default ResponsiveFrame;
