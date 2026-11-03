import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, ICON_BUTTON_APPEARANCES, ICON_BUTTON_SHAPES } from '../IconButton/IconButton';

/**
 * Link icon button: an icon that navigates. It renders an anchor with an
 * accessible `label`, and has no disabled or loading state. Props follow
 * Atlassian's Link icon button
 * (https://atlassian.design/components/button/link-icon-button).
 */
export const LinkIconButton = ({ href, target, rel, ...props }) => (
    <IconButton
        href={href}
        target={target}
        rel={target === '_blank' ? rel ?? 'noopener noreferrer' : rel}
        {...props}
    />
);

LinkIconButton.propTypes = {
    href: PropTypes.string.isRequired,
    target: PropTypes.string,
    rel: PropTypes.string,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    /** The accessible name and tooltip. Say where the link goes ("Open Help Center"). */
    label: PropTypes.string.isRequired,
    appearance: PropTypes.oneOf(ICON_BUTTON_APPEARANCES),
    spacing: PropTypes.oneOf(['default', 'compact']),
    shape: PropTypes.oneOf(ICON_BUTTON_SHAPES),
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
};

export default LinkIconButton;
