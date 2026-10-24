/**
 * TopBar Component
 *
 * The Specs Top Bar on the foundation Topbar pattern (`@/patterns`): the
 * sidebar toggle, the breadcrumb, Help Center and the user avatar, 32 high.
 * This keeps the Specs prop names (`mode`, `onToggle`) and maps them onto the
 * pattern. Inside PageLayout the SurfaceContainer owns the sidebar state and
 * the toggle follows it; standalone, pass `onToggle` to draw the toggle.
 * Figma Spec: node-id=111-227860, 111-227866
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Topbar } from '@/patterns';

const TopBar = ({
    mode = 'expanded',
    onToggle,
    breadcrumbs = [{ text: 'Home', href: '#' }, { text: 'Page' }],
    user = null,
    onHelpClick,
    helpHref,
    loading = false,
    className = '',
    style,
    id,
}) => (
    <Topbar
        id={id}
        className={className}
        style={style}
        sidebar={mode === 'expanded' ? 'open' : 'closed'}
        onToggle={onToggle ? () => onToggle(mode === 'expanded' ? 'collapsed' : 'expanded') : undefined}
        breadcrumbs={breadcrumbs}
        user={user}
        onHelpClick={onHelpClick}
        helpHref={helpHref}
        loading={loading}
    />
);

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
    /** Called when Help Center is pressed */
    onHelpClick: PropTypes.func,
    /** Help Center link; opens in a new tab */
    helpHref: PropTypes.string,
    /** Skeletons in place of the breadcrumb and the account; the toggle stays */
    loading: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    id: PropTypes.string,
};

export default TopBar;
