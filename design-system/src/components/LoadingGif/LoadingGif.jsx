import React from 'react';
import PropTypes from 'prop-types';
import './LoadingGif.scss';

const LoadingGif = ({
    type = 'growing',
    size = 'default',
    label = 'Loading...',
    id,
    className = ''
}) => {
    const classes = [
        'plus-loading-gif',
        `plus-loading-gif-${type}`,
        `plus-loading-gif-${size}`,
        className
    ].filter(Boolean).join(' ');

    const renderSquares = () => {
        let count = 0;
        if (type === 'growing') count = 9;
        else if (type === 'rotating') count = 3;
        else if (type === 'stacking') count = 4;

        return Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className={`plus-loading-gif-square plus-loading-gif-square-${i + 1}`}
            />
        ));
    };

    return (
        <div id={id} className={classes} role="status" aria-label={label}>
            <div className="plus-loading-gif-grid">
                {renderSquares()}
            </div>
            <span className="sr-only">{label}</span>
        </div>
    );
};

LoadingGif.propTypes = {
    type: PropTypes.oneOf(['growing', 'rotating', 'stacking']),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string
};

export default LoadingGif;
