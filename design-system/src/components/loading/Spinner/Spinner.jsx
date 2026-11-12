import React from 'react';
import PropTypes from 'prop-types';
import './Spinner.scss';

export const SPINNER_SIZES = [16, 24, 48];
export const SPINNER_APPEARANCES = ['inherit', 'invert'];

/**
 * `Spinner` — an animated ring that says a wait is in progress, with no
 * duration to report. `size` is a pixel diameter; `appearance="inherit"`
 * takes the surrounding text color, `"invert"` is for a bold or colored
 * background.
 */
const Spinner = ({
    size = 24,
    appearance = 'inherit',
    label = 'Loading',
    className = '',
}) => (
    <span
        className={['plus-spinner', `plus-spinner--${appearance}`, className].filter(Boolean).join(' ')}
        data-size={size}
        role="status"
    >
        <span className="visually-hidden">{label}</span>
    </span>
);

Spinner.propTypes = {
    /** A pixel diameter: 16, 24 or 48. */
    size: PropTypes.oneOf(SPINNER_SIZES),
    /** `inherit` takes the surrounding text color; `invert` is for a bold or colored background. */
    appearance: PropTypes.oneOf(SPINNER_APPEARANCES),
    /** Read by assistive tech; never shown. */
    label: PropTypes.string,
    className: PropTypes.string,
};

export default Spinner;
