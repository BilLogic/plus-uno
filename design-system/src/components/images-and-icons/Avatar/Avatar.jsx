import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import './Avatar.scss';

/**
 * A person or an agent, as a picture, their initials or an icon.
 *
 * One frame for every kind of face, so a list of people lines up whether or not
 * each has a photo. The picture wins when it loads; when it is missing or
 * fails, the initials stand in, then the icon, then a plain person glyph.
 * Circles are people; squares are teams and agents.
 */

/** 16 to 40 are the Media sizes; 96 and 128 are the profile sizes, set in `Avatar.scss`. */
export const AVATAR_SIZES = [16, 24, 32, 40, 96, 128];

export const AVATAR_SHAPES = ['circle', 'square'];

export const AVATAR_STATUSES = ['online', 'away', 'busy', 'offline'];

/** A category color from the Tag set; never a status. */
export const AVATAR_COLORS = ['blue', 'gray', 'green', 'purple', 'magenta', 'yellow', 'teal'];

/** The first letters of the first and last words of a name: "Jane Park" is "JP". */
export const initialsOf = (name = '', max = 2) => {
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const firsts = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
    return firsts
        .map((w) => Array.from(w)[0])
        .join('')
        .slice(0, max)
        .toUpperCase();
};

const renderIcon = (icon) => {
    if (typeof icon !== 'string') return icon;
    return <Icon name={icon} />;
};

/** A person or an agent shown as a picture, initials or an icon. The picture wins when it loads, then the initials, then the icon, then a plain person glyph. */
export const Avatar = ({
    src,
    name,
    initials,
    icon,
    size = 32,
    shape = 'circle',
    color = 'blue',
    status,
    label,
    className = '',
    ...rest
}) => {
    const [failed, setFailed] = useState(false);
    // A new picture gets a new chance.
    useEffect(() => setFailed(false), [src]);

    // Too small to read two letters: the 16 and 20 avatars keep one.
    const letters = initials ?? initialsOf(name, size <= 20 ? 1 : 2);
    const showImage = Boolean(src) && !failed;

    let face;
    if (showImage) {
        face = <img className="plus-avatar__image" src={src} alt="" onError={() => setFailed(true)} />;
    } else if (letters) {
        face = <span className="plus-avatar__initials">{letters}</span>;
    } else {
        face = <span className="plus-avatar__icon">{renderIcon(icon ?? 'user')}</span>;
    }

    // Decorative beside a name; one image with a name when it stands alone. The
    // status is said in the name too, since a dot's color says nothing to a
    // screen reader.
    const accessibleName = label ?? name;
    const named = accessibleName ? (status ? `${accessibleName}, ${status}` : accessibleName) : null;
    const a11y = named
        ? { role: 'img', 'aria-label': named }
        : { 'aria-hidden': 'true' };

    const classes = [
        'plus-avatar',
        `plus-avatar--${size}`,
        `plus-avatar--${shape}`,
        showImage ? 'plus-avatar--photo' : `plus-avatar--${color}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...a11y} {...rest}>
            {face}
            {status && <span className={`plus-avatar__status plus-avatar__status--${status}`} data-status={status} />}
        </span>
    );
};

Avatar.propTypes = {
    /** The picture's URL. If it is missing or fails to load, the initials show. */
    src: PropTypes.string,
    /** The person's or agent's name. Gives the initials and, unless `label` is set, the accessible name. */
    name: PropTypes.string,
    /** Overrides the initials taken from `name`. */
    initials: PropTypes.string,
    /** The fallback when there is no picture and no initials: a Font Awesome Free name (`robot`), a class list, or a node. Defaults to `user`. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** 16 to 40 follow the Media sizes; 96 and 128 are for profiles. */
    size: PropTypes.oneOf(AVATAR_SIZES),
    /** `circle` for a person, `square` for a team or an agent. */
    shape: PropTypes.oneOf(AVATAR_SHAPES),
    /** The ground of the initials and icon, from the Tag color set. A picture covers it. */
    color: PropTypes.oneOf(AVATAR_COLORS),
    /** A presence dot at the bottom right. It is said in the accessible name. */
    status: PropTypes.oneOf(AVATAR_STATUSES),
    /** The accessible name when it should differ from `name`. Without a name or a label the avatar is decorative and hidden. */
    label: PropTypes.string,
    /** Extra class names added to the avatar element beside the component's own. */
    className: PropTypes.string,
};

export default Avatar;
