/**
 * PageLayout Component
 * 
 * App Outer Layout per Figma specs.
 * Figma Specs: 112-597 (Collapsed), 112-596 (Expanded)
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TopBar, Sidebar } from '../../Sections';

/** Shared motion: sidebar + content grow/shrink in sync (Material-style decelerate, 280ms). */
const SIDEBAR_TRANSITION = 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
const CONTENT_TRANSITION = 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), flex-basis 0.28s cubic-bezier(0.4, 0, 0.2, 1)';

/** TopBar skeleton: left (toggle), center (breadcrumb), right (avatar). Same layout as TopBar for no CLS. */
const TOPBAR_LEFT_COLLAPSED_WIDTH = 52;
const TOPBAR_LEFT_EXPANDED_WIDTH = 184;

const PageLayout = ({
    children,
    sidebarConfig = {},
    topBarConfig = {},
    footerConfig = {},
    id,
    className = '',
    style,
    mainClassName = '',
    floatingContent,
    /** When true, render children directly in content-wrapper without main (e.g. full-width chat). */
    contentDirect = false,
    /** When true, show TopBar skeleton + Sidebar loading (shimmer). */
    shellLoading = false,
    /** When true, apply shell-reveal has-entered for entrance animation (TopBar + Sidebar). */
    shellEntered = false,
    /** When true, keep sidebar hidden regardless of viewport size/toggle state. */
    sidebarHidden = false,
    /** When true, force sidebar expanded (e.g. for Storybook/demos). Overrides breakpoint. */
    sidebarExpanded = false,
}) => {
    const [isSidebarVisible, setIsSidebarVisible] = useState(() => (sidebarExpanded || !sidebarHidden));
    const containerRef = React.useRef(null);
    const breakpoint = 1024; // lg-min breakpoint per DS schema

    const showSidebar = !sidebarHidden && isSidebarVisible;

    useEffect(() => {
        if (sidebarHidden) {
            setIsSidebarVisible(false);
            return undefined;
        }
        if (sidebarExpanded) return undefined;
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                setIsSidebarVisible(width >= breakpoint);
            }
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [sidebarHidden, sidebarExpanded]);

    const handleSidebarToggle = (newMode) => {
        if (sidebarHidden) return;
        setIsSidebarVisible(newMode === 'expanded');
    };

    return (
        <div
            id={id}
            ref={containerRef}
            className={`plus-page-layout ${className}`}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--color-surface-container)',
                overflow: 'hidden',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: '8px',
                boxSizing: 'border-box',
                padding: 'var(--size-element-pad-y-lg, 12px) var(--size-element-pad-x-md, 16px)',
                gap: 'var(--size-element-gap-md, 16px)',
                alignItems: 'flex-start',
                ...style
            }}
        >
            {/* TopBar: skeleton when shellLoading, real TopBar when not; shell-reveal has-entered for entrance */}
            {shellLoading ? (
                <div
                    className="plus-topbar-skeleton"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        height: 52,
                        flexShrink: 0,
                        gap: 'var(--size-element-gap-md, 16px)',
                        padding: '0 var(--size-element-pad-x-md, 16px)',
                        boxSizing: 'border-box',
                    }}
                    aria-hidden="true"
                >
                    <div className="plus-skeleton-block" style={{ width: TOPBAR_LEFT_EXPANDED_WIDTH, height: 40, flexShrink: 0, borderRadius: 8 }} />
                    <div className="plus-skeleton-block" style={{ flex: 1, minWidth: 0, height: 24, maxWidth: 320, borderRadius: 6 }} />
                    <div className="plus-skeleton-block" style={{ width: 60, height: 40, flexShrink: 0, borderRadius: '50%' }} />
                </div>
            ) : (
                <div className={`shell-reveal${shellEntered ? ' has-entered' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
                    <TopBar
                        mode={showSidebar ? 'expanded' : 'collapsed'}
                        onToggle={handleSidebarToggle}
                        breadcrumbs={topBarConfig.breadcrumbs}
                        user={topBarConfig.user}
                    />
                </div>
            )}

            {/* Main Container – flex so sidebar width animation drives content growth smoothly; gap only when sidebar visible to avoid misalignment when collapsed */}
            <div className="plus-page-main-container" style={{
                display: 'flex',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                gap: showSidebar ? 'var(--size-element-gap-md, 16px)' : 0,
                transition: 'gap 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                alignItems: 'stretch',
            }}>
                {/* Sidebar Wrapper – stays in flow; width 184↔0 so content area grows/shrinks with same timing; shell-reveal for entrance */}
                <div
                    className={`plus-page-sidebar-wrapper${!shellLoading ? ' shell-reveal' : ''}${!shellLoading && shellEntered ? ' has-entered' : ''}`}
                    style={{
                        position: 'relative',
                        flexShrink: 0,
                        height: '100%',
                        overflow: 'hidden',
                        borderRight: 'none',
                        backgroundColor: 'var(--color-surface-container)',
                        transition: SIDEBAR_TRANSITION,
                        zIndex: 100,
                        width: showSidebar ? 184 : 0,
                        minWidth: showSidebar ? 184 : 0,
                        pointerEvents: showSidebar ? 'auto' : 'none',
                    }}
                >
                    <div style={{ width: 184, minWidth: 184, height: '100%', overflowY: 'auto' }}>
                        <Sidebar
                            {...sidebarConfig}
                            visible={true}
                            loading={shellLoading}
                        />
                    </div>
                </div>

                {/* Content Wrapper – transitions width/flex-basis in sync with sidebar for smooth grow/shrink */}
                <div className="plus-page-content-wrapper" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 'var(--size-surface-pad-y, 24px) var(--size-surface-pad-x, 32px)',
                    gap: 'var(--size-surface-gap-md, 24px)',
                    flex: '1 0 0',
                    alignItems: 'stretch',
                    minWidth: 0,
                    minHeight: 0,
                    height: '100%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-surface, #f9f9fc)',
                    borderRadius: 'var(--size-surface-radius, 16px)',
                    transition: CONTENT_TRANSITION,
                }}>
                    {contentDirect ? (
                        children
                    ) : (
                        <main
                            className={['plus-page-main', mainClassName].filter(Boolean).join(' ')}
                            style={{
                                flex: 1,
                                minHeight: 0,
                                padding: 0,
                                width: '100%',
                                height: '100%',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'auto',
                                position: 'relative'
                            }}
                        >
                            {children}
                        </main>
                    )}
                </div>
            </div>

            {/* Floating content anchored to page frame (e.g. FAB): 48px right, 36px bottom */}
            {floatingContent && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 36,
                        right: 48,
                        zIndex: 1200,
                        pointerEvents: 'auto',
                    }}
                >
                    {floatingContent}
                </div>
            )}
        </div>
    );
};

PageLayout.propTypes = {
    children: PropTypes.node,
    sidebarConfig: PropTypes.object,
    topBarConfig: PropTypes.object,
    footerConfig: PropTypes.object,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    mainClassName: PropTypes.string,
    floatingContent: PropTypes.node,
    contentDirect: PropTypes.bool,
    shellLoading: PropTypes.bool,
    shellEntered: PropTypes.bool,
    sidebarHidden: PropTypes.bool,
    sidebarExpanded: PropTypes.bool,
};

export default PageLayout;
