import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Button } from '../Button/Button';
import Tooltip from '../../overlays-and-layering/Tooltip/Tooltip';
import './IconButton.scss';

export const ICON_BUTTON_APPEARANCES = ['default', 'subtle', 'primary', 'discovery'];
export const ICON_BUTTON_SHAPES = ['default', 'circle'];

/**
 * Icon button: a button that is an icon and nothing else. `label` is required
 * because it is the button's accessible name and its tooltip. A filter trigger
 * can add `trailingMetric`, the count of filters applied, drawn after the icon.
 */
export const IconButton = ({
    icon,
    label,
    trailingMetric,
    appearance = 'default',
    spacing = 'default',
    shape = 'default',
    className,
    title,
    tooltip,
    isTooltipDisabled = false,
    ...props
}) => {
    const hasMetric = trailingMetric !== undefined && trailingMetric !== null;
    const button = (
        <Button
            iconBefore={icon}
            aria-label={hasMetric ? `${label}, ${trailingMetric} applied` : label}
            title={isTooltipDisabled ? undefined : (title ?? (tooltip ? undefined : label))}
            appearance={appearance}
            spacing={spacing}
            className={clsx({ 'plus-btn--circle': shape === 'circle', 'plus-icon-btn--metric': hasMetric }, className)}
            {...props}
        >
            {hasMetric && (
                // The accessible name already carries the count, so the drawn digits are hidden.
                <span className="plus-icon-btn__metric" aria-hidden="true">
                    {/* Keyed on the value, so each new count fades in rather than ticking. */}
                    <span key={trailingMetric} className="plus-icon-btn__metric-value">{trailingMetric}</span>
                </span>
            )}
        </Button>
    );
    if (isTooltipDisabled || !tooltip) return button;
    return <Tooltip text={tooltip}>{button}</Tooltip>;
};

IconButton.propTypes = {
    /** A Font Awesome Free glyph name (`trash`) or a node. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    /** The accessible name and tooltip. Sentence case; name the object acted on ("Edit page"). */
    label: PropTypes.string.isRequired,
    /** The count of filters applied, drawn after the icon; the accessible name becomes "Filters, 2 applied". `0` shows; leave it out to hide it. */
    trailingMetric: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The visual style. `default` suits most actions, `subtle` low-emphasis toolbar actions, `primary` the main action and `discovery` something new. */
    appearance: PropTypes.oneOf(ICON_BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Square by default; `circle` is for top navigation. */
    shape: PropTypes.oneOf(ICON_BUTTON_SHAPES),
    /** Marks the button selected and sets `aria-pressed`. Use it for a toggle such as a list or grid view switch. */
    isSelected: PropTypes.bool,
    /** Prevents interaction. Avoid it where you can; say why the action is unavailable instead. */
    isDisabled: PropTypes.bool,
    /** Shows a spinner in place of the icon and blocks interaction. */
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
