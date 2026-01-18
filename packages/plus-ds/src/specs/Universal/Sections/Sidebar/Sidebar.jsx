/**
 * Sidebar Component
 * 
 * Navigation sidebar with tutor and supervisor variants.
 * Figma Spec: node-id=111-227891
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SidebarTab } from '../../Elements';
import Logo from '../../../../assets/Logo/Logo';

const Sidebar = ({
    user = 'tutor',
    activeTab = 'home',
    onHomeClick,
    onTabClick,
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
                { text: 'Slack', icon: 'arrow-up-right-from-square', id: 'slack' }
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

    return (
        <div
            className={`plus-sidebar ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-surface-gap-sm)',
                width: 'fit-content',
                height: '100%',
                boxSizing: 'border-box',
                ...style
            }}
        >
            {/* Logo Section - per Figma: pad-x-sm (8px), pad-y-md (6px) */}
            <div className="plus-sidebar-logo" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-md)',
                padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-sm)',
                borderRadius: '4px',
                boxSizing: 'border-box'
            }}>
                <Logo style="colored" size="XS" text={true} className="p-0" />
            </div>

            {/* Home Tab */}
            <SidebarTab
                text="Home"
                icon="house"
                state={activeTab === 'home' ? 'selected' : 'enabled'}
                onClick={onHomeClick}
            />

            {/* Sections */}
            {categories.map((category, index) => (
                <div key={index} className="plus-sidebar-section" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-sm)'
                }}>
                    <div className="plus-sidebar-section-title" style={{
                        padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md) 0 var(--size-element-pad-x-md)'
                    }}>
                        <p className="body2-txt" style={{
                            fontWeight: 'var(--font-weight-normal)',
                            margin: '0'
                        }}>
                            {category.title}
                        </p>
                    </div>
                    {category.items.map((item) => (
                        <SidebarTab
                            key={item.id}
                            text={item.text}
                            icon={item.icon}
                            state={activeTab === item.id ? 'selected' : 'enabled'}
                            onClick={() => handleTabClick(item.id)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

Sidebar.propTypes = {
    user: PropTypes.oneOf(['tutor', 'supervisor']),
    activeTab: PropTypes.string,
    onHomeClick: PropTypes.func,
    onTabClick: PropTypes.func,
    visible: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Sidebar;
