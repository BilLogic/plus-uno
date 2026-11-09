import React from 'react';
import PropTypes from 'prop-types';
import { messageIcon } from '../messageAppearance';
import Icon from '../../images-and-icons/Icon';
import './Banner.scss';

/** The three appearances. Announcement carries no icon. */
export const BANNER_APPEARANCES = ['warning', 'danger', 'announcement'];

/** Each appearance's default leading icon (Font Awesome solid names). Announcement has none. */
export const BANNER_ICONS = {
    warning: messageIcon('warning'),
    danger: messageIcon('danger'),
};

/**
 * Banner: a prominent message at the top of a page. No dismiss and no side
 * stripe — the caller mounts and unmounts it, and meaning comes from the fill
 * and the icon alone.
 */
const Banner = ({
    appearance = 'warning',
    icon,
    children,
    className = '',
    id,
    ...props
}) => {
    const resolvedIcon = icon === false ? null : icon ?? BANNER_ICONS[appearance] ?? null;

    return (
        <div
            id={id}
            role="status"
            className={`plus-banner plus-banner--${appearance} ${className}`}
            {...props}
        >
            {resolvedIcon && (
                typeof resolvedIcon === 'string'
                    ? <Icon name={resolvedIcon} className="plus-banner-icon" />
                    : <span className="plus-banner-icon" aria-hidden="true">{resolvedIcon}</span>
            )}
            <div className="plus-banner-content">{children}</div>
        </div>
    );
};

Banner.propTypes = {
    /** `warning` (default form), `danger` (critical, needs immediate attention) or `announcement` (general, no icon). */
    appearance: PropTypes.oneOf(BANNER_APPEARANCES),
    /** A Font Awesome Free solid glyph name or a node. `false` removes the appearance's default icon. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.oneOf([false])]),
    /** Message content. Typically text, optionally with a link. */
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Banner;
