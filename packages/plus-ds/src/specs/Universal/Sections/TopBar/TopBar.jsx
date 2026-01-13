/**
 * TopBar Component
 * 
 * Top navigation bar with sidebar control, breadcrumbs, and user avatar.
 * Figma Spec: node-id=111-227860, 111-227866
 */

import React from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '../../../../components/Breadcrumb';
import { UserAvatar } from '../../Elements';
import Button from '../../../../components/Button';
import './TopBar.scss';

const TopBar = ({
    mode = 'expanded',
    onToggle,
    breadcrumbs = [{ text: 'Home', href: '#' }, { text: 'Page' }],
    user = null,
    className = '',
    style,
    ...props
}) => {
    const handleToggle = () => {
        if (onToggle) {
            onToggle(mode === 'expanded' ? 'collapsed' : 'expanded');
        }
    };

    // Calculate sidebar width based on mode or prop
    // This maintains the layout alignment with the sidebar below
    const sidebarWidth = mode === 'expanded' ? 'var(--layout-sidebar-width, 164px)' : 'auto';

    return (
        <div
            className={`plus-topbar ${className}`}
            style={style}
            {...props}
        >
            {/* Left: Sidebar Control */}
            <div
                className="topbar-left-section"
                style={{ width: sidebarWidth }}
            >
                <Button
                    className="topbar-toggle-btn"
                    style="primary" // Logic handled by class override, but keeping semantically primary
                    fill="tonal"    // Logic handled by class override
                    leadingVisual={<i className={`fas fa-${mode === 'expanded' ? 'angles-left' : 'bars'}`} />}
                    onClick={handleToggle}
                    aria-label={mode === 'expanded' ? "Collapse sidebar" : "Expand sidebar"}
                />
            </div>

            {/* Center: Breadcrumbs */}
            <div className="topbar-center-section">
                <Breadcrumb items={breadcrumbs} />
            </div>

            {/* Right: User Avatar & Notification */}
            <div className="topbar-right-section">
                {user && (
                    <UserAvatar
                        firstChar={user.name?.charAt(0) || 'U'}
                        name={user.name || 'User'}
                        counter={user.counter}
                        counterValue={user.counterValue}
                    />
                )}
            </div>
        </div>
    );
};

TopBar.propTypes = {
    /** Current sidebar mode */
    mode: PropTypes.oneOf(['expanded', 'collapsed']),
    /** Callback when toggle button is clicked, receives new mode */
    onToggle: PropTypes.func,
    /** Breadcrumb items array */
    breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string
    })),
    /** User object for avatar */
    user: PropTypes.shape({
        name: PropTypes.string,
        counter: PropTypes.bool,
        counterValue: PropTypes.number
    }),
    className: PropTypes.string,
    style: PropTypes.object
};

export default TopBar;
