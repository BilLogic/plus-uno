import React from 'react';
import PropTypes from 'prop-types';
import { Spinner as BootstrapSpinner } from 'react-bootstrap';
import './Spinner.scss';

const Spinner = ({
    variant = 'border', // 'border', 'grow', 'growing', 'rotating', 'stacking'
    size, // 'sm' or null
    className = '',
    role = 'status',
    ...props
}) => {
    const { color: _legacyColor, ...restProps } = props;

    // Custom Variants handled via CSS/Divs
    if (['growing', 'rotating', 'stacking'].includes(variant)) {
        const blocks = {
            'growing': 9,
            'rotating': 4,
            'stacking': 4
        }[variant];

        return (
            <div
                className={`plus-spinner-custom plus-spinner-${variant} ${size ? `plus-spinner-${size}` : ''} ${className}`}
                role={role}
                aria-label="Loading"
                {...restProps}
            >
                {Array.from({ length: blocks }).map((_, i) => (
                    <div key={i} className="spinner-block"></div>
                ))}
            </div>
        );
    }

    // Simple Bootstrap Mappings ('border', 'grow') — color is always neutral (see Spinner.scss).
    return (
        <BootstrapSpinner
            animation={variant === 'default' ? 'border' : variant}
            size={size}
            className={`plus-spinner ${className}`}
            role={role}
            {...restProps}
        >
            <span className="visually-hidden">Loading...</span>
        </BootstrapSpinner>
    );
};

Spinner.propTypes = {
    variant: PropTypes.oneOf(['border', 'grow', 'growing', 'rotating', 'stacking', 'default']),
    size: PropTypes.string,
    className: PropTypes.string,
    role: PropTypes.string
};

export default Spinner;
