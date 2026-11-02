import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './AgentAvatar.scss';

/** The Media sizes an agent avatar takes, the same names Avatar uses at 16 to 48 (there is no 20). */
export const AGENT_AVATAR_SIZES = [16, 24, 32, 40, 48];

/**
 * An agent as a hexagon: the AI bold ground with a sparkles glyph, or a
 * picture clipped to the hexagon. Circles are people and the hexagon is for
 * agents, so a person and an agent are told apart by shape before anyone reads
 * a name.
 *
 * - **label** is the accessible name, such as "PLUS AI". It is required: an
 *   agent avatar always stands for something a person should be told about.
 * - **size** is 16, 24, 32, 40 or 48, as on Avatar.
 * - **src** is an optional picture. If it is missing or fails to load, the
 *   glyph shows.
 *
 * Beside a person, lead with the agent: the agent at 32 and the person at 16.
 */
const AgentAvatar = ({
    label,
    src,
    size = 32,
    className = '',
    ...rest
}) => {
    const [failed, setFailed] = useState(false);
    // A new picture gets a new chance.
    useEffect(() => setFailed(false), [src]);

    const resolvedSize = AGENT_AVATAR_SIZES.includes(size) ? size : 32;
    const showImage = Boolean(src) && !failed;
    const classes = ['plus-agent-avatar', `plus-agent-avatar--${resolvedSize}`, className].filter(Boolean).join(' ');

    return (
        <span
            {...rest}
            className={classes}
            // After the spread, so a caller cannot rename the avatar or hide it.
            role="img"
            aria-label={label}
        >
            {showImage ? (
                <img className="plus-agent-avatar__image" src={src} alt="" onError={() => setFailed(true)} />
            ) : (
                <i className="fa-solid fa-wand-magic-sparkles plus-agent-avatar__glyph" aria-hidden="true" />
            )}
        </span>
    );
};

AgentAvatar.propTypes = {
    /** The accessible name, such as "PLUS AI". */
    label: PropTypes.string.isRequired,
    /** An optional picture, clipped to the hexagon. If it fails to load, the glyph shows. */
    src: PropTypes.string,
    /** 16, 24, 32, 40 or 48, the Media sizes Avatar uses. */
    size: PropTypes.oneOf(AGENT_AVATAR_SIZES),
    className: PropTypes.string,
};

export default AgentAvatar;
