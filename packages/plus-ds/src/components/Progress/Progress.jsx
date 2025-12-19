import React from 'react';
import PropTypes from 'prop-types';

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
                aria-valuenow={value}
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
