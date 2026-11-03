import React from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.scss';

export const PROGRESS_BAR_APPEARANCES = ['default', 'success', 'inverse'];

/**
 * `ProgressBar` — a determinate (or indeterminate) bar for a task whose
 * proportion done is known. `value` is a percent (0 to 100); the drawn width
 * and the announced `aria-valuenow` clamp together, so an out-of-range value
 * never draws a full bar while reporting a number past its own
 * `aria-valuemax` (#325) — a state no assistive technology can make sense of.
 */
const ProgressBar = ({
    value = 0,
    appearance = 'default',
    isIndeterminate = false,
    ariaLabel = 'Progress',
    className = '',
    id,
}) => {
    const percentage = Math.min(Math.max(value, 0), 100);

    const containerClasses = [
        'plus-progressbar',
        `plus-progressbar--${appearance}`,
        isIndeterminate ? 'plus-progressbar--indeterminate' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div id={id} className={containerClasses}>
            <div
                className="plus-progressbar-fill"
                role="progressbar"
                aria-label={ariaLabel}
                aria-valuenow={isIndeterminate ? undefined : percentage}
                aria-valuemin={isIndeterminate ? undefined : 0}
                aria-valuemax={isIndeterminate ? undefined : 100}
                style={isIndeterminate ? undefined : { width: `${percentage}%` }}
            />
        </div>
    );
};

ProgressBar.propTypes = {
    /** A percent, 0 to 100. The drawn width and the announced value clamp together. Ignored when `isIndeterminate`. */
    value: PropTypes.number,
    /** `success` marks completion; `inverse` reads on a bold or colored background. */
    appearance: PropTypes.oneOf(PROGRESS_BAR_APPEARANCES),
    /** The duration is unknown: an animated segment moves along the track instead of a fixed width. */
    isIndeterminate: PropTypes.bool,
    /** Names what the bar measures. "Progress" says nothing when a page has two bars. */
    ariaLabel: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default ProgressBar;
