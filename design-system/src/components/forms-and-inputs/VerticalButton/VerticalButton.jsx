import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Button } from '../Button/Button';

export const VERTICAL_BUTTON_APPEARANCES = ['default', 'subtle', 'primary'];

/**
 * Vertical button: an icon stacked over a short label, one size (60 by 60).
 * For choosing between a few large options, such as a role.
 */
export const VerticalButton = ({ icon, label, appearance = 'default', className, ...props }) => (
    <Button
        iconBefore={icon}
        text={label}
        appearance={appearance}
        className={clsx('plus-btn--vertical', className)}
        {...props}
    />
);

VerticalButton.propTypes = {
    /** A Font Awesome Free glyph name (`user-gear`) or a node. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    /** One or two words, sentence case. */
    label: PropTypes.string.isRequired,
    appearance: PropTypes.oneOf(VERTICAL_BUTTON_APPEARANCES),
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
};

export default VerticalButton;
