/**
 * PageLayout Component
 * 
 * App Outer Layout per Figma specs.
 * Figma Specs: 112-597 (Collapsed), 112-596 (Expanded)
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TopBar, Sidebar } from '../../Sections';

const PageLayout = ({
    children,
    sidebarConfig = {},
    topBarConfig = {},
    footerConfig = {},
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
                setIsSidebarVisible(width >= breakpoint);
            }
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const handleSidebarToggle = (newMode) => {
        setIsSidebarVisible(newMode === 'expanded');
    };

    return (
        <div
            id={id}
            ref={containerRef}
            className={`plus-page-layout ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100vh',
                backgroundColor: 'var(--color-surface-container)',
                overflow: 'hidden',
                border: '1px solid var(--color-outline-variant)',
                boxSizing: 'border-box',
                padding: 'var(--size-element-pad-y-lg, 12px) var(--size-element-pad-x-md, 16px)',
                gap: 'var(--size-element-gap-md, 16px)',
                alignItems: 'flex-start',
                ...style
            }}
        >
            {/* TopBar */}
            <TopBar
                mode={isSidebarVisible ? 'expanded' : 'collapsed'}
                onToggle={handleSidebarToggle}
                breadcrumbs={topBarConfig.breadcrumbs}
                user={topBarConfig.user}
            />

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
                    className="plus-page-sidebar-wrapper"
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

                {/* Content Wrapper */}
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
                    backgroundColor: 'var(--color-surface)',
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
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default PageLayout;
