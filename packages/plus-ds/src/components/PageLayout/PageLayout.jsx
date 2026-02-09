import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TopBar } from '@/specs/Universal/Sections';
import Sidebar from '../Sidebar/Sidebar';

/**
 * Page layout with TopBar (sidebar toggle + breadcrumbs + user avatar), sidebar, and main content.
 * Uses the original page layout TopBar from specs/Universal/Sections.
 * @see specs/Universal/Pages/PageLayout/PageLayout.jsx
 */

/**
 * Maps legacy topBarConfig (brand/items) to TopBar shape (breadcrumbs/user) for backward compatibility.
 * @param {Object} topBarConfig - topBarConfig from props (may have breadcrumbs/user or brand/items)
 * @returns {{ breadcrumbs: Array<{text: string, href?: string}>, user: Object|null }}
 */
function normalizeTopBarConfig(topBarConfig) {
    if (!topBarConfig) return { breadcrumbs: [{ text: 'Home', href: '#' }], user: null };
    // Prefer TopBar shape (breadcrumbs, user); fallback to legacy (brand, items)
    const breadcrumbs = topBarConfig.breadcrumbs ?? (topBarConfig.brand
        ? [{ text: topBarConfig.brand, href: '#' }]
        : [{ text: 'Home', href: '#' }]);
    const items = topBarConfig.items ?? [];
    const roleToType = (role) => {
        if (!role) return 'lead tutor';
        const r = role.toLowerCase();
        if (r.includes('admin')) return 'admin';
        if (r.includes('lead')) return 'lead tutor';
        return 'regular tutor';
    };
    const user = Object.prototype.hasOwnProperty.call(topBarConfig, 'user')
        ? topBarConfig.user
        : (items.length > 0
            ? { name: items[0].text || 'User', type: roleToType(items[1]?.text) }
            : null);
    return { breadcrumbs, user };
}

/**
 * PageLayout component: TopBar (original page layout) + Sidebar + main content.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main content
 * @param {Object} [props.sidebarConfig] - Sidebar configuration
 * @param {Object} [props.topBarConfig] - TopBar config: { breadcrumbs, user } or legacy { brand, items }
 * @param {Object} [props.footerConfig] - Reserved for API compatibility
 * @param {string} [props.id] - Root element id
 * @param {string} [props.className] - Root element class
 * @param {Object} [props.style] - Root element style
 * @returns {JSX.Element}
 */
const PageLayout = ({
    children,
    sidebarConfig = {},
    topBarConfig = {},
    footerConfig = {}, // Unused for now but kept for API compatibility
    shellEntered = false,
    id,
    className = '',
    style,
}) => {
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const containerRef = React.useRef(null);
    const breakpoint = 1024; // lg-min breakpoint per DS schema

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                // Auto-collapse if smaller than Large breakpoint
                // Auto-expand if larger (unless user manually toggled? - keeping simple for now)
                setIsSidebarVisible(width >= breakpoint);
            }
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const handleSidebarToggle = (newMode) => {
        setIsSidebarVisible(newMode === 'expanded');
    };

    const { breadcrumbs, user } = normalizeTopBarConfig(topBarConfig);

    return (
        <div
            id={id}
            ref={containerRef}
            className={`plus-page-layout ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: 'unset',
                overflow: 'hidden',
                border: 'none',
                borderWidth: 0,
                boxSizing: 'border-box',
                padding: 'var(--size-element-pad-y-lg, 12px) var(--size-element-pad-x-md, 16px)', // Using element tokens for 12px/16px
                gap: 'var(--size-element-gap-md, 16px)', // 16px
                alignItems: 'flex-start',
                ...style
            }}
        >
            {/* TopBar (original page layout: sidebar toggle + breadcrumbs + user avatar) */}
            <div className="plus-page-topbar-wrapper" style={{
                width: '100%',
                flexShrink: 0,
                zIndex: 110,
                position: 'relative',
                borderBottom: 'none'
            }}>
                <div className={`shell-reveal${shellEntered ? ' has-entered' : ''}`}>
                    <TopBar
                        mode={isSidebarVisible ? 'expanded' : 'collapsed'}
                        onToggle={handleSidebarToggle}
                        breadcrumbs={breadcrumbs}
                        user={user}
                    />
                </div>
            </div>

            {/* Main Container */}
            <div className="plus-page-main-container" style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                gap: 'var(--size-element-gap-md, 16px)',
                alignItems: 'stretch'
            }}>
                {/* Sidebar Wrapper */}
                <div
                    className={`plus-page-sidebar-wrapper shell-reveal${shellEntered ? ' has-entered' : ''}`}
                    style={{
                        display: isSidebarVisible ? 'block' : 'none',
                        flexShrink: 0,
                        height: '100%',
                        overflowY: 'auto',
                        borderRight: 'none',
                        backgroundColor: 'var(--color-surface-container)',
                        transition: 'transform 0.3s ease, width 0.3s ease',
                        zIndex: 100,
                        width: 'fit-content'
                    }}
                >
                    <Sidebar
                        {...sidebarConfig}
                        visible={true}
                    />
                </div>

                {/* Content Wrapper – tokens per Figma 367-146235 (surface pad/gap) */}
                <div className="plus-page-content-wrapper" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 'var(--size-surface-pad-y, 24px) var(--size-surface-pad-x, 32px)',
                    gap: 'var(--size-surface-gap-md, 24px)',
                    flex: '1 0 0',
                    alignItems: 'flex-start',
                    minWidth: 0,
                    height: '100%',
                    overflowY: 'auto',
                    backgroundColor: 'var(--color-surface, #f9f9fc)',
                    borderRadius: 'var(--size-surface-radius, 16px)'
                }}>
                    <main className="plus-page-main" style={{
                        flex: 1,
                        padding: 0,
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        {children}
                    </main>
                    {/* Footer could go here */}
                </div>
            </div>
        </div>
    );
};

PageLayout.propTypes = {
    children: PropTypes.node,
    sidebarConfig: PropTypes.object,
    topBarConfig: PropTypes.object,
    footerConfig: PropTypes.object,
    shellEntered: PropTypes.bool,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default PageLayout;
