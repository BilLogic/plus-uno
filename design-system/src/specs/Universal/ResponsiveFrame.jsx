import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

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
 *  3. **Breakpoint-aware.** `breakpoint` (md/lg/xl) caps the max width so a specific breakpoint
 *     can be simulated; the global "Breakpoint" toolbar does the same for every Specs story.
 *
 * Nesting-safe: if a ResponsiveFrame renders inside another (e.g. a story that wraps itself AND
 * the global decorator), the inner one becomes a transparent pass-through so there is exactly
 * one well + one fullscreen button.
 */

const RFContext = createContext(false);
const MAXW = { md: 768, lg: 1024, xl: 1440 };

const ResponsiveFrame = ({ breakpoint = 'xl', showToolbar = false, children }) => {
    const nested = useContext(RFContext);
    const [selectedBreakpoint, setSelectedBreakpoint] = useState(breakpoint);
    const rootRef = useRef(null);
    // `fullscreen` = the frame is expanded. Native Fullscreen API fills the whole screen when the
    // host allows it; otherwise a CSS position:fixed overlay fills the iframe viewport so the
    // button ALWAYS enlarges the preview.
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => { setSelectedBreakpoint(breakpoint); }, [breakpoint]);

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

    const maxWidth = MAXW[selectedBreakpoint] || MAXW.xl;

    const innerStyle = {
        width: '100%',
        maxWidth: `${maxWidth}px`,
        margin: '0 auto',
        backgroundColor: 'var(--color-surface, #ffffff)',
        minHeight: fullscreen ? '100%' : 'calc(100vh - 220px)',
        position: 'relative',
        transition: 'max-width 0.25s cubic-bezier(0.2,0,0.2,1)',
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
                    minHeight: fullscreen ? '100%' : 'auto',
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
                {/* Fullscreen-only toolbar: breakpoint pills + exit (Controls aren't reachable in fullscreen). */}
                {(showToolbar || fullscreen) && (
                    <div
                        className="responsive-frame-toolbar"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                            padding: '12px 24px',
                            borderBottom: '1px solid var(--color-outline-variant, #e0e0e0)',
                            backgroundColor: 'var(--color-surface, #ffffff)',
                            position: 'sticky', top: 0, zIndex: 1000,
                        }}
                    >
                        <span className="label-medium" style={{ color: 'var(--color-on-surface-variant, #444746)' }}>Breakpoint:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[{ k: 'md', l: 'MD (768)' }, { k: 'lg', l: 'LG (1024)' }, { k: 'xl', l: 'XL (1440)' }].map((bp) => (
                                <button
                                    key={bp.k} type="button" onClick={() => setSelectedBreakpoint(bp.k)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '4px', border: '1px solid',
                                        borderColor: selectedBreakpoint === bp.k ? 'var(--color-primary, #00639b)' : 'var(--color-outline, #747775)',
                                        backgroundColor: selectedBreakpoint === bp.k ? 'var(--color-primary-container, #d3e3fd)' : 'transparent',
                                        color: selectedBreakpoint === bp.k ? 'var(--color-on-primary-container, #001d32)' : 'var(--color-on-surface, #1f1f1f)',
                                        cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                                    }}
                                >{bp.l}</button>
                            ))}
                        </div>
                        <button
                            type="button" onClick={() => void toggleFullscreen()}
                            style={{
                                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: 36,
                                padding: '6px 14px', borderRadius: 'var(--size-element-radius-md, 8px)',
                                border: '1px solid var(--color-primary, #00639b)', backgroundColor: 'var(--color-primary, #00639b)',
                                color: 'var(--color-on-primary, #ffffff)', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            }}
                        >
                            <i className="fa-solid fa-compress" aria-hidden="true" /> Exit fullscreen
                        </button>
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
                        // Block layout (not flex): the inner uses width:100% + margin:auto to fill and
                        // center up to its max — a flex item would shrink to min-content instead.
                        display: 'block',
                        overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                        padding: fullscreen ? '24px' : 'clamp(1rem, 3vw, 2rem)',
                        width: '100%', boxSizing: 'border-box',
                        containerType: 'inline-size',
                        ...(fullscreen ? { minHeight: 0 } : {}),
                    }}
                >
                    {/* Floating fullscreen affordance — ALWAYS available (not in fullscreen, where the toolbar has Exit). */}
                    {!fullscreen && (
                        <button
                            type="button"
                            className="responsive-frame-fullscreen-btn"
                            onClick={() => void toggleFullscreen()}
                            aria-label="Open preview in fullscreen"
                            title="Open this page in fullscreen"
                            style={{
                                position: 'absolute', top: '10px', right: '10px', zIndex: 20,
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '6px 10px', borderRadius: 'var(--size-element-radius-md, 8px)',
                                border: '1px solid var(--color-outline-variant, #e0e0e0)',
                                backgroundColor: 'var(--color-surface, #ffffff)',
                                color: 'var(--color-on-surface, #1f1f1f)',
                                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            }}
                        >
                            <i className="fa-solid fa-expand" aria-hidden="true" />
                            <span>Fullscreen</span>
                        </button>
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
    breakpoint: PropTypes.oneOf(['md', 'lg', 'xl']),
    showToolbar: PropTypes.bool,
    /** Kept for back-compat; scaling was removed in favour of true responsive reflow. */
    fitToContainer: PropTypes.bool,
    children: PropTypes.node.isRequired,
};

export default ResponsiveFrame;
