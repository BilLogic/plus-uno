/**
 * TopBar Component
 * 
 * Top navigation bar with sidebar control, breadcrumbs, and user avatar.
 * Figma Spec: node-id=111-227860, 111-227866
 */

import React from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '../../../../components/Breadcrumb/Breadcrumb';
import { UserAvatar } from '../../Elements';
import Button from '../../../../components/Button/Button';

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

    return (
        <div
            className={`plus-topbar ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                ...style
            }}
            {...props}
        >
            {/* Sidebar Control - 164px width in expanded mode */}
            <div style={{ width: mode === 'expanded' ? 'var(--layout-sidebar-width, 164px)' : 'auto' }}>
                <Button
                    style="ghost"
                    fill="tonal"
                    leadingVisual={<i className={`fas fa-${mode === 'expanded' ? 'angles-left' : 'bars'}`} />}
                    onClick={handleToggle}
                />
            </div>

            {/* Page Control - Breadcrumb */}
            <div style={{ flex: 1 }}>
                <Breadcrumb items={breadcrumbs} />
            </div>

            {/* User Avatar */}
            {user && (
                <UserAvatar
                    firstChar={user.name?.charAt(0) || 'U'}
                    name={user.name || 'User'}
                    counter={user.counter}
                    counterValue={user.counterValue}
                />
            )}
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
