import React from 'react';
import PropTypes from 'prop-types';
import './Avatar.css';

/**
 * Avatar: a person's initials on an accent circle, for students and lead
 * tutors who have no photo. Decorative by default (the name is beside it);
 * pass `label` when it stands alone.
 *
 * `AvatarGroup` overlaps a few of them, named as one image.
 */
const Avatar = ({ initials, tone = 'teal', size = 'md', label, className = '' }) => (
    <span
        className={['tr-avatar', `tr-avatar--${size}`, `tr-avatar--${tone}`, className].filter(Boolean).join(' ')}
        {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
        {initials}
    </span>
);

Avatar.propTypes = {
    initials: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['teal', 'blue', 'purple', 'yellow', 'green', 'orange']),
    /** `sm` 24 · `md` 32 */
    size: PropTypes.oneOf(['sm', 'md']),
    /** Accessible name when the avatar stands alone */
    label: PropTypes.string,
    className: PropTypes.string,
};

export const AvatarGroup = ({ people, label, size = 'sm' }) => (
    <span className="tr-avatar-group" role="img" aria-label={label}>
        {people.map((p) => <Avatar key={p.initials} initials={p.initials} tone={p.tone} size={size} />)}
    </span>
);

AvatarGroup.propTypes = {
    people: PropTypes.arrayOf(PropTypes.shape({ initials: PropTypes.string.isRequired, tone: PropTypes.string })).isRequired,
    /** Names everyone: "Your students: Arlene, Morgan, Taylor, Casey" */
    label: PropTypes.string.isRequired,
    size: PropTypes.oneOf(['sm', 'md']),
};

export default Avatar;
