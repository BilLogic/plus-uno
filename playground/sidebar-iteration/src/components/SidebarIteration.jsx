import React from 'react';
import PropTypes from 'prop-types';
import SidebarTab from '@/components/SidebarTab';
import Logo from '@/components/Logo';

const SidebarIteration = ({
    user = 'tutor',
    variant = 'standard', // 'standard', 'slim', 'floating'
    onHomeClick,
    onTabClick,
    activeTabId,
    visible = true,
    className = '',
    style,
}) => {
    if (!visible) return null;

    const handleTabClick = (tabName) => {
        if (onTabClick) {
            onTabClick(tabName);
        }
    };

    const categories = [
        {
            title: 'Training',
            items: [
                { text: 'Lessons', icon: 'book-open', id: 'lessons' },
                { text: 'Onboarding', icon: 'clipboard', id: 'onboarding' }
            ]
        },
        {
            title: 'Toolkit',
            items: [
                { text: 'Sessions', icon: 'calendar-alt', id: 'sessions' },
                { text: 'Reviews', icon: 'chart-bar', id: 'reviews' }
            ]
        }
    ];

    if (user === 'supervisor') {
        categories.push({
            title: 'Admin',
            items: [
                { text: 'Tutors', icon: 'chart-pie', id: 'tutors' },
                { text: 'Sessions', icon: 'calendar-week', id: 'admin-sessions' },
                { text: 'Students', icon: 'users', id: 'students' },
                { text: 'Groups', icon: 'users-rectangle', id: 'groups' },
                { text: 'Compliance', icon: 'clipboard-check', id: 'compliance-monitor' }
            ]
        });
    }

    // Variant Styles
    const isSlim = variant === 'slim';
    const isFloating = variant === 'floating';

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-surface-gap-sm)',
        width: isSlim ? '64px' : '240px',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'var(--color-surface-base)', // Default background
        transition: 'all 0.3s ease-in-out',
        ...style
    };

    if (isFloating) {
        containerStyle.margin = '16px';
        containerStyle.height = 'calc(100% - 32px)';
        containerStyle.borderRadius = '16px';
        containerStyle.boxShadow = 'var(--shadow-elevation-md)';
        containerStyle.backgroundColor = 'var(--color-surface-raised)'; // Distinct background
        // Override padding or internal spacing if needed
    }

    const logoStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--size-element-gap-md)',
        padding: isSlim ? '16px 0' : 'var(--size-element-pad-y-md) var(--size-element-pad-x-sm)',
        justifyContent: isSlim ? 'center' : 'flex-start',
        borderRadius: '4px',
        boxSizing: 'border-box'
    };

    return (
        <div className={`plus-sidebar-iteration ${className}`} style={containerStyle}>
            {/* Logo Section */}
            <div className="plus-sidebar-logo" style={logoStyle}>
                <Logo style="colored" size="XS" text={!isSlim} className="p-0" />
            </div>

            {/* Home Tab */}
            <div style={{ display: 'flex', justifyContent: isSlim ? 'center' : 'stretch', padding: isSlim ? '0 8px' : '0' }}>
                <SidebarTab
                    text={isSlim ? null : "Home"}
                    icon="house"
                    state={activeTabId === 'home' || !activeTabId ? 'selected' : 'enabled'}
                    onClick={onHomeClick}
                    style={isSlim ? { justifyContent: 'center', padding: '8px' } : {}}
                />
            </div>

            {/* Sections */}
            {categories.map((category, index) => (
                <div key={index} className="plus-sidebar-section" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-sm)'
                }}>
                    {!isSlim && (
                        <div className="plus-sidebar-section-title" style={{
                            padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md) 0 var(--size-element-pad-x-md)'
                        }}>
                            <p className="body2-txt" style={{
                                fontWeight: 'var(--font-weight-normal)',
                                margin: '0',
                                color: 'var(--color-text-subdued)' // Add color for hierarchy
                            }}>
                                {category.title}
                            </p>
                        </div>
                    )}
                    {isSlim && <div style={{ height: '8px' }} />} {/* Spacer for slim mode */}

                    {category.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: isSlim ? 'center' : 'stretch', padding: isSlim ? '0 8px' : '0' }}>
                            <SidebarTab
                                text={isSlim ? null : item.text}
                                icon={item.icon}
                                state={activeTabId === item.id ? 'selected' : 'enabled'}
                                onClick={() => handleTabClick(item.id)}
                                style={isSlim ? { justifyContent: 'center', padding: '8px' } : {}}
                            />
                        </div>
                    ))}
                </div>
            ))}

            {/* Optional Footer/Profile for Floating Variant? */}
            {isFloating && (
                <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--color-border-subdued)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-surface-neutral-subdued)' }} ></div>
                        {!isSlim && (
                            <div>
                                <p className="body2-txt" style={{ margin: 0, fontWeight: 600 }}>User Name</p>
                                <p className="caption-txt" style={{ margin: 0, color: 'var(--color-text-subdued)' }}>Role</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

SidebarIteration.propTypes = {
    user: PropTypes.oneOf(['tutor', 'supervisor']),
    variant: PropTypes.oneOf(['standard', 'slim', 'floating']),
    onHomeClick: PropTypes.func,
    onTabClick: PropTypes.func,
    activeTabId: PropTypes.string,
    visible: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default SidebarIteration;
