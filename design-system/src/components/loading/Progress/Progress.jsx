import React from 'react';
import PropTypes from 'prop-types';
import './Progress.scss';

const Progress = ({
    value = 0,
    min = 0,
    max = 100,
    style = 'primary',
    size = 'medium',
    striped = false,
    animated = false,
    label,
    showLabel = false,
    id,
    className = ''
}) => {
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    /*
     * #325. The bar's width was clamped and the announced value was not, so a
     * `value` above `max` drew a full bar while reporting a number greater than
     * its own `aria-valuemax` — a state no assistive technology can make sense
     * of. One clamp, both readings.
     */
    const boundedValue = Math.min(Math.max(value, min), max);

    const containerClasses = [
        'progress',
        'plus-progress',
        `plus-progress-${size}`,
        className
    ].filter(Boolean).join(' ');

    const barClasses = [
        'progress-bar',
        'plus-progress-bar',
        `plus-progress-bar-${style}`,
        striped ? 'progress-bar-striped' : '',
        animated && striped ? 'progress-bar-animated' : ''
    ].filter(Boolean).join(' ');

    return (
        <div id={id} className={containerClasses}>
            <div
                className={barClasses}
                role="progressbar"
                aria-label={label || 'Progress'}
                aria-valuenow={boundedValue}
                aria-valuemin={min}
                aria-valuemax={max}
                style={{ width: `${percentage}%` }}
            >
                {label || (showLabel ? `${Math.round(percentage)}%` : null)}
            </div>
        </div>
    );
};

Progress.propTypes = {
    value: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    style: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    striped: PropTypes.bool,
    animated: PropTypes.bool,
    label: PropTypes.string,
    showLabel: PropTypes.bool,
    id: PropTypes.string,
    className: PropTypes.string
};

export default Progress;
