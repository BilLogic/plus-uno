import React from 'react';
import PropTypes from 'prop-types';
import { Breadcrumb, Button, Skeleton, UserAvatar } from '@/components';
import { useSidebarControl } from '../Frame/SidebarControl';
import './Topbar.scss';

/**
 * Topbar pattern: the app frame's top row, 32 high (`--layout-height-topbar`).
 * Mirrors the Figma `_Topbar` and the Specs Top Bar (111-227859).
 *
 * - **Start:** the sidebar toggle, a primary tonal 32 icon button. It shows
 *   `angles-left` while the sidebar is open (docked or floating) and `bars`
 *   while it is closed. Docked, the start area is `--layout-width-sidebar`
 *   wide, so the breadcrumb lines up with the surface; otherwise the breadcrumb
 *   follows the toggle.
 * - **Middle:** a Breadcrumb that stays on one line and truncates.
 * - **End**, 12 apart: Help Center, a secondary text button with
 *   `circle-question`, then the 32 UserAvatar.
 *
 * Inside a Frame the frame owns the sidebar state and hands it over
 * through context, so there is one toggle. Standalone, pass `sidebar`,
 * `docked` and `onToggle`; without `onToggle` there is no toggle.
 */
const Topbar = ({
    sidebar = 'open',
    docked,
    onToggle,
    toggleProps,
    breadcrumbs = [],
    user = null,
    onHelpClick,
    helpHref,
    loading = false,
    id,
    className = '',
    style,
}) => {
    const control = useSidebarControl();
    const state = control?.sidebar ?? sidebar;
    const open = state === 'open';
    const isDocked = control ? control.docked : (docked ?? open);
    const hasToggle = Boolean(control || onToggle);

    const classes = [
        'plus-topbar',
        isDocked && hasToggle ? 'plus-topbar--docked' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div id={id} className={classes} style={style}>
            <div className="plus-topbar__start">
                {hasToggle ? (
                    <Button
                        className="plus-topbar__toggle"
                        style="primary"
                        fill="tonal"
                        size="medium"
                        leadingVisual={open ? 'angles-left' : 'bars'}
                        aria-label={open && isDocked ? 'Close sidebar' : 'Open sidebar'}
                        aria-expanded={open}
                        {...toggleProps}
                        {...control?.toggleProps}
                        onClick={control?.toggleProps?.onClick ?? onToggle}
                    />
                ) : null}
            </div>

            <div className="plus-topbar__middle">
                {loading ? (
                    <Skeleton shape="text" width="var(--label-max-width)" />
                ) : (
                    <Breadcrumb items={breadcrumbs} />
                )}
            </div>

            <div className="plus-topbar__end">
                {loading ? (
                    <Skeleton shape="circle" width="var(--item-height-md)" />
                ) : (
                    <>
                        <Button
                            className="plus-topbar__help"
                            style="secondary"
                            fill="text"
                            size="medium"
                            leadingVisual="circle-question"
                            aria-label="Help Center"
                            title="Help Center"
                            href={helpHref}
                            target={helpHref ? '_blank' : undefined}
                            rel={helpHref ? 'noreferrer' : undefined}
                            onClick={onHelpClick}
                        />
                        {user ? (
                            <UserAvatar
                                size="md"
                                firstChar={user.firstChar || user.name?.charAt(0) || 'U'}
                                name={user.name || 'User'}
                                counter={Boolean(user.counter)}
                                counterValue={user.counterValue}
                                type={user.type}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};

Topbar.propTypes = {
    /** Standalone: whether the sidebar is open (docked or floating). Sets the icon and `aria-expanded`. Inside a Frame the frame decides. */
    sidebar: PropTypes.oneOf(['open', 'closed']),
    /** Standalone: whether an open sidebar is docked. Defaults to `sidebar === 'open'`. Docked, the start area is sidebar-wide. */
    docked: PropTypes.bool,
    /** Standalone: called when the toggle is pressed. Without it, and outside a Frame, there is no toggle. */
    onToggle: PropTypes.func,
    /** Extra props for the toggle button, e.g. `aria-controls` */
    toggleProps: PropTypes.object,
    /** Breadcrumb items; the last is the current page */
    breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
    })),
    /** The signed-in user; `type: 'lead tutor'` shows the "Lead" indicator */
    user: PropTypes.shape({
        name: PropTypes.string,
        firstChar: PropTypes.string,
        counter: PropTypes.bool,
        counterValue: PropTypes.number,
        type: PropTypes.oneOf(['regular tutor', 'lead tutor', 'admin']),
    }),
    /** Called when Help Center is pressed */
    onHelpClick: PropTypes.func,
    /** Help Center link; opens in a new tab */
    helpHref: PropTypes.string,
    /** Skeletons in place of the breadcrumb and the account; the toggle stays */
    loading: PropTypes.bool,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Topbar;
