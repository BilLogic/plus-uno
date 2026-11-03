import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '../Button/Button';

export const ICON_BUTTON_APPEARANCES = ['default', 'subtle', 'primary', 'discovery'];
export const ICON_BUTTON_SHAPES = ['default', 'circle'];

/**
 * Icon button: a button that is an icon and nothing else. `label` is required
 * because it is the button's accessible name and its tooltip. Props follow
 * Atlassian's Icon button (https://atlassian.design/components/button/icon-button).
 */
export const IconButton = ({
    icon,
    label,
    appearance = 'default',
    spacing = 'default',
    shape = 'default',
    className,
    title,
    ...props
}) => (
    <Button
        iconBefore={icon}
        aria-label={label}
        title={title ?? label}
        appearance={appearance}
        spacing={spacing}
        className={classNames({ 'plus-btn--circle': shape === 'circle' }, className)}
        {...props}
    />
);

IconButton.propTypes = {
    /** A Font Awesome Free glyph name (`trash`) or a node. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    /** The accessible name and tooltip. Sentence case; name the object acted on ("Edit page"). */
    label: PropTypes.string.isRequired,
    appearance: PropTypes.oneOf(ICON_BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Square by default; `circle` is for top navigation. */
    shape: PropTypes.oneOf(ICON_BUTTON_SHAPES),
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    title: PropTypes.string,
};

export default IconButton;
