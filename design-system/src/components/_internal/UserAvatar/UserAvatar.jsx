import React from 'react';
import PropTypes from 'prop-types';
import Status from '../../status-and-loading/Status';
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
 * - `size="md"` is 32 high (`--item-height-md`), for the 32 topbar. The name
 *   truncates at `--label-max-width`.
 * - `size="lg"` pads `--size-element-pad-y-md` around a 32 pill, for table rows.
 */
const UserAvatar = ({
    firstChar = 'J',
    name = 'John Doe',
    counter = true,
    counterValue = 2,
    state = 'enabled',
    type = 'regular tutor',
    size = 'lg',
    id,
    onClick,
    className = ''
}) => {
    const role = ROLE_LABELS[type];
    const classes = [
        'plus-user-avatar',
        `plus-user-avatar--${size}`,
        `plus-user-avatar--${state}`,
        onClick ? 'plus-user-avatar--clickable' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} id={id}>
            <div className="plus-user-avatar__name-section">
                <div className="plus-user-avatar__initial" aria-hidden="true">
                    <span className="plus-user-avatar__initial-text">{firstChar}</span>
                </div>
                <p className="plus-user-avatar__name" title={name}>{name}</p>
            </div>

            {role ? (
                <Status style="info" className="plus-user-avatar__role">{role}</Status>
            ) : null}

            {counter && (
                <div className="plus-user-avatar__counter">
                    <span className="plus-user-avatar__counter-text">{counterValue}</span>
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
    state: PropTypes.oneOf(['enabled', 'hover']),
    /** `lead tutor` shows the "Lead" role indicator; other types show none. */
    type: PropTypes.oneOf(['regular tutor', 'lead tutor', 'admin']),
    /** `md` 32 high, for the topbar · `lg` the original padded row, for tables */
    size: PropTypes.oneOf(['md', 'lg']),
    id: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string
};

export default UserAvatar;
