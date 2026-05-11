import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';


/**
 * ResponsiveFrame
 * A wrapper component that simulates different viewport widths for Storybook stories.
 * Includes an interactive toolbar to switch between breakpoints.
 *
 * Default: **no scaling** (`fitToContainer={false}`) — the frame keeps true md/lg/xl width so the
 * in-page Sidebar and hit targets match production; scroll horizontally and vertically inside the
 * gray wrapper to see the full page (MDX and browser fullscreen). Set `fitToContainer` to `true`
 * to shrink the frame with CSS scale when the container is narrower (no scroll, but imprecise clicks).
 *
 * @param {Object} props
 * @param {string} props.breakpoint - The initial breakpoint to simulate (md, lg, xl)
 * @param {boolean} [props.fitToContainer=false]
 * @param {React.ReactNode} props.children - The content to wrap
 */
const ResponsiveFrame = ({ breakpoint = 'xl', fitToContainer = false, children }) => {
    const [selectedBreakpoint, setSelectedBreakpoint] = useState(breakpoint);
    const [scale, setScale] = useState(1);
    const [contentHeight, setContentHeight] = useState(0);

    const rootRef = useRef(null);
    const wrapperRef = useRef(null);
    const innerRef = useRef(null);
    const [browserFullscreen, setBrowserFullscreen] = useState(false);

    useEffect(() => {
        setSelectedBreakpoint(breakpoint);
    }, [breakpoint]);

    const syncBrowserFullscreen = useCallback(() => {
        const root = rootRef.current;
        if (!root) {
            setBrowserFullscreen(false);
            return;
        }
        const active =
            document.fullscreenElement === root ||
            document.webkitFullscreenElement === root;
        setBrowserFullscreen(!!active);
    }, []);

    useEffect(() => {
        document.addEventListener('fullscreenchange', syncBrowserFullscreen);
        document.addEventListener('webkitfullscreenchange', syncBrowserFullscreen);
        return () => {
            document.removeEventListener('fullscreenchange', syncBrowserFullscreen);
            document.removeEventListener('webkitfullscreenchange', syncBrowserFullscreen);
        };
    }, [syncBrowserFullscreen]);

    const toggleBrowserFullscreen = useCallback(async () => {
        const node = rootRef.current;
        if (!node) return;
        try {
            const isFs =
                document.fullscreenElement === node ||
                document.webkitFullscreenElement === node;
            if (isFs) {
                if (document.exitFullscreen) await document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            } else if (node.requestFullscreen) {
                await node.requestFullscreen();
            } else if (node.webkitRequestFullscreen) {
                node.webkitRequestFullscreen();
            }
        } catch {
            /* user denied or embed policy */
        }
    }, []);

    const widthMap = {
        md: 768,
        lg: 1024,
        xl: 1440,
    };

    const width = widthMap[selectedBreakpoint] || widthMap.xl;

    const measureScale = useCallback(() => {
        if (!fitToContainer || !wrapperRef.current) {
            setScale(1);
            return;
        }
        const w = wrapperRef.current.getBoundingClientRect().width;
        if (!w || !width) {
            setScale(1);
            return;
        }
        setScale(Math.min(1, Math.max(0.05, w / width)));
    }, [fitToContainer, width]);

    const measureHeight = useCallback(() => {
        if (!innerRef.current) return;
        setContentHeight(innerRef.current.scrollHeight);
    }, []);

    useEffect(() => {
        measureScale();
    }, [measureScale, selectedBreakpoint]);

    useEffect(() => {
        if (!fitToContainer) {
            setScale(1);
            return undefined;
        }
        const el = wrapperRef.current;
        if (!el) return undefined;
        const ro = new ResizeObserver(() => {
            measureScale();
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [fitToContainer, measureScale]);

    useEffect(() => {
        const el = innerRef.current;
        if (!el) return undefined;
        const ro = new ResizeObserver(() => {
            measureHeight();
        });
        ro.observe(el);
        measureHeight();
        return () => ro.disconnect();
    }, [measureHeight, children, selectedBreakpoint, scale]);

    const baseInnerStyle = {
        width: `${width}px`,
        minWidth: `${width}px`,
        transition: 'width 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        height: 'max-content',
        minHeight: 'calc(100vh - 120px)',
        overflow: 'visible',
        position: 'relative',
        border: '1px solid var(--color-outline-variant, #e0e0e0)',
    };

    const scaledVisualHeight = contentHeight > 0 ? Math.ceil(contentHeight * scale) : undefined;
    const scaledVisualWidth = Math.ceil(width * scale);

    return (
        <div
            ref={rootRef}
            className={[
                'responsive-frame-root',
                browserFullscreen && 'responsive-frame-root--browser-fullscreen',
            ]
                .filter(Boolean)
                .join(' ')}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: browserFullscreen ? '100%' : 'auto',
                ...(browserFullscreen
                    ? {
                        height: '100%',
                        backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
                    }
                    : {}),
            }}
        >
            <div
                className="responsive-frame-toolbar"
                style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--color-outline-variant, #e0e0e0)',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                }}
            >
                <span className="label-medium" style={{ color: 'var(--color-on-surface-variant, #444746)' }}>
                    Breakpoint:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { key: 'md', label: 'MD (768px)' },
                        { key: 'lg', label: 'LG (1024px)' },
                        { key: 'xl', label: 'XL (1440px)' },
                    ].map((bp) => (
                        <button
                            key={bp.key}
                            type="button"
                            onClick={() => setSelectedBreakpoint(bp.key)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: selectedBreakpoint === bp.key
                                    ? 'var(--color-primary, #00639b)'
                                    : 'var(--color-outline, #747775)',
                                backgroundColor: selectedBreakpoint === bp.key
                                    ? 'var(--color-primary-container, #d3e3fd)'
                                    : 'transparent',
                                color: selectedBreakpoint === bp.key
                                    ? 'var(--color-on-primary-container, #001d32)'
                                    : 'var(--color-on-surface, #1f1f1f)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {bp.label}
                        </button>
                    ))}
                </div>
                {/* Next to breakpoint pills — not Storybook’s top toolbar fullscreen (that only expands the Canvas chrome). */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginLeft: '4px',
                        paddingLeft: '16px',
                        borderLeft: '1px solid var(--color-outline-variant, #e0e0e0)',
                    }}
                >
                    <button
                        type="button"
                        className="responsive-frame-fullscreen-btn"
                        onClick={() => {
                            void toggleBrowserFullscreen();
                        }}
                        aria-label={browserFullscreen ? 'Exit fullscreen' : 'Enter fullscreen preview'}
                        title={
                            browserFullscreen
                                ? 'Exit fullscreen (Esc)'
                                : 'Fullscreen this preview — fills your display, outside MDX layout'
                        }
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            minHeight: 36,
                            padding: '6px 14px',
                            borderRadius: 'var(--size-element-radius-md, 8px)',
                            border: '1px solid var(--color-primary, #00639b)',
                            backgroundColor: browserFullscreen
                                ? 'var(--color-primary, #00639b)'
                                : 'var(--color-primary-container, #d3e3fd)',
                            color: browserFullscreen
                                ? 'var(--color-on-primary, #ffffff)'
                                : 'var(--color-on-primary-container, #001d32)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            flexShrink: 0,
                        }}
                    >
                        <i
                            className={`fa-solid ${browserFullscreen ? 'fa-compress' : 'fa-expand'}`}
                            style={{ fontSize: '14px' }}
                            aria-hidden="true"
                        />
                        <span>{browserFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
                    </button>
                </div>
                {fitToContainer && scale < 0.999 && !browserFullscreen ? (
                    <span
                        className="label-medium"
                        style={{
                            color: 'var(--color-on-surface-variant, #444746)',
                            fontSize: '12px',
                            maxWidth: 260,
                            marginLeft: 'auto',
                        }}
                    >
                        Scaled to fit —{' '}
                        <strong style={{ color: 'var(--color-on-surface, #1f1f1f)' }}>
                            {Math.round(scale * 100)}%
                        </strong>{' '}
                        of design width ({width}px)
                    </span>
                ) : null}
            </div>

            <div
                ref={wrapperRef}
                className="responsive-frame-wrapper"
                style={{
                    flex: 1,
                    backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
                    display: 'flex',
                    justifyContent: fitToContainer ? 'center' : 'flex-start',
                    alignItems: 'flex-start',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    padding: '24px',
                    width: '100%',
                    boxSizing: 'border-box',
                    ...(browserFullscreen ? { flex: 1, minHeight: 0 } : {}),
                }}
            >
                {fitToContainer ? (
                    <div
                        className="responsive-frame-scale-clip"
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${scaledVisualWidth}px`,
                                height: scaledVisualHeight != null ? `${scaledVisualHeight}px` : undefined,
                                overflow: 'hidden',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                ref={innerRef}
                                className="responsive-frame-inner"
                                style={{
                                    ...baseInnerStyle,
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                }}
                            >
                                {children}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div ref={innerRef} className="responsive-frame-inner" style={baseInnerStyle}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

ResponsiveFrame.propTypes = {
    breakpoint: PropTypes.oneOf(['md', 'lg', 'xl']),
    fitToContainer: PropTypes.bool,
    children: PropTypes.node.isRequired,
};

export default ResponsiveFrame;
