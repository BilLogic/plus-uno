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

/** Skeleton placeholder heights to match logo and nav items. */
const SKELETON_LOGO_HEIGHT = 36;
const SKELETON_NAV_ITEM_HEIGHT = 36;
const SKELETON_SECTION_TITLE_HEIGHT = 16;

const Sidebar = ({
    user = 'tutor',
    activeTab = 'home',
    onHomeClick,
    onTabClick,
    visible = true,
    loading = false,
    className = '',
    style,
}) => {
    if (!visible) return null;

    if (loading) {
        return (
            <div
                className={`plus-sidebar plus-sidebar--loading ${className}`}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-surface-gap-sm)',
                    width: 184,
                    height: '100%',
                    boxSizing: 'border-box',
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-sm)',
                    ...style,
                }}
            >
                <div
                    className="plus-skeleton-block"
                    style={{
                        height: SKELETON_LOGO_HEIGHT,
                        width: '100%',
                        flexShrink: 0,
                    }}
                />
                <div
                    className="plus-skeleton-block"
                    style={{
                        height: SKELETON_NAV_ITEM_HEIGHT,
                        width: '100%',
                        flexShrink: 0,
                    }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <div
                        className="plus-skeleton-block"
                        style={{
                            height: SKELETON_SECTION_TITLE_HEIGHT,
                            width: '60%',
                            flexShrink: 0,
                        }}
                    />
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="plus-skeleton-block"
                            style={{
                                height: SKELETON_NAV_ITEM_HEIGHT,
                                width: '100%',
                                flexShrink: 0,
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <div
                        className="plus-skeleton-block"
                        style={{
                            height: SKELETON_SECTION_TITLE_HEIGHT,
                            width: '50%',
                            flexShrink: 0,
                        }}
                    />
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="plus-skeleton-block"
                            style={{
                                height: SKELETON_NAV_ITEM_HEIGHT,
                                width: '100%',
                                flexShrink: 0,
                            }}
                        />
                    ))}
                </div>
                {user === 'supervisor' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                        <div
                            className="plus-skeleton-block"
                            style={{
                                height: SKELETON_SECTION_TITLE_HEIGHT,
                                width: '40%',
                                flexShrink: 0,
                            }}
                        />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="plus-skeleton-block"
                                style={{
                                    height: SKELETON_NAV_ITEM_HEIGHT,
                                    width: '100%',
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const handleTabClick = (tabName) => {
        if (onTabClick) {
            onTabClick(tabName);
        }

        // Optional Storybook navigation wiring for specs
        // When rendered inside Storybook, clicking Admin items should jump to the matching Admin spec.
        try {
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                const parentLocation = window.parent.location;
                // Heuristic: only run inside Storybook iframe (hash-based story routing)
                if (parentLocation && /(?:localhost:6006|storybook)/i.test(parentLocation.href || '')) {
                    const storyIdMap = {
                        // Admin → Tutors (Tutor Performance page, Interactive story)
                        tutors: 'specs-admin-tutor-admin-pages-tutorperformancepage--interactive',
                        // Admin → Sessions
                        'admin-sessions': 'specs-admin-session-admin-pages-sessionadminpage--interactive',
                        // Admin → Students
                        students: 'specs-admin-student-admin-pages-studentadminpage--interactive',
                        // Admin → Groups
                        groups: 'specs-admin-group-admin-pages-groupinfopage--interactive',
                    };

                    const storyId = storyIdMap[tabName];
                    if (storyId) {
                        parentLocation.hash = `/story/${storyId}`;
                    }
                }
            }
        } catch {
            // Fail silently if Storybook navigation is not available or cross-origin
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
                { text: 'Reports', icon: 'chart-bar', id: 'weekly-report' }
                // Slack hidden globally
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
                { text: 'Groups', icon: 'users-rectangle', id: 'groups' }
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
                className="plus-sidebar-home-tab"
            />

            {/* Sections */}
            {categories.map((category, index) => (
                <div key={index} className={`plus-sidebar-section plus-sidebar-section-${category.title.toLowerCase().replace(/\s+/g, '-')}`} style={{
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
    /** When true, show skeleton/shimmer placeholder instead of nav (uses .plus-skeleton-block). */
    loading: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Sidebar;
