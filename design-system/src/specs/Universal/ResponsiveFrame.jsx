import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button/Button';

/**
 * ResponsiveFrame — the display well for spec Pages & Sections in Storybook docs.
 *
 * Behaviour (all three are the point):
 *  1. **Responsive.** The page fills the width it is given (`width: 100%`, capped at the
 *     breakpoint's max) and reflows — it does NOT force a fixed width and scroll. Because the
 *     page gets its real available width, `PageLayout`'s own ResizeObserver picks up the
 *     breakpoint: below LG (1024) the Sidebar hides and the TopBar collapses, exactly as in
 *     production.
 *  2. **Fullscreen.** A button is always visible (top-right of the well) — hard-to-preview
 *     pages pop out to the full viewport, where they reflow to the desktop layout.
 *  3. **Breakpoint-aware.** The `breakpoint` prop (md/lg/xl) caps the max width. It is driven by
 *     the global **Breakpoint** toolbar (the `plusBreakpoint` Storybook global) — the single
 *     source of truth; this component intentionally does NOT add its own breakpoint control.
 *
 * Nesting-safe: if a ResponsiveFrame renders inside another (e.g. a story that wraps itself AND
 * the global decorator), the inner one becomes a transparent pass-through so there is exactly
 * one well + one fullscreen button.
 */

const RFContext = createContext(false);
const MAXW = { md: 768, lg: 1024, xl: 1440 };

const ResponsiveFrame = ({ breakpoint = 'xl', children }) => {
    const nested = useContext(RFContext);
    const rootRef = useRef(null);
    // `fullscreen` = the frame is expanded. Native Fullscreen API fills the whole screen when the
    // host allows it; otherwise a CSS position:fixed overlay fills the iframe viewport so the
    // button ALWAYS enlarges the preview.
    const [fullscreen, setFullscreen] = useState(false);

    // Keep state in sync when the user exits native fullscreen via Esc.
    useEffect(() => {
        const onChange = () => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (!fsEl) setFullscreen(false);
        };
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
        };
    }, []);

    const toggleFullscreen = useCallback(async () => {
        const node = rootRef.current;
        if (!node) return;
        const nativeEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (fullscreen || nativeEl) {
            setFullscreen(false);
            try {
                if (nativeEl && document.exitFullscreen) await document.exitFullscreen();
                else if (nativeEl && document.webkitExitFullscreen) document.webkitExitFullscreen();
            } catch { /* noop */ }
            return;
        }
        // Expand immediately (CSS overlay is the guaranteed floor) …
        setFullscreen(true);
        // … and try native fullscreen on top for a true whole-screen view where permitted.
        try {
            if (node.requestFullscreen) await node.requestFullscreen();
            else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen();
        } catch { /* host blocks fullscreen — CSS overlay already applied */ }
    }, [fullscreen]);

    // Nested inside another ResponsiveFrame → transparent pass-through (single well wins).
    if (nested) {
        return <div style={{ width: '100%' }}>{children}</div>;
    }

    const maxWidth = MAXW[breakpoint] || MAXW.xl;

    const innerStyle = {
        width: '100%',
        maxWidth: `${maxWidth}px`,
        margin: '0 auto',
        backgroundColor: 'var(--color-surface, #ffffff)',
        position: 'relative',
        transition: 'max-width 0.25s cubic-bezier(0.2,0,0.2,1)',
        // Always a flex child that fills the column, so a page with height:100% (PageLayout)
        // resolves against a definite height instead of collapsing to its content. This is what
        // makes pages fill the preview in the normal well AND in fullscreen — no per-story height.
        flex: '1 1 auto',
        minHeight: 0,
    };

    return (
        <RFContext.Provider value={true}>
            <div
                ref={rootRef}
                className={['responsive-frame-root', fullscreen && 'responsive-frame-root--fullscreen'].filter(Boolean).join(' ')}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    // Definite height (not just min-height) so the flex chain below hands pages a
                    // resolvable height — 100vh fills the preview viewport in the normal well; the
                    // fullscreen branch uses position:fixed/inset:0 + height:100%.
                    height: fullscreen ? '100%' : '100vh',
                    minHeight: fullscreen ? '100%' : '100vh',
                    ...(fullscreen
                        ? {
                            // CSS overlay floor — fills the viewport even where native fullscreen is blocked.
                            position: 'fixed', inset: 0, zIndex: 2147483000,
                            height: '100%',
                            backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
                        }
                        : {}),
                }}
            >
                {/* Fullscreen-only bar: shows the active breakpoint (set from the global toolbar) + Exit.
                    The breakpoint itself is NOT changed here — that stays the one global control. */}
                {fullscreen && (
                    <div
                        className="responsive-frame-toolbar"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md, 16px)', flexWrap: 'wrap',
                            padding: 'var(--size-element-pad-y-md, 12px) var(--size-surface-pad-x, 24px)',
                            borderBottom: '1px solid var(--color-outline-variant)',
                            backgroundColor: 'var(--color-surface)',
                            position: 'sticky', top: 0, zIndex: 1000,
                        }}
                    >
                        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Breakpoint: <strong style={{ color: 'var(--color-on-surface)' }}>{breakpoint.toUpperCase()} ({maxWidth}px)</strong>
                            <span style={{ marginLeft: 8, opacity: 0.75 }}>— change it from the Breakpoint toolbar</span>
                        </span>
                        <div style={{ marginLeft: 'auto' }}>
                            <Button
                                text="Exit fullscreen"
                                style="primary"
                                fill="filled"
                                size="small"
                                leadingVisual="compress"
                                onClick={() => void toggleFullscreen()}
                            />
                        </div>
                    </div>
                )}

                <div
                    className="responsive-frame-wrapper"
                    style={{
                        flex: 1, position: 'relative',
                        // The display well: filled + bordered on the lowest layer so the page is
                        // distinguishable from the docs prose; the inner page frame stays clean.
                        backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
                        border: fullscreen ? 'none' : '1px solid var(--color-outline-variant, #e0e0e0)',
                        borderRadius: fullscreen ? 0 : 'var(--size-card-radius-sm, 12px)',
                        // Flex column in both modes so the inner can flex:1 and hand a page a definite
                        // full height. The inner still uses width:100% + margin:auto to center up to
                        // its max width (auto side margins win over align-items in the cross axis).
                        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                        overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                        padding: fullscreen ? '24px' : 'clamp(1rem, 3vw, 2rem)',
                        width: '100%', boxSizing: 'border-box', minHeight: 0,
                        containerType: 'inline-size',
                    }}
                >
                    {/* Floating fullscreen affordance — ALWAYS available (not in fullscreen, where the bar has Exit). */}
                    {!fullscreen && (
                        <div
                            className="responsive-frame-fullscreen-btn"
                            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20 }}
                        >
                            <Button
                                text="Fullscreen"
                                style="secondary"
                                fill="outline"
                                size="small"
                                leadingVisual="expand"
                                onClick={() => void toggleFullscreen()}
                                aria-label="Open preview in fullscreen"
                            />
                        </div>
                    )}

                    <div className="responsive-frame-inner" style={innerStyle}>
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
