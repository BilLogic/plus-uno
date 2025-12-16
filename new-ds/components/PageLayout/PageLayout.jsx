import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar/Sidebar';

const PageLayout = ({
    children,
    sidebarConfig = {},
    topBarConfig = {},
    footerConfig = {}, // Unused for now but kept for API compatibility
    id,
    className = '',
    style,
}) => {
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const breakpoint = 992; // lg breakpoint

    useEffect(() => {
        const handleResize = () => {
            setIsSidebarVisible(window.innerWidth >= breakpoint);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    return (
        <div
            id={id}
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
                padding: 'var(--Surface-Container-pad-y-sm, 12px) var(--Surface-Container-pad-x-sm, 16px)',
                gap: 'var(--Surface-Container-gap-sm, 16px)',
                alignItems: 'flex-start',
                ...style
            }}
        >
            {/* TopBar Wrapper */}
            <div className="plus-page-topbar-wrapper" style={{
                width: '100%',
                flexShrink: 0,
                zIndex: 110,
                position: 'relative',
                borderBottom: 'none'
            }}>
                <Navbar
                    {...topBarConfig}
                // Pass toggle functionality to Navbar if it supports it via specific prop or custom component
                // Assuming Navbar expects 'components' or we need to inject the toggler.
                // For now, simpler implementation:
                />
            </div>

            {/* Main Container */}
            <div className="plus-page-main-container" style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                gap: 'var(--Surface-Container-gap-sm, 16px)',
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
                    padding: 'var(--Surface-pad-y, 24px) var(--Surface-pad-x, 32px)',
                    gap: 'var(--Surface-gap-md, 24px)',
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
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default PageLayout;
