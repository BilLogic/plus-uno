/**
 * TopBar Component
 *
 * The topbar's content: breadcrumbs at the start, the user avatar at the end.
 * Inside PageLayout it fills the 32 `--layout-height-topbar` row of the
 * SurfaceContainer frame, which owns the sidebar toggle. Standalone, pass
 * `onToggle` to draw its own toggle before the breadcrumbs.
 * Figma Spec: node-id=111-227860, 111-227866
 */

import React from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import { UserAvatar } from '../../Elements';
import Button from '@/components/actions/Button';
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

    return (
        <div
            className={`plus-topbar ${className}`}
            style={style}
            {...props}
        >
            {/* Left: Sidebar Control, only when this bar owns the toggle */}
            {onToggle ? (
            <div className="topbar-left-section">
                <Button
                    className="topbar-toggle-btn"
                    style="primary" // Logic handled by class override, but keeping semantically primary
                    fill="tonal"    // Logic handled by class override
                    leadingVisual={<i className={`fas fa-${mode === 'expanded' ? 'angles-left' : 'bars'}`} />}
                    onClick={handleToggle}
                    aria-label={mode === 'expanded' ? "Collapse sidebar" : "Expand sidebar"}
                />
            </div>
            ) : null}

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
                        type={user.type}
                    />
                )}
            </div>
        </div>
    );
};

TopBar.propTypes = {
    /** Current sidebar mode */
    mode: PropTypes.oneOf(['expanded', 'collapsed']),
    /** Callback when toggle button is clicked, receives new mode. Without it, no toggle is drawn. */
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
        counterValue: PropTypes.number,
        type: PropTypes.oneOf(['regular tutor', 'lead tutor', 'admin'])
    }),
    className: PropTypes.string,
    style: PropTypes.object
};

export default TopBar;
