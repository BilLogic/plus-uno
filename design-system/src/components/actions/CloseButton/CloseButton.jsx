import React from 'react';
import PropTypes from 'prop-types';
import './CloseButton.scss';

/**
 * The one dismiss control for surfaces that close as a whole — Alert, Toast,
 * Modal. A fixed 24×24 hit area holding a 16px xmark: it never scales with the
 * text around it, so placing it on a line of text is the parent's job.
 *
 * `tone="inverse"` is for colored or dark grounds. There is no disabled state
 * (a close control is never disabled) and no color variants (the × is neutral
 * on every intent). Its name is "Close", or "Dismiss {what}" when `what` is
 * passed.
 */
const CloseButton = ({
    tone = 'default',
    what,
    onClick,
    className = '',
    'aria-label': ariaLabel,
    ...props
}) => {
    const name = ariaLabel || (what ? `Dismiss ${what}` : 'Close');
    const classes = [
        'plus-close-btn',
        tone === 'inverse' ? 'plus-close-btn--inverse' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button type="button" className={classes} aria-label={name} onClick={onClick} {...props}>
            <i className="plus-close-btn__icon fa-solid fa-xmark" aria-hidden="true" />
        </button>
    );
};

CloseButton.propTypes = {
    /** `default` for neutral surfaces; `inverse` for colored or dark grounds */
    tone: PropTypes.oneOf(['default', 'inverse']),
    /** What closes, for the accessible name "Dismiss {what}". Without it the name is "Close" */
    what: PropTypes.string,
    /** Called when the button is pressed */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Overrides the accessible name outright, for call sites with an established label */
    'aria-label': PropTypes.string,
};

export default CloseButton;
