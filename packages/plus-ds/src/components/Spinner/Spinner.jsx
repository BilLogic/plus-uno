import React from 'react';
import PropTypes from 'prop-types';

const Spinner = ({
    size = 'default',
    label = 'Loading...',
    id,
    className = ''
}) => {
    const classes = [
        'spinner-border',
        'plus-spinner',
        `plus-spinner-${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <div id={id} className={classes} role="status" aria-label={label}>
            <span className="sr-only">{label}</span>
        </div>
    );
};

Spinner.propTypes = {
    size: PropTypes.oneOf(['small', 'default', 'large']),
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string
};

export default Spinner;
