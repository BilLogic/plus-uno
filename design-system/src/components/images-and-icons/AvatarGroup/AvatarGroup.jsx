import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AVATAR_SIZES, AVATAR_SHAPES } from '../Avatar';
import DropdownMenu from '../../forms-and-inputs/DropdownMenu';
import { CustomItem } from '@/components/forms-and-inputs/_internal/MenuGroup';
import '../Avatar/Avatar.scss';

/**
 * A row of avatars that overlap, with the rest behind a `+n`.
 *
 * The group owns what one avatar cannot: the overlap, the ring that separates
 * neighbors, and how many fit. Past `max`, the remaining people go into a menu
 * under `+n`, the same overflow the tag group uses, so every person stays
 * reachable by name.
 */
export const AvatarGroup = ({
    children,
    max = 5,
    size = 32,
    shape = 'circle',
    label,
    overflowLabel,
    className = '',
    ...rest
}) => {
    const [open, setOpen] = useState(false);
    const members = React.Children.toArray(children).filter(Boolean);
    const cap = Math.max(1, max);
    // One slot goes to `+n`, so `max` is the most avatars on the row in all.
    const overflows = members.length > cap;
    const shown = overflows ? members.slice(0, cap - 1) : members;
    const hidden = overflows ? members.slice(cap - 1) : [];

    const rows = useMemo(
        () => hidden.map((child) => (
            <CustomItem key={child.key}>{child.props.name || child.props.label || ''}</CustomItem>
        )),
        // `hidden` is rebuilt each render; its names are what matter.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [hidden.map((child) => child.props.name || child.props.label || '').join('\n')],
    );

    const count = hidden.length;
    const text = overflowLabel ? overflowLabel(count) : `+${count}`;

    const toggle = (
        <button
            type="button"
            className={`plus-avatar plus-avatar--${size} plus-avatar--${shape} plus-avatar--gray plus-avatar--overflow`}
            aria-label={`${text}, ${count} more ${count === 1 ? 'person' : 'people'}`}
        >
            <span className="plus-avatar__initials">{text}</span>
        </button>
    );

    return (
        <div
            role="group"
            aria-label={label}
            className={['plus-avatar-group', `plus-avatar-group--${size}`, className].filter(Boolean).join(' ')}
            {...rest}
        >
            {shown.map((child) => (
                <span className="plus-avatar-group__item" key={child.key}>
                    {React.cloneElement(child, { size, shape })}
                </span>
            ))}
            {overflows && (
                <span className="plus-avatar-group__item">
                    <DropdownMenu
                        trigger={toggle}
                        isOpen={open}
                        onOpenChange={setOpen}
                    >
                        {rows}
                    </DropdownMenu>
                </span>
            )}
        </div>
    );
};

AvatarGroup.propTypes = {
    /** `Avatar` elements. */
    children: PropTypes.node,
    /** The most avatars on the row, counting the `+n`. Default 5. */
    max: PropTypes.number,
    /** One size for the whole row; it overrides each avatar's own. */
    size: PropTypes.oneOf(AVATAR_SIZES),
    /** One shape for the whole row. */
    shape: PropTypes.oneOf(AVATAR_SHAPES),
    /** Names the group for assistive technology: "Session attendees". */
    label: PropTypes.string,
    /** Formats the overflow's visible text. Defaults to `+n`. */
    overflowLabel: PropTypes.func,
    /** Extra class names added to the group element beside the component's own. */
    className: PropTypes.string,
};

export default AvatarGroup;
