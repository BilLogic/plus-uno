import React from 'react';
import PropTypes from 'prop-types';
import StatusTag from '../../labels/StatusTag';
import './UserAvatar.scss';

/** The role a user type shows beside the name. Types not listed show none. */
const ROLE_LABELS = {
    'lead tutor': 'Lead',
};

/**
 * UserAvatar Component
 *
 * The signed-in user: an initial pill, the name, the role indicator ("Lead")
 * and an optional notification counter. Per the Specs User Avatar (111-227876).
 *
 * - `spacing="compact"` is 32 high (`--item-height-md`), for the 32 topbar. The name
 *   truncates at `--label-max-width`.
 * - `spacing="default"` pads `--pad-y-md` around a 32 pill, for table rows.
 */
const UserAvatar = ({
    firstChar = 'J',
    name = 'John Doe',
    counter = true,
    counterValue = 2,
    state = 'enabled',
    type = 'regular tutor',
    spacing = 'default',
    id,
    onClick,
    className = ''
}) => {
    const role = ROLE_LABELS[type];
    // A clickable user is a button to the keyboard: focusable, Enter presses it
    // on keydown and Space on keyup, as a native button does. A disabled one
    // keeps the role and says so, but leaves the tab order and ignores presses.
    const disabled = state === 'disabled';
    const interactive = onClick
        ? {
            role: 'button',
            ...(disabled
                ? { 'aria-disabled': true }
                : {
                    tabIndex: 0,
                    onClick,
                    onKeyDown: (event) => {
                        if (event.key === 'Enter' && !event.repeat) {
                            event.preventDefault();
                            onClick(event);
                        } else if (event.key === ' ') {
                            event.preventDefault();
                        }
                    },
                    onKeyUp: (event) => {
                        if (event.key === ' ') {
                            event.preventDefault();
                            onClick(event);
                        }
                    },
                }),
        }
        : {};
    const classes = [
        'plus-user-avatar',
        `plus-user-avatar--${spacing}`,
        `plus-user-avatar--${state}`,
        onClick ? 'plus-user-avatar--clickable' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} id={id} aria-disabled={disabled && !onClick ? true : undefined} {...interactive}>
            <div className="plus-user-avatar__name-section">
                <div className="plus-user-avatar__initial" aria-hidden="true">
                    <span className="plus-user-avatar__initial-text">{firstChar}</span>
                </div>
                <p className="plus-user-avatar__name" title={name}>{name}</p>
            </div>

            {role ? (
                <StatusTag appearance="info" className="plus-user-avatar__role">{role}</StatusTag>
            ) : null}

            {counter && (
                <div className="plus-user-avatar__counter">
                    <span className="plus-user-avatar__counter-text">{counterValue}</span>
                    <span className="visually-hidden">{counterValue === 1 ? 'notification' : 'notifications'}</span>
                </div>
            )}
        </div>
    );
};

UserAvatar.propTypes = {
    firstChar: PropTypes.string,
    name: PropTypes.string,
    counter: PropTypes.bool,
    counterValue: PropTypes.number,
    state: PropTypes.oneOf(['enabled', 'hover', 'disabled']),
    /** `lead tutor` shows the "Lead" role indicator; other types show none. */
    type: PropTypes.oneOf(['regular tutor', 'lead tutor', 'admin']),
    /** `compact` 32 high, for the topbar · `default` the padded row, for tables */
    spacing: PropTypes.oneOf(['default', 'compact']),
    id: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string
};

export default UserAvatar;
