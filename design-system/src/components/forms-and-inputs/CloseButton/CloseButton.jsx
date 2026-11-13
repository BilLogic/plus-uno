import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import IconButton from '@/components/forms-and-inputs/IconButton/IconButton';
import './CloseButton.scss';

/**
 * The one dismiss control for a surface that closes as a whole — Modal,
 * Section message, Flag. An Icon button, subtle, fixed to the ×
 * glyph. `label` is required: "Close" for a surface that blocks (Modal),
 * "Dismiss {what}" for a message. `tone="inverse"` is for colored or
 * dark grounds, where the subtle appearance's own hover and pressed read as
 * nearly invisible. There is no disabled state: a close control is always
 * available.
 */
const CloseButton = ({
    label = 'Close',
    tone = 'default',
    spacing = 'default',
    className,
    onClick,
    ...props
}) => (
    <IconButton
        {...props}
        icon="xmark"
        label={label}
        appearance="subtle"
        spacing={spacing}
        onClick={onClick}
        type="button"
        className={clsx('plus-close-btn', { 'plus-close-btn--inverse': tone === 'inverse' }, className)}
    />
);

CloseButton.propTypes = {
    /** The accessible name and hover title. "Close" for a surface that blocks; "Dismiss {what}" for a message. */
    label: PropTypes.string,
    /** `default` for neutral surfaces; `inverse` for colored or dark grounds */
    tone: PropTypes.oneOf(['default', 'inverse']),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Called with the click event. The surface that owns the close button closes itself here. */
    onClick: PropTypes.func,
    /** Extra class names added to the button beside the component's own. */
    className: PropTypes.string,
};

export default CloseButton;
