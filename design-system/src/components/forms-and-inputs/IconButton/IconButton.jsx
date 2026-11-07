import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '../Button/Button';
import Tooltip from '../../overlays-and-layering/Tooltip/Tooltip';

export const ICON_BUTTON_APPEARANCES = ['default', 'subtle', 'primary', 'discovery'];
export const ICON_BUTTON_SHAPES = ['default', 'circle'];

/**
 * Icon button: a button that is an icon and nothing else. `label` is required
 * because it is the button's accessible name and its tooltip..
 */
export const IconButton = ({
    icon,
    label,
    appearance = 'default',
    spacing = 'default',
    shape = 'default',
    className,
    title,
    tooltip,
    isTooltipDisabled = false,
    ...props
}) => {
    const button = (
        <Button
            iconBefore={icon}
            aria-label={label}
            title={isTooltipDisabled ? undefined : (title ?? (tooltip ? undefined : label))}
            appearance={appearance}
            spacing={spacing}
            className={classNames({ 'plus-btn--circle': shape === 'circle' }, className)}
            {...props}
        />
    );
    if (isTooltipDisabled || !tooltip) return button;
    return <Tooltip text={tooltip}>{button}</Tooltip>;
};

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
    /** Called with the click event when the button is activated. It does not fire while `isDisabled` or `isLoading` is set. */
    onClick: PropTypes.func,
    /** Extra class names added to the button element beside the component's own. */
    className: PropTypes.string,
    /** Sets the native `title` tooltip. Defaults to `label`; `tooltip` or `isTooltipDisabled` suppresses that default. */
    title: PropTypes.string,
    /** Overrides the tooltip content shown on hover/focus; defaults to `label` when set. */
    tooltip: PropTypes.node,
    /** Suppresses the tooltip and native title entirely. */
    isTooltipDisabled: PropTypes.bool,
};

export default IconButton;
